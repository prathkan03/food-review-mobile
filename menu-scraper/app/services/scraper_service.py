import logging
from dataclasses import dataclass, field
from urllib.parse import urlparse

import httpx
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeout

from app.config import settings

logger = logging.getLogger(__name__)

MENU_LINK_SELECTOR = (
    'a[href*="menu" i], a[href*="/food" i], a[href*="/dining" i], '
    'a[href*="/eat" i], a[href*="/drinks" i], a[href*="/bar" i], '
    'a[href*="/order" i], a[href*="/cuisine" i], a[href*="/lunch" i], '
    'a[href*="/dinner" i], a[href*="/breakfast" i], a[href*="/brunch" i], '
    'a[href*="/specials" i], a[href*="/beverages" i], '
    'a:has-text("Menu"), a:has-text("Our Menu"), a:has-text("Food"), '
    'a:has-text("Dining"), a:has-text("Order")'
)

MENU_PATH_KEYWORDS = [
    "/menu", "/menus", "/food", "/our-menu", "/our-food", "/food-menu",
    "/dining", "/eat", "/drinks", "/beverages", "/bar",
    "/cuisine", "/order", "/drink-menu", "/bar-menu",
    "/lunch", "/dinner", "/breakfast", "/brunch",
    "/specials", "/daily-specials",
]


@dataclass
class PdfItem:
    """A downloaded PDF with its source URL."""
    url: str
    data: bytes


@dataclass
class ScrapeResult:
    """Result from scraping — text, PDFs, or both."""
    text: str | None = None
    pdfs: list[PdfItem] = field(default_factory=list)
    source_url: str | None = None


class ScrapeError(Exception):
    """Custom error with a reason code for diagnostics."""
    def __init__(self, reason: str, detail: str):
        self.reason = reason
        self.detail = detail
        super().__init__(detail)


def _is_same_domain(base_url: str, candidate_url: str) -> bool:
    """Check if candidate URL is on the same domain as the base URL."""
    if candidate_url.startswith("/"):
        return True
    try:
        base_host = urlparse(base_url).netloc.lower().replace("www.", "")
        cand_host = urlparse(candidate_url).netloc.lower().replace("www.", "")
        return base_host == cand_host
    except Exception:
        return False


def _is_pdf_url(url: str) -> bool:
    return url.lower().rstrip("/").endswith(".pdf")


async def _download_pdf(url: str) -> bytes | None:
    """Download a PDF file and return its bytes, or None on failure."""
    logger.info(f"[SCRAPER] Downloading PDF from: {url}")
    try:
        async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            pdf_bytes = resp.content
            logger.info(f"[SCRAPER] Downloaded PDF: {len(pdf_bytes)} bytes from {url}")
            return pdf_bytes
    except Exception as e:
        logger.error(f"[SCRAPER] Failed to download PDF {url}: {e}")
        return None


async def _collect_pdf_links(page, base_url: str) -> list[str]:
    """Find all PDF links on the current page."""
    pdf_links = await page.query_selector_all('a[href$=".pdf" i], a[href*=".pdf?" i]')
    urls = []
    seen = set()

    for link in pdf_links:
        href = await link.get_attribute("href")
        if not href:
            continue
        full_url = href if href.startswith("http") else f"{base_url.rstrip('/')}/{href.lstrip('/')}"
        if full_url not in seen:
            seen.add(full_url)
            link_text = (await link.inner_text()).strip()
            logger.info(f"[SCRAPER] Found PDF link: {full_url} (text: '{link_text[:60]}')")
            urls.append(full_url)

    return urls


async def _find_best_menu_link(page, website_url: str) -> tuple[list[str], str | None]:
    """Find menu links, separating PDF links from HTML links.

    Returns (pdf_urls, best_html_url).
    """
    all_links = await page.query_selector_all(MENU_LINK_SELECTOR)

    if not all_links:
        logger.warning(f"[SCRAPER] No menu links found on {website_url}")
        return [], None

    internal_html = []
    external_html = []
    pdf_urls = []

    for link in all_links:
        href = await link.get_attribute("href")
        if not href or href.startswith("javascript") or href == "#":
            continue

        full_url = href if href.startswith("http") else f"{website_url.rstrip('/')}/{href.lstrip('/')}"
        is_internal = _is_same_domain(website_url, href)
        link_text = (await link.inner_text()).strip()

        logger.info(f"[SCRAPER] Found menu link: {full_url} ({'internal' if is_internal else 'EXTERNAL'}) "
                     f"{'[PDF]' if _is_pdf_url(full_url) else '[HTML]'} text='{link_text[:60]}'")

        if _is_pdf_url(full_url):
            pdf_urls.append(full_url)
        elif is_internal:
            internal_html.append(full_url)
        else:
            external_html.append(full_url)

    best_html = None
    if internal_html:
        best_html = internal_html[0]
    elif external_html:
        best_html = external_html[0]

    return pdf_urls, best_html


async def scrape_menu_page(website_url: str) -> ScrapeResult:
    """Scrape a restaurant website for menu content.

    Returns a ScrapeResult containing scraped text and/or downloaded PDFs.
    The caller should process all available content to find the dish.
    """
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        try:
            page = await browser.new_page()
            logger.info(f"[SCRAPER] Navigating to: {website_url}")

            url_lower = website_url.lower()
            is_menu_url = any(kw in url_lower for kw in MENU_PATH_KEYWORDS)

            # If the initial URL is a PDF, download it directly
            if _is_pdf_url(website_url):
                logger.info(f"[SCRAPER] URL is a PDF, downloading directly")
                pdf_data = await _download_pdf(website_url)
                if pdf_data:
                    return ScrapeResult(pdfs=[PdfItem(url=website_url, data=pdf_data)], source_url=website_url)
                raise ScrapeError("download_failed", f"Failed to download PDF: {website_url}")

            try:
                response = await page.goto(website_url, wait_until="networkidle",
                                           timeout=settings.scrape_timeout_ms)
            except PlaywrightTimeout:
                raise ScrapeError("timeout", f"Page took too long to load: {website_url}")

            if response and response.status >= 400:
                raise ScrapeError("http_error", f"Got HTTP {response.status} from {website_url}")

            content_type = response.headers.get("content-type", "") if response else ""
            if "application/pdf" in content_type or _is_pdf_url(page.url):
                logger.info(f"[SCRAPER] Page served a PDF, downloading")
                pdf_data = await _download_pdf(page.url)
                if pdf_data:
                    return ScrapeResult(pdfs=[PdfItem(url=page.url, data=pdf_data)], source_url=page.url)
                raise ScrapeError("download_failed", f"Failed to download PDF: {page.url}")

            logger.info(f"[SCRAPER] Landed on: {page.url} (content-type: {content_type})")

            # If not already on a menu page, find and navigate to one
            if not is_menu_url:
                pdf_urls, best_html = await _find_best_menu_link(page, website_url)

                # If there are PDF links on the homepage, collect them
                all_pdfs: list[PdfItem] = []
                for pdf_url in pdf_urls:
                    pdf_data = await _download_pdf(pdf_url)
                    if pdf_data:
                        all_pdfs.append(PdfItem(url=pdf_url, data=pdf_data))

                if all_pdfs:
                    logger.info(f"[SCRAPER] Collected {len(all_pdfs)} PDFs from homepage")
                    return ScrapeResult(pdfs=all_pdfs, source_url=website_url)

                # Otherwise navigate to the best HTML menu link
                if best_html:
                    logger.info(f"[SCRAPER] Navigating to menu page: {best_html}")
                    try:
                        menu_response = await page.goto(best_html, wait_until="networkidle",
                                                        timeout=settings.scrape_timeout_ms)
                    except PlaywrightTimeout:
                        raise ScrapeError("timeout", f"Menu page took too long to load: {best_html}")

                    menu_ct = menu_response.headers.get("content-type", "") if menu_response else ""
                    if "application/pdf" in menu_ct or _is_pdf_url(page.url):
                        pdf_data = await _download_pdf(page.url)
                        if pdf_data:
                            return ScrapeResult(pdfs=[PdfItem(url=page.url, data=pdf_data)], source_url=page.url)

            # Now on the menu page — check for PDF links here too
            page_pdf_urls = await _collect_pdf_links(page, page.url)
            if page_pdf_urls:
                logger.info(f"[SCRAPER] Found {len(page_pdf_urls)} PDF links on menu page")
                all_pdfs: list[PdfItem] = []
                for pdf_url in page_pdf_urls:
                    pdf_data = await _download_pdf(pdf_url)
                    if pdf_data:
                        all_pdfs.append(PdfItem(url=pdf_url, data=pdf_data))

                if all_pdfs:
                    # Also try to get HTML text from the page in case it has useful content
                    await page.wait_for_timeout(2000)
                    text = await _extract_text(page)
                    logger.info(f"[SCRAPER] Collected {len(all_pdfs)} PDFs + {len(text or '')} chars text from menu page")
                    return ScrapeResult(
                        text=text[:15000] if text and len(text) > 50 else None,
                        pdfs=all_pdfs,
                        source_url=page.url,
                    )

            # No PDFs found — scrape HTML text
            await page.wait_for_timeout(3000)
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            await page.wait_for_timeout(1500)

            text = await _extract_text(page)
            scraped_len = len(text or "")
            logger.info(f"[SCRAPER] Scraped {scraped_len} chars from {page.url}")

            if not text or scraped_len < 50:
                raise ScrapeError("empty_page", f"Page had little/no text content ({scraped_len} chars) at {page.url}")

            return ScrapeResult(text=text[:15000], source_url=page.url)
        finally:
            await browser.close()


async def _extract_text(page) -> str | None:
    """Extract visible text content from the current page."""
    return await page.evaluate("""
        () => {
            const sel = document.querySelectorAll(
                'main, [role="main"], .menu, #menu, [class*="menu"], '
                + '[class*="Menu"], article, .content, [class*="product"], '
                + '[class*="dish"], [class*="item"], body'
            );
            const el = sel.length > 0 ? sel[0] : document.body;
            return el.innerText;
        }
    """)

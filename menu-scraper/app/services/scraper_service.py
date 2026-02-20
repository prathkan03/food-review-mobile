import logging
from urllib.parse import urlparse

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


async def _find_best_menu_link(page, website_url: str) -> str | None:
    """Find the best menu link, preferring same-domain links over third-party ones."""
    all_links = await page.query_selector_all(MENU_LINK_SELECTOR)

    if not all_links:
        logger.warning(f"[SCRAPER] No menu links found on {website_url}")
        return None

    internal_links = []
    external_links = []

    for link in all_links:
        href = await link.get_attribute("href")
        if not href or href.startswith("javascript") or href == "#":
            continue

        full_url = href if href.startswith("http") else f"{website_url.rstrip('/')}/{href.lstrip('/')}"
        is_internal = _is_same_domain(website_url, href)

        logger.info(f"[SCRAPER] Found menu link: {full_url} ({'internal' if is_internal else 'EXTERNAL'})")

        if is_internal:
            internal_links.append(full_url)
        else:
            external_links.append(full_url)

    # Always prefer internal links
    if internal_links:
        chosen = internal_links[0]
        logger.info(f"[SCRAPER] Chose internal menu link: {chosen}")
        return chosen

    if external_links:
        chosen = external_links[0]
        logger.warning(f"[SCRAPER] No internal menu links, falling back to external: {chosen}")
        return chosen

    return None


async def scrape_menu_page(website_url: str) -> str | None:
    """Use Playwright to scrape text content from a restaurant's website/menu page."""
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        try:
            page = await browser.new_page()
            logger.info(f"[SCRAPER] Navigating to: {website_url}")

            # First, check if the URL already points to a menu page
            url_lower = website_url.lower()
            is_menu_url = any(kw in url_lower for kw in MENU_PATH_KEYWORDS)

            try:
                response = await page.goto(website_url, wait_until="networkidle",
                                           timeout=settings.scrape_timeout_ms)
            except PlaywrightTimeout:
                raise ScrapeError("timeout", f"Page took too long to load: {website_url}")

            # Check HTTP status
            if response and response.status >= 400:
                raise ScrapeError("http_error", f"Got HTTP {response.status} from {website_url}")

            # Detect PDF menu (can't scrape these with Playwright)
            content_type = response.headers.get("content-type", "") if response else ""
            final_url = page.url.lower()
            if "application/pdf" in content_type or final_url.endswith(".pdf"):
                raise ScrapeError("pdf_menu", f"Menu is a PDF file: {page.url}")

            logger.info(f"[SCRAPER] Landed on: {page.url} (content-type: {content_type})")

            # If not already on a menu page, try to find and click a menu link
            if not is_menu_url:
                menu_url = await _find_best_menu_link(page, website_url)
                if menu_url:
                    # Check if the menu link points to a PDF
                    if menu_url.lower().endswith(".pdf"):
                        raise ScrapeError("pdf_menu", f"Menu link points to a PDF: {menu_url}")

                    logger.info(f"[SCRAPER] Navigating to menu: {menu_url}")
                    try:
                        menu_response = await page.goto(menu_url, wait_until="networkidle",
                                                        timeout=settings.scrape_timeout_ms)
                    except PlaywrightTimeout:
                        raise ScrapeError("timeout", f"Menu page took too long to load: {menu_url}")

                    menu_ct = menu_response.headers.get("content-type", "") if menu_response else ""
                    if "application/pdf" in menu_ct or page.url.lower().endswith(".pdf"):
                        raise ScrapeError("pdf_menu", f"Menu page is a PDF: {page.url}")

            # Wait for JS-rendered content (SPAs like sweetgreen)
            await page.wait_for_timeout(3000)

            # Try scrolling to trigger lazy-loaded content
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            await page.wait_for_timeout(1500)

            # Extract visible text content
            text = await page.evaluate("""
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

            scraped_len = len(text or "")
            logger.info(f"[SCRAPER] Scraped {scraped_len} chars from {page.url}")

            if not text or scraped_len < 50:
                raise ScrapeError("empty_page", f"Page had little/no text content ({scraped_len} chars) at {page.url}")

            # Truncate to avoid overly large payloads to Claude
            return text[:15000]
        finally:
            await browser.close()

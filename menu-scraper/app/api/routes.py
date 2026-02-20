import logging

from fastapi import APIRouter, HTTPException

from app.models.schemas import IngredientsRequest, IngredientsResponse
from app.services import cache_service, places_service, scraper_service, llm_service, matcher_service
from app.services.scraper_service import ScrapeError

router = APIRouter()
logger = logging.getLogger(__name__)


def _make_response(result: dict, source_url: str, cached: bool) -> IngredientsResponse:
    return IngredientsResponse(
        matched_dish=result["dish"],
        match_confidence=1.0,
        ingredients=result.get("ingredients", []),
        steps=result.get("steps", []),
        source_url=source_url,
        cached=cached,
    )


@router.post("/ingredients", response_model=IngredientsResponse)
async def lookup_ingredients(req: IngredientsRequest):
    logger.info(f"[REQUEST] dish='{req.dish_name}', restaurant='{req.restaurant_name}', provider_id='{req.restaurant_provider_id}'")

    restaurant_key = req.restaurant_provider_id or req.restaurant_name.lower().strip()

    # 1. Check cache — if we have cached dishes, use fuzzy match + generate steps
    cached = cache_service.get_cached(restaurant_key)
    if cached:
        dishes, source_url = cached
        match, confidence = matcher_service.find_best_match(req.dish_name, dishes)
        if match:
            logger.info(f"[CACHE HIT] Matched '{match['dish']}' (confidence={confidence:.0%})")
            # Generate recipe steps for cached match
            steps = []
            try:
                steps = await llm_service.generate_recipe_steps(match["dish"], match.get("ingredients", []))
            except Exception as e:
                logger.error(f"[RECIPE] Failed: {e}")
            return IngredientsResponse(
                matched_dish=match["dish"],
                match_confidence=round(confidence, 2),
                ingredients=match.get("ingredients", []),
                steps=steps,
                source_url=source_url,
                cached=True,
            )
        logger.info(f"[CACHE] Had cached data but no match for '{req.dish_name}' (best={confidence:.0%})")

    # 2. Get restaurant website URL
    website_url = await places_service.get_website_url(
        req.restaurant_provider_id, req.restaurant_name
    )
    if not website_url:
        logger.error(f"[PLACES] Could not find website for '{req.restaurant_name}'")
        raise HTTPException(status_code=404, detail=f"Could not find website for restaurant: {req.restaurant_name}")
    logger.info(f"[PLACES] Resolved website: {website_url}")

    # 3. Scrape the menu page
    try:
        result = await scraper_service.scrape_menu_page(website_url)
    except ScrapeError as e:
        logger.error(f"[SCRAPE FAILED] reason={e.reason}, detail={e.detail}")
        raise HTTPException(status_code=422, detail=f"[{e.reason}] {e.detail}")
    except Exception as e:
        logger.error(f"[SCRAPE FAILED] {type(e).__name__}: {e}")
        raise HTTPException(status_code=502, detail=f"Failed to scrape restaurant menu: {e}")

    # 4. FAST PATH: targeted search — one LLM call does find + ingredients + recipe
    source_url = result.source_url or website_url

    # Try PDFs in parallel (all at once, first match wins)
    if result.pdfs:
        logger.info(f"[FAST] Searching {len(result.pdfs)} PDFs in parallel for '{req.dish_name}'")
        found = await llm_service.find_dish_in_pdfs_parallel(req.dish_name, result.pdfs)
        if found:
            pdf_source = found.pop("_source_url", source_url)
            # Cache the result as a single-dish entry for future lookups
            cache_service.set_cached(restaurant_key, [{"dish": found["dish"], "ingredients": found.get("ingredients", [])}], pdf_source)
            return _make_response(found, pdf_source, cached=False)

    # Try HTML text
    if result.text:
        logger.info(f"[FAST] Searching {len(result.text)} chars of text for '{req.dish_name}'")
        found = await llm_service.find_dish_on_text_menu(req.dish_name, result.text)
        if found:
            cache_service.set_cached(restaurant_key, [{"dish": found["dish"], "ingredients": found.get("ingredients", [])}], source_url)
            return _make_response(found, source_url, cached=False)

    # 5. Nothing found
    sources = []
    if result.pdfs:
        sources.append(f"{len(result.pdfs)} PDF(s)")
    if result.text:
        sources.append(f"{len(result.text)} chars of text")
    detail = f"Dish '{req.dish_name}' not found on the menu. Searched: {', '.join(sources) or 'no content found'}"
    logger.error(f"[NOT FOUND] {detail}")
    raise HTTPException(status_code=404, detail=detail)

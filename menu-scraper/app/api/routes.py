import logging

from fastapi import APIRouter, HTTPException

from app.models.schemas import IngredientsRequest, IngredientsResponse
from app.services import cache_service, places_service, scraper_service, llm_service, matcher_service
from app.services.scraper_service import ScrapeError

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/ingredients", response_model=IngredientsResponse)
async def lookup_ingredients(req: IngredientsRequest):
    logger.info(f"[REQUEST] dish='{req.dish_name}', restaurant='{req.restaurant_name}', provider_id='{req.restaurant_provider_id}'")

    restaurant_key = req.restaurant_provider_id or req.restaurant_name.lower().strip()

    # 1. Check cache
    cached = cache_service.get_cached(restaurant_key)
    if cached:
        dishes, source_url = cached
        match, confidence = matcher_service.find_best_match(req.dish_name, dishes)
        if match:
            logger.info(f"[CACHE HIT] Matched '{match['dish']}' (confidence={confidence:.0%})")
            return IngredientsResponse(
                matched_dish=match["dish"],
                match_confidence=round(confidence, 2),
                ingredients=match.get("ingredients", []),
                source_url=source_url,
                cached=True,
            )
        logger.info(f"[CACHE] Had cached data but no match for '{req.dish_name}' (best={confidence:.0%})")

    # 2. Get restaurant website URL via Google Places
    website_url = await places_service.get_website_url(
        req.restaurant_provider_id, req.restaurant_name
    )
    if not website_url:
        logger.error(f"[PLACES] Could not find website for '{req.restaurant_name}' (provider_id={req.restaurant_provider_id})")
        raise HTTPException(
            status_code=404,
            detail=f"Could not find website for restaurant: {req.restaurant_name}",
        )
    logger.info(f"[PLACES] Resolved website: {website_url}")

    # 3. Scrape the menu page
    try:
        menu_text = await scraper_service.scrape_menu_page(website_url)
    except ScrapeError as e:
        logger.error(f"[SCRAPE FAILED] reason={e.reason}, detail={e.detail}")
        raise HTTPException(status_code=422, detail=f"[{e.reason}] {e.detail}")
    except Exception as e:
        logger.error(f"[SCRAPE FAILED] unexpected error: {type(e).__name__}: {e}")
        raise HTTPException(status_code=502, detail=f"Failed to scrape restaurant menu: {type(e).__name__}: {e}")

    if not menu_text:
        logger.error(f"[SCRAPE] No text content returned from {website_url}")
        raise HTTPException(status_code=404, detail="No menu content found on restaurant website")

    logger.info(f"[SCRAPE OK] Got {len(menu_text)} chars from {website_url}")

    # 4. Extract dishes via Claude
    try:
        dishes = await llm_service.extract_dishes_and_ingredients(menu_text)
    except Exception as e:
        logger.error(f"[LLM FAILED] {type(e).__name__}: {e}")
        raise HTTPException(status_code=502, detail=f"Failed to extract menu data: {type(e).__name__}: {e}")

    if not dishes:
        logger.error(f"[LLM] Claude returned no dishes from {len(menu_text)} chars of menu text")
        raise HTTPException(status_code=404, detail="Could not extract any dishes from menu")

    logger.info(f"[LLM OK] Extracted {len(dishes)} dishes: {[d.get('dish', '?') for d in dishes[:10]]}")

    # 5. Cache the result
    cache_service.set_cached(restaurant_key, dishes, website_url)

    # 6. Fuzzy match the requested dish
    match, confidence = matcher_service.find_best_match(req.dish_name, dishes)
    if not match:
        logger.error(f"[MATCH FAILED] '{req.dish_name}' not found among {len(dishes)} dishes (best confidence={confidence:.0%})")
        raise HTTPException(
            status_code=404,
            detail=f"Dish '{req.dish_name}' not found on the menu (best confidence: {confidence:.0%}). Available dishes: {', '.join(d.get('dish', '?') for d in dishes[:15])}",
        )

    logger.info(f"[MATCH OK] '{req.dish_name}' → '{match['dish']}' (confidence={confidence:.0%})")

    return IngredientsResponse(
        matched_dish=match["dish"],
        match_confidence=round(confidence, 2),
        ingredients=match.get("ingredients", []),
        source_url=website_url,
        cached=False,
    )

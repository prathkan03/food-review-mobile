import logging

from fastapi import APIRouter, HTTPException

from app.models.schemas import IngredientsRequest, IngredientsResponse
from app.services import cache_service, places_service, scraper_service, llm_service, matcher_service

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/ingredients", response_model=IngredientsResponse)
async def lookup_ingredients(req: IngredientsRequest):
    restaurant_key = req.restaurant_provider_id or req.restaurant_name.lower().strip()

    # 1. Check cache
    cached = cache_service.get_cached(restaurant_key)
    if cached:
        dishes, source_url = cached
        match, confidence = matcher_service.find_best_match(req.dish_name, dishes)
        if match:
            return IngredientsResponse(
                matched_dish=match["dish"],
                match_confidence=round(confidence, 2),
                ingredients=match.get("ingredients", []),
                source_url=source_url,
                cached=True,
            )

    # 2. Get restaurant website URL via Google Places
    website_url = await places_service.get_website_url(
        req.restaurant_provider_id, req.restaurant_name
    )
    if not website_url:
        raise HTTPException(
            status_code=404,
            detail=f"Could not find website for restaurant: {req.restaurant_name}",
        )

    # 3. Scrape the menu page
    try:
        menu_text = await scraper_service.scrape_menu_page(website_url)
    except Exception as e:
        logger.error(f"Scraping failed for {website_url}: {e}")
        raise HTTPException(status_code=502, detail="Failed to scrape restaurant menu")

    if not menu_text:
        raise HTTPException(status_code=404, detail="No menu content found on restaurant website")

    # 4. Extract dishes via Claude
    try:
        dishes = await llm_service.extract_dishes_and_ingredients(menu_text)
    except Exception as e:
        logger.error(f"LLM extraction failed: {e}")
        raise HTTPException(status_code=502, detail="Failed to extract menu data")

    if not dishes:
        raise HTTPException(status_code=404, detail="Could not extract any dishes from menu")

    # 5. Cache the result
    cache_service.set_cached(restaurant_key, dishes, website_url)

    # 6. Fuzzy match the requested dish
    match, confidence = matcher_service.find_best_match(req.dish_name, dishes)
    if not match:
        raise HTTPException(
            status_code=404,
            detail=f"Dish '{req.dish_name}' not found on the menu (best confidence: {confidence:.0%})",
        )

    return IngredientsResponse(
        matched_dish=match["dish"],
        match_confidence=round(confidence, 2),
        ingredients=match.get("ingredients", []),
        source_url=website_url,
        cached=False,
    )

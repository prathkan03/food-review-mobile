import logging
import re

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

PLACES_DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json"
PLACES_FIND_URL = "https://maps.googleapis.com/maps/api/place/findplacefromtext/json"


def _clean_restaurant_name(name: str) -> str:
    """Strip subtitles like 'sweetgreen - Healthy Salads, Bowls and Plates' → 'sweetgreen'."""
    # Split on common separators used in Google Places names
    for sep in [" - ", " — ", " | ", " · "]:
        if sep in name:
            name = name.split(sep)[0]
    return name.strip()


def _guess_website_url(restaurant_name: str) -> str | None:
    """Try to derive a likely website URL from the restaurant name."""
    clean = _clean_restaurant_name(restaurant_name).lower()
    # Remove non-alphanumeric chars (keep spaces)
    clean = re.sub(r"[^a-z0-9 ]", "", clean)
    # Remove spaces for domain guess
    slug = clean.replace(" ", "")
    if slug:
        return f"https://{slug}.com"
    return None


async def get_website_url(provider_id: str | None, restaurant_name: str) -> str | None:
    """Look up a restaurant's website URL via Google Places API, with fallback."""
    api_key = settings.google_places_api_key
    if not api_key:
        logger.warning("No Google Places API key configured, trying URL guess")
        return _guess_website_url(restaurant_name)

    async with httpx.AsyncClient(timeout=10) as client:
        place_id = provider_id

        # If no provider_id, try to find the place by name
        if not place_id:
            clean_name = _clean_restaurant_name(restaurant_name)
            logger.info(f"No provider_id, searching Places for: {clean_name}")
            resp = await client.get(PLACES_FIND_URL, params={
                "input": clean_name,
                "inputtype": "textquery",
                "fields": "place_id",
                "key": api_key,
            })
            data = resp.json()
            logger.info(f"Places Find response status: {data.get('status')}")
            candidates = data.get("candidates", [])
            if not candidates:
                logger.warning(f"No Places candidates for '{clean_name}', trying URL guess")
                return _guess_website_url(restaurant_name)
            place_id = candidates[0].get("place_id")

        if not place_id:
            logger.warning("No place_id resolved, trying URL guess")
            return _guess_website_url(restaurant_name)

        # Get place details including website
        logger.info(f"Fetching Places Details for place_id: {place_id}")
        resp = await client.get(PLACES_DETAILS_URL, params={
            "place_id": place_id,
            "fields": "website,name",
            "key": api_key,
        })
        data = resp.json()
        logger.info(f"Places Details response status: {data.get('status')}, result: {data.get('result', {})}")
        result = data.get("result", {})
        website = result.get("website")

        if website:
            return website

        # Places API didn't have a website — fall back to URL guess
        logger.warning(f"No website in Places Details for {place_id}, trying URL guess")
        return _guess_website_url(restaurant_name)

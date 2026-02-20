import json
import logging

import anthropic

from app.config import settings

logger = logging.getLogger(__name__)


async def extract_dishes_and_ingredients(menu_text: str) -> list[dict]:
    """Use Claude to extract structured dish+ingredient data from raw menu text."""
    if not settings.anthropic_api_key:
        logger.error("[LLM] No ANTHROPIC_API_KEY configured")
        return []

    logger.info(f"[LLM] Sending {len(menu_text)} chars to Claude for extraction")

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    message = client.messages.create(
        model="claude-sonnet-4-5-20250929",
        max_tokens=2048,
        messages=[{
            "role": "user",
            "content": f"""Extract all dishes and their ingredients from this restaurant menu text.
Return a JSON array where each element has:
- "dish": the dish name (string)
- "ingredients": list of ingredient strings

Only include dishes where you can reasonably infer ingredients from the description.
If a dish has no discernible ingredients, skip it.
Return ONLY the JSON array, no other text.

Menu text:
{menu_text}"""
        }],
    )

    raw = message.content[0].text.strip()
    logger.info(f"[LLM] Claude response length: {len(raw)} chars")

    # Strip markdown code fences if present
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
        if raw.endswith("```"):
            raw = raw[:-3]
        raw = raw.strip()

    try:
        dishes = json.loads(raw)
        logger.info(f"[LLM] Parsed {len(dishes)} dishes from response")
        return dishes
    except json.JSONDecodeError as e:
        logger.error(f"[LLM] Failed to parse JSON: {e}\nRaw response (first 500 chars): {raw[:500]}")
        return []

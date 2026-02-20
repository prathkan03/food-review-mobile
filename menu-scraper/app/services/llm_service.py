import asyncio
import base64
import json
import logging

import anthropic

from app.config import settings

logger = logging.getLogger(__name__)

# Single-call prompt: find the dish, extract ingredients, AND generate the recipe in one shot
TARGETED_PROMPT_TEMPLATE = """I'm looking for the dish "{dish_name}" on this restaurant menu.

Find the closest matching dish and return a JSON object with:
- "dish": the exact dish name as it appears on the menu (string)
- "ingredients": list of ingredient strings inferred from the menu description
- "steps": a step-by-step recipe as a list of strings (4-8 concise steps with cooking times/temperatures)
- "found": true if you found a matching dish, false if not

If the dish is not on this menu at all, return: {{"found": false, "dish": "", "ingredients": [], "steps": []}}

Return ONLY the JSON object, no other text."""

EXTRACTION_PROMPT = """Extract all dishes and their ingredients from this restaurant menu.
Return a JSON array where each element has:
- "dish": the dish name (string)
- "ingredients": list of ingredient strings

Only include dishes where you can reasonably infer ingredients from the description.
If a dish has no discernible ingredients, skip it.
Return ONLY the JSON array, no other text."""


def _strip_fences(raw: str) -> str:
    """Strip markdown code fences from a response."""
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
        if raw.endswith("```"):
            raw = raw[:-3]
        raw = raw.strip()
    return raw


def _parse_dish_list(raw: str) -> list[dict]:
    """Parse a JSON array of dishes from Claude's response."""
    raw = _strip_fences(raw)
    try:
        dishes = json.loads(raw)
        logger.info(f"[LLM] Parsed {len(dishes)} dishes from response")
        return dishes
    except json.JSONDecodeError as e:
        logger.error(f"[LLM] Failed to parse JSON: {e}\nRaw (first 500 chars): {raw[:500]}")
        return []


def _parse_targeted_result(raw: str) -> dict | None:
    """Parse a targeted single-dish result from Claude."""
    raw = _strip_fences(raw)
    try:
        result = json.loads(raw)
        if isinstance(result, dict) and result.get("found", False):
            logger.info(f"[LLM] Targeted match: '{result.get('dish')}' with {len(result.get('ingredients', []))} ingredients, {len(result.get('steps', []))} steps")
            return result
        logger.info(f"[LLM] Targeted search: dish not found on this menu")
        return None
    except json.JSONDecodeError as e:
        logger.error(f"[LLM] Failed to parse targeted JSON: {e}\nRaw (first 500 chars): {raw[:500]}")
        return None


async def find_dish_on_text_menu(dish_name: str, menu_text: str) -> dict | None:
    """Single LLM call: find a specific dish on a text menu and generate its recipe."""
    if not settings.anthropic_api_key:
        return None

    logger.info(f"[LLM] Targeted search for '{dish_name}' in {len(menu_text)} chars of text")
    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    prompt = TARGETED_PROMPT_TEMPLATE.format(dish_name=dish_name)

    message = await client.messages.create(
        model="claude-sonnet-4-5-20250929",
        max_tokens=2048,
        messages=[{
            "role": "user",
            "content": f"{prompt}\n\nMenu text:\n{menu_text}",
        }],
    )

    return _parse_targeted_result(message.content[0].text)


async def find_dish_on_pdf_menu(dish_name: str, pdf_bytes: bytes) -> dict | None:
    """Single LLM call: find a specific dish on a PDF menu and generate its recipe."""
    if not settings.anthropic_api_key:
        return None

    pdf_size_mb = len(pdf_bytes) / (1024 * 1024)
    if pdf_size_mb > 30:
        logger.error(f"[LLM] PDF too large ({pdf_size_mb:.1f} MB)")
        return None

    logger.info(f"[LLM] Targeted search for '{dish_name}' in PDF ({pdf_size_mb:.1f} MB)")
    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    prompt = TARGETED_PROMPT_TEMPLATE.format(dish_name=dish_name)
    pdf_b64 = base64.standard_b64encode(pdf_bytes).decode("utf-8")

    message = await client.messages.create(
        model="claude-sonnet-4-5-20250929",
        max_tokens=2048,
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "document",
                    "source": {
                        "type": "base64",
                        "media_type": "application/pdf",
                        "data": pdf_b64,
                    },
                },
                {
                    "type": "text",
                    "text": prompt,
                },
            ],
        }],
    )

    return _parse_targeted_result(message.content[0].text)


async def find_dish_in_pdfs_parallel(dish_name: str, pdf_items: list) -> dict | None:
    """Search for a dish across multiple PDFs in parallel. Returns first match."""
    if not pdf_items:
        return None

    logger.info(f"[LLM] Parallel search for '{dish_name}' across {len(pdf_items)} PDFs")

    tasks = [
        find_dish_on_pdf_menu(dish_name, pdf_item.data)
        for pdf_item in pdf_items
    ]

    results = await asyncio.gather(*tasks, return_exceptions=True)

    for i, result in enumerate(results):
        if isinstance(result, Exception):
            logger.error(f"[LLM] PDF {i+1} failed: {type(result).__name__}: {result}")
            continue
        if result is not None:
            logger.info(f"[LLM] Found '{dish_name}' in PDF {i+1}: {pdf_items[i].url}")
            result["_source_url"] = pdf_items[i].url
            return result

    logger.warning(f"[LLM] '{dish_name}' not found in any of {len(pdf_items)} PDFs")
    return None


# --- Fallback functions (kept for cache population) ---

async def extract_dishes_and_ingredients(menu_text: str) -> list[dict]:
    """Extract all dishes from text menu (fallback/cache population)."""
    if not settings.anthropic_api_key:
        return []

    logger.info(f"[LLM] Extracting all dishes from {len(menu_text)} chars")
    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    message = await client.messages.create(
        model="claude-sonnet-4-5-20250929",
        max_tokens=2048,
        messages=[{
            "role": "user",
            "content": f"{EXTRACTION_PROMPT}\n\nMenu text:\n{menu_text}",
        }],
    )

    return _parse_dish_list(message.content[0].text)


async def extract_dishes_from_pdf(pdf_bytes: bytes) -> list[dict]:
    """Extract all dishes from PDF menu (fallback/cache population)."""
    if not settings.anthropic_api_key:
        return []

    pdf_size_mb = len(pdf_bytes) / (1024 * 1024)
    if pdf_size_mb > 30:
        return []

    logger.info(f"[LLM] Extracting all dishes from PDF ({pdf_size_mb:.1f} MB)")
    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    pdf_b64 = base64.standard_b64encode(pdf_bytes).decode("utf-8")

    message = await client.messages.create(
        model="claude-sonnet-4-5-20250929",
        max_tokens=4096,
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "document",
                    "source": {
                        "type": "base64",
                        "media_type": "application/pdf",
                        "data": pdf_b64,
                    },
                },
                {
                    "type": "text",
                    "text": EXTRACTION_PROMPT,
                },
            ],
        }],
    )

    return _parse_dish_list(message.content[0].text)


async def generate_recipe_steps(dish_name: str, ingredients: list[str]) -> list[str]:
    """Generate recipe steps (fallback, used for cached results that don't have steps)."""
    if not settings.anthropic_api_key:
        return []

    logger.info(f"[RECIPE] Generating recipe for '{dish_name}'")
    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    message = await client.messages.create(
        model="claude-sonnet-4-5-20250929",
        max_tokens=2048,
        messages=[{
            "role": "user",
            "content": f"""Write a step-by-step recipe for "{dish_name}" using these ingredients: {", ".join(ingredients)}

Return a JSON array of strings, where each string is one step.
Keep each step concise (1-3 sentences). Include cooking times and temperatures where relevant.
Aim for 4-8 steps total.
Return ONLY the JSON array, no other text.""",
        }],
    )

    raw = _strip_fences(message.content[0].text)
    try:
        steps = json.loads(raw)
        if isinstance(steps, list) and all(isinstance(s, str) for s in steps):
            return steps
        return []
    except json.JSONDecodeError:
        return []

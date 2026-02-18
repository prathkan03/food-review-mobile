import json

import anthropic

from app.config import settings


async def extract_dishes_and_ingredients(menu_text: str) -> list[dict]:
    """Use Claude to extract structured dish+ingredient data from raw menu text."""
    if not settings.anthropic_api_key:
        return []

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
    # Strip markdown code fences if present
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
        if raw.endswith("```"):
            raw = raw[:-3]
        raw = raw.strip()

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return []

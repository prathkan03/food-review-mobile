from thefuzz import fuzz


def find_best_match(dish_name: str, extracted_dishes: list[dict]) -> tuple[dict | None, float]:
    """Fuzzy-match the user's dish name against extracted dish data.

    Returns (best_match_dict, confidence_0_to_1) or (None, 0).
    """
    if not extracted_dishes:
        return None, 0.0

    best_match = None
    best_score = 0

    for dish in extracted_dishes:
        name = dish.get("dish", "")
        score = fuzz.token_sort_ratio(dish_name.lower(), name.lower())
        if score > best_score:
            best_score = score
            best_match = dish

    confidence = best_score / 100.0
    if confidence < 0.4:
        return None, confidence

    return best_match, confidence

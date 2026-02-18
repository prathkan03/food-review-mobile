from pydantic import BaseModel


class IngredientsRequest(BaseModel):
    dish_name: str
    restaurant_name: str
    restaurant_provider_id: str | None = None


class IngredientsResponse(BaseModel):
    matched_dish: str
    match_confidence: float
    ingredients: list[str]
    source_url: str | None = None
    cached: bool = False

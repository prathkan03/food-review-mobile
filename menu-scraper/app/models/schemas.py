from pydantic import BaseModel


class IngredientsRequest(BaseModel):
    dish_name: str
    restaurant_name: str
    restaurant_provider_id: str | None = None


class IngredientsResponse(BaseModel):
    matched_dish: str
    match_confidence: float
    ingredients: list[str]
    steps: list[str] = []
    source_url: str | None = None
    cached: bool = False


class MenuRequest(BaseModel):
    restaurant_name: str
    restaurant_provider_id: str | None = None


class MenuDish(BaseModel):
    dish: str
    ingredients: list[str] = []


class MenuResponse(BaseModel):
    dishes: list[MenuDish]
    source_url: str | None = None

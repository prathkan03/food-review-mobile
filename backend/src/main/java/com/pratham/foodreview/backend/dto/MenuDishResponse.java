package com.pratham.foodreview.backend.dto;

import java.util.List;

public record MenuDishResponse(
    String id,
    String dishName,
    List<String> ingredients
) {}

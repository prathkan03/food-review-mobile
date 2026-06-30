package com.pratham.foodreview.backend.dto;

import java.util.List;

public record DishResponse(
    String matched_dish,
    List<String> ingredients,
    List<String> steps,
    boolean cached
) {}

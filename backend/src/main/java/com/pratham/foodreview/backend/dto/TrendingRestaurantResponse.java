package com.pratham.foodreview.backend.dto;

import java.util.List;

public record TrendingRestaurantResponse(
    String id,
    String name,
    String address,
    Double lat,
    Double lng,
    String photoUrl,
    List<String> categories,
    Integer priceTier,
    long reviewCount
) {}

package com.pratham.foodreview.backend.dto;

public record RestaurantSearchResult(
  String provider,
  String providerId,
  String name,
  String address,
  Double lat,
  Double lng,
  String photoReference,
  Integer priceLevel,
  Double rating
) {}

package com.pratham.foodreview.backend.dto;

import java.util.List;

public record CreateReviewRequest(
  String provider,
  String providerId,
  String name,
  String address,
  Double lat,
  Double lng,
  Integer rating,
  String text,
  List<String> dishes
) {}

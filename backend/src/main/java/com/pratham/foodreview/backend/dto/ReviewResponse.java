package com.pratham.foodreview.backend.dto;

import java.util.List;

public record ReviewResponse(
  String id,
  String userId,
  String userName,
  String userAvatar,
  String restaurantId,
  String restaurantName,
  String restaurantAddress,
  Integer rating,
  String text,
  List<String> photoUrls,
  List<String> items,
  String createdAt
) {}

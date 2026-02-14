package com.pratham.foodreview.backend.dto;

public record ProfileResponse(
    String id,
    String username,
    String displayName,
    String avatarUrl,
    String bio,
    long reviewCount,
    long followerCount,
    long followingCount
) {}

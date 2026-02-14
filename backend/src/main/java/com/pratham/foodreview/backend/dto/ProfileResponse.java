package com.pratham.foodreview.backend.dto;

public record ProfileResponse(
    String id,
    String username,
    String displayName,
    String avatarUrl,
    long reviewCount,
    long followerCount,
    long followingCount
) {}

package com.pratham.foodreview.backend.dto;

public record UpdateProfileRequest(
    String username,
    String bio
) {}

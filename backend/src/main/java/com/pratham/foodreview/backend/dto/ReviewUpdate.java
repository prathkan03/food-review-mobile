package com.pratham.foodreview.backend.dto;

import java.util.List;

public record ReviewUpdate(
    String content, 
    Integer rating, 
    List<String> dishes
) {}

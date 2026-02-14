package com.pratham.foodreview.backend.service;

import com.pratham.foodreview.backend.dto.ReviewResponse;
import com.pratham.foodreview.backend.entity.Review;
import com.pratham.foodreview.backend.repo.ProfileRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ProfileService {

    private final ProfileRepository profileRepository;

    public ProfileService(ProfileRepository profileRepository) {
        this.profileRepository = profileRepository;
    }

    public List<ReviewResponse> getReviews(UUID userId) {
        List<Review> reviews = profileRepository.findReviewsByUserId(userId);
        return reviews.stream()
            .map(this::toReviewResponse)
            .collect(Collectors.toList());
    }

    private ReviewResponse toReviewResponse(Review review) {
        return new ReviewResponse(
            review.getId().toString(),
            review.getUser().getId().toString(),
            review.getUser().getUsername(),
            review.getUser().getAvatarUrl(),
            review.getRestaurant().getId().toString(),
            review.getRestaurant().getName(),
            review.getRestaurant().getAddress(),
            review.getRating(),
            review.getText(),
            review.getPhotoUrls(),
            review.getDishes() != null ? List.of(review.getDishes()) : new ArrayList<>(),
            review.getCreatedAt().toString()
        );
    }
}

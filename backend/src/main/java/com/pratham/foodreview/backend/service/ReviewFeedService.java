package com.pratham.foodreview.backend.service;

import com.pratham.foodreview.backend.dto.CreateReviewRequest;
import com.pratham.foodreview.backend.dto.ReviewResponse;
import com.pratham.foodreview.backend.entity.*;
import com.pratham.foodreview.backend.repo.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReviewFeedService {

    private final ReviewRepository reviewRepository;
    private final RestaurantRepository restaurantRepository;
    private final ProfileRepository profileRepository;
    private final FollowRepository followRepository;

    public ReviewFeedService(ReviewRepository reviewRepository,
                        RestaurantRepository restaurantRepository,
                        ProfileRepository profileRepository,
                        FollowRepository followRepository) {
        this.reviewRepository = reviewRepository;
        this.restaurantRepository = restaurantRepository;
        this.profileRepository = profileRepository;
        this.followRepository = followRepository;
    }

    @Transactional
    public ReviewResponse createReview(UUID userId, CreateReviewRequest request) {
        // Get or create restaurant
        Restaurant restaurant = restaurantRepository
            .findByProviderAndProviderId(request.provider(), request.providerId())
            .orElseGet(() -> {
                Restaurant newRestaurant = new Restaurant();
                newRestaurant.setProvider(request.provider());
                newRestaurant.setProviderId(request.providerId());
                newRestaurant.setName(request.name());
                newRestaurant.setAddress(request.address());
                newRestaurant.setLat(request.lat());
                newRestaurant.setLng(request.lng());
                return restaurantRepository.save(newRestaurant);
            });

        // Get user profile
        Profile userProfile = profileRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User profile not found"));

        // Create review
        Review review = new Review();
        review.setUser(userProfile);
        review.setRestaurant(restaurant);
        review.setRating(request.rating());
        review.setText(request.text());
        review.setCreatedAt(OffsetDateTime.now());
        review.setUpdatedAt(OffsetDateTime.now());

        Review savedReview = reviewRepository.save(review);
        return toReviewResponse(savedReview);
    }

    public List<ReviewResponse> getFriendsFeed(UUID userId) {
        // Get list of users that the current user follows
        List<UUID> followingIds = followRepository.findByFollower_Id(userId)
            .stream()
            .map(follow -> follow.getFollowing().getId())
            .collect(Collectors.toList());

        // Add the user's own ID to see their own reviews in the feed
        followingIds.add(userId);

        // Get recent reviews from followed users
        List<Review> reviews = reviewRepository.findByUser_IdInOrderByCreatedAtDesc(followingIds);
        
        // Limit to recent reviews (e.g., last 50)
        return reviews.stream()
            .limit(50)
            .map(this::toReviewResponse)
            .collect(Collectors.toList());
    }

    public List<ReviewResponse> getUserReviews(UUID userId) {
        List<Review> reviews = reviewRepository.findByUser_IdOrderByCreatedAtDesc(userId);
        return reviews.stream()
            .map(this::toReviewResponse)
            .collect(Collectors.toList());
    }

    public ReviewResponse getReview(UUID reviewId) {
        Review review = reviewRepository.findById(reviewId)
            .orElseThrow(() -> new RuntimeException("Review not found"));
        return toReviewResponse(review);
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
            extractItemsFromText(review.getText()),
            review.getCreatedAt().toString()
        );
    }

    private List<String> extractItemsFromText(String text) {
        // Simple extraction of food items from review text
        // This could be enhanced with NLP or AI
        if (text == null || text.isEmpty()) {
            return new ArrayList<>();
        }
        
        // For now, just return an empty list
        // In a real implementation, you might parse the text for food items
        return new ArrayList<>();
    }
}
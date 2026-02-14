package com.pratham.foodreview.backend.controller;

import org.springframework.web.bind.annotation.*;
import com.pratham.foodreview.backend.service.SearchService;
import com.pratham.foodreview.backend.dto.RestaurantDetailResponse;
import com.pratham.foodreview.backend.dto.RestaurantSearchResult;
import com.pratham.foodreview.backend.dto.ReviewResponse;
import com.pratham.foodreview.backend.dto.TrendingRestaurantResponse;
import com.pratham.foodreview.backend.entity.Restaurant;
import com.pratham.foodreview.backend.entity.Review;
import com.pratham.foodreview.backend.repo.RestaurantRepository;
import com.pratham.foodreview.backend.repo.ReviewRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/restaurants")
public class RestaurantController {

    private final SearchService places;
    private final RestaurantRepository restaurantRepository;
    private final ReviewRepository reviewRepository;

    public RestaurantController(SearchService places,
                                RestaurantRepository restaurantRepository,
                                ReviewRepository reviewRepository) {
        this.places = places;
        this.restaurantRepository = restaurantRepository;
        this.reviewRepository = reviewRepository;
    }   

    @GetMapping("/search")
    public List<RestaurantSearchResult> search(@RequestParam String query, @RequestParam Double lat, @RequestParam Double lng){
        return places.searchRestaurants(query, lat, lng);
    }
    
    @GetMapping("/test-search")
    public Map<String, Object> testSearch(@RequestParam(defaultValue = "pizza") String query, 
                                          @RequestParam(defaultValue = "40.7128") Double lat, 
                                          @RequestParam(defaultValue = "-74.0060") Double lng){
        List<RestaurantSearchResult> results = places.searchRestaurants(query, lat, lng);
        return Map.of(
            "query", query,
            "location", lat + "," + lng,
            "resultsCount", results.size(),
            "results", results
        );
    }
    
    @GetMapping("/trending")
    public List<TrendingRestaurantResponse> getTrending() {
        List<Restaurant> restaurants = restaurantRepository.findAll();
        return restaurants.stream().map(r -> new TrendingRestaurantResponse(
            r.getId().toString(),
            r.getName(),
            r.getAddress(),
            r.getLat(),
            r.getLng(),
            r.getPhotoUrl(),
            r.getCategories(),
            r.getPriceTier(),
            reviewRepository.countByRestaurant_Id(r.getId())
        )).collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public RestaurantDetailResponse getRestaurant(@PathVariable UUID id) {
        Restaurant r = restaurantRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Restaurant not found"));

        List<Review> reviews = reviewRepository.findByRestaurant_IdOrderByCreatedAtDesc(id);
        List<ReviewResponse> reviewResponses = reviews.stream().map(review -> new ReviewResponse(
            review.getId().toString(),
            review.getUser().getId().toString(),
            review.getUser().getUsername(),
            review.getUser().getAvatarUrl(),
            r.getId().toString(),
            r.getName(),
            r.getAddress(),
            review.getRating(),
            review.getText(),
            review.getPhotoUrls(),
            review.getDishes() != null ? List.of(review.getDishes()) : new ArrayList<>(),
            review.getCreatedAt().toString()
        )).collect(Collectors.toList());

        return new RestaurantDetailResponse(
            r.getId().toString(),
            r.getName(),
            r.getAddress(),
            r.getLat(),
            r.getLng(),
            r.getPhotoUrl(),
            r.getCategories(),
            r.getPriceTier(),
            reviewResponses.size(),
            reviewResponses
        );
    }

    @GetMapping("/health")
    public Map<String, String> health(){
        return Map.of("status", "ok", "message", "Restaurant controller is working");
    }
}

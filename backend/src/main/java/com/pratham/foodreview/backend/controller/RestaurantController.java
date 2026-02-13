package com.pratham.foodreview.backend.controller;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import com.pratham.foodreview.backend.service.SearchService;
import com.pratham.foodreview.backend.dto.RestaurantSearchResult;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/restaurants")
public class RestaurantController {

    private final SearchService places;

    public RestaurantController(SearchService places) {
        this.places = places;
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
    
    @GetMapping("/health")
    public Map<String, String> health(){
        return Map.of("status", "ok", "message", "Restaurant controller is working");
    }
}

package com.pratham.foodreview.backend.service;

import com.pratham.foodreview.backend.dto.RestaurantSearchResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;


@Service
public class SearchService {

    private static final Logger log = LoggerFactory.getLogger(SearchService.class);
    private final RestClient restClient;
    private final String apiKey;

    public SearchService( @Value("${google.places.api-key}") String apiKey){
        this.apiKey = apiKey;
        this.restClient = RestClient.create("https://maps.googleapis.com/maps/api");
    }    

    public List<RestaurantSearchResult> searchRestaurants(String query, Double lat, Double lng){

        String loc = lat + "," + lng;
        // Add "restaurant" to the query to improve results
        String searchQuery = query + " restaurant";
        log.info("Searching restaurants: query='{}', location={}", searchQuery, loc);

        try {
            Map response = restClient.get()
            .uri(uriBuilder -> uriBuilder
                .path("/place/textsearch/json")
                .queryParam("query", searchQuery)
                .queryParam("location", loc)
                .queryParam("radius", 40000)  // 40km = ~25 miles
                .queryParam("type", "restaurant")
                .queryParam("key", apiKey)
                .build())
                .retrieve()
                .body(Map.class);
            
            if (response == null) {
                log.warn("Received null response from Google Places API");
                return List.of();
            }

            String status = (String) response.get("status");
            log.info("Google Places API status: {}", status);
            
            if (!"OK".equals(status) && !"ZERO_RESULTS".equals(status)) {
                log.error("Google Places API error: status={}, error_message={}", 
                    status, response.get("error_message"));
                return List.of();
            }
            
            List<Map<String, Object>> results = (List<Map<String, Object>>) response.get("results");

            if (results == null) {
                log.info("No results found");
                return List.of();
            }
            
            log.info("Found {} restaurants", results.size());

            return results.stream().map(place -> {
                Map<String, Object> geometry = 
                (Map<String, Object>) place.get("geometry");
                Map<String, Object> location = 
                (Map<String, Object>) geometry.get("location");
                
                return new RestaurantSearchResult(
                    "google",
                    (String) place.get("place_id"),
                    (String) place.get("name"),
                    (String) place.get("formatted_address"),
                    ((Number) location.get("lat")).doubleValue(),
                    ((Number) location.get("lng")).doubleValue(),
                    extractPhoto(place),
                    (Integer) place.get("price_level"),
                    place.get("rating") != null ? ((Number) place.get("rating")).doubleValue() : null
                );
            }).toList();
        } catch (Exception e) {
            log.error("Error searching restaurants", e);
            return List.of();
        }
    }

    private String extractPhoto(Map<String, Object> place){
        List<Map<String, Object>> photos = (List<Map<String, Object>>) place.get("photos");
        if (photos == null || photos.isEmpty()) {return null;}
        return (String) photos.get(0).get("photo_reference");
    }

}

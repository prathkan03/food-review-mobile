package com.pratham.foodreview.backend.controller;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import com.pratham.foodreview.backend.dto.MenuDishResponse;
import com.pratham.foodreview.backend.entity.Dish;
import com.pratham.foodreview.backend.entity.Restaurant;
import com.pratham.foodreview.backend.repo.DishRepository;
import com.pratham.foodreview.backend.repo.RestaurantRepository;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/restaurants")
public class MenuController {

    private static final String MENU_SCRAPER_URL = "http://localhost:8001/api/menu";

    private final RestTemplate restTemplate = new RestTemplate();
    private final DishRepository dishRepository;
    private final RestaurantRepository restaurantRepository;

    public MenuController(DishRepository dishRepository, RestaurantRepository restaurantRepository) {
        this.dishRepository = dishRepository;
        this.restaurantRepository = restaurantRepository;
    }

    /**
     * Returns the canonical dish list for a restaurant. Cache-first: serves stored
     * Dish rows if present, otherwise ingests the full menu from the scraper and saves it.
     */
    @PostMapping("/menu")
    public ResponseEntity<?> getMenu(@RequestBody Map<String, Object> request) {
        String providerId = (String) request.get("restaurant_provider_id");
        if (providerId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "missing provider id"));
        }

        // Find the restaurant, or create it on the fly (may not have been reviewed yet).
        Restaurant restaurant = restaurantRepository
            .findByProviderAndProviderId("google", providerId)
            .orElseGet(() -> {
                Restaurant r = new Restaurant();
                r.setProvider("google");
                r.setProviderId(providerId);
                r.setName((String) request.get("restaurant_name"));
                r.setCreatedAt(OffsetDateTime.now());
                return restaurantRepository.save(r);
            });

        // Cache-first: serve stored dishes if we already ingested this menu.
        List<Dish> dishes = dishRepository.findByRestaurant_Id(restaurant.getId());
        if (dishes.isEmpty()) {
            try {
                dishes = ingestMenu(restaurant);
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("error", "Menu scraper service unavailable: " + e.getMessage()));
            }
        }

        List<MenuDishResponse> response = dishes.stream()
            .map(d -> new MenuDishResponse(d.getId().toString(), d.getDishName(), d.getIngredients()))
            .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    /** Call the scraper's /api/menu, persist every returned dish (name + ingredients), return them. */
    @SuppressWarnings("unchecked")
    private List<Dish> ingestMenu(Restaurant restaurant) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = new HashMap<>();
        body.put("restaurant_name", restaurant.getName());
        body.put("restaurant_provider_id", restaurant.getProviderId());

        ResponseEntity<Map> scraperResponse = restTemplate.exchange(
            MENU_SCRAPER_URL, HttpMethod.POST, new HttpEntity<>(body, headers), Map.class);

        Map<String, Object> respBody = scraperResponse.getBody();
        List<Map<String, Object>> scraped = respBody != null
            ? (List<Map<String, Object>>) respBody.get("dishes")
            : List.of();

        List<Dish> toSave = new ArrayList<>();
        for (Map<String, Object> d : scraped) {
            String name = (String) d.get("dish");
            if (name == null || name.isBlank()) continue;
            Dish dish = new Dish();
            dish.setRestaurant(restaurant);
            dish.setDishName(name);
            dish.setIngredients((List<String>) d.get("ingredients"));
            dish.setCreatedAt(OffsetDateTime.now());
            toSave.add(dish);
        }
        return dishRepository.saveAll(toSave);
    }
}

package com.pratham.foodreview.backend.controller;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import com.pratham.foodreview.backend.dto.DishResponse;
import com.pratham.foodreview.backend.entity.Restaurant;
import com.pratham.foodreview.backend.entity.Dish;
import com.pratham.foodreview.backend.repo.DishRepository;
import com.pratham.foodreview.backend.repo.RestaurantRepository;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.time.OffsetDateTime;
import java.util.List;

@RestController
@RequestMapping("/ingredients")
public class IngredientsController {

    private static final String MENU_SCRAPER_URL = "http://localhost:8001/api/ingredients";

    private final RestTemplate restTemplate = new RestTemplate();

    private final DishRepository dishRepository;
    private final RestaurantRepository restaurantRepository;

    public IngredientsController(DishRepository dishRepository, RestaurantRepository restaurantRepository){
        this.dishRepository = dishRepository;
        this.restaurantRepository = restaurantRepository;
    }

    @PostMapping("/lookup")
    public ResponseEntity<?> lookupIngredients(@RequestBody Map<String, Object> request) {
        String providerId = (String) request.get("restaurant_provider_id");
        Optional<Restaurant> restaurant = restaurantRepository.findByProviderAndProviderId("google", providerId);

        if (restaurant.isEmpty()){
            return ResponseEntity.badRequest().body(Map.of("error", "restaurant not found"));
        }
       
        String dishName = (String) request.get("dish_name");
        UUID restaurantId = restaurant.get().getId();
        Optional<Dish> existing = dishRepository.findByRestaurant_IdAndDishName(restaurantId, dishName);
        
        if (existing.isPresent()){
            Dish dish = existing.get();
            return ResponseEntity.ok(new DishResponse(
                dish.getDishName(),
                dish.getIngredients(),
                dish.getSteps(),
                true
            ));
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> httpRequest = new HttpEntity<>(request, headers);

        try{
            ResponseEntity<Map> scraperResponse = restTemplate.exchange(
                MENU_SCRAPER_URL,
                HttpMethod.POST,
                httpRequest,
                Map.class
            );
            Map<String, Object> body = scraperResponse.getBody();

            String matchedDish = (String) body.get("matched_dish");
            List<String> ingredients = (List<String>) body.get("ingredients");
            List<String> steps = (List<String>) body.get("steps");

            Dish dish = new Dish();
            dish.setRestaurant(restaurant.get());
            dish.setDishName(matchedDish);
            dish.setIngredients(ingredients);
            dish.setSteps(steps);
            dish.setCreatedAt(OffsetDateTime.now());
            dishRepository.save(dish);

            return ResponseEntity.ok(new DishResponse(
                matchedDish,
                ingredients,
                steps,
                false
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of("error", "Menu scraper service unavailable: " + e.getMessage()));
        }

    }
}

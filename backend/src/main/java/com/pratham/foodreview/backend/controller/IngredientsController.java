package com.pratham.foodreview.backend.controller;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@RestController
@RequestMapping("/ingredients")
public class IngredientsController {

    private static final String MENU_SCRAPER_URL = "http://localhost:8001/api/ingredients";

    private final RestTemplate restTemplate = new RestTemplate();

    @PostMapping("/lookup")
    public ResponseEntity<String> lookupIngredients(@RequestBody Map<String, Object> request) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                MENU_SCRAPER_URL,
                HttpMethod.POST,
                entity,
                String.class
            );
            return ResponseEntity.status(response.getStatusCode())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(response.getBody());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body("{\"error\": \"Menu scraper service unavailable: " +
                          e.getMessage().replace("\"", "'") + "\"}");
        }
    }
}

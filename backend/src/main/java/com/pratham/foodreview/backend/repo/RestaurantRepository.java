package com.pratham.foodreview.backend.repo;

import com.pratham.foodreview.backend.entity.Restaurant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface RestaurantRepository extends JpaRepository<Restaurant, UUID> {
  Optional<Restaurant> findByProviderAndProviderId(String provider, String providerId);
}

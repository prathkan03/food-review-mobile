package com.pratham.foodreview.backend.repo;

import com.pratham.foodreview.backend.entity.Dish;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;
import java.util.List;
import java.util.Optional;

public interface DishRepository extends JpaRepository<Dish, UUID> {
    
    List<Dish> findByRestaurant_Id(UUID restaurantId);

    Optional<Dish> findByRestaurant_IdAndDishName(UUID restaurantId, String dishName);
    
}

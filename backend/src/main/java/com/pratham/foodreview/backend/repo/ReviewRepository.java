package com.pratham.foodreview.backend.repo;

import com.pratham.foodreview.backend.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ReviewRepository extends JpaRepository<Review, UUID> {
  List<Review> findByUser_IdOrderByCreatedAtDesc(UUID userId);
  List<Review> findByRestaurant_IdOrderByCreatedAtDesc(UUID restaurantId);
  
  @Query("SELECT r FROM Review r WHERE r.user.id IN :userIds ORDER BY r.createdAt DESC")
  List<Review> findByUser_IdInOrderByCreatedAtDesc(@Param("userIds") List<UUID> userIds);
}

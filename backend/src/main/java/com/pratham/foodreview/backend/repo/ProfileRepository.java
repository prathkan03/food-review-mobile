package com.pratham.foodreview.backend.repo;

import com.pratham.foodreview.backend.entity.Profile;
import com.pratham.foodreview.backend.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProfileRepository extends JpaRepository<Profile, UUID> {
  Optional<Profile> findByUsername(String username);

  @Query("SELECT r FROM Review r JOIN FETCH r.user JOIN FETCH r.restaurant WHERE r.user.id = :userId ORDER BY r.createdAt DESC")
  List<Review> findReviewsByUserId(@Param("userId") UUID userId);
}

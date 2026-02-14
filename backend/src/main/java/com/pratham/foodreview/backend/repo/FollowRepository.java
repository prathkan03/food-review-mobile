package com.pratham.foodreview.backend.repo;

import com.pratham.foodreview.backend.entity.Follow;
import com.pratham.foodreview.backend.entity.FollowId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface FollowRepository extends JpaRepository<Follow, FollowId> {
  List<Follow> findByFollower_Id(UUID followerId);
  long countByFollower_Id(UUID followerId);
  long countByFollowing_Id(UUID followingId);
}

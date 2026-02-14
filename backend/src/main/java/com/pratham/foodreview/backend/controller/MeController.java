package com.pratham.foodreview.backend.controller;

import com.pratham.foodreview.backend.dto.ProfileResponse;
import com.pratham.foodreview.backend.entity.Profile;
import com.pratham.foodreview.backend.repo.FollowRepository;
import com.pratham.foodreview.backend.repo.ProfileRepository;
import com.pratham.foodreview.backend.repo.ReviewRepository;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
public class MeController {

  private final ProfileRepository profileRepository;
  private final ReviewRepository reviewRepository;
  private final FollowRepository followRepository;

  public MeController(ProfileRepository profileRepository,
                      ReviewRepository reviewRepository,
                      FollowRepository followRepository) {
    this.profileRepository = profileRepository;
    this.reviewRepository = reviewRepository;
    this.followRepository = followRepository;
  }

  @GetMapping("/me")
  public ProfileResponse me(@AuthenticationPrincipal Jwt jwt) {
    UUID userId = UUID.fromString(jwt.getSubject());
    Profile profile = profileRepository.findById(userId).orElse(null);

    long reviewCount = reviewRepository.countByUser_Id(userId);
    long followerCount = followRepository.countByFollowing_Id(userId);
    long followingCount = followRepository.countByFollower_Id(userId);

    return new ProfileResponse(
      userId.toString(),
      profile != null ? profile.getUsername() : null,
      profile != null ? profile.getDisplayName() : null,
      profile != null ? profile.getAvatarUrl() : null,
      profile != null ? profile.getBio() : null,
      reviewCount,
      followerCount,
      followingCount
    );
  }

}

package com.pratham.foodreview.backend.controller;

import com.pratham.foodreview.backend.dto.ProfileResponse;
import com.pratham.foodreview.backend.dto.UpdateProfileRequest;
import com.pratham.foodreview.backend.entity.Profile;
import com.pratham.foodreview.backend.repo.FollowRepository;
import com.pratham.foodreview.backend.repo.ProfileRepository;
import com.pratham.foodreview.backend.repo.ReviewRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.util.UUID;

@RestController
public class MeController {

  private static final Logger log = LoggerFactory.getLogger(MeController.class);

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

  @PatchMapping("/me")
  public ProfileResponse updateMe(@AuthenticationPrincipal Jwt jwt,
                                  @RequestBody UpdateProfileRequest request) {
    UUID userId = UUID.fromString(jwt.getSubject());
    Profile profile = profileRepository.findById(userId).orElseGet(() -> {
      Profile p = new Profile();
      p.setId(userId);
      p.setCreatedAt(OffsetDateTime.now());
      return p;
    });

    log.info("[PATCH /me] userId={} request: username={} displayName={} bio={}",
        userId, request.username(), request.displayName(), request.bio());

    if (request.username() != null) profile.setUsername(request.username().trim());
    if (request.displayName() != null) profile.setDisplayName(request.displayName().trim());
    if (request.bio() != null) profile.setBio(request.bio().trim());

    profileRepository.save(profile);

    log.info("[PATCH /me] saved: username={} displayName={} bio={}",
        profile.getUsername(), profile.getDisplayName(), profile.getBio());

    long reviewCount = reviewRepository.countByUser_Id(userId);
    long followerCount = followRepository.countByFollowing_Id(userId);
    long followingCount = followRepository.countByFollower_Id(userId);

    return new ProfileResponse(
      userId.toString(),
      profile.getUsername(),
      profile.getDisplayName(),
      profile.getAvatarUrl(),
      profile.getBio(),
      reviewCount,
      followerCount,
      followingCount
    );
  }

  @GetMapping("/me")
  public ProfileResponse me(@AuthenticationPrincipal Jwt jwt) {
    UUID userId = UUID.fromString(jwt.getSubject());
    Profile profile = profileRepository.findById(userId).orElse(null);

    log.info("[GET /me] userId={} profileFound={} username={} displayName={} bio={}",
        userId,
        profile != null,
        profile != null ? profile.getUsername() : "N/A",
        profile != null ? profile.getDisplayName() : "N/A",
        profile != null ? profile.getBio() : "N/A");

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

package com.pratham.foodreview.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

@Embeddable
public class FollowId implements Serializable {

  @Column(name = "follower_id", columnDefinition = "uuid")
  private UUID followerId;

  @Column(name = "following_id", columnDefinition = "uuid")
  private UUID followingId;

  public FollowId() {}

  public FollowId(UUID followerId, UUID followingId) {
    this.followerId = followerId;
    this.followingId = followingId;
  }

  public UUID getFollowerId() { return followerId; }
  public UUID getFollowingId() { return followingId; }

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;
    FollowId followId = (FollowId) o;
    return Objects.equals(followerId, followId.followerId)
        && Objects.equals(followingId, followId.followingId);
  }

  @Override
  public int hashCode() {
    return Objects.hash(followerId, followingId);
  }
}

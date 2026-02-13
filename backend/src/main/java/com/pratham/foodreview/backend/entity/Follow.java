package com.pratham.foodreview.backend.entity;

import jakarta.persistence.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "follows", schema = "public")
public class Follow {

  @EmbeddedId
  private FollowId id;

  @ManyToOne(fetch = FetchType.LAZY)
  @MapsId("followerId")
  @JoinColumn(name = "follower_id", nullable = false)
  private Profile follower;

  @ManyToOne(fetch = FetchType.LAZY)
  @MapsId("followingId")
  @JoinColumn(name = "following_id", nullable = false)
  private Profile following;

  @Column(name = "created_at")
  private OffsetDateTime createdAt;

  public FollowId getId() { return id; }
  public void setId(FollowId id) { this.id = id; }

  public Profile getFollower() { return follower; }
  public void setFollower(Profile follower) { this.follower = follower; }

  public Profile getFollowing() { return following; }
  public void setFollowing(Profile following) { this.following = following; }

  public OffsetDateTime getCreatedAt() { return createdAt; }
  public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}

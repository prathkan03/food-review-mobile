import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../src/components/services/supabase";
import { router } from "expo-router";

interface ProfileData {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  reviewCount: number;
  followerCount: number;
  followingCount: number;
}

interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  restaurantId: string;
  restaurantName: string;
  restaurantAddress: string;
  rating: number;
  text: string;
  photoUrls?: string[];
  items?: string[];
  createdAt: string;
}

type TabName = "Reviews" | "Photos" | "Bookmarks";

export default function ProfileTab() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabName>("Reviews");

  const fetchProfile = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      const res = await fetch("http://localhost:8080/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setProfile(await res.json());
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  }, []);

  const fetchMyReviews = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      const res = await fetch("http://localhost:8080/reviews/my-reviews", {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("GET /reviews/my-reviews status:", res.status);
      if (res.ok) {
        const reviewData = await res.json();
        console.log("My reviews response:", JSON.stringify(reviewData, null, 2));
        console.log("Total reviews returned:", reviewData.length);
        setReviews(reviewData);
      } else {
        const errorText = await res.text();
        console.error("Failed to fetch my reviews:", res.status, errorText);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  }, []);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      await Promise.all([fetchProfile(), fetchMyReviews()]);
      setLoading(false);
    }
    loadData();
  }, [fetchProfile, fetchMyReviews]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchProfile(), fetchMyReviews()]);
    setRefreshing(false);
  };

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffWeeks = Math.floor(diffDays / 7);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffWeeks === 1) return "1 week ago";
    if (diffWeeks < 5) return `${diffWeeks} weeks ago`;
    return date.toLocaleDateString();
  };

  const formatCount = (n: number): string => {
    if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
    return n.toString();
  };

  const handleReviewPress = (review: Review) => {
    router.push({
      pathname: "/reviews/[id]",
      params: { id: review.id },
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderReviewCard = ({ item }: { item: Review }) => (
    <Pressable style={styles.reviewCard} onPress={() => handleReviewPress(item)}>
      {/* Restaurant name + ellipsis */}
      <View style={styles.reviewCardHeader}>
        <Text style={styles.reviewRestaurantName}>{item.restaurantName}</Text>
        <Pressable hitSlop={8}>
          <Ionicons name="ellipsis-horizontal" size={18} color="#999" />
        </Pressable>
      </View>

      {/* Star rating + score + time */}
      <View style={styles.ratingRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= item.rating ? "star" : "star-outline"}
            size={13}
            color={star <= item.rating ? "#FF6B35" : "#CCC"}
          />
        ))}
        <Text style={styles.ratingScore}>{item.rating.toFixed(1)}</Text>
        <Text style={styles.dotSeparator}>{" \u00B7 "}</Text>
        <Text style={styles.reviewTime}>{formatDate(item.createdAt)}</Text>
      </View>

      {/* Review text */}
      {item.text ? (
        <Text style={styles.reviewText} numberOfLines={3}>
          {item.text}
        </Text>
      ) : null}

      {/* Photo thumbnails */}
      {item.photoUrls && item.photoUrls.length > 0 ? (
        <View style={styles.photoRow}>
          {item.photoUrls.slice(0, 3).map((url, index) => (
            <Image key={index} source={{ uri: url }} style={styles.photoThumb} />
          ))}
        </View>
      ) : null}

      {/* Likes + Comments */}
      <View style={styles.reviewActions}>
        <View style={styles.actionItem}>
          <Ionicons name="heart-outline" size={15} color="#999" />
          <Text style={styles.actionText}>24 LIKES</Text>
        </View>
        <View style={styles.actionItem}>
          <Ionicons name="chatbubble-outline" size={14} color="#999" />
          <Text style={styles.actionText}>8 COMMENTS</Text>
        </View>
      </View>
    </Pressable>
  );

  const renderProfileHeader = () => (
    <View>
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarRing}>
          {profile?.avatarUrl ? (
            <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={36} color="#999" />
            </View>
          )}
        </View>
        <Pressable style={styles.followButton}>
          <Text style={styles.followButtonText}>Follow</Text>
        </Pressable>
      </View>

      {/* Name + Username */}
      <View style={styles.nameSection}>
        {profile?.displayName ? (
          <Text style={styles.displayName}>{profile.displayName}</Text>
        ) : null}
        {profile?.username ? (
          <Text style={styles.username}>@{profile.username}</Text>
        ) : null}
      </View>

      {/* Bio */}
      {profile?.bio ? (
        <Text style={styles.bio}>{profile.bio}</Text>
      ) : null}

      {/* Stats Card */}
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{formatCount(profile?.reviewCount ?? 0)}</Text>
          <Text style={styles.statLabel}>REVIEWS</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{formatCount(profile?.followerCount ?? 0)}</Text>
          <Text style={styles.statLabel}>FOLLOWERS</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{formatCount(profile?.followingCount ?? 0)}</Text>
          <Text style={styles.statLabel}>FOLLOWING</Text>
        </View>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {(["Reviews", "Photos", "Bookmarks"] as TabName[]).map((tab) => (
          <Pressable
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  const renderTabPlaceholder = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name={activeTab === "Photos" ? "images-outline" : "bookmark-outline"}
        size={48}
        color="#CCC"
      />
      <Text style={styles.emptyText}>{activeTab} coming soon</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
        </Pressable>
        <Text style={styles.headerTitle}>Profile</Text>
        <Pressable onPress={handleLogout} hitSlop={8}>
          <Ionicons name="settings-outline" size={22} color="#1A1A1A" />
        </Pressable>
      </View>

      {activeTab === "Reviews" ? (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id}
          renderItem={renderReviewCard}
          ListHeaderComponent={renderProfileHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B35" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="restaurant-outline" size={48} color="#CCC" />
              <Text style={styles.emptyText}>No reviews yet</Text>
              <Text style={styles.emptySubtext}>Start reviewing restaurants!</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={[]}
          keyExtractor={() => "placeholder"}
          renderItem={() => null}
          ListHeaderComponent={renderProfileHeader}
          ListEmptyComponent={renderTabPlaceholder}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B35" />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F4F0",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#999",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: "#F8F4F0",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  listContent: {
    paddingBottom: 30,
  },

  /* ---- Profile Section ---- */
  avatarSection: {
    alignItems: "center",
    marginTop: 12,
    backgroundColor: "#F8F4F0",
  },
  avatarRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: "#FF6B35",
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
  },
  avatarPlaceholder: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "#E8E0D8",
    alignItems: "center",
    justifyContent: "center",
  },
  followButton: {
    backgroundColor: "#FF6B35",
    paddingHorizontal: 36,
    paddingVertical: 9,
    borderRadius: 24,
    marginTop: 12,
  },
  followButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
  },
  nameSection: {
    alignItems: "center",
    marginTop: 12,
    backgroundColor: "#F8F4F0",
  },
  displayName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  username: {
    fontSize: 14,
    color: "#999",
    marginTop: 2,
  },
  bio: {
    fontSize: 13,
    color: "#666",
    lineHeight: 19,
    textAlign: "center",
    paddingHorizontal: 32,
    marginTop: 8,
    backgroundColor: "#F8F4F0",
  },

  /* ---- Stats Card ---- */
  statsCard: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1A1A1A",
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#999",
    marginTop: 2,
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: "#E8E8E8",
    alignSelf: "center",
  },

  /* ---- Tab Bar ---- */
  tabBar: {
    flexDirection: "row",
    marginTop: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#E8E0D8",
    backgroundColor: "#F8F4F0",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#FF6B35",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#999",
  },
  activeTabText: {
    color: "#FF6B35",
    fontWeight: "600",
  },

  /* ---- Review Cards ---- */
  reviewCard: {
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFF",
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  reviewCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reviewRestaurantName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A1A",
    flex: 1,
    marginRight: 8,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  ratingScore: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1A1A1A",
    marginLeft: 6,
  },
  dotSeparator: {
    fontSize: 13,
    color: "#999",
  },
  reviewTime: {
    fontSize: 13,
    color: "#999",
  },
  reviewText: {
    fontSize: 14,
    color: "#444",
    lineHeight: 20,
    marginTop: 10,
  },
  photoRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  photoThumb: {
    width: 90,
    height: 90,
    borderRadius: 10,
  },
  reviewActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    marginTop: 12,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  actionText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#999",
    letterSpacing: 0.3,
  },

  /* ---- Empty State ---- */
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginTop: 12,
    fontWeight: "500",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 4,
  },
});

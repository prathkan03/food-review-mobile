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
        const profileData = await res.json();
        setProfile(profileData);
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

      if (res.ok) {
        const reviewData = await res.json();
        setReviews(reviewData);
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
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
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
      <View style={styles.reviewCardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.reviewRestaurantName}>{item.restaurantName}</Text>
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons
                key={star}
                name={star <= item.rating ? "star" : "star-outline"}
                size={14}
                color="#FF6B35"
              />
            ))}
            <Text style={styles.ratingScore}>{item.rating.toFixed(1)}</Text>
            <Text style={styles.reviewTime}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
      </View>

      {item.text ? (
        <Text style={styles.reviewText} numberOfLines={3}>
          {item.text}
        </Text>
      ) : null}

      {item.photoUrls && item.photoUrls.length > 0 ? (
        <View style={styles.photoRow}>
          {item.photoUrls.slice(0, 3).map((url, index) => (
            <Image key={index} source={{ uri: url }} style={styles.photoThumb} />
          ))}
        </View>
      ) : null}

      <View style={styles.reviewActions}>
        <View style={styles.actionLeft}>
          <View style={styles.actionItem}>
            <Ionicons name="heart-outline" size={16} color="#999" />
            <Text style={styles.actionCount}>0</Text>
          </View>
          <View style={styles.actionItem}>
            <Ionicons name="chatbubble-outline" size={16} color="#999" />
            <Text style={styles.actionCount}>0</Text>
          </View>
        </View>
        <Ionicons name="bookmark-outline" size={16} color="#999" />
      </View>
    </Pressable>
  );

  const renderTabContent = () => {
    if (activeTab === "Reviews") {
      return (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id}
          renderItem={renderReviewCard}
          contentContainerStyle={styles.reviewsList}
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
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name={activeTab === "Photos" ? "images-outline" : "bookmark-outline"}
          size={48}
          color="#CCC"
        />
        <Text style={styles.emptyText}>{activeTab} coming soon</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
        </Pressable>
        <Text style={styles.headerTitle}>Profile</Text>
        <Pressable onPress={handleLogout}>
          <Ionicons name="settings-outline" size={24} color="#1A1A1A" />
        </Pressable>
      </View>

      {/* Avatar */}
      <View style={styles.avatarSection}>
        {profile?.avatarUrl ? (
          <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={36} color="#999" />
          </View>
        )}
      </View>

      {/* Follow Button */}
      <View style={styles.followButtonContainer}>
        <Pressable style={styles.followButton}>
          <Text style={styles.followButtonText}>Follow</Text>
        </Pressable>
      </View>

      {/* Name + Username */}
      <View style={styles.nameSection}>
        <Text style={styles.displayName}>
          {profile?.displayName || profile?.username || "User"}
        </Text>
        {profile?.username ? (
          <Text style={styles.username}>@{profile.username}</Text>
        ) : null}
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{profile?.reviewCount ?? 0}</Text>
          <Text style={styles.statLabel}>Reviews</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{profile?.followerCount ?? 0}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{profile?.followingCount ?? 0}</Text>
          <Text style={styles.statLabel}>Following</Text>
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

      {/* Tab Content */}
      <View style={styles.tabContent}>{renderTabContent()}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
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
    paddingTop: 12,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  avatarSection: {
    alignItems: "center",
    marginTop: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
  },
  followButtonContainer: {
    alignItems: "center",
    marginTop: 12,
  },
  followButton: {
    backgroundColor: "#FF6B35",
    paddingHorizontal: 32,
    paddingVertical: 8,
    borderRadius: 20,
  },
  followButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  nameSection: {
    alignItems: "center",
    marginTop: 12,
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
  statsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    paddingHorizontal: 40,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  statLabel: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: "#E0E0E0",
  },
  tabBar: {
    flexDirection: "row",
    marginTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
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
  tabContent: {
    flex: 1,
  },
  reviewsList: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  reviewCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  reviewCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  reviewRestaurantName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  ratingScore: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FF6B35",
    marginLeft: 6,
  },
  reviewTime: {
    fontSize: 12,
    color: "#999",
    marginLeft: 8,
  },
  reviewText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginTop: 8,
  },
  photoRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  photoThumb: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  reviewActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F5F5F5",
  },
  actionLeft: {
    flexDirection: "row",
    gap: 16,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionCount: {
    fontSize: 12,
    color: "#999",
  },
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

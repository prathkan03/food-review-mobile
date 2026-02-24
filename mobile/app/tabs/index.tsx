import { useState, useEffect } from "react";
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
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../src/components/services/supabase";
import { router } from "expo-router";

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

const STORY_USERS = [
  { id: "1", name: "You", avatar: "", isYou: true },
  { id: "2", name: "Sarah J.", avatar: "https://i.pravatar.cc/150?img=1" },
  { id: "3", name: "Mark T.", avatar: "https://i.pravatar.cc/150?img=3" },
  { id: "4", name: "Alex L.", avatar: "https://i.pravatar.cc/150?img=12" },
  { id: "5", name: "Elena", avatar: "https://i.pravatar.cc/150?img=9" },
];

export default function HomeTab() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchFriendsReviews();
  }, []);

  const fetchFriendsReviews = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8080";
      const res = await fetch(`${API_URL}/reviews/feed`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setReviews(await res.json());
      }
    } catch (error) {
      console.error("Error fetching feed:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchFriendsReviews();
  };

  const handleReviewPress = (review: Review) => {
    router.push({ pathname: "/reviews/[id]", params: { id: review.id } });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "JUST NOW";
    if (diffMins < 60) return `${diffMins} MINUTES AGO`;
    if (diffHours < 24) return `${diffHours} HOUR${diffHours > 1 ? "S" : ""} AGO`;
    if (diffDays === 1) return "1 DAY AGO";
    if (diffDays < 7) return `${diffDays} DAYS AGO`;
    return date.toLocaleDateString().toUpperCase();
  };

  const renderReviewCard = ({ item }: { item: Review }) => (
    <Pressable style={styles.reviewCard} onPress={() => handleReviewPress(item)}>
      {/* User Header */}
      <View style={styles.reviewHeader}>
        <View style={styles.userInfo}>
          {item.userAvatar ? (
            <Image source={{ uri: item.userAvatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={18} color="#999" />
            </View>
          )}
          <View>
            <Text style={styles.userName}>{item.userName}</Text>
            <Text style={styles.reviewDate}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
        <Pressable hitSlop={8}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#999" />
        </Pressable>
      </View>

      {/* Restaurant */}
      <Text style={styles.restaurantName}>{item.restaurantName}</Text>
      <View style={styles.locationRow}>
        <Ionicons name="location-outline" size={13} color="#999" />
        <Text style={styles.restaurantAddress} numberOfLines={1}>
          {item.restaurantAddress}
        </Text>
      </View>

      {/* Image */}
      <View style={styles.imageContainer}>
        {item.photoUrls && item.photoUrls.length > 0 ? (
          <Image
            source={{ uri: item.photoUrls[0] }}
            style={styles.foodImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={48} color="#CCC" />
          </View>
        )}
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingBadgeText}>{item.rating.toFixed(1)}</Text>
          <Ionicons name="star" size={12} color="#FFF" />
        </View>
        {/* Dots indicator */}
        <View style={styles.dotsRow}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.dot, i === 0 && styles.dotActive]} />
          ))}
        </View>
      </View>

      {/* Tags */}
      {item.items && item.items.length > 0 && (
        <View style={styles.tagsRow}>
          {item.items.slice(0, 3).map((foodItem, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{foodItem}</Text>
              <Text style={styles.tagRating}>{item.rating.toFixed(1)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Review Text */}
      {item.text ? (
        <View style={styles.reviewTextBox}>
          <Text style={styles.reviewText} numberOfLines={3}>
            <Text style={styles.reviewAuthor}>{item.userName.split(" ")[0]}: </Text>
            {item.text}
            {"  "}
            <Text style={styles.moreText}>more</Text>
          </Text>
        </View>
      ) : null}

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <View style={styles.actionLeft}>
          <Pressable style={styles.actionButton}>
            <Ionicons name="heart" size={22} color="#E53935" />
            <Text style={styles.actionText}>128</Text>
          </Pressable>
          <Pressable style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={20} color="#666" />
            <Text style={styles.actionText}>14</Text>
          </Pressable>
          <Pressable style={styles.actionButton}>
            <Ionicons name="share-social-outline" size={20} color="#666" />
          </Pressable>
        </View>
        <Pressable>
          <Ionicons name="bookmark-outline" size={22} color="#FF6B35" />
        </Pressable>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logo}>
            <Ionicons name="restaurant" size={18} color="#FFF" />
          </View>
          <Text style={styles.title}>Gourmet</Text>
        </View>
        <View style={styles.headerRight}>
          <Pressable style={styles.iconButton} onPress={() => router.push("/find-foodies")}>
            <Ionicons name="search" size={20} color="#FF6B35" />
          </Pressable>
          <Pressable style={styles.iconButton}>
            <Ionicons name="notifications" size={20} color="#FF6B35" />
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Loading feed...</Text>
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B35" />
          }
          ListHeaderComponent={
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.storiesContainer}
              contentContainerStyle={styles.storiesContent}
            >
              {STORY_USERS.map((user) => (
                <Pressable key={user.id} style={styles.storyItem}>
                  <View style={[styles.storyRing, user.isYou && styles.storyRingYou]}>
                    {user.isYou ? (
                      <View style={styles.youAvatar}>
                        <Ionicons name="restaurant" size={22} color="#FF6B35" />
                      </View>
                    ) : (
                      <Image source={{ uri: user.avatar }} style={styles.storyAvatar} />
                    )}
                  </View>
                  <Text style={styles.storyName}>{user.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="restaurant-outline" size={48} color="#CCC" />
              <Text style={styles.emptyText}>No reviews yet</Text>
              <Text style={styles.emptySubtext}>Follow friends to see their reviews</Text>
            </View>
          }
          renderItem={renderReviewCard}
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

  /* ---- Header ---- */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: "#F8F4F0",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#FF6B35",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1A1A1A",
  },
  headerRight: {
    flexDirection: "row",
    gap: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF0E8",
    justifyContent: "center",
    alignItems: "center",
  },

  /* ---- Stories ---- */
  storiesContainer: {
    backgroundColor: "#F8F4F0",
  },
  storiesContent: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 16,
  },
  storyItem: {
    alignItems: "center",
    marginRight: 4,
  },
  storyRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2.5,
    borderColor: "#FF6B35",
    padding: 2,
    marginBottom: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  storyRingYou: {
    borderColor: "#FF6B35",
    borderStyle: "dashed",
  },
  youAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#FFF0E8",
    justifyContent: "center",
    alignItems: "center",
  },
  storyAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  storyName: {
    fontSize: 11,
    color: "#555",
    fontWeight: "500",
  },

  /* ---- Loading / Empty ---- */
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
  listContainer: {
    paddingBottom: 24,
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

  /* ---- Review Card ---- */
  reviewCard: {
    backgroundColor: "#FFF",
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  avatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
  },
  userName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  reviewDate: {
    fontSize: 10,
    fontWeight: "600",
    color: "#AAAAAA",
    marginTop: 1,
    letterSpacing: 0.3,
  },
  restaurantName: {
    fontSize: 19,
    fontWeight: "800",
    color: "#FF6B35",
    paddingHorizontal: 16,
    marginBottom: 3,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 10,
    gap: 3,
  },
  restaurantAddress: {
    fontSize: 13,
    color: "#999",
    flex: 1,
  },

  /* ---- Image ---- */
  imageContainer: {
    width: "100%",
    height: 300,
    position: "relative",
  },
  foodImage: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F0EBE5",
    justifyContent: "center",
    alignItems: "center",
  },
  ratingBadge: {
    position: "absolute",
    top: 14,
    right: 14,
    backgroundColor: "#FF6B35",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  ratingBadgeText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
  },
  dotsRow: {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  dotActive: {
    backgroundColor: "#FFF",
  },

  /* ---- Tags ---- */
  tagsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
    flexWrap: "wrap",
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E8E8E8",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  tagText: {
    fontSize: 13,
    color: "#1A1A1A",
    fontWeight: "600",
  },
  tagRating: {
    fontSize: 12,
    color: "#FF6B35",
    fontWeight: "700",
  },

  /* ---- Review Text ---- */
  reviewTextBox: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: "#F8F4F0",
    borderRadius: 10,
    padding: 12,
  },
  reviewText: {
    fontSize: 14,
    color: "#444",
    lineHeight: 20,
  },
  reviewAuthor: {
    fontWeight: "700",
    color: "#1A1A1A",
  },
  moreText: {
    color: "#FF6B35",
    fontWeight: "600",
  },

  /* ---- Action Bar ---- */
  actionBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
  },
  actionLeft: {
    flexDirection: "row",
    gap: 18,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  actionText: {
    fontSize: 14,
    color: "#444",
    fontWeight: "600",
  },
});

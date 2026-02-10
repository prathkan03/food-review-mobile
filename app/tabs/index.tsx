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
  { id: '1', name: 'You', avatar: '', isYou: true },
  { id: '2', name: 'Sarah J.', avatar: 'https://i.pravatar.cc/150?img=1' },
  { id: '3', name: 'Mark T.', avatar: 'https://i.pravatar.cc/150?img=3' },
  { id: '4', name: 'Anna L.', avatar: 'https://i.pravatar.cc/150?img=5' },
  { id: '5', name: 'Emily R.', avatar: 'https://i.pravatar.cc/150?img=9' },
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

      const res = await fetch(
        `http://localhost:8080/reviews/feed`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.ok) {
        const feedData = await res.json();
        setReviews(feedData);
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
    router.push({
      pathname: "/reviews/[id]",
      params: { id: review.id },
    });
  };


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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logo}>
            <Ionicons name="restaurant" size={20} color="#FFF" />
          </View>
          <Text style={styles.title}>Gourmet</Text>
        </View>
        <View style={styles.headerRight}>
          <Pressable style={styles.iconButton}>
            <Ionicons name="search-outline" size={24} color="#FF6B35" />
          </Pressable>
          <Pressable style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={24} color="#FF6B35" />
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
            <View>
              {/* Stories */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.storiesContainer}>
                {STORY_USERS.map((user) => (
                  <Pressable key={user.id} style={styles.storyItem}>
                    {user.isYou ? (
                      <View style={styles.addStoryCircle}>
                        <Ionicons name="add" size={24} color="#FF6B35" />
                      </View>
                    ) : (
                      <View style={styles.storyCircle}>
                        <Image source={{ uri: user.avatar }} style={styles.storyAvatar} />
                      </View>
                    )}
                    <Text style={styles.storyName}>{user.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="restaurant-outline" size={48} color="#CCC" />
              <Text style={styles.emptyText}>No reviews yet</Text>
              <Text style={styles.emptySubtext}>Follow friends to see their reviews</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.reviewCard}
              onPress={() => handleReviewPress(item)}
            >
              {/* User Header */}
              <View style={styles.reviewHeader}>
                <View style={styles.userInfo}>
                  {item.userAvatar ? (
                    <Image source={{ uri: item.userAvatar }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Ionicons name="person" size={20} color="#999" />
                    </View>
                  )}
                  <View style={styles.userDetails}>
                    <Text style={styles.userName}>{item.userName}</Text>
                    <Text style={styles.reviewDate}>{formatDate(item.createdAt)}</Text>
                  </View>
                </View>
                <Pressable>
                  <Ionicons name="ellipsis-horizontal" size={20} color="#999" />
                </Pressable>
              </View>

              {/* Restaurant Name */}
              <Text style={styles.restaurantName}>{item.restaurantName}</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={14} color="#999" />
                <Text style={styles.restaurantAddress} numberOfLines={1}>
                  {item.restaurantAddress}
                </Text>
              </View>

              {/* Food Image */}
              {item.photoUrls && item.photoUrls.length > 0 ? (
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: item.photoUrls[0] }}
                    style={styles.foodImage}
                    resizeMode="cover"
                  />
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={14} color="#FFF" />
                    <Text style={styles.ratingBadgeText}>{item.rating.toFixed(1)}</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="image-outline" size={48} color="#CCC" />
                </View>
              )}

              {/* Food Items Tags */}
              {item.items && item.items.length > 0 && (
                <View style={styles.tagsRow}>
                  {item.items.slice(0, 2).map((foodItem, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{foodItem}</Text>
                      <Text style={styles.tagRating}>{item.rating.toFixed(1)}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Review Text */}
              {item.text && (
                <Text style={styles.reviewText} numberOfLines={3}>
                  <Text style={styles.reviewAuthor}>{item.userName.split(' ')[0]}: </Text>
                  {item.text}
                </Text>
              )}

              {/* Action Bar */}
              <View style={styles.actionBar}>
                <View style={styles.actionLeft}>
                  <Pressable style={styles.actionButton}>
                    <Ionicons name="heart-outline" size={20} color="#FF6B35" />
                    <Text style={styles.actionText}>84</Text>
                  </Pressable>
                  <Pressable style={styles.actionButton}>
                    <Ionicons name="chatbubble-outline" size={20} color="#666" />
                    <Text style={styles.actionText}>34</Text>
                  </Pressable>
                  <Pressable style={styles.actionButton}>
                    <Ionicons name="share-social-outline" size={20} color="#666" />
                  </Pressable>
                </View>
                <Pressable>
                  <Ionicons name="bookmark-outline" size={20} color="#FF6B35" />
                </Pressable>
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: "#FFF",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#FF6B35",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  headerRight: {
    flexDirection: "row",
    gap: 12,
  },
  iconButton: {
    padding: 4,
  },
  storiesContainer: {
    paddingVertical: 16,
    paddingLeft: 16,
  },
  storyItem: {
    alignItems: "center",
    marginRight: 16,
  },
  storyCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 3,
    borderWidth: 2,
    borderColor: "#FF6B35",
    marginBottom: 6,
  },
  addStoryCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  storyAvatar: {
    width: "100%",
    height: "100%",
    borderRadius: 28,
  },
  storyName: {
    fontSize: 12,
    color: "#333",
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
  listContainer: {
    paddingBottom: 20,
  },
  reviewCard: {
    backgroundColor: "#FFF",
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingBottom: 12,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  reviewDate: {
    fontSize: 11,
    color: "#999",
    marginTop: 2,
  },
  restaurantName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FF6B35",
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 4,
  },
  restaurantAddress: {
    fontSize: 13,
    color: "#999",
    flex: 1,
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 280,
  },
  foodImage: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    width: "100%",
    height: 280,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  ratingBadge: {
    position: "absolute",
    top: 12,
    right: 12,
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
  tagsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  tagText: {
    fontSize: 13,
    color: "#333",
    fontWeight: "500",
  },
  tagRating: {
    fontSize: 12,
    color: "#FF6B35",
    fontWeight: "600",
  },
  reviewText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  reviewAuthor: {
    fontWeight: "600",
    color: "#1A1A1A",
  },
  actionBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  actionLeft: {
    flexDirection: "row",
    gap: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
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

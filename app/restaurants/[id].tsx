import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Image,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";

interface ReviewData {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  text: string;
  photoUrls?: string[];
  items?: string[];
  createdAt: string;
}

interface RestaurantDetail {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  photoUrl?: string;
  categories?: string[];
  priceTier?: number;
  reviewCount: number;
  reviews: ReviewData[];
}

export default function RestaurantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [restaurant, setRestaurant] = useState<RestaurantDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRestaurant();
  }, [id]);

  const fetchRestaurant = async () => {
    try {
      const res = await fetch(`http://localhost:8080/restaurants/${id}`);
      if (res.ok) {
        setRestaurant(await res.json());
      }
    } catch (error) {
      console.error("Error fetching restaurant:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    const diffWeeks = Math.floor(diffDays / 7);

    if (diffDays === 0) return "TODAY";
    if (diffDays === 1) return "1 DAY AGO";
    if (diffDays < 7) return `${diffDays} DAYS AGO`;
    if (diffWeeks === 1) return "1 WEEK AGO";
    if (diffWeeks < 5) return `${diffWeeks} WEEKS AGO`;
    return date.toLocaleDateString().toUpperCase();
  };

  const handleDirections = () => {
    if (!restaurant) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${restaurant.lat},${restaurant.lng}`;
    Linking.openURL(url);
  };

  const extractTags = (text?: string): string[] => {
    if (!text) return [];
    const words = text.split(/\s+/);
    const tags: string[] = [];
    for (const word of words) {
      if (word.length > 4 && word.length < 15 && tags.length < 3) {
        const clean = word.replace(/[^a-zA-Z]/g, "");
        if (clean.length > 3) tags.push(clean);
      }
    }
    return tags;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  if (!restaurant) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: "#999" }}>Restaurant not found</Text>
      </View>
    );
  }

  // Collect all photo URLs from reviews for "Popular Dishes"
  const allPhotos: { url: string; reviewText?: string }[] = [];
  restaurant.reviews.forEach((r) => {
    if (r.photoUrls) {
      r.photoUrls.forEach((url) => {
        allPhotos.push({ url, reviewText: r.text });
      });
    }
  });

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          {restaurant.photoUrl ? (
            <Image
              source={{ uri: restaurant.photoUrl }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Ionicons name="restaurant" size={60} color="#DDD" />
            </View>
          )}
          {/* Overlay buttons */}
          <View style={styles.heroOverlay}>
            <Pressable style={styles.heroButton} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={22} color="#FFF" />
            </Pressable>
            <View style={styles.heroRight}>
              <Pressable style={styles.heroButton}>
                <Ionicons name="heart-outline" size={20} color="#FFF" />
              </Pressable>
              <Pressable style={styles.heroButton}>
                <Ionicons name="share-outline" size={20} color="#FFF" />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Restaurant Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.nameRow}>
            <Text style={styles.restaurantName}>{restaurant.name}</Text>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color="#FF6B35" />
              <Text style={styles.ratingText}>
                {restaurant.reviewCount > 0 ? "4.8" : "New"}
              </Text>
            </View>
          </View>

          {restaurant.categories && restaurant.categories.length > 0 ? (
            <Text style={styles.description}>
              {restaurant.categories.join(" • ")}
            </Text>
          ) : (
            <Text style={styles.description}>{restaurant.address}</Text>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Pressable style={styles.actionButton} onPress={handleDirections}>
              <View style={styles.actionIconCircle}>
                <Ionicons name="navigate" size={18} color="#FF6B35" />
              </View>
              <Text style={styles.actionButtonText}>DIRECTIONS</Text>
            </Pressable>
            <Pressable style={styles.actionButton}>
              <View style={styles.actionIconCircle}>
                <Ionicons name="call" size={18} color="#FF6B35" />
              </View>
              <Text style={styles.actionButtonText}>CALL</Text>
            </Pressable>
            <Pressable style={styles.actionButton}>
              <View style={styles.actionIconCircle}>
                <Ionicons name="bookmark" size={18} color="#FF6B35" />
              </View>
              <Text style={styles.actionButtonText}>FAVORITE</Text>
            </Pressable>
          </View>
        </View>

        {/* Popular Dishes */}
        {allPhotos.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Popular Dishes</Text>
              <Pressable>
                <Text style={styles.viewAllText}>View All</Text>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dishesScroll}
            >
              {allPhotos.slice(0, 6).map((photo, index) => (
                <View key={index} style={styles.dishCard}>
                  <Image
                    source={{ uri: photo.url }}
                    style={styles.dishImage}
                    resizeMode="cover"
                  />
                  {restaurant.reviews[0]?.rating && (
                    <View style={styles.dishRatingBadge}>
                      <Ionicons name="star" size={9} color="#FFF" />
                      <Text style={styles.dishRatingText}>
                        {restaurant.reviews[index % restaurant.reviews.length]?.rating.toFixed(1)}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.dishName} numberOfLines={1}>
                    {photo.reviewText
                      ? photo.reviewText.split(" ").slice(0, 3).join(" ")
                      : `Dish ${index + 1}`}
                  </Text>
                  <Text style={styles.dishDesc} numberOfLines={1}>
                    {restaurant.categories?.[0] || "Chef's Special"}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Recent Reviews */}
        {restaurant.reviews.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Reviews</Text>
            {restaurant.reviews.map((review) => {
              const tags = extractTags(review.text);
              return (
                <View key={review.id} style={styles.reviewCard}>
                  {/* User info */}
                  <View style={styles.reviewUser}>
                    {review.userAvatar ? (
                      <Image
                        source={{ uri: review.userAvatar }}
                        style={styles.reviewAvatar}
                      />
                    ) : (
                      <View style={styles.reviewAvatarPlaceholder}>
                        <Ionicons name="person" size={18} color="#999" />
                      </View>
                    )}
                    <View>
                      <Text style={styles.reviewUserName}>
                        {review.userName || "Anonymous"}
                      </Text>
                      <Text style={styles.reviewDate}>
                        {formatDate(review.createdAt)}
                      </Text>
                    </View>
                  </View>

                  {/* Review text */}
                  {review.text ? (
                    <Text style={styles.reviewText}>"{review.text}"</Text>
                  ) : null}

                  {/* Tags */}
                  {tags.length > 0 && (
                    <View style={styles.tagRow}>
                      {tags.map((tag, i) => (
                        <View key={i} style={styles.tag}>
                          <Text style={styles.tagText}>#{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map-outline" size={48} color="#DDD" />
          </View>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={16} color="#FF6B35" />
            <Text style={styles.locationText}>{restaurant.address}</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
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
    backgroundColor: "#FFF",
  },

  /* ---- Hero ---- */
  heroContainer: {
    width: "100%",
    height: 280,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  heroOverlay: {
    position: "absolute",
    top: 54,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroRight: {
    flexDirection: "row",
    gap: 10,
  },
  heroButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },

  /* ---- Info Card ---- */
  infoCard: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
  },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  restaurantName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1A1A1A",
    flex: 1,
    marginRight: 12,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FF6B35",
  },
  description: {
    fontSize: 14,
    color: "#888",
    lineHeight: 20,
    marginTop: 8,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "flex-start",
    gap: 12,
    marginTop: 20,
  },
  actionButton: {
    alignItems: "center",
    gap: 6,
  },
  actionIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#FF6B35",
    justifyContent: "center",
    alignItems: "center",
  },
  actionButtonText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#1A1A1A",
    letterSpacing: 0.3,
  },

  /* ---- Sections ---- */
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: "#FF6B35",
    fontWeight: "600",
    marginBottom: 16,
  },

  /* ---- Popular Dishes ---- */
  dishesScroll: {
    gap: 12,
  },
  dishCard: {
    width: 150,
  },
  dishImage: {
    width: 150,
    height: 110,
    borderRadius: 12,
  },
  dishRatingBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#FF6B35",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  dishRatingText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "700",
  },
  dishName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
    marginTop: 8,
  },
  dishDesc: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },

  /* ---- Reviews ---- */
  reviewCard: {
    marginBottom: 20,
    paddingLeft: 16,
    borderLeftWidth: 2,
    borderLeftColor: "#F0F0F0",
  },
  reviewUser: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  reviewAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  reviewUserName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  reviewDate: {
    fontSize: 11,
    color: "#999",
    fontWeight: "500",
    marginTop: 1,
  },
  reviewText: {
    fontSize: 14,
    color: "#444",
    lineHeight: 20,
    fontStyle: "italic",
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },
  tag: {
    backgroundColor: "#FFF5F0",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: "#FF6B35",
    fontWeight: "600",
  },

  /* ---- Location ---- */
  mapPlaceholder: {
    width: "100%",
    height: 140,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  locationText: {
    fontSize: 13,
    color: "#666",
    flex: 1,
  },
});

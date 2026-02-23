import { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  SafeAreaView,
  ScrollView,
  Image,
  ActivityIndicator,
  StyleSheet,
  FlatList,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../src/components/services/supabase";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PHOTO_SIZE = SCREEN_WIDTH * 0.55;

interface ReviewData {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  restaurantId: string;
  restaurantName: string;
  restaurantAddress: string;
  restaurantPhotoUrl: string | null;
  restaurantProviderId: string | null;
  rating: number;
  text: string;
  photoUrls: string[] | null;
  items: string[];
  createdAt: string;
}

function StarRow({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= rating ? "star" : "star-outline"}
          size={size}
          color="#FF6B35"
        />
      ))}
    </View>
  );
}

export default function ReviewDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [review, setReview] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReview();
  }, [id]);

  const fetchReview = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const API_URL =
        process.env.EXPO_PUBLIC_API_URL || "http://localhost:8080";

      const res = await fetch(`${API_URL}/reviewfeed/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const reviewData = await res.json();
        setReview(reviewData);
      }
    } catch (error) {
      console.error("Error fetching review:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#FF6B35" />
        </View>
      </SafeAreaView>
    );
  }

  if (!review) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={{ color: "#999" }}>Review not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const photos = review.photoUrls ?? [];
  const maxVisible = 4;
  const extraCount = photos.length - maxVisible;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={26} color="#FF6B35" />
        </Pressable>
        <View style={{ marginLeft: 12 }}>
          <Text style={styles.headerTitle}>REVIEW DETAILS</Text>
          <Text style={styles.headerDate}>
            Visited {formatDate(review.createdAt)}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Restaurant Card */}
        <View style={styles.card}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {review.restaurantPhotoUrl ? (
              <Image
                source={{ uri: review.restaurantPhotoUrl }}
                style={styles.restaurantPhoto}
              />
            ) : (
              <View style={[styles.restaurantPhoto, styles.restaurantPhotoFallback]}>
                <Ionicons name="restaurant" size={28} color="#FF6B35" />
              </View>
            )}
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.restaurantName}>{review.restaurantName}</Text>
              <StarRow rating={review.rating} size={18} />
              {review.restaurantAddress ? (
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                  <Ionicons name="location-sharp" size={14} color="#999" />
                  <Text style={styles.restaurantAddress} numberOfLines={2}>
                    {review.restaurantAddress}
                  </Text>
                </View>
              ) : null}
            </View>
            <View style={styles.totalBadge}>
              <Text style={styles.totalBadgeText}>TOTAL</Text>
            </View>
          </View>
        </View>

        {/* Photos */}
        {photos.length > 0 && (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.sectionLabel}>PHOTOS</Text>
            <FlatList
              data={photos.slice(0, maxVisible)}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(_, i) => i.toString()}
              contentContainerStyle={{ gap: 10, marginTop: 10 }}
              renderItem={({ item, index }) => (
                <View>
                  <Image
                    source={{ uri: item }}
                    style={styles.photo}
                  />
                  {index === maxVisible - 1 && extraCount > 0 && (
                    <View style={styles.photoOverlay}>
                      <Text style={styles.photoOverlayText}>+{extraCount}</Text>
                    </View>
                  )}
                </View>
              )}
            />
          </View>
        )}

        {/* Written Review */}
        {review.text ? (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.sectionLabel}>WRITTEN REVIEW</Text>
            <View style={[styles.card, { marginTop: 10 }]}>
              <Text style={styles.reviewText}>"{review.text}"</Text>
            </View>
          </View>
        ) : null}

        {/* Items Reviewed */}
        {review.items && review.items.length > 0 && (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.sectionLabel}>ITEMS REVIEWED</Text>
            {review.items.map((dish, index) => (
              <View key={index} style={[styles.card, { marginTop: 10 }]}>
                <Text style={styles.dishLabel}>DISH NAME</Text>
                <Text style={styles.dishName}>{dish}</Text>
                <View style={{ marginTop: 6 }}>
                  <StarRow rating={review.rating} />
                </View>
                <Pressable
                  style={styles.recipeButton}
                  onPress={() =>
                    router.push({
                      pathname: "/tabs/recipes",
                      params: {
                        dish,
                        restaurantName: review.restaurantName,
                        providerId: review.restaurantProviderId ?? "",
                      },
                    })
                  }
                >
                  <Text style={styles.recipeButtonText}>Get Recipe</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1A1A1A",
    letterSpacing: 1,
  },
  headerDate: { fontSize: 13, color: "#888", marginTop: 2 },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  restaurantPhoto: { width: 56, height: 56, borderRadius: 12 },
  restaurantPhotoFallback: {
    backgroundColor: "#FFF0E8",
    alignItems: "center",
    justifyContent: "center",
  },
  restaurantName: { fontSize: 17, fontWeight: "700", color: "#1A1A1A" },
  restaurantAddress: { fontSize: 12, color: "#999", marginLeft: 4, flex: 1 },
  totalBadge: {
    backgroundColor: "#FF6B35",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  totalBadgeText: { color: "#FFF", fontSize: 11, fontWeight: "700" },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#888",
    letterSpacing: 1,
  },
  photo: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE * 0.75,
    borderRadius: 12,
  },
  photoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  photoOverlayText: { color: "#FFF", fontSize: 22, fontWeight: "700" },
  reviewText: {
    fontSize: 15,
    color: "#444",
    fontStyle: "italic",
    lineHeight: 22,
  },
  dishLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#999",
    letterSpacing: 0.5,
  },
  dishName: { fontSize: 18, fontWeight: "700", color: "#1A1A1A", marginTop: 2 },
  recipeButton: {
    backgroundColor: "#FF6B35",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 12,
  },
  recipeButtonText: { color: "#FFF", fontSize: 15, fontWeight: "700" },
});

import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "../../src/components/services/supabase";

interface DishEntry {
  name: string;
  rating: number;
}

export default function CreateReview() {
  const params = useLocalSearchParams();
  const restaurantName = params.name as string;
  const restaurantAddress = params.address as string;
  const provider = params.provider as string;
  const providerId = params.providerId as string;
  const lat = params.lat ? parseFloat(params.lat as string) : undefined;
  const lng = params.lng ? parseFloat(params.lng as string) : undefined;

  const [dishes, setDishes] = useState<DishEntry[]>([{ name: "", rating: 0 }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addAnotherDish = () => {
    setDishes((prev) => [...prev, { name: "", rating: 0 }]);
  };

  const updateDishName = (index: number, name: string) => {
    setDishes((prev) =>
      prev.map((d, i) => (i === index ? { ...d, name } : d))
    );
  };

  const updateDishRating = (index: number, rating: number) => {
    setDishes((prev) =>
      prev.map((d, i) => (i === index ? { ...d, rating } : d))
    );
  };

  const removeDish = (index: number) => {
    setDishes((prev) => prev.filter((_, i) => i !== index));
  };

  const getOverallRating = () => {
    const rated = dishes.filter((d) => d.rating > 0);
    if (rated.length === 0) return 0;
    return Math.round(rated.reduce((sum, d) => sum + d.rating, 0) / rated.length);
  };

  const handleSubmit = async () => {
    const filledDishes = dishes.filter((d) => d.name.trim() !== "");
    if (filledDishes.length === 0) {
      Alert.alert("Missing Info", "Please enter at least one dish name");
      return;
    }
    const unrated = filledDishes.filter((d) => d.rating === 0);
    if (unrated.length > 0) {
      Alert.alert("Missing Info", "Please rate all your dishes");
      return;
    }

    setIsSubmitting(true);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        Alert.alert("Error", "You must be logged in to submit a review");
        setIsSubmitting(false);
        return;
      }

      const reviewData = {
        provider,
        providerId,
        name: restaurantName,
        address: restaurantAddress,
        lat,
        lng,
        rating: getOverallRating(),
        text: "",
        dishes: filledDishes.map((d) => d.name),
      };

      const API_URL =
        process.env.EXPO_PUBLIC_API_URL || "http://localhost:8080";

      const response = await fetch(`${API_URL}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(reviewData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }
        throw new Error(
          errorData.message ||
            `Server error: ${response.status} ${response.statusText}`
        );
      }

      await response.json();

      Alert.alert("Success", "Your review has been submitted!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to submit review. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGetRecipe = (dishName: string) => {
    router.push({
      pathname: "/tabs/recipes",
      params: {
        dish: dishName,
        restaurantName: restaurantName,
        providerId: providerId,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#FF6B35" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.stepLabel}>STEP 1 OF 3</Text>
          <Text style={styles.headerTitle}>Add Your Review</Text>
        </View>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Restaurant Info */}
        <View style={styles.restaurantCard}>
          <View style={styles.restaurantImage}>
            <Ionicons name="restaurant" size={28} color="#FF6B35" />
          </View>
          <View style={styles.restaurantInfo}>
            <Text style={styles.restaurantName}>
              {restaurantName || "Restaurant Name"}
            </Text>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={13} color="#FF6B35" />
              <Text style={styles.restaurantAddress}>
                {restaurantAddress || "Address"}
              </Text>
            </View>
          </View>
        </View>

        {/* Section Title */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What did you eat?</Text>
          <Text style={styles.sectionSubtitle}>
            Add the dishes you ordered and rate them.
          </Text>

          {/* Dish Cards */}
          {dishes.map((dish, index) => (
            <View key={index} style={styles.dishCard}>
              {/* Dish name input */}
              <View style={styles.dishInputSection}>
                <View style={styles.dishHeader}>
                  <Text style={styles.dishLabel}>DISH NAME</Text>
                  {dishes.length > 1 && (
                    <Pressable onPress={() => removeDish(index)}>
                      <Ionicons
                        name="close-circle-outline"
                        size={22}
                        color="#CCC"
                      />
                    </Pressable>
                  )}
                </View>
                <TextInput
                  style={styles.dishInput}
                  placeholder="e.g. Garlic Truffle Fries"
                  placeholderTextColor="#CCC"
                  value={dish.name}
                  onChangeText={(text) => updateDishName(index, text)}
                />
              </View>

              {/* Get Recipe button — only show if dish has a name */}
              {dish.name.trim() !== "" && (
                <Pressable
                  style={styles.getRecipeBtn}
                  onPress={() => handleGetRecipe(dish.name)}
                >
                  <Ionicons name="sparkles" size={14} color="#FF6B35" />
                  <Text style={styles.getRecipeText}>Get Recipe</Text>
                </Pressable>
              )}

              {/* Rating */}
              <View style={styles.dishRatingSection}>
                <Text style={styles.dishRatingLabel}>
                  {dish.rating > 0 ? "How was it?" : "Tap to rate"}
                </Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Pressable
                      key={star}
                      onPress={() => updateDishRating(index, star)}
                    >
                      <Ionicons
                        name={star <= dish.rating ? "star" : "star-outline"}
                        size={32}
                        color={star <= dish.rating ? "#FF6B35" : "#DDD"}
                      />
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          ))}

          {/* Add Another Dish */}
          <Pressable style={styles.addDishButton} onPress={addAnotherDish}>
            <Ionicons name="add-circle" size={22} color="#FF6B35" />
            <Text style={styles.addDishText}>Add another dish</Text>
          </Pressable>
        </View>

        {/* Continue Button */}
        <Pressable
          style={[
            styles.continueButton,
            isSubmitting && styles.continueButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.continueButtonText}>
            {isSubmitting ? "Submitting..." : "Continue to Review"}
          </Text>
          {!isSubmitting && (
            <Ionicons name="arrow-forward" size={20} color="#FFF" />
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backButton: {
    padding: 4,
  },
  headerCenter: {
    alignItems: "center",
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FF6B35",
    letterSpacing: 1,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  cancelText: {
    fontSize: 16,
    color: "#FF6B35",
    fontWeight: "600",
  },

  /* Restaurant Card */
  restaurantCard: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    margin: 16,
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  restaurantImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFF5F0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  restaurantInfo: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  restaurantAddress: {
    fontSize: 13,
    color: "#999",
  },

  /* Section */
  section: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
  },

  /* Dish Card */
  dishCard: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  dishInputSection: {
    marginBottom: 8,
  },
  dishHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  dishLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#999",
    letterSpacing: 0.5,
  },
  dishInput: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A1A1A",
    paddingVertical: 6,
  },
  getRecipeBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#FFF5F0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 5,
    marginBottom: 12,
  },
  getRecipeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FF6B35",
  },
  dishRatingSection: {
    alignItems: "center",
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#F5F5F5",
  },
  dishRatingLabel: {
    fontSize: 12,
    color: "#BBB",
    marginBottom: 8,
    marginTop: 8,
  },
  starsRow: {
    flexDirection: "row",
    gap: 6,
  },

  /* Add Dish */
  addDishButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#FF6B35",
    borderStyle: "dashed",
    gap: 8,
    marginBottom: 16,
  },
  addDishText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FF6B35",
  },

  /* Continue Button */
  continueButton: {
    flexDirection: "row",
    backgroundColor: "#FF6B35",
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 16,
    paddingVertical: 18,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
});

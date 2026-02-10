import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "../../src/components/services/supabase";

interface DishReview {
  id: string;
  name: string;
  rating: number;
  ingredients: string[];
}

export default function CreateReview() {
  const params = useLocalSearchParams();
  const restaurantName = params.name as string;
  const restaurantAddress = params.address as string;
  
  const [dishes, setDishes] = useState<DishReview[]>([
    { id: '1', name: '', rating: 0, ingredients: [] }
  ]);
  const [currentDishIndex, setCurrentDishIndex] = useState(0);
  const [ingredientInput, setIngredientInput] = useState('');

  const currentDish = dishes[currentDishIndex];

  const updateDish = (updates: Partial<DishReview>) => {
    setDishes(prev => prev.map((dish, idx) => 
      idx === currentDishIndex ? { ...dish, ...updates } : dish
    ));
  };

  const setRating = (rating: number) => {
    updateDish({ rating });
  };

  const addIngredient = () => {
    if (ingredientInput.trim()) {
      updateDish({ 
        ingredients: [...currentDish.ingredients, ingredientInput.trim()] 
      });
      setIngredientInput('');
    }
  };

  const removeIngredient = (index: number) => {
    updateDish({ 
      ingredients: currentDish.ingredients.filter((_, i) => i !== index) 
    });
  };

  const addAnotherDish = () => {
    setDishes(prev => [...prev, { 
      id: Date.now().toString(), 
      name: '', 
      rating: 0, 
      ingredients: [] 
    }]);
    setCurrentDishIndex(dishes.length);
  };

  const handleContinue = () => {
    if (!currentDish.name.trim()) {
      Alert.alert("Missing Info", "Please enter a dish name");
      return;
    }
    if (currentDish.rating === 0) {
      Alert.alert("Missing Info", "Please rate this dish");
      return;
    }
    
    // Navigate to photo step or submit
    Alert.alert("Success", "Review created! (Photo step coming next)");
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#FF6B35" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.stepText}>STEP 1 OF 2</Text>
          <Text style={styles.headerTitle}>Add Your Review</Text>
        </View>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Restaurant Info */}
        <View style={styles.restaurantCard}>
          <View style={styles.restaurantImage}>
            <Ionicons name="restaurant" size={32} color="#FF6B35" />
          </View>
          <View style={styles.restaurantInfo}>
            <Text style={styles.restaurantName}>{restaurantName || "Restaurant Name"}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color="#999" />
              <Text style={styles.restaurantAddress}>{restaurantAddress || "Address"}</Text>
            </View>
          </View>
        </View>

        {/* What did you eat? */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What did you eat?</Text>
          <Text style={styles.sectionSubtitle}>Add the dishes you ordered and rate them.</Text>

          {/* Dish Card */}
          <View style={styles.dishCard}>
            <View style={styles.dishHeader}>
              <Text style={styles.dishLabel}>DISH NAME</Text>
              {dishes.length > 1 && (
                <Pressable onPress={() => {
                  setDishes(prev => prev.filter((_, i) => i !== currentDishIndex));
                  setCurrentDishIndex(Math.max(0, currentDishIndex - 1));
                }}>
                  <Ionicons name="close-circle" size={24} color="#CCC" />
                </Pressable>
              )}
            </View>
            
            <TextInput
              style={styles.dishInput}
              placeholder="e.g. Garlic Truffle Fries"
              placeholderTextColor="#CCC"
              value={currentDish.name}
              onChangeText={(text) => updateDish({ name: text })}
            />

            {/* Ingredients */}
            <Text style={styles.ingredientsLabel}>INGREDIENTS (OPTIONAL)</Text>
            <View style={styles.ingredientsContainer}>
              {currentDish.ingredients.map((ingredient, index) => (
                <View key={index} style={styles.ingredientChip}>
                  <Text style={styles.ingredientText}>{ingredient}</Text>
                  <Pressable onPress={() => removeIngredient(index)}>
                    <Ionicons name="close" size={16} color="#666" />
                  </Pressable>
                </View>
              ))}
              
              <View style={styles.addIngredientRow}>
                <TextInput
                  style={styles.ingredientInput}
                  placeholder="Add ingredients like cheese, lettuce..."
                  placeholderTextColor="#CCC"
                  value={ingredientInput}
                  onChangeText={setIngredientInput}
                  onSubmitEditing={addIngredient}
                />
                {ingredientInput.length > 0 && (
                  <Pressable onPress={addIngredient} style={styles.addButton}>
                    <Text style={styles.addButtonText}>+ Add</Text>
                  </Pressable>
                )}
              </View>
            </View>

            {/* Rating */}
            <Text style={styles.ratingLabel}>How was it?</Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable key={star} onPress={() => setRating(star)}>
                  <Ionicons
                    name={star <= currentDish.rating ? "star" : "star-outline"}
                    size={40}
                    color={star <= currentDish.rating ? "#FF6B35" : "#DDD"}
                  />
                </Pressable>
              ))}
            </View>
          </View>

          {/* Next Dish Preview */}
          {currentDishIndex < dishes.length - 1 && (
            <View style={styles.nextDishCard}>
              <Text style={styles.dishLabel}>DISH NAME</Text>
              <Text style={styles.nextDishPlaceholder}>e.g. Garlic Truffle Fries</Text>
              <Text style={styles.ingredientsLabel}>INGREDIENTS (OPTIONAL)</Text>
            </View>
          )}
        </View>

        {/* Continue Button */}
        <Pressable style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Continue to Review</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFF" />
        </Pressable>

        {/* Add Another Dish */}
        <Pressable style={styles.addDishButton} onPress={addAnotherDish}>
          <Ionicons name="add-circle" size={24} color="#FF6B35" />
          <Text style={styles.addDishText}>Add another dish</Text>
        </Pressable>

        {/* Photo Hint */}
        <View style={styles.photoHint}>
          <View style={styles.photoIcon}>
            <Ionicons name="camera" size={24} color="#FF6B35" />
          </View>
          <View style={styles.photoTextContainer}>
            <Text style={styles.photoTitle}>Snap a photo?</Text>
            <Text style={styles.photoSubtitle}>You can add photos in the next step</Text>
          </View>
        </View>
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
  stepText: {
    fontSize: 11,
    color: "#999",
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginTop: 2,
  },
  cancelText: {
    fontSize: 16,
    color: "#FF6B35",
    fontWeight: "600",
  },
  restaurantCard: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  restaurantImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: "#FFF5F0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
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
  section: {
    paddingHorizontal: 16,
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
  dishCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  dishHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  dishLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#999",
    letterSpacing: 0.5,
  },
  dishInput: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A1A1A",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    marginBottom: 16,
  },
  ingredientsLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#999",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  ingredientsContainer: {
    marginBottom: 20,
  },
  ingredientChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    alignSelf: "flex-start",
  },
  ingredientText: {
    fontSize: 14,
    color: "#333",
    marginRight: 6,
  },
  addIngredientRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ingredientInput: {
    flex: 1,
    fontSize: 14,
    color: "#999",
    paddingVertical: 8,
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FF6B35",
    borderStyle: "dashed",
  },
  addButtonText: {
    fontSize: 14,
    color: "#FF6B35",
    fontWeight: "600",
  },
  ratingLabel: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  nextDishCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    opacity: 0.5,
  },
  nextDishPlaceholder: {
    fontSize: 16,
    color: "#CCC",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    marginBottom: 16,
  },
  continueButton: {
    flexDirection: "row",
    backgroundColor: "#FF6B35",
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
  addDishButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginBottom: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#FF6B35",
    borderStyle: "dashed",
    gap: 8,
  },
  addDishText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF6B35",
  },
  photoHint: {
    flexDirection: "row",
    backgroundColor: "#FFF5F0",
    marginHorizontal: 16,
    marginBottom: 32,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  photoIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#FFE8DC",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  photoTextContainer: {
    flex: 1,
  },
  photoTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  photoSubtitle: {
    fontSize: 13,
    color: "#666",
  },
});

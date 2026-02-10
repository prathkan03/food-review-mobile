import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Platform,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../src/components/services/supabase";
import * as Location from "expo-location";
import { router } from "expo-router";

interface Restaurant {
  provider: string;
  providerId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating?: number;
  priceLevel?: number;
}

const TRENDING_CUISINES = [
  { id: "1", name: "Pizza", emoji: "🍕" },
  { id: "2", name: "Sushi", emoji: "🍣" },
  { id: "3", name: "Steak", emoji: "🥩" },
  { id: "4", name: "BBQ", emoji: "🍖" },
  { id: "5", name: "Salad", emoji: "🥗" },
];

export default function SearchTab() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>(["Spicy Ramen", "Le Petit Bistro", "Vegan Burgers"]);

  useEffect(() => {
    (async () => {
      // Check if running on web
      if (Platform.OS === 'web') {
        console.log("Running on web, using default location");
        setLocation({ lat: 39.9612, lng: -82.9988 });
        setLocationError("Using default location (web browser)");
        return;
      }

      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationError("Permission to access location was denied");
        // Default to Columbus, OH coordinates
        setLocation({ lat: 39.9612, lng: -82.9988 });
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation({
        lat: currentLocation.coords.latitude,
        lng: currentLocation.coords.longitude,
      });
    })();
  }, []);

  const search = async () => {
    console.log("Search button clicked!");
    
    if (!query.trim()) {
      console.log("No query entered");
      alert("Please enter a search term");
      return;
    }
    
    if (!location) {
      console.log("Location not available yet");
      alert("Location not available yet, please wait");
      return;
    }

    console.log("Starting search with:", { query, location });
    setLoading(true);
    setResults([]); // Clear previous results
    
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Auth error:", error);
        alert("Authentication error. Please log in again.");
        return;
      }
      
      if (!data.session) {
        console.error("No session found");
        alert("You need to be logged in to search. Please log in.");
        return;
      }
      
      const token = data.session.access_token;

      const url = `http://localhost:8080/restaurants/search?query=${encodeURIComponent(
        query
      )}&lat=${location.lat}&lng=${location.lng}`;
      
      console.log("Fetching URL:", url);
      console.log("Token:", token ? `Present (${token.substring(0, 20)}...)` : "Missing");
      console.log("Session user:", data.session.user?.email);

      const res = await fetch(url, {
        method: "GET",
        // no Authorization header
      });

      console.log("Response status:", res.status);

      if (res.ok) {
        const responseData = await res.json();
        console.log("Search results:", responseData);
        console.log("Number of results:", responseData.length);
        setResults(responseData);
        
        if (responseData.length === 0) {
          alert("No restaurants found. Try a different search term.");
        }
      } else {
        const errorText = await res.text();
        console.error("Search failed:", res.status, errorText);
        alert(`Search failed: ${res.status}`);
      }
    } catch (error: any) {
      console.error("Search error:", error);
      alert(`Error: ${error?.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRestaurant = (restaurant: Restaurant) => {
    // Navigate to create review screen with restaurant data
    router.push({
      pathname: "/reviews/create",
      params: {
        provider: restaurant.provider,
        providerId: restaurant.providerId,
        name: restaurant.name,
        address: restaurant.address,
        lat: restaurant.lat,
        lng: restaurant.lng,
      },
    });
  };

  const renderRating = (rating?: number) => {
    if (!rating) return null;
    return (
      <View style={styles.ratingContainer}>
        <Ionicons name="star" size={14} color="#FFB800" />
        <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
      </View>
    );
  };

  const renderPriceLevel = (level?: number) => {
    if (!level) return null;
    return <Text style={styles.priceLevel}>{"$".repeat(level)}</Text>;
  };

  const clearRecentSearch = (searchTerm: string) => {
    setRecentSearches(prev => prev.filter(s => s !== searchTerm));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Search</Text>
          <Pressable>
            <Ionicons name="notifications-outline" size={24} color="#FF6B35" />
          </Pressable>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color="#999" />
            <TextInput
              placeholder="Cuisine, dish, or restaurant..."
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={search}
              returnKeyType="search"
              style={styles.searchInput}
              placeholderTextColor="#999"
            />
          </View>
          <Pressable style={styles.filterButton} onPress={search}>
            <Ionicons name="options-outline" size={20} color="#FFF" />
          </Pressable>
        </View>

        {/* Recent Searches */}
        {!loading && results.length === 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>RECENT SEARCHES</Text>
              <Pressable onPress={() => setRecentSearches([])}>
                <Text style={styles.clearAllText}>Clear All</Text>
              </Pressable>
            </View>
            <View style={styles.recentSearches}>
              {recentSearches.map((search, index) => (
                <View key={index} style={styles.recentSearchChip}>
                  <Ionicons name="time-outline" size={14} color="#666" />
                  <Text style={styles.recentSearchText}>{search}</Text>
                  <Pressable onPress={() => clearRecentSearch(search)}>
                    <Ionicons name="close" size={14} color="#999" />
                  </Pressable>
                </View>
              ))}
            </View>

            {/* Trending Cuisines */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>TRENDING CUISINES</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cuisineScroll}>
              {TRENDING_CUISINES.map((cuisine) => (
                <Pressable key={cuisine.id} style={styles.cuisineCard} onPress={() => {
                  setQuery(cuisine.name);
                  search();
                }}>
                  <View style={styles.cuisineImage}>
                    <Text style={styles.cuisineEmoji}>{cuisine.emoji}</Text>
                  </View>
                  <Text style={styles.cuisineName}>{cuisine.name}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Trending Restaurants */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Trending Restaurants</Text>
              <Pressable>
                <Text style={styles.seeAllText}>See All</Text>
              </Pressable>
            </View>
          </>
        )}

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6B35" />
            <Text style={styles.loadingText}>Searching restaurants...</Text>
          </View>
        )}

        {/* Search Results */}
        {!loading && results.length > 0 && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>Search Results</Text>
            {results.map((item) => (
              <Pressable
                key={item.providerId}
                style={styles.restaurantCard}
                onPress={() => handleSelectRestaurant(item)}
              >
                <View style={styles.restaurantImagePlaceholder}>
                  <Ionicons name="restaurant" size={32} color="#FF6B35" />
                </View>
                <View style={styles.restaurantInfo}>
                  <Text style={styles.restaurantName}>{item.name}</Text>
                  <Text style={styles.restaurantAddress} numberOfLines={1}>
                    {item.address}
                  </Text>
                  <View style={styles.restaurantMeta}>
                    {item.rating && (
                      <View style={styles.ratingBadge}>
                        <Ionicons name="star" size={12} color="#FFB800" />
                        <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                      </View>
                    )}
                    {item.priceLevel && (
                      <Text style={styles.priceLevel}>{"$".repeat(item.priceLevel)}</Text>
                    )}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#CCC" />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  searchSection: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#1A1A1A",
  },
  filterButton: {
    width: 50,
    height: 50,
    backgroundColor: "#FF6B35",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#999",
    letterSpacing: 0.5,
  },
  clearAllText: {
    fontSize: 14,
    color: "#FF6B35",
    fontWeight: "600",
  },
  seeAllText: {
    fontSize: 14,
    color: "#FF6B35",
    fontWeight: "600",
  },
  recentSearches: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    gap: 8,
  },
  recentSearchChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  recentSearchText: {
    fontSize: 14,
    color: "#333",
  },
  cuisineScroll: {
    paddingLeft: 20,
  },
  cuisineCard: {
    alignItems: "center",
    marginRight: 16,
  },
  cuisineImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  cuisineEmoji: {
    fontSize: 32,
  },
  cuisineName: {
    fontSize: 13,
    color: "#333",
    fontWeight: "500",
  },
  loadingContainer: {
    paddingVertical: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
  resultsContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 16,
  },
  restaurantCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  restaurantImagePlaceholder: {
    width: 60,
    height: 60,
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
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  restaurantAddress: {
    fontSize: 13,
    color: "#999",
    marginBottom: 6,
  },
  restaurantMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF9E6",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    color: "#333",
    fontWeight: "600",
  },
  priceLevel: {
    fontSize: 13,
    color: "#999",
    fontWeight: "600",
  },
});

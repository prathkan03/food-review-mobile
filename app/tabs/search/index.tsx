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
import * as Location from "expo-location";
import { router } from "expo-router";
import { useProfileSearch, type ProfileResult } from "../../../hooks/useProfileSearch";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8080";

interface SearchResult {
  provider: string;
  providerId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating?: number;
  priceLevel?: number;
}

interface TrendingRestaurant {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  photoUrl?: string;
  categories?: string[];
  priceTier?: number;
  reviewCount: number;
}

const TRENDING_CUISINES = [
  { id: "1", name: "Pizza",  emoji: "🍕" },
  { id: "2", name: "Sushi",  emoji: "🍣" },
  { id: "3", name: "Steak",  emoji: "🥩" },
  { id: "4", name: "BBQ",    emoji: "🍖" },
  { id: "5", name: "Salad",  emoji: "🥗" },
];

export default function SearchScreen() {
  const [searchMode, setSearchMode] = useState<"restaurants" | "people">("restaurants");
  const [query, setQuery] = useState("");

  // Restaurant-specific state
  const [results, setResults]           = useState<SearchResult[]>([]);
  const [trending, setTrending]         = useState<TrendingRestaurant[]>([]);
  const [restaurantLoading, setRestaurantLoading] = useState(false);
  const [trendingLoading, setTrendingLoading]     = useState(true);
  const [location, setLocation]         = useState<{ lat: number; lng: number } | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([
    "Spicy Ramen", "Le Petit Bistro", "Vegan Burgers",
  ]);

  // People search — fully handled by the hook (debounce + cache + abort)
  const {
    results: peopleResults,
    loading: peopleLoading,
    error: peopleError,
  } = useProfileSearch(searchMode === "people" ? query : "");

  // ── Location ──────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      if (Platform.OS === "web") {
        setLocation({ lat: 39.9612, lng: -82.9988 });
        return;
      }
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocation({ lat: 39.9612, lng: -82.9988 });
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    })();
  }, []);

  // ── Trending restaurants ──────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_URL}/restaurants/trending`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setTrending(data))
      .catch(() => {})
      .finally(() => setTrendingLoading(false));
  }, []);

  // ── Restaurant search (manual submit) ────────────────────────────────────
  const searchRestaurants = async () => {
    if (!query.trim()) return;
    if (!location) { alert("Location not available yet, please wait"); return; }

    setRestaurantLoading(true);
    setResults([]);
    try {
      const url = `${API_URL}/restaurants/search?query=${encodeURIComponent(query)}&lat=${location.lat}&lng=${location.lng}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
        if (!recentSearches.includes(query.trim())) {
          setRecentSearches((prev) => [query.trim(), ...prev].slice(0, 5));
        }
      }
    } catch (e) {
      console.error("Restaurant search error:", e);
    } finally {
      setRestaurantLoading(false);
    }
  };

  const handleRecentSearchPress = (term: string) => {
    setQuery(term);
    if (!location) return;
    setRestaurantLoading(true);
    setResults([]);
    fetch(`${API_URL}/restaurants/search?query=${encodeURIComponent(term)}&lat=${location.lat}&lng=${location.lng}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setResults(data))
      .catch(() => {})
      .finally(() => setRestaurantLoading(false));
  };

  const handleSelectRestaurant = (r: SearchResult) => {
    router.push({
      pathname: "/reviews/create",
      params: { provider: r.provider, providerId: r.providerId, name: r.name, address: r.address, lat: r.lat, lng: r.lng },
    });
  };

  const handleSwitchMode = (mode: "restaurants" | "people") => {
    setSearchMode(mode);
    setQuery("");
    setResults([]);
  };

  // ── Derived booleans ──────────────────────────────────────────────────────
  const isLoading        = searchMode === "people" ? peopleLoading : restaurantLoading;
  const isRestaurantActive = searchMode === "restaurants" && (restaurantLoading || results.length > 0);
  const isPeopleActive     = searchMode === "people"      && query.trim().length > 0;

  // ── Helpers ───────────────────────────────────────────────────────────────
  const formatPrice      = (tier?: number) => (tier ? "$".repeat(tier) : "");
  const formatCategories = (cats?: string[]) => cats?.slice(0, 3).join(" • ") ?? null;

  // ── People result row ─────────────────────────────────────────────────────
  const renderPersonRow = ({ item }: { item: ProfileResult }) => (
    <Pressable
      style={styles.personRow}
      onPress={() => router.push({ pathname: "/tabs/search/profile/[id]", params: { id: item.id } })}
    >
      <View style={styles.personAvatar}>
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.personAvatarImage} />
        ) : (
          <Ionicons name="person" size={22} color="#FF6B35" />
        )}
      </View>
      <View style={styles.personInfo}>
        <Text style={styles.personDisplayName}>
          {item.display_name || item.username || "User"}
        </Text>
        {item.username ? (
          <Text style={styles.personUsername}>@{item.username}</Text>
        ) : null}
        {item.bio ? (
          <Text style={styles.personBio} numberOfLines={1}>{item.bio}</Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color="#CCC" />
    </Pressable>
  );

  // ── Trending card ─────────────────────────────────────────────────────────
  const renderTrendingCard = (restaurant: TrendingRestaurant) => (
    <Pressable
      key={restaurant.id}
      style={styles.trendingCard}
      onPress={() => router.push({ pathname: "/restaurants/[id]", params: { id: restaurant.id } })}
    >
      <View style={styles.trendingImageContainer}>
        {restaurant.photoUrl ? (
          <Image source={{ uri: restaurant.photoUrl }} style={styles.trendingImage} resizeMode="cover" />
        ) : (
          <View style={styles.trendingImagePlaceholder}>
            <Ionicons name="restaurant" size={40} color="#DDD" />
          </View>
        )}
        <View style={styles.popularBadge}>
          <Text style={styles.popularBadgeText}>POPULAR</Text>
        </View>
        {restaurant.reviewCount > 0 && (
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={11} color="#FFF" />
            <Text style={styles.ratingBadgeText}>4.8</Text>
          </View>
        )}
      </View>
      <View style={styles.trendingInfo}>
        <View style={styles.trendingNameRow}>
          <Text style={styles.trendingName}>{restaurant.name}</Text>
          <Text style={styles.trendingPrice}>{formatPrice(restaurant.priceTier)}</Text>
        </View>
        {formatCategories(restaurant.categories) ? (
          <Text style={styles.trendingCategories}>{formatCategories(restaurant.categories)}</Text>
        ) : (
          <Text style={styles.trendingCategories} numberOfLines={1}>{restaurant.address}</Text>
        )}
        <View style={styles.trendingReviewRow}>
          <View style={styles.avatarStack}>
            <View style={[styles.miniAvatar, { backgroundColor: "#FF6B35" }]}>
              <Ionicons name="person" size={10} color="#FFF" />
            </View>
            <View style={[styles.miniAvatar, { backgroundColor: "#4A90D9", marginLeft: -8 }]}>
              <Ionicons name="person" size={10} color="#FFF" />
            </View>
          </View>
          <Text style={styles.trendingReviewCount}>
            {restaurant.reviewCount > 0 ? `${restaurant.reviewCount}+ reviews` : "No reviews yet"}
          </Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
        <Pressable>
          <Ionicons name="notifications-outline" size={24} color="#FF6B35" />
        </Pressable>
      </View>

      {/* ── Mode Toggle ────────────────────────────────────────────────── */}
      <View style={styles.modeToggle}>
        <Pressable
          style={[styles.modeButton, searchMode === "restaurants" && styles.modeButtonActive]}
          onPress={() => handleSwitchMode("restaurants")}
        >
          <Ionicons name="restaurant-outline" size={15} color={searchMode === "restaurants" ? "#FFF" : "#666"} />
          <Text style={[styles.modeButtonText, searchMode === "restaurants" && styles.modeButtonTextActive]}>
            Restaurants
          </Text>
        </Pressable>
        <Pressable
          style={[styles.modeButton, searchMode === "people" && styles.modeButtonActive]}
          onPress={() => handleSwitchMode("people")}
        >
          <Ionicons name="people-outline" size={15} color={searchMode === "people" ? "#FFF" : "#666"} />
          <Text style={[styles.modeButtonText, searchMode === "people" && styles.modeButtonTextActive]}>
            People
          </Text>
        </Pressable>
      </View>

      {/* ── Search Bar ─────────────────────────────────────────────────── */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#999" />
          <TextInput
            placeholder={searchMode === "people" ? "Search people..." : "Cuisine, dish, or restaurant..."}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={searchMode === "restaurants" ? searchRestaurants : undefined}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            style={styles.searchInput}
            placeholderTextColor="#999"
          />
          {query.length > 0 && (
            <Pressable onPress={() => { setQuery(""); setResults([]); }} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color="#CCC" />
            </Pressable>
          )}
        </View>
        {searchMode === "restaurants" && (
          <Pressable style={styles.filterButton} onPress={searchRestaurants}>
            <Ionicons name="options-outline" size={20} color="#FFF" />
          </Pressable>
        )}
      </View>

      {/* ── People mode ────────────────────────────────────────────────── */}
      {searchMode === "people" && (
        <>
          {isPeopleActive && isLoading && (
            <View style={styles.inlineLoading}>
              <ActivityIndicator size="small" color="#FF6B35" />
            </View>
          )}

          {peopleError && !isLoading && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={20} color="#E53935" />
              <Text style={styles.errorText}>Search failed. Try again.</Text>
            </View>
          )}

          {!isLoading && !peopleError && isPeopleActive && peopleResults.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="person-outline" size={48} color="#CCC" />
              <Text style={styles.emptyText}>No users found</Text>
            </View>
          )}

          {peopleResults.length > 0 && (
            <FlatList
              data={peopleResults}
              keyExtractor={(item) => item.id}
              renderItem={renderPersonRow}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.peopleList}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )}

          {!isPeopleActive && (
            <View style={styles.peoplePlaceholder}>
              <Ionicons name="people-outline" size={52} color="#DDD" />
              <Text style={styles.peoplePlaceholderText}>Search for people by name or username</Text>
            </View>
          )}
        </>
      )}

      {/* ── Restaurant mode ────────────────────────────────────────────── */}
      {searchMode === "restaurants" && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {restaurantLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FF6B35" />
              <Text style={styles.loadingText}>Searching restaurants...</Text>
            </View>
          )}

          {!restaurantLoading && results.length > 0 && (
            <View style={styles.resultsContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitleLarge}>Search Results</Text>
                <Pressable onPress={() => { setResults([]); setQuery(""); }}>
                  <Text style={styles.clearAllText}>Clear</Text>
                </Pressable>
              </View>
              {results.map((item) => (
                <Pressable
                  key={item.providerId}
                  style={styles.searchResultCard}
                  onPress={() => handleSelectRestaurant(item)}
                >
                  <View style={styles.searchResultIcon}>
                    <Ionicons name="restaurant" size={24} color="#FF6B35" />
                  </View>
                  <View style={styles.searchResultInfo}>
                    <Text style={styles.searchResultName}>{item.name}</Text>
                    <Text style={styles.searchResultAddress} numberOfLines={1}>{item.address}</Text>
                    <View style={styles.searchResultMeta}>
                      {item.rating && (
                        <View style={styles.searchResultRating}>
                          <Ionicons name="star" size={12} color="#FFB800" />
                          <Text style={styles.searchResultRatingText}>{item.rating.toFixed(1)}</Text>
                        </View>
                      )}
                      {item.priceLevel && (
                        <Text style={styles.searchResultPrice}>{"$".repeat(item.priceLevel)}</Text>
                      )}
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#CCC" />
                </Pressable>
              ))}
            </View>
          )}

          {!isRestaurantActive && (
            <>
              {recentSearches.length > 0 && (
                <>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>RECENT SEARCHES</Text>
                    <Pressable onPress={() => setRecentSearches([])}>
                      <Text style={styles.clearAllText}>Clear All</Text>
                    </Pressable>
                  </View>
                  <View style={styles.recentSearches}>
                    {recentSearches.map((term, i) => (
                      <Pressable key={i} style={styles.recentSearchChip} onPress={() => handleRecentSearchPress(term)}>
                        <Ionicons name="time-outline" size={14} color="#666" />
                        <Text style={styles.recentSearchText}>{term}</Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              )}

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>TRENDING CUISINES</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cuisineScroll}>
                {TRENDING_CUISINES.map((cuisine) => (
                  <Pressable key={cuisine.id} style={styles.cuisineCard} onPress={() => handleRecentSearchPress(cuisine.name)}>
                    <View style={styles.cuisineImage}>
                      <Text style={styles.cuisineEmoji}>{cuisine.emoji}</Text>
                    </View>
                    <Text style={styles.cuisineName}>{cuisine.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitleLarge}>Trending Restaurants</Text>
                <Pressable><Text style={styles.seeAllText}>See All</Text></Pressable>
              </View>
              {trendingLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#FF6B35" />
                </View>
              ) : trending.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="restaurant-outline" size={48} color="#CCC" />
                  <Text style={styles.emptyText}>No restaurants yet</Text>
                </View>
              ) : (
                trending.map(renderTrendingCard)
              )}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: "#F8F4F0" },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
  },
  title: { fontSize: 24, fontWeight: "700", color: "#1A1A1A" },

  // Mode toggle
  modeToggle: {
    flexDirection: "row", marginHorizontal: 20, marginBottom: 8,
    backgroundColor: "#EDE8E3", borderRadius: 12, padding: 4, gap: 4,
  },
  modeButton: {
    flex: 1, flexDirection: "row", alignItems: "center",
    justifyContent: "center", paddingVertical: 8, borderRadius: 9, gap: 6,
  },
  modeButtonActive: { backgroundColor: "#FF6B35" },
  modeButtonText: { fontSize: 14, fontWeight: "600", color: "#666" },
  modeButtonTextActive: { color: "#FFF" },

  // Search bar
  searchSection: { flexDirection: "row", paddingHorizontal: 20, paddingBottom: 8, gap: 12 },
  searchBar: {
    flex: 1, flexDirection: "row", alignItems: "center",
    backgroundColor: "#FFF", borderRadius: 12, paddingHorizontal: 16, height: 48, gap: 8,
    borderWidth: 1, borderColor: "#E0D8D0",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  searchInput: { flex: 1, fontSize: 15, color: "#1A1A1A" },
  filterButton: {
    width: 48, height: 48, backgroundColor: "#FF6B35",
    borderRadius: 12, justifyContent: "center", alignItems: "center",
  },

  // People results
  peopleList: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 100 },
  personRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 12, backgroundColor: "#FFF",
    borderRadius: 12, paddingHorizontal: 14, marginBottom: 0,
  },
  personAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: "#FFF5F0", justifyContent: "center", alignItems: "center",
    marginRight: 12, borderWidth: 1, borderColor: "#E8E0D8",
  },
  personAvatarImage: { width: 48, height: 48, borderRadius: 24 },
  personInfo: { flex: 1 },
  personDisplayName: { fontSize: 15, fontWeight: "600", color: "#1A1A1A" },
  personUsername: { fontSize: 13, color: "#999", marginTop: 1 },
  personBio: { fontSize: 12, color: "#BBB", marginTop: 2 },
  separator: { height: 1, backgroundColor: "#F0EBE5", marginHorizontal: 14 },

  peoplePlaceholder: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  peoplePlaceholderText: { fontSize: 14, color: "#BBB", textAlign: "center", paddingHorizontal: 40 },

  inlineLoading: { paddingVertical: 24, alignItems: "center" },
  errorContainer: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, paddingVertical: 16 },
  errorText: { fontSize: 14, color: "#E53935" },

  // Restaurant results + shared
  resultsContainer: { paddingHorizontal: 20 },
  sectionHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingTop: 22, paddingBottom: 12,
  },
  sectionTitle: { fontSize: 12, fontWeight: "700", color: "#555", letterSpacing: 0.5 },
  sectionTitleLarge: { fontSize: 18, fontWeight: "700", color: "#1A1A1A" },
  clearAllText: { fontSize: 14, color: "#FF6B35", fontWeight: "600" },
  seeAllText: { fontSize: 14, color: "#FF6B35", fontWeight: "600" },

  searchResultCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#FFF", borderRadius: 12, padding: 12, marginBottom: 10,
    borderWidth: 1, borderColor: "#F0F0F0",
  },
  searchResultIcon: {
    width: 52, height: 52, borderRadius: 10,
    backgroundColor: "#FFF5F0", justifyContent: "center", alignItems: "center", marginRight: 12,
  },
  searchResultInfo: { flex: 1 },
  searchResultName: { fontSize: 15, fontWeight: "600", color: "#1A1A1A", marginBottom: 3 },
  searchResultAddress: { fontSize: 13, color: "#999", marginBottom: 4 },
  searchResultMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  searchResultRating: { flexDirection: "row", alignItems: "center", gap: 3 },
  searchResultRatingText: { fontSize: 12, fontWeight: "600", color: "#333" },
  searchResultPrice: { fontSize: 13, color: "#999", fontWeight: "600" },

  recentSearches: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 20, gap: 8 },
  recentSearchChip: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#FFF", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, gap: 6,
    borderWidth: 1, borderColor: "#E0D8D0",
  },
  recentSearchText: { fontSize: 14, color: "#1A1A1A", fontWeight: "500" },
  cuisineScroll: { paddingLeft: 20 },
  cuisineCard: { alignItems: "center", marginRight: 16 },
  cuisineImage: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: "#FFF5F0", justifyContent: "center", alignItems: "center",
    marginBottom: 8, borderWidth: 2, borderColor: "#E0D8D0",
  },
  cuisineEmoji: { fontSize: 28 },
  cuisineName: { fontSize: 13, color: "#1A1A1A", fontWeight: "700" },

  trendingCard: {
    marginHorizontal: 20, marginBottom: 24,
    backgroundColor: "#FFF", borderRadius: 16, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  trendingImageContainer: { width: "100%", height: 180, overflow: "hidden", position: "relative" },
  trendingImage: { width: "100%", height: "100%" },
  trendingImagePlaceholder: { width: "100%", height: "100%", backgroundColor: "#E8E0D8", justifyContent: "center", alignItems: "center" },
  popularBadge: {
    position: "absolute", bottom: 12, left: 12,
    backgroundColor: "#FF6B35", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6,
  },
  popularBadgeText: { color: "#FFF", fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  ratingBadge: {
    position: "absolute", top: 12, right: 12,
    backgroundColor: "#FF6B35", flexDirection: "row", alignItems: "center",
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 3,
  },
  ratingBadgeText: { color: "#FFF", fontSize: 12, fontWeight: "700" },
  trendingInfo: { paddingTop: 12, paddingBottom: 16, paddingHorizontal: 14 },
  trendingNameRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  trendingName: { fontSize: 17, fontWeight: "700", color: "#1A1A1A", flex: 1, marginRight: 8 },
  trendingPrice: { fontSize: 14, fontWeight: "600", color: "#999" },
  trendingCategories: { fontSize: 13, color: "#666", marginTop: 3 },
  trendingReviewRow: { flexDirection: "row", alignItems: "center", marginTop: 10, gap: 8 },
  avatarStack: { flexDirection: "row", alignItems: "center" },
  miniAvatar: {
    width: 22, height: 22, borderRadius: 11,
    justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "#FFF",
  },
  trendingReviewCount: { fontSize: 12, color: "#666" },

  loadingContainer: { paddingVertical: 40, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: 14, color: "#666" },
  emptyContainer: { alignItems: "center", paddingVertical: 40 },
  emptyText: { fontSize: 15, color: "#999", marginTop: 10 },
});

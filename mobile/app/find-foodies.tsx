import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  SafeAreaView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

interface RecentFoodie {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
}

interface SuggestedFoodie {
  id: string;
  username: string;
  subtitle: string;
  avatar?: string;
  isVerified?: boolean;
  following: boolean;
}

const INITIAL_RECENT: RecentFoodie[] = [
  { id: "1", username: "marco_kitchen", displayName: "Marco Rossi", avatar: "https://i.pravatar.cc/150?img=3" },
  { id: "2", username: "elena_bakes", displayName: "Elena Pastry", avatar: "https://i.pravatar.cc/150?img=9" },
];

const INITIAL_SUGGESTED: SuggestedFoodie[] = [
  { id: "1", username: "chef_gordon", subtitle: "Popular • 1.2M followers", avatar: "https://i.pravatar.cc/150?img=11", isVerified: true, following: false },
  { id: "2", username: "sushi_master_nyc", subtitle: "Followed by marco_kitchen", avatar: "https://i.pravatar.cc/150?img=15", following: false },
  { id: "3", username: "burger_bandit", subtitle: "Recommended for you", avatar: "https://i.pravatar.cc/150?img=7", following: false },
  { id: "4", username: "veggie_vibe", subtitle: "Followed by elena_bakes", avatar: "https://i.pravatar.cc/150?img=5", following: false },
];

export default function FindFoodiesScreen() {
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<RecentFoodie[]>(INITIAL_RECENT);
  const [suggested, setSuggested] = useState<SuggestedFoodie[]>(INITIAL_SUGGESTED);

  const handleRemoveRecent = (id: string) => {
    setRecent((prev) => prev.filter((r) => r.id !== id));
  };

  const handleClearRecent = () => setRecent([]);

  const handleFollow = (id: string) => {
    setSuggested((prev) =>
      prev.map((s) => (s.id === id ? { ...s, following: !s.following } : s))
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color="#FF6B35" />
        </Pressable>
        <Text style={styles.title}>Find Foodies</Text>
        <Pressable style={styles.addButton} hitSlop={8}>
          <Ionicons name="person-add-outline" size={22} color="#555" />
        </Pressable>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <Ionicons name="search-outline" size={18} color="#AAAAAA" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search foodies..."
          placeholderTextColor="#AAAAAA"
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
        />
      </View>

      <FlatList
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        data={[]}
        renderItem={null}
        ListHeaderComponent={
          <>
            {/* Recent Section */}
            {recent.length > 0 && (
              <View>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Recent</Text>
                  <Pressable onPress={handleClearRecent}>
                    <Text style={styles.clearText}>Clear</Text>
                  </Pressable>
                </View>
                {recent.map((item) => (
                  <View key={item.id} style={styles.recentRow}>
                    {item.avatar ? (
                      <Image source={{ uri: item.avatar }} style={styles.avatar} />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Ionicons name="person" size={18} color="#999" />
                      </View>
                    )}
                    <View style={styles.userTextWrap}>
                      <Text style={styles.username}>{item.username}</Text>
                      <Text style={styles.displayName}>{item.displayName}</Text>
                    </View>
                    <Pressable onPress={() => handleRemoveRecent(item.id)} hitSlop={8}>
                      <Ionicons name="close" size={18} color="#CCCCCC" />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            {/* Suggested Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Suggested for you</Text>
            </View>
            {suggested.map((item) => (
              <View key={item.id} style={styles.suggestedRow}>
                <View style={styles.avatarWrap}>
                  {item.avatar ? (
                    <Image source={{ uri: item.avatar }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Ionicons name="person" size={18} color="#999" />
                    </View>
                  )}
                  {item.isVerified && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark-circle" size={16} color="#FF6B35" />
                    </View>
                  )}
                </View>
                <View style={styles.userTextWrap}>
                  <Text style={styles.username}>{item.username}</Text>
                  <Text style={styles.displayName}>{item.subtitle}</Text>
                </View>
                <Pressable
                  style={[styles.followButton, item.following && styles.followButtonActive]}
                  onPress={() => handleFollow(item.id)}
                >
                  <Text style={[styles.followButtonText, item.following && styles.followButtonTextActive]}>
                    {item.following ? "Following" : "Follow"}
                  </Text>
                </Pressable>
              </View>
            ))}
          </>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF6F2",
  },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: "800",
    color: "#1A1A1A",
    textAlign: "left",
    marginLeft: 4,
  },
  addButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },

  /* Search Bar */
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#1A1A1A",
  },

  listContent: {
    paddingBottom: 40,
  },

  /* Section Header */
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1A1A1A",
  },
  clearText: {
    fontSize: 15,
    color: "#AAAAAA",
    fontWeight: "500",
  },

  /* Recent Row */
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 12,
  },

  /* Suggested Row */
  suggestedRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 12,
  },

  /* Avatar */
  avatarWrap: {
    position: "relative",
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#EEEEEE",
    justifyContent: "center",
    alignItems: "center",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#FAF6F2",
    borderRadius: 8,
  },

  /* User Text */
  userTextWrap: {
    flex: 1,
  },
  username: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  displayName: {
    fontSize: 13,
    color: "#888888",
    marginTop: 2,
  },

  /* Follow Button */
  followButton: {
    backgroundColor: "#FF6B35",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
  },
  followButtonActive: {
    backgroundColor: "#FFF0E8",
  },
  followButtonText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 14,
  },
  followButtonTextActive: {
    color: "#FF6B35",
  },
});

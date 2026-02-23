import { Tabs } from "expo-router";
import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#FF6B35",
        tabBarInactiveTintColor: "#C0C0C0",
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 80,
          backgroundColor: "#FFF",
          borderTopWidth: 1,
          borderTopColor: "#E5E5E5",
        },
        tabBarItemStyle: {
          justifyContent: "center",
          alignItems: "center",
          paddingTop: 8,
          paddingBottom: 0,
        },
        headerStyle: {
          backgroundColor: "#FFF",
        },
        headerShadowVisible: false,
        headerTitleStyle: {
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Ionicons name="search" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="creator"
        options={{
          title: "Create",
          tabBarIcon: () => (
            <View style={styles.createButton}>
              <Ionicons name="add" size={28} color="#FFF" />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          title: "Recipe AI",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Ionicons name="bookmark" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-circle" size={26} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  createButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FF6B35",
    alignItems: "center",
    justifyContent: "center",
    transform: [{ translateY: -8 }],
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
});

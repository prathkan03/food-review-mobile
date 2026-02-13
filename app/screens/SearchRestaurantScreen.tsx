import { useState } from "react";
import { View, TextInput, FlatList, Text, Pressable } from "react-native";
import { supabase } from "../../src/components/services/supabase";

export default function SearchRestaurantScreen() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    
    const search = async () => {
        const { data } = await supabase.auth.getSession();
        const token = data.session!.access_token;

        const res = await fetch(
            `http://localhost:8080/restaurants/search?query=${encodeURIComponent(query)}&lat=40.0&lng=-83.0`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        setResults(await res.json());
    };

    return (
    <View style={{ padding: 16 }}>
      <TextInput
        placeholder="Search restaurants"
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={search}
        style={{
          borderWidth: 1,
          borderRadius: 10,
          padding: 12,
          marginBottom: 12,
        }}
      />

      <FlatList
        data={results}
        keyExtractor={(item) => item.providerId}
        renderItem={({ item }) => (
          <Pressable style={{ paddingVertical: 10 }}>
            <Text style={{ fontWeight: "600" }}>{item.name}</Text>
            <Text style={{ color: "#666" }}>{item.address}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}
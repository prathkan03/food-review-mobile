import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function ReviewDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>Review Detail: {id}</Text>
    </View>
  );
}

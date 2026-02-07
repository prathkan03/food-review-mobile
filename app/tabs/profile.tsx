import { View, Text, Button } from "react-native";
import { useState } from "react";
import { supabase } from "../../src/components/services/supabase";

export default function ProfileTab() {
  const [me, setMe] = useState<any>();

  async function testMe() {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    const res = await fetch("http://localhost:8080/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const responseData = await res.json();
    console.log("ME:", responseData);
    setMe(responseData);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 10 }}>
      <Button title="Call /me" onPress={testMe} />
      <Button title="Log Out" color={"red"} onPress={handleLogout} />
      <Text>{JSON.stringify(me, null, 2)}</Text>
    </View>
  );
}

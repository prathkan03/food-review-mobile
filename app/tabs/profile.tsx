import { View, Text, Button } from "react-native";
import { useState } from "react";
import { supabase } from "../../src/components/services/supabase";

export default function ProfileTab() {
  async function handleLogout() {
    await supabase.auth.signOut();
  }

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 10 }}>
      <Button title="Log Out" color={"red"} onPress={handleLogout} />
    </View>
  );
}

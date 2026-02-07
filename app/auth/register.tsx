import { useState } from "react";
import { Alert, Pressable, Text, TextInput, View, KeyboardAvoidingView, Platform } from "react-native";
import { Link, router } from "expo-router";
import { supabase } from "../../src/components/services/supabase";

export default function RegisterScreen(){
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onRegister = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      Alert.alert("Please enter an email and password");
      return;
    }

    if (password.length < 6){
      Alert.alert("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    try{
      const {data, error} = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
      });

      if (error) {
        Alert.alert("Sign up failed.", error.message);
      }

      const token = data.session?.access_token;

      console.log("Signed Up!")
      console.log("Access Token:", token);

      if (!data.session) {
        Alert.alert("Check your email for the confirmation link.");
      }
    } catch (e: any) {
      Alert.alert("Unexpected error.", e?.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };
    return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <View style={{ flex: 1, padding: 24, justifyContent: "center", gap: 12 }}>
        <Text style={{ fontSize: 28, fontWeight: "700" }}>Create account</Text>
        <Text style={{ fontSize: 14, color: "#666" }}>
          Sign up to start reviewing restaurants.
        </Text>

        <View style={{ gap: 10, marginTop: 12 }}>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            editable={!loading}
            style={{
              borderWidth: 1,
              borderColor: "#ddd",
              borderRadius: 10,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontSize: 16,
            }}
          />

          <TextInput
            placeholder="Password (min 6 chars)"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!loading}
            style={{
              borderWidth: 1,
              borderColor: "#ddd",
              borderRadius: 10,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontSize: 16,
            }}
          />
        </View>

        <Pressable
          onPress={onRegister}
          disabled={loading}
          style={{
            marginTop: 10,
            backgroundColor: loading ? "#333" : "#000",
            paddingVertical: 14,
            borderRadius: 12,
            opacity: loading ? 0.7 : 1,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600", textAlign: "center" }}>
            {loading ? "Creating..." : "Create account"}
          </Text>
        </Pressable>

        <View style={{ marginTop: 16, alignItems: "center", gap: 8 }}>
          <Link href="/auth/login" style={{ color: "#000", fontWeight: "600" }}>
            Already have an account? Log in
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
import { useState } from "react";
import {
  Alert,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  SafeAreaView,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { supabase } from "../../src/components/services/supabase";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { width } = useWindowDimensions();
  const contentWidth = width * 0.75;
  const socialBtnWidth = (contentWidth - 16) / 2;

  async function handleLogin() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      Alert.alert("Login Failed", error.message);
    }
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.inner}>
        {/* Back button */}
        <View style={styles.backRow}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={18} color="#E8873A" />
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
        </View>

        {/* Top branding */}
        <View style={styles.topSection}>
          <Ionicons name="restaurant" size={44} color="#E8873A" />
          <Text style={styles.brandName}>Gourmet</Text>
        </View>

        {/* Form */}
        <View style={[styles.formSection, { width: contentWidth }]}>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={18} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#666"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={18} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#666"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Ionicons
                name={showPassword ? "eye-outline" : "eye-off-outline"}
                size={18}
                color="#888"
              />
            </Pressable>
          </View>

          <Pressable style={styles.forgotBtn}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </Pressable>

          <Pressable style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Login</Text>
          </Pressable>
        </View>

        {/* Social */}
        <View style={styles.socialSection}>
          <Text style={styles.orText}>OR LOGIN WITH</Text>

          <View style={[styles.socialRow, { width: contentWidth }]}>
            <Pressable style={[styles.socialButton, { width: socialBtnWidth }]}>
              <Ionicons name="logo-google" size={16} color="#333" />
              <Text style={styles.socialButtonText}>Google</Text>
            </Pressable>
            <Pressable style={[styles.socialButton, { width: socialBtnWidth }]}>
              <Ionicons name="logo-apple" size={16} color="#333" />
              <Text style={styles.socialButtonText}>Apple</Text>
            </Pressable>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Don't have an account?{" "}
            <Link href="/auth/register" asChild>
              <Text style={styles.footerLink}>Sign Up</Text>
            </Link>
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1A1A",
  },
  inner: {
    flex: 1,
    alignItems: "center",
  },
  backRow: {
    width: "100%",
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#2A2A2A",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    gap: 4,
  },
  backButtonText: {
    color: "#E8873A",
    fontSize: 14,
    fontWeight: "600",
  },
  topSection: {
    alignItems: "center",
    paddingTop: 30,
    paddingBottom: 40,
  },
  brandName: {
    fontSize: 44,
    fontWeight: "300",
    color: "#FFF",
    fontStyle: "italic",
    marginTop: 14,
  },
  formSection: {
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#444",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#FFF",
  },
  eyeBtn: {
    padding: 4,
  },
  forgotBtn: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotText: {
    fontSize: 12,
    color: "#888",
  },
  loginButton: {
    backgroundColor: "#E8873A",
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: "center",
  },
  loginButtonText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "600",
  },
  socialSection: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  orText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#555",
    letterSpacing: 2,
    marginBottom: 18,
  },
  socialRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
    paddingVertical: 13,
    borderRadius: 26,
    gap: 8,
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  footer: {
    paddingBottom: 32,
  },
  footerText: {
    fontSize: 13,
    color: "#666",
  },
  footerLink: {
    color: "#E8873A",
    fontWeight: "700",
  },
});

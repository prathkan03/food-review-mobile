import { useState } from "react";
import {
  Alert,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { supabase } from "../../src/components/services/supabase";

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const { width } = useWindowDimensions();
  const contentWidth = width * 0.75;

  const onRegister = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      Alert.alert("Please enter an email and password");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Password must be at least 6 characters long");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
      });

      if (error) {
        Alert.alert("Sign up failed.", error.message);
        return;
      }

      router.push("/auth/profile-setup");
    } catch (e: any) {
      Alert.alert("Unexpected error.", e?.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.inner}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header row */}
            <View style={styles.headerRow}>
              <Pressable style={styles.backButton} onPress={() => router.back()}>
                <Ionicons name="chevron-back" size={22} color="#FFF" />
              </Pressable>
              <Text style={styles.stepText}>STEP 1 OF 3</Text>
              <View style={{ width: 36 }} />
            </View>

            {/* Title */}
            <View style={[styles.titleSection, { width: contentWidth, alignSelf: "center" }]}>
              <Text style={styles.title}>Join Gourmet</Text>
              <Text style={styles.subtitle}>
                Start your culinary journey with us today.
              </Text>
            </View>

            {/* Form */}
            <View style={[styles.formSection, { width: contentWidth, alignSelf: "center" }]}>
              {/* Email */}
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="chef@gourmet.com"
                  placeholderTextColor="#555"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  autoComplete="email"
                  editable={!loading}
                />
                <Ionicons name="mail-outline" size={18} color="#888" />
              </View>

              {/* Password */}
              <Text style={styles.label}>Create Password</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#555"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  textContentType="newPassword"
                  autoComplete="new-password"
                  editable={!loading}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={18}
                    color="#888"
                  />
                </Pressable>
              </View>

              {/* Confirm Password */}
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#555"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirm}
                  textContentType="newPassword"
                  autoComplete="new-password"
                  editable={!loading}
                />
                <Pressable onPress={() => setShowConfirm(!showConfirm)}>
                  <Ionicons
                    name={showConfirm ? "eye-outline" : "eye-off-outline"}
                    size={18}
                    color="#888"
                  />
                </Pressable>
              </View>

              {/* Terms */}
              <Text style={styles.termsText}>
                By continuing, you agree to Gourmet's{" "}
                <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
                <Text style={styles.termsLink}>Privacy Policy</Text>.
              </Text>
            </View>
          </ScrollView>

          {/* Bottom section */}
          <View style={styles.bottomSection}>
            <Pressable
              style={[
                styles.nextButton,
                { width: contentWidth, alignSelf: "center" },
                loading && styles.nextButtonDisabled,
              ]}
              onPress={onRegister}
              disabled={loading}
            >
              <Text style={styles.nextButtonText}>
                {loading ? "Creating..." : "Next"}
              </Text>
            </Pressable>

            <Text style={styles.footerText}>
              Already have an account?{" "}
              <Link href="/auth/login" asChild>
                <Text style={styles.footerLink}>Log in</Text>
              </Link>
            </Text>
          </View>
        </KeyboardAvoidingView>
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
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#2A2A2A",
    alignItems: "center",
    justifyContent: "center",
  },
  stepText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#E8873A",
    letterSpacing: 1,
  },
  titleSection: {
    paddingTop: 28,
    paddingBottom: 36,
  },
  title: {
    fontSize: 38,
    fontWeight: "700",
    color: "#FFF",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 17,
    color: "#888",
    lineHeight: 25,
  },
  formSection: {},
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#CCC",
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#444",
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 22,
    backgroundColor: "#1A1A1A",
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#FFF",
    backgroundColor: "#1A1A1A",
  },
  termsText: {
    fontSize: 13,
    color: "#888",
    lineHeight: 21,
    marginTop: 6,
  },
  termsLink: {
    color: "#E8873A",
    textDecorationLine: "underline",
  },
  bottomSection: {
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 28,
  },
  nextButton: {
    backgroundColor: "#E8873A",
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: "center",
    marginBottom: 16,
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
  nextButtonText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "600",
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

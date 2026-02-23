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
  ScrollView,
} from "react-native";
import { Link, router } from "expo-router";
import { supabase } from "../../src/components/services/supabase";

export default function ProfileSetupScreen() {
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);

  const onNext = async () => {
    if (!username.trim()) {
      Alert.alert("Please enter a username");
      return;
    }

    setLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8080";
      const res = await fetch(`${API_URL}/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username: username.trim(), bio: bio.trim() }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        Alert.alert("Error", err.message ?? "Failed to save profile. Try a different username.");
        return;
      }

      router.replace("/tabs");
    } catch (e: any) {
      Alert.alert("Unexpected error", e?.message ?? "Something went wrong.");
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
            {/* Top title */}
            <Text style={styles.appTitle}>Gourmet</Text>

            {/* Step indicator */}
            <View style={styles.stepRow}>
              <Text style={styles.stepText}>STEP 2 OF 3</Text>
              <View style={styles.progressTrack}>
                <View style={styles.progressFill} />
              </View>
            </View>

            {/* Title */}
            <Text style={styles.title}>Profile Information</Text>
            <Text style={styles.subtitle}>Tell us a bit about yourself.</Text>

            {/* Form */}
            <View style={styles.formSection}>
              <Text style={styles.label}>Username</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Chef_John"
                  placeholderTextColor="#555"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  backgroundColor="#2A2A2A"
                />
              </View>

              <Text style={styles.label}>Bio</Text>
              <View style={[styles.inputContainer, styles.bioContainer]}>
                <TextInput
                  style={[styles.input, styles.bioInput]}
                  placeholder="Share your culinary journey..."
                  placeholderTextColor="#555"
                  value={bio}
                  onChangeText={setBio}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                  editable={!loading}
                  backgroundColor="#2A2A2A"
                />
              </View>
            </View>
          </ScrollView>

          {/* Bottom */}
          <View style={styles.bottomSection}>
            <Pressable
              style={[styles.nextButton, loading && styles.nextButtonDisabled]}
              onPress={onNext}
              disabled={loading}
            >
              <Text style={styles.nextButtonText}>
                {loading ? "Saving..." : "Next"}
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
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFF",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 24,
  },
  stepRow: {
    alignItems: "center",
    marginBottom: 32,
    gap: 10,
  },
  stepText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#888",
    letterSpacing: 1,
  },
  progressTrack: {
    width: "100%",
    height: 3,
    backgroundColor: "#333",
    borderRadius: 2,
  },
  progressFill: {
    width: "66%",
    height: "100%",
    backgroundColor: "#E8873A",
    borderRadius: 2,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFF",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#888",
    marginBottom: 36,
  },
  formSection: {},
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#CCC",
    marginBottom: 10,
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: "#444",
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 24,
    backgroundColor: "#2A2A2A",
  },
  bioContainer: {
    paddingVertical: 12,
  },
  input: {
    fontSize: 16,
    color: "#FFF",
    height: 52,
  },
  bioInput: {
    height: 120,
  },
  bottomSection: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 28,
  },
  nextButton: {
    width: "100%",
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
    fontWeight: "700",
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

import { Link } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function AuthScreen() {
  const { width } = useWindowDimensions();
  const buttonWidth = width * 0.75;
  const socialBtnWidth = (buttonWidth - 16) / 2;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.inner}>
        {/* Top section — icon + branding, centered in upper half */}
        <View style={styles.topSection}>
          <Ionicons name="restaurant" size={44} color="#E8873A" />
          <Text style={styles.brandName}>Gourmet</Text>
          <Text style={styles.tagline}>
            The art of fine dining, curated{"\n"}for you.
          </Text>
        </View>

        {/* Bottom section — buttons, social, footer */}
        <View style={styles.bottomSection}>
          <View style={[styles.buttonContainer, { width: buttonWidth }]}>
            <Link href="/auth/login" asChild>
              <Pressable style={styles.loginButton}>
                <Text style={styles.loginButtonText}>Login</Text>
              </Pressable>
            </Link>
            <Link href="/auth/register" asChild>
              <Pressable style={styles.signUpButton}>
                <Text style={styles.signUpButtonText}>Sign Up</Text>
              </Pressable>
            </Link>
          </View>

          <Text style={styles.socialLabel}>SOCIAL ACCESS</Text>

          <View style={[styles.socialRow, { width: buttonWidth }]}>
            <Pressable style={[styles.socialButton, { width: socialBtnWidth }]}>
              <Ionicons name="logo-google" size={16} color="#333" />
              <Text style={styles.socialButtonText}>Google</Text>
            </Pressable>
            <Pressable style={[styles.socialButton, { width: socialBtnWidth }]}>
              <Ionicons name="logo-apple" size={16} color="#333" />
              <Text style={styles.socialButtonText}>Apple</Text>
            </Pressable>
          </View>

          <Text style={styles.footerText}>
            By continuing, you agree to our{" "}
            <Text style={styles.footerLink}>Terms</Text> and{" "}
            <Text style={styles.footerLink}>Privacy</Text>.
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
  },
  topSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: {
    fontSize: 44,
    fontWeight: "300",
    color: "#FFF",
    fontStyle: "italic",
    marginTop: 18,
    marginBottom: 12,
  },
  tagline: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    lineHeight: 24,
  },
  bottomSection: {
    alignItems: "center",
    paddingBottom: 32,
  },
  buttonContainer: {
    gap: 14,
    marginBottom: 28,
  },
  loginButton: {
    backgroundColor: "#FFF",
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: "center",
  },
  loginButtonText: {
    color: "#1A1A1A",
    fontSize: 17,
    fontWeight: "600",
  },
  signUpButton: {
    backgroundColor: "#E8873A",
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: "center",
  },
  signUpButtonText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "600",
  },
  socialLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#555",
    letterSpacing: 2,
    marginBottom: 16,
  },
  socialRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 28,
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
  footerText: {
    fontSize: 11,
    color: "#555",
    textAlign: "center",
  },
  footerLink: {
    color: "#E8873A",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});

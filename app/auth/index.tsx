import { Link } from "expo-router";
import { View, Text, StyleSheet, Pressable } from "react-native";

export default function AuthScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Food Review App</Text>
      <Text style={styles.subtitle}>Join the community</Text>

      <View style={styles.buttonContainer}>
        <Link href="/auth/login" asChild>
          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>Log In</Text>
          </Pressable>
        </Link>
        <Link href="/auth/register" asChild>
          <Pressable style={[styles.button, styles.registerButton]}>
            <Text style={[styles.buttonText, styles.registerButtonText]}>Sign Up</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: "#666",
    marginBottom: 48,
  },
  buttonContainer: {
    width: "100%",
    gap: 12,
  },
  button: {
    backgroundColor: "#000",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  registerButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#000",
  },
  registerButtonText: {
    color: "#000",
  },
});
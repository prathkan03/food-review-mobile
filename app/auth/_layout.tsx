import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="login" 
        options={{ 
          title: "Log In",
          headerBackTitle: "Back"
        }} 
      />
      <Stack.Screen 
        name="register" 
        options={{ 
          title: "Sign Up",
          headerBackTitle: "Back"
        }} 
      />
    </Stack>
  );
}

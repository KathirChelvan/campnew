import React, { useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext"; // Import our custom hook
import Colors from "../constants/Colors";

export default function RedirectHandler() {
  const { isInitialized, isLoading, isAdmin, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        // Only proceed with navigation when auth context is fully initialized
        if (!isInitialized) {
          return; // Wait for auth to initialize
        }

        console.log("🔄 Auth state initialized, handling redirection...");

        if (!isSignedIn) {
          console.log("🛑 User not signed in, redirecting to /login");
          router.replace("/login");
          return;
        }

        // Wait for a small delay to ensure everything is settled
        setTimeout(() => {
          if (isAdmin) {
            console.log("✅ User is admin. Redirecting to /admin");
            router.replace("/admin");
          } else {
            console.log("🟢 Redirecting to /(tabs)/home (Not Admin)");
            router.replace("/(tabs)/home");
          }
        }, 300);
      } catch (error) {
        console.error("🔥 Error in redirect handler:", error);
        // Safe fallback
        router.replace("/(tabs)/home");
      }
    };

    handleRedirect();
  }, [isInitialized, isAdmin, isSignedIn, router]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color={Colors.PRIMARY} />
      <Text style={{ marginTop: 20, fontFamily: "Roboto-med" }}>
        Setting up your experience...
      </Text>
    </View>
  );
}
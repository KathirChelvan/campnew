import { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import Colors from "../constants/Colors";

export default function Index() {
  const { isInitialized, isLoading, isAdmin, isSignedIn, userIsLoaded } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (!userIsLoaded || isLoading) {
      return; // Wait for everything to load
    }

    const redirectToAppropriateScreen = async () => {
      console.log("🚀 Initial navigation - Auth state:", { isSignedIn, isAdmin, isInitialized });
      
      // Don't navigate if we're already on the login screen
      if (segments[0] === 'login') return;
      
      if (!isSignedIn) {
        console.log("➡️ Redirecting to login");
        router.replace("/login");
      } else if (isAdmin) {
        console.log("➡️ Redirecting to admin");
        router.replace("/admin");
      } else {
        console.log("➡️ Redirecting to home");
        router.replace("/(tabs)/home");
      }
    };

    // Only redirect when auth is fully initialized
    if (isInitialized) {
      redirectToAppropriateScreen();
    }
  }, [isInitialized, isAdmin, isSignedIn, userIsLoaded, isLoading, router, segments]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color={Colors.PRIMARY} />
      <Text style={{ marginTop: 20, fontFamily: "Roboto-med" }}>
        Loading...
      </Text>
    </View>
  );
}
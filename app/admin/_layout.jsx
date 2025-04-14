import React from "react";
import { Redirect, Stack } from "expo-router";
import { View, Text, ActivityIndicator } from "react-native";
import { useAuth } from "../../context/AuthContext"; // ✅ Use AuthContext
import Colors from "../../constants/Colors";

export default function AdminLayout() {
  const { isInitialized, isLoading, isAdmin, isSignedIn } = useAuth(); // ✅ Get admin status from AuthContext

  // ✅ Show loading screen while checking admin status
  if (!isInitialized || isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={Colors.PRIMARY} />
        <Text style={{ marginTop: 20, fontFamily: "Roboto-med" }}>
          Verifying admin access...
        </Text>
      </View>
    );
  }

  // ✅ Redirect if user is NOT signed in
  if (!isSignedIn) {
    return <Redirect href="/login" />;
  }

  // ✅ Redirect if user is NOT an admin
  if (!isAdmin) {
    return <Redirect href="/(tabs)/home" />;
  }

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Admin Dashboard",
          headerShown: true,
          headerStyle: { backgroundColor: Colors.PRIMARY },
          headerTintColor: Colors.WHITE,
          headerTitleStyle: { fontFamily: "Roboto-bold" },
        }}
      />
      <Stack.Screen
        name="manage-events"
        options={{
          title: "Manage Events",
          headerShown: true,
          headerStyle: { backgroundColor: Colors.PRIMARY },
          headerTintColor: Colors.WHITE,
          headerTitleStyle: { fontFamily: "Roboto-bold" },
        }}
      />
      <Stack.Screen
        name="user-management"
        options={{
          title: "User Management",
          headerShown: true,
          headerStyle: { backgroundColor: Colors.PRIMARY },
          headerTintColor: Colors.WHITE,
          headerTitleStyle: { fontFamily: "Roboto-bold" },
        }}
      />
      <Stack.Screen
  name="event-reporting"
  options={{
    title: "Submit Event Report",
    headerShown: true,
  }}
/>

      <Stack.Screen
        name="analytics"
        options={{
          title: "Analytics",
          headerShown: true,
          headerStyle: { backgroundColor: Colors.PRIMARY },
          headerTintColor: Colors.WHITE,
          headerTitleStyle: { fontFamily: "Roboto-bold" },
        }}
      />
      <Stack.Screen
        name="event-summary"
        options={{
          title: "Submit Event Summary",
          headerShown: true,
          headerStyle: { backgroundColor: Colors.PRIMARY },
          headerTintColor: Colors.WHITE,
          headerTitleStyle: { fontFamily: "Roboto-bold" },
        }}
      />
    </Stack>
  );
}

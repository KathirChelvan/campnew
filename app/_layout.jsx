import React, { useEffect, useState } from 'react';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ClerkProvider, ClerkLoaded, useAuth as useClerkAuth } from '@clerk/clerk-expo';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';

const tokenCache = {
  async getToken(key) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('SecureStore get item error:', error);
      return null;
    }
  },
  async saveToken(key, value) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (err) {
      console.error('SecureStore save item error:', err);
    }
  },
};

function AuthWrapper({ children }) {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useClerkAuth();
  const [role, setRole] = useState(null);

  useEffect(() => {
    const checkRoleAndRedirect = async () => {
      try {
        const storedRole = await AsyncStorage.getItem('userRole');
        if (storedRole) {
          setRole(storedRole);
          if (storedRole === 'admin') router.replace('/admin');
          else if (storedRole === 'manager') router.replace('/manager');
          else router.replace('/(tabs)/home');
        }
      } catch (error) {
        console.error('Error fetching stored role:', error);
      }
    };

    if (isLoaded) {
      if (!isSignedIn) {
        router.replace('/login');
      } else {
        checkRoleAndRedirect();
      }
    }
  }, [isLoaded, isSignedIn]);

  if (!isLoaded) {
    return null; // Or a loading spinner
  }

  return children;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'outfit-reg': require('./../assets/fonts/Outfit-Regular.ttf'),
    'outfit-med': require('./../assets/fonts/Outfit-Medium.ttf'),
    'outfit-bold': require('./../assets/fonts/Outfit-Bold.ttf'),
    'Roboto-reg': require('./../assets/fonts/Roboto-Regular.ttf'),
    'Roboto-med': require('./../assets/fonts/Roboto-Medium.ttf'),
    'Roboto-bold': require('./../assets/fonts/Roboto-Bold.ttf'),
  });

  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!fontsLoaded) {
    return null; // Or a loading spinner
  }

  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
      <ClerkLoaded>
        <AuthWrapper>
          <ThemeProvider>
            <AuthProvider>
            <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="admin" options={{ headerShown: false }} />
            <Stack.Screen name="manager" options={{ headerShown: false }} />
            <Stack.Screen name="login/index" options={{ headerShown: false }} />
            <Stack.Screen name="redirect-handler" options={{ headerShown: false }} />
          </Stack>

            </AuthProvider>
          </ThemeProvider>
        </AuthWrapper>
      </ClerkLoaded>
    </ClerkProvider>
  );
}

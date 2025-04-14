import React, { createContext, useState, useEffect, useContext } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create a context for the theme
export const ThemeContext = createContext();

// Theme provider component
export const ThemeProvider = ({ children }) => {
  const deviceTheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load the saved theme preference when the app starts
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Load theme from AsyncStorage
  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'dark');
      } else {
        // If no saved preference, use device's default theme
        setIsDarkMode(deviceTheme === 'dark');
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Save theme preference to AsyncStorage
  const saveThemePreference = async (isDark) => {
    try {
      await AsyncStorage.setItem('theme', isDark ? 'dark' : 'light');
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  // Toggle theme function
  const toggleTheme = () => {
    setIsDarkMode(prevMode => {
      const newMode = !prevMode;
      saveThemePreference(newMode);
      return newMode;
    });
  };

  // Define theme colors
  const theme = {
    isDarkMode,
    toggleTheme,
    isLoading,
    colors: isDarkMode 
      ? {
          // Dark theme colors
          background: '#121212',
          card: '#1E1E1E',
          text: '#FFFFFF',
          subText: '#B0B0B0',
          primary: '#4285F4',
          secondary: '#BB86FC',
          border: '#2C2C2C',
          notification: '#CF6679',
          icon: '#FFFFFF',
          tab: '#1E1E1E',
          tabActive: '#4285F4',
          tabInactive: '#888888',
        }
      : {
          // Light theme colors
          background: '#FFFFFF',
          card: '#F5F5F5',
          text: '#000000',
          subText: '#5F5F5F',
          primary: '#4285F4',
          secondary: '#03DAC6',
          border: '#E0E0E0',
          notification: '#F50057',
          icon: '#2C2C2C',
          tab: '#FFFFFF',
          tabActive: '#4285F4',
          tabInactive: '#888888',
        }
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme
export const useTheme = () => useContext(ThemeContext);
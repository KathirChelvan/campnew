import { View, Text } from 'react-native';
import React from 'react';
import { Tabs } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Colors from "../../constants/Colors";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '../../context/ThemeContext';


export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.tab,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTintColor: colors.text,
      }}
    >
      <Tabs.Screen 
        name="home" 
        options={{ 
          title: 'Home', 
          headerShown: false,
          tabBarIcon: ({ color }) => <Feather name="home" size={24} color={color} />
        }} 
      />
      
      <Tabs.Screen 
        name="favorite" 
        options={{ 
          title: 'Favourite', 
          headerShown: false,
          tabBarIcon: ({ color }) => <MaterialIcons name="favorite" size={24} color={color} />
        }} 
      />
      
      <Tabs.Screen 
        name="search" 
        options={{ 
          title: 'Search', 
          headerShown: false,
          tabBarIcon: ({ color }) => <Feather name="search" size={26} color={color} />
        }} 
      />
      
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: 'Profile', 
          headerShown: false,
          tabBarIcon: ({ color }) => <FontAwesome6 name="face-laugh-wink" size={26} color={color} />
        }} 
      />
    </Tabs>
  );
}

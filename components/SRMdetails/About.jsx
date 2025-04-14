import { View, Text, Pressable, Animated } from 'react-native';
import React, { useState, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';

export default function About({ SRM }) {
  const [expanded, setExpanded] = useState(false);
  const { colors, isDarkMode } = useTheme();
  const animatedHeight = useRef(new Animated.Value(0)).current;

  const toggleReadMore = () => {
    setExpanded(!expanded);
    Animated.timing(animatedHeight, {
      toValue: expanded ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  return (
    <View style={{ 
      padding: 16, 
      backgroundColor: colors.card || colors.background,
      marginHorizontal: 12,
      marginVertical: 8,
      borderRadius: 12,
      shadowColor: isDarkMode ? '#000' : '#555',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    }}>
      <Text style={{
        fontFamily: 'outfit-med',
        fontSize: 22,
        color: colors.text,
        marginBottom: 8
      }}>
        About {SRM?.name}
      </Text>

      <Text 
        numberOfLines={expanded ? undefined : 3} 
        style={{
          fontFamily: 'outfit-reg',
          fontSize: 15,
          color: colors.text,
          lineHeight: 22,
          marginBottom: 8,
        }}
      >
        {SRM?.About}
      </Text>

      <Pressable 
        onPress={toggleReadMore}
        style={({ pressed }) => [{
          alignSelf: 'flex-start',
          paddingVertical: 4,
          paddingHorizontal: 8,
          borderRadius: 20,
          backgroundColor: pressed ? `${colors.primary}20` : 'transparent',
        }]}
      >
        <Text style={{
          fontFamily: 'outfit-med',
          fontSize: 15,
          color: colors.primary
        }}>
          {expanded ? 'Read Less' : 'Read More'}
        </Text>
      </Pressable>
    </View>
  );
}
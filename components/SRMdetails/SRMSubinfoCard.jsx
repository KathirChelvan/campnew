import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import React from 'react';
import Colors from '../../constants/Colors';

export default function SRMSubinfoCard({ 
  icon, 
  title, 
  value, 
  onPress, 
  highlighted = false,
  themeColors,
  isDarkMode
}) {
  const getBgColor = () => {
    if (highlighted) {
      return isDarkMode ? `${themeColors.primary}30` : `${themeColors.primary}15`;
    }
    return isDarkMode ? themeColors.card : Colors.WHITE;
  };

  const getTextColor = () => {
    return isDarkMode && !onPress ? themeColors.text : onPress ? themeColors.primary : Colors.BLACK;
  };

  const getLabelColor = () => {
    return isDarkMode ? themeColors.text + '80' : Colors.GRAY;
  };
  
  return (
    <TouchableOpacity 
      onPress={onPress} 
      disabled={!onPress} 
      activeOpacity={0.7}
      style={styles.touchable}
    >
      <View style={[
        styles.container,
        { 
          backgroundColor: getBgColor(),
          borderColor: isDarkMode ? themeColors.border : '#f0f0f0',
        }
      ]}>
        <Image 
          source={icon} 
          style={styles.icon} 
        />
        <View style={styles.textContainer}>
          <Text style={[
            styles.titleText,
            { color: getLabelColor() }
          ]}>
            {title}
          </Text>
          <Text style={[
            styles.valueText,
            { 
              color: getTextColor(),
              textDecorationLine: onPress ? 'underline' : 'none'
            }
          ]}>
            {value}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchable: {
    flex: 1,
    padding: 5,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    height: 85,
    gap: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  icon: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  textContainer: {
    flex: 1,
  },
  titleText: {
    fontFamily: 'outfit-reg',
    fontSize: 14,
    marginBottom: 4,
  },
  valueText: {
    fontFamily: 'outfit-med',
    fontSize: 16,
  }
});
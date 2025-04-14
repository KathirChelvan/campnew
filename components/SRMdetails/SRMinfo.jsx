import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import MarkFav from '../MarkFav';
import { LinearGradient } from 'expo-linear-gradient';

export default function SRMinfo({ SRM }) {
  const { colors, isDarkMode } = useTheme();
  const windowWidth = Dimensions.get('window').width;

  return (
    <View>
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: SRM?.imageUrl }}
          style={styles.coverImage}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.gradient}
        />
      </View>
      
      <View style={{
        marginTop: -60,
        padding: 20,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <View style={styles.nameContainer}>
          <Text style={{
            fontFamily: 'outfit-bold',
            fontSize: 26,
            color: '#fff',
            textShadowColor: 'rgba(0, 0, 0, 0.75)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 4
          }}>
            {SRM?.name}
          </Text>
          {SRM?.Category && (
            <View style={{
              backgroundColor: colors.primary,
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 20,
              alignSelf: 'flex-start',
              marginTop: 8
            }}>
              <Text style={{
                fontFamily: 'outfit-med',
                fontSize: 12,
                color: '#fff'
              }}>
                {SRM?.Category}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.favContainer}>
          <MarkFav SRM={SRM}/>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 350,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
  },
  nameContainer: {
    flex: 1,
  },
  favContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 30,
    padding: 10,
  }
});
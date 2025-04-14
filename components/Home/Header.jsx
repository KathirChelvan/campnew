import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useUser as useClerkUser } from '@clerk/clerk-expo';
import { useAuthState } from 'react-firebase-hooks/auth';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { auth as firebaseAuth } from '../../config/FirebaseConfig';

export default function Header() {
  const { user: clerkUser } = useClerkUser();
  const [firebaseUser] = useAuthState(firebaseAuth);
  const { colors, isDarkMode } = useTheme();

  const user = clerkUser || firebaseUser;
  const defaultImage = require('../../assets/images/default avatar.jpg');

  const profileImage = useMemo(() => {
    if (firebaseUser?.photoURL) return { uri: firebaseUser.photoURL };
    if (clerkUser?.imageUrl) return { uri: clerkUser.imageUrl };
    return defaultImage;
  }, [firebaseUser, clerkUser]);

  const userName = useMemo(() => {
    return clerkUser?.fullName || firebaseUser?.displayName || 'User';
  }, [firebaseUser, clerkUser]);

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <View>
          <Text style={[styles.welcomeText, { color: colors.text }]}>Welcome</Text>
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[styles.nameText, { color: colors.text }]}
          >
            {userName}
          </Text>
        </View>

        <View style={[styles.imageWrapper, { backgroundColor: colors.card }]}>
          <LinearGradient
            colors={isDarkMode ? ['#222', '#444'] : ['#4776E6', '#8E54E9']}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Image
              source={profileImage}
              style={[styles.profileImage, { borderColor: colors.background }]}
              resizeMode="cover"
            />
          </LinearGradient>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    marginTop: 10,
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontFamily: 'outfit-reg',
    fontSize: 16,
    marginBottom: 4,
  },
  nameText: {
    fontFamily: 'outfit-med',
    fontSize: 24,
    maxWidth: '90%',
  },
  imageWrapper: {
    padding: 2,
    borderRadius: 999,
  },
  gradient: {
    width: 58,
    height: 58,
    borderRadius: 999,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: 52,
    height: 52,
    borderRadius: 999,
    borderWidth: 2,
  },
});

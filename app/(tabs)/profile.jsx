import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Animated,
  Alert,
  Image,
  useColorScheme,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import defaultAvatar from '../../assets/images/default avatar.jpg';
import { useAuth } from '../../context/AuthContext'; // ✅ Add this
import { useAuth as useClerkAuth, useUser as useClerkUser } from '@clerk/clerk-expo';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth as firebaseAuth, signOut as firebaseSignOut } from '../../config/FirebaseConfig';

const Profile = () => {
  const { signOut: clerkSignOut } = useClerkAuth();
  const { user: clerkUser } = useClerkUser();
  const [firebaseUser] = useAuthState(firebaseAuth);
  const router = useRouter();
  const systemColorScheme = useColorScheme();

  // Theme state management
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSystemTheme, setIsSystemTheme] = useState(true);

  // Update dark mode based on system or user preference
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const themePreference = await AsyncStorage.getItem('themePreference');
        const useSystemTheme = await AsyncStorage.getItem('useSystemTheme');
        
        setIsSystemTheme(useSystemTheme === 'true');
        
        if (useSystemTheme === 'true') {
          setIsDarkMode(systemColorScheme === 'dark');
        } else if (themePreference) {
          setIsDarkMode(themePreference === 'dark');
        } else {
          setIsDarkMode(systemColorScheme === 'dark');
        }
      } catch (error) {
        console.log('Error loading theme preference:', error);
        setIsDarkMode(systemColorScheme === 'dark');
      }
    };
    
    loadThemePreference();
  }, [systemColorScheme]);

  // Define a toggle theme function that updates state and AsyncStorage
  const toggleTheme = async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    try {
      await AsyncStorage.setItem('themePreference', newMode ? 'dark' : 'light');
      await AsyncStorage.setItem('useSystemTheme', 'false');
      setIsSystemTheme(false);
    } catch (error) {
      console.log('Error saving theme preference:', error);
    }
  };

  // Dynamic theme colors based on current theme
  const themeColors = {
    BACKGROUND: isDarkMode ? "#121212" : "#f9f9f9",
    TEXT: isDarkMode ? "#ffffff" : "#121212",
    GRAY: isDarkMode ? "#a0a0a0" : "#555",
    MENU_BACKGROUND: isDarkMode ? "#1e1e1e" : "#ffffff",
    BORDER: isDarkMode ? "#333333" : "#e0e0e0",
    PRIMARY: "#6c5ce7",
    LIGHTGREY: isDarkMode ? "#2c2c2c" : "#f2f2f2",
    WHITE: isDarkMode ? "#121212" : "#ffffff",
    CARD_BACKGROUND: isDarkMode ? "#1e1e1e" : "#ffffff",
  };

  const isClerkUser = !!clerkUser;
  const user = isClerkUser ? clerkUser : firebaseUser;
  const { isAdmin } = useAuth(); // ✅ Use values from AuthContext

  const Menu = [
    { id: 1, name: 'Favorites', icon: 'heart', path: '/(tabs)/favorite' },
    { id: 2, name: 'My Registered Events', icon: 'calendar', path: '/profile/my-events' },
    { id: 3, name: 'Search', icon: 'search', path: '/(tabs)/search' },
    { id: 4, name: 'Help & Support', icon: 'help-circle', path: '/profile/help-support' },
    { id: 5, name: 'Logout', icon: 'exit', path: 'logout' },
  ];

  const scrollY = useRef(new Animated.Value(0)).current;
  const profileScaleAnim = useRef(new Animated.Value(0)).current;
  const menuItemAnimations = useRef(Menu.map(() => new Animated.Value(0))).current;
  const themeToggleAnim = useRef(new Animated.Value(0)).current;
  const adminAnim = useRef(new Animated.Value(0)).current;

  // Run entrance animations when component mounts
  useEffect(() => {
    Animated.sequence([
      Animated.timing(profileScaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(themeToggleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.stagger(
        50,
        menuItemAnimations.map(anim =>
          Animated.spring(anim, {
            toValue: 1,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          })
        )
      ),
      Animated.timing(adminAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const handleSignOut = async () => {
    try {
      if (isClerkUser) {
        await clerkSignOut();
      } else {
        await firebaseSignOut(firebaseAuth);
      }
      await AsyncStorage.clear();
      setTimeout(() => router.replace("/login"), 500);
    } catch (err) {
      console.error("Sign out failed", err);
    }
  };

  const userName = useMemo(() => {
    return user?.fullName || user?.displayName || "User";
  }, [user]);

  const isLongName = userName.length > 20;
  const userInitials = userName.split(' ').map(n => n?.[0] || '').join('').toUpperCase();

  const handleMenuPress = (menu) => {
    const index = Menu.findIndex((m) => m.id === menu.id);
    Animated.sequence([
      Animated.timing(menuItemAnimations[index], {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(menuItemAnimations[index], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    if (menu.path === "logout") {
      Alert.alert("Sign Out", "Are you sure you want to sign out?", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign Out", style: "destructive", onPress: handleSignOut },
      ]);
    } else {
      router.push(menu.path);
    }
  };

  // Animation values
  const imageScale = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [1, 0.75],
    extrapolate: "clamp",
  });

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [0, -20],
    extrapolate: "clamp",
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [1, 0.9],
    extrapolate: "clamp",
  });

  const renderMenuItem = ({ item, index }) => {
    const isLogout = item.name === "Logout";
    return (
      <Animated.View
        style={{
          transform: [
            { scale: menuItemAnimations[index] },
            {
              translateY: menuItemAnimations[index].interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }),
            },
          ],
          opacity: menuItemAnimations[index],
        }}
      >
        <TouchableOpacity
          style={[
            styles.menuItem,
            {
              backgroundColor: isLogout
                ? isDarkMode
                  ? "#4a0000"
                  : "#fff5f5"
                : themeColors.MENU_BACKGROUND,
              borderColor: themeColors.BORDER,
            },
          ]}
          onPress={() => handleMenuPress(item)}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: isLogout
                  ? isDarkMode
                    ? "#600"
                    : "#ffecec"
                  : isDarkMode
                  ? "#333"
                  : themeColors.LIGHTGREY,
              },
            ]}
          >
            <Ionicons
              name={item.icon}
              size={22}
              color={isLogout ? "#ff3b30" : themeColors.PRIMARY}
            />
          </View>
          <Text
            style={[
              styles.menuText,
              {
                color: isLogout ? "#ff3b30" : themeColors.TEXT,
                fontFamily: "Roboto-med",
              },
            ]}
          >
            {item.name}
          </Text>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={isLogout ? "#ff3b30" : themeColors.GRAY}
          />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.BACKGROUND }]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />

      {/* Header with fixed height - use only transform and opacity for animation */}
      <View style={[styles.header, { backgroundColor: themeColors.BACKGROUND }]}>
        <Animated.View
          style={{
            alignItems: 'center',
            transform: [
              { scale: profileScaleAnim },
              { translateY: headerTranslateY }
            ],
            opacity: headerOpacity,
          }}
        >
          {user?.photoURL || user?.imageUrl ? (
            <Animated.Image
              source={
                firebaseUser?.photoURL
                  ? { uri: firebaseUser.photoURL }
                  : clerkUser?.imageUrl
                  ? { uri: clerkUser.imageUrl }
                  : defaultAvatar
              }          
              style={[
                styles.avatar, 
                { 
                  borderColor: themeColors.BORDER,
                  transform: [{ scale: imageScale }]
                }
              ]}
            />
          ) : (
            <Animated.View style={[
              styles.initialsContainer,
              { 
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: themeColors.PRIMARY,
                borderColor: themeColors.BORDER,
                borderWidth: 2,
                transform: [{ scale: imageScale }],
                justifyContent: 'center',
                alignItems: 'center',
              }
            ]}>
              <Text style={styles.initialsText}>{userInitials}</Text>
            </Animated.View>
          )}
          <Text 
            style={[styles.name, { color: themeColors.TEXT }]}
            numberOfLines={isLongName ? 2 : 1}
            ellipsizeMode="tail"
          >
            {userName}
          </Text>
          <Text style={[styles.email, { color: themeColors.GRAY }]}>
            {firebaseUser?.email || clerkUser?.emailAddresses?.[0]?.emailAddress || ""}
          </Text>
        </Animated.View>
      </View>

      <Animated.FlatList
        data={Menu}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMenuItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        ListHeaderComponent={
          <>
            <Animated.View
              style={{
                opacity: themeToggleAnim,
                transform: [
                  {
                    translateY: themeToggleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
                marginBottom: 12,
              }}
            >
              <TouchableOpacity
                style={[
                  styles.themeToggleContainer,
                  {
                    backgroundColor: themeColors.MENU_BACKGROUND,
                    borderColor: themeColors.BORDER,
                  },
                ]}
                onPress={toggleTheme}
                activeOpacity={0.8}
              >
                <View style={styles.themeTextContainer}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: isDarkMode ? "#333" : themeColors.LIGHTGREY },
                    ]}
                  >
                    <Ionicons
                      name={isDarkMode ? "moon" : "sunny"}
                      size={22}
                      color={themeColors.PRIMARY}
                    />
                  </View>
                  <Text style={[styles.menuText, { color: themeColors.TEXT }]}>
                    {isDarkMode ? "Dark Mode" : "Light Mode"}
                  </Text>
                </View>
                
                {/* Theme toggle switch - combining both implementations */}
                <View style={styles.toggleSwitchContainer}>
                  <View
                    style={[
                      styles.themeToggleTrack,
                      { 
                        backgroundColor: isDarkMode 
                          ? 'rgba(108, 92, 231, 0.3)' 
                          : 'rgba(108, 92, 231, 0.1)' 
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.themeToggleThumb,
                      { 
                        backgroundColor: themeColors.PRIMARY,
                        transform: [{ translateX: isDarkMode ? 20 : 0 }] 
                      },
                    ]}
                  />
                </View>
              </TouchableOpacity>
            </Animated.View>

            {isAdmin && (
              <Animated.View
                style={{
                  opacity: adminAnim,
                  transform: [
                    {
                      translateY: adminAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }),
                    },
                  ],
                  marginBottom: 16,
                }}
              >
                <TouchableOpacity
                  style={[
                    styles.adminOption,
                    {
                      backgroundColor: isDarkMode ? "#2c2542" : "#f5f0ff",
                      borderLeftColor: themeColors.PRIMARY,
                      borderColor: themeColors.BORDER,
                    },
                  ]}
                  onPress={() => router.replace("/admin")}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.adminIconContainer,
                      { backgroundColor: themeColors.PRIMARY },
                    ]}
                  >
                    <Ionicons
                      name="shield-checkmark"
                      size={22}
                      color={isDarkMode ? "#121212" : themeColors.WHITE}
                    />
                  </View>
                  <View style={styles.adminTextContainer}>
                    <Text
                      style={[
                        styles.adminOptionText,
                        { color: isDarkMode ? "#e0b5ff" : themeColors.PRIMARY },
                      ]}
                    >
                      Admin Dashboard
                    </Text>
                    <Text style={[styles.adminSubtitle, { color: themeColors.GRAY }]}>
                      Manage events, users, and more
                    </Text>
                  </View>
                  <View style={styles.chevronContainer}>
                    <Ionicons name="chevron-forward" size={20} color={themeColors.PRIMARY} />
                  </View>
                </TouchableOpacity>
              </Animated.View>
            )}
            
            <Text style={[
              styles.sectionTitle, 
              { color: themeColors.GRAY }
            ]}>
              MENU OPTIONS
            </Text>
          </>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    paddingHorizontal: 16, 
    paddingTop: 48,
  },
  header: {
    height: 160,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  avatar: { 
    width: 80,
    height: 80,
    borderRadius: 40, 
    marginBottom: 12,
    borderWidth: 2,
  },
  initialsContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
  },
  name: { 
    fontSize: 20, 
    fontWeight: '600',
    textAlign: 'center',
    maxWidth: '90%',
  },
  email: { 
    fontSize: 14, 
    marginTop: 4,
    textAlign: 'center',
  },
  listContainer: { 
    paddingTop: 16, 
    paddingBottom: 32,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  iconContainer: { 
    marginRight: 12, 
    padding: 10, 
    borderRadius: 12,
  },
  menuText: { 
    fontSize: 16, 
    fontWeight: '500',
    flex: 1,
  },
  themeToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginBottom: 16,
  },
  themeTextContainer: { 
    flexDirection: 'row', 
    alignItems: 'center',
    flex: 1,
  },
  toggleSwitchContainer: {
    position: 'relative',
    width: 50,
    height: 30,
    justifyContent: 'center',
  },
  themeToggleTrack: {
    position: 'absolute',
    width: 46,
    height: 24,
    borderRadius: 12,
  },
  themeToggleThumb: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  adminOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderLeftWidth: 5,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginBottom: 16,
  },
  adminIconContainer: { 
    padding: 10, 
    borderRadius: 10, 
    marginRight: 12 
  },
  adminTextContainer: { 
    flex: 1 
  },
  adminOptionText: { 
    fontSize: 16, 
    fontWeight: '600', 
    marginBottom: 2 
  },
  adminSubtitle: { 
    fontSize: 13 
  },
  chevronContainer: { 
    marginLeft: 8 
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 10,
    letterSpacing: 1.2,
  },
});

export default Profile;
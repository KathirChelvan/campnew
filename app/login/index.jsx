import { View, Text, Image, Pressable, Animated, Dimensions, StatusBar } from "react-native";
import React, { useCallback, useState, useEffect, useRef } from "react";
import Colors from "../../constants/Colors";
import * as WebBrowser from "expo-web-browser";
import { useOAuth } from "@clerk/clerk-expo";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../config/FirebaseConfig";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome } from "@expo/vector-icons";
import EmailAuthForm from "../../components/EmailAuthForm"; // Import the email auth component
import { useAuth } from "../../context/AuthContext"; // Import the updated auth hook

export const useWarmUpBrowser = () => {
  React.useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  useWarmUpBrowser();
  const router = useRouter();
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  
  // Use our unified auth context
  const { isSignedIn, user, isLoading } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const screenHeight = Dimensions.get("window").height;
  const [showEmailForm, setShowEmailForm] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    // Animate elements in on load
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    const checkRoleAndRedirect = async () => {
      // Only proceed if user is signed in and not already loading
      if (!isSignedIn || isLoading) return;
      
      try {
        console.log("✅ User Signed In:", user.id);
        
        // First check if we need to create a default role document for Firebase users
        // Note: This won't create a document if it already exists
        if (user.id && user.id.startsWith('firebase:')) {
          // This is a Firebase user ID, we might want to store Firebase UID in Firestore
          // only if needed for role tracking
          const userId = user.id.replace('firebase:', '');
          
          // Check if user document exists
          const userDoc = await getDoc(doc(db, "users", userId));
          if (!userDoc.exists()) {
            // OPTIONAL: Create a basic user document with role 'user'
            // REMOVE THIS IF YOU DON'T WANT TO CREATE DOCUMENTS
            // await setDoc(doc(db, "users", userId), {
            //   email: user.email,
            //   role: "user",
            //   createdAt: new Date().toISOString()
            // });
            // console.log("Created user document with default role");
          }
        }

        // Get role from Firestore
        const userDoc = await getDoc(doc(db, "users", user.id));
        const role = userDoc.exists() ? userDoc.data().role : "user";

        console.log("🔍 Fetched Role from Firestore:", role || "default user");

        let destination;
        if (role === "admin") {
          destination = "/admin";  // Admin page
        } else if (role === "manager") {
          destination = "/manager";  // Manager page
        } else {
          destination = "/(tabs)/home";  // Default home page
        }

        console.log(`🚀 Redirecting to ${destination}`);
        router.replace(destination);
      } catch (error) {
        console.error("❌ Error checking user role:", error);
        console.log("⚠️ Redirecting to default home page due to error");
        router.replace("/(tabs)/home"); // Default to home if error occurs
      }
    };
  
    checkRoleAndRedirect();
  }, [isSignedIn, user, isLoading]);

  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.95,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const onGooglePress = useCallback(async () => {
    if (loading) return;

    try {
      setLoading(true);
      console.log("🔄 Starting OAuth login...");

      const { createdSessionId, setActive } = await startOAuthFlow({
        redirectUrl: Linking.createURL("/redirect-handler"),
      });

      if (createdSessionId) {
        console.log("✅ OAuth successful. Session ID:", createdSessionId);
        await setActive({ session: createdSessionId });
      } else {
        console.log("⚠️ Session creation failed.");
      }
    } catch (err) {
      console.error("❌ OAuth error:", err);
    } finally {
      setLoading(false);
    }
  }, [loading, startOAuthFlow]);

  // Toggle email form
  const toggleEmailForm = () => {
    setShowEmailForm(!showEmailForm);
  };

  // Floating circles background elements
  const renderBackgroundCircles = () => {
    return (
      <>
        <Animated.View 
          style={{
            position: 'absolute',
            width: 200,
            height: 200,
            borderRadius: 100,
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            top: screenHeight * 0.05,
            right: -50,
            opacity: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.7]
            }),
          }}
        />
        <Animated.View 
          style={{
            position: 'absolute',
            width: 150,
            height: 150,
            borderRadius: 75,
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            bottom: screenHeight * 0.1,
            left: -30,
            opacity: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.5]
            }),
          }}
        />
      </>
    );
  };

  // If already signed in and loading is complete, don't render the login UI
  if (isSignedIn && !isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Redirecting...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.WHITE }}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.WHITE} />
      {renderBackgroundCircles()}
      
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.8)', 'rgba(240, 249, 255, 0.9)']}
        style={{ flex: 1, paddingHorizontal: 20 }}
      >
        {showEmailForm ? (
          <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 20 }}>
            <EmailAuthForm onClose={toggleEmailForm} />
          </View>
        ) : (
          <Animated.View 
            style={{ 
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }}
          >
            <Image
              source={require("./../../assets/images/CampusLink1.png")}
              style={{ 
                width: '100%', 
                height: 300, 
                resizeMode: 'contain',
                marginBottom: 10,
              }}
            />
            
            <Animated.View 
              style={{ 
                width: '100%',
                alignItems: 'center',
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
                marginTop: 8,
              }}
            >
              <Text 
                style={{ 
                  fontFamily: "Roboto-bold", 
                  fontSize: 26,
                  color: '#1e40af',
                  textAlign: "center",
                  marginBottom: 10
                }}
              >
                Welcome to CampusLink
              </Text>
              
              <Text 
                style={{ 
                  fontFamily: "Roboto-reg", 
                  fontSize: 15,
                  textAlign: "center", 
                  color: Colors.GRAY,
                  marginBottom: 8,
                  lineHeight: 22,
                  paddingHorizontal: 10
                }}
              >
                Where Ideas Take Flight. Connect, collaborate, and engage in campus events, workshops, and clubs.
              </Text>
              
              <Animated.View 
                style={{
                  width: '100%',
                  marginTop: 20,
                  transform: [{ scale: buttonScale }]
                }}
              >
                <Pressable
                  onPress={onGooglePress}
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  disabled={loading}
                  style={{
                    paddingVertical: 16,
                    paddingHorizontal: 24,
                    backgroundColor: loading ? '#94a3b8' : '#FACC15',
                    width: "100%",
                    borderRadius: 16,
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 10,
                    elevation: 5,
                  }}
                >
                  {loading ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ 
                        fontFamily: "Roboto-med", 
                        fontSize: 18, 
                        color: '#1F2937',
                        marginRight: 10
                      }}>
                        Signing In...
                      </Text>
                    </View>
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <FontAwesome name="google" size={20} color="#1F2937" style={{ marginRight: 12 }} />
                      <Text style={{ 
                        fontFamily: "Roboto-med", 
                        fontSize: 18, 
                        color: '#1F2937'
                      }}>
                        Continue with Google
                      </Text>
                    </View>
                  )}
                </Pressable>
                
                {/* Email Sign In Button */}
                <Pressable
                  onPress={toggleEmailForm}
                  style={{
                    paddingVertical: 16,
                    paddingHorizontal: 24,
                    backgroundColor: '#3b82f6',
                    width: "100%",
                    borderRadius: 16,
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginTop: 12,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 10,
                    elevation: 5,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <FontAwesome name="envelope" size={20} color="#FFFFFF" style={{ marginRight: 12 }} />
                    <Text style={{ 
                      fontFamily: "Roboto-med", 
                      fontSize: 18, 
                      color: '#FFFFFF'
                    }}>
                      Continue with Email
                    </Text>
                  </View>
                </Pressable>
              </Animated.View>
              
              <Animated.Text 
                style={{
                  fontFamily: "Roboto-reg",
                  fontSize: 12,
                  color: '#64748b',
                  marginTop: 16,
                  textAlign: 'center',
                  opacity: fadeAnim
                }}
              >
                By continuing, you're stepping into a world of student collaboration! 🚀
              </Animated.Text>
            </Animated.View>
          </Animated.View>
        )}
      </LinearGradient>
    </View>
  );
}
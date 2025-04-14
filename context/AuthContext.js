import React, { createContext, useState, useContext, useEffect } from "react";
import { useUser } from "@clerk/clerk-expo";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../config/FirebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile
} from "firebase/auth";
import { AppState } from "react-native"; // 🔁 Import for app resume handling

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const { isLoaded: clerkIsLoaded, isSignedIn: clerkIsSignedIn, user: clerkUser } = useUser();
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const isSignedIn = clerkIsSignedIn || !!firebaseUser;
  const user = clerkUser || firebaseUser;
  const userIsLoaded = clerkIsLoaded || !isLoading;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Firebase auth state changed:", user ? "User exists" : "No user");
      setFirebaseUser(user);
    });
    return () => unsubscribe();
  }, []);

  const getUserDisplayInfo = (user) => {
    if (!user) return null;

    if (user.uid) {
      return {
        id: user.uid,
        name: user.displayName || user.email.split('@')[0],
        email: user.email,
        imageUrl: user.photoURL || null,
      };
    }

    if (user.id) {
      return {
        id: user.id,
        name: user.firstName || user.username || user.emailAddresses[0].emailAddress.split('@')[0],
        email: user.emailAddresses[0]?.emailAddress,
        imageUrl: user.imageUrl,
      };
    }

    return null;
  };

  const loadUserRole = async () => {
    try {
      setIsLoading(true);
      const userId = clerkUser?.id || firebaseUser?.uid;
      if (!userId) {
        setIsAdmin(false);
        setIsManager(false);
        setIsInitialized(true);
        setIsLoading(false);
        return;
      }

      console.log("Checking Firestore for user role");
      const userDoc = await getDoc(doc(db, "users", userId));

      if (userDoc.exists()) {
        const role = userDoc.data().role;
        console.log("Found role in Firestore:", role);
        setIsAdmin(role === "admin");
        setIsManager(role === "manager");
        await AsyncStorage.setItem("userRole", role);
      } else {
        console.log("No role found, setting as user");
        setIsAdmin(false);
        setIsManager(false);
        await AsyncStorage.setItem("userRole", "user");
      }

      setIsInitialized(true);
    } catch (error) {
      console.error("❌ Error loading role:", error);
      setIsAdmin(false);
      setIsManager(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (clerkIsSignedIn || firebaseUser) {
      loadUserRole();
    } else if (clerkIsLoaded) {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, [clerkIsLoaded, clerkIsSignedIn, clerkUser, firebaseUser]);

  // 🔁 Handle app resume to refresh role
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active" && (firebaseUser || clerkIsSignedIn)) {
        loadUserRole();
      }
    });
    return () => subscription.remove();
  }, [firebaseUser, clerkIsSignedIn]);

  // Firebase auth methods
  const signUpWithEmail = async (email, password, displayName) => {
    try {
      setAuthError(null);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) {
        await updateProfile(userCredential.user, { displayName });
      }
      return userCredential.user;
    } catch (error) {
      setAuthError(error.message);
      throw error;
    }
  };

  const signInWithEmail = async (email, password) => {
    try {
      setAuthError(null);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      setAuthError(error.message);
      throw error;
    }
  };

  const resetPassword = async (email) => {
    try {
      setAuthError(null);
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      setAuthError(error.message);
      throw error;
    }
  };

  const signOutUser = async () => {
    try {
      setAuthError(null);
      await signOut(auth);
      await AsyncStorage.removeItem("userRole");
    } catch (error) {
      setAuthError(error.message);
      throw error;
    }
  };

  const value = {
    isAdmin,
    isManager,
    isInitialized,
    isLoading,
    userIsLoaded,
    isSignedIn,
    user: isSignedIn ? getUserDisplayInfo(user) : null,
    authError,
    signUpWithEmail,
    signInWithEmail,
    resetPassword,
    signOut: signOutUser, // ✅ <-- Add this line
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

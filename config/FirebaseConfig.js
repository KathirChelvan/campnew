import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import {
  initializeAuth,
  getReactNativePersistence,
  signOut
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ✅ Firebase config
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: "campuslink-33c6b.firebaseapp.com",
  projectId: "campuslink-33c6b",
  storageBucket: "campuslink-33c6b.appspot.com",
  messagingSenderId: "703647517346",
  appId: "1:703647517346:web:198fa2077a51722f1f25fb",
  measurementId: "G-J01SQT9HWG"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Auth with persistence using AsyncStorage
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);
export const storage = getStorage(app);
export { signOut };

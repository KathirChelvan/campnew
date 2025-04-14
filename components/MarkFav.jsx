import { View, Pressable, ActivityIndicator } from 'react-native';
import React, { useEffect, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import Shared from './../Shared/Shared';
import { useUser as useClerkUser } from '@clerk/clerk-expo';
import { getAuth } from 'firebase/auth';

export default function MarkFav({ SRM }) {
  const { user: clerkUser } = useClerkUser();
  const [user, setUser] = useState(null);
  const [favList, setFavList] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Sync user from Clerk or Firebase
  useEffect(() => {
    const syncUser = () => {
      const auth = getAuth();
      const firebaseUser = auth.currentUser;

      if (clerkUser?.id) {
        return {
          id: clerkUser.id,
          email: clerkUser.primaryEmailAddress?.emailAddress,
          name: clerkUser.fullName,
          imageUrl: clerkUser.imageUrl,
          provider: 'clerk',
        };
      } else if (firebaseUser?.email) {
        return {
          id: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || 'Anonymous',
          imageUrl: firebaseUser.photoURL,
          provider: 'firebase',
        };
      }
      return null;
    };

    const newUser = syncUser();

    if (JSON.stringify(user) !== JSON.stringify(newUser)) {
      console.log("📩 Current user:", newUser);
      setUser(newUser);
    }
  }, [clerkUser]);

  // ✅ Fetch favorites only when user changes
  useEffect(() => {
    if (user) {
      GetFav();
    }
  }, [user]);

  const GetFav = async () => {
    setLoading(true);
    try {
      const result = await Shared.GetFavList(user);
      console.log("🟢 Fetched favorites:", result);
      setFavList(result.favorites || []);
    } catch (error) {
      console.error("❌ Error fetching favorites:", error);
      setFavList([]);
    } finally {
      setLoading(false);
    }
  };

  const AddToFav = async () => {
    if (!SRM?.name || !user?.email) {
      console.error("❌ Invalid SRM Name or user email");
      return;
    }

    try {
      const favResult = [...(favList || []), SRM.name];
      await Shared.UpdateFav(user, favResult);
      console.log("🟢 Added to favorites:", favResult);
      setFavList(favResult);
    } catch (error) {
      console.error("❌ Error adding to favorites:", error);
    }
  };

  const removeFromFav = async () => {
    if (!SRM?.name || !user?.email) {
      console.error("❌ Invalid SRM Name or user email");
      return;
    }

    try {
      const favResult = favList.filter(item => item !== SRM.name);
      await Shared.UpdateFav(user, favResult);
      console.log("🟢 Removed from favorites:", favResult);
      setFavList(favResult);
    } catch (error) {
      console.error("❌ Error removing from favorites:", error);
    }
  };

  return (
    <View>
      {loading ? (
        <ActivityIndicator size="large" color="blue" />
      ) : favList?.includes(SRM?.name) ? (
        <Pressable onPress={removeFromFav}>
          <Ionicons name="heart" size={30} color="red" />
        </Pressable>
      ) : (
        <Pressable onPress={AddToFav}>
          <Ionicons name="heart-outline" size={30} color="black" />
        </Pressable>
      )}
    </View>
  );
}

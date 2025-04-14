import { View, Text, FlatList, RefreshControl, ScrollView } from 'react-native';
import React, { useEffect, useState } from 'react';
import Shared from '../../Shared/Shared';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../config/FirebaseConfig';
import SRMListItem from './../../components/Home/SRMListItem';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext'; // ✅ Use unified auth

export default function Favorite() {
  const { colors } = useTheme();
  const { user, isSignedIn } = useAuth(); // ✅ Unified auth user
  const [FavSRMList, setFavSRMList] = useState([]);
  const [loader, setLoader] = useState(false);

  const GetFavSRMList = async () => {
    if (!user) return;

    setLoader(true);
    try {
      const result = await Shared.GetFavList(user);

      if (result?.favorites && result.favorites.length > 0) {
        console.log('🟢 Favorite post names:', result.favorites);
        await GetFavSRMByNames(result.favorites);
      } else {
        console.log('⚠️ No favorites found.');
        setFavSRMList([]);
      }
    } catch (error) {
      console.error('❌ Error fetching favorites:', error);
    } finally {
      setLoader(false);
    }
  };

  const GetFavSRMByNames = async (favoriteNames) => {
    try {
      let fetchedSRMList = [];

      const batchSize = 10;
      for (let i = 0; i < favoriteNames.length; i += batchSize) {
        const batch = favoriteNames.slice(i, i + batchSize);
        const q = query(collection(db, 'Works'), where('name', 'in', batch));
        const querySnapshot = await getDocs(q);
        fetchedSRMList = [...fetchedSRMList, ...querySnapshot.docs.map((doc) => doc.data())];
      }

      console.log('🟢 Fetched favorite SRM list:', fetchedSRMList);
      setFavSRMList(fetchedSRMList);
    } catch (error) {
      console.error('❌ Error fetching SRM list:', error);
    }
  };

  const handleRefresh = () => GetFavSRMList();

  useEffect(() => {
    if (isSignedIn && user) {
      console.log("📩 Current user:", user);
      GetFavSRMList();
    }
  }, [isSignedIn, user]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: 20 }}>
      <Text style={{ fontFamily: 'outfit-med', fontSize: 30, marginLeft: 20, color: colors.text }}>
        Favourites
      </Text>

      {FavSRMList.length === 0 && !loader ? (
        <ScrollView
          refreshControl={<RefreshControl refreshing={loader} onRefresh={handleRefresh} />}
          contentContainerStyle={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <Text style={{ textAlign: 'center', marginTop: 20, color: colors.text }}>
            No favourites to display.
          </Text>
        </ScrollView>
      ) : (
        <FlatList
          data={FavSRMList}
          numColumns={2}
          contentContainerStyle={{ padding: 20 }}
          renderItem={({ item }) => (
            <View style={{ flex: 1, margin: 10 }}>
              <SRMListItem SRM={item} />
            </View>
          )}
          keyExtractor={(item, index) => index.toString()}
          refreshControl={<RefreshControl refreshing={loader} onRefresh={handleRefresh} />}
        />
      )}
    </View>
  );
}

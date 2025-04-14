// In SRMListByCategory.jsx
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import React, { useEffect, useState } from 'react';
import Category from './Category';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../config/FirebaseConfig';
import SRMListItem from './SRMListItem';
import Colors from '../../constants/Colors';

export default function SRMListByCategory() {
  const [SRMList, setSRMList] = useState([]);
  const [loader, setLoader] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Clubs');
  
  useEffect(() => {
    GetSRMList('Clubs');
  }, []);
  
  const GetSRMList = async (category) => {
    setLoader(true);
    setSRMList([]); // Clear list before fetching
    setSelectedCategory(category);
  
    const q = query(collection(db, 'Works'), where('category', '==', category));
    const querySnapshot = await getDocs(q);
  
    const fetchedList = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  
    setSRMList(fetchedList);
    setLoader(false);
  };
  
  return (
    <View style={styles.container}>
      {/* Category component at the top - non-scrollable */}
      <Category 
        category={(value) => GetSRMList(value)} 
        selectedCategory={selectedCategory}
      />
      
      {loader ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.PRIMARY} />
          <Text style={styles.loadingText}>Loading {selectedCategory}...</Text>
        </View>
      ) : (
        <FlatList
          data={SRMList}
          numColumns={2}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          scrollEnabled={true} // Enable FlatList scrolling since it's no longer in a ScrollView
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <SRMListItem SRM={item} />
          )}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            !loader && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No items found in this category</Text>
              </View>
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  row: {
    flex: 1,
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  loaderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 30,
  },
  loadingText: {
    marginTop: 10,
    fontFamily: 'outfit-med',
    color: Colors.GRAY,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontFamily: 'outfit-med',
    fontSize: 16,
    color: Colors.GRAY,
    textAlign: 'center',
  }
});
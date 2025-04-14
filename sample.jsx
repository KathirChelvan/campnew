import { StyleSheet, View, SafeAreaView, StatusBar, FlatList, Text, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import Header from '../../components/Home/Header';
import Slider from '../../components/Home/Slider';
import Colors from '../../constants/Colors';
import SRMListItem from '../../components/Home/SRMListItem';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../config/FirebaseConfig';
import { useTheme } from '../../context/ThemeContext';

const CategorySelector = ({ categories, selectedCategory, onSelectCategory, colors }) => {

  return (
    <View style={styles.categoryContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryItem,
              { backgroundColor: colors.card, borderColor: colors.border }, 
              selectedCategory === category && { backgroundColor: '#FFD700', borderColor: '#FFD700' }
            ]}
            
            
            
            onPress={() => onSelectCategory(category)}
          >
            <Text
              style={[
                styles.categoryText,
                { color: colors.text }, 
                selectedCategory === category && { color: 'black' } // ✅ Change to black for readability
              ]}
              
              
              
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default function HomeScreen() {

  const { colors, isDarkMode } = useTheme();
  const [SRMList, setSRMList] = useState([]);
  const [loader, setLoader] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Clubs');

  const categories = ['Clubs', 'Hackathon', 'Events', 'Intern'];

  const handleCategoryChange = useCallback((category) => {
    console.log("Category changed to:", category);
    setSelectedCategory(category);
    fetchListForCategory(category);
  }, []);

  const fetchListForCategory = async (category) => {
    setLoader(true);
    setSRMList([]);

    const q = query(collection(db, 'Works'), where('category', '==', category));
    const querySnapshot = await getDocs(q);

    const fetchedList = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    setSRMList(fetchedList);
    setLoader(false);
  };

  useEffect(() => {
    fetchListForCategory('Clubs');
  }, []);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
    <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.background} />

    <View style={[styles.container, { backgroundColor: colors.background }]}>

        <Header />
        <FlatList
          data={SRMList}
          numColumns={2}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View>
              <Slider />
              <CategorySelector
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={handleCategoryChange}
                colors={colors} // 🔥 Pass colors as a prop
              />

              <View style={styles.currentCategoryContainer}>
              <Text style={[styles.currentCategory, { color: colors.text }]}>
                  {selectedCategory} ({SRMList.length})
                </Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            !loader && (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.text }]}>No items found in {selectedCategory}</Text>

              </View>
            )
          }
          renderItem={({ item }) => (
            <SRMListItem SRM={item} />
          )}
          keyExtractor={(item) => item.id}
          ListFooterComponent={
            loader && (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={Colors.PRIMARY} />
                <Text style={[styles.loadingText, { color: colors.text }]}>Loading {selectedCategory}...</Text>

              </View>
            )
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  container: {
    flex: 1,
    padding: 20,
    paddingBottom: 0,
  },
  row: {
    flex: 1,
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  categoryContainer: {
    marginTop: 15,
    marginBottom: 10,
  },
  categoryItem: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: Colors.WHITE,
    borderWidth: 1,
    borderColor: Colors.GRAY,
  },
  selectedCategoryItem: {
    backgroundColor: Colors.PRIMARY,
    borderColor: Colors.PRIMARY,
  },
  categoryText: {
    fontFamily: 'outfit-med',
    fontSize: 14,
    color: Colors.GRAY,
  },
  selectedCategoryText: {
    color: Colors.WHITE,
  },
  currentCategoryContainer: {
    marginTop: 15,
    marginBottom: 10,
  },
  currentCategory: {
    fontFamily: 'outfit-med',
    fontSize: 18,
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

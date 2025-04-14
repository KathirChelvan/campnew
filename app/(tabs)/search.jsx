import { View, TextInput, FlatList, SafeAreaView, StatusBar, StyleSheet, TouchableOpacity } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/FirebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import SRMListItem from '../../components/Home/SRMListItem';
import { useTheme } from '../../context/ThemeContext';

export default function SearchScreen() {
    const theme = useTheme();
    const colors = theme?.colors || {};  // Ensures colors is defined
    const isDarkMode = theme?.isDarkMode || false;
    const router = useRouter();
    const [searchText, setSearchText] = useState('');
    const [posts, setPosts] = useState([]);
    const [filteredPosts, setFilteredPosts] = useState([]);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        const snapshot = await getDocs(collection(db, 'Works'));
        const fetchedPosts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        setPosts(fetchedPosts);
        setFilteredPosts(fetchedPosts);
    };

    const handleSearch = (text) => {
        setSearchText(text);
        if (text === '') {
            setFilteredPosts(posts);
        } else {
            const filtered = posts.filter(post => post.name.toLowerCase().includes(text.toLowerCase()));
            setFilteredPosts(filtered);
        }
    };

    return (
        <SafeAreaView style={[styles.safeContainer, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.background} />

            {/* Search Bar Container */}
            <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
                <Ionicons name="search-outline" size={22} color={colors.icon} style={styles.icon} />
                <TextInput
                    style={[styles.searchInput, { color: colors.text }]}
                    placeholder="Search by name..."
                    placeholderTextColor={colors.text} // Ensures placeholder adapts to dark mode
                    value={searchText}
                    onChangeText={handleSearch}
                />
                {searchText.length > 0 && (
                    <TouchableOpacity onPress={() => handleSearch('')} style={styles.clearButton}>
                    <Ionicons name="close-circle" size={26} color={colors.icon} />
                </TouchableOpacity>
                
                )}
            </View>

            {/* List of Search Results */}
            <FlatList
                key="grid-view"
                data={filteredPosts}
                numColumns={2}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={{ flex: 1, margin: 10 }}>
                        <SRMListItem SRM={item} />
                    </View>
                )}
                contentContainerStyle={{ paddingHorizontal: 10 }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeContainer: {
        flex: 1,
        paddingTop: 25,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',  // Ensures even spacing
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 12,
        marginHorizontal: 15,
        marginBottom: 10,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    icon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        paddingVertical: 8,
    },
    clearButton: {
        padding: 10,  // Bigger touch area
        borderRadius: 50,// Makes it circular  // Gives some space around clear button
    }
});

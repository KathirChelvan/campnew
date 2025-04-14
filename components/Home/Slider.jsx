import { View, FlatList, Image, StyleSheet, Dimensions, Text } from 'react-native'
import React, { useEffect, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from './../../config/FirebaseConfig'

export default function Slider() {
    const [sliderList, setSliderList] = useState([]);

    useEffect(() => {
        GetSliders();
    }, []);

    const GetSliders = async () => {
        try {
            const snapshot = await getDocs(collection(db, 'Sliders'));
            const sliders = snapshot.docs.map(doc => doc.data());
            console.log("Fetched Sliders:", sliders); // Debugging: Check if URLs are correct
            setSliderList(sliders);
        } catch (error) {
            console.error("Error fetching sliders:", error);
        }
    };

    return (
        <View style={{ marginTop: 15 }}>
            <FlatList
                data={sliderList}
                horizontal
                keyExtractor={(item, index) => index.toString()}
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                    <View style={styles.imageContainer}>
                        {item?.imageUrl ? (
                            <Image
                                source={{ uri: item.imageUrl }}
                                style={styles.sliderImage}
                                resizeMode="cover" // Adjust this to "contain" if needed
                                onError={(e) => console.log("Error loading image:", item.imageUrl, e.nativeEvent.error)}
                            />
                        ) : (
                            <Text>Image Not Available</Text>
                        )}
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    imageContainer: {
        width: Dimensions.get('screen').width * 0.84,
        height: 170,
        borderRadius: 15,
        overflow: 'hidden', // Ensures image doesn't overflow rounded borders
        marginRight: 15,
    },
    sliderImage: {
        width: '100%',  // Make image take full width of the container
        height: '100%', // Make image take full height of the container
    }
});

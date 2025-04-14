import { View, Text, TouchableOpacity, TextInput, Image, ScrollView, StyleSheet, Platform, Alert, ToastAndroid, ActivityIndicator, Pressable } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useUser } from "@clerk/clerk-expo";
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import DropDownPicker from "react-native-dropdown-picker";
import Colors from '../../constants/Colors';
import { db, storage, auth } from '../../config/FirebaseConfig';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { ref, getDownloadURL, uploadBytes } from 'firebase/storage';
import { onAuthStateChanged } from 'firebase/auth';

export default function ManageEvents() {
    const router = useRouter();
    const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
    const [firebaseUser, setFirebaseUser] = useState(null);
    const [isAuthChecking, setIsAuthChecking] = useState(true);
    
    const [formData, setFormData] = useState({ 
        formUrl: '',
        Time: new Date().toISOString().split('T')[0],
        whatsappNo: '',
        price: null,
        name: '',
        category: '',
        organizedBy: '',
        Mail: '',
        About: '',
        Insta: ''
    });
    
    const [categories, setCategories] = useState([]);   
    const [image, setImage] = useState(null);
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [openDropdown, setOpenDropdown] = useState(false);
    const [errorLoading, setErrorLoading] = useState(null);
    
    // Default categories as a fallback
    const defaultCategories = [
        { label: "Select Category", value: "Select Category" },
        { label: "Clubs", value: "Clubs" }, 
        { label: "Hackathons", value: "Hackathons" }, 
        { label: "Events", value: "Events" }, 
        { label: "Intern", value: "Intern" }
    ];
    
    // Check for Firebase user
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            console.log("Firebase Auth State Changed:", user);
            setFirebaseUser(user);
            setIsAuthChecking(false); // Mark authentication check as complete
        });
        
        return () => unsubscribe();
    }, []);
    
    useEffect(() => {
        // Fetch categories on component mount
        const loadCategories = async () => {
            setIsLoading(true);
            try {
                console.log("Fetching categories from Firestore...");
                const snapshot = await getDocs(collection(db, 'Category'));
                
                if (snapshot.empty) {
                    console.log("No categories found in Firestore");
                    // Use default categories if Firestore doesn't have any
                    setCategories(defaultCategories);
                } else {
                    const fetchedCategories = snapshot.docs.map(doc => {
                        const data = doc.data();
                        console.log("Category data:", data);
                        return { label: data.name, value: data.name }; // Use name as both label and value for simplicity
                    });
                    console.log("Fetched categories:", fetchedCategories);
                    
                    // Add a default option at the beginning
                    setCategories([
                        { label: "Select Category", value: "Select Category" },
                        ...fetchedCategories
                    ]);
                }
            } catch (error) {
                console.error("Error fetching categories:", error);
                // Provide default categories even when there's an error
                setCategories(defaultCategories);
                setErrorLoading("Failed to load categories from server. Using default categories.");
                showToast("Failed to load categories from server. Using default categories.");
            } finally {
                setIsLoading(false);
            }
        };

        loadCategories();
    }, []);

    // Check if user is authenticated with either Clerk or Firebase
    useEffect(() => {
        // Only check authentication status once both Clerk and Firebase auth checks are complete
        if (isClerkLoaded && !isAuthChecking) {
            const isAuthenticated = clerkUser || firebaseUser;
            
            if (!isAuthenticated) {
                Alert.alert(
                    "Authentication Required", 
                    "You need to be logged in to create an event.",
                    [{ text: "OK", onPress: () => router.replace('/login') }]
                );
            }
        }
    }, [isClerkLoaded, firebaseUser, isAuthChecking, router]);

    const requestPermission = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'We need access to your photos to pick an image.');
          return false;
        }
        return true;
    };
      
    const pickImage = async () => {
        console.log("Picking image...");
        const hasPermission = await requestPermission();
        if (!hasPermission) return;
      
        try {
            // Different options for Android vs iOS
            const options = {
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.8,
            };
            
            // On iOS, enable editing with aspect ratio
            if (Platform.OS === 'ios') {
                options.allowsEditing = true;
                options.aspect = [16, 9];
            }
            
            let result = await ImagePicker.launchImageLibraryAsync(options);
          
            console.log("ImagePicker result:", result);
          
            if (!result.canceled && result.assets && result.assets.length > 0) {
                setImage(result.assets[0].uri);
                console.log("Image set successfully:", result.assets[0].uri);
            }
        } catch (error) {
            console.error("Image picker error:", error);
            Alert.alert("Error", "Failed to pick image. Please try again.");
        }
    };      

    const validateField = (fieldName, value) => {
        let fieldErrors = {...errors};
        
        switch(fieldName) {
            case 'name':
                if (!value || value.trim() === '') {
                    fieldErrors.name = 'Event name is required';
                } else {
                    delete fieldErrors.name;
                }
                break;
            case 'category':
                if (!value || value === 'Select Category' || value.trim() === '') {
                    fieldErrors.category = 'Please select a category';
                } else {
                    delete fieldErrors.category;
                }
                break;
            case 'organizedBy':
                if (!value || value.trim() === '') {
                    fieldErrors.organizedBy = 'Please enter your department';
                } else {
                    delete fieldErrors.organizedBy;
                }
                break;
            case 'whatsappNo':
                if (!value || value.length !== 10) {
                    fieldErrors.whatsappNo = 'Please enter a valid 10-digit WhatsApp number';
                } else {
                    delete fieldErrors.whatsappNo;
                }
                break;
            case 'Mail':
                if (!value || value.trim() === '') {
                    fieldErrors.Mail = 'Email is required';
                } else if (!/^\S+@\S+\.\S+$/.test(value)) {
                    fieldErrors.Mail = 'Please enter a valid email';
                } else {
                    delete fieldErrors.Mail;
                }
                break;
            case 'price':
                if (value < 0) {
                    fieldErrors.price = 'Price cannot be negative';
                } else {
                    delete fieldErrors.price;
                }
                break;
            case 'About':
                if (!value || value.trim() === '') {
                    fieldErrors.About = 'Event description is required';
                } else {
                    delete fieldErrors.About;
                }
                break;
        }
        
        setErrors(fieldErrors);
    };
    
    const handleInputChange = (fieldName, fieldValue) => {
        console.log(`Updating ${fieldName} to:`, fieldValue);
        
        setFormData(prev => ({
            ...prev,
            [fieldName]: fieldName === 'price' 
                ? fieldValue !== null ? Math.round(Number(fieldValue)) : null 
                : fieldValue
        }));
        
        validateField(fieldName, fieldValue);
    };

    const onChangeDate = (event, selectedDate) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setDate(selectedDate);
            handleInputChange('Time', selectedDate.toISOString().split('T')[0]);
        }
    };

    const showToast = (message) => {
        if (Platform.OS === 'android') {
            ToastAndroid.show(message, ToastAndroid.SHORT);
        } else {
            Alert.alert("Notice", message);
        }
    };

    const UploadImage = async () => {
        try {
            if (!image) {
                return null;
            }
            
            console.log("Uploading image to Firebase Storage...");
            const resp = await fetch(image);
            const blobImage = await resp.blob();
            const storageRef = ref(storage, `/CampusLink/${Date.now()}.jpg`);
            
            const snapshot = await uploadBytes(storageRef, blobImage);
            console.log("Image uploaded successfully");
            const downloadUrl = await getDownloadURL(snapshot.ref);
            console.log("Download URL:", downloadUrl);
            return downloadUrl;
        } catch (error) {
            console.error('Image upload failed:', error);
            showToast('Image upload failed. Please try again.');
            return null;
        }
    };

    const validateForm = () => {
        let formErrors = {};
        let isValid = true;
        
        // Validate name
        if (!formData.name || formData.name.trim() === '') {
            formErrors.name = 'Event name is required';
            isValid = false;
        }
        
        // Validate category
        if (!formData.category || formData.category === 'Select Category' || formData.category.trim() === '') {
            formErrors.category = 'Please select a category';
            isValid = false;
        }
        
        // Validate department
        if (!formData.organizedBy || formData.organizedBy.trim() === '') {
            formErrors.organizedBy = 'Please enter your department';
            isValid = false;
        }
        
        // Validate WhatsApp number
        if (!formData.whatsappNo || formData.whatsappNo.length !== 10) {
            formErrors.whatsappNo = 'Please enter a valid 10-digit WhatsApp number';
            isValid = false;
        }
        
        // Validate email
        if (!formData.Mail || formData.Mail.trim() === '') {
            formErrors.Mail = 'Email is required';
            isValid = false;
        } else if (!/^\S+@\S+\.\S+$/.test(formData.Mail)) {
            formErrors.Mail = 'Please enter a valid email';
            isValid = false;
        }
        
        // Validate description
        if (!formData.About || formData.About.trim() === '') {
            formErrors.About = 'Event description is required';
            isValid = false;
        }
        
        // Validate image
        if (!image) {
            formErrors.image = 'Please select an event image';
            isValid = false;
        }
    
        setErrors(formErrors);
        return isValid;
    };
    
    const onSubmit = async () => {
        if (isSubmitting) return;
        
        if (!validateForm()) {
            showToast('Please fix the errors in the form');
            return;
        }
        
        // Check if user is authenticated with either Clerk or Firebase
        if (!clerkUser && !firebaseUser) {
            Alert.alert("Error", "You must be logged in to add an event.");
            return;
        }
        
        setIsSubmitting(true);
    
        try {
            console.log("Checking for existing events with the same name...");
            // Check if a post with the same name already exists
            const snapshot = await getDocs(collection(db, 'Works'));
            const existingPosts = snapshot.docs.map(doc => doc.data().name?.toLowerCase());
    
            if (existingPosts.includes(formData.name.toLowerCase())) {
                showToast('An event with this name already exists.');
                setIsSubmitting(false);
                return;
            }
    
            console.log("Uploading event image...");
            const imageUrl = await UploadImage();
            if (!imageUrl) {
                showToast('Failed to upload image. Please try again.');
                setIsSubmitting(false);
                return;
            }
    
            console.log("Preparing final form data...");
            // Prepare the final data to be stored in Firestore
            const finalFormData = { 
                ...formData, 
                imageUrl,
                views: 0,
                createdAt: new Date().toISOString(),
                // Use email from either Clerk or Firebase
                adminEmail: clerkUser ? 
                    clerkUser.primaryEmailAddress?.emailAddress : 
                    (firebaseUser ? firebaseUser.email : ''),
                Time: formData.Time || new Date().toISOString().split('T')[0],
                formUrl: formData.formUrl || '',
                Insta: formData.Insta || '',
                whatsappNo: formData.whatsappNo,
                price: formData.price !== null ? formData.price : 0
            };    
    
            console.log("Adding event to Firestore...");
            console.log("Event data:", finalFormData);
            await addDoc(collection(db, 'Works'), finalFormData);
            console.log("Event added successfully");
            showToast('Event added successfully!');
            
            // Reset form after successful submission
            setFormData({ 
                formUrl: '', 
                Time: new Date().toISOString().split('T')[0],
                whatsappNo: '',
                price: null,
                name: '',
                category: '',
                organizedBy: '',
                Mail: '',
                About: '',
                Insta: ''
            });
            
            setImage(null);
            setDate(new Date());
            
            // Navigate back after successful submission with a delay
            setTimeout(() => {
                router.back();
            }, 500);

        } catch (error) {
            console.error('Failed to add event:', error);
            showToast('Failed to add event. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // Show loading indicator while categories or auth checks are in progress
    if (isLoading || !isClerkLoaded || isAuthChecking) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.PRIMARY} />
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }
    
    // If auth check is complete and user is not authenticated, show a message
    if (!isAuthChecking && !isLoading && !clerkUser && !firebaseUser) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="lock-closed" size={50} color={Colors.GRAY} />
                <Text style={styles.errorTitle}>Authentication Required</Text>
                <Text style={styles.errorText}>You need to be logged in to create an event.</Text>
                <TouchableOpacity 
                    style={styles.loginButton}
                    onPress={() => router.replace('/login')}
                >
                    <Text style={styles.loginButtonText}>Go to Login</Text>
                </TouchableOpacity>
            </View>
        );
    }
    
    return (
        <ScrollView style={styles.container}>
            <View style={styles.formContainer}>
                <Text style={styles.headerText}>Create a New Event</Text>
                <Text style={styles.subHeaderText}>Fill in the details below to create your event</Text>

                <View style={styles.imageSection}>
                    <Text style={styles.sectionTitle}>Event Image</Text>
                    <Pressable 
                        onPress={pickImage}
                        style={[styles.imagePicker, image && styles.imagePickerWithImage]}
                    >
                        {!image ? (
                            <View style={styles.imagePrompt}>
                                <Ionicons name="camera" size={40} color={Colors.GRAY} />
                                <Text style={styles.imagePromptText}>Tap to add event image</Text>
                                <Text style={styles.imageHintText}>Recommended: 16:9 ratio</Text>
                            </View>
                        ) : (
                            <Image 
                                source={{uri: image}}
                                style={styles.previewImage} 
                            />
                        )}
                    </Pressable>
                    {errors.image && <Text style={styles.errorText}>{errors.image}</Text>}
                </View>

                <View style={styles.formSection}>
                    <Text style={styles.sectionTitle}>Event Details</Text>
                    
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Event Name *</Text>
                        <TextInput
                            style={[styles.input, errors.name && styles.inputError]}
                            onChangeText={(value) => handleInputChange('name', value)}
                            value={formData.name || ''}
                            placeholder="Enter event name"
                            placeholderTextColor={Colors.GRAY}
                        />
                        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Category *</Text>
                        <View style={{ zIndex: 1000, marginBottom: openDropdown ? 150 : 0 }}>
                            <DropDownPicker
                                open={openDropdown}
                                value={formData.category}
                                items={categories}
                                setOpen={setOpenDropdown}
                                setValue={(callback) => {
                                    const value = callback();
                                    handleInputChange('category', value);
                                }}
                                setItems={setCategories}
                                placeholder="Select a category"
                                style={[styles.dropdownStyle, errors.category && styles.inputError]}
                                dropDownContainerStyle={styles.dropdownContainerStyle}
                                listItemContainerStyle={styles.dropdownItemStyle}
                                listMode="SCROLLVIEW"
                                scrollViewProps={{
                                    nestedScrollEnabled: true,
                                }}
                            />
                        </View>
                        {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
                        {errorLoading && <Text style={styles.warningText}>{errorLoading}</Text>}
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Organized By Dept *</Text>
                        <TextInput
                            style={[styles.input, errors.organizedBy && styles.inputError]}
                            onChangeText={(value) => handleInputChange('organizedBy', value)}
                            value={formData.organizedBy || ''}
                            placeholder="Enter department"
                            placeholderTextColor={Colors.GRAY}
                        />
                        {errors.organizedBy && <Text style={styles.errorText}>{errors.organizedBy}</Text>}
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Google Form URL (Optional)</Text>
                        <TextInput
                            style={[styles.input, errors.formUrl && styles.inputError]}
                            onChangeText={(value) => handleInputChange('formUrl', value)}
                            value={formData.formUrl || ''}
                            placeholder="https://forms.google.com/..."
                            placeholderTextColor={Colors.GRAY}
                            keyboardType="url"
                            autoCapitalize="none"
                        />
                        {errors.formUrl && <Text style={styles.errorText}>{errors.formUrl}</Text>}
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>WhatsApp Number *</Text>
                        <TextInput
                            style={[styles.input, errors.whatsappNo && styles.inputError]}
                            placeholder="Enter WhatsApp Number"
                            value={formData.whatsappNo || ''}
                            onChangeText={(value) => handleInputChange('whatsappNo', value)}
                            placeholderTextColor={Colors.GRAY}
                            keyboardType="numeric"
                            maxLength={10}
                        />
                        {errors.whatsappNo && <Text style={styles.errorText}>{errors.whatsappNo}</Text>}
                    </View>
                    
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Price (Optional)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Leave empty if free"
                            keyboardType="numeric"
                            value={formData.price !== null ? formData.price.toString() : ''}
                            onChangeText={(value) => {
                                const numericValue = value.replace(/[^0-9]/g, '');
                                handleInputChange('price', numericValue ? parseInt(numericValue) : null);
                            }}
                            placeholderTextColor={Colors.GRAY}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Instagram Handle (Optional)</Text>
                        <View style={styles.socialInputContainer}>
                            <Text style={styles.socialPrefix}>@</Text>
                            <TextInput
                                style={styles.socialInput}
                                onChangeText={(value) => handleInputChange('Insta', value)}
                                value={formData.Insta || ''}
                                placeholder="instagram_handle"
                                placeholderTextColor={Colors.GRAY}
                            />
                        </View>
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Event Date (Optional)</Text>
                        <TouchableOpacity 
                            onPress={() => setShowDatePicker(true)} 
                            style={styles.input}
                        >
                            <View style={styles.dateContainer}>
                                <Ionicons name="calendar" size={20} color={Colors.GRAY} />
                                <Text style={styles.dateText}>{date.toDateString()}</Text>
                            </View>
                        </TouchableOpacity>

                        {showDatePicker && (
                            <DateTimePicker
                                value={date}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={onChangeDate}
                                minimumDate={new Date()}
                            />
                        )}
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Contact Email *</Text>
                        <TextInput
                            style={[styles.input, errors.Mail && styles.inputError]}
                            onChangeText={(value) => handleInputChange('Mail', value)}
                            value={formData.Mail || ''}
                            placeholder="email@example.com"
                            placeholderTextColor={Colors.GRAY}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        {errors.Mail && <Text style={styles.errorText}>{errors.Mail}</Text>}
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Event Description *</Text>
                        <TextInput
                            style={[styles.textArea, errors.About && styles.inputError]}
                            multiline
                            numberOfLines={5}
                            onChangeText={(value) => handleInputChange('About', value)}
                            value={formData.About || ''}
                            placeholder="Describe your event..."
                            placeholderTextColor={Colors.GRAY}
                            textAlignVertical="top"
                        />
                        {errors.About && <Text style={styles.errorText}>{errors.About}</Text>}
                    </View>
                </View>

                <TouchableOpacity 
                    style={[styles.button, isSubmitting && styles.buttonDisabled]} 
                    onPress={onSubmit}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <View style={styles.buttonContentLoading}>
                            <ActivityIndicator size="small" color="#FFF" />
                            <Text style={styles.buttonTextLoading}>Creating Event...</Text>
                        </View>
                    ) : (
                        <Text style={styles.buttonText}>Create Event</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 20,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        fontFamily: 'outfit-reg',
        color: Colors.GRAY,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 30,
    },
    errorTitle: {
        marginTop: 16,
        fontSize: 22,
        fontFamily: 'outfit-med',
        color: '#333',
    },
    errorText: {
        marginTop: 8,
        fontSize: 16,
        fontFamily: 'outfit-reg',
        color: Colors.GRAY,
        textAlign: 'center',
    },
    loginButton: {
        marginTop: 24,
        paddingVertical: 12,
        paddingHorizontal: 36,
        backgroundColor: Colors.PRIMARY,
        borderRadius: 10,
    },
    loginButtonText: {
        color: Colors.WHITE,
        fontSize: 16,
        fontFamily: 'outfit-med',
    },
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    formContainer: {
        padding: 20,
    },
    headerText: {
        fontSize: 26,
        fontFamily: 'outfit-med',
        marginBottom: 8,
        color: '#222',
    },
    subHeaderText: {
        fontSize: 16,
        fontFamily: 'outfit-reg',
        color: '#666',
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontFamily: 'outfit-med',
        marginBottom: 16,
        color: '#333',
        borderLeftWidth: 3,
        borderLeftColor: Colors.PRIMARY,
        paddingLeft: 10,
    },
    imageSection: {
        marginBottom: 28,
    },
    imagePicker: {
        height: 200,
        borderRadius: 12,
        backgroundColor: '#f1f3f5',
        borderWidth: 2,
        borderColor: '#ddd',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    imagePickerWithImage: {
        borderStyle: 'solid',
        borderColor: Colors.PRIMARY,
    },
    imagePrompt: {
        alignItems: 'center',
    },
    imagePromptText: {
        fontFamily: 'outfit-med',
        fontSize: 16,
        color: Colors.GRAY,
        marginTop: 12,
    },
    imageHintText: {
        fontFamily: 'outfit-reg',
        fontSize: 12,
        color: '#999',
        marginTop: 4,
    },
    previewImage: {
        width: '100%',
        height: '100%',
        borderRadius: 10,
    },
    formSection: {
        marginBottom: 24,
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        marginBottom: 8,
        fontFamily: 'outfit-med',
        fontSize: 16,
        color: '#444',
    },
    input: {
        padding: 14,
        backgroundColor: '#f9f9f9',
        borderRadius: 10,
        fontFamily: 'outfit-reg',
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    dropdownStyle: {
        backgroundColor: '#f9f9f9',
        borderColor: '#e0e0e0',
        borderRadius: 10,
        height: 50,
        paddingHorizontal: 14,
    },
    dropdownContainerStyle: {
        borderColor: '#e0e0e0',
        backgroundColor: '#ffffff',
        borderRadius: 8,
        zIndex: 2000,
    },
    dropdownItemStyle: {
        padding: 8,
    },
    textArea: {
        padding: 14,
        backgroundColor: '#f9f9f9',
        borderRadius: 10,
        fontFamily: 'outfit-reg',
        fontSize: 16,
        height: 120,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        textAlignVertical: 'top',
    },
    socialInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    socialPrefix: {
        paddingLeft: 14,
        fontFamily: 'outfit-med',
        fontSize: 16,
        color: '#666',
    },
    socialInput: {
        flex: 1,
        padding: 14,
        fontFamily: 'outfit-reg',
        fontSize: 16,
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateText: {
        marginLeft: 10,
        fontFamily: 'outfit-reg',
        fontSize: 16,
    },
    inputError: {
        borderColor: '#e74c3c',
        borderWidth: 1,
    },
    errorText: {
        color: '#e74c3c',
        fontFamily: 'outfit-reg',
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
    },
    warningText: {
        color: '#f39c12',
        fontFamily: 'outfit-reg',
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
    },
    button: {
        padding: 16,
        backgroundColor: Colors.PRIMARY,
        borderRadius: 10,
        marginTop: 16,
        marginBottom: 50,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    buttonDisabled: {
        opacity: 0.7,
        backgroundColor: '#999',
    },
    buttonText: {
        fontFamily: 'outfit-med',
        fontSize: 18,
        color: Colors.WHITE,
    },
    buttonContentLoading: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonTextLoading: {
        fontFamily: 'outfit-med',
        fontSize: 18,
        color: Colors.WHITE,
        marginLeft: 8,
    }
});
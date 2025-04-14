import React, { useState, useEffect } from "react";
import { View, ScrollView, Text, Alert, TextInput, TouchableOpacity } from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { getFirestore, collection, getDocs, doc, updateDoc, query, where } from "firebase/firestore";
import { CheckCircle, AlertTriangle } from 'lucide-react-native';

const EventSummary = () => {
    const { user } = useUser();
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [completedEvents, setCompletedEvents] = useState([]);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        headcount: "",
        winners: "",
        winnersWithPrizes: "",
        notableProjects: "",
        workshops: "",
        hackathonThemes: "",
        innovativeIdeas: "",
        guestSpeakers: "",
        performances: "",
        issuesFaced: "",
        suggestions: "",
        details: ""
    });

    const db = getFirestore();

    useEffect(() => {
        const fetchAdminEvents = async () => {
            try {
                const eventsQuery = query(
                    collection(db, "Works"), 
                    where("adminEmail", "==", user.primaryEmailAddress.emailAddress)
                );
                const snapshot = await getDocs(eventsQuery);
                const eventsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
                setEvents(eventsData);
            } catch (error) {
                console.error("❌ Error fetching admin events:", error);
                Alert.alert("Error", "Failed to fetch events");
            }
        };

        fetchAdminEvents();
    }, [user]);

    const handleInputChange = (field, value) => {
        if (field === 'headcount') {
            const numericValue = value.replace(/[^0-9]/g, '');
            setFormData(prev => ({
                ...prev,
                [field]: numericValue
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [field]: value
            }));
        }
    };

    const submitEventSummary = async () => {
        const requiredFields = ['headcount', 'winners', 'hackathonThemes'];
        const optionalFields = [
            'winnersWithPrizes', 'notableProjects', 'workshops', 
            'innovativeIdeas', 'guestSpeakers', 'performances', 
            'issuesFaced', 'suggestions', 'details'
        ];

        const missingFields = requiredFields.filter(field => 
            !formData[field] || 
            (field === 'headcount' && formData[field] === '0')
        );

        if (missingFields.length > 0 || !selectedEvent) {
            Alert.alert(
                "Missing Information", 
                `Please fill in required fields:\n${missingFields.join(", ")}`
            );
            return;
        }

        try {
            const eventRef = doc(db, "Works", selectedEvent.id);
            await updateDoc(eventRef, {
                event_summary: {
                    ...Object.fromEntries(
                        Object.entries(formData)
                            .filter(([key]) => 
                                requiredFields.includes(key) || 
                                (optionalFields.includes(key) && formData[key].trim() !== '')
                            )
                            .map(([key, value]) => 
                                Array.isArray(value) || 
                                key === 'issuesFaced' || 
                                key === 'suggestions' || 
                                key === 'details' 
                                ? [key, value] 
                                : [key, value.split(",").map((item) => item.trim())]
                            )
                    )
                },
            });

            // Add the completed event to the completedEvents list
            setCompletedEvents(prev => [...prev, selectedEvent.id]);

            // Reset form and set submitted state
            setSelectedEvent(null);
            setFormData({
                headcount: "",
                winners: "",
                winnersWithPrizes: "",
                notableProjects: "",
                workshops: "",
                hackathonThemes: "",
                innovativeIdeas: "",
                guestSpeakers: "",
                performances: "",
                issuesFaced: "",
                suggestions: "",
                details: ""
            });
            setIsSubmitted(true);

            // Reset submitted state after 3 seconds
            setTimeout(() => {
                setIsSubmitted(false);
            }, 3000);

            Alert.alert(
                "Success", 
                "Event summary submitted successfully!", 
                [{ 
                    text: "OK", 
                    style: "default",
                    onPress: () => {} 
                }]
            );
        } catch (error) {
            console.error("❌ Error submitting event summary:", error);
            Alert.alert("Error", "Failed to submit event summary.");
        }
    };

    return (
        <ScrollView 
            style={{ 
                flex: 1, 
                backgroundColor: isSubmitted ? '#f6ffed' : '#f4f4f4', 
                padding: 16 
            }}
        >
            <Text style={{ 
                fontSize: 24, 
                fontWeight: 'bold', 
                color: isSubmitted ? '#52c41a' : '#333', 
                marginBottom: 16 
            }}>
                Event Summary Submission
            </Text>
            <Text
            style={{
                fontSize: 16,
        fontWeight: 'bold',
        color: '#d32f2f', // Red color
        marginBottom: 16
                }}
            >⚠️ Please ensure the event is completed before filling this.</Text>

            <View style={{ 
                backgroundColor: isSubmitted ? '#d9f7be' : 'white', 
                borderRadius: 8, 
                padding: 16, 
                marginBottom: 16,
                borderColor: isSubmitted ? '#52c41a' : '#d9d9d9',
                borderWidth: 1
            }}>
                <Text style={{ 
                    fontSize: 18, 
                    fontWeight: 'bold', 
                    marginBottom: 8,
                    color: isSubmitted ? '#52c41a' : '#333'
                }}>
                    Select Event
                </Text>

                {events.map((event) => (
                    <TouchableOpacity 
                        key={event.id}
                        onPress={() => setSelectedEvent(event)}
                        style={{
                            backgroundColor: 
                                completedEvents.includes(event.id) ? '#b7eb8f' :
                                selectedEvent?.id === event.id 
                                    ? (isSubmitted ? '#b7eb8f' : '#e6f7ff') 
                                    : '#f5f5f5',
                            padding: 12,
                            borderRadius: 8,
                            marginBottom: 8,
                            borderWidth: 1,
                            borderColor: 
                                completedEvents.includes(event.id) ? '#52c41a' :
                                selectedEvent?.id === event.id 
                                    ? (isSubmitted ? '#52c41a' : '#1890ff') 
                                    : '#d9d9d9'
                        }}
                    >
                        <View style={{ 
                            flexDirection: 'row', 
                            justifyContent: 'space-between', 
                            alignItems: 'center' 
                        }}>
                            <Text style={{ 
                                color: 
                                    completedEvents.includes(event.id) ? '#52c41a' :
                                    selectedEvent?.id === event.id 
                                        ? (isSubmitted ? '#52c41a' : '#1890ff') 
                                        : '#333',
                                fontWeight: selectedEvent?.id === event.id ? 'bold' : 'normal',
                                flex: 1
                            }}>
                                {event.name}
                            </Text>
                            {completedEvents.includes(event.id) && (
                                <CheckCircle color="#52c41a" size={20} />
                            )}
                        </View>
                    </TouchableOpacity>
                ))}
            </View>

            {selectedEvent && (
                <View style={{ 
                    backgroundColor: isSubmitted ? '#d9f7be' : 'white', 
                    borderRadius: 8, 
                    padding: 16,
                    borderColor: isSubmitted ? '#52c41a' : '#d9d9d9',
                    borderWidth: 1
                }}>
                    <Text style={{ 
                        fontSize: 20, 
                        fontWeight: 'bold', 
                        marginBottom: 16,
                        color: isSubmitted ? '#52c41a' : '#333'
                    }}>
                        {selectedEvent.name} - Summary Details
                    </Text>

                    {[
                        { 
                            label: "Headcount*", 
                            field: "headcount", 
                            keyboardType: "numeric", 
                            required: true,
                            placeholder: "Enter number of participants"
                        },
                        { label: "Winners*", field: "winners", required: true },
                        { label: "Winners with Prizes", field: "winnersWithPrizes" },
                        { label: "Notable Projects", field: "notableProjects" },
                        { label: "Workshops", field: "workshops" },
                        { label: "Hackathon Themes*", field: "hackathonThemes", required: true },
                        { label: "Innovative Ideas", field: "innovativeIdeas" },
                        { label: "Guest Speakers", field: "guestSpeakers" },
                        { label: "Performances", field: "performances" },
                        { label: "Issues Faced", field: "issuesFaced", multiline: true },
                        { label: "Suggestions", field: "suggestions", multiline: true },
                        { label: "Additional Details", field: "details", multiline: true }
                    ].map(({ label, field, keyboardType, multiline, required, placeholder }) => (
                        <View key={field} style={{ marginBottom: 12 }}>
                            <Text style={{ 
                                fontSize: 16, 
                                fontWeight: 'bold', 
                                marginBottom: 8,
                                color: isSubmitted ? '#52c41a' : '#333'
                            }}>
                                {label}
                            </Text>
                            <TextInput
                                style={{ 
                                    borderWidth: 1, 
                                    borderColor: isSubmitted ? '#52c41a' : '#d9d9d9', 
                                    borderRadius: 8, 
                                    padding: 10,
                                    minHeight: multiline ? 100 : 40,
                                    backgroundColor: isSubmitted ? '#f6ffed' : 'white'
                                }}
                                placeholder={placeholder || `Enter ${label.replace('*', '').toLowerCase()}`}
                                value={formData[field]}
                                onChangeText={(text) => handleInputChange(field, text)}
                                keyboardType={field === 'headcount' ? "numeric" : "default"}
                                multiline={multiline}
                                numberOfLines={multiline ? 4 : 1}
                                editable={!isSubmitted}
                            />
                        </View>
                    ))}

                    <TouchableOpacity 
                        onPress={submitEventSummary}
                        disabled={isSubmitted}
                        style={{
                            backgroundColor: isSubmitted ? '#52c41a' : '#52c41a',
                            opacity: isSubmitted ? 0.5 : 1,
                            padding: 12,
                            borderRadius: 8,
                            flexDirection: 'row',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginTop: 16
                        }}
                    >
                        <CheckCircle color="white" size={20} style={{ marginRight: 8 }} />
                        <Text style={{ 
                            color: 'white', 
                            fontWeight: 'bold', 
                            fontSize: 16 
                        }}>
                            {isSubmitted ? 'Submitted' : 'Submit Summary'}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
        </ScrollView>
    );
};

export default EventSummary;
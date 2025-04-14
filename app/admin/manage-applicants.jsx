import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import React, { useEffect, useState } from "react";
import { collection, getDocs, doc, updateDoc, query, where } from "firebase/firestore";
import { db } from "../../config/FirebaseConfig";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";

export default function ManageApplicants() {
    const { user } = useUser();
    const [applicants, setApplicants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false); // Added for Pull-to-Refresh
    const [filter, setFilter] = useState("all"); // "all", "pending", "accepted"

    useEffect(() => {
        if (user) {
            fetchApplicants(user.primaryEmailAddress.emailAddress);
        }
    }, [user]);

    const fetchApplicants = async (adminEmail) => {
        setLoading(true);
        try {
            const postsQuery = query(collection(db, "Works"), where("adminEmail", "==", adminEmail));
            const postsSnapshot = await getDocs(postsQuery);
            const adminEvents = postsSnapshot.docs.map(doc => doc.data().name);

            if (adminEvents.length === 0) {
                setApplicants([]);
                setLoading(false);
                return;
            }

            const applicantsQuery = query(collection(db, "Applications"), where("eventName", "in", adminEvents));
            const applicantsSnapshot = await getDocs(applicantsQuery);
            const applications = applicantsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            setApplicants(applications.filter(applicant => applicant.status !== "Rejected"));
        } catch (error) {
            console.error("Error fetching applicants:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchApplicants(user.primaryEmailAddress.emailAddress);
        setRefreshing(false);
    };

    const acceptApplicant = async (applicantId) => {
        try {
            await updateDoc(doc(db, "Applications", applicantId), { status: "Accepted" });
            fetchApplicants(user.primaryEmailAddress.emailAddress);
        } catch (error) {
            console.error("Error accepting applicant:", error);
        }
    };

    const rejectApplicant = async (applicantId) => {
        try {
            await updateDoc(doc(db, "Applications", applicantId), { status: "Rejected" });
            setApplicants(prevApplicants => prevApplicants.filter(app => app.id !== applicantId));
        } catch (error) {
            console.error("Error rejecting applicant:", error);
        }
    };

    const filteredApplicants = filter === "all" 
        ? applicants 
        : applicants.filter(app => app.status.toLowerCase() === filter);

    const renderStatusBadge = (status) => {
        let badgeStyle = styles.badgePending;
        let textStyle = styles.badgeTextPending;
        let text = "Pending";
        
        if (status === "Accepted") {
            badgeStyle = styles.badgeAccepted;
            textStyle = styles.badgeTextAccepted;
            text = "Accepted";
        }
        
        return (
            <View style={badgeStyle}>
                <Text style={textStyle}>{text}</Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Manage Applicants</Text>
                <Text style={styles.subtitle}>Review applications for your events</Text>
            </View>

            <View style={styles.filterContainer}>
                <TouchableOpacity 
                    style={[styles.filterButton, filter === "all" && styles.filterButtonActive]}
                    onPress={() => setFilter("all")}>
                    <Text style={[styles.filterText, filter === "all" && styles.filterTextActive]}>All</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.filterButton, filter === "pending" && styles.filterButtonActive]}
                    onPress={() => setFilter("pending")}>
                    <Text style={[styles.filterText, filter === "pending" && styles.filterTextActive]}>Pending</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.filterButton, filter === "accepted" && styles.filterButtonActive]}
                    onPress={() => setFilter("accepted")}>
                    <Text style={[styles.filterText, filter === "accepted" && styles.filterTextActive]}>Accepted</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4F46E5" />
                    <Text style={styles.loadingText}>Loading applicants...</Text>
                </View>
            ) : filteredApplicants.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="people-outline" size={64} color="#9CA3AF" />
                    <Text style={styles.emptyText}>No applicants found</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredApplicants}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                    refreshing={refreshing} // Pull-to-Refresh indicator
                    onRefresh={handleRefresh} // Pull-to-Refresh action
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <View style={styles.userInfo}>
                                    <View style={styles.avatarContainer}>
                                        <Text style={styles.avatarText}>
                                            {item.userEmail.charAt(0).toUpperCase()}
                                        </Text>
                                    </View>
                                    <View style={styles.userDetails}>
                                        <Text style={styles.emailText} numberOfLines={1} ellipsizeMode="tail">
                                            {item.userEmail}
                                        </Text>
                                        <Text style={styles.eventName} numberOfLines={1} ellipsizeMode="tail">
                                            {item.eventName}
                                        </Text>
                                    </View>
                                </View>
                                {renderStatusBadge(item.status)}
                            </View>

                            <View style={styles.actionContainer}>
                                {item.status === "Pending" ? (
                                    <>
                                        <TouchableOpacity 
                                            style={styles.acceptButton}
                                            onPress={() => acceptApplicant(item.id)}>
                                            <Ionicons name="checkmark" size={16} color="#fff" />
                                            <Text style={styles.acceptButtonText}>Accept</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                            style={styles.rejectButton}
                                            onPress={() => rejectApplicant(item.id)}>
                                            <Ionicons name="close" size={16} color="#fff" />
                                            <Text style={styles.rejectButtonText}>Reject</Text>
                                        </TouchableOpacity>
                                    </>
                                ) : (
                                    <TouchableOpacity 
                                        style={styles.rejectButton}
                                        onPress={() => rejectApplicant(item.id)}>
                                        <Ionicons name="close" size={16} color="#fff" />
                                        <Text style={styles.rejectButtonText}>Remove</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F9FAFB",
        padding: 16,
    },
    header: {
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#111827",
    },
    subtitle: {
        fontSize: 14,
        color: "#6B7280",
        marginTop: 4,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: "#6B7280",
    },
    container: {
        flex: 1,
        backgroundColor: "#F9FAFB",
        padding: 16,
    },
    header: {
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#111827",
    },
    subtitle: {
        fontSize: 14,
        color: "#6B7280",
        marginTop: 4,
    },
    filterContainer: {
        flexDirection: "row",
        marginBottom: 16,
    },
    filterButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        marginRight: 8,
        backgroundColor: "#F3F4F6",
    },
    filterButtonActive: {
        backgroundColor: "#4F46E5",
    },
    filterText: {
        fontSize: 14,
        color: "#6B7280",
    },
    filterTextActive: {
        color: "#FFFFFF",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: "#6B7280",
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    emptyText: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#374151",
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: "#6B7280",
        marginTop: 8,
        textAlign: "center",
    },
    listContent: {
        paddingBottom: 20,
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    userInfo: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    avatarContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#4F46E5",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    avatarText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "bold",
    },
    userDetails: {
        flex: 1,
    },
    emailText: {
        fontSize: 16,
        fontWeight: "500",
        color: "#111827",
    },
    eventName: {
        fontSize: 14,
        color: "#6B7280",
        marginTop: 2,
    },
    badgePending: {
        backgroundColor: "#FEF3C7",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeTextPending: {
        color: "#D97706",
        fontSize: 12,
        fontWeight: "500",
    },
    badgeAccepted: {
        backgroundColor: "#DCFCE7",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeTextAccepted: {
        color: "#059669",
        fontSize: 12,
        fontWeight: "500",
    },
    actionContainer: {
        flexDirection: "row",
        justifyContent: "flex-end",
    },
    acceptButton: {
        backgroundColor: "#059669",
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginRight: 8,
    },
    acceptButtonText: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "500",
        marginLeft: 4,
    },
    rejectButton: {
        backgroundColor: "#EF4444",
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    rejectButtonText: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "500",
        marginLeft: 4,
    },
});
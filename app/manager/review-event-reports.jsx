import React, { useEffect, useState, useContext, useCallback } from "react";
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet,
  RefreshControl,
  TextInput,
  Modal
} from "react-native";
import { useRouter } from "expo-router";
import { 
  collection, 
  getDocs
} from "firebase/firestore";
import { db } from "../../config/FirebaseConfig";
import { AuthContext } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../context/constants/Colors";

const ReviewEventReports = () => {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [submittedReports, setSubmittedReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOptions, setSortOptions] = useState([]);
  const [isSortModalVisible, setIsSortModalVisible] = useState(false);

  // Sorting and Filtering Function
  const getSortedAndFilteredReports = useCallback(() => {
    let filteredReports = tab === "all" 
      ? posts 
      : submittedReports.filter(post => post.event_summary);

    // Filter by search query
    filteredReports = filteredReports.filter(post => 
      post.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort reports with multiple criteria
    return filteredReports.sort((a, b) => {
      for (let sortOption of sortOptions) {
        const headcountA = a.event_summary?.headcount || 0;
        const headcountB = b.event_summary?.headcount || 0;

        switch(sortOption) {
          case "organizedBy_CINTEL":
            if (a.organizedBy === "CINTEL" && b.organizedBy !== "CINTEL") return -1;
            if (a.organizedBy !== "CINTEL" && b.organizedBy === "CINTEL") return 1;
            break;
          case "organizedBy_CTECH":
            if (a.organizedBy === "CTECH" && b.organizedBy !== "CTECH") return -1;
            if (a.organizedBy !== "CTECH" && b.organizedBy === "CTECH") return 1;
            break;
          case "organizedBy_CORE":
            if (a.organizedBy === "CORE" && b.organizedBy !== "CORE") return -1;
            if (a.organizedBy !== "CORE" && b.organizedBy === "CORE") return 1;
            break;
          case "headcountDesc":
            return headcountB - headcountA;
          case "headcountAsc":
            return headcountA - headcountB;
          case "nameAsc":
            return a.name.localeCompare(b.name);
          case "nameDesc":
            return b.name.localeCompare(a.name);
        }
      }
      return 0;
    });
  }, [posts, submittedReports, tab, searchQuery, sortOptions]);

  // Fetch Event Reports
  const fetchEventReports = useCallback(async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, "Works"));
      const allPosts = querySnapshot.docs.map((doc) => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      
      const reports = allPosts.filter(post => 
        post.event_summary && Object.keys(post.event_summary).length > 0
      );
      
      setPosts(allPosts);
      setSubmittedReports(reports);
    } catch (error) {
      console.error("Error fetching event reports:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Refresh Handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchEventReports();
  }, [fetchEventReports]);

  // Initial Fetch
  useEffect(() => {
    fetchEventReports();
  }, [fetchEventReports]);

  // Render Individual Post
  const renderPost = ({ item }) => (
    <TouchableOpacity 
      style={styles.statCard}
      onPress={() => router.push({ 
        pathname: "/manager/event-details", 
        params: { 
          eventId: item.id,
          eventName: item.name,
          eventSummary: JSON.stringify(item.event_summary || {})
        } 
      })}
    >
      <Text style={styles.statValue}>{item.name}</Text>
      
      {/* Display Organized By */}
      <Text style={styles.organizedByText}>
        Organized By: {item.organizedBy || "Unknown"}
      </Text>
  
      {item.event_summary ? (
        <>
          <View style={styles.statDetailsContainer}>
            <View style={styles.statDetailRow}>
              <Text style={styles.statIcon}>👥</Text>
              <Text style={styles.statLabel}>
                Headcount: {item.event_summary?.headcount || "N/A"}
              </Text>
            </View>
            <View style={styles.statDetailRow}>
              <Text style={styles.statIcon}>🏆</Text>
              <Text style={styles.statLabel}>
                Winners: {item.event_summary?.winners?.join(", ") || "N/A"}
              </Text>
            </View>
          </View>
        </>
      ) : (
        <Text style={styles.noSummaryText}>No event summary available</Text>
      )}
    </TouchableOpacity>
  );

  // Sort Modal Component
  const SortModal = () => {
    const availableSortOptions = [
      { key: "organizedBy_CINTEL", label: "Organized by CINTEL" },
      { key: "organizedBy_CTECH", label: "Organized by CTECH" },
      { key: "organizedBy_CORE", label: "Organized by CORE" },
      { key: "headcountDesc", label: "Highest Headcount" },
      { key: "headcountAsc", label: "Lowest Headcount" },
      { key: "nameAsc", label: "Name (A-Z)" },
      { key: "nameDesc", label: "Name (Z-A)" }
    ];

    return (
      <Modal
        transparent={true}
        visible={isSortModalVisible}
        animationType="slide"
        onRequestClose={() => setIsSortModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Sort By</Text>
            {availableSortOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.sortModalOption, 
                  sortOptions.includes(option.key) && styles.activeSortModalOption
                ]}
                onPress={() => {
                  // Toggle sort option
                  setSortOptions(prev => 
                    prev.includes(option.key)
                      ? prev.filter(opt => opt !== option.key)
                      : [...prev, option.key]
                  );
                }}
              >
                <Text style={[
                  styles.sortModalOptionText,
                  sortOptions.includes(option.key) && styles.activeSortModalOptionText
                ]}>
                  {option.label}
                </Text>
                {sortOptions.includes(option.key) && (
                  <Ionicons name="checkmark" size={20} color={Colors.PRIMARY} />
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setIsSortModalVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // Sorting Dropdown Trigger
  const SortDropdownTrigger = () => (
    <TouchableOpacity 
      style={styles.sortDropdownTrigger}
      onPress={() => setIsSortModalVisible(true)}
    >
      <Text style={styles.sortDropdownText}>
        Sort: {getSortOptionsLabel()}
      </Text>
      <Ionicons name="chevron-down" size={20} color={Colors.DARK_GRAY} />
    </TouchableOpacity>
  );

  // Helper function to get sort options label
  const getSortOptionsLabel = () => {
    if (sortOptions.length === 0) return "Sort";
    
    const labelMap = {
      "organizedBy_CINTEL": "CINTEL",
      "organizedBy_CTECH": "CTECH",
      "organizedBy_CORE": "CORE",
      "headcountDesc": "Highest Headcount",
      "headcountAsc": "Lowest Headcount",
      "nameAsc": "Name (A-Z)",
      "nameDesc": "Name (Z-A)"
    };

    return sortOptions.map(opt => labelMap[opt]).join(", ");
  };

  return (
    <View style={styles.safeArea}>
      <Text style={styles.headerTitle}>📜 Event Reports Review</Text>

      <TextInput
        style={styles.searchInput}
        placeholder="Search events..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          onPress={() => setTab("all")} 
          style={[styles.tabButton, tab === "all" && styles.activeTabButton]}
        >
          <Text style={[styles.tabButtonText, tab === "all" && styles.activeTabButtonText]}>
            📌 All Posts
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setTab("submitted")} 
          style={[styles.tabButton, tab === "submitted" && styles.activeTabButton]}
        >
          <Text style={[styles.tabButtonText, tab === "submitted" && styles.activeTabButtonText]}>
            ✅ Submitted Reports
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sort Dropdown Trigger */}
      {tab === "submitted" && <SortDropdownTrigger />}
      
      {/* Sort Modal */}
      <SortModal />

      {loading ? (
        <ActivityIndicator 
          size="large" 
          color={Colors.PRIMARY} 
          style={styles.loader} 
        />
      ) : (
        <FlatList
          data={getSortedAndFilteredReports()}
          keyExtractor={(item) => item.id}
          renderItem={renderPost}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              colors={[Colors.PRIMARY]} 
            />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No events found</Text>
          }
        />
      )}
    </View>
  );
};


const styles = StyleSheet.create({
  // ... (styles remain the same as in previous version)
  safeArea: {
    flex: 1,
    backgroundColor: Colors.WHITE,
    padding: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: Colors.DARK_GRAY,
  },
  searchInput: {
    backgroundColor: Colors.LIGHT_GRAY,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    elevation: 2,
  },
  organizedByText: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.PRIMARY,
    marginBottom: 5,
  },  
  sortButtonContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 15,
  },
  sortButton: {
    padding: 10,
    margin: 5,
    backgroundColor: Colors.LIGHT_GRAY,
    borderRadius: 8,
  },
  activeSortButton: {
    backgroundColor: Colors.PRIMARY,
  },
  sortButtonText: {
    color: Colors.GRAY,
    fontSize: 14,
  },
  activeSortButtonText: {
    color: Colors.WHITE,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
  },
  tabButton: {
    padding: 10,
    marginHorizontal: 10,
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.PRIMARY,
  },
  tabButtonText: {
    fontSize: 16,
    color: Colors.GRAY,
  },
  activeTabButtonText: {
    color: Colors.PRIMARY,
  },
  statCard: {
    backgroundColor: Colors.WHITE,
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: Colors.DARK_GRAY,
  },
  statDetailsContainer: {
    marginBottom: 10,
  },
  statDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  statIcon: {
    marginRight: 8,
    fontSize: 16,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.GRAY,
  },
  detailsButton: {
    backgroundColor: Colors.PRIMARY,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  detailsButtonText: {
    color: Colors.WHITE,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: Colors.GRAY,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noSummaryText: {
    color: Colors.GRAY,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
  },
  noSummaryText: {
    color: Colors.GRAY,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
  },
  sortDropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.LIGHT_GRAY,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: Colors.DARK_GRAY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sortDropdownText: {
    fontSize: 16,
    color: Colors.DARK_GRAY,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.WHITE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 30,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.DARK_GRAY,
    textAlign: 'center',
    marginBottom: 20,
  },
  sortModalOption: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.LIGHT_GRAY,
    alignItems: 'center',
  },
  activeSortModalOption: {
    backgroundColor: Colors.PRIMARY_LIGHT,
  },
  sortModalOptionText: {
    fontSize: 16,
    color: Colors.DARK_GRAY,
  },
  activeSortModalOptionText: {
    color: Colors.PRIMARY,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    marginTop: 15,
    paddingVertical: 15,
    alignItems: 'center',
    backgroundColor: Colors.LIGHT_GRAY,
    borderRadius: 10,
  },
  modalCloseButtonText: {
    fontSize: 16,
    color: Colors.DARK_GRAY,
    fontWeight: '500',
  }
});

export default ReviewEventReports;
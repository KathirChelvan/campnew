import React, { useMemo } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

const EventDetailsScreen = () => {
  const router = useRouter();
  const { eventId, eventName, eventSummary, organizedBy } = useLocalSearchParams();


  // Parse the event summary
  const summary = useMemo(() => {
    try {
      return JSON.parse(eventSummary || '{}');
    } catch (error) {
      console.error('Error parsing event summary:', error);
      return {};
    }
  }, [eventSummary]);

  const renderDetailRow = (label, value) => {
    if (!value) return null;

    return (
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>
          {Array.isArray(value) ? value.join(', ') : value}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <ChevronLeft color="#1E293B" size={24} />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>{eventName}</Text>
      </View>

      <ScrollView 
        style={styles.contentContainer}
        contentContainerStyle={styles.scrollViewContent}
      >
        
        {/* Event Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>📋 Event Summary</Text>
          {renderDetailRow('📢 Organized By', organizedBy)}
          {renderDetailRow('👥 Headcount', summary.headcount)}
          {renderDetailRow('🏆 Winners', summary.winners)}
          {renderDetailRow('🎖 Winners with Prizes', summary.winnersWithPrizes)}
          {renderDetailRow('🔬 Notable Projects', summary.notableProjects)}
          {renderDetailRow('🎤 Guest Speakers', summary.guestSpeakers)}
          {renderDetailRow('📚 Workshops', summary.workshops)}
          {renderDetailRow('🚀 Hackathon Themes', summary.hackathonThemes)}
          {renderDetailRow('💡 Innovative Ideas', summary.innovativeIdeas)}
          {renderDetailRow('🎭 Performances', summary.performances)}
          {renderDetailRow('⚠️ Issues Faced', summary.issuesFaced)}
          {renderDetailRow('💡 Suggestions', summary.suggestions)}

          {/* Detailed Description */}
          {summary.details && (
            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>📝 Detailed Description</Text>
              <Text style={styles.detailsText}>{summary.details}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  backButton: {
    marginRight: 15,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1E293B",
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollViewContent: {
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 16,
    color: "#475569",
    marginRight: 10,
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    color: "#1E293B",
    fontWeight: "600",
    flex: 2,
    flexWrap: 'wrap',
  },
  detailsSection: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  detailsText: {
    fontSize: 15,
    color: "#334155",
    lineHeight: 24,
  },
});

export default EventDetailsScreen;
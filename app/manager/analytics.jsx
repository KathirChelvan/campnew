import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView } from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { PieChart, BarChart } from 'react-native-chart-kit';

import { db } from '../../config/FirebaseConfig';
import Colors from '../../context/constants/Colors';

const screenWidth = Dimensions.get("window").width;

export default function ManagerAnalytics() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    totalReviewedReports: 0,
    reportsByOrganizer: {},
    headcountStats: { average: 0, max: 0, min: 0, maxEvent: null, minEvent: null },
    topEngagedEvents: [],
    categoryBreakdown: {},
    mostActiveOrganizers: [],
  });

  const [activeChart, setActiveChart] = useState('category');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const reportsSnapshot = await getDocs(collection(db, 'Works'));
      const allPosts = reportsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const reviewedReports = allPosts.filter(post => post.event_summary);
      const totalReviewedReports = reviewedReports.length;

      const reportsByOrganizer = {};
      let totalHeadcount = 0;
      let maxHeadcount = 0;
      let minHeadcount = Infinity;
      let maxEvent = null;
      let minEvent = null;
      const categoryBreakdown = {};
      const organizerActivity = {};

      allPosts.forEach(post => {
        const org = post.organizedBy;
        if (org) {
          reportsByOrganizer[org] = (reportsByOrganizer[org] || 0) + 1;
          organizerActivity[org] = (organizerActivity[org] || 0) + 1;
        }

        const category = post.category || 'Uncategorized';
        categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;
      });

      reviewedReports.forEach(report => {
        const headcount = report.event_summary?.headcount || 0;
        totalHeadcount += headcount;
        if (headcount > maxHeadcount) {
          maxHeadcount = headcount;
          maxEvent = report;
        }
        if (headcount < minHeadcount) {
          minHeadcount = headcount;
          minEvent = report;
        }
      });

      const averageHeadcount = totalReviewedReports 
        ? Math.round(totalHeadcount / totalReviewedReports) 
        : 0;
      
      const mostActiveOrganizers = Object.entries(organizerActivity)
        .filter(([org]) => org)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      setAnalytics({
        totalReviewedReports,
        reportsByOrganizer,
        headcountStats: { 
          average: averageHeadcount, 
          max: maxHeadcount, 
          min: minHeadcount, 
          maxEvent, 
          minEvent 
        },
        topEngagedEvents: reviewedReports.sort((a, b) => 
          (b.event_summary?.headcount || 0) - (a.event_summary?.headcount || 0)
        ),
        categoryBreakdown,
        mostActiveOrganizers,
      });
    } catch (error) {
      console.error('❌ Error fetching manager analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Category Pie Chart
  const categoryChartData = Object.entries(analytics.categoryBreakdown).map(([category, count], index) => ({
    name: category,
    population: count,
    color: Colors.CHART_COLORS[index % Colors.CHART_COLORS.length],
    legendFontColor: "#7F7F7F",
    legendFontSize: 15
  }));

  // Organizers Bar Chart
  const organizerChartData = {
    labels: analytics.mostActiveOrganizers.map(([org]) => org),
    datasets: [{
      data: analytics.mostActiveOrganizers.map(([, count]) => count)
    }]
  };

  const ChartSelector = () => (
    <View style={styles.chartSelectorContainer}>
      <TouchableOpacity 
        style={[
          styles.chartSelectorButton, 
          activeChart === 'category' && styles.activeChartSelector
        ]}
        onPress={() => setActiveChart('category')}
      >
        <Text style={styles.chartSelectorText}>Event Categories</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[
          styles.chartSelectorButton, 
          activeChart === 'organizer' && styles.activeChartSelector
        ]}
        onPress={() => setActiveChart('organizer')}
      >
        <Text style={styles.chartSelectorText}>Active Organizers</Text>
      </TouchableOpacity>
    </View>
  );

  const chartConfig = {
    backgroundColor: Colors.PRIMARY,
    backgroundGradientFrom: Colors.PRIMARY,
    backgroundGradientTo: Colors.PRIMARY,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: { 
      borderRadius: 16,
    },
    barPercentage: 0.6,  // Make bars thinner
    propsForLabels: {
      fontSize: 12,
      fontWeight: 'bold',
    },
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView>
        <View style={styles.container}>
          <Text style={styles.headerTitle}>Manager Analytics</Text>

          {/* Overview Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Feather name="calendar" size={24} color={Colors.PRIMARY} />
              <Text style={styles.statLabel}>Total Events</Text>
              <Text style={styles.statValue}>{analytics.totalReviewedReports}</Text>
            </View>
            <View style={styles.statCard}>
              <Feather name="users" size={24} color={Colors.PRIMARY} />
              <Text style={styles.statLabel}>Max Attendees</Text>
              <Text style={styles.statValue}>{analytics.headcountStats.max}</Text>
            </View>
          </View>

          {/* Chart Selector */}
          <ChartSelector />

          {/* Interactive Charts */}
          <View style={styles.chartContainer}>
            {activeChart === 'category' ? (
              <PieChart
                data={categoryChartData}
                width={screenWidth - 40}
                height={220}
                chartConfig={chartConfig}
                accessor={"population"}
                backgroundColor={"transparent"}
                paddingLeft={"15"}
                center={[10, 0]}
                absolute
              />
            ) : (
              <BarChart
  data={organizerChartData}
  width={screenWidth - 40}
  height={220}
  yAxisLabel=""
  chartConfig={chartConfig}
  verticalLabelRotation={30}
  fromZero={true}  // Ensures y-axis starts from 0
  showValuesOnTopOfBars={true}  // Shows the count on top of each bar
  withInnerLines={false}  // Removes inner grid lines
/>
            )}
          </View>

          {/* Top Events */}
          <View style={styles.topEventsContainer}>
            <Text style={styles.sectionTitle}>Top Performing Events</Text>
            {analytics.topEngagedEvents.slice(0, 5).map((event, index) => (
              <View key={event.id} style={styles.eventItem}>
                <Text style={styles.eventRank}>#{index + 1}</Text>
                <View style={styles.eventDetails}>
                  <Text style={styles.eventName}>{event.name}</Text>
                  <Text style={styles.eventAttendees}>
                    Attendees: {event.event_summary?.headcount || 'N/A'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  container: {
    padding: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: Colors.PRIMARY,
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#F0F4F8',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statLabel: {
    marginTop: 10,
    color: Colors.TEXT_SECONDARY,
    fontSize: 14,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.PRIMARY,
  },
  chartSelectorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
  },
  chartSelectorButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#F0F4F8',
    marginHorizontal: 5,
    borderRadius: 20,
  },
  activeChartSelector: {
    backgroundColor: Colors.PRIMARY,
  },
  chartSelectorText: {
    color: Colors.TEXT_PRIMARY,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  topEventsContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.PRIMARY,
    marginBottom: 15,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  eventRank: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.PRIMARY,
    marginRight: 15,
  },
  eventDetails: {
    flex: 1,
  },
  eventName: {
    fontSize: 16,
    fontWeight: '600',
  },
  eventAttendees: {
    color: Colors.TEXT_SECONDARY,
  },
});

// Extend Colors with chart-specific colors
Colors.CHART_COLORS = [
  '#FF6384', 
  '#36A2EB', 
  '#FFCE56', 
  '#4BC0C0', 
  '#9966FF', 
  '#FF9F40'
];
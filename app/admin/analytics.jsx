import { View, Text, StyleSheet, ActivityIndicator, RefreshControl, Dimensions } from 'react-native';
import React, { useEffect, useState, useCallback } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../config/FirebaseConfig';
import { useUser } from '@clerk/clerk-expo';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native';
import { TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, FadeIn, FadeOut } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';

export default function Analytics() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('week');
  const [viewMode, setViewMode] = useState('overview');
  const [analytics, setAnalytics] = useState({
    totalPosts: 0,
    myTotalPosts: 0,
    mostViewedPost: null,
    leastViewedPost: null,
    averageViews: 0,
    postsViewsData: [],
    topFivePosts: [],
    engagementMetrics: {
      shares: 0,
      comments: 0,
      likes: 0,
      bookmarks: 0
    }
  });

  // Animation values
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(20);

  useEffect(() => {
    if (user) {
      fetchAnalytics(user.primaryEmailAddress.emailAddress);
      
      const interval = setInterval(() => {
        fetchAnalytics(user.primaryEmailAddress.emailAddress);
      }, 30000);

      // Start animations
      cardOpacity.value = withTiming(1, { duration: 800 });
      cardTranslateY.value = withTiming(0, { duration: 800 });

      return () => clearInterval(interval);
    }
  }, [user, selectedTimeframe]);

  const fetchAnalytics = async (adminEmail) => {
    setLoading(true);
    try {
      // Fetch all posts
      const allPostsSnapshot = await getDocs(collection(db, 'Works'));
      const allPosts = allPostsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Fetch admin's posts
      const myPostsQuery = query(collection(db, 'Works'), where('adminEmail', '==', adminEmail));
      const myPostsSnapshot = await getDocs(myPostsQuery);
      const myPosts = myPostsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (allPosts.length === 0) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Basic analytics
      const totalPosts = allPosts.length;
      const myTotalPosts = myPosts.length;
      const mostViewedPost = allPosts.reduce((max, post) => (post.views > (max?.views || 0) ? post : max), null);
      const leastViewedPost = allPosts.reduce((min, post) => (post.views < (min?.views || Infinity) ? post : min), null);
      const totalViews = allPosts.reduce((sum, post) => sum + (post.views || 0), 0);
      const averageViews = totalViews / totalPosts;

      // Get top five posts by views
      const topFivePosts = [...allPosts]
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 5);

      // Simulated engagement metrics (replace with real data from your database)
      const engagementMetrics = {
        shares: Math.round(totalViews * 0.05),  // Assume 5% share rate
        comments: Math.round(totalViews * 0.03), // Assume 3% comment rate
        likes: Math.round(totalViews * 0.12),    // Assume 12% like rate
        bookmarks: Math.round(totalViews * 0.02) // Assume 2% bookmark rate
      };

      setAnalytics({
        totalPosts,
        myTotalPosts,
        mostViewedPost,
        leastViewedPost,
        averageViews: Math.round(averageViews),
        topFivePosts,
        engagementMetrics
      });

    } catch (error) {
      console.error('❌ Error fetching analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (user) {
      fetchAnalytics(user.primaryEmailAddress.emailAddress);
    }
  }, [user, selectedTimeframe]);

  const animatedCardStyle = useAnimatedStyle(() => {
    return {
      opacity: cardOpacity.value,
      transform: [{ translateY: cardTranslateY.value }],
    };
  });

  const renderTimeframeSelector = () => (
    <View style={styles.timeframeContainer}>
      {['day', 'week', 'month', 'year'].map(timeframe => (
        <TouchableOpacity 
          key={timeframe}
          style={[
            styles.timeframeButton,
            selectedTimeframe === timeframe && styles.timeframeButtonActive
          ]}
          onPress={() => setSelectedTimeframe(timeframe)}
        >
          <Text 
            style={[
              styles.timeframeText,
              selectedTimeframe === timeframe && styles.timeframeTextActive
            ]}
          >
            {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderViewModeSelector = () => (
    <View style={styles.viewModeContainer}>
      <TouchableOpacity 
        style={[styles.viewModeButton, viewMode === 'overview' && styles.viewModeButtonActive]}
        onPress={() => setViewMode('overview')}
      >
        <Ionicons name="grid-outline" size={22} color={viewMode === 'overview' ? Colors.WHITE : Colors.PRIMARY} />
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.viewModeButton, viewMode === 'leaderboard' && styles.viewModeButtonActive]}
        onPress={() => setViewMode('leaderboard')}
      >
        <Ionicons name="trophy-outline" size={22} color={viewMode === 'leaderboard' ? Colors.WHITE : Colors.PRIMARY} />
      </TouchableOpacity>
    </View>
  );

  const renderOverview = () => (
    <Animated.View entering={FadeIn.duration(500)} exiting={FadeOut.duration(300)}>
      <View style={styles.statsContainer}>
        <Animated.View style={[styles.statCard, animatedCardStyle]}>
          <View style={styles.statIconContainer}>
            <Ionicons name="document-text" size={24} color={Colors.PRIMARY} />
          </View>
          <View style={styles.statTextContainer}>
            <Text style={styles.statValue}>{analytics.totalPosts}</Text>
            <Text style={styles.statLabel}>Total Posts</Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.statCard, animatedCardStyle]}>
          <View style={styles.statIconContainer}>
            <Ionicons name="person" size={24} color={Colors.PRIMARY} />
          </View>
          <View style={styles.statTextContainer}>
            <Text style={styles.statValue}>{analytics.myTotalPosts}</Text>
            <Text style={styles.statLabel}>Your Posts</Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.statCard, animatedCardStyle]}>
          <View style={styles.statIconContainer}>
            <Ionicons name="eye" size={24} color={Colors.PRIMARY} />
          </View>
          <View style={styles.statTextContainer}>
            <Text style={styles.statValue}>{analytics.averageViews}</Text>
            <Text style={styles.statLabel}>Avg. Views</Text>
          </View>
        </Animated.View>
      </View>

      <Animated.View style={[styles.postDetailCard, animatedCardStyle]}>
        <Text style={styles.postDetailHeader}>🔥 Most Viewed Post</Text>
        <Text style={styles.postDetailTitle}>{analytics.mostViewedPost?.name}</Text>
        <View style={styles.postDetailStat}>
          <Ionicons name="eye-outline" size={18} color={Colors.TEXT_SECONDARY} />
          <Text style={styles.postDetailValue}>{analytics.mostViewedPost?.views} views</Text>
        </View>
      </Animated.View>

      <Animated.View style={[styles.postDetailCard, animatedCardStyle]}>
        <Text style={styles.postDetailHeader}>❄️ Least Viewed Post</Text>
        <Text style={styles.postDetailTitle}>{analytics.leastViewedPost?.name}</Text>
        <View style={styles.postDetailStat}>
          <Ionicons name="eye-outline" size={18} color={Colors.TEXT_SECONDARY} />
          <Text style={styles.postDetailValue}>{analytics.leastViewedPost?.views} views</Text>
        </View>
      </Animated.View>
    </Animated.View>
  );

  const renderLeaderboard = () => (
    <Animated.View style={styles.leaderboardContainer} entering={FadeIn.duration(500)} exiting={FadeOut.duration(300)}>
      <Text style={styles.leaderboardTitle}>Top 5 Posts</Text>
      {analytics.topFivePosts.map((post, index) => (
        <View key={post.id} style={styles.leaderboardItem}>
          <View style={styles.leaderboardRank}>
            <Text style={styles.leaderboardRankText}>{index + 1}</Text>
          </View>
          <View style={styles.leaderboardContent}>
            <Text style={styles.leaderboardPostName} numberOfLines={1}>{post.name}</Text>
            <View style={styles.leaderboardStats}>
              <View style={styles.leaderboardStat}>
                <Ionicons name="eye-outline" size={16} color={Colors.TEXT_SECONDARY} />
                <Text style={styles.leaderboardStatText}>{post.views || 0}</Text>
              </View>
              <View style={styles.leaderboardStat}>
                <Ionicons name="time-outline" size={16} color={Colors.TEXT_SECONDARY} />
                <Text style={styles.leaderboardStatText}>
                <Text style={styles.leaderboardStatText}>
  {post.createdAt && post.createdAt.toDate instanceof Function
    ? new Date(post.createdAt.toDate()).toLocaleDateString()
    : 'Unknown'}
</Text>

                </Text>
              </View>
            </View>
          </View>
        </View>
      ))}
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Analytics Dashboard</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Ionicons name="refresh" size={24} color={Colors.PRIMARY} />
          </TouchableOpacity>
        </View>

        {renderTimeframeSelector()}
        {renderViewModeSelector()}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.PRIMARY} />
            <Text style={styles.loadingText}>Loading analytics data...</Text>
          </View>
        ) : (
          <>
            {viewMode === 'overview' && renderOverview()}
            {viewMode === 'leaderboard' && renderLeaderboard()}
          </>
        )}
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
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.TEXT_PRIMARY,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#EDF2F7',
  },
  timeframeContainer: {
    flexDirection: 'row',
    backgroundColor: '#EDF2F7',
    borderRadius: 12,
    marginBottom: 16,
    padding: 4,
  },
  timeframeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  timeframeButtonActive: {
    backgroundColor: Colors.PRIMARY,
  },
  timeframeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.TEXT_SECONDARY,
  },
  timeframeTextActive: {
    color: Colors.WHITE,
  },
  viewModeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  viewModeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EDF2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  viewModeButtonActive: {
    backgroundColor: Colors.PRIMARY,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.TEXT_SECONDARY,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.WHITE,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EDF2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statTextContainer: {
    alignItems: 'flex-start',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.TEXT_PRIMARY,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.TEXT_SECONDARY,
  },
  postDetailCard: {
    backgroundColor: Colors.WHITE,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  postDetailHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.TEXT_SECONDARY,
    marginBottom: 8,
  },
  postDetailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.TEXT_PRIMARY,
    marginBottom: 8,
  },
  postDetailStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postDetailValue: {
    fontSize: 14,
    color: Colors.TEXT_SECONDARY,
    marginLeft: 6,
  },
  // Leaderboard styles
  leaderboardContainer: {
    backgroundColor: Colors.WHITE,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  leaderboardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.TEXT_PRIMARY,
    marginBottom: 16,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  leaderboardRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  leaderboardRankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.WHITE,
  },
  leaderboardContent: {
    flex: 1,
  },
  leaderboardPostName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.TEXT_PRIMARY,
    marginBottom: 4,
  },
  leaderboardStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leaderboardStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  leaderboardStatText: {
    fontSize: 14,
    color: Colors.TEXT_SECONDARY,
    marginLeft: 4,
  },
});
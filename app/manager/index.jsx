import React from 'react';
import { View, Text, TouchableOpacity, Alert, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useClerk } from "@clerk/clerk-expo";
import { 
  FileText, 
  BarChart2, 
  Clipboard, 
  LogOut, 
  FileCheck2, 
  TrendingUp 
} from 'lucide-react-native';

export default function ManagerDashboard() {
  const router = useRouter();
  const { signOut } = useClerk();

  const handleLogout = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          onPress: async () => {
            try {
              await signOut();
              await AsyncStorage.clear();
              router.replace("/login");
            } catch (error) {
              console.error("Logout Error:", error);
              Alert.alert("Error", "Failed to sign out. Please try again.");
            }
          },
          style: "destructive",
        },
      ],
      { cancelable: true }
    );
  };

  const DashboardButton = ({ 
    icon: Icon, 
    title, 
    description, 
    color, 
    onPress 
  }) => (
    <TouchableOpacity 
      onPress={onPress}
      style={{
        backgroundColor: color,
        borderRadius: 15,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      <View style={{ 
        backgroundColor: 'rgba(255,255,255,0.2)', 
        borderRadius: 10, 
        padding: 10, 
        marginRight: 15 
      }}>
        <Icon color="white" size={24} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ 
          color: 'white', 
          fontSize: 18, 
          fontWeight: '600' 
        }}>
          {title}
        </Text>
        <Text style={{ 
          color: 'rgba(255,255,255,0.8)', 
          fontSize: 14, 
          marginTop: 5 
        }}>
          {description}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F7F9FC' }}>
      <ScrollView 
        contentContainerStyle={{ 
          flexGrow: 1, 
          padding: 20, 
          justifyContent: 'center' 
        }}
      >
        <View style={{ 
          backgroundColor: 'white', 
          borderRadius: 20, 
          padding: 20, 
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 6,
          elevation: 5,
        }}>
          <Text style={{ 
            fontSize: 28, 
            fontWeight: '700', 
            color: '#333', 
            textAlign: 'center',
            marginBottom: 30 
          }}>
            Manager Dashboard
          </Text>

          <DashboardButton 
            icon={FileText}
            title="Event Reports"
            description="Review and manage event submissions"
            color="#4A90E2"
            onPress={() => router.push("/manager/review-event-reports")}
          />

          <DashboardButton 
            icon={Clipboard}
            title="Manage Posts"
            description="Edit and moderate community posts"
            color="#5E35B1"
            onPress={() => router.push("/manager/manage-posts")}
          />

          <DashboardButton 
            icon={TrendingUp}
            title="Analytics/Performance Tracking"
            description="Insights,event performance and performance metrics"
            color="#FFA726"
            onPress={() => router.push("/manager/analytics")}
          />

          <DashboardButton 
            icon={TrendingUp}
            title="Performance Tracking"
            description="Monitor team and event performance"
            color="#43A047"
            onPress={() => router.push("/manager/performance-tracking")}
          />

          <TouchableOpacity 
            onPress={handleLogout}
            style={{
              backgroundColor: '#FF5252',
              borderRadius: 15,
              padding: 15,
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: 20,
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <LogOut color="white" size={24} style={{ marginRight: 10 }} />
            <Text style={{ 
              color: 'white', 
              fontSize: 18, 
              fontWeight: '600' 
            }}>
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
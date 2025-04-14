import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Linking } from 'react-native';
import React, { useEffect, useState, useMemo } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, updateDoc, increment, setDoc } from 'firebase/firestore';
import { useUser as useClerkUser } from '@clerk/clerk-expo';
import { useAuthState } from 'react-firebase-hooks/auth';
import { db, auth as firebaseAuth } from '../../config/FirebaseConfig';
import SRMinfo from '../../components/SRMdetails/SRMinfo';
import SRMsubinfo from '../../components/SRMdetails/SRMsubinfo';
import About from '../../components/SRMdetails/About';
import Colors from '../../constants/Colors';
import { useTheme } from '../../context/ThemeContext';

export default function SRMdetails() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const { user: clerkUser } = useClerkUser();
  const [firebaseUser] = useAuthState(firebaseAuth);
  const user = clerkUser || firebaseUser;

  const [SRM, setSRM] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplied, setIsApplied] = useState(false);

  const userEmail = useMemo(() => {
    if (clerkUser?.primaryEmailAddress?.emailAddress) return clerkUser.primaryEmailAddress.emailAddress;
    if (firebaseUser?.email) return firebaseUser.email;
    return null;
  }, [clerkUser, firebaseUser]);

  useEffect(() => {
    if (id) {
      fetchPostDetails(id);
      incrementViews(id);
    }
  }, [id]);

  useEffect(() => {
    if (user && SRM && userEmail) {
      checkIfApplied();
    }
  }, [user, SRM]);

  const fetchPostDetails = async (postId) => {
    setIsLoading(true);
    try {
      const postRef = doc(db, 'Works', postId);
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        setSRM({ id: postSnap.id, ...postSnap.data() });
      } else {
        alert('Post not found!');
        router.back();
      }
    } catch (error) {
      console.error('❌ Error fetching post:', error);
      alert('Failed to load post.');
    } finally {
      setIsLoading(false);
    }
  };

  const incrementViews = async (postId) => {
    try {
      const postRef = doc(db, 'Works', postId);
      await updateDoc(postRef, { views: increment(1) });
      console.log('✅ Views updated for post:', postId);
    } catch (error) {
      console.error('❌ Error updating views:', error);
    }
  };

  const checkIfApplied = async () => {
    if (!user || !SRM || !userEmail) return;
    const applicationRef = doc(db, 'Applications', `${userEmail}_${SRM.name}`);
    const applicationSnap = await getDoc(applicationRef);
    if (applicationSnap.exists()) {
      setIsApplied(true);
    }
  };

  const ApplyToEvent = async () => {
    if (!user || !userEmail) {
      alert('Please log in to apply.');
      return;
    }

    const eventName = SRM.name;

    try {
      const eventRef = doc(db, 'Works', SRM.id);
      const eventDoc = await getDoc(eventRef);

      if (!eventDoc.exists()) {
        alert('Event not found in database.');
        return;
      }

      const eventData = eventDoc.data();
      const eventFormURL = eventData.formUrl || null;

      const applicationRef = doc(db, 'Applications', `${userEmail}_${eventName}`);
      const applicationSnap = await getDoc(applicationRef);

      if (applicationSnap.exists()) {
        alert('You have already applied for this event.');
        if (eventFormURL) {
          const supported = await Linking.canOpenURL(eventFormURL);
          if (supported) await Linking.openURL(eventFormURL);
        }
      } else {
        await setDoc(applicationRef, {
          userEmail,
          eventName,
          formUrl: eventFormURL,
          status: 'Pending',
          appliedAt: new Date().toISOString(),
        });

        setIsApplied(true);

        if (eventFormURL) {
          alert('Successfully applied! Redirecting to Google Form...');
          const supported = await Linking.canOpenURL(eventFormURL);
          if (supported) await Linking.openURL(eventFormURL);
        } else {
          alert('Successfully applied!');
        }
      }
    } catch (error) {
      console.error('❌ Error applying to event:', error);
      alert('Failed to apply. Try again later.');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={Colors.PRIMARY} />
        <Text style={{ color: colors.text, marginTop: 10 }}>Loading details...</Text>
      </View>
    );
  }

  return (
    <View style={{ backgroundColor: colors.background, flex: 1 }}>
      <ScrollView>
        <SRMinfo SRM={SRM} />
        <SRMsubinfo SRM={SRM} />
        <About SRM={SRM} />
        <View style={{ height: 70 }} />
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.applybtn, isApplied && { backgroundColor: 'gray' }]}
          onPress={ApplyToEvent}
          disabled={isApplied}
        >
          <Text style={styles.applyText}>
            {isApplied ? '✅ Applied' : 'Apply'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applybtn: {
    padding: 15,
    backgroundColor: Colors.PRIMARY,
  },
  applyText: {
    textAlign: 'center',
    fontFamily: 'outfit-med',
    fontSize: 20,
  },
  bottomContainer: {
    position: 'absolute',
    width: '100%',
    bottom: 0,
  },
});

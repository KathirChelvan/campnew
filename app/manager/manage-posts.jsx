import React, { useEffect, useState, useContext } from "react";
import { View, Text, FlatList, Button, Alert, ActivityIndicator } from "react-native";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../../config/FirebaseConfig";
import { AuthContext } from "../../context/AuthContext";

const ManagePosts = () => {
  const { user } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllPosts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "Works"));
        const postData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setPosts(postData);
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllPosts();
  }, []);

  const handleApproval = async (id, approval) => {
    try {
      const postRef = doc(db, "Works", id);
      await updateDoc(postRef, {
        approved_by_manager: approval,
      });

      setPosts(posts.map(post => post.id === id ? { ...post, approved_by_manager: approval } : post));

      Alert.alert("Success", `Post ${approval ? "approved" : "rejected"}!`);
    } catch (error) {
      console.error("Error updating post approval:", error);
      Alert.alert("Error", "Failed to update post approval.");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F8FAFC", padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: "bold", textAlign: "center", marginBottom: 15 }}>
        📢 Manage Posts
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 20 }} />
      ) : posts.length === 0 ? (
        <Text style={{ textAlign: "center", fontSize: 16, color: "#64748B" }}>
          No posts available.
        </Text>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={{ marginBottom: 15, borderRadius: 10, backgroundColor: "#fff", padding: 15, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 }}>
              <Text style={{ fontSize: 18, fontWeight: "bold", color: "#1E293B", marginBottom: 5 }}>{item.name}</Text>
              <Text style={{ color: "#64748B" }}>Category: {item.category}</Text>
              <Text style={{ color: "#64748B" }}>Posted by: {item.adminName}</Text>

              <Text style={{ marginTop: 10, fontSize: 16, fontWeight: "bold", color: item.approved_by_manager ? "green" : "red" }}>
                {item.approved_by_manager ? "✅ Approved" : "⏳ Pending Approval"}
              </Text>

              {!item.approved_by_manager && (
                <View style={{ flexDirection: "row", marginTop: 10, justifyContent: "space-between" }}>
                  <Button title="Approve" onPress={() => handleApproval(item.id, true)} color="green" />
                  <Button title="Reject" onPress={() => handleApproval(item.id, false)} color="red" />
                </View>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
};

export default ManagePosts;

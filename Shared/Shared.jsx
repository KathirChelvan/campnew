import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from './../config/FirebaseConfig';

const getUserEmail = (user) => {
  return user?.primaryEmailAddress?.emailAddress || user?.email || null;
};

const GetFavList = async (user) => {
  try {
    const email = getUserEmail(user);
    if (!email) return { favorites: [] };

    const docRef = doc(db, 'userfav', email);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      console.log("🟢 Successfully fetched favorites:", docSnap.data().favorites);
      return { favorites: docSnap.data().favorites || [] };
    } else {
      console.log("⚠️ No favorites found, creating new document...");
      await setDoc(docRef, { email, favorites: [] });
      return { favorites: [] };
    }
  } catch (error) {
    console.error("❌ Error fetching favorites:", error);
    return { favorites: [] };
  }
};

const UpdateFav = async (user, favorites) => {
  const email = getUserEmail(user);
  if (!email) {
    console.error("❌ Invalid user email");
    return;
  }

  if (!Array.isArray(favorites)) {
    console.error("❌ Invalid favorites list:", favorites);
    return;
  }

  const docRef = doc(db, 'userfav', email);

  try {
    console.log("🟢 Attempting to update Firestore with:", favorites);
    await setDoc(docRef, { email, favorites }, { merge: true });
    console.log("✅ Favorites successfully updated in Firestore!");
  } catch (error) {
    console.error("❌ Firestore update error:", error);
  }
};

export default {
  GetFavList,
  UpdateFav
};

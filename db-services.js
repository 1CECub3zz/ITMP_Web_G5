// db-services.js
import { db, auth } from './firebase-config.js';
import { collection, addDoc, serverTimestamp, getDocs, query, where, orderBy, limit, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// ==========================================
// Module 1: Create a New Brew Log
// ==========================================
export async function submitBrewLog(brewData) {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) return { success: false, errorMessage: "Authentication required." };

        const docRef = await addDoc(collection(db, "brews"), {
            authorUid: currentUser.uid,
            isPublic: true,
            basics: {
                beanName: brewData.beanName || "Unknown Bean",
                roaster: brewData.roaster || "Unknown Roaster"
            },
            parameters: {
                method: brewData.method || "V60",
                dose_grams: Number(brewData.dose) || 0
            },
            review: {
                rating: Number(brewData.rating) || 0,
                comment: brewData.comment || ""
            },
            metrics: { commentCount: 0 },
            createdAt: serverTimestamp()
        });

        return { success: true, id: docRef.id };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

// ==========================================
// Module 2 & 3: Fetch Data (Top Rated & My Records)
// ==========================================
export async function getTopRatedBrews() {
    try {
        const q = query(collection(db, "brews"), orderBy("review.rating", "desc"), limit(10));
        const querySnapshot = await getDocs(q);
        const brewsArray = [];
        querySnapshot.forEach((doc) => { brewsArray.push({ id: doc.id, ...doc.data() }); });
        return brewsArray;
    } catch (error) { return []; }
}

export async function getMyBrews() {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) return [];
        const q = query(collection(db, "brews"), where("authorUid", "==", currentUser.uid), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const myBrewsArray = [];
        querySnapshot.forEach((doc) => { myBrewsArray.push({ id: doc.id, ...doc.data() }); });
        return myBrewsArray;
    } catch (error) { return []; }
}

// ==========================================
// Module 4: Fetch Single Brew by ID
// ==========================================
/**
 * Black-box function: Retrieves the full details of a single brew using its ID.
 */
export async function getBrewById(brewId) {
    try {
        console.log(`📡 [Backend] Fetching exact brew details for ID: ${brewId}`);
        const docRef = doc(db, "brews", brewId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            return null;
        }
    } catch (error) {
        console.error("❌ [Backend] Single fetch failed: ", error);
        return null;
    }
}

// ==========================================
// Module 5: Comment Engine (Write & Read)
// ==========================================
/**
 * Black-box function: Adds a new comment to the distinct 'comments' collection.
 */
export async function addCommentToBrew(brewId, commentText) {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) return { success: false, errorMessage: "Must be logged in to comment." };

        await addDoc(collection(db, "comments"), {
            brewId: brewId,
            authorUid: currentUser.uid,
            text: commentText,
            createdAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Black-box function: Fetches all comments linked to a specific brew ID.
 */
export async function getCommentsForBrew(brewId) {
    try {
        const q = query(
            collection(db, "comments"),
            where("brewId", "==", brewId),
            orderBy("createdAt", "asc") // Oldest comments at the top
        );
        const querySnapshot = await getDocs(q);
        const commentsArray = [];
        querySnapshot.forEach((doc) => { commentsArray.push({ id: doc.id, ...doc.data() }); });
        return commentsArray;
    } catch (error) {
        console.error("❌ [Backend] Failed to fetch comments: ", error);
        return [];
    }
}
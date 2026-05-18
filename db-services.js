// db-services.js
import { db, auth } from './firebase-config.js';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// ==========================================
// Module 1: Create a New Brew Log (POST)
// ==========================================
export async function submitBrewLog(brewData) {
    try {
        console.log("🛠️ [Backend] Validating session and preparing nested data...");
        const currentUser = auth.currentUser;

        if (!currentUser) {
            return { success: false, errorMessage: "Authentication required to log a brew." };
        }

        // Structuring the data based on the new Beverage Brewing ERD
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
                rating: Number(brewData.rating) || 0, // 1 to 5 scale
                comment: brewData.comment || ""
            },
            metrics: {
                commentCount: 0 // Default starting value
            },
            createdAt: serverTimestamp()
        });

        console.log("✅ [Backend] Brew log successfully recorded!");
        return { success: true, id: docRef.id };

    } catch (error) {
        console.error("❌ [Backend] Failed to save brew log: ", error);
        return { success: false, errorMessage: error.message };
    }
}

// ==========================================
// Module 2: Fetch Top Rated Brews (GET & SORT)
// ==========================================
export async function getTopRatedBrews() {
    try {
        console.log("📡 [Backend] Fetching top-rated brews from the community...");

        // Advanced Query: Sort by nested field 'review.rating' in descending order
        const q = query(
            collection(db, "brews"),
            orderBy("review.rating", "desc"),
            limit(10) // Only fetch the top 10
        );

        const querySnapshot = await getDocs(q);
        const brewsArray = [];

        querySnapshot.forEach((doc) => {
            brewsArray.push({ id: doc.id, ...doc.data() });
        });

        console.log(`✅ [Backend] Fetched ${brewsArray.length} top-rated brews.`);
        return brewsArray;

    } catch (error) {
        console.error("❌ [Backend] Failed to fetch brews: ", error);
        return [];
    }
}
// db-services.js
// 1. Import configured database and authentication objects
import { db, auth } from './firebase-config.js';
// 2. Import complete Firestore toolsets
import { collection, addDoc, serverTimestamp, getDocs, query, where, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// ==========================================
// Module 1: Write Function (POST - Create Listing with Auth)
// ==========================================
/**
 * Black-box function: Saves a new listing using the actively logged-in user's UID.
 * @param {Object} listingData - The item data object from the frontend form.
 * @returns {Object} - Result status and assigned document ID or error message.
 */
export async function submitNewListing(listingData) {
    try {
        console.log("🛠️ [Backend Service] Verifying user session status...");

        // Fetch the currently authenticated user from the Firebase Auth instance
        const currentUser = auth.currentUser;

        // Security Gatekeeper: Block submission if no active session exists
        if (!currentUser) {
            console.warn("⚠️ [Backend Service] Write rejected: No active user session detected.");
            return {
                success: false,
                errorMessage: "Authentication Required. You must be logged in to post an item."
            };
        }

        console.log(`🔑 [Backend Service] Active session found (UID: ${currentUser.uid}). Pushing to Firestore...`);

        // Execute write operation with true dynamic ownership metadata
        const docRef = await addDoc(collection(db, "listings"), {
            title: listingData.title,
            price: Number(listingData.price),
            category: listingData.category || "Uncategorized",
            description: listingData.description || "",
            sellerUid: currentUser.uid, // ERIADICATION OF HARDCODING: Dynamically bound authenticated UID
            status: "available",
            createdAt: serverTimestamp()
        });

        console.log("✅ [Backend Service] Listing successfully created with owner UID binding.");
        return { success: true, id: docRef.id };

    } catch (error) {
        console.error("❌ [Backend Service] Write operation failed: ", error);
        return { success: false, errorMessage: error.message };
    }
}

// ==========================================
// Module 2: Read All Function (GET - Fetch All Available)
// ==========================================
export async function getAllAvailableListings() {
    try {
        console.log("📡 [Backend Service] Fetching all available listings...");
        const q = query(collection(db, "listings"), where("status", "==", "available"));
        const querySnapshot = await getDocs(q);
        const itemsArray = [];

        querySnapshot.forEach((doc) => {
            itemsArray.push({ id: doc.id, ...doc.data() });
        });

        console.log(`✅ [Backend Service] Successfully fetched ${itemsArray.length} items!`);
        return itemsArray;
    } catch (error) {
        console.error("❌ [Backend Service] Data retrieval failed: ", error);
        return [];
    }
}

// ==========================================
// Module 3: Filtered Read (GET - Query by Category)
// ==========================================
export async function getListingsByCategory(targetCategory) {
    try {
        console.log(`📡 [Backend Service] Fetching items for category: ${targetCategory}...`);
        const q = query(
            collection(db, "listings"),
            where("status", "==", "available"),
            where("category", "==", targetCategory)
        );
        const querySnapshot = await getDocs(q);
        const filteredArray = [];

        querySnapshot.forEach((doc) => {
            filteredArray.push({ id: doc.id, ...doc.data() });
        });

        console.log(`✅ [Backend Service] Found ${filteredArray.length} items in ${targetCategory}.`);
        return filteredArray;
    } catch (error) {
        console.error("❌ [Backend Service] Filter query failed: ", error);
        return [];
    }
}

// ==========================================
// Module 4: Single Item Read (GET - Fetch by ID)
// ==========================================
export async function getListingById(documentId) {
    try {
        console.log(`📡 [Backend Service] Fetching exact item details for ID: ${documentId}...`);
        const docRef = doc(db, "listings", documentId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            return null;
        }
    } catch (error) {
        console.error("❌ [Backend Service] Single fetch failed: ", error);
        return null;
    }
}
// db-services.js
// 1. Import the configured database instance
import { db } from './firebase-config.js';
// 2. Import core Firestore functions for reading and writing data
import { collection, addDoc, serverTimestamp, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// ==========================================
// Module 1: Write Function (POST - Create Listing)
// ==========================================
/**
 * Black-box function: Saves a new second-hand listing to the cloud database.
 * @param {Object} listingData - The data object passed from the frontend form.
 * @returns {Object} - Returns an object containing the success status and the document ID.
 */
export async function submitNewListing(listingData) {
    try {
        console.log("🛠️ [Backend Service] Pushing data to Firestore...");

        // Execute the write operation to the "listings" collection
        const docRef = await addDoc(collection(db, "listings"), {
            title: listingData.title,
            price: Number(listingData.price), // Force conversion to Number to prevent string errors
            category: listingData.category || "Uncategorized", // Provide a default if empty
            description: listingData.description || "",
            sellerUid: "test_user_001", // Hardcoded for testing; to be replaced by Auth UID later
            status: "available",
            createdAt: serverTimestamp() // Auto-generate an accurate server timestamp
        });

        console.log("✅ [Backend Service] Data successfully written!");
        // On success: Return a positive status and the unique document ID
        return { success: true, id: docRef.id };

    } catch (error) {
        console.error("❌ [Backend Service] Write operation failed: ", error);
        // On failure: Return a negative status and the error message
        return { success: false, errorMessage: error.message };
    }
}

// ==========================================
// Module 2: Read Function (GET - Read Listings)
// ==========================================
/**
 * Black-box function: Retrieves all available (unsold) second-hand listings.
 * @returns {Array} - Returns an array of objects, each containing listing data.
 */
export async function getAllAvailableListings() {
    try {
        console.log("📡 [Backend Service] Requesting listing data from the cloud...");

        // 1. Build the query: Target the "listings" collection where status is "available"
        const q = query(collection(db, "listings"), where("status", "==", "available"));

        // 2. Send the request and await the snapshot
        const querySnapshot = await getDocs(q);

        // 3. Initialize an empty array to store the fetched data
        const itemsArray = [];

        // 4. Iterate through each document returned by the cloud
        querySnapshot.forEach((doc) => {
            itemsArray.push({
                id: doc.id, // The unique document ID
                ...doc.data() // Spread operator: unpacks title, price, category, etc.
            });
        });

        console.log(`✅ [Backend Service] Successfully fetched ${itemsArray.length} items!`);
        return itemsArray; // Return the populated array to the frontend

    } catch (error) {
        console.error("❌ [Backend Service] Data retrieval failed: ", error);
        return []; // Return an empty array on failure to prevent frontend crashes
    }
}
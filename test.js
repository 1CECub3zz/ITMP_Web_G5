// test.js (Form Submission & Authentication Simulator)
import { submitNewListing } from './db-services.js';
import { auth } from './firebase-config.js';
import { signInAnonymously, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

const statusText = document.getElementById('auth-status-text');

// ==========================================
// 1. Session Observer: Listen for user login/logout changes
// ==========================================
onAuthStateChanged(auth, (user) => {
    if (user) {
        statusText.innerHTML = `🟢 Session Status: <strong>Logged In</strong> (UID: <span style="color:#2e74b5">${user.uid}</span>)`;
    } else {
        statusText.innerHTML = `🔴 Session Status: <strong>Logged Out</strong> (Guest Mode - Write Operations Locked)`;
    }
});

// ==========================================
// 2. Simulated Auth Triggers
// ==========================================
document.getElementById('btn-mock-login').addEventListener('click', async () => {
    try {
        // Trigger a secure, real cloud authentication session anonymously for testing
        await signInAnonymously(auth);
        console.log("🔒 [Auth Simulator] Successfully authenticated token session with Cloud Authority.");
    } catch (error) {
        console.error("❌ [Auth Simulator] Authentication failed: ", error);
    }
});

document.getElementById('btn-mock-logout').addEventListener('click', async () => {
    try {
        await signOut(auth);
        console.log("🔒 [Auth Simulator] Destroyed current token session.");
    } catch (error) {
        console.error("❌ [Auth Simulator] Signout failed: ", error);
    }
});

// ==========================================
// 3. Core Form Handler
// ==========================================
document.getElementById('btn-submit-listing').addEventListener('click', async () => {
    const inputTitle = document.getElementById('listing-title').value;
    const inputPrice = document.getElementById('listing-price').value;

    if (!inputTitle || !inputPrice) {
        alert("⚠️ Please fill in both the listing title and price!");
        return;
    }

    const newListingData = {
        title: inputTitle,
        price: inputPrice,
        category: "Electronics", // Simulating alternative category injection
        description: "Secure, authenticated listing execution payload test."
    };

    const btn = document.getElementById('btn-submit-listing');
    btn.innerText = "Uploading to Cloud...";
    btn.disabled = true;

    // Trigger Backend Black Box API
    const result = await submitNewListing(newListingData);

    if (result.success === true) {
        alert("🎉 Listing published successfully! System ID: " + result.id);
        document.getElementById('listing-title').value = '';
        document.getElementById('listing-price').value = '';

        // Refresh the feed view safely
        const filterAllBtn = document.getElementById('filter-all');
        if(filterAllBtn) filterAllBtn.click();
    } else {
        // This will trigger dynamically if the user is logged out!
        alert("❌ Failed to publish listing. Reason: " + result.errorMessage);
    }

    btn.innerText = "Force Write to Cloud";
    btn.disabled = false;
});

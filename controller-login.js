// controller-login.js
import { auth } from './firebase-config.js';
import { signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

// 1. Smart Redirection: Check if a valid session already exists on page load
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("⚡ [Login Controller] Active session detected. Bypassing login screen...");
        window.location.href = "dashboard.html"; // Auto-redirect to the protected hub
    }
});

// 2. Authentication Trigger
document.getElementById('btn-login').addEventListener('click', async () => {
    const statusText = document.getElementById('login-status');
    statusText.style.display = "block";
    statusText.innerText = "Connecting to Firebase Auth...";

    try {
        // Execute anonymous authentication
        await signInAnonymously(auth);
        // Note: We don't need to write window.location.href here.
        // Once signInAnonymously succeeds, the onAuthStateChanged listener above 
        // will automatically detect the new user state and trigger the redirect!
    } catch (error) {
        console.error("❌ [Login Controller] Auth failed: ", error);
        statusText.innerText = `Error: ${error.message}`;
    }
});
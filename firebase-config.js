// firebase-config.js
// 1. Import core Firebase, Firestore, and Authentication components via CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js"; // Newly added for user sessions

// 2. Your specific project configuration object
const firebaseConfig = {
    apiKey: "AIzaSyA3W5R1nG7IA08k0eCTVCoq1ttb5amaQ9k",
    authDomain: "itmp-webg5.firebaseapp.com",
    projectId: "itmp-webg5",
    storageBucket: "itmp-webg5.firebasestorage.app",
    messagingSenderId: "779345203025",
    appId: "1:779345203025:web:dc07b71af9f91aea46cd70",
    measurementId: "G-Z9GM7Y7KXE"
};

// 3. Initialize the Firebase Application
const app = initializeApp(firebaseConfig);

// 4. Export database and authentication instances for systemic use
export const db = getFirestore(app);
export const auth = getAuth(app); // Exported Auth instance for Member 5 and Database routing
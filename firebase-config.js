// firebase-config.js
// 1. Import the core Firebase library and Firestore database via CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

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

// 4. Initialize and export the Firestore database instance so other files can use 'db'
export const db = getFirestore(app);
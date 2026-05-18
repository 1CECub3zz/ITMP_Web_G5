// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyA3W5R1nG7IA08k0eCTVCoq1ttb5amaQ9k",
    authDomain: "itmp-webg5.firebaseapp.com",
    projectId: "itmp-webg5",
    storageBucket: "itmp-webg5.firebasestorage.app",
    messagingSenderId: "779345203025",
    appId: "1:779345203025:web:dc07b71af9f91aea46cd70",
    measurementId: "G-Z9GM7Y7KXE"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
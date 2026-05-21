// controller-dashboard.js
import { auth } from './firebase-config.js';
import { signOut } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { enforceAuthentication } from './auth-guard.js';

enforceAuthentication("index.html");

// Routing Engine
document.getElementById('nav-add-brew').addEventListener('click', () => {
    window.location.href = "add-brew.html";
});

// NEW: Route to My Records
document.getElementById('nav-records').addEventListener('click', () => {
    window.location.href = "records.html";
});

// Logout Handler
document.getElementById('btn-logout').addEventListener('click', async () => {
    try {
        await signOut(auth);
    } catch (error) {
        alert("Logout Error: " + error.message);
    }
});
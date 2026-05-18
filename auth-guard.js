// auth-guard.js
import { auth } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

/**
 * Global Authentication Observer.
 * Protects private HTML pages from unauthorized URL access.
 * @param {string} fallbackUrl - The page to redirect to if no active session is found.
 */
export function enforceAuthentication(fallbackUrl = "index.html") {
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            console.warn("🔒 [Auth Guard] Unauthorized access detected. Terminating session...");
            // Redirect the intruder back to the landing/login page
            window.location.href = fallbackUrl;
        } else {
            console.log(`🔓 [Auth Guard] Access granted. Active session UID: ${user.uid}`);
            // Optional: Inject the UID into a DOM element if it exists on the page
            const uidDisplay = document.getElementById('display-user-uid');
            if (uidDisplay) {
                uidDisplay.innerText = user.uid;
            }
        }
    });
}
// app.js
import { auth } from './firebase-config.js';
import { signInAnonymously, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { submitBrewLog, getTopRatedBrews } from './db-services.js';

// ==========================================
// 1. Auth Management
// ==========================================
onAuthStateChanged(auth, (user) => {
    const statusEl = document.getElementById('auth-status');
    if (user) {
        statusEl.innerHTML = `🟢 Logged In (Barista UID: ${user.uid})`;
    } else {
        statusEl.innerHTML = `🔴 Guest Mode (Cannot save logs)`;
    }
});

document.getElementById('btn-login').addEventListener('click', () => signInAnonymously(auth));
document.getElementById('btn-logout').addEventListener('click', () => signOut(auth));

// ==========================================
// 2. Submit Brew Logic
// ==========================================
document.getElementById('btn-submit-brew').addEventListener('click', async () => {
    const brewData = {
        beanName: document.getElementById('input-bean').value,
        roaster: document.getElementById('input-roaster').value,
        method: document.getElementById('input-method').value,
        dose: document.getElementById('input-dose').value,
        rating: document.getElementById('input-rating').value,
        comment: document.getElementById('input-comment').value
    };

    if (!brewData.beanName || !brewData.rating) {
        alert("⚠️ Please at least provide the Bean Name and a Rating (1-5).");
        return;
    }

    const result = await submitBrewLog(brewData);

    if (result.success) {
        alert("🎉 Brew Logged! ID: " + result.id);
        loadLeaderboard(); // Auto-refresh the feed
    } else {
        alert("❌ Failed: " + result.errorMessage);
    }
});

// ==========================================
// 3. UI Rendering Logic (Dashboard/Records)
// ==========================================
async function loadLeaderboard() {
    const feed = document.getElementById('brew-feed');
    feed.innerHTML = "<p>Fetching database...</p>";

    const brews = await getTopRatedBrews();

    if (brews.length === 0) {
        feed.innerHTML = "<p>No brews found. Start brewing!</p>";
        return;
    }

    feed.innerHTML = "";
    brews.forEach(item => {
        const card = `
            <div style="border: 1px solid #ddd; padding: 15px; border-radius: 8px; width: 220px; background: #fff;">
                <h3 style="margin: 0; color: #4e342e;">${item.basics.beanName}</h3>
                <p style="font-size: 0.8em; color: #888;">by ${item.basics.roaster}</p>
                <hr>
                <p><strong>Method:</strong> ${item.parameters.method}</p>
                <p><strong>Dose:</strong> ${item.parameters.dose_grams}g</p>
                <div style="background-color: #fff3e0; padding: 5px; text-align: center; font-size: 1.2em; font-weight: bold; color: #e65100; border-radius: 4px;">
                    ⭐ ${item.review.rating} / 5
                </div>
                <p style="font-size: 0.9em; font-style: italic;">"${item.review.comment}"</p>
            </div>
        `;
        feed.innerHTML += card;
    });
}

// Initial load
window.addEventListener('DOMContentLoaded', () => loadLeaderboard());
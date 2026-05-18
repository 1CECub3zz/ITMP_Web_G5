// controller-details.js
import { enforceAuthentication } from './auth-guard.js';
import { getBrewById, getCommentsForBrew, addCommentToBrew } from './db-services.js';
import { auth } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

enforceAuthentication("index.html");

document.getElementById('btn-back').addEventListener('click', () => {
    window.location.href = "records.html";
});

// 1. Extract the 'id' parameter from the URL (e.g., ?id=ABC123XYZ)
const urlParams = new URLSearchParams(window.location.search);
const currentBrewId = urlParams.get('id');

// 2. Core Logic: Fetch and Render everything
async function loadFullPage() {
    if (!currentBrewId) {
        document.getElementById('brew-info-container').innerHTML = "<h2 style='color: red;'>Error: Brew ID is missing.</h2>";
        return;
    }

    // A. Fetch and render Brew Data
    const brewData = await getBrewById(currentBrewId);
    if (!brewData) {
        document.getElementById('brew-info-container').innerHTML = "<h2>Brew not found or deleted.</h2>";
        return;
    }

    const container = document.getElementById('brew-info-container');
    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 15px; margin-bottom: 20px;">
            <h1 style="color: #3e2723; margin: 0;">${brewData.basics.beanName}</h1>
            <span style="font-size: 1.5em;">⭐ ${brewData.review.rating}/5</span>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
                <h4 style="color: #666; margin-bottom: 5px;">Basics</h4>
                <p style="margin: 0;"><strong>Roaster:</strong> ${brewData.basics.roaster}</p>
            </div>
            <div>
                <h4 style="color: #666; margin-bottom: 5px;">Parameters</h4>
                <p style="margin: 0;"><strong>Method:</strong> ${brewData.parameters.method}</p>
                <p style="margin: 0;"><strong>Dose:</strong> ${brewData.parameters.dose_grams}g</p>
            </div>
        </div>
        <div style="margin-top: 20px; background: #f4f1ea; padding: 15px; border-radius: 8px;">
            <h4 style="color: #666; margin-top: 0; margin-bottom: 5px;">Brewer's Notes</h4>
            <p style="margin: 0; font-style: italic;">"${brewData.review.comment}"</p>
        </div>
    `;

    // B. Fetch and render Comments
    await refreshComments();
}

async function refreshComments() {
    const commentsList = document.getElementById('comments-list');
    const comments = await getCommentsForBrew(currentBrewId);

    if (comments.length === 0) {
        commentsList.innerHTML = "<p style='color: #888; font-style: italic;'>No comments yet. Be the first to start the discussion!</p>";
        return;
    }

    commentsList.innerHTML = "";
    comments.forEach(comment => {
        commentsList.innerHTML += `
            <div style="background: white; padding: 10px 15px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid #2e7d32;">
                <p style="margin: 0; font-size: 0.95em;">${comment.text}</p>
                <p style="margin: 5px 0 0 0; font-size: 0.7em; color: #aaa;">User UID: ${comment.authorUid.substring(0, 8)}...</p>
            </div>
        `;
    });
}

// 3. Handle New Comment Submission
document.getElementById('btn-submit-comment').addEventListener('click', async () => {
    const inputEl = document.getElementById('input-new-comment');
    const text = inputEl.value.trim();

    if (!text) return;

    const btn = document.getElementById('btn-submit-comment');
    btn.disabled = true;
    btn.innerText = "Posting...";

    const result = await addCommentToBrew(currentBrewId, text);

    if (result.success) {
        inputEl.value = ""; // Clear input
        await refreshComments(); // Refresh the list without reloading the page!
    } else {
        alert("Failed to post comment: " + result.errorMessage);
    }

    btn.disabled = false;
    btn.innerText = "Post";
});

// Trigger load once Auth is ready
onAuthStateChanged(auth, (user) => {
    if (user) { loadFullPage(); }
});
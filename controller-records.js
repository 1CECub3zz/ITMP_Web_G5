// controller-records.js
import { enforceAuthentication } from './auth-guard.js';
import { getMyBrews } from './db-services.js';
import { auth } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

enforceAuthentication("index.html");

document.getElementById('btn-back').addEventListener('click', () => {
    window.location.href = "dashboard.html";
});

async function loadPersonalRecords() {
    const feedContainer = document.getElementById('personal-records-feed');
    const myRecords = await getMyBrews();

    if (myRecords.length === 0) {
        feedContainer.innerHTML = `<div style="padding: 30px; text-align: center; color: #666;"><p>You haven't logged any brews yet.</p></div>`;
        return;
    }

    feedContainer.innerHTML = "";

    myRecords.forEach(item => {
        const dateObj = item.createdAt ? item.createdAt.toDate() : new Date();
        const dateString = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        const cardHTML = `
            <div style="border: 1px solid #e0e0e0; padding: 20px; border-radius: 12px; width: 250px; background: white; box-shadow: 0 4px 6px rgba(0,0,0,0.02); display: flex; flex-direction: column;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <h3 style="margin: 0; color: #3e2723; font-size: 1.2em;">${item.basics.beanName}</h3>
                    <span style="background: #e8f5e9; color: #2e7d32; padding: 4px 8px; border-radius: 12px; font-size: 0.8em; font-weight: bold;">⭐ ${item.review.rating}</span>
                </div>
                <p style="font-size: 0.85em; color: #888; margin-top: 5px; margin-bottom: 15px;">Roasted by ${item.basics.roaster}</p>
                <div style="background: #f9f9f9; padding: 10px; border-radius: 6px; margin-bottom: 15px;">
                    <p style="margin: 0 0 5px 0; font-size: 0.9em;"><strong>Method:</strong> ${item.parameters.method}</p>
                    <p style="margin: 0; font-size: 0.9em;"><strong>Dose:</strong> ${item.parameters.dose_grams}g</p>
                </div>
                <p style="font-size: 0.9em; color: #555; font-style: italic; margin-bottom: 15px;">"${item.review.comment}"</p>
                <div style="margin-top: auto;">
                    <hr style="border: none; border-top: 1px dashed #ddd; margin: 10px 0;">
                    <a href="brew-details.html?id=${item.id}" style="display: block; text-align: center; background: #3e2723; color: white; text-decoration: none; padding: 8px; border-radius: 6px; font-size: 0.9em;">View Full Details & Discuss</a>
                </div>
            </div>
        `;
        feedContainer.innerHTML += cardHTML;
    });
}

onAuthStateChanged(auth, (user) => {
    if (user) { loadPersonalRecords(); }
});
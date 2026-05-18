// controller-add.js
import { enforceAuthentication } from './auth-guard.js';
import { submitBrewLog } from './db-services.js';

// 1. Instantly deploy the global security bouncer
// If the user is not logged in, they cannot access this form
enforceAuthentication("index.html");

// 2. Navigation Control (Back Button)
document.getElementById('btn-back').addEventListener('click', () => {
    window.location.href = "dashboard.html";
});

// 3. Core Form Handler and API Integration
document.getElementById('btn-submit-brew').addEventListener('click', async () => {

    // Capture user input from the DOM
    const brewData = {
        beanName: document.getElementById('input-bean').value,
        roaster: document.getElementById('input-roaster').value,
        method: document.getElementById('input-method').value,
        dose: document.getElementById('input-dose').value,
        rating: document.getElementById('input-rating').value,
        comment: document.getElementById('input-comment').value
    };

    // Frontend validation
    if (!brewData.beanName || !brewData.rating) {
        alert("⚠️ Please at least provide the Bean Name and a Rating (1-5).");
        return;
    }

    const btnSubmit = document.getElementById('btn-submit-brew');
    btnSubmit.innerText = "Transmitting to Cloud...";
    btnSubmit.disabled = true;

    // Trigger Backend Black Box API
    const result = await submitBrewLog(brewData);

    if (result.success) {
        alert("🎉 Brew Logged! Returning to Dashboard.");
        // Redirect back to the Dashboard upon successful insertion
        window.location.href = "dashboard.html";
    } else {
        alert("❌ Failed: " + result.errorMessage);
        btnSubmit.innerText = "Save to Database";
        btnSubmit.disabled = false;
    }
});
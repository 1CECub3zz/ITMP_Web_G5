// test.js (Frontend Controller for Form Submission)
// 1. Import the encapsulated write function from the service layer
import { submitNewListing } from './db-services.js';

// Listen for the button click event
document.getElementById('btn-submit-listing').addEventListener('click', async () => {

    // Step A: Capture user input from the DOM elements
    const inputTitle = document.getElementById('listing-title').value;
    const inputPrice = document.getElementById('listing-price').value;

    // Frontend Validation: Ensure fields are not empty before proceeding
    if (!inputTitle || !inputPrice) {
        alert("⚠️ Please fill in both the listing title and price!");
        return;
    }

    // Step B: Package the captured data into a standard JSON payload
    const newListingData = {
        title: inputTitle,
        price: inputPrice,
        category: "Books", // Simulating a dropdown selection
        description: "This is a test textbook generated from the local environment."
    };

    // UI Feedback: Update button state to prevent multiple submissions
    const btn = document.getElementById('btn-submit-listing');
    btn.innerText = "Uploading to Cloud...";
    btn.disabled = true;

    // Step C: Trigger the Backend API and await the response
    const result = await submitNewListing(newListingData);

    // Step D: Update the UI based on the backend response
    if (result.success === true) {
        alert("🎉 Listing published successfully! System ID: " + result.id);

        // Clear the input fields after successful submission
        document.getElementById('listing-title').value = '';
        document.getElementById('listing-price').value = '';

        // Optional: Reload the page to instantly show the new item in the feed
        window.location.reload();
    } else {
        alert("❌ Failed to publish listing. Reason: " + result.errorMessage);
    }

    // Restore the original button state
    btn.innerText = "Force Write to Cloud";
    btn.disabled = false;
});
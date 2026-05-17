// app.js
// 1. Import both the "fetch all" and "fetch by category" APIs from the service layer
import { getAllAvailableListings, getListingsByCategory } from './db-services.js';

// The HTML container where cards will be drawn
const feedContainer = document.getElementById('marketplace-feed');

/**
 * Reusable function to draw an array of listings into the DOM.
 * @param {Array} listingsArray - The data to be rendered.
 */
function renderCards(listingsArray) {
    if (listingsArray.length === 0) {
        feedContainer.innerHTML = "<p style='color: #888;'>No items found in this category.</p>";
        return;
    }

    feedContainer.innerHTML = ""; // Clear existing content

    listingsArray.forEach(item => {
        // Construct a UI card using Template Literals
        const cardHTML = `
            <div style="border: 1px solid #ccc; padding: 15px; border-radius: 8px; width: 200px; background: #f9f9f9; box-shadow: 2px 2px 5px rgba(0,0,0,0.1);">
                <h3 style="margin-top: 0; color: #333; font-size: 1.1em;">${item.title}</h3>
                <p style="color: #e44d26; font-weight: bold; font-size: 1.2em; margin: 10px 0;">RM ${item.price}</p>
                <span style="background-color: #e0e0e0; padding: 3px 8px; border-radius: 12px; font-size: 0.8em;">${item.category}</span>
                <button style="width: 100%; margin-top: 15px; padding: 8px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">View Details</button>
            </div>
        `;
        feedContainer.innerHTML += cardHTML;
    });
}

/**
 * Controller Function: Orchestrates the fetching and rendering based on category.
 * @param {string} category - The category to filter by (default is "All").
 */
async function loadFeed(category = "All") {
    feedContainer.innerHTML = "<p>Loading from cloud engine...</p>"; // Display loading state

    let data = [];
    if (category === "All") {
        data = await getAllAvailableListings();
    } else {
        data = await getListingsByCategory(category);
    }

    renderCards(data);
}

// ==========================================
// Event Listeners for UI Filter Buttons
// ==========================================
document.getElementById('filter-all').addEventListener('click', () => loadFeed("All"));
document.getElementById('filter-books').addEventListener('click', () => loadFeed("Books"));
document.getElementById('filter-electronics').addEventListener('click', () => loadFeed("Electronics"));

// Initialize the feed when the DOM is fully loaded
window.addEventListener('DOMContentLoaded', () => {
    loadFeed("All");
});
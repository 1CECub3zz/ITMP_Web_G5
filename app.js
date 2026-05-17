// app.js (Frontend Controller for the Marketplace Feed)
// 1. Import the encapsulated read function from the service layer
import { getAllAvailableListings } from './db-services.js';

/**
 * Asynchronous function to fetch data and manipulate the DOM to display items.
 */
async function renderHomepageFeed() {
    // Locate the container in the HTML where items will be displayed
    const feedContainer = document.getElementById('marketplace-feed');

    // Fetch the data array from the backend black box
    const listings = await getAllAvailableListings();

    // Handle the empty state (no items in the database)
    if (listings.length === 0) {
        feedContainer.innerHTML = "<p>There are no second-hand listings yet. Be the first to post!</p>";
        return;
    }

    // Clear the "Loading cloud data..." text
    feedContainer.innerHTML = "";

    // Iterate through the array and dynamically generate HTML for each item
    listings.forEach(item => {
        // Construct a UI card using Template Literals
        const cardHTML = `
            <div style="border: 1px solid #ccc; padding: 15px; border-radius: 8px; width: 200px; background: #f9f9f9; box-shadow: 2px 2px 5px rgba(0,0,0,0.1);">
                <h3 style="margin-top: 0; color: #333; font-size: 1.1em;">${item.title}</h3>
                <p style="color: #e44d26; font-weight: bold; font-size: 1.2em; margin: 10px 0;">RM ${item.price}</p>
                <p style="font-size: 0.85em; color: #666; margin-bottom: 15px;">Category: ${item.category}</p>
                <button style="width: 100%; padding: 8px; cursor: pointer; background-color: #007bff; color: white; border: none; border-radius: 4px;">Contact Seller</button>
            </div>
        `;

        // Inject the generated card into the DOM container
        feedContainer.innerHTML += cardHTML;
    });
}

// Ensure the rendering function fires as soon as the HTML content is fully loaded
window.addEventListener('DOMContentLoaded', () => {
    renderHomepageFeed();
});
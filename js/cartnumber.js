import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAmg4q4LmjqA8DHK1zY4yV8OCRvtAWJeO4",
    authDomain: "cliq-8dba8.firebaseapp.com",
    projectId: "cliq-8dba8",
    storageBucket: "cliq-8dba8.firebasestorage.app",
    messagingSenderId: "545738539503",
    appId: "1:545738539503:web:16560a7ac4cb3e3af0361a",
    databaseURL: "https://cliq-8dba8-default-rtdb.firebaseio.com/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Get logged-in user UID from localStorage
const userUid = localStorage.getItem("userUid");

// Function to update the cart count
function updateCartCount(count) {
    const cartCountElement = document.querySelector('.number-cart');
    if (count > 0) {
        cartCountElement.textContent = count; // Update the count
        cartCountElement.style.display = 'inline'; // Show the cart count
    } else {
        cartCountElement.textContent = '0'; // Reset to 0
        cartCountElement.style.display = 'none'; // Hide the cart count if no items
    }
}

// Fetch cart items from Firebase and update the count
function fetchCartItemCount() {
    if (!userUid) return;

    const orderRef = ref(database, `users/${userUid}/ordercart`);
    onValue(orderRef, (snapshot) => {
        const orders = snapshot.val();
        const itemCount = orders ? Object.keys(orders).length : 0; // Count the number of items
        updateCartCount(itemCount); // Update the cart count
    }, (error) => {
        console.error("❌ Error fetching cart data:", error);
    });
}

// Call fetchCartItemCount on page load
fetchCartItemCount();
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

// Firebase configuration (same as other files)
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

// Update the cart count element
function updateOnsiteCartCount(count) {
    const cartCountElement = document.querySelector('.number-cart');
    if (!cartCountElement) return;
    if (count > 0) {
        cartCountElement.textContent = count;
        cartCountElement.style.display = 'inline';
    } else {
        cartCountElement.textContent = '0';
        cartCountElement.style.display = 'none';
    }
}

// Subscribe to onsitecart node and update count
function fetchOnsiteCartCount() {
    const onsiteRef = ref(database, 'onsitecart');
    onValue(onsiteRef, (snapshot) => {
        const orders = snapshot.val();
        const itemCount = orders ? Object.keys(orders).length : 0;
        updateOnsiteCartCount(itemCount);
    }, (error) => {
        console.error("❌ Error fetching onsitecart count:", error);
    });
}

// Start on load
document.addEventListener('DOMContentLoaded', () => {
    fetchOnsiteCartCount();
});
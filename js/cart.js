import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getDatabase, ref, onValue, remove } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

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

// Get logged-in username from localStorage
const userUid = localStorage.getItem("userUid");

// Select elements
const cartItemsDiv = document.getElementById('cart-items');

// Modal logic
function showModal(message, onConfirm) {
    const modal = document.getElementById('confirmation-modal');
    const modalMessage = document.getElementById('modal-message');
    const confirmBtn = document.getElementById('modal-confirm-btn');
    const cancelBtn = document.getElementById('modal-cancel-btn');

    modalMessage.textContent = message;
    modal.style.display = 'flex';

    confirmBtn.onclick = () => {
        modal.style.display = 'none';
        onConfirm();
    };
    cancelBtn.onclick = () => {
        modal.style.display = 'none';
    };
}

// Render cart items
function renderCart(orders) {
    cartItemsDiv.innerHTML = ""; // Clear previous items

    let totalPrice = 0;

    if (orders && Object.keys(orders).length > 0) {
        Object.entries(orders).forEach(([key, order]) => {
            const rawPrice = order.price?.toString().trim() || "0";
            const cleanedPrice = parseFloat(rawPrice.replace(/[^0-9.]/g, ''));
            totalPrice += !isNaN(cleanedPrice) ? cleanedPrice : 0;

            const orderItem = document.createElement('div');
            orderItem.classList.add('order-item');

            // Conditionally include sugar level, size, addon, and hot/cold if they exist
            const sugarHTML = order.sugar ? `<p><strong>Sugar:</strong> ${order.sugar}</p>` : '';
            const addonHTML = order.addon ? `<p><strong>Add On:</strong> ${order.addon}</p>` : '';
            const typeHTML = order.type ? `<p><strong>Type:</strong> ${order.type}</p>` : '';
            const sizeHTML = order.size ? `<p><strong>Size:</strong> ${order.size}</p>` : '';
            const hotcoldHTML = order.hotcold ? `<p><strong>Espresso Type:</strong> ${order.hotcold}</p>` : '';

            orderItem.innerHTML = `
                <p><strong>Item:</strong> ${order.item}</p>
                ${typeHTML}
                ${sizeHTML}
                ${hotcoldHTML}
                ${sugarHTML}
                ${addonHTML}
                <p><strong>Quantity:</strong> ${order.quantity}</p>
                <p><strong>Price:</strong> P${(!isNaN(cleanedPrice) ? cleanedPrice.toFixed(2) : "0.00")}</p>
                <button class="delete-item-btn" data-key="${key}">
                    <i class="fa fa-trash" aria-hidden="true"></i>
                </button>
                
            `;

            cartItemsDiv.appendChild(orderItem);
        });

        // Total price and actions
        cartItemsDiv.innerHTML += `
            <div class="total-price">
                <p><strong>Total Price:</strong> P${totalPrice.toFixed(2)}</p>
            </div>
            <div class="cart-actions">
                <button class="confirm-order-btn" id="confirm-order">Confirm Order</button>
                <button class="delete-all-btn" id="delete-all">Delete All</button>
            </div>
        `;
    } else {
        cartItemsDiv.innerHTML = `<p class="empty-cart">No items in the cart.</p>`;
    }
}


// Fetch cart items from Firebase and render
function fetchOrderCart() {
    if (!userUid) {
        cartItemsDiv.innerHTML = `<p class="empty-cart">You are not logged in.</p>`;
        return;
    }
    const orderRef = ref(database, `users/${userUid}/ordercart`);
    onValue(orderRef, (snapshot) => {
        const orders = snapshot.val();
        renderCart(orders);
    }, (error) => {
        cartItemsDiv.innerHTML += '<p>Error fetching cart data.</p>';
        console.error("❌ Error fetching order cart data:", error);
    });
}

// Handle all cart actions (delete, delete all, confirm order)
cartItemsDiv.addEventListener('click', (event) => {
    if (!userUid) return;

    // Delete single item
    if (event.target.closest('.delete-item-btn')) {
        const deleteBtn = event.target.closest('.delete-item-btn');
        const itemKey = deleteBtn.getAttribute('data-key');
        showModal("Are you sure you want to delete this item?", () => {
            const itemRef = ref(database, `users/${userUid}/ordercart/${itemKey}`);
            remove(itemRef)
                .then(() => {
                    // No need to manually refresh, onValue will auto-update
                })
                .catch((error) => {
                    console.error(`❌ Error deleting item with key ${itemKey}:`, error);
                });
        });
    }

    // Delete all items
    if (event.target.id === 'delete-all') {
        showModal("Are you sure you want to delete all items?", () => {
            const orderRef = ref(database, `users/${userUid}/ordercart`);
            remove(orderRef)
                .then(() => {
                    // No need to manually refresh, onValue will auto-update
                })
                .catch((error) => {
                    cartItemsDiv.innerHTML += '<p>Error deleting all items from the cart.</p>';
                    console.error("❌ Error deleting all orders:", error);
                });
        });
    }

    // Confirm order
    if (event.target.id === 'confirm-order') {
        window.location.href = 'checkout.html';
    }
});

// Initial fetch on page load
fetchOrderCart();


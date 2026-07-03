import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getDatabase, ref, onValue, remove, get } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

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
const auth = getAuth(app);

// Get logged-in username from localStorage
let userUid = localStorage.getItem("userUid");

// Select elements
const cartItemsDiv = document.getElementById('cart-items');
const FALLBACK_IMAGE = "../img/bhivelogo.jpg";
const catalogLookup = new Map();
let latestOrders;

const catalogNodes = [
    { node: "milktea", label: "Milk Tea" },
    { node: "fruittea", label: "Fruit Tea" },
    { node: "espresso", label: "Espresso" },
    { node: "silog", label: "Silog" },
    { node: "sandwiches", label: "Sandwiches" },
    { node: "snacks", label: "Snacks" },
    { node: "ricemeal", label: "Rice Meal" },
    { node: "noodlepasta", label: "Noodle Pasta" },
    { node: "fries", label: "Fries" },
    { node: "extras", label: "Extras" },
    { node: "bestseller", label: "Best Seller" }
];

function normalizeName(value) {
    return (value || "").toString().trim().toLowerCase();
}

function escapeHTML(value) {
    return (value ?? "").toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function resolveImagePath(value) {
    const image = (value || "").toString().trim();
    return image || FALLBACK_IMAGE;
}

async function loadCatalogLookup() {
    await Promise.all(catalogNodes.map(async ({ node, label }) => {
        try {
            const snapshot = await get(ref(database, node));
            snapshot.forEach((childSnapshot) => {
                const item = childSnapshot.val() || {};
                const names = [item.name, item.type].filter(Boolean);
                names.forEach((name) => {
                    catalogLookup.set(normalizeName(name), {
                        category: label,
                        image: resolveImagePath(item.image)
                    });
                });
            });
        } catch (error) {
            console.warn(`Unable to load ${label} images for cart display:`, error);
        }
    }));

    if (latestOrders !== undefined) renderCart(latestOrders);
}

function waitForCurrentUser() {
    if (auth.currentUser) return Promise.resolve(auth.currentUser);

    return new Promise((resolve) => {
        let settled = false;
        let unsubscribe = () => {};
        const timeout = setTimeout(() => {
            if (settled) return;
            settled = true;
            unsubscribe();
            resolve(null);
        }, 4000);
        unsubscribe = onAuthStateChanged(auth, (user) => {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            unsubscribe();
            resolve(user);
        });
    });
}

function handleMissingAuth() {
    alert("Please log in again to update your cart.");
    window.location.href = "index.html";
}

async function getAuthenticatedUid() {
    const authUser = await waitForCurrentUser();
    if (!authUser) return null;

    userUid = authUser.uid;
    localStorage.setItem("userUid", userUid);
    return userUid;
}

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
    let totalQuantity = 0;

    if (orders && Object.keys(orders).length > 0) {
        Object.entries(orders).forEach(([key, order]) => {
            const rawPrice = order.price?.toString().trim() || "0";
            const cleanedPrice = parseFloat(rawPrice.replace(/[^0-9.]/g, ''));
            totalPrice += !isNaN(cleanedPrice) ? cleanedPrice : 0;
            const quantity = parseInt(order.quantity, 10) || 1;
            totalQuantity += quantity;
            const lineTotal = !isNaN(cleanedPrice) ? cleanedPrice : 0;
            const unitPrice = quantity > 0 ? lineTotal / quantity : lineTotal;
            const catalogItem = catalogLookup.get(normalizeName(order.item)) || {};
            const imageSrc = resolveImagePath(order.image || catalogItem.image);
            const category = order.category || catalogItem.category || "Cafe Item";

            const orderItem = document.createElement('div');
            orderItem.classList.add('order-item');

            // Conditionally include sugar level, size, addon, and hot/cold if they exist
            const details = [
                order.type ? ["Type", order.type] : null,
                order.size ? ["Size", order.size] : null,
                order.hotcold ? ["Espresso Type", order.hotcold] : null,
                order.sugar ? ["Sugar", order.sugar] : null,
                order.addon ? ["Add On", order.addon] : null
            ].filter(Boolean);

            const detailsHTML = details.length
                ? details.map(([label, value]) => `
                    <span class="cart-detail-pill">
                        <strong>${escapeHTML(label)}:</strong> ${escapeHTML(value)}
                    </span>
                `).join('')
                : '<span class="cart-detail-pill cart-detail-pill--muted">No customizations</span>';

            orderItem.innerHTML = `
                <div class="cart-item-media">
                    <img src="${escapeHTML(imageSrc)}" alt="${escapeHTML(order.item || 'Cart item')}" loading="lazy">
                </div>
                <div class="cart-item-main">
                    <div class="cart-item-heading">
                        <div>
                            <p class="cart-item-category">${escapeHTML(category)}</p>
                            <h3>${escapeHTML(order.item || 'Cart item')}</h3>
                        </div>
                        <button class="delete-item-btn" data-key="${escapeHTML(key)}" aria-label="Remove ${escapeHTML(order.item || 'item')}">
                            <i class="fa fa-trash" aria-hidden="true"></i>
                        </button>
                    </div>
                    <div class="cart-item-details">
                        ${detailsHTML}
                    </div>
                    <div class="cart-item-footer">
                        <div class="cart-quantity-control" aria-label="Quantity">
                            <span>Qty</span>
                            <strong>${quantity}</strong>
                        </div>
                        <div class="cart-price-stack">
                            <span>Item Price</span>
                            <strong>P${unitPrice.toFixed(2)}</strong>
                        </div>
                        <div class="cart-price-stack cart-price-stack--total">
                            <span>Subtotal</span>
                            <strong>P${lineTotal.toFixed(2)}</strong>
                        </div>
                    </div>
                </div>
            `;

            cartItemsDiv.appendChild(orderItem);
        });

        // Total price and actions
        cartItemsDiv.innerHTML += `
            <section class="cart-summary" aria-label="Order summary">
                <div class="cart-summary-header">
                    <p>Order Summary</p>
                    <span>${Object.keys(orders).length} cart line${Object.keys(orders).length === 1 ? '' : 's'}</span>
                </div>
                <div class="cart-summary-row">
                    <span>Total Items</span>
                    <strong>${totalQuantity}</strong>
                </div>
                <div class="cart-summary-row">
                    <span>Subtotal</span>
                    <strong>P${totalPrice.toFixed(2)}</strong>
                </div>
                <div class="cart-summary-row cart-summary-row--total">
                    <span>Total Amount</span>
                    <strong>P${totalPrice.toFixed(2)}</strong>
                </div>
                <div class="cart-actions">
                    <button class="confirm-order-btn" id="confirm-order">Proceed to Checkout</button>
                    <button class="delete-all-btn" id="delete-all">Delete All</button>
                </div>
            </section>
            <div class="total-price" aria-hidden="true">
                <p><strong>Total Price:</strong> P${totalPrice.toFixed(2)}</p>
            </div>
        `;
    } else {
        cartItemsDiv.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-bag" aria-hidden="true"></i>
                <strong>No items in the cart.</strong>
                <span>Add a drink or meal from the Order section to start your cart.</span>
            </div>
        `;
    }

    cartItemsDiv.querySelectorAll('.cart-item-media img').forEach((image) => {
        image.addEventListener('error', () => {
            image.src = FALLBACK_IMAGE;
        }, { once: true });
    });
}

function renderCartMessage(title, message, icon = "fas fa-shopping-bag") {
    cartItemsDiv.innerHTML = `
        <div class="empty-cart">
            <i class="${escapeHTML(icon)}" aria-hidden="true"></i>
            <strong>${escapeHTML(title)}</strong>
            <span>${escapeHTML(message)}</span>
        </div>
    `;
}


// Fetch cart items from Firebase and render
function fetchOrderCart() {
    if (!userUid) {
        renderCartMessage("You are not logged in.", "Please log in to view your saved cart.", "fas fa-user-lock");
        return;
    }
    const orderRef = ref(database, `users/${userUid}/ordercart`);
    onValue(orderRef, (snapshot) => {
        const orders = snapshot.val();
        latestOrders = orders;
        renderCart(orders);
    }, (error) => {
        renderCartMessage("Error fetching cart data.", "Please refresh the page and try again.", "fas fa-triangle-exclamation");
        console.error("❌ Error fetching order cart data:", error);
    });
}

function syncAuthUserForCart() {
    onAuthStateChanged(auth, (user) => {
        if (!user) return;
        if (userUid === user.uid) return;

        userUid = user.uid;
        localStorage.setItem("userUid", userUid);
        fetchOrderCart();
    });
}

// Handle all cart actions (delete, delete all, confirm order)
if (cartItemsDiv) {
cartItemsDiv.addEventListener('click', async (event) => {
    const isCartMutation = event.target.closest('.delete-item-btn') || event.target.id === 'delete-all';
    const authenticatedUid = isCartMutation ? await getAuthenticatedUid() : userUid;

    if (isCartMutation && !authenticatedUid) {
        handleMissingAuth();
        return;
    }

    // Delete single item
    if (event.target.closest('.delete-item-btn')) {
        const deleteBtn = event.target.closest('.delete-item-btn');
        const itemKey = deleteBtn.getAttribute('data-key');
        showModal("Are you sure you want to delete this item?", () => {
            const itemRef = ref(database, `users/${authenticatedUid}/ordercart/${itemKey}`);
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
            const orderRef = ref(database, `users/${authenticatedUid}/ordercart`);
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
}

// Initial fetch on page load
if (cartItemsDiv) {
    loadCatalogLookup();
    syncAuthUserForCart();
    fetchOrderCart();
}

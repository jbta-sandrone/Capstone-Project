// Import Firebase modules
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getDatabase, ref, onValue, get, remove, push } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAmg4LmjqA8DHK1zY4yV8OCRvtAWJeO4",
  authDomain: "cliq-8dba8.firebaseapp.com",
  projectId: "cliq-8dba8",
  storageBucket: "cliq-8dba8.firebasestorage.app",
  messagingSenderId: "545738539503",
  appId: "1:545738539503:web:16560a7ac4cb3e3af0361a",
  databaseURL: "https://cliq-8dba8-default-rtdb.firebaseio.com/"
};

// Initialize Firebase only if it hasn't been initialized already
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const database = getDatabase(app);
const auth = getAuth(app);

function waitForCurrentUser() {
    if (auth.currentUser) return Promise.resolve(auth.currentUser);

    return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe();
            resolve(user);
        });
    });
}

async function getAuthenticatedUidForWrite(operationLabel, databasePath) {
    const user = await waitForCurrentUser();
    if (!user) {
        console.warn(`Firebase write blocked: ${operationLabel} at "${databasePath}" requires an authenticated Firebase user.`);
        return null;
    }

    localStorage.setItem("userUid", user.uid);
    return user.uid;
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function renderHistoryState(iconClass, title, message) {
    return `
        <div class="history-empty">
            <span class="history-empty__icon"><i class="${iconClass}"></i></span>
            <strong>${escapeHtml(title)}</strong>
            <p>${escapeHtml(message)}</p>
        </div>
    `;
}

// Fetch and display history data
function fetchHistory() {
    const userUid = localStorage.getItem('userUid');
    if (!userUid) {
        document.getElementById('history-order').innerHTML = renderHistoryState(
            "fas fa-user-lock",
            "You are not logged in.",
            "Login to view your saved cafe orders."
        );
        // Hide delete all button if not logged in
        const deleteAllBtn = document.getElementById('delete-all-history');
        if (deleteAllBtn) deleteAllBtn.style.display = 'none';
        return;
    }
    const historyRef = ref(database, `users/${userUid}/history`);
    const historyOrderElement = document.getElementById('history-order');
    const historyDetailsElement = document.getElementById('history-details');
    const deleteAllBtn = document.getElementById('delete-all-history');

    onValue(historyRef, (snapshot) => {
        historyOrderElement.innerHTML = '';

        if (snapshot.exists()) {
            // Show delete all button if there is data
            if (deleteAllBtn) deleteAllBtn.style.display = 'block';

            const historyData = snapshot.val();
            
            // Filter out duplicate Order IDs
const uniqueOrders = {};
Object.entries(historyData).forEach(([key, entry]) => {
    const orderID = entry.orderID || 'Unknown ID';
    if (!uniqueOrders[orderID]) {
        uniqueOrders[orderID] = { key, entry };
    }
});

// Now display only unique Order IDs
Object.values(uniqueOrders).forEach(({ key, entry }) => {
    const orderID = entry.orderID || 'Unknown ID';
    const date = entry.date || 'Unknown Date';
    const statusLabel = entry.status || 'Saved order';

    const historyItem = document.createElement('div');
    historyItem.classList.add('history-item');

    historyItem.innerHTML = `
        <div class="history-item__main">
            <span class="history-status">${escapeHtml(statusLabel)}</span>
            <p><strong>Order ID</strong> ${escapeHtml(orderID)}</p>
            <p id="history-date"><i class="far fa-calendar"></i> ${escapeHtml(date)}</p>
        </div>
        <div class="history-item__actions">
            <button class="see-details-btn" data-key="${escapeHtml(key)}">See Details</button>
            <button class="delete-btn" data-key="${escapeHtml(key)}" aria-label="Delete order ${escapeHtml(orderID)}">
                <i class="fa fa-trash"></i>
            </button>
        </div>
        <hr>
    `;

    historyOrderElement.appendChild(historyItem);
});

            // ...existing event listeners for details and delete...
            historyOrderElement.addEventListener('click', (event) => {
                if (event.target.closest('.see-details-btn')) {
                    const detailsBtn = event.target.closest('.see-details-btn');
                    const key = detailsBtn.getAttribute('data-key');
                    showDetails(key, userUid);
                }
            });

            historyOrderElement.addEventListener('click', (event) => {
                if (event.target.closest('.delete-btn')) {
                    const deleteBtn = event.target.closest('.delete-btn');
                    const key = deleteBtn.getAttribute('data-key');
                    showModal("Are you sure you want to delete this record?", async () => {
                        const authenticatedUid = await getAuthenticatedUidForWrite("delete history record", `users/${userUid}/history/${key}`);
                        if (!authenticatedUid) return;
                        const entryRef = ref(database, `users/${authenticatedUid}/history/${key}`);
                        remove(entryRef)
                            .then(() => {
                                fetchHistory();
                            })
                            .catch((error) => {
                                console.error(`❌ Error deleting record with key ${key}:`, error);
                            });
                    });
                }
            });
        } else {
            historyOrderElement.innerHTML = renderHistoryState(
                "fas fa-receipt",
                "No history data found.",
                "Completed cafe orders will appear here."
            );
            // Hide delete all button if no data
            if (deleteAllBtn) deleteAllBtn.style.display = 'none';
        }
    }, (error) => {
        historyOrderElement.innerHTML = renderHistoryState(
            "fas fa-triangle-exclamation",
            "Error fetching history data.",
            "Please try opening your history again in a moment."
        );
        // Hide delete all button on error
        if (deleteAllBtn) deleteAllBtn.style.display = 'none';
        console.error("❌ Error fetching history data:", error);
    });
}

// Function to handle "See Details" button click
function showDetails(key, userUid) {
    const historyOrderElement = document.getElementById('history-order');
    const historyDetailsElement = document.getElementById('history-details');
    const orderRef = ref(database, `users/${userUid}/history/${key}`);

    get(orderRef)
        .then((snapshot) => {
            if (!snapshot.exists()) {
                historyDetailsElement.innerHTML = renderHistoryState(
                    "fas fa-magnifying-glass",
                    "No order details found.",
                    "This order record no longer has receipt details."
                );
                return;
            }

            const orderData = snapshot.val();

            // items array for table and fallback calculations
            const items = orderData.orders ? Object.values(orderData.orders) : [];

            // Prefer stored total from history (saved by notification.js). Fallback: compute using same parse logic.
            let totalPrice = 0;
            if (orderData.total !== undefined && orderData.total !== null) {
                totalPrice = parseFloat(orderData.total) || 0;
            } else {
                totalPrice = items.reduce((sum, item) => {
                    const price = parseFloat((item.price || "0").toString().replace(/[^0-9.]/g, "")) || 0;
                    return sum + price;
                }, 0);
            }

            const formattedDate = new Date(orderData.date || Date.now()).toLocaleDateString("en-PH", {
                timeZone: "Asia/Manila",
                year: "numeric",
                month: "long",
                day: "numeric"
            });

            historyDetailsElement.innerHTML = `
                <button id="back-to-history">
                    <i class="fa fa-arrow-left"></i>
                </button>
                <div class="history-details__header">
                  <span class="history-status">Receipt</span>
                  <h2>Order Details</h2>
                  <div>${escapeHtml(formattedDate)}</div>
                  <div>Order ID: <strong>${escapeHtml(orderData.orderID || "")}</strong></div>
                </div>

                <div class="history-details__table-wrap">
                  <strong>Items</strong>
                  <table class="history-details__table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Size</th>
                        <th>Sugar</th>
                        <th>Add-Ons</th>
                        <th>Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${
                        items.length
                          ? items.map(item => {
                              const itemPrice = item.price || "";
                              const qty = item.quantity || 1;
                              const sizeHTML = item.size || "";
                              const sugar = item.sugar || "";
                              const addons = item.addons || item.addon || "";
                              return `<tr>
                                <td>${escapeHtml(item.item || "")}</td>
                                <td>${escapeHtml(qty)}</td>
                                <td>${escapeHtml(sizeHTML)}</td>
                                <td>${escapeHtml(sugar)}</td>
                                <td>${escapeHtml(addons)}</td>
                                <td>${escapeHtml(itemPrice)}</td>
                              </tr>`;
                            }).join('')
                          : `<tr><td colspan="6">No items found.</td></tr>`
                      }
                    </tbody>
                  </table>
                </div>

                <p id="total">Total Price: P${totalPrice.toFixed(2)}</p>

                <div class="history-details__actions">
                  <button id="order-again">Order Again</button>
                </div>
            `;

            // show/hide sections
            historyOrderElement.style.display = 'none';
            historyDetailsElement.style.display = 'block';
            const deleteAllBtn = document.getElementById('delete-all-history');
            if (deleteAllBtn) deleteAllBtn.style.display = 'none';

            // back button
            const backBtn = document.getElementById('back-to-history');
            if (backBtn) {
                backBtn.addEventListener('click', () => {
                    historyOrderElement.style.display = 'block';
                    historyDetailsElement.style.display = 'none';
                    const deleteAllBtn2 = document.getElementById('delete-all-history');
                    if (deleteAllBtn2) deleteAllBtn2.style.display = '';
                });
            }

            // order again
            const orderAgainBtn = document.getElementById('order-again');
            if (orderAgainBtn) {
                orderAgainBtn.addEventListener('click', async () => {
                    if (orderData.orders) {
                        const uid = await getAuthenticatedUidForWrite("order again add to cart", "users/{uid}/ordercart");
                        if (!uid) return;
                        const orderRef = ref(database, `users/${uid}/ordercart`);
                        const itemsToPush = Object.values(orderData.orders);
                        Promise.all(itemsToPush.map(item => push(orderRef, item)))
                            .then(() => {
                                const successDiv = document.getElementById('success');
                                if (successDiv) {
                                    successDiv.style.display = 'block';
                                    setTimeout(() => {
                                        successDiv.style.display = 'none';
                                        localStorage.setItem('cliqDashboardOpen', 'cart');
                                        window.location.href = 'dashboard.html?open=cart';
                                    }, 1200);
                                } else {
                                    localStorage.setItem('cliqDashboardOpen', 'cart');
                                    window.location.href = 'dashboard.html?open=cart';
                                }
                            })
                            .catch((error) => {
                                console.error(`Firebase write failed: order again add to cart at "users/${uid}/ordercart"`, error);
                            });
                    }
                });
            }
        })
        .catch((error) => {
            console.error("Error fetching order details:", error);
            historyDetailsElement.innerHTML = renderHistoryState(
                "fas fa-triangle-exclamation",
                "Error fetching order details.",
                "Please try opening this receipt again."
            );
        });
}

// Function to display a confirmation modal
function showModal(message, onConfirm) {
    const modal = document.getElementById('confirmation-modal');
    const modalMessage = document.getElementById('modal-message');
    const confirmBtn = document.getElementById('modal-confirm-btn');
    const cancelBtn = document.getElementById('modal-cancel-btn');

    modalMessage.textContent = message; // Set the modal message
    modal.style.display = 'flex'; // Show the modal

    // Handle confirm button click
    confirmBtn.onclick = () => {
        modal.style.display = 'none'; // Hide the modal
        onConfirm(); // Execute the confirm callback
    };

    // Handle cancel button click
    cancelBtn.onclick = () => {
        modal.style.display = 'none'; // Hide the modal
    };
}

// Call the function to fetch and display history data
fetchHistory();

document.addEventListener('DOMContentLoaded', () => {
  const deleteAllBtn = document.getElementById('delete-all-history');
  if (deleteAllBtn) {
    deleteAllBtn.addEventListener('click', () => {
      const userUid = localStorage.getItem('userUid');
      if (!userUid) return;
      showModal("Are you sure you want to delete ALL history records?", async () => {
        const authenticatedUid = await getAuthenticatedUidForWrite("delete all history records", `users/${userUid}/history`);
        if (!authenticatedUid) return;
        const historyRef = ref(database, `users/${authenticatedUid}/history`);
        remove(historyRef)
          .then(() => {
            fetchHistory();
          })
          .catch((error) => {
            console.error("❌ Error deleting all history:", error);
          });
      });
    });
  }
});

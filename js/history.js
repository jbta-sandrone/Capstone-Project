// Import Firebase modules
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
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

// Fetch and display history data
function fetchHistory() {
    const userUid = localStorage.getItem('userUid');
    if (!userUid) {
        document.getElementById('history-order').innerHTML = '<p>You are not logged in.</p>';
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

    const historyItem = document.createElement('div');
    historyItem.classList.add('history-item');

    historyItem.innerHTML = `
        <p><strong>Order ID:</strong> ${orderID}</p>
        <p id="history-date"><strong>Date:</strong> ${date}</p>
        <button class="see-details-btn" data-key="${key}">See Details</button>
        <button class="delete-btn" data-key="${key}">
            <i class="fa fa-trash"></i>
        </button>
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
                    showModal("Are you sure you want to delete this record?", () => {
                        const entryRef = ref(database, `users/${userUid}/history/${key}`);
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
            historyOrderElement.innerHTML = '<p>No history data found.</p>';
            // Hide delete all button if no data
            if (deleteAllBtn) deleteAllBtn.style.display = 'none';
        }
    }, (error) => {
        historyOrderElement.innerHTML = '<p>Error fetching history data.</p>';
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
                historyDetailsElement.innerHTML = '<p>No order details found.</p>';
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
                <div style="text-align:center; margin-bottom:12px;">
                  <h2 style="margin:0; font-size:1.4em;">Order Details</h2>
                  <div style="font-size:14px; color:#555;">${formattedDate}</div>
                  <div style="margin-top:6px; font-size:13px; color:#666;">Order ID: <strong>${orderData.orderID || ""}</strong></div>
                </div>

                <div style="margin-bottom:10px;">
                  <strong>Items:</strong>
                  <table style="width:100%; border-collapse:collapse; margin-top:8px; font-size:14px;">
                    <thead>
                      <tr style="background:#f5e9c6;">
                        <th style="text-align:left; padding:6px;">Item</th>
                        <th style="text-align:center; padding:6px;">Qty</th>
                        <th style="text-align:center; padding:6px;">Size</th>
                        <th style="text-align:center; padding:6px;">Sugar</th>
                        <th style="text-align:center; padding:6px;">Add-Ons</th>
                        <th style="text-align:right; padding:6px;">Price</th>
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
                                <td style="padding:6px;">${item.item || ""}</td>
                                <td style="text-align:center; padding:6px;">${qty}</td>
                                <td style="text-align:center; padding:6px;">${sizeHTML}</td>
                                <td style="text-align:center; padding:6px;">${sugar}</td>
                                <td style="text-align:center; padding:6px;">${addons}</td>
                                <td style="text-align:right; padding:6px;">${itemPrice}</td>
                              </tr>`;
                            }).join('')
                          : `<tr><td colspan="6" style="padding:6px;">No items found.</td></tr>`
                      }
                    </tbody>
                  </table>
                </div>

                <p id="total" style="text-align:right; font-weight:bold; margin-top:10px;">Total Price: P${totalPrice.toFixed(2)}</p>

                <div style="margin-top:12px; text-align:center;">
                  <button id="order-again" style="padding:10px 14px; border-radius:6px; border:none; background:#1976d2; color:#fff; cursor:pointer;">Order Again</button>
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
                orderAgainBtn.addEventListener('click', () => {
                    if (orderData.orders) {
                        const uid = localStorage.getItem('userUid');
                        const orderRef = ref(database, `users/${uid}/ordercart`);
                        const itemsToPush = Object.values(orderData.orders);
                        Promise.all(itemsToPush.map(item => push(orderRef, item)))
                            .then(() => {
                                const successDiv = document.getElementById('success');
                                if (successDiv) {
                                    successDiv.style.display = 'block';
                                    setTimeout(() => {
                                        successDiv.style.display = 'none';
                                        window.location.href = 'cart.html';
                                    }, 1200);
                                } else {
                                    window.location.href = 'cart.html';
                                }
                            })
                            .catch((error) => {
                                console.error("Error adding items to cart:", error);
                            });
                    }
                });
            }
        })
        .catch((error) => {
            console.error("Error fetching order details:", error);
            historyDetailsElement.innerHTML = '<p>Error fetching order details.</p>';
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
      showModal("Are you sure you want to delete ALL history records?", () => {
        const historyRef = ref(database, `users/${userUid}/history`);
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
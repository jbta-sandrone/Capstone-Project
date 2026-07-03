import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getDatabase, ref, onValue, remove, set, get, child, push, update } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

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

const app = initializeApp(firebaseConfig);
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

// --- Modal logic for viewing images closely ---
const imageModal = document.getElementById('image-modal');
const modalImg = document.getElementById('modal-img');
if (imageModal && modalImg) {
  imageModal.onclick = () => {
    imageModal.style.display = "none";
    modalImg.src = "";
  };
}
function showImageModal(src) {
  if (imageModal && modalImg) {
    modalImg.src = src;
    imageModal.style.display = "flex";
  }
}

function escapeHTML(value) {
  return (value ?? "").toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getOrderItems(orderData) {
  return orderData.orders ? Object.values(orderData.orders) : [];
}

function getOrderTotal(orderData) {
  return getOrderItems(orderData).reduce((sum, item) => {
    const price = parseFloat((item.price || "0").toString().replace(/[^\d.]/g, "")) || 0;
    return sum + price;
  }, 0);
}

const runningTimers = {};
const TIMER_DURATION = 0; // seconds

function startTimer(paragraph, orderID) {
  const timerKey = `order_timer_${orderID}`;
  let startTime = localStorage.getItem(timerKey);

  if (!startTime) {
    startTime = Date.now();
    localStorage.setItem(timerKey, startTime);
  } else {
    startTime = parseInt(startTime, 10);
  }

  function updateTimer() {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const remaining = TIMER_DURATION - elapsed;
    if (remaining > 0) {
      paragraph.textContent = `Submitting Order ID ${orderID} in ${remaining}s. Please keep this window open.`;
    } else {
      paragraph.textContent = `Your Order ID ${orderID} is being prepared, please wait for further updates.`;
      clearInterval(runningTimers[orderID]);
      delete runningTimers[orderID];
    }
  }

  updateTimer();

  if (!runningTimers[orderID]) {
    runningTimers[orderID] = setInterval(updateTimer, 1000);
  }
}

// Save to history when timer runs out
async function saveToHistory(orderData, userUid) {
  if (orderData._savedToHistory || orderData.historySaved) return;
  orderData._savedToHistory = true;

  const historyRef = ref(database, `users/${userUid}/history`);
  const newHistoryEntry = push(historyRef);

  // compute total the same way the notification overlay shows it
  const items = orderData.orders ? Object.values(orderData.orders) : [];
  const total = items.reduce((sum, item) => {
    const price = parseFloat((item.price || "0").toString().replace(/[^0-9.]/g, "")) || 0;
    return sum + price;
  }, 0);

  const historyData = {
    orderID: orderData.orderID,
    date: orderData.date || new Date().toISOString().split('T')[0],
    orders: orderData.orders,
    total: total.toFixed(2) // store same formatted total as shown in notification
  };

  await set(newHistoryEntry, historyData);
  if (orderData.notifKey) {
    await update(ref(database, `users/${userUid}/notification/${orderData.notifKey}`), { historySaved: true });
  }
}

// Move order to global orderqueue and save to history
async function moveToOrderQueue(orderData, notifKey, userUid) {
  const authUser = await waitForCurrentUser();
  if (!authUser) {
    console.error("Cannot move to orderqueue: user is not authenticated.");
    return;
  }

  const authenticatedUid = authUser.uid;
  if (!userUid || userUid !== authenticatedUid) {
    userUid = authenticatedUid;
    localStorage.setItem("userUid", userUid);
  }

  if (orderData._canceled) return;
  if (orderData._movedToQueue || orderData.done || orderData.queued) return;
  orderData._movedToQueue = true;

  // Check for existing orderID in orderqueue
  const queueRef = ref(database, 'orderqueue');
  const snapshot = await get(queueRef);
  let alreadyExists = false;
  if (snapshot.exists()) {
    const queueData = snapshot.val();
    Object.values(queueData).forEach(q => {
      if (q.orderID === orderData.orderID) {
        alreadyExists = true;
      }
    });
  }
  if (alreadyExists) {
    // Don't push duplicate
    await update(ref(database, `users/${userUid}/notification/${notifKey}`), { queued: true });
    await saveToHistory({ ...orderData, notifKey }, userUid);
    return;
  }

  // Proceed as before
  const dbRef = ref(database);
  const userSnap = await get(child(dbRef, `users/${userUid}`));
  if (userSnap.exists()) {
    const userData = userSnap.val();
    const queueData = {
      ...orderData,
      user: {
        name: userData.username || "",
        phone: userData.phone || "",
        email: userData.email || "",
        uid: userUid
      }
    };
    await set(push(queueRef), queueData);
    await update(ref(database, `users/${userUid}/notification/${notifKey}`), { queued: true });
    await saveToHistory({ ...orderData, notifKey }, userUid);
  }
}

// Overlay creation
function showOverlay(orderData, notifKey, userUid) {
  const oldOverlay = document.getElementById('order-details-overlay');
  if (oldOverlay) oldOverlay.remove();

  const overlay = document.createElement('div');
  overlay.id = 'order-details-overlay';
  overlay.className = 'order-details-overlay';

  const form = document.createElement('div');
  form.className = 'order-details-modal';

  const orderDate = new Date(orderData.date || Date.now()).toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour12: true
  });
  const orderItems = getOrderItems(orderData);
  const orderTotal = getOrderTotal(orderData);

  form.innerHTML = `
  <div id="order-details-content">
    <header class="order-details-header">
      <div>
        <p class="order-details-eyebrow">B-Hive Cafe Receipt</p>
        <h2>Order Details</h2>
      </div>
      <div class="order-id-badge">
        <span>Order ID</span>
        <strong>${escapeHTML(orderData.orderID || "")}</strong>
      </div>
    </header>

    <section class="order-details-grid" aria-label="Order information">
      <div class="order-info-card">
        <span>Date</span>
        <strong>${escapeHTML(orderDate)}</strong>
      </div>
      <div class="order-info-card">
        <span>Payment Method</span>
        <strong>${escapeHTML(orderData.paymentMethod || "N/A")}</strong>
      </div>
      <div class="order-info-card">
        <span>Order Type</span>
        <strong>${escapeHTML(orderData.orderType || "N/A")}</strong>
      </div>
    </section>

    <section class="order-notes-card">
      <span>Notes</span>
      <p>${orderData.notes ? escapeHTML(orderData.notes) : "<em>None</em>"}</p>
    </section>

    <section class="order-items-card">
      <div class="order-section-heading">
        <h3>Ordered Items</h3>
        <span>${orderItems.length} item${orderItems.length === 1 ? "" : "s"}</span>
      </div>
      <div class="order-items-table-wrap">
        <table class="order-items-table">
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
              orderItems.length
                ? orderItems.map(item => `
                  <tr>
                    <td data-label="Item">${escapeHTML(item.item || "")}</td>
                    <td data-label="Qty">${escapeHTML(item.quantity || "")}</td>
                    <td data-label="Size">${escapeHTML(item.size || item.type || "")}</td>
                    <td data-label="Sugar">${escapeHTML(item.sugar || "")}</td>
                    <td data-label="Add-Ons">${escapeHTML(item.addons || item.addon || "")}</td>
                    <td data-label="Price">${escapeHTML(item.price || "")}</td>
                  </tr>
                `).join("")
                : `<tr><td colspan="6">No orders found.</td></tr>`
            }
          </tbody>
        </table>
      </div>
    </section>

    <section class="order-total-card">
      <span>Total Amount</span>
      <strong>P${orderTotal.toFixed(2)}</strong>
    </section>

    <div class="order-thank-you">
      Thank you for your order!
    </div>
  </div>
`;

  // --- GCash Payment Proof Display in Overlay with Modal ---
  if (orderData.gcashProof) {
    const proofDiv = document.createElement('div');
    proofDiv.className = "order-proof-card";
    proofDiv.innerHTML = `<div>
        <span>GCash Payment Proof</span>
        <strong>Uploaded receipt image</strong>
      </div>
      <img src="${escapeHTML(orderData.gcashProof)}" alt="GCash Proof">
      <button type="button" class="view-img-btn">View Image</button>
    `;
    proofDiv.querySelector('img').onclick = () => showImageModal(orderData.gcashProof);
    proofDiv.querySelector('.view-img-btn').onclick = () => showImageModal(orderData.gcashProof);
    form.appendChild(proofDiv);
  }

  const modalActions = document.createElement('div');
  modalActions.className = "order-details-actions";
  form.appendChild(modalActions);

  // --- Download Receipt button ---
const downloadBtn = document.createElement('button');
downloadBtn.textContent = "Download Order";
downloadBtn.type = "button";
downloadBtn.className = "download-order-btn";

const closeActionBtn = document.createElement('button');
closeActionBtn.textContent = "Close";
closeActionBtn.type = "button";
closeActionBtn.className = "order-details-close-action";
closeActionBtn.onclick = (e) => {
    e.stopPropagation();
    overlay.classList.add('is-closing');
    setTimeout(() => overlay.remove(), 180);
    const modal = document.getElementById('confirmation-modal');
    if (modal) modal.style.display = "none";
};

modalActions.appendChild(downloadBtn);
modalActions.appendChild(closeActionBtn);

// Download logic
downloadBtn.onclick = () => {
    // Hide close/cancel/download buttons for clean receipt
    closeBtn.style.display = "none";
    closeActionBtn.style.display = "none";
    downloadBtn.style.display = "none";

    const content = document.getElementById('order-details-content');
    html2canvas(content, { backgroundColor: "#fffdf8", scale: 2 }).then(canvas => {
        // Restore buttons
        closeBtn.style.display = "";
        closeActionBtn.style.display = "";
        downloadBtn.style.display = "";

        // Download image
        const link = document.createElement('a');
        link.download = `OrderReceipt_${orderData.orderID || "order"}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
    });
};


  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.textContent = "×";
  closeBtn.type = "button";
  closeBtn.innerHTML = "&times;";
  closeBtn.className = "order-details-close";
  closeBtn.setAttribute("aria-label", "Close order details");
  closeBtn.onclick = (e) => {
    e.stopPropagation();
    overlay.classList.add('is-closing');
    setTimeout(() => overlay.remove(), 180);
    const modal = document.getElementById('confirmation-modal');
    if (modal) modal.style.display = "none";
  };
  form.appendChild(closeBtn);

  overlay.appendChild(form);
  document.body.appendChild(overlay);

  // Auto-close overlay and modal if timer runs out
  const timerKey = `order_timer_${orderData.orderID}`;
  let startTime = localStorage.getItem(timerKey);
  if (!startTime) {
    startTime = Date.now();
    localStorage.setItem(timerKey, startTime);
  } else {
    startTime = parseInt(startTime, 10);
  }
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const remaining = TIMER_DURATION - elapsed;
  if (remaining > 0) {
    setTimeout(async () => {
      closeActionBtn.disabled = true;
      closeActionBtn.style.opacity = "0.6";
      closeActionBtn.style.cursor = "not-allowed";
      closeActionBtn.title = "This order is being submitted.";
      if (document.body.contains(overlay)) overlay.remove();
      const modal = document.getElementById('confirmation-modal');
      if (modal) modal.style.display = "none";
      await moveToOrderQueue(orderData, notifKey, userUid);
    }, remaining * 1000);
  }
}

// Display notifications and handle timer/history/queue logic
async function displayNotifications() {
  const authUser = await waitForCurrentUser();
  const userUid = authUser ? authUser.uid : localStorage.getItem("userUid");
  if (!userUid) return;
  if (authUser) localStorage.setItem("userUid", userUid);

  const notifRef = ref(database, `users/${userUid}/notification`);
  const notifContainer = document.querySelector('.order-status-card');
  notifContainer.innerHTML = "";

  onValue(notifRef, (snapshot) => {
    notifContainer.innerHTML = "";
    const data = snapshot.val();
    if (data) {
      Object.entries(data).forEach(([key, notif]) => {
        if (!notif.queued && !notif.done) {
          if (notif.paymentMethod && notif.paymentMethod.toLowerCase() === "gcash") {
            moveToOrderQueue({ ...notif, notifKey: key }, key, userUid);
          } else {
            const timerKey = `order_timer_${notif.orderID}`;
            let startTime = localStorage.getItem(timerKey);
            if (!startTime) {
              startTime = Date.now();
              localStorage.setItem(timerKey, startTime);
            } else {
              startTime = parseInt(startTime, 10);
            }
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const remaining = TIMER_DURATION - elapsed;

            if (remaining <= 0) {
              moveToOrderQueue({ ...notif, notifKey: key }, key, userUid);
            } else {
              setTimeout(() => {
                moveToOrderQueue({ ...notif, notifKey: key }, key, userUid);
              }, remaining * 1000);
            }
          }
        }

        const card = document.createElement('div');
        card.className = "notif-card";
        card.style.marginBottom = "20px";

        const icon = document.createElement('i');
        if (notif.status === "completed" || notif.message === "Your order has been completed") {
          icon.className = "fas fa-check-circle status-icon";
          icon.style.color = "#28a745";
        } else {
          icon.className = "status-icon status-spinner";
        }
        card.appendChild(icon);

        const statusText = document.createElement('div');
        statusText.className = "status-text";

        const statusHeading = document.createElement('h2');
        statusHeading.textContent = "Order Status";
        statusHeading.style.margin = "0 0 6px 0";
        statusHeading.style.fontSize = "20px";
        statusText.appendChild(statusHeading);

        const timerParagraph = document.createElement('p');

        if (notif.status === "completed" || notif.message === "Your order has been completed") {
          timerParagraph.textContent = "Your order is now ready, please proceed to claim it at the counter.";
        } else if (notif.paymentMethod && notif.paymentMethod.toLowerCase() === "gcash") {
          timerParagraph.textContent = `Your Order ID ${notif.orderID} is being prepared, please wait for further updates.`;
        } else {
          startTimer(timerParagraph, notif.orderID);
        }

        statusText.appendChild(timerParagraph);

        const actionBtn = document.createElement('button');
        if (notif.status === "completed" || notif.message === "Your order has been completed") {
          actionBtn.textContent = "Received";
          actionBtn.className = "details-btn";
          actionBtn.style.background = "#28a745";
          actionBtn.onclick = () => {
            const modal = document.getElementById('confirmation-modal');
            const modalMessage = document.getElementById('modal-message');
            modalMessage.textContent = "Mark this order as received? This will remove it from your notifications.";
            modal.style.display = "flex";
            modal.style.zIndex = "10001";

            const confirmBtn = document.getElementById('modal-confirm-btn');
            const cancelModalBtn = document.getElementById('modal-cancel-btn');

            confirmBtn.onclick = null;
            cancelModalBtn.onclick = null;

            confirmBtn.onclick = async () => {
              await remove(ref(database, `users/${userUid}/notification/${key}`));
              modal.style.display = "none";
            };
            cancelModalBtn.onclick = () => {
              modal.style.display = "none";
            };
          };
        } else {
          actionBtn.textContent = "Details";
          actionBtn.className = "details-btn";
          actionBtn.onclick = () => {
            showOverlay(notif, key, userUid);
          };
        }
        actionBtn.style.marginTop = "10px";
        statusText.appendChild(actionBtn);

        card.appendChild(statusText);
        notifContainer.appendChild(card);
      });
    } else {
      notifContainer.innerHTML = "<p>No notifications found.</p>";
    }
  });
}

displayNotifications();

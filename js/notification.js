import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
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
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.background = 'rgba(0,0,0,0.5)';
  overlay.style.display = 'flex';
  overlay.style.justifyContent = 'center';
  overlay.style.alignItems = 'center';
  overlay.style.zIndex = '9999';

  const form = document.createElement('div');
form.style.background = '#fffbe6';
form.style.border = '2px solid #d0b273';
form.style.borderRadius = '12px';
form.style.padding = '32px 24px';
form.style.minWidth = '320px';
form.style.maxWidth = '90vw';
form.style.boxShadow = '0 2px 16px rgba(0,0,0,0.15)';
form.style.position = 'relative';
// Add these lines:
form.style.maxHeight = '550px';
form.style.overflowY = 'auto';

  form.innerHTML = `
  <div id="order-details-content">
    <div style="text-align:center; margin-bottom:18px;">
      <h2 style="margin:0; font-size:1.7em; letter-spacing:1px;">Order Details</h2>
      <div style="font-size:15px; color:#555;">
        ${new Date(orderData.date || Date.now()).toLocaleString("en-PH", {
  timeZone: "Asia/Manila",
  year: "numeric",
  month: "long",
  day: "numeric",
  hour12: true
})}
      </div>
      <div style="margin-top:4px; font-size:14px; color:#888;">
        Order ID: <strong>${orderData.orderID || ""}</strong>
      </div>
    </div>

    <div style="margin-bottom:10px;">
      <div style="margin-bottom:10px;"><strong>Payment Method:</strong> ${orderData.paymentMethod || ""}</div>
      <div style="margin-bottom:10px;"><strong>Order Type:</strong> ${orderData.orderType || ""}</div>
      <div style="margin-bottom:20px;"><strong>Notes:</strong> ${orderData.notes ? orderData.notes : "<em>None</em>"}</div>
    </div>

    <div style="margin-bottom:10px;">
      <strong>Orders:</strong>
      <table style="width:100%; border-collapse:collapse; margin-top:8px; font-size:15px;">
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
            orderData.orders
              ? Object.values(orderData.orders).map(item => `
                <tr>
                  <td style="padding:6px;">${item.item || ""}</td>
                  <td style="text-align:center; padding:6px;">${item.quantity || ""}</td>
                  <td style="text-align:center; padding:6px;">${item.size || ""}</td>
                  <td style="text-align:center; padding:6px;">${item.sugar || ""}</td>
                  <td style="text-align:center; padding:6px;">${item.addons || item.addon || ""}</td>
                  <td style="text-align:right; padding:6px;">${item.price || ""}</td>
                </tr>
              `).join("")
              : `<tr><td colspan="6" style="padding:6px;">No orders found.</td></tr>`
          }
        </tbody>
      </table>
    </div>

    <div style="margin-top:12px; font-size:16px; text-align:right;">
      <strong>Total: </strong>
      ${
        orderData.orders
          ? "P" + Object.values(orderData.orders).reduce((sum, item) => {
              const price = parseFloat((item.price || "0").replace(/[^\d.]/g, "")) || 0;
              return sum + price;
            }, 0).toFixed(2)
          : "P0.00"
      }
    </div>

    <div style="margin:24px 0px; text-align:center; font-size:16px; color:green; font-weight:bold;">
      THANK YOU FOR YOUR ORDER!
    </div>
  </div>
`;



  // --- GCash Payment Proof Display in Overlay with Modal ---
  if (orderData.gcashProof) {
    const proofDiv = document.createElement('div');
    proofDiv.innerHTML = `<strong>GCash Payment Proof:</strong><br>
      <img src="${orderData.gcashProof}" alt="GCash Proof"
           style="max-width:200px;max-height:200px;border-radius:8px;margin-top:6px;cursor:pointer;">
      <br>
      <button class="view-img-btn" style="margin-top:8px;padding:6px 16px;border-radius:6px;border:none;background:#1976d2;color:#fff;cursor:pointer;">View Image</button>
    `;
    proofDiv.querySelector('img').onclick = () => showImageModal(orderData.gcashProof);
    proofDiv.querySelector('.view-img-btn').onclick = () => showImageModal(orderData.gcashProof);
    form.appendChild(proofDiv);
  }

  // --- Download Receipt button ---
const downloadBtn = document.createElement('button');
downloadBtn.textContent = "Download Order";
downloadBtn.style.background = "#1976d2";
downloadBtn.style.color = "#fff";
downloadBtn.style.border = "none";
downloadBtn.style.borderRadius = "8px";
downloadBtn.style.padding = "11px";
downloadBtn.style.fontSize = "16px";
downloadBtn.style.cursor = "pointer";
downloadBtn.style.marginTop = "8px";
downloadBtn.style.marginRight = "10px";

// Insert before Cancel Order button
form.appendChild(downloadBtn);

// Download logic
downloadBtn.onclick = () => {
    // Hide close/cancel/download buttons for clean receipt
    closeBtn.style.display = "none";
    cancelBtn.style.display = "none";
    downloadBtn.style.display = "none";

    const content = document.getElementById('order-details-content');
    html2canvas(content, { backgroundColor: "#fffbe6", scale: 2 }).then(canvas => {
        // Restore buttons
        closeBtn.style.display = "";
        cancelBtn.style.display = "";
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
  closeBtn.style.position = "absolute";
  closeBtn.style.top = "12px";
  closeBtn.style.right = "16px";
  closeBtn.style.background = "none";
  closeBtn.style.border = "none";
  closeBtn.style.fontSize = "28px";
  closeBtn.style.cursor = "pointer";
  closeBtn.onclick = (e) => {
    e.stopPropagation();
    overlay.remove();
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
      cancelBtn.disabled = true;
      cancelBtn.style.opacity = "0.6";
      cancelBtn.style.cursor = "not-allowed";
      cancelBtn.title = "You can no longer cancel this order.";
      if (document.body.contains(overlay)) overlay.remove();
      const modal = document.getElementById('confirmation-modal');
      if (modal) modal.style.display = "none";
      await moveToOrderQueue(orderData, notifKey, userUid);
    }, remaining * 1000);
  }
}

// Display notifications and handle timer/history/queue logic
function displayNotifications() {
  const userUid = localStorage.getItem("userUid");
  if (!userUid) return;

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
          icon.className = "fas fa-spinner fa-spin status-icon";
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
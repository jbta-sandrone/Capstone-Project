import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, onValue, remove, update, runTransaction } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// Firebase config (reuse your config)
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

// Helper: Get week range string for a given date
function getWeekRange(dateObj) {
  const dayOfWeek = dateObj.getDay();
  const startDate = new Date(dateObj);
  startDate.setDate(dateObj.getDate() - ((dayOfWeek + 6) % 7)); // Monday as start
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);

  const options = { month: 'short', day: 'numeric' };
  const year = endDate.getFullYear();
  return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}, ${year}`;
}

// Helper: Get month name for a given date
function getMonthName(dateObj) {
  const options = { month: 'long' };
  return dateObj.toLocaleDateString('en-US', options);
}

// Helper: Get year for a given date
function getYear(dateObj) {
  return dateObj.getFullYear().toString();
}

function displayOrderQueue() {
  const queueDiv = document.querySelector('.queue');
  queueDiv.innerHTML = "";

  const queueRef = ref(database, 'orderqueue');
  onValue(queueRef, (snapshot) => {
    // --- Realtime duplicate removal ---
    const data = snapshot.val();
    if (data) {
      // Map orderID to array of queueKeys
      const orderIDMap = {};
      Object.entries(data).forEach(([queueKey, order]) => {
        const oid = order.orderID;
        if (!oid) return;
        if (!orderIDMap[oid]) orderIDMap[oid] = [];
        orderIDMap[oid].push(queueKey);
      });

      // For each orderID with more than one entry, remove all but the first
      Object.values(orderIDMap).forEach(keys => {
        if (keys.length > 1) {
          keys.slice(1).forEach(key => {
            remove(ref(database, `orderqueue/${key}`));
          });
        }
      });
    }

    // --- Display queue cards as before ---
    queueDiv.innerHTML = "";
    if (data) {
      Object.entries(data).forEach(([queueKey, order]) => {
    const card = document.createElement('div');
    card.className = "queue-card";
    card.style.marginBottom = "24px";
    card.style.background = "#fffbe6";
    card.style.border = "2px solid #d0b273";
    card.style.borderRadius = "12px";
    card.style.padding = "20px";
    card.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";

    // Receipt-like details with table
    card.innerHTML = `
      <div style="text-align:center; margin-bottom:18px;">
        <h2 style="margin:0; font-size:1.7em; letter-spacing:1px;">Order Details</h2>
        <div style="font-size:15px; color:#555;">
          ${new Date(order.date || Date.now()).toLocaleDateString("en-PH", {
  timeZone: "Asia/Manila",
  year: "numeric",
  month: "long",
  day: "numeric"
})}
        </div>
        <div style="margin-top:4px; font-size:14px; color:#888;">Order ID: <strong>${order.orderID || ""}</strong></div>
      </div>
      <div style="margin-bottom:10px;">
        <div style="margin-bottom:10px;"><strong>Name:</strong> ${order.user?.name || ""}</div>
        <div style="margin-bottom:10px;"><strong>Phone:</strong> ${order.user?.phone || ""}</div>
        <div style="margin-bottom:10px;"><strong>Email:</strong> ${order.user?.email || ""}</div>
        <div style="margin-bottom:10px;"><strong>Payment Method:</strong> ${order.paymentMethod || ""}</div>
        <div style="margin-bottom:10px;"><strong>Order Type:</strong> ${order.orderType || ""}</div>
        <div style="margin-bottom:20px;"><strong>Notes:</strong> ${order.notes || "<em>None</em>"}</div>
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
              order.orders
                ? Object.values(order.orders).map(item => `
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
          order.orders
            ? "P" + Object.values(order.orders).reduce((sum, item) => {
                const price = parseFloat((item.price || "0").replace(/[^\d.]/g, "")) || 0;
                return sum + price;
              }, 0).toFixed(2)
            : "P0.00"
        }
      </div>
      
  
    `;

        // --- GCash Payment Proof Display with Modal ---
        if (order.gcashProof) {
          const proofDiv = document.createElement('div');
          proofDiv.innerHTML = `<strong>GCash Payment Proof:</strong><br>
            <img src="${order.gcashProof}" alt="GCash Proof"
                 style="max-width:200px;max-height:200px;border-radius:8px;margin-top:6px;cursor:pointer;">
            <br>
            <button class="view-img-btn" style="margin-top:8px;padding:6px 16px;border-radius:6px;border:none;background:#1976d2;color:#fff;cursor:pointer;">View Image</button>
          `;
          proofDiv.querySelector('img').onclick = () => showImageModal(order.gcashProof);
          proofDiv.querySelector('.view-img-btn').onclick = () => showImageModal(order.gcashProof);
          card.appendChild(proofDiv);
        }

        // Complete Order button
        const completeBtn = document.createElement('button');
        completeBtn.textContent = "Complete Order";
        completeBtn.className = "complete-order-btn";
        completeBtn.style.background = "#28a745";
        completeBtn.style.color = "#fff";
        completeBtn.style.border = "none";
        completeBtn.style.borderRadius = "8px";
        completeBtn.style.padding = "10px 22px";
        completeBtn.style.fontSize = "16px";
        completeBtn.style.cursor = "pointer";
        completeBtn.style.marginTop = "10px";
        card.appendChild(completeBtn);

        // Confirmation modal logic
        completeBtn.onclick = () => {
          const modal = document.getElementById('confirmation-modal');
          const modalMessage = document.getElementById('modal-message');
          modalMessage.textContent = "Are you sure you want to complete this order? This will update the notification and remove it from the queue.";
          modal.style.display = "flex";
          modal.style.zIndex = "10001";

          const confirmBtn = document.getElementById('modal-confirm-btn');
          const cancelModalBtn = document.getElementById('modal-cancel-btn');

          // Remove previous listeners
          confirmBtn.onclick = null;
          cancelModalBtn.onclick = null;

          confirmBtn.onclick = async () => {
            // Remove from orderqueue
            await remove(ref(database, `orderqueue/${queueKey}`));
            // Update notification for this user and orderID
            if (order.user && order.user.uid && order.orderID) {
              const notifRef = ref(database, `users/${order.user.uid}/notification`);
              onValue(notifRef, (notifSnap) => {
                const notifData = notifSnap.val();
                if (notifData) {
                  Object.entries(notifData).forEach(([notifKey, notif]) => {
                    if (notif.orderID === order.orderID) {
                      update(ref(database, `users/${order.user.uid}/notification/${notifKey}`), {
                        message: "Your order has been completed",
                        status: "completed",
                        done: true
                      });
                    }
                  });
                }
              }, { onlyOnce: true });
            }

            // --- Weekly Sales & Items Update ---
    const today = new Date();
    const weekRange = getWeekRange(today);

    // Calculate total price for this order
    let orderTotal = 0;
    if (order.orders) {
        Object.values(order.orders).forEach(item => {
            const rawPrice = (item.price || "").toString().replace(/[^0-9.]/g, "");
            const price = parseFloat(rawPrice) || 0;
            orderTotal += price;
        });
    }

    // Reference to weekly node
    const weeklyRef = ref(database, `weekly/${weekRange}`);
    onValue(weeklyRef, (snapshot) => {
        const weeklyData = snapshot.val() || { totalOrders: 0, totalSales: 0, items: {} };
        // Update totalOrders and totalSales
        const newWeeklyData = {
            totalOrders: (weeklyData.totalOrders || 0) + 1,
            totalSales: (weeklyData.totalSales || 0) + orderTotal,
            items: weeklyData.items || {}
        };
        // Update items
        if (order.orders) {
            Object.values(order.orders).forEach(item => {
                const itemName = item.item || "";
                const qty = parseInt(item.quantity) || 0;
                if (!itemName) return;
                if (!newWeeklyData.items[itemName]) {
                    newWeeklyData.items[itemName] = { quantity: 0 };
                }
                newWeeklyData.items[itemName].quantity += qty;
            });
        }
        // Calculate total quantity for percentage
        const totalQty = Object.values(newWeeklyData.items).reduce((sum, obj) => sum + (obj.quantity || 0), 0);
        Object.entries(newWeeklyData.items).forEach(([name, obj]) => {
            obj.percentage = totalQty > 0 ? Math.round((obj.quantity / totalQty) * 100) : 0;
        });
        update(weeklyRef, newWeeklyData);
    }, { onlyOnce: true });

    // --- Monthly Sales & Items Update ---
const monthName = getMonthName(today); // e.g., "November"
const monthYear = getYear(today);      // e.g., "2025"
const monthKey = `${monthName} ${monthYear}`;
const monthRef = ref(database, `monthly/${monthKey}`);
    onValue(monthRef, (snapshot) => {
        const monthlyData = snapshot.val() || { totalOrders: 0, totalSales: 0, items: {} };
        // Update totalOrders and totalSales
        const newMonthlyData = {
            totalOrders: (monthlyData.totalOrders || 0) + 1,
            totalSales: (monthlyData.totalSales || 0) + orderTotal,
            items: monthlyData.items || {}
        };
        // Update items
        if (order.orders) {
            Object.values(order.orders).forEach(item => {
                const itemName = item.item || "";
                const qty = parseInt(item.quantity) || 0;
                if (!itemName) return;
                if (!newMonthlyData.items[itemName]) {
                    newMonthlyData.items[itemName] = { quantity: 0 };
                }
                newMonthlyData.items[itemName].quantity += qty;
            });
        }
        // Calculate total quantity for percentage
        const totalQty = Object.values(newMonthlyData.items).reduce((sum, obj) => sum + (obj.quantity || 0), 0);
        Object.entries(newMonthlyData.items).forEach(([name, obj]) => {
            obj.percentage = totalQty > 0 ? Math.round((obj.quantity / totalQty) * 100) : 0;
        });
        update(monthRef, newMonthlyData);
    }, { onlyOnce: true });

            // --- Yearly Sales Update ---
            const year = getYear(today); // e.g., "2025"
            const yearRef = ref(database, `yearly/${year}`);
            runTransaction(yearRef, (currentData) => {
              if (currentData === null) {
                return {
                  totalOrders: 1,
                  totalSales: orderTotal
                };
              } else {
                return {
                  totalOrders: (currentData.totalOrders || 0) + 1,
                  totalSales: (currentData.totalSales || 0) + orderTotal
                };
              }
            });

            // --- Analytics Item Popularity Update ---
            const analyticsRef = ref(database, 'analytics/items');
            onValue(analyticsRef, (snapshot) => {
              const analyticsData = snapshot.val() || {};
              // Step 1: Increment quantities for each item in this order
              if (order.orders) {
                Object.values(order.orders).forEach(item => {
                  const itemName = item.item || "";
                  const qty = parseInt(item.quantity) || 0;
                  if (!itemName) return;
                  if (!analyticsData[itemName]) {
                    analyticsData[itemName] = { quantity: 0 };
                  }
                  analyticsData[itemName].quantity += qty;
                });
              }

              // Step 2: Calculate total quantity of all items
              const totalQty = Object.values(analyticsData).reduce((sum, obj) => sum + (obj.quantity || 0), 0);

              // Step 3: Calculate and update percentage for each item
              Object.entries(analyticsData).forEach(([name, obj]) => {
                obj.percentage = totalQty > 0 ? Math.round((obj.quantity / totalQty) * 100) : 0;
              });

              // Step 4: Save back to analytics/items node
              update(ref(database, 'analytics/items'), analyticsData);
            }, { onlyOnce: true });

            // --- GCash and Cash Usage Rate Update ---
            const usageRef = ref(database, 'usagerate');
            onValue(usageRef, (snapshot) => {
              const usageData = snapshot.val() || {
                gcash: { usage: 0, rate: 0 },
                cash: { usage: 0, rate: 0 }
              };

              // Increment usage for the payment method
              if (order.paymentMethod && order.paymentMethod.toLowerCase() === "gcash") {
                usageData.gcash.usage += 1;
              } else if (order.paymentMethod && order.paymentMethod.toLowerCase() === "cash") {
                usageData.cash.usage += 1;
              }

              // Calculate total usage
              const totalUsage = (usageData.gcash.usage || 0) + (usageData.cash.usage || 0);

              // Calculate rates
              usageData.gcash.rate = totalUsage > 0 ? Math.round((usageData.gcash.usage / totalUsage) * 100) : 0;
              usageData.cash.rate = totalUsage > 0 ? Math.round((usageData.cash.usage / totalUsage) * 100) : 0;

              // Save back to usagerate node
              update(ref(database, 'usagerate'), usageData);
            }, { onlyOnce: true });

            // --- Order Type Percentage Update ---
            const otRef = ref(database, 'otpercentage');
            onValue(otRef, (snapshot) => {
              const otData = snapshot.val() || {
                "dine-in": { number: 0, percentage: 0 },
                "take-out": { number: 0, percentage: 0 },
                "pickup": { number: 0, percentage: 0 }
              };

              // Increment number for the order type
              const orderType = (order.orderType || "").toLowerCase();
              if (orderType === "dine-in" || orderType === "take-out" || orderType === "pickup") {
                otData[orderType].number += 1;
              }

              // Calculate total number of all types
              const totalNumber = (otData["dine-in"].number || 0) +
                                  (otData["take-out"].number || 0) +
                                  (otData["pickup"].number || 0);

              // Calculate percentages
              ["dine-in", "take-out", "pickup"].forEach(type => {
                otData[type].percentage = totalNumber > 0 ? Math.round((otData[type].number / totalNumber) * 100) : 0;
              });

              // Save back to otpercentage node
              update(ref(database, 'otpercentage'), otData);
            }, { onlyOnce: true });

            modal.style.display = "none";
          };

          cancelModalBtn.onclick = () => {
            modal.style.display = "none";
          };
        };

        queueDiv.appendChild(card);
      });
    } else {
      queueDiv.innerHTML = "<p>No queued orders.</p>";
    }
  });
}

displayOrderQueue();

let lastOrderCount = null;
const queueRef = ref(database, 'orderqueue');
onValue(queueRef, (snapshot) => {
    const data = snapshot.val();
    const currentCount = data ? Object.keys(data).length : 0;
    if (lastOrderCount !== null && currentCount > lastOrderCount) {
        // New order detected, refresh the page
        window.location.reload();
    }
    lastOrderCount = currentCount;
});
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getDatabase, ref, onValue, get, child, set, push } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAmg4q4LmjqA8DHK1zY4yV8OCRvtAWJeO4",
  authDomain: "cliq-8dba8.firebaseapp.com",
  projectId: "cliq-8dba8",
  messagingSenderId: "545738539503",
  appId: "1:545738539503:web:16560a7ac4cb3e3af0361a",
  databaseURL: "https://cliq-8dba8-default-rtdb.firebaseio.com/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Cloudinary config
const CLOUD_NAME = "drhczlmtf";      // ✅ your cloud name
const UPLOAD_PRESET = "cliq_preset"; // ✅ your unsigned preset

// Helper function to generate a unique 4-digit random order ID
function generateOrderID() {
  return Math.floor(1000 + Math.random() * 9000); // Generates a random number between 1000 and 9999
}

// Fetch and display personal information
function fetchPersonalInfo() {
  const username = localStorage.getItem("loggedInUsername"); // Retrieve the logged-in username

  if (!username) {
    console.error("No logged-in username found.");
    return;
  }

  const dbRef = ref(database);
  get(child(dbRef, `users`))
    .then((snapshot) => {
      if (snapshot.exists()) {
        const users = snapshot.val();
        let userData = null;

        for (const userId in users) {
          const user = users[userId];
          if (user.username === username) {
            userData = user;
            break;
          }
        }

        if (userData) {
          document.querySelector(".person .name").textContent = `Name: ${userData.username}`;
          document.querySelector(".person .number").textContent = `Contact: ${userData.phone || "N/A"}`;
          document.querySelector(".person .email").textContent = `Email: ${userData.email}`;
        } else {
          console.error("User data not found.");
        }
      } else {
        console.error("No users found in the database.");
      }
    })
    .catch((error) => {
      console.error("Error fetching user data:", error);
    });
}

// Fetch and display order cart data
function fetchOrderCart() {
  const userUid = localStorage.getItem("userUid");
  if (!userUid) {
    document.querySelector('.order').innerHTML = '<p>You are not logged in.</p>';
    return;
  }
  const orderRef = ref(database, `users/${userUid}/ordercart`);
  const orderElement = document.querySelector('.order');

  onValue(orderRef, (snapshot) => {
    orderElement.innerHTML = '';
    const orders = snapshot.val();
    let totalPrice = 0;

    if (orders) {
      Object.entries(orders).forEach(([key, order]) => {
        const orderItem = document.createElement('div');
        orderItem.classList.add('order-item');

        const typeHTML = order.type ? `<p><strong>Type:</strong> ${order.type}</p>` : '';
        const sizeHTML = order.size ? `<p><strong>Size:</strong> ${order.size}</p>` : '';
        const sugarHTML = order.sugar ? `<p><strong>Sugar:</strong> ${order.sugar}</p>` : '';
        const addonHTML = order.addon ? `<p><strong>Add On:</strong> ${order.addon}</p>` : '';
        const quantityHTML = order.quantity ? `<p><strong>Quantity:</strong> ${order.quantity}</p>` : '';

        const rawPrice = order.price?.toString().trim() || "0";
        const cleanedPrice = parseFloat(rawPrice.replace(/[^0-9.]/g, ''));
        totalPrice += !isNaN(cleanedPrice) ? cleanedPrice : 0;

        orderItem.innerHTML = `
          <p><strong>Item:</strong> ${order.item}</p>
          ${typeHTML}
          ${sizeHTML}
          ${sugarHTML}
          ${addonHTML}
          ${quantityHTML}
          <p><strong>Price:</strong> P${cleanedPrice.toFixed(2)}</p>
          <hr>
        `;

        orderElement.appendChild(orderItem);
      });

      const totalPriceElement = document.createElement('div');
      totalPriceElement.classList.add('total-price');
      totalPriceElement.innerHTML = `
        <p><strong>Total Price:</strong> P${totalPrice.toFixed(2)}</p>
      `;
      orderElement.appendChild(totalPriceElement);
    } else {
      orderElement.innerHTML = '<p>No items in the cart.</p>';
    }
  }, (error) => {
    orderElement.innerHTML = '<p>Error fetching cart data.</p>';
    console.error("❌ Error fetching order cart data:", error);
  });
}

// Handle submit order button click
function handleSubmitOrder() {
  const form = document.getElementById("checkout-form");
  const gcashOverlay = document.getElementById("gcash-overlay");
  const gcashNumber = document.getElementById("gcash-number");
  const copyBtn = document.getElementById("copy-gcash-number");
  const confirmBtn = document.getElementById("confirm-gcash");
  const closeBtn = document.getElementById("close-gcash");
  const paymentProofInput = document.getElementById("payment-proof");
  const gcashError = document.getElementById("gcash-error");

  let paymentProofFile = null;
  let gcashConfirmed = false;
  let paymentProofUrl = null;

  gcashNumber.textContent = "09761016814";

  document.addEventListener("DOMContentLoaded", function() {
  const copyBtn = document.getElementById("copy-gcash-number");
  const gcashNumber = document.getElementById("gcash-number");
  if (copyBtn && gcashNumber) {
    copyBtn.onclick = function() {
      const number = gcashNumber.textContent.trim();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(number)
          .then(() => {
            copyBtn.title = "Copied!";
            copyBtn.querySelector('i').style.color = "#28a745";
            setTimeout(() => {
              copyBtn.title = "Copy GCash Number";
              copyBtn.querySelector('i').style.color = "";
            }, 1200);
          })
          .catch(() => {
            alert("Copy failed. Please copy manually.");
          });
      } else {
        // Fallback for older browsers
        const tempInput = document.createElement("input");
        tempInput.value = number;
        document.body.appendChild(tempInput);
        tempInput.select();
        try {
          document.execCommand("copy");
          copyBtn.title = "Copied!";
          copyBtn.querySelector('i').style.color = "#28a745";
          setTimeout(() => {
            copyBtn.title = "Copy GCash Number";
            copyBtn.querySelector('i').style.color = "";
          }, 1200);
        } catch (err) {
          alert("Copy failed. Please copy manually.");
        }
        document.body.removeChild(tempInput);
      }
    };
  }
});

document.addEventListener("DOMContentLoaded", function() {
    const orderTypeSelect = document.getElementById("order-type");
    const cashRadio = document.getElementById("cash");
    const gcashRadio = document.getElementById("gcash");
    const gcashLabel = gcashRadio.closest("label");
    let pickupNote = document.getElementById("pickup-note");

    if (!pickupNote) {
        pickupNote = document.createElement("div");
        pickupNote.id = "pickup-note";
        pickupNote.style.color = "#d9534f";
        pickupNote.style.fontWeight = "bold";
        pickupNote.style.fontSize = "15px";
        pickupNote.style.marginTop = "4px";
        gcashLabel.parentNode.insertBefore(pickupNote, gcashLabel.nextSibling);
    }

    function updatePaymentOptions() {
        if (orderTypeSelect.value === "pickup") {
            cashRadio.disabled = true;
            gcashRadio.checked = true;
            pickupNote.textContent = "Pickup orders require GCash payment only.";
            pickupNote.style.display = "block";
        } else {
            cashRadio.disabled = false;
            pickupNote.style.display = "none";
        }
    }

    orderTypeSelect.addEventListener("change", updatePaymentOptions);

    // Initial check in case default is pickup
    updatePaymentOptions();
});


  paymentProofInput.addEventListener('change', function() {
    paymentProofFile = this.files[0] || null;
    gcashError.style.display = "none";
  });

  
  confirmBtn.onclick = function() {
  if (!paymentProofFile) {
    gcashError.textContent = "Please upload your payment proof.";
    gcashError.style.display = "block";
    return;
  }

  const reader = new FileReader();
  reader.onload = function(event) {
    paymentProofUrl = event.target.result; // base64 string
    gcashConfirmed = true;
    gcashOverlay.style.display = "none";
    form.requestSubmit();
  };
  reader.onerror = function() {
    gcashError.textContent = "Failed to read payment proof. Try again.";
    gcashError.style.display = "block";
  };
  reader.readAsDataURL(paymentProofFile);
};

  closeBtn.onclick = function() {
    gcashOverlay.style.display = "none";
    gcashConfirmed = false;
    paymentProofInput.value = "";
    paymentProofFile = null;
    paymentProofUrl = null;
    gcashError.style.display = "none";
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const paymentMethod = form.querySelector('input[name="payment-method"]:checked');
    if (paymentMethod && paymentMethod.value === "Gcash" && !gcashConfirmed) {
      gcashOverlay.style.display = "flex";
      return;
    }

    const userUid = localStorage.getItem("userUid");
    if (!userUid) {
      alert("You are not logged in.");
      return;
    }

    const orderType = form.querySelector('#order-type');
    const notes = form.querySelector('#notes').value;

    const orderRef = ref(database, `users/${userUid}/ordercart`);
    const notificationRef = ref(database, `users/${userUid}/notification`);

    get(orderRef)
      .then(async (snapshot) => {
        if (snapshot.exists()) {
          const orders = snapshot.val();
          const orderID = generateOrderID();
          const date = new Date().toISOString().split('T')[0];

          const newNotificationEntry = push(notificationRef);

          const notificationData = {
            orderID,
            date,
            orders,
            paymentMethod: paymentMethod ? paymentMethod.value : "",
            orderType: orderType ? orderType.value : "",
            notes: notes || "",
            gcashProof: paymentProofUrl || null // ✅ now Cloudinary URL
          };

          set(newNotificationEntry, notificationData)
            .then(() => {
              window.location.href = `receipt.html?orderID=${orderID}`;
            })
            .catch((error) => {
              console.error("❌ Error saving order to notification:", error);
            });
        } else {
          console.error("No orders found to save.");
        }
      })
      .catch((error) => {
        console.error("❌ Error fetching order cart data:", error);
      });
  });
}

// --- MAIN EXECUTION ---
fetchPersonalInfo();
const urlParams = new URLSearchParams(window.location.search);
const orderID = urlParams.get('orderID');
if (orderID) {
  // you still have fetchOrderAgainItems here if needed
  // (kept the function intact if you use it elsewhere)
} else {
  fetchOrderCart();
}
handleSubmitOrder();

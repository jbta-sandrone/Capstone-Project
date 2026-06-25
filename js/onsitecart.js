import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getDatabase, ref, onValue, remove } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

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

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// wait for DOM so #cart-items exists
document.addEventListener('DOMContentLoaded', () => {
  const cartItemsDiv = document.getElementById('cart-items');
  if (!cartItemsDiv) {
    console.error('onsitecart.js: #cart-items element not found in DOM.');
    return;
  }

  // Modal logic (uses confirmation-modal present in onsitecart.html)
  function showModal(message, onConfirm) {
    const modal = document.getElementById('confirmation-modal');
    const modalMessage = document.getElementById('modal-message');
    const confirmBtn = document.getElementById('modal-confirm-btn');
    const cancelBtn = document.getElementById('modal-cancel-btn');

    if (!modal || !modalMessage || !confirmBtn || !cancelBtn) {
      if (confirm(message)) onConfirm();
      return;
    }

    modalMessage.textContent = message;
    modal.style.display = 'flex';

    confirmBtn.onclick = () => { modal.style.display = 'none'; onConfirm(); };
    cancelBtn.onclick = () => { modal.style.display = 'none'; };
  }

  // Render onsite cart items
  function renderOnsiteCart(orders) {
    cartItemsDiv.innerHTML = "";
    let totalPrice = 0;

    if (orders && Object.keys(orders).length > 0) {
      Object.entries(orders).forEach(([key, order]) => {
        // robust parse: accept "P123" or "123" or numeric
        const rawPrice = (order.price || "").toString().trim();
        const cleaned = parseFloat(rawPrice.replace(/[^0-9.]/g, '')) || 0;
        // assume order.price already includes quantity (onsite.js stores total per line)
        totalPrice += cleaned;

        const orderItem = document.createElement('div');
        orderItem.classList.add('order-item');

        const sugarHTML = order.sugar ? `<p><strong>Sugar:</strong> ${order.sugar}</p>` : '';
        const addonHTML = order.addon ? `<p><strong>Add On:</strong> ${order.addon}</p>` : '';
        const typeHTML = order.type ? `<p><strong>Type:</strong> ${order.type}</p>` : '';
        const sizeHTML = order.size ? `<p><strong>Size:</strong> ${order.size}</p>` : '';
        const hotcoldHTML = order.hotcold ? `<p><strong>Espresso Type:</strong> ${order.hotcold}</p>` : '';

        orderItem.innerHTML = `
          <p><strong>Item:</strong> ${order.item || ''}</p>
          ${typeHTML}
          ${sizeHTML}
          ${hotcoldHTML}
          ${sugarHTML}
          ${addonHTML}
          <p><strong>Quantity:</strong> ${order.quantity || ''}</p>
          <p><strong>Price:</strong> ${order.price || ''}</p>
          <button class="delete-item-btn" data-key="${key}" aria-label="Delete item">
            <i class="fa fa-trash" aria-hidden="true"></i>
          </button>
        `;
        cartItemsDiv.appendChild(orderItem);
      });

      const footerHTML = document.createElement('div');
      footerHTML.className = 'onsitecart-footer';
      footerHTML.innerHTML = `
        <div class="total-price">
          <p><strong>Total Price:</strong> P${totalPrice.toFixed(2)}</p>
        </div>
        <div class="cart-actions">
          
          <button class="delete-all-btn" id="delete-all">Delete All</button>
        </div>
      `;
      cartItemsDiv.appendChild(footerHTML);
    } else {
      cartItemsDiv.innerHTML = `<p class="empty-cart">No items in the cart.</p>`;
    }
  }

  // subscribe to onsitecart node
  function fetchOnsiteCart() {
    const onsiteRef = ref(database, 'onsitecart');
    onValue(onsiteRef, (snapshot) => {
      const orders = snapshot.val();
      renderOnsiteCart(orders);
    }, (error) => {
      cartItemsDiv.innerHTML = '<p>Error fetching cart data.</p>';
      console.error("❌ Error fetching onsitecart:", error);
    });
  }

  // use document-level delegation so buttons added dynamically are handled
  document.addEventListener('click', (event) => {
    const deleteBtn = event.target.closest('.delete-item-btn');
    if (deleteBtn) {
      const itemKey = deleteBtn.getAttribute('data-key');
      showModal("Are you sure you want to delete this item?", () => {
        remove(ref(database, `onsitecart/${itemKey}`)).catch(err => console.error("❌ delete item error:", err));
      });
      return;
    }

    if (event.target.id === 'delete-all') {
      showModal("Are you sure you want to delete all cart items?", () => {
        remove(ref(database, 'onsitecart')).catch(err => console.error("❌ delete all error:", err));
      });
      return;
    }

    if (event.target.id === 'confirm-order') {
      window.location.href = 'checkout.html';
      return;
    }
  });

  // start listening
  fetchOnsiteCart();
});
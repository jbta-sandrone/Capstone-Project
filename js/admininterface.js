import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getDatabase, ref, onValue, remove, update } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

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

// Category mapping: db node -> container id
const categories = [
  { node: "milktea", container: "milktea-items" },
  { node: "espresso", container: "espresso-items" },
  { node: "fruittea", container: "fruittea-items" },
  { node: "silog", container: "silog-items" },
  { node: "sandwiches", container: "sandwiches-items" },
  { node: "snacks", container: "snacks-items" },
  { node: "ricemeal", container: "ricemeals-items" },
  { node: "noodlepasta", container: "noodlepasta-items" },
  { node: "fries", container: "fries-items" },
  { node: "extras", container: "extras-items" },
  { node: "bestseller", container: "bestseller-items" }
];

// Icon HTML (Font Awesome 5) wrapped in a flex container for right alignment
function getIconsHtml(category, key) {
  return `
    <span class="admin-icons">
      <i class="fas fa-edit edit-icon" title="Edit" data-category="${category}" data-key="${key}"></i>
      <i class="fas fa-trash delete-icon" title="Delete" data-category="${category}" data-key="${key}"></i>
      <i class="fa fa-power-off enable-icon" title="Enable" data-category="${category}" data-key="${key}"></i>
      <i class="fas fa-ban disable-icon" title="Disable" data-category="${category}" data-key="${key}"></i>
    </span>
  `;
}

// Modal logic
const modal = document.getElementById('confirmation-modal');
const modalMessage = document.getElementById('modal-message');
const modalConfirmBtn = document.getElementById('modal-confirm-btn');
const modalCancelBtn = document.getElementById('modal-cancel-btn');
const successDiv = document.getElementById('success');

let pendingDelete = null; // {category, key, itemDiv}
window.editingItem = null; // For edit state

function showModal(message, onConfirm) {
  modalMessage.textContent = message;
  modal.style.display = 'flex';
  // Remove previous listeners
  modalConfirmBtn.onclick = null;
  modalCancelBtn.onclick = null;
  // Set up listeners
  modalConfirmBtn.onclick = () => {
    modal.style.display = 'none';
    if (onConfirm) onConfirm();
  };
  modalCancelBtn.onclick = () => {
    modal.style.display = 'none';
    pendingDelete = null;
  };
}

// Helper to get display name for category select
function getCategoryDisplayName(node) {
  switch (node) {
    case "milktea": return "Milk Tea";
    case "fruittea": return "Fruit Tea";
    case "silog": return "Silog";
    case "espresso": return "Espresso";
    case "sandwiches": return "Sandwiches";
    case "snacks": return "Snacks";
    case "ricemeal": return "Rice Meals";
    case "noodlepasta": return "Noodles & Pasta";
    case "fries": return "Fries";
    case "extras": return "Extras";
    case "bestseller": return "Best Seller";
    default: return node;
  }
}

// Fetch and render items
categories.forEach(({ node, container }) => {
  const containerDiv = document.getElementById(container);
  if (!containerDiv) return;

  const nodeRef = ref(database, node);
  onValue(nodeRef, (snapshot) => {
    containerDiv.innerHTML = "";
    snapshot.forEach(child => {
      const data = child.val();
      const key = child.key;
      const itemDiv = document.createElement("div");
      itemDiv.className = "admin-item-row";
      itemDiv.innerHTML = `
        <span>${data.name || "(No Name)"}</span>
        ${getIconsHtml(node, key)}
      `;
      containerDiv.appendChild(itemDiv);

      // Delete icon event
      const deleteIcon = itemDiv.querySelector('.delete-icon');
      deleteIcon.addEventListener('click', function () {
        pendingDelete = { category: node, key: key, itemDiv: itemDiv };
        showModal(
          `Are you sure you want to delete "${data.name || "(No Name)"}"?`,
          () => {
            remove(ref(database, `${pendingDelete.category}/${pendingDelete.key}`))
              .then(() => {
                if (pendingDelete.itemDiv && pendingDelete.itemDiv.parentNode) {
                  pendingDelete.itemDiv.parentNode.removeChild(pendingDelete.itemDiv);
                }
                if (successDiv) {
                  successDiv.textContent = "Deleted Successfully!";
                  successDiv.style.display = 'block';
                  setTimeout(() => {
                    successDiv.style.display = 'none';
                  }, 2000);
                }
                pendingDelete = null;
              });
          }
        );
      });

      // Disable icon event
      const disableIcon = itemDiv.querySelector('.disable-icon');
      disableIcon.addEventListener('click', function () {
        showModal(
          `Are you sure you want to set "${data.name || "(No Name)"}" as Unavailable?`,
          () => {
            update(ref(database, `${node}/${key}`), { disabled: true })
              .then(() => {
                if (successDiv) {
                  successDiv.textContent = "Item set to Unavailable!";
                  successDiv.style.display = 'block';
                  setTimeout(() => {
                    successDiv.style.display = 'none';
                  }, 2000);
                }
              });
          }
        );
      });

      // Enable icon event
      const enableIcon = itemDiv.querySelector('.enable-icon');
      enableIcon.addEventListener('click', function () {
        showModal(
          `Are you sure you want to set "${data.name || "(No Name)"}" as Available?`,
          () => {
            update(ref(database, `${node}/${key}`), { disabled: false })
              .then(() => {
                if (successDiv) {
                  successDiv.textContent = "Item set to Available!";
                  successDiv.style.display = 'block';
                  setTimeout(() => {
                    successDiv.style.display = 'none';
                  }, 2000);
                }
              });
          }
        );
      });

      // Edit icon event
      const editIcon = itemDiv.querySelector('.edit-icon');
editIcon.addEventListener('click', function () {
    // Show overlay
    document.getElementById('fast-form-overlay').style.display = 'flex';

    // Change form title to "Edit Item"
    document.querySelector('.fast-form-popup .item-title').textContent = "Edit Item";

  // Change submit button text to "Edit"
    const submitBtn = document.querySelector('.fast-form-popup .submit-fast-form');
if (submitBtn) submitBtn.textContent = "Edit";

    // Fetch item data from db
    const itemRef = ref(database, `${node}/${key}`);
    onValue(itemRef, (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        // Fill form fields
        const categorySelect = document.getElementById('item-location');
        categorySelect.value = getCategoryDisplayName(node);
        categorySelect.setAttribute('disabled', 'disabled'); // Make category read-only

        document.getElementById('item-name').value = data.name || '';
        document.getElementById('item-price').value = data.price || '';

        // --- DYNAMIC SIZE/TYPE ROWS ---
        const sizePriceContainer = document.getElementById('size-price-container');
        const addSizeBtn = document.getElementById('add-size-btn');
        const itemPriceLabel = document.querySelector('label[for="item-price"]');
        const itemPriceInput = document.getElementById('item-price');

        // Clear previous rows
        sizePriceContainer.innerHTML = '';

        if (node === "milktea" || node === "fruittea") {
    sizePriceContainer.style.display = '';
    addSizeBtn.style.display = '';
    itemPriceLabel.style.display = 'none';
    itemPriceInput.style.display = 'none';
    itemPriceInput.removeAttribute('required');

            if (Array.isArray(data.sizes)) {
                data.sizes.forEach(sz => {
                    const row = document.createElement('div');
                    row.style.display = 'flex';
                    row.style.gap = '8px';
                    row.style.marginBottom = '6px';

                    const sizeSelect = document.createElement('select');
                    sizeSelect.name = 'size[]';
                    sizeSelect.required = true;
                    sizeSelect.innerHTML = `
                        <option value="" disabled>Select size</option>
                        <option value="16OZ"${sz.size === "16OZ" ? " selected" : ""}>16OZ</option>
                        <option value="22OZ"${sz.size === "22OZ" ? " selected" : ""}>22OZ</option>
                    `;

                    const priceInput = document.createElement('input');
                    priceInput.type = 'number';
                    priceInput.name = 'size-price[]';
                    priceInput.placeholder = 'Price';
                    priceInput.min = '1';
                    priceInput.required = true;
                    priceInput.style.width = '80px';
                    priceInput.value = sz.price || '';

                    const removeBtn = document.createElement('button');
                    removeBtn.type = 'button';
                    removeBtn.textContent = '✕';
                    removeBtn.style.background = '#e57373';
                    removeBtn.style.color = '#fff';
                    removeBtn.style.border = 'none';
                    removeBtn.style.borderRadius = '4px';
                    removeBtn.style.cursor = 'pointer';
                    removeBtn.onclick = () => row.remove();

                    row.appendChild(sizeSelect);
                    row.appendChild(priceInput);
                    row.appendChild(removeBtn);

                    sizePriceContainer.appendChild(row);
                });
            }
        } else if (node === "espresso") {
    sizePriceContainer.style.display = '';
    addSizeBtn.style.display = '';
    itemPriceLabel.style.display = 'none';
    itemPriceInput.style.display = 'none';
    itemPriceInput.removeAttribute('required');

            if (Array.isArray(data.types)) {
                data.types.forEach(tp => {
                    const row = document.createElement('div');
                    row.style.display = 'flex';
                    row.style.gap = '8px';
                    row.style.marginBottom = '6px';

                    const typeSelect = document.createElement('select');
                    typeSelect.name = 'size[]';
                    typeSelect.required = true;
                    typeSelect.innerHTML = `
                        <option value="" disabled>Select type</option>
                        <option value="Hot (12oz)"${tp.type === "Hot (12oz)" ? " selected" : ""}>Hot (12oz)</option>
                        <option value="Cold (16oz)"${tp.type === "Cold (16oz)" ? " selected" : ""}>Cold (16oz)</option>
                    `;

                    const priceInput = document.createElement('input');
                    priceInput.type = 'number';
                    priceInput.name = 'size-price[]';
                    priceInput.placeholder = 'Price';
                    priceInput.min = '1';
                    priceInput.required = true;
                    priceInput.style.width = '80px';
                    priceInput.value = tp.price || '';

                    const removeBtn = document.createElement('button');
                    removeBtn.type = 'button';
                    removeBtn.textContent = '✕';
                    removeBtn.style.background = '#e57373';
                    removeBtn.style.color = '#fff';
                    removeBtn.style.border = 'none';
                    removeBtn.style.borderRadius = '4px';
                    removeBtn.style.cursor = 'pointer';
                    removeBtn.onclick = () => row.remove();

                    row.appendChild(typeSelect);
                    row.appendChild(priceInput);
                    row.appendChild(removeBtn);

                    sizePriceContainer.appendChild(row);
                });
            }
        } else {
    sizePriceContainer.style.display = 'none';
    addSizeBtn.style.display = 'none';
    itemPriceLabel.style.display = '';
    itemPriceInput.style.display = '';
    itemPriceInput.setAttribute('required', 'required');
        }

        // Store editing state globally
        window.editingItem = { node, key };
    }, { onlyOnce: true });
});
    });
  });
});
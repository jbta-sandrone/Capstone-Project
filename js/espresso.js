import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getDatabase, ref, onValue, push } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

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

function displayEspressoItems() {
    const espressoRef = ref(database, 'espresso');
    const espressoPart = document.querySelector('.espresso-part');
    if (!espressoPart) return;

    // Set up the title and grid container
    espressoPart.innerHTML = '<h1 class="espresso-title">Espresso</h1><div class="espresso-grid"></div>';
    const espressoGrid = espressoPart.querySelector('.espresso-grid');

    onValue(espressoRef, (snapshot) => {
        espressoGrid.innerHTML = '';
        snapshot.forEach(childSnapshot => {
            const espresso = childSnapshot.val();
            const uniqueId = 'espresso-section' + childSnapshot.key;
            const isDisabled = espresso.disabled === true;

            const espressoSection = document.createElement('div');
            espressoSection.className = 'espresso-section';
            espressoSection.id = uniqueId;
            espressoSection.innerHTML = `
                <h2>${espresso.name}</h2>
                <div class="espresso-item">
                    <img src="${espresso.image || ''}" alt="${espresso.name} Image">
                    <div class="espresso-text">
                        ${
                isDisabled
                ? `<button class="add-to-cart" disabled style="background:#ccc;cursor:not-allowed;">Unavailable</button>`
                : `<button id="add-to-cart-${uniqueId}" class="add-to-cart" title="Add to Cart">
                        <i class="fas fa-cart-plus"></i>
                   </button>`
            }
                    </div>
                </div>
            `;
            espressoGrid.appendChild(espressoSection);

            // Overlay logic for customization
            if (!isDisabled) {
                const addToCartButton = espressoSection.querySelector(`#add-to-cart-${uniqueId}`);
                addToCartButton.addEventListener('click', function () {
                    const overlay = document.getElementById('cart-overlay');
                    const overlayContent = document.getElementById('cart-overlay-content');
                    const overlayX = document.getElementById('cart-overlay-x');

                    // Default to first type price or 0
                    let basePrice = Array.isArray(espresso.types) && espresso.types.length > 0
                        ? parseFloat(espresso.types[0].price) || 0
                        : 0;

                    // Sugar levels
                    const sugarLevels = [
                      { value: "0%", color: "#fff", label: "0%" },
                      { value: "25%", color: "#e0c199", label: "25%" },
                      { value: "50%", color: "#c68642", label: "50%" },
                      { value: "75%", color: "#8b5c2a", label: "75%" },
                      { value: "100%", color: "#4b2e05", label: "100%" }
                    ];

                    overlayContent.innerHTML = `
  <div class="espresso-overlay">
    <div class="espresso-content">
      <h2>${espresso.name}</h2>
      <img src="${espresso.image || ''}" alt="${espresso.name} Image">
      <div class="espresso-details-row">
        <div class="espresso-detail-col">
          <p class="type-radio">
            Type:
            <span id="type-radio-group-${uniqueId}" class="type-radio-group">
              ${
                Array.isArray(espresso.types) && espresso.types.length > 0
                  ? espresso.types.map((tp, idx) => `
                    <label style="margin-right:10px;">
                      <input type="radio" name="type-radio-${uniqueId}" value="${idx}" ${idx === 0 ? "checked" : ""}>
                      ${tp.type}
                    </label>
                  `).join('')
                  : `<label><input type="radio" name="type-radio-${uniqueId}" value="0" checked>Hot (12OZ)</label>
                     <label><input type="radio" name="type-radio-${uniqueId}" value="1">Cold (16OZ)</label>`
              }
            </span>
          </p>
          <p class="sugar-icon">
            Sugar:
            <span id="sugar-level-icons-${uniqueId}" class="sugar-level-icons" style="display:flex;gap:10px;">
              ${sugarLevels.map((s, idx) => `
                <span style="display:flex;flex-direction:column;align-items:center;">
                  <span class="sugar-icon" data-value="${s.value}" title="${s.label}" style="
                    display:inline-block;
                    width:28px;height:28px;
                    border-radius:50%;
                    background:${s.color};
                    border:1px solid #ccc;
                    margin-bottom:3px;
                    cursor:pointer;
                    vertical-align:middle;
                    box-shadow:0 1px 2px rgba(0,0,0,0.08);
                  " ${idx === 4 ? 'data-selected="true"' : ''}></span>
                  <span style="font-size:11px;color:#555;text-align:center;line-height:1.1;">${s.label}</span>
                </span>
              `).join('')}
            </span>
          </p>
        </div>
        <div class="espresso-detail-col">
          <p>
            Add Ons:
            <select id="addons-dropdown-${uniqueId}">
              <option value="">None</option>
              <option value="Extra Espresso Shot">Extra Espresso Shot P30</option>
              <option value="Flavored Syrup">Flavored Syrup P20</option>
            </select>
          </p>
          <p>
            Quantity:
            <button type="button" id="decrease-quantity-${uniqueId}" class="decrease-quantity">-</button>
            <input id="quantity-display-${uniqueId}" class="spanquantity" type="number" value="1" min="1" readonly>
            <button type="button" id="increase-quantity-${uniqueId}" class="increase-quantity">+</button>
          </p>
        </div>
      </div>
      <p style="text-align:center;">
        Price: <span class="espresso-price" id="espresso-price-${uniqueId}">P${basePrice.toFixed(2)}</span>
      </p>
      <div class="overlay-add-button">
        <button type="submit" id="overlay-add-to-cart-btn">Add to Cart</button>
      </div>
    </div>
  </div>
`;

                    // Show overlay with animation
                    overlay.classList.remove('hide');
                    overlay.classList.add('show');
                    overlay.style.display = 'block';

                    // --- Type radio logic ---
                    const typeRadios = overlayContent.querySelectorAll(`input[name="type-radio-${uniqueId}"]`);
                    // --- Sugar icon logic ---
                    const sugarIcons = overlayContent.querySelectorAll(`#sugar-level-icons-${uniqueId} .sugar-icon`);
                    let selectedSugar = "100%";
                    sugarIcons.forEach((icon, idx) => {
                      if (icon.getAttribute('data-selected') === "true") {
                        icon.style.outline = "3px solid #f4ac12ff";
                        selectedSugar = icon.getAttribute('data-value');
                      }
                      icon.onclick = function() {
                        sugarIcons.forEach(i => { i.style.outline = "none"; i.removeAttribute('data-selected'); });
                        icon.style.outline = "3px solid #f4ac12ff";
                        icon.setAttribute('data-selected', 'true');
                        selectedSugar = icon.getAttribute('data-value');
                      };
                    });

                    // Addons dropdown logic
                    const addonsSelect = document.getElementById(`addons-dropdown-${uniqueId}`);
                    // Quantity controls and price update
                    const overlayQty = document.getElementById(`quantity-display-${uniqueId}`);
                    const overlayDecrease = document.getElementById(`decrease-quantity-${uniqueId}`);
                    const overlayIncrease = document.getElementById(`increase-quantity-${uniqueId}`);
                    const overlayPrice = document.getElementById(`espresso-price-${uniqueId}`);

                    function getAddonPrice(addon) {
                      switch (addon) {
                        case "Extra Espresso Shot": return 30;
                        case "Flavored Syrup": return 20;
                        default: return 0;
                      }
                    }

                    function updateOverlayPrice() {
                        let idx = 0;
                        typeRadios.forEach((r, i) => { if (r.checked) idx = i; });
                        let base = Array.isArray(espresso.types) && espresso.types.length > 0
                            ? parseFloat(espresso.types[idx].price) || 0
                            : 0;
                        let qty = parseInt(overlayQty.value) || 1;
                        let addonPrice = addonsSelect ? getAddonPrice(addonsSelect.value) : 0;
                        overlayPrice.textContent = `P${((base + addonPrice) * qty).toFixed(2)}`;
                    }

                    overlayDecrease.onclick = function() {
                        let qty = parseInt(overlayQty.value);
                        if (qty > 1) {
                            overlayQty.value = qty - 1;
                            updateOverlayPrice();
                        }
                    };
                    overlayIncrease.onclick = function() {
                        let qty = parseInt(overlayQty.value);
                        overlayQty.value = qty + 1;
                        updateOverlayPrice();
                    };
                    typeRadios.forEach(r => r.onchange = updateOverlayPrice);
                    overlayQty.onchange = updateOverlayPrice;
                    if (addonsSelect) addonsSelect.onchange = updateOverlayPrice;

                    // Initial price update
                    updateOverlayPrice();

                    // Close overlay logic
                    function closeOverlay() {
                        overlay.classList.remove('show');
                        overlay.classList.add('hide');
                        setTimeout(() => {
                            overlay.style.display = 'none';
                            overlay.classList.remove('hide');
                        }, 400);
                    }
                    overlayX.onclick = closeOverlay;

                    // Add to cart button logic
                    const overlayAddToCartBtn = document.getElementById('overlay-add-to-cart-btn');
                    overlayAddToCartBtn.onclick = function () {
                        const userUid = localStorage.getItem('userUid');
                        if (!userUid) {
                            alert("You must be logged in to add to cart.");
                            return;
                        }

                        // Get selected values
                        let selectedTypeIdx = 0;
                        typeRadios.forEach((r, i) => { if (r.checked) selectedTypeIdx = i; });
                        const selectedType = (Array.isArray(espresso.types) && espresso.types.length > 0)
                            ? espresso.types[selectedTypeIdx].type
                            : "Hot (12oz)";
                        const selectedAddon = addonsSelect ? addonsSelect.value : "";
                        const quantity = overlayQty ? parseInt(overlayQty.value) : 1;
                        let base = Array.isArray(espresso.types) && espresso.types.length > 0
                            ? parseFloat(espresso.types[selectedTypeIdx].price) || 0
                            : 0;
                        let addonPrice = getAddonPrice(selectedAddon);
                        const price = `P${(base + addonPrice) * quantity}`;

                        // Prepare order data
                        const orderData = {
                            item: espresso.name,
                            type: selectedType,
                            sugar: selectedSugar,
                            addon: selectedAddon,
                            quantity: quantity,
                            price: price
                        };

                        // Store in database
                        const orderRef = ref(database, `users/${userUid}/ordercart`);
                        push(orderRef, orderData)
                            .then(() => {
                                // Show a success message
                                let successDiv = document.getElementById('success');
                                if (!successDiv) {
                                    successDiv = document.createElement('div');
                                    successDiv.id = 'success';
                                    successDiv.style.display = 'none';
                                    document.body.appendChild(successDiv);
                                }
                                successDiv.textContent = "Item added to cart successfully!";
                                successDiv.style.display = 'block';
                                const cartIcon = document.querySelector('#cart i');
if (cartIcon) {
    cartIcon.classList.add('cart-grow-animate');
    setTimeout(() => {
        cartIcon.classList.remove('cart-grow-animate');
    }, 1000);
}
                                setTimeout(() => {
                                    successDiv.style.display = 'none';
                                }, 3000);

                                // Close overlay
                                overlay.classList.remove('show');
                                overlay.classList.add('hide');
                                setTimeout(() => {
                                    overlay.style.display = 'none';
                                    overlay.classList.remove('hide');
                                }, 400);
                            })
                            .catch((error) => {
                                alert("Error adding item to cart: " + error.message);
                            });
                    };
                });
            }
        });
    });
}

displayEspressoItems();
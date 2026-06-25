import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getDatabase, ref, onValue, push } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

// Firebase configuration (reuse your config)
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

// helper: session id for onsite cart (persists per browser)
function getOnsiteSessionId() {
  let sid = localStorage.getItem('onsiteSessionId');
  if (!sid) {
    sid = 's_' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem('onsiteSessionId', sid);
  }
  return sid;
}
const ONSITE_CART_REF = ref(database, 'onsitecart');

// helper: show success bubble (keeps existing style)
function showSuccessMessage(text, duration = 2500) {
  let successDiv = document.getElementById('success');
  if (!successDiv) {
    successDiv = document.createElement('div');
    successDiv.id = 'success';
    // minimal inline style - your CSS might already style #success
    successDiv.style.position = 'fixed';
    successDiv.style.top = '16px';
    successDiv.style.right = '16px';
    successDiv.style.zIndex = '9999';
    successDiv.style.padding = '10px 14px';
    successDiv.style.borderRadius = '8px';
    successDiv.style.background = '#28a745';
    successDiv.style.color = '#fff';
    successDiv.style.boxShadow = '0 6px 18px rgba(0,0,0,0.12)';
    successDiv.style.display = 'none';
    document.body.appendChild(successDiv);
  }
  successDiv.textContent = text;
  successDiv.style.display = 'block';
  setTimeout(() => { successDiv.style.display = 'none'; }, duration);
}

// helper: animate cart icon if present
function animateCartIcon() {
  const cartIcon = document.querySelector('#cart i');
  if (cartIcon) {
    cartIcon.classList.add('cart-grow-animate');
    setTimeout(() => cartIcon.classList.remove('cart-grow-animate'), 1000);
  }
}

// generic push to onsitecart (adds session and timestamp)
function pushToOnsiteCart(orderData) {
  const payload = {
    ...orderData,
    sessionId: getOnsiteSessionId(),
    addedAt: Date.now()
  };
  return push(ONSITE_CART_REF, payload);
}

/* -------------------------
   Renderers for categories
   ------------------------- */

/* 1) Milktea */
function displayMilkteaItems() {
  const milkteaRef = ref(database, 'milktea');
  const milkteaPart = document.querySelector('.milktea-part');
  if (!milkteaPart) return;

  milkteaPart.innerHTML = '<h1 class="milktea-title">Milk Tea</h1><div class="milktea-grid"></div>';
  const milkteaGrid = milkteaPart.querySelector('.milktea-grid');

  onValue(milkteaRef, (snapshot) => {
    milkteaGrid.innerHTML = '';
    snapshot.forEach(childSnapshot => {
      const milktea = childSnapshot.val();
      const uniqueId = 'milktea-section' + childSnapshot.key;
      const isDisabled = milktea.disabled === true;

      const milkteaSection = document.createElement('div');
      milkteaSection.className = 'milktea-section';
      milkteaSection.id = uniqueId;
      milkteaSection.innerHTML = `
        <h2>${milktea.name}</h2>
        <div class="milktea-item">
          <img src="${milktea.image || ''}" alt="${milktea.name} Image">
          <div class="milktea-text">
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
      milkteaGrid.appendChild(milkteaSection);

      if (!isDisabled) {
        const addToCartButton = milkteaSection.querySelector(`#add-to-cart-${uniqueId}`);
        addToCartButton.addEventListener('click', function () {
          const overlay = document.getElementById('cart-overlay');
          const overlayContent = document.getElementById('cart-overlay-content');
          const overlayX = document.getElementById('cart-overlay-x');

          let basePrice = Array.isArray(milktea.sizes) && milktea.sizes.length > 0
            ? parseFloat(milktea.sizes[0].price) || 0
            : parseFloat(milktea.price) || 0;

          const sugarLevels = [
            { value: "0%", color: "#fff", label: "0%" },
            { value: "25%", color: "#e0c199", label: "25%" },
            { value: "50%", color: "#c68642", label: "50%" },
            { value: "75%", color: "#8b5c2a", label: "75%" },
            { value: "100%", color: "#4b2e05", label: "100%" }
          ];
          const addonsList = [
            { value: "", label: "None", price: 0 },
            { value: "Nata", label: "Nata P20", price: 20 },
            { value: "Boba Pearl", label: "Boba Pearl P15", price: 15 },
            { value: "White Pearl", label: "White Pearl P10", price: 10 },
            { value: "Yakult", label: "Yakult P20", price: 20 },
            { value: "Chia Seeds", label: "Chia Seeds P10", price: 10 },
            { value: "Popping Boba", label: "Popping Boba P20", price: 20 }
          ];

          overlayContent.innerHTML = `
            <div class="milktea-overlay">
              <div class="milktea-content">
                <h2>${milktea.name}</h2>
                <img src="${milktea.image || ''}" alt="${milktea.name} Image">
                <div class="milktea-details-row">
                  <div class="milktea-detail-col">
                    <p class="size-radio">
                      Size:
                      <span id="size-radio-group-${uniqueId}" class="size-radio-group">
                        ${
                          Array.isArray(milktea.sizes) && milktea.sizes.length > 0
                            ? milktea.sizes.map((sz, idx) => `<label style="margin-right:10px;"><input type="radio" name="size-radio-${uniqueId}" value="${idx}" ${idx === 0 ? "checked" : ""}>${sz.size}</label>`).join('')
                            : `<label><input type="radio" name="size-radio-${uniqueId}" value="0" checked>Regular</label>`
                        }
                      </span>
                    </p>
                    <p class="sugar-icon">
                      Sugar:
                      <span id="sugar-level-icons-${uniqueId}" class="sugar-level-icons" style="display:flex;gap:10px;">
                        ${sugarLevels.map((s, idx) => `<span style="display:flex;flex-direction:column;align-items:center;"><span class="sugar-icon" data-value="${s.value}" title="${s.label}" style="display:inline-block;width:28px;height:28px;border-radius:50%;background:${s.color};border:1px solid #ccc;margin-bottom:3px;cursor:pointer;vertical-align:middle;box-shadow:0 1px 2px rgba(0,0,0,0.08);" ${idx === 4 ? 'data-selected="true"' : ''}></span><span style="font-size:11px;color:#555;text-align:center;line-height:1.1;">${s.label}</span></span>`).join('')}
                      </span>
                    </p>
                  </div>
                  <div class="milktea-detail-col">
                    <p>
                      Add Ons:
                      <select id="addons-dropdown-${uniqueId}">
                        ${addonsList.map(a => `<option value="${a.value}">${a.label}</option>`).join('')}
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
                <p style="text-align:center;">Price: <span class="milktea-price" id="milktea-price-${uniqueId}">P${basePrice}</span></p>
                <div class="overlay-add-button"><button type="submit" id="overlay-add-to-cart-btn">Add to Cart</button></div>
              </div>
            </div>
          `;

          overlay.classList.remove('hide'); overlay.classList.add('show'); overlay.style.display = 'block';

          const sizeRadios = overlayContent.querySelectorAll(`input[name="size-radio-${uniqueId}"]`);
          const sugarIcons = overlayContent.querySelectorAll(`#sugar-level-icons-${uniqueId} .sugar-icon`);
          let selectedSugar = "100%";
          sugarIcons.forEach((icon, idx) => {
            if (icon.getAttribute('data-selected') === "true") {
              icon.style.outline = "3px solid #f4ac12ff"; selectedSugar = icon.getAttribute('data-value');
            }
            icon.onclick = function() {
              sugarIcons.forEach(i => { i.style.outline = "none"; i.removeAttribute('data-selected'); });
              icon.style.outline = "3px solid #f4ac12ff"; icon.setAttribute('data-selected', 'true'); selectedSugar = icon.getAttribute('data-value');
            };
          });

          const addonsSelect = document.getElementById(`addons-dropdown-${uniqueId}`);
          function getAddonPrice(addon) { const found = addonsList.find(a => a.value === addon); return found ? found.price : 0; }
          let selectedAddon = ""; let selectedAddonPrice = 0;

          const overlayQty = document.getElementById(`quantity-display-${uniqueId}`);
          const overlayDecrease = document.getElementById(`decrease-quantity-${uniqueId}`);
          const overlayIncrease = document.getElementById(`increase-quantity-${uniqueId}`);
          const overlayPrice = document.getElementById(`milktea-price-${uniqueId}`);

          function updateOverlayPrice() {
            let idx = 0; sizeRadios.forEach((r, i) => { if (r.checked) idx = i; });
            let base = Array.isArray(milktea.sizes) && milktea.sizes.length > 0 ? parseFloat(milktea.sizes[idx].price) || 0 : parseFloat(milktea.price) || 0;
            let qty = parseInt(overlayQty.value) || 1;
            selectedAddon = addonsSelect ? addonsSelect.value : "";
            selectedAddonPrice = getAddonPrice(selectedAddon);
            overlayPrice.textContent = `P${(base + selectedAddonPrice) * qty}`;
          }

          overlayDecrease.onclick = function() { let qty = parseInt(overlayQty.value); if (qty > 1) { overlayQty.value = qty - 1; updateOverlayPrice(); } };
          overlayIncrease.onclick = function() { let qty = parseInt(overlayQty.value); overlayQty.value = qty + 1; updateOverlayPrice(); };
          sizeRadios.forEach(r => r.onchange = updateOverlayPrice);
          overlayQty.onchange = updateOverlayPrice;
          if (addonsSelect) addonsSelect.onchange = updateOverlayPrice;
          updateOverlayPrice();

          function closeOverlay() { overlay.classList.remove('show'); overlay.classList.add('hide'); setTimeout(() => { overlay.style.display = 'none'; overlay.classList.remove('hide'); }, 400); }
          overlayX.onclick = closeOverlay;

          const overlayAddToCartBtn = document.getElementById('overlay-add-to-cart-btn');
          overlayAddToCartBtn.onclick = function () {
            let selectedSizeIdx = 0; sizeRadios.forEach((r, i) => { if (r.checked) selectedSizeIdx = i; });
            const selectedSize = (Array.isArray(milktea.sizes) && milktea.sizes.length > 0) ? milktea.sizes[selectedSizeIdx].size : "Regular";
            const quantity = overlayQty ? parseInt(overlayQty.value) : 1;
            let base = Array.isArray(milktea.sizes) && milktea.sizes.length > 0 ? parseFloat(milktea.sizes[selectedSizeIdx].price) || 0 : parseFloat(milktea.price) || 0;
            const price = `P${(base + selectedAddonPrice) * quantity}`;

            const orderData = {
              item: milktea.name,
              size: selectedSize,
              sugar: selectedSugar,
              addon: selectedAddon,
              quantity: quantity,
              price: price,
              category: 'milktea'
            };

            pushToOnsiteCart(orderData)
              .then(() => {
                showSuccessMessage("Item added to cart!");
                animateCartIcon();
                closeOverlay();
              })
              .catch(err => { alert("Error adding item to cart: " + (err.message || err)); });
          };
        });
      }
    });
  });
}

/* 2) Bestsellers */
function displayBestsellerItems() {
  const bestsellerRef = ref(database, 'bestseller');
  const bestsellerPart = document.querySelector('.bestseller-part');
  if (!bestsellerPart) return;

  bestsellerPart.innerHTML = '<h1 class="bestseller-title">Best Sellers</h1><div class="bestseller-grid"></div>';
  const bestsellerGrid = bestsellerPart.querySelector('.bestseller-grid');

  onValue(bestsellerRef, (snapshot) => {
    bestsellerGrid.innerHTML = '';
    snapshot.forEach(childSnapshot => {
      const bestseller = childSnapshot.val();
      const uniqueId = 'bestseller-section' + childSnapshot.key;
      const isDisabled = bestseller.disabled === true;

      const bestsellerSection = document.createElement('div');
      bestsellerSection.className = 'bestseller-section';
      bestsellerSection.id = uniqueId;
      bestsellerSection.innerHTML = `
        <h2>${bestseller.name}</h2>
        <div class="bestseller-item">
          <img src="${bestseller.image || ''}" alt="${bestseller.name} Image">
          <div class="bestseller-text">
            ${ isDisabled ? `<button class="add-to-cart" disabled style="background:#ccc;cursor:not-allowed;">Unavailable</button>` :
              `<button id="add-to-cart-${uniqueId}" class="add-to-cart" title="Add to Cart"><i class="fas fa-cart-plus"></i></button>` }
          </div>
        </div>
      `;
      bestsellerGrid.appendChild(bestsellerSection);

      if (!isDisabled) {
        const addToCartButton = bestsellerSection.querySelector(`#add-to-cart-${uniqueId}`);
        addToCartButton.addEventListener('click', function () {
          const overlay = document.getElementById('cart-overlay');
          const overlayContent = document.getElementById('cart-overlay-content');
          const overlayX = document.getElementById('cart-overlay-x');

          let basePrice = parseFloat(bestseller.price) || 0;

          overlayContent.innerHTML = `
            <div class="bestseller-overlay">
              <div class="bestseller-content">
                <h2>${bestseller.name}</h2>
                <img src="${bestseller.image || ''}" alt="${bestseller.name} Image">
                <p>Quantity:
                  <button type="button" id="decrease-quantity-${uniqueId}" class="decrease-quantity">-</button>
                  <input id="quantity-display-${uniqueId}" class="spanquantity" type="number" value="1" min="1" readonly>
                  <button type="button" id="increase-quantity-${uniqueId}" class="increase-quantity">+</button>
                </p>
                <p class="bestseller-price-container">Price: <span class="bestseller-price" id="bestseller-price-${uniqueId}">P${basePrice}</span></p>
                <div class="overlay-add-button"><button type="submit" id="overlay-add-to-cart-btn">Add to Cart</button></div>
              </div>
            </div>
          `;
          overlay.classList.remove('hide'); overlay.classList.add('show'); overlay.style.display = 'block';

          const overlayQty = document.getElementById(`quantity-display-${uniqueId}`);
          const overlayDecrease = document.getElementById(`decrease-quantity-${uniqueId}`);
          const overlayIncrease = document.getElementById(`increase-quantity-${uniqueId}`);
          const overlayPrice = document.getElementById(`bestseller-price-${uniqueId}`);

          function updateOverlayPrice() { let qty = parseInt(overlayQty.value) || 1; overlayPrice.textContent = `P${basePrice * qty}`; }
          overlayDecrease.onclick = function() { let qty = parseInt(overlayQty.value); if (qty > 1) { overlayQty.value = qty - 1; updateOverlayPrice(); } };
          overlayIncrease.onclick = function() { let qty = parseInt(overlayQty.value); overlayQty.value = qty + 1; updateOverlayPrice(); };
          overlayQty.onchange = updateOverlayPrice; updateOverlayPrice();

          function closeOverlay() { overlay.classList.remove('show'); overlay.classList.add('hide'); setTimeout(() => { overlay.style.display = 'none'; overlay.classList.remove('hide'); }, 400); }
          overlayX.onclick = closeOverlay;

          const overlayAddToCartBtn = document.getElementById('overlay-add-to-cart-btn');
          overlayAddToCartBtn.onclick = function () {
            const quantity = overlayQty ? parseInt(overlayQty.value) : 1;
            const price = `P${basePrice * quantity}`;
            const orderData = { item: bestseller.name, quantity, price, category: 'bestseller' };
            pushToOnsiteCart(orderData).then(() => { showSuccessMessage("Item added to cart!"); animateCartIcon(); closeOverlay(); })
              .catch(err => alert("Error adding item to cart: " + (err.message || err)));
          };
        });
      }
    });
  });
}

/* 3) Extras */
function displayExtrasItems() {
  const extrasRef = ref(database, 'extras');
  const extrasPart = document.querySelector('.extras-part');
  if (!extrasPart) return;

  extrasPart.innerHTML = '<h1 class="extras-title">Extras</h1><div class="extras-grid"></div>';
  const extrasGrid = extrasPart.querySelector('.extras-grid');

  onValue(extrasRef, (snapshot) => {
    extrasGrid.innerHTML = '';
    snapshot.forEach(childSnapshot => {
      const extras = childSnapshot.val();
      const uniqueId = 'extras-section' + childSnapshot.key;
      const isDisabled = extras.disabled === true;

      const extrasSection = document.createElement('div');
      extrasSection.className = 'extras-section';
      extrasSection.id = uniqueId;
      extrasSection.innerHTML = `
        <h2>${extras.name}</h2>
        <div class="extras-item">
          <img src="${extras.image || ''}" alt="${extras.name} Image">
          <div class="extras-text">
            ${ isDisabled ? `<button class="add-to-cart" disabled style="background:#ccc;cursor:not-allowed;">Unavailable</button>` :
              `<button id="add-to-cart-${uniqueId}" class="add-to-cart" title="Add to Cart"><i class="fas fa-cart-plus"></i></button>` }
          </div>
        </div>
      `;
      extrasGrid.appendChild(extrasSection);

      if (!isDisabled) {
        const addToCartButton = extrasSection.querySelector(`#add-to-cart-${uniqueId}`);
        addToCartButton.addEventListener('click', function () {
          const overlay = document.getElementById('cart-overlay');
          const overlayContent = document.getElementById('cart-overlay-content');
          const overlayX = document.getElementById('cart-overlay-x');

          let basePrice = parseFloat(extras.price) || 0;

          overlayContent.innerHTML = `
            <div class="extras-overlay">
              <div class="extras-content">
                <h2>${extras.name}</h2>
                <img src="${extras.image || ''}" alt="${extras.name} Image">
                <p>Quantity:
                  <button type="button" id="decrease-quantity-${uniqueId}" class="decrease-quantity">-</button>
                  <input id="quantity-display-${uniqueId}" class="spanquantity" type="number" value="1" min="1" readonly>
                  <button type="button" id="increase-quantity-${uniqueId}" class="increase-quantity">+</button>
                </p>
                <p class="extras-price-container">Price: <span class="extras-price" id="extras-price-${uniqueId}">P${basePrice}</span></p>
                <div class="overlay-add-button"><button type="submit" id="overlay-add-to-cart-btn">Add to Cart</button></div>
              </div>
            </div>
          `;
          overlay.classList.remove('hide'); overlay.classList.add('show'); overlay.style.display = 'block';

          const overlayQty = document.getElementById(`quantity-display-${uniqueId}`);
          const overlayDecrease = document.getElementById(`decrease-quantity-${uniqueId}`);
          const overlayIncrease = document.getElementById(`increase-quantity-${uniqueId}`);
          const overlayPrice = document.getElementById(`extras-price-${uniqueId}`);

          function updateOverlayPrice() { let qty = parseInt(overlayQty.value) || 1; overlayPrice.textContent = `P${basePrice * qty}`; }
          overlayDecrease.onclick = function() { let qty = parseInt(overlayQty.value); if (qty > 1) { overlayQty.value = qty - 1; updateOverlayPrice(); } };
          overlayIncrease.onclick = function() { let qty = parseInt(overlayQty.value); overlayQty.value = qty + 1; updateOverlayPrice(); };
          overlayQty.onchange = updateOverlayPrice; updateOverlayPrice();

          function closeOverlay() { overlay.classList.remove('show'); overlay.classList.add('hide'); setTimeout(() => { overlay.style.display = 'none'; overlay.classList.remove('hide'); }, 400); }
          overlayX.onclick = closeOverlay;

          const overlayAddToCartBtn = document.getElementById('overlay-add-to-cart-btn');
          overlayAddToCartBtn.onclick = function () {
            const quantity = overlayQty ? parseInt(overlayQty.value) : 1;
            const price = `P${basePrice * quantity}`;
            const orderData = { item: extras.name, quantity, price, category: 'extras' };
            pushToOnsiteCart(orderData).then(() => { showSuccessMessage("Item added to cart!"); animateCartIcon(); closeOverlay(); })
              .catch(err => alert("Error adding item to cart: " + (err.message || err)));
          };
        });
      }
    });
  });
}

/* 4) Fries */
function displayFriesItems() {
  const friesRef = ref(database, 'fries');
  const friesPart = document.querySelector('.fries-part');
  if (!friesPart) return;

  friesPart.innerHTML = '<h1 class="fries-title">Fries</h1><div class="fries-grid"></div>';
  const friesGrid = friesPart.querySelector('.fries-grid');

  onValue(friesRef, (snapshot) => {
    friesGrid.innerHTML = '';
    snapshot.forEach(childSnapshot => {
      const fries = childSnapshot.val();
      const uniqueId = 'fries-section' + childSnapshot.key;
      const isDisabled = fries.disabled === true;

      const friesSection = document.createElement('div');
      friesSection.className = 'fries-section';
      friesSection.id = uniqueId;
      friesSection.innerHTML = `
        <h2>${fries.name}</h2>
        <div class="fries-item">
          <img src="${fries.image || ''}" alt="${fries.name} Image">
          <div class="fries-text">
            ${ isDisabled ? `<button class="add-to-cart" disabled style="background:#ccc;cursor:not-allowed;">Unavailable</button>` :
              `<button id="add-to-cart-${uniqueId}" class="add-to-cart" title="Add to Cart"><i class="fas fa-cart-plus"></i></button>` }
          </div>
        </div>
      `;
      friesGrid.appendChild(friesSection);

      if (!isDisabled) {
        const addToCartButton = friesSection.querySelector(`#add-to-cart-${uniqueId}`);
        addToCartButton.addEventListener('click', function () {
          const overlay = document.getElementById('cart-overlay');
          const overlayContent = document.getElementById('cart-overlay-content');
          const overlayX = document.getElementById('cart-overlay-x');

          let basePrice = parseFloat(fries.price) || 0;

          overlayContent.innerHTML = `
            <div class="fries-overlay">
              <div class="fries-content">
                <h2>${fries.name}</h2>
                <img src="${fries.image || ''}" alt="${fries.name} Image">
                <p>Quantity:
                  <button type="button" id="decrease-quantity-${uniqueId}" class="decrease-quantity">-</button>
                  <input id="quantity-display-${uniqueId}" class="spanquantity" type="number" value="1" min="1" readonly>
                  <button type="button" id="increase-quantity-${uniqueId}" class="increase-quantity">+</button>
                </p>
                <p class="fries-price-container">Price: <span class="fries-price" id="fries-price-${uniqueId}">P${basePrice}</span></p>
                <div class="overlay-add-button"><button type="submit" id="overlay-add-to-cart-btn">Add to Cart</button></div>
              </div>
            </div>
          `;
          overlay.classList.remove('hide'); overlay.classList.add('show'); overlay.style.display = 'block';

          const overlayQty = document.getElementById(`quantity-display-${uniqueId}`);
          const overlayDecrease = document.getElementById(`decrease-quantity-${uniqueId}`);
          const overlayIncrease = document.getElementById(`increase-quantity-${uniqueId}`);
          const overlayPrice = document.getElementById(`fries-price-${uniqueId}`);

          function updateOverlayPrice() { let qty = parseInt(overlayQty.value) || 1; overlayPrice.textContent = `P${basePrice * qty}`; }
          overlayDecrease.onclick = function() { let qty = parseInt(overlayQty.value); if (qty > 1) { overlayQty.value = qty - 1; updateOverlayPrice(); } };
          overlayIncrease.onclick = function() { let qty = parseInt(overlayQty.value); overlayQty.value = qty + 1; updateOverlayPrice(); };
          overlayQty.onchange = updateOverlayPrice; updateOverlayPrice();

          function closeOverlay() { overlay.classList.remove('show'); overlay.classList.add('hide'); setTimeout(() => { overlay.style.display = 'none'; overlay.classList.remove('hide'); }, 400); }
          overlayX.onclick = closeOverlay;

          const overlayAddToCartBtn = document.getElementById('overlay-add-to-cart-btn');
          overlayAddToCartBtn.onclick = function () {
            const quantity = overlayQty ? parseInt(overlayQty.value) : 1;
            const price = `P${basePrice * quantity}`;
            const orderData = { item: fries.name, quantity, price, category: 'fries' };
            pushToOnsiteCart(orderData).then(() => { showSuccessMessage("Item added to cart!"); animateCartIcon(); closeOverlay(); }).catch(err => alert("Error adding item to cart: " + (err.message || err)));
          };
        });
      }
    });
  });
}

/* 5) Noodle & Pasta */
function displayNoodlePastaItems() {
  const noodlepastaRef = ref(database, 'noodlepasta');
  const noodlepastaPart = document.querySelector('.noodlepasta-part');
  if (!noodlepastaPart) return;

  noodlepastaPart.innerHTML = '<h1 class="noodlepasta-title">Noodles & Pasta</h1><div class="noodlepasta-grid"></div>';
  const noodlepastaGrid = noodlepastaPart.querySelector('.noodlepasta-grid');

  onValue(noodlepastaRef, (snapshot) => {
    noodlepastaGrid.innerHTML = '';
    snapshot.forEach(childSnapshot => {
      const noodlepasta = childSnapshot.val();
      const uniqueId = 'noodlepasta-section' + childSnapshot.key;
      const isDisabled = noodlepasta.disabled === true;

      const noodlepastaSection = document.createElement('div');
      noodlepastaSection.className = 'noodlepasta-section';
      noodlepastaSection.id = uniqueId;
      noodlepastaSection.innerHTML = `
        <h2>${noodlepasta.name}</h2>
        <div class="noodlepasta-item">
          <img src="${noodlepasta.image || ''}" alt="${noodlepasta.name} Image">
          <div class="noodlepasta-text">
            ${ isDisabled ? `<button class="add-to-cart" disabled style="background:#ccc;cursor:not-allowed;">Unavailable</button>` :
              `<button id="add-to-cart-${uniqueId}" class="add-to-cart" title="Add to Cart"><i class="fas fa-cart-plus"></i></button>` }
          </div>
        </div>
      `;
      noodlepastaGrid.appendChild(noodlepastaSection);

      if (!isDisabled) {
        const addToCartButton = noodlepastaSection.querySelector(`#add-to-cart-${uniqueId}`);
        addToCartButton.addEventListener('click', function () {
          const overlay = document.getElementById('cart-overlay');
          const overlayContent = document.getElementById('cart-overlay-content');
          const overlayX = document.getElementById('cart-overlay-x');

          let basePrice = parseFloat(noodlepasta.price) || 0;

          overlayContent.innerHTML = `
            <div class="noodlepasta-overlay">
              <div class="noodlepasta-content">
                <h2>${noodlepasta.name}</h2>
                <img src="${noodlepasta.image || ''}" alt="${noodlepasta.name} Image">
                <p>Quantity:
                  <button type="button" id="decrease-quantity-${uniqueId}" class="decrease-quantity">-</button>
                  <input id="quantity-display-${uniqueId}" class="spanquantity" type="number" value="1" min="1" readonly>
                  <button type="button" id="increase-quantity-${uniqueId}" class="increase-quantity">+</button>
                </p>
                <p class="noodlepasta-price-container">Price: <span class="noodlepasta-price" id="noodlepasta-price-${uniqueId}">P${basePrice}</span></p>
                <div class="overlay-add-button"><button type="submit" id="overlay-add-to-cart-btn">Add to Cart</button></div>
              </div>
            </div>
          `;
          overlay.classList.remove('hide'); overlay.classList.add('show'); overlay.style.display = 'block';

          const overlayQty = document.getElementById(`quantity-display-${uniqueId}`);
          const overlayDecrease = document.getElementById(`decrease-quantity-${uniqueId}`);
          const overlayIncrease = document.getElementById(`increase-quantity-${uniqueId}`);
          const overlayPrice = document.getElementById(`noodlepasta-price-${uniqueId}`);

          function updateOverlayPrice() { let qty = parseInt(overlayQty.value) || 1; overlayPrice.textContent = `P${basePrice * qty}`; }
          overlayDecrease.onclick = function() { let qty = parseInt(overlayQty.value); if (qty > 1) { overlayQty.value = qty - 1; updateOverlayPrice(); } };
          overlayIncrease.onclick = function() { let qty = parseInt(overlayQty.value); overlayQty.value = qty + 1; updateOverlayPrice(); };
          overlayQty.onchange = updateOverlayPrice; updateOverlayPrice();

          function closeOverlay() { overlay.classList.remove('show'); overlay.classList.add('hide'); setTimeout(() => { overlay.style.display = 'none'; overlay.classList.remove('hide'); }, 400); }
          overlayX.onclick = closeOverlay;

          const overlayAddToCartBtn = document.getElementById('overlay-add-to-cart-btn');
          overlayAddToCartBtn.onclick = function () {
            const quantity = overlayQty ? parseInt(overlayQty.value) : 1;
            const price = `P${basePrice * quantity}`;
            const orderData = { item: noodlepasta.name, quantity, price, category: 'noodlepasta' };
            pushToOnsiteCart(orderData).then(() => { showSuccessMessage("Item added to cart!"); animateCartIcon(); closeOverlay(); }).catch(err => alert("Error adding item to cart: " + (err.message || err)));
          };
        });
      }
    });
  });
}

/* 6) Rice Meals */
function displayRiceMealItems() {
  const ricemealRef = ref(database, 'ricemeal');
  const ricemealPart = document.querySelector('.ricemeal-part');
  if (!ricemealPart) return;

  ricemealPart.innerHTML = '<h1 class="ricemeal-title">Rice Meals</h1><div class="ricemeal-grid"></div>';
  const ricemealGrid = ricemealPart.querySelector('.ricemeal-grid');

  onValue(ricemealRef, (snapshot) => {
    ricemealGrid.innerHTML = '';
    snapshot.forEach(childSnapshot => {
      const ricemeal = childSnapshot.val();
      const uniqueId = 'ricemeal-section' + childSnapshot.key;
      const isDisabled = ricemeal.disabled === true;

      const ricemealSection = document.createElement('div');
      ricemealSection.className = 'ricemeal-section';
      ricemealSection.id = uniqueId;
      ricemealSection.innerHTML = `
        <h2>${ricemeal.name}</h2>
        <div class="ricemeal-item">
          <img src="${ricemeal.image || ''}" alt="${ricemeal.name} Image">
          <div class="ricemeal-text">
            ${ isDisabled ? `<button class="add-to-cart" disabled style="background:#ccc;cursor:not-allowed;">Unavailable</button>` :
              `<button id="add-to-cart-${uniqueId}" class="add-to-cart" title="Add to Cart"><i class="fas fa-cart-plus"></i></button>` }
          </div>
        </div>
      `;
      ricemealGrid.appendChild(ricemealSection);

      if (!isDisabled) {
        const addToCartButton = ricemealSection.querySelector(`#add-to-cart-${uniqueId}`);
        addToCartButton.addEventListener('click', function () {
          const overlay = document.getElementById('cart-overlay');
          const overlayContent = document.getElementById('cart-overlay-content');
          const overlayX = document.getElementById('cart-overlay-x');

          let basePrice = parseFloat(ricemeal.price) || 0;

          overlayContent.innerHTML = `
            <div class="ricemeal-overlay">
              <div class="ricemeal-content">
                <h2>${ricemeal.name}</h2>
                <img src="${ricemeal.image || ''}" alt="${ricemeal.name} Image">
                <p>Quantity:
                  <button type="button" id="decrease-quantity-${uniqueId}" class="decrease-quantity">-</button>
                  <input id="quantity-display-${uniqueId}" class="spanquantity" type="number" value="1" min="1" readonly>
                  <button type="button" id="increase-quantity-${uniqueId}" class="increase-quantity">+</button>
                </p>
                <p class="ricemeal-price-container">Price: <span class="ricemeal-price" id="ricemeal-price-${uniqueId}">P${basePrice}</span></p>
                <div class="overlay-add-button"><button type="submit" id="overlay-add-to-cart-btn">Add to Cart</button></div>
              </div>
            </div>
          `;
          overlay.classList.remove('hide'); overlay.classList.add('show'); overlay.style.display = 'block';

          const overlayQty = document.getElementById(`quantity-display-${uniqueId}`);
          const overlayDecrease = document.getElementById(`decrease-quantity-${uniqueId}`);
          const overlayIncrease = document.getElementById(`increase-quantity-${uniqueId}`);
          const overlayPrice = document.getElementById(`ricemeal-price-${uniqueId}`);

          function updateOverlayPrice() { let qty = parseInt(overlayQty.value) || 1; overlayPrice.textContent = `P${basePrice * qty}`; }
          overlayDecrease.onclick = function() { let qty = parseInt(overlayQty.value); if (qty > 1) { overlayQty.value = qty - 1; updateOverlayPrice(); } };
          overlayIncrease.onclick = function() { let qty = parseInt(overlayQty.value); overlayQty.value = qty + 1; updateOverlayPrice(); };
          overlayQty.onchange = updateOverlayPrice; updateOverlayPrice();

          function closeOverlay() { overlay.classList.remove('show'); overlay.classList.add('hide'); setTimeout(() => { overlay.style.display = 'none'; overlay.classList.remove('hide'); }, 400); }
          overlayX.onclick = closeOverlay;

          const overlayAddToCartBtn = document.getElementById('overlay-add-to-cart-btn');
          overlayAddToCartBtn.onclick = function () {
            const quantity = overlayQty ? parseInt(overlayQty.value) : 1;
            const price = `P${basePrice * quantity}`;
            const orderData = { item: ricemeal.name, quantity, price, category: 'ricemeal' };
            pushToOnsiteCart(orderData).then(() => { showSuccessMessage("Item added to cart!"); animateCartIcon(); closeOverlay(); }).catch(err => alert("Error adding item to cart: " + (err.message || err)));
          };
        });
      }
    });
  });
}

/* 7) Snacks */
function displaySnacksItems() {
  const snacksRef = ref(database, 'snacks');
  const snacksPart = document.querySelector('.snacks-part');
  if (!snacksPart) return;

  snacksPart.innerHTML = '<h1 class="snacks-title">Snacks</h1><div class="snacks-grid"></div>';
  const snacksGrid = snacksPart.querySelector('.snacks-grid');

  onValue(snacksRef, (snapshot) => {
    snacksGrid.innerHTML = '';
    snapshot.forEach(childSnapshot => {
      const snack = childSnapshot.val();
      const uniqueId = 'snacks-section' + childSnapshot.key;
      const isDisabled = snack.disabled === true;

      const snacksSection = document.createElement('div');
      snacksSection.className = 'snacks-section';
      snacksSection.id = uniqueId;
      snacksSection.innerHTML = `
        <h2>${snack.name}</h2>
        <div class="snacks-item">
          <img src="${snack.image || ''}" alt="${snack.name} Image">
          <div class="snacks-text">
            ${ isDisabled ? `<button class="add-to-cart" disabled style="background:#ccc;cursor:not-allowed;">Unavailable</button>` :
              `<button id="add-to-cart-${uniqueId}" class="add-to-cart" title="Add to Cart"><i class="fas fa-cart-plus"></i></button>` }
          </div>
        </div>
      `;
      snacksGrid.appendChild(snacksSection);

      if (!isDisabled) {
        const addToCartButton = snacksSection.querySelector(`#add-to-cart-${uniqueId}`);
        addToCartButton.addEventListener('click', function () {
          const overlay = document.getElementById('cart-overlay');
          const overlayContent = document.getElementById('cart-overlay-content');
          const overlayX = document.getElementById('cart-overlay-x');

          let basePrice = parseFloat(snack.price) || 0;

          overlayContent.innerHTML = `
            <div class="snacks-overlay">
              <div class="snacks-content">
                <h2>${snack.name}</h2>
                <img src="${snack.image || ''}" alt="${snack.name} Image">
                <p>Quantity:
                  <button type="button" id="decrease-quantity-${uniqueId}" class="decrease-quantity">-</button>
                  <input id="quantity-display-${uniqueId}" class="spanquantity" type="number" value="1" min="1" readonly>
                  <button type="button" id="increase-quantity-${uniqueId}" class="increase-quantity">+</button>
                </p>
                <p class="snacks-price-container">Price: <span class="snacks-price" id="snacks-price-${uniqueId}">P${basePrice}</span></p>
                <div class="overlay-add-button"><button type="submit" id="overlay-add-to-cart-btn">Add to Cart</button></div>
              </div>
            </div>
          `;
          overlay.classList.remove('hide'); overlay.classList.add('show'); overlay.style.display = 'block';

          const overlayQty = document.getElementById(`quantity-display-${uniqueId}`);
          const overlayDecrease = document.getElementById(`decrease-quantity-${uniqueId}`);
          const overlayIncrease = document.getElementById(`increase-quantity-${uniqueId}`);
          const overlayPrice = document.getElementById(`snacks-price-${uniqueId}`);

          function updateOverlayPrice() { let qty = parseInt(overlayQty.value) || 1; overlayPrice.textContent = `P${basePrice * qty}`; }
          overlayDecrease.onclick = function() { let qty = parseInt(overlayQty.value); if (qty > 1) { overlayQty.value = qty - 1; updateOverlayPrice(); } };
          overlayIncrease.onclick = function() { let qty = parseInt(overlayQty.value); overlayQty.value = qty + 1; updateOverlayPrice(); };
          overlayQty.onchange = updateOverlayPrice; updateOverlayPrice();

          function closeOverlay() { overlay.classList.remove('show'); overlay.classList.add('hide'); setTimeout(() => { overlay.style.display = 'none'; overlay.classList.remove('hide'); }, 400); }
          overlayX.onclick = closeOverlay;

          const overlayAddToCartBtn = document.getElementById('overlay-add-to-cart-btn');
          overlayAddToCartBtn.onclick = function () {
            const quantity = overlayQty ? parseInt(overlayQty.value) : 1;
            const price = `P${basePrice * quantity}`;
            const orderData = { item: snack.name, quantity, price, category: 'snacks' };
            pushToOnsiteCart(orderData).then(() => { showSuccessMessage("Item added to cart!"); animateCartIcon(); closeOverlay(); }).catch(err => alert("Error adding item to cart: " + (err.message || err)));
          };
        });
      }
    });
  });
}

/* 8) Sandwiches */
function displaySandwichItems() {
  const sandwichRef = ref(database, 'sandwiches');
  const sandwichPart = document.querySelector('.sandwich-part');
  if (!sandwichPart) return;

  sandwichPart.innerHTML = '<h1 class="sandwich-title">Sandwiches</h1><div class="sandwich-grid"></div>';
  const sandwichGrid = sandwichPart.querySelector('.sandwich-grid');

  onValue(sandwichRef, (snapshot) => {
    sandwichGrid.innerHTML = '';
    snapshot.forEach(childSnapshot => {
      const sandwich = childSnapshot.val();
      const uniqueId = 'sandwich-section' + childSnapshot.key;
      const isDisabled = sandwich.disabled === true;

      const sandwichSection = document.createElement('div');
      sandwichSection.className = 'sandwich-section';
      sandwichSection.id = uniqueId;
      sandwichSection.innerHTML = `
        <h2>${sandwich.name}</h2>
        <div class="sandwich-item">
          <img src="${sandwich.image || ''}" alt="${sandwich.name} Image">
          <div class="sandwich-text">
            ${ isDisabled ? `<button class="add-to-cart" disabled style="background:#ccc;cursor:not-allowed;">Unavailable</button>` :
              `<button id="add-to-cart-${uniqueId}" class="add-to-cart" title="Add to Cart"><i class="fas fa-cart-plus"></i></button>` }
          </div>
        </div>
      `;
      sandwichGrid.appendChild(sandwichSection);

      if (!isDisabled) {
        const addToCartButton = sandwichSection.querySelector(`#add-to-cart-${uniqueId}`);
        addToCartButton.addEventListener('click', function () {
          const overlay = document.getElementById('cart-overlay');
          const overlayContent = document.getElementById('cart-overlay-content');
          const overlayX = document.getElementById('cart-overlay-x');

          let basePrice = parseFloat(sandwich.price) || 0;

          overlayContent.innerHTML = `
            <div class="sandwich-overlay">
              <div class="sandwich-content">
                <h2>${sandwich.name}</h2>
                <img src="${sandwich.image || ''}" alt="${sandwich.name} Image">
                <p>Quantity:
                  <button type="button" id="decrease-quantity-${uniqueId}" class="decrease-quantity">-</button>
                  <input id="quantity-display-${uniqueId}" class="spanquantity" type="number" value="1" min="1" readonly>
                  <button type="button" id="increase-quantity-${uniqueId}" class="increase-quantity">+</button>
                </p>
                <p class="sandwich-price-container">Price: <span class="sandwich-price" id="sandwich-price-${uniqueId}">P${basePrice}</span></p>
                <div class="overlay-add-button"><button type="submit" id="overlay-add-to-cart-btn">Add to Cart</button></div>
              </div>
            </div>
          `;
          overlay.classList.remove('hide'); overlay.classList.add('show'); overlay.style.display = 'block';

          const overlayQty = document.getElementById(`quantity-display-${uniqueId}`);
          const overlayDecrease = document.getElementById(`decrease-quantity-${uniqueId}`);
          const overlayIncrease = document.getElementById(`increase-quantity-${uniqueId}`);
          const overlayPrice = document.getElementById(`sandwich-price-${uniqueId}`);

          function updateOverlayPrice() { let qty = parseInt(overlayQty.value) || 1; overlayPrice.textContent = `P${basePrice * qty}`; }
          overlayDecrease.onclick = function() { let qty = parseInt(overlayQty.value); if (qty > 1) { overlayQty.value = qty - 1; updateOverlayPrice(); } };
          overlayIncrease.onclick = function() { let qty = parseInt(overlayQty.value); overlayQty.value = qty + 1; updateOverlayPrice(); };
          overlayQty.onchange = updateOverlayPrice; updateOverlayPrice();

          function closeOverlay() { overlay.classList.remove('show'); overlay.classList.add('hide'); setTimeout(() => { overlay.style.display = 'none'; overlay.classList.remove('hide'); }, 400); }
          overlayX.onclick = closeOverlay;

          const overlayAddToCartBtn = document.getElementById('overlay-add-to-cart-btn');
          overlayAddToCartBtn.onclick = function () {
            const quantity = overlayQty ? parseInt(overlayQty.value) : 1;
            const price = `P${basePrice * quantity}`;
            const orderData = { item: sandwich.name, quantity, price, category: 'sandwich' };
            pushToOnsiteCart(orderData).then(() => { showSuccessMessage("Item added to cart!"); animateCartIcon(); closeOverlay(); }).catch(err => alert("Error adding item to cart: " + (err.message || err)));
          };
        });
      }
    });
  });
}

/* 9) Silog */
function displaySilogItems() {
  const silogRef = ref(database, 'silog');
  const silogPart = document.querySelector('.silog-part');
  if (!silogPart) return;

  silogPart.innerHTML = '<h1 class="silog-title">Silog</h1><div class="silog-grid"></div>';
  const silogGrid = silogPart.querySelector('.silog-grid');

  onValue(silogRef, (snapshot) => {
    silogGrid.innerHTML = '';
    snapshot.forEach(childSnapshot => {
      const silog = childSnapshot.val();
      const uniqueId = 'silog-section' + childSnapshot.key;
      const isDisabled = silog.disabled === true;

      const silogSection = document.createElement('div');
      silogSection.className = 'silog-section';
      silogSection.id = uniqueId;
      silogSection.innerHTML = `
        <h2>${silog.name}</h2>
        <div class="silog-item">
          <img src="${silog.image || ''}" alt="${silog.name} Image">
          <div class="silog-text">
            ${ isDisabled ? `<button class="add-to-cart" disabled style="background:#ccc;cursor:not-allowed;">Unavailable</button>` :
              `<button id="add-to-cart-${uniqueId}" class="add-to-cart" title="Add to Cart"><i class="fas fa-cart-plus"></i></button>` }
          </div>
        </div>
      `;
      silogGrid.appendChild(silogSection);

      if (!isDisabled) {
        const addToCartButton = silogSection.querySelector(`#add-to-cart-${uniqueId}`);
        addToCartButton.addEventListener('click', function () {
          const overlay = document.getElementById('cart-overlay');
          const overlayContent = document.getElementById('cart-overlay-content');
          const overlayX = document.getElementById('cart-overlay-x');

          let basePrice = parseFloat(silog.price) || 0;

          overlayContent.innerHTML = `
            <div class="silog-overlay">
              <div class="silog-content">
                <h2>${silog.name}</h2>
                <img src="${silog.image || ''}" alt="${silog.name} Image">
                <p class="quantity-container">Quantity:
                  <button type="button" id="decrease-quantity-${uniqueId}" class="decrease-quantity">-</button>
                  <input id="quantity-display-${uniqueId}" class="spanquantity" type="number" value="1" min="1" readonly>
                  <button type="button" id="increase-quantity-${uniqueId}" class="increase-quantity">+</button>
                </p>
                <p class="silog-price-container">Price: <span class="silog-price" id="silog-price-${uniqueId}">P${basePrice}</span></p>
                <div class="overlay-add-button"><button type="submit" id="overlay-add-to-cart-btn">Add to Cart</button></div>
              </div>
            </div>
          `;
          overlay.classList.remove('hide'); overlay.classList.add('show'); overlay.style.display = 'block';

          const overlayQty = document.getElementById(`quantity-display-${uniqueId}`);
          const overlayDecrease = document.getElementById(`decrease-quantity-${uniqueId}`);
          const overlayIncrease = document.getElementById(`increase-quantity-${uniqueId}`);
          const overlayPrice = document.getElementById(`silog-price-${uniqueId}`);

          function updateOverlayPrice() { let qty = parseInt(overlayQty.value) || 1; overlayPrice.textContent = `P${basePrice * qty}`; }
          overlayDecrease.onclick = function() { let qty = parseInt(overlayQty.value); if (qty > 1) { overlayQty.value = qty - 1; updateOverlayPrice(); } };
          overlayIncrease.onclick = function() { let qty = parseInt(overlayQty.value); overlayQty.value = qty + 1; updateOverlayPrice(); };
          overlayQty.onchange = updateOverlayPrice; updateOverlayPrice();

          function closeOverlay() { overlay.classList.remove('show'); overlay.classList.add('hide'); setTimeout(() => { overlay.style.display = 'none'; overlay.classList.remove('hide'); }, 400); }
          overlayX.onclick = closeOverlay;

          const overlayAddToCartBtn = document.getElementById('overlay-add-to-cart-btn');
          overlayAddToCartBtn.onclick = function () {
            const quantity = overlayQty ? parseInt(overlayQty.value) : 1;
            const price = `P${basePrice * quantity}`;
            const orderData = { item: silog.name, quantity, price, category: 'silog' };
            pushToOnsiteCart(orderData).then(() => { showSuccessMessage("Item added to cart!"); animateCartIcon(); closeOverlay(); }).catch(err => alert("Error adding item to cart: " + (err.message || err)));
          };
        });
      }
    });
  });
}

/* 10) Fruit Tea */
function displayFruitTeaItems() {
  const fruitteaRef = ref(database, 'fruittea');
  const fruitteaPart = document.querySelector('.ftea-part');
  if (!fruitteaPart) return;

  fruitteaPart.innerHTML = '<h1 class="ftea-title">Fruit Tea</h1><div class="ftea-grid"></div>';
  const fteaGrid = fruitteaPart.querySelector('.ftea-grid');

  onValue(fruitteaRef, (snapshot) => {
    fteaGrid.innerHTML = '';
    snapshot.forEach(childSnapshot => {
      const fruittea = childSnapshot.val();
      const uniqueId = 'ftea-section' + childSnapshot.key;
      const isDisabled = fruittea.disabled === true;

      const fruitteaSection = document.createElement('div');
      fruitteaSection.className = 'ftea-section';
      fruitteaSection.id = uniqueId;
      fruitteaSection.innerHTML = `
        <h2>${fruittea.name}</h2>
        <div class="ftea-item">
          <img src="${fruittea.image || ''}" alt="${fruittea.name} Image">
          <div class="ftea-text">
            ${ isDisabled ? `<button class="add-to-cart" disabled style="background:#ccc;cursor:not-allowed;">Unavailable</button>` :
              `<button id="add-to-cart-${uniqueId}" class="add-to-cart" title="Add to Cart"><i class="fas fa-cart-plus"></i></button>` }
          </div>
        </div>
      `;
      fteaGrid.appendChild(fruitteaSection);

      if (!isDisabled) {
        const addToCartButton = fruitteaSection.querySelector(`#add-to-cart-${uniqueId}`);
        addToCartButton.addEventListener('click', function () {
          const overlay = document.getElementById('cart-overlay');
          const overlayContent = document.getElementById('cart-overlay-content');
          const overlayX = document.getElementById('cart-overlay-x');

          let basePrice = Array.isArray(fruittea.sizes) && fruittea.sizes.length > 0 ? parseFloat(fruittea.sizes[0].price) || 0 : parseFloat(fruittea.price) || 0;

          const sugarLevels = [
            { value: "0%", color: "#fff", label: "0%" },
            { value: "25%", color: "#e0c199", label: "25%" },
            { value: "50%", color: "#c68642", label: "50%" },
            { value: "75%", color: "#8b5c2a", label: "75%" },
            { value: "100%", color: "#4b2e05", label: "100%" }
          ];
          const addonsList = [
            { value: "", label: "None", price: 0 },
            { value: "Nata", label: "Nata P20", price: 20 },
            { value: "Boba Pearl", label: "Boba Pearl P15", price: 15 },
            { value: "White Pearl", label: "White Pearl P10", price: 10 },
            { value: "Yakult", label: "Yakult P20", price: 20 },
            { value: "Chia Seeds", label: "Chia Seeds P10", price: 10 },
            { value: "Popping Boba", label: "Popping Boba P20", price: 20 }
          ];

          overlayContent.innerHTML = `
            <div class="ftea-overlay">
              <div class="ftea-content">
                <h2>${fruittea.name}</h2>
                <img src="${fruittea.image || ''}" alt="${fruittea.name} Image">
                <div class="ftea-details-row">
                  <div class="ftea-detail-col">
                    <p class="size-radio">
                      Size:
                      <span id="size-radio-group-${uniqueId}" class="size-radio-group">
                        ${
                          Array.isArray(fruittea.sizes) && fruittea.sizes.length > 0
                            ? fruittea.sizes.map((sz, idx) => `<label style="margin-right:10px;"><input type="radio" name="size-radio-${uniqueId}" value="${idx}" ${idx === 0 ? "checked" : ""}>${sz.size}</label>`).join('')
                            : `<label><input type="radio" name="size-radio-${uniqueId}" value="0" checked>Regular</label>`
                        }
                      </span>
                    </p>
                    <p class="sugar-icon">
                      Sugar:
                      <span id="sugar-level-icons-${uniqueId}" class="sugar-level-icons" style="display:flex;gap:10px;">
                        ${sugarLevels.map((s, idx) => `<span style="display:flex;flex-direction:column;align-items:center;"><span class="sugar-icon" data-value="${s.value}" title="${s.label}" style="display:inline-block;width:28px;height:28px;border-radius:50%;background:${s.color};border:1px solid #ccc;margin-bottom:3px;cursor:pointer;vertical-align:middle;box-shadow:0 1px 2px rgba(0,0,0,0.08);" ${idx === 4 ? 'data-selected="true"' : ''}></span><span style="font-size:11px;color:#555;text-align:center;line-height:1.1;">${s.label}</span></span>`).join('')}
                      </span>
                    </p>
                  </div>
                  <div class="ftea-detail-col">
                    <p>
                      Add Ons:
                      <select id="addons-dropdown-${uniqueId}">
                        ${addonsList.map(a => `<option value="${a.value}">${a.label}</option>`).join('')}
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
                <p style="text-align:center;">Price: <span class="ftea-price" id="ftea-price-${uniqueId}">P${basePrice}</span></p>
                <div class="overlay-add-button"><button type="submit" id="overlay-add-to-cart-btn">Add to Cart</button></div>
              </div>
            </div>
          `;
          overlay.classList.remove('hide'); overlay.classList.add('show'); overlay.style.display = 'block';

          const sizeRadios = overlayContent.querySelectorAll(`input[name="size-radio-${uniqueId}"]`);
          const sugarIcons = overlayContent.querySelectorAll(`#sugar-level-icons-${uniqueId} .sugar-icon`);
          let selectedSugar = "100%";
          sugarIcons.forEach((icon, idx) => {
            if (icon.getAttribute('data-selected') === "true") { icon.style.outline = "3px solid #f4ac12ff"; selectedSugar = icon.getAttribute('data-value'); }
            icon.onclick = function() { sugarIcons.forEach(i => { i.style.outline = "none"; i.removeAttribute('data-selected'); }); icon.style.outline = "3px solid #f4ac12ff"; icon.setAttribute('data-selected', 'true'); selectedSugar = icon.getAttribute('data-value'); };
          });

          const addonsSelect = document.getElementById(`addons-dropdown-${uniqueId}`);
          function getAddonPrice(addon) { const found = addonsList.find(a => a.value === addon); return found ? found.price : 0; }
          let selectedAddon = ""; let selectedAddonPrice = 0;

          const overlayQty = document.getElementById(`quantity-display-${uniqueId}`);
          const overlayDecrease = document.getElementById(`decrease-quantity-${uniqueId}`);
          const overlayIncrease = document.getElementById(`increase-quantity-${uniqueId}`);
          const overlayPrice = document.getElementById(`ftea-price-${uniqueId}`);

          function updateOverlayPrice() {
            let idx = 0; sizeRadios.forEach((r, i) => { if (r.checked) idx = i; });
            let base = Array.isArray(fruittea.sizes) && fruittea.sizes.length > 0 ? parseFloat(fruittea.sizes[idx].price) || 0 : parseFloat(fruittea.price) || 0;
            let qty = parseInt(overlayQty.value) || 1;
            selectedAddon = addonsSelect ? addonsSelect.value : "";
            selectedAddonPrice = getAddonPrice(selectedAddon);
            overlayPrice.textContent = `P${(base + selectedAddonPrice) * qty}`;
          }

          overlayDecrease.onclick = function() { let qty = parseInt(overlayQty.value); if (qty > 1) { overlayQty.value = qty - 1; updateOverlayPrice(); } };
          overlayIncrease.onclick = function() { let qty = parseInt(overlayQty.value); overlayQty.value = qty + 1; updateOverlayPrice(); };
          sizeRadios.forEach(r => r.onchange = updateOverlayPrice);
          overlayQty.onchange = updateOverlayPrice;
          if (addonsSelect) addonsSelect.onchange = updateOverlayPrice;
          updateOverlayPrice();

          function closeOverlay() { overlay.classList.remove('show'); overlay.classList.add('hide'); setTimeout(() => { overlay.style.display = 'none'; overlay.classList.remove('hide'); }, 400); }
          overlayX.onclick = closeOverlay;

          const overlayAddToCartBtn = document.getElementById('overlay-add-to-cart-btn');
          overlayAddToCartBtn.onclick = function () {
            let selectedSizeIdx = 0; sizeRadios.forEach((r, i) => { if (r.checked) selectedSizeIdx = i; });
            const selectedSize = (Array.isArray(fruittea.sizes) && fruittea.sizes.length > 0) ? fruittea.sizes[selectedSizeIdx].size : "Regular";
            const quantity = overlayQty ? parseInt(overlayQty.value) : 1;
            let base = Array.isArray(fruittea.sizes) && fruittea.sizes.length > 0 ? parseFloat(fruittea.sizes[selectedSizeIdx].price) || 0 : parseFloat(fruittea.price) || 0;
            const price = `P${(base + selectedAddonPrice) * quantity}`;

            const orderData = { item: fruittea.name, size: selectedSize, sugar: selectedSugar, addon: selectedAddon, quantity, price, category: 'fruittea' };
            pushToOnsiteCart(orderData).then(() => { showSuccessMessage("Item added to cart!"); animateCartIcon(); closeOverlay(); }).catch(err => alert("Error adding item to cart: " + (err.message || err)));
          };
        });
      }
    });
  });
}

/* 11) Espresso */
function displayEspressoItems() {
  const espressoRef = ref(database, 'espresso');
  const espressoPart = document.querySelector('.espresso-part');
  if (!espressoPart) return;

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
            ${ isDisabled ? `<button class="add-to-cart" disabled style="background:#ccc;cursor:not-allowed;">Unavailable</button>` :
              `<button id="add-to-cart-${uniqueId}" class="add-to-cart" title="Add to Cart"><i class="fas fa-cart-plus"></i></button>` }
          </div>
        </div>
      `;
      espressoGrid.appendChild(espressoSection);

      if (!isDisabled) {
        const addToCartButton = espressoSection.querySelector(`#add-to-cart-${uniqueId}`);
        addToCartButton.addEventListener('click', function () {
          const overlay = document.getElementById('cart-overlay');
          const overlayContent = document.getElementById('cart-overlay-content');
          const overlayX = document.getElementById('cart-overlay-x');

          let basePrice = Array.isArray(espresso.types) && espresso.types.length > 0 ? parseFloat(espresso.types[0].price) || 0 : 0;
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
                            ? espresso.types.map((tp, idx) => `<label style="margin-right:10px;"><input type="radio" name="type-radio-${uniqueId}" value="${idx}" ${idx === 0 ? "checked" : ""}>${tp.type}</label>`).join('')
                            : `<label><input type="radio" name="type-radio-${uniqueId}" value="0" checked>Hot (12OZ)</label><label><input type="radio" name="type-radio-${uniqueId}" value="1">Cold (16OZ)</label>`
                        }
                      </span>
                    </p>
                    <p class="sugar-icon">
                      Sugar:
                      <span id="sugar-level-icons-${uniqueId}" class="sugar-level-icons" style="display:flex;gap:10px;">
                        ${sugarLevels.map((s, idx) => `<span style="display:flex;flex-direction:column;align-items:center;"><span class="sugar-icon" data-value="${s.value}" title="${s.label}" style="display:inline-block;width:28px;height:28px;border-radius:50%;background:${s.color};border:1px solid #ccc;margin-bottom:3px;cursor:pointer;vertical-align:middle;box-shadow:0 1px 2px rgba(0,0,0,0.08);" ${idx === 4 ? 'data-selected="true"' : ''}></span><span style="font-size:11px;color:#555;text-align:center;line-height:1.1;">${s.label}</span></span>`).join('')}
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
                <p style="text-align:center;">Price: <span class="espresso-price" id="espresso-price-${uniqueId}">P${basePrice}</span></p>
                <div class="overlay-add-button"><button type="submit" id="overlay-add-to-cart-btn">Add to Cart</button></div>
              </div>
            </div>
          `;
          overlay.classList.remove('hide'); overlay.classList.add('show'); overlay.style.display = 'block';

          const typeRadios = overlayContent.querySelectorAll(`input[name="type-radio-${uniqueId}"]`);
          const sugarIcons = overlayContent.querySelectorAll(`#sugar-level-icons-${uniqueId} .sugar-icon`);
          let selectedSugar = "100%";
          sugarIcons.forEach((icon, idx) => { if (icon.getAttribute('data-selected') === "true") { icon.style.outline = "3px solid #f4ac12ff"; selectedSugar = icon.getAttribute('data-value'); } icon.onclick = function() { sugarIcons.forEach(i => { i.style.outline = "none"; i.removeAttribute('data-selected'); }); icon.style.outline = "3px solid #f4ac12ff"; icon.setAttribute('data-selected', 'true'); selectedSugar = icon.getAttribute('data-value'); }; });

          const addonsSelect = document.getElementById(`addons-dropdown-${uniqueId}`);
          function getAddonPrice(addon) { switch (addon) { case "Extra Espresso Shot": return 30; case "Flavored Syrup": return 20; default: return 0; } }
          const overlayQty = document.getElementById(`quantity-display-${uniqueId}`);
          const overlayDecrease = document.getElementById(`decrease-quantity-${uniqueId}`);
          const overlayIncrease = document.getElementById(`increase-quantity-${uniqueId}`);
          const overlayPrice = document.getElementById(`espresso-price-${uniqueId}`);

          function updateOverlayPrice() {
            let idx = 0; typeRadios.forEach((r, i) => { if (r.checked) idx = i; });
            let base = Array.isArray(espresso.types) && espresso.types.length > 0 ? parseFloat(espresso.types[idx].price) || 0 : 0;
            let qty = parseInt(overlayQty.value) || 1;
            let addonPrice = addonsSelect ? getAddonPrice(addonsSelect.value) : 0;
            overlayPrice.textContent = `P${(base + addonPrice) * qty}`;
          }

          overlayDecrease.onclick = function() { let qty = parseInt(overlayQty.value); if (qty > 1) { overlayQty.value = qty - 1; updateOverlayPrice(); } };
          overlayIncrease.onclick = function() { let qty = parseInt(overlayQty.value); overlayQty.value = qty + 1; updateOverlayPrice(); };
          typeRadios.forEach(r => r.onchange = updateOverlayPrice);
          overlayQty.onchange = updateOverlayPrice;
          if (addonsSelect) addonsSelect.onchange = updateOverlayPrice;
          updateOverlayPrice();

          function closeOverlay() { overlay.classList.remove('show'); overlay.classList.add('hide'); setTimeout(() => { overlay.style.display = 'none'; overlay.classList.remove('hide'); }, 400); }
          overlayX.onclick = closeOverlay;

          const overlayAddToCartBtn = document.getElementById('overlay-add-to-cart-btn');
          overlayAddToCartBtn.onclick = function () {
            let selectedTypeIdx = 0; typeRadios.forEach((r, i) => { if (r.checked) selectedTypeIdx = i; });
            const selectedType = (Array.isArray(espresso.types) && espresso.types.length > 0) ? espresso.types[selectedTypeIdx].type : "Hot (12oz)";
            const selectedAddon = addonsSelect ? addonsSelect.value : "";
            const quantity = overlayQty ? parseInt(overlayQty.value) : 1;
            let base = Array.isArray(espresso.types) && espresso.types.length > 0 ? parseFloat(espresso.types[selectedTypeIdx].price) || 0 : 0;
            let addonPrice = getAddonPrice(selectedAddon);
            const price = `P${(base + addonPrice) * quantity}`;

            const orderData = { item: espresso.name, type: selectedType, sugar: selectedSugar, addon: selectedAddon, quantity, price, category: 'espresso' };
            pushToOnsiteCart(orderData).then(() => { showSuccessMessage("Item added to cart!"); animateCartIcon(); closeOverlay(); }).catch(err => alert("Error adding item to cart: " + (err.message || err)));
          };
        });
      }
    });
  });
}

/* initialize all displays */
displayMilkteaItems();
displayBestsellerItems();
displayExtrasItems();
displayFriesItems();
displayNoodlePastaItems();
displayRiceMealItems();
displaySnacksItems();
displaySandwichItems();
displaySilogItems();
displayFruitTeaItems();
displayEspressoItems();
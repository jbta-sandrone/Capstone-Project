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
            noodlepastaGrid.appendChild(noodlepastaSection);

            // Overlay logic for customization
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
      <p>
        Quantity:
        <button type="button" id="decrease-quantity-${uniqueId}" class="decrease-quantity">-</button>
        <input id="quantity-display-${uniqueId}" class="spanquantity" type="number" value="1" min="1" readonly>
        <button type="button" id="increase-quantity-${uniqueId}" class="increase-quantity">+</button>
      </p>
      <p class="noodlepasta-price-container">
        Price: <span class="noodlepasta-price" id="noodlepasta-price-${uniqueId}">P${basePrice.toFixed(2)}</span>
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

                // Quantity controls and price update
                const overlayQty = document.getElementById(`quantity-display-${uniqueId}`);
                const overlayDecrease = document.getElementById(`decrease-quantity-${uniqueId}`);
                const overlayIncrease = document.getElementById(`increase-quantity-${uniqueId}`);
                const overlayPrice = document.getElementById(`noodlepasta-price-${uniqueId}`);

                function updateOverlayPrice() {
                    let qty = parseInt(overlayQty.value) || 1;
                    overlayPrice.textContent = `P${(basePrice * qty).toFixed(2)}`;
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
                overlayQty.onchange = updateOverlayPrice;

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

                    const quantity = overlayQty ? parseInt(overlayQty.value) : 1;
                    const price = `P${basePrice * quantity}`;

                    // Prepare order data
                    const orderData = {
                        item: noodlepasta.name,
                        quantity: quantity,
                        price: price
                    };

                    // Store in database
                    const orderRef = ref(database, `users/${userUid}/ordercart`);
                    push(orderRef, orderData)
                        .then(() => {
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

displayNoodlePastaItems();
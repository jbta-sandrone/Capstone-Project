import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getDatabase, ref, push, onValue, update } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

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

// --- Fast form submit handler ---
document.getElementById('fast-add-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const itemName = document.getElementById('item-name').value;
    const itemPrice = document.getElementById('item-price').value;
    const itemImageInput = document.getElementById('item-image');
    const itemImageFile = itemImageInput ? itemImageInput.files[0] : null;
    const category = document.getElementById('item-location').value;

    let imageDataUrl = "";
    if (itemImageFile) {
        imageDataUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = function(event) {
                resolve(event.target.result);
            };
            reader.readAsDataURL(itemImageFile);
        });
    }

    // Prepare data object
    let data = {
        name: itemName,
        image: imageDataUrl
    };

    // If Milk Tea or Espresso, collect size/price pairs
    if (category === "Milk Tea" || category === "Fruit Tea") {
        const sizes = [];
        const sizeRows = document.querySelectorAll('#size-price-container > div');
        sizeRows.forEach(row => {
            const sizeSelect = row.querySelector('select');
            const priceInput = row.querySelector('input');
            if (sizeSelect && priceInput) {
                sizes.push({
                    size: sizeSelect.value,
                    price: priceInput.value
                });
            }
        });
        data.sizes = sizes;
    } else if (category === "Espresso") {
        const types = [];
        const typeRows = document.querySelectorAll('#size-price-container > div');
        typeRows.forEach(row => {
            const typeSelect = row.querySelector('select');
            const priceInput = row.querySelector('input');
            if (typeSelect && priceInput) {
                types.push({
                    type: typeSelect.value,
                    price: priceInput.value
                });
            }
        });
        data.types = types;
    } else {
        // For other categories, just save price as a single value
        data.price = itemPrice;
    }

    // Save to the correct database node
    let dbNode = "";
    if (category === "Milk Tea") {
        dbNode = "milktea";
    } else if (category === "Fruit Tea") {
        dbNode = "fruittea";
    } else if (category === "Silog") {
        dbNode = "silog";
    } else if (category === "Espresso") {
        dbNode = "espresso";
    } else if (category === "Sandwiches") {
        dbNode = "sandwiches";
    } else if (category === "Snacks") {
        dbNode = "snacks";
    } else if (category === "Rice Meals") {
        dbNode = "ricemeal";
    } else if (category === "Noodles & Pasta") {
        dbNode = "noodlepasta";
    } else if (category === "Fries") {
        dbNode = "fries";
    } else if (category === "Extras") {
        dbNode = "extras";
    } else if (category === "Best Seller") {
        dbNode = "bestseller";
    } else {
        dbNode = category.toLowerCase().replace(/\s+/g, '');
    }

    // --- EDIT/UPDATE LOGIC ---
    if (window.editingItem && window.editingItem.node && window.editingItem.key) {
        // If no new image is uploaded, keep the old image
        if (!imageDataUrl) {
            // Fetch the old image from db
            const itemRef = ref(database, `${window.editingItem.node}/${window.editingItem.key}`);
            await new Promise((resolve) => {
                onValue(itemRef, (snapshot) => {
                    const oldData = snapshot.val();
                    if (oldData && oldData.image) {
                        data.image = oldData.image;
                    }
                    resolve();
                }, { onlyOnce: true });
            });
        }
        // Update the item in the database
        await update(ref(database, `${window.editingItem.node}/${window.editingItem.key}`), data)
            .then(() => {
                document.getElementById('fast-form-overlay').style.display = 'none';
                this.reset();
                window.editingItem = null;
                // Optionally refresh the display for the relevant category
                if (dbNode === "milktea") displayMilkteaItems && displayMilkteaItems();
                if (dbNode === "fruittea") displayFruitTeaItems && displayFruitTeaItems();
                if (dbNode === "silog") displaySilogItems && displaySilogItems();
                if (dbNode === "espresso") displayEspressoItems && displayEspressoItems();
                if (dbNode === "sandwiches") displaySandwichItems && displaySandwichItems();
                if (dbNode === "snacks") displaySnacksItems && displaySnacksItems();
                if (dbNode === "ricemeal") displayRiceMealItems && displayRiceMealItems();
                if (dbNode === "noodlepasta") displayNoodlePastaItems && displayNoodlePastaItems();
                if (dbNode === "fries") displayFriesItems && displayFriesItems();
                if (dbNode === "extras") displayExtrasItems && displayExtrasItems();
                if (dbNode === "bestseller") displayBestSellerItems && displayBestSellerItems();
            })
            .catch((error) => {
                // Handle error if needed
            });
        return;
    }

    // --- ADD/CREATE LOGIC ---
    const refNode = ref(database, dbNode);
    push(refNode, data)
        .then(() => {
            document.getElementById('fast-form-overlay').style.display = 'none';
            this.reset();
            // Refresh the display for the relevant category
            if (dbNode === "milktea") displayMilkteaItems && displayMilkteaItems();
            if (dbNode === "fruittea") displayFruitTeaItems && displayFruitTeaItems();
            if (dbNode === "silog") displaySilogItems && displaySilogItems();
            if (dbNode === "espresso") displayEspressoItems && displayEspressoItems();
            if (dbNode === "sandwiches") displaySandwichItems && displaySandwichItems();
            if (dbNode === "snacks") displaySnacksItems && displaySnacksItems();
            if (dbNode === "ricemeal") displayRiceMealItems && displayRiceMealItems();
            if (dbNode === "noodlepasta") displayNoodlePastaItems && displayNoodlePastaItems();
            if (dbNode === "fries") displayFriesItems && displayFriesItems();
            if (dbNode === "extras") displayExtrasItems && displayExtrasItems();
            if (dbNode === "bestseller") displayBestSellerItems && displayBestSellerItems();
        })
        .catch((error) => {
            // No error alert
        });
});

// Optional: Reset editing state when overlay is closed
const overlay = document.getElementById('fast-form-overlay');
const overlayClose = document.getElementById('fast-form-close');
if (overlayClose) {
    overlayClose.onclick = function() {
        overlay.style.display = 'none';
        window.editingItem = null;
        document.getElementById('fast-add-form').reset();
    };
}
const categorySelect = document.getElementById('item-location');
const sizePriceContainer = document.getElementById('size-price-container');
const addSizeBtn = document.getElementById('add-size-btn');
const itemPriceLabel = document.querySelector('label[for="item-price"]');
const itemPriceInput = document.getElementById('item-price');

// Helper to create a size/price row
function createSizePriceRow() {
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.gap = '8px';
    row.style.marginBottom = '6px';

    // Size dropdown
    const sizeSelect = document.createElement('select');
    sizeSelect.name = 'size[]';
    sizeSelect.required = true;
    if (categorySelect.value === 'Espresso') {
    sizeSelect.innerHTML = `
        <option value="" disabled selected>Select type</option>
        <option value="Hot (12OZ)">Hot (12OZ)</option>
        <option value="Cold (16OZ)">Cold (16OZ)</option>
    `;
} else {
    sizeSelect.innerHTML = `
        <option value="" disabled selected>Select size</option>
        <option value="16OZ">16OZ</option>
        <option value="22OZ">22OZ</option>
    `;
}

    // Price input
    const priceInput = document.createElement('input');
    priceInput.type = 'number';
    priceInput.name = 'size-price[]';
    priceInput.placeholder = 'Price';
    priceInput.min = '1';
    priceInput.required = true;
    priceInput.style.width = '80px';

    // Remove button
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

    return row;
}

categorySelect.addEventListener('change', function() {
    if (
        this.value === 'Milk Tea' ||
        this.value === 'Fruit Tea' ||
        this.value === 'Espresso'
    ) {
        sizePriceContainer.style.display = '';
        addSizeBtn.style.display = '';
        // Hide item price
        itemPriceLabel.style.display = 'none';
        itemPriceInput.style.display = 'none';
        // Always clear and add a new row for the selected category
        sizePriceContainer.innerHTML = '';
        sizePriceContainer.appendChild(createSizePriceRow());
    } else if (
        this.value === 'Silog' ||
        this.value === 'Sandwiches' ||
        this.value === 'Snacks' ||
        this.value === 'Rice Meals' ||
        this.value === 'Noodles & Pasta' ||
        this.value === 'Fries' ||
        this.value === 'Extras' ||
        this.value === 'Best Seller'
    ) {
        // For Silog, Sandwiches, Snacks, and Rice Meals, show only price input
        sizePriceContainer.style.display = 'none';
        addSizeBtn.style.display = 'none';
        sizePriceContainer.innerHTML = '';
        itemPriceLabel.style.display = '';
        itemPriceInput.style.display = '';
    } else {
        sizePriceContainer.style.display = 'none';
        addSizeBtn.style.display = 'none';
        sizePriceContainer.innerHTML = '';
        // Show item price
        itemPriceLabel.style.display = '';
        itemPriceInput.style.display = '';
    }
});

// Add more size/price fields
addSizeBtn.addEventListener('click', function() {
    sizePriceContainer.appendChild(createSizePriceRow());
});
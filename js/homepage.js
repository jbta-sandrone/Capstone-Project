import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

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

// Nodes to fetch item names from
const nodes = [
  "milktea", "fruittea", "silog", "espresso", "sandwiches", "snacks",
  "ricemeal", "noodlepasta", "fries", "extras", "bestseller"
];

// Map node to card ID
const nodeToCard = {
  milktea: "card1",
  espresso: "card2",
  fruittea: "card3",
  silog: "card4",
  sandwiches: "card5",
  snacks: "card6",
  ricemeal: "card7",
  noodlepasta: "card8",
  fries: "card9",
  extras: "card10",
  bestseller: "card11"
};

let allowedSearchTerms = [];
let itemNodeMap = {}; // { itemName: node }

// Fetch all item names from each node and map them to their node
function fetchAllItemNames() {
  allowedSearchTerms = [];
  itemNodeMap = {};
  let fetchCount = 0;
  nodes.forEach(node => {
    const nodeRef = ref(database, node);
    onValue(nodeRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        Object.values(data).forEach(item => {
          // For milktea, fruittea, espresso, check for .name or .type
          if (item.name) {
            allowedSearchTerms.push(item.name);
            itemNodeMap[item.name.toLowerCase()] = node;
          }
          if (item.type) {
            allowedSearchTerms.push(item.type);
            itemNodeMap[item.type.toLowerCase()] = node;
          }
          if (item.sizes && Array.isArray(item.sizes)) {
            item.sizes.forEach(sz => {
              if (sz.size) {
                allowedSearchTerms.push(sz.size);
                itemNodeMap[sz.size.toLowerCase()] = node;
              }
            });
          }
        });
      }
      fetchCount++;
      // After all nodes are fetched, remove duplicates
      if (fetchCount === nodes.length) {
        allowedSearchTerms = [...new Set(allowedSearchTerms)];
      }
    }, { onlyOnce: true });
  });
}

// Initial fetch
fetchAllItemNames();

// Add event listener for the search bar
document.getElementById("search-bar").addEventListener("input", function (event) {
  const searchBar = event.target;
  const searchValue = searchBar.value.trim().toLowerCase();
  const suggestionsContainer = document.getElementById("suggestions");

  // Clear previous suggestions
  suggestionsContainer.innerHTML = "";

  if (searchValue !== "") {
    // Filter allowed search terms based on the input
    const filteredTerms = allowedSearchTerms.filter((term) =>
      term.toLowerCase().includes(searchValue)
    );

    // Display suggestions
    filteredTerms.forEach((term) => {
      const suggestionItem = document.createElement("div");
      suggestionItem.classList.add("suggestion-item");
      suggestionItem.textContent = term;

      // Add click event to select the suggestion
      suggestionItem.addEventListener("click", () => {
        searchBar.value = term; // Set the selected suggestion in the search bar
        suggestionsContainer.innerHTML = ""; // Clear suggestions
      });

      suggestionsContainer.appendChild(suggestionItem);
    });
  }
});

// Handle search on pressing Enter
document.getElementById("search-bar").addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
    event.preventDefault(); // Prevent form submission
    handleSearch();
  }
});

// Handle search on clicking the search icon
document.querySelector(".search-icon").addEventListener("click", function () {
  handleSearch();
});

// Function to handle search logic
function handleSearch() {
  const searchBar = document.getElementById("search-bar");
  const searchValue = searchBar.value.trim().toLowerCase();

  // Check if the search value matches any allowed term
  const isValidSearch = allowedSearchTerms.some((term) => term.toLowerCase() === searchValue);

  if (isValidSearch) {
    // Find which node this item belongs to
    const foundNode = itemNodeMap[searchValue];
    if (foundNode && nodeToCard[foundNode]) {
      document.getElementById("order-link").click();
      setTimeout(() => {
        document.getElementById(nodeToCard[foundNode]).click();
      }, 300); // Delay to ensure order section is visible
    }
  }
}

function renderBestsellerTable() {
  const tableDiv = document.querySelector('.table');
  if (!tableDiv) return;

  tableDiv.innerHTML = ''; // Clear previous content

  const bestsellerRef = ref(database, 'bestseller');
  onValue(bestsellerRef, (snapshot) => {
    tableDiv.innerHTML = ''; // Clear again on update
    snapshot.forEach(childSnapshot => {
      const item = childSnapshot.val();
      const tableBg = document.createElement('div');
      tableBg.className = 'tablebackground';

      // h1 for item name, img for image
      tableBg.innerHTML = `
        <h1>${item.name || "No Name"}</h1>
        <img src="${item.image || 'img/default.png'}" alt="${item.name || "Bestseller"}" >
      `;

      // Add click event: click order-link then card11
      tableBg.addEventListener('click', function () {
        const orderLink = document.getElementById('order-link');
        const card11 = document.getElementById('card11');
        if (orderLink) orderLink.click();
        setTimeout(() => {
          if (card11) card11.click();
        }, 300);
      });

      tableDiv.appendChild(tableBg);
    });
    // If no items, show message
    if (!snapshot.hasChildren()) {
      tableDiv.innerHTML = "<div class='tablebackground'><h1>No Bestsellers Found</h1></div>";
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderBestsellerTable();
});

// Add event listener for the "viewall" button
document.getElementById('viewall').addEventListener('click', function () {
  // Simulate a click on the "order-link"
  document.getElementById('order-link').click();
});

// Add event listener for the "order-now" button
document.getElementById('order-now').addEventListener('click', function () {
  document.getElementById('order-link').click();
});





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
const CATEGORY_NAV_DELAY = 300;
const cardToSection = {
  card1: ".milktea-part",
  card2: ".espresso-part",
  card3: ".ftea-part",
  card4: ".silog-part",
  card5: ".sandwich-part",
  card6: ".snacks-part",
  card7: ".ricemeal-part",
  card8: ".noodlepasta-part",
  card9: ".fries-part",
  card10: ".extras-part",
  card11: ".bestseller-part"
};

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
      openOrderCategory(nodeToCard[foundNode]);
    }
  }
}

function openOrderCategory(cardId) {
  const orderLink = document.getElementById("order-link");
  if (orderLink) orderLink.click();

  setTimeout(() => {
    const categoryCard = document.getElementById(cardId);
    if (!categoryCard) return;

    categoryCard.click();
    const targetSection = document.querySelector(cardToSection[cardId]) || categoryCard;
    targetSection.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
  }, CATEGORY_NAV_DELAY);
}

function openBestsellers() {
  openOrderCategory("card11");
}

function openHistorySection() {
  const historyLink = document.getElementById("history-link");
  if (historyLink) historyLink.click();

  setTimeout(() => {
    const historyTab = document.getElementById("history-tab");
    if (historyTab) historyTab.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 80);
}

function showComingSoonMessage(trigger) {
  const panel = document.querySelector(".home-hero__panel");
  if (!panel) return;

  let message = panel.querySelector(".home-hero__toast");
  if (!message) {
    message = document.createElement("div");
    message.className = "home-hero__toast";
    message.setAttribute("role", "status");
    message.setAttribute("aria-live", "polite");
    panel.appendChild(message);
  }

  message.textContent = "Smart Search is coming soon.";
  message.classList.add("is-visible");
  if (trigger) trigger.classList.add("is-notifying");

  clearTimeout(showComingSoonMessage.timer);
  showComingSoonMessage.timer = setTimeout(() => {
    message.classList.remove("is-visible");
    if (trigger) trigger.classList.remove("is-notifying");
  }, 2200);
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
        <img src="${item.image || '../img/bhivelogo.jpg'}" alt="${item.name || "Bestseller"}" >
      `;

      // Reuse the same Best Seller navigation as the Home metric.
      tableBg.addEventListener('click', function () {
        openBestsellers();
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
  setupHeroMetrics();
});

// Add event listener for the "viewall" button
document.getElementById('viewall').addEventListener('click', function () {
  openBestsellers();
});

// Add event listener for the "order-now" button
document.getElementById('order-now').addEventListener('click', function () {
  document.getElementById('order-link').click();
});

function setupHeroMetrics() {
  document.querySelectorAll("[data-home-metric]").forEach((metric) => {
    if (metric.dataset.metricReady === "true") return;
    metric.dataset.metricReady = "true";

    metric.addEventListener("click", () => {
      const action = metric.dataset.homeMetric;

      if (action === "bestsellers") {
        openBestsellers();
        return;
      }

      if (action === "history") {
        openHistorySection();
        return;
      }

      if (action === "smart-search") {
        showComingSoonMessage(metric);
      }
    });
  });
}




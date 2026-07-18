import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getDatabase, ref, onValue, get } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

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
const auth = getAuth(app);
const CATEGORY_NAV_DELAY = 300;
const IS_LOCAL_DEVELOPMENT = ["localhost", "127.0.0.1"].includes(window.location.hostname);
const SMART_SEARCH_API_BASE_URL = IS_LOCAL_DEVELOPMENT
  ? "http://localhost:3000/api"
  : "https://intellicliq.onrender.com/api";
const RECOMMENDATIONS_API_URL = `${SMART_SEARCH_API_BASE_URL}/recommendations`;
const RECOMMENDATIONS_USAGE_API_URL = `${SMART_SEARCH_API_BASE_URL}/recommendations/usage`;
const SMART_SEARCH_DAILY_LIMIT = 3;
const SMART_SEARCH_THINKING_MS = 3600;
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

const nodeLabels = {
  milktea: "Milk Tea",
  espresso: "Espresso",
  fruittea: "Fruit Tea",
  silog: "Silog",
  sandwiches: "Sandwiches",
  snacks: "Snacks",
  ricemeal: "Rice Meals",
  noodlepasta: "Noodles & Pasta",
  fries: "Fries",
  extras: "Extras",
  bestseller: "Best Seller"
};

let allowedSearchTerms = [];
let itemNodeMap = {}; // { itemName: node }
let smartSearchMenuItems = [];
let smartSearchRemaining = null;
let smartSearchUsageLoaded = false;
let smartSearchRequestPending = false;

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

function openSmartSearchModal() {
  const modal = document.getElementById("smart-search-modal");
  if (!modal) return;

  showSmartSearchForm();
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("smart-search-open");
  void refreshSmartSearchUsage();
}

function closeSmartSearchModal() {
  const modal = document.getElementById("smart-search-modal");
  if (!modal) return;

  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("smart-search-open");
}

function showSmartSearchForm() {
  const form = document.getElementById("smart-search-form");
  const results = document.getElementById("smart-search-results");

  if (form) form.classList.remove("is-hidden");
  if (results) {
    results.classList.remove("is-visible");
    results.innerHTML = "";
  }
}

function showSmartSearchResults() {
  const form = document.getElementById("smart-search-form");
  const results = document.getElementById("smart-search-results");

  if (form) form.classList.add("is-hidden");
  if (results) results.classList.add("is-visible");
}

function waitForFirebaseUser() {
  if (auth.currentUser) return Promise.resolve(auth.currentUser);

  return new Promise((resolve, reject) => {
    let unsubscribe;
    unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        if (unsubscribe) unsubscribe();
        resolve(user);
      },
      (error) => {
        if (unsubscribe) unsubscribe();
        reject(error);
      }
    );
  });
}

async function fetchAuthenticatedSmartSearch(url, options = {}) {
  const user = await waitForFirebaseUser();

  if (!user) {
    const error = new Error("Please sign in to use AI Smart Search.");
    error.status = 401;
    throw error;
  }

  const idToken = await user.getIdToken();
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${idToken}`,
    },
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || `Smart Search request failed (${response.status}).`);
    error.status = response.status;
    error.responseData = data;
    throw error;
  }

  return data;
}

function syncSmartSearchSubmitState() {
  const submitButton = document.getElementById("smart-search-submit");
  if (!submitButton) return;

  submitButton.disabled =
    smartSearchRequestPending || !smartSearchUsageLoaded || smartSearchRemaining === 0;
  submitButton.textContent = smartSearchRequestPending
    ? "Finding Recommendations..."
    : "Find Recommendations";
}

function updateSmartSearchUsage(remaining) {
  const usage = document.getElementById("smart-search-usage");
  const normalizedRemaining = Math.min(
    SMART_SEARCH_DAILY_LIMIT,
    Math.max(0, Number(remaining) || 0)
  );
  const usedSearches = SMART_SEARCH_DAILY_LIMIT - normalizedRemaining;

  smartSearchRemaining = normalizedRemaining;
  smartSearchUsageLoaded = true;

  if (usage) {
    usage.textContent = `${usedSearches}/${SMART_SEARCH_DAILY_LIMIT} AI searches used today`;
    usage.classList.toggle("is-limit-reached", normalizedRemaining === 0);
    usage.classList.remove("is-error");
  }

  syncSmartSearchSubmitState();
}

function setSmartSearchUsageUnavailable(message) {
  const usage = document.getElementById("smart-search-usage");

  smartSearchRemaining = null;
  smartSearchUsageLoaded = false;
  if (usage) {
    usage.textContent = message;
    usage.classList.add("is-error");
    usage.classList.remove("is-limit-reached");
  }
  syncSmartSearchSubmitState();
}

async function refreshSmartSearchUsage() {
  const usage = document.getElementById("smart-search-usage");

  smartSearchRemaining = null;
  smartSearchUsageLoaded = false;
  if (usage) {
    usage.textContent = "Checking today's AI searches...";
    usage.classList.remove("is-error", "is-limit-reached");
  }
  syncSmartSearchSubmitState();

  try {
    const data = await fetchAuthenticatedSmartSearch(RECOMMENDATIONS_USAGE_API_URL);
    const remaining = data.usage?.remaining ?? data.remaining;
    updateSmartSearchUsage(remaining);

    if (smartSearchRemaining === 0) {
      renderSmartSearchLimitReached();
      return;
    }

    document.getElementById("smart-category")?.focus();
  } catch (error) {
    console.error("Could not load Smart Search usage:", error);
    setSmartSearchUsageUnavailable(
      error.status === 401
        ? error.message
        : "Daily AI search availability could not be loaded. Please try again."
    );
  }
}

function renderSmartSearchLimitReached() {
  const results = document.getElementById("smart-search-results");
  if (!results) return;

  showSmartSearchForm();
  results.classList.add("is-visible");
  results.innerHTML = `
    <div class="smart-search-status smart-search-status--limit" role="alert">
      <strong>Daily AI Smart Search limit reached.</strong>
      <span>You have used all 3 Smart Searches today.</span>
      <span>Please try again tomorrow.</span>
    </div>
  `;
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
  setupSmartSearch();
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
        openSmartSearchModal();
      }
    });
  });
}

function setupSmartSearch() {
  const form = document.getElementById("smart-search-form");
  const modal = document.getElementById("smart-search-modal");
  const closeButton = document.getElementById("smart-search-close");
  const results = document.getElementById("smart-search-results");
  if (!form || !modal || form.dataset.smartSearchReady === "true") return;

  form.dataset.smartSearchReady = "true";
  form.addEventListener("submit", handleSmartSearchSubmit);
  closeButton?.addEventListener("click", closeSmartSearchModal);

  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeSmartSearchModal();
  });

  results?.addEventListener("click", (event) => {
    const searchAgainButton = event.target.closest("[data-smart-search-again]");
    if (searchAgainButton) {
      if (smartSearchRemaining === 0) {
        renderSmartSearchLimitReached();
      } else {
        showSmartSearchForm();
      }
      return;
    }

    const addButton = event.target.closest("[data-smart-add-to-cart]");
    if (addButton) {
      openRecommendedItem(addButton.dataset.smartNode, addButton.dataset.smartSectionId);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("is-open")) {
      closeSmartSearchModal();
    }
  });
}

async function handleSmartSearchSubmit(event) {
  event.preventDefault();

  const results = document.getElementById("smart-search-results");
  const preferences = {
    category: document.getElementById("smart-category")?.value || "",
    taste: document.getElementById("smart-taste")?.value || "",
    temperature: document.getElementById("smart-temperature")?.value || "",
    budget: document.getElementById("smart-budget")?.value || ""
  };

  if (!results || !smartSearchUsageLoaded || smartSearchRemaining === 0) return;

  showSmartSearchResults();
  renderSmartSearchThinking();
  smartSearchRequestPending = true;
  syncSmartSearchSubmitState();
  const thinkingDelay = waitForSmartSearchThinking();

  try {
    const menuItems = await fetchMenuItemsForRecommendations();
    smartSearchMenuItems = menuItems;
    if (!menuItems.length) {
      await thinkingDelay;
      renderSmartSearchRecommendations([]);
      return;
    }

    const data = await fetchAuthenticatedSmartSearch(RECOMMENDATIONS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ...preferences,
        menuItems: menuItems.map(({ image, sectionId, ...item }) => item)
      })
    });
    await thinkingDelay;
    const remaining = data.usage?.remaining ?? data.remaining;
    updateSmartSearchUsage(remaining);
    renderSmartSearchRecommendations(data.recommendations || data.items || []);
  } catch (error) {
    console.error("Smart Search request failed:", error);

    if (error.status === 429 && error.responseData?.code === "DAILY_AI_LIMIT_REACHED") {
      updateSmartSearchUsage(error.responseData?.remaining ?? 0);
      renderSmartSearchLimitReached();
      return;
    }

    if (error.status === 429) {
      if (Number.isFinite(Number(error.responseData?.remaining))) {
        updateSmartSearchUsage(error.responseData.remaining);
      }
      results.innerHTML = `
        <div class="smart-search-status smart-search-status--error">
          ${escapeSmartSearchHtml(error.message)}
          <button type="button" data-smart-search-again>Try Again</button>
        </div>
      `;
      return;
    }

    if (error.status === 401) {
      setSmartSearchUsageUnavailable(error.message);
      results.innerHTML = `
        <div class="smart-search-status smart-search-status--error">
          ${escapeSmartSearchHtml(error.message)}
        </div>
      `;
      return;
    }

    await thinkingDelay;
    results.innerHTML = `
      <div class="smart-search-status smart-search-status--error">
        We could not brew recommendations right now. Please try again in a moment.
        <button type="button" data-smart-search-again>Search Again</button>
      </div>
    `;
  } finally {
    smartSearchRequestPending = false;
    syncSmartSearchSubmitState();
  }
}

function waitForSmartSearchThinking() {
  return new Promise((resolve) => {
    setTimeout(resolve, SMART_SEARCH_THINKING_MS);
  });
}

function renderSmartSearchThinking() {
  const results = document.getElementById("smart-search-results");
  if (!results) return;

  results.innerHTML = `
    <div class="smart-search-thinking" role="status" aria-live="polite">
      <p class="smart-search-thinking__title">☕ Brewing your perfect recommendations...</p>
      <div class="smart-search-thinking__dots" aria-hidden="true">
        <div><span class="is-active">◉</span><span>○</span><span>○</span></div>
        <div><span>○</span><span class="is-active">◉</span><span>○</span></div>
        <div><span>○</span><span>○</span><span class="is-active">◉</span></div>
      </div>
      <div class="smart-search-thinking__steps">
        <span>Analyzing your taste...</span>
        <span>Checking available menu...</span>
        <span>Almost ready...</span>
      </div>
    </div>
  `;
}

async function fetchMenuItemsForRecommendations() {
  const snapshots = await Promise.all(nodes.map(async (node) => {
    const snapshot = await get(ref(database, node));
    return { node, snapshot };
  }));

  return snapshots.flatMap(({ node, snapshot }) => {
    if (!snapshot.exists()) return [];

    const items = [];
    snapshot.forEach((child) => {
      const item = child.val() || {};
      if (item.disabled === true) return;

      items.push({
        id: child.key,
        name: item.name || item.type || "Unnamed item",
        category: nodeLabels[node] || node,
        node,
        sectionId: getRecommendationSectionId(node, child.key),
        image: item.image || "../img/bhivelogo.jpg",
        price: getRecommendationPriceLabel(item),
        sizes: Array.isArray(item.sizes) ? item.sizes : [],
        types: Array.isArray(item.types) ? item.types : []
      });
    });

    return items;
  });
}

function getRecommendationPriceLabel(item) {
  if (Array.isArray(item.sizes) && item.sizes.length) {
    return item.sizes
      .map((size) => `${size.size || "Option"} P${size.price || 0}`)
      .join(", ");
  }

  if (Array.isArray(item.types) && item.types.length) {
    return item.types
      .map((type) => `${type.type || "Option"} P${type.price || 0}`)
      .join(", ");
  }

  if (item.price !== undefined && item.price !== null && item.price !== "") {
    return String(item.price).startsWith("P") ? String(item.price) : `P${item.price}`;
  }

  return "Price unavailable";
}

function renderSmartSearchRecommendations(recommendations) {
  const results = document.getElementById("smart-search-results");
  if (!results) return;

  if (!Array.isArray(recommendations) || recommendations.length === 0) {
    const limitNotice = smartSearchRemaining === 0
      ? `
        <strong>Daily AI Smart Search limit reached.</strong>
        <span>You have used all 3 Smart Searches today.</span>
        <span>Please try again tomorrow.</span>
      `
      : "No perfect match found. Try changing your preferences.";

    results.innerHTML = `
      <div class="smart-search-status ${smartSearchRemaining === 0 ? "smart-search-status--limit" : ""}">
        ${limitNotice}
        <button type="button" data-smart-search-again ${smartSearchRemaining === 0 ? "disabled" : ""}>Search Again</button>
      </div>
    `;
    return;
  }

  const limitNotice = smartSearchRemaining === 0
    ? `
      <div class="smart-search-status smart-search-status--limit" role="status">
        <strong>Daily AI Smart Search limit reached.</strong>
        <span>You have used all 3 Smart Searches today.</span>
        <span>Please try again tomorrow.</span>
      </div>
    `
    : "";

  results.innerHTML = `
    ${limitNotice}
    <div class="smart-search-results__header">
      <div>
        <p class="smart-search-eyebrow">Recommendations</p>
        <h3>Fresh matches for you</h3>
      </div>
      <button type="button" data-smart-search-again ${smartSearchRemaining === 0 ? "disabled" : ""}>Search Again</button>
    </div>
    <div class="smart-search-card-grid">
      ${recommendations.slice(0, 3).map((item) => renderSmartSearchCard(item)).join("")}
    </div>
  `;
}

function renderSmartSearchCard(recommendation) {
  const catalogItem = findRecommendedCatalogItem(recommendation);
  const item = {
    ...catalogItem,
    ...recommendation
  };
  const tags = normalizeRecommendationTags(item.tags, item);
  const matchScore = formatMatchScore(item.matchScore || item.match_score || item.score);

  return `
    <article class="smart-recommendation-card">
      <img src="${escapeSmartSearchHtml(item.image || "../img/bhivelogo.jpg")}" alt="${escapeSmartSearchHtml(item.name || "Recommended item")}" loading="lazy">
      <div class="smart-recommendation-card__body">
        <div class="smart-recommendation-card__topline">
          <span>${escapeSmartSearchHtml(item.category || "Menu Item")}</span>
          <strong>${escapeSmartSearchHtml(matchScore)}</strong>
        </div>
        <h3>${escapeSmartSearchHtml(item.name || "Recommended item")}</h3>
        <p class="smart-recommendation-price">${escapeSmartSearchHtml(item.price || "Price unavailable")}</p>
        <p>${escapeSmartSearchHtml(item.reason || "This item matches your selected preferences.")}</p>

        <div class="smart-recommendation-tags">
          ${tags.map((tag) => `<span>${escapeSmartSearchHtml(tag)}</span>`).join("")}
        </div>
        <button type="button" class="smart-add-cart" data-smart-add-to-cart data-smart-node="${escapeSmartSearchHtml(item.node || "")}" data-smart-section-id="${escapeSmartSearchHtml(item.sectionId || "")}">
          Add to Cart
        </button>
      </div>
    </article>
  `;
}

function findRecommendedCatalogItem(recommendation) {
  const targetName = normalizeSmartSearchValue(recommendation.name);
  const targetCategory = normalizeSmartSearchValue(recommendation.category);

  return smartSearchMenuItems.find((item) => {
    const nameMatches = normalizeSmartSearchValue(item.name) === targetName;
    const categoryMatches = !targetCategory || normalizeSmartSearchValue(item.category) === targetCategory;
    return nameMatches && categoryMatches;
  }) || smartSearchMenuItems.find((item) => normalizeSmartSearchValue(item.name) === targetName) || {};
}

function normalizeRecommendationTags(tags, item) {
  if (Array.isArray(tags) && tags.length) {
    return tags.slice(0, 4);
  }

  return [item.category || "Cafe pick", item.matchScore || item.score ? "AI matched" : "Recommended", "Customizable"].slice(0, 4);
}

function formatMatchScore(value) {
  if (value === undefined || value === null || value === "") return "92% match";
  const score = String(value).trim();
  if (score.toLowerCase().includes("match")) return score;
  return score.includes("%") ? `${score} match` : `${score}% match`;
}

function normalizeSmartSearchValue(value) {
  return String(value || "").trim().toLowerCase();
}

function getRecommendationSectionId(node, key) {
  const prefixes = {
    milktea: "milktea-section",
    espresso: "espresso-section",
    fruittea: "ftea-section",
    silog: "silog-section",
    sandwiches: "sandwich-section",
    snacks: "snacks-section",
    ricemeal: "ricemeal-section",
    noodlepasta: "noodlepasta-section",
    fries: "fries-section",
    extras: "extras-section",
    bestseller: "bestseller-section"
  };

  return `${prefixes[node] || `${node}-section`}${key}`;
}

function openRecommendedItem(node, sectionId) {
  const cardId = nodeToCard[node];
  const itemSection = sectionId ? document.getElementById(sectionId) : null;

  closeSmartSearchModal();

  if (cardId) openOrderCategory(cardId);

  setTimeout(() => {
    const section = itemSection || (sectionId ? document.getElementById(sectionId) : null);
    const addButton = section?.querySelector(".add-to-cart:not([disabled])");

    if (section) section.scrollIntoView({ behavior: "smooth", block: "center" });
    if (addButton) {
      addButton.click();
      return;
    }

    alert("This item is currently unavailable or could not be opened.");
  }, CATEGORY_NAV_DELAY + 220);
}

function escapeSmartSearchHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

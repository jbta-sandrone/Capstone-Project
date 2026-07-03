(function () {
  const sectionMap = {
    profile: { href: "adminprofile.html", title: "Profile" },
    orders: { href: "orderqueue.html", title: "Orders" },
    manage: { href: "inventory.html", title: "Manage Items" },
    items: { href: "inventory.html", title: "Items" },
    feedback: { href: "adminfeedback.html", title: "Feedback" },
    reports: { href: "analytics.html", title: "Reports" }
  };

  const categoryNodes = [
    ["milktea", "Milk Tea"],
    ["espresso", "Espresso"],
    ["fruittea", "Fruit Tea"],
    ["silog", "Silog"],
    ["sandwiches", "Sandwiches"],
    ["snacks", "Snacks"],
    ["ricemeal", "Rice Meals"],
    ["noodlepasta", "Noodles & Pasta"],
    ["fries", "Fries"],
    ["extras", "Extras"],
    ["bestseller", "Best Seller"]
  ];

  document.addEventListener("DOMContentLoaded", () => {
    setupNavigation();
    setupLogoutModal();
    setupMobileSidebar();
    setupQuickActions();
    updateCurrentDate();
    loadDashboardStats();
  });

  function setupNavigation() {
    document.querySelectorAll("[data-admin-section]").forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        const section = link.dataset.adminSection;
        if (section === "home") {
          showHome();
          return;
        }
        openAdminSection(section, link);
      });
    });

    const closeFrame = document.getElementById("admin-frame-close");
    if (closeFrame) closeFrame.addEventListener("click", showHome);

    const requested = getRequestedSection();
    if (requested && requested !== "home" && sectionMap[requested]) {
      const link = document.querySelector(`[data-admin-section="${requested}"]`);
      openAdminSection(requested, link);
    }
  }

  function setupQuickActions() {
    document.querySelectorAll("[data-admin-open]").forEach((button) => {
      button.addEventListener("click", () => {
        const section = button.dataset.adminOpen;
        const link = document.querySelector(`[data-admin-section="${section}"]`);
        if (sectionMap[section]) openAdminSection(section, link);
      });
    });
  }

  function showHome() {
    setActiveNav("home");
    const title = document.getElementById("admin-page-title");
    const home = document.getElementById("admin-home");
    const frameSection = document.getElementById("admin-frame-section");
    const frame = document.getElementById("admin-frame");

    if (title) title.textContent = "Dashboard Home";
    if (frameSection) frameSection.classList.remove("is-active");
    if (frame) frame.removeAttribute("src");
    if (home) home.classList.add("is-active");
    document.body.classList.remove("admin-sidebar-open");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openAdminSection(section, activeLink) {
    const target = sectionMap[section];
    if (!target) return;

    const title = document.getElementById("admin-page-title");
    const home = document.getElementById("admin-home");
    const frameSection = document.getElementById("admin-frame-section");
    const frameTitle = document.getElementById("admin-frame-title");
    const frame = document.getElementById("admin-frame");

    setActiveNav(section);
    if (activeLink) activeLink.classList.add("is-active");
    if (title) title.textContent = target.title;
    if (frameTitle) frameTitle.textContent = target.title;
    if (home) home.classList.remove("is-active");
    if (frame) frame.src = addEmbedParam(target.href);
    if (frameSection) frameSection.classList.add("is-active");
    document.body.classList.remove("admin-sidebar-open");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function setActiveNav(section) {
    document.querySelectorAll(".admin-nav-link").forEach((link) => {
      link.classList.toggle("is-active", link.dataset.adminSection === section);
    });
  }

  function addEmbedParam(href) {
    const url = new URL(href, location.href);
    url.searchParams.set("embed", "1");
    return url.pathname.split("/").pop() + url.search;
  }

  function getRequestedSection() {
    const params = new URLSearchParams(location.search);
    const query = (params.get("open") || params.get("section") || "").trim().toLowerCase();
    const hash = (location.hash || "").replace(/^#/, "").trim().toLowerCase();
    return query || hash;
  }

  function setupLogoutModal() {
    const logoutBtn = document.querySelector(".logout");
    const modal = document.getElementById("confirmation-modal");
    const modalMessage = document.getElementById("modal-message");
    const confirmBtn = document.getElementById("modal-confirm-btn");
    const cancelBtn = document.getElementById("modal-cancel-btn");

    if (!logoutBtn || !modal || !modalMessage || !confirmBtn || !cancelBtn) return;

    logoutBtn.addEventListener("click", (event) => {
      event.preventDefault();
      modalMessage.textContent = "Are you sure you want to logout?";
      modal.style.display = "flex";
      modal.style.zIndex = "10001";
    });

    confirmBtn.onclick = () => {
      modal.style.display = "none";
      window.location.href = "index.html";
    };

    cancelBtn.onclick = () => {
      modal.style.display = "none";
    };
  }

  function setupMobileSidebar() {
    const openButton = document.getElementById("admin-menu-button");
    const sidebarButton = document.getElementById("admin-mobile-toggle");
    const scrim = document.getElementById("admin-scrim");

    [openButton, sidebarButton].forEach((button) => {
      if (!button) return;
      button.addEventListener("click", () => {
        document.body.classList.toggle("admin-sidebar-open");
      });
    });

    if (scrim) {
      scrim.addEventListener("click", () => {
        document.body.classList.remove("admin-sidebar-open");
      });
    }
  }

  function updateCurrentDate() {
    const dateEl = document.getElementById("admin-current-date");
    if (!dateEl) return;
    dateEl.textContent = new Date().toLocaleDateString("en-PH", {
      timeZone: "Asia/Manila",
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }

  function loadDashboardStats() {
    if (!window.firebase || !firebase.database) {
      setHomeError();
      return;
    }

    const db = firebase.database();
    watchOrderQueue(db);
    watchUsers(db);
    watchAnalyticsItems(db);
    watchSalesSummaries(db);
    watchCategories(db);
  }

  function watchOrderQueue(db) {
    db.ref("orderqueue").on("value", (snapshot) => {
      const orders = snapshot.val() || {};
      const entries = Object.entries(orders);
      const count = entries.length;

      setText("stat-pending-orders", count);
      updateOrderBadge(count);
      renderRecentOrders(entries);
      recomputeTotalOrders();
    }, () => {
      setText("stat-pending-orders", "Unavailable");
      renderRecentOrders([]);
    });
  }

  function watchUsers(db) {
    db.ref("users").on("value", (snapshot) => {
      const users = snapshot.val() || {};
      const customerCount = Object.values(users).filter((user) => (user.role || "").toLowerCase() !== "admin").length;
      setText("stat-total-customers", customerCount);
    }, () => setText("stat-total-customers", "Unavailable"));
  }

  function watchAnalyticsItems(db) {
    db.ref("analytics/items").on("value", (snapshot) => {
      const data = snapshot.val() || {};
      const top = Object.entries(data)
        .map(([name, value]) => ({ name, quantity: Number(value.quantity || 0), percentage: Number(value.percentage || 0) }))
        .sort((a, b) => b.quantity - a.quantity || b.percentage - a.percentage)[0];

      if (top) {
        setText("stat-best-item", top.name);
        setText("stat-best-item-detail", `${top.quantity} sold | ${top.percentage}% popularity`);
      } else {
        setText("stat-best-item", "No data");
        setText("stat-best-item-detail", "Analytics update after completed orders");
      }
    }, () => {
      setText("stat-best-item", "Unavailable");
      setText("stat-best-item-detail", "Could not load analytics");
    });
  }

  function watchSalesSummaries(db) {
    const monthKey = getMonthKey(new Date());
    const weekKey = getWeekRange(new Date());
    const yearKey = String(new Date().getFullYear());

    setText("stat-monthly-label", monthKey);
    setText("stat-weekly-label", weekKey);
    setText("stat-yearly-label", yearKey);

    db.ref(`monthly/${monthKey}`).on("value", (snapshot) => {
      const data = snapshot.val() || {};
      setText("stat-monthly-revenue", formatCurrency(data.totalSales || 0));
      setText("overview-monthly-orders", data.totalOrders || 0);
    }, () => {
      setText("stat-monthly-revenue", "Unavailable");
      setText("overview-monthly-orders", "Unavailable");
    });

    db.ref(`weekly/${weekKey}`).on("value", (snapshot) => {
      const data = snapshot.val() || {};
      setText("stat-weekly-revenue", formatCurrency(data.totalSales || 0));
      setText("overview-weekly-sales", formatCurrency(data.totalSales || 0));
    }, () => {
      setText("stat-weekly-revenue", "Unavailable");
      setText("overview-weekly-sales", "Unavailable");
    });

    db.ref(`yearly/${yearKey}`).on("value", (snapshot) => {
      const data = snapshot.val() || {};
      setText("stat-yearly-revenue", formatCurrency(data.totalSales || 0));
      setText("overview-annual-sales", formatCurrency(data.totalSales || 0));
    }, () => {
      setText("stat-yearly-revenue", "Unavailable");
      setText("overview-annual-sales", "Unavailable");
    });

    db.ref("yearly").on("value", (snapshot) => {
      const yearly = snapshot.val() || {};
      const completedOrders = Object.values(yearly).reduce((sum, row) => sum + Number(row.totalOrders || 0), 0);
      setText("stat-completed-orders", completedOrders);
      recomputeTotalOrders();
    }, () => {
      setText("stat-completed-orders", "Unavailable");
      recomputeTotalOrders();
    });
  }

  function watchCategories(db) {
    const counts = new Map();
    categoryNodes.forEach(([node, label]) => {
      db.ref(node).on("value", (snapshot) => {
        counts.set(label, snapshot.exists() ? snapshot.numChildren() : 0);
        renderCategoryList(counts);
      }, () => {
        counts.set(label, 0);
        renderCategoryList(counts);
      });
    });
  }

  function renderRecentOrders(entries) {
    const container = document.getElementById("admin-recent-orders");
    if (!container) return;

    if (!entries.length) {
      container.innerHTML = '<div class="admin-empty">No queued orders right now.</div>';
      return;
    }

    const rows = entries
      .map(([key, order]) => ({ key, order }))
      .sort((a, b) => String(b.order.date || "").localeCompare(String(a.order.date || "")))
      .slice(0, 5);

    container.innerHTML = rows.map(({ order }) => {
      const total = getOrderTotal(order.orders);
      const customer = order.user?.name || "Customer";
      const date = order.date || "No date";
      return `
        <article class="admin-order-row">
          <div>
            <strong>Order #${escapeHtml(order.orderID || "Unknown")}</strong>
            <small>${escapeHtml(customer)} | ${escapeHtml(date)}</small>
          </div>
          <span class="admin-order-pill">${formatCurrency(total)}</span>
        </article>
      `;
    }).join("");
  }

  function renderCategoryList(counts) {
    const container = document.getElementById("admin-category-list");
    if (!container) return;

    const rows = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
    const max = Math.max(...rows.map(([, count]) => count), 1);

    if (!rows.length) {
      container.innerHTML = '<div class="admin-empty">No menu categories loaded yet.</div>';
      return;
    }

    container.innerHTML = rows.slice(0, 6).map(([label, count]) => {
      const width = Math.max(6, Math.round((count / max) * 100));
      return `
        <div class="admin-category-row">
          <div style="width:100%;">
            <strong>${escapeHtml(label)}</strong>
            <small>${count} item${count === 1 ? "" : "s"}</small>
            <div class="admin-category-meter" aria-hidden="true"><span style="width:${width}%"></span></div>
          </div>
        </div>
      `;
    }).join("");
  }

  function recomputeTotalOrders() {
    const pending = numberFromText(document.getElementById("stat-pending-orders")?.textContent);
    const completed = numberFromText(document.getElementById("stat-completed-orders")?.textContent);

    if (pending === null || completed === null) {
      setText("stat-total-orders", "Loading...");
      return;
    }

    setText("stat-total-orders", pending + completed);
  }

  function updateOrderBadge(count) {
    const badge = document.querySelector(".number-order");
    if (!badge) return;
    badge.textContent = count;
    badge.style.display = count > 0 ? "inline-flex" : "none";
  }

  function getOrderTotal(orders) {
    if (!orders) return 0;
    return Object.values(orders).reduce((sum, item) => {
      const price = parseFloat(String(item.price || "0").replace(/[^0-9.]/g, "")) || 0;
      return sum + price;
    }, 0);
  }

  function getMonthKey(date) {
    return `${date.toLocaleDateString("en-US", { month: "long" })} ${date.getFullYear()}`;
  }

  function getWeekRange(dateObj) {
    const dayOfWeek = dateObj.getDay();
    const startDate = new Date(dateObj);
    startDate.setDate(dateObj.getDate() - ((dayOfWeek + 6) % 7));
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    const options = { month: "short", day: "numeric" };
    const year = endDate.getFullYear();
    return `${startDate.toLocaleDateString("en-US", options)} - ${endDate.toLocaleDateString("en-US", options)}, ${year}`;
  }

  function formatCurrency(value) {
    return `P${Number(value || 0).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  function numberFromText(value) {
    if (value === undefined || value === null) return null;
    const clean = String(value).replace(/,/g, "").trim();
    if (!/^\d+$/.test(clean)) return null;
    return Number(clean);
  }

  function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  }

  function setHomeError() {
    [
      "stat-total-orders",
      "stat-pending-orders",
      "stat-completed-orders",
      "stat-total-customers",
      "stat-best-item",
      "stat-weekly-revenue",
      "stat-monthly-revenue",
      "stat-yearly-revenue",
      "overview-weekly-sales",
      "overview-monthly-orders",
      "overview-annual-sales"
    ].forEach((id) => setText(id, "Unavailable"));
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
})();

(function () {
  const page = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  const params = new URLSearchParams(location.search);
  const isEmbedded = params.get("embed") === "1" || window.self !== window.top;

  const customerPages = new Set([
    "dashboard.html",
    "menu.html",
    "profile.html",
    "cart.html",
    "checkout.html",
    "notification.html",
    "receipt.html",
    "about.html",
    "faqs.html",
    "feedback.html",
    "termsandcondition.html",
    "privacypolicy.html"
  ]);

  const adminPages = new Set([
    "admindashboard.html",
    "adminprofile.html",
    "orderqueue.html",
    "inventory.html",
    "adminfeedback.html",
    "analytics.html"
  ]);

  const onsitePages = new Set([
    "onsitedashboard.html",
    "onsitecart.html"
  ]);

  if (page === "index.html") {
    document.body.classList.add("cliq-landing-page");
    initLandingPage();
    return;
  }

  const authPages = new Set([
    "login2.html",
    "sign_up.html",
    "base.html",
    "loginform.html"
  ]);

  const publicPages = new Set([
    "t&c.html",
    "pp.html"
  ]);

  if (isEmbedded && (customerPages.has(page) || adminPages.has(page) || onsitePages.has(page))) {
    document.body.classList.add("cliq-embedded-page");
    return;
  }

  if (authPages.has(page)) {
    document.body.classList.add("cliq-auth-page");
    return;
  }

  if (publicPages.has(page)) {
    document.body.classList.add("cliq-public-page");
    return;
  }

  if (page === "dashboard.html" || page === "onsitedashboard.html") {
    document.body.classList.add("cliq-dashboard-page");
    enhanceDashboardSidebar(page);
    addMobileControls();
    return;
  }

  if (page === "admindashboard.html") {
    document.body.classList.add("cliq-admin-dashboard-page");
    addMobileControls();
    return;
  }

  if (customerPages.has(page) || adminPages.has(page) || onsitePages.has(page)) {
    const mode = adminPages.has(page) ? "admin" : onsitePages.has(page) ? "onsite" : "customer";
    injectSidebar(mode);
    addMobileControls();
  }

  function enhanceDashboardSidebar(currentPage) {
    const nav = document.querySelector(".nav");
    if (!nav || nav.dataset.cliqEnhanced === "true") return;

    const customerLinks = [
      ["cart.html", "fas fa-shopping-cart", "Cart", "cart"],
      ["notification.html", "fas fa-bell", "Notifications", "notifications"],
      ["profile.html", "fas fa-user", "Profile", "profile"],
      ["about.html", "fas fa-info-circle", "About", "about"],
      ["faqs.html", "fas fa-question-circle", "FAQs", "faqs"],
      ["feedback.html", "fas fa-comment-dots", "Feedback", "feedback"],
      ["termsandcondition.html", "fas fa-file-contract", "Terms", "terms"],
      ["privacypolicy.html", "fas fa-shield-alt", "Policy", "policy"]
    ];

    const onsiteLinks = [
      ["onsitecart.html", "fas fa-shopping-cart", "Onsite Cart", "onsite-cart"]
    ];

    const links = currentPage === "onsitedashboard.html" ? onsiteLinks : customerLinks;
    links.forEach(([href, icon, label, section]) => {
      if (nav.querySelector(`a[href="${href}"]`)) return;
      const li = document.createElement("li");
      li.className = "nav-item";
      li.innerHTML = `<a href="${href}" data-dashboard-section="${section}" data-dashboard-title="${label}"><i class="${icon}"></i>${label}</a>`;
      nav.appendChild(li);
    });

    addLogoutFooter(document.querySelector(".container1"));
    nav.dataset.cliqEnhanced = "true";
    setDashboardActiveState();
    setupDashboardSectionRouter(currentPage);
  }

  function setDashboardActiveState() {
    const map = {
      "home-link": "Home",
      "order-link": "Order",
      "history-link": "History"
    };

    Object.keys(map).forEach((id) => {
      const link = document.getElementById(id);
      if (!link) return;
      link.addEventListener("click", () => {
        document.querySelectorAll(".nav a").forEach((item) => item.classList.remove("cliq-active"));
        link.classList.add("cliq-active");
        hideDashboardFrame();
      });
    });

    document.querySelectorAll(".card-group .card").forEach((card) => {
      card.addEventListener("click", () => {
        document.querySelectorAll(".card-group .card").forEach((item) => item.classList.remove("cliq-active-category"));
        card.classList.add("cliq-active-category");
      });
    });
  }

  function setupDashboardSectionRouter(currentPage) {
    const sectionLinks = document.querySelectorAll("[data-dashboard-section]");
    const topCart = document.getElementById("cart");
    const topNotification = document.getElementById("notification");
    const topMenu = document.getElementById("menu");

    sectionLinks.forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        openDashboardFrame(link.getAttribute("href"), link.dataset.dashboardTitle || link.textContent.trim(), link);
      });
    });

    if (topCart) {
      topCart.addEventListener("click", (event) => {
        event.preventDefault();
        openDashboardFrame(currentPage === "onsitedashboard.html" ? "onsitecart.html" : "cart.html", "Cart", findDashboardLink("cart.html"));
      });
    }

    if (topNotification) {
      topNotification.addEventListener("click", (event) => {
        event.preventDefault();
        openDashboardFrame("notification.html", "Notifications", findDashboardLink("notification.html"));
      });
    }

    if (topMenu) {
      topMenu.addEventListener("click", (event) => {
        event.preventDefault();
        document.body.classList.toggle("cliq-sidebar-open");
      });
    }
  }

  function findDashboardLink(href) {
    return document.querySelector(`.nav a[href="${href}"]`);
  }

  function getDashboardFrame() {
    let frameSection = document.getElementById("dashboard-embed-section");
    if (frameSection) return frameSection;

    frameSection = document.createElement("section");
    frameSection.id = "dashboard-embed-section";
    frameSection.className = "dashboard-embed-section";
    frameSection.style.display = "none";
    frameSection.innerHTML = `
      <div class="dashboard-embed-header">
        <div>
          <p class="dashboard-embed-eyebrow">Dashboard Section</p>
          <h2 id="dashboard-embed-title">Section</h2>
        </div>
        <button type="button" id="dashboard-embed-close" aria-label="Return to dashboard home">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="dashboard-embed-shell">
        <iframe id="dashboard-embed-frame" title="Dashboard section content"></iframe>
      </div>
    `;
    document.body.appendChild(frameSection);

    const close = frameSection.querySelector("#dashboard-embed-close");
    if (close) {
      close.addEventListener("click", () => {
        hideDashboardFrame();
        const homeLink = document.getElementById("home-link");
        if (homeLink) homeLink.click();
      });
    }

    return frameSection;
  }

  function openDashboardFrame(href, title, activeLink) {
    const frameSection = getDashboardFrame();
    const frame = frameSection.querySelector("#dashboard-embed-frame");
    const heading = frameSection.querySelector("#dashboard-embed-title");

    hideDashboardContent();
    document.querySelectorAll(".nav a").forEach((item) => item.classList.remove("cliq-active"));
    if (activeLink) activeLink.classList.add("cliq-active");

    heading.textContent = title;
    frame.src = addEmbedParam(href);
    frameSection.style.display = "block";
    document.body.classList.remove("cliq-sidebar-open");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function hideDashboardFrame() {
    const frameSection = document.getElementById("dashboard-embed-section");
    if (!frameSection) return;
    const frame = frameSection.querySelector("#dashboard-embed-frame");
    frameSection.style.display = "none";
    if (frame) frame.removeAttribute("src");
  }

  function hideDashboardContent() {
    const selectors = [
      "#home",
      "#history-tab",
      "#card-group",
      ".milktea-part",
      ".espresso-part",
      ".ftea-part",
      ".silog-part",
      ".sandwich-part",
      ".snacks-part",
      ".ricemeal-part",
      ".noodlepasta-part",
      ".fries-part",
      ".extras-part",
      ".bestseller-part"
    ];

    selectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((element) => {
        element.style.display = "none";
      });
    });
  }

  function addEmbedParam(href) {
    const url = new URL(href, location.href);
    url.searchParams.set("embed", "1");
    return url.pathname.split("/").pop() + url.search;
  }

  function injectSidebar(mode) {
    if (document.querySelector(".cliq-sidebar")) return;
    document.body.classList.add("cliq-with-shell", `cliq-${mode}-page`);

    const main = document.createElement("main");
    main.className = "cliq-page-main";

    Array.from(document.body.childNodes).forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node;
        if (element.tagName === "SCRIPT" || element.classList.contains("modal") || element.id === "confirmation-modal" || element.id === "image-modal" || element.id === "gcash-overlay" || element.id === "fast-form-overlay" || element.id === "modal") {
          return;
        }
      }
      main.appendChild(node);
    });

    const sidebar = document.createElement("aside");
    sidebar.className = "cliq-sidebar";
    sidebar.innerHTML = sidebarTemplate(mode);
    document.body.insertBefore(sidebar, document.body.firstChild);
    document.body.insertBefore(main, sidebar.nextSibling);

    document.querySelectorAll(".cliq-sidebar a").forEach((link) => {
      const href = (link.getAttribute("href") || "").toLowerCase();
      if (href === page) link.classList.add("cliq-active");
    });

    setupLogoutControls();
  }

  function sidebarTemplate(mode) {
    const customer = [
      ["dashboard.html", "fas fa-home", "Dashboard"],
      ["cart.html", "fas fa-shopping-cart", "Cart"],
      ["notification.html", "fas fa-bell", "Notifications"],
      ["profile.html", "fas fa-user", "Profile"],
      ["about.html", "fas fa-info-circle", "About"],
      ["faqs.html", "fas fa-question-circle", "FAQs"],
      ["feedback.html", "fas fa-comment-dots", "Feedback"],
      ["termsandcondition.html", "fas fa-file-contract", "Terms"],
      ["privacypolicy.html", "fas fa-shield-alt", "Privacy"]
    ];

    const admin = [
      ["admindashboard.html", "fas fa-user-shield", "Admin Home"],
      ["adminprofile.html", "fas fa-user", "Profile"],
      ["orderqueue.html", "fas fa-clipboard-list", "Orders"],
      ["inventory.html", "fas fa-box", "Manage Items"],
      ["adminfeedback.html", "fas fa-comment-dots", "Feedback"],
      ["analytics.html", "fas fa-chart-bar", "Reports"]
    ];

    const onsite = [
      ["onsitedashboard.html", "fas fa-utensils", "Onsite Order"],
      ["onsitecart.html", "fas fa-shopping-cart", "Onsite Cart"]
    ];

    const links = mode === "admin" ? admin : mode === "onsite" ? onsite : customer;
    return `
      <div class="cliq-sidebar__brand">
        <img src="../img/bhivelogo.jpg" alt="B-Hive logo">
        <span>B-Hive CLIQ</span>
      </div>
      <nav class="cliq-sidebar__nav">
        ${links.map(([href, icon, label]) => `<a href="${href}"><i class="${icon}"></i>${label}</a>`).join("")}
      </nav>
      ${logoutFooterTemplate()}
    `;
  }

  function addLogoutFooter(container) {
    if (!container || container.querySelector(".cliq-sidebar-footer")) return;
    container.insertAdjacentHTML("beforeend", logoutFooterTemplate());
    setupLogoutControls();
  }

  function logoutFooterTemplate() {
    return `
      <div class="cliq-sidebar-footer">
        <button type="button" class="cliq-logout-btn" aria-haspopup="dialog">
          <i class="fas fa-sign-out-alt"></i>
          <span>Logout</span>
        </button>
      </div>
    `;
  }

  function setupLogoutControls() {
    document.querySelectorAll(".cliq-logout-btn").forEach((button) => {
      if (button.dataset.cliqLogoutReady === "true") return;
      button.dataset.cliqLogoutReady = "true";
      button.addEventListener("click", openLogoutModal);
    });
  }

  function getLogoutModal() {
    let modal = document.getElementById("cliq-logout-modal");
    if (modal) return modal;

    modal = document.createElement("div");
    modal.id = "cliq-logout-modal";
    modal.className = "cliq-logout-modal";
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
      <div class="cliq-logout-backdrop" data-logout-cancel></div>
      <div class="cliq-logout-dialog" role="dialog" aria-modal="true" aria-labelledby="cliq-logout-title">
        <button type="button" class="cliq-logout-close" aria-label="Cancel logout" data-logout-cancel>
          <i class="fas fa-times"></i>
        </button>
        <div class="cliq-logout-icon">
          <i class="fas fa-sign-out-alt"></i>
        </div>
        <h2 id="cliq-logout-title">Log out?</h2>
        <p>Are you sure you want to log out?</p>
        <div class="cliq-logout-actions">
          <button type="button" class="cliq-logout-cancel" data-logout-cancel>Cancel</button>
          <button type="button" class="cliq-logout-confirm">Yes, Log Out</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelectorAll("[data-logout-cancel]").forEach((button) => {
      button.addEventListener("click", closeLogoutModal);
    });

    const confirm = modal.querySelector(".cliq-logout-confirm");
    if (confirm) confirm.addEventListener("click", performLogout);

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && modal.classList.contains("is-open")) {
        closeLogoutModal();
      }
    });

    return modal;
  }

  function openLogoutModal() {
    const modal = getLogoutModal();
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("cliq-modal-open");

    const cancel = modal.querySelector(".cliq-logout-cancel");
    if (cancel) cancel.focus();
  }

  function closeLogoutModal() {
    const modal = document.getElementById("cliq-logout-modal");
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("cliq-modal-open");
  }

  function performLogout() {
    [
      "loggedInUsername",
      "userUid",
      "pendingNewEmail",
      "emailChangePending"
    ].forEach((key) => localStorage.removeItem(key));

    window.location.href = "index.html";
  }

  function addMobileControls() {
    if (document.querySelector(".cliq-mobile-menu")) return;

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "cliq-mobile-menu";
    toggle.setAttribute("aria-label", "Open navigation");
    toggle.innerHTML = '<i class="fas fa-bars"></i>';

    const scrim = document.createElement("div");
    scrim.className = "cliq-scrim";

    toggle.addEventListener("click", () => {
      document.body.classList.toggle("cliq-sidebar-open");
      toggle.setAttribute("aria-label", document.body.classList.contains("cliq-sidebar-open") ? "Close navigation" : "Open navigation");
    });

    scrim.addEventListener("click", () => {
      document.body.classList.remove("cliq-sidebar-open");
      toggle.setAttribute("aria-label", "Open navigation");
    });

    document.body.appendChild(toggle);
    document.body.appendChild(scrim);
  }

  function initLandingPage() {
    const menuToggle = document.querySelector(".landing-menu-toggle");
    const nav = document.querySelector(".landing-nav");

    if (menuToggle && nav) {
      menuToggle.addEventListener("click", () => {
        const isOpen = document.body.classList.toggle("landing-nav-open");
        menuToggle.setAttribute("aria-expanded", String(isOpen));
        menuToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
      });

      nav.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
          document.body.classList.remove("landing-nav-open");
          menuToggle.setAttribute("aria-expanded", "false");
          menuToggle.setAttribute("aria-label", "Open navigation");
        });
      });
    }

    const revealItems = document.querySelectorAll(".reveal-on-scroll");
    if (!revealItems.length) return;

    if (!("IntersectionObserver" in window)) {
      revealItems.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16 });

    revealItems.forEach((item) => observer.observe(item));
  }
})();

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, onValue, remove, set } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// Firebase config (reuse your config)
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

// Helper for confirmation modal
function showArchiveModal(message, onConfirm) {
  const modal = document.getElementById('confirmation-modal');
  const modalMessage = document.getElementById('modal-message');
  const confirmBtn = document.getElementById('modal-confirm-btn');
  const cancelBtn = document.getElementById('modal-cancel-btn');
  modalMessage.textContent = message;
  modal.style.display = "flex";
  modal.style.zIndex = "10001";

  confirmBtn.onclick = null;
  cancelBtn.onclick = null;

  confirmBtn.onclick = () => {
    modal.style.display = "none";
    if (typeof onConfirm === "function") onConfirm();
  };
  cancelBtn.onclick = () => {
    modal.style.display = "none";
  };
}

function parseWeekRange(weekStr) {
  // Example: "Oct 13 - Oct 19, 2025"
  // Supports formats with or without year
  const match = weekStr.match(/^([A-Za-z]+)\s+(\d+)\s*-\s*([A-Za-z]+)?\s*(\d+),?\s*(\d{4})?$/);
  if (match) {
    // If both months are present, use the second; else use the first
    const month1 = match[1];
    const day1 = parseInt(match[2]);
    const month2 = match[3] || month1;
    const day2 = parseInt(match[4]);
    const year = parseInt(match[5]) || new Date().getFullYear();
    // Use the end date for sorting
    const monthNum = new Date(`${month2} 1, ${year}`).getMonth();
    return new Date(year, monthNum, day2).getTime();
  }
  // Fallback: try to parse just the year if present
  const yearMatch = weekStr.match(/(\d{4})$/);
  if (yearMatch) {
    return new Date(parseInt(yearMatch[1]), 0, 1).getTime();
  }
  return 0;
}

function parseMonthRange(monthStr) {
  // Example: "November 2025" or "Nov 2025"
  const match = monthStr.match(/^([A-Za-z]+)\s*(\d{4})$/);
  if (match) {
    const monthName = match[1];
    const year = parseInt(match[2]);
    const monthNum = new Date(`${monthName} 1, ${year}`).getMonth();
    return new Date(year, monthNum, 1).getTime();
  }
  return 0;
}

function parseYearRange(yearStr) {
  // Example: "2025"
  const year = parseInt(yearStr);
  if (!isNaN(year)) {
    return new Date(year, 0, 1).getTime();
  }
  return 0;
}

function showItemsBarChart(itemsData, title) {
  // Remove any previous chart
  let chartContainer = document.getElementById('card-items-chart-container');
  if (!chartContainer) {
    chartContainer = document.createElement('div');
    chartContainer.id = 'card-items-chart-container';
    chartContainer.style.margin = '32px auto 0 auto';
    chartContainer.style.maxWidth = '500px';
    chartContainer.style.background = '#fffbe6';
    chartContainer.style.borderRadius = '12px';
    chartContainer.style.boxShadow = '0 2px 16px rgba(0,0,0,0.07)';
    chartContainer.style.padding = '24px 18px';
    chartContainer.style.textAlign = 'center';
    document.getElementById('report-content').appendChild(chartContainer);
  }
  chartContainer.innerHTML = `<h3>${title}</h3>
    <canvas id="cardItemsChart" width="400" height="300" style="margin:24px auto;"></canvas>`;

  // Prepare chart data
  const labels = [];
  const percentages = [];
  if (itemsData) {
    Object.entries(itemsData).forEach(([name, obj]) => {
      labels.push(name);
      percentages.push(obj.percentage || 0);
    });
  }

  // Draw bar chart
  const ctx = document.getElementById('cardItemsChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Item Popularity (%)',
        data: percentages,
        backgroundColor: [
          '#1976d2', '#388e3c', '#fbc02d', '#d32f2f', '#7b1fa2', '#0288d1', '#c2185b'
        ]
      }]
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: title
        }
      },
      scales: {
        y: { beginAtZero: true, max: 100 }
      }
    }
  });
}

function showErrorModal(message) {
  const modal = document.getElementById('confirmation-modal');
  const modalMessage = document.getElementById('modal-message');
  const confirmBtn = document.getElementById('modal-confirm-btn');
  const cancelBtn = document.getElementById('modal-cancel-btn');
  modalMessage.textContent = message;
  modal.style.display = "flex";
  modal.style.zIndex = "10020"; // Make sure it's above overlays

  // Hide confirm button, only show cancel for error
  confirmBtn.style.display = "none";
  cancelBtn.textContent = "OK";
  cancelBtn.onclick = () => {
    modal.style.display = "none";
    confirmBtn.style.display = ""; // Restore for next use
    cancelBtn.textContent = "Cancel";
  };
}

function showItemsBarChartInForm(itemsData, title, container) {
  // Remove any previous chart in the form
  let chartContainer = container.querySelector('#form-items-chart-container');
  if (chartContainer) chartContainer.remove();

  chartContainer = document.createElement('div');
  chartContainer.id = 'form-items-chart-container';
  chartContainer.style.margin = '24px auto 0 auto';
  chartContainer.style.maxWidth = '400px';
  chartContainer.style.background = '#fffbe6';
  chartContainer.style.borderRadius = '12px';
  chartContainer.style.boxShadow = '0 2px 16px rgba(0,0,0,0.07)';
  chartContainer.style.padding = '18px 12px';
  chartContainer.style.textAlign = 'center';
  chartContainer.innerHTML = `<h4 style="margin-bottom:12px;">${title}</h4>
    <canvas id="formItemsChart" style="width:100%; height:260px;"></canvas>
`;
  container.appendChild(chartContainer);

  // Destroy previous Chart instance if exists (store on container)
  if (container._formItemsChartInstance) {
    container._formItemsChartInstance.destroy();
    container._formItemsChartInstance = null;
  }

  // Prepare chart data
  const labels = [];
  const percentages = [];
  if (itemsData) {
    Object.entries(itemsData).forEach(([name, obj]) => {
      labels.push(name);
      percentages.push(obj.percentage || 0);
    });
  }

  // Draw bar chart
  const ctx = chartContainer.querySelector('#formItemsChart').getContext('2d');
  container._formItemsChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Item Popularity (%)',
        data: percentages,
        backgroundColor: [
          '#1976d2', '#388e3c', '#fbc02d', '#d32f2f', '#7b1fa2', '#0288d1', '#c2185b'
        ]
      }]
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: false
        }
      },
      scales: {
        y: { beginAtZero: true, max: 100 }
      }
    }
  });
}

function renderWeeklyReport() {
  const reportContent = document.getElementById('report-content');
  reportContent.innerHTML = `<h3>Weekly Sales Report</h3>
    <button id="show-past-weekly-form" style="margin-bottom:18px; padding:10px 22px; border-radius:8px; background:#d0b273; color:#000; border:none; font-weight:bold; font-size:16px; cursor:pointer;">
      Select a Week Report
    </button>
    <div id="weekly-calendar" class="calendar-grid"></div>
    <p id="weekly-total" style="margin-top:16px;"></p>
    <div id="weekly-past-form-overlay" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; z-index:10010; align-items:center; justify-content:center; overflow:auto;">
      <div style="background:#fffbe6; border-radius:16px; box-shadow:0 4px 24px rgba(25,118,210,0.18); padding:32px 24px; max-width:340px; width:90%; margin:auto; position:relative; max-height:80vh; overflow-y:auto; border: 2px solid #bb8b23;">
        <button id="close-weekly-past-form" style="position:absolute; top:12px; right:16px; background:none; border:none; font-size:22px; color:#d32f2f; cursor:pointer;">&times;</button>
        <h3 style="margin-bottom:18px;">View a Week Report</h3>
        <form id="weekly-report-form" style="margin-bottom:24px;">
          <label for="week-input">Select Week:</label>
          <input type="week" id="week-input" name="week-input" style="margin:0 12px 0 8px; padding:6px 12px; border-radius:6px; border:1px solid #ccc;">
          <button type="submit" style="padding:8px 18px; border-radius:8px; background:#1976d2; color:#fff; border:none; cursor:pointer;">View Report</button>
        </form>
        <div id="weekly-report-result"></div>
      </div>
    </div>
    <p style="color:#1976d2;font-size:13px;margin-top:8px;"></p>`;

  // Remove any previous chart
  const oldChart = document.getElementById('card-items-chart-container');
  if (oldChart) oldChart.remove();

  // Overlay logic
  const overlay = document.getElementById('weekly-past-form-overlay');
  document.getElementById('show-past-weekly-form').onclick = () => {
    overlay.style.display = "flex";
  };
  document.getElementById('close-weekly-past-form').onclick = () => {
    overlay.style.display = "none";
    document.getElementById('weekly-report-result').innerHTML = "";
    // Remove chart in overlay
    const chart = overlay.querySelector('#form-items-chart-container');
    if (chart) chart.remove();
  };

  document.getElementById('weekly-report-form').onsubmit = function(e) {
    e.preventDefault();
    const weekValue = document.getElementById('week-input').value;
    if (!weekValue) return;

    // Parse weekValue (format: "YYYY-Www")
    const [year, weekNum] = weekValue.split('-W');
    if (!year || !weekNum) return;

    // Get current week/year
    const now = new Date();
    const currentYear = now.getFullYear();
    const getISOWeek = date => {
      const tempDate = new Date(date.getTime());
      tempDate.setHours(0, 0, 0, 0);
      tempDate.setDate(tempDate.getDate() + 4 - (tempDate.getDay() || 7));
      const yearStart = new Date(tempDate.getFullYear(), 0, 1);
      return Math.ceil((((tempDate - yearStart) / 86400000) + 1) / 7);
    };
    const currentWeekNum = getISOWeek(now);

    // Prevent selecting future week/year
    if (parseInt(year) > currentYear || (parseInt(year) === currentYear && parseInt(weekNum) > currentWeekNum)) {
      showErrorModal("You cannot select a future week.");
      return;
    }

    // Calculate start and end dates of the week
    const firstDayOfYear = new Date(year, 0, 1);
    const daysOffset = ((parseInt(weekNum) - 1) * 7) + (firstDayOfYear.getDay() <= 4 ? 1 - firstDayOfYear.getDay() : 8 - firstDayOfYear.getDay());
    const startDate = new Date(year, 0, 1 + daysOffset);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    // Format week range string (e.g., "Nov 10 - Nov 16, 2025")
    const weekRange = `${startDate.toLocaleString('en-US', { month: 'short' })} ${startDate.getDate()} - ${endDate.toLocaleString('en-US', { month: 'short' })} ${endDate.getDate()}, ${year}`;

    const weeklyRef = ref(database, `weekly/${weekRange}`);
    onValue(weeklyRef, (snapshot) => {
      const info = snapshot.val();
      const resultDiv = document.getElementById('weekly-report-result');
      resultDiv.innerHTML = ""; // Clear previous
      if (info) {
        resultDiv.innerHTML = `
          <div class="calendar-cell selected" style="margin:0 auto;">
            <div class="calendar-cell-header">${weekRange}</div>
            <div><strong>Orders:</strong> ${info.totalOrders || 0}</div>
            <div><strong>Sales:</strong> ₱${(info.totalSales || 0).toLocaleString(undefined, {minimumFractionDigits:2})}</div>
          </div>
        `;
        // Show bar chart for items if available
        if (info.items) {
          showItemsBarChartInForm(info.items, `Popular Items for ${weekRange}`, overlay.querySelector('.calendar-cell').parentNode);
        }
      } else {
        resultDiv.innerHTML = `
          <div class="calendar-cell selected" style="margin:0 auto;">
            <div class="calendar-cell-header">${weekRange}</div>
            <div style="color:#d32f2f; margin-top:12px;">No sales or orders within this week.</div>
          </div>
        `;
        // Remove chart if exists
        const chart = overlay.querySelector('#form-items-chart-container');
        if (chart) chart.remove();
      }
    }, { onlyOnce: true });
  };

  // ...existing weekly report logic...
  const weeklyRef = ref(database, 'weekly');
  onValue(weeklyRef, (snapshot) => {
    const data = snapshot.val();
    const calendar = document.getElementById('weekly-calendar');
    let totalSales = 0;
    let totalOrders = 0;
    calendar.innerHTML = "";
    if (data) {
      const sortedWeeks = Object.entries(data)
        .sort((a, b) => parseWeekRange(b[0]) - parseWeekRange(a[0]))
        .map(([week, info]) => ({ week, info }));

      sortedWeeks.forEach(({ week, info }) => {
        const card = document.createElement('div');
        card.className = 'calendar-card';
        card.innerHTML = `
          <div class="calendar-card-header">${week}</div>
          <div><strong>Orders:</strong> ${info.totalOrders || 0}</div>
          <div><strong>Sales:</strong> ₱${(info.totalSales || 0).toLocaleString(undefined, {minimumFractionDigits:2})}</div>
          <button class="archive-btn" title="Archive row" style="background:none;border:none;cursor:pointer;margin-top:8px;">
            <i class="fa fa-archive" style="color:#1976d2;font-size:18px;"></i>
          </button>
        `;
        card.querySelector('.archive-btn').onclick = () => {
          showArchiveModal(`Archive week "${week}"? You can restore it from weekly archive records.`, () => {
            const archiveRef = ref(database, `archive/weekly/${week}`);
            set(archiveRef, info).then(() => {
              remove(ref(database, `weekly/${week}`));
            });
          });
        };
        // Show bar chart for items when card is clicked
        card.onclick = (e) => {
          if (e.target.closest('.archive-btn')) return;
          showItemsBarChart(info.items, `Popular Items for ${week}`, card);
        };
        calendar.appendChild(card);
        totalSales += info.totalSales || 0;
        totalOrders += info.totalOrders || 0;
      });
      document.getElementById('weekly-total').innerHTML = `Total Weekly Sales: <strong>₱${totalSales.toLocaleString(undefined, {minimumFractionDigits:2})}</strong> | Total Orders: <strong>${totalOrders}</strong>`;
    } else {
      calendar.innerHTML = "<p>No weekly sales data.</p>";
      document.getElementById('weekly-total').innerHTML = "";
    }
  });
}

function renderMonthlyReport() {
  const reportContent = document.getElementById('report-content');
  reportContent.innerHTML = `<h3>Monthly Sales Report</h3>
    <button id="show-past-monthly-form" style="margin-bottom:18px; padding:10px 22px; border-radius:8px; background:#d0b273; color:#000; border:none; font-weight:bold; font-size:16px; cursor:pointer;">
      Select a Month Report
    </button>
    <div id="monthly-calendar" class="calendar-grid"></div>
    <p id="monthly-total" style="margin-top:16px;"></p>
    <div id="monthly-past-form-overlay" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; z-index:10010; align-items:center; justify-content:center; overflow:auto;">
      <div style="background:#fffbe6; border-radius:16px; box-shadow:0 4px 24px rgba(25,118,210,0.18); padding:32px 24px; max-width:340px; width:90%; margin:auto; position:relative; max-height:80vh; overflow-y:auto; border: 2px solid #bb8b23;">
        <button id="close-monthly-past-form" style="position:absolute; top:12px; right:16px; background:none; border:none; font-size:22px; color:#d32f2f; cursor:pointer;">&times;</button>
        <h3 style="margin-bottom:18px;">View a Month Report</h3>
        <form id="monthly-report-form" style="margin-bottom:24px;">
          <label for="month-input">Select Month:</label>
          <input type="month" id="month-input" name="month-input" style="margin:0 12px 0 8px; padding:6px 12px; border-radius:6px; border:1px solid #ccc;">
          <button type="submit" style="padding:8px 18px; border-radius:8px; background:#1976d2; color:#fff; border:none; cursor:pointer;">View Report</button>
        </form>
        <div id="monthly-report-result"></div>
      </div>
    </div>
    <p style="color:#1976d2;font-size:13px;margin-top:8px;"></p>`;

  // Remove any previous chart
  const oldChart = document.getElementById('card-items-chart-container');
  if (oldChart) oldChart.remove();

  // Overlay logic
  const overlay = document.getElementById('monthly-past-form-overlay');
  document.getElementById('show-past-monthly-form').onclick = () => {
    overlay.style.display = "flex";
  };
  document.getElementById('close-monthly-past-form').onclick = () => {
    overlay.style.display = "none";
    document.getElementById('monthly-report-result').innerHTML = "";
    // Remove chart in overlay
    const chart = overlay.querySelector('#form-items-chart-container');
    if (chart) chart.remove();
  };

  document.getElementById('monthly-report-form').onsubmit = function(e) {
    e.preventDefault();
    const monthValue = document.getElementById('month-input').value;
    if (!monthValue) return;

    // Parse monthValue (format: "YYYY-MM")
    const [year, monthNum] = monthValue.split('-');
    if (!year || !monthNum) return;

    // Get current year and month
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthNum = now.getMonth() + 1; // 1-based

    // Prevent selecting future month/year
    if (parseInt(year) > currentYear || (parseInt(year) === currentYear && parseInt(monthNum) > currentMonthNum)) {
      showErrorModal("You cannot select a future month.");
      return;
    }

    // Format month string (e.g., "November 2025")
    const monthName = new Date(year, parseInt(monthNum) - 1, 1).toLocaleString('en-US', { month: 'long' });
    const monthRange = `${monthName} ${year}`;

    const monthlyRef = ref(database, `monthly/${monthRange}`);
    onValue(monthlyRef, (snapshot) => {
      const info = snapshot.val();
      const resultDiv = document.getElementById('monthly-report-result');
      resultDiv.innerHTML = ""; // Clear previous
      if (info) {
        resultDiv.innerHTML = `
          <div class="calendar-cell selected" style="margin:0 auto;">
            <div class="calendar-cell-header">${monthRange}</div>
            <div><strong>Orders:</strong> ${info.totalOrders || 0}</div>
            <div><strong>Sales:</strong> ₱${(info.totalSales || 0).toLocaleString(undefined, {minimumFractionDigits:2})}</div>
          </div>
        `;
        // Show bar chart for items if available
        if (info.items) {
          showItemsBarChartInForm(info.items, `Popular Items for ${monthRange}`, overlay.querySelector('.calendar-cell').parentNode);
        }
      } else {
        resultDiv.innerHTML = `
          <div class="calendar-cell selected" style="margin:0 auto;">
            <div class="calendar-cell-header">${monthRange}</div>
            <div style="color:#d32f2f; margin-top:12px;">No sales or orders within this month.</div>
          </div>
        `;
        // Remove chart if exists
        const chart = overlay.querySelector('#form-items-chart-container');
        if (chart) chart.remove();
      }
    }, { onlyOnce: true });
  };

  // ...existing monthly report logic...
  const monthlyRef = ref(database, 'monthly');
  onValue(monthlyRef, (snapshot) => {
    const data = snapshot.val();
    const calendar = document.getElementById('monthly-calendar');
    let totalSales = 0;
    let totalOrders = 0;
    calendar.innerHTML = "";
    if (data) {
      const sortedMonths = Object.entries(data)
        .sort((a, b) => parseMonthRange(b[0]) - parseMonthRange(a[0]))
        .map(([month, info]) => ({ month, info }));

      sortedMonths.forEach(({ month, info }) => {
        const card = document.createElement('div');
        card.className = 'calendar-card';
        card.innerHTML = `
          <div class="calendar-card-header">${month}</div>
          <div><strong>Orders:</strong> ${info.totalOrders || 0}</div>
          <div><strong>Sales:</strong> ₱${(info.totalSales || 0).toLocaleString(undefined, {minimumFractionDigits:2})}</div>
          <button class="archive-btn" title="Archive row" style="background:none;border:none;cursor:pointer;margin-top:8px;">
            <i class="fa fa-archive" style="color:#1976d2;font-size:18px;"></i>
          </button>
        `;
        card.querySelector('.archive-btn').onclick = (e) => {
          e.stopPropagation();
          showArchiveModal(`Archive month "${month}"? You can restore it from monthly archive records.`, () => {
            const archiveRef = ref(database, `archive/monthly/${month}`);
            set(archiveRef, info).then(() => {
              remove(ref(database, `monthly/${month}`));
            });
          });
        };
        // Show bar chart for items when card is clicked
        card.onclick = (e) => {
          if (e.target.closest('.archive-btn')) return;
          showItemsBarChart(info.items, `Popular Items for ${month}`, card);
        };
        calendar.appendChild(card);
        totalSales += info.totalSales || 0;
        totalOrders += info.totalOrders || 0;
      });
      document.getElementById('monthly-total').innerHTML = `Total Monthly Sales: <strong>₱${totalSales.toLocaleString(undefined, {minimumFractionDigits:2})}</strong> | Total Orders: <strong>${totalOrders}</strong>`;
    } else {
      calendar.innerHTML = "<p>No monthly sales data.</p>";
      document.getElementById('monthly-total').innerHTML = "";
    }
  });
}

function renderAnnualReport() {
  const reportContent = document.getElementById('report-content');
  reportContent.innerHTML = `<h3>Annual Sales Report</h3>
    <button id="show-past-annual-form" style="margin-bottom:18px; padding:10px 22px; border-radius:8px; background:#d0b273; color:#000; border:none; font-weight:bold; font-size:16px; cursor:pointer;">
      Select an Annual Report
    </button>
    <div id="annual-calendar" class="calendar-grid"></div>
    <p id="annual-total" style="margin-top:16px;"></p>
    <div id="annual-past-form-overlay" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; z-index:10010; align-items:center; justify-content:center; overflow:auto;">
      <div style="background:#fffbe6; border-radius:16px; box-shadow:0 4px 24px rgba(25,118,210,0.18); padding:32px 24px; max-width:340px; width:90%; margin:auto; position:relative; max-height:80vh; overflow-y:auto; border: 2px solid #bb8b23;">
        <button id="close-annual-past-form" style="position:absolute; top:12px; right:16px; background:none; border:none; font-size:22px; color:#d32f2f; cursor:pointer;">&times;</button>
        <h3 style="margin-bottom:18px;">View an Annual Report</h3>
        <form id="annual-report-form" style="margin-bottom:24px;">
          <label for="year-input">Select Year:</label>
          <input type="number" id="year-input" name="year-input" min="2000" max="${new Date().getFullYear()}" style="margin:0 12px 0 8px; padding:6px 12px; border-radius:6px; border:1px solid #ccc; width:110px;">
          <button type="submit" style="padding:8px 18px; border-radius:8px; background:#1976d2; color:#fff; border:none; cursor:pointer;">View Report</button>
        </form>
        <div id="annual-report-result"></div>
      </div>
    </div>
    <p style="color:#1976d2;font-size:13px;margin-top:8px;"></p>`;

  // Overlay logic
  const overlay = document.getElementById('annual-past-form-overlay');
  document.getElementById('show-past-annual-form').onclick = () => {
    overlay.style.display = "flex";
  };
  document.getElementById('close-annual-past-form').onclick = () => {
    overlay.style.display = "none";
    document.getElementById('annual-report-result').innerHTML = "";
  };

  document.getElementById('annual-report-form').onsubmit = function(e) {
    e.preventDefault();
    const yearValue = document.getElementById('year-input').value;
    if (!yearValue) return;

    // Prevent selecting future year
    const now = new Date();
    const currentYear = now.getFullYear();
    if (parseInt(yearValue) > currentYear) {
      showErrorModal("You cannot select a future year.");
      return;
    }

    const annualRef = ref(database, `yearly/${yearValue}`);
    onValue(annualRef, (snapshot) => {
      const info = snapshot.val();
      const resultDiv = document.getElementById('annual-report-result');
      resultDiv.innerHTML = ""; // Clear previous
      if (info) {
        resultDiv.innerHTML = `
          <div class="calendar-cell selected" style="margin:0 auto;">
            <div class="calendar-cell-header">${yearValue}</div>
            <div><strong>Orders:</strong> ${info.totalOrders || 0}</div>
            <div><strong>Sales:</strong> ₱${(info.totalSales || 0).toLocaleString(undefined, {minimumFractionDigits:2})}</div>
          </div>
        `;
      } else {
        resultDiv.innerHTML = `
          <div class="calendar-cell selected" style="margin:0 auto;">
            <div class="calendar-cell-header">${yearValue}</div>
            <div style="color:#d32f2f; margin-top:12px;">No sales or orders within this year.</div>
          </div>
        `;
      }
    }, { onlyOnce: true });
  };

  // ...existing annual report logic...
  const annualRef = ref(database, 'yearly');
  onValue(annualRef, (snapshot) => {
    const data = snapshot.val();
    const calendar = document.getElementById('annual-calendar');
    let totalSales = 0;
    let totalOrders = 0;
    calendar.innerHTML = "";
    if (data) {
      // Sort years by date (latest to oldest)
      const sortedYears = Object.entries(data)
        .sort((a, b) => parseYearRange(b[0]) - parseYearRange(a[0]))
        .map(([year, info]) => ({ year, info }));

      sortedYears.forEach(({ year, info }) => {
        const card = document.createElement('div');
        card.className = 'calendar-card';
        card.innerHTML = `
          <div class="calendar-card-header">${year}</div>
          <div><strong>Orders:</strong> ${info.totalOrders || 0}</div>
          <div><strong>Sales:</strong> ₱${(info.totalSales || 0).toLocaleString(undefined, {minimumFractionDigits:2})}</div>
          <button class="archive-btn" title="Archive row" style="background:none;border:none;cursor:pointer;margin-top:8px;">
            <i class="fa fa-archive" style="color:#1976d2;font-size:18px;"></i>
          </button>
        `;
        card.querySelector('.archive-btn').onclick = () => {
          showArchiveModal(`Archive year "${year}"? You can restore it from annual archive records.`, () => {
            const archiveRef = ref(database, `archive/yearly/${year}`);
            set(archiveRef, info).then(() => {
              remove(ref(database, `yearly/${year}`));
            });
          });
        };
        calendar.appendChild(card);
        totalSales += info.totalSales || 0;
        totalOrders += info.totalOrders || 0;
      });
      document.getElementById('annual-total').innerHTML = `Total Annual Sales: <strong>₱${totalSales.toLocaleString(undefined, {minimumFractionDigits:2})}</strong> | Total Orders: <strong>${totalOrders}</strong>`;
    } else {
      calendar.innerHTML = "<p>No annual sales data.</p>";
      document.getElementById('annual-total').innerHTML = "";
    }
  });
}

function renderAnalyticsReport() {
  const reportContent = document.getElementById('report-content');
  reportContent.innerHTML = `<h3>Analytics Report</h3>
    <ul id="analytics-list" style="display:inline-block; text-align:left;">
      <li><strong>Most Popular Item:</strong> <span id="popular-item">Loading...</span></li>
      <li><strong>GCash Usage Rate:</strong> <span id="gcash-rate">Loading...</span></li>
      <li><strong>Cash Usage Rate:</strong> <span id="cash-rate">Loading...</span></li>
      <li><strong>Total Number of Users:</strong> <span id="user-count">Loading...</span></li>
    </ul>
    <canvas id="popularItemChart" width="400" height="300" style="margin:24px auto;"></canvas>
    <canvas id="paymentUsageChart" width="400" height="300" style="margin:24px auto;"></canvas>
    <canvas id="orderTypeChart" width="400" height="300" style="margin:24px auto;"></canvas>
  `;

  // --- Count users in users node ---
  const usersRef = ref(database, 'users');
  onValue(usersRef, (snapshot) => {
    const users = snapshot.val();
    let count = 0;
    if (users) {
      count = Object.keys(users).length;
    }
    document.getElementById('user-count').textContent = count;
  }, { onlyOnce: true });

  // ...existing analytics, usage, and order type chart logic...
  // (leave the rest of renderAnalyticsReport unchanged)
  // Popular Item Chart
  const analyticsRef = ref(database, 'analytics/items');
  onValue(analyticsRef, (snapshot) => {
    const data = snapshot.val();
    let popularName = "N/A";
    let popularPercent = 0;
    const labels = [];
    const percentages = [];
    if (data) {
      Object.entries(data).forEach(([name, obj]) => {
        labels.push(name);
        percentages.push(obj.percentage || 0);
        if ((obj.percentage || 0) > popularPercent) {
          popularName = name;
          popularPercent = obj.percentage || 0;
        }
      });
    }
    document.getElementById('popular-item').textContent = `${popularName} (${popularPercent}%)`;

    // Change chart type from 'doughnut' (pie) to 'bar'
    const ctx = document.getElementById('popularItemChart').getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Item Popularity (%)',
          data: percentages,
          backgroundColor: [
            '#1976d2', '#388e3c', '#fbc02d', '#d32f2f', '#7b1fa2', '#0288d1', '#c2185b'
          ]
        }]
      },
      options: {
        plugins: {
          title: {
            display: true,
            text: 'Most Popular Items (%)'
          }
        },
        scales: {
          y: { beginAtZero: true, max: 100 }
        }
      }
    });
  }, { onlyOnce: true });

  // Payment Usage Chart
  const usageRef = ref(database, 'usagerate');
  onValue(usageRef, (snapshot) => {
    const data = snapshot.val();
    document.getElementById('gcash-rate').textContent = data?.gcash?.rate !== undefined ? `${data.gcash.rate}%` : "0%";
    document.getElementById('cash-rate').textContent = data?.cash?.rate !== undefined ? `${data.cash.rate}%` : "0%";

    // Draw chart
    const ctx = document.getElementById('paymentUsageChart').getContext('2d');
    new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['GCash', 'Cash'],
        datasets: [{
          label: 'Payment Usage Rate',
          data: [data?.gcash?.rate || 0, data?.cash?.rate || 0],
          backgroundColor: ['#1976d2', '#fbc02d']
        }]
      },
      options: {
        plugins: {
          title: {
            display: true,
            text: 'Payment Method Usage Rate (%)'
          }
        }
      }
    });
  }, { onlyOnce: true });

  // Order Type Chart
  const otRef = ref(database, 'otpercentage');
  onValue(otRef, (snapshot) => {
    const data = snapshot.val();
    const list = document.getElementById('analytics-list');
    const labels = [];
    const percentages = [];
    if (data) {
      ["dine-in", "take-out", "pickup"].forEach(type => {
        const percent = data[type]?.percentage ?? 0;
        const li = document.createElement('li');
        li.innerHTML = `<strong>${type.charAt(0).toUpperCase() + type.slice(1)} Orders:</strong> ${percent}%`;
        list.appendChild(li);
        labels.push(type.charAt(0).toUpperCase() + type.slice(1));
        percentages.push(percent);
      });
    }
    // Draw chart
    const ctx = document.getElementById('orderTypeChart').getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Order Type (%)',
          data: percentages,
          backgroundColor: ['#388e3c', '#fbc02d', '#d32f2f']
        }]
      },
      options: {
        plugins: {
          title: {
            display: true,
            text: 'Order Type Percentage (%)'
          }
        },
        scales: {
          y: { beginAtZero: true, max: 100 }
        }
      }
    });
  }, { onlyOnce: true });
}


function renderArchiveRecords() {
  const reportContent = document.getElementById('report-content');
  reportContent.innerHTML = `<h3>Archived Records</h3>
    <div style="margin-bottom:18px;">
      <button id="show-weekly-archive" style="margin:6px 8px 6px 0;padding:8px 18px;border-radius:8px;background:#1976d2;color:#fff;border:none;cursor:pointer;">Show Weekly Archive</button>
      <button id="show-monthly-archive" style="margin:6px 8px 6px 0;padding:8px 18px;border-radius:8px;background:#1976d2;color:#fff;border:none;cursor:pointer;">Show Monthly Archive</button>
      <button id="show-annual-archive" style="margin:6px 8px 6px 0;padding:8px 18px;border-radius:8px;background:#1976d2;color:#fff;border:none;cursor:pointer;">Show Annual Archive</button>
    </div>
    <div id="archive-table-container"></div>
    <p style="color:#1976d2;font-size:13px;margin-top:8px;">
      <b>To restore, click the restore button beside the record.<br>
      Restored records will reappear in their respective report.</b>
    </p>`;

  function renderArchiveTable(type) {
    const container = document.getElementById('archive-table-container');
    container.innerHTML = `<p style="color:#888;">Loading ${type} archive...</p>`;
    const archiveRef = ref(database, `archive/${type}`);
    onValue(archiveRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        container.innerHTML = `<p style="color:#d9534f;">No archived ${type} records found.</p>`;
        return;
      }
      let tableHtml = `<table style="margin:0 auto;border-collapse:collapse;"><tr style="background:#f5f5f5;">`;
      if (type === "weekly") {
        tableHtml += `<th>Week</th><th>Total Orders</th><th>Total Sales</th><th>Restore</th><th>Delete</th></tr>`;
        Object.entries(data).sort((a, b) => {
          function parseWeek(str) {
            const match = str.match(/^([A-Za-z]+)\s+(\d+)-(\d+)$/);
            if (!match) return 0;
            const monthName = match[1];
            const endDay = parseInt(match[3]);
            const year = new Date().getFullYear();
            const monthNum = new Date(`${monthName} 1, ${year}`).getMonth();
            return new Date(year, monthNum, endDay).getTime();
          }
          return parseWeek(b[0]) - parseWeek(a[0]);
        }).forEach(([week, info]) => {
          tableHtml += `<tr>
            <td>${week}</td>
            <td>${info.totalOrders || 0}</td>
            <td>₱${(info.totalSales || 0).toLocaleString(undefined, {minimumFractionDigits:2})}</td>
            <td>
              <button class="restore-btn" data-key="${week}" style="background:none;border:none;cursor:pointer;">
                <i class="fa fa-undo" style="color:#388e3c;font-size:18px;" title="Restore"></i>
              </button>
            </td>
            <td>
              <button class="delete-archive-btn" data-key="${week}" style="background:none;border:none;cursor:pointer;">
                <i class="fa fa-trash" style="color:#d32f2f;font-size:18px;" title="Delete"></i>
              </button>
            </td>
          </tr>`;
        });
      } else if (type === "monthly") {
        tableHtml += `<th>Month</th><th>Total Orders</th><th>Total Sales</th><th>Restore</th><th>Delete</th></tr>`;
        Object.entries(data).forEach(([month, info]) => {
          tableHtml += `<tr>
            <td>${month}</td>
            <td>${info.totalOrders || 0}</td>
            <td>₱${(info.totalSales || 0).toLocaleString(undefined, {minimumFractionDigits:2})}</td>
            <td>
              <button class="restore-btn" data-key="${month}" style="background:none;border:none;cursor:pointer;">
                <i class="fa fa-undo" style="color:#388e3c;font-size:18px;" title="Restore"></i>
              </button>
            </td>
            <td>
              <button class="delete-archive-btn" data-key="${month}" style="background:none;border:none;cursor:pointer;">
                <i class="fa fa-trash" style="color:#d32f2f;font-size:18px;" title="Delete"></i>
              </button>
            </td>
          </tr>`;
        });
      } else if (type === "yearly") {
        tableHtml += `<th>Year</th><th>Total Orders</th><th>Total Sales</th><th>Restore</th><th>Delete</th></tr>`;
        Object.entries(data).forEach(([year, info]) => {
          tableHtml += `<tr>
            <td>${year}</td>
            <td>${info.totalOrders || 0}</td>
            <td>₱${(info.totalSales || 0).toLocaleString(undefined, {minimumFractionDigits:2})}</td>
            <td>
              <button class="restore-btn" data-key="${year}" style="background:none;border:none;cursor:pointer;">
                <i class="fa fa-undo" style="color:#388e3c;font-size:18px;" title="Restore"></i>
              </button>
            </td>
            <td>
              <button class="delete-archive-btn" data-key="${year}" style="background:none;border:none;cursor:pointer;">
                <i class="fa fa-trash" style="color:#d32f2f;font-size:18px;" title="Delete"></i>
              </button>
            </td>
          </tr>`;
        });
      }
      tableHtml += `</table>`;
      container.innerHTML = tableHtml;

      // Restore button logic
      Array.from(container.querySelectorAll('.restore-btn')).forEach(btn => {
        btn.onclick = () => {
          const key = btn.getAttribute('data-key');
          const record = data[key];
          if (!key || !record) return;
          set(ref(database, `${type}/${key}`), record).then(() => {
            remove(ref(database, `archive/${type}/${key}`)).then(() => {
              renderArchiveTable(type);
            });
          });
        };
      });

      // Delete button logic with confirmation
      Array.from(container.querySelectorAll('.delete-archive-btn')).forEach(btn => {
        btn.onclick = () => {
          const key = btn.getAttribute('data-key');
          if (!key) return;
          showArchiveModal(
            `Are you sure you want to permanently delete this archived record? This action cannot be undone.`,
            () => {
              remove(ref(database, `archive/${type}/${key}`)).then(() => {
                renderArchiveTable(type);
              });
            }
          );
        };
      });

    }, { onlyOnce: true });
  }

  document.getElementById('show-weekly-archive').onclick = () => renderArchiveTable('weekly');
  document.getElementById('show-monthly-archive').onclick = () => renderArchiveTable('monthly');
  document.getElementById('show-annual-archive').onclick = () => renderArchiveTable('yearly');
}


document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('view-analytics-report').addEventListener('click', renderAnalyticsReport);
  document.getElementById('view-weekly-report').addEventListener('click', renderWeeklyReport);
  document.getElementById('view-monthly-report').addEventListener('click', renderMonthlyReport);
  document.getElementById('view-annual-report').addEventListener('click', renderAnnualReport);
  document.getElementById('view-archive-records').addEventListener('click', renderArchiveRecords);

  // Optionally, show weekly report by default
  renderAnalyticsReport();
});
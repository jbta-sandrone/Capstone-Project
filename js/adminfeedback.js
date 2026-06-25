import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getDatabase, ref, onValue, remove } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAmg4q4LmjqA8DHK1zY4yV8OCRvtAWJeO4",
  authDomain: "cliq-8dba8.firebaseapp.com",
  projectId: "cliq-8dba8",
  storageBucket: "cliq-8dba8.appspot.com",
  messagingSenderId: "545738539503",
  appId: "1:545738539503:web:16560a7ac4cb3e3af0361a",
  databaseURL: "https://cliq-8dba8-default-rtdb.firebaseio.com/"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

function renderStars(rating) {
    let html = "";
    for (let i = 1; i <= 5; i++) {
        html += `<i class="fas fa-star" style="color:${i <= rating ? "#FFD700" : "#ccc"}; margin-right:2px;"></i>`;
    }
    return html;
}

function showSuccess(message, isError = false) {
    const successDiv = document.getElementById('success');
    if (!successDiv) return;
    successDiv.textContent = message;
    successDiv.style.display = "block";
    successDiv.style.background = isError ? "#d9534f" : "#28a745";
    successDiv.style.color = "#fff";
    successDiv.style.opacity = "1";
    successDiv.style.zIndex = "9999";
    setTimeout(() => {
        successDiv.style.opacity = "0";
        setTimeout(() => { successDiv.style.display = "none"; }, 400);
    }, 2000);
}

function showDeleteModal(feedbackKey) {
    const modal = document.getElementById('confirmation-modal');
    const modalMessage = document.getElementById('modal-message');
    const confirmBtn = document.getElementById('modal-confirm-btn');
    const cancelBtn = document.getElementById('modal-cancel-btn');

    modalMessage.textContent = "Are you sure you want to delete this record?";
    modal.style.display = "flex";
    modal.style.zIndex = "10001";

    // Remove previous listeners
    confirmBtn.onclick = null;
    cancelBtn.onclick = null;

    confirmBtn.onclick = async function() {
        try {
            await remove(ref(database, `feedback/${feedbackKey}`));
            modal.style.display = "none";
            showSuccess("Deleted successfully!");
        } catch (error) {
            modal.style.display = "none";
            showSuccess("Failed to delete feedback.", true);
        }
    };

    cancelBtn.onclick = function() {
        modal.style.display = "none";
    };
}

function displayCustomerFeedback() {
    const entriesDiv = document.getElementById('customer-entries');
    entriesDiv.innerHTML = "<p>Loading...</p>";

    const feedbackRef = ref(database, `feedback`);
    onValue(feedbackRef, (snapshot) => {
        entriesDiv.innerHTML = "";
        const data = snapshot.val();
        if (data) {
            // Show most recent first
            const feedbackArray = Object.entries(data).sort((a, b) => (b[1].date || "").localeCompare(a[1].date || ""));
            feedbackArray.forEach(([key, entry]) => {
                let dateStr = entry.date ? entry.date.split("T")[0] : "";
                const entryDiv = document.createElement('div');
                entryDiv.className = "feedback-entry";
                entryDiv.style.position = "relative";
                
                entryDiv.innerHTML = `
                    <div><strong>Name:</strong> ${entry.name || "Anonymous"}</div>
                    <div><strong>Date:</strong> ${dateStr}</div>
                    <div><strong>Rating:</strong> ${renderStars(entry.rating)}</div>
                    <div><strong>Message:</strong> ${entry.message}</div>
                    ${entry.image ? `
                        <div class="view-image-toggle" style="margin:8px -5px;">
                            <button class="toggle-img-btn" style="background:none;border:none;cursor:pointer;font-size:18px;color:#1976d2;display:flex;align-items:center;gap:6px;">
                                <span style="font-weight:bold;">View Image</span>
                                <i class="fas fa-chevron-down"></i>
                            </button>
                            <div class="feedback-img-container" style="display:none;margin-top:8px;">
                                <img src="${entry.image}" alt="Feedback Image" style="width: 90%; max-width:500px;height:auto;border-radius:8px;">
                            </div>
                        </div>
                    ` : ""}
                    <button class="delete-feedback" title="Delete Feedback" style="position:absolute;top:10px;right:10px;background:none;border:none;cursor:pointer;font-size:1.2em;color:#f93c35;">
                        <i class="fas fa-trash"></i>
                    </button>
                    <div style="margin-top:5px; border-bottom:1px solid #ccc;"></div>
                `;
                // Add toggle event for image
                if (entry.image) {
                    const toggleBtn = entryDiv.querySelector('.toggle-img-btn');
                    const imgContainer = entryDiv.querySelector('.feedback-img-container');
                    let open = false;
                    toggleBtn.addEventListener('click', function() {
                        open = !open;
                        imgContainer.style.display = open ? "block" : "none";
                        toggleBtn.querySelector('i').className = open ? "fas fa-chevron-up" : "fas fa-chevron-down";
                        toggleBtn.querySelector('span').textContent = open ? "Hide Image" : "View Image";
                    });
                }
                // Add delete event
                const deleteBtn = entryDiv.querySelector('.delete-feedback');
                deleteBtn.addEventListener('click', function() {
                    showDeleteModal(key);
                });
                entriesDiv.appendChild(entryDiv);
            });
        } else {
            entriesDiv.innerHTML = "<p>No feedback yet.</p>";
        }
    });
}

displayCustomerFeedback();
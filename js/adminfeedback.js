import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
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
const auth = getAuth(app);

function waitForCurrentUser() {
    if (auth.currentUser) return Promise.resolve(auth.currentUser);

    return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe();
            resolve(user);
        });
    });
}

function renderStars(rating) {
    let html = "";
    for (let i = 1; i <= 5; i++) {
        html += `<i class="fas fa-star" style="color:${i <= rating ? "#FFD700" : "#ccc"}; margin-right:2px;"></i>`;
    }
    return html;
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
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
            const user = await waitForCurrentUser();
            if (!user) {
                console.warn(`Firebase write blocked: delete feedback at "feedback/${feedbackKey}" requires an authenticated Firebase user.`);
                modal.style.display = "none";
                showSuccess("Please log in with an authenticated admin account before deleting feedback.", true);
                return;
            }
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

function createAdminFeedbackCard(entry, key) {
    const entryDiv = document.createElement('article');
    entryDiv.className = 'feedback-card';
    const dateStr = entry.date ? entry.date.split('T')[0] : 'Unknown date';
    entryDiv.innerHTML = `
        <div class="feedback-card__head">
            <div>
                <h3>${escapeHtml(entry.name || 'Anonymous')}</h3>
                <div class="feedback-card__meta">${escapeHtml(dateStr)}</div>
            </div>
            <div class="feedback-card__actions">
                <button class="delete-feedback" title="Delete Feedback" type="button">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <div class="feedback-card__rating">${renderStars(entry.rating)}</div>
        <p class="feedback-card__message">${escapeHtml(entry.message || '')}</p>
        ${entry.image ? `
            <div class="view-image-toggle">
                <button class="toggle-img-btn" type="button">
                    <span>View image</span>
                    <i class="fas fa-chevron-down"></i>
                </button>
                <div class="feedback-img-container" style="display:none;">
                    <img src="${entry.image}" alt="Feedback image">
                </div>
            </div>
        ` : ''}
    `;

    if (entry.image) {
        const toggleBtn = entryDiv.querySelector('.toggle-img-btn');
        const imgContainer = entryDiv.querySelector('.feedback-img-container');
        let open = false;
        toggleBtn.addEventListener('click', function() {
            open = !open;
            imgContainer.style.display = open ? 'block' : 'none';
            toggleBtn.querySelector('i').className = open ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
            toggleBtn.querySelector('span').textContent = open ? 'Hide image' : 'View image';
        });
    }

    const deleteBtn = entryDiv.querySelector('.delete-feedback');
    deleteBtn.addEventListener('click', function() {
        showDeleteModal(key);
    });

    return entryDiv;
}

function displayCustomerFeedback() {
    const entriesDiv = document.getElementById('customer-entries');
    entriesDiv.innerHTML = '<div class="feedback-state">Loading feedback…</div>';

    const feedbackRef = ref(database, `feedback`);
    onValue(feedbackRef, (snapshot) => {
        entriesDiv.innerHTML = "";
        const data = snapshot.val();
        if (data) {
            const feedbackArray = Object.entries(data).sort((a, b) => (b[1].date || "").localeCompare(a[1].date || ""));
            feedbackArray.forEach(([key, entry]) => {
                entriesDiv.appendChild(createAdminFeedbackCard(entry, key));
            });
        } else {
            entriesDiv.innerHTML = '<div class="feedback-state">No feedback yet. New customer messages will appear here.</div>';
        }
    });
}

displayCustomerFeedback();

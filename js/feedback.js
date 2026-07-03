import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getDatabase, ref, push, set, onValue, remove, get, child } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

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

const CLOUD_NAME = "drhczlmtf";      // ✅ your cloud name
const UPLOAD_PRESET = "cliq_preset"; // ✅ your unsigned preset

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

const fileInput = document.getElementById('feedback-image');
const fileNameSpan = document.getElementById('file-name');


fileInput.addEventListener('change', function() {
    if (fileInput.files && fileInput.files[0]) {
        fileNameSpan.textContent = fileInput.files[0].name;
    } else {
        fileNameSpan.textContent = "";
    }
    // Do NOT reset fileInput.value here!
});

// --- Star Rating Logic ---
const stars = document.querySelectorAll('#star-rating .fa-star');
let selectedRating = 0;

stars.forEach(star => {
    star.addEventListener('mouseover', function() {
        const val = parseInt(this.getAttribute('data-value'));
        stars.forEach((s, i) => {
            s.classList.toggle('hovered', i < val);
        });
    });
    star.addEventListener('mouseout', function() {
        stars.forEach((s, i) => {
            s.classList.remove('hovered');
        });
    });
    star.addEventListener('click', function() {
        selectedRating = parseInt(this.getAttribute('data-value'));
        stars.forEach((s, i) => {
            s.classList.toggle('selected', i < selectedRating);
        });
    });
});

// --- Submit Feedback Logic ---
document.querySelector('.submit-feedback').addEventListener('click', function() {
    const storedUserUid = localStorage.getItem("userUid");
    const feedbackMessage = document.getElementById('feedback-message').value.trim();
    const imageInput = document.getElementById('feedback-image');
    let imageUrl = "";

    if (!storedUserUid) {
        showSuccess("You are not logged in.", true);
        return;
    }
    if (selectedRating === 0) {
        showSuccess("Please select a star rating.", true);
        return;
    }
    if (!feedbackMessage) {
        showSuccess("Please enter your feedback message.", true);
        return;
    }

    // Show confirmation modal before submitting
    const modal = document.getElementById('confirmation-modal');
    const modalMessage = document.getElementById('modal-message');
    const confirmBtn = document.getElementById('modal-confirm-btn');
    const cancelBtn = document.getElementById('modal-cancel-btn');

    modalMessage.textContent = "Are you sure you want to submit your feedback?";
    modal.style.display = "flex";
    modal.style.zIndex = "10001";

    // Remove previous listeners
    confirmBtn.onclick = null;
    cancelBtn.onclick = null;

    confirmBtn.onclick = async function() {
        modal.style.display = "none";
        const authUser = await waitForCurrentUser();
        if (!authUser) {
            console.warn('Firebase write blocked: submit feedback at "users/{uid}/feedback" and "feedback" requires an authenticated Firebase user.');
            showSuccess("Please log in again before submitting feedback.", true);
            return;
        }
        const userUid = authUser.uid;
        localStorage.setItem("userUid", userUid);

        // --- Upload image to Cloudinary if present ---
        if (imageInput.files && imageInput.files[0]) {
            const file = imageInput.files[0];
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", UPLOAD_PRESET);

            try {
                const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
                    method: "POST",
                    body: formData
                });
                const data = await response.json();
                imageUrl = data.secure_url || "";
            } catch (err) {
                showSuccess("Image upload failed. Try again.", true);
                return;
            }
        }

        const feedbackRef = ref(database, `users/${userUid}/feedback`);
        const newFeedbackEntry = push(feedbackRef);

        const feedbackData = {
            rating: selectedRating,
            message: feedbackMessage,
            date: new Date().toISOString(),
            image: imageUrl // store image URL if present
        };

        try {
            // Save to user's feedback node
            await set(newFeedbackEntry, feedbackData);

            // Fetch user name for global feedback
            const userSnap = await get(child(ref(database), `users/${userUid}`));
            let displayName = "Anonymous";
            if (userSnap.exists() && userSnap.val().username) {
                const username = userSnap.val().username;
                // Mask: first 2 letters + asterisks
                if (username.length > 2) {
                    displayName = username.slice(0, 2) + "*".repeat(username.length - 2);
                } else {
                    displayName = username[0] + "*";
                }
            }

            // Save to global feedback node
            const globalFeedbackRef = ref(database, `feedback`);
            const newGlobalFeedbackEntry = push(globalFeedbackRef);
            await set(newGlobalFeedbackEntry, {
                ...feedbackData,
                name: displayName
            });

            showSuccess("Feedback submitted successfully!");
document.getElementById('feedback-message').value = "";
imageInput.value = ""; // <-- clear file input
fileNameSpan.textContent = ""; // <-- clear file name display
stars.forEach(s => s.classList.remove('selected'));
selectedRating = 0;
        } catch (error) {
            showSuccess("Failed to submit feedback. Please try again.", true);
            console.error(`Firebase write failed: submit feedback at "users/${userUid}/feedback" or "feedback"`, error);
        }
    };

    cancelBtn.onclick = function() {
        modal.style.display = "none";
    };
});

// --- Overlay Message Function ---
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
    }, 2500);
}

// --- Fetch and Display Feedback Entries ---
function renderStars(rating) {
    let html = "";
    for (let i = 1; i <= 5; i++) {
        html += `<i class="fas fa-star" style="color:${i <= rating ? "#FFD700" : "#ccc"}; margin-right:2px;"></i>`;
    }
    return html;
}

function createEntryCard(entry, key, userUid) {
    const entryDiv = document.createElement('article');
    entryDiv.className = 'feedback-card';
    const dateStr = entry.date ? entry.date.split('T')[0] : 'Unknown date';
    entryDiv.innerHTML = `
        <div class="feedback-card__head">
            <div>
                <h3>${escapeHtml(entry.title || 'Feedback')}</h3>
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
        showDeleteModal(userUid, key);
    });

    return entryDiv;
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function displayFeedbackEntries() {
    const userUid = localStorage.getItem("userUid");
    if (!userUid) {
        const entriesDiv = document.getElementById('feedback-entries');
        if (entriesDiv) {
            entriesDiv.innerHTML = '<div class="feedback-state">Please sign in to view your submitted feedback.</div>';
        }
        return;
    }
    const feedbackRef = ref(database, `users/${userUid}/feedback`);
    const entriesDiv = document.getElementById('feedback-entries');
    entriesDiv.innerHTML = '<div class="feedback-state">Loading your feedback…</div>';

    onValue(feedbackRef, (snapshot) => {
        entriesDiv.innerHTML = "";
        const data = snapshot.val();
        if (data) {
            const feedbackArray = Object.entries(data).sort((a, b) => (b[1].date || "").localeCompare(a[1].date || ""));
            feedbackArray.forEach(([key, entry]) => {
                entriesDiv.appendChild(createEntryCard(entry, key, userUid));
            });
        } else {
            entriesDiv.innerHTML = '<div class="feedback-state">You have not shared any feedback yet.</div>';
        }
    });
}

// --- Delete Modal Logic ---
function showDeleteModal(userUid, feedbackKey) {
    const modal = document.getElementById('confirmation-modal');
    const modalMessage = document.getElementById('modal-message');
    const confirmBtn = document.getElementById('modal-confirm-btn');
    const cancelBtn = document.getElementById('modal-cancel-btn');

    modalMessage.textContent = "Are you sure you want to delete this feedback?";
    modal.style.display = "flex";
    modal.style.zIndex = "10001";

    // Remove previous listeners
    confirmBtn.onclick = null;
    cancelBtn.onclick = null;

    confirmBtn.onclick = async function() {
        try {
            const authUser = await waitForCurrentUser();
            if (!authUser) {
                console.warn(`Firebase write blocked: delete feedback at "users/${userUid}/feedback/${feedbackKey}" requires an authenticated Firebase user.`);
                modal.style.display = "none";
                showSuccess("Please log in again before deleting feedback.", true);
                return;
            }
            const authenticatedUid = authUser.uid;
            localStorage.setItem("userUid", authenticatedUid);
            await remove(ref(database, `users/${authenticatedUid}/feedback/${feedbackKey}`));
            modal.style.display = "none";
            showSuccess("Feedback deleted successfully!");
        } catch (error) {
            modal.style.display = "none";
            showSuccess("Failed to delete feedback.", true);
            console.error(`Firebase write failed: delete feedback at "users/${userUid}/feedback/${feedbackKey}"`, error);
        }
    };

    cancelBtn.onclick = function() {
        modal.style.display = "none";
    };
}

displayFeedbackEntries();

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getDatabase,
  ref,
  get,
  child
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";
import {
  getAuth,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

// Firebase Config
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

// --- Fetch & Display Admin Profile Info ---
function fetchAndDisplayAdminProfile() {
  const userUid = localStorage.getItem("userUid");
  if (!userUid) return;

  const dbRef = ref(database);
  get(child(dbRef, `users/${userUid}`))
    .then((snapshot) => {
      if (snapshot.exists()) {
        const adminData = snapshot.val();
        if (adminData.role === "admin") {
          document.getElementById("profile-name").textContent = adminData.username || "";
          document.getElementById("profile-email").textContent = adminData.email || "";
          document.getElementById("profile-phone").textContent = adminData.phone || "";
          // Store admin UID for username change
          window.currentAdminUid = userUid;
        }
      }
    })
    .catch((error) => {
      console.error("Error fetching admin profile data:", error);
    });
}

document.addEventListener("DOMContentLoaded", fetchAndDisplayAdminProfile);

// --- Change Username Overlay for Admin ---
function showChangeUsernameOverlay() {
  let overlay = document.getElementById("change-username-overlay");
  if (overlay) overlay.remove();

  overlay = document.createElement("div");
  overlay.id = "change-username-overlay";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100vw";
  overlay.style.height = "100vh";
  overlay.style.background = "rgba(0,0,0,0.5)";
  overlay.style.display = "flex";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";
  overlay.style.zIndex = "99999";

  overlay.innerHTML = `
    <form id="change-username-form" class="change-username-form" style="background:#fffbe6;border-radius:12px;padding:32px 24px;min-width:320px;max-width:90vw;box-shadow:0 2px 16px rgba(0,0,0,0.15);position:relative; margin: 10px;">
      <h2 style="margin-top:0;">Change Username</h2>
      <label>New Username</label>
      <input type="text" id="new-username" required style="width:90%;padding:8px;margin-bottom:15px;border-radius:6px;border:1px solid #ccc;">
      <button type="submit" id="submit-change-username" style="background:#d0b273;color:#000;border:none;border-radius:8px;padding:12px 28px;font-size:1rem;margin-top:16px;cursor:pointer;font-weight:600;">Confirm</button>
      <button type="button" id="close-change-username" style="position:absolute;top:12px;right:16px;background:none;border:none;font-size:24px;cursor:pointer;">×</button>
      <div id="change-username-message" style="margin-top:12px;font-size:15px;color:#d9534f;"></div>
    </form>
  `;
  document.body.appendChild(overlay);

  document.getElementById("close-change-username").onclick = () => overlay.remove();
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

  document.getElementById("change-username-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const messageDiv = document.getElementById("change-username-message");
    const newUsername = document.getElementById("new-username").value.trim();

    if (!newUsername) {
      messageDiv.textContent = "Please enter a new username.";
      return;
    }
    if (newUsername.length < 3) {
      messageDiv.textContent = "Username must be at least 3 characters.";
      return;
    }

    // Check if username already exists
    const dbRef = ref(database);
    get(child(dbRef, "users")).then((snapshot) => {
      if (snapshot.exists()) {
        const users = snapshot.val();
        for (const uid in users) {
          if ((users[uid].username || "").toLowerCase() === newUsername.toLowerCase()) {
            messageDiv.textContent = "Username already taken.";
            return;
          }
        }
        // Update username in DB
        const adminUid = window.currentAdminUid;
        if (!adminUid) {
          messageDiv.textContent = "Admin not found.";
          return;
        }
        const userRef = ref(database, `users/${adminUid}/username`);
        import("https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js").then(({ set }) => {
          set(userRef, newUsername)
            .then(() => {
              messageDiv.style.color = "#28a745";
              messageDiv.textContent = "Username changed successfully!";
              document.getElementById("profile-name").textContent = newUsername;
              localStorage.setItem("loggedInUsername", newUsername);
              setTimeout(() => overlay.remove(), 1200);
            })
            .catch((err) => {
              messageDiv.textContent = "Failed to change username: " + err.message;
            });
        });
      }
    });
  });
}

// --- Change Password Overlay ---
function showChangePasswordOverlay() {
  let overlay = document.getElementById("change-password-overlay");
  if (overlay) overlay.remove();

  overlay = document.createElement("div");
  overlay.id = "change-password-overlay";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100vw";
  overlay.style.height = "100vh";
  overlay.style.background = "rgba(0,0,0,0.5)";
  overlay.style.display = "flex";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";
  overlay.style.zIndex = "99999";

  overlay.innerHTML = `
    <form id="change-password-form" class="change-password-form" style="background:#fffbe6;border-radius:12px;padding:32px 24px;min-width:320px;max-width:90vw;box-shadow:0 2px 16px rgba(0,0,0,0.15);position:relative;">
      <h2 style="margin-top:0;">Change Password</h2>
      <label>Current Password</label>
      <div style="position:relative;">
        <input type="password" id="current-password" required style="width:90%;padding:8px 36px 15px 8px;margin-bottom:15px;border-radius:6px;border:1px solid #ccc;" disabled>
        <span id="current-eye" style="position:absolute;right:32px;top:8px;cursor:pointer;color:#888;font-size:18px;"><i class="fas fa-eye"></i></span>
      </div>
      <label>New Password</label>
      <div style="position:relative;">
        <input type="password" id="new-password" required style="width:90%;padding:8px 36px 15px 8px;margin-bottom:15px;border-radius:6px;border:1px solid #ccc;">
        <span id="new-eye" style="position:absolute;right:32px;top:8px;cursor:pointer;color:#888;font-size:18px;"><i class="fas fa-eye"></i></span>
      </div>
      <label>Confirm New Password</label>
      <div style="position:relative;">
        <input type="password" id="confirm-password" required style="width:90%;padding:8px 36px 15px 8px;margin-bottom:6px;border-radius:6px;border:1px solid #ccc;">
        <span id="confirm-eye" style="position:absolute;right:32px;top:8px;cursor:pointer;color:#888;font-size:18px;"><i class="fas fa-eye"></i></span>
      </div>
      <button type="submit" id="submit-change-password" style="background:#d0b273;color:#000;border:none;border-radius:8px;padding:12px 28px;font-size:1rem;margin-top:16px;cursor:pointer;font-weight:600;">Confirm</button>
      <button type="button" id="close-change-password" style="position:absolute;top:12px;right:16px;background:none;border:none;font-size:24px;cursor:pointer;">×</button>
      <div id="change-password-message" style="margin-top:12px;font-size:15px;color:#d9534f;"></div>
    </form>
  `;
  document.body.appendChild(overlay);

  document.getElementById("close-change-password").onclick = () => overlay.remove();
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

  // --- Eye icon logic for password fields ---
  function setupEyeToggle(inputId, eyeId) {
    const input = document.getElementById(inputId);
    const eye = document.getElementById(eyeId);
    let visible = false;
    eye.onclick = () => {
      visible = !visible;
      input.type = visible ? "text" : "password";
      eye.innerHTML = visible
        ? '<i class="fas fa-eye-slash"></i>'
        : '<i class="fas fa-eye"></i>';
    };
  }
  setupEyeToggle("current-password", "current-eye");
  setupEyeToggle("new-password", "new-eye");
  setupEyeToggle("confirm-password", "confirm-eye");

  // Password validation logic
  function validatePassword(pw) {
    if (!pw) return "Please enter a password.";
    if (pw.length < 8) return "Password must contain at least 8 characters.";
    if (!/[A-Z]/.test(pw)) return "Password must contain at least one uppercase letter.";
    if (!/[a-z]/.test(pw)) return "Password must contain at least one lowercase letter.";
    if (!/[!@#$%^&*(),.?\":{}|<>]/.test(pw)) return "Password must contain at least one special character.";
    return "";
  }

  // Input references
  const currentInput = document.getElementById("current-password");
  const newInput = document.getElementById("new-password");
  const confirmInput = document.getElementById("confirm-password");
  const messageDiv = document.getElementById("change-password-message");

  let userEmail = "";

  // --- Get admin email from DB ---
  const userUid = localStorage.getItem("userUid");
  if (userUid) {
    const dbRef = ref(database);
    get(child(dbRef, `users/${userUid}`)).then((snapshot) => {
      if (snapshot.exists()) {
        const adminData = snapshot.val();
        if (adminData.role === "admin") {
          userEmail = adminData.email;
          currentInput.disabled = false;
        }
      }
    });
  }

  // --- Submit Change Password ---
  document.getElementById("change-password-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    messageDiv.textContent = "";

    const user = auth.currentUser;
    if (!user) {
      messageDiv.textContent = "User not found.";
      return;
    }

    const currentPw = currentInput.value.trim();
    const newPw = newInput.value.trim();
    const confirmPw = confirmInput.value.trim();

    if (!currentPw || !newPw || !confirmPw) {
      messageDiv.textContent = "Please complete all fields.";
      return;
    }

    if (newPw !== confirmPw) {
      messageDiv.textContent = "Passwords do not match.";
      return;
    }

    const errorMsg = validatePassword(newPw);
    if (errorMsg) {
      messageDiv.textContent = errorMsg;
      return;
    }

    if (newPw === currentPw) {
      messageDiv.textContent = "New password cannot be the same as current password.";
      return;
    }

    try {
      const credential = EmailAuthProvider.credential(userEmail, currentPw);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPw);
      messageDiv.style.color = "#28a745";
      messageDiv.textContent = "Password changed successfully! Redirecting to login...";
      setTimeout(() => {
        overlay.remove();
        window.location.href = "Login2.html";
      }, 1200);
    } catch (err) {
      console.error("Password update error:", err);
      messageDiv.textContent = "Failed to change password: " + err.message;
    }
  });
}

// --- Attach to buttons ---
document.addEventListener("DOMContentLoaded", () => {
  fetchAndDisplayAdminProfile();
  const changeBtn = document.querySelector(".change-password-btn");
  if (changeBtn) {
    changeBtn.onclick = showChangePasswordOverlay;
  }
  // Add Change Username Button for Admin
  let usernameBtn = document.querySelector(".change-username-btn");
  if (!usernameBtn) {
    usernameBtn = document.createElement("button");
    usernameBtn.className = "change-username-btn";
    usernameBtn.innerHTML = '<i class="fas fa-user-edit"></i> Change Username';
    document.querySelector(".profile-container").insertBefore(usernameBtn, document.querySelector(".change-password-btn"));
  }
  usernameBtn.onclick = showChangeUsernameOverlay;
});
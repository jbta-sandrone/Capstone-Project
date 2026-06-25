import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import {
  getDatabase,
  ref,
  get,
  child
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

// Firebase config
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
const auth = getAuth(app);
const database = getDatabase(app);

const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginButton = document.getElementById("login");

// Modal logic
function showModal(message) {
  const modal = document.getElementById('modal');
  const modalMessage = document.getElementById('modal-message');
  modalMessage.textContent = message;
  modal.style.display = 'block';
}

document.getElementById('close-modal').onclick = function () {
  document.getElementById('modal').style.display = 'none';
};

window.onclick = function (event) {
  const modal = document.getElementById('modal');
  if (event.target === modal) {
    modal.style.display = 'none';
  }
};

// Login logic
loginButton.addEventListener("click", function (event) {
  event.preventDefault();

  const usernameValue = usernameInput.value.trim().toLowerCase();
  const passwordValue = passwordInput.value.trim();

  // --- Admin fixed login ---
  if (usernameValue === "admin123" && passwordValue === "admin_@123") {
    window.location.href = "admindashboard.html";
    return;
  }

  if (!usernameValue || !passwordValue) {
    showModal("Please complete all credentials.");
    return;
  }

  const dbRef = ref(database);
  get(child(dbRef, `users`))
    .then((snapshot) => {
      if (snapshot.exists()) {
        const users = snapshot.val();
        let emailFound = null;
        let userUid = null;
        let userRole = null;

        for (const userId in users) {
          const user = users[userId];
          if ((user.username || "").toLowerCase() === usernameValue) {
            emailFound = user.email;
            userUid = userId;
            userRole = user.role || null;
            break;
          }
        }

        if (emailFound) {
          signInWithEmailAndPassword(auth, emailFound, passwordValue)
            .then((userCredential) => {
              const user = userCredential.user;
              if (!user.emailVerified) {
                showModal("Please verify your email before logging in. Check your inbox for the verification link.");
                return;
              }
              localStorage.setItem("loggedInUsername", usernameValue);
              localStorage.setItem("userUid", userUid);
              if (userRole === "admin") {
                window.location.href = "admindashboard.html";
              } else {
                window.location.href = "dashboard.html";
              }
            })
            .catch((error) => {
              console.error("Authentication error:", error);
              showModal("Invalid password or username.");
            });
        } else {
          showModal("Data not found.");
        }
      } else {
        showModal("No data found.");
      }
    })
    .catch((error) => {
      console.error("Error fetching user data:", error);
      showModal("Error fetching user data: " + error.message);
    });
});

// --- Forgot Password Overlay ---
function showForgotPasswordOverlay() {
  let overlay = document.getElementById("forgot-password-overlay");
  if (overlay) overlay.remove();

  overlay = document.createElement("div");
  overlay.id = "forgot-password-overlay";
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
  <form id="forgot-password-form" style="background:#fffbe6;border-radius:12px;padding:32px 24px;min-width:320px;max-width:90vw;box-shadow:0 2px 16px rgba(0,0,0,0.15);position:relative;">
    <h2 style="margin-top:0;">Forgot Password</h2>
    <label>Username</label>
    <input type="text" id="fp-username" required style="width:90%;padding:8px;margin-bottom:10px;border-radius:6px;border:1px solid #ccc;">
    <label>Email Address</label>
    <input type="email" id="fp-email" required style="width:90%;padding:8px;margin-bottom:10px;border-radius:6px;border:1px solid #ccc;">
    
    <button type="submit" style="background:#d0b273;color:#000;border:none;border-radius:8px;padding:12px 28px;font-size:1rem;margin-top:12px;cursor:pointer;font-weight:600;">Confirm</button>
    <button type="button" id="close-forgot-password" style="position:absolute;top:12px;right:16px;background:none;border:none;font-size:24px;cursor:pointer;">×</button>
    <div id="forgot-password-message" style="margin-top:12px;font-size:15px;color:#d9534f;"></div>
  </form>
`;
  document.body.appendChild(overlay);

  document.getElementById("close-forgot-password").onclick = () => overlay.remove();
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

  document.getElementById("forgot-password-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const msgDiv = document.getElementById("forgot-password-message");
  msgDiv.textContent = "";

  const fpUsername = document.getElementById("fp-username").value.trim().toLowerCase();
  const fpEmail = document.getElementById("fp-email").value.trim();

  // Basic validation: only username + email required for password reset
  if (!fpUsername || !fpEmail) {
    msgDiv.textContent = "Please fill in all fields.";
    return;
  }

  // Find user by username and email
  const dbRef = ref(database);
  get(child(dbRef, "users")).then(async (snapshot) => {
    if (snapshot.exists()) {
      const users = snapshot.val();
      let foundUser = null;
      for (const uid in users) {
        const user = users[uid];
        if ((user.username || "").toLowerCase() === fpUsername && (user.email || "").toLowerCase() === fpEmail.toLowerCase()) {
          foundUser = user;
          break;
        }
      }
      if (!foundUser) {
        msgDiv.textContent = "No user found with that username and email.";
        return;
      }

      // Send password reset email (secure way)
      sendPasswordResetEmail(auth, fpEmail)
        .then(() => {
          msgDiv.style.color = "#28a745";
          msgDiv.textContent = "A password reset email has been sent. Please check your inbox.";
          setTimeout(() => overlay.remove(), 2000);
        })
        .catch((error) => {
          msgDiv.textContent = "Failed to send password reset email: " + error.message;
        });

    } else {
      msgDiv.textContent = "No users found in the database.";
    }
  });
});
}

// --- Attach to "Forgot Password?" link ---
document.addEventListener("DOMContentLoaded", () => {
  const forgotLink = document.querySelector(".forgot");
  if (forgotLink) {
    forgotLink.onclick = (e) => {
      e.preventDefault();
      showForgotPasswordOverlay();
    };
  }
});

// Eye icon toggle for login password
document.addEventListener("DOMContentLoaded", () => {
  const pwInput = document.getElementById("password");
  const eye = document.getElementById("login-eye");
  if (pwInput && eye) {
    let visible = false;
    eye.onclick = () => {
      visible = !visible;
      pwInput.type = visible ? "text" : "password";
      eye.innerHTML = visible
        ? '<i class="fas fa-eye-slash"></i>'
        : '<i class="fas fa-eye"></i>';
    };
  }
});





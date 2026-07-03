import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
  sendEmailVerification
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import {
  getDatabase,
  ref,
  get,
  child,
  set
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAmg4q4LmjqA8DHK1zY4yV8OCRvtAWJeO4",
  authDomain: "cliq-8dba8.firebaseapp.com",
  projectId: "cliq-8dba8",
  storageBucket: "cliq-8dba8.firebasestorage.app",
  messagingSenderId: "545738539503",
  appId: "1:545738539503:web:16560a7ac4cb3e3af0361a",
  databaseURL: "https://cliq-8dba8-default-rtdb.firebaseio.com/"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

const authModal = document.getElementById("auth-modal");
const loginPanel = document.getElementById("auth-login-panel");
const signupPanel = document.getElementById("auth-signup-panel");
const modal = document.getElementById("modal");
const modalMessage = document.getElementById("modal-message");
const closeModal = document.getElementById("close-modal");

const loginIdentity = document.getElementById("login-identity");
const loginPassword = document.getElementById("login-password");
const loginForm = document.getElementById("landing-login-form");

const signupName = document.getElementById("signup-name");
const signupEmail = document.getElementById("signup-email");
const signupPhone = document.getElementById("signup-phone");
const signupPassword = document.getElementById("signup-password");
const signupConfirmPassword = document.getElementById("signup-confirm-password");
const signupForm = document.getElementById("landing-signup-form");

const xPassword = document.querySelector("#auth-signup-panel .x-password");
const xConfirmPassword = document.querySelector("#auth-signup-panel .x-confirmpassword");
const xEmail = document.querySelector("#auth-signup-panel .x-email");
const xPhone = document.querySelector("#auth-signup-panel .x-phone");

function showAuthModal(mode = "login") {
  switchAuthPanel(mode);
  authModal.classList.add("is-open");
  authModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("auth-modal-open");

  setTimeout(() => {
    const firstInput = mode === "signup" ? signupName : loginIdentity;
    if (firstInput) firstInput.focus();
  }, 80);
}

function closeAuthModal() {
  authModal.classList.remove("is-open");
  authModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("auth-modal-open");
  hideMessage();
}

function switchAuthPanel(mode) {
  const isSignup = mode === "signup";
  loginPanel.classList.toggle("is-active", !isSignup);
  signupPanel.classList.toggle("is-active", isSignup);
  hideMessage();
}

function showModal(message) {
  modalMessage.textContent = message;
  modal.style.display = "flex";
}

function hideMessage() {
  if (modal) modal.style.display = "none";
  if (modalMessage) modalMessage.textContent = "";
}

function showLoginRedirectTransition(targetUrl) {
  const messages = [
    "Preparing your dashboard...",
    "Brewing your CLIQ experience...",
    "Loading your cafe orders...",
    "Welcome back to B-Hive Cafe..."
  ];

  const existingOverlay = document.querySelector(".cliq-login-transition");
  if (existingOverlay) existingOverlay.remove();

  const overlay = document.createElement("div");
  overlay.className = "cliq-login-transition";
  overlay.setAttribute("role", "status");
  overlay.setAttribute("aria-live", "polite");
  overlay.innerHTML = `
    <div class="cliq-login-transition__card">
      <div class="cliq-login-transition__brand">CLIQ<small>B-Hive Cafe</small></div>
      <div class="cliq-login-transition__beans" aria-hidden="true">
        <span class="cliq-login-transition__bean"></span>
        <span class="cliq-login-transition__bean"></span>
        <span class="cliq-login-transition__bean"></span>
      </div>
      <div class="cliq-login-transition__message">${messages[0]}</div>
    </div>
  `;
  document.body.appendChild(overlay);

  const message = overlay.querySelector(".cliq-login-transition__message");
  let index = 0;
  const messageTimer = setInterval(() => {
    index = (index + 1) % messages.length;
    message.style.opacity = "0";
    setTimeout(() => {
      message.textContent = messages[index];
      message.style.opacity = "1";
    }, 180);
  }, 800);

  requestAnimationFrame(() => overlay.classList.add("is-visible"));
  setTimeout(closeAuthModal, 430);

  setTimeout(() => {
    clearInterval(messageTimer);
    overlay.classList.add("is-leaving");
    setTimeout(() => {
      window.location.href = targetUrl;
    }, 420);
  }, 3400);
}

function setError(element, message) {
  if (!element) return;
  element.textContent = message || "";
  element.style.display = message ? "block" : "none";
}

function clearErrors() {
  setError(xPassword, "");
  setError(xConfirmPassword, "");
  setError(xEmail, "");
  setError(xPhone, "");
}

function validatePasswordLive() {
  let msg = "";
  if (!signupPassword.value) {
    msg = "Please enter a password.";
  } else if (signupPassword.value.length < 8) {
    msg = "Password must contain at least 8 characters.";
  } else if (!/[A-Z]/.test(signupPassword.value)) {
    msg = "Password must contain at least one uppercase letter.";
  } else if (!/[a-z]/.test(signupPassword.value)) {
    msg = "Password must contain at least one lowercase letter.";
  } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(signupPassword.value)) {
    msg = "Password must contain at least one special character.";
  }

  setError(xPassword, msg);

  if (signupConfirmPassword.value && signupPassword.value !== signupConfirmPassword.value) {
    setError(xConfirmPassword, "Password do not match.");
  } else if (signupConfirmPassword.value) {
    setError(xConfirmPassword, "");
  }
}

function validateConfirmPasswordLive() {
  if (!signupConfirmPassword.value) {
    setError(xConfirmPassword, "Please confirm your password.");
  } else if (signupPassword.value !== signupConfirmPassword.value) {
    setError(xConfirmPassword, "Password do not match.");
  } else {
    setError(xConfirmPassword, "");
  }
}

function validateEmailLive() {
  if (!signupEmail.value) {
    setError(xEmail, "Please enter your email.");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupEmail.value)) {
    setError(xEmail, "Invalid email address.");
  } else {
    setError(xEmail, "");
  }
}

function validatePhoneLive() {
  signupPhone.value = signupPhone.value.replace(/\D/g, "").slice(0, 11);

  if (!signupPhone.value) {
    setError(xPhone, "Please enter your phone number.");
  } else if (!/^09\d{9}$/.test(signupPhone.value)) {
    setError(xPhone, "Phone number must start with 09 and contain 11 digits.");
  } else {
    setError(xPhone, "");
  }
}

function setupPasswordToggle(buttonId, input) {
  const button = document.getElementById(buttonId);
  if (!button || !input) return;

  let visible = false;
  button.addEventListener("click", () => {
    visible = !visible;
    input.type = visible ? "text" : "password";
    button.setAttribute("aria-label", visible ? "Hide password" : "Show password");
    button.innerHTML = visible ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
  });
}

async function findUserByIdentity(identityValue) {
  const dbRef = ref(database);
  const snapshot = await get(child(dbRef, "users"));

  if (!snapshot.exists()) return { exists: false };

  const users = snapshot.val();
  const identity = identityValue.toLowerCase();

  for (const userId in users) {
    const user = users[userId];
    const usernameMatch = (user.username || "").toLowerCase() === identity;
    const emailMatch = (user.email || "").toLowerCase() === identity;
    if (usernameMatch || emailMatch) {
      return {
        exists: true,
        email: user.email,
        userUid: userId,
        role: user.role || null,
        username: (user.username || identity).toLowerCase()
      };
    }
  }

  return { exists: true, email: null };
}

async function handleLogin(event) {
  event.preventDefault();

  const identityValue = loginIdentity.value.trim().toLowerCase();
  const passwordValue = loginPassword.value.trim();

  if (identityValue === "admin123" && passwordValue === "admin_@123") {
    showLoginRedirectTransition("admindashboard.html");
    return;
  }

  if (!identityValue || !passwordValue) {
    showModal("Please complete all credentials.");
    return;
  }

  try {
    const foundUser = await findUserByIdentity(identityValue);

    if (!foundUser.exists) {
      showModal("No data found.");
      return;
    }

    if (!foundUser.email) {
      showModal("Data not found.");
      return;
    }

    signInWithEmailAndPassword(auth, foundUser.email, passwordValue)
      .then((userCredential) => {
        const user = userCredential.user;
        if (!user.emailVerified) {
          showModal("Please verify your email before logging in. Check your inbox for the verification link.");
          return;
        }

        localStorage.setItem("loggedInUsername", foundUser.username);
        localStorage.setItem("userUid", foundUser.userUid);

        if (foundUser.role === "admin") {
          showLoginRedirectTransition("admindashboard.html");
        } else {
          showLoginRedirectTransition("dashboard.html");
        }
      })
      .catch((error) => {
        console.error("Authentication error:", error);
        showModal("Invalid password or username.");
      });
  } catch (error) {
    console.error("Error fetching user data:", error);
    showModal("Error fetching user data: " + error.message);
  }
}

async function handleSignup(event) {
  event.preventDefault();
  clearErrors();

  const usernameValue = signupName.value.trim().toLowerCase();
  const passwordValue = signupPassword.value.trim();
  const cpasswordValue = signupConfirmPassword.value.trim();
  const emailValue = signupEmail.value.trim();
  const phoneValue = signupPhone.value.trim();

  let hasError = false;

  if (!usernameValue || !passwordValue || !cpasswordValue || !emailValue || !phoneValue) {
    if (!passwordValue) setError(xPassword, "Please enter a password.");
    if (!cpasswordValue) setError(xConfirmPassword, "Please confirm your password.");
    if (!emailValue) setError(xEmail, "Please enter your email.");
    if (!phoneValue) setError(xPhone, "Please enter your phone number.");
    showModal("Please fill in all credentials.");
    return;
  }

  if (passwordValue.length < 8) {
    setError(xPassword, "Password must contain at least 8 characters.");
    hasError = true;
  } else if (!/[A-Z]/.test(passwordValue)) {
    setError(xPassword, "Password must contain at least one uppercase letter.");
    hasError = true;
  } else if (!/[a-z]/.test(passwordValue)) {
    setError(xPassword, "Password must contain at least one lowercase letter.");
    hasError = true;
  } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(passwordValue)) {
    setError(xPassword, "Password must contain at least one special character.");
    hasError = true;
  }

  if (passwordValue !== cpasswordValue) {
    setError(xConfirmPassword, "Password do not match.");
    hasError = true;
  }

  if (!/^09\d{9}$/.test(phoneValue)) {
    setError(xPhone, "Phone number must start with 09 and contain 11 digits.");
    showModal("Phone number must start with 09 and contain 11 digits.");
    hasError = true;
  }

  if (hasError) return;

  const dbRef = ref(database);
  const snapshot = await get(child(dbRef, "users"));

  if (snapshot.exists()) {
    const users = snapshot.val();
    for (const userId in users) {
      if ((users[userId].username || "").toLowerCase() === usernameValue) {
        setError(xEmail, "Username already taken.");
        showModal("Username already taken.");
        return;
      }
    }
  }

  createUserWithEmailAndPassword(auth, emailValue, passwordValue)
    .then((userCredential) => {
      const user = userCredential.user;
      const userId = user.uid;

      set(ref(database, "users/" + userId), {
        username: usernameValue,
        email: emailValue,
        phone: phoneValue
      })
        .then(() => {
          sendEmailVerification(user)
            .then(() => {
              showModal("Account created! Please check your email to verify your account before logging in.");

              function redirectAfterClose() {
                hideMessage();
                switchAuthPanel("login");
                signupForm.reset();
                clearErrors();
                closeModal.removeEventListener("click", redirectAfterClose);
                authModal.removeEventListener("click", outsideClickHandler);
              }

              function outsideClickHandler(clickEvent) {
                if (clickEvent.target === authModal || clickEvent.target.classList.contains("auth-modal__backdrop")) {
                  redirectAfterClose();
                }
              }

              closeModal.addEventListener("click", redirectAfterClose);
              authModal.addEventListener("click", outsideClickHandler);
            })
            .catch((error) => {
              showModal("Error sending verification email: " + error.message);
            });
        })
        .catch((error) => {
          setError(xEmail, "Error saving user data: " + error.message);
        });
    })
    .catch((error) => {
      if (error.code === "auth/email-already-in-use") {
        setError(xEmail, "Email has already taken.");
        showModal("Email has already taken.");
      } else if (error.code === "auth/invalid-email") {
        setError(xEmail, "Invalid email address.");
        showModal("Invalid email address.");
      } else {
        setError(xEmail, "Error: " + error.message);
        showModal("Error: " + error.message);
      }
    });
}

function showForgotPasswordOverlay() {
  let overlay = document.getElementById("forgot-password-overlay");
  if (overlay) overlay.remove();

  overlay = document.createElement("div");
  overlay.id = "forgot-password-overlay";
  overlay.className = "forgot-password-overlay";
  overlay.innerHTML = `
    <form id="forgot-password-form" class="forgot-password-form">
      <button type="button" id="close-forgot-password" class="forgot-password-close" aria-label="Close forgot password dialog">&times;</button>
      <h2>Forgot Password</h2>
      <p>Enter your account username and email address to receive a reset link.</p>
      <label for="fp-username">Username</label>
      <input type="text" id="fp-username" required>
      <label for="fp-email">Email Address</label>
      <input type="email" id="fp-email" required>
      <button type="submit">Confirm</button>
      <div id="forgot-password-message"></div>
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

    if (!fpUsername || !fpEmail) {
      msgDiv.textContent = "Please fill in all fields.";
      return;
    }

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

        sendPasswordResetEmail(auth, fpEmail)
          .then(() => {
            msgDiv.classList.add("is-success");
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

document.querySelectorAll("[data-auth-open]").forEach((trigger) => {
  trigger.addEventListener("click", (event) => {
    event.preventDefault();
    showAuthModal(trigger.dataset.authOpen);
  });
});

document.querySelectorAll("[data-auth-switch]").forEach((trigger) => {
  trigger.addEventListener("click", () => switchAuthPanel(trigger.dataset.authSwitch));
});

document.querySelectorAll("[data-auth-close]").forEach((trigger) => {
  trigger.addEventListener("click", closeAuthModal);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && authModal.classList.contains("is-open")) {
    closeAuthModal();
  }
});

if (closeModal) closeModal.onclick = hideMessage;
if (loginForm) loginForm.addEventListener("submit", handleLogin);
if (signupForm) signupForm.addEventListener("submit", handleSignup);

document.querySelectorAll(".forgot").forEach((forgotLink) => {
  forgotLink.addEventListener("click", (event) => {
    event.preventDefault();
    showForgotPasswordOverlay();
  });
});

if (signupPassword) signupPassword.addEventListener("input", validatePasswordLive);
if (signupConfirmPassword) signupConfirmPassword.addEventListener("input", validateConfirmPasswordLive);
if (signupEmail) signupEmail.addEventListener("input", validateEmailLive);
if (signupPhone) signupPhone.addEventListener("input", validatePhoneLive);

setupPasswordToggle("login-eye-modal", loginPassword);
setupPasswordToggle("reg-eye-modal", signupPassword);
setupPasswordToggle("reg-eye-confirm-modal", signupConfirmPassword);

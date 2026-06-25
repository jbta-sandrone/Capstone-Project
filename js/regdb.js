import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getDatabase, ref, set, get, child } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

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

const username = document.getElementById("username");
const password = document.getElementById("password");
const cpassword = document.getElementById("cpassword");
const email = document.getElementById("email");
const phone = document.getElementById("phone");
const signup = document.getElementById("signup");

const xPassword = document.querySelector(".x-password");
const xConfirmPassword = document.querySelector(".x-confirmpassword");
const xEmail = document.querySelector(".x-email");
const xPhone = document.querySelector(".x-phone");

// Modal logic
function showModal(message) {
    const modal = document.getElementById('modal');
    const modalMessage = document.getElementById('modal-message');
    modalMessage.textContent = message;
    modal.style.display = 'block';
}

document.getElementById('close-modal').onclick = function() {
    document.getElementById('modal').style.display = 'none';
};

window.onclick = function(event) {
    const modal = document.getElementById('modal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
};

// Hide all error messages initially
function clearErrors() {
    xPassword.textContent = "";
    xPassword.style.display = "none";
    xConfirmPassword.textContent = "";
    xConfirmPassword.style.display = "none";
    xEmail.textContent = "";
    xEmail.style.display = "none";
    xPhone.textContent = "";
    xPhone.style.display = "none";
}

// Real-time validation for password
password.addEventListener("input", () => {
    let msg = "";
    if (!password.value) {
        msg = "Please enter a password.";
    } else if (password.value.length < 8) {
        msg = "Password must contain at least 8 characters.";
    } else if (!/[A-Z]/.test(password.value)) {
        msg = "Password must contain at least one uppercase letter.";
    } else if (!/[a-z]/.test(password.value)) {
        msg = "Password must contain at least one lowercase letter.";
    } else if (!/[!@#$%^&*(),.?\":{}|<>]/.test(password.value)) {
        msg = "Password must contain at least one special character.";
    }
    if (msg) {
        xPassword.textContent = msg;
        xPassword.style.display = "block";
    } else {
        xPassword.textContent = "";
        xPassword.style.display = "none";
    }
    // Also check confirm password match in real-time
    if (cpassword.value && password.value !== cpassword.value) {
        xConfirmPassword.textContent = "Password do not match.";
        xConfirmPassword.style.display = "block";
    } else if (cpassword.value) {
        xConfirmPassword.textContent = "";
        xConfirmPassword.style.display = "none";
    }
});

// Real-time validation for confirm password
cpassword.addEventListener("input", () => {
    if (!cpassword.value) {
        xConfirmPassword.textContent = "Please confirm your password.";
        xConfirmPassword.style.display = "block";
    } else if (password.value !== cpassword.value) {
        xConfirmPassword.textContent = "Password do not match.";
        xConfirmPassword.style.display = "block";
    } else {
        xConfirmPassword.textContent = "";
        xConfirmPassword.style.display = "none";
    }
});

// Real-time validation for email
email.addEventListener("input", () => {
    if (!email.value) {
        xEmail.textContent = "Please enter your email.";
        xEmail.style.display = "block";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
        xEmail.textContent = "Invalid email address.";
        xEmail.style.display = "block";
    } else {
        xEmail.textContent = "";
        xEmail.style.display = "none";
    }
});

// Real-time validation for phone number
phone.addEventListener("input", () => {
    // Limit input to 11 digits
    phone.value = phone.value.replace(/\D/g, '').slice(0, 11);

    if (!phone.value) {
        xPhone.textContent = "Please enter your phone number.";
        xPhone.style.display = "block";
    } else if (!/^09\d{9}$/.test(phone.value)) {
        xPhone.textContent = "Phone number must start with 09 and contain 11 digits.";
        xPhone.style.display = "block";
    } else {
        xPhone.textContent = "";
        xPhone.style.display = "none";
    }
});

signup.addEventListener("click", async function (event) {
    event.preventDefault();
    clearErrors();

    const usernameValue = username.value.trim().toLowerCase(); // Always lowercase
    const passwordValue = password.value.trim();
    const cpasswordValue = cpassword.value.trim();
    const emailValue = email.value.trim();
    const phoneValue = phone.value.trim();

    let hasError = false;

    if (!usernameValue || !passwordValue || !cpasswordValue || !emailValue || !phoneValue) {
        if (!passwordValue) {
            xPassword.textContent = "Please enter a password.";
            xPassword.style.display = "block";
        }
        if (!cpasswordValue) {
            xConfirmPassword.textContent = "Please confirm your password.";
            xConfirmPassword.style.display = "block";
        }
        if (!emailValue) {
            xEmail.textContent = "Please enter your email.";
            xEmail.style.display = "block";
        }
        if (!phoneValue) {
            xPhone.textContent = "Please enter your phone number.";
            xPhone.style.display = "block";
        }
        showModal("Please fill in all credentials.");
        return;
    }

    if (passwordValue.length < 8) {
        xPassword.textContent = "Password must contain at least 8 characters.";
        xPassword.style.display = "block";
        hasError = true;
    } else if (!/[A-Z]/.test(passwordValue)) {
        xPassword.textContent = "Password must contain at least one uppercase letter.";
        xPassword.style.display = "block";
        hasError = true;
    } else if (!/[a-z]/.test(passwordValue)) {
        xPassword.textContent = "Password must contain at least one lowercase letter.";
        xPassword.style.display = "block";
        hasError = true;
    } else if (!/[!@#$%^&*(),.?\":{}|<>]/.test(passwordValue)) {
        xPassword.textContent = "Password must contain at least one special character.";
        xPassword.style.display = "block";
        hasError = true;
    }

    if (passwordValue !== cpasswordValue) {
        xConfirmPassword.textContent = "Password do not match.";
        xConfirmPassword.style.display = "block";
        hasError = true;
    }
    if (!/^09\d{9}$/.test(phoneValue)) {
        xPhone.textContent = "Phone number must start with 09 and contain 11 digits.";
        xPhone.style.display = "block";
        showModal("Phone number must start with 09 and contain 11 digits.");
        hasError = true;
    }
    if (hasError) return;

    // Check for duplicate username
    const dbRef = ref(database);
    const snapshot = await get(child(dbRef, "users"));
    if (snapshot.exists()) {
        const users = snapshot.val();
        for (const userId in users) {
            if ((users[userId].username || "").toLowerCase() === usernameValue) {
                xEmail.textContent = "Username already taken.";
                xEmail.style.display = "block";
                showModal("Username already taken.");
                return;
            }
        }
    }

    createUserWithEmailAndPassword(auth, emailValue, passwordValue)
        .then((userCredential) => {
            const user = userCredential.user;
            const userId = user.uid;
            set(ref(database, 'users/' + userId), {
                username: usernameValue,
                email: emailValue,
                phone: phoneValue
            })
            .then(() => {
                // Send verification email
                sendEmailVerification(user)
                    .then(() => {
                        showModal("Account created! Please check your email to verify your account before logging in.");
                        // Optionally, redirect to login after closing modal
                        const modal = document.getElementById('modal');
                        const closeModalBtn = document.getElementById('close-modal');
                        function redirectAfterClose() {
                            modal.style.display = 'none';
                            window.location.href = "Login2.html";
                            closeModalBtn.removeEventListener('click', redirectAfterClose);
                            window.removeEventListener('click', outsideClickHandler);
                        }
                        function outsideClickHandler(event) {
                            if (event.target === modal) {
                                redirectAfterClose();
                            }
                        }
                        closeModalBtn.addEventListener('click', redirectAfterClose);
                        window.addEventListener('click', outsideClickHandler);

                        username.value = "";
                        password.value = "";
                        cpassword.value = "";
                        email.value = "";
                        phone.value = "";
                    })
                    .catch((error) => {
                        showModal("Error sending verification email: " + error.message);
                    });
            })
            .catch((error) => {
                xEmail.textContent = "Error saving user data: " + error.message;
                xEmail.style.display = "block";
            });
        })
        .catch((error) => {
            if (error.code === "auth/email-already-in-use") {
                xEmail.textContent = "Email has already taken.";
                xEmail.style.display = "block";
                showModal("Email has already taken.");
            } else if (error.code === "auth/invalid-email") {
                xEmail.textContent = "Invalid email address.";
                xEmail.style.display = "block";
                showModal("Invalid email address.");
            } else {
                xEmail.textContent = "Error: " + error.message;
                xEmail.style.display = "block";
                showModal("Error: " + error.message);
            }
        });
});

document.addEventListener("DOMContentLoaded", () => {
  const pwInput = document.getElementById("password");
  const cpwInput = document.getElementById("cpassword");
  const eye = document.getElementById("reg-eye");
  const eyeConfirm = document.getElementById("reg-eye-confirm");

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
  if (cpwInput && eyeConfirm) {
    let visible = false;
    eyeConfirm.onclick = () => {
      visible = !visible;
      cpwInput.type = visible ? "text" : "password";
      eyeConfirm.innerHTML = visible
        ? '<i class="fas fa-eye-slash"></i>'
        : '<i class="fas fa-eye"></i>';
    };
  }
});
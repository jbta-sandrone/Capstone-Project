import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAmg4q4LmjqA8DHK1zY4yV8OCRvtAWJeO4",
    authDomain: "cliq-8dba8.firebaseapp.com",
    projectId: "cliq-8dba8",
    storageBucket: "cliq-8dba8.firebasestorage.app",
    messagingSenderId: "545738539503",
    appId: "1:545738539503:web:16560a7ac4cb3e3af0361a",
    databaseURL: "https://cliq-8dba8-default-rtdb.firebaseio.com/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Get logged-in user UID from localStorage
const userUid = localStorage.getItem("userUid");

// Function to update the bell count
function updateBellCount(count) {
    const bellCountElement = document.querySelector('.number-bell');
    const bellIcon = document.querySelector('#notification i');
    if (bellCountElement) {
        if (count > 0) {
            bellCountElement.textContent = count;
            bellCountElement.style.display = 'inline';
            // Animate bell shake continuously if count is 1 or more
            if (bellIcon && !bellIcon.classList.contains('bell-shake-animate')) {
                bellIcon.classList.add('bell-shake-animate');
            }
        } else {
            bellCountElement.textContent = '0';
            bellCountElement.style.display = 'none';
            // Remove shake animation if count is 0
            if (bellIcon) {
                bellIcon.classList.remove('bell-shake-animate');
            }
        }
    }
}

// Fetch notifications from Firebase and update the bell count
function fetchBellCount() {
    if (!userUid) return;

    const notifRef = ref(database, `users/${userUid}/notification`);
    onValue(notifRef, (snapshot) => {
        const notifs = snapshot.val();
        let doneCount = 0;
        if (notifs) {
            Object.values(notifs).forEach(notif => {
                if (notif.done === true) doneCount++;
            });
        }
        updateBellCount(doneCount);
    }, (error) => {
        console.error("❌ Error fetching notification data:", error);
    });
}

// Call fetchBellCount on page load
fetchBellCount();
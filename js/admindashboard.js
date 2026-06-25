document.addEventListener('DOMContentLoaded', function () {
    const logoutBtn = document.querySelector('.logout');
    const modal = document.getElementById('confirmation-modal');
    const modalMessage = document.getElementById('modal-message');
    const confirmBtn = document.getElementById('modal-confirm-btn');
    const cancelBtn = document.getElementById('modal-cancel-btn');

    if (logoutBtn && modal && modalMessage && confirmBtn && cancelBtn) {
        logoutBtn.addEventListener('click', function (e) {
            e.preventDefault();
            modalMessage.textContent = "Are you sure you want to logout?";
            modal.style.display = "flex";
            modal.style.zIndex = "10001";
        });

        confirmBtn.onclick = function () {
            modal.style.display = "none";
            window.location.href = 'index.html';
        };

        cancelBtn.onclick = function () {
            modal.style.display = "none";
        };
    }

    // --- Order number badge logic ---
    import('https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js').then(({ initializeApp }) => {
        import('https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js').then(({ getDatabase, ref, onValue }) => {
            const firebaseConfig = {
                apiKey: "AIzaSyAmg4q4LmjqA8DHK1zY4yV8OCRvtAWJeO4",
                authDomain: "cliq-8dba8.firebaseapp.com",
                projectId: "cliq-8dba8",
                storageBucket: "cliq-8dba8-default-rtdb.appspot.com",
                messagingSenderId: "545738539503",
                appId: "1:545738539503:web:16560a7ac4cb3e3af0361a",
                databaseURL: "https://cliq-8dba8-default-rtdb.firebaseio.com/"
            };
            const app = initializeApp(firebaseConfig);
            const database = getDatabase(app);

            function updateOrderNumber(count) {
                const orderNumElement = document.querySelector('.number-order');
                if (orderNumElement) {
                    if (count > 0) {
                        orderNumElement.textContent = count;
                        orderNumElement.style.display = 'inline';
                    } else {
                        orderNumElement.textContent = '0';
                        orderNumElement.style.display = 'none';
                    }
                }
            }

            function fetchOrderQueueCount() {
                const queueRef = ref(database, 'orderqueue');
                onValue(queueRef, (snapshot) => {
                    const orders = snapshot.val();
                    const orderCount = orders ? Object.keys(orders).length : 0;
                    updateOrderNumber(orderCount);
                }, (error) => {
                    console.error("❌ Error fetching orderqueue data:", error);
                });
            }

            fetchOrderQueueCount();
        });
    });
});
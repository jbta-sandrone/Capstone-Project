// Check for saved dark mode preference
const darkModeToggle = document.getElementById('dark-mode-toggle');
const setIcon = (isDark) => {
    darkModeToggle.innerHTML = isDark
        ? '<i class="fas fa-sun"></i>'
        : '<i class="fas fa-moon"></i>';
};

if (localStorage.getItem('dark-mode') === 'enabled') {
    document.body.classList.add('dark-mode');
    document.querySelectorAll('.nav-container, .search-container, .search-bar')
        .forEach((element) => {
            element.classList.add('dark-mode');
        });
    setIcon(true);
} else {
    setIcon(false);
}

// Dark mode toggle functionality
darkModeToggle.addEventListener('click', function () {
    const body = document.body;

    // Toggle the "dark-mode" class on the body
    body.classList.toggle('dark-mode');

    // Toggle dark mode for specific elements
    document.querySelectorAll('.nav-container, .search-container, .search-bar')
        .forEach((element) => {
            element.classList.toggle('dark-mode');
        });

    // Save the preference in localStorage and update icon
    if (body.classList.contains('dark-mode')) {
        localStorage.setItem('dark-mode', 'enabled');
        setIcon(true);
    } else {
        localStorage.setItem('dark-mode', 'disabled');
        setIcon(false);
    }
});
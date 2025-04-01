document.addEventListener('DOMContentLoaded', function () {
	// Get the dark mode toggle button
	const darkModeToggle = document.getElementById('dark-mode-toggle');

	// Check for saved theme preference or respect OS preference
	const prefersDarkMode = window.matchMedia(
		'(prefers-color-scheme: dark)'
	).matches;
	const savedTheme = localStorage.getItem('theme');

	// Apply theme based on saved preference or OS preference
	if (savedTheme === 'dark' || (!savedTheme && prefersDarkMode)) {
		document.documentElement.setAttribute('data-bs-theme', 'dark');
		document.body.classList.add('dark-mode');
		updateDarkModeIcon(true);
	} else {
		document.documentElement.setAttribute('data-bs-theme', 'light');
	}

	// Toggle dark mode on button click
	darkModeToggle.addEventListener('click', function () {
		const isDarkMode =
			document.documentElement.getAttribute('data-bs-theme') === 'dark';

		if (isDarkMode) {
			document.documentElement.setAttribute('data-bs-theme', 'light');
			document.body.classList.remove('dark-mode');
			localStorage.setItem('theme', 'light');
		} else {
			document.documentElement.setAttribute('data-bs-theme', 'dark');
			document.body.classList.add('dark-mode');
			localStorage.setItem('theme', 'dark');
		}

		updateDarkModeIcon(!isDarkMode);
	});

	// Function to update the icon on the toggle button
	function updateDarkModeIcon(isDarkMode) {
		const iconElement = darkModeToggle.querySelector('i');
		if (isDarkMode) {
			iconElement.classList.remove('fa-moon');
			iconElement.classList.add('fa-sun');
			darkModeToggle.setAttribute('title', 'Switch to Light Mode');
		} else {
			iconElement.classList.remove('fa-sun');
			iconElement.classList.add('fa-moon');
			darkModeToggle.setAttribute('title', 'Switch to Dark Mode');
		}
	}

	// Initialize icon based on current state at load time
	updateDarkModeIcon(
		document.documentElement.getAttribute('data-bs-theme') === 'dark'
	);
});

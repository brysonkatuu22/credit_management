// This script runs before the page loads to set dark mode
(function() {
  const savedDarkMode = localStorage.getItem('darkMode') === 'true';
  if (savedDarkMode) {
    document.documentElement.classList.add('dark-mode');
    document.body.classList.add('dark-mode');
  }
})();

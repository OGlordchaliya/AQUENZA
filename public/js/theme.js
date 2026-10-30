// AQUENZA Universal Light & Dark Theme Manager
(function() {
  function getPreferredTheme() {
    const saved = localStorage.getItem('aquenza_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('aquenza_theme', theme);
  }

  // Immediate execution before DOM ready to prevent theme flash
  applyTheme(getPreferredTheme());

  // Attach button listeners after DOM loads
  document.addEventListener('DOMContentLoaded', () => {
    const toggleBtns = document.querySelectorAll('#themeToggleBtn, .theme-toggle-btn');
    toggleBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next);
      });
    });
  });
})();


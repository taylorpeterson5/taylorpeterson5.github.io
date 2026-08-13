(function () {
  function applyState(theme) {
    document.querySelectorAll('.theme-toggle-btn').forEach(function (btn) {
      var icon = btn.querySelector('i');
      if (icon) {
        icon.className = theme === 'dark' ? 'fa fa-sun-o' : 'fa fa-moon-o';
      }
      btn.setAttribute('aria-pressed', theme === 'dark');
      btn.setAttribute('title', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    applyState(document.documentElement.getAttribute('data-theme') || 'light');

    document.querySelectorAll('.theme-toggle-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        applyState(theme);
      });
    });
  });
})();

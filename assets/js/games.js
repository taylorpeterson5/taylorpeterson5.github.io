/*--/ Games page: click to play. A game's iframe, and its download, only loads after its Play button is clicked. /--*/
(function() {
  "use strict";

  document.querySelectorAll('.game-start').forEach(function (button) {
    button.addEventListener('click', function () {
      var iframe = document.createElement('iframe');
      iframe.src = button.dataset.src;
      iframe.title = button.dataset.title;
      iframe.allow = 'autoplay; fullscreen';
      button.replaceWith(iframe);
      // Keyboard input goes to the game without needing a second click
      iframe.focus({ preventScroll: true });

      // Center the whole game in the space below the fixed navbar
      var navHeight = document.getElementById('mainNav').offsetHeight;
      var rect = iframe.getBoundingClientRect();
      window.scrollBy({ top: rect.top - navHeight - (window.innerHeight - navHeight - rect.height) / 2, behavior: 'smooth' });
    });
  });
})();

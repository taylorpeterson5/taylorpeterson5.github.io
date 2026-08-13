(function () {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  document.addEventListener('DOMContentLoaded', function () {
    var targets = document.querySelectorAll('.box-shadow-full');

    if (!('IntersectionObserver' in window) || !targets.length) {
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    targets.forEach(function (el, i) {
      el.classList.add('reveal');
      el.style.transitionDelay = Math.min(i * 80, 320) + 'ms';
      observer.observe(el);
    });
  });
})();

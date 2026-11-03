/**
* Template Name: DevFolio - v2.3.0
* Template URL: https://bootstrapmade.com/devfolio-bootstrap-portfolio-html-template/
* Author: BootstrapMade.com
* License: https://bootstrapmade.com/license/
*/
(function() {
  "use strict";

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var scrollBehavior = reduceMotion ? 'auto' : 'smooth';
  var mainNav = document.getElementById('mainNav');
  var navCollapse = document.getElementById('navbarDefault');
  var navHeight = mainNav ? mainNav.offsetHeight : 0;
  var scrollOffset = navHeight - 22;

  /*--/ Collapse (mobile menu + skills accordion) /--*/
  var COLLAPSE_MS = 350; // Matches the .collapsing transition in bootstrap.min.css

  function setCollapse(target, open) {
    if (target.classList.contains('collapsing') || target.classList.contains('show') === open) {
      return;
    }
    document.querySelectorAll('[data-toggle="collapse"][data-target="#' + target.id + '"]').forEach(function(trigger) {
      trigger.classList.toggle('collapsed', !open);
      trigger.setAttribute('aria-expanded', open);
    });
    if (reduceMotion) {
      target.classList.toggle('show', open);
      return;
    }
    // Pin the start height, switch to the animating state, then set the end height so the transition runs.
    target.style.height = (open ? 0 : target.getBoundingClientRect().height) + 'px';
    target.classList.remove('collapse', 'show');
    target.classList.add('collapsing');
    void target.offsetHeight;
    target.style.height = open ? target.scrollHeight + 'px' : '0px';
    setTimeout(function() {
      target.classList.remove('collapsing');
      target.classList.add('collapse');
      target.classList.toggle('show', open);
      target.style.height = '';
    }, COLLAPSE_MS);
  }

  document.querySelectorAll('[data-toggle="collapse"]').forEach(function(trigger) {
    trigger.addEventListener('click', function(e) {
      e.preventDefault();
      var target = document.querySelector(trigger.getAttribute('data-target'));
      if (!target) {
        return;
      }
      var open = !target.classList.contains('show');
      var parent = target.getAttribute('data-parent');
      if (open && parent) {
        document.querySelectorAll(parent + ' .collapse.show[data-parent="' + parent + '"]').forEach(function(sibling) {
          setCollapse(sibling, false);
        });
      }
      setCollapse(target, open);
    });
  });

  document.querySelectorAll('.navbar-toggler').forEach(function(toggler) {
    toggler.addEventListener('click', function() {
      mainNav.classList.add('navbar-reduce');
    });
  });

  // Preloader
  window.addEventListener('load', function() {
    var preloader = document.getElementById('preloader');
    if (preloader) {
      setTimeout(function() {
        preloader.classList.add('is-hidden');
        setTimeout(function() {
          preloader.remove();
        }, 600);
      }, 100);
    }
  });

  // Back to top button
  var backToTop = document.querySelector('.back-to-top');
  if (backToTop) {
    backToTop.addEventListener('click', function(e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: scrollBehavior });
    });
  }

  /*--/ Star Scrolling nav /--*/
  function scrollToTarget(target) {
    window.scrollTo({
      top: target.getBoundingClientRect().top + window.pageYOffset - scrollOffset,
      behavior: scrollBehavior
    });
  }

  document.querySelectorAll('a.js-scroll[href*="#"]:not([href="#"])').forEach(function(link) {
    link.addEventListener('click', function(e) {
      if (location.pathname.replace(/^\//, '') != link.pathname.replace(/^\//, '') || location.hostname != link.hostname) {
        return;
      }
      var target = document.getElementById(link.hash.slice(1));
      if (target) {
        e.preventDefault();
        scrollToTarget(target);
      }
    });
  });

  // Scroll to sections on load with hash links, once the page's images and fonts have settled its layout
  if (window.location.hash) {
    var initialTarget = document.getElementById(window.location.hash.slice(1));
    if (initialTarget) {
      window.addEventListener('load', function() {
        scrollToTarget(initialTarget);
      });
    }
  }

  // Closes responsive menu when a scroll trigger link is clicked
  document.querySelectorAll('.js-scroll').forEach(function(link) {
    link.addEventListener('click', function() {
      if (navCollapse) {
        setCollapse(navCollapse, false);
      }
    });
  });

  // Highlight the nav link for the section currently in view
  var spyLinks = Array.prototype.filter.call(document.querySelectorAll('#mainNav .nav-link[href^="#"]'), function(link) {
    return document.getElementById(link.hash.slice(1));
  });

  function updateScrollSpy() {
    var position = window.pageYOffset + navHeight;
    var atBottom = window.innerHeight + window.pageYOffset >= document.documentElement.scrollHeight - 1;
    var active = null;
    spyLinks.forEach(function(link) {
      var section = document.getElementById(link.hash.slice(1));
      if (section.getBoundingClientRect().top + window.pageYOffset <= position) {
        active = link;
      }
    });
    if (atBottom && spyLinks.length) {
      active = spyLinks[spyLinks.length - 1];
    }
    spyLinks.forEach(function(link) {
      link.classList.toggle('active', link === active);
    });
  }
  /*--/ End Scrolling nav /--*/

  /*--/ Navbar Menu Reduce + Back to top visibility /--*/
  function updateNavbar() {
    if (!mainNav) {
      return;
    }
    if (window.pageYOffset > 50) {
      mainNav.classList.add('navbar-reduce');
      mainNav.classList.remove('navbar-trans');
    } else {
      if (!navCollapse || !navCollapse.classList.contains('show')) {
        mainNav.classList.remove('navbar-reduce');
      }
      mainNav.classList.add('navbar-trans');
    }
  }

  var scrollQueued = false;
  function onScroll() {
    if (scrollQueued) {
      return;
    }
    scrollQueued = true;
    requestAnimationFrame(function() {
      scrollQueued = false;
      updateNavbar();
      updateScrollSpy();
      if (backToTop) {
        backToTop.classList.toggle('is-visible', window.pageYOffset > 100);
      }
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /*--/ Star Typed /--*/
  var typedTarget = document.querySelector('.text-slider');
  var typedSource = document.querySelector('.text-slider-items');
  if (typedTarget && typedSource) {
    var strings = typedSource.textContent.split(',');
    if (reduceMotion) {
      typedTarget.textContent = strings[0];
    } else {
      var cursor = document.createElement('span');
      cursor.className = 'typed-cursor';
      cursor.setAttribute('aria-hidden', 'true');
      cursor.textContent = '|';
      typedTarget.parentNode.insertBefore(cursor, typedTarget.nextSibling);

      var stringIndex = 0;
      var charIndex = 0;
      var deleting = false;
      var humanize = function(speed) {
        return speed + Math.round(Math.random() * speed / 2);
      };
      (function tick() {
        var current = strings[stringIndex];
        charIndex += deleting ? -1 : 1;
        typedTarget.textContent = current.slice(0, charIndex);
        var delay = humanize(deleting ? 30 : 80);
        if (!deleting && charIndex === current.length) {
          deleting = true;
          delay = 1100;
        } else if (deleting && charIndex === 0) {
          deleting = false;
          stringIndex = (stringIndex + 1) % strings.length;
        }
        setTimeout(tick, delay);
      })();
    }
  }

  /*--/ Contact Form (AJAX, no page redirect) /--*/
  var contactForm = document.getElementById('contactForm');
  if (contactForm) {
    var loadingEl = contactForm.querySelector('.loading');
    var errorEl = contactForm.querySelector('.error-message');
    var sentEl = contactForm.querySelector('.sent-message');

    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();

      loadingEl.style.display = 'block';
      errorEl.style.display = 'none';
      sentEl.style.display = 'none';

      fetch(contactForm.action, {
        method: 'POST',
        body: new FormData(contactForm),
        headers: { 'Accept': 'application/json' }
      }).then(function(response) {
        loadingEl.style.display = 'none';
        if (response.ok) {
          sentEl.style.display = 'block';
          contactForm.reset();
        } else {
          response.json().then(function(data) {
            var message = (data && data.errors && data.errors.map(function(err) { return err.message; }).join(', ')) || 'Something went wrong. Please try again.';
            errorEl.textContent = message;
            errorEl.style.display = 'block';
          }).catch(function() {
            errorEl.textContent = 'Something went wrong. Please try again.';
            errorEl.style.display = 'block';
          });
        }
      }).catch(function() {
        loadingEl.style.display = 'none';
        errorEl.textContent = 'Something went wrong. Please check your connection and try again.';
        errorEl.style.display = 'block';
      });
    });
  }

  /*--/ Scroll Reveal /--*/
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    var revealObserver = new IntersectionObserver(function(entries, observer) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0, rootMargin: '0px 0px -10% 0px' });
    revealEls.forEach(function(el) {
      revealObserver.observe(el);
    });
  } else {
    revealEls.forEach(function(el) {
      el.classList.add('is-visible');
    });
  }

})();

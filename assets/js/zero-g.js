/*--/ Zero-G mode: fly one parabola. The page pulls 1.8 g, floats for 20 seconds, then settles back. /--*/
(function() {
  "use strict";

  var trigger = document.querySelector('.zero-g-trigger');
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!trigger || reduceMotion) {
    return;
  }
  trigger.hidden = false;

  var PULL_UP_MS = 1500;
  var WEIGHTLESS_S = 20;
  var PULL_OUT_MS = 1200;
  var MAX_PIECES = 80;
  var CRUISE_SPEED = 60; // px/s; cabin air slows anything faster back down to a drift
  var MAX_THROW = 1400; // px/s
  var BOUNCE = 0.85; // share of speed kept after hitting a screen edge
  var SCROLL_KEYS = [' ', 'PageUp', 'PageDown', 'Home', 'End', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

  // Card-sized chunks of the page that come loose. Anything nested inside another piece moves with it.
  var PIECE_SELECTOR = [
    '.intro-title', '.intro-subtitle', '.intro-cta', '.intro-scroll-down',
    '.stat',
    '.title-a', '.title-left', '.subtitle-a', '.line-mf', '.section-line',
    '.about-img', '.education-entry', '.about-me .lead', '.doc-preview',
    '.experience-title', '.experience-subtitle', '.experience-institution', '.experience-detail',
    '.photo-credit', '.box-shadow-full .text-center > img', '.btn-link', '.experience-video',
    '.award-group-title', '.award-box',
    '.featured-box',
    '.skill-accordion-header', '.skill-tag',
    '.contact-info-inline li', '.form-group', '.php-email-form button[type="submit"]'
  ].join(',');

  var root = document.documentElement;
  var phase = 'idle'; // idle -> pull-up -> weightless -> pull-out -> landing -> idle
  var pieces = [];
  var pieceByEl = new Map();
  var timers = [];
  var bounds, lastFrame, dragged, returnFocusTo;
  var hud, hudValue, hudPhase, restoreBtn;

  var announcer = document.createElement('div');
  announcer.className = 'sr-only';
  announcer.setAttribute('aria-live', 'polite');
  document.body.appendChild(announcer);

  function flying() {
    return phase === 'pull-up' || phase === 'weightless' || phase === 'pull-out';
  }

  function later(fn, ms) {
    timers.push(setTimeout(fn, ms));
  }

  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }

  function setMeter(value, label) {
    hudValue.textContent = value;
    hudPhase.textContent = label;
  }

  /*--/ Pieces /--*/
  function collectPieces() {
    var candidates = Array.prototype.slice.call(document.querySelectorAll(PIECE_SELECTOR));
    var candidateSet = new Set(candidates);
    return candidates.filter(function(el) {
      for (var parent = el.parentElement; parent; parent = parent.parentElement) {
        if (candidateSet.has(parent)) {
          return false;
        }
      }
      var reveal = el.closest('.reveal');
      if (reveal && !reveal.classList.contains('is-visible')) {
        return false;
      }
      // Transforms don't apply to plain inline elements.
      var display = getComputedStyle(el).display;
      if (display === 'inline' || display === 'none' || display === 'contents') {
        return false;
      }
      var r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && r.bottom > bounds.top && r.top < bounds.bottom && r.right > 0 && r.left < bounds.right;
    }).slice(0, MAX_PIECES);
  }

  function lift(el) {
    var piece = { el: el, saved: el.getAttribute('style'), x: 0, y: 0, angle: 0, dragging: false };
    // Freeze any CSS animation/transition so the element follows the physics exactly,
    // and keep whatever transform it already had (e.g. the centered hero button).
    el.style.animation = 'none';
    el.style.transition = 'none';
    var cs = getComputedStyle(el);
    piece.base = cs.transform === 'none' ? '' : cs.transform + ' ';
    if (cs.position === 'static') {
      el.style.position = 'relative';
    }
    el.style.zIndex = '1000';
    el.style.willChange = 'transform';
    el.classList.add('zero-g-piece');
    piece.rect = el.getBoundingClientRect();

    // A gentle drift, mostly upward like loose objects at the top of the pull-up. Big pieces spin slower.
    var speed = 25 + Math.random() * 35;
    var direction = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.2;
    piece.vx = Math.cos(direction) * speed;
    piece.vy = Math.sin(direction) * speed;
    var size = Math.max(piece.rect.width, piece.rect.height);
    piece.spin = (Math.random() - 0.5) * 30 * Math.min(1, 160 / size);

    pieceByEl.set(el, piece);
    return piece;
  }

  function render(p) {
    p.el.style.transform = p.base + 'translate(' + p.x.toFixed(1) + 'px, ' + p.y.toFixed(1) + 'px) rotate(' + p.angle.toFixed(2) + 'deg)';
  }

  function bounce(p) {
    var r = p.rect;
    if (r.width < bounds.right) {
      if ((r.left + p.x < 0 && p.vx < 0) || (r.right + p.x > bounds.right && p.vx > 0)) {
        p.vx = -p.vx * BOUNCE;
      }
    } else {
      p.vx = 0;
    }
    if (r.height < bounds.bottom - bounds.top) {
      if ((r.top + p.y < bounds.top && p.vy < 0) || (r.bottom + p.y > bounds.bottom && p.vy > 0)) {
        p.vy = -p.vy * BOUNCE;
      }
    } else {
      p.vy = 0;
    }
  }

  function step(now) {
    if (phase !== 'weightless') {
      return;
    }
    var dt = Math.min((now - lastFrame) / 1000, 0.05);
    lastFrame = now;
    pieces.forEach(function(p) {
      if (!p.dragging) {
        var speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > CRUISE_SPEED) {
          var drag = Math.max(Math.exp(-1.5 * dt), CRUISE_SPEED / speed);
          p.vx *= drag;
          p.vy *= drag;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.angle += p.spin * dt;
        bounce(p);
      }
      render(p);
    });
    requestAnimationFrame(step);
  }

  /*--/ Flight sequence /--*/
  function start() {
    if (phase !== 'idle') {
      return;
    }
    var nav = document.getElementById('mainNav');
    bounds = {
      top: nav ? nav.getBoundingClientRect().bottom : 0,
      right: root.clientWidth,
      bottom: window.innerHeight
    };
    pieces = collectPieces().map(lift);
    if (!pieces.length) {
      return;
    }
    root.classList.add('zero-g');
    returnFocusTo = document.activeElement;
    showHud();

    phase = 'pull-up';
    setMeter('1.8', 'Pull-up');
    announcer.textContent = 'Pull-up, 1.8 g.';
    // Everything presses down a little under the extra g.
    pieces.forEach(function(p) {
      p.y = 6;
      p.el.style.transition = 'transform ' + PULL_UP_MS + 'ms ease-in';
      render(p);
    });
    later(weightless, PULL_UP_MS);
  }

  function weightless() {
    phase = 'weightless';
    pieces.forEach(function(p) {
      p.el.style.transition = 'none';
    });
    setMeter('0', 'Weightless · ' + WEIGHTLESS_S + ' s');
    announcer.textContent = 'Weightless for ' + WEIGHTLESS_S + ' seconds. Drag things around, or press Escape to restore gravity.';
    for (var s = 1; s < WEIGHTLESS_S; s++) {
      later(setMeter.bind(null, '0', 'Weightless · ' + (WEIGHTLESS_S - s) + ' s'), s * 1000);
    }
    later(pullOut, WEIGHTLESS_S * 1000);
    lastFrame = performance.now();
    requestAnimationFrame(step);
  }

  function pullOut() {
    if (phase !== 'pull-up' && phase !== 'weightless') {
      return;
    }
    clearTimers();
    phase = 'pull-out';
    dragged = null;
    setMeter('1.8', 'Pull-out');
    // Take the shortest way back upright, then glide everything home.
    pieces.forEach(function(p) {
      p.dragging = false;
      p.angle = ((p.angle % 360) + 540) % 360 - 180;
      p.el.style.transition = 'none';
      render(p);
    });
    void root.offsetHeight;
    pieces.forEach(function(p) {
      p.el.style.transition = 'transform ' + PULL_OUT_MS + 'ms cubic-bezier(0.55, 0, 0.35, 1)';
      p.x = 0;
      p.y = 0;
      p.angle = 0;
      render(p);
    });
    later(land, PULL_OUT_MS);
  }

  function land() {
    pieces.forEach(function(p) {
      p.el.classList.remove('zero-g-piece', 'is-dragging');
      // Always write the attribute first: after style.* edits, Chrome's removeAttribute
      // alone leaves an empty style="" behind.
      p.el.setAttribute('style', p.saved || '');
      if (p.saved === null) {
        p.el.removeAttribute('style');
      }
    });
    pieces = [];
    pieceByEl.clear();
    root.classList.remove('zero-g');
    phase = 'landing';
    setMeter('1', 'Level flight');
    announcer.textContent = 'Gravity restored.';
    if (returnFocusTo && returnFocusTo.focus && document.body.contains(returnFocusTo)) {
      returnFocusTo.focus({ preventScroll: true });
    }
    later(hideHud, 1200);
  }

  /*--/ g-meter /--*/
  function showHud() {
    hud = document.createElement('div');
    hud.className = 'zero-g-hud';
    hud.innerHTML =
      '<div class="zero-g-meter"><span class="zero-g-value"></span><span class="zero-g-unit">g</span></div>' +
      '<div class="zero-g-phase"></div>' +
      '<button type="button" class="zero-g-restore">Restore gravity</button>';
    document.body.appendChild(hud);
    hudValue = hud.querySelector('.zero-g-value');
    hudPhase = hud.querySelector('.zero-g-phase');
    restoreBtn = hud.querySelector('.zero-g-restore');
    restoreBtn.addEventListener('click', pullOut);
    requestAnimationFrame(function() {
      hud.classList.add('is-visible');
    });
    restoreBtn.focus({ preventScroll: true });
  }

  function hideHud() {
    var oldHud = hud;
    oldHud.classList.remove('is-visible');
    setTimeout(function() {
      oldHud.remove();
    }, 300);
    hud = null;
    phase = 'idle';
  }

  /*--/ Grab and throw /--*/
  document.addEventListener('pointerdown', function(e) {
    var el = phase === 'weightless' && e.target.closest && e.target.closest('.zero-g-piece');
    var p = el && pieceByEl.get(el);
    if (!p) {
      return;
    }
    e.preventDefault();
    dragged = p;
    p.dragging = true;
    p.pointerId = e.pointerId;
    p.lastX = e.clientX;
    p.lastY = e.clientY;
    p.lastT = e.timeStamp;
    p.vx = 0;
    p.vy = 0;
    p.el.classList.add('is-dragging');
    p.el.style.zIndex = '1001';
    try {
      p.el.setPointerCapture(e.pointerId);
    } catch (err) {
      // Pointer capture is a nicety; dragging still works through the document listeners.
    }
  });

  document.addEventListener('pointermove', function(e) {
    var p = dragged;
    if (!p || e.pointerId !== p.pointerId) {
      return;
    }
    var dt = Math.max((e.timeStamp - p.lastT) / 1000, 0.001);
    var dx = e.clientX - p.lastX;
    var dy = e.clientY - p.lastY;
    p.x += dx;
    p.y += dy;
    // Smooth the release speed over the last few moves.
    p.vx = p.vx * 0.6 + (dx / dt) * 0.4;
    p.vy = p.vy * 0.6 + (dy / dt) * 0.4;
    p.lastX = e.clientX;
    p.lastY = e.clientY;
    p.lastT = e.timeStamp;
  });

  function release(e) {
    var p = dragged;
    if (!p || e.pointerId !== p.pointerId) {
      return;
    }
    dragged = null;
    p.dragging = false;
    p.el.classList.remove('is-dragging');
    p.el.style.zIndex = '1000';
    if (e.timeStamp - p.lastT > 100) {
      // Held still before letting go, so it stays put, just like in the cabin.
      p.vx = 0;
      p.vy = 0;
    }
    var speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
    if (speed > MAX_THROW) {
      p.vx *= MAX_THROW / speed;
      p.vy *= MAX_THROW / speed;
    }
  }
  document.addEventListener('pointerup', release);
  document.addEventListener('pointercancel', release);

  /*--/ Keep the page still during the flight /--*/
  function blockDuringFlight(e) {
    if (!flying() || (hud && hud.contains(e.target))) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
  }
  ['click', 'mousedown', 'dragstart'].forEach(function(type) {
    document.addEventListener(type, blockDuringFlight, true);
  });
  ['wheel', 'touchmove'].forEach(function(type) {
    document.addEventListener(type, blockDuringFlight, { capture: true, passive: false });
  });

  document.addEventListener('keydown', function(e) {
    if (flying()) {
      if (e.key === 'Escape') {
        e.preventDefault();
        pullOut();
      } else if (e.key === 'Tab') {
        // The restore button is the only control while flying.
        e.preventDefault();
        restoreBtn.focus({ preventScroll: true });
      } else if (SCROLL_KEYS.indexOf(e.key) !== -1 && !(e.key === ' ' && hud && hud.contains(e.target))) {
        e.preventDefault();
      }
      return;
    }
    var typing = e.target.closest && e.target.closest('input, textarea, select, [contenteditable]');
    if ((e.key === 'g' || e.key === 'G') && !e.ctrlKey && !e.metaKey && !e.altKey && !e.repeat && !typing) {
      start();
    }
  });

  window.addEventListener('resize', pullOut);
  trigger.addEventListener('click', start);
})();

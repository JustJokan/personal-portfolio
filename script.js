(function () {
  'use strict';

  const rail = document.getElementById('rail');
  if (!rail) return;

  const navLinks = Array.from(document.querySelectorAll('.nav-link'));
  const counterEl = document.getElementById('counter');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const brandLink = document.getElementById('brandLink');
  const viewProjectsBtn = document.getElementById('viewProjectsBtn');
  const typedTextEl = document.getElementById('typedText');

  const TYPED = "builds hybrid systems on the cloud, then measures them with data.";
  const desktopQuery = window.matchMedia('(min-width: 701px)');
  const isDesktop = () => desktopQuery.matches;

  function panels() {
    return Array.from(rail.querySelectorAll('[data-stop]'));
  }

  // ---- hero typing effect ----
  function typeText(i) {
    if (!typedTextEl) return;
    typedTextEl.textContent = TYPED.slice(0, i);
    if (i <= TYPED.length) {
      setTimeout(() => typeText(i + 1), i === 0 ? 500 : 26);
    }
  }
  typeText(0);

  // ---- shared state ----
  let active = 0;
  let animating = false;
  let animStart = 0;
  let animTo = 0;
  let lastInput = 0;
  let wheelLock = 0;
  let settleTimer = null;
  let scrollRaf = null;

  function leftOf(el) {
    return el.getBoundingClientRect().left - rail.getBoundingClientRect().left + rail.scrollLeft;
  }

  function nearestByX(x) {
    const els = panels();
    let best = 0;
    let bestDist = Infinity;
    els.forEach((el, i) => {
      const d = Math.abs(leftOf(el) - x);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    return best;
  }

  function setActive(i) {
    const els = panels();
    const el = els[i];
    if (!el) return;
    active = i;
    const key = el.dataset.nav || 'home';
    navLinks.forEach((btn) => btn.classList.toggle('active', btn.dataset.target === key));
    if (counterEl) {
      counterEl.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(els.length).padStart(2, '0');
    }
  }

  // ---- desktop horizontal navigation ----
  function goTo(i) {
    const els = panels();
    const n = Math.max(0, Math.min(els.length - 1, i));
    const target = els[n];
    if (!target) return;

    animating = true;
    animStart = Date.now();
    animTo = n;
    clearTimeout(settleTimer);

    const left = leftOf(target);
    rail.scrollTo({ left, behavior: 'smooth' });
    setActive(n);

    const finish = (tries) => {
      settleTimer = setTimeout(() => {
        if (lastInput && lastInput > animStart + 40) { animating = false; return; }
        const live = leftOf(target);
        if (Math.abs(rail.scrollLeft - live) > 2) {
          if (tries > 0) {
            rail.scrollTo({ left: live, behavior: 'auto' });
            return finish(tries - 1);
          }
        }
        animating = false;
      }, 400);
    };
    finish(1);
  }

  function step(d) {
    const midFlight = animating && Date.now() - animStart < 460;
    const from = midFlight ? active : nearestByX(rail.scrollLeft);
    goTo(from + d);
  }

  function canScrollVertically(node, dy) {
    let el = node;
    while (el && el !== rail && el.nodeType === 1) {
      const over = el.scrollHeight - el.clientHeight;
      if (over > 2) {
        const style = getComputedStyle(el);
        if (/(auto|scroll)/.test(style.overflowY)) {
          if (dy > 0 && el.scrollTop < over - 1) return true;
          if (dy < 0 && el.scrollTop > 1) return true;
        }
      }
      el = el.parentElement;
    }
    return false;
  }

  function onWheel(e) {
    if (!isDesktop()) return;
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    if (canScrollVertically(e.target, e.deltaY)) return;
    e.preventDefault();
    const now = Date.now();
    if (wheelLock && now - wheelLock < 520) return;
    if (Math.abs(e.deltaY) < 6) return;
    wheelLock = now;
    step(e.deltaY > 0 ? 1 : -1);
  }
  window.addEventListener('wheel', onWheel, { passive: false });

  function onKeydown(e) {
    if (!isDesktop()) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); step(1); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); step(-1); }
    else if (e.key === 'Home') { e.preventDefault(); goTo(0); }
    else if (e.key === 'End') { e.preventDefault(); goTo(panels().length - 1); }
  }
  window.addEventListener('keydown', onKeydown);

  const markInput = () => { lastInput = Date.now(); };
  ['wheel', 'pointerdown', 'touchstart', 'keydown'].forEach((t) =>
    window.addEventListener(t, markInput, { passive: true, capture: true })
  );

  rail.addEventListener('scroll', () => {
    if (!isDesktop()) return;
    cancelAnimationFrame(scrollRaf);
    scrollRaf = requestAnimationFrame(() => {
      const best = nearestByX(rail.scrollLeft);
      if (animating) {
        const userMoved = lastInput && lastInput > animStart + 40;
        if (best === animTo || userMoved) { animating = false; }
        else if (Date.now() - animStart < 460) { return; }
        else { animating = false; }
      }
      if (best !== active) setActive(best);
    });
  });

  // ---- mobile scrollspy (normal vertical page, no horizontal stepping) ----
  let mobileTicking = false;
  function updateMobileActive() {
    const els = panels();
    const line = 140; // px from top — clears the sticky nav bar
    let best = 0;
    let bestDist = Infinity;
    els.forEach((el, i) => {
      const d = Math.abs(el.getBoundingClientRect().top - line);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    setActive(best);
  }
  window.addEventListener('scroll', () => {
    if (isDesktop()) return;
    if (mobileTicking) return;
    mobileTicking = true;
    requestAnimationFrame(() => {
      updateMobileActive();
      mobileTicking = false;
    });
  }, { passive: true });

  // ---- nav targets (shared by nav links, brand, and the hero CTA) ----
  function firstPanelFor(key) {
    const els = panels();
    const i = els.findIndex((el) => el.dataset.nav === key);
    return i < 0 ? 0 : i;
  }

  function navigateTo(key) {
    const i = firstPanelFor(key);
    if (isDesktop()) {
      goTo(i);
      return;
    }
    const el = panels()[i];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActive(i);
  }

  navLinks.forEach((btn) => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.target));
  });

  if (brandLink) {
    brandLink.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo('home');
    });
  }

  if (viewProjectsBtn) {
    viewProjectsBtn.addEventListener('click', () => navigateTo('projects'));
  }

  if (prevBtn) prevBtn.addEventListener('click', () => step(-1));
  if (nextBtn) nextBtn.addEventListener('click', () => step(1));

  setActive(0);
})();

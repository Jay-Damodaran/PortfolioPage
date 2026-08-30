/**
 * nav.js — shared navigation behavior for BOTH pages (index.html + docs.html).
 *
 * Owns: smooth scroll for same-page anchors, the mobile hamburger menu, and
 * re-scrolling to a #hash after async content loads (without this, landing on
 * index.html#certifications scrolls too early — the markdown sections load a
 * moment later and push the target further down the page).
 *
 * Self-initializing: just include it as a module script (docs.html) or import
 * it (main.js) — the module body runs once per page.
 */

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

function initHamburger() {
  const toggle = document.getElementById('nav-toggle');
  const links = document.querySelector('.nav-links');
  if (!toggle || !links) return;

  const setOpen = (open) => {
    links.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };
  toggle.addEventListener('click', () => setOpen(!links.classList.contains('open')));
  // Choosing a destination (or tapping outside the menu) closes the dropdown.
  links.addEventListener('click', (e) => {
    if (e.target.closest('a')) setOpen(false);
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.top-nav')) setOpen(false);
  });
}

/**
 * Re-scroll to the URL hash once async content has rendered, so cross-page
 * links like index.html#endorsements land on the right section.
 */
export function scrollToHash() {
  if (!location.hash) return;
  try {
    document.querySelector(location.hash)?.scrollIntoView({ block: 'start' });
  } catch {
    /* malformed hash — ignore */
  }
}

initSmoothScroll();
initHamburger();

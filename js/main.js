/**
 * main.js — entry module for index.html.
 *
 * Owns: nav smooth-scroll, hero photo rotation + "I'm a…" statement cycling
 * with tracker bubbles, and the Education step-by-step reveal (a figure
 * lifting the current credential overhead). Portfolio / certification /
 * endorsement rendering lives in portfolio.js.
 */

import {
  HERO_IMAGES,
  HERO_STATEMENTS,
  HERO_CYCLE_INTERVAL_MS,
  EDUCATION_PATHS,
} from './content.js';
import { scrollToHash } from './nav.js'; // also wires smooth scroll + hamburger
import { parseFrontmatter, parseSchemaDate, formatSchemaDate, esc } from './frontmatter.js';
import { initPortfolioSections } from './portfolio.js';

/** True when the visitor prefers reduced motion — auto-cycling is disabled. */
const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ================================================================== */
/* Hero — photos + statements advance IN SYNC on one shared timer      */
/* ================================================================== */

function initHero() {
  const photoHost = document.getElementById('hero-photos');
  const textEl = document.getElementById('hero-statement');
  const bubbleHost = document.getElementById('hero-bubbles');
  if (!photoHost || !textEl || !bubbleHost || HERO_STATEMENTS.length === 0) return;

  // Build the photo stack.
  photoHost.replaceChildren();
  HERO_IMAGES.forEach((img, i) => {
    const el = document.createElement('img');
    el.src = img.src;
    el.alt = img.alt;
    el.className = 'hero-photo' + (i === 0 ? ' active' : '');
    el.loading = i === 0 ? 'eager' : 'lazy';
    photoHost.appendChild(el);
  });
  const photos = photoHost.querySelectorAll('.hero-photo');

  // One tracker bubble per statement; clicking a bubble jumps the whole cycle.
  bubbleHost.replaceChildren();
  HERO_STATEMENTS.forEach((_, i) => {
    const b = document.createElement('button');
    b.className = 'bubble' + (i === 0 ? ' active' : '');
    b.setAttribute('aria-label', `Show statement ${i + 1}`);
    b.addEventListener('click', () => show(i, true));
    bubbleHost.appendChild(b);
  });
  const bubbles = bubbleHost.querySelectorAll('.bubble');

  let current = 0;
  let timer = null;
  /** Advance photo N and statement N together (photo wraps if fewer images). */
  const show = (idx, manual = false) => {
    bubbles[current].classList.remove('active');
    current = idx;
    bubbles[current].classList.add('active');
    photos.forEach((p, i) => p.classList.toggle('active', i === current % photos.length));
    // Fade the text out, swap it, fade back in.
    textEl.classList.add('fading');
    setTimeout(() => {
      textEl.textContent = HERO_STATEMENTS[current];
      textEl.classList.remove('fading');
    }, 250);
    if (manual) restart(); // reset the timer so a click isn't instantly overridden
  };
  const restart = () => {
    clearInterval(timer);
    if (prefersReducedMotion()) return; // bubbles still work; no auto-advance
    timer = setInterval(() => show((current + 1) % HERO_STATEMENTS.length), HERO_CYCLE_INTERVAL_MS);
  };
  textEl.textContent = HERO_STATEMENTS[0];
  restart();
}

/* ================================================================== */
/* Education — sequential step reveal with credential-lifting figure   */
/* ================================================================== */

/**
 * A simple line-art figure with arms raised, lifting a credential overhead.
 * Placed under the CURRENT education stage (date: present, or the latest).
 * Swap this SVG for a capped-graduate or suit-and-briefcase variant later —
 * see modification_instructions.md.
 */
const FIGURE_SVG = `
  <svg viewBox="0 0 60 80" class="edu-figure-svg" aria-hidden="true">
    <!-- credential held overhead -->
    <rect x="12" y="4" width="36" height="12" rx="2" class="edu-figure-credential"/>
    <!-- head -->
    <circle cx="30" cy="30" r="7" class="edu-figure-line" fill="none"/>
    <!-- arms raised to the credential -->
    <path d="M30 40 L16 18 M30 40 L44 18" class="edu-figure-line" fill="none"/>
    <!-- torso and legs -->
    <path d="M30 37 L30 58 M30 58 L20 76 M30 58 L40 76" class="edu-figure-line" fill="none"/>
  </svg>`;

async function loadEducation() {
  const results = await Promise.allSettled(
    EDUCATION_PATHS.map(async (path) => {
      const res = await fetch(path);
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${path}`);
      const { data } = parseFrontmatter(await res.text());
      return { ...data, parsedDate: parseSchemaDate(data.date) };
    })
  );
  return results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
}

function renderEducation(entries) {
  const host = document.getElementById('education-steps');
  if (!host) return;

  // Ascending stages: earliest first, "present" (ongoing) last.
  const sorted = [...entries].sort((a, b) => {
    if (a.parsedDate.present !== b.parsedDate.present) return a.parsedDate.present ? 1 : -1;
    return (a.parsedDate.date?.getTime() ?? 0) - (b.parsedDate.date?.getTime() ?? 0);
  });
  const currentIdx = sorted.length - 1; // figure stands at the current stage

  host.replaceChildren();
  sorted.forEach((entry, i) => {
    const step = document.createElement('div');
    step.className = 'edu-step';
    step.style.setProperty('--step-index', i); // drives the stagger delay in CSS
    const heading = entry.alias || entry.title;
    const subtitle = entry.alias ? entry.title : '';
    step.innerHTML = `
      <div class="edu-card">
        <h3 class="edu-title">${esc(heading)}</h3>
        ${subtitle ? `<p class="edu-subtitle">(${esc(subtitle)})</p>` : ''}
        ${entry.concentration ? `<p class="edu-detail">${esc(entry.concentration)} concentration</p>` : ''}
        ${entry.honors ? `<p class="edu-detail edu-honors">${esc(entry.honors)}</p>` : ''}
        <p class="edu-school">${esc(entry.school || '')}</p>
        <p class="edu-date">${entry.parsedDate.present ? 'In progress' : esc(formatSchemaDate(entry.parsedDate))}</p>
      </div>
      <div class="edu-figure">${i === currentIdx ? FIGURE_SVG : ''}</div>`;
    host.appendChild(step);
  });

  // Reveal steps one at a time once the section scrolls into view.
  new IntersectionObserver((observed, obs) => {
    if (observed.some((en) => en.isIntersecting)) {
      host.classList.add('revealed');
      obs.disconnect();
    }
  }, { threshold: 0.25 }).observe(host);
}

/* ================================================================== */
/* Boot                                                                */
/* ================================================================== */

initHero();
Promise.allSettled([
  loadEducation().then(renderEducation).catch((err) => console.error('Education load failed:', err)),
  initPortfolioSections().catch((err) => console.error('Portfolio load failed:', err)),
]).then(() => {
  // Content is in place — now the section heights are final, so a cross-page
  // link like index.html#endorsements can land on the right spot.
  scrollToHash();
});

/**
 * portfolio.js — markdown-driven sections: Portfolio (Timeline / List /
 * Detailed List), Certifications, and Endorsements.
 *
 * Data flow:
 *   content.js paths → fetch .md → frontmatter.js parse → item models
 *   → one shared detail renderer (renderDetail) used by ALL THREE places:
 *     timeline popup, List popup, and Detailed List blocks.
 *
 * Timeline theme: the axis is a spinal cord / major nerve; each event is a
 * nerve branching off it; the custom scrollbar thumb is an action potential
 * travelling along a nerve track. Visual constants are grouped in TL below
 * so they are easy to tweak.
 */

import {
  PORTFOLIO_PATHS,
  CERTIFICATION_PATHS,
  CERTIFICATION_CATEGORIES,
  ENDORSEMENT_PATHS,
} from './content.js';
import { parseFrontmatter, parseSchemaDate, formatSchemaDate, esc, safeUrl } from './frontmatter.js';

/* ================================================================== */
/* Type styling — colors must stay in sync with css/styles.css badges  */
/* ================================================================== */
const TYPE_CONFIG = {
  project:     { label: 'Project',     plural: 'Projects',     color: '#4fc3f7', glyph: 'P' },
  competition: { label: 'Competition', plural: 'Competitions', color: '#ffd54f', glyph: 'C' },
  work:        { label: 'Work',        plural: 'Work',         color: '#81c784', glyph: 'W' },
  experience:  { label: 'Experience',  plural: 'Experiences',  color: '#b39dfb', glyph: 'E' },
};
/** Grouping order used by the List and Detailed List views. */
const TYPE_ORDER = ['work', 'experience', 'project', 'competition'];

/** True when the visitor prefers reduced motion — skips decorative animations. */
const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ================================================================== */
/* Loading                                                             */
/* ================================================================== */

async function fetchMarkdown(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}: HTTP ${res.status}`);
  return parseFrontmatter(await res.text());
}

/** Build one portfolio item model from a markdown file. */
async function loadItem(path) {
  const { data, body } = await fetchMarkdown(path);
  const type = String(data.type || 'project').toLowerCase();
  const start = parseSchemaDate(data.start);
  const end = parseSchemaDate(data.end);
  return {
    path,
    title: data.title || path,
    type: TYPE_CONFIG[type] ? type : 'project',
    role: data.role || '',
    org: data.org || '',
    start,
    end,
    image: data.image || '',
    links: Array.isArray(data.links) ? data.links : [],
    bodyHtml: window.marked ? window.marked.parse(body) : `<p>${esc(body)}</p>`,
    endorsements: [], // filled in after endorsements load
  };
}

async function loadEndorsement(path) {
  const { data } = await fetchMarkdown(path);
  return {
    person: data.person || '',
    roles: Array.isArray(data.roles) ? data.roles : [],
    quote: data.quote || '',
    related: data.related || '',
    display: (data.display || 'section').toLowerCase(), // spec default: section
  };
}

async function loadCertification(path) {
  const { data } = await fetchMarkdown(path);
  return {
    title: data.title || '',
    category: data.category || 'ML',
    certifier: data.certifier || '',
    date: parseSchemaDate(data.date),
    links: Array.isArray(data.links) ? data.links : [],
  };
}

/** Load a list of paths, skipping (and logging) any file that fails. */
async function loadAll(paths, loader) {
  const results = await Promise.allSettled(paths.map(loader));
  const ok = [];
  for (let i = 0; i < results.length; i++) {
    if (results[i].status === 'fulfilled') ok.push(results[i].value);
    else console.error(`Skipping ${paths[i]}:`, results[i].reason);
  }
  return ok;
}

/* ================================================================== */
/* Shared detail renderer — the ONE place item detail markup is built  */
/* ================================================================== */

function timespanText(item) {
  const s = formatSchemaDate(item.start);
  const e = formatSchemaDate(item.end);
  if (s && e && s !== e) return `${s} – ${e}`;
  return s || e || '';
}

/**
 * Render the full detail content for an item. Used by: the timeline popup,
 * the List popup, and each Detailed List block. Returns a DOM element.
 */
function renderDetail(item) {
  const cfg = TYPE_CONFIG[item.type];
  const el = document.createElement('article');
  el.className = 'item-detail';

  const meta = [item.role, item.org].filter(Boolean).join(' · ');
  const linksHtml = item.links
    .filter((l) => l && l.url)
    .map((l) => `<a class="detail-link" href="${esc(safeUrl(l.url))}" target="_blank" rel="noopener">${esc(l.label || l.url)} ↗</a>`)
    .join('');
  const endorseHtml = item.endorsements
    .map(
      (e) => `
      <blockquote class="card-endorsement">
        <p>“${esc(e.quote)}”</p>
        <footer><strong>${esc(e.person)}</strong>${e.roles.length ? ` — ${esc(e.roles.join('; '))}` : ''}</footer>
      </blockquote>`
    )
    .join('');

  el.innerHTML = `
    <header class="detail-header">
      <span class="type-badge" style="--type-color:${cfg.color}">${cfg.label}</span>
      <h3 class="detail-title">${esc(item.title)}</h3>
      ${meta ? `<p class="detail-meta">${esc(meta)}</p>` : ''}
      <p class="detail-timespan">${esc(timespanText(item))}</p>
    </header>
    ${item.image ? `<img class="detail-image" src="${esc(item.image)}" alt="${esc(item.title)}" loading="lazy">` : ''}
    <div class="detail-body">${item.bodyHtml}</div>
    ${linksHtml ? `<div class="detail-links">${linksHtml}</div>` : ''}
    ${endorseHtml ? `<div class="detail-endorsements">${endorseHtml}</div>` : ''}
  `;
  return el;
}

/* ================================================================== */
/* Detail modal (popup) — X button, click-outside, and Esc all close   */
/* ================================================================== */

const modal = {
  root: null,
  body: null,
  returnFocusTo: null, // element that opened the modal; focus restored on close
  open(item) {
    this.returnFocusTo = document.activeElement;
    this.body.replaceChildren(renderDetail(item));
    this.root.classList.add('open');
    this.root.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    this.root.querySelector('.modal-close').focus();
  },
  close() {
    this.root.classList.remove('open');
    this.root.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    if (this.returnFocusTo?.focus) this.returnFocusTo.focus();
  },
  init() {
    this.root = document.getElementById('detail-modal');
    this.body = this.root.querySelector('.modal-body');
    this.root.querySelector('.modal-close').addEventListener('click', () => this.close());
    // Click on the dimmed backdrop (not the card) closes.
    this.root.addEventListener('click', (e) => {
      if (e.target === this.root) this.close();
    });
    document.addEventListener('keydown', (e) => {
      if (!this.root.classList.contains('open')) return;
      if (e.key === 'Escape') {
        this.close();
        return;
      }
      // Trap Tab inside the dialog while it is open.
      if (e.key === 'Tab') {
        const focusables = this.root.querySelectorAll(
          'button, a[href], [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  },
};

/* ================================================================== */
/* List view — squircle cards: title, role, timespan only              */
/* ================================================================== */

/** Group items by type (TYPE_ORDER), newest first within each group. */
function groupItems(items) {
  return TYPE_ORDER.map((type) => ({
    type,
    items: items
      .filter((i) => i.type === type)
      .sort((a, b) => (b.start.date?.getTime() ?? 0) - (a.start.date?.getTime() ?? 0)),
  })).filter((g) => g.items.length > 0);
}

function renderListView(container, items) {
  container.replaceChildren();
  for (const group of groupItems(items)) {
    const cfg = TYPE_CONFIG[group.type];
    const section = document.createElement('div');
    section.className = 'list-group';
    section.innerHTML = `<h3 class="group-heading" style="--type-color:${cfg.color}">${cfg.plural}</h3>`;
    const grid = document.createElement('div');
    grid.className = 'squircle-grid';
    for (const item of group.items) {
      const btn = document.createElement('button');
      btn.className = 'squircle';
      btn.style.setProperty('--type-color', cfg.color);
      btn.innerHTML = `
        <span class="squircle-title">${esc(item.title)}</span>
        ${item.role ? `<span class="squircle-role">${esc(item.role)}</span>` : ''}
        <span class="squircle-span">${esc(timespanText(item))}</span>`;
      btn.addEventListener('click', () => modal.open(item));
      grid.appendChild(btn);
    }
    section.appendChild(grid);
    container.appendChild(section);
  }
}

/* ================================================================== */
/* Detailed List view — same detail content, inline resume-style       */
/* ================================================================== */

function renderDetailedView(container, items) {
  container.replaceChildren();
  for (const group of groupItems(items)) {
    const cfg = TYPE_CONFIG[group.type];
    const section = document.createElement('div');
    section.className = 'detailed-group';
    section.innerHTML = `<h3 class="group-heading" style="--type-color:${cfg.color}">${cfg.plural}</h3>`;
    for (const item of group.items) {
      const block = document.createElement('div');
      block.className = 'detail-block'; // low-chrome, document-style block
      block.appendChild(renderDetail(item));
      section.appendChild(block);
    }
    container.appendChild(section);
  }
}

/* ================================================================== */
/* Timeline view — nervous-system themed SVG                           */
/* ================================================================== */

/** Timeline visual constants — tweak freely. */
const TL = {
  padX: 90,            // horizontal padding before first / after last node (px)
  branchBase: 64,      // distance from cord to the first lane of nodes (px)
  laneGap: 74,         // extra distance per stacked lane (px)
  nodeRadius: 15,
  collisionPx: 95,     // nodes closer than this (px) stack into new lanes
  cordAmp: 10,         // amplitude of the cord's sine wiggle (px)
  cordWave: 220,       // wavelength of the wiggle (px)
  defaultPxPerMonth: 26, // zoom level the intro animation lands on
  maxPxPerMonth: 110,
  vertPxPerMonth: 16,  // fixed density for the mobile vertical layout
};

const tl = {
  items: [],
  minDate: null,
  maxDate: null,
  pxPerMonth: TL.defaultPxPerMonth,
  fitPxPerMonth: 4,
  scrollEl: null,
  svgHost: null,
  vertical: false,
  introPlayed: false,
};

function monthsBetween(a, b) {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}

/** x-position (px along the axis) for a date at the current zoom. */
function axisPos(date, pxPerMonth) {
  return TL.padX + monthsBetween(tl.minDate, date) * pxPerMonth
    + (date.getDate() / 30) * pxPerMonth;
}

/**
 * Assign each item a lane so near-date nodes fan out vertically instead of
 * overlapping. Lane n maps to: side = up/down alternating, level = n/2.
 */
function assignLanes(items, pxPerMonth) {
  const placed = [];
  return items.map((item) => {
    const x = axisPos(item.start.date, pxPerMonth);
    const taken = new Set(
      placed.filter((p) => Math.abs(p.x - x) < TL.collisionPx).map((p) => p.lane)
    );
    let lane = 0;
    while (taken.has(lane)) lane++;
    placed.push({ x, lane });
    const side = lane % 2 === 0 ? -1 : 1; // -1 = above cord, +1 = below
    const level = Math.floor(lane / 2);
    return { item, x, side, level };
  });
}

/** Small dendrite twigs radiating from a node, for the nerve-ending look. */
function dendrites(cx, cy, color) {
  let out = '';
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2 + 0.4;
    const x1 = cx + Math.cos(angle) * (TL.nodeRadius + 2);
    const y1 = cy + Math.sin(angle) * (TL.nodeRadius + 2);
    const x2 = cx + Math.cos(angle) * (TL.nodeRadius + 10);
    const y2 = cy + Math.sin(angle) * (TL.nodeRadius + 10);
    out += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1.4" opacity="0.55"/>`;
  }
  return out;
}

/** Build the full timeline SVG markup (horizontal orientation). */
function buildTimelineSvg(pxPerMonth) {
  const placedItems = assignLanes(tl.items, pxPerMonth);
  const maxLevel = Math.max(0, ...placedItems.map((p) => p.level));
  const halfHeight = TL.branchBase + (maxLevel + 1) * TL.laneGap + 30;
  const H = halfHeight * 2;
  const yc = halfHeight;
  const W = axisPos(tl.maxDate, pxPerMonth) + TL.padX;
  const cordY = (x) => yc + TL.cordAmp * Math.sin(x / TL.cordWave);

  /* Spinal cord: a soft glow layer under a brighter core stroke. */
  let cordPath = `M 0 ${cordY(0)}`;
  for (let x = 30; x <= W; x += 30) cordPath += ` L ${x} ${cordY(x).toFixed(1)}`;

  /* Year ticks along the cord (nodes of Ranvier). */
  let ticks = '';
  for (let y = tl.minDate.getFullYear(); y <= tl.maxDate.getFullYear(); y++) {
    const x = axisPos(new Date(y, 0, 1), pxPerMonth);
    if (x < TL.padX / 2 || x > W) continue;
    ticks += `
      <circle cx="${x}" cy="${cordY(x)}" r="4" class="tl-year-tick"/>
      <text x="${x}" y="${yc + halfHeight - 8}" class="tl-year-label" text-anchor="middle">${y}</text>`;
  }

  /* Branches + nodes. */
  let nodes = '';
  placedItems.forEach(({ item, x, side, level }, idx) => {
    const cfg = TYPE_CONFIG[item.type];
    const ny = yc + side * (TL.branchBase + level * TL.laneGap);
    const cy0 = cordY(x);
    // Organic branch: cubic curve drifting slightly sideways.
    const branch = `M ${x} ${cy0} C ${x + 8} ${cy0 + side * 20}, ${x - 8} ${ny - side * 20}, ${x} ${ny + side * TL.nodeRadius}`;
    const labelY = ny + side * (TL.nodeRadius + 18);
    const title = item.title.length > 26 ? item.title.slice(0, 24) + '…' : item.title;
    nodes += `
      <g class="tl-node" data-idx="${idx}" tabindex="0" role="button"
         aria-label="${esc(cfg.label)}: ${esc(item.title)}" style="--type-color:${cfg.color}">
        <path d="${branch}" class="tl-branch" stroke="${cfg.color}"/>
        ${dendrites(x, ny, cfg.color)}
        <circle cx="${x}" cy="${ny}" r="${TL.nodeRadius}" class="tl-soma" fill="${cfg.color}"/>
        <text x="${x}" y="${ny + 5}" class="tl-glyph" text-anchor="middle">${cfg.glyph}</text>
        <text x="${x}" y="${labelY + (side > 0 ? 8 : 0)}" class="tl-label" text-anchor="middle">${esc(title)}</text>
      </g>`;
  });

  return { placedItems, svg: `
    <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" class="tl-svg" role="list">
      <path d="${cordPath}" class="tl-cord-glow"/>
      <path d="${cordPath}" class="tl-cord"/>
      ${ticks}
      ${nodes}
    </svg>` };
}

/** Build the vertical (mobile) timeline SVG — axis runs top to bottom. */
function buildVerticalSvg() {
  const pxPerMonth = TL.vertPxPerMonth;
  const placedItems = assignLanes(tl.items, pxPerMonth); // x is axis position (vertical)
  const W = Math.min(window.innerWidth - 24, 420);
  const xc = 40; // cord near the left edge; branches extend right
  const H = axisPos(tl.maxDate, pxPerMonth) + TL.padX;
  const cordX = (y) => xc + 6 * Math.sin(y / 160);

  let cordPath = `M ${cordX(0)} 0`;
  for (let y = 24; y <= H; y += 24) cordPath += ` L ${cordX(y).toFixed(1)} ${y}`;

  let ticks = '';
  for (let y = tl.minDate.getFullYear(); y <= tl.maxDate.getFullYear(); y++) {
    const pos = axisPos(new Date(y, 0, 1), pxPerMonth);
    ticks += `
      <circle cx="${cordX(pos)}" cy="${pos}" r="3.5" class="tl-year-tick"/>
      <text x="6" y="${pos - 8}" class="tl-year-label">${y}</text>`;
  }

  let nodes = '';
  placedItems.forEach(({ item, x: pos, level }, idx) => {
    const cfg = TYPE_CONFIG[item.type];
    const nx = xc + 70 + level * 26; // all branches to the right on mobile
    const cx0 = cordX(pos);
    const branch = `M ${cx0} ${pos} C ${cx0 + 20} ${pos + 8}, ${nx - 20} ${pos - 8}, ${nx - TL.nodeRadius} ${pos}`;
    const title = item.title.length > 30 ? item.title.slice(0, 28) + '…' : item.title;
    nodes += `
      <g class="tl-node" data-idx="${idx}" tabindex="0" role="button"
         aria-label="${esc(cfg.label)}: ${esc(item.title)}" style="--type-color:${cfg.color}">
        <path d="${branch}" class="tl-branch" stroke="${cfg.color}"/>
        ${dendrites(nx, pos, cfg.color)}
        <circle cx="${nx}" cy="${pos}" r="${TL.nodeRadius}" class="tl-soma" fill="${cfg.color}"/>
        <text x="${nx}" y="${pos + 5}" class="tl-glyph" text-anchor="middle">${cfg.glyph}</text>
        <text x="${nx + TL.nodeRadius + 8}" y="${pos + 5}" class="tl-label">${esc(title)}</text>
      </g>`;
  });

  return { placedItems, svg: `
    <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" class="tl-svg" role="list">
      <path d="${cordPath}" class="tl-cord-glow"/>
      <path d="${cordPath}" class="tl-cord"/>
      ${ticks}
      ${nodes}
    </svg>` };
}

let currentPlacedItems = [];

/** (Re)render the timeline at the current zoom / orientation. */
function renderTimeline() {
  tl.vertical = window.matchMedia('(max-width: 768px)').matches;
  const { placedItems, svg } = tl.vertical
    ? buildVerticalSvg()
    : buildTimelineSvg(tl.pxPerMonth);
  currentPlacedItems = placedItems;
  tl.svgHost.innerHTML = svg;
  tl.scrollEl.classList.toggle('vertical', tl.vertical);
  syncApThumb();
}

/** Zoom keeping the date under the viewport center fixed. */
function setZoom(newPxPerMonth) {
  if (tl.vertical) return; // vertical layout uses a fixed density
  const clamped = Math.min(TL.maxPxPerMonth, Math.max(tl.fitPxPerMonth, newPxPerMonth));
  const centerAxis = tl.scrollEl.scrollLeft + tl.scrollEl.clientWidth / 2;
  const centerMonths = (centerAxis - TL.padX) / tl.pxPerMonth;
  tl.pxPerMonth = clamped;
  renderTimeline();
  tl.scrollEl.scrollLeft = TL.padX + centerMonths * clamped - tl.scrollEl.clientWidth / 2;
}

/** Intro: zoom in from the full (fit) timeline to the present. */
function playIntroAnimation() {
  if (tl.introPlayed || tl.vertical) return;
  tl.introPlayed = true;
  if (prefersReducedMotion()) {
    // Jump straight to the readable zoom level, no animated stretch.
    tl.pxPerMonth = TL.defaultPxPerMonth;
    renderTimeline();
    tl.scrollEl.scrollLeft = tl.scrollEl.scrollWidth;
    return;
  }
  const from = tl.fitPxPerMonth;
  const to = TL.defaultPxPerMonth;
  const duration = 1500;
  const t0 = performance.now();
  const ease = (t) => 1 - Math.pow(1 - t, 3); // easeOutCubic
  const step = (now) => {
    const t = Math.min(1, (now - t0) / duration);
    tl.pxPerMonth = from + (to - from) * ease(t);
    renderTimeline();
    // Keep the right edge (present) in view as the nerve stretches out.
    tl.scrollEl.scrollLeft = tl.scrollEl.scrollWidth;
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* --- Action-potential scrollbar ----------------------------------- */
/* A custom horizontal scrollbar: thin nerve track + a glowing spike   */
/* (action potential) as the draggable thumb, synced with scrollLeft.  */

function syncApThumb() {
  const bar = document.getElementById('ap-scrollbar');
  if (!bar) return;
  const thumb = bar.querySelector('.ap-thumb');
  const maxScroll = tl.scrollEl.scrollWidth - tl.scrollEl.clientWidth;
  if (tl.vertical || maxScroll <= 2) {
    bar.classList.add('hidden');
    return;
  }
  bar.classList.remove('hidden');
  const trackW = bar.clientWidth - thumb.offsetWidth;
  const frac = tl.scrollEl.scrollLeft / maxScroll;
  thumb.style.transform = `translateX(${frac * trackW}px)`;
}

function initApScrollbar() {
  const bar = document.getElementById('ap-scrollbar');
  const thumb = bar.querySelector('.ap-thumb');
  let dragging = false;

  const scrollToFrac = (clientX) => {
    const rect = bar.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (clientX - rect.left - thumb.offsetWidth / 2) / (rect.width - thumb.offsetWidth)));
    tl.scrollEl.scrollLeft = frac * (tl.scrollEl.scrollWidth - tl.scrollEl.clientWidth);
  };
  thumb.addEventListener('pointerdown', (e) => {
    dragging = true;
    thumb.setPointerCapture(e.pointerId);
  });
  thumb.addEventListener('pointermove', (e) => dragging && scrollToFrac(e.clientX));
  thumb.addEventListener('pointerup', () => (dragging = false));
  // Keyboard: the thumb is a slider — arrow keys pan the timeline.
  thumb.addEventListener('keydown', (e) => {
    const step = tl.scrollEl.clientWidth * 0.15;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      tl.scrollEl.scrollLeft += step;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      tl.scrollEl.scrollLeft -= step;
    }
  });
  bar.addEventListener('pointerdown', (e) => {
    if (e.target !== thumb && !thumb.contains(e.target)) scrollToFrac(e.clientX);
  });
  tl.scrollEl.addEventListener('scroll', syncApThumb);
  window.addEventListener('resize', syncApThumb);
}

function initTimeline(items) {
  tl.items = items
    .filter((i) => i.start.date)
    .sort((a, b) => a.start.date - b.start.date);
  if (tl.items.length === 0) return;

  const dates = tl.items.map((i) => i.start.date);
  tl.minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
  tl.minDate = new Date(tl.minDate.getFullYear(), 0, 1); // pad back to Jan of first year
  tl.maxDate = new Date(); // "now" is the right edge of the nerve
  tl.maxDate = new Date(tl.maxDate.getFullYear(), tl.maxDate.getMonth() + 2, 1);

  tl.scrollEl = document.getElementById('timeline-scroll');
  tl.svgHost = document.getElementById('timeline-svg-host');

  const totalMonths = Math.max(1, monthsBetween(tl.minDate, tl.maxDate));
  tl.fitPxPerMonth = Math.max(2, (tl.scrollEl.clientWidth - TL.padX * 2) / totalMonths);
  tl.pxPerMonth = tl.fitPxPerMonth; // start fully zoomed out; intro zooms in

  renderTimeline();
  initApScrollbar();

  // Click / keyboard activation on nodes (event delegation on the host).
  tl.svgHost.addEventListener('click', (e) => {
    const node = e.target.closest('.tl-node');
    if (node) modal.open(currentPlacedItems[Number(node.dataset.idx)].item);
  });
  tl.svgHost.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const node = e.target.closest('.tl-node');
    if (node) {
      e.preventDefault();
      modal.open(currentPlacedItems[Number(node.dataset.idx)].item);
    }
  });

  // Zoom controls: buttons and Ctrl + mouse wheel.
  document.getElementById('tl-zoom-in').addEventListener('click', () => setZoom(tl.pxPerMonth * 1.45));
  document.getElementById('tl-zoom-out').addEventListener('click', () => setZoom(tl.pxPerMonth / 1.45));
  tl.scrollEl.addEventListener('wheel', (e) => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    setZoom(tl.pxPerMonth * (e.deltaY < 0 ? 1.15 : 1 / 1.15));
  }, { passive: false });

  // Intro zoom animation the first time the timeline scrolls into view.
  new IntersectionObserver((entries, obs) => {
    if (entries.some((en) => en.isIntersecting)) {
      playIntroAnimation();
      obs.disconnect();
    }
  }, { threshold: 0.3 }).observe(tl.scrollEl);

  // Re-render when crossing the mobile breakpoint.
  window.matchMedia('(max-width: 768px)').addEventListener('change', renderTimeline);

  // Keep the zoom-out floor in sync with the viewport width (debounced).
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const months = Math.max(1, monthsBetween(tl.minDate, tl.maxDate));
      tl.fitPxPerMonth = Math.max(2, (tl.scrollEl.clientWidth - TL.padX * 2) / months);
      if (tl.pxPerMonth < tl.fitPxPerMonth) setZoom(tl.fitPxPerMonth);
    }, 150);
  });
}

/* ================================================================== */
/* View dropdown                                                       */
/* ================================================================== */

function initViewSwitcher() {
  const select = document.getElementById('portfolio-view-select');
  const views = {
    timeline: document.getElementById('view-timeline'),
    list: document.getElementById('view-list'),
    detailed: document.getElementById('view-detailed'),
  };
  select.addEventListener('change', () => {
    for (const [name, el] of Object.entries(views)) {
      el.hidden = name !== select.value;
    }
    if (select.value === 'timeline') renderTimeline(); // re-measure after being hidden
  });
}

/* ================================================================== */
/* Certifications section                                              */
/* ================================================================== */

const CERT_ICON_SVG = `
  <svg viewBox="0 0 24 24" class="cert-icon" aria-hidden="true">
    <circle cx="12" cy="9" r="6" fill="none" stroke="currentColor" stroke-width="1.6"/>
    <circle cx="12" cy="9" r="2.6" fill="currentColor"/>
    <path d="M9 14 L7.5 21 L12 18.5 L16.5 21 L15 14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
  </svg>`;

function renderCertifications(certs) {
  const host = document.getElementById('cert-columns');
  host.replaceChildren();
  for (const category of CERTIFICATION_CATEGORIES) {
    const col = document.createElement('div');
    col.className = 'cert-column';
    const inCat = certs
      .filter((c) => c.category.toLowerCase() === category.toLowerCase())
      .sort((a, b) => (b.date.date?.getTime() ?? 0) - (a.date.date?.getTime() ?? 0));
    col.innerHTML = `<h3 class="cert-category">${esc(category)}</h3>`;
    if (inCat.length === 0) {
      col.innerHTML += `<p class="cert-empty">Coming soon…</p>`;
    }
    for (const cert of inCat) {
      const link = cert.links.find((l) => l && l.url);
      const card = document.createElement(link ? 'a' : 'div');
      card.className = 'cert-card';
      if (link) {
        card.href = safeUrl(link.url);
        card.target = '_blank';
        card.rel = 'noopener';
      }
      card.innerHTML = `
        ${CERT_ICON_SVG}
        <div class="cert-text">
          <span class="cert-title">${esc(cert.title)}</span>
          <span class="cert-meta">${esc(cert.certifier)}${cert.date.date ? ` · ${esc(formatSchemaDate(cert.date))}` : ''}</span>
        </div>`;
      col.appendChild(card);
    }
    host.appendChild(col);
  }
}

/* ================================================================== */
/* Endorsements section                                                */
/* ================================================================== */

function renderEndorsementsSection(endorsements) {
  const host = document.getElementById('endorsement-cards');
  host.replaceChildren();
  const visible = endorsements.filter((e) => e.display === 'section' || e.display === 'both');
  for (const e of visible) {
    const card = document.createElement('figure');
    card.className = 'endorsement-card';
    card.innerHTML = `
      <blockquote>“${esc(e.quote)}”</blockquote>
      <figcaption>
        <strong>${esc(e.person)}</strong>
        ${e.roles.map((r) => `<span class="endorsement-role">${esc(r)}</span>`).join('')}
      </figcaption>`;
    host.appendChild(card);
  }
}

/* ================================================================== */
/* Entry point                                                         */
/* ================================================================== */

export async function initPortfolioSections() {
  modal.init();
  initViewSwitcher();

  const [items, endorsements, certs] = await Promise.all([
    loadAll(PORTFOLIO_PATHS, loadItem),
    loadAll(ENDORSEMENT_PATHS, loadEndorsement),
    loadAll(CERTIFICATION_PATHS, loadCertification),
  ]);

  // Route "card" / "both" endorsements onto their related item's detail card.
  // An unmatched or missing `related` silently renders nowhere (per spec).
  for (const e of endorsements) {
    if ((e.display === 'card' || e.display === 'both') && e.related) {
      const target = items.find((i) => i.title === e.related);
      if (target) target.endorsements.push(e);
    }
  }

  initTimeline(items);
  renderListView(document.getElementById('view-list'), items);
  renderDetailedView(document.getElementById('view-detailed'), items);
  renderCertifications(certs);
  renderEndorsementsSection(endorsements);
}

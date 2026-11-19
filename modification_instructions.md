# Modification Instructions

How to change the site yourself — no AI needed. Everything is plain HTML/CSS/JS
with no build step: edit a file, refresh the browser (serve locally with
`python3 -m http.server 8000` — see README.md).

Quick map of what lives where:

| I want to change… | Edit this |
|---|---|
| Colors, gradient, fonts | `css/styles.css` → `1. THEME CONFIG` block at the top |
| Which content appears (any section) | `js/content.js` + the `.md` files in `content/` |
| Hero photos / "I'm a…" statements | `js/content.js` |
| Section layout / order / nav links | `index.html` |
| Timeline look & behavior | `css/styles.css` section 7 + `TL` constants in `js/portfolio.js` |
| Detail card contents | `renderDetail()` in `js/portfolio.js` |
| Resume/CV page | `docs.html` |

---

## 1. Theme: colors, gradient, fonts

Open `css/styles.css`. The entire theme is CSS variables in the `:root` block
at the top (section `1. THEME CONFIG`):

- **Background gradient** — four stops: `--bg-top` (#2756FF sky blue at the
  very top), `--bg-mid` (blend), `--bg-timeline` (#001176 nerve blue),
  `--bg-deep` (#041A40 night blue). The gradient is on `body` right below and
  spans the full document height, scrolling with the content — do NOT add
  `background-attachment: fixed` (that pins it to the viewport and the page
  stops getting darker as you scroll). Adjust the percentage stops there to
  move where the color transitions happen on the page.
- **Accent** — `--accent` is the electric-cyan used for the nerve glow, links,
  bubbles, and highlights.
- **Item type colors** — `--type-project`, `--type-competition`, `--type-work`,
  `--type-experience`. ⚠️ If you change these, also change the matching hex
  values in **two JS/HTML spots**: `TYPE_CONFIG` at the top of
  `js/portfolio.js` (drives the SVG timeline nodes) and the four
  `legend-item` spans in `index.html`.
- **Fonts** — `--font-heading` (Montserrat) and `--font-body` (Open Sans).
  Font files are vendored in `lib/fonts/` and declared in `lib/fonts/fonts.css`.
  To use a different font (e.g. Futura PT): download its `.woff2` files into
  `lib/fonts/`, add `@font-face` rules to `lib/fonts/fonts.css`, then change
  the variable. Don't link Google Fonts directly — the site's rule is zero
  third-party runtime requests.

## 2. Add / edit / delete content entries

All four content types work the same way (full schemas in README.md):

- **Add**: create the `.md` file in the right `content/` subfolder, then add
  its path to the matching array in `js/content.js` (`PORTFOLIO_PATHS`,
  `EDUCATION_PATHS`, `CERTIFICATION_PATHS`, `ENDORSEMENT_PATHS`).
- **Edit**: just edit the `.md` file. Dates, titles, links, body text — all
  picked up on refresh.
- **Delete**: remove the path from `js/content.js` (deleting the file too is
  optional but tidy).

Notes:
- A portfolio item's `type` decides its color, icon letter, and which group it
  appears in (List / Detailed List). Its `start` date decides timeline placement.
- Endorsements attach to an item's detail card when `related` **exactly
  matches** that item's `title` string — if a card endorsement isn't showing,
  check for a title mismatch first.
- Certification `category` must be one of the headings in
  `CERTIFICATION_CATEGORIES` (`js/content.js`); add a new heading there to
  create a new column (e.g. "Security").
- Frontmatter keys must be spelled exactly as in the schema. For example, a
  portfolio item's photo goes under `image:` (singular). An unknown key such as
  `images:` is ignored without any error, so the photo just won't show.

### Image file types

- Use **only `.jpg`/`.jpeg`, `.png`, or `.webp`** for anything in `images/`.
- **Never use `.heic`** (the iPhone default). Chrome, Edge, and Firefox can't
  display it, so the image shows up blank everywhere except Safari. Convert it
  first (Windows Photos → Save as → JPG), or set your iPhone to
  Settings → Camera → Formats → *Most Compatible*.
- Prefer JPG for photos and keep each one under ~1 MB (around 2000px on the
  long side is plenty). Multi-MB photos make the page load slowly.

## 3. Hero

- Photos and statements: the `HERO_IMAGES` and `HERO_STATEMENTS` arrays in
  `js/content.js`. Both advance together on ONE shared timer (image N shows
  with statement N; images wrap around if there are fewer of them). Bubbles
  are generated automatically, one per statement, and sit centered at the
  bottom of the hero.
- Cycle speed: `HERO_CYCLE_INTERVAL_MS` in the same file.
- Photo fit: `.hero-photo { object-fit: contain; }` in `css/styles.css` shows
  every photo whole, with bars around any photo that isn't 4:3. Switch it to
  `cover` to fill the frame instead (this crops the edges). The frame's shape
  is `aspect-ratio: 4 / 3` on `.hero-photos`.
- Text ("Hi, I'm Jay.") is in `index.html`.

## 4. Education animation

- Cards come from `content/education/` (ordered by `date`; the entry whose
  date is `present` is the "current" stage the figure stands under).
- The figure itself is the `FIGURE_SVG` constant in `js/main.js` — swap in a
  graduation-cap or suit-and-briefcase variant there when your status changes
  (it's a tiny inline SVG; keep the `edu-figure-*` class names so it stays
  styled and animated). The figure is desktop-only: on mobile it's hidden
  (`.edu-figure { display: none; }` in the 768px media query) and education
  shows as plain cards with the same one-by-one reveal.
- Reveal timing: the `0.45s` stagger in `css/styles.css` (`.edu-step`
  `transition-delay`). The "staircase" height offsets are the
  `.edu-step:nth-child(...)` rules right below.

## 5. Timeline tuning

Two knobs, both heavily commented:

- **Geometry / behavior** — the `TL` constant near the middle of
  `js/portfolio.js`: node spacing, branch lengths, collision distance
  (`collisionPx` — nodes closer than this stack into lanes), default/max zoom,
  cord wiggle amplitude, and the mobile vertical density.
- **Look** — `css/styles.css` section 7: cord glow, node hover scale/shadow,
  label fonts, and the action-potential scrollbar (`.ap-*` rules; the spike
  shape is a small inline SVG path in `index.html`).

The intro "zoom in from full timeline to present" animation is
`playIntroAnimation()` in `js/portfolio.js` (duration/easing there). The
mobile breakpoint where the timeline turns vertical is `768px` — it appears in
`js/portfolio.js` (two `matchMedia` calls) and in `css/styles.css` section 14;
change all three together.

## 6. Detail card (shared component)

The popup card and the Detailed List blocks are all rendered by **one**
function: `renderDetail()` in `js/portfolio.js`. Add or reorder fields there
once and every view updates. Its styling is `css/styles.css` section 10.

## 7. Navigation

- Links and the three icon buttons: in the `<nav>` of both `index.html` and
  `docs.html` (they're duplicated — keep them in sync). The placeholder
  GitHub/LinkedIn/email URLs are marked `TODO(Jay)`.
- The nav bar spans the full viewport width; `.nav-inner` centers the content.
  On mobile (≤768px) the text links collapse into a hamburger dropdown (the
  behavior lives in `js/nav.js`, shared by both pages); the three icons stay
  visible in the bar.
- Adding a section link: give the section an `id` in `index.html` and add
  `<a href="#that-id">` to the nav on **index.html**, and
  `<a href="index.html#that-id">` on **docs.html** (in-page `#` anchors only
  resolve on the page that has the section). Smooth scrolling is automatic,
  and `js/main.js` re-scrolls to the hash after content loads so cross-page
  links land on the right section.

## 8. Docs page

- Swap in a new resume/CV: overwrite the PDF in `assets/` (same filename =
  zero code changes). Different filename: update the `iframe src` **and** the
  open-in-new-window `href` for that container in `docs.html`
  (`%20` for spaces).
- Container height: `.doc-scroll { height: 70vh; }` in `css/styles.css`
  section 13. Page background: `body.docs-page` in the same section.

## 9. Adding a whole new section

1. Copy an existing `<section>` block in `index.html` (e.g. Certifications),
   give it a new `id` and title.
2. Add a nav link (`#your-id`).
3. If it's markdown-driven, add a path array to `js/content.js` and a small
   loader/renderer in `js/portfolio.js` following `renderCertifications()` as
   a template.
4. Style it in `css/styles.css` — add a numbered banner comment to keep the
   file navigable.

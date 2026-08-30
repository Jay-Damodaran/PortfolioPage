# Jay's Portfolio Website — Static Personal Portfolio

A two-page static personal portfolio site for Jay, a senior biomedical engineer, hosted on GitHub Pages with no backend. Design is finalized from a whiteboard mockup (home_page_design.jpg); this document is the complete build spec — architecture, content schema, and interactions are all decided, so implement to spec rather than re-deciding. If there are obvious questions unanswered or missing specs, ask user first before implementing anything. You must look at home_page_design.jpg before building anything, but not that the build spec below is more up-to-date than the image, so there are a few contradictions. 

## Core Tech Stack

- **HTML5 + CSS3 + vanilla JavaScript (ES modules)** — truly static, no framework, no build step.
- **marked** (markdown → HTML) — **vendored locally**, not from a CDN. Download `marked.min.js` into `lib/` and reference it with a local `<script>`. No third-party runtime requests are permitted anywhere on the site.
- **No bundler, no npm runtime deps, no server.** Everything must run as flat files served by GitHub Pages over plain HTTP GET.
- Content authored as **markdown files** (one per portfolio item) with YAML-style frontmatter, parsed client-side.
- Images served as **static files from an `images/` folder** via relative paths.
- Target hosting: **GitHub Pages** (project or user site). All asset paths must be relative so the site works from a subpath.

## Current Context & Directives

Build two pages:

1. **`index.html`** — the main single-scroll page.
2. **`docs.html`** — a professional documents page (resume + CV).

### Global — Navigation
- Sticky top nav. left/center links: **Home, Certifications, Endorsements, Resume/CV**. Clicking a link **smooth-scrolls** to that section (Resume/CV navigates to `docs.html`).
- Top-right of nav: three icon links — **GitHub** (profile URL), **LinkedIn** (profile URL), **Gmail** (a `mailto:` link by default). Use placeholder URLs/email and leave a clear `TODO` comment for Jay to fill in.

### Main page (`index.html`) — sections in this exact order

1. **Hero**
   - Left: a set of rotating/cycling photos (teaching, neurotech, wearables — use placeholder images in `images/`).
   - Right: heading "Hi, I'm Jay." followed by a **cycling list of "I'm a…" statements** (e.g. "I'm a biomedical engineer.", "I'm passionate about AI in healthcare.", "I'm a medical device developer.", "I'm working on edge AI wearables.", "I'm a mentor."). Statements advance on a timer.
   - **Tracker bubbles**: small indicator dots showing which statement in the cycle is currently active.

2. **Education** (standalone section — NOT part of the portfolio/timeline system)
   - An **animated step-by-step reveal** progressing through education stages one step at a time (whiteboard shows a cap → graduation progression). Implement as a scroll-triggered or timed sequential reveal. Ideal would be to have a person go from one step to another lifing the current credential overhead. First is high school diploma, next is computer science minor, and next is Bachelor's, which is what person should currently be holding reflecting my current state. After I graduate, that's when you would show a person with a graduation cap next to the degree. Once, I get a job, this may get changed to a person in a suit and tie holding a briefcase. 

3. **Portfolio** — the core interactive section. A **dropdown selector with three views of the same underlying item set** (all items appear in all views; nothing is omitted from any view):
   - **Timeline (default)**: horizontal time axis starting ~2019. Each item is a node placed by date.
     - ~20 items expected, so the timeline **must be horizontally scrollable and support zoom**. Implement the "zoom in from full timeline to present" animation — zoomed-out shows full density, zoomed-in spreads nodes to readable spacing (zoom doubles as the declutter mechanism).
     - **Collision handling**: nodes at the same/near date must **stack or fan vertically off the axis** rather than overlap.
     - **Hover**: node gets shadow/scale-up only, to signal it's clickable. **Do NOT open the detail card on hover.**
     - **Click**: opens the **shared detail card** as a dismissible popup (X button, click-outside, and Esc all close it).
     - Nodes are **color-coded and/or icon-differentiated by `type`** (project / competition / work / experience). Date is always the primary ordering axis.
     - **Mobile**: timeline switches to **vertical orientation**.
   - **List**: compact "squircle" entries (rounded-rectangle cards) showing **minimal info only** — title, role, timespan. Clicking an entry opens the **same shared detail card popup** as the timeline. Items are **grouped by `type`, then sorted by date within each group with most recent at the top**.
   - **Detailed List**: the detail content laid out **directly down the page in sequence, resume-style** — one block per item. Keep items as **visually distinct low-chrome blocks** (subtle divider/background, not heavy bordered UI cards) so it reads as a document but item boundaries stay clear. Same grouping/sorting as List (by type, then date within group).
   - **Critical shared-component requirement**: the timeline popup, the List click popup, and each Detailed List block all render **the same item detail content from one reusable component/function.** Author the detail rendering once and reuse it in all three places.

4. **Certifications** (standalone section, below Portfolio): ML, DBMS, Cloud are the headings within this section

5. **Endorsements** (standalone section): quote cards, each showing quote text plus **Person, Role**. See endorsement schema below for placement rules.

### Docs page (`docs.html`)
- **Resume** and **CV** as **two vertically stacked, independently scrollable containers.**
- Each container has an **"open in new window" icon in its top-right corner** that opens that document (resume / CV) in a new browser tab/window.
- Resume/CV present in assets folder

### Explicit constraints (established during design — do not deviate)
- **No hover-triggered popups** anywhere on the timeline — click only. One interaction model across desktop and mobile.
- **No third-party runtime requests.** All libraries vendored locally. Markdown content never leaves the user's browser.
- **No build step.** Adding a portfolio item = adding one `.md` file and one line to a hardcoded JS array (see below).
- **Naming is final**: the three views are called **Timeline**, **List**, and **Detailed List**. Do not rename them.

## File States & Modifications

### Files (minimum files needed for project)

- **`index.html`** — main page markup: nav, hero, education, portfolio (with view dropdown + containers for all three views + popup modal root), certifications, endorsements.
- **`docs.html`** — professional docs page: two stacked scrollable containers (resume, CV), each with an open-in-new-window icon.
- **`css/styles.css`** — all styling: layout, sticky nav, hero cycling/bubbles, education reveal, timeline (axis, nodes, zoom, collision stacking, color-coding by type), List squircles, Detailed List blocks, popup/modal, docs containers, and **responsive rules** (timeline → vertical on mobile).
- **`js/main.js`** — entry ES module: nav smooth-scroll, hero photo rotation + statement cycling + tracker bubbles, education step-reveal animation.
- **`js/content.js`** — **hardcoded array of markdown file paths** (e.g. `content/2021-senseg-eeg.md`, …). This is the single place Jay edits to add/reorder items. Also exports the endorsements list (or references `content/endorsements/`).
- **`js/portfolio.js`** — fetches each `.md` path, parses frontmatter + body, builds the item model, renders all three views (Timeline / List / Detailed List), wires the view dropdown, and implements the **shared detail-card renderer** used by all three. Handles timeline zoom, node collision stacking, and click-to-open popup with X / click-outside / Esc dismissal.
- **`js/frontmatter.js`** — small helper to split YAML-style frontmatter from markdown body and parse the fields (no external YAML lib unless you can find an opensource lib that we can download that works offline with no telemetry or data sending elsewhere); a minimal key/value + list parser is fine for this schema).
- **`lib/marked.min.js`** — vendored marked library (downloaded, committed to repo). Referenced locally.
- **`content/`** — folder of one `.md` file per portfolio item. Include **2–3 realistic sample files** covering different `type` values so all views are demonstrable.
- **`content/education/`** folder with md files for education entries.
- **`content/certificates/`** folder with md files for certificate entries.
- **`content/endorsements/`** folder with md files for endorsement entries.
- **`images/`** — folder for all images (hero photos, item images). Include placeholder images referenced by the samples.
- **`README.md`** — short authoring guide: how to add an item (create `.md`, add path to `content.js`), the frontmatter schema, how endorsement placement fields work, and where to put images / resume / CV.

### Modified
- None. This is a greenfield build; no existing files to change.

### Education schema
---
alias: Math                                  # alias to use at top of education card if official title isn't very descriptive (official title will still be included in parenthesis below the alias in the card)
title: B.S. Mathematics                      # title of credential
concentration: Actuarial                     # track specialization for the credential (optional)
honors: Honors                               # honors (optional)
school: The University of Texas at Austin    # school providing credential
date: present                                # data awarded (YYYY-MM-DD) or the literal present if ongoing or not yet awarded
---

### Portfolio item markdown schema (frontmatter + body)

```yaml
---
title: "Senseg Wearable EEG"       # card heading + timeline label + list title
type: Experience                    # one of: project | competition | work | experience  (drives color/icon + grouping)
role: "Research Assistant"          # optional; shown in List squircle and detail card (may be redundant with title, so don't duplicate)
org: "Russell Lab"                  # optional; shown in List squircle and detail card
start: 2021-06                      # timeline placement + timespan display (YYYY-MM-DD)
end: 2022-08                        # (YYYY-MM-DD) or the literal: present 
image: images/senseg.jpg            # optional; shown in detail card
links:                              # optional; rendered in detail card
  - label: "GitHub"
    url: "https://github.com/..."
---
Markdown body → the detailed description shown in the detail card / Detailed List block.
```

- **Timeline** orders strictly by `start` date. **List** and **Detailed List** group by `type`, then sort by `start` within each group.

### Certifications schema

```yaml
title: "Deep Learning for Engineers"       # card heading
category: "ML"                          # displayed under this category (either ML, DBMS, or Cloud for now)
certifier: "Stanford"                  # who provided the certification
date: 2021-06                      # timeline placement + timespan display (YYYY-MM-DD)
links:                              # optional; (links to actual certificate)
  - label: "Coursera"
    url: "https://coursera.com/..."
```

- **Card** render each cert as a card with either some generic certificate completion icon or the cert image, if connected to a link

### Endorsement schema

```yaml
person: "Dr. Alice Nguyen"
roles: 
  - "Principal Investigator, Neurotech Lab"
  - "Prev. Product Engineer, Microsoft"
quote: "Jay is a rigorous engineer and a pleasure to work with."
related: "Senseg Wearable EEG"      # optional; must match a portfolio item `title`
display: both                        # optional; one of: both | section | card   (default: section)
```

- **`display: both`** — render in the standalone Endorsements section AND (if `related` is set) on that item's detail card.
- **`display: section`** (default) — render only in the Endorsements section.
- **`display: card`** — render only on the linked item's detail card. **Requires `related`**; if `related` is missing/unmatched, render nowhere (do not error).

## Build & Test Commands

No build step. Serve the folder over a static HTTP server for local testing (needed because `fetch()` of local `.md` files fails under the `file://` protocol).

```bash
# Serve locally (any one of these). Then open http://localhost:8000
python3 -m http.server 8000
# or:  npx --yes serve .
# or:  php -S localhost:8000

# Vendor the markdown library (run once; commit the file):
mkdir -p lib
curl -L https://cdn.jsdelivr.net/npm/marked/marked.min.js -o lib/marked.min.js

# Quick sanity check that no runtime code references a remote host (should return nothing):
grep -rnE "https?://(cdn|unpkg|cdnjs|ajax)" index.html docs.html js/ || echo "OK: no third-party runtime requests"

# Deploy: commit and push to the GitHub Pages branch (e.g. main or gh-pages).
git add -A && git commit -m "Build portfolio site" && git push
```

**Manual test checklist:**
- Nav links smooth-scroll; Resume/CV opens `docs.html`; GitHub/LinkedIn/Gmail icons link out.
- Hero photos rotate; statements cycle; tracker bubbles track the active statement.
- Education steps reveal sequentially.
- Portfolio dropdown switches Timeline / List / Detailed List; Timeline is default.
- Timeline scrolls + zooms; near-date nodes stack instead of overlapping; nodes color/icon-coded by type; hover scales/shadows (no popup); click opens the shared detail card; X / click-outside / Esc all close it.
- Same detail card appears from a List squircle click; Detailed List shows the same content as sequential blocks.
- List & Detailed List grouped by type then date-sorted within group.
- Endorsement `display` field routes each quote to section / card / both correctly; `card`-only with no `related` renders nowhere without error.
- On a narrow viewport, the timeline switches to vertical.
- Docs page: two independently scrollable containers, each with a working open-in-new-window icon.


# Instructions on Theme, Colors, and Fonts

Home page background color: smooth gradient from #2756FF at top of page to #001176 for the timeline and to #041A40 below this (a little bit darker than the day sky to night time blue). Text on page should be white to be clear on this background

Docs page background color: #2756FF for full page

Use Montserrat for titles/headings/nav bar and Open Sans or Futura PT for regular text. Leave this as a commented configurable, so I can change this later easily if I want

On home page, 

Since I'm a biomedical engineer, the theme of the timeline is the nervous system, which is why I have this blue gradation. I want a scrollable nervous system timeline where the actual timeline is a major nerve/spinal cord and each timeline event is like a nerve branching from the central nerve. The scroll bar should look like an action potential going down the central nerve/spinal cord that allows the user to scroll. I have a picture of a neuron for reference in this folder (neuron.jpg), but you may find other sources if you think they look cleaner. 

The main idea was to start with medium darkness blue at top like #2756FF, and move to a darker nervous system blue for the timeline, and then get even darker below that for the certs and endorsements sections, so the whole page is a blue gradient. What I have provided are sample colors, feel free to use different blue shades than the hex codes I have provided to make the page look more natural and visually appealing. 

Make sure the html/css code is well documented and organized in a way such that I can easily modify code manually to play with background colors/themes/visuals

# Additional Output
Generate a modification_instructions.md that gives detailed instructions on what I should do if I want to make changes to the page layout/theme/structure, add/edit/delete entries in any section, etc., so I don't have to reinvoke AI. 
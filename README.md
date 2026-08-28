# Jay's Portfolio Website

A fully static two-page portfolio (GitHub Pages, no build step, no backend, no
third-party runtime requests). Content is authored as markdown files parsed in
the browser by the vendored `lib/marked.min.js`.

- `index.html` — hero, education, portfolio (Timeline / List / Detailed List),
  certifications, endorsements.
- `docs.html` — resume and CV in two independently scrollable containers.

For layout/theme/structure changes, see **modification_instructions.md**.

## Running locally

`fetch()` of local `.md` files fails under `file://`, so serve the folder:

```bash
python3 -m http.server 8000     # then open http://localhost:8000
# or:  npx --yes serve .
# or:  php -S localhost:8000
```

Deploy = commit and push to the GitHub Pages branch. All paths are relative,
so the site works from a project subpath.

## Adding a portfolio item

1. Create `content/my-item.md`:

```markdown
---
title: "Senseg Wearable EEG"   # heading + timeline label + list title
type: experience               # project | competition | work | experience
role: "Research Assistant"     # optional
org: "Russell Lab"             # optional
start: 2021-06                 # YYYY, YYYY-MM, or YYYY-MM-DD
end: present                   # date or the literal: present
image: images/senseg.jpg       # optional
links:                         # optional
  - label: "GitHub"
    url: "https://github.com/..."
---
Markdown body → shown in the detail card / Detailed List block.
```

2. Add the path to `PORTFOLIO_PATHS` in `js/content.js`. Done.

The Timeline orders by `start`. List and Detailed List group by `type`, then
sort newest-first within each group. Several current files are **stubs with
`TODO` comments** — replace their dates and descriptions with real details.

## Education / Certifications / Endorsements

Same pattern: drop a `.md` in `content/education/`, `content/certifications/`,
or `content/endorsements/`, then add its path to the matching array in
`js/content.js`.

**Certification** frontmatter: `title`, `category` (ML | DBMS | Cloud),
`certifier`, `date`, optional `links` (first link makes the card clickable).

**Endorsement** frontmatter: `person`, `roles` (list), `quote`, optional
`related` (must exactly match a portfolio item `title`), optional `display`:

- `section` (default) — Endorsements section only
- `card` — only on the related item's detail card (needs `related`; if it is
  missing or unmatched, the quote renders nowhere, silently)
- `both` — section and card

**Education** frontmatter: `title`, optional `alias` (shown as the heading with
the official title in parentheses), optional `concentration` / `honors`,
`school`, `date` (or `present` for the in-progress credential — the figure
stands under that one).

## Images, resume, CV

- Images go in `images/`; reference them with relative paths (`images/foo.jpg`).
  Keep them under ~500 KB for fast loads (`SEPSOR.jpg` is currently 7 MB —
  worth compressing before deploy).
- Resume/CV PDFs live in `assets/`. `docs.html` embeds
  `assets/ML Resume.pdf` and `assets/CV.pdf`; if you rename a file, update the
  two `iframe`/link URLs in `docs.html` (spaces must be `%20`-encoded).

## TODOs left for Jay

- Replace the GitHub / LinkedIn / email placeholders in the nav of **both**
  `index.html` and `docs.html` (search for `TODO(Jay)`).
- Fill in the 14 stub portfolio items (search `content/` for `TODO`).
- Compress `SEPSOR.jpg` (and consider removing `home_page_design.jpg` /
  `neuron.jpg` from the deployed branch — they're design references).

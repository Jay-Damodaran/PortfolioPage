/**
 * frontmatter.js — minimal YAML-style frontmatter parser.
 *
 * Splits a markdown document into { data, body } where `data` comes from the
 * block between the first two `---` lines and `body` is everything after.
 *
 * Supported YAML subset (all this site's schemas need):
 *   key: value                      → string (quotes optional, trailing # comments stripped)
 *   key:                            → list, from following "- item" lines
 *     - plain item                  → string entry
 *     - label: "GitHub"             → object entry (first key opens the object,
 *       url: "https://..."            following deeper-indented keys join it)
 *
 * No external YAML library is used (offline / zero-telemetry constraint).
 */

/** Escape a string for safe interpolation into HTML. Shared across modules. */
export function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** Allow only safe URL schemes in rendered links (defense-in-depth). */
export function safeUrl(url) {
  return /^(https?:|mailto:|\.|\/|#)/i.test(String(url ?? '').trim()) ? url : '#';
}

/** Strip an unquoted trailing "# comment" and surrounding quotes from a raw value. */
function cleanValue(raw) {
  let v = raw.trim();
  // Remove a trailing comment only if the '#' is not inside a quoted string.
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < v.length; i++) {
    const ch = v[i];
    if (ch === "'" && !inDouble) inSingle = !inSingle;
    else if (ch === '"' && !inSingle) inDouble = !inDouble;
    else if (ch === '#' && !inSingle && !inDouble) {
      v = v.slice(0, i);
      break;
    }
  }
  v = v.trim();
  if (
    (v.startsWith('"') && v.endsWith('"') && v.length >= 2) ||
    (v.startsWith("'") && v.endsWith("'") && v.length >= 2)
  ) {
    v = v.slice(1, -1);
  }
  return v;
}

/** Parse the frontmatter block's lines into a plain object. */
function parseBlock(lines) {
  const data = {};
  let listKey = null; // key currently collecting "- item" entries
  let listObj = null; // current object entry inside that list (label/url style)

  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith('#')) continue;

    const listMatch = line.match(/^\s+-\s*(.*)$/);
    if (listMatch && listKey) {
      const entry = listMatch[1];
      const kv = entry.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/);
      if (kv) {
        // "- label: GitHub" → start a new object entry in the list
        listObj = { [kv[1]]: cleanValue(kv[2]) };
        data[listKey].push(listObj);
      } else {
        // "- plain string" entry
        listObj = null;
        data[listKey].push(cleanValue(entry));
      }
      continue;
    }

    // "  url: ..." — continuation key belonging to the current list object
    const contMatch = line.match(/^\s+([A-Za-z_][\w-]*)\s*:\s*(.*)$/);
    if (contMatch && listObj) {
      listObj[contMatch[1]] = cleanValue(contMatch[2]);
      continue;
    }

    // Top-level "key: value" or "key:" (list opener)
    const kvMatch = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/);
    if (kvMatch) {
      const key = kvMatch[1];
      const value = cleanValue(kvMatch[2]);
      if (value === '') {
        data[key] = [];
        listKey = key;
        listObj = null;
      } else {
        data[key] = value;
        listKey = null;
        listObj = null;
      }
    }
  }
  return data;
}

/**
 * Split frontmatter from body and parse it.
 * @param {string} text — full markdown file content
 * @returns {{ data: Object, body: string }}
 */
export function parseFrontmatter(text) {
  const normalized = text.replace(/\r\n/g, '\n');
  const match = normalized.match(/^\s*---\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!match) {
    return { data: {}, body: normalized };
  }
  return { data: parseBlock(match[1].split('\n')), body: match[2].trim() };
}

/**
 * Parse a schema date: "YYYY", "YYYY-MM", "YYYY-MM-DD", or the literal "present".
 * @returns {{ present: boolean, date: Date|null, raw: string }}
 */
export function parseSchemaDate(raw) {
  const value = String(raw ?? '').trim();
  if (!value) return { present: false, date: null, raw: value };
  if (value.toLowerCase() === 'present') return { present: true, date: new Date(), raw: value };
  const parts = value.split('-').map(Number);
  const [y, m = 1, d = 1] = parts;
  const date = new Date(y, (Number.isFinite(m) ? m : 1) - 1, Number.isFinite(d) ? d : 1);
  if (!Number.isFinite(y) || Number.isNaN(date.getTime()) || parts.some((p) => !Number.isFinite(p))) {
    console.warn(`Unparseable date "${value}" — expected YYYY, YYYY-MM, YYYY-MM-DD, or "present"`);
    return { present: false, date: null, raw: value };
  }
  return { present: false, date, raw: value };
}

/** Format a parsed schema date for display, e.g. "Jun 2021" or "Present". */
export function formatSchemaDate(parsed) {
  if (!parsed || !parsed.date) return '';
  if (parsed.present) return 'Present';
  const hasMonth = parsed.raw.includes('-');
  const opts = hasMonth ? { month: 'short', year: 'numeric' } : { year: 'numeric' };
  return parsed.date.toLocaleDateString('en-US', opts);
}

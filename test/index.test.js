/* Structural tests for index.html. No installs needed.
   Run from the project folder:  node --test */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');

const html = read('index.html').replace(/<!--[\s\S]*?-->/g, '');
const mainJs = read('js/main.js');

/* Every opening tag in the page, as { name, attrs }. */
const tags = [...html.matchAll(/<([a-zA-Z][\w-]*)((?:\s+[^\s=>\/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'))?)*)\s*\/?>/g)].map((m) => ({
  name: m[1].toLowerCase(),
  attrs: Object.fromEntries(
    [...m[2].matchAll(/([^\s=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'))?/g)].map((a) => [a[1], a[2] ?? a[3] ?? ''])
  ),
}));
const byClass = (cls) => tags.filter((t) => (t.attrs.class || '').split(/\s+/).includes(cls));
const ids = tags.map((t) => t.attrs.id).filter(Boolean);

/* Text inside each element with this class (for elements with no nested tags). */
const textOf = (cls) =>
  [...html.matchAll(new RegExp(`class="${cls}"[^>]*>([^<]*)<`, 'g'))].map((m) => m[1].trim().replace(/&amp;/g, '&'));

const loadConfig = () => {
  const sandbox = { window: {} };
  vm.runInNewContext(read('js/config.js'), sandbox);
  return sandbox.window.LOOPER_CONFIG;
};

test('document has the basic head metadata', () => {
  assert.match(html, /^<!doctype html>/i);
  assert.equal(tags.find((t) => t.name === 'html').attrs.lang, 'en');
  assert.match(html, /<title>Looper Agency<\/title>/);
  assert.ok(tags.some((t) => t.name === 'meta' && t.attrs.charset === 'utf-8'), 'missing charset');
  assert.ok(tags.some((t) => t.name === 'meta' && t.attrs.name === 'viewport'), 'missing viewport');
});

test('local stylesheet and scripts exist', () => {
  const local = tags
    .filter((t) => t.name === 'script' || (t.name === 'link' && t.attrs.rel === 'stylesheet'))
    .map((t) => t.attrs.src || t.attrs.href)
    .filter((url) => !/^https?:/.test(url));

  assert.deepEqual(local, ['css/styles.css', 'js/config.js', 'js/main.js']);
  for (const file of local) assert.ok(fs.existsSync(path.join(ROOT, file)), `${file} not found`);
});

test('config.js loads before main.js, which reads its settings', () => {
  const scripts = tags.filter((t) => t.name === 'script').map((t) => t.attrs.src);
  assert.deepEqual(scripts, ['js/config.js', 'js/main.js']);
});

test('ids are unique', () => {
  const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
  assert.deepEqual(duplicates, []);
});

test('every in-page link points at an element that exists', () => {
  const broken = tags
    .map((t) => t.attrs.href)
    .filter((href) => href && href.startsWith('#') && href !== '#')
    .filter((href) => !ids.includes(href.slice(1)));
  assert.deepEqual([...new Set(broken)], []);
});

test('every id looked up by the scripts exists in the page', () => {
  /* main.js checks for wcCurrent before using it, and the page has no such element. */
  const optional = new Set(['wcCurrent']);
  const lookups = [...(mainJs + html).matchAll(/getElementById\('([^']+)'\)/g)].map((m) => m[1]);
  const missing = lookups.filter((id) => !ids.includes(id) && !optional.has(id));
  assert.deepEqual([...new Set(missing)], []);
});

test('links opening a new tab use https and rel="noopener"', () => {
  const external = tags.filter((t) => t.attrs.target === '_blank');
  assert.ok(external.length > 0);
  for (const { attrs } of external) {
    assert.match(attrs.href, /^https:\/\//, attrs.href);
    assert.match(attrs.rel || '', /\bnoopener\b/, attrs.href);
  }
});

test('icon-only controls have an accessible name', () => {
  const socials = tags.filter((t) => t.name === 'a' && /facebook\.com\/LooperAGY|instagram\.com|behance\.net/.test(t.attrs.href || '') && !t.attrs.class);
  const iconOnly = [...byClass('wdot'), ...socials];
  assert.equal(iconOnly.length, 9, '6 carousel dots + 3 footer socials');
  for (const { attrs } of iconOnly) assert.ok(attrs['aria-label'], 'missing aria-label');
});

test('stat counters start at 0 and have numeric targets', () => {
  const counters = tags.filter((t) => 'data-count' in t.attrs);
  assert.deepEqual(counters.map((t) => t.attrs['data-count']), ['102', '500', '3']);
  const starts = [...html.matchAll(/data-count="\d+"[^>]*>([^<]*)</g)].map((m) => m[1]);
  assert.deepEqual(starts, ['0', '0', '0']);
});

test('services are listed in the order config.js maps its images to', () => {
  /* config.js pairs services[i] with row i, so reordering rows mismatches the pictures. */
  assert.deepEqual(textOf('svc-row-name'), [
    'Social Media',
    'Digital Marketing',
    'Photo & Video Production',
    'Branding',
    'Graphic & Motion Design',
    'E-commerce',
    'Integrated Campaigns',
    'Polygraphy',
    'Web Development',
  ]);
});

test('service rows are numbered in sequence and have valid cursor icons', () => {
  const rows = byClass('svc-row');
  assert.equal(rows.length, 9);
  assert.deepEqual(textOf('svc-row-num'), rows.map((_, i) => `A — ${i + 1}`));

  const counters = [...html.matchAll(/class="svc-meta"><span>Service<\/span><b>([^<]+)<\/b>/g)].map((m) => m[1]);
  assert.deepEqual(counters, rows.map((_, i) => `0${i + 1} / 09`));

  for (const { attrs } of rows) {
    assert.match(attrs['data-icon'], /^M[MLHVCSQTAZ\d\s.,-]+$/i, 'not an SVG path');
    assert.ok(attrs['data-icon-label'], 'missing data-icon-label');
  }
});

test('config.js has one image per hero card and service row', () => {
  const config = loadConfig();
  assert.equal(config.heroCards.length, 12);
  assert.equal(config.services.length, byClass('svc-row').length);
});

test('work carousel dots match the projects in main.js', () => {
  const projects = [...mainJs.matchAll(/\{num:'(\d+)',date:'(\d+)',name:'([^']+)'/g)];
  const dots = byClass('wdot');

  assert.equal(dots.length, projects.length);
  assert.deepEqual(dots.map((d) => d.attrs['data-dot']), projects.map((_, i) => String(i)));
  assert.equal(dots.filter((d) => /\bactive\b/.test(d.attrs.class)).length, 1, 'exactly one active dot');
  assert.ok(/\bactive\b/.test(dots[0].attrs.class), 'first dot starts active');

  /* The info panel is pre-filled in the HTML and must agree with the first project. */
  const [, num, date, name] = projects[0];
  assert.match(html, new RegExp(`id="wipNum">${num}<`));
  assert.match(html, new RegExp(`id="wipDate">${date}<`));
  assert.match(html, new RegExp(`id="wipName">${name}<`));
});

test('photo cards each have a canvas, a tilt and a caption', () => {
  const cards = byClass('ph-card');
  assert.equal(cards.length, 9);
  cards.forEach(({ attrs }, i) => {
    assert.equal(attrs.id, `phc${i + 1}`);
    assert.match(attrs['data-tilt'], /^-?\d+$/);
    assert.ok(ids.includes(`ph${i + 1}`), `missing canvas ph${i + 1}`);
  });
  assert.equal(textOf('ph-name').filter(Boolean).length, 9);
  assert.equal(textOf('ph-tag').filter(Boolean).length, 9);
});

test('contact section shows a phone number and email address', () => {
  const [phone, email] = textOf('cta-cval');
  assert.match(phone, /^\(\+995\)[\d\s]+$/);
  assert.match(email, /^[^\s@]+@[^\s@]+\.[a-z]+$/i);
});

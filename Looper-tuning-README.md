# Looper Agency site — project + tuning guide

Open the folder in VS Code, install **Live Server**, right-click `index.html` → *Open with Live Server*.
Every change below is "edit a number, save, the page reloads".

**How to use this guide.** Each entry says *which file*, *what to search for* (Ctrl/Cmd+F — line numbers move, search text doesn't), the *current value*, and *what happens* when you raise or lower it. Sizes are in `px`, `rem` (1rem = 16px) or `vw` (1vw = 1% of screen width) unless noted. A value like `clamp(150px, 11.8vw, 240px)` means *minimum, preferred, maximum*.

---

## 1. Files

| File | What lives there |
|---|---|
| `index.html` | All page content: texts, service rows, branding cards, team cards, career cards, stats, nav |
| `css/styles.css` | Colours (light + dark), fonts, spacing, sizes of everything that is plain HTML |
| `js/main.js` | Everything that is animated or drawn: loader, hero card ring, Work gallery (canvas), partners collage, scroll behaviour |
| `js/config.js` | Picture paths (hero card fronts, card back, partner logos, service hover images, branding images) |
| `images/…` | Drop your pictures here (see `js/config.js` for sizes) |
| `careers/*.html` | One page per role + `resume.html` (the "Leave your resume" page) |

Phone layout starts at **768px** wide in `css/styles.css` (`@media(max-width:768px)`) and in `js/main.js` (`PHONE = W <= 768`). The hero ring switches earlier, at **700px**.

---

## 2. Light / dark mode

* The sun/moon button in the nav (and in the mobile menu) switches mode. The choice is saved in the browser (`localStorage` key `looperTheme`) and is shared by `index.html` and all `careers/*.html` pages. First visit follows the visitor's system setting.
* **Colours live in `css/styles.css`, at the very top.** The dark values are in `:root{ … }`; the light values are in the two blocks right under it (`@media (prefers-color-scheme: light)` and `:root[data-theme="light"]`) — **if you change a light colour, change it in both blocks.**

| Token | Dark | Light | Used for |
|---|---|---|---|
| `--bg` | `#07080b` | `#F3F1EC` | page background |
| `--ink` | `#07080b` | `#EDEAE2` | alternate section background |
| `--surface` / `--surface-2` | `#0d0f14` / `#141720` | `#FBFAF7` / `#EFEBE3` | cards, panels |
| `--white` | `#F3F1EC` | `#0B0C10` | main text colour (the name is historical — it means "foreground") |
| `--text-2`, `--text-3` | cream 68% / 55% | ink 72% / 62% | secondary text |
| `--line` | white 10% | ink 12% | borders, dividers |
| `--blue`, `--violet` | `#0066FF`, `#7A5CFF` | same | brand accent (same in both modes) |
| `--stage` | `#06040e` | `#ECE8DF` | background of the Work canvas |
| `--partners-bg` | dark radial | cream radial | Partners section background |
| `--stack-shadow`, `--shade` | | | shadow between stacked pages / colour a covered page dims to |

* To make the **default** always dark (ignore the visitor's system setting), in `index.html` find `function system()` inside `<script id="themeBoot">` and change its return to `'dark'`.
* Logo tiles, brand cards, the hero card ring and the photo cards keep their dark artwork in both modes on purpose (rule `.orbit-card,.pt-card,.b-vis,…` under "DARK ART" in `styles.css`).

---

## 3. Global sizes

| What | Where / search | Current | Notes |
|---|---|---|---|
| Side margin of the whole site | `--gutter:` | `clamp(20px,5.5vw,80px)` | bigger = more air left/right |
| Section headings ("Services We Offer", "Our Work"…) | `.sec-title{` | `clamp(2.25rem,5vw,4rem)` | one rule drives every section title |
| Small caps labels above titles | `.sec-eyebrow{` | `.6875rem` | |
| Big statement + "Let's loop together" | `.statement-title{` and `.cta-title{` | `clamp(3rem,10vw,8rem)` | |
| Fonts | `--font-d`, `--font-b`, `--font-m` | Syne, DM Sans, DM Mono | also change the Google Fonts `<link>` in `index.html` |
| Corner roundness | `--r-sm` / `--r-md` | `6px` / `14px` | |
| Hero height | `.hero{` → `height:750px` (and again inside `@media(max-width:900px)`) | `750px` | |

---

## 4. Hero — "Break the Loop" card ring

**Number of cards** — `js/main.js`, search `slice(0,10)` (it appears **twice**, in `loadPartners()` and `let partners =`). Change both to the number you want (the ring spaces cards evenly, any number from 4 to ~14 works). If you want more than 11, first add entries to `PARTNER_DEFAULTS` (just above). Then add/remove the same number of picture paths in `js/config.js → heroCards`.

| What | Search in `js/main.js` | Current | Effect |
|---|---|---|---|
| Card width (desktop) | `CW = narrow ?` | `clamp(W*0.118, 150, 240)` | `0.118` = 11.8% of screen width; the two numbers are min/max px |
| Card width (phone, < 700px) | same line | `Math.max(104, W*0.27)` | |
| Card height | `CH = CW*1.4` | `1.4` × width | `1.4` = portrait 5:7; use `1.5` for taller |
| Ring radius (desktop / phone) | `R  = narrow ?` | `W*0.32` / `W*0.40` | bigger = wider ring, cards further apart |
| Ring height on the hero | `'--ringY'` | `0.53` desktop, `0.62` phone (× hero height) | lower number = ring moves up |
| Spin speed | `SPIN_DEG_PER_S` | `8` (degrees/second) | `0` stops it, `15` is fast |
| Ring tilt (how much you look down on it) | `lerp(-13, 0, ce)` | `-13°` | `0` = flat, `-25` = strongly from above |
| Random variation per card | `const cfg = partners.map` | radius `±7%` (`*0.07`), roll `±5°`, tilt `±6°`, height `*0.16` | set all four to `0` for a perfectly neat ring |
| Hover: how far a card pops forward | `hv*120` | `120px` | |
| Scroll distance until the ring gathers into a stack | `heroH*0.42` | `42%` of hero height | larger = slower gathering |

Cards are stacked front-to-back by depth, so a card in front always fully covers the ones behind it.

---

## 5. Stats band

`index.html`, search `statsBand`. Four `stat-cell` blocks. The number is `data-count="102"`, the suffix `data-suffix="+"`, the caption is the `stat-label`. Add or remove a `stat-cell` and change `repeat(4,1fr)` in `.stats-row{` (CSS) to the new count. Number size: `.stat-num{` → `clamp(1.75rem,3vw,2.5rem)`.

---

## 6. Services We Offer

**Number of rows** — `index.html`, search `class="svc-row rv"`. Each row is one block of ~8 lines. To add a service: copy a whole block, edit the texts, and update the little counter `<b>01 / 09</b>` in **every** row (the "09" is the total). Then add the matching hover picture to `js/config.js → services` (same order).

| What | Search in `css/styles.css` | Current |
|---|---|---|
| Service name size | `.svc-row-name{` → `font-size` | `clamp(.9775rem,2.78vw,2.608rem)` (phone: `clamp(.874rem,4.347vw,1.304rem)` in the `@media(max-width:768px)` block, search `.svc-row-name{grid-row:2`) |
| Small text (index, caption, "Includes", list) | `.svc-row-num{`, `.svc-meta{`, `.svc-cap{`, `.svc-list-label{`, `.svc-row-tags span{` | `.7906rem` each |
| Row height | `min-height:clamp(300px,27vw,400px)` in `.svc-row{` | lower = tighter list |
| Row inner spacing | `padding:34px 0 32px` | |
| Right column width | `grid-template-columns:minmax(0,1fr) minmax(240px,340px)` | the `340px` is the max width of the "Includes" list |
| Hover picture size | `.svc-hover-img{` → `max-width` / `max-height` | `clamp(154px,16.8vw,238px)` / `clamp(205px,22.4vw,318px)` |
| Section title | `.services-header .sec-title` (inherits `.sec-title`) | |

---

## 7. Work gallery (the canvas of cards, pinned while you scroll)

**Number of projects** — `js/main.js`, search `const PROJECTS=[`. One line = one card:
`{num:'01',date:'2024',name:'NABERAULI',type:'Show Reel',desc:'…',chips:['Show Reel','Video','Brand Story'],hue:220,sat:55}`
Add or delete lines; the counter, tick marks and scroll length adjust by themselves. `hue` (0–360) is mapped into the brand blue→violet range; `sat` is colour strength (0–100).

| What | Search in `js/main.js` | Current | Effect |
|---|---|---|---|
| **Card width, desktop** | `const cw=PHONE?` … `:Math.round(W*0.18)` | `W*0.18` = 18% of screen width | `0.22` = bigger cards |
| **Card width, phone** | same line, `Math.min(W*0.56,H*0.27)` | 56% of width, but never taller than ~38% of screen height | raise `0.56` for bigger phone cards (try `0.62`); the `H*0.27` part stops them colliding with the text below on short screens |
| Card shape | next line, `cw*1.4` | height = 1.4 × width | |
| How far apart the cards are (desktop / phone) | `const spread=PHONE?0.4:0.085` | `0.085` / `0.4` radians | phone: lower = neighbours hide more behind the centre card |
| Arc curvature | `const arcR=W*0.75` | | smaller = tighter curve |
| Arc position (vertical) | `H*(PHONE?0.41:0.42)` | | higher number = cards sit lower |
| How fast side cards shrink | `1-dist*0.14` (min `0.3`) | `14%` per step | |
| How fast side cards fade | `1-dist*0.22` (min `0.15`) | `22%` per step | |
| Scroll needed per project | `function stepPx(){` | `max(360, min(560, 55% of screen height))` px | bigger = slower, more deliberate scrolling |
| Tick marks under the gallery | `TICK_PITCH=7,TICKS_PER=4` | | |

CSS side (`css/styles.css`): section title `.work-head{` (position) and it uses `.sec-title`; project name `.wip-name{` → `clamp(2rem,5.2vw,4.5rem)` (phone: `clamp(1.8rem,9vw,2.6rem)`); tagline `.wip-desc{`; position of name block `.work-info-panel{` → `bottom:` (phone: `bottom:150px`) — **if you make phone cards taller, raise this `bottom` value so text and cards don't overlap.**

---

## 8. Partners collage

`js/main.js`, search `const DATA = [` — one line per logo tile: `[caption, x%, y%, width@1440px, depth, tilt°]`.

* `x%`, `y%` — position on the section (0–100).
* width — tile width at a 1440px screen (scales with screen; limited by `min-width:150px;max-width:300px` in `.pt-tile{`).
* depth `0` = back (blurred, faint), `1` = middle, `2` = front. Blur/opacity per depth: `const BLUR=[1.6,0,0], OP=[.6,.92,1]`.
* To add a logo: add a line to `DATA` and a path in `js/config.js → partners`. Tile padding / corner: `.pt-card{`. Logo area height: `.pt-logo{` → `clamp(54px,6vw,92px)`.
* Phone (< 820px) turns the collage into a simple grid — see `@media(max-width:820px)` after `.pt-open`.

---

## 9. Visual Stories (photo cards)

`index.html`, search `class="ph-card"` — 9 cards, each `<div class="ph-card" data-tilt="-3" id="phcN">`. Add one by copying a block and giving it a new id (`phc10`), then add a colour to `const phHues=[…]` in `js/main.js`. Card size: `.ph-card{` → `width:clamp(180px,18vw,250px)`, `aspect-ratio:3/4`. The belt's tilt/starting point: `.ph-rail{` → `rotate(-13deg)`, `translate(75vw,0)`.

---

## 10. Branding Work

`index.html`, search `class="b-card rv"` — 3 cards. Each has `style="--hue:250"` (colour of its identity board; 0–360, mapped to blue→violet), a monogram (`AG`, `TG`, `KE`), a client name and tags. Real pictures: `js/config.js → branding` (3 paths, 1200 × 900 px). To show 4 or 6 cards, copy a block and change `.b-grid{` → `grid-template-columns:repeat(3,1fr)` (CSS) to the new count per row (it falls back to 2 columns under 900px and 1 under 700px). Card height comes from `.b-vis{` → `aspect-ratio:4/3`. Marquee strip words: search `b-strip-track`.

---

## 11. Team

`index.html`, search `class="t-card"` — one line per person (initials, name, role, links). Columns: `.t-grid{` → `repeat(2,1fr)`. Avatar size: `.t-av{` → `76px`.

---

## 12. Careers

* **Cards in the section:** `index.html`, search `class="c-card rv"` — 3 cards. Each links to `careers/<name>.html`. Grid: `.c-grid{` → `repeat(3,1fr)` (2 columns under 1000px, 1 under 700px); card height: `.c-card{` → `min-height:360px`.
* **Add a role:** copy `careers/advertiser.html` to a new name, edit the text, copy one `c-card` block in `index.html`, point its `href` at the new file, and (optional) add a row in `careers/resume.html` (search `class="role rv"`).
* **Remove the "Don't see your role?" strip:** delete the `<div class="c-open …">` block under the cards.
* **Leave-your-resume page:** `careers/resume.html`. The form sends to the same Supabase project as the old careers site (`applications` table + `resumes` bucket). The connection is the `var SB={url:"…",key:"…"}` line near the bottom of that file (the key is the public "publishable" key). File limit: `var MAX=10*1024*1024` (10 MB). Where the page text comes from: it is plain HTML — edit it directly.
  If the form cannot reach the server (for example in a sandboxed preview) it shows a message asking people to email `info@looperagency.ge`.

---

## 13. Contact, footer, nav

* Nav links: `index.html`, search `id="navLinks"` (desktop) and `id="navSheet"` (phone menu) — keep both lists in sync.
* "Start a Project" button in the nav: `.nav-btn{`.
* Contact + footer details (phone, email, socials): search `cta-section` and `<footer`.

---

## 14. Quick recipes

* **Bigger phone cards in Work:** `js/main.js` → `Math.min(W*0.56,H*0.27)` → `Math.min(W*0.62,H*0.30)`, then raise `.work-info-panel` `bottom:150px` in the phone `@media` by ~20px.
* **Fewer / more hero cards:** the two `slice(0,10)` in `js/main.js` + the list in `js/config.js`.
* **Calmer hero:** `SPIN_DEG_PER_S` → `4`, and set the per-card variation numbers in §4 to `0`.
* **Bigger headings everywhere:** `.sec-title{` in `css/styles.css` (one rule drives every section title); other big texts: `.svc-row-name`, `.wip-name`, `.c-title`, `.statement-title`, `.cta-title`.
* **Different accent colour:** `--blue` / `--violet` at the top of `css/styles.css` (and `#0066ff` in a few canvas colours: search `accentCSS` / `0,102,255` if you want it everywhere).

---

## 15. Troubleshooting

* *Nothing changes after saving* — hard refresh (Ctrl/Cmd+Shift+R); Live Server caches scripts sometimes.
* *Animation looks broken after editing `main.js`* — open the browser console (F12). A red error with a line number means a missing comma/bracket in the line you edited (most often in `PROJECTS` or `DATA`).
* *Resume form says it could not send* — the page must be served over http(s) (Live Server or your host), not opened as a `file://`; and the host must allow requests to `*.supabase.co`.
* *Light mode looks wrong in one spot* — tell me the section; light colours are tokens, so it is a one-line fix.

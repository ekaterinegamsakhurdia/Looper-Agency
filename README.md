# Looper — website

Plain HTML / CSS / JS. No build step, no installs.

```
looper-site/
├── index.html          page content (text, sections)
├── css/styles.css      all styling
├── js/main.js          all animation / behaviour
├── js/config.js        ← your image paths live here
└── images/
    ├── cards/          12 pictures for the "Break the Loop" cards
    └── services/       9 hover pictures for "Services We Offer"
```

## 1. Open it in VS Code

1. Install VS Code: https://code.visualstudio.com
2. Unzip this folder, then in VS Code: **File → Open Folder…** and choose `looper-site`.
3. VS Code will suggest the **Live Server** extension (bottom-right pop-up) — click *Install*.
   (Or open the Extensions panel, search "Live Server" by Ritwick Dey, install.)
4. Right-click `index.html` → **Open with Live Server**.
   The site opens in your browser and refreshes every time you save a file.

> Don't double-click `index.html` to open it — use Live Server (the fonts and images load more reliably).

## 2. Add pictures to the "Break the Loop" cards

* Put **12 images** in `images/cards/` named `01.jpg` … `12.jpg`.
* Best size **700 × 980 px** (portrait, ratio 5:7). Anything portrait works — it is cropped to fit.
* Using other names or `.png` / `.webp`? Edit the list in `js/config.js` → `heroCards`.
* Card 1 → first entry, card 2 → second, and so on. A missing file simply leaves that card plain.
* Each card also has a "logo back" it shows while turning around the loop — that is intentional.

## 3. Add hover pictures to "Services We Offer"

* Put **9 images** in `images/services/` named `01.jpg` … `09.jpg`, in row order:
  01 Social Media · 02 Digital Marketing · 03 Photo & Video Production · 04 Branding ·
  05 Graphic & Motion Design · 06 E-commerce · 07 Integrated Campaigns · 08 Polygraphy · 09 Web Development
* Best size **900 × 1200 px** (portrait, ratio 3:4).
* On hover the picture follows the cursor behind the big service name.
  A row with no picture keeps the original round icon cursor.

## 4. Handy edits

| I want to change…              | Open…                                                   |
|--------------------------------|---------------------------------------------------------|
| Hero height (700 px)           | `css/styles.css` → search `.hero{` → `height:700px`      |
| Service names / list items     | `index.html` → search `svc-row`                          |
| Service text size              | `css/styles.css` → search `.svc-row-name`                |
| Card size / speed in the orbit | `js/main.js` → search `GRAIL-STYLE CARD CONFIGS`         |

Tip: `Ctrl+F` / `Cmd+F` searches the open file, `Ctrl+Shift+F` / `Cmd+Shift+F` searches the whole project.

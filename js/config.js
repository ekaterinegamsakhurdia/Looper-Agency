/* ───────────────────────────────────────────────────────────
   LOOPER — IMAGE SETTINGS
   Drop your pictures into the folders below and (if you use
   different file names) change the paths here. Save, and the
   page reloads by itself when you use Live Server.
   A missing file is fine: that card / row just stays plain.
   ─────────────────────────────────────────────────────────── */
window.LOOPER_CONFIG = {

  /* 10 floating cards in "Break the Loop" (top of the page).
     FRONT of each card — order = card 1 … card 10.
     Best size: 700 × 980 px (portrait 5:7). */
  heroCards: [
    'images/cards/01.jpg',
    'images/cards/02.jpg',
    'images/cards/03.jpg',
    'images/cards/04.jpg',
    'images/cards/05.jpg',
    'images/cards/06.jpg',
    'images/cards/07.jpg',
    'images/cards/08.jpg',
    'images/cards/09.jpg',
    'images/cards/10.jpg'
  ],

  /* BACK of the cards — ONE picture shared by all 10 cards
     (visible when a card turns around the far side of the loop).
     Same portrait size, 700 × 980 px. */
  cardBack: 'images/cards/back.jpg',

  /* 12 partner LOGOS for the "Our Partners" collage, in this order:
     01 #1 Bank · 02 #1 Transportation · 03 Most Trusted Insurance · 04 #2 Private University
     05 #3 Auto Parts · 06 #4 Oil Importer · 07 Dining & Work hub · 08 International Retail
     09 Real Estate · 10 Public School · 11 Sales & Marketing Consulting · 12 Global Pizza Brand
     Just drop 01.png … 12.png (or .svg / .jpg / .webp) into images/partners — no extension needed here.
     PNG/SVG with a transparent background looks best on the dark cards. */
  partners: [
    'images/partners/01',
    'images/partners/02',
    'images/partners/03',
    'images/partners/04',
    'images/partners/05',
    'images/partners/06',
    'images/partners/07',
    'images/partners/08',
    'images/partners/09',
    'images/partners/10',
    'images/partners/11',
    'images/partners/12'
  ],

  /* The small "Card images" button in the hero lets you try pictures straight
     from the browser (stored only in your browser). Set to false to hide it
     for the live site. */
  showUploader: true,

  /* 9 hover images for "Services We Offer", in the same order as the rows:
     01 Social Media · 02 Digital Marketing · 03 Photo & Video Production
     04 Branding · 05 Graphic & Motion Design · 06 E-commerce
     07 Integrated Campaigns · 08 Polygraphy · 09 Web Development
     Best size: 900 × 1200 px (portrait 3:4). */
  services: [
    'images/services/01.jpg',
    'images/services/02.jpg',
    'images/services/03.jpg',
    'images/services/04.jpg',
    'images/services/05.jpg',
    'images/services/06.jpg',
    'images/services/07.jpg',
    'images/services/08.jpg',
    'images/services/09.jpg'
  ]
};

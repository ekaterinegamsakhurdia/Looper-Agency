/* ═══════════════════════════════════════════════════════════
   PARTNER DATA — localStorage
═══════════════════════════════════════════════════════════ */
const PARTNER_DEFAULTS = [
  {id:'p0',  rank:'#1 Bank in Georgia',     name:'Top National Bank'},
  {id:'p1',  rank:'#1 Transportation',       name:'Leading Transport Co.'},
  {id:'p2',  rank:'Most Trusted Insurance',  name:'Top Insurer'},
  {id:'p3',  rank:'#2 Private University',   name:'Leading University'},
  {id:'p4',  rank:'#3 Auto Parts',           name:'Auto Parts Leader'},
  {id:'p5',  rank:'#4 Oil Importer',         name:'Oil Import Partner'},
  {id:'p6',  rank:'Tbilisi Dining Hub',      name:'Dining & Work Space'},
  {id:'p7',  rank:'International Retail',    name:'Global Retail Leader'},
  {id:'p8',  rank:'Top Real Estate',         name:'Highest Ranked RE'},
  {id:'p9',  rank:'Top Public School',       name:'Education Leader'},
  {id:'p10', rank:'#1 Sales Consulting',     name:'Strategy Partner'},
  {id:'p11', rank:'Global Pizza Brand',      name:"Domino's Pizza"},
];
function loadPartners(){
  try{const s=localStorage.getItem('looper_partners');if(s)return JSON.parse(s);}catch(e){}
  return PARTNER_DEFAULTS.map(p=>({...p,photo:null}));
}
function savePartners(arr){
  try{localStorage.setItem('looper_partners',JSON.stringify(arr));}catch(e){}
}
let partners = loadPartners();

/* ── Image config (set in js/config.js when running as a project; empty here) ── */
const LOOPER_CFG = window.LOOPER_CONFIG || {heroCards:[],services:[]};
// Photos listed in config win over anything saved in the browser
partners.forEach((p,i)=>{ const src = (LOOPER_CFG.heroCards||[])[i]; if(src) p.photo = src; });

/* ═══════════════════════════════════════════════════════════
   LOADER
═══════════════════════════════════════════════════════════ */
(function(){
  const paths = document.querySelectorAll('#loader-logo path');
  const pct   = document.getElementById('loaderPct');
  const bar   = document.getElementById('loaderBar');
  const barW  = document.getElementById('loaderBarWrap');
  const txt   = document.getElementById('loaderText');
  paths.forEach(p=>{
    const len = p.getTotalLength ? p.getTotalLength() : 600;
    p.style.strokeDasharray = len;
    p.style.strokeDashoffset = len;
  });
  pct.classList.add('vis');
  barW.classList.add('vis');
  let progress=0;
  const totalMs=2200, startTime=performance.now();
  function step(now){
    const elapsed=now-startTime;
    progress=Math.min(elapsed/totalMs,1);
    const eased=progress<.5?2*progress*progress:1-Math.pow(-2*progress+2,2)/2;
    pct.innerHTML=Math.round(eased*100)+'<span style="font-size:.5em;opacity:.4">%</span>';
    bar.style.width=(eased*100)+'%';
    paths.forEach(p=>{
      const len=parseFloat(p.style.strokeDasharray)||600;
      p.style.strokeDashoffset=len*(1-eased);
      p.style.transition='none';
    });
    if(eased>0.7) txt.setAttribute('opacity',((eased-0.7)/0.3).toFixed(2));
    if(progress<1) requestAnimationFrame(step);
    else setTimeout(startZoomTransition,350);
  }
  requestAnimationFrame(step);
})();

/* ═══════════════════════════════════════════════════════════
   ZOOM TRANSITION
═══════════════════════════════════════════════════════════ */
function startZoomTransition(){
  const overlay = document.getElementById('zoomOverlay');
  const canvas  = document.getElementById('zoomCanvas');
  const ctx     = canvas.getContext('2d');
  const loader  = document.getElementById('loader');
  overlay.classList.add('active');
  let W,H;
  function resize(){W=canvas.width=window.innerWidth;H=canvas.height=window.innerHeight;}
  resize();
  loader.style.opacity='0'; loader.style.transition='opacity .3s';
  const startMs=performance.now(), duration=900;
  function drawZoomFrame(now){
    const t=Math.min((now-startMs)/duration,1);
    const ease=1-Math.pow(1-t,2.5);
    ctx.clearRect(0,0,W,H);
    const bgAlpha=t<0.7?1:1-((t-0.7)/0.3);
    ctx.fillStyle=`rgba(0,0,0,${bgAlpha})`;ctx.fillRect(0,0,W,H);
    const cx=W/2,cy=H/2;
    const scale=0.08+ease*1.8;
    const A=Math.min(W,H)*0.32*scale, B=Math.min(W,H)*0.14*scale;
    ctx.save();
    ctx.lineWidth=4+ease*20;ctx.lineCap='round';
    ctx.strokeStyle=`rgba(0,102,255,${0.9-ease*0.5})`;
    ctx.beginPath();
    for(let i=0;i<=300;i++){
      const theta=(i/300)*Math.PI*2,s=Math.sin(theta),c=Math.cos(theta),d=1+s*s;
      const x=cx+A*c/d,y=cy+B*s*c/d;
      i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
    }
    ctx.closePath();ctx.stroke();
    if(t>0.75){
      const rt=(t-0.75)/0.25;
      ctx.beginPath();ctx.arc(cx,cy,Math.max(W,H)*rt*1.5,0,Math.PI*2);
      ctx.strokeStyle=`rgba(255,255,255,${0.3*(1-rt)})`;
      ctx.lineWidth=60*(1-rt);ctx.stroke();
    }
    ctx.restore();
    if(t<1) requestAnimationFrame(drawZoomFrame);
    else {
      loader.style.display='none';
      overlay.style.opacity='0';overlay.style.transition='opacity .4s';
      setTimeout(()=>{overlay.style.display='none';},400);
      document.getElementById('floatCta').classList.add('visible');
    }
  }
  setTimeout(()=>requestAnimationFrame(drawZoomFrame),50);
}

/* ═══════════════════════════════════════════════════════════
   NAV: compact on scroll + color swap
═══════════════════════════════════════════════════════════ */
(function(){
  const nav = document.getElementById('mainNav');
  const hero = document.getElementById('home');
  function update(){
    const scrolled = window.scrollY > 60;
    nav.classList.toggle('scrolled', scrolled);
    // Switch to light nav once past the hero section
    const probe = 36; // y of the nav bar centre
    let onDark = false;
    document.querySelectorAll('[data-section="dark"]').forEach(el=>{
      const r = el.getBoundingClientRect();
      if(r.top <= probe && r.bottom > probe) onDark = true;
    });
    nav.classList.toggle('on-light', !onDark);
  }
  window.addEventListener('scroll', update, {passive:true});
  update();
})();

/* Floating CTA dark-section detection */
(function(){
  const btn=document.getElementById('floatCta');
  function update(){
    const y=window.scrollY+window.innerHeight/2;
    const hero=document.getElementById('home');
    const hBottom=hero?hero.offsetTop+hero.offsetHeight:0;
    // On hero: CTA is blue (default), no extra class needed
  }
  window.addEventListener('scroll',update,{passive:true});
})();

/* ═══════════════════════════════════════════════════════════
   BACKGROUND PARTNER CARDS — Grail style
   Cards orbit lemniscate path, deep in background,
   scattered at varying depths like Grail's floating cards.
   pointer-events:none — not interactive in hero.
   Photo upload via Partner Manager modal (button outside hero).
═══════════════════════════════════════════════════════════ */
(function(){
  const layer = document.getElementById('orbitCardsLayer');
  if(!layer) return;
  const N = partners.length; // 12
  let W, H, cx, cy, A, B;
  let orbitT = 0;
  let mouseX = 0, mouseY = 0;
  const hero = document.getElementById('home');

  /* ── GRAIL-STYLE CARD CONFIGS
     Each card has: phase offset, tilt bias, scale bias, blur amount, opacity base
     Varied to look like cards floating at different depths in 3D space ── */
  const cardConfigs = partners.map((p, i) => ({
    phaseOffset: (i / N) * Math.PI * 2,
    tiltX: (Math.random() * 20 - 10),  // -10 to +10 deg
    tiltY: (Math.random() * 16 - 8),
    scaleBase: 0.7 + Math.random() * 0.4,    // 0.7–1.1
    blurPx: Math.random() * 0.8,             // subtle, only on the far side of the loop
    opacityBase: 0.85 + Math.random() * 0.15  // 0.85–1.0, clearly visible
  }));

  /* ── Build DOM elements ── */
  const cardEls = partners.map((p, i) => {
    const wrap = document.createElement('div');
    wrap.className = 'orbit-card';
    wrap.dataset.index = i;

    const inner = document.createElement('div');
    inner.className = 'orbit-card-inner';

    // FRONT
    const front = document.createElement('div');
    front.className = 'orbit-card-front';

    const photoDiv = document.createElement('div');
    photoDiv.className = 'card-photo';

    const img = document.createElement('img');
    img.style.display = p.photo ? 'block' : 'none';
    if(p.photo) img.src = p.photo;
    img.alt = '';
    img.onerror = () => { img.style.display = 'none'; };   // missing file -> keep the plain card
    photoDiv.appendChild(img);

    // No name/rank text on card — photo only
    // Store hint ref (unused visually but kept for manager update logic)
    const hint = document.createElement('div');
    hint.className = 'upload-hint';
    hint.style.display = 'none';
    photoDiv.appendChild(hint);

    front.appendChild(photoDiv);

    // BACK
    const back = document.createElement('div');
    back.className = 'orbit-card-back';
    back.innerHTML = `<svg width="52" height="32" viewBox="0 0 44 28" fill="none"><path d="M22 14C22 14 17 4 10 4C4.477 4 1 8.477 1 14C1 19.523 4.477 24 10 24C17 24 22 14 22 14ZM22 14C22 14 27 24 34 24C39.523 24 43 19.523 43 14C43 8.477 39.523 4 34 4C27 4 22 14 22 14Z" stroke="#0066FF" stroke-width="2.5" stroke-linecap="round"/></svg><div class="back-label">LOOPER</div>`;

    inner.appendChild(front);
    inner.appendChild(back);
    wrap.appendChild(inner);
    layer.appendChild(wrap);

    // Store img ref for manager updates
    wrap._img = img;
    wrap._hint = hint; // kept for manager compatibility

    return wrap;
  });

  /* ── Lemniscate ── */
  function resize(){
    W = layer.offsetWidth || window.innerWidth;
    H = layer.offsetHeight || window.innerHeight;
    cx = W/2; cy = H*0.5;
    // Wider orbit — fills screen edge to edge like Grail
    A = W * 0.40;
    B = H * 0.32;  // loop height tuned so cards stay inside the hero band
  }
  resize();
  window.addEventListener('resize', resize);

  window.addEventListener('mousemove', e => {
    if(hero && e.clientY < hero.getBoundingClientRect().bottom){
      mouseX = (e.clientX - W/2) / W;
      mouseY = (e.clientY - H/2) / H;
    }
  }, {passive:true});

  function lem(t){
    const s=Math.sin(t),c=Math.cos(t),d=1+s*s;
    return {
      x: cx + A*c/d + mouseX*A*0.05,
      y: cy + B*2.0*s*c/d + mouseY*B*0.08
    };
  }

  /* ── Scroll collect: cards sink downward and vanish as stats slide in ── */
  let scrollCollect = 0; // 0 = spread, 1 = collected
  function updateScrollCollect(){
    const heroEl = document.getElementById('home');
    if(!heroEl) return;
    const heroH = heroEl.offsetHeight;
    const scrolled = window.scrollY;
    // Start collecting when user begins scrolling, complete by 60% through hero
    scrollCollect = Math.max(0, Math.min(1, scrolled / (heroH*0.6)));
  }
  window.addEventListener('scroll', updateScrollCollect, {passive:true});

  /* ── Track last flip state to avoid transitioning every frame ── */
  const flipState = new Array(cardEls.length).fill(0); // 0=front, 1=back

  /* ── Position cards ── */
  function positionCards(){
    cardEls.forEach((el, i) => {
      const cfg = cardConfigs[i];
      const phase = cfg.phaseOffset + orbitT;

      // Depth from lemniscate
      const sinP=Math.sin(phase), cosP=Math.cos(phase), denom=1+sinP*sinP;
      const depth = cosP/denom; // -1..+1  (+1 = front, -1 = back of loop)
      const depthFactor = (depth + 1) / 2; // 0..1

      // Smooth flip: show back face when depth < 0 (card going around back of lemniscate)
      const shouldShowBack = depth < -0.1;
      const inner = el.querySelector('.orbit-card-inner');
      if(inner){
        const prevFlip = flipState[i];
        const newFlip = shouldShowBack ? 1 : 0;
        if(newFlip !== prevFlip){
          flipState[i] = newFlip;
          // CSS transition handles the smooth 0.8s rotation
          inner.style.transform = newFlip ? 'rotateY(180deg)' : 'rotateY(0deg)';
        }
      }

      // Scroll-collect: cards drift downward and shrink/fade out
      const lemPos = lem(phase);
      // Cards sink toward bottom-center as collect progresses
      const collectX = cx + (cfg.phaseOffset % 1 - 0.5) * W * 0.15; // slight x spread
      const collectY = H * 1.2; // below viewport
      const spread = 1 - scrollCollect;
      const pos = {
        x: lemPos.x * spread + collectX * scrollCollect,
        y: lemPos.y * spread + collectY * scrollCollect
      };

      const scale = (cfg.scaleBase * (0.65 + 0.35 * depthFactor)) * (1 - scrollCollect * 0.4);
      const opacity = cfg.opacityBase * (0.72 + 0.28 * depthFactor) * (1 - scrollCollect);
      const blur = depthFactor < 0.35 ? cfg.blurPx * (1 - depthFactor / 0.35) : 0;

      // Tangent-based subtle rotation
      const tangent = lem(phase + 0.015);
      const tangentAngle = Math.atan2(tangent.y - lemPos.y, tangent.x - lemPos.x) * 0.1;
      const totalRotZ = cfg.tiltY + tangentAngle * (180/Math.PI);

      const w = 140 * scale, h = 196 * scale;

      el.style.left   = (pos.x - w/2) + 'px';
      el.style.top    = (pos.y - h/2) + 'px';
      el.style.width  = w + 'px';
      el.style.height = h + 'px';
      el.style.opacity = opacity.toFixed(3);
      el.style.filter = blur > 0.25 ? `blur(${blur.toFixed(1)}px)` : '';
      el.style.transform = `rotateZ(${totalRotZ.toFixed(1)}deg) rotateX(${cfg.tiltX.toFixed(1)}deg)`;
    });
  }

  /* ── Frame loop ── */
  function frame(){
    orbitT += 0.0025; // gentle drift
    updateScrollCollect();
    positionCards();
    requestAnimationFrame(frame);
  }
  frame();

  /* ── Expose update function for partner manager ── */
  window._updateCardPhoto = function(index, photoDataUrl){
    const wrap = cardEls[index];
    if(!wrap) return;
    wrap._img.src = photoDataUrl;
    wrap._img.style.display = 'block';
    wrap._hint.style.display = 'none';
  };
})();

/* ═══════════════════════════════════════════════════════════
   PARTNER MANAGER MODAL
   Since cards have pointer-events:none in background,
   photo upload is done through this accessible manager panel
═══════════════════════════════════════════════════════════ */
(function(){
  const grid = document.getElementById('pmGrid');
  if(!grid) return;

  function buildManager(){
    grid.innerHTML = '';
    partners.forEach((p, i) => {
      const card = document.createElement('label');
      card.className = 'pm-card';
      card.title = 'Upload photo for ' + p.name;

      const img = document.createElement('img');
      img.src = p.photo || '';
      img.style.background = p.photo ? 'transparent' : '#1a1a1a';
      if(!p.photo){
        img.style.display = 'none';
        const placeholder = document.createElement('div');
        placeholder.style.cssText = 'width:100%;aspect-ratio:1;background:#222;display:flex;align-items:center;justify-content:center;font-family:Syne,sans-serif;font-size:.6rem;font-weight:800;color:#555;text-align:center;padding:8px';
        placeholder.textContent = p.name;
        card.appendChild(placeholder);
      } else {
        card.appendChild(img);
      }

      const name = document.createElement('div');
      name.className = 'pm-card-name';
      name.textContent = p.name;
      card.appendChild(name);

      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.addEventListener('change', e => {
        const file = e.target.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
          partners[i].photo = ev.target.result;
          savePartners(partners);
          if(window._updateCardPhoto) window._updateCardPhoto(i, ev.target.result);
          buildManager(); // refresh UI
        };
        reader.readAsDataURL(file);
      });
      card.appendChild(input);
      grid.appendChild(card);
    });
  }
  buildManager();

  // Expose open function
  window.openPartnerManager = function(){
    document.getElementById('partnerManager').classList.add('open');
  };
})();

/* ═══════════════════════════════════════════════════════════
   SCROLL-LINKED STATEMENT LINES
═══════════════════════════════════════════════════════════ */
(function(){
  const lines=document.querySelectorAll('.sl');
  const section=document.getElementById('about');
  function checkLines(){
    if(!section) return;
    const rect=section.getBoundingClientRect();
    const progress=1-(rect.top/window.innerHeight);
    lines.forEach((line,i)=>{line.classList.toggle('lit',progress>0.3+i*0.18)});
    if(progress>0.3+lines.length*0.18) section.classList.add('lines-done');
  }
  window.addEventListener('scroll',checkLines,{passive:true});
  checkLines();
})();

/* Chapter corners */
(function(){
  const pairs=[
    {section:'about',   labels:['chap1','chap1l']},
    {section:'services',labels:['chap2']},
    {section:'work',    labels:['chap3']},
    {section:'contact', labels:['chap4']},
  ];
  const ioC=new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      const pair=pairs.find(p=>p.section===e.target.id);
      if(!pair) return;
      pair.labels.forEach(lid=>{const el=document.getElementById(lid);if(el) el.classList.toggle('vis',e.isIntersecting)});
    });
  },{threshold:0.15});
  pairs.forEach(p=>{const el=document.getElementById(p.section);if(el) ioC.observe(el)});
})();

/* Stats band reveal */
(function(){
  const band = document.getElementById('statsBand');
  if(!band) return;
  const io = new IntersectionObserver(entries=>{
    entries.forEach(e=>{if(e.isIntersecting){band.classList.add('in');io.unobserve(band)}});
  },{threshold:0.15});
  io.observe(band);
})();

/* Panel slide-over */
(function(){
  const ioP=new IntersectionObserver(entries=>{
    entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');ioP.unobserve(e.target)}});
  },{threshold:0.07});
  document.querySelectorAll('.panel,.panel-dark').forEach(p=>ioP.observe(p));
})();

/* Scroll reveal */
(function(){
  const ioRv=new IntersectionObserver(entries=>{
    entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('on');ioRv.unobserve(e.target)}});
  },{threshold:0.08});
  document.querySelectorAll('.rv').forEach(el=>ioRv.observe(el));
})();

/* Stats counter */
(function(){
  const ioSt=new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(!e.isIntersecting) return;
      const el=e.target,target=+el.dataset.count,suffix=el.dataset.suffix||'';
      const dur=1800,start=performance.now();
      function step(now){
        const p=Math.min((now-start)/dur,1),eased=1-Math.pow(1-p,3);
        el.textContent=Math.round(target*eased)+suffix;
        if(p<1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
      ioSt.unobserve(el);
    });
  },{threshold:.5});
  document.querySelectorAll('[data-count]').forEach(c=>ioSt.observe(c));
})();

/* Services — custom cursor + row hover */
(function(){
  const section = document.getElementById('services');
  const cursor  = document.getElementById('svcCursor');
  const cursorIcon = document.getElementById('svcCursorIcon');
  const cursorDefault = document.getElementById('svcCursorDefault');
  if(!section||!cursor) return;

  let mx=0, my=0, cx=0, cy=0, raf=0;

  // Smooth cursor follow
  function lerp(a,b,t){return a+(b-a)*t}
  function tick(){
    cx=lerp(cx,mx,0.14);
    cy=lerp(cy,my,0.14);
    cursor.style.left=cx+'px';
    cursor.style.top=cy+'px';
    raf=requestAnimationFrame(tick);
  }

  section.addEventListener('mouseenter',()=>{
    cursor.classList.add('visible');
    if(!raf) tick();
  });
  section.addEventListener('mouseleave',()=>{
    cursor.classList.remove('visible');
    cancelAnimationFrame(raf); raf=0;
  });
  section.addEventListener('mousemove',e=>{
    mx=e.clientX; my=e.clientY;
  });

  // Hover image (from LOOPER_CONFIG.services[i]); follows the cursor behind the text
  const rows = section.querySelectorAll('.svc-row');
  const hoverImg = document.createElement('img');
  hoverImg.className = 'svc-hover-img'; hoverImg.alt = '';
  section.appendChild(hoverImg);
  let ix=0, iy=0, iraf=0, imgOk = {};
  function itick(){
    ix += (mx-ix)*0.12; iy += (my-iy)*0.12;
    hoverImg.style.transform = 'translate3d('+(ix-hoverImg.offsetWidth/2)+'px,'+(iy-hoverImg.offsetHeight/2)+'px,0)';
    iraf = requestAnimationFrame(itick);
  }
  rows.forEach((row,i)=>{
    const src = (LOOPER_CFG.services||[])[i];
    if(!src) return;
    const probe = new Image();
    probe.onload = ()=>{ imgOk[i] = src; row.dataset.hasImg = '1'; };
    probe.onerror = ()=>{ /* file missing: fall back to the icon cursor */ };
    probe.src = src;
  });
  rows.forEach((row,i)=>{
    row.addEventListener('mouseenter',()=>{
      if(imgOk[i]){
        hoverImg.src = imgOk[i];
        ix = mx; iy = my;
        hoverImg.classList.add('on');
        cursor.classList.add('hide');
        if(!iraf) itick();
      }
    });
    row.addEventListener('mouseleave',()=>{
      hoverImg.classList.remove('on');
      cursor.classList.remove('hide');
      cancelAnimationFrame(iraf); iraf=0;
    });
  });

  // Per-row icon swap
  rows.forEach(row=>{
    row.addEventListener('mouseenter',()=>{
      const pathD = row.dataset.icon;
      if(pathD){
        // Build SVG icon dynamically
        cursorIcon.innerHTML='<path d="'+pathD+'" stroke="#0066FF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>';
        cursorIcon.style.display='block';
        cursorDefault.style.display='none';
      }
    });
    row.addEventListener('mouseleave',()=>{
      cursorIcon.style.display='none';
      cursorDefault.style.display='block';
    });
  });

  // Scroll reveal for rows
  const ioS=new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        const idx=Array.from(rows).indexOf(e.target);
        setTimeout(()=>e.target.classList.add('on'),idx*55);
        ioS.unobserve(e.target);
      }
    });
  },{threshold:0.05});
  rows.forEach(el=>ioS.observe(el));
})();

/* ═══════════════════════════════════════
   VISUAL STORIES — Scroll-driven diagonal conveyor + doodle hover
═══════════════════════════════════════ */
(function(){
'use strict';

/* ── Photo card canvas art ── */
const PH_PALETTES=[
  {bg:'#1a0f00',hue:28},  // 2 TONS — warm amber
  {bg:'#0a0f1a',hue:220}, // ADAMIANI — deep blue
  {bg:'#0f1a0a',hue:85},  // LA FARINA — olive green
  {bg:'#1a0a12',hue:330}, // STRADA — burgundy
  {bg:'#0a1a0a',hue:140}, // SPAR — forest
  {bg:'#100a1a',hue:270}, // NABERAULI — violet
  {bg:'#1a1200',hue:45},  // SEVSAMORA — gold
  {bg:'#001a18',hue:175}, // MIVINO — teal
  {bg:'#1a0808',hue:355}, // MERDINI — crimson
];
function drawPhCanvas(id,pal){
  const c=document.getElementById(id);if(!c)return;
  function paint(){
    c.width=c.offsetWidth||240;c.height=c.offsetHeight||320;
    const ctx=c.getContext('2d'),w=c.width,h=c.height;
    ctx.fillStyle=pal.bg;ctx.fillRect(0,0,w,h);
    for(let i=0;i<4;i++){
      const rg=ctx.createRadialGradient(w*(0.2+i*0.22),h*(0.15+Math.sin(i*1.5)*0.3),0,w*(0.2+i*0.22),h*(0.15+Math.sin(i*1.5)*0.3),w*0.4);
      rg.addColorStop(0,`hsla(${pal.hue+i*25},70%,50%,0.55)`);
      rg.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=rg;ctx.fillRect(0,0,w,h);
    }
    // grain texture
    for(let j=0;j<5;j++){
      ctx.beginPath();
      for(let x=0;x<=w;x+=2){
        const y=h/2+Math.sin((x*0.03)+(j*1.3)+(id.charCodeAt(2)*0.5))*(25+j*14)*Math.sin(x/w*Math.PI);
        x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
      }
      ctx.strokeStyle=`hsla(${pal.hue+j*10},80%,65%,0.22)`;
      ctx.lineWidth=1.5;ctx.stroke();
    }
    // "photo paper" noise — fast random dots
    const nc=document.createElement('canvas');nc.width=w;nc.height=h;
    const nctx=nc.getContext('2d');
    const id2=nctx.createImageData(w,h);
    const d=id2.data;
    for(let p=0;p<d.length;p+=4){d[p]=d[p+1]=d[p+2]=Math.random()*255;d[p+3]=16;}
    nctx.putImageData(id2,0,0);
    ctx.drawImage(nc,0,0);
  }
  paint();
  new ResizeObserver(paint).observe(c);
}
PH_PALETTES.forEach((pal,i)=>drawPhCanvas('ph'+(i+1),pal));

/* ── Apply static tilts ── */
document.querySelectorAll('.ph-card[data-tilt]').forEach(card=>{
  const t=parseFloat(card.dataset.tilt||0);
  card.style.transform=`rotate(${t}deg)`;
});

/* ── Scroll-driven conveyor ── */
const section=document.getElementById('photoSection');
const spacer=document.getElementById('photoSpacer');
const rail=document.getElementById('phRail');
const hint=document.getElementById('phScrollHint');
if(!section||!spacer||!rail)return;

// Scroll-driven conveyor:
// The spacer controls total scroll travel; we compute it from the rail's actual width
// so there's no dead blank space — the section is exactly as tall as needed to traverse all cards.

let rafRunning=false;
let currentX=0,targetX=0;
let TOTAL_SCROLL=0;

function startOffset(){return window.innerWidth*0.78;}
function getMaxTravel(){
  // start with first card entering at upper-right, finish with last card leaving lower-left
  return startOffset()+rail.scrollWidth-window.innerWidth*0.06;
}
function computeTotalScroll(){
  // 1px of scroll per px of travel keeps the motion natural; no extra dead space
  TOTAL_SCROLL=getMaxTravel();
  spacer.style.height=TOTAL_SCROLL+'px';
}

function update(){
  rafRunning=false;
  currentX+=(targetX-currentX)*0.1;
  if(Math.abs(targetX-currentX)>0.5){
    rafRunning=true;
    requestAnimationFrame(update);
  }
  rail.style.transform=`rotate(-13deg) translate(${startOffset()-currentX}px,0px)`;
}

function onScroll(){
  const rect=section.getBoundingClientRect();
  const scrolled=-rect.top;
  const progress=Math.max(0,Math.min(1,scrolled/TOTAL_SCROLL));
  targetX=progress*getMaxTravel();
  if(progress>0.05)hint&&hint.classList.add('hidden');
  else hint&&hint.classList.remove('hidden');
  if(!rafRunning){rafRunning=true;requestAnimationFrame(update);}
}

// Compute once fonts/images loaded so rail.scrollWidth is accurate
window.addEventListener('load',()=>{computeTotalScroll();onScroll();});
computeTotalScroll();
window.addEventListener('scroll',onScroll,{passive:true});
window.addEventListener('resize',()=>{computeTotalScroll();onScroll();},{passive:true});
onScroll();

/* ── Doodle hover animations ── */
document.querySelectorAll('.ph-card').forEach(card=>{
  let doodleTO=null;
  card.addEventListener('mouseenter',()=>{
    clearTimeout(doodleTO);
    // reset all dash offsets first
    card.querySelectorAll('.ph-doodle path,.ph-doodle circle,.ph-doodle line,.ph-doodle polyline').forEach(el=>{
      el.style.transition='none';
      const len=el.style.getPropertyValue('--dlen')||'400';
      el.style.strokeDashoffset=len;
    });
    // trigger reflow so transition starts fresh
    void card.offsetWidth;
    // stagger each path
    card.querySelectorAll('.ph-doodle path,.ph-doodle circle,.ph-doodle line,.ph-doodle polyline').forEach((el,i)=>{
      const len=parseFloat(el.style.getPropertyValue('--dlen')||400);
      const dur=Math.max(0.4,len/600);
      const delay=i*0.12;
      el.style.transition=`stroke-dashoffset ${dur}s cubic-bezier(.4,0,.2,1) ${delay}s`;
      // micro delay to let transition register
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        el.style.strokeDashoffset='0';
      }));
    });
    card.classList.add('doodling');
  });
  card.addEventListener('mouseleave',()=>{
    // fade doodle back out after short pause
    doodleTO=setTimeout(()=>{
      card.querySelectorAll('.ph-doodle path,.ph-doodle circle,.ph-doodle line,.ph-doodle polyline').forEach(el=>{
        const len=el.style.getPropertyValue('--dlen')||'400';
        el.style.transition='stroke-dashoffset 0.3s ease';
        el.style.strokeDashoffset=len;
      });
      card.classList.remove('doodling');
    },200);
  });
});

})();

/* Team cards stagger */
(function(){
  const tcs=document.querySelectorAll('.t-card');
  const ioT=new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        const idx=Array.from(tcs).indexOf(e.target);
        setTimeout(()=>e.target.classList.add('in'),idx*120);
        ioT.unobserve(e.target);
      }
    });
  },{threshold:.1});
  tcs.forEach(c=>ioT.observe(c));
})();

/* ═══════════════════════════════════════
   WORK — Arc carousel gallery engine
   • Canvas-drawn arc of cards
   • Scroll = navigate (wheel + touch)
   • Mouse X → neon accent color (blue→orange→purple)
   • Non-center cards → pixel-block glitch
   • Center card → sharp + bright neon glow
   • Floor reflection below arc
═══════════════════════════════════════ */
(function(){
'use strict';

/* ── Project data ── */
const PROJECTS=[
  {num:'01',date:'2024',name:'NABERAULI',   type:'Show Reel',   desc:'Cinematic brand story capturing the soul of Georgian craftsmanship — shot on location.',chips:['Show Reel','Video','Brand Story'],hue:220,sat:55},
  {num:'02',date:'2024',name:'QUICKSHIPPER',type:'Commercial',   desc:'Fast-paced product launch commercial for Georgia\'s leading last-mile delivery platform.',chips:['Commercial','Motion','Social'],hue:200,sat:60},
  {num:'03',date:'2023',name:'IMEDI L',     type:'Campaign',     desc:'Full-funnel campaign production — TV spot, digital assets and OOH for a top media brand.',chips:['Campaign','TV Spot','Multi-Platform'],hue:260,sat:50},
  {num:'04',date:'2023',name:'COUNTMAN',    type:'Service Video', desc:'Explainer + testimonial series for an enterprise workforce management platform.',chips:['Explainer','Testimonial','B2B'],hue:185,sat:55},
  {num:'05',date:'2024',name:'2 TONS',      type:'Recipe Video', desc:'Craveable recipe content for Tbilisi\'s beloved burger joint — crafted for social feeds.',chips:['Recipe','Food','Social'],hue:28,sat:70},
  {num:'06',date:'2024',name:'BURGER BOSS', type:'Recipe Video', desc:'Bold, kinetic recipe videos turning a street-food brand into a scroll-stopping machine.',chips:['Recipe','Brand Video','Motion'],hue:12,sat:65}
];
const N=PROJECTS.length;

/* ── State ── */
let idx=0;           // current project index (float for lerp)
let idxTarget=0;     // target integer index
let mouseNX=0.5;     // normalized mouse X 0–1 across section
let mouseNY=0.5;
let accentH=240;     // current hue for neon accent (lerped)
let accentHTarget=240;
let scrollAcc=0;     // accumulated scroll delta
let lastIdx=-1;
let inSection=false;
/* hover / fx state */
let mousePX=-9999,mousePY=-9999,mouseVel=0,lastTrailX=0,lastTrailY=0;
let hoverI=-1,lastOrder=[];
const hoverAmt=new Array(N).fill(0);
const cardRects=[],cardHit=[];
const trail=[];
let glitchUntil=0,glitchNext=0,glitchBand=[0.3,0.1],glitchDX=8;

/* ── Off-screen card image buffers (sharp source) ── */
function makeCardBuffer(p,w,h){
  const oc=document.createElement('canvas');oc.width=w;oc.height=h;
  const ctx=oc.getContext('2d');
  const hue=p.hue,sat=p.sat;
  const g=ctx.createLinearGradient(0,0,w,h);
  g.addColorStop(0,`hsl(${hue},${sat}%,8%)`);
  g.addColorStop(.45,`hsl(${hue+18},${sat+5}%,14%)`);
  g.addColorStop(1,`hsl(${hue+36},${sat}%,7%)`);
  ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  // radial blobs
  for(let i=0;i<5;i++){
    const rg=ctx.createRadialGradient(w*(0.15+i*0.18),h*(0.2+Math.sin(i*1.9)*0.25),0,w*(0.15+i*0.18),h*(0.2+Math.sin(i*1.9)*0.25),w*0.32);
    rg.addColorStop(0,`hsla(${hue+i*35},80%,55%,${0.09+i*0.015})`);
    rg.addColorStop(1,`hsla(${hue+i*35},80%,55%,0)`);
    ctx.fillStyle=rg;ctx.fillRect(0,0,w,h);
  }
  // wave lines
  const idx2=PROJECTS.indexOf(p)+1;
  for(let j=0;j<5;j++){
    ctx.beginPath();
    for(let x=0;x<=w;x+=2){
      const y=h/2+Math.sin((x*0.025)+(j*1.1)+(idx2*1.7))*(30+j*18)*Math.sin(x/w*Math.PI);
      x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
    }
    ctx.strokeStyle=`hsla(${hue+j*12},100%,65%,${0.045+j*0.012})`;
    ctx.lineWidth=1.5;ctx.stroke();
  }
  // accent trace
  ctx.beginPath();
  for(let x=0;x<=w;x+=2){
    const y=h/2+Math.sin((x*0.018)+idx2)*18;
    x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
  }
  ctx.strokeStyle=`hsla(${hue},90%,65%,0.4)`;ctx.lineWidth=2;ctx.stroke();
  return oc;
}

/* ── Setup ── */
const canvas=document.getElementById('workCanvas');
if(!canvas)return;
const ctx=canvas.getContext('2d');
let W,H;
let cardBufs=[],cardTintR=[],cardTintB=[];

function resize(){
  W=canvas.width=canvas.offsetWidth||window.innerWidth;
  H=canvas.height=canvas.offsetHeight||600;
  const cw=Math.round(W*0.18);
  const ch=Math.round(cw*1.4);
  cardBufs=PROJECTS.map(p=>makeCardBuffer(p,cw,ch));
  // red-only / blue-only copies used for the RGB split on hover
  const tint=(buf,col)=>{const t=document.createElement('canvas');t.width=buf.width;t.height=buf.height;const c=t.getContext('2d');c.drawImage(buf,0,0);c.globalCompositeOperation='multiply';c.fillStyle=col;c.fillRect(0,0,t.width,t.height);return t;};
  cardTintR=cardBufs.map(b=>tint(b,'#ff0000'));
  cardTintB=cardBufs.map(b=>tint(b,'#0000ff'));
}
resize();
window.addEventListener('resize',()=>{resize()});

/* ── Lerp util ── */
function lerp(a,b,t){return a+(b-a)*t;}
function lerpAngle(a,b,t){
  let d=((b-a)%360+540)%360-180;
  return a+d*t;
}
function clamp(v,lo,hi){return Math.max(lo,Math.min(hi,v));}

/* ── Accent colour from mouse X ── */
// left → orange(28), center → blue(240), right → purple(280)
function mouseXToHue(nx){
  if(nx<0.5) return lerp(28,240,nx*2);
  return lerp(240,280,(nx-0.5)*2);
}
function hueToRgb(h,s,l){
  s/=100;l/=100;
  const k=n=>(n+h/30)%12;
  const a=s*Math.min(l,1-l);
  const f=n=>l-a*Math.max(-1,Math.min(k(n)-3,Math.min(9-k(n),1)));
  return[Math.round(f(0)*255),Math.round(f(8)*255),Math.round(f(4)*255)];
}
function accentRGB(h){return hueToRgb(h,90,60);}
function accentCSS(h,a=1){const[r,g,b]=accentRGB(h);return `rgba(${r},${g},${b},${a})`;}

/* ── Card outline with optional liquid bulge on the left / right edge ── */
function cardPath(ctx,x,y,cw,ch,r,dxL,dxR){
  const step=2;
  const inset=yy=>{const d=Math.min(yy,ch-yy);if(d>=r)return 0;return r-Math.sqrt(Math.max(0,r*r-(r-d)*(r-d)));};
  ctx.beginPath();
  ctx.moveTo(x+inset(0)+dxL(0),y);
  ctx.lineTo(x+cw-inset(0)+dxR(0),y);
  for(let yy=step;yy<ch;yy+=step)ctx.lineTo(x+cw-inset(yy)+dxR(yy),y+yy);
  ctx.lineTo(x+cw-inset(ch)+dxR(ch),y+ch);
  ctx.lineTo(x+inset(ch)+dxL(ch),y+ch);
  for(let yy=ch-step;yy>0;yy-=step)ctx.lineTo(x+inset(yy)+dxL(yy),y+yy);
  ctx.closePath();
}
const ZERO=()=>0;

/* ── Draw one card at position on arc ──
   fx = {hv (0..1 hover), mx,my (mouse in canvas px), vel, glitch:{on,band,dx}, tR,tB (tinted buffers)} */
function drawCard(ctx,buf,cx,cy,scale,alpha,isCenter,accentHue,mouseNX,mouseNY,elapsedMs,fx){
  const cw=buf.width*scale,ch=buf.height*scale;
  const x=cx-cw/2,y=cy-ch/2;
  const r=Math.min(cw,ch)*0.06; // corner radius
  const hv=fx?fx.hv:0;

  /* liquid bulge toward the cursor (strongest when the cursor is near a side edge) */
  let dxL=ZERO,dxR=ZERO,dxC=ZERO;
  if(hv>0.01){
    const ly=clamp(fx.my-y,0,ch);
    const sig=ch*0.2;
    const amp=cw*0.1*(1+Math.min(fx.vel,1.2))*hv;
    const nx=(fx.mx-cx)/(cw/2);                         // -1 (left edge) … 1 (right edge)
    const proxL=clamp((-nx-0.25)/0.75,0,1),proxR=clamp((nx-0.25)/0.75,0,1);
    const g=yy=>Math.exp(-Math.pow((yy-ly)/sig,2));
    dxL=yy=>-amp*proxL*g(yy);
    dxR=yy=> amp*proxR*g(yy);
    dxC=yy=>(dxL(yy)+dxR(yy))*0.5;
  }

  ctx.save();
  ctx.globalAlpha=alpha;
  cardPath(ctx,x,y,cw,ch,r,dxL,dxR);
  ctx.clip();

  if(isCenter){
    // Sharp draw — smooth source
    ctx.imageSmoothingEnabled=true;
    ctx.imageSmoothingQuality='high';
    ctx.drawImage(buf,x,y,cw,ch);
    // Subtle vignette overlay
    const vg=ctx.createRadialGradient(cx,cy,0,cx,cy,Math.max(cw,ch)*0.65);
    vg.addColorStop(0,'rgba(0,0,0,0)');
    vg.addColorStop(1,'rgba(0,0,0,0.35)');
    ctx.fillStyle=vg;ctx.fillRect(x,y,cw,ch);
  } else {
    // Pixel-block glitch — mosaic pass
    const dist=Math.abs(scale-1)/0.6; // 0 at center, 1 at far edge
    const blockSize=Math.max(3,Math.round(10*dist)*scale);
    const tempW=Math.max(1,Math.round(cw/blockSize));
    const tempH=Math.max(1,Math.round(ch/blockSize));
    const tmp=document.createElement('canvas');tmp.width=tempW;tmp.height=tempH;
    const tCtx=tmp.getContext('2d');
    tCtx.imageSmoothingEnabled=false;
    tCtx.drawImage(buf,0,0,tempW,tempH);
    ctx.imageSmoothingEnabled=false;
    ctx.drawImage(tmp,x,y,cw,ch);

    // scanline overlay
    const lineAlpha=clamp(dist*0.45,0,0.4);
    for(let ly=y;ly<y+ch;ly+=Math.max(2,Math.round(3*scale))){
      ctx.fillStyle=`rgba(0,0,0,${lineAlpha})`;
      ctx.fillRect(x,ly,cw,Math.max(1,Math.round(scale)));
    }
    // dark overlay so non-center recedes
    ctx.fillStyle=`rgba(0,0,0,${clamp(dist*0.5,0,0.5)})`;
    ctx.fillRect(x,y,cw,ch);
  }

  /* hover layer: the card turns sharp, its content ripples and splits into RGB */
  if(hv>0.01){
    ctx.imageSmoothingEnabled=true;
    ctx.imageSmoothingQuality='high';
    ctx.globalAlpha=alpha*hv;
    const sh=3,gl=fx.glitch;
    for(let yy=0;yy<ch;yy+=sh){
      let off=dxC(yy);
      if(gl.on&&yy/ch>gl.band[0]&&yy/ch<gl.band[0]+gl.band[1])off+=gl.dx*scale;
      const sy=yy/ch*buf.height,shs=Math.min(buf.height-sy,sh/ch*buf.height+0.5);
      ctx.drawImage(buf,0,sy,buf.width,shs,x+off,y+yy,cw,sh+0.6);
    }
    // RGB split (red one way, blue the other) — stronger with speed
    const ca=(1.5+fx.vel*7)*hv*scale+(gl.on?3:0);
    ctx.globalCompositeOperation='lighter';
    ctx.globalAlpha=alpha*0.3*hv;
    ctx.drawImage(fx.tR,x-ca,y,cw,ch);
    ctx.drawImage(fx.tB,x+ca,y,cw,ch);
    ctx.globalCompositeOperation='source-over';
    // light sweep under the cursor
    const lg=ctx.createRadialGradient(fx.mx,fx.my,0,fx.mx,fx.my,cw*0.6);
    lg.addColorStop(0,accentCSS(accentHue,0.22*hv));
    lg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.globalAlpha=alpha;
    ctx.fillStyle=lg;ctx.fillRect(x-cw*0.2,y,cw*1.4,ch);
  }

  ctx.restore();

  // ── Neon border glow (shifts hotter and thicker on hover) ──
  const baseGlow=isCenter?0.95:clamp(1-Math.abs(scale-1)*1.8,0.1,0.6);
  const glowAlpha=Math.min(1,baseGlow+hv*0.5);
  const borderW=(isCenter?2.5:1.2)+hv*1.6;
  const hue=hv>0.01?lerpAngle(accentHue,315,hv*0.45):accentHue;
  ctx.save();
  ctx.globalAlpha=alpha*glowAlpha;
  ctx.shadowColor=accentCSS(hue,isCenter?0.9:0.5+hv*0.4);
  ctx.shadowBlur=Math.round((isCenter?32:14)*scale*(1+hv*0.9));
  ctx.strokeStyle=accentCSS(hue,isCenter?0.9:0.5+hv*0.4);
  ctx.lineWidth=borderW;
  cardPath(ctx,x,y,cw,ch,r,dxL,dxR);
  ctx.stroke();
  ctx.shadowBlur=0;
  ctx.restore();

  // ── Floor reflection ──
  if(isCenter||scale>0.4){
    const ry=cy+ch/2*scale;
    const rh=Math.round(ch*scale*0.35);
    ctx.save();
    ctx.globalAlpha=alpha*(isCenter?0.18:0.08)*(1+hv*0.6);
    ctx.translate(cx,ry);
    ctx.scale(1,-1);
    ctx.beginPath();
    ctx.moveTo(-cw/2,0);ctx.lineTo(cw/2,0);ctx.lineTo(cw/2,-rh);ctx.lineTo(-cw/2,-rh);ctx.closePath();
    ctx.clip();
    ctx.imageSmoothingEnabled=false;
    ctx.drawImage(buf,-cw/2,-rh,cw,rh);
    const fg=ctx.createLinearGradient(0,0,0,-rh);
    fg.addColorStop(0,'rgba(0,0,0,0)');fg.addColorStop(1,'rgba(0,0,0,0.9)');
    ctx.fillStyle=fg;ctx.fillRect(-cw/2,0-rh,cw,rh);
    ctx.restore();
  }
}

/* ── Title / tagline (swap with a short text scramble) ── */
const SCR='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/<>';
function scramble(el,text,dur){
  if(!el)return;
  cancelAnimationFrame(el._sr);
  const t0=performance.now();
  (function step(now){
    const p=Math.min(1,(now-t0)/dur);
    let out='';
    for(let k=0;k<text.length;k++)out+=(text[k]===' '||k<text.length*p)?text[k]:SCR[Math.random()*SCR.length|0];
    el.textContent=out;
    if(p<1)el._sr=requestAnimationFrame(step);
  })(t0);
}
let _shownText=-1;
function setInfoText(i){
  if(i===_shownText)return;
  _shownText=i;
  const p=PROJECTS[i];
  scramble(document.getElementById('wipNameText'),p.name,420);
  const d=document.getElementById('wipDesc');
  if(d){d.style.opacity=0;setTimeout(()=>{d.textContent=p.desc;d.style.opacity=1},170);}
}

/* ── Accent + tick counter follow the centre project ── */
let _lastInfoIdx=-1;
function updateInfo(i){
  if(i===_lastInfoIdx)return;
  _lastInfoIdx=i;
  const p=PROJECTS[i];
  const cur=document.getElementById('wtCur');
  if(cur)cur.textContent=p.num;
  const [r,g,b]=hueToRgb(p.hue,90,60);
  const sec=document.getElementById('work');
  if(sec){
    sec.style.setProperty('--wAccent',`rgb(${r},${g},${b})`);
    sec.style.setProperty('--wAccentBorder',`rgba(${r},${g},${b},0.4)`);
  }
}

/* ── Tick counter build ── */
const TICK_PITCH=7,TICKS_PER=4;
const wtTicks=document.getElementById('wtTicks'),wtMarker=document.getElementById('wtMarker');
(function buildTicks(){
  if(!wtTicks)return;
  const tot=document.getElementById('wtTotal');if(tot)tot.textContent=String(N).padStart(2,'0');
  for(let k=0;k<=(N-1)*TICKS_PER;k++){
    const t=document.createElement('div');
    t.className='wt-tick'+(k%TICKS_PER===0?' major':'');
    t.addEventListener('click',()=>{idxTarget=clamp(Math.round(k/TICKS_PER),0,N-1);});
    wtTicks.insertBefore(t,wtMarker);
  }
})();

/* ── Metadata overlay on the hovered card ── */
const pinfo=document.getElementById('wPinfo');
let _pinfoI=-1;
function renderPinfo(i){
  if(!pinfo||i===_pinfoI)return;
  _pinfoI=i;
  const p=PROJECTS[i];
  pinfo.innerHTML=
    `<div class="pi-row"><span>PRJCT</span><b>/${p.num}</b></div>`+
    `<div class="pi-row"><span>YEAR</span><b>${p.date}</b></div>`+
    `<div class="pi-row"><span>NAME</span><b>${p.name}</b></div>`+
    `<div class="pi-row"><span>TYPE</span><b>${p.type}</b></div>`+
    `<div class="pi-row"><span>SCOPE</span><b>${p.chips.join('<br>')}</b></div>`;
  pinfo.classList.remove('glitch');void pinfo.offsetWidth;pinfo.classList.add('glitch');
}

/* ── Render loop ── */
const wCursorEl=document.getElementById('workCursor');
let t0=0;
function render(ts){
  const dt=Math.min((ts-t0)/1000,0.05);t0=ts;

  // lerp index towards target
  idx=lerp(idx,idxTarget,clamp(dt*8,0,1));

  // lerp accent hue from mouse X
  accentHTarget=mouseXToHue(mouseNX);
  accentH=lerpAngle(accentH,accentHTarget,clamp(dt*3,0,1));

  mouseVel=lerp(mouseVel,0,clamp(dt*5,0,1));

  // glitch scheduler (short horizontal tears on the hovered card)
  if(ts>glitchNext){
    glitchUntil=ts+110+Math.random()*110;
    glitchNext=ts+800+Math.random()*1500;
    glitchBand=[Math.random()*0.8,0.04+Math.random()*0.12];
    glitchDX=(Math.random()<0.5?-1:1)*(6+Math.random()*10);
  }
  const glitch={on:ts<glitchUntil,band:glitchBand,dx:glitchDX};

  // ── hit-test against last frame's card rects (topmost = drawn last) ──
  let hit=-1;
  if(inSection){
    for(let k=lastOrder.length-1;k>=0;k--){
      const i=lastOrder[k],rc=cardHit[i];
      if(rc&&mousePX>=rc.x&&mousePX<=rc.x+rc.w&&mousePY>=rc.y&&mousePY<=rc.y+rc.h){hit=i;break;}
    }
  }
  hoverI=hit;
  for(let i=0;i<N;i++)hoverAmt[i]=lerp(hoverAmt[i],i===hoverI?1:0,clamp(dt*9,0,1));

  // background
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#06040e';
  ctx.fillRect(0,0,W,H);

  // subtle bg radial glow driven by mouse
  const bgGlow=ctx.createRadialGradient(mouseNX*W,mouseNY*H,0,mouseNX*W,mouseNY*H,W*0.6);
  bgGlow.addColorStop(0,accentCSS(accentH,0.07));
  bgGlow.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=bgGlow;ctx.fillRect(0,0,W,H);

  // ── cursor light: a soft blob plus a fading smoky trail (drawn behind the cards) ──
  ctx.save();
  ctx.globalCompositeOperation='lighter';
  for(let k=trail.length-1;k>=0;k--){
    const p=trail[k];
    p.life-=dt*0.85;
    if(p.life<=0){trail.splice(k,1);continue;}
    p.x+=p.vx*dt*28;p.y+=p.vy*dt*28;
    const rad=60+(1-p.life)*110;
    const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,rad);
    g.addColorStop(0,accentCSS(accentH+(1-p.life)*45,0.17*p.life));
    g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=g;ctx.fillRect(p.x-rad,p.y-rad,rad*2,rad*2);
  }
  if(inSection){
    const g=ctx.createRadialGradient(mousePX,mousePY,0,mousePX,mousePY,130);
    g.addColorStop(0,accentCSS(accentH,0.2));
    g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=g;ctx.fillRect(mousePX-130,mousePY-130,260,260);
  }
  ctx.restore();

  // arc layout: cards arranged on a horizontal arc
  const arcR=W*0.75;          // radius of arc
  const arcCY=H*0.42+arcR;    // arc center Y (far below viewport)
  const arcCX=W/2+mouseNX*W*0.04-W*0.02; // slight mouse parallax
  const spread=0.085;          // radians between cards
  const centerAngle=-Math.PI/2; // top of arc = center

  const angles=PROJECTS.map((_,i)=>centerAngle+(i-idx)*spread);
  // hovered card is raised to the front; the rest stay painter-sorted (far → near)
  const key=i=>Math.abs(i-idx)-hoverAmt[i]*3;
  const order=[...Array(N).keys()].sort((a,b)=>key(a)-key(b)).reverse();
  lastOrder=order;

  order.forEach(i=>{
    const ang=angles[i];
    const cx=arcCX+arcR*Math.cos(ang);
    const cy=arcCY+arcR*Math.sin(ang);
    const dist=Math.abs(i-idx);
    const isCenter=dist<0.5;
    const hvI=hoverAmt[i];
    // a hovered side card slides outward and grows so its info is readable on its own face
    const pop=isCenter?0:hvI;
    const side=i>idx?1:-1;
    const scale=Math.max(0.3,1-dist*0.14)*(1+0.1*pop);
    const alpha=Math.max(Math.max(0.15,1-dist*0.22),hvI);
    const cw=cardBufs[i].width*scale,ch=cardBufs[i].height*scale;
    const cx2=cx+side*cardBufs[i].width*Math.max(0.3,1-dist*0.14)*0.42*pop;
    cardRects[i]={x:cx2-cw/2,y:cy-ch/2,w:cw,h:ch};
    // hover region: the visible outer part of the card plus wherever it pops out to
    const w0=cardBufs[i].width*Math.max(0.3,1-dist*0.14),shift=w0*0.42;
    if(isCenter)cardHit[i]={x:cx-w0/2,y:cy-ch/2,w:w0,h:ch};
    else{
      const l0=cx-w0/2,r0=cx+w0/2;
      const lo=side>0?l0+shift*0.9:Math.min(l0,cx2-cw/2);
      const hi=side>0?Math.max(r0,cx2+cw/2):r0-shift*0.9;
      cardHit[i]={x:lo,y:cy-ch/2,w:hi-lo,h:ch};
    }
    if(alpha<0.05)return;
    drawCard(ctx,cardBufs[i],cx2,cy,scale,alpha,isCenter,
      isCenter?accentH:accentH+dist*8,mouseNX,mouseNY,ts,
      {hv:hoverAmt[i],mx:mousePX,my:mousePY,vel:mouseVel,glitch,tR:cardTintR[i],tB:cardTintB[i]});
  });

  // ── tick marker glides with idx ──
  if(wtMarker)wtMarker.style.transform=`translateX(${(idx*TICKS_PER*TICK_PITCH-6).toFixed(1)}px)`;

  // ── overlay + title ──
  const ci=((Math.round(idx)%N)+N)%N;
  if(ci!==lastIdx){lastIdx=ci;updateInfo(ci);}
  setInfoText(hoverI>=0?hoverI:ci);
  if(pinfo){
    if(hoverI>=0){
      const rc=cardRects[hoverI];
      renderPinfo(hoverI);
      pinfo.style.left=rc.x+'px';pinfo.style.top=rc.y+'px';pinfo.style.width=rc.w+'px';pinfo.style.height=rc.h+'px';
      pinfo.classList.add('on');
    } else pinfo.classList.remove('on');
  }
  if(wCursorEl)wCursorEl.classList.toggle('on-card',hoverI>=0);

  requestAnimationFrame(render);
}
requestAnimationFrame(ts=>{t0=ts;render(ts);});

/* ── Scroll navigation ── */
const SEC=document.getElementById('work');
let scrollCooldown=0;
function navigate(dir){
  idxTarget=clamp(idxTarget+dir,0,N-1);
}
/* At boundary (first or last slide) don't block page scroll so user can exit section */
let _scrollLocked=false;
let _scrollLockTO=null;
SEC&&SEC.addEventListener('wheel',e=>{
  const r=SEC.getBoundingClientRect();
  // section not in view — ignore
  if(r.top>window.innerHeight*0.6||r.bottom<window.innerHeight*0.4)return;
  const dir=e.deltaY>0?1:-1;
  const atBoundary=(dir>0&&idxTarget>=N-1)||(dir<0&&idxTarget<=0);
  if(atBoundary){
    // Allow native scroll to exit the section
    scrollAcc=0;
    return;
  }
  e.preventDefault();
  scrollAcc+=e.deltaY;
  if(Math.abs(scrollAcc)>80){
    navigate(scrollAcc>0?1:-1);
    scrollAcc=0;
  }
},{passive:false});

/* ── Touch swipe ── */
let touchX=0,touchY=0;
SEC&&SEC.addEventListener('touchstart',e=>{touchX=e.touches[0].clientX;touchY=e.touches[0].clientY;},{passive:true});
SEC&&SEC.addEventListener('touchend',e=>{
  const dx=e.changedTouches[0].clientX-touchX;
  const dy=e.changedTouches[0].clientY-touchY;
  if(Math.abs(dx)>Math.abs(dy)&&Math.abs(dx)>40)navigate(dx<0?1:-1);
},{passive:true});

/* ── Mouse tracking ── */
SEC&&SEC.addEventListener('mousemove',e=>{
  const r=SEC.getBoundingClientRect();
  mouseNX=clamp((e.clientX-r.left)/r.width,0,1);
  mouseNY=clamp((e.clientY-r.top)/r.height,0,1);
  const nx=e.clientX-r.left,ny=e.clientY-r.top;
  const d=Math.hypot(nx-mousePX,ny-mousePY);
  if(mousePX>-9000){
    mouseVel=Math.min(1.5,mouseVel+d/70);
    if(Math.hypot(nx-lastTrailX,ny-lastTrailY)>7){
      trail.push({x:nx,y:ny,vx:(nx-lastTrailX)*0.15,vy:(ny-lastTrailY)*0.15,life:1});
      if(trail.length>46)trail.shift();
      lastTrailX=nx;lastTrailY=ny;
    }
  }
  mousePX=nx;mousePY=ny;
  inSection=true;
});
SEC&&SEC.addEventListener('mouseleave',()=>{inSection=false;mousePX=mousePY=-9999;});
/* click a side card to bring it to the centre */
canvas.addEventListener('click',()=>{if(hoverI>=0)idxTarget=hoverI;});

/* ── Keyboard ── */
document.addEventListener('keydown',e=>{
  if(!SEC)return;
  const r=SEC.getBoundingClientRect();
  if(r.top>window.innerHeight||r.bottom<0)return;
  if(e.key==='ArrowRight'||e.key==='ArrowDown')navigate(1);
  if(e.key==='ArrowLeft'||e.key==='ArrowUp')navigate(-1);
});

/* ── Custom cursor ── */
const wCursor=document.getElementById('workCursor');
if(SEC&&wCursor){
  let wx=0,wy=0,wCx=0,wCy=0,wRaf=0;
  function wTick(){wCx+=(wx-wCx)*0.12;wCy+=(wy-wCy)*0.12;wCursor.style.left=wCx+'px';wCursor.style.top=wCy+'px';wRaf=requestAnimationFrame(wTick);}
  SEC.addEventListener('mouseenter',()=>{wCursor.classList.add('visible');if(!wRaf)wTick();});
  SEC.addEventListener('mouseleave',()=>{wCursor.classList.remove('visible');cancelAnimationFrame(wRaf);wRaf=0;});
  SEC.addEventListener('mousemove',e=>{wx=e.clientX;wy=e.clientY;});
}

updateInfo(0);
setInfoText(0);
})();

/* Infinity loop background canvas */
function makeInfLoop(canvasId,color){
  const canvas=document.getElementById(canvasId);if(!canvas)return;
  const ctx=canvas.getContext('2d');let W,H,t=0;
  function resize(){W=canvas.width=canvas.offsetWidth;H=canvas.height=canvas.offsetHeight}
  resize();window.addEventListener('resize',resize);
  function frame(){
    ctx.clearRect(0,0,W,H);t+=.004;
    const cx=W/2,cy=H/2,A=Math.min(W,H)*.42,B=Math.min(W,H)*.18;
    for(let ring=0;ring<3;ring++){
      const sc=.65+ring*.18;
      ctx.beginPath();
      const steps=320;
      for(let i=0;i<=steps;i++){const theta=(i/steps)*Math.PI*2;const s=Math.sin(theta),c=Math.cos(theta),d=1+s*s;const x=cx+A*sc*c/d,y=cy+B*sc*s*c/d;i===0?ctx.moveTo(x,y):ctx.lineTo(x,y)}
      ctx.closePath();
      ctx.strokeStyle=color.replace('1)',[.6,.35,.15][ring]+')');
      ctx.lineWidth=[2,1.5,1][ring];ctx.stroke();
    }
    const theta2=t%(Math.PI*2);
    const s2=Math.sin(theta2),c2=Math.cos(theta2),d2=1+s2*s2;
    const dx=cx+A*c2/d2,dy=cy+B*s2*c2/d2;
    ctx.beginPath();ctx.arc(dx,dy,5,0,Math.PI*2);ctx.fillStyle=color.replace('1)','.9)');ctx.fill();
    const glow=ctx.createRadialGradient(dx,dy,0,dx,dy,20);
    glow.addColorStop(0,color.replace('1)','.4)'));glow.addColorStop(1,color.replace('1)','0)'));
    ctx.beginPath();ctx.arc(dx,dy,20,0,Math.PI*2);ctx.fillStyle=glow;ctx.fill();
    requestAnimationFrame(frame);
  }
  frame();
}
makeInfLoop('infCanvas','rgba(0,102,255,1)');
makeInfLoop('ctaCanvas','rgba(0,102,255,1)');

/* Video thumbnails removed — gallery uses full-screen canvas backgrounds */

/* Photo placeholders */
const phHues=[160,210,30,260,10,140,190,50,300];
function drawPH(id,hue){
  const c=document.getElementById(id);if(!c)return;
  const p=c.parentElement;c.width=p.offsetWidth||300;c.height=p.offsetHeight||375;
  const ctx=c.getContext('2d'),w=c.width,h=c.height;
  const gr=ctx.createLinearGradient(0,0,w,h);
  gr.addColorStop(0,`hsl(${hue},40%,88%)`);gr.addColorStop(.5,`hsl(${hue+15},45%,78%)`);gr.addColorStop(1,`hsl(${hue-10},50%,65%)`);
  ctx.fillStyle=gr;ctx.fillRect(0,0,w,h);
  for(let i=0;i<4;i++){const rg=ctx.createRadialGradient(w*(.2+i*.2),h*(.1+i*.22),0,w*(.2+i*.2),h*(.1+i*.22),w*.3);rg.addColorStop(0,`hsla(${hue+i*40},60%,55%,0.18)`);rg.addColorStop(1,`hsla(${hue+i*40},60%,55%,0)`);ctx.fillStyle=rg;ctx.fillRect(0,0,w,h)}
  ctx.strokeStyle=`hsla(${hue},30%,40%,0.08)`;ctx.lineWidth=1;
  for(let x=0;x<w;x+=30){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke()}
  for(let y=0;y<h;y+=30){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}
}
for(let i=1;i<=9;i++) drawPH('ph'+i,phHues[i-1]);

let rt;
window.addEventListener('resize',()=>{
  clearTimeout(rt);rt=setTimeout(()=>{for(let i=1;i<=6;i++) drawVT('vt'+i,i);for(let i=1;i<=9;i++) drawPH('ph'+i,phHues[i-1])},150);
});

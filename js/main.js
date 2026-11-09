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
  return PARTNER_DEFAULTS.slice(0,10).map(p=>({...p,photo:null}));
}
function savePartners(arr){
  try{localStorage.setItem('looper_partners',JSON.stringify(arr));}catch(e){}
}
let partners = loadPartners().slice(0,10);

/* ── Image config (set in js/config.js when running as a project; empty here) ── */
const LOOPER_CFG = window.LOOPER_CONFIG || {heroCards:[],services:[],partners:[],cardBack:'',showUploader:false};
/* one accent system: every hue in the site is remapped into the blue → violet range */
const BV = h => 212 + ((((h%360)+360)%360)/360)*60;
/* uploader buttons are developer tools: shown only with #edit / ?edit in the URL (or showUploader:true in js/config.js) */
const EDIT_MODE = /(^|[#?&])edit(\b|=)/.test(location.hash+location.search) || LOOPER_CFG.showUploader===true;
document.documentElement.classList.toggle('edit-mode', EDIT_MODE);
const pmOpenBtn = document.getElementById('pmOpen'); if(pmOpenBtn) pmOpenBtn.hidden = !EDIT_MODE;

/* shared helper: shrink uploads so they fit in localStorage */
function fileToDataUrl(file, maxSide, cb){
  const fr = new FileReader();
  fr.onload = ev => {
    const im = new Image();
    im.onload = () => {
      const k = Math.min(1, maxSide/Math.max(im.width, im.height));
      const c = document.createElement('canvas');
      c.width = Math.round(im.width*k); c.height = Math.round(im.height*k);
      c.getContext('2d').drawImage(im,0,0,c.width,c.height);
      cb(c.toDataURL('image/jpeg',0.86));
    };
    im.onerror = () => cb(ev.target.result);
    im.src = ev.target.result;
  };
  fr.readAsDataURL(file);
}
/* back-of-card image: config file wins over a browser upload */
let cardBackUrl = '';
try{ cardBackUrl = localStorage.getItem('looper_card_back') || ''; }catch(e){}
// Photos listed in config win over anything saved in the browser
partners.forEach((p,i)=>{ const src = (LOOPER_CFG.heroCards||[])[i]; if(src) p.photo = src; });

/* ═══════════════════════════════════════════════════════════
   LOADER — one glowing infinity line draws itself (0→100%),
   then the camera dives into the right-hand lobe; the lobe's
   interior is a window onto the home page.
═══════════════════════════════════════════════════════════ */
(function(){
  const loader = document.getElementById('loader');
  const canvas = document.getElementById('loaderCanvas');
  const pctEl  = document.getElementById('loaderPct');
  const ctx    = canvas.getContext('2d');
  if(!loader || !ctx) return;
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches;
  let W=0,H=0,dpr=1,A=200,cx=0,cy=0;
  function resize(){
    dpr=Math.min(window.devicePixelRatio||1,2);
    W=window.innerWidth;H=window.innerHeight;
    canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);
    A=Math.min(W*0.30,330);cx=W/2;cy=H/2-Math.min(24,H*0.03);
  }
  resize();window.addEventListener('resize',resize);

  /* lemniscate, starting at the centre crossing and travelling into the right lobe first */
  const N=360, K=0.95;
  const pts=[];
  for(let i=0;i<=N;i++){
    const t=Math.PI/2 - (i/N)*Math.PI*2;          // π/2 → −3π/2  (centre → right lobe → centre → left lobe → centre)
    const s=Math.sin(t),c=Math.cos(t),d=1+s*s;
    pts.push([c/d,K*(s*c/d)]);                    // unit space (scaled by A when drawn)
  }
  // lobe centre in unit space (centroid of right lobe)
  const LOBE_X=0.56;

  function strokePath(upTo,lw,style,blur,glow){
    const n=Math.max(2,Math.floor(upTo*N));
    ctx.beginPath();
    for(let i=0;i<=n;i++){
      const p=pts[i];
      i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]);
    }
    ctx.lineWidth=lw;ctx.strokeStyle=style;ctx.shadowBlur=blur;ctx.shadowColor=glow;
    ctx.stroke();
  }

  function frame(draw,prog,zoomT){
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);
    // camera: translate so the chosen lobe centre moves to the screen centre as we zoom
    const Smax=Math.max(W,H)/A*1.15*9;               // plenty to swallow the screen
    const S=Math.exp(Math.log(Smax)*zoomT);          // 1 → Smax, exponential = constant-speed dolly
    const pan=zoomT;                                 // 0 → 1
    const ox=cx - LOBE_X*A*pan*S;                   // pan toward lobe centre
    ctx.save();
    ctx.translate(ox, cy+(H/2-cy)*pan);
    ctx.scale(A*S,A*S);
    const px=1/(A*S);                                // one screen pixel in local units
    ctx.lineJoin='round';ctx.lineCap='round';

    // zoom: punch a lobe-shaped window through the black so the home page shows through
    if(zoomT>0){
      ctx.save();
      ctx.globalCompositeOperation='destination-out';
      ctx.shadowBlur=0;
      ctx.beginPath();
      // right lobe = points from centre (i=0) round to centre (i=N/2)
      for(let i=0;i<=N/2;i++){const p=pts[i];i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]);}
      ctx.closePath();ctx.fill();
      ctx.restore();
    }

    // faint full track
    const wBase=Math.max(2.5,Math.min(5,W*0.004));
    const lwScreen=wBase*Math.pow(S,0.55)*(1-zoomT*0.35);   // line thickens as we get closer
    if(zoomT<1){
      ctx.globalAlpha=Math.max(0,1-zoomT*1.1);
      strokePath(1,1.5*px*Math.pow(S,0.3),'rgba(255,255,255,.12)',0,'transparent');
      ctx.globalAlpha=1;
    }

    // drawn part: blue→white gradient-ish by layering (wide glow, core)
    if(prog>0){
      const upTo=Math.min(prog,1);
      ctx.globalCompositeOperation='lighter';
      strokePath(upTo,lwScreen*px*2.6,'rgba(0,102,255,.22)',24*Math.min(S,4),'rgba(0,102,255,.9)');
      strokePath(upTo,lwScreen*px*1.2,'rgba(60,140,255,.95)',14,'rgba(0,120,255,1)');
      strokePath(upTo,lwScreen*px*0.45,'rgba(255,255,255,.95)',6,'#fff');
      ctx.globalCompositeOperation='source-over';
      // comet head
      if(prog<1){
        const hi=Math.floor(upTo*N),hp=pts[hi];
        ctx.shadowBlur=26;ctx.shadowColor='#4da3ff';
        ctx.fillStyle='#fff';
        ctx.beginPath();ctx.arc(hp[0],hp[1],lwScreen*px*1.5,0,Math.PI*2);ctx.fill();
      }
    }
    ctx.restore();
    ctx.shadowBlur=0;
  }

  /* timing: tied to the real page load (never faster than the drawing, never waiting forever),
     shorter on repeat visits, instant with reduced motion, skippable at any time */
  let seen=false; try{ seen = sessionStorage.getItem('looper_seen')==='1'; }catch(e){}
  const DRAW_MS = reduce?10:(seen?600:1500), HOLD_MS = reduce?10:(seen?0:220), ZOOM_MS = reduce?10:(seen?750:1150);
  if(seen||reduce) loader.classList.add('fast');
  let ready = document.readyState==='complete';
  if(!ready){ window.addEventListener('load',()=>{ready=true},{once:true}); setTimeout(()=>{ready=true},5000); }
  let k=1;                                   // time multiplier: raised when the visitor skips
  const skipBtn=document.getElementById('loaderSkip');
  function skip(){ k=6; ready=true; }
  if(skipBtn) skipBtn.addEventListener('click',skip);
  ['keydown','wheel','touchstart'].forEach(ev=>window.addEventListener(ev,skip,{passive:true,once:true}));
  let phase=0, phT=0, pp=0, last=performance.now();
  function easeIO(p){return p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2}
  function loop(now){
    const dt=Math.min(now-last,64)*k; last=now;
    if(phase===0){
      pp=Math.min(pp+dt/DRAW_MS, ready?1:0.9);   // waits at 90% until the page has really loaded
      const e=1-Math.pow(1-pp,2.2)*0.85-(1-pp)*0.15;   // quick start, gentle finish
      const prog=pp<1?Math.min(Math.max(e,0),1):1;
      pctEl.innerHTML=Math.round(prog*100)+'<span style="font-size:.5em;opacity:.4">%</span>';
      frame(true,prog,0);
      if(pp>=1){phase=1;phT=0;}
    }else if(phase===1){
      frame(true,1,0);
      phT+=dt;
      if(phT>=HOLD_MS){phase=2;phT=0;loader.classList.add('zooming');document.body.classList.add('loaded');}
    }else if(phase===2){
      phT+=dt;
      const p=Math.min(phT/ZOOM_MS,1);
      frame(true,1,easeIO(p));
      canvas.style.opacity=p>0.9?String(1-(p-0.9)/0.1):'1';
      if(p>=1){
        loader.classList.add('done');
        try{ sessionStorage.setItem('looper_seen','1'); }catch(e){}
        return;
      }
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();

/* ═══════════════════════════════════════════════════════════
   NAV: compact on scroll + color swap
═══════════════════════════════════════════════════════════ */
(function(){
  const nav = document.getElementById('mainNav');
  const hero = document.getElementById('home');
  function update(){
    const scrolled = window.scrollY > 60;
    nav.classList.toggle('scrolled', scrolled);
  }
  window.addEventListener('scroll', update, {passive:true});
  update();
})();


/* ═══════════════════════════════════════════════════════════
   NAV EXTRAS: mobile menu, scroll-spy, scroll progress
═══════════════════════════════════════════════════════════ */
(function(){
  const nav=document.getElementById('mainNav'), toggle=document.getElementById('navToggle'), sheet=document.getElementById('navSheet');
  const root=document.documentElement;
  function setOpen(o){
    if(!toggle||!sheet) return;
    sheet.classList.toggle('open',o); toggle.setAttribute('aria-expanded',String(o));
    toggle.setAttribute('aria-label',o?'Close menu':'Open menu'); sheet.setAttribute('aria-hidden',String(!o));
    root.style.overflow=o?'hidden':'';
  }
  if(toggle){
    toggle.addEventListener('click',()=>setOpen(!sheet.classList.contains('open')));
    sheet.addEventListener('click',e=>{ if(e.target.closest('a')) setOpen(false); });
    window.addEventListener('keydown',e=>{ if(e.key==='Escape') setOpen(false); });
    window.addEventListener('resize',()=>{ if(window.innerWidth>768) setOpen(false); });
  }
  /* scroll-spy — pages are stacked, so use the zero-height markers at each page's natural position */
  const order=['services','work','partners','photoSection','branding','team','careers','contact'];
  const links=[...document.querySelectorAll('.nav-links a,.sheet-link')];
  const bar=document.getElementById('scrollProgress');
  const pins=[...document.querySelectorAll('.pin-prog')].map(el=>({i:el.querySelector('i'),wrap:el.closest('.work-wrap,.photo-section')}));
  let cur='';
  function spy(){
    const m=window._marks; if(!m) return;
    const y=window.innerHeight*0.5; let act='';
    order.forEach(id=>{ const el=m[id]; if(el && el.getBoundingClientRect().top<=y) act=id; });
    if(act!==cur){
      cur=act;
      links.forEach(a=>{ const on=a.getAttribute('href')==='#'+act; a.classList.toggle('active',on); if(on) a.setAttribute('aria-current','true'); else a.removeAttribute('aria-current'); });
    }
  }
  function progress(){
    const doc=document.documentElement, max=doc.scrollHeight-window.innerHeight;
    if(bar) bar.style.transform='scaleX('+(max>0?Math.min(1,window.scrollY/max):0).toFixed(4)+')';
    pins.forEach(p=>{
      if(!p.wrap||!p.i) return;
      const r=p.wrap.getBoundingClientRect(), span=r.height-window.innerHeight;
      const v=span>0?Math.max(0,Math.min(1,-r.top/span)):0;
      p.i.style.transform='scaleX('+v.toFixed(4)+')';
    });
  }
  function onScroll(){ spy(); progress(); }
  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('resize',onScroll,{passive:true});
  window.addEventListener('load',onScroll);
  setTimeout(onScroll,300);
})();

/* ── PAGE STACK ── */
(function(){
  const els=[...document.querySelectorAll('#home,#statsBand,#about,#services,.marquee-band,#workWrap,#photoSection,.brand-section,#partners,#team,#careers,#contact,body>footer')];
  if(!els.length) return;
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches;
  els.forEach((el,i)=>{
    el.classList.add('stack');
    if(i<els.length-1 && !reduce){ const sh=document.createElement('i'); sh.className='stack-shade'; el.appendChild(sh); el._shade=sh; el._op=0; }
  });
  function layout(){
    const vh=window.innerHeight;
    els.forEach(el=>{ el.style.top = Math.min(0, vh-el.offsetHeight)+'px'; });
  }
  function shade(){
    const vh=window.innerHeight;
    for(let i=0;i<els.length-1;i++){
      const a=els[i]; if(!a._shade) continue;
      const rn=els[i+1].getBoundingClientRect();
      let op=0;
      if(rn.top<vh && rn.bottom>0){
        const ra=a.getBoundingClientRect();
        const p=Math.max(0,Math.min(1,(ra.bottom-rn.top)/Math.min(a.offsetHeight,vh)));
        op=p*p*0.62;                       // ease-in: dims mostly as the new page takes over
      } else if(rn.bottom<=0) op=0.62;
      if(Math.abs(op-a._op)>0.004){ a._op=op; a._shade.style.opacity=op.toFixed(3); }
    }
  }
  /* a page that is off-screen, or completely covered by the page above it, is not "live":
     its canvas / animation loops idle instead of drawing frames nobody can see */
  function live(){
    const vh=window.innerHeight, rs=els.map(e=>e.getBoundingClientRect());
    els.forEach((e,i)=>{
      const r=rs[i]; let covered=false;
      for(let j=i+1;j<els.length;j++){ const q=rs[j]; if(q.top<=1 && q.bottom>=vh-1){covered=true;break;} }
      e._live = r.bottom>0 && r.top<vh && !covered;
    });
  }
  window.stackLive = el=>{ const s=el&&el.closest&&el.closest('.stack'); return !s || s._live!==false; };
  let liveQueued=false;
  function tickAll(){ shade(); if(!liveQueued){ liveQueued=true; requestAnimationFrame(()=>{liveQueued=false;live();}); } }
  layout(); shade(); live();
  window.addEventListener('resize',()=>{layout();shade();live();},{passive:true});
  window.addEventListener('scroll',tickAll,{passive:true});
  window.addEventListener('load',()=>{layout();shade();});
  if(window.ResizeObserver){ const ro=new ResizeObserver(()=>{layout();shade();}); els.forEach(el=>ro.observe(el)); }
  window._stackEls = els;

  /* ── in-page links: pages are stacked/sticky, so a plain #hash jump can land on the wrong spot.
        Every page gets a zero-height marker at its natural position in the flow; links scroll to that. ── */
  const marks = {};
  els.forEach(el=>{
    if(!el.id) return;
    if(el.id==='workWrap'){ marks.work = document.getElementById('workAnchor'); return; }
    const m=document.createElement('div'); m.style.cssText='height:0;pointer-events:none'; m.setAttribute('aria-hidden','true');
    el.parentNode.insertBefore(m, el); marks[el.id]=m;
  });
  window._marks = marks;
  /* arriving with #hash (e.g. back from a careers page): land exactly on that page, not the sticky element's raw offset */
  function jumpHash(){ const id=location.hash.slice(1); if(id && marks[id]){ window.scrollTo(0, Math.round(marks[id].getBoundingClientRect().top+window.scrollY)); } }
  window.addEventListener('load',()=>{ jumpHash(); setTimeout(jumpHash,350); });
  document.addEventListener('click',e=>{
    const a=e.target.closest && e.target.closest('a[href^="#"]');
    if(!a) return;
    const id=a.getAttribute('href').slice(1);
    const m=marks[id];
    if(!m) return;
    e.preventDefault();
    const top = m.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({top:Math.round(top), behavior:'smooth'});
  });
})();


/* ═══════════════════════════════════════════════════════════
   SMOOTH WHEEL SCROLL — mouse-wheel steps glide to a stop instead of jumping.
   Touch, keyboard, scrollbar and anchor links keep their native behaviour.
═══════════════════════════════════════════════════════════ */
(function(){
  if(window.matchMedia && (matchMedia('(prefers-reduced-motion:reduce)').matches || matchMedia('(pointer:coarse)').matches)) return;
  let target=window.scrollY, cur=target, active=false, last=0, raf=0;
  const maxY=()=>document.documentElement.scrollHeight-window.innerHeight;
  function stop(){ active=false; if(raf) cancelAnimationFrame(raf); raf=0; target=cur=window.scrollY; }
  function loop(now){
    const dt=Math.min(now-last,50); last=now;
    cur += (target-cur)*(1-Math.pow(1-0.13,dt/16.667));
    if(Math.abs(target-cur)<0.5){ cur=target; active=false; raf=0; window.scrollTo(0,cur); return; }
    window.scrollTo(0,cur);
    raf=requestAnimationFrame(loop);
  }
  window.addEventListener('wheel',e=>{
    if(e.ctrlKey||e.defaultPrevented||Math.abs(e.deltaX)>Math.abs(e.deltaY)) return;
    if(document.documentElement.style.overflow==='hidden') return;
    if(e.target.closest && e.target.closest('.pm-panel,.lm-modal,#partnerManager,#logoManager,#navSheet,textarea,input,select')) return;
    e.preventDefault();
    let dy=e.deltaY; if(e.deltaMode===1) dy*=34; else if(e.deltaMode===2) dy*=window.innerHeight;
    if(!active){ target=cur=window.scrollY; }
    target=Math.max(0,Math.min(maxY(),target+dy));
    if(!active){ active=true; last=performance.now(); raf=requestAnimationFrame(loop); }
  },{passive:false});
  window.addEventListener('scroll',()=>{ if(!active){ target=cur=window.scrollY; } },{passive:true});
  ['pointerdown','keydown','touchstart'].forEach(t=>window.addEventListener(t,stop,{capture:true,passive:true}));
  document.addEventListener('click',e=>{ if(e.target.closest && e.target.closest('a[href^="#"]')) stop(); },true);
})();

/* ═══════════════════════════════════════════════════════════
   HERO CARD RING — Grail-style 3D carousel
   10 cards stand on a tilted ring and turn around it. Fronts face outward,
   so the far (upper) half of the ring shows the BACKS. The mouse tilts the
   whole ring and the hovered card pops forward with a Chapter-03 style
   neon edge. Scrolling gathers the ring into one stack.
═══════════════════════════════════════════════════════════ */
(function(){
  const layer = document.getElementById('orbitCardsLayer');
  if(!layer) return;
  const N = partners.length;                     // 10
  const hero = document.getElementById('home');
  const ring = document.createElement('div');
  ring.className = 'orbit-ring';
  layer.appendChild(ring);
  const lerp=(a,b,t)=>a+(b-a)*t, clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
  function hueFromX(nx){ return nx<.5 ? lerp(212,240,nx*2) : lerp(240,272,(nx-.5)*2); }  // same mapping as Chapter 03

  const BACK_SVG = `<svg width="52" height="32" viewBox="0 0 44 28" fill="none"><path d="M22 14C22 14 17 4 10 4C4.477 4 1 8.477 1 14C1 19.523 4.477 24 10 24C17 24 22 14 22 14ZM22 14C22 14 27 24 34 24C39.523 24 43 19.523 43 14C43 8.477 39.523 4 34 4C27 4 22 14 22 14Z" stroke="#0066FF" stroke-width="2.5" stroke-linecap="round"/></svg><div class="back-label">LOOPER</div>`;

  /* ── per-card personality (fixed, so the ring never jitters) ── */
  const cfg = partners.map((p,i)=>({
    yOff : Math.sin(i*2.399+0.6),          // -1..1 height variation
    roll : Math.sin(i*1.713+1.1)*5,        // small z-roll in degrees
    pitch: Math.cos(i*2.157+0.3)*6,        // small x-tilt in degrees
    rad  : 1 + Math.sin(i*3.1+0.4)*0.07,   // radius variation
    hue  : (i*37+210)%360,
    hv   : 0, rx:0, ry:0                   // hover amount + pointer offset (smoothed)
  }));

  const cardEls = partners.map((p,i)=>{
    const wrap = document.createElement('div');
    wrap.className = 'orbit-card';
    const inner = document.createElement('div');
    inner.className = 'orbit-card-inner';

    const front = document.createElement('div');
    front.className = 'orbit-card-front';
    front.style.background = `linear-gradient(160deg,hsl(${BV(cfg[i].hue)} 38% 24%) 0%,hsl(${BV(cfg[i].hue)+12} 45% 9%) 100%)`;
    const photoDiv = document.createElement('div');
    photoDiv.className = 'card-photo';
    const img = document.createElement('img');
    img.style.display = p.photo ? 'block' : 'none';
    if(p.photo) img.src = p.photo;
    img.alt = '';
    img.onerror = () => { img.style.display = 'none'; };   // missing file -> keep the plain card
    photoDiv.appendChild(img);
    front.appendChild(photoDiv);
    const gloss = document.createElement('div'); gloss.className='card-gloss'; front.appendChild(gloss);
    const fShade = document.createElement('div'); fShade.className='card-shade'; front.appendChild(fShade);

    const back = document.createElement('div');
    back.className = 'orbit-card-back';
    back.innerHTML = BACK_SVG;
    const bShade = document.createElement('div'); bShade.className='card-shade'; back.appendChild(bShade);

    inner.appendChild(front); inner.appendChild(back);
    wrap.appendChild(inner);
    ring.appendChild(wrap);
    wrap._inner=inner; wrap._front=front; wrap._back=back; wrap._img=img; wrap._gloss=gloss;
    wrap._fShade=fShade; wrap._bShade=bShade; wrap._hint={style:{}};
    return wrap;
  });

  /* ── geometry (recomputed on resize) ── */
  let W=0,H=0,CW=0,CH=0,R=0;
  function resize(){
    W = layer.offsetWidth || window.innerWidth;
    H = layer.offsetHeight || 750;
    const narrow = W < 700;
    CW = narrow ? Math.max(104, W*0.27) : clamp(W*0.118, 150, 240);
    CH = CW*1.4;
    R  = narrow ? W*0.40 : W*0.32;
    layer.style.setProperty('--cw', CW+'px');
    layer.style.setProperty('--ch', CH+'px');
    layer.style.setProperty('--ringY', (narrow ? 0.62 : 0.53)*H + 'px');
  }
  resize();
  window.addEventListener('resize', resize);

  /* ── pointer ── */
  let mX=-9999, mY=-9999, mNX=0, mNY=0, mIn=false;
  window.addEventListener('mousemove', e=>{
    const r = hero.getBoundingClientRect();
    mX=e.clientX; mY=e.clientY;
    mIn = e.clientY>=r.top && e.clientY<=r.bottom && e.clientY>=0;
    mNX = clamp((e.clientX-r.left)/r.width,0,1);        // 0..1
    mNY = clamp((e.clientY-r.top)/r.height,0,1);
  }, {passive:true});
  document.addEventListener('mouseleave', ()=>{ mIn=false; });

  /* ── state ── */
  let spin = Math.random()*360;          // ring rotation, degrees
  let speed = 1, par = {x:0,y:0}, accent = 28, hovered = -1, frameNo = 0, last = performance.now();
  const SPIN_DEG_PER_S = 8;              // slow, even drift
  let collect = 0;                       // 0 spread … 1 gathered (scroll)
  let topIdx = -1;                       // card that ends on top of the gathered deck (latched when gathering starts)
  const norm = a => ((a%360)+540)%360-180;

  function frame(now){
    const dt = Math.min((now-last)/1000, 0.05); last = now;
    const heroH = hero.offsetHeight || 750;
    const sc = window.scrollY / (heroH*0.42);
    collect = clamp(sc,0,1);
    const ce = ease(collect);
    if(collect < 0.01) topIdx = -1;
    else if(topIdx < 0){                 // the card facing the camera most becomes the top of the deck
      let bA=999; for(let i=0;i<N;i++){ const a=Math.abs(norm(spin+i*360/N)); if(a<bA){bA=a;topIdx=i;} }
    }

    // fully covered by the next page → nothing to draw
    if(window.scrollY > heroH*1.15){ requestAnimationFrame(frame); return; }

    // hit-test every 3rd frame (cheap): which front-facing card is under the pointer?
    if(frameNo++ % 2 === 0){
      let best=-1, bestA=999;
      if(mIn && collect<0.25){
        for(let i=0;i<N;i++){
          const a = Math.abs(norm(spin + i*360/N));
          if(a>70) continue;
          const r = cardEls[i].getBoundingClientRect();
          if(mX>=r.left && mX<=r.right && mY>=r.top && mY<=r.bottom && a<bestA){ best=i; bestA=a; }
        }
      }
      /* sticky hover: the popped card grows, so keep it while the pointer is still near it (no flicker at the edge) */
      if(best<0 && hovered>=0 && mIn && collect<0.25){
        const r=cardEls[hovered].getBoundingClientRect(), m=18;
        if(mX>=r.left-m && mX<=r.right+m && mY>=r.top-m && mY<=r.bottom+m) best=hovered;
      }
      hovered = best;
    }

    // spin eases down while a card is hovered, and while gathering
    const tgtSpeed = (hovered>=0 ? 0.12 : 1) * (1-ce);
    speed = lerp(speed, tgtSpeed, clamp(dt*4,0,1));
    spin += SPIN_DEG_PER_S * speed * dt;                        // degrees per second

    // mouse parallax on the whole ring (smoothed)
    const tx = mIn ? (mNX-.5) : 0, ty = mIn ? (mNY-.5) : 0;
    par.x = lerp(par.x, tx, clamp(dt*3,0,1));
    par.y = lerp(par.y, ty, clamp(dt*3,0,1));
    accent = lerp(accent, hueFromX(mIn?mNX:.5), clamp(dt*3,0,1));

    const tilt = lerp(-13, 0, ce) + par.y*-8;
    ring.style.transform =
      `translateY(${(-ce*115).toFixed(1)}px) rotateX(${(tilt).toFixed(2)}deg) rotateY(${(par.x*14).toFixed(2)}deg) scale(${(1-ce*0.22).toFixed(3)})`;
    layer.style.opacity = (1 - clamp((collect-0.8)/0.2,0,1)).toFixed(3);

    for(let i=0;i<N;i++){
      const el=cardEls[i], c=cfg[i];
      const a = norm(spin + i*360/N);                     // -180..180, 0 = facing the camera
      // gathered deck: one card on top, the rest lined up right behind it (rank k = how far behind)
      const k = topIdx<0 ? 0 : (i-topIdx+N)%N;
      const cei = ease(clamp(collect*1.2 - k*0.025, 0, 1));          // tiny stagger so they tuck in one after another
      const aEff = lerp(a, 0, cei);
      const Reff = lerp(R*c.rad, -k*16, cei);
      const y = lerp(c.yOff*CH*0.16, -k*7, cei);
      const x = 0;
      el.style.transform =
        `rotateY(${aEff.toFixed(2)}deg) translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,${Reff.toFixed(1)}px) rotateZ(${(c.roll*(1-cei)).toFixed(2)}deg) rotateX(${(c.pitch*(1-cei)).toFixed(2)}deg)`;

      // far side slightly dimmer (depth cue); near side fully lit
      const depth = Math.cos(a*Math.PI/180);               // 1 near … -1 far
      const sh = Math.min(0.55, 0.34*(1-(depth+1)/2)*(1-cei) + cei*k*0.045).toFixed(3);   // deck: each card behind is a little darker
      el._fShade.style.opacity = sh; el._bShade.style.opacity = sh;

      // hover — pop forward, turn to face the camera, tilt toward the pointer, neon edge
      c.hv = lerp(c.hv, i===hovered?1:0, clamp(dt*9,0,1));
      if(i===hovered){
        const r = el.getBoundingClientRect();
        c.rx = lerp(c.rx, clamp((mX-(r.left+r.right)/2)/(r.width||1),-.5,.5), clamp(dt*10,0,1));
        c.ry = lerp(c.ry, clamp((mY-(r.top+r.bottom)/2)/(r.height||1),-.5,.5), clamp(dt*10,0,1));
      }
      if(c.hv>0.003){
        const hv=c.hv;
        el._inner.style.transform =
          `translateZ(${(hv*120).toFixed(1)}px) rotateY(${(-aEff*hv*0.85 + c.rx*hv*26).toFixed(2)}deg) rotateX(${(-c.ry*hv*22).toFixed(2)}deg) scale(${(1+hv*0.07).toFixed(3)})`;
        el._front.style.boxShadow =
          `0 0 0 ${(1+hv).toFixed(1)}px hsla(${accent.toFixed(0)},100%,62%,${(hv*0.95).toFixed(2)}),0 0 ${(60*hv).toFixed(0)}px hsla(${accent.toFixed(0)},100%,55%,${(hv*0.55).toFixed(2)}),0 18px 50px rgba(0,0,0,.6)`;
        el._gloss.style.opacity = hv.toFixed(2);
        el._gloss.style.background =
          `radial-gradient(circle at ${((c.rx+.5)*100).toFixed(0)}% ${((c.ry+.5)*100).toFixed(0)}%,hsla(${accent.toFixed(0)},100%,80%,.24),transparent 62%)`;
        el._wasHover = true;
      } else if(el._wasHover){
        el._inner.style.transform=''; el._front.style.boxShadow=''; el._gloss.style.opacity=0; el._wasHover=false;
      }
      el.style.zIndex = i===hovered ? 5 : 1;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* ── back image (one for all cards) ── */
  function applyBack(url){
    cardEls.forEach(w=>{
      const b = w._back; if(!b) return;
      if(url){ b.style.backgroundImage = `url("${url}")`; b.classList.add('has-img'); }
      else { b.style.backgroundImage = ''; b.classList.remove('has-img'); }
    });
  }
  window._setCardBack = function(url){ applyBack(url); };
  if(cardBackUrl) applyBack(cardBackUrl);
  if(LOOPER_CFG.cardBack){                                  // file from js/config.js — used only if it exists
    const probe = new Image();
    probe.onload = () => { cardBackUrl = LOOPER_CFG.cardBack; applyBack(cardBackUrl); window._cardBackFromConfig = true; const pv=document.getElementById('pmBackPrev'); if(pv) pv.style.backgroundImage=`url("${cardBackUrl}")`; };
    probe.src = LOOPER_CFG.cardBack;
  }

  /* ── Expose update function for partner manager ── */
  window._updateCardPhoto = function(index, photoDataUrl){
    const wrap = cardEls[index];
    if(!wrap) return;
    wrap._img.src = photoDataUrl;
    wrap._img.style.display = 'block';
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
        fileToDataUrl(file, 700, url => {
          partners[i].photo = url;
          savePartners(partners);
          if(window._updateCardPhoto) window._updateCardPhoto(i, url);
          buildManager(); // refresh UI
        });
      });
      card.appendChild(input);
      grid.appendChild(card);
    });
  }
  buildManager();

  /* back-of-card upload */
  const bIn = document.getElementById('pmBackInput'), bPrev = document.getElementById('pmBackPrev'), bReset = document.getElementById('pmBackReset');
  function showBackPrev(){
    if(!bPrev) return;
    bPrev.style.backgroundImage = cardBackUrl ? `url("${cardBackUrl}")` : '';
    bPrev.innerHTML = cardBackUrl ? '' : '<svg width="40" height="25" viewBox="0 0 44 28" fill="none"><path d="M22 14C22 14 17 4 10 4C4.477 4 1 8.477 1 14C1 19.523 4.477 24 10 24C17 24 22 14 22 14ZM22 14C22 14 27 24 34 24C39.523 24 43 19.523 43 14C43 8.477 39.523 4 34 4C27 4 22 14 22 14Z" stroke="#0066FF" stroke-width="2.5" stroke-linecap="round"/></svg>';
  }
  showBackPrev();
  if(bIn) bIn.addEventListener('change', e => {
    const f = e.target.files[0]; if(!f) return;
    fileToDataUrl(f, 900, url => {
      cardBackUrl = url;
      try{ localStorage.setItem('looper_card_back', url); }catch(err){}
      if(window._setCardBack) window._setCardBack(url);
      showBackPrev();
    });
  });
  if(bReset) bReset.addEventListener('click', () => {
    cardBackUrl = '';
    try{ localStorage.removeItem('looper_card_back'); }catch(err){}
    if(window._setCardBack) window._setCardBack('');
    showBackPrev();
  });

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

/* Chapter corners — each label shows while its own section is on screen */
(function(){
  const ioC=new IntersectionObserver(entries=>{
    entries.forEach(e=>{ e.target.querySelectorAll('.chapter-label,.chapter-label-left').forEach(el=>el.classList.toggle('vis',e.isIntersecting)); });
  },{threshold:0.15});
  document.querySelectorAll('.chapter-label').forEach(l=>{
    const host=l.closest('.photo-section,.partners-section,.brand-section,.team-section,.careers-section,.cta-section,.statement-section,.services-section,.work-wrap')||l.parentElement;
    if(host && !host._chapObs){ host._chapObs=1; ioC.observe(host); }
  });
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
    const iw=hoverImg.offsetWidth, ih=hoverImg.offsetHeight, pad=12;
    const px=Math.max(pad,Math.min(window.innerWidth-iw-pad, ix-iw/2));
    const py=Math.max(pad,Math.min(window.innerHeight-ih-pad, iy-ih/2));
    hoverImg.style.transform = 'translate3d('+px+'px,'+py+'px,0)';
    iraf = requestAnimationFrame(itick);
  }
  rows.forEach((row,i)=>{
    const src = (LOOPER_CFG.services||[])[i];
    if(!src) return;
    const probe = new Image();
    probe.onload = ()=>{ imgOk[i] = src; row.dataset.hasImg = '1';
      const t=document.createElement('img'); t.className='svc-thumb'; t.alt=''; t.loading='lazy'; t.src=src; row.appendChild(t); };
    probe.onerror = ()=>{ /* file missing: fall back to the icon cursor */ };
    probe.src = src;
  });
  rows.forEach((row,i)=>{
    row.addEventListener('mouseenter',(ev)=>{
      if(imgOk[i]){
        hoverImg.src = imgOk[i];
        if(ev && ev.clientX!=null){ mx = ev.clientX; my = ev.clientY; }
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
      rg.addColorStop(0,`hsla(${BV(pal.hue)+i*10},70%,50%,0.55)`);
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
      ctx.strokeStyle=`hsla(${BV(pal.hue)+j*4},80%,65%,0.22)`;
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
PH_PALETTES.forEach((pal,i)=>{ pal.bg=`hsl(${BV(pal.hue)} 45% 6%)`; drawPhCanvas('ph'+(i+1),pal); });

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

/* ═══════════════════════════════════════════════════════════
   PARTNERS COLLAGE
   12 logo cards scattered around the headline at three depths.
   Mouse + scroll parallax (deeper = more movement), staggered reveal,
   Chapter-03 style neon hover. Logos come from LOOPER_CONFIG.partners
   (images/partners/01 … 12) or from the "Partner logos" uploader.
═══════════════════════════════════════════════════════════ */
(function(){
  const section = document.getElementById('partners');
  const stage = document.getElementById('ptStage');
  if(!section || !stage) return;

  // caption, x%, y%, width@1440, depth(0 back … 2 front), tilt°
  const DATA = [
    ['#1 Bank in Georgia',                          2,   9,  205, 1, -1.5],
    ['#1 Transportation Company in Georgia',       15.5,15,  195, 0,  1.0],
    ['Most Trusted Insurance Company in Georgia',   2,  40,  225, 2,  1.2],
    ['#2 Private University in Georgia',           16.5,50,  200, 1, -1.0],
    ['#3 Auto Parts Distributor in Georgia',        7,  72,  195, 0,  0.8],
    ['#4 Oil Importer in Georgia',                 70.5, 8,  205, 1,  1.5],
    ['Tbilisi’s hub for dining and work',     84,  17,  195, 0, -1.0],
    ['Trusted leader in International Retail',     71,  39,  225, 2, -1.2],
    ['Highest Ranked Real Estate in Georgia',      84,  50,  200, 1,  1.0],
    ['Top-Ranked Public School in Georgia',        78,  72,  195, 0, -0.8],
    ['#1 Sales and Marketing Consulting',          25,  75,  210, 2,  1.0],
    ['Leading Global Pizza Delivery Brand',        56,  76,  205, 1, -1.0],
  ];
  const BLUR=[1.6,0,0], OP=[.6,.92,1], Z=[1,2,3], PAR=[.5,1,1.6];
  const lerp=(a,b,t)=>a+(b-a)*t, clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

  /* saved uploads (per browser) */
  let saved = {};
  try{ saved = JSON.parse(localStorage.getItem('looper_logos')||'{}') || {}; }catch(e){}

  /* build tiles */
  const tiles = DATA.map((d,i)=>{
    const tile = document.createElement('div');
    tile.className = 'pt-tile';
    tile.style.setProperty('--x', d[1]); tile.style.setProperty('--y', d[2]); tile.style.setProperty('--w', d[3]);
    tile.style.setProperty('--z', Z[d[4]]);
    tile.style.setProperty('--r', d[5]+'deg');
    tile.style.setProperty('--blur', BLUR[d[4]]+'px');
    tile.style.setProperty('--op', OP[d[4]]);
    tile.style.setProperty('--d', (i*0.06).toFixed(2)+'s');
    const card = document.createElement('div'); card.className='pt-card';
    const logo = document.createElement('div'); logo.className='pt-logo';
    const cap  = document.createElement('div'); cap.className='pt-cap'; cap.textContent = d[0];
    card.appendChild(logo); card.appendChild(cap); tile.appendChild(card); stage.appendChild(tile);
    tile._logo = logo; tile._depth = d[4]; tile._i = i;
    setLogo(tile, null);
    return tile;
  });

  function setLogo(tile, url){
    tile._logo.innerHTML = '';
    if(url){
      const im = new Image(); im.alt = DATA[tile._i][0]; im.decoding='async';
      im.onerror = () => setLogo(tile,null);
      im.src = url; tile._logo.appendChild(im);
    } else {
      const ph = document.createElement('span'); ph.className='pt-ph'; ph.textContent = 'Logo '+String(tile._i+1).padStart(2,'0');
      tile._logo.appendChild(ph);
    }
  }
  window._setPartnerLogo = (i,url)=>{ if(tiles[i]) setLogo(tiles[i],url); };

  /* logo source: browser upload first, then files from js/config.js (path with or without extension) */
  tiles.forEach((t,i)=>{ if(saved[i]) setLogo(t,saved[i]); });
  const EXTS = ['png','svg','jpg','jpeg','webp'];
  function probe(base, done){
    const list = /\.[a-z0-9]{2,4}$/i.test(base) ? [base] : EXTS.map(e=>base+'.'+e);
    (function next(k){
      if(k>=list.length) return done(null);
      const im = new Image(); im.onload=()=>done(list[k]); im.onerror=()=>next(k+1); im.src=list[k];
    })(0);
  }
  const cfgLogos = (window.LOOPER_CONFIG && window.LOOPER_CONFIG.partners) || [];
  cfgLogos.slice(0,DATA.length).forEach((base,i)=>{ if(base) probe(base, url=>{ if(url){ tiles[i]._cfg = url; setLogo(tiles[i],url); } }); });

  /* reveal */
  const io = new IntersectionObserver(es=>{ es.forEach(e=>{ section.classList.toggle('pt-section-in', e.isIntersecting || section.classList.contains('pt-section-in')); }); },{threshold:.2});
  io.observe(section);

  /* parallax + accent hue (same mouse→hue map as Chapter 03) */
  let mx=0,my=0,tmx=0,tmy=0,vis=false,raf=0, hue=212;
  new IntersectionObserver(es=>{ vis = es[0].isIntersecting; if(vis && !raf) raf=requestAnimationFrame(loop); },{threshold:0}).observe(section);
  section.addEventListener('mousemove',e=>{
    const r=section.getBoundingClientRect();
    tmx=(e.clientX-r.left)/r.width-.5; tmy=(e.clientY-r.top)/r.height-.5;
  },{passive:true});
  section.addEventListener('mouseleave',()=>{tmx=0;tmy=0;});
  const narrow = ()=>window.innerWidth<=820;
  function loop(){
    raf=0; if(!vis) return;
    if(window.stackLive && !window.stackLive(section)){ raf=requestAnimationFrame(loop); return; }
    mx=lerp(mx,tmx,.07); my=lerp(my,tmy,.07);
    const r=section.getBoundingClientRect(), vh=window.innerHeight;
    const t=clamp((r.top+r.height/2-vh/2)/vh,-1.2,1.2);
    const nx=clamp(mx+.5,0,1);
    hue=lerp(hue, nx<.5?lerp(212,240,nx*2):lerp(240,272,(nx-.5)*2), .08);
    stage.style.setProperty('--accent', hue.toFixed(0));
    if(!narrow()){
      tiles.forEach(tile=>{
        const f=PAR[tile._depth];
        tile.style.setProperty('--px',(mx*34*f).toFixed(1)+'px');
        tile.style.setProperty('--py',(my*22*f - t*70*f).toFixed(1)+'px');
      });
    }
    raf=requestAnimationFrame(loop);
  }

  /* uploader */
  const openBtn=document.getElementById('ptOpen'), modal=document.getElementById('logoManager'), grid=document.getElementById('lmGrid');
  if(openBtn) openBtn.hidden = !EDIT_MODE;
  function fileToLogo(file, cb){
    if(/svg/.test(file.type)){ const fr=new FileReader(); fr.onload=e=>cb(e.target.result); fr.readAsDataURL(file); return; }
    const fr=new FileReader();
    fr.onload=ev=>{
      const im=new Image();
      im.onload=()=>{
        const k=Math.min(1,520/Math.max(im.width,im.height));
        const c=document.createElement('canvas'); c.width=Math.round(im.width*k); c.height=Math.round(im.height*k);
        c.getContext('2d').drawImage(im,0,0,c.width,c.height);
        cb(c.toDataURL(/jpe?g/.test(file.type)?'image/jpeg':'image/png',0.9));   // keeps transparency for PNG
      };
      im.onerror=()=>cb(ev.target.result); im.src=ev.target.result;
    };
    fr.readAsDataURL(file);
  }
  function buildGrid(){
    grid.innerHTML='';
    DATA.forEach((d,i)=>{
      const lab=document.createElement('label'); lab.className='pm-card';
      const box=document.createElement('div');
      box.style.cssText='width:100%;aspect-ratio:1;background:#0b141b;display:flex;align-items:center;justify-content:center;padding:12px';
      const url = saved[i] || tiles[i]._cfg;
      if(url){ const im=new Image(); im.src=url; im.style.cssText='max-width:100%;max-height:100%;object-fit:contain'; box.appendChild(im); }
      else { box.innerHTML='<span style="font:800 .6rem Syne,sans-serif;color:#555;text-align:center">'+d[0]+'</span>'; }
      lab.appendChild(box);
      const nm=document.createElement('div'); nm.className='pm-card-name'; nm.textContent='Logo '+String(i+1).padStart(2,'0'); lab.appendChild(nm);
      const inp=document.createElement('input'); inp.type='file'; inp.accept='image/*';
      inp.addEventListener('change',e=>{ const f=e.target.files[0]; if(!f) return;
        fileToLogo(f,url=>{ saved[i]=url; try{localStorage.setItem('looper_logos',JSON.stringify(saved));}catch(err){} setLogo(tiles[i],url); buildGrid(); });
      });
      lab.appendChild(inp); grid.appendChild(lab);
    });
  }
  buildGrid();
  if(openBtn) openBtn.addEventListener('click',()=>{ buildGrid(); modal.classList.add('open'); });
  const cl=document.getElementById('lmClose'); if(cl) cl.addEventListener('click',()=>modal.classList.remove('open'));
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
  const hue=BV(p.hue),sat=p.sat;
  const g=ctx.createLinearGradient(0,0,w,h);
  g.addColorStop(0,`hsl(${hue},${sat}%,8%)`);
  g.addColorStop(.45,`hsl(${hue+8},${sat+5}%,14%)`);
  g.addColorStop(1,`hsl(${hue+14},${sat}%,7%)`);
  ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  // radial blobs
  for(let i=0;i<5;i++){
    const rg=ctx.createRadialGradient(w*(0.15+i*0.18),h*(0.2+Math.sin(i*1.9)*0.25),0,w*(0.15+i*0.18),h*(0.2+Math.sin(i*1.9)*0.25),w*0.32);
    rg.addColorStop(0,`hsla(${hue+i*8},80%,55%,${0.09+i*0.015})`);
    rg.addColorStop(1,`hsla(${hue+i*8},80%,55%,0)`);
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
    ctx.strokeStyle=`hsla(${hue+j*4},100%,65%,${0.045+j*0.012})`;
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
// left → azure(212), center → blue(240), right → violet(272)
function mouseXToHue(nx){
  if(nx<0.5) return lerp(212,240,nx*2);
  return lerp(240,272,(nx-0.5)*2);
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
  const hue=hv>0.01?lerpAngle(accentHue,272,hv*0.45):accentHue;
  ctx.save();
  ctx.globalAlpha=alpha*glowAlpha;
  ctx.shadowColor=accentCSS(hue,isCenter?0.9:0.5+hv*0.4);
  ctx.shadowBlur=(isCenter||hv>0.02||scale>0.8)?Math.round((isCenter?32:14)*scale*(1+hv*0.9)):0;   // glow only where it can be seen (it is the costliest canvas call)
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
    t.addEventListener('click',()=>{scrollToIdx(clamp(Math.round(k/TICKS_PER),0,N-1));});
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
  if(window.stackLive && !window.stackLive(document.getElementById('workWrap'))){ t0=ts; requestAnimationFrame(render); return; }
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
/* Chapter 03 is PINNED and driven by the page scroll (like Visual Stories):
   the wrapper is tall, #work sticks, and scroll position = which project is centred.
   The next section can't appear until the last project has been reached —
   wherever the cursor is, because it's plain page scrolling. */
const WRAP=document.getElementById('workWrap'),ANCH=document.getElementById('workAnchor');
function stepPx(){return Math.max(360,Math.min(560,window.innerHeight*0.55));}
function layoutWrap(){ if(WRAP&&SEC) WRAP.style.height=(SEC.offsetHeight+(N-1)*stepPx())+'px'; }
function anchorTop(){ return ANCH.getBoundingClientRect().top+window.scrollY; }
function scrollIdx(){
  if(!ANCH) return;
  const p=clamp((window.scrollY-anchorTop())/((N-1)*stepPx()),0,1);
  idxTarget=Math.round(p*(N-1));
}
function scrollToIdx(k){
  k=clamp(k,0,N-1);
  window.scrollTo({top:anchorTop()+k*stepPx(),behavior:'smooth'});
}
function navigate(dir){ scrollToIdx(idxTarget+dir); }
layoutWrap();scrollIdx();
window.addEventListener('scroll',scrollIdx,{passive:true});
window.addEventListener('resize',()=>{layoutWrap();scrollIdx();},{passive:true});
window.addEventListener('load',()=>{layoutWrap();scrollIdx();});
if(window.ResizeObserver&&SEC){new ResizeObserver(()=>{layoutWrap();scrollIdx();}).observe(SEC);}

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
      if(trail.length>30)trail.shift();
      lastTrailX=nx;lastTrailY=ny;
    }
  }
  mousePX=nx;mousePY=ny;
  inSection=true;
});
SEC&&SEC.addEventListener('mouseleave',()=>{inSection=false;mousePX=mousePY=-9999;});
/* click a side card to bring it to the centre */
canvas.addEventListener('click',()=>{if(hoverI>=0)scrollToIdx(hoverI);});

/* ── Keyboard ── */
document.addEventListener('keydown',e=>{
  if(!SEC)return;
  const r=SEC.getBoundingClientRect();
  if(r.top>window.innerHeight||r.bottom<0)return;
  // pages are stacked: only react while this page is the one actually on screen
  const topEl=document.elementFromPoint(window.innerWidth/2,window.innerHeight/2);
  if(!topEl||!SEC.contains(topEl))return;
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
  let lastT=performance.now();
  function frame(now){
    now=now||performance.now(); const dtS=Math.min((now-lastT)/16.667,3); lastT=now;
    if(window.stackLive && !window.stackLive(canvas)){ requestAnimationFrame(frame); return; }
    ctx.clearRect(0,0,W,H);t+=.004*dtS;
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
  hue=BV(hue);
  const c=document.getElementById(id);if(!c)return;
  const p=c.parentElement;c.width=p.offsetWidth||300;c.height=p.offsetHeight||375;
  const ctx=c.getContext('2d'),w=c.width,h=c.height;
  const gr=ctx.createLinearGradient(0,0,w,h);
  gr.addColorStop(0,`hsl(${hue},40%,17%)`);gr.addColorStop(.5,`hsl(${hue+8},45%,12%)`);gr.addColorStop(1,`hsl(${hue-6},50%,8%)`);
  ctx.fillStyle=gr;ctx.fillRect(0,0,w,h);
  for(let i=0;i<4;i++){const rg=ctx.createRadialGradient(w*(.2+i*.2),h*(.1+i*.22),0,w*(.2+i*.2),h*(.1+i*.22),w*.3);rg.addColorStop(0,`hsla(${hue+i*10},60%,55%,0.18)`);rg.addColorStop(1,`hsla(${hue+i*10},60%,55%,0)`);ctx.fillStyle=rg;ctx.fillRect(0,0,w,h)}
  ctx.strokeStyle=`hsla(${hue},40%,70%,0.08)`;ctx.lineWidth=1;
  for(let x=0;x<w;x+=30){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke()}
  for(let y=0;y<h;y+=30){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}
}
for(let i=1;i<=9;i++) drawPH('ph'+i,phHues[i-1]);

let rt;
window.addEventListener('resize',()=>{
  clearTimeout(rt);rt=setTimeout(()=>{for(let i=1;i<=6;i++) drawVT('vt'+i,i);for(let i=1;i<=9;i++) drawPH('ph'+i,phHues[i-1])},150);
});

/* ═══════════════════════════════════════════════════════════
   CARDS: pointer spotlight (branding + careers), 3D tilt (branding), optional photos
═══════════════════════════════════════════════════════════ */
(function(){
  const fine = window.matchMedia && matchMedia('(hover:hover) and (pointer:fine)').matches && !matchMedia('(prefers-reduced-motion:reduce)').matches;
  document.querySelectorAll('.b-card,.c-card').forEach((c,idx)=>{
    const isB = c.classList.contains('b-card');
    if(fine){
      let raf=0, px=.5, py=.5;
      c.addEventListener('pointermove',e=>{
        const r=c.getBoundingClientRect(); px=(e.clientX-r.left)/r.width; py=(e.clientY-r.top)/r.height;
        if(raf) return;
        raf=requestAnimationFrame(()=>{
          raf=0;
          c.style.setProperty('--mx',(px*100).toFixed(1)+'%'); c.style.setProperty('--my',(py*100).toFixed(1)+'%');
          if(isB){ c.style.setProperty('--ry',((px-.5)*10).toFixed(2)+'deg'); c.style.setProperty('--rx',((.5-py)*8).toFixed(2)+'deg'); c.style.setProperty('--px',(px-.5).toFixed(3)); c.style.setProperty('--py',(py-.5).toFixed(3)); }
        });
      },{passive:true});
      c.addEventListener('pointerleave',()=>{ if(isB){ c.style.setProperty('--rx','0deg'); c.style.setProperty('--ry','0deg'); c.style.setProperty('--px','0'); c.style.setProperty('--py','0'); } });
    }
  });
  /* real brand pictures: js/config.js → branding:[ 'images/branding/01.jpg', … ] (missing files are fine) */
  document.querySelectorAll('.b-card').forEach((c,i)=>{
    const src=(LOOPER_CFG.branding||[])[i]; if(!src) return;
    const im=new Image(); im.alt=''; im.className='b-photo';
    im.onload=()=>{ c.querySelector('.b-vis').prepend(im); c.classList.add('has-photo'); };
    im.src=src;
  });
})();


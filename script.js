/* PHYSICS HEAVY INTERACTIONS

(() => {
  const $ = (s, ctx=document) => ctx.querySelector(s);
  const $$ = (s, ctx=document) => Array.from(ctx.querySelectorAll(s));

  /* ================= THEME ================= */
  const THEME_KEY = 'ya:theme';
  const root = document.documentElement;
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'light') root.classList.add('light');
  const themeBtn = $('#theme-toggle');
  themeBtn?.addEventListener('click', () => {
    const isLight = root.classList.toggle('light');
    localStorage.setItem(THEME_KEY, isLight ? 'light' : 'dark');
    themeBtn.setAttribute('aria-pressed', String(isLight));
  });

  /* ================= NAV ================= */
  const menuBtn = $('#menu-btn');
  const mobileNav = $('#mobile-nav');
  menuBtn?.addEventListener('click', () => {
    const open = menuBtn.getAttribute('aria-expanded') === 'true';
    menuBtn.setAttribute('aria-expanded', String(!open));
    mobileNav.setAttribute('aria-hidden', String(open));
    mobileNav.style.display = open ? 'none' : 'block';
  });
  $$('.mobile-list a').forEach(a => a.addEventListener('click', () => {
    menuBtn.setAttribute('aria-expanded','false');
    mobileNav.setAttribute('aria-hidden','true');
    mobileNav.style.display = 'none';
  }));

  /* ============ Typed headline ============ */
  (function typedGradient(){
    const el = document.querySelector('.gradient-text');
    if(!el) return;
    const text = el.dataset.text || el.textContent || '';
    let i=0;
    el.textContent='';
    function loop(){
      if(i <= text.length){ el.textContent = text.slice(0,i); i++; setTimeout(loop, 22); }
      else { setTimeout(()=>{ i=0; el.textContent=''; setTimeout(loop, 300); }, 1200); }
    }
    loop();
  })();

  /* ============ Reveal on scroll ========== */
  const reveals = $$('.reveal');
  if('IntersectionObserver' in window){
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if(e.isIntersecting){ e.target.classList.add('is-visible'); io.unobserve(e.target); }
      });
    }, {threshold: 0.16});
    reveals.forEach(r=>io.observe(r));
  } else {
    reveals.forEach(r=>r.classList.add('is-visible'));
  }

  /* ======== Hero parallax layers ========= */
  (function parallax(){
    const stack = $$('.layer');
    if(!stack.length) return;
    window.addEventListener('mousemove', e => {
      const cx = innerWidth/2, cy = innerHeight/2;
      const dx = (e.clientX - cx) / cx;
      const dy = (e.clientY - cy) / cy;
      stack.forEach(layer => {
        const depth = parseFloat(layer.dataset.depth || '0.1');
        layer.style.transform = `translate(${dx*depth*20}px, ${dy*depth*12}px)`;
      });
    });
  })();

  /* ======== Magnetic buttons ============= */
  (function magnetic(){
    const mag = $$('.magnetic');
    if(!mag.length) return;
    const strength = 22;
    function move(e){
      const btn = e.currentTarget;
      const r = btn.getBoundingClientRect();
      const mx = (e.clientX - r.left) / r.width;
      const my = (e.clientY - r.top) / r.height;
      const tx = (mx-0.5)*strength;
      const ty = (my-0.5)*strength;
      btn.style.transform = `translate(${tx}px, ${ty}px)`;
    }
    function leave(e){ e.currentTarget.style.transform = '' }
    mag.forEach(b => {
      b.addEventListener('mousemove', move);
      b.addEventListener('mouseleave', leave);
      b.addEventListener('focus', () => b.style.transform = 'translateY(-4px)');
      b.addEventListener('blur', leave);
    });
  })();

  /* ===== Physics background canvas ======= */
  (function bgCanvas() {
    const c = document.getElementById('bg-canvas');
    if(!c) return;
    const ctx = c.getContext('2d');
    let dpr = Math.max(1, window.devicePixelRatio || 1);
    let W, H;
    const N = 140; // particles
    const parts = [];
    const links = [];
    const mouse = {x:0,y:0, down:false};
    function resize(){
      W = c.width = Math.floor(innerWidth * dpr);
      H = c.height = Math.floor(innerHeight * dpr);
      c.style.width = innerWidth + 'px';
      c.style.height = innerHeight + 'px';
    }
    resize();
    addEventListener('resize', resize);
    addEventListener('pointermove', e => { mouse.x = e.clientX * dpr; mouse.y = e.clientY * dpr; });
    addEventListener('pointerdown', () => mouse.down=true);
    addEventListener('pointerup', () => mouse.down=false);

    function rand(a,b){ return a + Math.random()*(b-a) }
    for(let i=0;i<N;i++){
      parts.push({
        x: rand(0,W), y: rand(0,H),
        vx: rand(-0.1,0.1)*dpr, vy: rand(-0.1,0.1)*dpr,
        m: rand(.8,1.8),
        r: rand(1.2,2.4)*dpr,
        charge: Math.random() < 0.5 ? -1 : 1
      });
    }

    function step(){
      ctx.clearRect(0,0,W,H);

      // background soft gradients
      const g = ctx.createRadialGradient(W*0.2,H*0.2,0, W*0.2,H*0.2, Math.max(W,H)*0.8);
      g.addColorStop(0,'rgba(0,231,255,0.06)');
      g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
      const g2 = ctx.createRadialGradient(W*0.8,H*0.8,0, W*0.8,H*0.8, Math.max(W,H)*0.6);
      g2.addColorStop(0,'rgba(255,61,180,0.05)');
      g2.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle = g2; ctx.fillRect(0,0,W,H);

      for(let i=0;i<N;i++){
        const p = parts[i];
        // Pairwise attraction/repulsion (softened)
        for(let j=i+1;j<N;j++){
          const q = parts[j];
          let dx = q.x-p.x, dy = q.y-p.y;
          let dist2 = dx*dx + dy*dy + 0.0001;
          let dist = Math.sqrt(dist2);
          const force = 14 * (p.charge*q.charge) / dist2; // coulomb-ish
          const fx = force * dx;
          const fy = force * dy;
          p.vx += fx / p.m; p.vy += fy / p.m;
          q.vx -= fx / q.m; q.vy -= fy / q.m;

          // link if close
          if(dist < 80*dpr){
            ctx.globalAlpha = 0.02 + (1 - dist/(80*dpr))*0.06;
            ctx.strokeStyle = '#cfe9ff';
            ctx.lineWidth = dpr;
            ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(q.x,q.y); ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }

        // Mouse gravity well (attract on move, stronger if mouse down)
        let mdx = mouse.x - p.x, mdy = mouse.y - p.y;
        const md2 = mdx*mdx + mdy*mdy + 1;
        const mforce = (mouse.down ? 160 : 40) / md2;
        p.vx += mforce * mdx; p.vy += mforce * mdy;

        // Integrate
        p.x += p.vx; p.y += p.vy;

        // Damping
        p.vx *= 0.995; p.vy *= 0.995;

        // Walls with bounce
        if(p.x < 0){ p.x=0; p.vx*=-0.9 }
        if(p.x > W){ p.x=W; p.vx*=-0.9 }
        if(p.y < 0){ p.y=0; p.vy*=-0.9 }
        if(p.y > H){ p.y=H; p.vy*=-0.9 }

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle = 'rgba(0,231,255,0.28)';
        ctx.fill();
      }

      requestAnimationFrame(step);
    }
    step();
  })();

  /* ======== Tilt on cards ================ */
  $$('.tilt').forEach(card => {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      const rx = (py - 0.5) * -8;
      const ry = (px - 0.5) * 10;
      card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(6px)`;
    });
    card.addEventListener('pointerleave', ()=> card.style.transform = '');
    card.addEventListener('focus', ()=> card.style.transform = 'translateY(-6px) scale(1.01)');
    card.addEventListener('blur', ()=> card.style.transform = '');
  });

  /* ======== Project Modal ================ */
  const modal = $('#project-modal');
  const modalTitle = $('#modal-title');
  const modalDesc = $('#modal-desc');
  const modalLive = $('#modal-live');
  const modalCode = $('#modal-code');
  const modalClose = modal?.querySelector('.close');
  let lastFocus = null;

  function openModalFromCard(card){
    lastFocus = document.activeElement;
    modalTitle.textContent = card.dataset.title || 'Project';
    modalDesc.textContent = card.dataset.desc || '';
    modalLive.href = card.dataset.live || '#';
    modalCode.href = card.dataset.code || '#';
    modal.setAttribute('aria-hidden','false');
    modal.style.display = 'grid';
    modalClose?.focus();
    document.addEventListener('keydown', escModal);
  }
  function closeModal(){
    modal.setAttribute('aria-hidden','true');
    modal.style.display = '';
    lastFocus?.focus?.();
    document.removeEventListener('keydown', escModal);
  }
  function escModal(e){ if(e.key === 'Escape') closeModal(); }
  $$('.project .open').forEach(btn => btn.addEventListener('click', e => {
    const card = e.currentTarget.closest('.project');
    openModalFromCard(card);
  }));
  modalClose?.addEventListener('click', closeModal);
  modal?.addEventListener('click', e => { if(e.target === modal) closeModal(); });

  /* ====== Physics settle for grid ======== */
  (function physicsGrid(){
    const grid = $('.physics-grid');
    if(!grid) return;
    const cards = $$('.project', grid);
    const cols = getComputedStyle(grid).gridTemplateColumns.split(' ').length || 3;
    const gap = 16;
    // compute target positions based on grid order
    function layout(){
      const rect = grid.getBoundingClientRect();
      const cardW = (rect.width - gap*(cols-1)) / cols;
      return cards.map((card,i) => {
        const row = Math.floor(i / cols), col = i % cols;
        const x = col * (cardW + gap);
        const y = row * (card.offsetHeight + gap);
        return {card, x, y, vx: (Math.random()-.5)*6, vy: -Math.random()*10, px: x + (Math.random()*rect.width*0.6- rect.width*0.3), py: -200 - Math.random()*200};
      });
    }
    let bodies = layout();
    function animate(){
      const rect = grid.getBoundingClientRect();
      grid.style.height = Math.ceil(bodies.reduce((m,b) => Math.max(m, b.y + 240), 0)) + 'px'; // reserve space

      let done = true;
      bodies.forEach(b => {
        // spring towards target
        const k = 0.06;
        const fx = (b.x - b.px) * k;
        const fy = (b.y - b.py) * k + 0.6; // gravity
        b.vx = (b.vx + fx) * 0.88;
        b.vy = (b.vy + fy) * 0.88;
        b.px += b.vx;
        b.py += b.vy;
        if(Math.abs(b.x - b.px) > 0.3 || Math.abs(b.y - b.py) > 0.3) done = false;
        b.card.style.transform = `translate(${b.px}px, ${b.py}px)`;
        b.card.style.position = 'absolute';
        b.card.style.willChange = 'transform';
      });
      if(!done) requestAnimationFrame(animate);
      else bodies.forEach(b => { b.card.style.transform = ''; b.card.style.position=''; b.card.style.willChange=''; });
    }
    requestAnimationFrame(animate);
    addEventListener('resize', () => { bodies = layout(); requestAnimationFrame(animate); });
  })();

  /* ======= Rings animate when visible ===== */
  (function rings(){
    const rings = $$('.ring');
    if(!rings.length) return;
    const observer = new IntersectionObserver(entries=>{
      entries.forEach(ent=>{
        if(ent.isIntersecting){
          const ring = ent.target;
          const pct = parseInt(ring.dataset.value,10) || 0;
          const circle = ring.querySelector('.bar');
          const offset = 302 - (302 * (pct/100)); // circumf ~302 (r=48)
          circle.style.strokeDashoffset = offset;
          observer.unobserve(ring);
        }
      });
    }, {threshold:0.35});
    rings.forEach(r=>observer.observe(r));
  })();

  /* ======= Odometer counters ============= */
  (function odometers(){
    const els = $$('.odometer');
    if(!els.length) return;
    function build(el, target){
      const digits = String(target).split('').map(n => parseInt(n,10));
      el.innerHTML = '';
      digits.forEach(n => {
        const col = document.createElement('span');
        col.className = 'odo-col';
        const strip = document.createElement('span');
        strip.className = 'odo-strip';
        strip.style.display = 'block';
        strip.style.whiteSpace = 'pre';
        strip.textContent = '\n0\n1\n2\n3\n4\n5\n6\n7\n8\n9';
        col.appendChild(strip);
        el.appendChild(col);
        requestAnimationFrame(()=>{
          strip.style.transition = 'transform 1.2s cubic-bezier(.2,.8,.2,1)';
          strip.style.transform = `translateY(${-n}em)`;
        });
      });
    }
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if(e.isIntersecting){
          const t = parseInt(e.target.dataset.target,10)||0;
          build(e.target, t);
          io.unobserve(e.target);
        }
      })
    }, {threshold:.6});
    els.forEach(el=>io.observe(el));
  })();

  /* ======= Contact burst particles ======= */
  (function contactBurst(){
    const form = $('#contact-form');
    const status = $('#form-status');
    const layer = $('#burst-layer');
    const successModal = $('#success-modal');
    const successClose = successModal?.querySelector('.close');
    if(!form || !layer) return;

    form.addEventListener('submit', e => {
      e.preventDefault();
      const fd = new FormData(form);
      const name = (fd.get('name')||'').toString().trim();
      const email = (fd.get('email')||'').toString().trim();
      const msg = (fd.get('message')||'').toString().trim();
      if(name.length < 2){ status.textContent = 'Please enter your name (2+ chars).'; return; }
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ status.textContent = 'Please enter a valid email.'; return; }
      if(msg.length < 10){ status.textContent = 'Message must be at least 10 characters.'; return; }
      status.textContent = '';
      burst(layer);
      form.reset();
      successModal.setAttribute('aria-hidden','false');
      successModal.style.display = 'grid';
      successClose?.focus();
    });
    successClose?.addEventListener('click', ()=> {
      successModal.setAttribute('aria-hidden','true');
      successModal.style.display = '';
    });

    function burst(container){
      const N = 50;
      const rect = container.getBoundingClientRect();
      for(let i=0;i<N;i++){
        const s = document.createElement('span');
        s.style.position='absolute';
        s.style.left = (rect.width/2) + 'px';
        s.style.top = (rect.height/2) + 'px';
        s.style.width = s.style.height = (Math.random()*6+2)+'px';
        s.style.borderRadius='50%';
        s.style.background = Math.random() < 0.5 ? '#00e7ff' : '#ff3db4';
        container.appendChild(s);
        const ang = Math.random()*Math.PI*2;
        const v = Math.random()*6+2;
        const dx = Math.cos(ang)*v, dy = Math.sin(ang)*v;
        let x=0,y=0, life=0;
        function anim(){
          life+=1;
          x+=dx; y+=dy; dy+=0.15; // gravity
          s.style.transform = `translate(${x}px, ${y}px)`;
          s.style.opacity = String(1 - life/60);
          if(life<60) requestAnimationFrame(anim);
          else s.remove();
        }
        requestAnimationFrame(anim);
      }
    }
  })();

  /* ======== Konami zero-g (EXPIREMENTAL) =============== */
  (function konami(){
    const code = [38,38,40,40,37,39,37,39,66,65];
    const buf = [];
    addEventListener('keydown', e => {
      buf.push(e.keyCode); if(buf.length>code.length) buf.shift();
      if(code.every((v,i)=>v===buf[i])){
        document.body.classList.toggle('zero-g');
      }
    });
  })();

  /* ======= Set year + reduced motion ===== */
  const year = new Date().getFullYear();
  $('#year') && ($('#year').textContent = year);
  if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    document.querySelectorAll('*').forEach(n => n.style.transitionDuration = '0s');
    const slot = document.querySelector('.slot'); if(slot) slot.style.animation = 'none';
  }
})();

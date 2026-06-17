/* ═══════════════════════════════════════════
   GALAXY PORTFOLIO — script.js
   Features: Loader · Cursor · WebGL Aurora
            · Stars · Nav · Typewriter
            · Reveal · Counters · Project Filter
            · Contact Form · Active Nav
            · Back-to-top · VanillaTilt · GSAP
            · ProfileCard Tilt · Logo Loop
═══════════════════════════════════════════ */

/* ── LOADER ────────────────────────────────── */
(function initLoader() {
  const loader = document.getElementById('loader');
  const fill   = document.getElementById('loaderFill');
  if (!loader) return;

  let pct = 0;
  const iv = setInterval(() => {
    pct += Math.random() * 18;
    if (pct > 95) pct = 95;
    fill.style.width = pct + '%';
  }, 120);

  window.addEventListener('load', () => {
    clearInterval(iv);
    fill.style.width = '100%';
    setTimeout(() => loader.classList.add('out'), 400);
  });

  // Fallback if load event never fires
  setTimeout(() => {
    fill.style.width = '100%';
    setTimeout(() => loader.classList.add('out'), 400);
  }, 3000);
})();

/* ── CUSTOM CURSOR ─────────────────────────── */
(function initCursor() {
  const dot  = document.getElementById('c-dot');
  const ring = document.getElementById('c-ring');
  if (!dot || !ring) return;
  if (!window.matchMedia('(hover: hover)').matches) return;

  let mx = -100, my = -100;
  let rx = -100, ry = -100;

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.left = mx + 'px';
    dot.style.top  = my + 'px';
  });

  (function lerp() {
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(lerp);
  })();

  document.querySelectorAll('a,button,.filter-btn,.social-chip').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });

  document.addEventListener('mousedown', () => document.body.classList.add('cursor-click'));
  document.addEventListener('mouseup',   () => document.body.classList.remove('cursor-click'));
})();

/* ── WEBGL AURORA (SoftAurora shader) ─────── */
(function initAurora() {
  const canvas = document.getElementById('aurora-canvas');
  if (!canvas) return;

  // On mobile: skip WebGL entirely — CSS gradient handles the look
  if (window.matchMedia('(max-width:768px)').matches) return;

  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false })
          || canvas.getContext('experimental-webgl', { alpha: true, premultipliedAlpha: false });
  if (!gl) return;

  const VERT = `
    attribute vec2 aPos;
    void main(){ gl_Position = vec4(aPos,0.0,1.0); }
  `;

  const FRAG = `
    precision highp float;
    uniform float uTime;
    uniform vec3  uRes;
    uniform float uSpeed;
    uniform float uScale;
    uniform float uBrightness;
    uniform vec3  uColor1;
    uniform vec3  uColor2;
    uniform float uNoiseFreq;
    uniform float uNoiseAmp;
    uniform float uBandHeight;
    uniform float uBandSpread;
    uniform float uOctaveDecay;
    uniform float uLayerOffset;
    uniform float uColorSpeed;
    uniform vec2  uMouse;
    uniform float uMouseInfluence;

    #define TAU 6.28318

    vec3 gradHash(vec3 p){
      p=vec3(dot(p,vec3(127.1,311.7,234.6)),dot(p,vec3(269.5,183.3,198.3)),dot(p,vec3(169.5,283.3,156.9)));
      vec3 h=fract(sin(p)*43758.5453123);
      float phi=acos(2.0*h.x-1.0),theta=TAU*h.y;
      return vec3(cos(theta)*sin(phi),sin(theta)*cos(phi),cos(phi));
    }

    float qSmooth(float t){ float t2=t*t,t3=t*t2; return 6.0*t3*t2-15.0*t2*t2+10.0*t3; }

    vec3 cosPal(float t,vec3 a,vec3 b,vec3 c,vec3 d){ return a+b*cos(TAU*(c*t+d)); }

    float perlin3D(float amp,float freq,float px,float py,float pz){
      float x=px*freq,y=py*freq;
      float fx=floor(x),fy=floor(y),fz=floor(pz);
      float cx=ceil(x),cy=ceil(y),cz=ceil(pz);
      vec3 g000=gradHash(vec3(fx,fy,fz)),g100=gradHash(vec3(cx,fy,fz));
      vec3 g010=gradHash(vec3(fx,cy,fz)),g110=gradHash(vec3(cx,cy,fz));
      vec3 g001=gradHash(vec3(fx,fy,cz)),g101=gradHash(vec3(cx,fy,cz));
      vec3 g011=gradHash(vec3(fx,cy,cz)),g111=gradHash(vec3(cx,cy,cz));
      float d000=dot(g000,vec3(x-fx,y-fy,pz-fz)),d100=dot(g100,vec3(x-cx,y-fy,pz-fz));
      float d010=dot(g010,vec3(x-fx,y-cy,pz-fz)),d110=dot(g110,vec3(x-cx,y-cy,pz-fz));
      float d001=dot(g001,vec3(x-fx,y-fy,pz-cz)),d101=dot(g101,vec3(x-cx,y-fy,pz-cz));
      float d011=dot(g011,vec3(x-fx,y-cy,pz-cz)),d111=dot(g111,vec3(x-cx,y-cy,pz-cz));
      float sx=qSmooth(x-fx),sy=qSmooth(y-fy),sz=qSmooth(pz-fz);
      float lx00=mix(d000,d100,sx),lx10=mix(d010,d110,sx);
      float lx01=mix(d001,d101,sx),lx11=mix(d011,d111,sx);
      return amp*mix(mix(lx00,lx10,sy),mix(lx01,lx11,sy),sz);
    }

    float auroraGlow(float t,vec2 shift){
      vec2 uv=gl_FragCoord.xy/uRes.y+shift;
      float noiseVal=0.0,freq=uNoiseFreq,amp=uNoiseAmp;
      vec2 sp=uv*uScale;
      for(float i=0.0;i<3.0;i+=1.0){
        noiseVal+=perlin3D(amp,freq,sp.x,sp.y,t);
        amp*=uOctaveDecay; freq*=2.0;
      }
      float yBand=uv.y*10.0-uBandHeight*10.0;
      return 0.3*max(exp(uBandSpread*(1.0-1.1*abs(noiseVal+yBand))),0.0);
    }

    void main(){
      vec2 uv=gl_FragCoord.xy/uRes.xy;
      float t=uSpeed*0.4*uTime;
      vec2 shift=(uMouse-0.5)*uMouseInfluence;
      vec3 col=vec3(0.0);
      col+=0.99*auroraGlow(t,shift)*cosPal(uv.x+uTime*uSpeed*0.2*uColorSpeed,vec3(0.5),vec3(0.5),vec3(1.0),vec3(0.3,0.20,0.20))*uColor1;
      col+=0.99*auroraGlow(t+uLayerOffset,shift)*cosPal(uv.x+uTime*uSpeed*0.1*uColorSpeed,vec3(0.5),vec3(0.5),vec3(2.0,1.0,0.0),vec3(0.5,0.20,0.25))*uColor2;
      col*=uBrightness;
      float alpha=clamp(length(col),0.0,1.0);
      gl_FragColor=vec4(col,alpha);
    }
  `;

  function mkShader(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; }
    return s;
  }

  const prog = gl.createProgram();
  const vs = mkShader(gl.VERTEX_SHADER,   VERT);
  const fs = mkShader(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return;
  gl.attachShader(prog, vs); gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.warn(gl.getProgramInfoLog(prog)); return; }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const U = {
    time:     gl.getUniformLocation(prog,'uTime'),
    res:      gl.getUniformLocation(prog,'uRes'),
    speed:    gl.getUniformLocation(prog,'uSpeed'),
    scale:    gl.getUniformLocation(prog,'uScale'),
    bright:   gl.getUniformLocation(prog,'uBrightness'),
    c1:       gl.getUniformLocation(prog,'uColor1'),
    c2:       gl.getUniformLocation(prog,'uColor2'),
    nFreq:    gl.getUniformLocation(prog,'uNoiseFreq'),
    nAmp:     gl.getUniformLocation(prog,'uNoiseAmp'),
    bHeight:  gl.getUniformLocation(prog,'uBandHeight'),
    bSpread:  gl.getUniformLocation(prog,'uBandSpread'),
    oDecay:   gl.getUniformLocation(prog,'uOctaveDecay'),
    lOffset:  gl.getUniformLocation(prog,'uLayerOffset'),
    cSpeed:   gl.getUniformLocation(prog,'uColorSpeed'),
    mouse:    gl.getUniformLocation(prog,'uMouse'),
    mInfl:    gl.getUniformLocation(prog,'uMouseInfluence'),
  };

  function hex3(h) {
    h = h.replace('#','');
    return [parseInt(h.slice(0,2),16)/255, parseInt(h.slice(2,4),16)/255, parseInt(h.slice(4,6),16)/255];
  }

  // Aurora settings — subtle galaxy theme
  gl.uniform1f(U.speed,   1.3);
  gl.uniform1f(U.scale,   2.2);
  gl.uniform1f(U.bright,  0.88);
  gl.uniform3fv(U.c1,     hex3('#31daf3'));
  gl.uniform3fv(U.c2,     hex3('#c77dff'));
  gl.uniform1f(U.nFreq,   2.5);
  gl.uniform1f(U.nAmp,    0.9);
  gl.uniform1f(U.bHeight, 0.62);
  gl.uniform1f(U.bSpread, 1.4);
  gl.uniform1f(U.oDecay,  0.45);
  gl.uniform1f(U.lOffset, 1.5);
  gl.uniform1f(U.cSpeed,  0.8);
  gl.uniform1f(U.mInfl,   0.18);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  let mouse = [0.5, 0.5], tMouse = [0.5, 0.5];
  window.addEventListener('mousemove', e => {
    tMouse = [e.clientX / window.innerWidth, 1 - e.clientY / window.innerHeight];
  });

  const isMobile = window.matchMedia('(max-width:768px)').matches;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1 : 2);
    const w = window.innerWidth, h = window.innerHeight;
    canvas.width  = w * dpr; canvas.height = h * dpr;
    canvas.style.width  = w + 'px'; canvas.style.height = h + 'px';
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform3f(U.res, canvas.width, canvas.height, canvas.width / canvas.height);
  }
  window.addEventListener('resize', resize); resize();

  const AURORA_INTERVAL = isMobile ? 1000 / 30 : 0;
  let t0 = null, lastAuroraFrame = 0;
  function render(ts) {
    requestAnimationFrame(render);
    if (isMobile && ts - lastAuroraFrame < AURORA_INTERVAL) return;
    lastAuroraFrame = ts;
    if (!t0) t0 = ts;
    const t = (ts - t0) * 0.001;
    mouse[0] += 0.05 * (tMouse[0] - mouse[0]);
    mouse[1] += 0.05 * (tMouse[1] - mouse[1]);
    gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(U.time, t);
    gl.uniform2f(U.mouse, mouse[0], mouse[1]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  requestAnimationFrame(render);
})();

/* ── STARS + SHOOTING STARS ────────────────── */
(function initGalaxy() {
  const canvas = document.getElementById('galaxy-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const isMobile = window.matchMedia('(max-width:768px)').matches;
  const GALAXY_INTERVAL = isMobile ? 1000 / 30 : 0;

  const COLORS = [
    '#ffffff','#e0e8ff','#c8d4ff',
    '#00e5ff','#7fecff','#a5f3fc',
    '#c77dff','#9b5de5','#e0aaff',
    '#ff9df7','#ffe29a',
  ];

  let stars = [], shooters = [], W, H, dpr;

  function rand(a, b) { return Math.random() * (b - a) + a; }

  function buildStars() {
    // Fewer stars on mobile — halve the density
    const density = isMobile ? 10000 : 4000;
    const count = Math.floor(W * H / density);
    stars = Array.from({ length: count }, () => {
      const r = rand(0.25, 2.1);
      return {
        x: rand(0, W), y: rand(0, H),
        r, baseR: r,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        twSpeed: rand(0.4, 2.0),
        twOff:   rand(0, Math.PI * 2),
        vx: rand(-0.012, 0.012),
        vy: rand(-0.012, 0.012),
      };
    });
    shooters = [];
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1 : 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width  = W * dpr; canvas.height = H * dpr;
    canvas.style.width  = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildStars();
  }

  function spawnShooter() {
    shooters.push({
      x: rand(W * 0.1, W * 0.8),
      y: rand(H * 0.02, H * 0.25),
      len: rand(100, 200),
      speed: rand(8, 16),
      angle: Math.PI / 4 + rand(-0.25, 0.25),
      alpha: 1,
      fade: rand(0.012, 0.022),
    });
  }

  // No shooting stars on mobile — canvas gradients are expensive
  if (!isMobile) {
    setInterval(() => {
      if (Math.random() < 0.6) spawnShooter();
    }, 3200);
  }

  function drawStatic() {
    ctx.clearRect(0, 0, W, H);
    for (const s of stars) {
      ctx.save();
      ctx.globalAlpha = 0.65 + s.baseR * 0.15;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = s.color;
      ctx.shadowColor = s.color;
      ctx.shadowBlur = s.r > 1.4 ? 5 : 2;
      ctx.fill();
      ctx.restore();
    }
  }

  let animId, then = performance.now();
  function draw(now) {
    animId = requestAnimationFrame(draw);
    const dt = (now - then) / 1000; then = now;
    const t  = now / 1000;
    ctx.clearRect(0, 0, W, H);

    for (const s of stars) {
      const tw = 0.55 + 0.45 * Math.sin(t * s.twSpeed + s.twOff);
      s.x += s.vx; s.y += s.vy;
      if (s.x < 0) s.x = W; if (s.x > W) s.x = 0;
      if (s.y < 0) s.y = H; if (s.y > H) s.y = 0;
      ctx.save();
      ctx.globalAlpha = tw * (0.55 + s.baseR * 0.2);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * (0.8 + 0.4 * tw), 0, Math.PI * 2);
      ctx.fillStyle = s.color;
      ctx.shadowColor = s.color;
      ctx.shadowBlur  = s.r > 1.4 ? 7 : 2;
      ctx.fill();
      ctx.restore();
    }

    for (let i = shooters.length - 1; i >= 0; i--) {
      const s = shooters[i];
      s.x += Math.cos(s.angle) * s.speed;
      s.y += Math.sin(s.angle) * s.speed;
      s.alpha -= s.fade;
      if (s.alpha <= 0) { shooters.splice(i, 1); continue; }
      const ex = s.x - Math.cos(s.angle) * s.len;
      const ey = s.y - Math.sin(s.angle) * s.len;
      const gr = ctx.createLinearGradient(s.x, s.y, ex, ey);
      gr.addColorStop(0,   `rgba(255,255,255,${s.alpha})`);
      gr.addColorStop(0.2, `rgba(0,229,255,${s.alpha * 0.6})`);
      gr.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.save();
      ctx.strokeStyle = gr;
      ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.restore();
    }
  }

  if (isMobile) {
    resize();
    drawStatic();
    window.addEventListener('resize', () => { resize(); drawStatic(); });
  } else {
    window.addEventListener('resize', () => { cancelAnimationFrame(animId); resize(); draw(performance.now()); });
    resize();
    draw(performance.now());
  }
})();

/* ── NAV ───────────────────────────────────── */
(function initNav() {
  const toggle = document.getElementById('navToggle');
  const links  = document.getElementById('navLinks');
  const navbar = document.getElementById('navbar');

  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open);
  });

  links.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    })
  );

  // Close on outside click
  document.addEventListener('click', e => {
    if (!navbar.contains(e.target)) {
      links.classList.remove('open');
      toggle.classList.remove('open');
    }
  });

  // Scrolled state
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });
})();

/* ── TYPEWRITER ─────────────────────────────── */
(function initTypewriter() {
  const el = document.getElementById('typewriter');
  if (!el) return;
  const phrases = [
    'Vibe Coder 🙂',
    'UI / UX Tinkerer 🎨',
    'Open Source Learner 🌱',
    'Pembangun Mimpi Digital ✨',
  ];
  let pIdx = 0, cIdx = 0, del = false;

  function tick() {
    const ph = phrases[pIdx];
    if (!del) {
      cIdx++;
      el.textContent = ph.slice(0, cIdx);
      if (cIdx === ph.length) { setTimeout(() => { del = true; tick(); }, 2200); return; }
      setTimeout(tick, 75);
    } else {
      cIdx--;
      el.textContent = ph.slice(0, cIdx);
      if (cIdx === 0) {
        del = false; pIdx = (pIdx + 1) % phrases.length;
        setTimeout(tick, 350); return;
      }
      setTimeout(tick, 38);
    }
  }
  setTimeout(tick, 800);
})();

/* ── REVEAL ON SCROLL ──────────────────────── */
(function initReveal() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
})();

/* ── COUNTERS ──────────────────────────────── */
(function initCounters() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.querySelectorAll('.stat-num').forEach(el => {
        const target = +el.dataset.target;
        let cur = 0;
        const step = target / 60;
        const id = setInterval(() => {
          cur += step;
          if (cur >= target) { clearInterval(id); el.textContent = target; return; }
          el.textContent = Math.floor(cur);
        }, 16);
      });
      io.unobserve(e.target);
    });
  }, { threshold: 0.35 });
  document.querySelectorAll('.contrib-card').forEach(c => io.observe(c));
})();

/* ── PROJECT FILTER ────────────────────────── */
(function initFilter() {
  const btns  = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.project-card');

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;

      cards.forEach(card => {
        const match = filter === 'all' || card.dataset.category === filter;
        card.style.opacity = '0';
        card.style.transform = 'scale(0.95)';
        card.style.pointerEvents = 'none';

        setTimeout(() => {
          card.style.display = match ? 'flex' : 'none';
          if (match) {
            requestAnimationFrame(() => {
              card.style.transition = 'opacity 0.35s, transform 0.35s';
              card.style.opacity = '1';
              card.style.transform = 'scale(1)';
              card.style.pointerEvents = '';
            });
          }
        }, 200);
      });
    });
  });
})();

/* ── CONTACT FORM ──────────────────────────── */
(function initForm() {
  const form = document.getElementById('contactForm');
  const note = document.getElementById('formNote');
  if (!form) return;

  const btn = form.querySelector('button[type="submit"]');
  const btnLabel = btn ? btn.textContent : '';

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const name  = form.contactName.value.trim();
    const email = form.contactEmail.value.trim();
    const msg   = form.contactMsg.value.trim();
    if (!name || !email || !msg) { note.textContent = 'Semua kolom wajib diisi.'; return; }

    note.style.color = '';
    note.textContent = 'Mengirim pesan...';
    if (btn) { btn.disabled = true; }

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form),
      });
      const data = await res.json();
      if (data.success) {
        note.style.color = '#34d399';
        note.textContent = '✓ Pesan terkirim! Terima kasih, ' + name + '. Aku akan balas secepatnya.';
        form.reset();
      } else {
        throw new Error(data.message || 'Gagal mengirim');
      }
    } catch (err) {
      note.style.color = '#f87171';
      note.textContent = '✕ Gagal mengirim pesan. Coba lagi, atau email langsung ke erlanggae844@gmail.com';
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = btnLabel; }
      setTimeout(() => { note.textContent = ''; note.style.color = ''; }, 8000);
    }
  });
})();

/* ── ACTIVE NAV ────────────────────────────── */
(function initActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const links    = document.querySelectorAll('.nav-links a');

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        links.forEach(a => a.classList.toggle('nav-active', a.getAttribute('href') === '#' + e.target.id));
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  sections.forEach(s => io.observe(s));
})();

/* ── BACK TO TOP ───────────────────────────── */
(function initBackTop() {
  const btn = document.getElementById('back-top');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('show', window.scrollY > 400);
  }, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();

/* ── VANILLA TILT ──────────────────────────── */
(function initTilt() {
  if (typeof VanillaTilt === 'undefined') return;
  if (!window.matchMedia('(hover:hover)').matches) return;

  VanillaTilt.init(document.querySelectorAll('.project-card'), {
    max: 7, speed: 400, glare: true, 'max-glare': 0.12, gyroscope: false,
  });
  VanillaTilt.init(document.querySelectorAll('.about-card'), {
    max: 5, speed: 400, glare: false, gyroscope: false,
  });
})();


/* ── FOOTER YEAR ───────────────────────────── */
const fy = document.getElementById('footerYear');
if (fy) fy.textContent = new Date().getFullYear();

/* ── GSAP HERO ENTRANCE ────────────────────── */
(function initGSAP() {
  if (typeof gsap === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  // Section headers glide in
  document.querySelectorAll('.section-header').forEach(hdr => {
    gsap.fromTo(hdr,
      { x: -30, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: hdr, start: 'top 85%', once: true } }
    );
  });
})();

/* ── PROFILE CARD TILT ENGINE ──────────────── */
(function initProfileCard() {
  const wrapper = document.getElementById('pcWrapper');
  const shell   = document.getElementById('pcShell');
  const card    = document.getElementById('pcCard');
  if (!wrapper || !shell || !card) return;

  const SMOOTH = 0.08;   // exponential smoothing factor

  let targetX = 0, targetY = 0;
  let currentX = 0, currentY = 0;
  let isHovering = false;
  let rafId = null;

  function setVars(fromLeft, fromTop, fromCenter) {
    const pctX = (fromLeft * 100).toFixed(2) + '%';
    const pctY = (fromTop  * 100).toFixed(2) + '%';
    const bgX  = (fromLeft * 100).toFixed(2) + '%';
    const bgY  = (fromTop  * 100).toFixed(2) + '%';
    const rotX = ((fromLeft - 0.5) * 20).toFixed(2) + 'deg';
    const rotY = ((fromTop  - 0.5) * -20).toFixed(2) + 'deg';

    wrapper.style.setProperty('--pointer-x',          pctX);
    wrapper.style.setProperty('--pointer-y',          pctY);
    wrapper.style.setProperty('--background-x',       bgX);
    wrapper.style.setProperty('--background-y',       bgY);
    wrapper.style.setProperty('--rotate-x',           rotX);
    wrapper.style.setProperty('--rotate-y',           rotY);
    wrapper.style.setProperty('--pointer-from-left',  fromLeft.toFixed(4));
    wrapper.style.setProperty('--pointer-from-top',   fromTop.toFixed(4));
    wrapper.style.setProperty('--pointer-from-center',fromCenter.toFixed(4));
  }

  function animate() {
    if (!isHovering && Math.abs(currentX - 0.5) < 0.001 && Math.abs(currentY - 0.5) < 0.001) {
      rafId = null;
      return;
    }
    currentX += (targetX - currentX) * SMOOTH;
    currentY += (targetY - currentY) * SMOOTH;

    const dx = currentX - 0.5;
    const dy = currentY - 0.5;
    const dist = Math.min(Math.sqrt(dx * dx + dy * dy) * 2, 1);
    setVars(currentX, currentY, dist);

    rafId = requestAnimationFrame(animate);
  }

  function startLoop() {
    if (!rafId) rafId = requestAnimationFrame(animate);
  }

  wrapper.addEventListener('pointerenter', () => {
    isHovering = true;
    shell.classList.add('pc-entering');
    card.classList.add('pc-active');
    wrapper.classList.add('pc-active');
    setTimeout(() => shell.classList.remove('pc-entering'), 200);
  });

  wrapper.addEventListener('pointermove', e => {
    const rect = card.getBoundingClientRect();
    targetX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    targetY = Math.max(0, Math.min(1, (e.clientY - rect.top)  / rect.height));
    startLoop();
  });

  wrapper.addEventListener('pointerleave', () => {
    isHovering = false;
    card.classList.remove('pc-active');
    wrapper.classList.remove('pc-active');
    targetX = 0.5;
    targetY = 0.5;
    startLoop();
  });

  // Touch support
  wrapper.addEventListener('touchmove', e => {
    e.preventDefault();
    const t    = e.touches[0];
    const rect = card.getBoundingClientRect();
    targetX = Math.max(0, Math.min(1, (t.clientX - rect.left) / rect.width));
    targetY = Math.max(0, Math.min(1, (t.clientY - rect.top)  / rect.height));
    startLoop();
  }, { passive: false });

  wrapper.addEventListener('touchend', () => {
    isHovering = false;
    card.classList.remove('pc-active');
    wrapper.classList.remove('pc-active');
    targetX = 0.5;
    targetY = 0.5;
    startLoop();
  });

  // Init at center
  setVars(0.5, 0.5, 0);
})();

/* ── TOOLS LOGO LOOP ───────────────────────── */
(function initLogoLoop() {
  const DEVICON = 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/';

  const row1 = [
    { src: DEVICON + 'react/react-original.svg',              label: 'React'     },
    { src: DEVICON + 'nodejs/nodejs-original.svg',            label: 'Node.js'   },
    { src: DEVICON + 'git/git-original.svg',                  label: 'Git'       },
    { src: DEVICON + 'github/github-original.svg',            label: 'GitHub',   invert: true },
    { src: DEVICON + 'tailwindcss/tailwindcss-original.svg',  label: 'Tailwind'  },
    { src: DEVICON + 'figma/figma-original.svg',              label: 'Figma'     },
  ];
  const row2 = [
    { src: DEVICON + 'vscode/vscode-original.svg',            label: 'VS Code'   },
    { src: DEVICON + 'bootstrap/bootstrap-original.svg',      label: 'Bootstrap' },
    { src: DEVICON + 'flask/flask-original-wordmark.svg',     label: 'Flask',    invert: true },
    { src: DEVICON + 'mysql/mysql-original.svg',              label: 'MySQL'     },
    { src: DEVICON + 'npm/npm-original-wordmark.svg',         label: 'npm'       },
  ];

  function makeItem(tool) {
    const el  = document.createElement('div');
    el.className = 'll-item';
    const img = document.createElement('img');
    img.src       = tool.src;
    img.alt       = tool.label;
    img.loading   = 'lazy';
    img.draggable = false;
    if (tool.invert) img.classList.add('ll-invert');
    const lbl = document.createElement('span');
    lbl.className   = 'll-label';
    lbl.textContent = tool.label;
    el.append(img, lbl);
    return el;
  }

  function createLoop(rootId, trackId, tools, scrollLeft) {
    const root  = document.getElementById(rootId);
    const track = document.getElementById(trackId);
    if (!root || !track) return;

    tools.forEach(t => track.appendChild(makeItem(t)));

    const ITEM_W   = 78 + 12;  // item width + flex gap
    const seqWidth = tools.length * ITEM_W;
    const copies   = Math.ceil((window.innerWidth * 3) / seqWidth) + 2;
    for (let i = 0; i < copies; i++) {
      tools.forEach(t => track.appendChild(makeItem(t)));
    }

    const SPEED  = 55;
    const SMOOTH = 0.18;

    // Right-scroll: start at seqWidth so wrap (→ seqWidth) stays seamless
    let offset    = scrollLeft ? 0 : seqWidth;
    let velocity  = 0;
    let isHovered = false;
    let lastTime  = null;

    root.addEventListener('mouseenter', () => { isHovered = true;  });
    root.addEventListener('mouseleave', () => { isHovered = false; });

    function loop(ts) {
      if (lastTime === null) lastTime = ts;
      const dt = Math.min((ts - lastTime) / 1000, 0.05);
      lastTime = ts;

      const targetV = isHovered ? 0 : SPEED;
      velocity += (targetV - velocity) * (1 - Math.exp(-dt / SMOOTH));

      if (scrollLeft) {
        offset += velocity * dt;
        if (offset >= seqWidth) offset -= seqWidth;
      } else {
        offset -= velocity * dt;
        // Wrap: offset=0 → seqWidth is seamless (copy1 start == copy0 start visually)
        if (offset <= 0) offset += seqWidth;
      }

      track.style.transform = `translate3d(${-offset}px, 0, 0)`;
      requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
  }

  createLoop('llRoot1', 'llTrack1', row1, true);
  createLoop('llRoot2', 'llTrack2', row2, false);
})();

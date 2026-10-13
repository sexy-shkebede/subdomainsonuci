/* app.js: терминал, панели и обои. Сами данные лежат в config.js */
(() => {
  'use strict';

  const S = Object.assign({
    user: 'user', host: 'localhost', name: '', avatar: 'avatar.jpg', theme: 'dusk', github: '',
    fetch: [], about: [], links: [], projects: [], stack: [], music: [],
  }, window.SITE || {});

  /* ── утилиты ──────────────────────────────────────────── */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ESC[c]);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const mq = q => !!(window.matchMedia && window.matchMedia(q).matches);
  const REDUCED = mq('(prefers-reduced-motion: reduce)');
  const COARSE = mq('(pointer: coarse)');
  const T0 = Date.now();
  const two = n => String(n).padStart(2, '0');
  const pad = (s, n) => { s = String(s); return s.length >= n ? s : s + ' '.repeat(n - s.length); };
  const lpad = (s, n) => { s = String(s); return s.length >= n ? s : ' '.repeat(n - s.length) + s; };
  const plural = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');
  const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MO = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* приватный режим */ } },
  };
  const safe = (tag, fn) => { try { return fn(); } catch (e) { console.warn('[' + tag + ']', e); } };
  const safeURL = u => (/^(https?:|mailto:|tg:)/i.test(String(u || '')) ? String(u) : '');
  const link = (url, text) => {
    const u = safeURL(url);
    return u ? `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(text || url)}</a>` : esc(text || url);
  };
  const openURL = url => { const u = safeURL(url); if (u) window.open(u, '_blank', 'noopener'); return !!u; };
  const rgba = (hex, a) => {
    const n = parseInt(String(hex).replace('#', ''), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  };
  const rng = seed => () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  function uptime(ms) {
    const s = Math.max(0, Math.floor(ms / 1000));
    if (s < 60) return plural(s, 'sec');
    const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
    return [d && plural(d, 'day'), h && plural(h, 'hour'), m && plural(m, 'min')].filter(Boolean).join(', ');
  }
  const hms = ms => { const s = Math.floor(ms / 1000); return `${two(Math.floor(s / 3600))}:${two(Math.floor(s / 60) % 60)}:${two(s % 60)}`; };
  function fmtDate(d, withZone) {
    let z = '';
    if (withZone) {
      try { z = new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' }).formatToParts(d).find(p => p.type === 'timeZoneName').value; } catch (e) { z = ''; }
    }
    return `${WD[d.getDay()]} ${MO[d.getMonth()]} ${lpad(d.getDate(), 2)} ${two(d.getHours())}:${two(d.getMinutes())}:${two(d.getSeconds())}${z ? ' ' + z : ''} ${d.getFullYear()}`;
  }

  /* ── темы ─────────────────────────────────────────────── */
  const THEMES = {
    dusk: {
      scene: 'forest', base: '#0d0918', stars: true,
      sky: ['#0b0820', '#271a4f', '#6a3a7c', '#d8739a'], glow: '#ffb48f', fog: '#8a68b8',
      layers: ['#584083', '#3d2b68', '#281c4b', '#160f30', '#0a0617'], river: '#ffa3c4',
    },
    forest: {
      scene: 'forest', base: '#07141c', stars: false,
      sky: ['#071a27', '#163d50', '#4f6a6b', '#d98a4a'], glow: '#ffb35c', fog: '#4d7f8c',
      layers: ['#3a6473', '#274a57', '#18333f', '#0d1f29', '#050f16'], river: '#ffb469',
    },
    nebula: {
      scene: 'space', base: '#06030c',
      clouds: ['#b5179e', '#7209b7', '#3a0ca3', '#f72585', '#4361ee'], rim: '#ffd1f4', planet: '#0a0512',
    },
  };
  const THEME_NAMES = Object.keys(THEMES);
  const root = document.documentElement;
  const theme = () => (THEMES[root.dataset.theme] ? root.dataset.theme : 'dusk');

  function setTheme(name, save) {
    if (!THEMES[name]) name = 'dusk';
    root.dataset.theme = name;
    if (save) store.set('shkbd-theme', name);
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', THEMES[name].base);
    const lbl = $('#m-theme-name');
    if (lbl) lbl.textContent = name;
    safe('wall', () => Wall.draw(true));
    safe('cava', () => Cava.recolor());
  }
  const cycleTheme = () => setTheme(THEME_NAMES[(THEME_NAMES.indexOf(theme()) + 1) % THEME_NAMES.length], true);

  /* ── обои: рисуются на canvas, без картинок ───────────── */
  const Wall = (() => {
    const cv = $('#wall');
    const ctx = cv ? cv.getContext('2d') : null;
    const BLUR = !!ctx && 'filter' in ctx;
    let key = '', lw = 0, lh = 0, noise = null;

    function draw(force) {
      if (!ctx) return;
      const w = cv.clientWidth || window.innerWidth;
      const h = cv.clientHeight || window.innerHeight;
      const t = theme();
      if (!force && t === key && Math.abs(w - lw) < 2 && Math.abs(h - lh) < 140) return;
      key = t; lw = w; lh = h;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.max(1, Math.round(w * dpr));
      cv.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      blur(0);
      const P = THEMES[t];
      (P.scene === 'space' ? space : forest)(w, h, P, rng(20261013));
      grain(w, h);
    }

    function blur(px) { if (BLUR) ctx.filter = px > 0 ? `blur(${px}px)` : 'none'; }

    function grain(w, h) {
      if (!noise) {
        const c = document.createElement('canvas');
        c.width = c.height = 128;
        const x = c.getContext('2d');
        const d = x.createImageData(128, 128);
        for (let i = 0; i < d.data.length; i += 4) {
          const v = Math.random() * 255;
          d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
          d.data[i + 3] = 255;
        }
        x.putImageData(d, 0, 0);
        noise = ctx.createPattern(c, 'repeat');
      }
      ctx.save();
      ctx.globalAlpha = 0.035;
      ctx.fillStyle = noise;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }

    function stars(w, hMax, R, n, fade) {
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < n; i++) {
        const x = R() * w;
        const y = (fade ? Math.pow(R(), 1.4) : R()) * hMax;
        const r = R() > 0.95 ? 0.9 + R() * 0.8 : 0.3 + R() * 0.55;
        ctx.globalAlpha = (0.25 + R() * 0.7) * (fade ? 1 - (y / hMax) * 0.8 : 1);
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function glowStar(x, y, r, col) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r * 7);
      g.addColorStop(0, rgba(col, 0.9));
      g.addColorStop(0.15, rgba(col, 0.3));
      g.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = g;
      ctx.fillRect(x - r * 7, y - r * 7, r * 14, r * 14);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, r * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // ель: зубчатый силуэт ярусами
    function pine(x, base, ht, wd, R) {
      const n = Math.max(5, Math.round((ht / wd) * 2.6));
      const top = base - ht;
      const tw = Math.max(0.8, wd * 0.06);
      const sp = [];
      for (let i = 0; i < n; i++) {
        const t = (i + 1) / n;
        const s = wd * 0.5 * (0.16 + 0.84 * t);
        sp.push({ y: top + ht * 0.9 * t, r: s * (0.8 + R() * 0.4), l: s * (0.8 + R() * 0.4), d: (ht * 0.9 / n) * (0.35 + R() * 0.3) });
      }
      ctx.beginPath();
      ctx.moveTo(x, top);
      for (let i = 0; i < n; i++) {
        ctx.lineTo(x + sp[i].r, sp[i].y);
        if (i < n - 1) ctx.lineTo(x + sp[i].r * 0.36, sp[i].y - sp[i].d);
      }
      const yl = sp[n - 1].y;
      ctx.lineTo(x + tw, yl);
      ctx.lineTo(x + tw, base + 1);
      ctx.lineTo(x - tw, base + 1);
      ctx.lineTo(x - tw, yl);
      for (let i = n - 1; i >= 0; i--) {
        ctx.lineTo(x - sp[i].l, sp[i].y);
        if (i > 0) ctx.lineTo(x - sp[i - 1].l * 0.36, sp[i - 1].y - sp[i - 1].d);
      }
      ctx.closePath();
      ctx.fill();
    }

    function ridge(w, h, y, amp, col, R) {
      const ph = [R() * 6, R() * 6, R() * 6];
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(-2, h + 2);
      for (let x = -2; x <= w + 10; x += 6) {
        const t = x / w;
        ctx.lineTo(x, y - amp * (0.55 * Math.sin(t * 5.1 + ph[0]) + 0.3 * Math.sin(t * 11.7 + ph[1]) + 0.15 * Math.sin(t * 27 + ph[2]) + 0.6));
      }
      ctx.lineTo(w + 10, h + 2);
      ctx.closePath();
      ctx.fill();
    }

    function fog(w, y0, y1, y2, col, a) {
      const g = ctx.createLinearGradient(0, y0, 0, y2);
      g.addColorStop(0, rgba(col, 0));
      g.addColorStop(clamp((y1 - y0) / (y2 - y0), 0.01, 0.99), rgba(col, a));
      g.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, y0, w, y2 - y0);
    }

    function vignette(w, h) {
      const g = ctx.createRadialGradient(w / 2, h * 0.55, Math.min(w, h) * 0.3, w / 2, h * 0.55, Math.max(w, h) * 0.8);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,0.5)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }

    function forest(w, h, P, R) {
      const hs = Math.min(h, w * 0.9); // в портрете деревья не раздуваются
      let g = ctx.createLinearGradient(0, 0, 0, h * 0.8);
      g.addColorStop(0, P.sky[0]);
      g.addColorStop(0.42, P.sky[1]);
      g.addColorStop(0.76, P.sky[2]);
      g.addColorStop(1, P.sky[3]);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      if (P.stars) stars(w, h * 0.6, R, Math.round((w * h) / 3200), true);

      const gx = w * 0.5, gy = h * 0.67, gr = Math.max(w, h) * 0.6;
      g = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
      g.addColorStop(0, rgba(P.glow, 0.95));
      g.addColorStop(0.1, rgba(P.glow, 0.5));
      g.addColorStop(0.35, rgba(P.glow, 0.12));
      g.addColorStop(1, rgba(P.glow, 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      const top = h * 0.69;
      const river = y => {
        const t = clamp((y - top) / (h - top), 0, 1);
        return { cx: w * 0.5 + Math.sin(t * 3.3 + 0.6) * w * 0.035 * t, hw: w * (0.004 + 0.3 * Math.pow(t, 1.5)) };
      };

      blur(4);
      ridge(w, h, h * 0.655, hs * 0.055, P.layers[0], R);
      blur(0);
      fog(w, h * 0.56, h * 0.66, h * 0.72, P.fog, 0.5);

      const rows = [
        { base: h * 0.69, min: 0.035, max: 0.08, step: 0.009, gap: -1, col: P.layers[1], blur: 2, fog: [0.62, 0.69, 0.74, 0.38] },
        { base: h * 0.765, min: 0.08, max: 0.17, step: 0.02, gap: 0.05, col: P.layers[2], blur: 1, fog: [0.66, 0.765, 0.82, 0.22] },
        { base: h * 0.9, min: 0.2, max: 0.4, step: 0.045, gap: 0.12, col: P.layers[3], blur: 0, fog: [0.75, 0.9, 0.96, 0.1] },
      ];
      for (const r of rows) bank(w, h, r.base, river, r.col);
      waterway(w, h, top, river, P, R);
      for (const r of rows) {
        blur(r.blur);
        ctx.fillStyle = r.col;
        let x = -w * 0.04;
        while (x < w * 1.04) {
          const ht = hs * (r.min + R() * (r.max - r.min));
          const wd = ht * (0.3 + R() * 0.14);
          const rv = river(r.base);
          const skip = r.gap >= 0 && Math.abs(x - rv.cx) < rv.hw + r.gap * w + wd * 0.3;
          if (!skip) pine(x, r.base + R() * hs * 0.01, ht, wd, R);
          x += w * r.step * (0.55 + R() * 0.9) * (hs / h);
        }
        blur(0);
        fog(w, h * r.fog[0], h * r.fog[1], h * r.fog[2], P.fog, r.fog[3]);
      }
      // большие ели по краям, как на первом скрине
      ctx.fillStyle = P.layers[4];
      for (const [x0, x1] of [[-0.05, 0.11], [0.89, 1.05]]) {
        let x = w * x0;
        while (x < w * x1) {
          const ht = hs * (0.85 + R() * 0.35);
          pine(x, h * 1.02, ht, ht * (0.3 + R() * 0.08), R);
          x += w * (0.035 + R() * 0.04);
        }
      }
      vignette(w, h);
    }

    function bank(w, h, y0, river, col) {
      ctx.fillStyle = col;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(side < 0 ? -2 : w + 2, y0);
        for (let i = 0; i <= 24; i++) {
          const y = y0 + (h + 2 - y0) * (i / 24);
          const r = river(y);
          ctx.lineTo(r.cx + side * r.hw, y);
        }
        ctx.lineTo(side < 0 ? -2 : w + 2, h + 2);
        ctx.closePath();
        ctx.fill();
      }
    }

    function waterway(w, h, top, river, P, R) {
      const N = 32;
      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        const y = top + (h + 2 - top) * (i / N);
        const r = river(y);
        if (i) ctx.lineTo(r.cx - r.hw, y); else ctx.moveTo(r.cx - r.hw, y);
      }
      for (let i = N; i >= 0; i--) {
        const y = top + (h + 2 - top) * (i / N);
        const r = river(y);
        ctx.lineTo(r.cx + r.hw, y);
      }
      ctx.closePath();
      const g = ctx.createLinearGradient(0, top, 0, h);
      g.addColorStop(0, rgba(P.glow, 0.95));
      g.addColorStop(0.35, rgba(P.river, 0.5));
      g.addColorStop(1, rgba(P.layers[3], 0.92));
      ctx.fillStyle = g;
      ctx.fill();
      ctx.save();
      ctx.clip();
      for (let i = 0; i < 80; i++) {
        const y = top + Math.pow(R(), 0.8) * (h - top);
        const r = river(y);
        const len = r.hw * (0.15 + R() * 0.5);
        const x = r.cx + (R() - 0.5) * 2 * (r.hw - len * 0.5);
        ctx.globalAlpha = 0.08 + R() * 0.22 * (1 - (y - top) / (h - top));
        ctx.fillStyle = P.glow;
        ctx.fillRect(x - len / 2, y, len, Math.max(1, (y - top) / (h - top) * 2));
      }
      ctx.restore();
      ctx.globalAlpha = 1;
    }

    function space(w, h, P, R) {
      ctx.fillStyle = P.base;
      ctx.fillRect(0, 0, w, h);
      const m = Math.max(w, h);
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 16; i++) {
        const t = R();
        const x = w * (0.05 + 0.9 * t) + (R() - 0.5) * w * 0.3;
        const y = h * (0.9 - 0.8 * t) + (R() - 0.5) * h * 0.4;
        const r = m * (0.1 + R() * 0.32);
        const col = P.clouds[i % P.clouds.length];
        const a = 0.1 + R() * 0.14;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, rgba(col, a));
        g.addColorStop(0.45, rgba(col, a * 0.4));
        g.addColorStop(1, rgba(col, 0));
        ctx.fillStyle = g;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      }
      ctx.globalCompositeOperation = 'source-over';
      stars(w, h, R, Math.round((w * h) / 2200), false);
      for (let i = 0; i < 8; i++) glowStar(R() * w, R() * h, 0.8 + R() * 1.2, i % 3 ? '#ffffff' : P.rim);

      // планета с подсвеченным краем
      const pr = Math.min(w, h) * 0.26, px = w * 0.43, py = h * 0.57;
      ctx.save();
      ctx.shadowColor = rgba(P.rim, 0.6);
      ctx.shadowBlur = pr * 0.4;
      ctx.fillStyle = P.planet;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.clip();
      let g = ctx.createLinearGradient(px - pr, py - pr, px + pr * 0.3, py + pr * 0.3);
      g.addColorStop(0, rgba(P.rim, 1));
      g.addColorStop(0.5, rgba(P.rim, 0.15));
      g.addColorStop(1, rgba(P.rim, 0));
      ctx.fillStyle = g;
      ctx.fillRect(px - pr, py - pr, pr * 2, pr * 2);
      ctx.fillStyle = P.planet;
      ctx.beginPath();
      ctx.arc(px + pr * 0.04, py + pr * 0.055, pr * 0.995, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      // луна
      const mr = pr * 0.2, mx = px + pr * 1.55, my = py - pr * 0.3;
      g = ctx.createRadialGradient(mx - mr * 0.45, my - mr * 0.45, mr * 0.1, mx, my, mr);
      g.addColorStop(0, '#4a3560');
      g.addColorStop(1, '#0c0812');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(mx, my, mr, 0, Math.PI * 2);
      ctx.fill();
      vignette(w, h);
    }

    return { draw };
  })();

  /* ── ава в ascii (для neofetch) ───────────────────────── */
  // запасной вариант, посчитан заранее из avatar.jpg: нужен, когда браузер не даёт читать пиксели (file://)
  const ART_FALLBACK = {"text": ["                    :/o+:", "                /ohhhhhhhhs/", "             /shhhhhhhhhhhhhho.", "           .yhhhhhhhhhhhhhhhhhh+", "           -hhhdhhhhdhhhhhhhhhhh:", "           ohhhdhhhhdhdhhhhhhhhho", "          .shhhhhdhdhhddhddhdhhh+-", "         ./ydhhddsdyhhohooyhdddho .", "         ./sddhdd+yshh:o/oyohhyh//.", "         ../hdhdo+sods-:.-.shssoo.", "           ./+yhh+..++....ooyoo/ .", "             ..-hho........sdy.", "               -/odo-.....:dso:", "                 ..+.-:...-+/.", "        /yysoooyo-........-.", "       yhhhhhhhhhho/......-..-:.", "      -hhhhhhhhhhhhhs+-....osdddho+:", "      ohhhhhddhhhhhhhhy....hhhhhhhhhhs.", "      hhyhhyhhhyyyhhhs...-shhhhhhhhhhhy.", "     .dhyyhyhhhyyyyyo.../yhhhhhhhdhhhhh+", "     +dhyyyhyddyyyy:...ohhhyyhhhddhhhhhs", "     ydhyyyyyhdhyo....ohhhhhhyyhdhhhhhhh"], "color": ["0000000000000000000031113", "0000000000000000111111111111", "0000000000000111111111111111113", "00000000000311111111111111111111", "000000000003111111111111111111113", "000000000001111111111111111111111", "0000000000311111111111111111111113", "00000000031111111111111111111111103", "00000000031111111111113112211111113", "0000000003311111111111333231111113", "0000000000031111113311333311111103", "0000000000000333111333333331113", "0000000000000003111133333331113", "000000000000000003313333333113", "0000000011111111133333333333", "00000001111111111111333333333333", "000000311111111111111133333111111113", "000000111111111111111113333111111111113", "0000001111111111111111333311111111111113", "0000031111111111111113331111111111111111", "0000011111111111111333311111111111111111", "0000011111111111113333111111111111111111"]};
  let ART = ART_FALLBACK;

  // фон = цвет рамки картинки, заливкой от краёв; остальное переводим в символы по плотности
  function makeArt(img, cols) {
    const K = 2.0; // высота клетки / ширина при line-height 1.2
    const sc = Math.min(1, 700 / Math.max(img.naturalWidth, img.naturalHeight));
    const W = Math.max(1, Math.round(img.naturalWidth * sc));
    const H = Math.max(1, Math.round(img.naturalHeight * sc));
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const cx = cv.getContext('2d', { willReadFrequently: true });
    cx.drawImage(img, 0, 0, W, H);
    const px = cx.getImageData(0, 0, W, H).data; // на file:// тут SecurityError, и остаётся запасной вариант
    const N = W * H;
    const br = [], bgc = [], bb = [];
    const addB = i => { br.push(px[i * 4]); bgc.push(px[i * 4 + 1]); bb.push(px[i * 4 + 2]); };
    for (let x = 0; x < W; x++) { addB(x); addB((H - 1) * W + x); }
    for (let y = 1; y < H - 1; y++) { addB(y * W); addB(y * W + W - 1); }
    const med = a => { a.sort((p, q) => p - q); return a[a.length >> 1]; };
    const rr = med(br), rg = med(bgc), rb = med(bb);
    const bg = new Uint8Array(N);
    const stack = new Int32Array(N);
    let sp = 0;
    const seed = i => {
      if (bg[i]) return;
      const o = i * 4;
      if (Math.max(Math.abs(px[o] - rr), Math.abs(px[o + 1] - rg), Math.abs(px[o + 2] - rb)) <= 6) { bg[i] = 1; stack[sp++] = i; }
    };
    for (let x = 0; x < W; x++) { seed(x); seed((H - 1) * W + x); }
    for (let y = 0; y < H; y++) { seed(y * W); seed(y * W + W - 1); }
    while (sp) {
      const i = stack[--sp], x = i % W;
      if (x > 0) seed(i - 1);
      if (x < W - 1) seed(i + 1);
      if (i >= W) seed(i - W);
      if (i < N - W) seed(i + W);
    }
    const rows = Math.max(1, Math.round((cols * H) / W / K));
    const RAMP = ' .-:/+oosyhd', n = RAMP.length - 1;
    const text = [], color = [];
    for (let cy = 0; cy < rows; cy++) {
      const y0 = Math.floor((cy * H) / rows), y1 = Math.floor(((cy + 1) * H) / rows);
      let t = '', c = '';
      for (let ci = 0; ci < cols; ci++) {
        const x0 = Math.floor((ci * W) / cols), x1 = Math.floor(((ci + 1) * W) / cols);
        let tot = 0, ins = 0, dsum = 0, hot = 0;
        for (let y = y0; y < y1; y++) {
          for (let x = x0; x < x1; x++) {
            const i = y * W + x;
            tot++;
            if (bg[i]) continue;
            ins++;
            const o = i * 4, r = px[o], g = px[o + 1], b = px[o + 2];
            dsum += 1 - (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
            if ((Math.max(r, g, b) - Math.min(r, g, b)) / 255 > 0.1 && b > g + 8 && r > g + 4) hot++;
          }
        }
        const cov = tot ? ins / tot : 0;
        if (cov < 0.1) { t += ' '; c += '0'; continue; }
        const v = Math.pow(clamp((dsum / ins - 0.03) / 0.67, 0, 1), 0.85);
        const idx = Math.max(1, Math.round(v * Math.min(1, cov / 0.85) * n));
        t += RAMP[idx];
        c += hot / ins > 0.12 ? '2' : idx >= 4 ? '1' : '3';
      }
      const end = t.replace(/\s+$/, '').length;
      text.push(t.slice(0, end));
      color.push(c.slice(0, end));
    }
    while (text.length && !text[0]) { text.shift(); color.shift(); }
    while (text.length && !text[text.length - 1]) { text.pop(); color.pop(); }
    return { text, color };
  }

  function loadArt() {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      try {
        const a = makeArt(img, 44);
        if (a && a.text.length > 4) ART = a;
      } catch (e) { /* file:// не даёт читать пиксели, остаётся вшитый ascii */ }
    };
    img.src = S.avatar;
  }

  function artHTML(a) {
    if (!a) return '';
    return a.text.map((ln, y) => {
      const cl = a.color[y] || '';
      let html = '', run = '', rc = null;
      const flush = () => {
        if (!run) return;
        html += rc && rc !== '0' ? `<span class="a${rc}">${esc(run)}</span>` : esc(run);
        run = '';
      };
      for (let x = 0; x < ln.length; x++) {
        const c = ln[x] === ' ' ? '0' : cl[x] || '1';
        if (c !== rc) { flush(); rc = c; }
        run += ln[x];
      }
      flush();
      return html;
    }).join('\n');
  }

  /* ── живой счётчик репо с GitHub ──────────────────────── */
  let REPOS = null;
  function loadRepos() {
    if (!S.github || !window.fetch) return Promise.resolve();
    const ctrl = window.AbortController ? new AbortController() : null;
    const to = setTimeout(() => ctrl && ctrl.abort(), 4000);
    return fetch('https://api.github.com/users/' + encodeURIComponent(S.github), ctrl ? { signal: ctrl.signal } : {})
      .then(r => (r.ok ? r.json() : null))
      .then(j => { if (j && typeof j.public_repos === 'number') REPOS = j.public_repos; })
      .catch(() => {})
      .then(() => clearTimeout(to));
  }

  /* ── файлы: ~/links, ~/projects, about.md… ────────────── */
  const HOME = '/home/' + S.user;
  const AVATAR_BYTES = 48351;
  const MT = new Date(T0 - 5 * 3600 * 1000);
  const MTIME = `${MO[MT.getMonth()]} ${lpad(MT.getDate(), 2)} ${two(MT.getHours())}:${two(MT.getMinutes())}`;

  const FS = (() => {
    const mk = (type, name, extra) => Object.assign({ type, name }, extra || {});
    const zshrc = ['# ~/.zshrc', "alias ff='fastfetch'", "alias nf='neofetch'", "alias ll='ls -l'", "alias la='ls -la'", "alias cls='clear'", '', 'fastfetch'];
    return mk('dir', '~', {
      children: [
        mk('dir', 'links', { children: S.links.map(l => mk('link', String(l.name), { url: l.url, note: l.note || '' })) }),
        mk('dir', 'projects', { children: S.projects.map(p => mk('file', p.name + '.md', { project: p })) }),
        mk('file', 'about.md', { lines: S.about }),
        mk('img', 'avatar.jpg', { src: S.avatar }),
        mk('file', 'stack.txt', { stack: S.stack }),
        mk('file', '.zshrc', { lines: zshrc, hidden: true }),
      ],
    });
  })();

  const pathStr = segs => (segs.length ? '~/' + segs.join('/') : '~');
  const pathAbs = segs => HOME + (segs.length ? '/' + segs.join('/') : '');
  function nodeAt(segs) {
    let n = FS;
    for (const s of segs) {
      n = (n.children || []).find(c => c.name === s);
      if (!n) return null;
    }
    return n;
  }
  // путь -> массив сегментов от ~; null, если выше домашней папки
  function resolvePath(p, base) {
    p = String(p);
    let segs;
    if (p === '~' || p.startsWith('~/')) { segs = []; p = p.slice(1); }
    else if (p === HOME || p.startsWith(HOME + '/')) { segs = []; p = p.slice(HOME.length); }
    else if (p.startsWith('/')) return null;
    else segs = base.slice();
    for (const part of p.split('/')) {
      if (!part || part === '.') continue;
      if (part === '..') { if (!segs.length) return null; segs.pop(); continue; }
      segs.push(part);
    }
    return segs;
  }
  const visibleKids = n => (n.children || []).filter(c => !c.hidden);

  function fileLines(n) {
    if (n.lines) return n.lines.map(String);
    if (n.project) {
      const p = n.project;
      const out = ['# ' + p.name, '', p.desc || ''];
      if (p.tags) out.push('', 'stack: ' + p.tags);
      if (p.url) out.push('link:  ' + p.url);
      return out;
    }
    if (n.stack) return n.stack.map(([k, v]) => pad(k, 9) + v);
    if (n.type === 'link') return [n.name + ' -> ' + n.url];
    return [];
  }
  function fileHTML(n) {
    if (n.type === 'link') return `${esc(n.name)} -> ${link(n.url)}`;
    if (n.project) {
      const p = n.project;
      const out = [`<span class="c-acc b"># ${esc(p.name)}</span>`, '', esc(p.desc || '')];
      if (p.tags) out.push('', `<span class="c-muted">stack:</span> ${esc(p.tags)}`);
      if (p.url) out.push(`<span class="c-muted">link:</span>  ${link(p.url)}`);
      return out.join('\n');
    }
    if (n.stack) return n.stack.map(([k, v]) => `<span class="c-acc">${esc(pad(k, 9))}</span>${esc(v)}`).join('\n');
    return fileLines(n).map(l => (/^#/.test(l) ? `<span class="c-acc b">${esc(l)}</span>` : esc(l))).join('\n');
  }
  const sizeOf = n => n.type === 'dir' ? 4096 : n.type === 'link' ? String(n.url).length : n.type === 'img' ? AVATAR_BYTES : fileLines(n).join('\n').length + 1;
  const permOf = n => (n.type === 'dir' ? 'drwxr-xr-x' : n.type === 'link' ? 'lrwxrwxrwx' : '-rw-r--r--');
  function nameHTML(n, slash) {
    const cls = { dir: 'c-blue b', link: 'c-cyan', img: 'c-acc2' }[n.type];
    const nm = esc(n.name) + (slash && n.type === 'dir' ? '/' : '');
    return cls ? `<span class="${cls}">${nm}</span>` : nm;
  }
  function findByName(name) {
    const q = String(name).toLowerCase().replace(/\/$/, '');
    let hit = null;
    (function walk(n) {
      for (const c of n.children || []) {
        if (hit) return;
        const nm = c.name.toLowerCase();
        if (nm === q || nm.replace(/\.md$/, '') === q) { if (c.type === 'link' || (c.project && c.project.url)) hit = c; }
        if (c.type === 'dir') walk(c);
      }
    })(FS);
    return hit;
  }

  /* ── cava ─────────────────────────────────────────────── */
  const Cava = (() => {
    const cv = $('#cava');
    const ctx = cv ? cv.getContext('2d') : null;
    let n = 24, v = [], playing = false, raf = 0, last = 0, t = 0, shown = true, inView = true, cols = ['#b197ff', '#ff86c0'];

    function recolor() {
      const cs = getComputedStyle(root);
      cols = [cs.getPropertyValue('--accent').trim() || cols[0], cs.getPropertyValue('--accent-2').trim() || cols[1]];
      draw();
    }
    function resize() {
      if (!cv) return;
      const r = cv.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(r.width * dpr);
      cv.height = Math.round(r.height * dpr);
      const nn = clamp(Math.floor(r.width / 12), 8, 72);
      if (nn !== v.length) v = Array.from({ length: nn }, (_, i) => v[i] || 0);
      n = nn;
      draw();
    }
    function step(dt) {
      const beat = (t * 124) / 60;
      const kick = Math.exp(-(beat % 1) * 9);
      const hat = Math.exp(-((beat + 0.5) % 1) * 14);
      const kRise = 1 - Math.exp(-dt * 20);
      for (let i = 0; i < n; i++) {
        const f = n > 1 ? i / (n - 1) : 0;
        let target = 0;
        if (playing) {
          const base = 0.6 * Math.pow(1 - f, 1.25) + 0.14;
          const wob = 0.55 + 0.45 * Math.sin(t * (2.1 + f * 7.3) + i * 1.93) * Math.sin(t * (0.9 + f * 1.7) + i * 0.71);
          target = clamp(base * wob + kick * 0.42 * Math.pow(1 - f, 2.2) + (f > 0.55 ? hat * 0.3 * f : 0) + (Math.random() - 0.5) * 0.05, 0, 1);
        }
        if (target > v[i]) v[i] += (target - v[i]) * kRise;
        else v[i] = Math.max(target, v[i] - dt * 1.3);
      }
      for (let i = 1; i < n - 1; i++) v[i] = Math.max(v[i], (v[i - 1] + v[i + 1]) * 0.36);
    }
    function draw() {
      if (!ctx) return;
      const W = cv.width, H = cv.height;
      ctx.clearRect(0, 0, W, H);
      if (!n || !v.length) return;
      const unit = W / (n + (n - 1) * 0.32);
      const g = ctx.createLinearGradient(0, H, 0, 0);
      g.addColorStop(0, cols[0]);
      g.addColorStop(1, cols[1]);
      ctx.fillStyle = g;
      for (let i = 0; i < n; i++) {
        const bh = Math.round(v[i] * H);
        if (bh < 1) continue;
        const x = Math.round(i * unit * 1.32);
        ctx.fillRect(x, H - bh, Math.max(1, Math.round(unit)), bh);
      }
    }
    function loop(ts) {
      raf = 0;
      const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0.016;
      last = ts;
      t += dt;
      step(dt);
      draw();
      if ((playing || v.some(x => x > 0.002)) && can()) raf = requestAnimationFrame(loop);
      else last = 0;
    }
    const can = () => shown && inView && !document.hidden;
    function ensure() { if (!raf && can()) { last = 0; raf = requestAnimationFrame(loop); } }
    function init() {
      resize();
      recolor();
      if (window.IntersectionObserver && cv) {
        new IntersectionObserver(es => { inView = es[0].isIntersecting; ensure(); }).observe(cv);
      }
      document.addEventListener('visibilitychange', ensure);
    }
    return {
      init, resize, recolor,
      setPlaying(p) { playing = p; ensure(); },
      setShown(s) { shown = s; ensure(); },
    };
  })();

  /* ── музыка в панели ──────────────────────────────────── */
  const Music = (() => {
    const tracks = S.music && S.music.length ? S.music.map(String) : ['silence — nothing.flac'];
    let i = 0, playing = !REDUCED;
    const ICON_PLAY = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.2 12.5 8 5 12.8z" fill="currentColor" stroke="none"/></svg>';
    const ICON_PAUSE = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5.5 3.5v9M10.5 3.5v9" stroke-width="2.2"/></svg>';
    function render() {
      const t = $('#m-track'), b = $('#m-play');
      if (t) t.textContent = tracks[i];
      if (b) {
        b.innerHTML = playing ? ICON_PAUSE : ICON_PLAY;
        b.setAttribute('aria-label', playing ? 'Пауза' : 'Играть');
      }
    }
    function play(on) { playing = !!on; render(); Cava.setPlaying(playing); }
    function step(d) { i = (i + d + tracks.length) % tracks.length; render(); }
    function init() {
      const bind = (id, fn) => { const el = $(id); if (el) el.addEventListener('click', e => { fn(); if (e.detail) el.blur(); }); };
      bind('#m-play', () => play(!playing));
      bind('#m-prev', () => step(-1));
      bind('#m-next', () => step(1));
      render();
      Cava.setPlaying(playing);
    }
    return { init, play, step, track: () => tracks[i], isPlaying: () => playing };
  })();

  /* ── htop ─────────────────────────────────────────────── */
  const Htop = (() => {
    const pre = $('#htop');
    const ncpu = clamp(navigator.hardwareConcurrency || 4, 2, 8);
    const cpu = Array.from({ length: ncpu }, () => 3 + Math.random() * 15);
    const memT = navigator.deviceMemory ? Math.max(2, navigator.deviceMemory) * 0.97 : 15.5;
    let mem = memT * (0.24 + Math.random() * 0.06);
    let tasks = 98 + Math.floor(Math.random() * 20), thr = 540 + Math.floor(Math.random() * 90);
    const load = [0.9, 1.15, 1.05];
    const procs = [
      ['alacritty'], ['zsh'], ['i3'], ['picom'], ['polybar'], ['cava'], ['ranger'], ['htop'],
      ['dockerd', 'root'], ['yt-dlp'], ['cmake --build .'], ['tg-bot'],
    ].map(([cmd, user], k) => ({ pid: 300 + Math.floor(Math.random() * 3600) + k, user: user || S.user, cmd, c: Math.random() * 3, m: 0.2 + Math.random() * 2.2 }));
    let cw = 7.2, lh = 16;

    function measure() {
      if (!pre) return;
      const p = document.createElement('span');
      p.textContent = 'M'.repeat(20);
      p.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;display:inline-block';
      pre.appendChild(p);
      const r = p.getBoundingClientRect();
      if (r.width) cw = r.width / 20;
      if (r.height) lh = r.height;
      p.remove();
    }
    function step() {
      for (let k = 0; k < ncpu; k++) {
        cpu[k] = clamp(cpu[k] + (9 - cpu[k]) * 0.25 + (Math.random() - 0.5) * 12 + (Math.random() < 0.05 ? 40 : 0), 0.3, 100);
      }
      mem = clamp(mem + (Math.random() - 0.5) * 0.03 * memT, memT * 0.18, memT * 0.5);
      tasks = clamp(tasks + Math.round((Math.random() - 0.5) * 3), 90, 140);
      thr = clamp(thr + Math.round((Math.random() - 0.5) * 9), 500, 700);
      const a = avg() / 25;
      load[0] = load[0] * 0.8 + a * 0.2;
      load[1] = load[1] * 0.95 + a * 0.05;
      load[2] = load[2] * 0.99 + a * 0.01;
      for (const p of procs) p.c = clamp(p.c + (Math.random() - 0.5) * 1.6, 0, p.cmd === 'cmake --build .' ? 99 : 14);
    }
    const avg = () => cpu.reduce((s, x) => s + x, 0) / ncpu;

    function meter(label, width, segs, text) {
      const inner = Math.max(4, width - label.length - 2);
      const cells = new Array(inner).fill('');
      let k = 0;
      for (const [f, cls] of segs) {
        let c = Math.round(clamp(f, 0, 1) * inner);
        while (c-- > 0 && k < inner) cells[k++] = cls;
      }
      const t = text.slice(0, inner), start = inner - t.length;
      let html = '', run = '', rc = null;
      const flush = () => { if (run) { html += rc ? `<span class="${rc}">${run}</span>` : run; run = ''; } };
      for (let i = 0; i < inner; i++) {
        let ch, c;
        if (i >= start) { ch = esc(t[i - start]); c = 'h-m'; }
        else if (cells[i]) { ch = '|'; c = cells[i]; }
        else { ch = ' '; c = ''; }
        if (c !== rc) { flush(); rc = c; }
        run += ch;
      }
      flush();
      return `<span class="h-lbl">${esc(label)}</span><span class="h-br">[</span>${html}<span class="h-br">]</span>`;
    }

    function render() {
      if (!pre || !pre.clientWidth || document.hidden) return;
      const cols = Math.max(24, Math.floor(pre.clientWidth / cw));
      const rowsAvail = Math.max(6, Math.floor(pre.clientHeight / lh));
      const twoCol = cols >= 62;
      const mw = twoCol ? Math.floor(cols * 0.54) : cols;
      const lines = [];
      const meters = cpu.map((c, k) => meter(lpad(k + 1, 3), mw, [[(c * 0.72) / 100, 'h-g'], [(c * 0.28) / 100, 'h-r']], c.toFixed(1) + '%'));
      const mf = mem / memT;
      meters.push(meter('Mem', mw, [[mf * 0.8, 'h-g'], [mf * 0.08, 'h-b'], [mf * 0.12, 'h-y']], `${mem.toFixed(2)}G/${memT.toFixed(2)}G`));
      meters.push(meter('Swp', mw, [], `0K/${(memT / 4).toFixed(2)}G`));
      const stats = [
        `<span class="h-lbl">Tasks:</span> <span class="b">${tasks}</span>, <span class="b">${thr}</span> thr; <span class="h-g b">1</span> running`,
        `<span class="h-lbl">Load average:</span> <span class="b">${load[0].toFixed(2)}</span> ${load[1].toFixed(2)} ${load[2].toFixed(2)}`,
        `<span class="h-lbl">Uptime:</span> <span class="b">${hms(Date.now() - T0)}</span>`,
      ];
      if (twoCol) meters.forEach((m, k) => lines.push(m + (stats[k] ? '  ' + stats[k] : '')));
      else lines.push(...meters, ...stats.map(s => ' ' + s));
      const room = rowsAvail - lines.length - 2;
      if (room > 0) {
        lines.push('');
        lines.push(`<span class="h-hdr">${esc(pad('  PID USER      CPU% MEM%  Command', cols))}</span>`);
        const list = procs.slice().sort((a, b) => b.c - a.c).slice(0, room);
        list.forEach((p, k) => {
          const row = `${lpad(p.pid, 5)} ${pad(p.user, 8).slice(0, 8)} ${lpad(p.c.toFixed(1), 5)} ${lpad(p.m.toFixed(1), 4)}  ${p.cmd}`;
          lines.push(k === 0 ? `<span class="h-sel">${esc(pad(row, cols))}</span>` : esc(row));
        });
      }
      pre.innerHTML = lines.join('\n');
    }
    return { measure, step, render, avg };
  })();

  /* ── ranger ───────────────────────────────────────────── */
  const Ranger = (() => {
    const el = $('#w-ranger');
    let path = [], sel = 0;
    const items = () => {
      const node = nodeAt(path) || FS;
      const kids = visibleKids(node);
      return path.length ? [{ type: 'up', name: '..' }].concat(kids) : kids;
    };

    function preview(it) {
      if (!it) return '';
      if (it.type === 'up') return '<span class="c-muted">наверх</span>';
      if (it.type === 'dir') return visibleKids(it).map(c => nameHTML(c, false)).join('\n') || '<span class="c-muted">пусто</span>';
      if (it.type === 'img') return `<img class="rg-img" src="${esc(it.src)}" alt="ава" loading="lazy">`;
      if (it.type === 'link') {
        return `${nameHTML(it)} -> ${link(it.url)}` + (it.note ? `\n<span class="c-muted">${esc(it.note)}</span>` : '') +
          `<div class="rg-hint">${COARSE ? 'тапни ещё раз, чтобы открыть' : 'enter или ещё клик, чтобы открыть'}</div>`;
      }
      return fileHTML(it);
    }
    function meta(it) {
      if (!it || it.type === 'up') return 'drwxr-xr-x ' + S.user + ' ' + S.user;
      return `${permOf(it)} ${S.user} ${S.user} ${sizeOf(it)} ${MTIME}` + (it.type === 'link' ? ' -> ' + it.url : '');
    }

    function render() {
      if (!el) return;
      const list = items();
      sel = clamp(sel, 0, Math.max(0, list.length - 1));
      const cur = list[sel];
      const real = list.filter(x => x.type !== 'up');
      const pos = cur && cur.type !== 'up' ? real.indexOf(cur) + 1 : 0;
      el.innerHTML =
        `<div class="rg-head"><span class="u">${esc(S.user)}@${esc(S.host)}</span> <span class="p">${esc(pathStr(path))}/</span><span class="f">${cur && cur.type !== 'up' ? esc(cur.name) : ''}</span></div>` +
        `<div class="rg-cols"><ul class="rg-list" role="listbox" aria-label="Файлы">` +
        list.map((it, i) => `<li class="rg-item t-${it.type}${i === sel ? ' sel' : ''}" role="option" aria-selected="${i === sel}" data-i="${i}"><span class="n">${esc(it.name)}</span><span class="m">${it.type === 'dir' ? visibleKids(it).length : ''}</span></li>`).join('') +
        `</ul><div class="rg-prev">${preview(cur)}</div></div>` +
        `<div class="rg-foot"><span>${esc(meta(cur))}</span><span>${pos}/${real.length}</span></div>`;
      const ul = el.querySelector('.rg-list'), s = el.querySelector('.rg-item.sel');
      if (ul && s && s.offsetTop + s.offsetHeight > ul.clientHeight) ul.scrollTop = s.offsetTop + s.offsetHeight - ul.clientHeight;
    }
    function open() {
      const cur = items()[sel];
      if (!cur) return;
      if (cur.type === 'up') return up();
      if (cur.type === 'dir') { path = path.concat(cur.name); sel = 1; return render(); }
      if (cur.type === 'link') openURL(cur.url);
      else if (cur.project && cur.project.url) openURL(cur.project.url);
    }
    function up() {
      if (!path.length) return;
      const from = path[path.length - 1];
      path = path.slice(0, -1);
      sel = Math.max(0, items().findIndex(x => x.name === from));
      render();
    }
    function init() {
      if (!el) return;
      el.addEventListener('click', e => {
        const li = e.target.closest('.rg-item');
        if (!li) return;
        const i = +li.dataset.i;
        if (i === sel) open(); else { sel = i; render(); }
      });
      el.addEventListener('keydown', e => {
        const k = e.key, n = items().length;
        if (k === 'ArrowDown' || k === 'j') sel = (sel + 1) % n;
        else if (k === 'ArrowUp' || k === 'k') sel = (sel - 1 + n) % n;
        else if (k === 'ArrowRight' || k === 'l' || k === 'Enter') { e.preventDefault(); open(); return; }
        else if (k === 'ArrowLeft' || k === 'h' || k === 'Backspace') { e.preventDefault(); up(); return; }
        else if (k === 'g') sel = 0;
        else if (k === 'G') sel = n - 1;
        else return;
        e.preventDefault();
        render();
      });
      render();
    }
    return { init, render };
  })();

  /* ── панель: часы, ram, сеть, батарея ─────────────────── */
  const Bar = (() => {
    let ram = 3.6 + Math.random() * 0.6, up = 4 + Math.random() * 8, dn = 900 + Math.random() * 900;
    const mk = o => { try { return new Intl.DateTimeFormat(undefined, o); } catch (e) { return null; } };
    const fT = mk({ hour: '2-digit', minute: '2-digit' });
    const fD = mk({ weekday: 'short', day: 'numeric', month: 'short' });
    const fL = mk({ weekday: 'long', day: 'numeric', month: 'long' });
    const set = (sel, v) => { const e = $(sel); if (e && e.textContent !== v) e.textContent = v; };
    const speed = k => (k >= 1000 ? (k / 1000).toFixed(1) + ' MB/s' : Math.round(k) + ' KB/s');

    function tick() {
      const d = new Date();
      const t = fT ? fT.format(d) : `${two(d.getHours())}:${two(d.getMinutes())}`;
      set('#m-clock', t);
      set('#m-date', fD ? fD.format(d) : '');
      set('#conky-time', t);
      set('#conky-date', fL ? fL.format(d) : d.toDateString());
      ram = clamp(ram + (Math.random() - 0.5) * 0.08, 3.1, 4.8);
      set('#m-ram', ram.toFixed(2) + ' GiB');
      set('#m-cpu', Math.round(Htop.avg()) + '%');
      up = clamp(up * (0.6 + Math.random() * 0.8) + Math.random() * 4, 0.5, 800);
      dn = clamp(dn * (0.55 + Math.random() * 0.9) + Math.random() * 120, 2, 9500);
      set('#m-up', speed(up));
      set('#m-down', speed(dn));
    }
    function battery(level, charging) {
      const pct = Math.round(clamp(level, 0, 1) * 100);
      set('#m-bat', pct + '%');
      const fill = $('#bat-fill');
      if (fill) fill.setAttribute('width', (11.4 * clamp(level, 0.04, 1)).toFixed(2));
      const w = $('#m-bat-wrap');
      if (w) { w.classList.toggle('bat-chg', !!charging); w.classList.toggle('bat-low', !charging && pct <= 20); }
    }
    function init() {
      tick();
      setInterval(tick, 1000);
      battery(0.6, false);
      if (navigator.getBattery) {
        navigator.getBattery().then(b => {
          const u = () => battery(b.level, b.charging);
          u();
          b.addEventListener('levelchange', u);
          b.addEventListener('chargingchange', u);
        }).catch(() => {});
      }
      const th = $('#m-theme');
      if (th) th.addEventListener('click', e => { cycleTheme(); if (e.detail) th.blur(); });
    }
    return { init };
  })();

  /* ── окна и рабочие столы ─────────────────────────────── */
  const desk = $('#desk');
  function focusWin(el, flash) {
    $$('.win').forEach(w => w.classList.toggle('focused', w === el));
    if (el && flash) { el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); }
  }
  function setWS(n) {
    n = String(n);
    if (desk) desk.dataset.ws = n;
    $$('.ws-btn').forEach(b => {
      const on = b.dataset.ws === n;
      b.classList.toggle('on', on);
      b.classList.toggle('busy', b.dataset.ws === '1');
      b.setAttribute('aria-current', on ? 'true' : 'false');
    });
    Cava.setShown(n === '1');
    if (n === '1') {
      safe('htop', () => { Htop.measure(); Htop.render(); });
      safe('cava', () => Cava.resize());
      if (!COARSE) Term.focus();
    }
  }

  /* ── терминал ─────────────────────────────────────────── */
  const Term = (() => {
    const win = $('#w-term'), body = $('#term-body'), out = $('#out'), input = $('#cmd'), form = $('#cmd-form');
    const typedEl = $('#typed'), promptEl = $('#prompt');
    let cwd = [], prev = [];
    const hist = [];
    let hIdx = 0, draft = '', busy = false, skip = false;

    const ALIASES = {
      ff: 'fastfetch', nf: 'neofetch', screenfetch: 'neofetch', ll: 'ls -l', la: 'ls -la', l: 'ls', dir: 'ls',
      cls: 'clear', 'xdg-open': 'open', logout: 'exit', '?': 'help', whois: 'about',
      vi: 'vim', nvim: 'vim', nano: 'vim', emacs: 'vim', code: 'vim',
      yay: 'pacman', paru: 'pacman', 'apt-get': 'apt', yum: 'dnf',
      hi: 'hello', hey: 'hello', 'привет': 'hello', 'ку': 'hello', 'хай': 'hello',
    };
    const RU = { 'й': 'q', 'ц': 'w', 'у': 'e', 'к': 'r', 'е': 't', 'н': 'y', 'г': 'u', 'ш': 'i', 'щ': 'o', 'з': 'p', 'х': '[', 'ъ': ']', 'ф': 'a', 'ы': 's', 'в': 'd', 'а': 'f', 'п': 'g', 'р': 'h', 'о': 'j', 'л': 'k', 'д': 'l', 'ж': ';', 'э': "'", 'я': 'z', 'ч': 'x', 'с': 'c', 'м': 'v', 'и': 'b', 'т': 'n', 'ь': 'm', 'б': ',', 'ю': '.', 'ё': '`', 'і': 's', 'ї': ']', 'є': "'" };
    const fromRu = s => s.toLowerCase().split('').map(ch => (has(RU, ch) ? RU[ch] : ch)).join('');

    /* вывод */
    const trim = () => { while (out.childElementCount > 600) out.firstElementChild.remove(); };
    function put(html, cls) {
      const d = document.createElement('div');
      d.className = 'line' + (cls ? ' ' + cls : '');
      d.innerHTML = html;
      out.appendChild(d);
      trim();
      return d;
    }
    const say = (text, cls) => put(esc(text), cls);
    const down = () => { body.scrollTop = body.scrollHeight; };

    /* промпт и подсветка ввода */
    const promptHTML = p => `<span class="pl"><span class="pl-seg s1">${esc(S.user)}</span><span class="pl-seg s2">${esc(S.host)}</span><span class="pl-seg s3">${esc(p)}</span></span>`;
    const isCmd = w => has(CMDS, w) || has(ALIASES, w);
    function typedHTML(v, caret) {
      const m = /^(\s*)(\S*)/.exec(v);
      const a = m[1].length, b = a + m[2].length;
      const cls = m[2] ? (isCmd(m[2]) ? 'hl-ok' : 'hl-bad') : '';
      let html = '';
      const putr = (s, e, c) => { if (s < e) { const t = esc(v.slice(s, e)); html += c ? `<span class="${c}">${t}</span>` : t; } };
      const cur = (ch, c) => { html += `<span class="cursor${c ? ' ' + c : ''}">${esc(ch)}</span>`; };
      for (const [s, e, c] of [[0, a, ''], [a, b, cls], [b, v.length, '']]) {
        if (caret != null && caret >= s && caret < e) { putr(s, caret, c); cur(v[caret], c); putr(caret + 1, e, c); }
        else putr(s, e, c);
      }
      if (caret != null && caret >= v.length) cur(' ', '');
      return html;
    }
    function sync() {
      const v = input.value;
      const c = document.activeElement === input && input.selectionStart != null ? input.selectionStart : v.length;
      typedEl.innerHTML = typedHTML(v, c);
    }
    const renderPrompt = () => { promptEl.innerHTML = promptHTML(pathStr(cwd)); };

    /* разбор строки */
    function expand(s) {
      const env = { USER: S.user, HOME, SHELL: '/bin/zsh', PWD: pathAbs(cwd), HOST: S.host, HOSTNAME: S.host, THEME: theme(), TERM: 'alacritty' };
      return s.replace(/\$\{(\w+)\}|\$(\w+)/g, (m, x, y) => { const k = x || y; return has(env, k) ? env[k] : ''; });
    }
    function tokenize(s) {
      const outT = [];
      let cur = '', q = null, any = false;
      for (const ch of s) {
        if (q) { if (ch === q) q = null; else cur += ch; }
        else if (ch === '"' || ch === "'") { q = ch; any = true; }
        else if (/\s/.test(ch)) { if (cur || any) { outT.push(cur); cur = ''; any = false; } }
        else cur += ch;
      }
      if (cur || any) outT.push(cur);
      return outT;
    }
    function lev(a, b) {
      const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
      for (let j = 1; j <= b.length; j++) d[0][j] = j;
      for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      return d[a.length][b.length];
    }
    const MAIN = ['help', 'fastfetch', 'neofetch', 'about', 'links', 'projects', 'stack', 'ls', 'cd', 'cat', 'tree', 'open', 'theme', 'playerctl', 'clear', 'pwd', 'echo', 'date', 'uname', 'whoami', 'history', 'htop', 'ranger', 'cava', 'exit', 'reboot'];
    function closest(w) {
      if (w.length < 3) return null;
      let best = null, bd = 3;
      for (const c of MAIN) { const d = lev(w, c); if (d < bd) { bd = d; best = c; } }
      return best;
    }

    function exec(line) {
      for (const part of line.split(/\s*(?:&&|;)\s*/)) if (part.trim()) one(part);
    }
    function one(part) {
      let toks = tokenize(expand(part));
      if (!toks.length) return;
      if (!isCmd(toks[0]) && /[а-яёіїє]/i.test(toks[0])) {
        const fixed = fromRu(toks[0]);
        if (isCmd(fixed)) {
          say(`zsh: correct '${toks[0]}' to '${fixed}' (раскладка)`, 'c-muted');
          toks = toks.map(t => (/[а-яёіїє]/i.test(t) ? fromRu(t) : t));
        }
      }
      if (has(ALIASES, toks[0])) toks = tokenize(ALIASES[toks[0]]).concat(toks.slice(1));
      const name = toks[0];
      if (!has(CMDS, name)) {
        say(`zsh: command not found: ${name}`);
        const g = closest(name.toLowerCase());
        if (g) put(`может, <span class="c-acc">${esc(g)}</span>?`, 'c-muted');
        return;
      }
      CMDS[name](toks.slice(1));
    }

    /* fastfetch / neofetch */
    function fetchRows() {
      const dpr = window.devicePixelRatio || 1;
      const toks = {
        repos: REPOS == null ? null : String(REPOS),
        res: `${Math.round(screen.width * dpr)}x${Math.round(screen.height * dpr)}`,
        uptime: uptime(Date.now() - T0),
        theme: theme(),
      };
      const rows = [];
      for (const row of S.fetch) {
        if (!Array.isArray(row) || row.length < 2) continue;
        let skipRow = false;
        const val = String(row[1]).replace(/\{(\w+)\}/g, (m, k) => {
          if (!has(toks, k)) return m;
          if (toks[k] == null) { skipRow = true; return ''; }
          return toks[k];
        });
        if (!skipRow) rows.push([row[0], row[2] ? link(row[2], val) : esc(val)]);
      }
      return rows;
    }
    function fetchOut(mode) {
      const title = `${S.user}@${S.host}`;
      let info = `<div><span class="ff-k">${esc(S.user)}</span>@<span class="ff-k">${esc(S.host)}</span></div><div>${'-'.repeat(title.length)}</div>`;
      for (const [k, v] of fetchRows()) info += `<div class="ff-row"><span class="ff-k">${esc(k)}</span>: ${v}</div>`;
      const sw = i => `<i style="background:var(--c${i})"></i>`;
      info += `<div class="ff-blocks" aria-hidden="true">${[0, 1, 2, 3, 4, 5, 6, 7].map(sw).join('')}<br>${[8, 9, 10, 11, 12, 13, 14, 15].map(sw).join('')}</div>`;
      let logo = '';
      if (mode === 'image') logo = `<img class="ff-img" src="${esc(S.avatar)}" alt="ава ${esc(S.user)}" width="214" height="214">`;
      else if (mode === 'ascii') logo = `<pre class="ff-art" aria-hidden="true">${artHTML(ART)}</pre>`;
      const el = put(`<div class="ff">${logo}<div class="ff-info">${info}</div></div>`);
      const img = el.querySelector('.ff-img');
      if (img) {
        img.addEventListener('error', () => {
          const pre = document.createElement('pre');
          pre.className = 'ff-art';
          pre.setAttribute('aria-hidden', 'true');
          pre.innerHTML = artHTML(ART);
          img.replaceWith(pre);
        }, { once: true });
      }
    }
    function fetchCmd(args, def) {
      let mode = def;
      for (let i = 0; i < args.length; i++) {
        let a = args[i], val = null;
        if (a === '-h' || a === '--help') {
          put(`usage: fastfetch [--logo <type>]\n  <span class="c-acc">--logo image</span>   ава картинкой (как kitty)\n  <span class="c-acc">--logo ascii</span>   ава символами\n  <span class="c-acc">--logo none</span>    без лого`);
          return;
        }
        if (a.startsWith('--logo=')) val = a.slice(7);
        else if (a === '--logo' || a === '-l' || a === '--logo-type') val = args[++i] || '';
        else if (a === '--ascii' || a === '--off') val = a === '--off' ? 'none' : 'ascii';
        if (val != null) {
          val = val.toLowerCase();
          if (['image', 'kitty', 'sixel', 'iterm', 'img'].includes(val)) mode = 'image';
          else if (['ascii', 'small', 'builtin', 'auto', 'chafa'].includes(val)) mode = 'ascii';
          else if (['none', 'off', 'false'].includes(val)) mode = 'none';
          else { say(`fastfetch: неизвестный тип лого: ${val} (есть image, ascii, none)`); return; }
        }
      }
      fetchOut(mode);
    }

    /* команды */
    const CMDS = {
      help() {
        const rows = [
          ['fastfetch', 'кто я, с авой'],
          ['neofetch', 'то же, только ава в ascii'],
          ['about', 'пару слов обо мне'],
          ['links', 'где меня найти'],
          ['projects', 'над чем работаю'],
          ['stack', 'чем пользуюсь'],
          ['ls cd cat tree', 'походить по файлам'],
          ['open <имя>', 'открыть ссылку: open github'],
          ['theme [имя]', 'тема: ' + THEME_NAMES.join(', ')],
          ['playerctl', 'музыка в панели: play-pause, next'],
          ['clear', 'очистить экран'],
        ];
        const w = Math.max(...rows.map(r => r[0].length)) + 3;
        put(rows.map(([c, d]) => `  <span class="c-acc">${esc(pad(c, w))}</span>${esc(d)}`).join('\n'));
        say(COARSE ? 'кнопки под терминалом запускают команды за тебя' : 'tab дополняет, ↑ ↓ листают историю, ctrl+l чистит экран', 'c-muted');
      },
      fastfetch: a => fetchCmd(a, 'image'),
      neofetch: a => fetchCmd(a, 'ascii'),
      about() { put(fileHTML(nodeAt(['about.md']) || { lines: S.about })); },
      links() {
        const w = Math.max(6, ...S.links.map(l => String(l.name).length)) + 2;
        put(S.links.map(l => `<span class="c-cyan">${esc(pad(l.name, w))}</span>${link(l.url)}${l.note ? `  <span class="c-muted">${esc(l.note)}</span>` : ''}`).join('\n'));
      },
      projects() {
        put(S.projects.map(p => [
          `<span class="c-acc b">${esc(p.name)}</span>${p.url ? '  ' + link(p.url) : ''}`,
          '  ' + esc(p.desc || ''),
          p.tags ? `  <span class="c-muted">${esc(p.tags)}</span>` : null,
        ].filter(x => x != null).join('\n')).join('\n\n'));
      },
      stack() { put(fileHTML({ stack: S.stack })); },
      ls(args) {
        let long = false, all = false;
        const paths = [];
        for (const a of args) {
          if (a.startsWith('-') && a.length > 1) { long = long || a.includes('l'); all = all || a.includes('a') || a.includes('A'); }
          else paths.push(a);
        }
        const targets = paths.length ? paths : ['.'];
        targets.forEach((p, k) => {
          const segs = resolvePath(p, cwd);
          const node = segs && nodeAt(segs);
          if (!node) { say(`ls: cannot access '${p}': No such file or directory`); return; }
          if (targets.length > 1 && node.type === 'dir') put((k ? '\n' : '') + esc(p) + ':');
          const list = node.type === 'dir' ? (node.children || []).filter(c => all || !c.hidden) : [node];
          if (!list.length) return;
          if (long) {
            put(`total ${list.length * 4}\n` + list.map(n => `${permOf(n)} 1 ${esc(S.user)} ${esc(S.user)} ${lpad(sizeOf(n), 5)} ${MTIME} ${nameHTML(n, false)}${n.type === 'link' ? ' -> ' + link(n.url) : ''}`).join('\n'));
          } else {
            put(list.map(n => nameHTML(n, true)).join('  '));
          }
        });
      },
      cd(args) {
        const p = args[0];
        if (!p || p === '~') { prev = cwd; cwd = []; return; }
        if (p === '-') { const t = cwd; cwd = prev; prev = t; say(pathAbs(cwd)); return; }
        const segs = resolvePath(p, cwd);
        if (!segs) { say(`cd: permission denied: ${p}`); return; }
        const n = nodeAt(segs);
        if (!n) { say(`cd: no such file or directory: ${p}`); return; }
        if (n.type !== 'dir') { say(`cd: not a directory: ${p}`); return; }
        prev = cwd; cwd = segs;
      },
      pwd() { say(pathAbs(cwd)); },
      cat(args) {
        if (!args.length) { say('cat: укажи файл, например: cat about.md', 'c-muted'); return; }
        for (const p of args) {
          const segs = resolvePath(p, cwd);
          const n = segs && nodeAt(segs);
          if (!n) { say(`cat: ${p}: No such file or directory`); continue; }
          if (n.type === 'dir') { say(`cat: ${p}: Is a directory`); continue; }
          if (n.type === 'img') { put(`<img class="cat-img" src="${esc(n.src)}" alt="ава">`); continue; }
          put(fileHTML(n));
        }
      },
      tree(args) {
        const p = args[0];
        const segs = p ? resolvePath(p, cwd) : cwd;
        const node = segs && nodeAt(segs);
        if (!node) { say(`${p} [error opening dir]`); return; }
        let dirs = 0, files = 0;
        const lines = [`<span class="c-blue b">${esc(p || '.')}</span>`];
        const walk = (n, pre) => {
          const kids = visibleKids(n);
          kids.forEach((c, i) => {
            const last = i === kids.length - 1;
            lines.push(`${pre}${last ? '└── ' : '├── '}${nameHTML(c, false)}${c.type === 'link' ? ' -> ' + link(c.url) : ''}`);
            if (c.type === 'dir') { dirs++; walk(c, pre + (last ? '    ' : '│   ')); } else files++;
          });
        };
        if (node.type === 'dir') walk(node, ''); else files = 1;
        lines.push('', `${dirs} director${dirs === 1 ? 'y' : 'ies'}, ${plural(files, 'file')}`);
        put(lines.join('\n'));
      },
      open(args) {
        const t = args[0];
        if (!t) { say('open: что открыть? например: open github', 'c-muted'); return; }
        let url = null;
        if (/^https?:\/\//i.test(t)) url = t;
        else {
          const segs = resolvePath(t, cwd);
          const n = (segs && nodeAt(segs)) || findByName(t);
          if (n && n.type === 'link') url = n.url;
          else if (n && n.project && n.project.url) url = n.project.url;
          else if (n && n.type === 'img') url = n.src;
        }
        if (!url || !safeURL(url) && !/\.(jpe?g|png|webp)$/i.test(url)) { say(`open: ${t}: такой ссылки нет, список: links`); return; }
        put('opening ' + link(url));
        window.open(url, '_blank', 'noopener');
      },
      theme(args) {
        const t = String(args[0] || '').toLowerCase();
        if (!t) {
          put(THEME_NAMES.map(n => (n === theme() ? `<span class="c-acc b">* ${n}</span>` : '  ' + n)).join('\n') + '\n<span class="c-muted">theme &lt;имя&gt; или theme next</span>');
          return;
        }
        if (t === 'next') { cycleTheme(); say('тема: ' + theme(), 'c-muted'); return; }
        if (!THEMES[t]) { say(`theme: нет темы ${t}, есть: ${THEME_NAMES.join(', ')}`); return; }
        setTheme(t, true);
        say('тема: ' + t, 'c-muted');
      },
      playerctl(args) {
        const a = args[0] || 'status';
        if (a === 'play-pause') Music.play(!Music.isPlaying());
        else if (a === 'play') Music.play(true);
        else if (a === 'pause' || a === 'stop') Music.play(false);
        else if (a === 'next') Music.step(1);
        else if (a === 'previous' || a === 'prev') Music.step(-1);
        else if (a !== 'status') { say(`playerctl: unknown command '${a}'`); return; }
        say(`${Music.isPlaying() ? 'Playing' : 'Paused'}: ${Music.track()}`);
      },
      clear() { out.innerHTML = ''; },
      history() { put(hist.map((h, i) => `${lpad(i + 1, 5)}  ${esc(h)}`).join('\n')); },
      echo(args) { say(args.join(' ')); },
      date() { say(fmtDate(new Date(), true)); },
      uname(args) {
        say(args.some(a => /^-\w*a/.test(a)) ? `Linux ${S.host} 6.11.0-${S.user} #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux` : 'Linux');
      },
      whoami() { say(S.user); },
      htop() { focusWin($('#w-htop'), true); say('i3: focus htop', 'c-muted'); scrollToWin('#w-htop'); },
      ranger() { const r = $('#w-ranger'); focusWin(r, true); say('i3: focus ranger', 'c-muted'); scrollToWin('#w-ranger'); if (r && !COARSE) r.focus({ preventScroll: true }); },
      cava() { focusWin($('#w-cava'), true); Music.play(true); say('i3: focus cava', 'c-muted'); scrollToWin('#w-cava'); },
      hello() { put('привет! напиши <span class="c-acc">help</span>, если не знаешь, с чего начать'); },
      sudo() { say(`[sudo] password for ${S.user}: `); say(`${S.user} is not in the sudoers file. This incident will be reported.`); },
      rm(args) {
        const rf = args.some(a => /^-\w*r/.test(a) || /^-\w*R/.test(a));
        const target = args.find(a => !a.startsWith('-')) || '';
        if (rf && ['/', '/*', '~', '*', '.'].includes(target)) {
          if (args.includes('--no-preserve-root')) say('…и что, по-твоему, должно было случиться? это статичный сайт', 'c-muted');
          else { say(`rm: it is dangerous to operate recursively on '${target}'`); say('rm: use --no-preserve-root to override this failsafe'); }
          return;
        }
        say(target ? `rm: cannot remove '${target}': Read-only file system` : 'rm: missing operand');
      },
      vim() { say('открыть-то открою, а выходить как будешь? (:q! если что)', 'c-muted'); },
      pacman() { say('error: you cannot perform this operation unless you are root.'); },
      apt() { say('E: Could not open lock file /var/lib/dpkg/lock-frontend - open (13: Permission denied)'); },
      dnf() { say('Error: This command has to be run with superuser privileges (under the root user on most systems).'); },
      man(args) { say(args[0] ? `No manual entry for ${args[0]}` : 'What manual page do you want?'); put('попробуй <span class="c-acc">help</span>', 'c-muted'); },
      exit() { say('logout'); setTimeout(() => boot(true), 650); },
      reboot() { say('Broadcast message: The system will reboot now!', 'c-muted'); setTimeout(() => location.reload(), 700); },
    };

    function scrollToWin(sel) {
      if (window.innerWidth > 860) return;
      const el = $(sel);
      if (el) el.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'center' });
    }

    /* выполнение */
    function runLine(raw) {
      const echoEl = put(promptHTML(pathStr(cwd)) + typedHTML(raw, null), 'cmdline');
      const cmd = raw.trim();
      if (cmd && hist[hist.length - 1] !== cmd) hist.push(cmd);
      hIdx = hist.length;
      draft = '';
      if (cmd) safe('exec', () => exec(cmd));
      renderPrompt();
      sync();
      // длинный вывод: показываем его начало, короткий: просто вниз
      const startTop = echoEl.isConnected ? echoEl.offsetTop : 0;
      if (echoEl.isConnected && body.scrollHeight - startTop > body.clientHeight) body.scrollTop = Math.max(0, startTop - 6);
      else down();
    }
    function submit() {
      if (busy) return;
      const raw = input.value;
      input.value = '';
      runLine(raw);
    }
    async function type(cmd, speed, wait) {
      if (busy) return;
      busy = true;
      skip = REDUCED;
      input.readOnly = true;
      input.value = '';
      sync();
      for (const ch of cmd) {
        if (skip) break;
        input.value += ch;
        sync();
        await sleep(speed * (0.6 + Math.random() * 0.8));
      }
      input.value = cmd;
      sync();
      if (wait) await wait;
      if (!skip) await sleep(130);
      input.readOnly = false;
      busy = false;
      skip = false;
      submit();
    }

    /* tab-дополнение */
    function complete() {
      const v = input.value, caret = input.selectionStart == null ? v.length : input.selectionStart;
      const before = v.slice(0, caret), after = v.slice(caret);
      const word = /(\S*)$/.exec(before)[1];
      const start = caret - word.length;
      const first = before.slice(0, start).trim() === '';
      let cands;
      if (first) {
        cands = MAIN.concat(['ff', 'nf', 'll', 'la']).filter(c => c.startsWith(word));
      } else {
        const slash = word.lastIndexOf('/');
        const dirPart = slash >= 0 ? word.slice(0, slash + 1) : '';
        const base = slash >= 0 ? word.slice(slash + 1) : word;
        const segs = dirPart ? resolvePath(dirPart, cwd) : cwd;
        const dn = segs && nodeAt(segs);
        if (!dn || dn.type !== 'dir') return;
        cands = (dn.children || []).filter(c => (!c.hidden || base.startsWith('.')) && c.name.startsWith(base)).map(c => dirPart + c.name + (c.type === 'dir' ? '/' : ''));
        if (/^(theme)\s/.test(before.trimStart())) cands = THEME_NAMES.concat('next').filter(t => t.startsWith(word));
        if (/^(playerctl)\s/.test(before.trimStart())) cands = ['play-pause', 'play', 'pause', 'next', 'previous', 'status'].filter(t => t.startsWith(word));
      }
      cands = Array.from(new Set(cands));
      if (!cands.length) return;
      const ins = s => { input.value = v.slice(0, start) + s + after; const c = start + s.length; input.setSelectionRange(c, c); sync(); };
      if (cands.length === 1) { ins(cands[0] + (cands[0].endsWith('/') ? '' : ' ')); return; }
      let pre = cands[0];
      for (const c of cands) while (!c.startsWith(pre)) pre = pre.slice(0, -1);
      if (pre.length > word.length) ins(pre);
      else { put(promptHTML(pathStr(cwd)) + typedHTML(v, null), 'cmdline'); put(cands.map(esc).join('  '), 'c-muted'); down(); }
    }

    function histNav(d) {
      if (!hist.length) return;
      if (hIdx === hist.length) draft = input.value;
      hIdx = clamp(hIdx + d, 0, hist.length);
      input.value = hIdx === hist.length ? draft : hist[hIdx];
      const c = input.value.length;
      input.setSelectionRange(c, c);
      sync();
    }

    function focus() {
      if (!input) return;
      if (COARSE) input.focus(); else input.focus({ preventScroll: true });
    }

    function init() {
      renderPrompt();
      sync();
      input.addEventListener('keydown', e => {
        if (busy) { skip = true; if (e.key !== 'Tab') return; }
        if (e.key === 'Enter') { e.preventDefault(); submit(); return; }
        if (e.key === 'Tab') { e.preventDefault(); if (!busy) complete(); return; }
        if (e.key === 'ArrowUp') { e.preventDefault(); histNav(-1); return; }
        if (e.key === 'ArrowDown') { e.preventDefault(); histNav(1); return; }
        if (e.ctrlKey && !e.shiftKey && (e.key === 'l' || e.key === 'L')) { e.preventDefault(); out.innerHTML = ''; return; }
        if (e.ctrlKey && (e.key === 'c' || e.key === 'C') && input.selectionStart === input.selectionEnd && !String(window.getSelection())) {
          e.preventDefault();
          put(promptHTML(pathStr(cwd)) + typedHTML(input.value, null) + '^C', 'cmdline');
          input.value = '';
          sync();
          down();
          return;
        }
        if (e.ctrlKey && (e.key === 'u' || e.key === 'U')) { e.preventDefault(); input.value = input.value.slice(input.selectionStart || 0); input.setSelectionRange(0, 0); sync(); return; }
        requestAnimationFrame(sync);
      });
      input.addEventListener('input', () => { sync(); down(); });
      form.addEventListener('submit', e => { e.preventDefault(); submit(); });
      document.addEventListener('selectionchange', () => { if (document.activeElement === input) sync(); });
      input.addEventListener('focus', () => { win.classList.add('typing'); focusWin(win); sync(); });
      input.addEventListener('blur', () => { win.classList.remove('typing'); sync(); });
      win.addEventListener('click', e => {
        if (e.target.closest('a, button, input')) return;
        if (String(window.getSelection())) return;
        focus();
      });
    }

    async function boot(again) {
      out.innerHTML = '';
      prev = cwd = [];
      renderPrompt();
      if (!again) {
        const last = new Date(T0 - (4 + Math.floor(Math.random() * 50)) * 60000);
        say(`Last login: ${fmtDate(last, false)} on pts/0`, 'c-dim');
      }
      await sleep(REDUCED ? 0 : 450);
      const repos = Promise.race([REPOS_P, sleep(1700)]);
      await type('fastfetch', 62, repos);
      put('напиши <span class="c-acc">help</span>, чтобы увидеть команды', 'c-muted');
      if (!COARSE) focus();
    }

    return { init, boot, focus, type: (c, s) => type(c, s || 24), run: c => runLine(String(c)), isBusy: () => busy };
  })();

  /* ── кнопки команд ────────────────────────────────────── */
  function initChips() {
    const box = $('#chips');
    if (!box) return;
    const list = ['fastfetch', 'neofetch', 'about', 'links', 'projects', 'stack', 'theme next', 'help', 'clear'];
    box.innerHTML = list.map(c => `<button type="button" class="chip" data-cmd="${esc(c)}">${esc(c)}</button>`).join('');
    box.addEventListener('click', e => {
      const b = e.target.closest('.chip');
      if (b && !Term.isBusy()) Term.type(b.dataset.cmd, 22);
    });
  }

  /* ── старт ────────────────────────────────────────────── */
  let REPOS_P = Promise.resolve();
  function init() {
    const saved = store.get('shkbd-theme');
    setTheme(saved && THEMES[saved] ? saved : S.theme, false);
    safe('bar', () => Bar.init());
    safe('ranger', () => Ranger.init());
    safe('htop', () => { Htop.measure(); Htop.render(); setInterval(() => { Htop.step(); Htop.render(); }, 1500); });
    safe('cava', () => Cava.init());
    safe('music', () => Music.init());
    safe('repos', () => { REPOS_P = loadRepos(); });
    safe('art', () => loadArt());
    safe('chips', () => initChips());
    safe('ws', () => {
      $$('.ws-btn, [data-goto]').forEach(b => b.addEventListener('click', e => { setWS(b.dataset.ws || b.dataset.goto); if (e.detail) b.blur(); }));
      setWS('1');
    });
    safe('focus', () => {
      document.addEventListener('pointerdown', e => { const w = e.target.closest('.win'); if (w) focusWin(w); });
      // начал печатать где угодно, и ввод уходит в терминал
      document.addEventListener('keydown', e => {
        if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || !desk || desk.dataset.ws !== '1') return;
        const a = document.activeElement;
        if (a && a !== document.body && a !== root) return;
        if (e.key.length === 1 || e.key === 'Enter' || e.key === 'ArrowUp') Term.focus();
      });
    });
    Term.init();
    Term.boot(false);

    let rt = 0;
    const onResize = () => {
      clearTimeout(rt);
      rt = setTimeout(() => {
        safe('wall', () => Wall.draw(false));
        safe('htop', () => { Htop.measure(); Htop.render(); });
        safe('cava', () => Cava.resize());
      }, 150);
    };
    window.addEventListener('resize', onResize);
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(onResize);
      ['#w-htop', '#w-cava'].forEach(s => { const el = $(s); if (el) ro.observe(el); });
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => safe('htop', () => { Htop.measure(); Htop.render(); }));

    // для любопытных: в консоли можно shkbd.run('fastfetch')
    window.shkbd = { run: c => Term.run(c), theme: t => setTheme(t, true), art: () => ART };
  }

  init();
})();

/* Pixel-art helpers + the space background engine. */
(function () {
  'use strict';

  // ---------- utils ----------
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hash3(i, j, k, s) {
    let h = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(k, 1274126177) + Math.imul(s, 1442695041)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  }
  const smooth = (t) => t * t * (3 - 2 * t);
  function noise3(x, y, z, s) {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const xf = smooth(x - xi), yf = smooth(y - yi), zf = smooth(z - zi);
    const l = (a, b, t) => a + (b - a) * t;
    const c000 = hash3(xi, yi, zi, s), c100 = hash3(xi + 1, yi, zi, s);
    const c010 = hash3(xi, yi + 1, zi, s), c110 = hash3(xi + 1, yi + 1, zi, s);
    const c001 = hash3(xi, yi, zi + 1, s), c101 = hash3(xi + 1, yi, zi + 1, s);
    const c011 = hash3(xi, yi + 1, zi + 1, s), c111 = hash3(xi + 1, yi + 1, zi + 1, s);
    return l(l(l(c000, c100, xf), l(c010, c110, xf), yf), l(l(c001, c101, xf), l(c011, c111, xf), yf), zf);
  }
  function fbm3(x, y, z, s, oct) {
    let a = 0.5, f = 1, sum = 0, norm = 0;
    for (let o = 0; o < (oct || 4); o++) { sum += a * noise3(x * f, y * f, z * f, s + o * 17); norm += a; a *= 0.5; f *= 2.03; }
    return sum / norm;
  }
  function hexToRgb(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  function mix(c1, c2, t) { return [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)]; }
  const rgb = (c, a) => (a === undefined ? `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})` : `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`);
  // Tanner Helland black-body approximation
  function kelvinRGB(K) {
    const t = K / 100; let r, g, b;
    if (t <= 66) { r = 255; g = 99.4708025861 * Math.log(t) - 161.1195681661; b = t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307; }
    else { r = 329.698727446 * Math.pow(t - 60, -0.1332047592); g = 288.1221695283 * Math.pow(t - 60, -0.0755148492); b = 255; }
    return [clamp(r, 0, 255), clamp(g, 0, 255), clamp(b, 0, 255)];
  }
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => v / 16 - 0.5);
  const bayer = (x, y) => BAYER[(y & 3) * 4 + (x & 3)];

  function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function spriteFrom(rows, pal) {
    const h = rows.length, w = rows[0].length, c = makeCanvas(w, h), x = c.getContext('2d');
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const k = rows[j][i]; if (pal[k]) { x.fillStyle = pal[k]; x.fillRect(i, j, 1, 1); } }
    return c;
  }

  // ---------- celestial palettes ----------
  const STAR_COLORS = ['#9bb0ff', '#aabfff', '#cad7ff', '#f8f7ff', '#fff4ea', '#ffe6b8', '#ffd2a1', '#ffcc6f', '#ff9f6b', '#ff7a6a', '#b8ffcf', '#d6b8ff', '#9ff0ff'];
  const GALAXY_HUES = [['#ff8a7a', '#ffd0a0'], ['#ffe08a', '#fff4d6'], ['#7ab8ff', '#d0e6ff'], ['#8affc1', '#dcffe9'], ['#c49aff', '#f0e0ff'], ['#ff9ad8', '#ffe0f2'], ['#7af0ff', '#e0fbff']];

  function makeGalaxySprite(rng, kind, hues) {
    const size = kind === 'nebula' ? 60 + ((rng() * 30) | 0) : 30 + ((rng() * 26) | 0);
    const c = makeCanvas(size, size), x = c.getContext('2d');
    const img = x.createImageData(size, size), d = img.data;
    const c1 = hexToRgb(hues[0]), c2 = hexToRgb(hues[1]);
    const cx = size / 2, cy = size / 2, seed = (rng() * 1e6) | 0;
    const arms = 2 + ((rng() * 2) | 0), twist = 2.5 + rng() * 2, tilt = 0.45 + rng() * 0.5, rot = rng() * Math.PI * 2;
    for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
      let dx = (i - cx) / (size / 2), dy = (j - cy) / (size / 2);
      const cr = Math.cos(rot), sr = Math.sin(rot);
      let rx = dx * cr - dy * sr, ry = (dx * sr + dy * cr) / tilt;
      const r = Math.sqrt(rx * rx + ry * ry);
      let v = 0;
      if (kind === 'spiral') {
        const a = Math.atan2(ry, rx);
        const arm = Math.cos(arms * (a - twist * Math.log(r + 0.05)));
        v = Math.max(0, 1 - r) * (0.35 + 0.65 * Math.max(0, arm)) + Math.max(0, 0.35 - r) * 2.2;
        v *= 0.6 + 0.6 * noise3(i * 0.3, j * 0.3, 0, seed);
      } else if (kind === 'elliptical') {
        v = Math.exp(-r * r * 4.5) * 1.3;
      } else {
        const n = fbm3(i * 0.08, j * 0.08, 0.5, seed, 4);
        v = Math.max(0, n - 0.42) * 2.6 * Math.max(0, 1 - r * r);
      }
      v = clamp(v, 0, 1);
      if (v < 0.04) continue;
      const q = Math.round((v + bayer(i, j) * 0.18) * 5) / 5; // posterize
      if (q <= 0) continue;
      const col = mix(c1, c2, clamp(q * 1.1 - 0.2, 0, 1));
      const k = (j * size + i) * 4;
      d[k] = col[0]; d[k + 1] = col[1]; d[k + 2] = col[2]; d[k + 3] = clamp(q * (kind === 'nebula' ? 120 : 210), 0, 255);
    }
    x.putImageData(img, 0, 0);
    return c;
  }

  // ---------- ship sprite (points right) ----------
  const SHIP_ROWS = [
    '......aa..............',
    '.....abba.............',
    '....abccba............',
    'aaaaabcccbaaaa........',
    'ebbbbccccccbbbbaa.....',
    'ebccrccccccccccbbaa...',
    'ebbccccccccccwwwbbba..',
    'ebcrrccccccccwwwwccba.',
    'ebbccccccccccwwwbbba..',
    'ebccrccccccccccbbaa...',
    'ebbbbccccccbbbbaa.....',
    'aaaaabcccbaaaa........',
    '....abccba............',
    '.....abba.............',
    '......aa..............'
  ];
  const SHIP_PAL = { a: '#2a2f45', b: '#5d6684', c: '#b9c2d8', r: '#ff6a3d', w: '#6fe3ff', e: '#ffb347' };

  // ---------- Earth ----------
  function makeEarthTexture(TW, TH, seed) {
    const land = new Uint8ClampedArray(TW * TH * 3), cloud = new Uint8Array(TW * TH), isLand = new Uint8Array(TW * TH);
    for (let ty = 0; ty < TH; ty++) {
      const lat = (ty / TH - 0.5) * Math.PI;
      for (let tx = 0; tx < TW; tx++) {
        const lon = (tx / TW) * Math.PI * 2;
        const px = Math.cos(lat) * Math.cos(lon), py = Math.cos(lat) * Math.sin(lon), pz = Math.sin(lat);
        const h = fbm3(px * 1.6 + 5, py * 1.6 + 5, pz * 1.6 + 5, seed, 5);
        const m = fbm3(px * 3 + 9, py * 3 + 9, pz * 3 + 9, seed + 99, 3);
        const k = (ty * TW + tx) * 3; let c;
        const ice = Math.abs(lat) > 1.22 + (m - 0.5) * 0.3;
        if (ice) c = [236, 244, 255];
        else if (h > 0.53) {
          isLand[ty * TW + tx] = 1;
          if (m > 0.58 && Math.abs(lat) < 0.6) c = [214, 186, 120]; // desert
          else if (h > 0.66) c = [124, 112, 92];  // mountain
          else c = m > 0.48 ? [70, 142, 74] : [46, 112, 62];
        } else c = h > 0.49 ? [56, 140, 210] : h > 0.42 ? [30, 98, 182] : [20, 66, 146];
        land[k] = c[0]; land[k + 1] = c[1]; land[k + 2] = c[2];
        const cl = fbm3(px * 2.4 + 1, py * 2.4 + 1, pz * 4 + 1, seed + 7, 4);
        cloud[ty * TW + tx] = cl > 0.57 ? (cl > 0.63 ? 2 : 1) : 0;
      }
    }
    return { land, cloud, isLand, TW, TH };
  }

  // ---------- Space engine ----------
  class Space {
    constructor(canvas) {
      this.canvas = canvas; this.ctx = canvas.getContext('2d');
      this.mode = 'landing'; this.reduced = false;
      this.angle = Math.random() * Math.PI * 2; // drift direction, random per load
      this.speed = 1; this.boost = 0; this.cam = { cy: 0.5, cyT: 0.5 };
      this.warp = 0; this.warpT = 0; this.shake = 0; this.tint = 0;
      this.earthRot = Math.random() * Math.PI * 2;
      this.ship = spriteFrom(SHIP_ROWS, SHIP_PAL);
      this.earthTex = makeEarthTexture(256, 128, 1337);
      this.t = 0;
      this.resize();
      window.addEventListener('resize', () => this.resize());
    }
    resize() {
      const W = window.innerWidth, H = window.innerHeight;
      this.PX = W < 700 ? 2 : 3;
      this.w = Math.ceil(W / this.PX); this.h = Math.ceil(H / this.PX);
      this.canvas.width = this.w; this.canvas.height = this.h;
      this.ctx.imageSmoothingEnabled = false;
      this.img = null;
      this.initStars(); this.initEarth();
    }
    initStars() {
      const rng = Math.random, w = this.w, h = this.h;
      const n = Math.min(900, Math.round((w * h) / 70));
      this.stars = [];
      for (let i = 0; i < n; i++) {
        const z = rng();
        this.stars.push({ x: rng() * w, y: rng() * h, z: 0.15 + z * 0.85, c: STAR_COLORS[(rng() * STAR_COLORS.length) | 0], big: rng() < 0.05, tw: rng() * 6.28, ts: 0.6 + rng() * 2.5 });
      }
      this.galaxies = [];
      const gn = Math.max(4, Math.min(9, Math.round((w * h) / 22000)));
      const kinds = ['spiral', 'spiral', 'elliptical', 'nebula', 'spiral', 'nebula', 'elliptical', 'spiral', 'nebula'];
      for (let i = 0; i < gn; i++) {
        const sprite = makeGalaxySprite(rng, kinds[i % kinds.length], GALAXY_HUES[(rng() * GALAXY_HUES.length) | 0]);
        this.galaxies.push({ s: sprite, x: rng() * w, y: rng() * h, z: 0.08 + rng() * 0.12 });
      }
      // 3D field for cockpit / hyperspace
      this.field = [];
      for (let i = 0; i < 420; i++) this.field.push(this.newFieldStar(true));
    }
    newFieldStar(any) {
      return { x: (Math.random() * 2 - 1) * 1.6, y: (Math.random() * 2 - 1) * 1.6, z: any ? Math.random() * 1.0 + 0.02 : 1.0, c: Math.random() < 0.7 ? '#e8f4ff' : Math.random() < 0.5 ? '#9fd0ff' : '#ffffff' };
    }
    initEarth() {
      const W = window.innerWidth, H = window.innerHeight, PX = this.PX;
      let R = Math.sqrt((W * H) / (6 * Math.PI));          // area ≈ 1/6 of screen
      R = Math.min(R, Math.min(W, H) * 0.42);
      const landscape = W >= H;
      const cx = landscape ? W * 0.2 : W * 0.5, cy = landscape ? H * 0.7 : H * 0.8;
      this.earth = { r: Math.round(R / PX), cx: Math.round(cx / PX), cy: Math.round(cy / PX) };
      // precompute sphere lookup for each pixel of the disk
      const r = this.earth.r, size = r * 2 + 1, L = [0.62, -0.45, 0.64];
      const ll = Math.hypot(...L); L[0] /= ll; L[1] /= ll; L[2] /= ll;
      const lon = new Float32Array(size * size), lat = new Float32Array(size * size), light = new Float32Array(size * size), inside = new Uint8Array(size * size);
      for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
        const nx = (i - r) / r, ny = (j - r) / r, d2 = nx * nx + ny * ny, k = j * size + i;
        if (d2 > 1) continue;
        const nz = Math.sqrt(1 - d2); inside[k] = 1;
        // axial tilt ~23°
        const tl = 0.4, ty = ny * Math.cos(tl) - nx * Math.sin(tl), tx = nx * Math.cos(tl) + ny * Math.sin(tl);
        lat[k] = Math.asin(clamp(-ty, -1, 1)); lon[k] = Math.atan2(tx, nz);
        light[k] = nx * L[0] + ny * L[1] + nz * L[2];
      }
      this.earthLUT = { lon, lat, light, inside, size };
      this.earthCanvas = makeCanvas(size + 8, size + 8);
      this.earthCtx = this.earthCanvas.getContext('2d');
      this.earthImg = this.earthCtx.createImageData(size + 8, size + 8);
      this.shipScale = Math.max(1, Math.round((Math.min(W, H) * 0.12) / (SHIP_ROWS[0].length * PX)));
    }
    renderEarth() {
      const { lon, lat, light, inside, size } = this.earthLUT, T = this.earthTex, img = this.earthImg, d = img.data, S = size + 8, r = this.earth.r;
      d.fill(0);
      const rot = this.earthRot, crot = rot * 1.35;
      for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
        const k = j * size + i, o = ((j + 4) * S + (i + 4)) * 4;
        if (!inside[k]) {
          // atmosphere halo
          const nx = (i - r) / r, ny = (j - r) / r, dd = Math.sqrt(nx * nx + ny * ny);
          if (dd < 1 + 3.5 / r) { const a = (1 - (dd - 1) / (3.5 / r)); d[o] = 110; d[o + 1] = 180; d[o + 2] = 255; d[o + 3] = 150 * a; }
          continue;
        }
        let u = (lon[k] + rot) / (Math.PI * 2); u -= Math.floor(u);
        const v = lat[k] / Math.PI + 0.5;
        const tx = (u * T.TW) | 0, ty = clamp((v * T.TH) | 0, 0, T.TH - 1), ti = ty * T.TW + tx;
        let cr = T.land[ti * 3], cg = T.land[ti * 3 + 1], cb = T.land[ti * 3 + 2];
        let cu = (lon[k] + crot) / (Math.PI * 2); cu -= Math.floor(cu);
        const cl = T.cloud[ty * T.TW + ((cu * T.TW) | 0)];
        if (cl) { const m = cl === 2 ? 0.92 : 0.6; cr = cr + (250 - cr) * m; cg = cg + (252 - cg) * m; cb = cb + (255 - cb) * m; }
        let l = light[k] + bayer(i, j) * 0.12;
        let shade = l > 0.55 ? 1 : l > 0.3 ? 0.86 : l > 0.08 ? 0.66 : l > -0.08 ? 0.38 : 0.14;
        let R = cr * shade, G = cg * shade, B = cb * shade;
        if (shade <= 0.14 && T.isLand[ti] && !cl && hash3(tx, ty, 3, 9) > 0.86) { R = 255; G = 210; B = 120; } // city lights
        // rim light
        const ed = Math.hypot(i - r, j - r) / r;
        if (ed > 0.9 && l > 0) { R += 40; G += 60; B += 80; }
        d[o] = R; d[o + 1] = G; d[o + 2] = B; d[o + 3] = 255;
      }
      this.earthCtx.putImageData(img, 0, 0);
      return this.earthCanvas;
    }
    setMode(m) { this.mode = m; }
    frame(dt, t) {
      this.t = t;
      const ctx = this.ctx, w = this.w, h = this.h;
      const rm = this.reduced;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#03040b'; ctx.fillRect(0, 0, w, h);
      if (this.shake > 0 && !rm) { ctx.translate(((Math.random() - 0.5) * this.shake) | 0, ((Math.random() - 0.5) * this.shake) | 0); }
      if (this.mode === 'landing') this.drawDrift(dt, t);
      else this.drawField(dt, t);
    }
    drawDrift(dt, t) {
      const ctx = this.ctx, w = this.w, h = this.h, rm = this.reduced;
      const base = (rm ? 2 : 7) * this.speed * (1 + this.boost * 40);
      const vx = Math.cos(this.angle) * base * dt, vy = Math.sin(this.angle) * base * dt;
      ctx.globalCompositeOperation = 'lighter';
      for (const g of this.galaxies) {
        g.x += vx * g.z; g.y += vy * g.z;
        const sw = g.s.width, sh = g.s.height;
        if (g.x < -sw) g.x += w + sw * 2; if (g.x > w + sw) g.x -= w + sw * 2;
        if (g.y < -sh) g.y += h + sh * 2; if (g.y > h + sh) g.y -= h + sh * 2;
        ctx.drawImage(g.s, Math.round(g.x - sw / 2), Math.round(g.y - sh / 2));
      }
      ctx.globalCompositeOperation = 'source-over';
      for (const s of this.stars) {
        s.x += vx * s.z; s.y += vy * s.z;
        if (s.x < 0) s.x += w; else if (s.x >= w) s.x -= w;
        if (s.y < 0) s.y += h; else if (s.y >= h) s.y -= h;
        const tw = rm ? 1 : 0.55 + 0.45 * Math.sin(t * 0.001 * s.ts + s.tw);
        ctx.globalAlpha = (0.35 + 0.65 * s.z) * tw;
        ctx.fillStyle = s.c;
        const x = s.x | 0, y = s.y | 0;
        if (this.boost > 0.05 && !rm) {
          const len = Math.min(40, this.boost * 60 * s.z);
          ctx.fillRect(x, y, 1, 1);
          ctx.strokeStyle = s.c; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 0.5, y + 0.5); ctx.lineTo(x + 0.5 - Math.cos(this.angle) * len, y + 0.5 - Math.sin(this.angle) * len); ctx.stroke();
        } else if (s.big) { ctx.fillRect(x - 1, y, 3, 1); ctx.fillRect(x, y - 1, 1, 3); }
        else ctx.fillRect(x, y, 1, 1);
      }
      ctx.globalAlpha = 1;
      // Earth
      this.earthRot += dt * (rm ? 0.01 : 0.03);
      const e = this.earth, ec = this.renderEarth();
      ctx.drawImage(ec, e.cx - e.r - 4, e.cy - e.r - 4);
      // Ship (stationary, centre, facing against the star drift)
      const sh = this.ship, k = this.shipScale, cx = Math.round(w / 2), cy = Math.round(h / 2);
      ctx.save();
      ctx.translate(cx, cy); ctx.rotate(this.angle + Math.PI);
      ctx.drawImage(sh, Math.round((-sh.width * k) / 2), Math.round((-sh.height * k) / 2), sh.width * k, sh.height * k);
      // engine flame
      const fl = rm ? 3 : 3 + Math.floor(Math.random() * 3) + Math.round(this.boost * 10);
      const ex = Math.round((-sh.width * k) / 2);
      ctx.fillStyle = '#ffd36b'; ctx.fillRect(ex - fl * k, -2 * k, fl * k, 5 * k);
      ctx.fillStyle = '#ff7b3a'; ctx.fillRect(ex - (fl + 2) * k, -1 * k, 2 * k, 3 * k);
      ctx.fillStyle = '#fff6d8'; ctx.fillRect(ex - Math.max(1, fl - 2) * k, -1 * k, Math.max(1, fl - 2) * k, 3 * k);
      ctx.restore();
    }
    // forward-looking star field, used for cockpit window + hyperspace
    drawField(dt, t) {
      const ctx = this.ctx, w = this.w, h = this.h, rm = this.reduced;
      this.cam.cy += (this.cam.cyT - this.cam.cy) * Math.min(1, dt * 4);
      this.warp += (this.warpT - this.warp) * Math.min(1, dt * (this.warpT > this.warp ? 1.6 : 3));
      const cx = w / 2, cy = h * this.cam.cy, f = Math.max(w, h) * 0.5;
      const v = rm ? 0.03 : 0.04 + this.warp * 2.6;
      // hyperspace tunnel tint
      if (this.warp > 0.2 && !rm) {
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.7);
        const a = Math.min(0.55, (this.warp - 0.2) * 0.6);
        g.addColorStop(0, `rgba(200,230,255,${a * 0.9})`); g.addColorStop(0.25, `rgba(60,110,220,${a * 0.5})`); g.addColorStop(1, 'rgba(5,10,40,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      }
      ctx.lineCap = 'square';
      for (let i = 0; i < this.field.length; i++) {
        const s = this.field[i];
        const z0 = s.z; s.z -= v * dt;
        if (s.z <= 0.01) { this.field[i] = this.newFieldStar(false); continue; }
        const x1 = cx + (s.x / s.z) * f, y1 = cy + (s.y / s.z) * f;
        if (x1 < -50 || x1 > w + 50 || y1 < -50 || y1 > h + 50) { this.field[i] = this.newFieldStar(false); continue; }
        const bright = clamp(1.2 - s.z, 0.15, 1);
        ctx.globalAlpha = bright;
        const stretch = rm ? 0 : this.warp;
        if (stretch > 0.05) {
          const zt = Math.min(1.2, z0 + stretch * 0.35);
          const x0 = cx + (s.x / zt) * f, y0 = cy + (s.y / zt) * f;
          ctx.strokeStyle = s.c; ctx.lineWidth = s.z < 0.3 ? 2 : 1;
          ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
        } else {
          ctx.fillStyle = s.c; const sz = s.z < 0.25 ? 2 : 1; ctx.fillRect(x1 | 0, y1 | 0, sz, sz);
        }
      }
      ctx.globalAlpha = 1;
      if (rm && this.warpT > 0.5) { // static streak frame for reduced motion
        ctx.strokeStyle = 'rgba(190,225,255,.7)';
        for (let i = 0; i < 80; i++) { const a = (i / 80) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * 20, cy + Math.sin(a) * 20); ctx.lineTo(cx + Math.cos(a) * w, cy + Math.sin(a) * w); ctx.stroke(); }
      }
    }
  }

  // ---------- star portrait for the MC screen ----------
  function drawStarPortrait(ctx, star, t, reduced) {
    const W = ctx.canvas.width, H = ctx.canvas.height, img = ctx.createImageData(W, H), d = img.data;
    const k0 = kelvinRGB(star.tempK), avg = (k0[0] + k0[1] + k0[2]) / 3;
    const base = k0.map((v) => clamp(avg + (v - avg) * 2.2, 0, 255)); // boost saturation so colours read on screen
    const r = clamp(H * 0.17 + H * 0.12 * Math.log10(star.radiusSol), H * 0.07, H * 0.45);
    const cx = W / 2, cy = H / 2, pulse = reduced ? 0 : Math.sin(t * 0.002) * 0.6;
    const R = r + pulse, cool = star.tempK < 4500, seed = star.name.length * 31;
    const tt = reduced ? 0 : t * 0.00025;
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const o = (j * W + i) * 4, dx = i + 0.5 - cx, dy = j + 0.5 - cy, dist = Math.sqrt(dx * dx + dy * dy);
      let c = [3, 5, 14], a = 255;
      if (hash3(i, j, 1, 5) > 0.993) c = [120, 130, 170];
      if (dist <= R) {
        const mu = Math.sqrt(1 - (dist / R) ** 2);
        let b = 0.45 + 0.55 * mu;                         // limb darkening
        const gran = fbm3(i * (cool ? 0.18 : 0.35), j * (cool ? 0.18 : 0.35), tt * (cool ? 1 : 3), seed, 3);
        b *= 0.78 + 0.45 * gran;
        if (cool && gran < 0.38) b *= 0.7;                // big convection cells / spots
        b += bayer(i, j) * 0.1;
        const q = Math.round(clamp(b, 0, 1.2) * 5) / 5;   // posterize -> pixel art bands
        const hot = mix(base, [255, 255, 255], 0.25);
        c = q >= 1 ? hot : mix(mix(base, [40, 10, 0], 0.55), base, clamp(q, 0, 1));
      } else {
        const g = Math.max(0, 1 - (dist - R) / (R * 0.7 + 4));
        const gq = Math.round((g * g + bayer(i, j) * 0.15) * 4) / 4;
        if (gq > 0) c = mix(c, base, gq * 0.55);
      }
      d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = a;
    }
    ctx.putImageData(img, 0, 0);
  }

  // ---------- small planet sprites for the map ----------
  function makePlanetSprite(theme, size) {
    const P = {
      asoma: { a: '#f6c6e0', b: '#c8b6ff', c: '#b8f0e0', ring: '#ffe4c2' },
      da: { a: '#3b2433', b: '#8a2f3b', c: '#d8a657', ring: null },
      basta: { a: '#4285f4', b: '#34a853', c: '#fbbc05', d: '#ea4335', ring: '#9ad0ff' },
      carter: { a: '#2f8f4e', b: '#7cc66b', c: '#3a7bd5', ring: null },
      peer: { a: '#0f3b4f', b: '#1fb5a8', c: '#7af7e0', ring: '#5fd3ff' },
      justice: { a: '#1a1d4a', b: '#3b5bdb', c: '#7af0ff', ring: '#c49aff' }
    }[theme];
    const c = makeCanvas(size, size), x = c.getContext('2d'), img = x.createImageData(size, size), d = img.data;
    const r = size * (P.ring ? 0.32 : 0.4), cx = size / 2, cy = size / 2, seed = theme.length * 101 + theme.charCodeAt(0);
    const L = [-0.6, -0.5, 0.62];
    const cols = [P.a, P.b, P.c, P.d].filter(Boolean).map(hexToRgb);
    for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
      const nx = (i + 0.5 - cx) / r, ny = (j + 0.5 - cy) / r, d2 = nx * nx + ny * ny, o = (j * size + i) * 4;
      if (d2 <= 1) {
        const nz = Math.sqrt(1 - d2);
        let n = fbm3(nx * 2 + 3, ny * (theme === 'basta' || theme === 'asoma' ? 5 : 2) + 3, nz * 2, seed, 4);
        if (theme === 'peer' || theme === 'justice') n = (n + (hash3(i, j, 2, seed) > 0.93 ? 0.4 : 0));
        const idx = clamp(Math.floor(n * cols.length * 1.15 - 0.2), 0, cols.length - 1);
        let col = cols[idx];
        const l = nx * L[0] + ny * L[1] + nz * L[2] + bayer(i, j) * 0.15;
        const sh = l > 0.5 ? 1.1 : l > 0.15 ? 0.85 : l > -0.15 ? 0.55 : 0.3;
        d[o] = clamp(col[0] * sh, 0, 255); d[o + 1] = clamp(col[1] * sh, 0, 255); d[o + 2] = clamp(col[2] * sh, 0, 255); d[o + 3] = 255;
      }
    }
    x.putImageData(img, 0, 0);
    if (P.ring) {
      // ring: back half drawn behind would need layering; draw thin ellipse over with gap at planet front
      x.fillStyle = P.ring;
      for (let a = 0; a < Math.PI * 2; a += 0.02) {
        const rx = Math.cos(a) * r * 1.65, ry = Math.sin(a) * r * 0.42;
        const px = Math.round(cx + rx), py = Math.round(cy + ry - rx * 0.18);
        const behind = Math.sin(a) < 0 && Math.hypot(px - cx, py - cy) < r;
        if (!behind) x.fillRect(px, py, 1, 1);
      }
    }
    return c;
  }

  window.PX = { mulberry32, hash3, noise3, fbm3, hexToRgb, clamp, lerp, mix, rgb, kelvinRGB, bayer, makeCanvas, spriteFrom, Space, drawStarPortrait, makePlanetSprite };
})();

/* Pixel-art planet landscapes for Page 4. Each theme paints a static
   layer once (per resize) and a light animated layer every frame. */
(function () {
  'use strict';
  const { mulberry32, hash3, fbm3, hexToRgb, clamp, mix, rgb, bayer, makeCanvas } = window.PX;

  // ---------- drawing helpers ----------
  function sky(ctx, w, h, stops, bands) {
    const img = ctx.createImageData(w, h), d = img.data, cs = stops.map((s) => [s[0], hexToRgb(s[1])]);
    const colAt = (t) => {
      for (let i = 0; i < cs.length - 1; i++) if (t <= cs[i + 1][0]) return mix(cs[i][1], cs[i + 1][1], (t - cs[i][0]) / (cs[i + 1][0] - cs[i][0] || 1));
      return cs[cs.length - 1][1];
    };
    bands = bands || 14;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const t = clamp(Math.floor((y / h) * bands + bayer(x, y) + 0.5) / bands, 0, 1);
      const c = colAt(t), o = (y * w + x) * 4;
      d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }
  function starsIn(ctx, w, h, rng, n, maxY, cols) {
    for (let i = 0; i < n; i++) { ctx.fillStyle = cols[(rng() * cols.length) | 0]; ctx.globalAlpha = 0.4 + rng() * 0.6; ctx.fillRect((rng() * w) | 0, (rng() * h * maxY) | 0, 1, 1); }
    ctx.globalAlpha = 1;
  }
  function ridge(ctx, w, h, baseY, amp, scale, color, seed, oct, flat) {
    ctx.fillStyle = color;
    for (let x = 0; x < w; x++) {
      let n = fbm3(x * scale, 0.5, 0.5, seed, oct || 4);
      if (flat) n = n > flat ? flat + (n - flat) * 0.1 : n * 0.6;  // mesa-like plateaus
      const y = Math.round(baseY - n * amp);
      ctx.fillRect(x, y, 1, h - y);
    }
  }
  function disc(ctx, cx, cy, r, c1, c2, lx, ly) {
    const a = hexToRgb(c1), b = hexToRgb(c2);
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
      if (x * x + y * y > r * r) continue;
      const l = clamp(0.5 + ((x * lx + y * ly) / r) * 0.6 + bayer(x + 99, y + 99) * 0.25, 0, 1);
      ctx.fillStyle = rgb(mix(b, a, Math.round(l * 4) / 4)); ctx.fillRect(cx + x, cy + y, 1, 1);
    }
  }
  function glow(ctx, cx, cy, r, color, a) {
    const c = hexToRgb(color);
    for (let i = 4; i >= 1; i--) { ctx.fillStyle = rgb(c, (a || 0.12) * (5 - i) / 4); ctx.beginPath(); ctx.arc(cx, cy, r * (1 + i * 0.35), 0, 7); ctx.fill(); }
  }
  function column(ctx, x, top, bot, wd, body, hi, lo) {
    ctx.fillStyle = body; ctx.fillRect(x, top + 3, wd, bot - top - 6);
    ctx.fillStyle = hi; ctx.fillRect(x + 1, top + 3, 1, bot - top - 6);
    ctx.fillStyle = lo; ctx.fillRect(x + wd - 2, top + 3, 1, bot - top - 6);
    for (let f = x + 3; f < x + wd - 3; f += 3) { ctx.fillStyle = lo; ctx.fillRect(f, top + 4, 1, bot - top - 8); }
    ctx.fillStyle = body; ctx.fillRect(x - 2, top, wd + 4, 3); ctx.fillRect(x - 2, bot - 3, wd + 4, 3);
    ctx.fillStyle = hi; ctx.fillRect(x - 2, top, wd + 4, 1); ctx.fillRect(x - 2, bot - 3, wd + 4, 1);
  }
  function pediment(ctx, x0, x1, base, height, fill, edge) {
    const mid = (x0 + x1) / 2, half = (x1 - x0) / 2;
    for (let y = 0; y < height; y++) {
      const span = Math.round(half * (1 - y / height));
      ctx.fillStyle = fill; ctx.fillRect(Math.round(mid - span), base - y, span * 2, 1);
      if (edge) { ctx.fillStyle = edge; ctx.fillRect(Math.round(mid - span), base - y, 1, 1); ctx.fillRect(Math.round(mid + span) - 1, base - y, 1, 1); }
    }
    if (edge) { ctx.fillStyle = edge; ctx.fillRect(x0, base, x1 - x0, 1); }
  }
  function tower(ctx, rng, x, top, bot, wd, body, win, density) {
    ctx.fillStyle = body; ctx.fillRect(x, top, wd, bot - top);
    const wins = [];
    for (let y = top + 3; y < bot - 2; y += 3) for (let xx = x + 2; xx < x + wd - 2; xx += 3) if (rng() < density) { ctx.fillStyle = win; ctx.fillRect(xx, y, 1, 1); wins.push([xx, y]); }
    return wins;
  }

  // ---------- themes ----------
  const THEMES = {
    asoma: {
      build(ctx, w, h, rng, st) {
        sky(ctx, w, h, [[0, '#a99ce0'], [0.35, '#d7b4e6'], [0.6, '#f6c9d6'], [0.75, '#ffe0c6'], [1, '#ffe9d4']]);
        starsIn(ctx, w, h, rng, 60, 0.3, ['#ffffff', '#fff0fb']);
        const pr = Math.round(Math.min(w, h) * 0.13), px = Math.round(w * 0.74), py = Math.round(h * 0.22);
        glow(ctx, px, py, pr, '#fff0ff', 0.08);
        disc(ctx, px, py, pr, '#fff3fb', '#c9a6e8', -0.6, -0.6);
        ctx.strokeStyle = '#fff1d8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(px, py, pr * 1.9, pr * 0.38, -0.25, 0.15, Math.PI - 0.15, false); ctx.stroke();
        ridge(ctx, w, h, h * 0.6, h * 0.16, 0.012, '#c4b2e4', 11, 3);
        ridge(ctx, w, h, h * 0.66, h * 0.08, 0.02, '#b3d8d6', 12, 3);
        // lake
        st.lakeTop = Math.round(h * 0.68); st.lakeBot = Math.round(h * 0.8);
        for (let y = st.lakeTop; y < st.lakeBot; y++) { const t = (y - st.lakeTop) / (st.lakeBot - st.lakeTop); ctx.fillStyle = rgb(mix(hexToRgb('#e9d6f2'), hexToRgb('#c3e3ee'), t)); ctx.fillRect(0, y, w, 1); }
        ridge(ctx, w, h, h * 0.86, h * 0.07, 0.015, '#9fd6c4', 13, 3);
        ridge(ctx, w, h, h * 0.95, h * 0.05, 0.02, '#86c7b0', 14, 3);
        // dome pods
        for (let i = 0; i < 5; i++) {
          const dx = Math.round(w * (0.08 + i * 0.2 + rng() * 0.05)), dy = Math.round(h * (0.84 + rng() * 0.04)), r = 6 + ((rng() * 5) | 0);
          ctx.fillStyle = '#fff6fb'; ctx.beginPath(); ctx.arc(dx, dy, r, Math.PI, 0); ctx.fill();
          ctx.fillStyle = '#d7c4f2'; ctx.fillRect(dx - r, dy, r * 2, 1);
          ctx.fillStyle = '#ffd6a8'; ctx.fillRect(dx - 1, dy - Math.round(r / 2), 3, 2);
        }
        // flowers
        const fc = ['#ffb3d1', '#ffe3a3', '#c8b6ff', '#ffffff'];
        for (let i = 0; i < 160; i++) { ctx.fillStyle = fc[i % 4]; ctx.fillRect((rng() * w) | 0, (h * (0.9 + rng() * 0.1)) | 0, 1, 1); }
        st.orbs = Array.from({ length: 16 }, () => ({ x: rng() * w, y: h * (0.3 + rng() * 0.6), s: 3 + rng() * 6, p: rng() * 6, c: fc[(rng() * 3) | 0] }));
      },
      tick(ctx, w, h, t, dt, st, rm) {
        // lake shimmer
        for (let i = 0; i < 26; i++) {
          const y = st.lakeTop + 2 + ((i * 7) % (st.lakeBot - st.lakeTop - 3));
          const x = ((i * 97 + t * 0.006 * (i % 2 ? 1 : -1)) % (w + 40) + w + 40) % (w + 40) - 20;
          ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(Math.round(x), y, 6 + (i % 3) * 4, 1);
        }
        for (const o of st.orbs) {
          if (!rm) { o.y -= o.s * dt; if (o.y < -10) { o.y = h * 0.95; } }
          const x = Math.round(o.x + Math.sin(t * 0.0008 + o.p) * 6), y = Math.round(o.y);
          ctx.fillStyle = 'rgba(255,240,250,.25)'; ctx.fillRect(x - 2, y - 2, 5, 5);
          ctx.fillStyle = o.c; ctx.fillRect(x - 1, y - 1, 3, 3); ctx.fillStyle = '#fff'; ctx.fillRect(x, y, 1, 1);
        }
      }
    },

    da: {
      build(ctx, w, h, rng, st) {
        sky(ctx, w, h, [[0, '#07050c'], [0.35, '#1d0b1c'], [0.62, '#4f1626'], [0.8, '#8c2e2c'], [1, '#c45a35']]);
        starsIn(ctx, w, h, rng, 90, 0.4, ['#ffe9d0', '#ffffff']);
        const mr = Math.round(Math.min(w, h) * 0.09);
        glow(ctx, w * 0.2, h * 0.2, mr, '#f2d9b0', 0.06);
        disc(ctx, Math.round(w * 0.2), Math.round(h * 0.2), mr, '#f2e1c0', '#9d7f66', -0.7, -0.4);
        for (let i = 0; i < 6; i++) { ctx.fillStyle = 'rgba(120,90,70,.5)'; ctx.fillRect(Math.round(w * 0.2 + (rng() - 0.5) * mr), Math.round(h * 0.2 + (rng() - 0.5) * mr), 2 + ((rng() * 3) | 0), 2); }
        // distant tall dark towers
        st.wins = [];
        const horizon = Math.round(h * 0.7);
        for (let x = -4; x < w; ) {
          const wd = 10 + ((rng() * 18) | 0), top = Math.round(h * (0.12 + rng() * 0.35));
          st.wins.push(...tower(ctx, rng, x, top, horizon, wd, rng() < 0.5 ? '#150c14' : '#1c1018', '#ffb35c', 0.12));
          if (rng() < 0.4) { ctx.fillStyle = '#150c14'; ctx.fillRect(x + (wd >> 1), top - 10, 1, 10); pediment(ctx, x, x + wd, top, 5, '#1c1018'); }
          x += wd + ((rng() * 4) | 0);
        }
        // plaza
        ctx.fillStyle = '#1b1114'; ctx.fillRect(0, horizon, w, h - horizon);
        for (let y = horizon + 4; y < h; y += 6) { ctx.fillStyle = '#24171a'; ctx.fillRect(0, y, w, 1); }
        // temple
        const tw = Math.round(Math.min(w * 0.46, 300)), tx = Math.round(w * st.fx - tw / 2), base = Math.round(h * 0.78), colTop = Math.round(h * 0.47);
        for (let s = 0; s < 4; s++) { ctx.fillStyle = s % 2 ? '#4a3434' : '#3d2b2c'; ctx.fillRect(tx - 10 - s * 6, base + s * 3, tw + 20 + s * 12, 3); }
        ctx.fillStyle = '#2a1c1f'; ctx.fillRect(tx, colTop, tw, base - colTop);
        const n = 8, cw = Math.max(6, Math.round(tw / (n * 1.9)));
        for (let i = 0; i < n; i++) column(ctx, Math.round(tx + 4 + (i * (tw - cw - 8)) / (n - 1)), colTop, base, cw, '#5a4240', '#a07a62', '#2e2023');
        ctx.fillStyle = '#4a3434'; ctx.fillRect(tx - 6, colTop - 6, tw + 12, 6);
        ctx.fillStyle = '#a07a62'; ctx.fillRect(tx - 6, colTop - 6, tw + 12, 1);
        pediment(ctx, tx - 8, tx + tw + 8, colTop - 7, Math.round(tw * 0.16), '#3e2c2d', '#a07a62');
        // inscription band (Latin feel)
        ctx.fillStyle = '#d8a657'; ctx.font = '6px monospace'; ctx.textAlign = 'center';
        ctx.fillText('FIAT IVSTITIA', tx + tw / 2, colTop - 1);
        st.torches = [[tx - 14, base - 2], [tx + tw + 12, base - 2]];
        for (const [x, y] of st.torches) { ctx.fillStyle = '#3a2a24'; ctx.fillRect(x, y - 16, 2, 16); }
        // foreground giant columns
        const fw = Math.round(w * 0.07);
        column(ctx, -fw * 0.3, -6, h + 6, fw, '#120b0e', '#3c2a2a', '#07040a');
        column(ctx, w - fw * 0.7, -6, h + 6, fw, '#120b0e', '#3c2a2a', '#07040a');
        st.embers = Array.from({ length: 24 }, () => ({ x: rng() * w, y: rng() * h, v: 4 + rng() * 8 }));
      },
      tick(ctx, w, h, t, dt, st, rm) {
        for (let i = 0; i < st.wins.length; i += 7) { if (hash3(i, Math.floor(t / 900), 1, 3) > 0.7) { ctx.fillStyle = '#ffd38a'; ctx.fillRect(st.wins[i][0], st.wins[i][1], 1, 1); } }
        for (const [x, y] of st.torches) {
          const f = rm ? 2 : (Math.random() * 3) | 0;
          ctx.fillStyle = '#ff7a2a'; ctx.fillRect(x - 1, y - 20 - f, 4, 4 + f);
          ctx.fillStyle = '#ffd36b'; ctx.fillRect(x, y - 19 - f, 2, 2 + f);
          ctx.fillStyle = 'rgba(255,140,60,.15)'; ctx.fillRect(x - 5, y - 26, 12, 12);
        }
        if (!rm) for (const e of st.embers) { e.y -= e.v * dt; e.x += Math.sin(t * 0.001 + e.v) * 0.2; if (e.y < 0) { e.y = h; } ctx.fillStyle = 'rgba(255,160,90,.7)'; ctx.fillRect(e.x | 0, e.y | 0, 1, 1); }
      }
    },

    basta: {
      build(ctx, w, h, rng, st) {
        sky(ctx, w, h, [[0, '#04051a'], [0.45, '#0f1446'], [0.62, '#2a1d6a'], [1, '#05051a']]);
        starsIn(ctx, w, h, rng, 140, 0.55, ['#ffffff', '#9ad0ff', '#ffe08a']);
        st.horizon = Math.round(h * 0.62);
        const cols = ['#4285f4', '#ea4335', '#fbbc05', '#34a853'];
        st.antennas = [];
        for (let x = 0; x < w; ) {
          const wd = 8 + ((rng() * 16) | 0), top = Math.round(st.horizon - h * (0.08 + rng() * 0.32)), c = cols[(rng() * 4) | 0];
          const body = rgb(mix(hexToRgb(c), [8, 10, 30], 0.72));
          tower(ctx, rng, x, top, st.horizon, wd, body, c, 0.35);
          ctx.fillStyle = c; ctx.fillRect(x, top, wd, 1);
          if (rng() < 0.35) { ctx.fillStyle = body; ctx.fillRect(x + (wd >> 1), top - 8, 1, 8); st.antennas.push([x + (wd >> 1), top - 9, c]); }
          x += wd + 2 + ((rng() * 5) | 0);
        }
        ctx.fillStyle = '#06061a'; ctx.fillRect(0, st.horizon, w, h - st.horizon);
        // sun-ish neon disc behind skyline
        st.parts = Array.from({ length: 40 }, () => ({ x: rng() * w, y: st.horizon - rng() * h * 0.5, v: 6 + rng() * 14, c: cols[(rng() * 4) | 0] }));
        st.cubes = cols.map((c, i) => ({ c, x: w * (0.2 + i * 0.2), y: h * (0.18 + (i % 2) * 0.08), p: i * 1.3 }));
      },
      tick(ctx, w, h, t, dt, st, rm) {
        const hz = st.horizon, cx = w / 2, off = rm ? 0 : (t * 0.00035) % 1;
        ctx.strokeStyle = 'rgba(66,133,244,.75)'; ctx.lineWidth = 1;
        for (let i = 0; i < 14; i++) { const z = (i + off) / 14, y = Math.round(hz + (h - hz) * z * z); ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(w, y + 0.5); ctx.stroke(); }
        for (let i = -16; i <= 16; i++) { ctx.beginPath(); ctx.moveTo(cx + i * 6, hz); ctx.lineTo(cx + i * w * 0.12, h); ctx.stroke(); }
        for (const a of st.antennas) if (rm || Math.floor(t / 500 + a[0]) % 3 === 0) { ctx.fillStyle = a[2]; ctx.fillRect(a[0] - 1, a[1] - 1, 3, 3); }
        for (const p of st.parts) { if (!rm) { p.y -= p.v * dt; if (p.y < 0) p.y = hz; } ctx.fillStyle = p.c; ctx.globalAlpha = 0.8; ctx.fillRect(p.x | 0, p.y | 0, 1, 2); }
        ctx.globalAlpha = 1;
        for (const c of st.cubes) {
          const y = Math.round(c.y + (rm ? 0 : Math.sin(t * 0.0015 + c.p) * 4)), s = 7;
          ctx.fillStyle = c.c; ctx.fillRect(Math.round(c.x) - s, y - s, s * 2, s * 2);
          ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(Math.round(c.x) - s, y - s, s * 2, 2); ctx.fillRect(Math.round(c.x) - s, y - s, 2, s * 2);
          ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(Math.round(c.x) - s, y + s - 2, s * 2, 2);
        }
      }
    },

    carter: {
      build(ctx, w, h, rng, st) {
        sky(ctx, w, h, [[0, '#4f9be0'], [0.4, '#9fd2ef'], [0.6, '#ffe6a8'], [0.72, '#ffc27a'], [1, '#ffb070']]);
        const sx = Math.round(w * 0.32), sy = Math.round(h * 0.62), sr = Math.round(Math.min(w, h) * 0.1);
        glow(ctx, sx, sy, sr, '#fff1b0', 0.14);
        disc(ctx, sx, sy, sr, '#fffbe0', '#ffd27a', -0.2, -0.6);
        ridge(ctx, w, h, h * 0.66, h * 0.1, 0.01, '#7db886', 21, 3);
        ridge(ctx, w, h, h * 0.74, h * 0.1, 0.014, '#5aa267', 22, 3);
        // river
        ctx.fillStyle = '#4aa3df';
        for (let y = Math.round(h * 0.7); y < h; y++) {
          const t = (y - h * 0.7) / (h * 0.3), cxr = w * 0.62 + Math.sin(t * 5) * w * 0.08 * t, half = 2 + t * w * 0.07;
          ctx.fillRect(Math.round(cxr - half), y, Math.round(half * 2), 1);
        }
        st.river = true;
        ridge(ctx, w, h, h * 0.86, h * 0.06, 0.02, '#3f8a4c', 23, 3);
        // trees
        for (let i = 0; i < 46; i++) {
          const x = (rng() * w) | 0, y = Math.round(h * (0.72 + rng() * 0.24)), r = 2 + ((rng() * 4) | 0);
          if (Math.abs(x - (w * 0.62 + Math.sin(((y - h * 0.7) / (h * 0.3)) * 5) * w * 0.08 * ((y - h * 0.7) / (h * 0.3)))) < 14) continue;
          ctx.fillStyle = '#5a3d22'; ctx.fillRect(x, y, 1, r + 1);
          ctx.fillStyle = '#2f7a3a'; ctx.beginPath(); ctx.arc(x, y - r + 1, r, 0, 7); ctx.fill();
          ctx.fillStyle = '#58b05a'; ctx.fillRect(x - 1, y - r - 1, 2, 2);
        }
        // huts
        for (let i = 0; i < 6; i++) {
          const x = Math.round(w * (0.08 + rng() * 0.4)), y = Math.round(h * (0.78 + rng() * 0.12));
          ctx.fillStyle = '#d9b27c'; ctx.fillRect(x, y - 6, 10, 6);
          ctx.fillStyle = '#8a5a2e'; for (let k = 0; k < 5; k++) ctx.fillRect(x - 1 + k, y - 7 - k, 12 - k * 2, 1);
          ctx.fillStyle = '#5a3a1e'; ctx.fillRect(x + 4, y - 3, 2, 3);
        }
        st.clouds = Array.from({ length: 6 }, () => ({ x: rng() * w, y: h * (0.06 + rng() * 0.3), s: 6 + ((rng() * 10) | 0), v: 2 + rng() * 4 }));
        st.birds = Array.from({ length: 7 }, (_, i) => ({ x: rng() * w, y: h * (0.2 + rng() * 0.25), v: 10 + rng() * 8, p: i }));
      },
      tick(ctx, w, h, t, dt, st, rm) {
        for (const c of st.clouds) {
          if (!rm) { c.x += c.v * dt; if (c.x > w + 40) c.x = -40; }
          const x = Math.round(c.x), y = Math.round(c.y);
          ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fillRect(x, y, c.s * 3, 3); ctx.fillRect(x + 3, y - 2, c.s * 2, 2); ctx.fillRect(x + c.s, y - 4, c.s, 2);
        }
        ctx.fillStyle = '#2a2a2a';
        for (const b of st.birds) {
          if (!rm) { b.x += b.v * dt; if (b.x > w + 10) b.x = -10; }
          const up = rm ? 0 : Math.floor(t / 220 + b.p) % 2, x = Math.round(b.x), y = Math.round(b.y);
          ctx.fillRect(x, y, 1, 1); ctx.fillRect(x - 1, y - up, 1, 1); ctx.fillRect(x + 1, y - up, 1, 1); ctx.fillRect(x - 2, y - up * 2 + (1 - up), 1, 1); ctx.fillRect(x + 2, y - up * 2 + (1 - up), 1, 1);
        }
        for (let i = 0; i < 18; i++) { // river sparkle
          const yy = Math.round(h * 0.72 + ((i * 37 + Math.floor(t / 300) * 13) % (h * 0.27)));
          const tt = (yy - h * 0.7) / (h * 0.3), cxr = w * 0.62 + Math.sin(tt * 5) * w * 0.08 * tt;
          ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(Math.round(cxr + ((i * 13) % 9) - 4), yy, 2, 1);
        }
      }
    },

    peer: {
      build(ctx, w, h, rng, st) {
        sky(ctx, w, h, [[0, '#020812'], [0.5, '#082436'], [0.8, '#0c4048'], [1, '#0f4a52']]);
        starsIn(ctx, w, h, rng, 120, 0.7, ['#ffffff', '#7af7e0']);
        // network nodes
        st.nodes = Array.from({ length: 16 }, () => ({ x: Math.round(w * (0.05 + rng() * 0.9)), y: Math.round(h * (0.08 + rng() * 0.45)), p: rng() * 6 }));
        st.edges = [];
        st.nodes.forEach((a, i) => {
          const near = st.nodes.map((b, j) => [Math.hypot(a.x - b.x, a.y - b.y), j]).filter((e) => e[1] !== i).sort((p, q) => p[0] - q[0]).slice(0, 2);
          near.forEach(([, j]) => { if (!st.edges.some((e) => (e[0] === j && e[1] === i))) st.edges.push([i, j, rng()]); });
        });
        ctx.strokeStyle = 'rgba(95,211,255,.28)'; ctx.lineWidth = 1;
        for (const [i, j] of st.edges) { ctx.beginPath(); ctx.moveTo(st.nodes[i].x + 0.5, st.nodes[i].y + 0.5); ctx.lineTo(st.nodes[j].x + 0.5, st.nodes[j].y + 0.5); ctx.stroke(); }
        ridge(ctx, w, h, h * 0.78, h * 0.22, 0.008, '#0b2530', 31, 4, 0.55);
        ridge(ctx, w, h, h * 0.9, h * 0.14, 0.012, '#08191f', 32, 4, 0.5);
        // towers
        st.towers = [];
        for (let i = 0; i < 6; i++) {
          const x = Math.round(w * (0.08 + i * 0.16 + rng() * 0.04)), top = Math.round(h * (0.55 + rng() * 0.12));
          ctx.fillStyle = '#0d2c36'; ctx.fillRect(x, top, 2, h - top);
          ctx.fillStyle = '#1fb5a8'; ctx.fillRect(x - 2, top, 6, 1); ctx.fillRect(x - 1, top + 6, 4, 1);
          st.towers.push([x + 1, top - 1]);
        }
        for (let i = 0; i < 120; i++) { ctx.fillStyle = 'rgba(122,247,224,.5)'; ctx.fillRect((rng() * w) | 0, (h * (0.86 + rng() * 0.14)) | 0, 1, 1); }
      },
      tick(ctx, w, h, t, dt, st, rm) {
        const tt = t * 0.0004;
        for (const [i, j, ph] of st.edges) {
          const a = st.nodes[i], b = st.nodes[j], k = rm ? 0.5 : (tt + ph) % 1;
          ctx.fillStyle = '#c8fff4'; ctx.fillRect(Math.round(a.x + (b.x - a.x) * k), Math.round(a.y + (b.y - a.y) * k), 2, 2);
        }
        for (const n of st.nodes) {
          const s = rm ? 1 : Math.sin(t * 0.003 + n.p) > 0.3 ? 2 : 1;
          ctx.fillStyle = 'rgba(95,211,255,.25)'; ctx.fillRect(n.x - 2 - s, n.y - 2 - s, 5 + s * 2, 5 + s * 2);
          ctx.fillStyle = '#7af7e0'; ctx.fillRect(n.x - 1, n.y - 1, 3, 3);
        }
        st.towers.forEach(([x, y], i) => {
          if (!rm && Math.floor(t / 700 + i) % 4 === 0) return;
          const n = st.nodes.reduce((best, m) => (Math.hypot(m.x - x, m.y - y) < Math.hypot(best.x - x, best.y - y) ? m : best), st.nodes[0]);
          ctx.strokeStyle = 'rgba(122,247,224,.35)'; ctx.beginPath(); ctx.moveTo(x + 0.5, y); ctx.lineTo(n.x + 0.5, n.y + 0.5); ctx.stroke();
          ctx.fillStyle = '#7af7e0'; ctx.fillRect(x - 1, y - 1, 3, 2);
        });
      }
    },

    justice: {
      build(ctx, w, h, rng, st) {
        sky(ctx, w, h, [[0, '#04020d'], [0.4, '#130833'], [0.7, '#2a1060'], [1, '#3a1a70']]);
        starsIn(ctx, w, h, rng, 120, 0.5, ['#ffffff', '#c49aff', '#7af0ff']);
        const horizon = Math.round(h * 0.76);
        const tw = Math.round(Math.min(w * 0.44, 290)), tx = Math.round(w * st.fx - tw / 2), mid = tx + tw / 2;
        // side skyline
        for (let x = 0; x < w; ) {
          const wd = 8 + ((rng() * 14) | 0), top = Math.round(h * (0.25 + rng() * 0.35));
          if (x + wd > tx - 24 && x < tx + tw + 24) { x += wd; continue; }
          tower(ctx, rng, x, top, horizon, wd, '#0e0c2a', rng() < 0.5 ? '#7af0ff' : '#ff6ad5', 0.18);
          ctx.fillStyle = rng() < 0.5 ? '#7af0ff' : '#c49aff'; ctx.fillRect(x, top, 1, horizon - top);
          x += wd + 2;
        }
        // plaza
        ctx.fillStyle = '#090820'; ctx.fillRect(0, horizon, w, h - horizon);
        ctx.strokeStyle = 'rgba(122,240,255,.35)';
        for (let i = -14; i <= 14; i++) { ctx.beginPath(); ctx.moveTo(mid + i * 10, horizon); ctx.lineTo(mid + i * w * 0.1, h); ctx.stroke(); }
        // courthouse
        const base = horizon, colTop = Math.round(h * 0.42);
        for (let s = 0; s < 5; s++) { ctx.fillStyle = s % 2 ? '#1d1f4a' : '#171a3e'; ctx.fillRect(tx - 6 - s * 6, base - 15 + s * 3, tw + 12 + s * 12, 3); ctx.fillStyle = 'rgba(122,240,255,.5)'; ctx.fillRect(tx - 6 - s * 6, base - 15 + s * 3, tw + 12 + s * 12, 1); }
        ctx.fillStyle = '#121433'; ctx.fillRect(tx, colTop, tw, base - 15 - colTop);
        const n = 6, cw = Math.max(7, Math.round(tw / 11));
        for (let i = 0; i < n; i++) column(ctx, Math.round(tx + 6 + (i * (tw - cw - 12)) / (n - 1)), colTop, base - 15, cw, '#262a5e', '#7af0ff', '#14163a');
        ctx.fillStyle = '#1d1f4a'; ctx.fillRect(tx - 6, colTop - 6, tw + 12, 6);
        ctx.fillStyle = '#7af0ff'; ctx.fillRect(tx - 6, colTop - 6, tw + 12, 1);
        st.pedTop = colTop - 7 - Math.round(tw * 0.18);
        pediment(ctx, tx - 8, tx + tw + 8, colTop - 7, Math.round(tw * 0.18), '#1a1c48', '#7af0ff');
        st.cx = Math.round(mid);
        st.cars = Array.from({ length: 6 }, (_, i) => ({ x: rng() * w, y: h * (0.15 + rng() * 0.3), v: (rng() < 0.5 ? -1 : 1) * (30 + rng() * 40), c: i % 2 ? '#ff6ad5' : '#7af0ff' }));
      },
      tick(ctx, w, h, t, dt, st, rm) {
        // aurora
        for (let x = 0; x < w; x += 2) {
          const y = Math.round(h * 0.12 + Math.sin(x * 0.02 + (rm ? 0 : t * 0.0006)) * 8 + Math.sin(x * 0.007) * 10);
          ctx.fillStyle = 'rgba(122,240,255,.10)'; ctx.fillRect(x, y, 2, 14);
          ctx.fillStyle = 'rgba(196,154,255,.10)'; ctx.fillRect(x, y + 10, 2, 10);
        }
        for (const c of st.cars) {
          if (!rm) { c.x += c.v * dt; if (c.x > w + 20) c.x = -20; if (c.x < -20) c.x = w + 20; }
          ctx.fillStyle = c.c; ctx.fillRect(Math.round(c.x), Math.round(c.y), 3, 1);
          ctx.fillStyle = c.c === '#7af0ff' ? 'rgba(122,240,255,.3)' : 'rgba(255,106,213,.3)';
          ctx.fillRect(Math.round(c.x - Math.sign(c.v) * 10), Math.round(c.y), 10, 1);
        }
        // holographic scales of justice
        const cx = st.cx, cy = Math.round(st.pedTop - 26 + (rm ? 0 : Math.sin(t * 0.0015) * 3)), tilt = rm ? 0 : Math.round(Math.sin(t * 0.001) * 3);
        const on = rm || Math.floor(t / 90) % 23 !== 0;
        if (on) {
          ctx.fillStyle = 'rgba(122,240,255,.12)'; ctx.fillRect(cx - 30, cy - 14, 60, 40);
          ctx.fillStyle = '#7af0ff';
          ctx.fillRect(cx, cy - 10, 1, 30); ctx.fillRect(cx - 6, cy + 20, 13, 1);
          for (let i = -22; i <= 22; i++) ctx.fillRect(cx + i, cy - 6 + Math.round((i / 22) * tilt), 1, 1);
          for (const side of [-1, 1]) {
            const ax = cx + side * 22, ay = cy - 6 + side * tilt;
            ctx.fillRect(ax - 4 * 1, ay, 1, 8); ctx.fillRect(ax + 4, ay, 1, 8);
            ctx.fillRect(ax - 7, ay + 8, 15, 1); ctx.fillRect(ax - 5, ay + 9, 11, 1);
          }
          ctx.fillStyle = 'rgba(4,2,13,.35)'; for (let y = cy - 14; y < cy + 26; y += 2) ctx.fillRect(cx - 30, y, 60, 1);
        }
      }
    }
  };

  class PlanetScene {
    constructor(canvas) { this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.theme = null; this.reduced = false; window.addEventListener('resize', () => this.theme && this.build()); }
    set(theme) { this.theme = theme; this.build(); }
    build() {
      const W = window.innerWidth, H = window.innerHeight, PXs = W < 700 ? 2 : 3;
      this.w = Math.ceil(W / PXs); this.h = Math.ceil(H / PXs);
      this.canvas.width = this.w; this.canvas.height = this.h;
      this.layer = makeCanvas(this.w, this.h);
      const lc = this.layer.getContext('2d'); lc.imageSmoothingEnabled = false;
      this.st = { fx: W >= 900 && W > H ? 0.36 : 0.5 };
      THEMES[this.theme].build(lc, this.w, this.h, mulberry32(this.theme.length * 7919 + 17), this.st);
    }
    frame(dt, t) {
      if (!this.theme) return;
      const ctx = this.ctx; ctx.imageSmoothingEnabled = false;
      ctx.drawImage(this.layer, 0, 0);
      THEMES[this.theme].tick(ctx, this.w, this.h, t, dt, this.st, this.reduced);
    }
  }
  window.PlanetScene = PlanetScene;
})();

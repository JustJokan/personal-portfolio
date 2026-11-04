/* Screen flow: Landing -> Mission Control -> hyperspace -> planet map -> planet. */
(function () {
  'use strict';
  const D = window.PORTFOLIO, STARS = window.STARS;
  const $ = (s) => document.querySelector(s);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  let REDUCED = mq.matches;

  const space = new window.PX.Space($('#space'));
  const scene = new window.PlanetScene($('#planetCanvas'));
  const applyMotion = () => { space.reduced = REDUCED; scene.reduced = REDUCED; document.documentElement.classList.toggle('reduced', REDUCED); };
  applyMotion();
  (mq.addEventListener ? mq.addEventListener.bind(mq, 'change') : mq.addListener.bind(mq))((e) => { REDUCED = e.matches; applyMotion(); });

  const screens = { landing: $('#landing'), mc: $('#mc'), planet: $('#planet') };
  const fader = $('#fader'), flash = $('#flash'), consoleEl = $('#console');
  const state = { screen: 'landing', mcMode: 'star', dest: null, busy: false, starIdx: 0, starT: 0, paused: false };
  window.__portfolio = state; // handy for debugging / tests

  // ---------- landing links ----------
  $('#cornerLinks').innerHTML = D.links.map((l) => {
    const ext = /^https?:/.test(l.href);
    return `<a href="${esc(l.href)}"${ext ? ' target="_blank" rel="noopener noreferrer"' : ''}>${esc(l.label)}</a>`;
  }).join('');

  // ---------- helpers ----------
  function showScreen(name) {
    for (const [k, el] of Object.entries(screens)) { const on = k === name; el.hidden = !on; el.classList.toggle('is-active', on); }
    state.screen = name;
    document.body.dataset.screen = name;
    space.setMode(name === 'landing' ? 'landing' : 'field');
  }
  async function fade(fn, outMs, inMs) {
    outMs = REDUCED ? 200 : outMs || 450; inMs = REDUCED ? 200 : inMs || 450;
    fader.style.transitionDuration = outMs + 'ms'; fader.classList.add('on');
    await sleep(outMs + 20);
    await fn();
    fader.style.transitionDuration = inMs + 'ms'; fader.classList.remove('on');
    await sleep(inMs);
  }
  async function doFlash(ms) { flash.style.transitionDuration = '60ms'; flash.classList.add('on'); await sleep(70); flash.style.transitionDuration = (ms || 400) + 'ms'; flash.classList.remove('on'); }
  const lock = (fn) => async (...a) => { if (state.busy) return; state.busy = true; try { await fn(...a); } finally { state.busy = false; } };
  const setDown = (on) => { consoleEl.classList.toggle('down', on); document.body.classList.toggle('mc-window', on); };
  const focusEl = (el) => el && el.focus({ preventScroll: true });

  // ---------- PAGE 1 -> 2 ----------
  const launch = lock(async () => {
    const cv = $('#space');
    screens.landing.classList.add('leaving');
    if (!REDUCED) {
      space.boost = 0;
      const t0 = performance.now();
      cv.classList.add('zoom');
      await new Promise((res) => { const step = () => { const k = Math.min(1, (performance.now() - t0) / 1400); space.boost = k * k * 0.6; k < 1 ? requestAnimationFrame(step) : res(); }; step(); });
    }
    await fade(async () => {
      cv.classList.remove('zoom'); space.boost = 0; screens.landing.classList.remove('leaving');
      showScreen('mc'); setMcMode('star'); space.cam.cy = space.cam.cyT = 0.14;
    }, 600, 600);
    focusEl($('#destTabs .tab'));
  });

  // ---------- Mission Control ----------
  function setMcMode(mode, dest) {
    state.mcMode = mode; state.dest = dest || null;
    $('#starView').hidden = mode !== 'star';
    $('#planetMap').hidden = mode !== 'planets';
    $('#destTabs').hidden = mode !== 'star';
    $('#crt').classList.toggle('map', mode === 'planets');
    consoleEl.classList.toggle('mapmode', mode === 'planets');
    $('#mcBack').innerHTML = mode === 'planets' ? '&#9664; Return' : '&#9664; Back';
    $('#mcBack').setAttribute('aria-label', mode === 'planets' ? 'Return to origin' : 'Back to landing page');
    $('#sectorLabel').textContent = mode === 'planets' ? `SECTOR: ${dest.toUpperCase()}` : 'SECTOR: ORIGIN';
    if (mode === 'planets') buildPlanetMap(dest);
    else showStar(state.starIdx, true);
  }

  function buildPlanetMap(dest) {
    const items = D[dest];
    $('#mapTitle').textContent = dest === 'projects' ? 'Projects Sector' : 'Experience Sector';
    const ul = $('#planetList'); ul.innerHTML = '';
    items.forEach((it, i) => {
      const li = document.createElement('li');
      li.style.setProperty('--i', i);
      const b = document.createElement('button'); b.type = 'button'; b.className = 'planet-btn'; b.dataset.id = it.id;
      b.setAttribute('aria-label', `Land on ${it.planet}: ${it.role}, ${it.org}`);
      const sprite = window.PX.makePlanetSprite(it.theme, 48); sprite.className = 'planet-sprite'; sprite.setAttribute('aria-hidden', 'true');
      b.appendChild(sprite);
      const lab = document.createElement('span'); lab.className = 'planet-label';
      lab.innerHTML = `<strong>${esc(it.planet)}</strong><span>${esc(it.org)}</span><em>${esc(it.role)}</em>`;
      b.appendChild(lab);
      b.addEventListener('click', () => openPlanet(dest, it));
      li.appendChild(b); ul.appendChild(li);
    });
  }

  // star screen
  const starCtx = $('#starCanvas').getContext('2d');
  function showStar(i, instant) {
    state.starIdx = (i + STARS.length) % STARS.length; state.starT = 0;
    const s = STARS[state.starIdx];
    $('#starIdx').textContent = `${String(state.starIdx + 1).padStart(2, '0')} / ${STARS.length}`;
    $('#starName').textContent = s.name; $('#starCls').textContent = s.cls;
    $('#sTemp').textContent = s.temp; $('#sRad').textContent = s.radius; $('#sLum').textContent = s.lum;
    $('#sDist').textContent = s.dist; $('#sFate').textContent = s.fate;
    if (!instant && !REDUCED) { const c = $('#crt'); c.classList.remove('glitch'); void c.offsetWidth; c.classList.add('glitch'); }
  }
  $('#starPrev').addEventListener('click', () => showStar(state.starIdx - 1));
  $('#starNext').addEventListener('click', () => showStar(state.starIdx + 1));
  $('#starPause').addEventListener('click', (e) => {
    state.paused = !state.paused; e.currentTarget.setAttribute('aria-pressed', state.paused);
    e.currentTarget.textContent = state.paused ? '\u25B6' : 'II';
    e.currentTarget.setAttribute('aria-label', state.paused ? 'Resume star cycle' : 'Pause star cycle');
  });

  // destinations
  const travelDlg = $('#travelDialog'), originDlg = $('#originDialog');
  let pendingDest = null, lastTab = null;
  document.querySelectorAll('#destTabs .tab').forEach((b) => b.addEventListener('click', () => {
    if (state.busy) return;
    pendingDest = b.dataset.dest; lastTab = b;
    $('#travelDest').textContent = `Destination: ${pendingDest === 'projects' ? 'Projects' : 'Experience'} Sector`;
    travelDlg.returnValue = ''; travelDlg.showModal();
  }));
  travelDlg.addEventListener('close', () => {
    if (travelDlg.returnValue === 'yes') travel(pendingDest);
    else { ticker('JUMP ABORTED. HOLDING POSITION.'); focusEl(lastTab); }
  });

  const travel = lock(async (dest) => {
    ticker('PLOTTING COURSE...');
    if (REDUCED) {
      await fade(async () => { setDown(true); space.warpT = 1; space.cam.cy = space.cam.cyT = 0.5; }, 250, 250);
      await sleep(900);
      await fade(async () => { space.warpT = 0; space.warp = 0; setDown(false); space.cam.cy = space.cam.cyT = 0.14; setMcMode('planets', dest); }, 250, 250);
    } else {
      // 1) look out the front window
      setDown(true); space.cam.cyT = 0.5;
      await sleep(1100);
      // 2) spool up
      document.body.classList.add('hyper'); space.warpT = 0.35; space.shake = 1;
      await sleep(900);
      // 3) jump
      await doFlash(500); space.warpT = 1.4; space.warp = 1.0; space.shake = 2;
      await sleep(2100);
      // 4) drop out
      await doFlash(600); space.warpT = 0; space.warp = 0.05; space.shake = 0;
      setMcMode('planets', dest);
      await sleep(500);
      document.body.classList.remove('hyper');
      setDown(false); space.cam.cyT = 0.14;
      await sleep(900);
    }
    ticker(`ARRIVED: ${dest.toUpperCase()} SECTOR`);
    focusEl($('#planetList .planet-btn'));
  });

  // back button: landing (star mode) or Return-to-Origin dialog (planet map)
  $('#mcBack').addEventListener('click', () => {
    if (state.busy) return;
    if (state.mcMode === 'planets') { originDlg.returnValue = ''; originDlg.showModal(); }
    else goLanding();
  });
  originDlg.addEventListener('close', () => {
    if (originDlg.returnValue === 'yes') returnToOrigin();
    else focusEl($('#mcBack'));
  });
  const returnToOrigin = lock(async () => {
    await fade(async () => setMcMode('star'), 500, 500);
    ticker('BACK AT ORIGIN.'); focusEl($('#destTabs .tab'));
  });
  const goLanding = lock(async () => {
    await fade(async () => showScreen('landing'), 500, 600);
    focusEl($('#launchBtn'));
  });

  // ---------- PAGE 4 ----------
  function renderDossier(dest, it) {
    const kind = dest === 'projects' ? 'Project' : 'Experience';
    const meta = [['Role', it.role], ['Organization', it.org], ['Dates', it.dates], ['Location', it.location]].filter((m) => m[1]);
    $('#dossier').innerHTML = `
      <p class="dossier-kicker">${kind} &middot; Planet ${esc(it.planet)}</p>
      <h2 id="dossierRole">${esc(it.role)}</h2>
      <p class="dossier-org">${esc(it.org)}${it.blurb ? ` <span>&mdash; ${esc(it.blurb)}</span>` : ''}</p>
      ${it.placeholder ? '<p class="placeholder-badge">Placeholder content &middot; edit js/data.js</p>' : ''}
      <dl class="dossier-meta">${meta.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
      <h3>The ${kind.toLowerCase()}</h3><p>${esc(it.experience)}</p>
      <h3>My role</h3><p>${esc(it.myRole)}</p>
      <h3>What was accomplished</h3><ul>${it.accomplishments.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>
      ${it.tags && it.tags.length ? `<div class="tags">${it.tags.map((t) => `<span>${esc(t)}</span>`).join('')}</div>` : ''}
      ${it.links && it.links.length ? `<div class="dossier-links">${it.links.map((l) => `<a class="px-btn small" href="${esc(l.href)}" target="_blank" rel="noopener noreferrer">${esc(l.label)}</a>`).join('')}</div>` : ''}`;
    $('#dossier').scrollTop = 0;
  }
  const openPlanet = lock(async (dest, it) => {
    await fade(async () => {
      scene.set(it.theme); renderDossier(dest, it); showScreen('planet');
      document.body.dataset.theme = it.theme;
    }, 600, 700);
    focusEl($('#planetBack'));
  });
  $('#planetBack').addEventListener('click', lock(async () => {
    await fade(async () => { showScreen('mc'); setMcMode('star'); space.cam.cy = space.cam.cyT = 0.14; }, 500, 500);
    focusEl($('#destTabs .tab'));
  }));
  $('#planetMapBtn').addEventListener('click', lock(async () => {
    const dest = state.dest || 'experience';
    await fade(async () => { showScreen('mc'); setMcMode('planets', dest); space.cam.cy = space.cam.cyT = 0.14; }, 500, 500);
    focusEl($('#planetList .planet-btn'));
  }));

  $('#launchBtn').addEventListener('click', launch);

  // ---------- fidget controls ----------
  const tickerEl = $('#ticker');
  let tickerTimer = 0;
  function ticker(msg) { tickerEl.textContent = msg; clearTimeout(tickerTimer); tickerTimer = setTimeout(() => (tickerEl.textContent = 'ALL SYSTEMS NOMINAL'), 3500); }

  const SWITCHES = ['NAV', 'SHLD', 'COMM', 'AUX'];
  $('#switches').innerHTML = SWITCHES.map((n, i) => `<button type="button" class="toggle" aria-pressed="${i % 2 === 0}" aria-label="${n} switch"><span class="led"></span><span class="sw"></span><em>${n}</em></button>`).join('');
  $('#switches').addEventListener('click', (e) => {
    const b = e.target.closest('.toggle'); if (!b) return;
    const on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', on);
    ticker(`${b.querySelector('em').textContent} ${on ? 'ONLINE' : 'OFFLINE'}`);
  });

  const LEVERS = ['THRUST', 'WARP', 'GRAV'];
  $('#levers').innerHTML = LEVERS.map((n) => `<button type="button" class="lever" aria-pressed="false" aria-label="${n} lever"><span class="slot"><span class="handle"></span></span><em>${n}</em></button>`).join('');
  $('#levers').addEventListener('click', (e) => {
    const b = e.target.closest('.lever'); if (!b) return;
    const on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', on);
    const n = b.querySelector('em').textContent;
    ticker(`${n} ${on ? 'ENGAGED' : 'IDLE'}`);
    if (n === 'THRUST') space.speed = on ? 2.2 : 1;
  });

  const KEY_COLORS = ['r', 'y', 'g', 'b', 'p', 'c', 'g', 'y', 'r', 'b'];
  const KEY_MSGS = ['HULL OK', 'CARGO SECURED', 'LIFE SUPPORT OK', 'SENSORS SWEEPING', 'COFFEE BREWING', 'DEFLECTORS 98%', 'GARDEN WATERED', 'ROUTE CACHED', 'SNACK BAY OPEN', 'AUTOPILOT READY'];
  $('#keys').innerHTML = KEY_COLORS.map((c, i) => `<button type="button" class="key k-${c}" aria-pressed="false" aria-label="Auxiliary button ${i + 1}"><span></span></button>`).join('');
  $('#keys').addEventListener('click', (e) => {
    const b = e.target.closest('.key'); if (!b) return;
    const on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', on);
    const i = [...b.parentNode.children].indexOf(b); ticker(KEY_MSGS[i]);
  });

  let knobPos = 0;
  $('#knob').addEventListener('click', (e) => {
    knobPos = (knobPos + 1) % 8; e.currentTarget.style.setProperty('--rot', knobPos * 45 + 'deg');
    e.currentTarget.setAttribute('aria-label', `Frequency dial, setting ${knobPos + 1}`);
    ticker(`COMMS CHANNEL ${String(knobPos + 1).padStart(2, '0')}`);
  });
  $('#cover').addEventListener('click', (e) => {
    const open = e.currentTarget.getAttribute('aria-pressed') !== 'true';
    e.currentTarget.setAttribute('aria-pressed', open); $('#redBtn').disabled = !open;
    ticker(open ? 'SAFETY COVER OPEN' : 'SAFETY COVER CLOSED');
  });
  $('#redBtn').addEventListener('click', async () => {
    ticker('DO NOT PRESS THE RED BUTTON.');
    if (!REDUCED) { consoleEl.classList.add('shake'); setTimeout(() => consoleEl.classList.remove('shake'), 500); }
    $('#cover').setAttribute('aria-pressed', 'false'); $('#redBtn').disabled = true;
  });

  // ---------- main loop ----------
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (state.screen !== 'planet') space.frame(dt, now);
    if (state.screen === 'planet') scene.frame(dt, now);
    if (state.screen === 'mc' && state.mcMode === 'star') {
      window.PX.drawStarPortrait(starCtx, STARS[state.starIdx], now, REDUCED);
      if (!state.paused && !document.hidden && !state.busy) {
        state.starT += dt * 1000;
        if (state.starT >= 20000) showStar(state.starIdx + 1);
      }
      $('#cycleFill').style.transform = `scaleX(${Math.min(1, state.starT / 20000)})`;
    }
    requestAnimationFrame(loop);
  }
  showScreen('landing');
  showStar(0, true);
  requestAnimationFrame(loop);
})();

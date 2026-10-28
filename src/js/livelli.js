// FEUDUM · LIVELLI: ritmo del gioco, stagioni e meteo, città al massimo, frammenti della corona, diario, altri regni, campagna, feudi, mercato, eventi, capitoli, storia
// ===== BILANCIAMENTO DEL RITMO (tempo reale) =====
// sessione tipo 20-30 min; giornata 2-3 sessioni. Era I ≈ giorno 1-2, Era II ≈ giorni 3-6, Era III ≈ settimana 2, Era IV ≈ settimane 3-4.
const PACE = () => (SET.pace === 'rapido' ? 0.1 : 1);
const MASTIO_T = [0, 1, 6, 12, 25, 45, 70, 100, 130, 160, 120, 180, 240, 360, 480, 720]; // minuti per salire da L a L+1
const UP_T = [0, 0, 1, 3, 8, 20, 40, 75, 120]; // minuti per portare un edificio al livello n (× peso dell'edificio)
const maxBuilders = () => 2 + (S && S.mastio >= 5 ? 1 : 0) + (S && S.mastio >= 9 ? 1 : 0);
const buildSecs = d => Math.round(d.t * 6 * PACE());

// ================= STAGIONI & METEO =================
const SEASON_MS = 2 * 60 * 60 * 1000, WX_MS = 10 * 60 * 1000;
const SEASONS = [
  { k: 'primavera', n: 'Primavera', ic: '🌸', mod: { cibo: 1.1 }, fx: '+10% cibo', wx: { sereno: 35, nuvoloso: 25, pioggia: 30, vento: 10 } },
  { k: 'estate', n: 'Estate', ic: '☀️', mod: { oro: 1.1 }, fx: '+10% oro dai commerci', wx: { sereno: 55, nuvoloso: 15, pioggia: 10, temporale: 10, vento: 10 } },
  { k: 'autunno', n: 'Autunno', ic: '🍂', mod: { cibo: 1.2, legno: 1.1 }, fx: '+20% cibo (raccolto), +10% legno', wx: { sereno: 20, nuvoloso: 25, pioggia: 30, vento: 25 } },
  { k: 'inverno', n: 'Inverno', ic: '❄️', mod: { cibo: 0.7, legno: 0.9 }, fx: '-30% cibo, -10% legno', wx: { sereno: 20, nuvoloso: 20, neve: 45, vento: 15 } },
];
const WXN = { sereno: ['☀️', 'Sereno'], nuvoloso: ['⛅', 'Nuvoloso'], pioggia: ['🌧️', 'Pioggia'], temporale: ['⛈️', 'Temporale'], neve: ['🌨️', 'Neve'], vento: ['💨', 'Vento'] };
function seasonInfo() { if (!S) return { i: 0, s: SEASONS[0], left: SEASON_MS }; if (!S.seasonEpoch) S.seasonEpoch = now(); const e = now() - S.seasonEpoch; const i = Math.floor(e / SEASON_MS) % 4; return { i, s: SEASONS[i], left: SEASON_MS - (e % SEASON_MS), t: (e % SEASON_MS) / SEASON_MS }; }
function seasonMod(res) { if (!S || S.creative || !res) return 1; return seasonInfo().s.mod[res] || 1; }
function pickWx(s) { let tot = 0; for (const k in s.wx) tot += s.wx[k]; let r = Math.random() * tot; for (const k in s.wx) { r -= s.wx[k]; if (r <= 0) return k; } return 'sereno'; }
function wxTick() {
  if (!S) return; const si = seasonInfo();
  if (S.lastSeason !== si.i) { const first = S.lastSeason == null; S.lastSeason = si.i; if (!first && MODE === 'village') toast(`${si.s.ic} Arriva ${si.s.n === 'Estate' ? "l'" : 'la '}${si.s.n}: ${si.s.fx}`); S.wx = null; }
  if (!S.wx || now() > S.wx.end || (S.wx.k === 'neve' && si.i !== 3)) { const k = pickWx(si.s); const ws = k === 'vento' ? 0.75 + Math.random() * 0.25 : k === 'temporale' ? 0.6 + Math.random() * 0.3 : 0.1 + Math.random() * 0.35; S.wx = { k, end: now() + WX_MS, wa: (S.wx ? S.wx.wa : Math.random() * 6.28) + (Math.random() - 0.5) * 1.6, ws }; }
}
// --- rendering ---
const WX = { I: 0, k: 'sereno', drops: [], flakes: [], leaves: [], streaks: [], clouds: [], flash: 0, nextBolt: 4, snowA: 0, last: 0 };
let SNOWCV = null;
function snowCanvas() { if (SNOWCV && SNOWCV.pk === PATHC.key) return SNOWCV; const M = 8, Sz = NMAP * M; const cv2 = SNOWCV || document.createElement('canvas'); cv2.width = cv2.height = Sz; const x = cv2.getContext('2d'); const id = x.createImageData(Sz, Sz); const nz = makeNoise(77), nz2 = makeNoise(78), nz3 = makeNoise(79); const WV = villageWater();
  // manto di neve compatto: bordi netti, poche chiazze d'erba scoperta, leggere ombre azzurre
  for (let py = 0; py < Sz; py++) for (let px = 0; px < Sz; px++) { const u = px / M, v = py / M; const n = nz(u / 7, v / 7, 3) * 0.75 + nz2(u / 2, v / 2, 2) * 0.25; const a = Math.min(1, Math.max(0, (n - 0.27) / 0.05)); const f = nz3(u * 1.6, v * 1.6, 2); const o = (py * Sz + px) * 4; const sh = 232 + f * 22 + (n - 0.5) * 10; let wet = 0; if (WV) { const gx = Math.max(0, Math.min(NMAP - 1.001, u - 0.5)), gy = Math.max(0, Math.min(NMAP - 1.001, v - 0.5)), xi = gx | 0, yi = gy | 0, fx = gx - xi, fy = gy - yi, W0 = (X, Y) => WV[Math.min(NMAP - 1, Y) * NMAP + Math.min(NMAP - 1, X)] ? 1 : 0; wet = W0(xi, yi) * (1 - fx) * (1 - fy) + W0(xi + 1, yi) * fx * (1 - fy) + W0(xi, yi + 1) * (1 - fx) * fy + W0(xi + 1, yi + 1) * fx * fy; wet = smooth(0.15, 0.6, wet + (f - 0.5) * 0.3); }
    id.data[o] = sh - 8; id.data[o + 1] = sh - 3; id.data[o + 2] = Math.min(255, sh + 10); id.data[o + 3] = 255 * a * (1 - 0.9 * wet); }
  x.putImageData(id, 0, 0);
  // sentieri battuti: la neve è calpestata e sporca
  if (PATHC.lines) { const st = (w, al, col, op) => { x.globalCompositeOperation = op; x.globalAlpha = al; x.strokeStyle = col; x.lineWidth = w * M; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); for (const l0 of PATHC.lines) { const l = chaikin(l0); x.moveTo(l[0][0] * M, l[0][1] * M); for (let i = 1; i < l.length; i++) x.lineTo(l[i][0] * M, l[i][1] * M); } x.stroke(); };
    st(0.9, 0.35, '#000', 'destination-out'); st(0.6, 0.45, '#000', 'destination-out'); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; }
  cv2.pk = PATHC.key; return SNOWCV = cv2; }
function seasonGround(c, sc) {
  if (sc.mode !== 'village' && sc.mode !== 'visit') return; const si = seasonInfo(); const k = si.s.k;
  const tgt = k === 'inverno' ? Math.min(1, si.t * 8) * (si.t > 0.94 ? (1 - si.t) / 0.06 : 1) : 0; WX.snowA += (tgt - WX.snowA) * 0.02;
  c.save(); tileTransform(c, 1);
  if (k === 'autunno') { c.globalCompositeOperation = 'soft-light'; c.fillStyle = 'rgba(210,120,30,0.55)'; c.fillRect(0, 0, NMAP, NMAP); }
  else if (k === 'estate') { c.globalCompositeOperation = 'soft-light'; c.fillStyle = 'rgba(255,215,120,0.35)'; c.fillRect(0, 0, NMAP, NMAP); }
  else if (k === 'primavera') { c.globalCompositeOperation = 'soft-light'; c.fillStyle = 'rgba(120,220,90,0.3)'; c.fillRect(0, 0, NMAP, NMAP); }
  c.restore();
  if (WX.snowA > 0.01) { c.save(); tileTransform(c, 8); c.globalAlpha = WX.snowA * 0.95; c.drawImage(snowCanvas(), 0, 0); c.restore(); }
}
function treeSeasonTint(kind, base, k3) {
  if (!S || MODE !== 'village') return base; const s = seasonInfo().s.k;
  if (s === 'autunno' && kind === 'quercia') return ['rgba(200,105,20,0.45)', 'rgba(215,150,30,0.42)', 'rgba(165,60,20,0.45)'][k3];
  if (s === 'inverno') return kind === 'quercia' ? 'rgba(228,234,242,0.55)' : 'rgba(236,242,250,0.33)';
  if (s === 'primavera' && kind === 'quercia') return ['rgba(150,235,90,0.16)', 'rgba(255,200,220,0.14)', 'rgba(150,235,90,0.1)'][k3];
  return base;
}
// direzione del vento fissa sullo schermo: ruotare la mappa non cambia pioggia, neve e raffiche
function windScreen() { const w = S && S.wx; if (!w) return [0.3, 0]; const sgn = Math.cos(w.wa) >= 0 ? 1 : -1; return [sgn * (0.55 + 0.45 * Math.abs(Math.cos(w.wa))) * w.ws, 0.15 * Math.sin(w.wa) * w.ws]; }
function drawWeather(c, sc, dt) {
  if (sc.mode !== 'village' && sc.mode !== 'visit') return;
  const W0 = cv.width, H0 = cv.height, D = DPR; const w = (S && S.wx) || { k: 'sereno', ws: 0.2 }; const k = w.k;
  const on = { rain: k === 'pioggia' || k === 'temporale', snow: k === 'neve', wind: k === 'vento' || w.ws > 0.7, cloud: k !== 'sereno' && k !== 'vento' };
  WX.I += ((on.rain || on.snow || on.cloud || on.wind ? 1 : 0) - WX.I) * Math.min(1, dt * 0.4);
  const [wx, wy] = windScreen(); const I = WX.I;
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
  // nuvole: ombre morbide che scorrono col vento
  if (on.cloud || on.rain || on.snow) {
    while (WX.clouds.length < 5) WX.clouds.push({ x: Math.random() * W0, y: Math.random() * H0, r: (180 + Math.random() * 220) * D });
    c.globalAlpha = 0.18 * I * (k === 'temporale' ? 1.6 : 1);
    for (const cl of WX.clouds) { cl.x += (wx * 40 + 6) * D * dt; cl.y += wy * 20 * D * dt; if (cl.x - cl.r > W0) { cl.x = -cl.r; cl.y = Math.random() * H0; } if (cl.x + cl.r < -cl.r) cl.x = W0 + cl.r; const g = c.createRadialGradient(cl.x, cl.y, 0, cl.x, cl.y, cl.r); g.addColorStop(0, 'rgba(15,22,35,1)'); g.addColorStop(1, 'rgba(15,22,35,0)'); c.fillStyle = g; c.fillRect(cl.x - cl.r, cl.y - cl.r, cl.r * 2, cl.r * 2); }
    c.globalAlpha = 1;
  }
  if (on.rain) { c.fillStyle = `rgba(20,30,48,${(k === 'temporale' ? 0.28 : 0.16) * I})`; c.fillRect(0, 0, W0, H0); }
  if (on.snow) { c.fillStyle = `rgba(225,235,250,${0.1 * I})`; c.fillRect(0, 0, W0, H0); }
  // pioggia
  const nR = on.rain ? Math.round(QQ().fx * (k === 'temporale' ? 320 : 200) * I * Math.min(1.4, W0 * H0 / (1200 * 800 * D * D) + 0.4)) : 0;
  while (WX.drops.length < nR) WX.drops.push({ x: Math.random() * W0, y: Math.random() * H0, l: (14 + Math.random() * 14) * D, v: (650 + Math.random() * 350) * D });
  if (WX.drops.length > nR) WX.drops.length = nR;
  if (nR) { c.strokeStyle = 'rgba(200,218,240,0.55)'; c.lineWidth = 1.1 * D; c.beginPath(); const sl = wx * 0.9;
    for (const d of WX.drops) { d.y += d.v * dt; d.x += sl * d.v * dt; if (d.y > H0) { d.y = -d.l; d.x = Math.random() * (W0 + 200 * D) - 100 * D; if (Math.random() < 0.3) WX.streaks.push({ x: d.x, y: Math.random() * H0, t: 0, sp: 1 }); } if (d.x > W0 + 50) d.x -= W0 + 100; if (d.x < -50) d.x += W0 + 100; c.moveTo(d.x, d.y); c.lineTo(d.x + sl * d.l, d.y + d.l); }
    c.stroke();
    c.strokeStyle = 'rgba(210,225,245,0.5)'; c.lineWidth = 1 * D; for (const s of WX.streaks) if (s.sp) { s.t += dt * 3; c.beginPath(); c.ellipse(s.x, s.y, 2 * D + s.t * 6 * D, 1 * D + s.t * 2 * D, 0, 0, 7); c.globalAlpha = Math.max(0, 1 - s.t); c.stroke(); } c.globalAlpha = 1;
    WX.streaks = WX.streaks.filter(s => !s.sp || s.t < 1).slice(-80);
  }
  // fulmini
  if (k === 'temporale' && I > 0.6) { WX.nextBolt -= dt; if (WX.nextBolt <= 0) { WX.flash = 1; WX.nextBolt = 5 + Math.random() * 9; setTimeout(() => sfx('crash'), 400 + Math.random() * 900); } }
  if (WX.flash > 0) { c.fillStyle = `rgba(235,240,255,${WX.flash * 0.55})`; c.fillRect(0, 0, W0, H0); WX.flash -= dt * 3.5; }
  // neve
  const nS = on.snow ? Math.round(260 * I * Math.min(1.4, W0 * H0 / (1200 * 800 * D * D) + 0.4)) : 0;
  while (WX.flakes.length < nS) WX.flakes.push({ x: Math.random() * W0, y: Math.random() * H0, r: (1 + Math.random() * 2.4) * D, v: (28 + Math.random() * 45) * D, p: Math.random() * 6 });
  if (WX.flakes.length > nS) WX.flakes.length = nS;
  if (nS) { c.fillStyle = 'rgba(255,255,255,0.9)'; for (const f of WX.flakes) { f.p += dt * 1.6; f.y += f.v * dt * (1 + w.ws * 0.6); f.x += (Math.sin(f.p) * 18 + wx * 120) * D * dt; if (f.y > H0) { f.y = -4; f.x = Math.random() * W0; } if (f.x > W0 + 10) f.x = -10; if (f.x < -10) f.x = W0 + 10; c.beginPath(); c.arc(f.x, f.y, f.r, 0, 7); c.fill(); } }
  // vento: raffiche e foglie
  const sk = seasonInfo().s.k; const nL = (on.wind ? 26 : sk === 'autunno' ? 10 : 0) * (on.wind ? I : 1);
  while (WX.leaves.length < nL) WX.leaves.push({ x: Math.random() * W0, y: Math.random() * H0, a: Math.random() * 6, s: (3 + Math.random() * 3) * D, v: 0.6 + Math.random() * 0.8, col: sk === 'autunno' ? ['#c8641c', '#e0a03a', '#9a3a16', '#d48a2a'][(Math.random() * 4) | 0] : sk === 'inverno' ? '#e8eef5' : ['#6f9a3a', '#89b04a', '#4f7a2a'][(Math.random() * 3) | 0] });
  if (WX.leaves.length > nL) WX.leaves.length = Math.max(0, Math.round(nL));
  const ws2 = Math.max(0.25, w.ws), dirx = wx / (Math.hypot(wx, wy) || 1) || 1;
  for (const L of WX.leaves) { L.a += dt * 5 * L.v; L.x += (dirx * 260 * ws2 * L.v) * D * dt; L.y += (Math.sin(L.a * 0.7) * 30 + 22) * D * dt; if (L.x > W0 + 20) { L.x = -20; L.y = Math.random() * H0; } if (L.x < -20) { L.x = W0 + 20; L.y = Math.random() * H0; } if (L.y > H0 + 20) L.y = -20;
    c.save(); c.translate(L.x, L.y); c.rotate(L.a); c.scale(1, Math.abs(Math.cos(L.a * 1.3)) * 0.8 + 0.2); c.fillStyle = L.col; c.beginPath(); c.ellipse(0, 0, L.s, L.s * 0.5, 0, 0, 7); c.fill(); c.restore(); }
  if (on.wind) { if (Math.random() < dt * 6 * I) WX.streaks.push({ x: dirx > 0 ? -200 * D : W0, y: Math.random() * H0, t: 0, len: (120 + Math.random() * 200) * D, sp: 0 });
    c.lineWidth = 1.4 * D; for (const s of WX.streaks) if (!s.sp) { s.t += dt; s.x += dirx * 900 * D * dt; const al = Math.sin(Math.min(1, s.t / 0.9) * Math.PI) * 0.35; c.strokeStyle = `rgba(255,255,255,${al})`; c.beginPath(); c.moveTo(s.x, s.y); c.quadraticCurveTo(s.x + s.len * 0.5 * dirx, s.y - 6 * D, s.x + s.len * dirx, s.y + Math.sin(s.t * 4) * 4 * D); c.stroke(); }
    WX.streaks = WX.streaks.filter(s => s.sp || s.t < 0.9); }
  c.restore();
}
// --- indicatore in alto a destra: bussola + meteo ---
function compassAngle() { const v = rotV(-1, -1); const sx = (v[0] - v[1]) * 32, sy = (v[0] + v[1]) * 16; return Math.atan2(sx, -sy); }
function updateWxWidget() {
  let el = $('#wxw'); if (!el) return; if (!S || MODE !== 'village') { el.classList.add('hidden'); return; } el.classList.remove('hidden');
  const si = seasonInfo(), w = S.wx || { k: 'sereno', ws: 0.2 }; let [ic, nm] = WXN[w.k]; if (w.k === 'sereno' && dayInfo().night > 0.5) { ic = '🌙'; nm = 'Notte serena'; }
  const ang = compassAngle() * 180 / Math.PI; const wv = rotV(Math.cos(w.wa || 0), Math.sin(w.wa || 0)); const wa = Math.atan2(wv[0] - wv[1], -(wv[0] + wv[1]) / 2) * 180 / Math.PI;
  const key = dayInfo().n + '|' + si.i + '|' + w.k + '|' + Math.round(ang) + '|' + Math.round(wa / 5) + '|' + Math.floor(si.left / 10000);
  if (el.dataset.k === key) return; el.dataset.k = key;
  const mm = Math.floor(si.left / 60000), ss = Math.floor(si.left / 1000) % 60;
  el.innerHTML = `<div class="wxp"><span class="wi">${ic}</span><div class="wt"><b>${nm}</b><small>${dayInfo().ic} ${dayInfo().n} · ${si.s.ic} ${si.s.n}</small></div></div>
    <div class="cmp"><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="29" class="r1"/><circle cx="32" cy="32" r="24" class="r2"/>
      <g transform="rotate(${ang.toFixed(1)} 32 32)">${['N', 'E', 'S', 'O'].map((l, i) => `<text x="32" y="15" transform="rotate(${i * 90} 32 32)" class="${l === 'N' ? 'n' : ''}">${l}</text>`).join('')}
      <path d="M32 12 37 32 32 30 27 32z" class="nd"/><path d="M32 52 37 32 32 34 27 32z" class="sd"/></g>
      <g transform="rotate(${wa.toFixed(1)} 32 32)" opacity="${Math.min(1, 0.35 + w.ws)}"><path d="M32 4 35 10 29 10z" class="wd"/></g><circle cx="32" cy="32" r="2.6" class="hub"/></svg></div>`;
  const r = $('#res').getBoundingClientRect(), q = $('#quest').getBoundingClientRect(), e = $('#era').getBoundingClientRect(); el.style.top = ((VW < 700 ? Math.max(q.bottom, e.bottom) : r.bottom) + 6) + 'px';
}
function openWeather() {
  const si = seasonInfo(), w = S.wx || { k: 'sereno', ws: 0.2 }; const [ic, nm] = WXN[w.k];
  const order = [0, 1, 2, 3].map(j => SEASONS[(si.i + j) % 4]);
  openSheet(`${ic} Meteo e stagioni`, `<div class="wxs"><div class="row"><b>Ora:</b> ${nm}${w.ws > 0.7 ? ' · vento forte' : w.ws > 0.4 ? ' · vento moderato' : ' · brezza'}</div>
    <div class="row"><b>${si.s.ic} ${si.s.n}</b> — ${si.s.fx}. Finisce tra ${Math.ceil(si.left / 60000)} min. Prossimo cambio del tempo tra ${Math.ceil(Math.max(0, w.end - now()) / 60000)} min.</div>
    <div class="slist">${order.map((s, j) => `<div class="${j ? '' : 'on'}"><span>${s.ic}</span><b>${s.n}</b><small>${s.fx}</small></div>`).join('')}</div>
    <p class="desc">Ogni stagione dura due ore (un anno è circa una giornata) e il tempo cambia ogni 10 minuti, anche a gioco chiuso. Mezz'ora prima del cambio arriva l'avviso. La bussola mostra dove si trova il Nord mentre ruoti la mappa; la freccia azzurra indica da dove soffia il vento.</p></div>`, 'wx');
}
// ---------- modalità città al massimo ----------
function buildMaxState(lvl) {
  S = newState(); S.mastio = lvl; S.sandbox = lvl; S.mq = 99; S.natInit = S.natBig = S.natHuge = 1;
  const cx = MCX | 0;
  S.buildings = [{ id: S.nextId++, t: 'mastio', x: cx - 1, y: cx - 1, lvl, stock: 0, end: 0 }];
  const free = (t, x, y) => { const d = BDEF[t]; if (!canPlace(t, x, y)) return false; if (lvl > 8 && x < cx + 5 && x + d.w > cx - 4 && y < cx + 5 && y + d.h > cx - 4) return false; return !occupiedBy(x - 1, y - 1, d.w + 2, d.h + 2) ; };
  const place = (t, lv) => { const d = BDEF[t]; for (let r = 2; r < 30; r++) { const cand = []; for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (Math.max(Math.abs(dx), Math.abs(dy)) === r) cand.push([cx + dx, cx + dy]); cand.sort(() => Math.random() - .5); for (const [x, y] of cand) if (free(t, x, y)) { S.buildings.push({ id: S.nextId++, t, x, y, lvl: lv, stock: 0, end: 0 }); return true; } } return false; };
  const order = ['municipio', 'caserma', 'poligono', 'scuderia', 'monastero', 'accademia', 'chiesa', 'mercato', 'fattoria', 'miniera', 'taverna', 'capanna', 'fucina', 'armeria', 'infermeria', 'granaio', 'tesoreria', 'cava', 'casa', 'balista', 'cancello', 'torre'];
  for (const t of order) { const d = BDEF[t]; const n = maxB(t); for (let i = 0; i < n; i++) place(t, d.decor ? 1 : bLvlCap()); }
  // cinta di palizzata / mura attorno al borgo
  let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1; for (const b of S.buildings) { const d = BDEF[b.t]; x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.x + d.w); y1 = Math.max(y1, b.y + d.h); }
  x0 -= 2; y0 -= 2; x1 += 1; y1 += 1; let walls = maxB('muro'); const wl = lvl >= 5 ? 2 : 1; const ring = [];
  for (let x = x0; x <= x1; x++) { ring.push([x, y0], [x, y1]); } for (let y = y0 + 1; y < y1; y++) { ring.push([x0, y], [x1, y]); }
  const midx = (x0 + x1) >> 1, midy = (y0 + y1) >> 1;
  for (const [x, y] of ring) { if (walls <= 0) break; if (Math.abs(x - midx) <= 1 || Math.abs(y - midy) <= 1) continue; if (canPlace('muro', x, y)) { S.buildings.push({ id: S.nextId++, t: 'muro', x, y, lvl: wl, stock: 0, end: 0 }); walls--; } }
  const addAt = (t, x, y) => { if (canPlace(t, x, y)) { S.buildings.push({ id: S.nextId++, t, x, y, lvl: BDEF[t].decor ? 1 : bLvlCap(), stock: 0, end: 0 }); return true; } return false; };
  if (lvl >= 9) { // Età dei Castelli: torri agli angoli della cinta e stendardi alle porte
    for (const [x, y] of [[x0 + 1, y0 + 1], [x1 - 1, y0 + 1], [x0 + 1, y1 - 1], [x1 - 1, y1 - 1]]) addAt('torre', x, y);
    for (const [x, y] of [[midx - 2, y0 - 1], [midx + 2, y0 - 1], [midx - 2, y1 + 1], [midx + 2, y1 + 1], [x0 - 1, midy - 2], [x0 - 1, midy + 2], [x1 + 1, midy - 2], [x1 + 1, midy + 2]]) addAt('stendardo', x, y);
  }
  if (lvl >= 13) { // Età Imperiale: mura concentriche con barbacani
    const X0 = x0 - 4, Y0 = y0 - 4, X1 = x1 + 4, Y1 = y1 + 4; const ring2 = [];
    for (let x = X0; x <= X1; x++) ring2.push([x, Y0], [x, Y1]); for (let y = Y0 + 1; y < Y1; y++) ring2.push([X0, y], [X1, y]);
    for (const [x, y] of ring2) { if (walls <= 0) break; if (Math.abs(x - midx) <= 1 || Math.abs(y - midy) <= 1) continue; if (canPlace('muro', x, y)) { S.buildings.push({ id: S.nextId++, t: 'muro', x, y, lvl: 2, stock: 0, end: 0 }); walls--; } }
    for (const [x, y] of [[X0 + 1, Y0 + 1], [X1 - 1, Y0 + 1], [X0 + 1, Y1 - 1], [X1 - 1, Y1 - 1]]) addAt('torre', x, y);
    for (const [x, y] of [[midx - 3, Y0 - 2], [midx - 3, Y1 + 1], [X0 - 2, midy - 3], [X1 + 1, midy - 3]]) addAt('balista', x, y);
  }
  for (let i = 0; i < maxB('stendardo'); i++) place('stendardo', 1);
  spawnNature(40);
  // esercito al completo
  const cap = armyCap(); const ks = UNIT_ORDER.filter(k => unlockedUnit(k)); let used = 0, i = 0; S.army = {};
  while (ks.length && i < 400) { const k = ks[i++ % ks.length]; if (used + UDEF[k].sp > cap) { if (i > ks.length * 3) break; continue; } S.army[k] = (S.army[k] || 0) + 1; used += UDEF[k].sp; }
  if (hasB('accademia')) S.tech = { arm: 5, bal: 5, log: 5 };
  const c2 = caps(); for (const r of RES) S.res[r] = r === 'favore' ? 200 : c2[r];
  S.wins = 10; S.raids = 1; S.nightIn = DF().night;
}
function startCreative(fresh) {
  SAVE_KEY = 'feudum_creativo'; const old = !fresh && load();
  if (old) { S = old; } else { S = newState(); S.creative = 1; S.mastio = 8; S.mq = 99; S.natInit = S.natBig = S.natHuge = 1; S.raids = 1; S.wins = 10;
    const cx = MCX | 0; S.buildings = [{ id: S.nextId++, t: 'mastio', x: cx - 1, y: cx - 1, lvl: 8, stock: 0, end: 0 }]; S.army = {}; for (const k of UNIT_ORDER) S.army[k] = 2; S.tech = { arm: 5, bal: 5, log: 5 }; }
  save(); beginGame(false, true);
}
function startMax(lvl) { SAVE_KEY = 'feudum_max_' + lvl; buildMaxState(lvl); save(); beginGame(false, true); }
function toMenu() { save(); location.reload(); }
// ================= LA CORONA DI SVEVIA: sei frammenti e l'assedio finale al Margravio =================
const FRAGS = [
  { name: 'Rocca di Hainburg', where: 'custodita dai Waldeck', x: 'Nella cappella diroccata di Hainburg, sotto l\'altare, trovi uno scrigno di piombo. Dentro, avvolto nel velluto, brilla il primo frammento della corona: una punta d\'oro con un rubino.<br><br>Sul coperchio è incisa mezza aquila nera.' },
  { name: 'Torre di Melk Vecchia', where: 'dei monaci guerrieri', x: 'I monaci guerrieri difendevano la torre senza sapere cosa custodissero. Tra i reliquiari trovi il secondo frammento, nascosto nel braccio d\'argento di un santo.<br><br>L\'Abate di Melk, quando lo saprà, non dirà una parola.' },
  { name: 'Castello di Dürnstein', where: 'nelle mani di un mercenario', x: 'Il capitano di ventura che teneva Dürnstein lo aveva comprato dal Margravio. Il terzo frammento era appeso al suo collo come un portafortuna.<br><br>Ora sai per certo che Steyr sta radunando i pezzi.' },
  { name: 'Abbazia di Klosterneuburg', where: 'occupata dai briganti', x: 'I briganti avevano saccheggiato l\'abbazia, ma il quarto frammento era murato dietro una pietra con la mezza aquila. Lady Isolde ti aveva detto dove cercare.<br><br>«Mio padre lo nascose qui la notte in cui morì.»' },
  { name: 'Burg Kreuzenstein', where: 'avamposto del Margravio', x: 'Kreuzenstein era l\'ultimo avamposto di Steyr. Nel forziere del castellano trovi il quinto frammento e una lettera del Margravio: «L\'ultimo pezzo resterà con me. Chi lo vuole, venga a prenderlo.»' },
];
const FRAG_BOSS = { name: 'Fortezza di Steyr', where: 'il Margravio · ultimo frammento', x: 'Le mura di Steyr crollano e il Margravio cade nel cortile, la spada spezzata accanto. Dal suo collo prendi l\'ultimo frammento.<br><br>Nella cappella del tuo castello i sei pezzi tornano a combaciare: la corona di Svevia è di nuovo intera.<br><br>Lady Isolde si inginocchia per prima. Poi, uno dopo l\'altro, tutti i signori della Marca.<br><br><i>«Lunga vita all\'Imperatore.»</i>' };
const frags = () => (S && S.frag) || 0;
function fragTarget() {
  if (!S || S.sandbox || S.creative || !S.targets) return; if (S.targets.some(t => t.frag != null || t.boss)) return; const f = frags();
  if (f < 5 && S.mastio >= 5) { const F = FRAGS[f]; S.targets.unshift({ d: Math.max(3, Math.min(10, S.mastio - 2 + f)), name: F.name, where: F.where, seed: (Math.random() * 1e9) | 0, frag: f }); }
  else if (f >= 5 && S.mastio >= 10 && !S.crowned) S.targets.unshift({ d: 10, name: FRAG_BOSS.name, where: FRAG_BOSS.where, seed: 1255, boss: 1 });
}
function bossSetup(sc) { const m = sc.B.find(b => b.t === 'mastio'); if (!m) return; const ks = ['uomoarme', 'balestriere', 'picchiere', 'scudata', 'berserker'];
  for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283, x = m.x + m.w / 2 + Math.cos(a) * (m.w / 2 + 1.3), y = m.y + m.h / 2 + Math.sin(a) * (m.h / 2 + 1.3); if (bAt(sc, x | 0, y | 0) || isWater(sc, x | 0, y | 0)) continue; const u = mkUnit(ks[i % ks.length], 'D', x, y); u.guardR = 6; u.leash = 10; u.hp *= 1.3 * DF().ehp; u.maxhp *= 1.3 * DF().ehp; u.dm = DF().edmg; sc.U.push(u); }
  const [fx, fy] = frontTile(sc, m); const g = mkUnit('cavpesante', 'D', fx + 0.5, fy + 0.5); g.boss = true; g.hp *= 5; g.maxhp *= 5; g.dm = 1.6; g.guardR = 8; g.leash = 12; sc.U.push(g);
  m.hp *= 1.6; m.maxhp *= 1.6; }
function fragReward(st) {
  const tg = BT.tg; if (tg.frag == null && !tg.boss) return '';
  if (tg.boss) { if (!BT.mastioDown) return '<div class="row"><b>👑 Il Margravio resiste:</b> abbatti il suo castello per prendere l\'ultimo frammento</div>'; S.frag = 6; S.crowned = 1; addRes('favore', 60); S.fragStory = 'boss'; return '<div class="row"><b>👑 La corona di Svevia è di nuovo intera!</b> +60 Favore Reale</div>'; }
  if (!(BT.mastioDown || st >= 2)) return '<div class="row"><b>👑 Il frammento è ancora nel castello:</b> abbatti il mastio o conquista 2 stelle</div>';
  S.frag = Math.max(frags(), tg.frag + 1); addRes('favore', 8); S.fragStory = tg.frag; return `<div class="row"><b>👑 Frammento della corona recuperato!</b> (${S.frag}/6) · +8 Favore Reale</div>`;
}
function fragStoryShow() { if (S.fragStory == null) return; const k = S.fragStory; S.fragStory = null; save();
  if (k === 'boss') storyOpen([{ img: 1, ic: '👑', sub: 'Epilogo', t: 'La corona intera', x: FRAG_BOSS.x }]);
  else storyOpen([{ img: 1, ic: '👑', sub: `Frammento ${k + 1} di 6`, t: FRAGS[k].name, x: FRAGS[k].x }]); }
function crownHTML() { const f = frags(); if (!S || S.mastio < 5 && !f) return ''; return `<div class="crown"><b>👑 Cappella della Corona</b><div class="cfr">${Array.from({ length: 6 }, (_, i) => `<span class="${i < f ? 'on' : ''}">${i < f ? '✦' : '·'}</span>`).join('')}</div><small>${f >= 6 ? 'La corona di Svevia è intera. Sei l\'Imperatore della Marca.' : f >= 5 ? `5 frammenti su 6. L'ultimo è nella Fortezza di Steyr${S.mastio < 10 ? ' (Mastio 10 per assediarla)' : ': cercala nella Mappa'}.` : `${f} frammenti su 6. Cerca nella Mappa i castelli segnati con 👑.`}</small></div>`; }
function openMap() {
  refreshTargets(false); fragTarget();
  const total = Object.values(S.army).reduce((a, b) => a + b, 0);
  const html = `<p class="desc">La Marca Orientale, A.D. ${YEAR(S.mastio)}. Scegli chi depredare. Truppe pronte: <b>${total}</b>${heroList().length ? ' + ' + heroList().length + ' eroi' : ''}.</p>
  <div class="tlist">${S.targets.map((t, i) => { const p = lootPool(t.d); return `<div class="tcard${t.frag != null || t.boss ? ' crownt' : ''}"><div class="tt"><b>${t.frag != null || t.boss ? '👑 ' : ''}${t.name}</b><span>${t.where}${t.frag != null ? ` · frammento ${t.frag + 1} di 6` : ''}</span></div><div class="skull">${'💀'.repeat(Math.min(5, Math.ceil(t.d / 2)))} <small>difficoltà ${t.d}</small></div><div class="tl">Bottino stimato: 🌾${p.cibo} 🪵${p.legno} 🪙${p.oro}${p.pietra ? ' 🪨' + p.pietra : ''}</div><button class="btn" onclick="startAttack(${i})">⚔ Assedia</button></div>`; }).join('')}</div>
  <div class="maptabs three"><button class="btn ghost" onclick="openRealms()">🌍 Altri Regni<small>${realms().length} signori</small></button><button class="btn ghost" onclick="openDiplo()">🤝 Diplomazia<small>${feudi().filter(f => f.req).length ? '📜 ' + feudi().filter(f => f.req).length + ' richieste' : countSt('alleato') + ' alleati · ' + countSt('vassallo') + ' vassalli'}</small></button><button class="btn ghost" onclick="openMarket()">⚖ Mercato<small>${hasB('mercato') ? 'compra e vendi' : 'serve il Mercato'}</small></button></div><div class="acts"><button class="btn ghost" onclick="refreshTargets(true);openMap()">↻ Altri bersagli</button>${S.raids ? '<button class="btn ghost" onclick="startRaid()">🌙 Attendi la notte (difendi il feudo)</button>' : ''}</div>`;
  openSheet(ICO('map') + ' Mappa della Marca', html, 'map');
}
function openHelp() {
  openSheet(ICO('scroll') + ' Come si gioca', `<div class="help">
  <p><b>Dal fango al trono.</b> Anno Domini 1254: la stirpe sveva si è spenta ed è il Grande Interregno. Hai un Mastio di legno marcio e pochi contadini.</p>
  <ul><li><b>Raccogli:</b> tocca le icone sopra gli edifici per incassare cibo, legno, oro e pietra.</li>
  <li><b>Economia:</b> Taverna e Fattoria → Cibo · Falegnameria → Legno · Fabbro → Ferro · Case → Popolazione (posti esercito) e tasse · Armeria → +danno truppe · Infermeria → recupera i caduti.</li>
  <li><b>Città:</b> il Municipio aumenta la popolazione e sblocca Mercato (scambi e oro), Chiesa (morale e cure) e Accademia (ricerche). Le Mura con Cancello fermano i nemici ma lasciano passare le tue truppe.</li>
  <li><b>Bestie:</b> di notte lupi e orsi si uniscono ai predoni, a volte arriva un branco intero. Ogni lupo abbattuto dà 1 pelle, ogni orso 3. Nei boschi lupi e orsi cacciano cervi e capre, che scappano.</li>
  <li><b>Animali:</b> cervi e capre si cacciano liberamente e danno Cibo; lupi (3 soldati) e orsi (6 soldati) danno Pelli 🧥, usate per armature, cavalleria pesante, ricerche e vendute al Mercato. Toccali sulla mappa per cacciarli.</li>
  <li><b>Natura:</b> ogni oggetto della mappa si può rimuovere: alberi (danno legno), sassi e massi (danno pietra), funghi, cespugli e tronchi che spuntano nel feudo. Toccali e rimuovili per liberare spazio e ottenere risorse; puoi anche comprarli come decorazioni dal menu Costruisci.</li>
  <li><b>Missioni:</b> segui la pergamena in alto e riscuoti le ricompense.</li>
  <li><b>Costruisci e migliora:</b> hai 2 mastri d'opera. Il Mastio sblocca edifici, truppe ed eroi (liv. 1-4 Età del Legno, 5-8 Età Feudale).</li>
  <li><b>Assedia:</b> dalla Mappa scegli un bersaglio, seleziona una truppa in basso e tocca il terreno fuori dalla zona rossa. Tieni premuto per schierarne tante. 3:30 di assedio.</li>
  <li><b>Stelle:</b> ★ 50% distrutto · ★ Mastio nemico abbattuto · ★ 100%. Le stelle danno Favore Reale.</li>
  <li><b>Eroi:</b> schierali una volta per battaglia, poi tocca la loro carta per l'abilità finale.</li>
  <li><b>Notte:</b> all'inizio hai 10 minuti di tregua per costruire il villaggio e armare le truppe. Poi, ogni 6 minuti di gioco, i predoni attaccano il borgo. Torri, baliste e il tuo esercito difendono da soli; tu puoi schierare gli eroi.</li>
  <li><b>Difficoltà e layout:</b> scegli in fondo a questa pagina o nel menu iniziale. Facile allunga la tregua e indebolisce i nemici, Difficile li rende più numerosi e resistenti.</li>
  <li><b>Camera:</b> trascina per muoverti, pizzica o rotella per lo zoom. Ruota la mappa con i pulsanti ⟲ ⟳ a destra, girando liberamente con due dita (su PC: tasto destro o Shift + trascina, oppure Q / E): quando lasci si allinea al lato più vicino.</li></ul>
  <h4>🎨 Layout</h4><div class="lay">${layoutCards('openHelp()')}</div><h4>⚔ Difficoltà</h4><div class="dif">${diffCards('openHelp()')}</div>
  <div class="acts"><button class="btn ghost" onclick="openMenu()">${ICO('gear')} Menu · audio, layout, difficoltà</button><button class="btn ghost" onclick="newCampaign()">↺ Nuova partita</button><button class="btn ghost" onclick="toMenu()">🏠 Menu principale</button></div></div>`, 'help');
}

// ---------- missioni ----------
const built = t => S.buildings.filter(b => b.t === t && !(b.end && b.toLvl === 1)).length;
// ================= DIARIO DEL RITMO: misura quanto dura davvero ogni pezzo del gioco =================
const PACE_TARGET = { 2: 0.05, 3: 0.3, 4: 0.6, 5: 1.5, 6: 2.5, 7: 3.5, 8: 5, 9: 7, 10: 9, 11: 11.5, 12: 14, 13: 17, 14: 21, 15: 25, 16: 30 }; // ore di gioco attivo previste
function diary() { if (!S.diary) S.diary = { t0: now(), play: 0, sess: 1, lastSeen: now(), lvl: { 1: [0, now()] }, ch: {}, waste: {}, raids: 0, events: 0, hourly: [] }; return S.diary; }
function diaryTick(dt) {
  if (!S || S.creative || S.sandbox || MODE === 'title') return; const D = diary();
  if (now() - D.lastSeen > 10 * 60 * 1000) D.sess++; D.lastSeen = now(); D.play += dt;
  if (!D.lvl[S.mastio]) D.lvl[S.mastio] = [Math.round(D.play), now()];
  const q = QUESTS[S.mq]; if (q && D.ch[q.ch] == null) D.ch[q.ch] = [Math.round(D.play), now()];
}
function diaryWaste(r, v) { if (!S || S.creative || !S.diary || v <= 0) return; S.diary.waste[r] = (S.diary.waste[r] || 0) + v; }
const hm = s => { s = Math.round(s); const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60; return h ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`; };
const dayOf = t => 1 + Math.floor((t - diary().t0) / 86400000);
function diaryText() {
  const D = diary(); const L = [];
  L.push(`FEUDUM · diario del ritmo · ${new Date().toLocaleString('it-IT')}`);
  L.push(`Gioco attivo ${hm(D.play)} in ${D.sess} sessioni (media ${hm(D.play / Math.max(1, D.sess))}) · giorno ${dayOf(now())} · difficoltà ${DF().n} · ritmo ${SET.pace === 'rapido' ? 'rapido' : 'normale'}`);
  L.push('Mastio: ' + Object.keys(D.lvl).map(k => `${k}@${hm(D.lvl[k][0])}`).join(' '));
  L.push('Capitoli: ' + Object.keys(D.ch).map(k => `${CHAPTERS[k].n}@${hm(D.ch[k][0])}`).join(' '));
  L.push('Sprecato a magazzino pieno: ' + (Object.keys(D.waste).map(k => `${k} ${Math.round(D.waste[k])}`).join(', ') || 'niente'));
  L.push(`Razzie ${S.raids || 0} (vinte ${S.raidsWon || 0}) · assedi vinti ${S.wins || 0} · eventi ${S.events || 0} · scambi ${S.trades || 0} · carovane ${S.caravans || 0}`);
  return L.join('\n');
}
function openDiary() {
  const D = diary(); const lv = Object.keys(D.lvl).map(Number).sort((a, b) => a - b);
  const rows = lv.map(k => { const a = D.lvl[k][0] / 3600, t = PACE_TARGET[k]; const diff = t ? a / t : 1; const col = !t || k === 1 ? '' : diff < 0.6 ? 'fast' : diff > 1.5 ? 'slow' : 'ok';
    return `<tr><td>Mastio ${k}</td><td>${hm(D.lvl[k][0])}</td><td>${t ? hm(t * 3600) : '—'}</td><td class="${col}">${!t || k === 1 ? '' : diff < 0.6 ? 'troppo veloce' : diff > 1.5 ? 'troppo lento' : 'giusto'}</td><td>g. ${dayOf(D.lvl[k][1])}</td></tr>`; }).join('');
  const chs = Object.keys(D.ch).map(k => `<tr><td>Cap. ${CHAPTERS[k].n}</td><td>${hm(D.ch[k][0])}</td><td colspan="3">giorno ${dayOf(D.ch[k][1])}</td></tr>`).join('');
  const w = Object.keys(D.waste).map(k => `${ICO(k)} ${fmt(Math.round(D.waste[k]))}`).join(' ') || 'niente';
  const raidsH = D.play > 600 ? ((S.raids || 0) / (D.play / 3600)).toFixed(1) : '—';
  openSheet('📈 Diario del ritmo', `<div class="diary"><div class="dsum"><div><b>${hm(D.play)}</b><small>gioco attivo</small></div><div><b>${D.sess}</b><small>sessioni</small></div><div><b>${hm(D.play / Math.max(1, D.sess))}</b><small>sessione media</small></div><div><b>${dayOf(now())}</b><small>giorno</small></div></div>
    <table><tr><th>Traguardo</th><th>Tu</th><th>Previsto</th><th></th><th></th></tr>${rows}${chs}</table>
    <div class="row"><b>Sprecato a magazzino pieno:</b> ${w}</div><div class="row"><b>Razzie all'ora:</b> ${raidsH} · <b>eventi</b> ${S.events || 0} · <b>assedi vinti</b> ${S.wins || 0}</div>
    <p class="desc">Il diario registra quanto tempo di gioco attivo serve per ogni traguardo e lo confronta con il ritmo previsto. Copialo e incollalo in chat: così sistemiamo i numeri sui dati veri.</p>
    <div class="acts"><button class="btn" onclick="copyDiary()">📋 Copia il diario</button><button class="btn ghost" onclick="openMenu('game')">← Menu</button></div></div>`, 'diary');
}
function copyDiary() { const t = diaryText(); try { navigator.clipboard.writeText(t).then(() => toast('📋 Diario copiato: incollalo in chat'), () => prompt('Copia il diario:', t)); } catch (e) { prompt('Copia il diario:', t); } }
// --- previsioni: stagione in arrivo e razzia in arrivo ---
function forecastTick() {
  if (!S || S.creative || MODE !== 'village') return; const si = seasonInfo(); const next = SEASONS[(si.i + 1) % 4]; const left = si.left / 60000;
  const mark = si.i + ':' + (left <= 5 ? 5 : left <= 30 ? 30 : 0);
  if (S.fcMark !== mark && (left <= 30)) { S.fcMark = mark; if (left <= 30 && left > 5) toast(`${next.ic} ${next.n} in arrivo tra ${Math.ceil(left)} minuti: ${next.fx}`); else if (left <= 5) toast(`${next.ic} ${next.n} tra ${Math.ceil(left)} minuti!${next.k === 'inverno' ? ' Riempi i granai.' : ''}`); }
  if (!S.creative && S.nightIn != null && S.nightIn <= 120 && S.nightIn > 0 && !S.raidWarned) { S.raidWarned = 1; toast('🔥 Fuochi all\'orizzonte: i predoni arriveranno tra 2 minuti'); sfx('horn'); }
  if (S.nightIn > 125) S.raidWarned = 0;
}
// ================= VISITA AGLI ALTRI REGNI: ogni regno ha un villaggio diverso (stile, posizioni, abbellimenti) =================
const RSTYLE = [
  { k: 'radiale', n: 'a cerchi attorno al castello', deco: { cespuglio: 6, funghi: 3, stendardo: 4 } },
  { k: 'griglia', n: 'a isolati ordinati', deco: { stendardo: 6, masso: 2, cespuglio: 3 } },
  { k: 'strada', n: 'lungo la strada maestra', deco: { tronco: 3, cespuglio: 5, funghi: 2 } },
  { k: 'fortezza', n: 'chiuso dentro le mura', deco: { stendardo: 8, masso: 3 } },
  { k: 'sparso', n: 'a borghi sparsi nei boschi', deco: { funghi: 7, cespuglio: 7, tronco: 4, masso: 3 } },
  { k: 'giardino', n: 'tra giardini e siepi', deco: { cespuglio: 14, funghi: 6, masso: 2, stendardo: 2 } },
];
function realmBuildList(L) {
  const cap = L <= 8 ? Math.min(4, 1 + Math.floor(L / 2)) : Math.min(8, 4 + Math.ceil((L - 8) / 2));
  const out = []; const ord = ['caserma', 'casa', 'fattoria', 'capanna', 'taverna', 'granaio', 'mercato', 'municipio', 'fucina', 'miniera', 'infermeria', 'armeria', 'cava', 'tesoreria', 'chiesa', 'poligono', 'scuderia', 'accademia', 'monastero', 'torre', 'torrepietra', 'balista'];
  for (const t of ord) { const d = BDEF[t]; if (!d || !d.max) continue; let n = d.max[Math.min(8, L) - 1]; if (L > 8) n += Math.round(n * (L - 8) / 8); for (let i = 0; i < n; i++) out.push({ t, lvl: Math.max(1, Math.min(cap, cap - (i % 2))) }); }
  return out;
}
function buildRealmScene(r) {
  const R = rng(r.seed * 3 + 11); const st = RSTYLE[r.i % RSTYLE.length]; const sc = newScene('visit'); sc.realm = r; sc.style = st;
  // acqua diversa per ogni regno
  const ponds = []; const np = 2 + ((R() * 4) | 0); for (let i = 0; i < np; i++) { const a = R() * 6.283, d = 18 + R() * 26; ponds.push({ k: 'lago', x: Math.round(MCX + Math.cos(a) * d - 3), y: Math.round(MCX + Math.sin(a) * d - 4), w: 7, h: 8 }); }
  const riv = { k: 'fiume', x: Math.round(MCX + (R() < 0.5 ? -1 : 1) * (10 + R() * 8) - 6), y: Math.round(MCX + (R() - 0.5) * 20 - 6), w: 13, h: 13 };
  sc.decals = [riv, ...ponds]; for (const d of sc.decals) stampMask(sc.water, d.k === 'fiume' ? EMASK.river.mask : EMASK.pond.mask, d.x, d.y);
  if (!GROUND_R || GROUND_R.seed !== r.seed || (GROUND_R.stale && TEX_OK)) { GROUND_R = paintGround(false, sc.decals, r.seed); GROUND_R.seed = r.seed; } sc.ground = GROUND_R;
  addTrees(sc, r.seed % 997, st.k === 'sparso' || st.k === 'giardino'); addGroves(sc, r.seed % 991, st.k === 'fortezza' ? 16 : 12);
  const occ = new Uint8Array(N * N);
  const free = (t, x, y, gap) => { const d = BDEF[t]; for (let yy = y - gap; yy < y + d.h + gap; yy++) for (let xx = x - gap; xx < x + d.w + gap; xx++) { if (!inMap(xx, yy) || xx < 3 || yy < 3 || xx >= N - 3 || yy >= N - 3) return false; if (occ[yy * N + xx] || sc.water[yy * N + xx]) return false; } return true; };
  const put = (t, x, y, lvl) => { const d = BDEF[t]; for (let yy = y; yy < y + d.h; yy++) for (let xx = x; xx < x + d.w; xx++) occ[yy * N + xx] = 1; const b = mkBuilding(t, x, y, lvl, 'D', null); if (d.wall) b.mask = 0; sc.B.push(b); return b; };
  const cx = Math.round(MCX - 1 + (R() - 0.5) * 6), cy = Math.round(MCX - 1 + (R() - 0.5) * 6);
  // sgombero l'area centrale dagli alberi
  const m = put('mastio', cx, cy, r.lvl);
  const list = realmBuildList(r.lvl); for (let i = list.length - 1; i > 0; i--) { const j = (R() * (i + 1)) | 0; [list[i], list[j]] = [list[j], list[i]]; }
  const tryAt = (t, lvl, gen, tries, gap) => { for (let k = 0; k < tries; k++) { const [x, y] = gen(k); if (free(t, Math.round(x), Math.round(y), gap)) { put(t, Math.round(x), Math.round(y), lvl); return true; } } return false; };
  const a0 = R() * 6.283; let ring = 0;
  for (const it of list) {
    const d = BDEF[it.t]; let ok = false;
    if (st.k === 'radiale') ok = tryAt(it.t, it.lvl, k => { const rr = 6 + Math.floor(k / 24) * 4 + (ring % 2); const a = a0 + k * 0.26 + R() * 0.1; return [cx + 1 + Math.cos(a) * rr - d.w / 2, cy + 1 + Math.sin(a) * rr - d.h / 2]; }, 140, 1);
    else if (st.k === 'griglia') ok = tryAt(it.t, it.lvl, k => { const gx = ((k * 7) % 11) - 5, gy = (Math.floor(k * 7 / 11) % 11) - 5; return [cx + 1 + gx * 4 - d.w / 2 + (R() < 0.2 ? 1 : 0), cy + 1 + gy * 4 - d.h / 2]; }, 160, 0);
    else if (st.k === 'strada') { const dir = R() < 0.5 ? [1, 0] : [0, 1]; ok = tryAt(it.t, it.lvl, k => { const along = (k % 2 ? 1 : -1) * (5 + Math.floor(k / 2) * 2.2), side = ((k >> 1) % 2 ? 1 : -1) * (3 + (k % 5)); return dir[0] ? [cx + along, cy + side] : [cx + side, cy + along]; }, 160, 0); }
    else if (st.k === 'fortezza') ok = tryAt(it.t, it.lvl, k => { const s = 5 + Math.floor(k / 30) * 2; return [cx + 1 + (R() * 2 - 1) * s - d.w / 2, cy + 1 + (R() * 2 - 1) * s - d.h / 2]; }, 200, 0);
    else { const hubs = sc.hubs || (sc.hubs = [0, 1, 2, 3].map(i => { const a = a0 + i * 1.6 + R(); const rr = st.k === 'sparso' ? 14 + R() * 8 : 8 + R() * 6; return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]; })); const h = hubs[(R() * hubs.length) | 0]; ok = tryAt(it.t, it.lvl, k => [h[0] + (R() - 0.5) * (6 + k * 0.4), h[1] + (R() - 0.5) * (6 + k * 0.4)], 120, st.k === 'giardino' ? 1 : 0); }
    if (!ok) tryAt(it.t, it.lvl, () => [cx + (R() - 0.5) * 40, cy + (R() - 0.5) * 40], 200, 0); ring++;
  }
  // mura per le fortezze (e per i regni dall'Era II in su, a volte)
  if (st.k === 'fortezza' || (r.lvl >= 6 && R() < 0.4)) {
    let x0 = N, y0 = N, x1 = 0, y1 = 0; for (const b of sc.B) { x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.x + b.w); y1 = Math.max(y1, b.y + b.h); }
    x0 -= 2; y0 -= 2; x1 += 1; y1 += 1; const gate = [Math.round((x0 + x1) / 2), y1];
    for (let x = x0; x <= x1; x++) for (const y of [y0, y1]) if (!(y === gate[1] && Math.abs(x - gate[0]) <= 1) && free('muro', x, y, 0)) put('muro', x, y, r.lvl >= 5 ? 2 : 1);
    for (let y = y0 + 1; y < y1; y++) for (const x of [x0, x1]) if (free('muro', x, y, 0)) put('muro', x, y, r.lvl >= 5 ? 2 : 1);
    if (r.lvl >= 5 && free('cancello', gate[0] - 1, gate[1] - 1, 0)) put('cancello', gate[0] - 1, gate[1] - 1, 1);
  }
  // abbellimenti
  for (const t in st.deco) { const n = Math.round(st.deco[t] * (0.6 + R() * 0.8) * (0.6 + r.lvl / 10)); for (let i = 0; i < n; i++) tryAt(t, 1, () => { const b = sc.B[(R() * sc.B.length) | 0]; return [b.x + (R() < 0.5 ? -1 - BDEF[t].w : b.w + 1) + ((R() * 2) | 0), b.y + ((R() * (b.h + 2)) | 0) - 1]; }, 30, 0); }
  // via gli alberi dalle costruzioni
  sc.trees = sc.trees.filter(t => !occ[(t.y | 0) * N + (t.x | 0)] && Math.hypot(t.x - cx, t.y - cy) > 7); sc.rocks = sc.rocks.filter(o => !occ[(o.y | 0) * N + (o.x | 0)]);
  sceneIndex(sc); try { computePaths(sc); } catch (e) { }
  // qualche abitante a passeggio e i soldati in piazza
  const homes = sc.B.filter(b => !BDEF[b.t].wall && !BDEF[b.t].decor);
  for (let i = 0; i < Math.min(10, 3 + r.lvl); i++) { const h = homes[(R() * homes.length) | 0]; const [hx, hy] = frontTile(sc, h); const k = ['cuoco', 'fabbro', 'infermiera', 'taglialegna'][i % 4]; const u = mkUnit('miliziano', 'V', hx + 0.5, hy + 0.5); u.k = k; u.d = { spd: 0.7, hp: 1, cd: 1, rng: 0 }; u.home = h; u.jk = 'wander'; u.st = 'rest'; u.wt = R() * 4; u.ai = workerAI; sc.U.push(u); }
  const [fx, fy] = frontTile(sc, m); const pool = r.lvl >= 5 ? ['scudata', 'arccorto', 'miliziano', 'picchiere'] : ['miliziano', 'arccorto'];
  for (let i = 0; i < Math.min(12, 3 + r.lvl); i++) { const k = pool[i % pool.length]; if (!UDEF[k]) continue; const u = mkUnit(k, 'V', fx + 1.5 + (i % 4) * 0.55, fy + 0.6 + Math.floor(i / 4) * 0.6); u.face = 'F'; u.ai = soldierAI; sc.U.push(u); }
  return sc;
}
let VISIT_PREV = null;
function visitRealm(i) {
  const r = realms()[i]; closeSheet(); closeFolk(); VISIT_PREV = MODE;
  MODE = 'visit'; SC = buildRealmScene(r); const m = SC.B.find(b => b.t === 'mastio'); centerCam(m.x + 1.5, m.y + 1.5); cam.z = VW < 600 ? 0.8 : 1;
  $('#title').classList.add('hidden'); $('#hud').classList.add('hidden'); $('#bhud').classList.add('hidden'); $('#rotbar').classList.remove('hidden');
  let el = $('#vbar'); if (!el) { el = document.createElement('div'); el.id = 'vbar'; document.body.appendChild(el); }
  const canAtk = S && VISIT_PREV === 'village' && r.lvl <= S.mastio + 3;
  el.innerHTML = `<div class="vb"><span class="rem" style="background:${r.col}">${r.ic}</span><div><b>${r.name}</b><small>di ${r.user} · Mastio ${r.lvl} · villaggio ${SC.style.n}</small></div></div><div class="va"><button class="btn ghost" onclick="leaveVisit()">⬅ Torna</button>${canAtk ? `<button class="btn" onclick="leaveVisit(true,${i})">⚔ Assedia</button>` : ''}</div>`;
  el.classList.remove('hidden');
}
function leaveVisit(attack, i) {
  const el = $('#vbar'); if (el) el.classList.add('hidden');
  if (VISIT_PREV === 'title' || !S) { MODE = 'title'; SC = null; showTitle(); if (typeof titleScene === 'function') titleScene(); return; }
  backToVillage(); if (attack) attackRealm(i);
}
function visitTap(sx, sy) {
  const [tx, ty] = screenToTile(sx, sy); const b = bAt(SC, Math.floor(tx), Math.floor(ty)); if (!b) return;
  const d = BDEF[b.t]; toast(`${d.icon || '🏠'} ${b.t === 'mastio' ? (b.lvl >= 5 ? 'Castello' : 'Mastio') : d.n}${d.decor || d.wall ? '' : ' · livello ' + b.lvl}`);
}
// ================= ALTRI REGNI: signori "di altri giocatori" (simulati per ora) =================
const RLM_SEED = 1254;
let _rlmT0 = 0; function RLM_T0() { if (_rlmT0) return _rlmT0; try { let v = +localStorage.getItem('feudum_rlm'); if (!v) { v = now() - 2 * 86400000; localStorage.setItem('feudum_rlm', v); } return _rlmT0 = v; } catch (e) { return _rlmT0 = now() - 2 * 86400000; } }
const RLM_DEF = [
  ['Baronessa_Ilse', 'Feudo di Rosenthal', '🌹', '#a8322a', 'LEGA'], ['GuidoDaMontefeltro', 'Rocca di Urbino Nuova', '🦅', '#1e3a8a', 'GUELFI'], ['Lupo_di_Carinzia', 'Covo di Villach', '🐺', '#4a4a4a', 'BRANCO'],
  ['Re_Fede77', 'Regno di Federicopoli', '👑', '#b45309', 'GUELFI'], ['SorellaMatilde', 'Badia di Canossa', '✝️', '#6b5236', 'LEGA'], ['Ottone_IV', 'Marca di Brunswick', '🦁', '#8f1d1d', 'IMPERO'],
  ['GiuliaLaRossa', 'Signoria di Ferrara', '🔥', '#c2410c', ''], ['Hartmann99', 'Burg Falkenstein', '⚔️', '#3f3f46', 'BRANCO'], ['Ezzelino_da_Romano', 'Rocca di Bassano', '🐉', '#166534', 'IMPERO'],
  ['Kunigunde', 'Contea di Tirolo', '🏔️', '#0e7490', 'LEGA'], ['Sir_Brando', 'Castel Bran', '🦇', '#581c87', ''], ['Bianca_Lancia', 'Corte di Agliano', '🕊️', '#64748b', 'GUELFI'],
  ['MastroAnselmo', 'Borgo dei Mulini', '⚙️', '#78716c', ''], ['Corradino_Svevo', 'Ultima Svevia', '🦅', '#ca8a04', 'IMPERO'],
];
const ALLY_N = { LEGA: 'Lega del Danubio', GUELFI: 'Parte Guelfa', BRANCO: 'Il Branco', IMPERO: 'Fedeli dell\'Impero' };
function realms() {
  const days = (now() - RLM_T0()) / 86400000; const R0 = rng(RLM_SEED);
  return RLM_DEF.map((d, i) => {
    const R = rng(RLM_SEED + i * 97); const speed = 0.6 + R() * 1.6; const base = 1 + Math.floor(R() * 6);
    const lvl = Math.max(1, Math.min(16, Math.floor(base + days * speed * 1.2 + (R() - 0.5) * 2)));
    const wins = Math.floor(lvl * (3 + R() * 6) + days * speed * 4); const power = lvl * 100 + wins * 30 + Math.floor(R() * 200);
    const hr = new Date().getHours(); const on = ((i * 7 + hr) % 5 === 0) || (R() < 0.15);
    const ago = on ? 0 : 1 + Math.floor(((i * 13 + Math.floor(now() / 600000)) % 47) * (1 + R()));
    return { i, user: d[0], name: d[1], ic: d[2], col: d[3], ally: d[4], lvl, wins, power, on, ago, seed: (RLM_SEED * (i + 3)) | 0 };
  });
}
const myPower = () => S ? (S.mastio || 1) * 100 + (S.wins || 0) * 30 + (S.raidsWon || 0) * 20 + countSt('alleato', 'vassallo') * 60 : 100;
function realmNews() {
  const rs = realms(); const R = rng(Math.floor(now() / 300000)); const out = [];
  const verbs = [r => `ha alzato il Mastio al livello ${r.lvl}`, r => `ha respinto una razzia notturna`, (r, o) => `ha assediato ${o.name}: ${'★'.repeat(1 + ((R() * 3) | 0))}`, r => `ha giurato fedeltà a ${ALLY_N[r.ally] || 'nessuno'}`, r => `ha addestrato un esercito di ${20 + ((R() * 60) | 0)} uomini`, r => `ha costruito ${['una Chiesa', 'un Mercato', 'una Torre di Pietra', 'l\'Accademia', 'una Balista'][(R() * 5) | 0]}`];
  for (let k = 0; k < 7; k++) { const r = rs[(R() * rs.length) | 0], o = rs[(R() * rs.length) | 0]; const v = verbs[(R() * verbs.length) | 0]; out.push({ r, t: v(r, o === r ? rs[(r.i + 1) % rs.length] : o), m: 2 + k * 6 + ((R() * 5) | 0) }); }
  return out;
}
function openRealms(fromTitle) {
  const rs = realms().sort((a, b) => b.power - a.power); const me = { me: true, user: 'Tu', name: S ? 'La tua Marca' : 'Il tuo feudo', ic: ARMS().sym, col: ARMS().c1, lvl: S ? S.mastio : 1, power: S ? myPower() : 100, on: true, ally: '' };
  const all = rs.concat([me]).sort((a, b) => b.power - a.power); const pos = all.indexOf(me) + 1;
  const row = (r, k) => `<div class="rrow ${r.me ? 'me' : ''}" ${r.me ? '' : `onclick="openRealm(${r.i}${fromTitle ? ',1' : ''})"`}><span class="rk">${k + 1}</span><span class="rem" style="background:${r.col}">${r.ic}</span><div class="rn"><b>${r.name}</b><small>${r.me ? 'tu' : r.user}${r.ally ? ` · [${r.ally}]` : ''}</small></div><div class="rs"><b>${r.power}</b><small>Mastio ${r.lvl} · ${ERA(r.lvl).s}</small></div><i class="ron ${r.on ? 'on' : ''}" title="${r.on ? 'online' : 'offline'}"></i></div>`;
  const news = realmNews().map(n => `<div class="rnw"><span class="rem sm" style="background:${n.r.col}">${n.r.ic}</span><span><b>${n.r.user}</b> ${n.t}</span><small>${n.m} min fa</small></div>`).join('');
  openSheet('🌍 Altri Regni', `<p class="desc">I signori della Marca che giocano accanto a te. Sei <b>${pos}°</b> su ${all.length} per potenza. <small>(Per ora sono regni simulati: diventeranno giocatori veri con i salvataggi online.)</small></p>
    <div class="rtabs"><b>Classifica</b></div><div class="rlist">${all.map(row).join('')}</div><div class="rtabs"><b>Cronache della Marca</b></div><div class="rnews">${news}</div>
    ${fromTitle ? '<div class="acts"><button class="btn" onclick="closeSheet()">✓ Chiudi</button></div>' : ''}`, 'realms');
}
function openRealm(i, fromTitle) {
  const r = realms()[i]; const p = lootPool(Math.min(10, r.lvl));
  const canAtk = !fromTitle && S && MODE === 'village'; const close = r.lvl <= (S ? S.mastio : 1) + 3;
  openSheet(`${r.ic} ${r.name}`, `<div class="rdet"><div class="rhd"><span class="rem lg" style="background:${r.col}">${r.ic}</span><div><b>${r.user}</b><small>${r.on ? '🟢 online ora' : `⚪ visto ${r.ago < 60 ? r.ago + ' min fa' : Math.floor(r.ago / 60) + ' h fa'}`}</small>${r.ally ? `<small>⚜ ${ALLY_N[r.ally]}</small>` : ''}</div></div>
    <div class="stats"><span>🏰 Mastio ${r.lvl} · ${ERA(r.lvl).n}</span><span>⚔ ${r.wins} assedi vinti</span><span>💪 Potenza ${r.power}</span></div>
    <p class="desc">${canAtk ? (close ? `Bottino stimato: 🌾${p.cibo} 🪵${p.legno} 🪙${p.oro}` : 'Troppo forte per te adesso: il suo castello ti schiaccerebbe.') : 'Entra in una partita per assediarlo.'}</p>
    <div class="acts">${canAtk && close ? `<button class="btn" onclick="attackRealm(${i})">⚔ Assedia</button>` : ''}<button class="btn" onclick="visitRealm(${i})">👁 Visita il regno</button><button class="btn ghost" onclick="realmMsg(${i})">✉ Manda un messaggio</button><button class="btn ghost" onclick="openRealms(${fromTitle ? 1 : 0})">← Classifica</button></div></div>`, 'realm');
}
function attackRealm(i) { const r = realms()[i]; refreshTargets(false); S.targets = S.targets.filter(t => t.rid == null); S.targets.unshift({ d: Math.max(1, Math.min(10, r.lvl)), name: r.name, where: `${r.ic} di ${r.user}`, seed: r.seed, rid: i }); closeSheet(); startAttack(0); }
function realmMsg(i) { const r = realms()[i]; const rep = ['Che il vento ti sia favorevole, signore.', 'Le mie mura ti aspettano. Vieni pure.', 'Un\'alleanza? Parliamone davanti a un boccale.', 'Non ho tempo per le chiacchiere, ho un assedio da preparare.', 'Ricambio i saluti dalla mia rocca!', 'Bel castello il tuo. Peccato sia così vicino al mio...']; toast(`✉ ${r.user}: «${rep[(r.i + Math.floor(now() / 60000)) % rep.length]}»`); }
// ================= CAMPAGNA, FEUDI VICINI, COMMERCIO, EVENTI =================
// ---------- feudi vicini & diplomazia ----------
const FEUDI_BASE = [
  { name: 'Contea di Wildenstein', lord: 'Conte Ottokar', ic: '🦅', off: 1, tr: 'superbo', d: 'Nobile antico e orgoglioso. Rispetta la forza e i doni generosi.' },
  { name: 'Baronia di Weissfurt', lord: 'Barone Ulrich', ic: '🐗', off: 0, tr: 'avido', d: 'Controlla il guado e i suoi pedaggi. Ama l\'oro più di ogni giuramento.' },
  { name: 'Abbazia di Melk', lord: 'Abate Corrado', ic: '✝️', off: -1, tr: 'pio', d: 'Monaci ricchi di grano e di libri. Preferiscono la pace e i pellegrini.' },
  { name: 'Signoria di Semmering', lord: 'Cavaliere Hartmut', ic: '⚔️', off: 2, tr: 'bellicoso', d: 'Un cavaliere rinnegato con una banda di mercenari. Prova a conquistare la Marca.' },
  { name: 'Marca di Steyr', lord: 'Margravio Leopold', ic: '🦁', off: 3, tr: 'astuto', d: 'Il vicino più potente. Un alleato prezioso, un nemico terribile.' },
];
const DST = { neutrale: ['Neutrale', '#9a8a6a'], patto: ['Patto commerciale', '#3f7a2e'], alleato: ['Alleato', '#1e3a8a'], vassallo: ['Tuo vassallo', '#b45309'], guerra: ['In guerra', '#8f1d1d'] };
const CARAVAN_MS = 3 * 60 * 1000, TRIBUTE_MS = 5 * 60 * 1000, GIFT_CD = 2 * 3600 * 1000;
function feudi() {
  if (!S.feudi) S.feudi = FEUDI_BASE.map((f, i) => ({ id: i, rel: f.tr === 'pio' ? 20 : f.tr === 'bellicoso' ? -30 : 0, st: 'neutrale', next: 0, gift: 0 }));
  return S.feudi;
}
const fBase = f => FEUDI_BASE[f.id];
const fPow = f => Math.max(1, Math.min(16, S.mastio + fBase(f).off));
const relWord = r => r >= 70 ? 'Amichevole' : r >= 30 ? 'Cordiale' : r > -20 ? 'Diffidente' : r > -60 ? 'Ostile' : 'Odio';
function relAdd(f, v) { f.rel = Math.max(-100, Math.min(100, f.rel + v)); if (f.st === 'patto' && f.rel < 0) { f.st = 'neutrale'; toast(`📜 ${fBase(f).lord} rompe il patto commerciale`); } if (f.st === 'alleato' && f.rel < 30) { f.st = f.rel >= 0 ? 'patto' : 'neutrale'; toast(`💔 ${fBase(f).lord} scioglie l'alleanza`); } }
const countSt = (...sts) => feudi().filter(f => sts.includes(f.st)).length;
function giftCost(f) { return { oro: 40 + 25 * fPow(f) }; }
function remember(f, v, txt) { f.mem = f.mem || []; f.mem.unshift({ t: now(), v: Math.round(v), txt }); f.mem = f.mem.slice(0, 6); relAdd(f, v); }
const repMul = () => 1 + (S.rep || 0) / 200;
function repAdd(v) { S.rep = Math.max(-100, Math.min(100, (S.rep || 0) + v)); }
function dipAct(i, act) {
  const f = feudi()[i], B = fBase(f), P = fPow(f), t = now();
  if (act === 'gift') { const c = giftCost(f); if (t < f.gift) { toast('Hai già mandato un dono: aspetta che passi un po\' di tempo'); return; } if (!canPay(c)) { toast('Oro insufficiente'); return; } pay(c); f.gift = t + GIFT_CD * PACE(); remember(f, (B.tr === 'avido' ? 22 : B.tr === 'superbo' ? 12 : 16) * repMul(), '🎁 un tuo dono'); S.gifts = (S.gifts || 0) + 1; toast(`🎁 ${B.lord} accetta il dono (${relWord(f.rel)})`); sfx('coin'); }
  else if (act === 'pact') { if (!hasB('mercato')) { toast('Serve un Mercato per i patti commerciali'); return; } if (f.rel < 20) { toast(`${B.lord} non si fida ancora di te`); return; } f.st = 'patto'; f.next = t + CARAVAN_MS; remember(f, 5, '📜 il patto commerciale'); toast(`📜 Patto commerciale con ${B.name}: arriveranno carovane`); sfx('bell'); }
  else if (act === 'ally') { const c = { oro: 150 + 30 * P, cibo: 100 }; if (f.rel < 60 || f.st !== 'patto') { toast('Serve un patto commerciale e un rapporto amichevole (60+)'); return; } if (!canPay(c)) { toast('Risorse insufficienti per il giuramento'); return; } pay(c); f.st = 'alleato'; remember(f, 10, '🤝 il giuramento di alleanza'); toast(`🤝 ${B.lord} giura alleanza: ti manderà rinforzi nelle razzie`); sfx('bell'); }
  else if (act === 'tribute') { if (S.mastio < P + 2) { toast(`${B.lord} ride: il tuo Mastio non incute timore (serve livello ${P + 2})`); return; } const ok = Math.random() < 0.35 + Math.max(0, f.rel) / 200 + (S.mastio - P - 2) * 0.1; if (ok) { f.st = 'vassallo'; f.next = t + TRIBUTE_MS; f.rel = Math.max(f.rel, 10); remember(f, 0, '👑 la tua pretesa di tributo, accolta'); toast(`👑 ${B.lord} piega il ginocchio: ora è tuo vassallo`); sfx('bell'); } else { remember(f, -35, '👑 la tua pretesa di tributo'); repAdd(-6); if (f.rel < -50) { f.st = 'guerra'; addWarTarget(f); toast(`⚔ ${B.lord} rifiuta e ti dichiara guerra!`); sfx('horn'); } else toast(`${B.lord} rifiuta sdegnato (${relWord(f.rel)})`); } }
  else if (act === 'war') { if (!dipAct.ok) { askYes(`Dichiarare guerra a ${B.name}?<br><small>Gli altri feudi se ne ricorderanno.</small>`, () => { dipAct.ok = 1; dipAct(i, 'war'); dipAct.ok = 0; }, '⚔ Guerra'); return; } f.st = 'guerra'; f.rel = -100; remember(f, 0, '⚔ la tua dichiarazione di guerra'); for (const o of feudi()) if (o !== f) remember(o, -8, `⚔ la guerra contro ${B.name}`); repAdd(-20); addWarTarget(f); toast(`⚔ Guerra a ${B.name}! Lo trovi sulla mappa degli assedi`); sfx('horn'); }
  else if (act === 'peace') { const c = { oro: 80 + 30 * P }; if (!canPay(c)) { toast('Oro insufficiente per la pace'); return; } if (Math.random() < 0.5 + (S.wins || 0) * 0.02) { pay(c); f.st = 'neutrale'; f.rel = -20; remember(f, 0, '🕊 la pace firmata'); repAdd(8); S.targets = (S.targets || []).filter(x => x.fid !== f.id); toast(`🕊 Pace firmata con ${B.name}`); } else { pay({ oro: Math.round(c.oro / 3) }); toast(`${B.lord} respinge l'ambasciatore`); } }
  else if (act === 'deliver') { const q = f.req; if (!q || q.kind !== 'res') return; const c = { [q.r]: q.n }; if (!canPay(c)) { toast('Non hai abbastanza risorse'); return; } pay(c); reqDone(f); }
  save(); updateHUD(); openDiplo();
}
// --- richieste dei signori ---
const REQ_TXT = {
  avido: [['oro', 'per i pedaggi del guado'], ['legno', 'per rifare il ponte']], superbo: [['pietra', 'per la nuova torre del castello'], ['win', 'per vendicare un insulto: vinci un assedio']],
  pio: [['cibo', 'per sfamare i pellegrini'], ['pelli', 'per coprire i monaci d\'inverno']], bellicoso: [['ferro', 'per armare i suoi mercenari'], ['win', 'per provare il tuo valore: vinci un assedio']],
  astuto: [['oro', 'per un affare che non vuole spiegare'], ['ferro', 'per le sue baliste'], ['win', 'per indebolire un rivale: vinci un assedio']],
};
function makeReq(f) { const B = fBase(f), P = fPow(f); const opts = REQ_TXT[B.tr]; const [r, why] = opts[(Math.random() * opts.length) | 0]; const base = { oro: 60, legno: 120, pietra: 80, cibo: 120, ferro: 50, pelli: 2 }[r] || 0;
  const rew = Math.random() < 0.5 ? { oro: 40 + 25 * P } : { favore: 1 + Math.floor(P / 3) };
  return r === 'win' ? { kind: 'win', w0: S.wins || 0, left: 40 * 60, txt: why, rew } : { kind: 'res', r, n: Math.round(base * (1 + 0.45 * (P - 1)) / (r === 'pelli' ? 1 : 10)) * (r === 'pelli' ? 1 : 10), left: 35 * 60, txt: why, rew }; }
function reqDone(f) { const q = f.req; if (!q) return; const got = []; for (const k in q.rew) { const v = addRes(k, q.rew[k]); if (v) got.push(ICO(k) + '+' + v); } remember(f, 15 * repMul(), '📜 la richiesta che hai esaudito'); repAdd(4); S.reqDone = (S.reqDone || 0) + 1; f.req = null; f.reqNext = 20 * 60 + Math.random() * 20 * 60; toast(`📜 ${fBase(f).lord} ringrazia ${got.join(' ')}`); sfx('coin'); }
function addWarTarget(f) { refreshTargets(false); S.targets = (S.targets || []).filter(x => x.fid !== f.id); const B = fBase(f); S.targets.unshift({ d: Math.min(10, fPow(f) + 1), name: B.name, where: `${B.ic} ${B.lord} · in guerra`, seed: (Math.random() * 1e9) | 0, fid: f.id }); }
function warResult(fid, st) { const f = feudi()[fid]; if (!f) return; if (st >= 2) { f.st = 'vassallo'; f.rel = 0; f.next = now() + TRIBUTE_MS; setTimeout(() => toast(`👑 ${fBase(f).name} è conquistato: ora ti paga tributo`), 2500); } else { relAdd(f, -10); setTimeout(() => { if (f.st === 'guerra' && !(S.targets || []).some(t => t.fid === f.id)) addWarTarget(f); }, 0); } }
function diploTick(dt) {
  if (!S || S.creative) return; const t = now(); dt = dt || 0;
  if (MODE === 'village' && dt) {
    if (S.rep) { S.repT = (S.repT || 0) + dt; if (S.repT > 600) { S.repT = 0; S.rep += S.rep > 0 ? -1 : 1; } }
    for (const f of feudi()) {
      if (f.st === 'guerra' || f.rel <= -40) { f.req = null; continue; }
      if (f.req) { const q = f.req; if (q.kind === 'win' && (S.wins || 0) > q.w0) { reqDone(f); continue; } q.left -= dt; if (q.left <= 0) { f.req = null; f.reqNext = 25 * 60; remember(f, -10, '⌛ la richiesta che hai ignorato'); repAdd(-3); toast(`⌛ ${fBase(f).lord} è deluso: non hai esaudito la sua richiesta`); } }
      else if (S.mq >= 10) { f.reqNext = (f.reqNext == null ? 5 * 60 + f.id * 240 : f.reqNext) - dt; if (f.reqNext <= 0) { f.req = makeReq(f); const q = f.req; toast(`📜 ${fBase(f).lord} ti chiede ${q.kind === 'win' ? 'un favore' : q.n + ' ' + RNAME[q.r].toLowerCase()} ${q.txt}`); } }
    }
    if ((S.rep || 0) <= -40 && t > (S.coalT || 0)) { const cand = feudi().filter(f => f.rel < 0 && (f.st === 'neutrale' || f.st === 'patto')); if (cand.length >= 2) { S.coalT = t + 2 * 3600 * 1000; const two = cand.slice(0, 2); for (const f of two) { f.st = 'guerra'; f.rel = -80; remember(f, 0, '⚔ la coalizione contro di te'); addWarTarget(f); } toast(`⚔ Coalizione! ${two.map(f => fBase(f).lord).join(' e ')} si alleano contro di te: hai fatto troppa paura alla Marca`); sfx('horn'); } }
  }
  for (const f of feudi()) {
    const P = fPow(f);
    if ((f.st === 'patto' || f.st === 'alleato') && f.next && t >= f.next) { f.next = t + CARAVAN_MS; const pool = ['cibo', 'legno', 'pietra', 'ferro']; const r = pool[(Math.random() * pool.length) | 0]; const g = { oro: 20 + 10 * P }; g[r] = (g[r] || 0) + 25 + 12 * P; const got = []; for (const k in g) { const v = addRes(k, g[k]); if (v) got.push(ICO(k) + '+' + v); } S.caravans = (S.caravans || 0) + 1; relAdd(f, 1); if (MODE === 'village') caravanSpawn(SC, 'Carovana di ' + fBase(f).name); if (MODE === 'village') toast(`🐴 Carovana da ${fBase(f).name}: ${got.join(' ')}`); }
    if (f.st === 'vassallo' && f.next && t >= f.next) { f.next = t + TRIBUTE_MS; const g = { oro: 40 + 20 * P, cibo: 30 + 15 * P }; const got = []; for (const k in g) { const v = addRes(k, g[k]); if (v) got.push(ICO(k) + '+' + v); } if (MODE === 'village') toast(`👑 Tributo da ${fBase(f).name}: ${got.join(' ')}`); }
    if (f.st === 'neutrale' && Math.random() < 0.0005) relAdd(f, f.rel > 0 ? -1 : 1); // i rapporti tornano piano verso il neutro
  }
}
function allyReinforcements() { const out = []; for (const f of feudi()) if (f.st === 'alleato') { const n = 2 + Math.floor(fPow(f) / 3); for (let i = 0; i < n; i++) out.push(i % 2 ? 'arccorto' : (fPow(f) >= 5 ? 'scudata' : 'miliziano')); } return out.slice(0, 14); }
function openDiplo() {
  const fs = feudi();
  const card = (f, i) => { const B = fBase(f), P = fPow(f), st = DST[f.st]; const gc = giftCost(f), cd = now() < f.gift;
    const acts = [];
    if (f.st !== 'guerra') acts.push(`<button class="btn ghost ${cd ? 'dis' : ''}" onclick="dipAct(${i},'gift')">🎁 Dono<small>${cd ? 'tra ' + fmtT(f.gift - now()) : costStr(gc)}</small></button>`);
    if (f.st === 'neutrale') acts.push(`<button class="btn ghost ${f.rel >= 20 && hasB('mercato') ? '' : 'dis'}" onclick="dipAct(${i},'pact')">📜 Patto<small>${hasB('mercato') ? 'rapporto 20+' : 'serve Mercato'}</small></button>`);
    if (f.st === 'patto') acts.push(`<button class="btn ghost ${f.rel >= 60 ? '' : 'dis'}" onclick="dipAct(${i},'ally')">🤝 Alleanza<small>${costStr({ oro: 150 + 30 * P, cibo: 100 })}</small></button>`);
    if (f.st === 'neutrale' || f.st === 'patto') acts.push(`<button class="btn ghost ${S.mastio >= P + 2 ? '' : 'dis'}" onclick="dipAct(${i},'tribute')">👑 Esigi tributo<small>Mastio ${P + 2}+</small></button>`);
    if (f.st !== 'guerra' && f.st !== 'vassallo') acts.push(`<button class="btn ghost" onclick="dipAct(${i},'war')">⚔ Guerra</button>`);
    if (f.st === 'guerra') acts.push(`<button class="btn ghost" onclick="dipAct(${i},'peace')">🕊 Pace<small>${costStr({ oro: 80 + 30 * P })}</small></button>`, `<button class="btn" onclick="closeSheet();openMap()">⚔ Assedia</button>`);
    const nx = f.next && (f.st === 'patto' || f.st === 'alleato' || f.st === 'vassallo') ? `<div class="fn">${f.st === 'vassallo' ? '👑 Tributo' : '🐴 Carovana'} tra ${fmtT(f.next - now())}</div>` : '';
    const mem = (f.mem || []).slice(0, 3).map(m => `<span class="${m.v > 0 ? 'p' : m.v < 0 ? 'n' : ''}">${m.txt}${m.v ? ` (${m.v > 0 ? '+' : ''}${m.v})` : ''} · ${fmtT(now() - m.t)} fa</span>`).join('');
    const rq = f.req ? `<div class="dreq"><b>📜 Richiesta:</b> ${f.req.kind === 'win' ? 'vinci un assedio' : f.req.n + ' ' + ICO(f.req.r)} ${f.req.txt}. <small>Ricompensa ${Object.keys(f.req.rew).map(k => ICO(k) + ' ' + f.req.rew[k]).join(' ')} · scade tra ${fmtT(f.req.left * 1000)}</small>${f.req.kind === 'res' ? `<button class="btn ${canPay({ [f.req.r]: f.req.n }) ? '' : 'dis'}" onclick="dipAct(${i},'deliver')">Consegna</button>` : ''}</div>` : '';
    return `<div class="dcard"><div class="dh"><span class="dic">${B.ic}</span><div><b>${B.name}</b><small>${B.lord} · potenza ${P} · ${B.tr}</small></div><span class="dst" style="background:${st[1]}">${st[0]}</span></div>
      <div class="drel"><i style="left:${(f.rel + 100) / 2}%"></i></div><div class="drw">${relWord(f.rel)} (${f.rel > 0 ? '+' : ''}${Math.round(f.rel)})</div>
      <p class="dd">${B.d}</p>${rq}${mem ? `<div class="dmem"><b>Ricorda:</b>${mem}</div>` : ''}${nx}<div class="dacts">${acts.join('')}</div></div>`; };
  openSheet('🤝 Diplomazia della Marca', `<p class="desc">Doni e patti aprono carovane di merci; gli alleati mandano rinforzi quando i predoni attaccano; i vassalli pagano tributo. Alleati ${countSt('alleato')} · vassalli ${countSt('vassallo')} · guerre ${countSt('guerra')}. <b>Reputazione nella Marca: ${(S.rep || 0) > 20 ? 'onorata' : (S.rep || 0) < -40 ? 'temuta e odiata' : (S.rep || 0) < -10 ? 'sospetta' : 'neutra'}</b> (${Math.round(S.rep || 0)}).</p><div class="dlist">${fs.map(card).join('')}</div>`, 'diplo');
}
// ---------- mercato ----------
const PBASE = { cibo: 1, legno: 1, pietra: 1.6, ferro: 3.2, pelli: 9 };
function price(r) { const s = seasonInfo().s.k; let p = PBASE[r] * (S.pmod && S.pmod[r] || 1); if (r === 'cibo') p *= s === 'inverno' ? 1.6 : s === 'autunno' ? 0.75 : 1; if (r === 'legno') p *= s === 'inverno' ? 1.3 : 1; if (r === 'pelli') p *= s === 'inverno' ? 1.4 : 1; const pacts = countSt('patto', 'alleato'); return p * (1 - Math.min(0.2, pacts * 0.05)); }
function trade(r, qty, buy) {
  if (!hasB('mercato') && !S.creative) { toast('Serve un Mercato'); return; }
  const p = price(r); const gold = Math.round(qty * p * (buy ? 1 : 0.65));
  if (buy) { if (!canPay({ oro: gold })) { toast('Oro insufficiente'); return; } const got = addRes(r, qty); if (!got) { toast('Magazzino pieno'); return; } pay({ oro: Math.round(gold * got / qty) }); }
  else { if ((S.res[r] || 0) < qty) { toast('Non ne hai abbastanza'); return; } const got = addRes('oro', gold); S.res[r] -= qty; if (got < gold) toast('Tesoreria piena: parte dell\'oro è andata persa'); }
  S.trades = (S.trades || 0) + 1; sfx('coin'); save(); updateHUD(); openMarket();
}
function openMarket() {
  const has = hasB('mercato') || S.creative; const s = seasonInfo().s;
  const rows = Object.keys(PBASE).map(r => { const p = price(r), q = r === 'pelli' ? 2 : r === 'ferro' ? 20 : 50; return `<div class="mrow"><span class="mr">${ICO(r)} <b>${RNAME[r]}</b><small>${fmt(S.res[r] || 0)}</small></span>
    <button class="btn ghost" onclick="trade('${r}',${q},false)">Vendi ${q}<small>+${Math.round(q * p * 0.65)} ${ICO('oro')}</small></button>
    <button class="btn" onclick="trade('${r}',${q},true)">Compra ${q}<small>-${Math.round(q * p)} ${ICO('oro')}</small></button></div>`; }).join('');
  openSheet('⚖ Mercato della Marca', `${has ? '' : '<p class="desc"><b>Costruisci un Mercato</b> per commerciare.</p>'}<p class="desc">${s.ic} ${s.n}: ${s.k === 'inverno' ? 'il cibo e la legna costano cari' : s.k === 'autunno' ? 'dopo il raccolto il grano costa poco' : 'prezzi normali'}. Ogni patto commerciale abbassa i prezzi del 5% (max 20%).</p><div class="mlist2 ${has ? '' : 'dis'}">${rows}</div>`, 'market');
}
// ---------- eventi casuali ----------
const EVENTS = [
  { id: 'mercante', s: 'all', ic: '🧺', t: 'Il mercante errante', x: 'Un carro carico di lingotti si ferma al Mastio. «Ferro della Stiria, signore. Prezzo onesto.»', ch: [{ l: 'Compra 60 ferro', c: { oro: 110 }, f: () => addRes('ferro', 60) }, { l: 'Vendigli pelli (3)', need: () => S.res.pelli >= 3, f: () => { S.res.pelli -= 3; addRes('oro', 90); } }, { l: 'Lascialo andare' }] },
  { id: 'raccolto', s: ['autunno'], ic: '🌾', t: 'Raccolto abbondante', x: 'I campi hanno dato più grano del previsto. I granai traboccano.', ch: [{ l: 'Riempi i granai', f: () => addRes('cibo', 180) }, { l: 'Vendi l\'eccedenza', f: () => addRes('oro', 140) }] },
  { id: 'gelata', s: ['inverno'], ic: '🥶', t: 'La grande gelata', x: 'Una notte di ghiaccio minaccia le scorte di grano nei granai.', ch: [{ l: 'Scalda i granai', c: { legno: 90 } }, { l: 'Lascia correre (-20% cibo)', f: () => { S.res.cibo = Math.floor(S.res.cibo * 0.8); } }] },
  { id: 'incendio', s: ['estate'], ic: '🔥', cond: () => S.buildings.some(b => resOf(b) && !b.end), t: 'Incendio nel borgo!', x: 'Il fieno secco ha preso fuoco vicino a una bottega.', ch: [{ l: 'Spegni le fiamme', c: { legno: 50, oro: 30 } }, { l: 'Lascia bruciare (bottega ferma 3 min)', f: () => { const bs = S.buildings.filter(b => resOf(b) && !b.end && b.t !== 'mastio'); const b = bs[(Math.random() * bs.length) | 0]; if (b) { b.end = now() + 180000; b.dur = 180000; b.toLvl = b.lvl; toast(`🔥 ${BDEF[b.t].n} va ricostruita`); } } }] },
  { id: 'pellegrini', s: ['primavera', 'estate'], ic: '🙏', t: 'Pellegrini per Melk', x: 'Una schiera di pellegrini chiede pane e un tetto per la notte.', ch: [{ l: 'Sfamali (+favore, Abbazia felice)', c: { cibo: 70 }, f: () => { addRes('favore', 2); relAdd(feudi()[2], 10); } }, { l: 'Mandali via' }] },
  { id: 'banditi', s: 'all', ic: '🗡️', t: 'Banditi al guado', x: 'Una banda blocca il guado e chiede un pedaggio per lasciar passare i tuoi carri.', ch: [{ l: 'Paga il pedaggio', c: { oro: 90 } }, { l: 'Respingili coi soldati', f: () => { if (soldiers() >= 6) { addRes('oro', 80); toast('⚔ I banditi fuggono lasciando il bottino'); } else { const k = UNIT_ORDER.find(k => S.army[k] > 0); if (k) S.army[k]--; S.res.cibo = Math.max(0, S.res.cibo - 50); toast('⚔ Troppo pochi: un soldato cade e i banditi razziano'); } } }] },
  { id: 'epidemia', s: ['inverno', 'primavera'], ic: '🤒', t: 'Febbre nel borgo', x: 'Una febbre si diffonde tra le case. Servono erbe e cure.', ch: [{ l: 'Compra erbe e cure', c: { cibo: 60, oro: 50 } }, { l: 'Affidati alla sorte', f: () => { if (hasB('infermeria') && Math.random() < 0.7) toast('✚ Le guaritrici fermano la febbre'); else { let n = 2; for (const k of UNIT_ORDER) while (n && S.army[k] > 0) { S.army[k]--; n--; } toast('🤒 La febbre si porta via due uomini'); } } }] },
  { id: 'lupi', s: ['inverno', 'autunno'], ic: '🐺', t: 'Lupi affamati', x: 'Di notte i lupi scendono fino ai recinti e sbranano il bestiame.', ch: [{ l: 'Organizza una battuta (3 soldati)', need: () => soldiers() >= 3, f: () => { addRes('pelli', 3); addRes('cibo', 30); } }, { l: 'Perdi il bestiame (-60 cibo)', f: () => { S.res.cibo = Math.max(0, S.res.cibo - 60); } }] },
  { id: 'messaggero', s: 'all', ic: '📨', cond: () => feudi().some(f => f.st === 'neutrale'), t: 'Un messaggero dei vicini', x: '', mk: () => { const f = feudi().filter(f => f.st === 'neutrale')[0]; return { x: `Un cavaliere con lo stemma ${fBase(f).ic} porta i saluti di ${fBase(f).lord}, che vorrebbe migliori rapporti con la Marca.`, ch: [{ l: 'Ricambia con un banchetto', c: { cibo: 80 }, f: () => relAdd(f, 20) }, { l: 'Rispondi con freddezza', f: () => relAdd(f, -5) }] }; } },
  { id: 'torneo', s: ['estate', 'primavera'], ic: '🏇', t: 'Il torneo di mezza estate', x: 'I cavalieri della Marca chiedono di tenere un torneo sotto le tue mura.', ch: [{ l: 'Finanzia il torneo', c: { oro: 120 }, f: () => { addRes('favore', 3); const a = Object.keys(S.army).filter(k => S.army[k] > 0); if (a.length) { const r = vets(a[0])[0]; if (r && recGainXP(r, 80)) toast(`⬆ ${r.nm} vince la giostra e sale di livello`); } } }, { l: 'Rifiuta' }] },
  { id: 'monaco', s: 'all', ic: '📖', t: 'Il monaco erudito', x: 'Un monaco di Melk si offre di insegnare ai tuoi contadini metodi nuovi per i campi e le botteghe.', ch: [{ l: 'Accoglilo', c: { oro: 80 }, f: () => { for (const k in (S.wrk || {})) recGainXP(S.wrk[k], 50); toast('📖 Tutti i contadini guadagnano esperienza'); } }, { l: 'Non serve' }] },
  { id: 'nevicata', s: ['inverno'], ic: '🌨️', cond: () => S.buildings.some(b => b.end), t: 'Nevicata abbondante', x: 'La neve copre i cantieri. I mastri d\'opera chiedono uomini per spalarla.', ch: [{ l: 'Manda uomini a spalare', c: { cibo: 50 } }, { l: 'Aspetta il disgelo (+60s ai cantieri)', f: () => { for (const b of S.buildings) if (b.end) { b.end += 60000; b.dur += 60000; } } }] },
  { id: 'fiera', s: ['primavera'], ic: '🎪', t: 'La fiera di primavera', x: 'Mercanti da tutta la Marca montano le bancarelle. Si fanno affari d\'oro.', ch: [{ l: 'Fai scorta', c: { oro: 100 }, f: () => { addRes('cibo', 150); addRes('legno', 120); } }, { l: 'Riscuoti le tasse', f: () => addRes('oro', 70) }] },
  { id: 'disertore', s: 'all', ic: '🛡️', t: 'Un disertore', x: 'Un soldato di Semmering bussa alla porta: è stanco del suo signore e vuole servirti.', ch: [{ l: 'Arruolalo', need: () => armyUsed() < armyCap(), f: () => { S.army.miliziano = (S.army.miliziano || 0) + 1; relAdd(feudi()[3], -5); } }, { l: 'Rimandalo indietro', f: () => relAdd(feudi()[3], 8) }] },
  { id: 'tempesta', s: ['estate', 'autunno'], ic: '⛈️', t: 'La tempesta', x: 'Il vento della notte ha abbattuto alberi e scoperchiato tetti.', ch: [{ l: 'Raccogli la legna caduta', f: () => addRes('legno', 70) }, { l: 'Ripara i tetti', c: { legno: 40 }, f: () => addRes('favore', 1) }] },
];
// ================= EVENTI VISIBILI: i visitatori arrivano a piedi (o a cavallo) fino al Mastio =================
const EV_VIS = { mercante: ['carro', 1, 'Il mercante errante'], fiera: ['carro', 2, 'I mercanti della fiera'], pellegrini: ['infermiera', 3, 'Pellegrini'], monaco: ['infermiera', 1, 'Il monaco erudito'], messaggero: ['arccavallo', 1, 'Un messaggero'], torneo: ['arccavallo', 2, 'Cavalieri del torneo'], disertore: ['miliziano', 1, 'Un disertore'], banditi: ['arccorto', 2, 'Banditi'] };
function visitorTarget(sc) { const m = sc.B.find(b => b.t === 'mastio'); if (!m) return null; const [fx, fy] = frontTile(sc, m); return [fx, fy]; }
function visitorSpawn(sc, id, atDoor) {
  const v = EV_VIS[id]; const tg = visitorTarget(sc); if (!v || !tg) return false; const [tx, ty] = tg; const G = sc.pathG;
  let start = null; if (atDoor) start = [tx + 1, ty + 1]; else { let bd = 1e9; for (let i = 4; i < N - 4; i += 5) for (const [ex, ey] of [[i, 3], [i, N - 4], [3, i], [N - 4, i]]) { if (isWater(sc, ex, ey) || bAt(sc, ex, ey)) continue; const d = Math.hypot(ex - tx, ey - ty) + Math.random() * 30; if (d < bd) { bd = d; start = [ex, ey]; } } }
  if (!start) return false; const path = atDoor ? [] : astar(start[0], start[1], (x, y) => Math.abs(x - tx) <= 1 && Math.abs(y - ty) <= 1, villagerCost(sc), tx, ty, 9000); if (!atDoor && !path) return false;
  for (let i = 0; i < v[1]; i++) { const u = mkUnit('miliziano', 'V', start[0] + 0.5 + i * 0.35, start[1] + 0.5 + i * 0.25); u.k = v[0]; u.vis = id; u.visLead = i === 0; u.visName = v[2];
    if (v[0] === 'carro') { u.d = { spd: 0.85, hp: 1, cd: 1, rng: 0, model: 1 }; u.cart = v[2]; } else u.d = Object.assign({}, UDEF[v[0]] || UDEF.miliziano, { spd: 0.75 });
    u.path = path ? path.slice() : []; u.pi = 0; u.ai = visitorAI; u.arrived = atDoor; u.delay = i * 0.6; sc.U.push(u); }
  return true;
}
function visitorAI(sc, u, dt) {
  if (u.delay > 0) { u.delay -= dt; return; }
  if (!u.arrived) { if (!u.path || followPath(sc, u, dt)) { u.arrived = true; u.moving = false; u.face = 'F'; if (u.visLead && S.visEv && S.visEv.id === u.vis) { S.visEv.arr = now(); floatText(sc, u.x, u.y, '❗ ' + u.visName + (EV_VIS[u.vis][1] > 1 ? ' chiedono udienza' : ' chiede udienza'), '#ffe9a6', 2.2); sfx('bell'); } } return; }
  u.moving = false; if (!S.visEv || S.visEv.id !== u.vis) { u.dead = true; u.deadT = 9; }
}
function visitorsOf(sc) { return sc ? sc.U.filter(u => u.vis && !u.dead) : []; }
function visitorStart(e) { if (!EV_VIS[e.id] || !SC) return false; S.visEv = { id: e.id, t: now(), arr: 0 }; if (!visitorSpawn(SC, e.id)) { S.visEv = null; return false; } toast(`👀 ${EV_VIS[e.id][2]} si avvicina al Mastio…`); return true; }
function visitorTick(dt) {
  if (!S || !S.visEv || MODE !== 'village' || !SC) return; const ve = S.visEv;
  if (!visitorsOf(SC).length) visitorSpawn(SC, ve.id, true); // dopo un ricaricamento aspetta già alla porta
  if (ve.arr && !ve.shown && $('#sheet').classList.contains('hidden') && !placing) { ve.shown = 1; const e = EVENTS.find(x => x.id === ve.id); if (e) openEvent(e); }
  if (now() - ve.t > 8 * 60000) { S.visEv = null; toast('Il visitatore se n\'è andato senza udienza'); }
}
function visitorDone() { if (!S.visEv) return; S.visEv = null; if (SC) for (const u of visitorsOf(SC)) { u.dead = true; u.deadT = 9; } }
function pickVisitor(sx, sy) { if (!SC || !S.visEv) return null; const wx = (sx - VW / 2) / cam.z + cam.x, wy = (sy - VH / 2) / cam.z + cam.y; for (const u of visitorsOf(SC)) { const [bx, by] = W(u.x, u.y); if (Math.abs(wx - bx) < 22 && wy > by - 60 && wy < by + 8) return u; } return null; }
function drawVisitorMark(c, sc, u) { if (!u.visLead || !S.visEv || u.dead) return; const [x, y] = W(u.x, u.y); const t = sc.time, by = y - (u.d && u.d.cav ? 76 : 58) - Math.abs(Math.sin(t * 3)) * 4; c.fillStyle = 'rgba(253,246,227,0.96)'; c.strokeStyle = '#5c3a25'; c.lineWidth = 1.5; c.beginPath(); c.arc(x, by, 11, 0, 7); c.fill(); c.stroke(); c.beginPath(); c.moveTo(x - 4, by + 9); c.lineTo(x, by + 16); c.lineTo(x + 4, by + 9); c.fill(); c.fillStyle = '#b3261e'; c.font = 'bold 14px serif'; c.textAlign = 'center'; c.fillText('!', x, by + 5); c.textAlign = 'start'; }
function evPick() {
  const s = seasonInfo().s.k; const pool = EVENTS.filter(e => (e.s === 'all' || e.s.includes(s)) && (!e.cond || e.cond()) && e.id !== S.lastEv);
  return pool[(Math.random() * pool.length) | 0];
}
function eventTick(dt) {
  if (!S || S.creative || S.sandbox || MODE !== 'village' || S.mq < 3) return;
  S.evIn = (S.evIn == null ? 200 : S.evIn) - dt;
  if (S.evIn <= 0 && $('#sheet').classList.contains('hidden') && !placing) { const e = evPick(); if (!e) { S.evIn = 60; return; } S.evIn = 360 + Math.random() * 240; S.lastEv = e.id; if (S.visEv || !visitorStart(e)) openEvent(e); }
}
let CUR_EV = null;
function openEvent(e) {
  const v = e.mk ? e.mk() : e; CUR_EV = { e, ch: v.ch }; sfx('bell');
  openSheet(`${e.ic} ${e.t}`, `<div class="evc"><div class="evi">${e.ic}</div><p class="evx">${v.x || e.x}</p><div class="evch">${v.ch.map((c, i) => { const ok = (!c.c || canPay(c.c)) && (!c.need || c.need()); return `<button class="btn ${i === v.ch.length - 1 && !c.c && !c.f ? 'ghost' : ''} ${ok ? '' : 'dis'}" ${ok ? '' : 'disabled'} onclick="evChoose(${i})">${c.l}${c.c ? `<small>${costStr(c.c)}</small>` : ''}</button>`; }).join('')}</div></div>`, 'event');
}
function evChoose(i) { const c = CUR_EV && CUR_EV.ch[i]; if (!c) return; if (S.visEv && S.visEv.id === CUR_EV.e.id) visitorDone(); if (c.c) { if (!canPay(c.c)) return; pay(c.c); } if (c.f) c.f(); S.events = (S.events || 0) + 1; CUR_EV = null; closeSheet(); save(); updateHUD(); }
// ---------- conseguenze delle stagioni ----------
const seasonBuildMul = () => (S && !S.creative && seasonInfo().s.k === 'inverno') ? 1.25 : 1;
const seasonRaidMul = () => { const k = seasonInfo().s.k; return k === 'inverno' ? 1.4 : k === 'estate' ? 0.85 : 1; };
function seasonTick(dt) {
  if (!S || S.creative || MODE !== 'village') return; const si = seasonInfo();
  if (S.prevSeasonK && S.prevSeasonK !== si.s.k && si.s.k === 'primavera') { S.winters = (S.winters || 0) + 1; }
  S.prevSeasonK = si.s.k;
  if (si.s.k !== 'inverno') return;
  S.upkT = (S.upkT || 0) + dt; if (S.upkT < 60) return; S.upkT = 0;
  const need = Math.ceil(armyUsed() * 0.5); if (!need) return;
  if (S.res.cibo >= need) { S.res.cibo -= need; if (Math.random() < 0.25) toast(`❄️ L'esercito consuma ${need} ${ICO('cibo')} per l'inverno`); }
  else { S.res.cibo = 0; const k = UNIT_ORDER.slice().reverse().find(k => S.army[k] > 0); if (k) { S.army[k]--; toast(`❄️ Fame d'inverno: un ${UDEF[k].n} diserta`); } }
}
// ---------- capitoli della campagna ----------
const CHAPTERS = [
  { n: 'I', t: 'Il Mastio di Legno', x: 'Autunno dell\'anno del Signore 1254. La stirpe sveva è spenta e l\'Impero è spezzato in cento feudi. Ti resta un mastio di legno marcio, una manciata di contadini e una lettera dal sigillo infranto: «Reclama ciò che è tuo». Prima di ogni corona, servono pane, tetti e uomini.', r: { oro: 120, legno: 120 } },
  { n: 'II', t: 'Fuoco e Ferro', x: 'La voce del nuovo signore corre lungo il Danubio, e con lei arrivano i predoni. Senza fabbri, senza guaritrici e senza mura il borgo non vedrà la primavera. Fai cantare le incudini.', r: { ferro: 80, oro: 150 } },
  { n: 'III', t: 'I Vicini della Marca', x: 'Cinque signori si spartiscono le valli intorno a te: un conte superbo, un barone avido, un abate, un cavaliere rinnegato e il potente Margravio di Steyr. Con l\'oro e la parola si vincono più guerre che con la spada.', r: { oro: 200, favore: 3 } },
  { n: 'IV', t: 'Il Lungo Inverno', x: 'Il vento del nord porta neve e fame. D\'inverno l\'esercito mangia il doppio, i cantieri rallentano e i lupi scendono fino ai recinti. Prepara i granai e tempra i tuoi uomini.', r: { cibo: 300, pelli: 4 } },
  { n: 'V', t: 'L\'Età Feudale', x: 'Il legno lascia il posto alla pietra: il Mastio diventa un castello. Ora sei un signore tra i signori. Giura alleanze, fai passare le carovane e mostra alla Marca chi comanda in battaglia.', r: { oro: 400, favore: 6 } },
  { n: 'VI', t: 'Le Corone Spezzate', x: 'I frammenti della corona di Svevia sono sparsi tra i feudi. Chi riunirà vassalli e alleati sotto un solo stendardo potrà reclamarla.', r: { oro: 600, favore: 10 } },
  { n: 'VII', t: 'L\'Età dei Castelli', x: 'Mura concentriche, torri e baliste: la tua rocca è la più temuta del Danubio. Ma un trono si regge sulla fedeltà dei vassalli, non solo sulle pietre.', r: { oro: 900, favore: 15 } },
  { n: 'VIII', t: 'L\'Impero', x: 'Tutta la Marca guarda a te. Resta un ultimo passo: unire ogni feudo sotto la tua corona e alzare il Mastio fino al cielo. Che le campane suonino il nome del nuovo Imperatore.', r: { favore: 30 } },
];
const vetMax = () => { let m = 1; for (const k in (S.vets || {})) for (const r of S.vets[k]) m = Math.max(m, r.lvl); return m; };
const QUESTS = [
  { ch: 0, t: 'Costruisci la Taverna', b: 'taverna', c: () => built('taverna') >= 1, r: { oro: 80, legno: 60 } },
  { ch: 0, t: 'Costruisci una terza Casa', b: 'casa', c: () => built('casa') >= 3, r: { legno: 120 } },
  { ch: 0, t: 'Riscuoti 5 volte dalle botteghe', c: () => (S.collects || 0) >= 5, r: { cibo: 120 } },
  { ch: 0, t: 'Raduna un esercito di 14 uomini', c: () => Object.keys(S.army).reduce((a, k) => a + S.army[k] * UDEF[k].sp, 0) >= 14, r: { cibo: 150 } },
  { ch: 0, t: 'Vinci il tuo primo assedio', c: () => S.wins >= 1, r: { oro: 150, favore: 2 } },
  { ch: 1, t: 'Porta il Mastio al livello 2', m: 1, c: () => S.mastio >= 2, r: { legno: 200, cibo: 100 } },
  { ch: 1, t: 'Costruisci il Fabbro', b: 'fucina', c: () => built('fucina') >= 1, r: { ferro: 60 } },
  { ch: 1, t: "Costruisci l'Infermeria", b: 'infermeria', c: () => built('infermeria') >= 1, r: { oro: 120 } },
  { ch: 1, t: 'Respingi una razzia notturna', c: () => S.raidsWon >= 1, r: { favore: 3, oro: 100 } },
  { ch: 1, t: 'Porta il Mastio al livello 3', m: 1, c: () => S.mastio >= 3, r: { pietra: 150 } },
  { ch: 2, t: 'Manda un dono a un feudo vicino', c: () => (S.gifts || 0) >= 1, r: { oro: 80 }, how: 'Mappa → Diplomazia' },
  { ch: 2, t: 'Costruisci il Mercato', b: 'mercato', c: () => built('mercato') >= 1, r: { legno: 150 } },
  { ch: 2, t: 'Commercia 3 volte al Mercato', c: () => (S.trades || 0) >= 3, r: { oro: 100 }, how: 'Mappa → Mercato' },
  { ch: 2, t: 'Stringi un patto commerciale', c: () => countSt('patto', 'alleato') >= 1, r: { oro: 150, favore: 2 } },
  { ch: 2, t: 'Affronta 3 eventi della Marca', c: () => (S.events || 0) >= 3, r: { cibo: 150 } },
  { ch: 3, t: "Costruisci l'Armeria", b: 'armeria', c: () => built('armeria') >= 1, r: { ferro: 120 } },
  { ch: 3, t: 'Caccia 3 animali selvatici', c: () => (S.hunted || 0) >= 3, r: { cibo: 150, pelli: 3 } },
  { ch: 3, t: 'Sopravvivi a un inverno', c: () => (S.winters || 0) >= 1, r: { cibo: 200, legno: 150 } },
  { ch: 3, t: 'Porta il Mastio al livello 4', m: 1, c: () => S.mastio >= 4, r: { oro: 300, ferro: 100 } },
  { ch: 3, t: 'Ottieni 3 stelle in un assedio', c: () => !!S.best3, r: { favore: 5 } },
  { ch: 4, t: 'Il Mastio diventa Castello (liv. 5)', m: 1, c: () => S.mastio >= 5, r: { oro: 500, favore: 5 } },
  { ch: 4, t: 'Giura alleanza con un feudo', c: () => countSt('alleato') >= 1, r: { oro: 250 } },
  { ch: 4, t: 'Ricevi 5 carovane', c: () => (S.caravans || 0) >= 5, r: { pietra: 200 } },
  { ch: 4, t: 'Porta un veterano al livello 5', c: () => vetMax() >= 5, r: { ferro: 150 } },
  { ch: 4, t: 'Vinci 10 assedi', c: () => S.wins >= 10, r: { favore: 10 } },
  { ch: 5, t: 'Rendi vassallo un feudo', c: () => countSt('vassallo') >= 1, r: { oro: 400 }, how: 'Esigi tributo o conquistalo in guerra' },
  { ch: 5, t: 'Castello al livello 8', m: 1, c: () => S.mastio >= 8, r: { favore: 15 } },
  { ch: 5, t: 'Due feudi alleati o vassalli', c: () => countSt('alleato', 'vassallo') >= 2, r: { oro: 500 } },
  { ch: 6, t: 'Mastio al livello 10', m: 1, c: () => S.mastio >= 10, r: { pietra: 400, oro: 400 } },
  { ch: 6, t: 'Tre feudi alleati o vassalli', c: () => countSt('alleato', 'vassallo') >= 3, r: { favore: 15 } },
  { ch: 6, t: 'Mastio al livello 12', m: 1, c: () => S.mastio >= 12, r: { oro: 800 } },
  { ch: 7, t: 'Mastio al livello 14', m: 1, c: () => S.mastio >= 14, r: { oro: 1000, ferro: 400 } },
  { ch: 7, t: 'Tutti i feudi alleati o vassalli', c: () => countSt('alleato', 'vassallo') >= 5, r: { favore: 25 } },
  { ch: 7, t: 'Mastio al livello 16: sei Imperatore', m: 1, c: () => S.mastio >= 16, r: { favore: 50 } },
];
function questMigrate() { if (S.qv === 2) return; S.qv = 2; let i = 0; while (i < QUESTS.length && QUESTS[i].c()) i++; S.mq = Math.min(S.mq || 0, i); if ((S.mq || 0) > 0) S.chSeen = QUESTS[Math.min(S.mq, QUESTS.length - 1)].ch; }
let CH_IDLE = 0;
function chapterTick(dt) {
  if (!S || S.creative || S.sandbox || MODE !== 'village' || placing || !$('#sheet').classList.contains('hidden')) { CH_IDLE = 0; return; } CH_IDLE += dt || 0; if (CH_IDLE < 1.2) return;
  const q = QUESTS[S.mq]; if (!q) return; if ((S.chSeen == null ? -1 : S.chSeen) < q.ch) { S.chSeen = q.ch; if (q.ch > 0) { openCronaca(q.ch); STORY.onEnd = () => openChapter(q.ch); } else openChapter(q.ch); }
}
function openChapter(i) {
  const C = CHAPTERS[i]; const qs = QUESTS.filter(q => q.ch === i);
  openSheet(`📜 Capitolo ${C.n}`, `<div class="chap"><div class="chn">Capitolo ${C.n}</div><h3>${C.t}</h3><p class="chx">${C.x}</p><div class="chq"><b>Obiettivi</b>${qs.map(q => `<div>◇ ${q.t}${q.how ? ` <small>(${q.how})</small>` : ''}</div>`).join('')}</div><div class="chr">Ricompensa del capitolo: ${Object.keys(C.r).map(k => ICO(k) + ' ' + C.r[k]).join(' ')}</div><div class="acts"><button class="btn big" onclick="closeSheet()">Comincia</button></div></div>`, 'chapter');
}
// ================= STORIA: prologo alla prima apertura e Cronache rileggibili =================
const PROLOGO = [
  { img: 1, ic: '👑', t: 'Anno del Signore 1254', x: 'L\'ultimo degli Svevi è morto lontano, in terra di Puglia. Con lui si è spenta la stirpe che teneva insieme l\'Impero.<br><br>La corona d\'oro di Svevia, dicono, si è spezzata la notte stessa della sua morte.' },
  { img: 2, ic: '🗺️', t: 'La Marca Orientale', x: 'Lungo il Danubio i vassalli non obbediscono più a nessuno. Conti superbi, baroni avidi, abati potenti e cavalieri rinnegati si contendono valli, guadi e villaggi.<br><br>Ogni signore costruisce mura. Nessuno si fida del vicino.' },
  { img: 3, ic: '🛡️', t: 'L\'ultimo di un casato', x: 'Tu sei il figlio minore di un piccolo casato caduto in disgrazia. Tuo padre è morto in un\'imboscata, i tuoi fratelli in battaglia.<br><br>Ti resta un nome, uno stemma sbiadito e un mastio di legno marcio ai confini della Marca.' },
  { img: 4, ic: '✉️', t: 'Il sigillo infranto', x: 'Una notte un cavaliere senza insegne ti consegna una lettera e sparisce nel buio. Il sigillo di ceralacca è spezzato a metà, come la corona.<br><br>Dentro, poche parole: <i>«Reclama ciò che è tuo.»</i><br><br>Nessuno sa chi l\'abbia scritta.' },
  { img: 5, ic: '🌅', t: 'L\'alba sul borgo', x: 'All\'alba raggiungi il villaggio. Una manciata di contadini ti guarda in silenzio, tra case di paglia e una palizzata che cade a pezzi.<br><br>Il vecchio Siniscalco ti aspetta davanti al mastio.<br><br><i>«Mio signore, il feudo è vostro. Da dove cominciamo?»</i>' },
];
// una pagina di cronaca per ogni capitolo: si sblocca quando il capitolo comincia
const CRONACHE = [
  'Il mastio cigola a ogni folata di vento e i contadini hanno più fame che speranza. Il Siniscalco ti mostra i campi incolti, la taverna chiusa, la palizzata marcita.<br><br>«Prima di ogni corona, mio signore, servono pane, tetti e uomini.»<br><br>Quella notte, al lume di una candela, rileggi la lettera. Sul bordo del sigillo spezzato noti un segno che non avevi visto: mezza aquila nera.',
  'La voce del nuovo signore corre lungo il Danubio, e con lei arrivano i predoni. Le prime notti di fuoco ti insegnano che un feudo senza fabbri e senza guaritrici non sopravvive all\'inverno.<br><br>Tra i briganti uccisi trovi un uomo con lo stesso segno della lettera tatuato sul polso: mezza aquila nera. Qualcuno, nella Marca, conosce il tuo nome meglio di te.',
  'Cinque signori si spartiscono le valli intorno al tuo borgo. Il Conte Ottokar ti riceve con disprezzo, il Barone Ulrich conta le tue monete, l\'Abate di Melk ti benedice e ti osserva.<br><br>Ognuno, a modo suo, ti chiede della lettera. Nessuno ammette di averla scritta. Ma l\'Abate, quando vede il sigillo, impallidisce.',
  'Il vento del nord porta neve, fame e lupi. Nelle lunghe notti d\'inverno Fratello Tomas ti racconta una storia: prima di morire, l\'ultimo Svevo avrebbe affidato i frammenti della corona a sei famiglie fedeli, perché nessun usurpatore potesse mai indossarla.<br><br>«La vostra famiglia, mio signore, era una di quelle sei.»',
  'Il legno lascia il posto alla pietra: il mastio diventa un castello e i signori della Marca smettono di ridere. Le carovane passano dalle tue terre, i vassalli giurano fedeltà.<br><br>Una dama arriva al castello con una scorta di cavalieri: Lady Isolde. Al collo porta un pendente d\'oro a forma di mezza aquila.',
  'Lady Isolde confessa: è stata lei a scrivere la lettera. Suo padre custodiva un frammento della corona, ed è morto per difenderlo. Il Margravio di Steyr sta radunando gli altri pezzi con la spada e con l\'inganno.<br><br>«Chi riunirà i frammenti potrà reclamare l\'Impero. Ho scelto voi, perché siete l\'unico a cui non importava della corona.»',
  'Mura concentriche, torri e baliste: la tua rocca è la più temuta del Danubio. Tre frammenti sono nelle tue mani, due in quelle del Margravio.<br><br>Ma un trono si regge sulla fedeltà dei vassalli, non sulle pietre. Il Margravio lo sa, e compra i tuoi alleati uno a uno.',
  'Tutta la Marca guarda a te. Nella cappella del castello i frammenti della corona di Svevia giacciono su un cuscino di velluto, in attesa dell\'ultimo pezzo.<br><br>Resta un passo: unire ogni feudo sotto il tuo stendardo e alzare il mastio fino al cielo. Allora la corona spezzata tornerà intera, e le campane suoneranno il tuo nome.',
];
const storyImg = i => `ui/story_${i}.webp`;
function storyPanel(p, n, i, last) {
  return `<div class="stimg"><img src="${storyImg(p.img || 6)}" alt="" onload="this.classList.add('ok');this.nextElementSibling&&this.nextElementSibling.remove()" onerror="this.remove()"><div class="stph"><span>${p.ic || '📜'}</span></div></div>
    <div class="sttx"><div class="stn">${n}</div><h2>${p.t}</h2><p>${p.x}</p></div>
    <div class="stnav">${Array.from({ length: n.total || 1 }, (_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div>
    <div class="sthint">${last ? (p.sub === 'Prologo' ? 'Tocca per cominciare' : 'Tocca per chiudere') : 'Tocca per continuare'}</div>`;
}
let STORY = null;
const STORY_IMG = {}; function storyPreload(pages) { return Promise.all(pages.map(p => { const src = storyImg(p.img || 6); if (STORY_IMG[src]) return STORY_IMG[src]; const im = new Image(); im.src = src; return STORY_IMG[src] = (im.decode ? im.decode() : new Promise(r => { im.onload = r; })).catch(() => { }); })); }
function storyOpen(pages, onEnd) { storyPreload(pages).then(() => storyOpen0(pages, onEnd)); }
function storyOpen0(pages, onEnd) { STORY = { pages, i: 0, onEnd }; let el = $('#story'); if (!el) { el = document.createElement('div'); el.id = 'story'; el.innerHTML = '<button class="stskip" onclick="event.stopPropagation();storyEnd()">Salta ›</button><div class="stbox"></div>'; el.addEventListener('click', storyNext); document.body.appendChild(el); } el.classList.remove('hidden'); storyShow(); try { musicStart(); } catch (e) { } }
function storyShow() { const el = $('#story'), p = STORY.pages[STORY.i]; const n = { total: STORY.pages.length, toString() { return '' } }; const box = el.querySelector('.stbox'); box.classList.remove('in'); box.innerHTML = storyPanel(p, Object.assign(n, { toString: () => p.sub || '' }), STORY.i, STORY.i === STORY.pages.length - 1); void box.offsetWidth; box.classList.add('in'); }
function storyNext() { if (!STORY) return; if (STORY.i < STORY.pages.length - 1) { STORY.i++; sfx('click'); storyShow(); } else storyEnd(); }
function storyEnd() { const el = $('#story'); if (el) el.classList.add('hidden'); const f = STORY && STORY.onEnd; STORY = null; if (f) f(); }
function prologueMaybe() { if (SET.storySeen) return; SET.storySeen = 1; saveSet(); storyOpen(PROLOGO.map(p => Object.assign({ sub: 'Prologo' }, p))); }
function curChapter() { if (!S) return -1; const q = QUESTS[Math.min(S.mq, QUESTS.length - 1)]; return S.mq >= QUESTS.length ? CHAPTERS.length - 1 : (q ? q.ch : 0); }
function openCronache() {
  const cur = S && !S.sandbox && !S.creative ? curChapter() : -1;
  const row = (ok, ic, t, sub, on) => `<button class="crow ${ok ? '' : 'lock'}" ${ok ? `onclick="${on}"` : ''}><span class="cic">${ok ? ic : '🔒'}</span><span class="ctx"><b>${t}</b><small>${sub}</small></span></button>`;
  openSheet('📜 Cronache della Marca', `<p class="desc"><i>Le pagine del cronista del tuo casato. Ogni capitolo della campagna ne aggiunge una nuova.</i></p><div class="cron">${row(true, '👑', 'Prologo', 'La corona spezzata e la lettera', 'closeSheet();storyOpen(PROLOGO.map(p=>Object.assign({sub:\'Prologo\'},p)))')}
    ${CHAPTERS.map((C, i) => row(i <= cur, '📖', `Capitolo ${C.n} · ${C.t}`, i <= cur ? (i < cur ? 'Concluso' : 'In corso') : 'Sigillato: si apre andando avanti nella campagna', `closeSheet();openCronaca(${i})`)).join('')}</div>`, 'cron');
}
function openCronaca(i) { const C = CHAPTERS[i]; storyOpen([{ img: i === 2 || i === 3 ? 7 : 6, ic: '📖', sub: `Capitolo ${C.n}`, t: C.t, x: CRONACHE[i] || C.x }]); }
function campaignTick(dt) { diploTick(dt); seasonTick(dt); eventTick(dt); chapterTick(dt); diaryTick(dt); forecastTick(); }
function questHTML() {
  const q = QUESTS[S.mq]; if (!q) return '<span class="qt">📜 La Marca è tua. Tutte le missioni compiute.</span>';
  const done = q.c(); const rw = Object.keys(q.r).map(k => ICO(k) + q.r[k]).join(' ');
  const chq = QUESTS.filter(x => x.ch === q.ch), ci = chq.indexOf(q) + 1;
  const qc = !done && questCost(); const nl = qc ? needLabel(qc.cost) : '';
  return `<span class="ql" onclick="openChapter(${q.ch})">📜 Cap. ${CHAPTERS[q.ch].n} · ${ci}/${chq.length}</span> <span class="qt">${q.t}</span> <span class="qr">${rw}</span>${done ? '<button class="qb" onclick="claimQuest()">Riscuoti</button>' : ''}${nl ? `<span class="qn" onclick="questNeed()">${nl} ›</span>` : ''}`;
}
function claimQuest() { const q = QUESTS[S.mq]; if (!q || !q.c()) return; for (const k in q.r) addRes(k, q.r[k]); const chDone = !QUESTS[S.mq + 1] || QUESTS[S.mq + 1].ch !== q.ch; S.mq++; if (chDone) { const C = CHAPTERS[q.ch]; for (const k in C.r) addRes(k, C.r[k]); setTimeout(() => toast(`🏆 Capitolo ${C.n} «${C.t}» completato! ${Object.keys(C.r).map(k => ICO(k) + ' +' + C.r[k]).join(' ')}`), 1800); } sfx('coin'); toast(`📜 Missione compiuta! ${Object.keys(q.r).map(k => ICO(k) + ' +' + q.r[k]).join(' ')}`); save(); updateHUD(); }

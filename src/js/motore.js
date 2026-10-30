// FEUDUM · MOTORE: grafica 3D (WebGL), disegno di edifici/alberi/terreno, sentieri, sprite, audio, scena e rendering, camera e tocchi
// ================= GL3D: mini WebGL renderer for real 3D buildings (isometric ortho, matches the 2D map) =================
const G3 = { cv: null, gl: null, prog: null, models: {}, ok: false };
const SHX = 0.44, SHY = -0.25; // ombra portata: direzione opposta al sole (in alto a sinistra), per unità di altezza
const ISO_H = 39.19; // pixels per tile of height (ortho camera at 30° elevation)
function b64u8(s) { const bin = atob(s); const a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return a; }
function g3init() {
  if (G3.gl || typeof M3D === 'undefined') return !!G3.gl;
  const cv = document.createElement('canvas'); cv.width = cv.height = 16;
  const gl = cv.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: true, preserveDrawingBuffer: true });
  if (!gl) return false;
  const vs = `attribute vec3 aP; attribute vec4 aN; attribute vec2 aU;
  uniform vec3 uMin, uSize; uniform mat2 uM; uniform vec2 uC; uniform float uS, uY0; uniform vec4 uRect; uniform float uD0; uniform float uSh;
  varying vec2 vU; varying vec3 vN;
  void main(){ vec3 p = uMin + aP * uSize; vec2 g = uC + uM * vec2(p.x, p.z) * uS; float h = (p.y - uY0) * uS;
    if (uSh > 0.5) { g += vec2(${SHX}, ${SHY}) * h; h = 0.0; }
    float X = (g.x - g.y) * 32.0, Y = (g.x + g.y) * 16.0 - h * ${ISO_H.toFixed(2)};
    float d = -(g.x + g.y) * 0.6124 - h * 0.5 - uD0;
    gl_Position = vec4((X - uRect.x) / uRect.z * 2.0 - 1.0, 1.0 - (Y - uRect.y) / uRect.w * 2.0, clamp(d / 12.0, -0.99, 0.99), 1.0);
    vec3 n = aN.xyz; vec2 nh = uM * vec2(n.x, n.z); vN = normalize(vec3(nh, n.y)); vU = aU; }`;
  const fs = `precision mediump float; varying vec2 vU; varying vec3 vN; uniform sampler2D uT; uniform vec3 uL; uniform float uShF;
  void main(){ if (uShF > 0.5) { gl_FragColor = vec4(0.0, 0.0, 0.0, 0.3); return; } vec4 c = texture2D(uT, vU); vec3 n = normalize(vN); float dif = max(dot(n, uL), 0.0); float back = max(dot(n, -uL), 0.0) * 0.12;
    float sky = 0.5 + 0.5 * n.z; vec3 col = c.rgb * (0.66 + 0.16 * sky + 0.5 * dif + back); col = mix(vec3(dot(col, vec3(0.299,0.587,0.114))), col, 1.12);
    gl_FragColor = vec4(col, 1.0); }`;
  const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(o)); return o; };
  const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { console.error(gl.getProgramInfoLog(pr)); return false; }
  G3.cv = cv; G3.gl = gl; G3.prog = pr;
  const U = n => gl.getUniformLocation(pr, n); G3.u = { min: U('uMin'), size: U('uSize'), M: U('uM'), C: U('uC'), S: U('uS'), Y0: U('uY0'), rect: U('uRect'), D0: U('uD0'), T: U('uT'), L: U('uL'), Sh: U('uSh'), ShF: U('uShF') };
  G3.a = { P: gl.getAttribLocation(pr, 'aP'), N: gl.getAttribLocation(pr, 'aN'), U: gl.getAttribLocation(pr, 'aU') };
  for (const k in M3D) { g3load(k, M3D[k]); delete M3D[k]; } for (const a in M3D_ALIAS) if (a !== 'mastio' && G3.models[M3D_ALIAS[a]]) G3.models[a] = G3.models[M3D_ALIAS[a]];
  return true;
}
// ---- caricamento a pezzi dei modelli 3D: si scarica solo ciò che serve, il resto con calma ----
const M3D_FILES = new Set(["arciere3d", "catapulta3d", "ariete3d", "insegna", "lampione", "pozzogrande", "staccionata", "steccato", "cavallofrisia", "cassa", "anfora", "cassafieno", "botte", "cassaortaggi", "fontanella", "stenditoio", "mucchiosassi", "felce", "segnavia", "gonfalone", "rovinamuro", "arco", "colonna", "rovine", "lastricato", "muretto", "rastrelliera", "carriola", "pozzo", "carretto", "croce", "lanterna", "abete3d", "accademia", "armeria", "balista", "balista_b", "balista_c", "bottino", "cancello", "capanno", "casa", "caserma", "castello", "cava", "chiesa", "falegnameria", "falo", "fattoria", "fucina", "generale", "granaio", "infermeria", "mercato", "miniera", "monastero", "municipio", "mura", "olmo3d", "palizzata", "poligono", "quercia3d", "spoglio3d", "stalla", "taverna", "tenda", "tesoreria", "torre", "torrepietra", "tronco3d", "cripta"]);
const M3D_ALIAS = { granaio: 'stalla', mastio: 'castello', tronco: 'tronco3d' };
const L3 = { state: {}, q: [], active: 0, max: 3, prefetch: [] };
function need3d(k, low) {
  k = M3D_ALIAS[k] && !M3D_FILES.has(k) ? M3D_ALIAS[k] : k; if (!M3D_FILES.has(k) || L3.state[k]) return; L3.state[k] = 'q';
  if (low) L3.prefetch.push(k); else L3.q.push(k); pump3d();
}
function pump3d() {
  while (L3.active < L3.max && (L3.q.length || (L3.prefetch.length && L3.active < 1))) {
    const k = L3.q.length ? L3.q.shift() : L3.prefetch.shift(); if (L3.state[k] !== 'q') continue; L3.state[k] = 'l'; L3.active++;
    const sc = document.createElement('script'); sc.src = 'm3d/' + k + '.js'; sc.async = true;
    sc.onload = () => { L3.state[k] = 'ok'; L3.active--; if (G3.gl && M3D[k]) { if (!G3.models[k]) g3load(k, M3D[k]); for (const a in M3D_ALIAS) if (M3D_ALIAS[a] === k && !G3.models[a] && a !== 'mastio') G3.models[a] = G3.models[k]; delete M3D[k]; } pump3d(); };
    sc.onerror = () => { L3.state[k] = 'err'; L3.active--; pump3d(); };
    document.head.appendChild(sc);
  }
}
// precarico gli edifici dell'era attuale (a bassa priorità) e quelli già costruiti (subito)
function prefetchEra() {
  if (!S) return; for (const r of S.buildings) { need3d(r.t === 'mastio' ? 'castello' : r.t); if (BDEF[r.t] && BDEF[r.t].wall) need3d(r.lvl >= 2 ? 'mura' : 'palizzata'); }
  need3d('quercia3d'); need3d('abete3d'); need3d('lampione'); need3d('insegna'); need3d('olmo3d', true); need3d('spoglio3d', true); for (const k in ANIM3D) need3d(ANIM3D[k].k);
  for (const t in BDEF) { try { if (maxB(t) > 0) need3d(t, true); } catch (e) { } }
  if (hasB('balista')) { need3d('balista_b', true); need3d('balista_c', true); }
}
function g3load(k, m) {
  const gl = G3.gl; const buf = (data, tgt) => { const b = gl.createBuffer(); gl.bindBuffer(tgt || gl.ARRAY_BUFFER, b); gl.bufferData(tgt || gl.ARRAY_BUFFER, data, gl.STATIC_DRAW); return b; };
  const pos = new Uint16Array(b64u8(m.pos).buffer), nor = new Int8Array(b64u8(m.nor).buffer), uv = new Uint16Array(b64u8(m.uv).buffer), idx = new Uint16Array(b64u8(m.idx).buffer);
  const o = { m, pos: buf(pos), nor: buf(nor), uv: buf(uv), idx: buf(idx, gl.ELEMENT_ARRAY_BUFFER), count: idx.length, tex: null, ready: false };
  const texSrc = m.tex; o.m = { min: m.min, size: m.size, n: m.n };
  const img = new Image(); img.onload = () => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    o.tex = t; o.ready = true; for (const f of (o.fr || [])) { f.tex = t; f.ready = true; } }; img.src = texSrc;
  G3.models[k] = o;
  // personaggi animati: ogni fotogramma è una posa già "cotta" (stessi uv, indici e texture)
  if (m.frames) { o.fr = []; o.anims = {}; for (const a in m.frames) { o.anims[a] = m.frames[a].length; m.frames[a].forEach((f, i) => { const fo = { m: o.m, pos: buf(new Uint16Array(b64u8(f.pos).buffer)), nor: buf(new Int8Array(b64u8(f.nor).buffer)), uv: o.uv, idx: o.idx, count: o.count, tex: null, ready: false }; o.fr.push(fo); G3.models[k + '#' + a + i] = fo; }); }
    // varianti di colore (stessa forma, texture ricolorata)
    for (const v in (m.texv || {})) { const fv = []; for (const a in m.frames) m.frames[a].forEach((f, i) => { const b0 = G3.models[k + '#' + a + i]; const fo = Object.assign({}, b0, { tex: null, ready: false }); fv.push(fo); G3.models[k + '~' + v + '#' + a + i] = fo; });
      const im = new Image(); im.onload = () => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, im); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); for (const f of fv) { f.tex = t; f.ready = true; } }; im.src = m.texv[v]; } }
}
// draws model k for building b into ctx c (world-screen coords). fit = footprint tiles the model should span
// due passate: prima l'ombra portata a terra (piatta, senza profondità), poi il modello sopra
function g3passes(gl, o) {
  if (QQ().sh) { gl.uniform1f(G3.u.Sh, 1); gl.uniform1f(G3.u.ShF, 1); gl.disable(gl.DEPTH_TEST); gl.depthMask(false); gl.drawElements(gl.TRIANGLES, o.count, gl.UNSIGNED_SHORT, 0); }
  gl.uniform1f(G3.u.Sh, 0); gl.uniform1f(G3.u.ShF, 0); gl.enable(gl.DEPTH_TEST); gl.depthMask(true); gl.drawElements(gl.TRIANGLES, o.count, gl.UNSIGNED_SHORT, 0);
}
function g3draw(c, b, k, fit, yaw) {
  if (!g3init()) return false; const o = G3.models[k]; if (!o || !o.ready) return false; const gl = G3.gl, m = o.m;
  const sx = m.size[0], sz = m.size[2]; const S = fit / Math.max(sx, sz);
  // facing: model +Z (front) -> world (+1,+1)/√2, model +X -> world (1,-1)/√2 ; then map rotation
  const f = Math.SQRT1_2; const F = [f, -f, f, f]; // columns: x-> (f,-f)? we want x->(f,-f), z->(f,f)
  const R = [RC, RS_, -RS_, RC]; // rotV as matrix (column-major: col0=(RC,RS_), col1=(-RS_,RC))
  // M = R * F (column-major 2x2)
  let F2 = F; if (yaw) { const cy = Math.cos(yaw), sy = Math.sin(yaw); F2 = [F[0] * cy + F[2] * sy, F[1] * cy + F[3] * sy, -F[0] * sy + F[2] * cy, -F[1] * sy + F[3] * cy]; }
  const M = [R[0] * F2[0] + R[2] * F2[1], R[1] * F2[0] + R[3] * F2[1], R[0] * F2[2] + R[2] * F2[3], R[1] * F2[2] + R[3] * F2[3]];
  const cen = rotP(b.x + b.w / 2, b.y + b.h / 2); const y0 = m.min[1];
  // screen bounds from bbox corners
  let x0 = 1e9, y0s = 1e9, x1 = -1e9, y1 = -1e9;
  for (const ax of [m.min[0], m.min[0] + sx]) for (const az of [m.min[2], m.min[2] + sz]) for (const ay of [m.min[1], m.min[1] + m.size[1]]) {
    const gx = cen[0] + (M[0] * ax + M[2] * az) * S, gy = cen[1] + (M[1] * ax + M[3] * az) * S, h = (ay - y0) * S;
    const X = (gx - gy) * 32, Y = (gx + gy) * 16 - h * ISO_H; x0 = Math.min(x0, X); x1 = Math.max(x1, X); y0s = Math.min(y0s, Y); y1 = Math.max(y1, Y);
    const sgx = gx + SHX * h, sgy = gy + SHY * h, SX = (sgx - sgy) * 32, SY = (sgx + sgy) * 16; x0 = Math.min(x0, SX); x1 = Math.max(x1, SX); y0s = Math.min(y0s, SY); y1 = Math.max(y1, SY);
  }
  x0 -= 4; y0s -= 4; x1 += 4; y1 += 4; const rw = x1 - x0, rh = y1 - y0s;
  const res = Math.min(2.5, cam.z * DPR * 1.15); const key = ANG.toFixed(4) + '|' + res.toFixed(2) + '|' + k + '|' + (yaw || 0).toFixed(3) + QQ().sh;
  if (b.c3k === key && b.c3cv) { c.drawImage(b.c3cv, x0, y0s, rw, rh); b.r3d = [x0, y0s, rw, rh]; return true; } const W = Math.min(2048, Math.ceil(rw * res)), H = Math.min(2048, Math.ceil(rh * res));
  if (G3.cv.width !== W || G3.cv.height !== H) { G3.cv.width = W; G3.cv.height = H; }
  gl.viewport(0, 0, W, H); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.disable(gl.CULL_FACE); gl.useProgram(G3.prog);
  const u = G3.u; gl.uniform3fv(u.min, m.min); gl.uniform3fv(u.size, m.size); gl.uniformMatrix2fv(u.M, false, M); gl.uniform2f(u.C, cen[0], cen[1]);
  gl.uniform1f(u.S, S); gl.uniform1f(u.Y0, y0); gl.uniform4f(u.rect, x0, y0s, rw, rh); gl.uniform1f(u.D0, -(cen[0] + cen[1]) * 0.6124);
  const L = [-0.45, 0.25, 0.86], ll = Math.hypot(...L); gl.uniform3f(u.L, L[0] / ll, L[1] / ll, L[2] / ll);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, o.tex); gl.uniform1i(u.T, 0);
  const A = G3.a;
  gl.bindBuffer(gl.ARRAY_BUFFER, o.pos); gl.enableVertexAttribArray(A.P); gl.vertexAttribPointer(A.P, 3, gl.UNSIGNED_SHORT, true, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, o.nor); gl.enableVertexAttribArray(A.N); gl.vertexAttribPointer(A.N, 4, gl.BYTE, true, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, o.uv); gl.enableVertexAttribArray(A.U); gl.vertexAttribPointer(A.U, 2, gl.UNSIGNED_SHORT, true, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.idx); g3passes(gl, o);
  if (!b.c3cv) b.c3cv = document.createElement('canvas'); if (b.c3cv.width !== W || b.c3cv.height !== H) { b.c3cv.width = W; b.c3cv.height = H; } const cc = b.c3cv.getContext('2d'); cc.clearRect(0, 0, W, H); cc.drawImage(G3.cv, 0, 0); b.c3k = key;
  c.drawImage(b.c3cv, x0, y0s, rw, rh);
  b.r3d = [x0, y0s, rw, rh];
  return true;
}
// sprite 3D condiviso (alberi): renderizza il modello k centrato sull'origine; cache per angolo/zoom quantizzati
const G3S = {};
function g3sprite(k, hpx, yaw, tint) {
  if (!g3init()) return null; const o = G3.models[k]; if (!o || !o.ready) return null; const gl = G3.gl, m = o.m;
  const aq = 0, res = Math.pow(2, Math.round(Math.log2(Math.max(0.3, Math.min(2.5, cam.z * DPR * 1.1))) * 2) / 2);
  const key = k + '|' + hpx + '|' + yaw + '|' + (tint || 0) + '|' + aq.toFixed(2) + '|' + res; const e = G3S[k + '|' + hpx + '|' + yaw + '|' + (tint || 0)];
  if (e && e.key === key) return e;
  const S = hpx / (m.size[1] * ISO_H); const f = Math.SQRT1_2, F = [f, -f, f, f]; const rc = Math.cos(aq), rs = Math.sin(aq); const R = [rc, rs, -rs, rc];
  const cy = Math.cos(yaw), sy = Math.sin(yaw); const F2 = [F[0] * cy + F[2] * sy, F[1] * cy + F[3] * sy, -F[0] * sy + F[2] * cy, -F[1] * sy + F[3] * cy];
  const M = [R[0] * F2[0] + R[2] * F2[1], R[1] * F2[0] + R[3] * F2[1], R[0] * F2[2] + R[2] * F2[3], R[1] * F2[2] + R[3] * F2[3]];
  // centra il tronco (centro della base) sull'origine
  const mx = m.min[0] + m.size[0] / 2, mz = m.min[2] + m.size[2] / 2;
  const C0 = [-(M[0] * mx + M[2] * mz) * S, -(M[1] * mx + M[3] * mz) * S];
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const ax of [m.min[0], m.min[0] + m.size[0]]) for (const az of [m.min[2], m.min[2] + m.size[2]]) for (const ay of [m.min[1], m.min[1] + m.size[1]]) {
    const gx = C0[0] + (M[0] * ax + M[2] * az) * S, gy = C0[1] + (M[1] * ax + M[3] * az) * S, h = (ay - m.min[1]) * S;
    const X = (gx - gy) * 32, Y = (gx + gy) * 16 - h * ISO_H; x0 = Math.min(x0, X); x1 = Math.max(x1, X); y0 = Math.min(y0, Y); y1 = Math.max(y1, Y);
    const sgx = gx + SHX * h, sgy = gy + SHY * h, SX = (sgx - sgy) * 32, SY = (sgx + sgy) * 16; x0 = Math.min(x0, SX); x1 = Math.max(x1, SX); y0 = Math.min(y0, SY); y1 = Math.max(y1, SY); }
  x0 -= 2; y0 -= 2; x1 += 2; y1 += 2; const rw = x1 - x0, rh = y1 - y0; const W = Math.min(1024, Math.ceil(rw * res)), H = Math.min(1024, Math.ceil(rh * res));
  if (G3.cv.width !== W || G3.cv.height !== H) { G3.cv.width = W; G3.cv.height = H; }
  gl.viewport(0, 0, W, H); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.disable(gl.CULL_FACE); gl.useProgram(G3.prog);
  const u = G3.u; gl.uniform3fv(u.min, m.min); gl.uniform3fv(u.size, m.size); gl.uniformMatrix2fv(u.M, false, M); gl.uniform2f(u.C, C0[0], C0[1]);
  gl.uniform1f(u.S, S); gl.uniform1f(u.Y0, m.min[1]); gl.uniform4f(u.rect, x0, y0, rw, rh); gl.uniform1f(u.D0, 0);
  const L = [-0.45, 0.25, 0.86], ll = Math.hypot(...L); gl.uniform3f(u.L, L[0] / ll, L[1] / ll, L[2] / ll);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, o.tex); gl.uniform1i(u.T, 0); const A = G3.a;
  gl.bindBuffer(gl.ARRAY_BUFFER, o.pos); gl.enableVertexAttribArray(A.P); gl.vertexAttribPointer(A.P, 3, gl.UNSIGNED_SHORT, true, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, o.nor); gl.enableVertexAttribArray(A.N); gl.vertexAttribPointer(A.N, 4, gl.BYTE, true, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, o.uv); gl.enableVertexAttribArray(A.U); gl.vertexAttribPointer(A.U, 2, gl.UNSIGNED_SHORT, true, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.idx); g3passes(gl, o);
  const sp = e || {}; if (!sp.cv) sp.cv = document.createElement('canvas'); if (sp.cv.width !== W || sp.cv.height !== H) { sp.cv.width = W; sp.cv.height = H; }
  const cc = sp.cv.getContext('2d'); cc.globalCompositeOperation = 'source-over'; cc.clearRect(0, 0, W, H); cc.drawImage(G3.cv, 0, 0);
  if (tint) { cc.globalCompositeOperation = 'source-atop'; cc.fillStyle = tint; cc.fillRect(0, 0, W, H); cc.globalCompositeOperation = 'source-over'; }
  Object.assign(sp, { key, x0, y0, w: rw, h: rh }); G3S[k + '|' + hpx + '|' + yaw + '|' + (tint || 0)] = sp; return sp;
}
const TREE3D = { olmo: { k: 'olmo3d', h: 100 }, spoglio: { k: 'spoglio3d', h: 88 }, quercia: { k: 'quercia3d', h: 92, tints: [0, 'rgba(60,55,10,0.14)', 'rgba(70,50,10,0.26)'] }, abete: { k: 'abete3d', h: 104, tints: [0, 'rgba(10,25,20,0.14)', 'rgba(10,25,20,0.28)'] } };
const bareKind = o => { const h = (((o.x * 7919) | 0) ^ ((o.y * 104729) | 0)) >>> 0; const v = h % 100; return v < 3 ? 'spoglio' : v < 6 ? 'olmo' : null; };
function drawTree3D(c, o, wx, wy) {
  const bk = bareKind(o); if (bk) { const d = TREE3D[bk]; if (!G3.models[d.k]) need3d(d.k); if (G3.models[d.k] && G3.models[d.k].ready) { const yaw = [0, 1.6, 3.1, 4.7][(((o.x * 13 + o.y * 7) | 0) >>> 0) % 4]; const sp = g3sprite(d.k, d.h, yaw, S && MODE === 'village' && seasonInfo().s.k === 'inverno' ? 'rgba(236,242,250,0.35)' : 0); if (sp) { const k2 = o.s; c.fillStyle = 'rgba(0,0,0,0.16)'; c.beginPath(); c.ellipse(wx, wy, 20 * k2, 8 * k2, 0, 0, 7); c.fill(); c.drawImage(sp.cv, wx + sp.x0 * k2, wy + sp.y0 * k2, sp.w * k2, sp.h * k2); return true; } } }
  const kind = (o.k % 6) < 3 ? 'abete' : 'quercia', d = TREE3D[kind]; if (!G3.models[d.k]) need3d(d.k); if (!G3.models[d.k] || !G3.models[d.k].ready) return false;
  const hsh = ((o.x * 13 + o.y * 7) | 0) >>> 0; const yaw = kind === 'quercia' ? [0, 0.4, -0.4, 3.14][hsh % 4] : [0, 2.1, 4.2][hsh % 3]; const sz = 1.1;
  const sp = g3sprite(d.k, Math.round(d.h * sz), yaw, treeSeasonTint(kind, d.tints[o.k % 3], o.k % 3)); if (!sp) return false;
  const k2 = o.s / sz; c.fillStyle = 'rgba(0,0,0,0.2)'; c.beginPath(); c.ellipse(wx, wy, 24 * o.s * (kind === 'quercia' ? 1.3 : 0.9), 10 * o.s * (kind === 'quercia' ? 1.3 : 0.9), 0, 0, 7); c.fill();
  c.drawImage(sp.cv, wx + sp.x0 * k2, wy + sp.y0 * k2, sp.w * k2, sp.h * k2); return true;
}
// ================= ART: procedural isometric buildings, trees, ground =================
const TW = 64, TH = 32, RS = 2;
function isoP(u, v, z) { return [(u - v) * TW / 2, (u + v) * TH / 2 - (z || 0)]; }
// ---- view rotation (4 steps of 90°) ----
// continuous angle ANG (radians) around the map centre; buildings/units are upright billboards
let ANG = 0, RC = 1, RS_ = 0; const NMAP = 96, MC = 48, OFF = 32;
function setAng(a) { ANG = a; RC = Math.cos(a); RS_ = Math.sin(a); }
function rstep() { return ((Math.round(ANG / (Math.PI / 2)) % 4) + 4) % 4; }
function rotP(x, y) { const dx = x - MC, dy = y - MC; return [MC + dx * RC - dy * RS_, MC + dx * RS_ + dy * RC]; }
function rotPinv(x, y) { const dx = x - MC, dy = y - MC; return [MC + dx * RC + dy * RS_, MC - dx * RS_ + dy * RC]; }
function rotV(dx, dy) { return [dx * RC - dy * RS_, dx * RS_ + dy * RC]; }
function rotVinv(dx, dy) { return [dx * RC + dy * RS_, -dx * RS_ + dy * RC]; }
function rotMask(m) { for (let i = 0; i < rstep(); i++) m = (m & 1 ? 4 : 0) | (m & 2 ? 8 : 0) | (m & 4 ? 2 : 0) | (m & 8 ? 1 : 0); return m; }
function vRect(b) { const c = rotP(b.x + b.w / 2, b.y + b.h / 2); const sw = rstep() % 2 ? [b.h, b.w] : [b.w, b.h]; return [c[0] - sw[0] / 2, c[1] - sw[1] / 2, sw[0], sw[1]]; }
// affine transform: source pixels (unit px per tile, top-down) -> current isometric world
function tileTransform(c, unit) { const o = W(0, 0), p = W(1, 0), q = W(0, 1); c.transform((p[0] - o[0]) / unit, (p[1] - o[1]) / unit, (q[0] - o[0]) / unit, (q[1] - o[1]) / unit, o[0], o[1]); }
function WR(x, y) { return [(x - y) * TW / 2, (x + y) * TH / 2]; }
function W(x, y) { const p = rotP(x, y); return WR(p[0], p[1]); }
function rng(seed) { let s = (seed >>> 0) % 2147483647 || 1; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
function shade(h, f, a) { const [r, g, b] = hexRgb(h); const c = v => Math.max(0, Math.min(255, Math.round(v * f))); return a == null ? `rgb(${c(r)},${c(g)},${c(b)})` : `rgba(${c(r)},${c(g)},${c(b)},${a})`; }
function poly(c, pts, fill, stroke, lw) {
  c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
  c.closePath();
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw || 1; c.stroke(); }
}
const COL = {
  wood: '#7a5230', dwood: '#55381f', log: '#6e4a2a', thatch: '#b38a3e', shingle: '#5e4128', stone: '#99928a',
  wstone: '#cdc6b6', plaster: '#cdb68c', tile: '#8a3b2a', mud: '#5f4b31', water: '#3d4a3f', crimson: '#8f1d1d',
  blue: '#1e3a8a', gold: '#c9a227', canvas: '#cbb68e', iron: '#4b4b4b', hay: '#c8a64a', grass: '#6b7a3a'
};
const EDGE = 'rgba(28,18,8,0.55)';

// texture a vertical face. A,B = [u,v] ground endpoints; face from z0 to z1
function texFace(c, A, B, z0, z1, tex, seed, base) {
  const pts = [isoP(A[0], A[1], z0), isoP(B[0], B[1], z0), isoP(B[0], B[1], z1), isoP(A[0], A[1], z1)];
  c.save(); poly(c, pts); c.clip();
  const R = rng(seed || 7);
  const len = Math.hypot(B[0] - A[0], B[1] - A[1]);
  const L = (t, z) => isoP(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, z);
  if (tex === 'log') {
    for (let z = z0; z < z1; z += 5) {
      const a = L(0, z), b = L(1, z);
      c.strokeStyle = 'rgba(30,18,6,0.55)'; c.lineWidth = 1; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
      const a2 = L(0, z + 2.5), b2 = L(1, z + 2.5);
      c.strokeStyle = 'rgba(255,220,170,0.13)'; c.beginPath(); c.moveTo(a2[0], a2[1]); c.lineTo(b2[0], b2[1]); c.stroke();
    }
  } else if (tex === 'plank') {
    const n = Math.max(2, Math.round(len * 7));
    for (let i = 1; i < n; i++) {
      const t = i / n, a = L(t, z0), b = L(t, z1);
      c.strokeStyle = 'rgba(30,18,6,0.4)'; c.lineWidth = 1; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
    }
    for (let i = 0; i < n; i++) { if (R() < 0.35) { const t = (i + 0.5) / n, a = L(t, z0); c.fillStyle = 'rgba(0,0,0,0.06)'; poly(c, [L(i / n, z0), L((i + 1) / n, z0), L((i + 1) / n, z1), L(i / n, z1)], 'rgba(0,0,0,' + (0.04 + R() * 0.08) + ')'); } }
  } else if (tex === 'stone') {
    let row = 0;
    for (let z = z0; z < z1; z += 6, row++) {
      const n = Math.max(2, Math.round(len * 4));
      for (let i = 0; i < n + 1; i++) {
        const t0 = Math.max(0, (i - (row % 2) * 0.5) / n), t1 = Math.min(1, (i + 1 - (row % 2) * 0.5) / n);
        if (t1 <= t0) continue;
        const v = R();
        poly(c, [L(t0, z), L(t1, z), L(t1, z + 6), L(t0, z + 6)], v < 0.5 ? `rgba(0,0,0,${0.03 + v * 0.12})` : `rgba(255,250,235,${(v - 0.5) * 0.18})`, 'rgba(40,35,30,0.35)', 0.8);
      }
    }
    // moss
    for (let i = 0; i < len * 3; i++) { const p = L(R(), z0 + R() * 8); c.fillStyle = 'rgba(70,95,40,0.35)'; c.beginPath(); c.arc(p[0], p[1], 1 + R() * 2.2, 0, 7); c.fill(); }
  } else if (tex === 'plaster') {
    for (let i = 0; i < len * 10; i++) { const p = L(R(), z0 + R() * (z1 - z0)); c.fillStyle = `rgba(80,60,30,${R() * 0.15})`; c.fillRect(p[0], p[1], 2 + R() * 3, 1 + R() * 2); }
    // timber frame
    c.strokeStyle = shade(COL.dwood, 1); c.lineWidth = 1.8;
    const a = L(0, z1 - 1), b = L(1, z1 - 1); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
    const nn = Math.max(1, Math.round(len * 2));
    for (let i = 0; i <= nn; i++) { const p = L(i / nn, z0), q = L(i / nn, z1); c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); c.stroke(); }
    if (len > 0.8) { const p = L(0, z0), q = L(0.5, z1); c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); c.stroke(); }
  }
  // grime at bottom
  const g0 = L(0, z0), g1 = L(1, z0);
  c.strokeStyle = 'rgba(40,30,15,0.35)'; c.lineWidth = 4; c.beginPath(); c.moveTo(g0[0], g0[1]); c.lineTo(g1[0], g1[1]); c.stroke();
  c.restore();
}
function prism(c, u0, v0, u1, v1, z0, z1, base, tex, seed, topCol) {
  const L = [isoP(u0, v1, z0), isoP(u1, v1, z0), isoP(u1, v1, z1), isoP(u0, v1, z1)];
  const R = [isoP(u1, v1, z0), isoP(u1, v0, z0), isoP(u1, v0, z1), isoP(u1, v1, z1)];
  const T = [isoP(u0, v0, z1), isoP(u1, v0, z1), isoP(u1, v1, z1), isoP(u0, v1, z1)];
  poly(c, L, shade(base, 0.95)); if (tex) texFace(c, [u0, v1], [u1, v1], z0, z1, tex, seed, base);
  poly(c, R, shade(base, 0.7)); if (tex) texFace(c, [u1, v1], [u1, v0], z0, z1, tex, (seed || 1) + 3, base);
  poly(c, T, topCol || shade(base, 1.15));
  poly(c, L, null, EDGE, 1); poly(c, R, null, EDGE, 1); poly(c, T, null, EDGE, 1);
  // log ends at front corner
  if (tex === 'log') {
    for (let z = z0 + 2.5; z < z1; z += 5) { const p = isoP(u1, v1, z); c.fillStyle = '#a07a4c'; c.beginPath(); c.ellipse(p[0], p[1], 2.6, 2.3, 0, 0, 7); c.fill(); c.strokeStyle = 'rgba(40,25,10,.6)'; c.lineWidth = 0.7; c.stroke(); }
  }
}
function thatchTex(c, pts, seed, base) {
  c.save(); poly(c, pts); c.clip(); const R = rng(seed);
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  for (let i = 0; i < (x1 - x0) * (y1 - y0) / 9; i++) {
    const x = x0 + R() * (x1 - x0), y = y0 + R() * (y1 - y0);
    c.strokeStyle = R() < 0.5 ? 'rgba(60,40,10,0.35)' : 'rgba(255,230,160,0.25)'; c.lineWidth = 0.8;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + (R() - 0.5) * 2, y + 3 + R() * 3); c.stroke();
  }
  c.restore();
}
function shingleTex(c, pts, seed) {
  c.save(); poly(c, pts); c.clip(); const R = rng(seed);
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  for (let y = y0; y < y1; y += 4) { c.strokeStyle = 'rgba(20,10,5,0.35)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke(); for (let x = x0 + (y % 8 ? 3 : 0); x < x1; x += 6) { if (R() < 0.3) { c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(x, y, 5, 4); } } }
  c.restore();
}
function roofTex(c, pts, tex, seed) { if (tex === 'thatch') thatchTex(c, pts, seed); else if (tex === 'shingle' || tex === 'tile') shingleTex(c, pts, seed); }
function pyramid(c, u0, v0, u1, v1, z, h, base, tex, seed) {
  const o = 0.14, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2, A = isoP(cu, cv, z + h);
  const c00 = isoP(u0 - o, v0 - o, z), c10 = isoP(u1 + o, v0 - o, z), c11 = isoP(u1 + o, v1 + o, z), c01 = isoP(u0 - o, v1 + o, z);
  const faces = [[[c00, c10, A], 1.05], [[c00, c01, A], 1.0], [[c01, c11, A], 0.95], [[c11, c10, A], 0.72]];
  for (const [p, f] of faces) { poly(c, p, shade(base, f)); roofTex(c, p, tex, seed++); poly(c, p, null, EDGE, 1); }
}
function gable(c, u0, v0, u1, v1, z, h, base, axis, tex, seed, wall) {
  const o = 0.14, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2;
  if (axis === 'u') {
    const r0 = isoP(u0 - o, cv, z + h), r1 = isoP(u1 + o, cv, z + h);
    const back = [isoP(u0 - o, v0 - o, z), isoP(u1 + o, v0 - o, z), r1, r0];
    const front = [isoP(u0 - o, v1 + o, z), isoP(u1 + o, v1 + o, z), r1, r0];
    poly(c, back, shade(base, 1.08)); roofTex(c, back, tex, seed); poly(c, back, null, EDGE);
    const end = [isoP(u1, v0, z), isoP(u1, v1, z), isoP(u1, cv, z + h)]; poly(c, end, shade(wall || COL.wood, 0.7), EDGE);
    poly(c, front, shade(base, 0.92)); roofTex(c, front, tex, seed + 1); poly(c, front, null, EDGE);
    c.strokeStyle = shade(base, 0.6); c.lineWidth = 2; c.beginPath(); c.moveTo(r0[0], r0[1]); c.lineTo(r1[0], r1[1]); c.stroke();
  } else {
    const r0 = isoP(cu, v0 - o, z + h), r1 = isoP(cu, v1 + o, z + h);
    const back = [isoP(u0 - o, v0 - o, z), isoP(u0 - o, v1 + o, z), r1, r0];
    const front = [isoP(u1 + o, v0 - o, z), isoP(u1 + o, v1 + o, z), r1, r0];
    poly(c, back, shade(base, 1.08)); roofTex(c, back, tex, seed); poly(c, back, null, EDGE);
    const end = [isoP(u0, v1, z), isoP(u1, v1, z), isoP(cu, v1, z + h)]; poly(c, end, shade(wall || COL.wood, 0.95), EDGE);
    poly(c, front, shade(base, 0.72)); roofTex(c, front, tex, seed + 1); poly(c, front, null, EDGE);
    c.strokeStyle = shade(base, 0.6); c.lineWidth = 2; c.beginPath(); c.moveTo(r0[0], r0[1]); c.lineTo(r1[0], r1[1]); c.stroke();
  }
}
function groundPlot(c, w, h, col, inset) {
  const i = inset == null ? 0.06 : inset;
  poly(c, [isoP(i, i), isoP(w - i, i), isoP(w - i, h - i), isoP(i, h - i)], col || 'rgba(92,72,45,0.55)');
}
function logPost(c, u, v, z0, len, r, col, sharp) {
  const [x, y] = isoP(u, v, z0);
  const g = c.createLinearGradient(x - r, 0, x + r, 0);
  g.addColorStop(0, shade(col, 1.15)); g.addColorStop(0.5, shade(col, 0.95)); g.addColorStop(1, shade(col, 0.55));
  c.fillStyle = g; c.beginPath(); c.moveTo(x - r, y); c.lineTo(x - r, y - len); if (sharp) c.lineTo(x, y - len - r * 2.2); c.lineTo(x + r, y - len); c.lineTo(x + r, y); c.ellipse(x, y, r, r * 0.5, 0, 0, Math.PI); c.closePath(); c.fill();
  c.strokeStyle = EDGE; c.lineWidth = 0.7; c.stroke();
}
function door(c, u, v, face, z, wdt, hgt, col) { // face 'L' (v const) or 'R' (u const)
  const pts = face === 'L' ? [isoP(u, v, z), isoP(u + wdt, v, z), isoP(u + wdt, v, z + hgt), isoP(u, v, z + hgt)] : [isoP(u, v, z), isoP(u, v - wdt, z), isoP(u, v - wdt, z + hgt), isoP(u, v, z + hgt)];
  poly(c, pts, col || '#2b1a0d', 'rgba(0,0,0,.6)', 1);
}
function windowS(c, u, v, face, z, s) { door(c, u, v, face, z, s || 0.12, 6, '#1d140b'); }
function banner(c, u, v, z, h, col, emblem) {
  const [x, y] = isoP(u, v, z);
  c.strokeStyle = '#3a2a18'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - h); c.stroke();
  c.fillStyle = col; c.beginPath(); c.moveTo(x, y - h + 1); c.quadraticCurveTo(x + 9, y - h - 2, x + 18, y - h + 2); c.lineTo(x + 15, y - h + 7); c.lineTo(x + 18, y - h + 12); c.quadraticCurveTo(x + 9, y - h + 8, x, y - h + 11); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = .6; c.stroke();
  if (emblem) { c.fillStyle = COL.gold; c.font = 'bold 7px serif'; c.fillText(emblem, x + 6, y - h + 9); }
}
function battlements(c, u0, v0, u1, v1, z, base) {
  const n1 = Math.round((u1 - u0) / 0.28), n2 = Math.round((v1 - v0) / 0.28);
  for (let i = 0; i < n1; i += 2) { const a = u0 + i * (u1 - u0) / n1; prism(c, a, v0, a + (u1 - u0) / n1, v0 + 0.16, z, z + 6, base); }
  for (let i = 0; i < n2; i += 2) { const a = v0 + i * (v1 - v0) / n2; prism(c, u0, a, u0 + 0.16, a + (v1 - v0) / n2, z, z + 6, base); }
  for (let i = 0; i < n2; i += 2) { const a = v0 + i * (v1 - v0) / n2; prism(c, u1 - 0.16, a, u1, a + (v1 - v0) / n2, z, z + 6, base); }
  for (let i = 0; i < n1; i += 2) { const a = u0 + i * (u1 - u0) / n1; prism(c, a, v1 - 0.16, a + (u1 - u0) / n1, v1, z, z + 6, base); }
}
function sack(c, u, v, col) { const [x, y] = isoP(u, v, 0); c.fillStyle = col || '#bfa676'; c.beginPath(); c.ellipse(x, y - 4, 4.5, 5, 0, 0, 7); c.fill(); c.strokeStyle = EDGE; c.lineWidth = .7; c.stroke(); }
function logPile(c, u, v) {
  for (let r = 0; r < 3; r++) for (let i = 0; i < 3 - r; i++) {
    const [x, y] = isoP(u + i * 0.16 + r * 0.08, v, r * 4.5 + 3);
    c.fillStyle = '#6a4626'; c.fillRect(x - 12, y - 2.5, 12, 5);
    c.fillStyle = '#b88f5c'; c.beginPath(); c.ellipse(x, y, 2.6, 2.6, 0, 0, 7); c.fill(); c.strokeStyle = '#4a2f18'; c.lineWidth = .6; c.stroke();
  }
}

// ---- building painters: (c, b, opts) draws in local footprint coords ----
const PAINT = {
  mastio(c, lvl, s) {
    const R = rng(s);
    if (lvl <= 4) {
      // muddy moat ring
      poly(c, [isoP(0.05, 0.05), isoP(2.95, 0.05), isoP(2.95, 2.95), isoP(0.05, 2.95)], 'rgba(70,58,36,0.85)');
      poly(c, [isoP(0.3, 0.3), isoP(2.7, 0.3), isoP(2.7, 2.7), isoP(0.3, 2.7)], 'rgba(55,70,60,0.85)');
      poly(c, [isoP(0.45, 0.45), isoP(2.55, 0.45), isoP(2.55, 2.55), isoP(0.45, 2.55)], '#6c5a3c');
      const h = 58 + lvl * 12;
      if (lvl >= 3) { prism(c, 1.9, 1.75, 2.55, 2.5, 0, 20, COL.wood, 'plank', s + 4); gable(c, 1.9, 1.75, 2.55, 2.5, 20, 12, COL.thatch, 'v', 'thatch', s + 9); }
      prism(c, 0.75, 0.75, 2.05, 2.05, 0, h, COL.log, 'log', s);
      door(c, 1.2, 2.05, 'L', 0, 0.35, 16);
      windowS(c, 1.5, 2.05, 'L', h - 22); windowS(c, 2.05, 1.5, 'R', h - 22);
      prism(c, 0.6, 0.6, 2.2, 2.2, h, h + 6, COL.dwood, 'plank', s + 2);
      for (let i = 0; i < 6; i++) { logPost(c, 0.62 + i * 0.315, 2.2, h + 6, 7, 1.6, COL.log, false); }
      for (let i = 0; i < 6; i++) { logPost(c, 2.2, 0.62 + i * 0.315, h + 6, 7, 1.6, COL.log, false); }
      pyramid(c, 0.75, 0.75, 2.05, 2.05, h + 13, 30 + lvl * 3, COL.thatch, 'thatch', s + 7);
      if (lvl >= 2) banner(c, 1.4, 1.4, h + 40 + lvl * 3, 22, COL.crimson);
      if (lvl >= 4) { for (let i = 0; i < 7; i++) logPost(c, 0.35 + i * 0.36, 2.75, 0, 14, 1.8, COL.log, true); }
    } else {
      poly(c, [isoP(0.1, 0.1), isoP(2.9, 0.1), isoP(2.9, 2.9), isoP(0.1, 2.9)], '#706657');
      const e = lvl - 5, base = lvl >= 7 ? COL.wstone : COL.stone;
      const bh = 26 + e * 5;
      prism(c, 0.3, 0.3, 2.7, 2.7, 0, bh, COL.stone, 'stone', s);
      battlements(c, 0.3, 0.3, 2.7, 2.7, bh, COL.stone);
      door(c, 1.25, 2.7, 'L', 0, 0.45, 18, '#3a2410');
      const th = 50 + e * 12;
      prism(c, 0.8, 0.8, 2.2, 2.2, bh, bh + th, base, 'stone', s + 5);
      windowS(c, 1.35, 2.2, 'L', bh + th - 20, 0.1); windowS(c, 1.65, 2.2, 'L', bh + th - 20, 0.1); windowS(c, 2.2, 1.5, 'R', bh + th - 20, 0.1);
      battlements(c, 0.8, 0.8, 2.2, 2.2, bh + th, base);
      if (lvl >= 6) { pyramid(c, 1.1, 1.1, 1.9, 1.9, bh + th, 24, COL.tile, 'tile', s + 3); }
      if (lvl >= 7) {
        for (const [a, b2] of [[0.15, 2.25], [2.25, 2.25], [2.25, 0.15]]) { prism(c, a, b2, a + 0.6, b2 + 0.6, 0, bh + 22, base, 'stone', s + a * 10); pyramid(c, a, b2, a + 0.6, b2 + 0.6, bh + 22, 20, COL.tile, 'tile', s + 2); }
      }
      banner(c, 1.5, 1.5, bh + th + (lvl >= 6 ? 24 : 6), 26, COL.blue, '♔');
    }
  },
  fattoria(c, lvl, s) {
    groundPlot(c, 2, 2, '#6d5634');
    for (let i = 0; i < 6; i++) { const u = 0.95 + i * 0.17; poly(c, [isoP(u, 0.1), isoP(u + 0.1, 0.1), isoP(u + 0.1, 1.9), isoP(u, 1.9)], i % 2 ? '#b89a3c' : '#7f8f3a'); }
    for (let i = 0; i < 40; i++) { const R = rng(s + i); const [x, y] = isoP(0.95 + R() * 1.0, 0.15 + R() * 1.75, 0); c.strokeStyle = '#d6bf5a'; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y); c.lineTo(x + (R() - .5) * 2, y - 5 - R() * 3); c.stroke(); }
    prism(c, 0.15, 0.25, 0.85, 1.15, 0, 18, COL.plaster, 'plaster', s);
    door(c, 0.35, 1.15, 'L', 0, 0.22, 12);
    gable(c, 0.15, 0.25, 0.85, 1.15, 18, 16, COL.thatch, 'v', 'thatch', s + 3, COL.plaster);
    sack(c, 0.4, 1.55); sack(c, 0.6, 1.6, '#a88f5f');
    if (lvl >= 2) for (let i = 0; i < 6; i++) logPost(c, 1.95, 0.15 + i * 0.33, 0, 8, 1.1, COL.dwood);
    if (lvl >= 3) { prism(c, 0.2, 1.4, 0.6, 1.85, 0, 10, COL.wood, 'plank', s + 8); }
  },
  capanna(c, lvl, s) {
    groundPlot(c, 2, 2, '#5d4a2e');
    prism(c, 0.25, 0.3, 1.35, 1.25, 0, 20 + lvl * 2, COL.log, 'log', s);
    door(c, 0.55, 1.25, 'L', 0, 0.25, 13);
    gable(c, 0.25, 0.3, 1.35, 1.25, 20 + lvl * 2, 15, COL.shingle, 'u', 'shingle', s + 2, COL.log);
    logPile(c, 1.25, 1.65);
    const [x, y] = isoP(1.6, 0.75, 0); c.fillStyle = '#8a6a44'; c.beginPath(); c.ellipse(x, y - 3, 6, 3, 0, 0, 7); c.fill(); c.fillStyle = '#5a3d22'; c.fillRect(x - 6, y - 3, 12, 4); c.fillStyle = '#b39066'; c.beginPath(); c.ellipse(x, y - 4, 6, 3, 0, 0, 7); c.fill();
    if (lvl >= 2) logPile(c, 0.3, 1.7);
  },
  miniera(c, lvl, s) {
    groundPlot(c, 2, 2, '#5b5040');
    const R = rng(s);
    const pts = []; for (let i = 0; i < 14; i++) { const a = Math.PI * (i / 13); const rr = 1 + R() * 0.15; const [x, y] = isoP(1 - Math.cos(a) * 0.85 * rr, 0.8 - Math.cos(a) * 0.1, Math.sin(a) * (32 + lvl * 4) * rr); pts.push([x, y]); }
    pts.push(isoP(1.85, 1.0, 0)); pts.push(isoP(0.15, 1.0, 0));
    poly(c, pts, '#7d7363', EDGE); thatchTex(c, pts, s);
    // entrance frame
    const [ex, ey] = isoP(1.0, 1.05, 0);
    c.fillStyle = '#140d07'; c.beginPath(); c.moveTo(ex - 9, ey); c.lineTo(ex - 9, ey - 16); c.lineTo(ex + 9, ey - 16); c.lineTo(ex + 9, ey); c.fill();
    logPost(c, 0.8, 1.25, 0, 18, 1.8, COL.wood); logPost(c, 1.25, 0.85, 0, 18, 1.8, COL.wood);
    c.strokeStyle = COL.wood; c.lineWidth = 3.2; const a = isoP(0.78, 1.27, 18), b = isoP(1.27, 0.83, 18); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
    // cart
    prism(c, 1.3, 1.35, 1.75, 1.75, 4, 11, COL.dwood, 'plank', s + 3);
    for (let i = 0; i < 6; i++) { const [x, y] = isoP(1.4 + R() * 0.3, 1.45 + R() * 0.25, 12); c.fillStyle = R() < .5 ? '#e8c34a' : '#c49a2a'; c.beginPath(); c.arc(x, y, 1.8, 0, 7); c.fill(); }
    for (const [u, v] of [[1.35, 1.75], [1.75, 1.4]]) { const [x, y] = isoP(u, v, 4); c.fillStyle = '#3a2817'; c.beginPath(); c.arc(x, y, 3.2, 0, 7); c.fill(); }
  },
  cava(c, lvl, s) {
    groundPlot(c, 2, 2, '#6b6457');
    const R = rng(s);
    prism(c, 0.2, 0.2, 1.1, 1.0, 0, 24, COL.stone, 'stone', s);
    prism(c, 0.2, 1.0, 0.8, 1.4, 0, 12, COL.stone, 'stone', s + 2);
    for (let i = 0; i < 4 + lvl; i++) { const u = 1.2 + (i % 3) * 0.22, v = 1.1 + Math.floor(i / 3) * 0.25; prism(c, u, v, u + 0.18, v + 0.18, 0, 7, COL.wstone, null); }
    // crane
    logPost(c, 1.5, 0.5, 0, 34, 1.5, COL.wood); c.strokeStyle = COL.wood; c.lineWidth = 2; const a = isoP(1.5, 0.5, 34), b = isoP(1.1, 0.7, 26); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); c.strokeStyle = '#3a3a3a'; c.lineWidth = .7; c.beginPath(); c.moveTo(b[0], b[1]); c.lineTo(b[0], b[1] + 14); c.stroke();
  },
  granaio(c, lvl, s) {
    groundPlot(c, 2, 2);
    for (const [u, v] of [[0.35, 0.35], [1.65, 0.35], [0.35, 1.65], [1.65, 1.65]]) logPost(c, u, v, 0, 10, 1.8, COL.dwood);
    prism(c, 0.3, 0.3, 1.7, 1.7, 10, 34 + lvl * 3, COL.wood, 'plank', s);
    door(c, 0.8, 1.7, 'L', 12, 0.35, 15);
    gable(c, 0.3, 0.3, 1.7, 1.7, 34 + lvl * 3, 20, COL.thatch, 'u', 'thatch', s + 4, COL.wood);
    sack(c, 1.8, 1.8); sack(c, 1.95, 1.55, '#a88f5f'); sack(c, 0.2, 1.9);
  },
  tesoreria(c, lvl, s) {
    groundPlot(c, 2, 2, '#6a6152');
    prism(c, 0.3, 0.3, 1.7, 1.7, 0, 30 + lvl * 3, COL.stone, 'stone', s);
    door(c, 0.8, 1.7, 'L', 0, 0.38, 17, '#3a2410');
    const [x, y] = isoP(0.99, 1.7, 9); c.fillStyle = COL.iron; c.fillRect(x - 6, y - 1, 12, 1.5);
    gable(c, 0.3, 0.3, 1.7, 1.7, 30 + lvl * 3, 18, COL.tile, 'v', 'tile', s + 3, COL.stone);
    prism(c, 1.75, 0.6, 1.95, 0.95, 0, 7, '#6b4424', 'plank', s + 6, '#c9a227');
    for (let i = 0; i < 5; i++) { const [px, py] = isoP(1.82 + i * 0.03, 1.1 + i * 0.07, 0); c.fillStyle = '#e1b93a'; c.beginPath(); c.ellipse(px, py - 1, 2.5, 1.3, 0, 0, 7); c.fill(); }
  },
  caserma(c, lvl, s) {
    groundPlot(c, 3, 3, '#5c4a32');
    const h = 22 + lvl * 3;
    prism(c, 0.3, 0.5, 2.7, 1.9, 0, 6, COL.stone, 'stone', s);
    prism(c, 0.3, 0.5, 2.7, 1.9, 6, h, COL.wood, lvl >= 3 ? 'plaster' : 'plank', s + 1, null);
    door(c, 1.3, 1.9, 'L', 0, 0.4, 16);
    for (let i = 0; i < 3; i++) windowS(c, 0.5 + i * 0.4, 1.9, 'L', h - 10);
    gable(c, 0.3, 0.5, 2.7, 1.9, h, 20, COL.shingle, 'u', 'shingle', s + 2, COL.wood);
    banner(c, 2.75, 2.0, 0, 38, COL.crimson);
    // weapon rack
    const a = isoP(0.4, 2.5, 0); for (let i = 0; i < 5; i++) { c.strokeStyle = '#4a3420'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(a[0] + i * 4, a[1]); c.lineTo(a[0] + i * 4 + 2, a[1] - 18); c.stroke(); c.fillStyle = '#bbb'; c.beginPath(); c.moveTo(a[0] + i * 4 + 2, a[1] - 18); c.lineTo(a[0] + i * 4 + 0.5, a[1] - 22); c.lineTo(a[0] + i * 4 + 3.5, a[1] - 21); c.fill(); }
    // dummy
    logPost(c, 2.3, 2.5, 0, 16, 1.2, COL.dwood); const [dx, dy] = isoP(2.3, 2.5, 16); c.fillStyle = COL.hay; c.beginPath(); c.ellipse(dx, dy - 2, 4, 6, 0, 0, 7); c.fill(); c.strokeStyle = EDGE; c.stroke(); c.fillRect(dx - 7, dy + 1, 14, 2);
  },
  poligono(c, lvl, s) {
    groundPlot(c, 3, 3, '#6a6a3c');
    for (let i = 0; i <= 8; i++) { logPost(c, 0.1 + i * 0.35, 0.1, 0, 9, 1, COL.dwood); logPost(c, 0.1, 0.1 + i * 0.35, 0, 9, 1, COL.dwood); }
    prism(c, 0.25, 0.25, 1.15, 1.0, 0, 18, COL.wood, 'plank', s); gable(c, 0.25, 0.25, 1.15, 1.0, 18, 12, COL.shingle, 'u', 'shingle', s + 2, COL.wood);
    for (const [u, v] of [[2.2, 0.6], [2.4, 1.5], [2.0, 2.4]]) {
      logPost(c, u, v, 0, 12, 1, COL.dwood); const [x, y] = isoP(u, v, 22);
      c.fillStyle = COL.hay; c.beginPath(); c.arc(x, y, 9, 0, 7); c.fill(); c.strokeStyle = '#7a5a20'; c.lineWidth = 1; c.stroke();
      c.fillStyle = '#f4ead0'; c.beginPath(); c.arc(x, y, 6, 0, 7); c.fill(); c.fillStyle = COL.crimson; c.beginPath(); c.arc(x, y, 3.5, 0, 7); c.fill(); c.fillStyle = '#f4ead0'; c.beginPath(); c.arc(x, y, 1.5, 0, 7); c.fill();
    }
    sack(c, 1.0, 2.3, COL.hay); banner(c, 0.3, 2.7, 0, 30, COL.blue);
  },
  scuderia(c, lvl, s) {
    groundPlot(c, 3, 3, '#5e4a2e');
    prism(c, 0.3, 0.3, 2.7, 1.3, 0, 24, COL.wood, 'plank', s);
    for (let i = 0; i < 4; i++) door(c, 0.45 + i * 0.58, 1.3, 'L', 0, 0.38, 15, '#22160b');
    gable(c, 0.3, 0.3, 2.7, 1.3, 24, 16, COL.thatch, 'u', 'thatch', s + 3, COL.wood);
    for (let i = 0; i <= 7; i++) { logPost(c, 0.2 + i * 0.37, 2.85, 0, 9, 1, COL.dwood); }
    for (let i = 0; i <= 4; i++) { logPost(c, 2.85, 1.45 + i * 0.35, 0, 9, 1, COL.dwood); }
    const a = isoP(0.2, 2.85, 6), b = isoP(2.8, 2.85, 6), d = isoP(2.85, 1.45, 6); c.strokeStyle = COL.wood; c.lineWidth = 1.5; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(d[0], d[1]); c.stroke();
    for (const [u, v] of [[0.6, 1.9], [1.0, 2.2]]) { prism(c, u, v, u + 0.3, v + 0.25, 0, 8, COL.hay, null, 0, '#d9bc5c'); }
    banner(c, 2.75, 0.4, 24, 26, COL.blue);
  },
  monastero(c, lvl, s) {
    groundPlot(c, 3, 3, '#6f6758');
    prism(c, 0.4, 0.3, 1.1, 1.0, 0, 64, COL.wstone, 'stone', s);
    windowS(c, 0.65, 1.0, 'L', 44, 0.16);
    pyramid(c, 0.4, 0.3, 1.1, 1.0, 64, 26, COL.tile, 'tile', s + 5);
    const [cx, cy] = isoP(0.75, 0.65, 92); c.strokeStyle = COL.gold; c.lineWidth = 2; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx, cy - 10); c.moveTo(cx - 4, cy - 7); c.lineTo(cx + 4, cy - 7); c.stroke();
    prism(c, 0.6, 1.0, 2.6, 2.3, 0, 32, COL.wstone, 'stone', s + 2);
    door(c, 1.0, 2.3, 'L', 0, 0.35, 18, '#3a2410');
    for (let i = 0; i < 3; i++) windowS(c, 1.5 + i * 0.35, 2.3, 'L', 16, 0.1);
    gable(c, 0.6, 1.0, 2.6, 2.3, 32, 22, COL.tile, 'u', 'tile', s + 6, COL.wstone);
    banner(c, 2.7, 2.6, 0, 30, '#e8e0cc', '✠');
  },
  torre(c, lvl, s) {
    const h = 40 + lvl * 4;
    for (const [u, v] of [[0.2, 0.2], [0.8, 0.2], [0.2, 0.8], [0.8, 0.8]]) logPost(c, u, v, 0, h, 1.8, COL.log);
    c.strokeStyle = COL.dwood; c.lineWidth = 1.4;
    for (let z = 8; z < h - 4; z += 14) { const a = isoP(0.2, 0.8, z), b = isoP(0.8, 0.8, z + 12), d = isoP(0.8, 0.2, z); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(d[0], d[1]); c.stroke(); }
    prism(c, 0.05, 0.05, 0.95, 0.95, h, h + 4, COL.dwood, 'plank', s);
    for (let i = 0; i < 5; i++) { logPost(c, 0.07 + i * 0.22, 0.95, h + 4, 7, 1, COL.log); logPost(c, 0.95, 0.07 + i * 0.22, h + 4, 7, 1, COL.log); }
    if (lvl >= 3) banner(c, 0.1, 0.1, h + 4, 30, COL.crimson);
  },
  balista(c, lvl, s) {
    const base = lvl >= 3 ? COL.wstone : COL.stone;
    prism(c, 0.15, 0.15, 1.85, 1.85, 0, 16, base, 'stone', s);
    battlements(c, 0.15, 0.15, 1.85, 1.85, 16, base);
  },
  stendardo(c, lvl, s) { const [x, y] = isoP(0.5, 0.5, 0); c.fillStyle = '#5a5246'; c.beginPath(); c.ellipse(x, y, 7, 3.5, 0, 0, 7); c.fill(); const a = ARMS(); const h = 46;
    c.strokeStyle = '#3a2a18'; c.lineWidth = 1.8; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - h - 4); c.stroke(); c.fillStyle = '#c9a227'; c.beginPath(); c.arc(x, y - h - 5, 2, 0, 7); c.fill();
    const fx = x + 1, fy = y - h, fw = 20, fh = 26; c.save(); c.beginPath(); c.moveTo(fx, fy); c.lineTo(fx + fw, fy); c.lineTo(fx + fw, fy + fh); c.lineTo(fx + fw / 2, fy + fh - 6); c.lineTo(fx, fy + fh); c.closePath(); c.clip(); c.fillStyle = a.c1; c.fillRect(fx, fy, fw, fh); c.fillStyle = a.c2;
    if (a.div === 'partito') c.fillRect(fx + fw / 2, fy, fw / 2, fh); else if (a.div === 'troncato') c.fillRect(fx, fy + fh * 0.42, fw, fh); else if (a.div === 'inquartato') { c.fillRect(fx + fw / 2, fy, fw / 2, fh * 0.42); c.fillRect(fx, fy + fh * 0.42, fw / 2, fh); } else if (a.div === 'banda') { c.beginPath(); c.moveTo(fx, fy + 3); c.lineTo(fx + 3, fy); c.lineTo(fx + fw, fy + fh - 3); c.lineTo(fx + fw, fy + fh + 4); c.closePath(); c.fill(); }
    c.restore(); c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = .7; c.beginPath(); c.moveTo(fx, fy); c.lineTo(fx + fw, fy); c.lineTo(fx + fw, fy + fh); c.lineTo(fx + fw / 2, fy + fh - 6); c.lineTo(fx, fy + fh); c.closePath(); c.stroke();
    c.font = '11px serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff'; c.fillText(a.sym, fx + fw / 2, fy + fh * 0.42); c.textAlign = 'start'; c.textBaseline = 'alphabetic'; },
  tenda(c, lvl, s) {
    groundPlot(c, 2, 2, '#5a4a30');
    const A = isoP(1, 1, 40); const c00 = isoP(0.2, 0.2), c10 = isoP(1.8, 0.2), c11 = isoP(1.8, 1.8), c01 = isoP(0.2, 1.8);
    poly(c, [c00, c10, A], '#b8a27a', EDGE); poly(c, [c00, c01, A], '#c5ae84', EDGE); poly(c, [c01, c11, A], '#bda67c', EDGE); poly(c, [c11, c10, A], '#8f7c5a', EDGE);
    for (let i = 0; i < 4; i++) { const t = 0.15 + i * 0.22; const p = isoP(0.2 + 1.6 * t, 1.8), q = A; c.strokeStyle = 'rgba(120,30,25,.6)'; c.lineWidth = 3; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(q[0] + (p[0] - q[0]) * 0.15, q[1] + (p[1] - q[1]) * 0.15); c.stroke(); }
    const d = [isoP(0.85, 1.8), isoP(1.15, 1.8), isoP(1.0, 1.8, 18)]; poly(c, d, '#1d140b');
    banner(c, 1, 1, 40, 14, '#5a1d1d');
  },
  bottino(c, lvl, s) {
    groundPlot(c, 2, 2, '#5a4a30');
    prism(c, 0.3, 0.5, 1.6, 1.4, 6, 18, COL.dwood, 'plank', s);
    for (const [u, v] of [[0.45, 1.4], [1.4, 1.4]]) { const [x, y] = isoP(u, v, 6); c.fillStyle = '#2d1f12'; c.beginPath(); c.arc(x, y, 6, 0, 7); c.fill(); c.strokeStyle = '#6b4a2a'; c.lineWidth = 1.4; c.stroke(); }
    prism(c, 0.5, 0.6, 0.95, 1.0, 18, 27, '#6b4424', 'plank', s + 2, '#7a5230');
    prism(c, 1.05, 0.65, 1.45, 1.05, 18, 26, '#6b4424', 'plank', s + 3, '#7a5230');
    for (let i = 0; i < 7; i++) { const R = rng(s + i); const [x, y] = isoP(0.6 + R() * 0.8, 0.7 + R() * 0.3, 27); c.fillStyle = '#e1b93a'; c.beginPath(); c.arc(x, y, 1.6, 0, 7); c.fill(); }
    sack(c, 1.7, 1.7); sack(c, 1.5, 1.85, '#a88f5f');
  },
  capanno(c, lvl, s) { // enemy hut
    groundPlot(c, 2, 2, '#5a4a30');
    prism(c, 0.35, 0.35, 1.6, 1.5, 0, 18, COL.plaster, 'plaster', s);
    door(c, 0.75, 1.5, 'L', 0, 0.25, 12);
    gable(c, 0.35, 0.35, 1.6, 1.5, 18, 16, COL.thatch, 'u', 'thatch', s + 2, COL.plaster);
  },
  falo(c) { const [x, y] = isoP(0.5, 0.5); c.fillStyle = '#4a4036'; for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28; c.beginPath(); c.arc(x + Math.cos(a) * 9, y + Math.sin(a) * 4.5, 2.6, 0, 7); c.fill(); } c.fillStyle = '#2a1a10'; c.beginPath(); c.ellipse(x, y, 7, 3.5, 0, 0, 7); c.fill(); },
};
function paintWall(c, mask, stone, s) {
  // mask bits: 1:+u 2:-u 4:+v 8:-v
  const seg = (u0, v0, u1, v1) => {
    if (stone) { prism(c, u0, v0, u1, v1, 0, 22, COL.stone, 'stone', s); }
    else {
      const n = Math.max(1, Math.round(Math.hypot(u1 - u0, v1 - v0) / 0.16));
      for (let i = 0; i <= n; i++) { const t = i / n; logPost(c, u0 + (u1 - u0) * t + 0.08, v0 + (v1 - v0) * t + 0.08, 0, 22 + (i % 2) * 3, 2.1, COL.log, true); }
    }
  };
  const t = stone ? 0.17 : 0.0;
  if (mask & 8) seg(0.5 - t, 0, 0.5 + t, 0.5 - t);
  if (mask & 2) seg(0, 0.5 - t, 0.5 - t, 0.5 + t);
  if (stone) { prism(c, 0.3, 0.3, 0.7, 0.7, 0, 28, COL.stone, 'stone', s); prism(c, 0.28, 0.28, 0.72, 0.72, 28, 31, COL.stone); }
  else { logPost(c, 0.5, 0.5, 0, 28, 2.8, COL.dwood, true); }
  if (mask & 1) seg(0.5 + t, 0.5 - t, 1, 0.5 + t);
  if (mask & 4) seg(0.5 - t, 0.5 + t, 0.5 + t, 1);
  if (stone) { // merlons
    const m = (u, v) => prism(c, u - 0.07, v - 0.07, u + 0.07, v + 0.07, 22, 28, COL.stone);
    if (mask & 1) { m(0.85, 0.5); } if (mask & 4) { m(0.5, 0.85); }
  } else { // binding
    c.strokeStyle = 'rgba(60,40,20,.8)'; c.lineWidth = 1.2;
    if (mask & 1) { const a = isoP(0.5, 0.58, 12), b = isoP(1.0, 0.58, 12); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
    if (mask & 4) { const a = isoP(0.58, 0.5, 12), b = isoP(0.58, 1.0, 12); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
  }
}
function paintRubble(c, w, h, s) {
  const R = rng(s), cx = w / 2, cy = h / 2;
  // terra bruciata dai bordi irregolari e sfumati
  for (let i = 0; i < 26 * w * h / 4 + 10; i++) { const a = R() * 6.283, d = Math.sqrt(R()) * 0.5; const u = cx + Math.cos(a) * d * w * 0.95, v = cy + Math.sin(a) * d * h * 0.95; const [x, y] = isoP(u, v); const r = (6 + R() * 10) * Math.sqrt(w * h) / 2; const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${30 + R() * 20 | 0},${22 + R() * 14 | 0},${14 + R() * 8 | 0},${0.16 + R() * 0.12})`); g.addColorStop(1, 'rgba(30,22,14,0)'); c.fillStyle = g; c.beginPath(); c.ellipse(x, y, r, r * 0.55, 0, 0, 7); c.fill(); }
  const stone = (x, y, r) => { const n = 5 + (R() * 3 | 0), pts = []; for (let k = 0; k < n; k++) { const a = k / n * 6.283 + R() * 0.5, rr = r * (0.7 + R() * 0.45); pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.62]); } const base = 0.62 + R() * 0.45; poly(c, pts, shade('#9a9184', base), 'rgba(30,24,18,0.55)', 0.7); c.fillStyle = shade('#c8c0b2', base, 0.55); c.beginPath(); c.ellipse(x - r * 0.25, y - r * 0.2, r * 0.38, r * 0.2, -0.3, 0, 7); c.fill(); };
  const beam = (x, y, L, ang, burnt) => { c.save(); c.translate(x, y); c.rotate(ang); const col = burnt ? '#2e2016' : shade('#6b4a2a', 0.8 + R() * 0.3); c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(-L / 2 + 1, 0.6, L, 3.4); c.fillStyle = col; c.fillRect(-L / 2, -1.6, L, 3.4); c.fillStyle = burnt ? 'rgba(255,120,40,0.35)' : 'rgba(255,230,180,0.25)'; c.fillRect(-L / 2, -1.6, L, 1); c.fillStyle = '#1a120b'; c.fillRect(L / 2 - 2.5, -1.6, 2.5, 3.4); c.restore(); };
  // 2-4 cumuli di macerie
  const piles = 2 + (R() * 2 | 0) + (w > 2 ? 1 : 0);
  for (let p = 0; p < piles; p++) { const pu = 0.35 + R() * (w - 0.7), pv = 0.35 + R() * (h - 0.7); const big = 0.6 + R() * 0.6;
    for (let i = 0; i < 4; i++) { const [x, y] = isoP(pu + (R() - .5) * 0.6, pv + (R() - .5) * 0.6); beam(x, y - R() * 4, 14 + R() * 14, R() * 3.14, R() < 0.6); }
    for (let i = 0; i < 9 * big; i++) { const a = R() * 6.283, d = R() * 0.45 * big; const [x, y] = isoP(pu + Math.cos(a) * d, pv + Math.sin(a) * d, (0.45 * big - d) * 14); stone(x, y, 2.2 + R() * 3.4 * big); } }
  // pietre e schegge sparse
  for (let i = 0; i < 10 * w * h / 4 + 4; i++) { const [x, y] = isoP(0.15 + R() * (w - 0.3), 0.15 + R() * (h - 0.3)); if (R() < 0.7) stone(x, y, 1.2 + R() * 1.8); else beam(x, y, 6 + R() * 6, R() * 3.14, true); }
}
// caches
// ================= DECORAZIONI: disegni procedurali (sostituibili con modelli Meshy dello stesso nome) =================
function cylD(c, x, y, rx, ry, h, col, top) { const g = c.createLinearGradient(x - rx, 0, x + rx, 0); g.addColorStop(0, shade(col, 1.12)); g.addColorStop(0.55, shade(col, 0.92)); g.addColorStop(1, shade(col, 0.6)); c.fillStyle = g; c.beginPath(); c.moveTo(x - rx, y - h); c.lineTo(x - rx, y); c.ellipse(x, y, rx, ry, 0, Math.PI, 0, true); c.lineTo(x + rx, y - h); c.closePath(); c.fill(); c.strokeStyle = EDGE; c.lineWidth = 0.7; c.stroke(); c.fillStyle = top || shade(col, 1.2); c.beginPath(); c.ellipse(x, y - h, rx, ry, 0, 0, 7); c.fill(); c.stroke(); }
function shadowE(c, x, y, rx, ry, a) { c.fillStyle = `rgba(0,0,0,${a || 0.22})`; c.beginPath(); c.ellipse(x + rx * 0.25, y + ry * 0.15, rx, ry, 0, 0, 7); c.fill(); }
function stonesRing(c, x, y, rx, ry, h, R) { c.strokeStyle = 'rgba(40,32,24,0.45)'; c.lineWidth = 0.6; for (let z = 3; z < h; z += 4) { c.beginPath(); c.ellipse(x, y - z, rx, ry, 0, 0.1, Math.PI - 0.1); c.stroke(); } for (let i = 0; i < 9; i++) { const a = 0.25 + i * 0.32, zz = (i % 3) * 4 + 2; c.beginPath(); c.moveTo(x - Math.cos(a) * rx, y - zz + Math.sin(a) * ry); c.lineTo(x - Math.cos(a) * rx, y - zz - 4 + Math.sin(a) * ry); c.stroke(); } }
const DPAINT = {
  pozzo(c, lvl, s) { const [x, y] = isoP(0.5, 0.5); shadowE(c, x, y, 17, 8); cylD(c, x, y, 13, 6.5, 13, '#9a9184', '#3d4a52'); stonesRing(c, x, y, 13, 6.5, 13); c.fillStyle = '#2b3c46'; c.beginPath(); c.ellipse(x, y - 13, 9.5, 4.6, 0, 0, 7); c.fill(); c.fillStyle = 'rgba(150,200,230,0.5)'; c.beginPath(); c.ellipse(x - 2, y - 14, 4, 1.5, 0, 0, 7); c.fill();
    for (const dx of [-11, 11]) { c.fillStyle = '#5a3a20'; c.fillRect(x + dx - 1.4, y - 38, 2.8, 26); } c.strokeStyle = '#3a2614'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 11, y - 33); c.lineTo(x + 11, y - 33); c.stroke(); c.strokeStyle = '#c9b48a'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x + 2, y - 33); c.lineTo(x + 2, y - 20); c.stroke(); c.fillStyle = '#6b4a2a'; c.fillRect(x - 1, y - 21, 6, 5);
    poly(c, [[x - 17, y - 36], [x, y - 48], [x + 17, y - 36], [x, y - 30]], '#7a4a2a', EDGE); poly(c, [[x, y - 48], [x + 17, y - 36], [x + 17, y - 33], [x, y - 45]], '#5a3418'); },
  fontana(c, lvl, s) { const [x, y] = isoP(1, 1); shadowE(c, x, y, 38, 18); cylD(c, x, y, 34, 17, 11, '#b4ab9c', '#cfc6b6'); stonesRing(c, x, y, 34, 17, 11); c.fillStyle = '#3f7fa8'; c.beginPath(); c.ellipse(x, y - 11, 29, 14, 0, 0, 7); c.fill(); c.fillStyle = 'rgba(200,235,255,0.35)'; for (let i = 0; i < 5; i++) { c.beginPath(); c.ellipse(x - 14 + i * 7, y - 12 + (i % 2) * 4, 5, 1.4, 0, 0, 7); c.fill(); }
    cylD(c, x, y - 11, 5, 2.5, 22, '#a59c8e'); cylD(c, x, y - 33, 13, 6, 4, '#b4ab9c', '#4a8bb5'); cylD(c, x, y - 37, 3, 1.5, 9, '#a59c8e'); c.fillStyle = '#d8d0c0'; c.beginPath(); c.arc(x, y - 47, 3.2, 0, 7); c.fill(); },
  statua(c, lvl, s) { const [x, y] = isoP(0.5, 0.5); shadowE(c, x, y, 16, 7, 0.26); prism(c, 0.22, 0.22, 0.78, 0.78, 0, 6, '#a39a8c', 'stone', s); prism(c, 0.3, 0.3, 0.7, 0.7, 6, 18, '#b5ac9e', 'stone', s + 1); const by = y - 18, br = '#5f7d6c';
    c.fillStyle = br; c.beginPath(); c.moveTo(x - 7, by); c.lineTo(x - 5, by - 22); c.lineTo(x + 5, by - 22); c.lineTo(x + 7, by); c.closePath(); c.fill(); c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = .7; c.stroke(); c.fillStyle = shade(br, 0.75); c.beginPath(); c.moveTo(x + 1, by); c.lineTo(x + 3, by - 22); c.lineTo(x + 5, by - 22); c.lineTo(x + 7, by); c.closePath(); c.fill();
    c.fillStyle = shade(br, 1.15); c.beginPath(); c.arc(x, by - 26, 4, 0, 7); c.fill(); c.stroke(); c.strokeStyle = shade(br, 0.9); c.lineWidth = 2; c.beginPath(); c.moveTo(x + 5, by - 19); c.lineTo(x + 10, by - 34); c.stroke(); c.strokeStyle = '#8fa89a'; c.lineWidth = 1; c.beginPath(); c.moveTo(x + 7, by - 30); c.lineTo(x + 13, by - 30); c.stroke(); c.fillStyle = '#c9a227'; c.beginPath(); c.moveTo(x - 4, by - 29); c.lineTo(x - 3, by - 32); c.lineTo(x, by - 30); c.lineTo(x + 3, by - 32); c.lineTo(x + 4, by - 29); c.closePath(); c.fill(); },
  aiuola(c, lvl, s) { const [x, y] = isoP(0.5, 0.5); const R = rng(s * 7 + 3); poly(c, [isoP(0.12, 0.5), isoP(0.5, 0.12), isoP(0.88, 0.5), isoP(0.5, 0.88)], '#5b4126', '#8a8174', 2); poly(c, [isoP(0.18, 0.5), isoP(0.5, 0.18), isoP(0.82, 0.5), isoP(0.5, 0.82)], '#4e7a2c');
    const cols = ['#e0453a', '#f2c94c', '#f5f1e8', '#b05fd0', '#ff8fb0', '#5b8ce0']; for (let i = 0; i < 34; i++) { const u = 0.22 + R() * 0.56, v = 0.22 + R() * 0.56; if (Math.abs(u - 0.5) + Math.abs(v - 0.5) > 0.3) continue; const [px, py] = isoP(u, v, 0); c.strokeStyle = '#3d6a22'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(px, py); c.lineTo(px, py - 4); c.stroke(); c.fillStyle = cols[(R() * cols.length) | 0]; c.beginPath(); c.arc(px, py - 5, 1.9, 0, 7); c.fill(); } },
  siepe(c, lvl, s) { prism(c, 0.12, 0.12, 0.88, 0.88, 0, 13, '#3f6e2a', null, s, '#5a8c38'); const R = rng(s + 9); for (let i = 0; i < 40; i++) { const u = 0.15 + R() * 0.7, v = 0.15 + R() * 0.7; const [px, py] = isoP(u, v, 13); c.fillStyle = R() < 0.5 ? 'rgba(120,170,70,0.6)' : 'rgba(30,60,20,0.4)'; c.beginPath(); c.arc(px, py, 1.6, 0, 7); c.fill(); } },
  lanterna(c, lvl, s) { const [x, y] = isoP(0.5, 0.5); shadowE(c, x, y, 6, 3); c.fillStyle = '#2b2b2b'; c.fillRect(x - 1.2, y - 44, 2.4, 44); c.fillRect(x - 4, y - 2, 8, 2); c.fillRect(x - 1, y - 44, 9, 1.6); c.fillStyle = '#ffd77a'; c.fillRect(x + 4, y - 41, 6, 8); c.strokeStyle = '#2b2b2b'; c.lineWidth = 1; c.strokeRect(x + 4, y - 41, 6, 8); c.beginPath(); c.moveTo(x + 3, y - 41); c.lineTo(x + 7, y - 45); c.lineTo(x + 11, y - 41); c.closePath(); c.fillStyle = '#2b2b2b'; c.fill(); },
  pagliaio(c, lvl, s) { const [x, y] = isoP(0.5, 0.5); shadowE(c, x, y, 17, 8); const g = c.createLinearGradient(x - 14, 0, x + 14, 0); g.addColorStop(0, '#e2c46a'); g.addColorStop(0.6, '#c8a64a'); g.addColorStop(1, '#8f7330'); c.fillStyle = g; c.beginPath(); c.moveTo(x - 14, y); c.bezierCurveTo(x - 15, y - 26, x + 15, y - 26, x + 14, y); c.ellipse(x, y, 14, 7, 0, 0, Math.PI); c.closePath(); c.fill(); c.strokeStyle = EDGE; c.lineWidth = .7; c.stroke();
    const R = rng(s + 4); c.strokeStyle = 'rgba(110,80,30,0.5)'; for (let i = 0; i < 22; i++) { const px = x - 11 + R() * 22, py = y - 2 - R() * 16; c.beginPath(); c.moveTo(px, py); c.lineTo(px + (R() - 0.5) * 4, py + 4); c.stroke(); } logPost(c, 0.5, 0.5, 18, 9, 0.8, '#5a3a20'); },
  catasta(c, lvl, s) { const R = rng(s + 2); for (let row = 0; row < 3; row++) for (let i = 0; i < 4 - (row ? 1 : 0); i++) { const u = 0.2 + i * 0.18 + row * 0.09; const [px, py] = isoP(u, 0.78, 4 + row * 7.5); c.fillStyle = '#7a5230'; c.beginPath(); c.moveTo(px, py); c.lineTo(px + 14, py - 7); c.lineTo(px + 14, py - 14); c.lineTo(px, py - 7); c.closePath(); c.fill(); c.strokeStyle = EDGE; c.lineWidth = .6; c.stroke(); c.fillStyle = '#c9a272'; c.beginPath(); c.ellipse(px, py - 3.5, 3.6, 3.6, 0, 0, 7); c.fill(); c.stroke(); c.strokeStyle = 'rgba(120,80,40,0.7)'; c.beginPath(); c.arc(px, py - 3.5, 1.6, 0, 7); c.stroke(); } },
  recinto(c, lvl, s) { const R = rng(s + 5); const P = [[0.1, 0.1], [1.9, 0.1], [1.9, 1.9], [0.1, 1.9]]; poly(c, P.map(p => isoP(p[0], p[1])), 'rgba(120,150,60,0.35)');
    const sheep = (u, v) => { const [px, py] = isoP(u, v); shadowE(c, px, py, 7, 3); c.fillStyle = '#efeae0'; c.beginPath(); c.ellipse(px, py - 6, 7, 5, 0, 0, 7); c.fill(); c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = .6; c.stroke(); c.fillStyle = '#3a3330'; c.beginPath(); c.ellipse(px + 7, py - 7, 2.6, 2.2, 0, 0, 7); c.fill(); c.fillRect(px - 4, py - 2, 1.4, 3); c.fillRect(px + 3, py - 2, 1.4, 3); };
    const hen = (u, v, col) => { const [px, py] = isoP(u, v); c.fillStyle = col; c.beginPath(); c.ellipse(px, py - 3, 3, 2.4, 0, 0, 7); c.fill(); c.fillStyle = '#c0392b'; c.fillRect(px + 2, py - 6, 1.4, 1.6); };
    // steccato dietro
    const rail = (a, b) => { for (const z of [5, 10]) { const p = isoP(a[0], a[1], z), q = isoP(b[0], b[1], z); c.strokeStyle = '#6b4a2a'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); c.stroke(); } };
    rail(P[0], P[1]); rail(P[3], P[0]); for (let i = 0; i <= 6; i++) { logPost(c, 0.1 + i * 0.3, 0.1, 0, 12, 1, '#6b4a2a'); logPost(c, 0.1, 0.1 + i * 0.3, 0, 12, 1, '#6b4a2a'); }
    prism(c, 1.3, 0.35, 1.7, 0.55, 0, 5, '#6b4a2a', 'plank', s); sheep(0.7, 0.8); sheep(1.2, 1.25); sheep(0.6, 1.4); for (let i = 0; i < 4; i++) hen(1.2 + R() * 0.5, 0.6 + R() * 0.6, R() < 0.5 ? '#f4efe4' : '#a5652f');
    rail(P[1], P[2]); rail(P[2], P[3]); for (let i = 0; i <= 6; i++) { logPost(c, 1.9, 0.1 + i * 0.3, 0, 12, 1, '#6b4a2a'); logPost(c, 0.1 + i * 0.3, 1.9, 0, 12, 1, '#6b4a2a'); } },
  carretto(c, lvl, s) { const [x, y] = isoP(0.5, 0.5); shadowE(c, x, y, 18, 8); prism(c, 0.2, 0.3, 0.8, 0.7, 8, 15, '#7a5230', 'plank', s); c.strokeStyle = '#55381f'; c.lineWidth = 1.8; const a = isoP(0.8, 0.4, 9), b = isoP(1.15, 0.35, 4); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); const a2 = isoP(0.8, 0.6, 9), b2 = isoP(1.15, 0.65, 4); c.moveTo(a2[0], a2[1]); c.lineTo(b2[0], b2[1]); c.stroke();
    const [wx2, wy2] = isoP(0.45, 0.72, 7); c.fillStyle = '#3a2614'; c.beginPath(); c.ellipse(wx2, wy2, 6.5, 7, 0, 0, 7); c.fill(); c.strokeStyle = '#8a6a44'; c.lineWidth = 1.2; c.beginPath(); c.ellipse(wx2, wy2, 5, 5.5, 0, 0, 7); c.stroke(); sack(c, 0.4, 0.45, '#c9b48a'); const [sx, sy] = isoP(0.6, 0.5, 15); c.fillStyle = '#b8902e'; c.beginPath(); c.ellipse(sx, sy - 3, 5, 3.5, 0, 0, 7); c.fill(); },
  croce(c, lvl, s) { const [x, y] = isoP(0.5, 0.5); shadowE(c, x, y, 13, 6); prism(c, 0.25, 0.25, 0.75, 0.75, 0, 5, '#9d9486', 'stone', s); prism(c, 0.33, 0.33, 0.67, 0.67, 5, 9, '#aaa193', 'stone', s + 1); prism(c, 0.45, 0.45, 0.55, 0.55, 9, 40, '#b8afa0', null, s); prism(c, 0.45, 0.3, 0.55, 0.7, 28, 33, '#b8afa0', null, s); const R = rng(s); c.fillStyle = 'rgba(90,120,60,0.55)'; for (let i = 0; i < 6; i++) { const [px, py] = isoP(0.3 + R() * 0.4, 0.3 + R() * 0.4, 5); c.beginPath(); c.arc(px, py, 1.4, 0, 7); c.fill(); } },
  alveari(c, lvl, s) { prism(c, 0.15, 0.4, 0.85, 0.6, 5, 7, '#7a5230', 'plank', s); for (const u of [0.15, 0.85]) logPost(c, u, 0.5, 0, 6, 0.9, '#55381f'); for (const u of [0.27, 0.5, 0.73]) { const [px, py] = isoP(u, 0.5, 7); const g = c.createLinearGradient(px - 7, 0, px + 7, 0); g.addColorStop(0, '#e0c070'); g.addColorStop(1, '#94742c'); c.fillStyle = g; c.beginPath(); c.moveTo(px - 7, py); c.bezierCurveTo(px - 7, py - 15, px + 7, py - 15, px + 7, py); c.closePath(); c.fill(); c.strokeStyle = 'rgba(90,60,20,0.55)'; c.lineWidth = 0.7; for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(px - 7 + k * 0.6, py - k * 3); c.lineTo(px + 7 - k * 0.6, py - k * 3); c.stroke(); } c.fillStyle = '#2a1a0a'; c.beginPath(); c.arc(px, py - 2, 1.4, 0, 7); c.fill(); } },
  spaventapasseri(c, lvl, s) { const [x, y] = isoP(0.5, 0.5); shadowE(c, x, y, 7, 3); c.fillStyle = '#5a3a20'; c.fillRect(x - 1.2, y - 40, 2.4, 40); c.fillRect(x - 13, y - 30, 26, 2.2); c.fillStyle = '#8f3b2a'; c.beginPath(); c.moveTo(x - 9, y - 31); c.lineTo(x + 9, y - 31); c.lineTo(x + 7, y - 16); c.lineTo(x - 7, y - 16); c.closePath(); c.fill(); c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = .6; c.stroke(); c.fillStyle = '#d9c38a'; c.beginPath(); c.arc(x, y - 36, 4.5, 0, 7); c.fill(); c.fillStyle = '#b8902e'; c.beginPath(); c.ellipse(x, y - 40, 9, 2.6, 0, 0, 7); c.fill(); c.beginPath(); c.moveTo(x - 4.5, y - 40); c.lineTo(x, y - 47); c.lineTo(x + 4.5, y - 40); c.fill(); c.strokeStyle = '#d9c38a'; c.lineWidth = 1; for (const dx of [-13, 13]) { c.beginPath(); c.moveTo(x + dx, y - 29); c.lineTo(x + dx * 1.15, y - 26); c.stroke(); } },
  bancarella(c, lvl, s) { const R = rng(s + 1); prism(c, 0.2, 0.35, 0.8, 0.7, 0, 12, '#7a5230', 'plank', s, '#8a6238'); for (let i = 0; i < 9; i++) { const [px, py] = isoP(0.26 + R() * 0.48, 0.4 + R() * 0.25, 12); c.fillStyle = ['#c0392b', '#e1b93a', '#6a9a3a', '#d27a2c', '#8e44ad'][(R() * 5) | 0]; c.beginPath(); c.arc(px, py - 1.5, 2.2, 0, 7); c.fill(); }
    for (const [u, v] of [[0.2, 0.3], [0.8, 0.3], [0.2, 0.75], [0.8, 0.75]]) logPost(c, u, v, 0, 30, 0.9, '#55381f'); const C = [isoP(0.12, 0.25, 32), isoP(0.88, 0.25, 32), isoP(0.88, 0.85, 26), isoP(0.12, 0.85, 26)]; c.save(); poly(c, C); c.clip(); for (let i = 0; i < 8; i++) { const a = isoP(0.12 + i * 0.1, 0.2, 34), b = isoP(0.12 + i * 0.1, 0.9, 24); c.strokeStyle = i % 2 ? '#f1e6cf' : '#b3261e'; c.lineWidth = 7; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); } c.restore(); poly(c, C, null, EDGE, 0.8); },
  gogna(c, lvl, s) { const [x, y] = isoP(0.5, 0.5); shadowE(c, x, y, 14, 6); prism(c, 0.2, 0.3, 0.8, 0.7, 0, 4, '#6b4a2a', 'plank', s); for (const u of [0.3, 0.7]) logPost(c, u, 0.5, 4, 26, 1.3, '#55381f'); prism(c, 0.26, 0.46, 0.74, 0.54, 20, 26, '#7a5230', 'plank', s + 1); for (const u of [0.38, 0.5, 0.62]) { const [px, py] = isoP(u, 0.54, 23); c.fillStyle = '#1d140b'; c.beginPath(); c.arc(px, py, u === 0.5 ? 2.4 : 1.4, 0, 7); c.fill(); } },
  panni(c, lvl, s) { for (const u of [0.12, 0.88]) logPost(c, u, 0.5, 0, 26, 1, '#55381f'); const a = isoP(0.12, 0.5, 24), b = isoP(0.88, 0.5, 24); c.strokeStyle = '#d8cdb5'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 3, b[0], b[1]); c.stroke(); const [x, y] = isoP(0.5, 0.5); shadowE(c, x, y, 18, 5, 0.14); },
};
// parti animate disegnate a ogni fotogramma
const DANIM = {
  panni(c, b, cx, cy, t) { const cols = ['#e8e2d4', '#b3261e', '#3d5fa8', '#e8d48a']; for (let i = 0; i < 4; i++) { const u = 0.22 + i * 0.19; const [px, py] = isoP(u - 0.5, 0, 22.5 + Math.abs(u - 0.5) * -2); const sw = Math.sin(t * 2.2 + i * 1.3 + b.id) * 2.2; c.fillStyle = cols[(i + b.id) % 4]; c.beginPath(); c.moveTo(cx + px - 4, cy + py); c.lineTo(cx + px + 4, cy + py - 2); c.lineTo(cx + px + 4 + sw, cy + py + 9); c.lineTo(cx + px - 4 + sw, cy + py + 11); c.closePath(); c.fill(); c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = .5; c.stroke(); } },
  fontana(c, b, cx, cy, t) { c.strokeStyle = 'rgba(200,235,255,0.75)'; c.lineWidth = 1.1; for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283 + t * 0.6, r = 10 + Math.sin(t * 3 + i) * 1.5; c.beginPath(); c.moveTo(cx, cy - 47); c.quadraticCurveTo(cx + Math.cos(a) * r * 0.6, cy - 52 + Math.sin(a) * r * 0.3, cx + Math.cos(a) * r, cy - 36 + Math.sin(a) * r * 0.5); c.stroke(); } c.fillStyle = 'rgba(230,248,255,0.8)'; for (let i = 0; i < 5; i++) { const k = (t * 1.3 + i / 5) % 1; c.beginPath(); c.arc(cx + Math.cos(i * 2.1) * (8 + k * 18), cy - 13 + Math.sin(i * 2.1) * (4 + k * 8), 1.2 * (1 - k) + 0.4, 0, 7); c.fill(); } },
  alveari(c, b, cx, cy, t) { c.fillStyle = '#2a1a0a'; for (let i = 0; i < 6; i++) { const a = t * (1.5 + i * 0.3) + i * 2; c.beginPath(); c.arc(cx + Math.cos(a) * (9 + i * 2), cy - 16 + Math.sin(a * 1.7) * 6, 0.9, 0, 7); c.fill(); } },
  recinto(c, b, cx, cy, t) { if (Math.sin(t * 0.7 + b.id) > 0.92) { c.fillStyle = 'rgba(255,255,255,0.85)'; c.font = '9px serif'; c.fillText('♪', cx - 6, cy - 28 - (t % 1) * 4); } },
};
Object.assign(PAINT, DPAINT);
const CACHE = {};
function cached(key, w, h, top, fn) {
  let e = CACHE[key]; if (e) return e;
  const pad = 30, cw = (w + h) * TW / 2 + pad * 2, ch = (w + h) * TH / 2 + top + pad;
  const cvs = document.createElement('canvas'); cvs.width = Math.ceil(cw * RS); cvs.height = Math.ceil(ch * RS);
  const c = cvs.getContext('2d'); c.scale(RS, RS); c.translate(h * TW / 2 + pad, top); c.lineJoin = 'round';
  fn(c);
  e = CACHE[key] = { cv: cvs, ox: h * TW / 2 + pad, oy: top, w: cw, h: ch };
  return e;
}
// trees
function paintTree(c, kind, s) {
  const R = rng(s);
  c.fillStyle = 'rgba(0,0,0,0.22)'; c.beginPath(); c.ellipse(0, 0, 18, 8, 0, 0, 7); c.fill();
  c.fillStyle = '#4a3220'; c.fillRect(-2.5, -18, 5, 18);
  if (kind === 0) { // pine
    const h = 60 + R() * 22;
    for (let i = 0; i < 4; i++) {
      const y = -14 - i * h / 5, wdt = 22 - i * 4;
      c.fillStyle = shade('#2f4a2a', 0.8 + i * 0.12); c.beginPath(); c.moveTo(-wdt, y); c.lineTo(0, y - h / 3.2); c.lineTo(wdt, y); c.closePath(); c.fill();
      c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.moveTo(0, y - h / 3.2); c.lineTo(wdt, y); c.lineTo(3, y); c.closePath(); c.fill();
    }
  } else { // oak
    const blobs = 7 + (R() * 4 | 0);
    for (let i = 0; i < blobs; i++) { const x = (R() - 0.5) * 30, y = -30 - R() * 26, r = 9 + R() * 8; c.fillStyle = shade(kind === 1 ? '#4c5e2c' : '#5d5a2a', 0.75 + R() * 0.45); c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
    for (let i = 0; i < 18; i++) { const x = (R() - 0.5) * 34, y = -28 - R() * 30; c.fillStyle = 'rgba(200,210,120,0.18)'; c.beginPath(); c.arc(x, y, 2 + R() * 2, 0, 7); c.fill(); }
  }
}
const TREES = [];
function treeSprites() {
  for (let i = 0; i < 6; i++) {
    const cvs = document.createElement('canvas'); cvs.width = 90 * RS; cvs.height = 110 * RS;
    const c = cvs.getContext('2d'); c.scale(RS, RS); c.translate(45, 102); paintTree(c, i % 3, 100 + i * 17);
    TREES.push(cvs);
  }
}
function paintRock(c, s) { const R = rng(s); for (let i = 0; i < 3; i++) { const x = (R() - .5) * 14, y = -R() * 4; c.fillStyle = shade('#8c857a', 0.7 + R() * 0.4); c.beginPath(); c.ellipse(x, y, 6 + R() * 6, 4 + R() * 4, 0, 0, 7); c.fill(); c.strokeStyle = EDGE; c.lineWidth = .7; c.stroke(); } }
// ground prerender
// top-down ground texture (rotates smoothly with the map); decals = river/pond art
const EATL = new Image(); let EATL_OK = false; EATL.onload = () => { EATL_OK = true; };
// ================= SENTIERI: rete di strade lastricate tra gli edifici; la gente cammina su quelle =================
let PATHC = { key: '', grid: null, cv: null, P: 14 };
function pathKey(sc) { return sc.B.filter(b => !b.dead && !BDEF[b.t].decor).map(b => b.t[0] + b.x + ',' + b.y + (BDEF[b.t].wall ? 'w' : '')).sort().join('|'); }
function computePaths(sc) {
  const key = pathKey(sc); if (PATHC.key === key && PATHC.grid) { sc.pathG = PATHC.grid; return; }
  const G = new Uint8Array(N * N); const blocked = (x, y) => { const b = bAt(sc, x, y); if (!b) return false; const d = BDEF[b.t]; return !(d.decor || b.t === 'cancello'); };
  const m = sc.B.find(b => b.t === 'mastio');
  const doors = []; for (const b of sc.B) { const d = BDEF[b.t]; if (b.dead || d.wall || d.decor || b.nat) continue; doors.push([b, frontTile(sc, b)]); }
  if (!m) { PATHC = { key, grid: G, cv: null, P: 14, lines: [] }; sc.pathG = G; return; }
  const [mx, my] = frontTile(sc, m); G[my * N + mx] = 1; const lines = [];
  // piazza davanti al mastio
  for (let yy = -1; yy <= 1; yy++) for (let xx = -1; xx <= 1; xx++) { const x = mx + xx, y = my + yy; if (inMap(x, y) && !blocked(x, y) && !sc.water[y * N + x]) G[y * N + x] = 1; }
  doors.sort((a, b) => Math.hypot(a[1][0] - mx, a[1][1] - my) - Math.hypot(b[1][0] - mx, b[1][1] - my));
  const cost = (x, y) => { if (blocked(x, y)) return Infinity; if (sc.water[y * N + x]) return 40; const b = bAt(sc, x, y); if (b && BDEF[b.t].wall) return 3; return G[y * N + x] ? 0.35 : 1.6; };
  for (const [b, [dx, dy]] of doors) {
    if (G[dy * N + dx]) continue; const p = astar(dx, dy, (x, y) => G[y * N + x] === 1, cost, mx, my, 9000); G[dy * N + dx] = 1;
    if (p) { for (const [x, y] of p) G[y * N + x] = 1; const pts = [[dx + 0.5, dy + 0.5]]; for (const [x, y] of p) { const l = pts[pts.length - 1]; if (l[0] !== x + 0.5 || l[1] !== y + 0.5) pts.push([x + 0.5, y + 0.5]); } if (pts.length > 1) lines.push(pts); }
  }
  PATHC = { key, grid: G, cv: null, P: 14, lines, plaza: [mx + 0.5, my + 0.5] }; PATHC.lamps = pathLamps(sc, lines, G, blocked); PATHC.banners = villageBanners(sc, m, mx, my, blocked); sc.pathG = G;
}
// lampioni lungo i sentieri: uno ogni ~4 caselle, a lato della strada, alternando i lati
// insegne di guerra: coppie ai tre ingressi del borgo (dove le strade di terra entrano nell'abitato) e ai lati della piazza del Mastio
function villageBanners(sc, m, mx, my, blocked) {
  const out = [], mid = NMAP / 2, cx = m.x + m.w / 2, cy = m.y + m.h / 2; let rad = 7;
  for (const b of sc.B) { const d = BDEF[b.t]; if (b.dead || d.decor || d.wall || b.nat) continue; rad = Math.max(rad, Math.hypot(b.x + b.w / 2 - mid, b.y + b.h / 2 - mid) + 2.5); }
  const ok = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y); return inMap(xi, yi) && xi > 2 && yi > 2 && xi < N - 3 && yi < N - 3 && !blocked(xi, yi) && !sc.water[yi * N + xi] && !bAt(sc, xi, yi); };
  const curve = (ax, ay, bx, by, bend, t) => { const qx = (ax + bx) / 2 + bend, qy = (ay + by) / 2 - bend * 0.5; return [(1 - t) * (1 - t) * ax + 2 * (1 - t) * t * qx + t * t * bx, (1 - t) * (1 - t) * ay + 2 * (1 - t) * t * qy + t * t * by]; };
  for (const [bx, by, bd] of [[mid, 3, 1], [3, mid, 1], [N - 4, mid - 4, 1.2]]) {
    for (let i = 1; i < 200; i++) { const t = i / 200, [x, y] = curve(mid, mid, bx, by, bd, t); if (Math.hypot(x - mid, y - mid) < rad) continue; const [x2, y2] = curve(mid, mid, bx, by, bd, t + 0.01); const dx = x2 - x, dy = y2 - y, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
      const yaw = Math.atan2(dy, dx); for (const sd of [1, -1]) { const px = x + nx * 1.1 * sd, py = y + ny * 1.1 * sd; if (ok(px, py)) out.push({ x: px, y: py, yaw: yaw + (sd > 0 ? 0 : Math.PI) }); } break; } }
  // insegne dell'esercito agli angoli di caserma, poligono e stalla
  for (const b of sc.B) if (!b.dead && (b.t === 'caserma' || b.t === 'poligono' || b.t === 'scuderia')) for (const [px, py] of [[b.x - 0.35, b.y + b.h + 0.35], [b.x + b.w + 0.35, b.y + b.h + 0.35]]) if (ok(px, py)) out.push({ x: px, y: py, yaw: 0, h: 100 });
  // ai lati della piazza davanti al Mastio
  const fx = mx + 0.5 - cx, fy = my + 0.5 - cy, fl = Math.hypot(fx, fy) || 1, nx = -fy / fl, ny = fx / fl;
  for (const sd of [1, -1]) { const px = mx + 0.5 + nx * 1.6 * sd + fx / fl * 0.6, py = my + 0.5 + ny * 1.6 * sd + fy / fl * 0.6; if (ok(px, py)) out.push({ x: px, y: py, yaw: Math.atan2(fy, fx) }); }
  return out;
}
function pathLamps(sc, lines, G, blocked) {
  const out = [], free = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y); return inMap(xi, yi) && !G[yi * N + xi] && !blocked(xi, yi) && !sc.water[yi * N + xi] && !bAt(sc, xi, yi); };
  const near = (x, y, r) => out.some(l => Math.hypot(l.x - x, l.y - y) < r); let side = 1;
  for (const l0 of lines) { const l = chaikin(l0); let acc = 1.6;
    for (let i = 1; i < l.length; i++) { const [ax, ay] = l[i - 1], [bx, by] = l[i]; const d = Math.hypot(bx - ax, by - ay); if (!d) continue; acc += d; if (acc < 5.5) continue;
      const nx = -(by - ay) / d, ny = (bx - ax) / d; let put = false;
      for (const sd of [side, -side]) { const x = bx + nx * 0.62 * sd, y = by + ny * 0.62 * sd; if (free(x, y) && !near(x, y, 2.6)) { out.push({ x, y, yaw: Math.atan2(-ny * sd, -nx * sd) }); put = true; side = -sd; break; } }
      if (put) acc = 0; } }
  return out;
}
function pathCanvas() {
  if (PATHC.cv || !PATHC.grid || !TEX_OK || !TEX.path) return PATHC.cv; const P = PATHC.P, G = PATHC.grid; const cv2 = document.createElement('canvas'); cv2.width = cv2.height = N * P; const c = cv2.getContext('2d');
  const segs = []; for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (G[y * N + x]) { for (const [ex, ey] of [[1, 0], [0, 1], [1, 1], [-1, 1]]) { const nx = x + ex, ny = y + ey; if (inMap(nx, ny) && G[ny * N + nx]) { if (ex && ey && (G[y * N + nx] || G[ny * N + x])) continue; segs.push([x, y, nx, ny]); } } segs.push([x, y, x, y]); }
  const stroke = (w, style) => { c.strokeStyle = style; c.lineWidth = w * P; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); for (const [a, b, d, e] of segs) { c.moveTo((a + 0.5) * P, (b + 0.5) * P); c.lineTo((d + 0.5) * P + 0.01, (e + 0.5) * P); } c.stroke(); };
  // bordo di terra battuta, poi le lastre
  c.globalAlpha = 0.7; stroke(1.5, '#4a3420'); c.globalAlpha = 1; stroke(1.18, '#6b5236');
  const tmp = document.createElement('canvas'); tmp.width = tmp.height = N * P; const t = tmp.getContext('2d');
  t.strokeStyle = '#000'; t.lineWidth = 1.05 * P; t.lineCap = 'round'; t.lineJoin = 'round'; t.beginPath(); for (const [a, b, d, e] of segs) { t.moveTo((a + 0.5) * P, (b + 0.5) * P); t.lineTo((d + 0.5) * P + 0.01, (e + 0.5) * P); } t.stroke();
  t.globalCompositeOperation = 'source-in'; t.fillStyle = t.createPattern(texTile('path', P, 2.2), 'repeat'); t.fillRect(0, 0, N * P, N * P);
  t.globalCompositeOperation = 'source-atop'; t.fillStyle = 'rgba(170,125,70,0.22)'; t.fillRect(0, 0, N * P, N * P); t.globalCompositeOperation = 'source-over';
  c.drawImage(tmp, 0, 0);
  return PATHC.cv = cv2;
}
function drawPaths(c, sc) { if (!sc.pathG || (sc.mode !== 'village' && sc.mode !== 'raid')) return; const pc = pathCanvas(); if (!pc) return; c.save(); tileTransform(c, PATHC.P); c.drawImage(pc, 0, 0); c.restore(); }
// ================= TERRAIN: terreno a texture dipinte (erba, erba secca, terra battuta, fango) =================
const TEX = {}; let TEX_OK = false; const TEXC = {};
(function loadTex() { const ks = ['grass', 'dry', 'dirt', 'mud', 'path']; let n = 0; for (const k of ks) { const im = new Image(); im.onload = () => { if (++n === ks.length) TEX_OK = true; }; im.src = TEX_SRC[k]; TEX[k] = im; } })();
// piastrella pre-scalata: copre `tiles` caselle a `T` px per casella (eventualmente ruotata di 90°)
function texTile(k, T, tiles, rot) {
  const key = k + '|' + T + '|' + tiles + '|' + (rot || 0); if (TEXC[key]) return TEXC[key];
  const s = Math.max(4, Math.round(T * tiles)); const cv = document.createElement('canvas'); cv.width = cv.height = s; const c = cv.getContext('2d');
  c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
  if (rot) { c.translate(s / 2, s / 2); c.rotate(rot * Math.PI / 2); c.translate(-s / 2, -s / 2); }
  c.drawImage(TEX[k], 0, 0, s, s); return TEXC[key] = cv;
}
// rumore a valori (fbm) deterministico
function makeNoise(seed) {
  const P = new Uint8Array(512); const R = rng(seed); for (let i = 0; i < 256; i++) P[i] = i; for (let i = 255; i > 0; i--) { const j = (R() * (i + 1)) | 0; const t = P[i]; P[i] = P[j]; P[j] = t; } for (let i = 0; i < 256; i++) P[i + 256] = P[i];
  const h = (x, y) => P[(P[x & 255] + y) & 511] / 255;
  const n = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi; const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); const a = h(xi, yi), b = h(xi + 1, yi), c = h(xi, yi + 1), d = h(xi + 1, yi + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
  return (x, y, oct) => { let s = 0, amp = 0.5, f = 1, t = 0; for (let o = 0; o < (oct || 3); o++) { s += n(x * f, y * f) * amp; t += amp; amp *= 0.5; f *= 2.03; } return s / t; };
}
const chaikin = (l, it = 2) => { let p = l; for (let k = 0; k < it; k++) { if (p.length < 3) return p; const o = [p[0]]; for (let i = 0; i < p.length - 1; i++) { const [ax, ay] = p[i], [bx, by] = p[i + 1]; o.push([ax * 0.75 + bx * 0.25, ay * 0.75 + by * 0.25], [ax * 0.25 + bx * 0.75, ay * 0.25 + by * 0.75]); } o.push(p[p.length - 1]); p = o; } return p; };
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
// maschere del terreno (M px per casella)
function groundMasks(enemy, decals, seed) {
  const N = NMAP, M = 4, S = N * M, mid = N / 2;
  const nz = [makeNoise(seed * 7 + 1), makeNoise(seed * 7 + 2), makeNoise(seed * 7 + 3), makeNoise(seed * 7 + 4), makeNoise(seed * 7 + 5)];
  // acqua dai decals
  const wt = new Uint8Array(N * N);
  for (const d of decals || []) { const m = d.k === 'fiume' ? EMASK.river.mask : d.k === 'lago' ? EMASK.pond.mask : null; if (!m) continue; for (let ty = 0; ty < m.length; ty++) for (let tx = 0; tx < m[ty].length; tx++) if (m[ty][tx] === '1') { const x = d.x + tx, y = d.y + ty; if (x >= 0 && y >= 0 && x < N && y < N) wt[y * N + x] = 1; } }
  // distanza dall'acqua (chamfer, in caselle)
  const dist = new Float32Array(N * N).fill(1e9); for (let i = 0; i < N * N; i++) if (wt[i]) dist[i] = 0;
  for (let p = 0; p < 2; p++) {
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const i = y * N + x; if (x) dist[i] = Math.min(dist[i], dist[i - 1] + 1); if (y) dist[i] = Math.min(dist[i], dist[i - N] + 1); if (x && y) dist[i] = Math.min(dist[i], dist[i - N - 1] + 1.41); if (y && x < N - 1) dist[i] = Math.min(dist[i], dist[i - N + 1] + 1.41); }
    for (let y = N - 1; y >= 0; y--) for (let x = N - 1; x >= 0; x--) { const i = y * N + x; if (x < N - 1) dist[i] = Math.min(dist[i], dist[i + 1] + 1); if (y < N - 1) dist[i] = Math.min(dist[i], dist[i + N] + 1); if (x < N - 1 && y < N - 1) dist[i] = Math.min(dist[i], dist[i + N + 1] + 1.41); if (y < N - 1 && x) dist[i] = Math.min(dist[i], dist[i + N - 1] + 1.41); }
  }
  const dAt = (x, y) => { const xi = Math.min(N - 2, Math.max(0, Math.floor(x - 0.5))), yi = Math.min(N - 2, Math.max(0, Math.floor(y - 0.5))), fx = Math.min(1, Math.max(0, x - 0.5 - xi)), fy = Math.min(1, Math.max(0, y - 0.5 - yi)); const a = dist[yi * N + xi], b = dist[yi * N + xi + 1], c = dist[(yi + 1) * N + xi], d = dist[(yi + 1) * N + xi + 1]; return a * (1 - fx) * (1 - fy) + b * fx * (1 - fy) + c * (1 - fx) * fy + d * fx * fy; };
  // sentieri (polilinee in caselle)
  const paths = [];
  const curve = (ax, ay, bx, by, bend) => { const pts = []; const cx = (ax + bx) / 2 + bend, cy = (ay + by) / 2 - bend * 0.5; for (let i = 0; i <= 40; i++) { const t = i / 40; pts.push([(1 - t) * (1 - t) * ax + 2 * (1 - t) * t * cx + t * t * bx, (1 - t) * (1 - t) * ay + 2 * (1 - t) * t * cy + t * t * by]); } return pts; };
  if (!enemy) {
    for (const [bx, by, bd] of [[mid, 3, 1], [3, mid, 1], [3, mid + 6, 1.5], [26.5 + OFF, 25.4 + OFF, 1], [mid + 18, 6, -2], [N - 4, mid - 4, 1.2]]) paths.push(curve(mid, mid, bx, by, bd));
    paths.push(curve(26.6 + OFF, 25.6 + OFF, 30 + OFF, 29 + OFF, 0)); paths.push(curve(30 + OFF, 29 + OFF, N - 6, N - 3, 1));
  } else { const R = rng(seed); for (let i = 0; i < 3; i++) { const a = R() * 6.283; paths.push(curve(mid, mid, mid + Math.cos(a) * (mid - 3), mid + Math.sin(a) * (mid - 3), (R() < 0.5 ? -1 : 1) * (5 + R() * 9))); } }
  const segs = []; for (const p of paths) for (let i = 1; i < p.length; i++) segs.push([p[i - 1][0], p[i - 1][1], p[i][0], p[i][1]]);
  const segD0 = (x, y) => { let best = 9; for (const s of segs) { if (x < s[4] - 3 || x > s[5] + 3 || y < s[6] - 3 || y > s[7] + 3) continue; const dx = s[2] - s[0], dy = s[3] - s[1], l = dx * dx + dy * dy; let t = l ? ((x - s[0]) * dx + (y - s[1]) * dy) / l : 0; t = Math.max(0, Math.min(1, t)); const ex = s[0] + dx * t - x, ey = s[1] + dy * t - y; const d = ex * ex + ey * ey; if (d < best) best = d; } return Math.sqrt(best); };
  for (const s of segs) s.push(Math.min(s[0], s[2]), Math.max(s[0], s[2]), Math.min(s[1], s[3]), Math.max(s[1], s[3]));
  const PG = 3, PN = N * PG + 1, pdg = new Float32Array(PN * PN); if (segs.length) for (let j = 0; j < PN; j++) for (let i = 0; i < PN; i++) pdg[j * PN + i] = segD0(i / PG, j / PG);
  const segD = (x, y) => { const gx = Math.min(PN - 1.001, x * PG), gy = Math.min(PN - 1.001, y * PG), xi = gx | 0, yi = gy | 0, fx = gx - xi, fy = gy - yi, o = yi * PN + xi; return pdg[o] * (1 - fx) * (1 - fy) + pdg[o + 1] * fx * (1 - fy) + pdg[o + PN] * (1 - fx) * fy + pdg[o + PN + 1] * fx * fy; };
  const mk = () => { const cv = document.createElement('canvas'); cv.width = cv.height = S; return cv; };
  const L = { varg: mk(), dry: mk(), dirt: mk(), mud: mk(), dark: mk(), light: mk() };
  const D = {}; for (const k in L) D[k] = L[k].getContext('2d').createImageData(S, S);
  for (let py = 0; py < S; py++) for (let px = 0; px < S; px++) {
    const x = (px + 0.5) / M, y = (py + 0.5) / M, o = (py * S + px) * 4 + 3;
    const dc = Math.hypot(x - mid, y - mid), edge = Math.min(x, y, N - x, N - y), wd = dAt(x, y);
    const n0 = nz[0](x / 16, y / 16, 3), n1 = nz[1](x / 7, y / 7, 3), n2 = nz[2](x / 5, y / 5, 2), n3 = nz[3](x / 22, y / 22, 3), n4 = nz[4](x / 3, y / 3, 2);
    // seconda erba (ruotata) per spezzare la ripetizione
    D.varg.data[o] = 255 * smooth(0.42, 0.62, n1) * 0.75;
    // erba secca: grandi chiazze, meno vicino all'acqua e al villaggio
    let dry = smooth(0.64, 0.78, n0 * 0.75 + n3 * 0.35) * smooth(1.5, 4, wd) * 0.55;
    if (!enemy) dry *= smooth(16, 26, dc); else dry = Math.max(dry, smooth(12, 9, dc) * 0.5);
    D.dry.data[o] = 255 * dry;
    // terra battuta: piazza, sentieri, accampamento, zolle sparse
    let dirt = 0;
    const r0 = enemy ? 10.5 : 4.2; dirt = smooth(r0 + 1.6, r0 - 1.6, dc + (n2 - 0.5) * (enemy ? 7 : 2.4) + (n0 - 0.5) * (enemy ? 9 : 3)) * (enemy ? 1 : 0.75);
    if (segs.length) { const sd = segD(x, y); dirt = Math.max(dirt, smooth(0.95, 0.25, sd + (n2 - 0.5) * 0.5) * (enemy ? 0.85 : 0.6)); }
    if (enemy) dirt = Math.max(dirt, smooth(0.8, 0.88, n4 * 0.6 + n0 * 0.5) * 0.5);
    dirt *= smooth(0.2, 1.2, wd);
    D.dirt.data[o] = 255 * Math.min(1, dirt);
    // fango lungo le rive e qualche pozzanghera nei prati
    let mud = smooth(2.6, 0.9, wd + (n2 - 0.5) * 1.6) * smooth(0.15, 0.7, wd);
    mud *= 0.7; if (enemy) mud = Math.max(mud, smooth(0.86, 0.93, n2 * 0.7 + n1 * 0.45) * 0.6 * smooth(8, 12, dc));
    D.mud.data[o] = 255 * Math.min(1, mud);
    // luce/ombra: nuvole dipinte e bordo scuro della foresta
    D.dark.data[o] = 255 * Math.min(1, smooth(0.5, 0.85, n3) * 0.22 + smooth(9, 0, edge) * 0.7);
    D.light.data[o] = 255 * smooth(0.55, 0.85, 1 - n3) * 0.6;
  }
  for (const k in L) L[k].getContext('2d').putImageData(D[k], 0, 0);
  return { L, M };
}
// disegna il terreno nel rettangolo [x0,x1)×[y0,y1) (caselle) su ctx già traslato in coordinate mondo×T
function paintGroundRegion(g, ctx, x0, y0, x1, y1, T) {
  const M = g.masks.M, pad = 1, rx0 = x0 - pad, ry0 = y0 - pad, rw = (x1 - x0 + pad * 2), rh = (y1 - y0 + pad * 2);
  const W = Math.ceil(rw * T), H = Math.ceil(rh * T);
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  const fillTex = (c, tile) => { const p = c.createPattern(tile, 'repeat'); c.fillStyle = p; c.fillRect(rx0 * T, ry0 * T, W, H); };
  fillTex(ctx, texTile('grass', T, 7));
  let tmp = g._tmp; if (!tmp || tmp.width < W || tmp.height < H) { tmp = g._tmp = document.createElement('canvas'); tmp.width = W; tmp.height = H; }
  const tc = tmp.getContext('2d');
  const layer = (mask, draw, alpha, op) => {
    tc.setTransform(1, 0, 0, 1, 0, 0); tc.globalCompositeOperation = 'source-over'; tc.globalAlpha = 1; tc.clearRect(0, 0, W, H);
    tc.save(); tc.translate(-rx0 * T, -ry0 * T); draw(tc); tc.restore();
    tc.globalCompositeOperation = 'destination-in'; tc.imageSmoothingEnabled = true; tc.imageSmoothingQuality = 'high';
    const sx = Math.max(0, rx0 * M), sy = Math.max(0, ry0 * M), ex = Math.min(NMAP * M, (rx0 + rw) * M), ey = Math.min(NMAP * M, (ry0 + rh) * M);
    tc.drawImage(mask, sx, sy, ex - sx, ey - sy, (sx / M - rx0) * T, (sy / M - ry0) * T, (ex - sx) / M * T, (ey - sy) / M * T);
    ctx.save(); ctx.globalAlpha = alpha; if (op) ctx.globalCompositeOperation = op; ctx.drawImage(tmp, 0, 0, W, H, rx0 * T, ry0 * T, W, H); ctx.restore();
  };
  const Lm = g.masks.L;
  layer(Lm.varg, c => fillTex(c, texTile('grass', T, 9.5, 1)), 1);
  layer(Lm.dry, c => fillTex(c, texTile('dry', T, 8)), 1);
  layer(Lm.mud, c => fillTex(c, texTile('mud', T, 7)), 0.95);
  layer(Lm.dirt, c => fillTex(c, texTile('dirt', T, 9)), 1);
  // sentieri lastricati (dalla rete calcolata sugli edifici)
  if (PATHC.grid && TEX.path && g.pathOn && PATHC.lines) {
    const lines = PATHC.lines.filter(l => l.some(([x, y]) => x > rx0 - 2 && y > ry0 - 2 && x < rx0 + rw + 2 && y < ry0 + rh + 2)).map(l => chaikin(l));
    const pathStroke = (cx, w) => { cx.lineCap = 'round'; cx.lineJoin = 'round'; cx.lineWidth = w * T; cx.beginPath(); for (const l of lines) { cx.moveTo(l[0][0] * T, l[0][1] * T); for (let i = 1; i < l.length; i++) cx.lineTo(l[i][0] * T, l[i][1] * T); } if (PATHC.plaza) { const [px, py] = PATHC.plaza; cx.moveTo(px * T + 0.01, py * T); cx.lineTo(px * T, py * T); } cx.stroke(); if (PATHC.plaza) { const [px, py] = PATHC.plaza; cx.beginPath(); cx.arc(px * T, py * T, w * T * 1.05, 0, 7); cx.fill(); } };
    if (lines.length || PATHC.plaza) {
      // alone sfumato di erba calpestata, poi la terra battuta
      ctx.save(); for (const [w, al] of [[1.25, 0.10], [1.0, 0.14], [0.82, 0.2]]) { ctx.globalAlpha = al; ctx.strokeStyle = ctx.fillStyle = '#5b4426'; pathStroke(ctx, w); } ctx.restore();
      tc.setTransform(1, 0, 0, 1, 0, 0); tc.globalCompositeOperation = 'source-over'; tc.globalAlpha = 1; tc.clearRect(0, 0, W, H); tc.save(); tc.translate(-rx0 * T, -ry0 * T); tc.strokeStyle = tc.fillStyle = '#000'; pathStroke(tc, 0.66);
      tc.globalCompositeOperation = 'source-in'; tc.fillStyle = tc.createPattern(texTile('path', T, 3), 'repeat'); tc.fillRect(rx0 * T, ry0 * T, W, H); tc.restore(); tc.globalCompositeOperation = 'source-over';
      ctx.save(); ctx.globalAlpha = 0.92; ctx.drawImage(tmp, 0, 0, W, H, rx0 * T, ry0 * T, W, H); ctx.restore(); } }
  layer(Lm.dark, c => { c.fillStyle = '#16200a'; c.fillRect(rx0 * T, ry0 * T, W, H); }, 0.32);
  layer(Lm.light, c => { c.fillStyle = '#fff3c8'; c.fillRect(rx0 * T, ry0 * T, W, H); }, 0.1);
  for (const d of g.decals) if (EATL_OK) { const f = EFR[d.k]; if (d.x > x1 + 1 || d.y > y1 + 1 || d.x + d.w < x0 - 1 || d.y + d.h < y0 - 1) continue; ctx.drawImage(EATL, f[0], f[1], f[2], f[3], d.x * T, d.y * T, d.w * T, d.h * T); }
  ctx.strokeStyle = 'rgba(20,15,5,0.5)'; ctx.lineWidth = Math.max(2, T / 10); ctx.strokeRect(0, 0, NMAP * T, NMAP * T);
}
const GCH = 12, GT = 40, GLOW = 12, GMAXCH = 48;
function paintGround(enemy, decals, seed) {
  const g = { enemy, decals: decals || [], seed, chunks: new Map(), tick: 0, stale: !TEX_OK || (!!(decals && decals.length) && !EATL_OK) };
  if (!TEX_OK) return g;
  g.masks = groundMasks(enemy, g.decals, seed || 1);
  const cv = document.createElement('canvas'); cv.width = cv.height = NMAP * GLOW; const c = cv.getContext('2d');
  paintGroundRegion(g, c, 0, 0, NMAP, NMAP, GLOW); g.low = cv;
  return g;
}
function groundChunk(g, cx, cy) {
  const key = cx + ',' + cy; let ch = g.chunks.get(key); if (ch) { ch.t = g.tick; return ch; }
  const pad = 4, S = GCH * GT + pad * 2; const cv = document.createElement('canvas'); cv.width = cv.height = S; const c = cv.getContext('2d');
  c.translate(pad - cx * GCH * GT, pad - cy * GCH * GT);
  paintGroundRegion(g, c, cx * GCH, cy * GCH, (cx + 1) * GCH, (cy + 1) * GCH, GT);
  ch = { cv, pad, t: g.tick }; g.chunks.set(key, ch);
  if (g.chunks.size > GMAXCH) { let ok = null, ot = 1e18; for (const [k, v] of g.chunks) if (v.t < ot) { ot = v.t; ok = k; } g.chunks.delete(ok); }
  return ch;
}
function drawGround(c, sc, vx0, vy0, vx1, vy1) {
  let g = sc.ground;
  if (g.stale && TEX_OK && (EATL_OK || !g.decals.length)) { g = sc.ground = paintGround(g.enemy, g.decals, g.seed); if (!g.enemy) GROUND_V = g; }
  if (g.low && !g.enemy && (sc.mode === 'village' || sc.mode === 'raid' || sc.mode === 'visit') && g.pathKey !== PATHC.key && PATHC.grid) { g.pathKey = PATHC.key; g.pathOn = true; g.chunks.clear(); const lc = g.low.getContext('2d'); lc.setTransform(1, 0, 0, 1, 0, 0); paintGroundRegion(g, lc, 0, 0, NMAP, NMAP, GLOW); }
  if (!g.low) { c.fillStyle = '#5d6b32'; c.save(); tileTransform(c, 1); c.fillRect(0, 0, NMAP, NMAP); c.restore(); return; }
  g.tick++;
  c.save(); tileTransform(c, GLOW); c.drawImage(g.low, 0, 0); c.restore();
  if (cam.z < 0.42) return;
  const n = Math.ceil(NMAP / GCH); let budget = 2; const want = [];
  for (let cy = 0; cy < n; cy++) for (let cx = 0; cx < n; cx++) {
    const xs = [], ys = []; for (const [u, v] of [[cx * GCH, cy * GCH], [(cx + 1) * GCH, cy * GCH], [cx * GCH, (cy + 1) * GCH], [(cx + 1) * GCH, (cy + 1) * GCH]]) { const p = W(u, v); xs.push(p[0]); ys.push(p[1]); }
    if (Math.max(...xs) < vx0 || Math.min(...xs) > vx1 || Math.max(...ys) < vy0 || Math.min(...ys) > vy1) continue;
    const key = cx + ',' + cy; if (g.chunks.has(key)) want.push([cx, cy, 0]); else { const cxw = (Math.min(...xs) + Math.max(...xs)) / 2 - cam.x, cyw = (Math.min(...ys) + Math.max(...ys)) / 2 - cam.y; want.push([cx, cy, 1, cxw * cxw + cyw * cyw]); }
  }
  want.sort((a, b) => (a[2] - b[2]) || ((a[3] || 0) - (b[3] || 0)));
  for (const [cx, cy, miss] of want) {
    if (miss) { if (budget <= 0) continue; budget--; }
    const ch = groundChunk(g, cx, cy);
    c.save(); tileTransform(c, GT); c.drawImage(ch.cv, cx * GCH * GT - ch.pad, cy * GCH * GT - ch.pad); c.restore();
  }
}

// env sprites: tinted tree variants
let TREEV = null;
function treeVariants() {
  if (TREEV || !EATL_OK) return TREEV; TREEV = [];
  for (const k of ['abete', 'quercia']) for (const tint of [0, 0.14, 0.28]) {
    const f = EFR[k]; const cv2 = document.createElement('canvas'); cv2.width = f[2]; cv2.height = f[3]; const c = cv2.getContext('2d');
    c.drawImage(EATL, f[0], f[1], f[2], f[3], 0, 0, f[2], f[3]);
    if (tint) { c.globalCompositeOperation = 'source-atop'; c.fillStyle = k === 'quercia' ? `rgba(60,55,10,${tint})` : `rgba(10,25,20,${tint})`; c.fillRect(0, 0, f[2], f[3]); }
    TREEV.push({ cv: cv2, k });
  }
  return TREEV;
}

// ---------- grid map ----------
const N = NMAP, MCX = N / 2 - 0.5;
function makeGrid() { return new Int16Array(N * N).fill(-1); }
function inMap(x, y) { return x >= 0 && y >= 0 && x < N && y < N; }
// A* over grid. passable(x,y)-> cost (Infinity = blocked). goal(x,y)->bool. h target point.
function astar(sx, sy, goalFn, costFn, tx, ty, maxIter) {
  maxIter = Math.max(maxIter || 0, 9000);
  sx = Math.max(0, Math.min(N - 1, sx | 0)); sy = Math.max(0, Math.min(N - 1, sy | 0));
  const start = sy * N + sx; const g = new Float32Array(N * N).fill(Infinity); const from = new Int32Array(N * N).fill(-1);
  const heap = []; const push = (n, f) => { heap.push([f, n]); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break;[heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (; ;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break;[heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
  g[start] = 0; push(start, 0); let it = 0, found = -1;
  const H = (x, y) => { const dx = Math.abs(x - tx), dy = Math.abs(y - ty); return Math.max(dx, dy) + 0.41 * Math.min(dx, dy); };
  while (heap.length && it++ < (maxIter || 3000)) {
    const [, n] = pop(); const x = n % N, y = (n / N) | 0;
    if (goalFn(x, y)) { found = n; break; }
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue; const nx = x + dx, ny = y + dy; if (!inMap(nx, ny)) continue;
      let c = costFn(nx, ny); if (c === Infinity) continue;
      if (dx && dy) { if (costFn(x + dx, y) === Infinity || costFn(x, y + dy) === Infinity) continue; c *= 1.414; }
      const ng = g[n] + c; const m = ny * N + nx;
      if (ng < g[m]) { g[m] = ng; from[m] = n; push(m, ng + H(nx, ny)); }
    }
  }
  if (found < 0) return null;
  const path = []; let n = found; while (n !== start && n >= 0) { path.push([n % N, (n / N) | 0]); n = from[n]; }
  return path.reverse();
}

// ---------- sprites ----------
const ATL = new Image();
let ATL_OK = false; ATL.onload = () => ATL_OK = true;
function sprDraw(c, key, x, y, sc, flip, alpha) {
  const f = FR[key]; if (!f || !ATL_OK) return 0;
  const [sx, sy, w, h] = f;
  if (alpha != null && alpha < 1) c.globalAlpha = alpha;
  if (flip) { c.save(); c.translate(x, y); c.scale(-1, 1); c.drawImage(ATL, sx, sy, w, h, -w * sc / 2, -h * sc, w * sc, h * sc); c.restore(); }
  else c.drawImage(ATL, sx, sy, w, h, x - w * sc / 2, y - h * sc, w * sc, h * sc);
  if (alpha != null && alpha < 1) c.globalAlpha = 1;
  return h * sc;
}

// ---------- building sprites ----------
const BATL = new Image(); let BATL_OK = false; BATL.onload = () => BATL_OK = true;
const BSCALE = { castello: 1.2, casa: 1.0, taverna: 1.1, falegnameria: 1.14, fucina: 1.06, armeria: 1.06, infermeria: 1.04, municipio: 1.0, mercato: 1.22, chiesa: 1.1, accademia: 1.12, cancello: 1.35, stalla: 1.15, fattoria: 1.35, miniera: 1.28, torre: 1.35, funghi: 0.6, cespuglio: 1.05, masso: 1.0, tronco: 1.0 };
function bSprite(b) { if (b.t === 'mastio') return b.lvl >= 5 ? 'castello' : null; return BDEF[b.t].spr || null; }
function bSpriteView(b) { const k = bSprite(b); const kv = k + '_' + rstep(); return BFR[kv] ? kv : k; } // facades: casa_1, casa_2, casa_3 when provided
function bSpriteBase(b) { const k = bSprite(b); const f = BFR[k]; if (!f) return null;
  const fw = (b.w + b.h) * TW / 2; const lv = b.t === 'mastio' ? b.lvl - 5 : b.lvl - 1; const sc0 = fw * BSCALE[k] * (1 + 0.04 * lv) / f[2];
  const vr = vRect(b); const by = WR(vr[0] + vr[2], vr[1] + vr[3])[1]; const cx = WR(vr[0] + vr[2] / 2, vr[1] + vr[3] / 2)[0];
  return { k, sc0, cx, bottom: by - (b.w + b.h) * TH / 2 * 0.16 }; }
// fluid rotation: the building is a box; between two quarter turns the leaving face narrows and the next face widens
function drawSpriteBox(c, b, alpha) {
  const B = bSpriteBase(b); if (!B) return; const k = B.k, V = [k, k + '_1', k + '_2', k + '_3'];
  if (!BFR[V[1]]) { const r = bSpriteRect(b), f = BFR[k]; c.drawImage(BATL, f[0], f[1], f[2], f[3], r[0], r[1], r[2], r[3]); return; }
  const q = ((ANG / (Math.PI / 2)) % 4 + 4) % 4; const i = Math.floor(q) % 4, t = q - Math.floor(q), ph = t * Math.PI / 2;
  const sm = Math.min(1, Math.max(0, (t - 0.38) / 0.24)), s = sm * sm * (3 - 2 * sm); const ga = c.globalAlpha;
  for (const [f, al] of [[BFR[V[i]], 1 - s], [BFR[V[(i + 1) % 4]], s]]) { if (al < 0.01) continue; const w = f[2] * B.sc0, h = f[3] * B.sc0; c.globalAlpha = ga * al; c.drawImage(BATL, f[0], f[1], f[2], f[3], B.cx - w / 2, B.bottom - h, w, h); }
  c.globalAlpha = ga;
}
function bSpriteRect(b) { // world rect [x,y,w,h] of the sprite
  const k = bSprite(b); const f = BFR[k]; if (!f) return null;
  const fw = (b.w + b.h) * TW / 2; const lv = b.t === 'mastio' ? b.lvl - 5 : b.lvl - 1;
  const dw0 = fw * BSCALE[k] * (1 + 0.04 * lv), sc0 = dw0 / f[2]; const fv = BFR[bSpriteView(b)] || f; const dw = fv[2] * sc0, dh = fv[3] * sc0;
  const vr = vRect(b); const [bx, by] = WR(vr[0] + vr[2], vr[1] + vr[3]); const cx = WR(vr[0] + vr[2] / 2, vr[1] + vr[3] / 2)[0];
  const bottom = by - (b.w + b.h) * TH / 2 * 0.16;
  return [cx - dw / 2, bottom - dh, dw, dh];
}
// ---------- water & terrain features ----------
const RIVER_AT = { k: 'fiume', x: 19 + OFF, y: 19 + OFF, w: 13, h: 13 }, POND_AT = { k: 'lago', x: 3 + OFF, y: 21 + OFF, w: 7, h: 8 };
function stampMask(arr, mask, x0, y0) { for (let ty = 0; ty < mask.length; ty++) for (let tx = 0; tx < mask[ty].length; tx++) if (mask[ty][tx] === '1') { const x = x0 + tx, y = y0 + ty; if (x >= 0 && y >= 0 && x < NMAP && y < NMAP) arr[y * NMAP + x] = 1; } }
let WATER_V = null;
const EXTRA_PONDS = NMAP > 64 ? [[14, 16], [74, 13], [15, 71], [73, 73], [60, 30]].map(([x, y]) => ({ k: 'lago', x, y, w: 7, h: 8 })) : [];
function villageWater() { if (WATER_V) return WATER_V; const a = new Uint8Array(NMAP * NMAP); for (const p of EXTRA_PONDS) stampMask(a, EMASK.pond.mask, p.x, p.y); stampMask(a, EMASK.river.mask, RIVER_AT.x, RIVER_AT.y); stampMask(a, EMASK.pond.mask, POND_AT.x, POND_AT.y); return WATER_V = a; }
function isWater(sc, x, y) { return !!(sc && sc.water && x >= 0 && y >= 0 && x < NMAP && y < NMAP && sc.water[y * NMAP + x]); }
// ---------- audio ----------
// ---- audio: musica (Web Audio, così il volume funziona anche su iPhone) + effetti, con muto generale ----
if (SET.mvol == null) SET.mvol = 0.45; if (SET.fvol == null) SET.fvol = 0.8; if (SET.mute == null) SET.mute = false;
const MUS = { el: null, src: null, g: null, duck: false, get on() { return SET.music !== false; } };
let FXG = null;
function fxOut(a) { if (!FXG) { FXG = a.createGain(); FXG.connect(a.destination); } FXG.gain.value = SET.mute ? 0 : SET.fvol; return FXG; }
function musicApply() { const mv = SET.mute || MUS.duck ? 0 : SET.mvol; try { if (RAIDM.el) RAIDM.el.volume = SET.mute ? 0 : Math.min(1, SET.mvol * 1.1); } catch (e) { } if (MUS.g) MUS.g.gain.value = mv; else if (MUS.el) MUS.el.volume = mv; if (FXG) FXG.gain.value = SET.mute ? 0 : SET.fvol; if (TENS.g) TENS.g.gain.value = SET.mute || !MUS.on ? 0 : SET.mvol * 0.9; if (typeof FESTM !== 'undefined' && FESTM.g) FESTM.g.gain.value = SET.mute || !MUS.on ? 0.0001 : SET.mvol; }
function musicStart() {
  if (!MUS.on || SET.mute || document.hidden || MUS.duck) return;
  if (!MUS.el) { MUS.el = new Audio('music/feudum.mp3'); MUS.el.loop = true; MUS.el.preload = 'auto'; const a = ac(); if (a) { try { MUS.src = a.createMediaElementSource(MUS.el); MUS.g = a.createGain(); MUS.src.connect(MUS.g).connect(a.destination); } catch (e) { MUS.g = null; } } musicApply(); }
  else ac();
  if (MUS.el.paused) { const p = MUS.el.play(); if (p && p.catch) p.catch(() => { }); }
}
function musicStop() { if (MUS.el && !MUS.el.paused) MUS.el.pause(); }
// festa in piazza: la musica di base si zittisce finché suona il saltarello, poi torna piano piano
function musicFesta(on) {
  if (!!MUS.festa === !!on) return; MUS.festa = !!on; const a = AC;
  if (on) { if (TENS.kind) return; MUS.duck = true; if (MUS.g && MUS.el && a) { const t = a.currentTime; MUS.g.gain.cancelScheduledValues(t); MUS.g.gain.setValueAtTime(MUS.g.gain.value, t); MUS.g.gain.linearRampToValueAtTime(0, t + 2.0); setTimeout(() => { if (MUS.duck) musicStop(); }, 2100); } else musicStop(); return; }
  if (TENS.kind) return; MUS.duck = false; setTimeout(() => { if (TENS.kind || MUS.festa) return; musicStart(); if (MUS.g && AC) { const t = AC.currentTime; MUS.g.gain.cancelScheduledValues(t); MUS.g.gain.setValueAtTime(0, t); MUS.g.gain.linearRampToValueAtTime(SET.mute ? 0 : SET.mvol, t + 3.0); } else musicApply(); }, 1200);
}
function audioRefresh() { saveSet(); musicApply(); if (MUS.on && !SET.mute) musicStart(); else musicStop(); if (TENS.kind && (!MUS.on || SET.mute)) tensionStop(true); updateSndBtn(); }
function musicToggle() { SET.music = !MUS.on; audioRefresh(); }
function toggleMute() { SET.mute = !SET.mute; audioRefresh(); if (!SET.mute) sfx('click'); }
function updateSndBtn() { const b = $('#sndmute'); if (b) { b.textContent = SET.mute ? '🔇' : '🔊'; b.title = SET.mute ? 'Audio spento' : 'Audio attivo'; b.classList.toggle('off', !!SET.mute); } }
function setVol(k, v) { SET[k] = Math.max(0, Math.min(1, v / 100)); if (SET.mute && v > 0) SET.mute = false; saveSet(); musicApply(); if (k === 'mvol' && SET.mvol > 0) musicStart(); updateSndBtn(); const o = $('#v_' + k); if (o) o.textContent = Math.round(v) + '%'; }
// ---- prova dei suoni: ascolta musiche ed effetti senza giocare ----
const SND_TEST = [['festa_raccolto', '🌾', 'Festa del Raccolto'], ['festa_feudale', '🏰', 'Festa Feudale'], ['ram', '🐏', 'Ariete'], ['launch', '🪨', 'Catapulta: lancio'], ['boulder', '💥', 'Masso che cade'], ['ladder', '🪜', 'Scala sulle mura'], ['bow', '🏹', 'Arco del cacciatore'], ['step', '👣', 'Passi'], ['horn', '📯', 'Corno di battaglia'], ['bell', '🔔', 'Campana'], ['win', '🏆', 'Vittoria'], ['coin', '🪙', 'Monete'], ['build', '🔨', 'Costruzione'], ['crash', '🏚️', 'Crollo']];
function sndTestHTML() { return `<div class="vbox"><div class="vh"><span>🎧 Prova i suoni</span></div><div class="sndt">${SND_TEST.map(([k, ic, n]) => `<button class="btn ghost" onclick="sndTest('${k}')">${ic} ${n}</button>`).join('')}<button class="btn ghost" onclick="sndTest('raidmus')">⚔ Musica di battaglia</button><button class="btn ghost" onclick="sndTest('stop')">⏹ Ferma</button></div></div>`; }
function sndTest(k) { const a = ac(); if (a && a.state === 'suspended') a.resume(); if (k === 'stop') { if (TENS.kind) tensionStop(); if (FESTM.node) { FESTM.test = false; festaTrackStop(); if (!(S && S.fest)) musicFesta(false); } return; } if (k.startsWith('festa_')) { const T = trackLoad(k); if (!T || !T.buf) { toast(T && T.bad ? 'Musica non disponibile' : '⏳ La musica si sta caricando, riprova tra un attimo'); return; } if (TENS.kind) tensionStop(true); FESTM.test = true; musicFesta(true); festaTrack(k.slice(6)); if (FESTM.node) FESTM.node.onended = () => { if (FESTM.test) { FESTM.test = false; festaTrackStop(true); if (!(S && S.fest)) musicFesta(false); } }; toast('🎶 ' + (k === 'festa_raccolto' ? 'Festa del Raccolto' : 'Festa Feudale') + ': tocca «Ferma» per tornare alla musica del villaggio'); return; } if (k === 'raidmus') { if (TENS.kind) tensionStop(true); tensionStart('raid'); toast('⚔ Musica di battaglia: tocca «Ferma» per tornare alla musica del villaggio'); return; } if (k === 'step') { for (let i = 0; i < 6; i++) setTimeout(() => sfx('step'), i * 420); return; } sfx(k); }
function openAudio(back) {
  const re = `openAudio(${back ? `'${back}'` : ''})`;
  openSheet('🔊 Audio', `<div class="aud">${audioHTML(re)}${sndTestHTML()}<div class="acts"><button class="btn" onclick="${back ? back : 'closeSheet()'}">✓ Fatto</button></div></div>`, 'audio');
}
['pointerdown', 'keydown', 'touchend'].forEach(ev => document.addEventListener(ev, musicStart, { passive: true }));
document.addEventListener('visibilitychange', () => { if (RAIDM.el) { if (document.hidden) RAIDM.el.pause(); else if (TENS.kind && !RAIDM.bad) RAIDM.el.play().catch(() => { }); } if (!MUS.el) return; if (document.hidden) MUS.el.pause(); else musicStart(); });

// ---- musica di tensione durante assedi (attacchi tuoi) e razzie (attacchi subiti): generata con Web Audio ----
const TENS = { kind: null, g: null, iv: 0, nextT: 0, step: 0, bus: null };
const TENS_CH = [[38, [0, 3, 7]], [34, [0, 4, 7]], [31, [0, 3, 7]], [33, [0, 4, 7]]]; // Re- Sib Sol- La (midi radice + accordo)
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
function tensionStart(kind) {
  const a = ac(); if (!a) return; tensionStop(true); if (typeof festaTrackStop === 'function') festaTrackStop(true);
  MUS.duck = true; if (MUS.g && MUS.el) { const t = a.currentTime; MUS.g.gain.cancelScheduledValues(t); MUS.g.gain.setValueAtTime(MUS.g.gain.value, t); MUS.g.gain.linearRampToValueAtTime(0, t + 2.5); setTimeout(() => { if (MUS.duck) musicStop(); }, 2600); } else musicStop();
  if (!MUS.on || SET.mute) { TENS.kind = kind; return; }
  TENS.kind = kind; TENS.g = a.createGain(); TENS.g.connect(a.destination);
  const t0 = a.currentTime; TENS.g.gain.setValueAtTime(0.0001, t0); TENS.g.gain.linearRampToValueAtTime(SET.mvol * 0.9, t0 + 3.0);
  if (raidTrack(a)) return; // razzie e assedi: colonna sonora "Ombre delle Terre Feudali
  TENS.bus = a.createDynamicsCompressor(); TENS.bus.threshold.value = -18; TENS.bus.ratio.value = 4; TENS.bus.connect(TENS.g);
  TENS.nextT = t0 + 0.15; TENS.step = 0;
  TENS.iv = setInterval(tensionSched, 40);
}
// ---- brani mp3 decodificati in WebAudio: si possono sfumare anche su iPhone (dove il volume degli <audio> è bloccato) ----
const TRACKS = {};
function trackLoad(name) {
  const a = ac(); if (!a) return null; if (TRACKS[name]) return TRACKS[name];
  const T = TRACKS[name] = { buf: null, bad: false };
  fetch('music/' + name + '.mp3').then(r => { if (!r.ok) throw 0; return r.arrayBuffer(); })
    .then(ab => new Promise((ok, ko) => a.decodeAudioData(ab, ok, ko))).then(b => { T.buf = b; }).catch(() => { T.bad = true; });
  return T;
}
function trackPlay(name, dest, loop) { const a = AC, T = TRACKS[name]; if (!a || !T || !T.buf) return null; const s = a.createBufferSource(); s.buffer = T.buf; s.loop = !!loop; s.connect(dest); s.start(); return s; }
function fadeGain(g, to, sec) { const a = AC; if (!a || !g) return; const t = a.currentTime; g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), t); g.gain.linearRampToValueAtTime(Math.max(0.0001, to), t + sec); }
function tracksPreload() { trackLoad('raid'); trackLoad('festa_raccolto'); trackLoad('festa_feudale'); }
// colonna sonora vera per le razzie (quando ti attaccano); se non si carica, resta la musica generata
const RAIDM = { el: null, src: null, bad: false, node: null };
function raidTrack(a) {
  const T = trackLoad('raid'); if (T && T.buf && TENS.g) { RAIDM.node = trackPlay('raid', TENS.g, true); if (RAIDM.node) return true; }
  if (RAIDM.bad) return false;
  try {
    if (!RAIDM.el) { RAIDM.el = new Audio('music/raid.mp3'); RAIDM.el.loop = true; RAIDM.el.preload = 'auto'; RAIDM.el.addEventListener('error', () => { RAIDM.bad = true; if (TENS.kind && !TENS.iv) { TENS.nextT = AC.currentTime + 0.1; TENS.step = 0; TENS.iv = setInterval(tensionSched, 40); } }); }
    // riproduzione diretta (affidabile su iPhone, dove il passaggio dentro WebAudio a volte resta muto)
    RAIDM.el.volume = Math.min(1, SET.mvol * 1.1); RAIDM.el.currentTime = 0; const p = RAIDM.el.play(); if (p && p.catch) p.catch(() => { RAIDM.bad = true; if (TENS.kind && !TENS.iv) { TENS.nextT = AC.currentTime + 0.1; TENS.step = 0; TENS.iv = setInterval(tensionSched, 40); } }); return true;
  } catch (e) { RAIDM.bad = true; return false; }
}
function tensionStop(now) {
  if (RAIDM.node) { const nd = RAIDM.node; RAIDM.node = null; setTimeout(() => { try { nd.stop(); } catch (e) { } }, now ? 400 : 3300); }
  if (RAIDM.el && !RAIDM.el.paused) { const el = RAIDM.el, v0 = el.volume; if (now) setTimeout(() => { if (!TENS.kind) el.pause(); }, 400); else { let k = 0; const iv = setInterval(() => { k++; try { el.volume = Math.max(0, v0 * (1 - k / 30)); } catch (e) { } if (k >= 30) { clearInterval(iv); if (!TENS.kind) el.pause(); } }, 100); } }
  if (TENS.iv) clearInterval(TENS.iv); TENS.iv = 0; const g = TENS.g, a = AC; TENS.g = null; const wasOn = !!TENS.kind; TENS.kind = null;
  if (g && a) { const t = a.currentTime; g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(0, t + (now ? 0.2 : 3.0)); setTimeout(() => { try { g.disconnect(); } catch (e) { } }, now ? 400 : 3400); }
  if (wasOn && !now) { MUS.duck = !!MUS.festa; setTimeout(() => { if (TENS.kind || MUS.festa) return; musicStart(); if (MUS.g && AC) { const t = AC.currentTime; MUS.g.gain.cancelScheduledValues(t); MUS.g.gain.setValueAtTime(0, t); MUS.g.gain.linearRampToValueAtTime(SET.mute ? 0 : SET.mvol, t + 3.5); } else musicApply(); }, 900); }
  else if (!now) { MUS.duck = false; musicApply(); }
}
function tensionSched() {
  const a = AC; if (!a || !TENS.g) return; if (document.hidden) { TENS.nextT = a.currentTime + 0.1; return; }
  const raid = TENS.kind === 'raid'; const late = BT && !BT.ended && BT.timer < 40;
  const bpm = (raid ? 92 : 108) + (late ? 14 : 0), s16 = 60 / bpm / 4;
  if (TENS.nextT < a.currentTime - 0.5) TENS.nextT = a.currentTime + 0.05;
  while (TENS.nextT < a.currentTime + 0.25) { tensionStep(a, TENS.nextT, TENS.step, s16, raid, late); TENS.nextT += s16; TENS.step++; }
}
function tensionStep(a, t, st, s16, raid, late) {
  const O = TENS.bus; const sb = st % 16, bar = Math.floor(st / 16), ch = TENS_CH[bar % 4], root = ch[0];
  const env = (node, v, at, dec) => { const g = a.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + at); g.gain.exponentialRampToValueAtTime(0.0001, t + at + dec); node.connect(g).connect(O); return g; };
  const osc = (type, f, v, at, dec, f2, lp) => { const o = a.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + at + dec); let n = o; if (lp) { const fl = a.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = lp; o.connect(fl); n = fl; } env(n, v, at, dec); o.start(t); o.stop(t + at + dec + 0.05); };
  const nz = (dur, f, q, v, type) => { const b = a.createBuffer(1, Math.ceil(a.sampleRate * dur), a.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; const s = a.createBufferSource(); s.buffer = b; const fl = a.createBiquadFilter(); fl.type = type || 'bandpass'; fl.frequency.value = f; fl.Q.value = q; s.connect(fl); env(fl, v, 0.004, dur); s.start(t); s.stop(t + dur + 0.05); };
  // tamburi di guerra (timpano grave)
  const kick = raid ? [0, 6, 8, 14] : [0, 3, 6, 8, 11, 14];
  if (kick.includes(sb)) { osc('sine', 95, sb === 0 ? 0.55 : 0.38, 0.005, 0.42, 42); nz(0.12, 180, 0.8, 0.18, 'lowpass'); }
  // tamburo a cornice / rullante
  if (sb === 4 || sb === 12) nz(0.18, raid ? 600 : 900, 0.9, raid ? 0.13 : 0.18);
  if ((late || !raid) && sb % 2 === 1) nz(0.04, 5200, 1.5, late ? 0.05 : 0.025, 'highpass');
  if (late && (sb === 15 || sb === 13)) nz(0.1, 900, 0.9, 0.12);
  // bordone sull'accordo (ogni battuta)
  if (sb === 0) { const dur = s16 * 16; for (const iv of [0, 7]) { osc('sawtooth', mtof(root + iv), 0.05, dur * 0.3, dur * 0.75, null, raid ? 320 : 420); } osc('sine', mtof(root - 12), 0.12, dur * 0.25, dur * 0.8); }
  // ostinato d'archi pizzicato (crome)
  if (sb % 2 === 0) { const pat = raid ? [0, 12, 3, 12, 7, 12, 3, 1] : [0, 7, 12, 7, 3, 7, 12, 1]; const n = root + 24 + pat[(sb / 2) | 0] - (pat[(sb / 2) | 0] === 1 ? 0 : 0); osc('sawtooth', mtof(n), raid ? 0.045 : 0.06, 0.006, s16 * 1.6, null, 1700); }
  // ottoni ogni 4 battute
  if (bar % 4 === 3 && sb === 8) { const dur = s16 * 8; for (const iv of ch[1]) osc('sawtooth', mtof(root + 12 + iv), 0.045, dur * 0.45, dur * 0.7, null, 1100); }
  // razzia: campana a morto lontana
  if (raid && sb === 0 && bar % 2 === 0) { [1, 2.01, 2.76, 4.07].forEach((m, i) => osc('sine', mtof(root + 12) * m, 0.07 / (i + 1), 0.005, 2.6 - i * 0.4)); }
}
let AC = null;
function ac() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { } if (AC) setTimeout(tracksPreload, 1500); } if (AC && AC.state === 'suspended') AC.resume(); return AC; }
// ---- musica della festa: un saltarello medievale (flauto, cornamusa con bordone, tamburello) ----
function festaMusic(a, OUT) {
  const t0 = a.currentTime + 0.05, beat = 0.19; // crome in 6/8, tempo vivace
  const bus = a.createGain(); bus.gain.value = 0.9; bus.connect(OUT);
  const mt = n => 440 * Math.pow(2, (n - 69) / 12);
  // melodia in Re dorico: 4 battute ripetute con variazione (nota midi, durata in crome)
  const mel = [[74, 1], [76, 1], [77, 1], [79, 2], [77, 1], [76, 2], [74, 1], [72, 2], [74, 1],
               [74, 1], [76, 1], [77, 1], [79, 1], [81, 1], [79, 1], [77, 2], [76, 1], [74, 3],
               [81, 1], [79, 1], [77, 1], [79, 2], [77, 1], [76, 1], [77, 1], [76, 1], [74, 2], [72, 1],
               [74, 1], [76, 1], [77, 1], [76, 1], [74, 1], [72, 1], [74, 3], [74, 3]];
  let t = t0;
  for (const [n, d] of mel) { const o = a.createOscillator(), g = a.createGain(), v = a.createOscillator(), vg = a.createGain(); o.type = 'triangle'; o.frequency.value = mt(n);
    v.frequency.value = 5.5; vg.gain.value = mt(n) * 0.006; v.connect(vg).connect(o.frequency); // vibrato del flauto
    const dur = d * beat; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.11, t + 0.02); g.gain.setValueAtTime(0.09, t + dur * 0.7); g.gain.linearRampToValueAtTime(0.0001, t + dur * 0.98);
    o.connect(g).connect(bus); o.start(t); v.start(t); o.stop(t + dur); v.stop(t + dur); t += dur; }
  const end = t;
  // cornamusa: bordone Re-La filtrato
  const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; const dg = a.createGain(); dg.gain.setValueAtTime(0.0001, t0); dg.gain.linearRampToValueAtTime(0.045, t0 + 0.3); dg.gain.setValueAtTime(0.045, end - 0.3); dg.gain.linearRampToValueAtTime(0.0001, end); lp.connect(dg).connect(bus);
  for (const n of [50, 57, 62]) { const o = a.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mt(n); o.detune.value = (n % 3) * 3; o.connect(lp); o.start(t0); o.stop(end); }
  // tamburo (battere) e tamburello (sonagli) in 6/8: BUM . cik BUM . cik
  const noiseBuf = a.createBuffer(1, a.sampleRate * 0.2, a.sampleRate), nd = noiseBuf.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  for (let k = 0, tt = t0; tt < end - 0.05; k++, tt += beat) { const pos = k % 6;
    if (pos === 0 || pos === 3) { const o = a.createOscillator(), g = a.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(pos === 0 ? 130 : 110, tt); o.frequency.exponentialRampToValueAtTime(55, tt + 0.15); g.gain.setValueAtTime(0.22, tt); g.gain.exponentialRampToValueAtTime(0.001, tt + 0.22); o.connect(g).connect(bus); o.start(tt); o.stop(tt + 0.25); }
    if (pos === 2 || pos === 5 || (pos === 4 && k % 12 > 6)) { const src = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(); src.buffer = noiseBuf; f.type = 'highpass'; f.frequency.value = 6500; g.gain.setValueAtTime(0.09, tt); g.gain.exponentialRampToValueAtTime(0.001, tt + 0.12); src.connect(f).connect(g).connect(bus); src.start(tt); src.stop(tt + 0.15); } }
  return end - t0;
}
function sfx(kind) {
  if (SET.mute || SET.fvol <= 0) return; const a = ac(); if (!a) return; const t = a.currentTime; const OUT = fxOut(a);
  const noise = (dur, f, q, vol, type) => { const b = a.createBuffer(1, a.sampleRate * dur, a.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length); const s = a.createBufferSource(); s.buffer = b; const fl = a.createBiquadFilter(); fl.type = type || 'bandpass'; fl.frequency.value = f; fl.Q.value = q; const g = a.createGain(); g.gain.value = vol; s.connect(fl).connect(g).connect(OUT); s.start(t); };
  const tone = (f, dur, vol, type, f2) => { const o = a.createOscillator(); o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur); const g = a.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur); o.connect(g).connect(OUT); o.start(t); o.stop(t + dur); };
  if (kind === 'win') { [[523, 0], [659, 140], [784, 280], [1046, 430]].forEach(([f, d]) => setTimeout(() => { const o = a.createOscillator(), g = a.createGain(), t0 = a.currentTime; o.type = 'triangle'; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(0.13, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.001, t0 + (d === 430 ? 1.0 : 0.3)); o.connect(g).connect(OUT); o.start(t0); o.stop(t0 + 1.1); }, d)); }
  else if (kind === 'ram') { tone(70, 0.35, 0.22, 'sine', 38); noise(0.25, 180, 0.8, 0.16, 'lowpass'); setTimeout(() => noise(0.12, 900, 1.5, 0.05), 60); }
  else if (kind === 'launch') { tone(220, 0.25, 0.05, 'sawtooth', 90); noise(0.45, 700, 0.6, 0.07); setTimeout(() => tone(55, 0.2, 0.12, 'sine', 35), 80); }
  else if (kind === 'boulder') { tone(60, 0.5, 0.25, 'sine', 30); noise(0.6, 250, 0.6, 0.18, 'lowpass'); setTimeout(() => noise(0.3, 1400, 1, 0.05), 90); }
  else if (kind === 'ladder') { for (let i = 0; i < 3; i++) setTimeout(() => { tone(380 + i * 40, 0.06, 0.035, 'triangle'); noise(0.05, 1800, 2, 0.025); }, i * 140); }
  else if (kind === 'bow') { tone(180, 0.18, 0.06, 'triangle', 420); noise(0.15, 2600, 2, 0.04); }
  else if (kind === 'step') { noise(0.07, 1100, 1.4, 0.11); tone(110, 0.05, 0.06, 'sine', 70); }
  else if (kind === 'festa') { festaMusic(a, OUT); }
  else if (kind === 'arrow') noise(0.12, 2400, 2, 0.05);
  else if (kind === 'hit') { noise(0.08, 500, 1, 0.08); }
  else if (kind === 'bolt') { tone(140, 0.15, 0.08, 'triangle', 60); noise(0.1, 1200, 1, 0.06); }
  else if (kind === 'crash') { noise(0.5, 300, 0.7, 0.14, 'lowpass'); }
  else if (kind === 'build') { tone(660, 0.07, 0.05, 'square'); setTimeout(() => sfx('tock'), 120); }
  else if (kind === 'tock') tone(520, 0.06, 0.05, 'square');
  else if (kind === 'coin') { tone(1300, 0.08, 0.05, 'triangle'); setTimeout(() => tone(1760, 0.1, 0.04, 'triangle'), 70); }
  else if (kind === 'bell') { for (const st of [0, 0.9]) setTimeout(() => { [[523, 0.11], [1046, 0.06], [1318, 0.045], [1568, 0.03], [262, 0.05]].forEach(([f, v]) => tone(f, 2.4, v, 'sine')); noise(0.03, 3000, 2, 0.05); }, st * 1000); }
  else if (kind === 'horn') { tone(233, 1.0, 0.12, 'sawtooth', 220); tone(349, 1.0, 0.06, 'sawtooth', 330); tone(466, 0.9, 0.05, 'triangle', 440); }
  else if (kind === 'deploy') noise(0.06, 900, 1, 0.04);
  else if (kind === 'ult') { tone(330, 0.6, 0.06, 'triangle', 660); }
  else if (kind === 'click') tone(880, 0.04, 0.03, 'triangle');
}

// ================= SCENE: entities, simulation, rendering =================
let SC = null; // current scene
let EID = 1;
function mkBuilding(t, x, y, lvl, side, ref) {
  const d = BDEF[t]; const hp = Math.round(d.hp * (1 + 0.35 * (lvl - 1)));
  return { id: EID++, isB: true, t, x, y, w: d.w, h: d.h, lvl, hp, maxhp: hp, side, dead: false, cd: Math.random(), aim: { b: false, flip: false }, ref, loot: {}, seed: (x * 31 + y * 17) | 0, smokeT: 0, hitT: 0 };
}
function newScene(mode) {
  return { mode, water: new Uint8Array(N * N), decals: [], grid: makeGrid(), B: [], U: [], P: [], FX: [], T: [], trees: [], rocks: [], time: 0, ground: null, over: false, sel: null, ghost: null, deploySel: null, stars: 0, pct: 0, loot: {}, timer: 0, night: mode === 'raid' };
}
function sceneIndex(sc) {
  sc.grid.fill(-1);
  sc.B.forEach((b, i) => { if (b.dead) return; for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) if (inMap(x, y)) sc.grid[y * N + x] = i; });
  // wall masks
  for (const b of sc.B) if (BDEF[b.t].moat) { const at = (x, y) => { if (!inMap(x, y)) return false; const i = sc.grid[y * N + x]; return i >= 0 && BDEF[sc.B[i].t].moat; }; b.mask = (at(b.x + 1, b.y) ? 1 : 0) | (at(b.x - 1, b.y) ? 2 : 0) | (at(b.x, b.y + 1) ? 4 : 0) | (at(b.x, b.y - 1) ? 8 : 0); }
  for (const b of sc.B) if (BDEF[b.t].wall) {
    const at = (x, y) => { if (!inMap(x, y)) return false; const i = sc.grid[y * N + x]; if (i < 0) return false; const o = sc.B[i], d = BDEF[o.t]; return d.wall || (!d.decor && !d.moat && !(o.ref && o.ref.nat)); };
    b.mask = (at(b.x + 1, b.y) ? 1 : 0) | (at(b.x - 1, b.y) ? 2 : 0) | (at(b.x, b.y + 1) ? 4 : 0) | (at(b.x, b.y - 1) ? 8 : 0);
  }
}
function bAt(sc, x, y) { if (!inMap(x, y)) return null; const i = sc.grid[y * N + x]; if (i < 0) return null; const b = sc.B[i]; return b.dead ? null : b; }
function addTrees(sc, seed, dense) {
  const R = rng(seed);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const e = Math.min(x, y, N - 1 - x, N - 1 - y);
    const dc = Math.hypot(x + .5 - N / 2, y + .5 - N / 2); const grove = 0.5 + 0.5 * Math.sin(x * 0.55 + seed) * Math.cos(y * 0.47 - seed * 0.3);
    const p = e === 0 ? 0.85 : e === 1 ? 0.6 : e === 2 ? (dense ? 0.3 : 0.18) : dc > (dense ? 15 : 13) ? (grove > 0.82 ? 0.35 : 0.015) : 0;
    if (isWater(sc, x, y) || (x > 0 && isWater(sc, x - 1, y)) || (y > 0 && isWater(sc, x, y - 1))) continue;
    if (R() < p) sc.trees.push({ x: x + 0.2 + R() * 0.6, y: y + 0.2 + R() * 0.6, k: (R() * TREES.length) | 0, s: 0.8 + R() * 0.45 });
    else if (e >= 3 && R() < 0.012 && !isWater(sc, x, y)) sc.rocks.push({ x: x + 0.5, y: y + 0.5, s: (R() * 1000) | 0 });
  }
}
function paintMoat(c, m) {
  const P = [isoP(0, 0), isoP(1, 0), isoP(1, 1), isoP(0, 1)]; const g = c.createLinearGradient(P[0][0], P[0][1], P[2][0], P[2][1]); g.addColorStop(0, '#2f6f96'); g.addColorStop(1, '#245a7c'); poly(c, P, g);
  c.strokeStyle = 'rgba(190,230,255,0.35)'; c.lineWidth = 1; for (let i = 0; i < 3; i++) { const a = isoP(0.2 + i * 0.25, 0.3 + i * 0.15), b = isoP(0.38 + i * 0.25, 0.3 + i * 0.15); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
  // sponde di pietra dove il fossato finisce
  const bank = (A, B, inA, inB) => { poly(c, [A, B, inB, inA], '#8f8578', 'rgba(40,30,20,0.5)', 0.8); };
  const k = 0.16; if (!(m & 8)) bank(isoP(0, 0), isoP(1, 0), isoP(0, k), isoP(1, k)); if (!(m & 2)) bank(isoP(0, 0), isoP(0, 1), isoP(k, 0), isoP(k, 1)); if (!(m & 4)) bank(isoP(0, 1), isoP(1, 1), isoP(0, 1 - k), isoP(1, 1 - k)); if (!(m & 1)) bank(isoP(1, 0), isoP(1, 1), isoP(1 - k, 0), isoP(1 - k, 1));
}
function bCache(b) {
  const d = BDEF[b.t]; if (d.moat) { const m = rotMask(b.mask || 0); return cached(`moat${m}`, 1, 1, 10, c => paintMoat(c, m)); }
  if (d.wall) { const stone = b.lvl >= 2; const m = rotMask(b.mask || 0); return cached(`w${m}_${stone ? 1 : 0}`, 1, 1, 50, c => paintWall(c, m, stone, 5)); }
  const top = b.t === 'mastio' ? 230 : b.t === 'monastero' ? 130 : b.t === 'torre' ? 110 : 90;
  const fn = PAINT[b.t] || PAINT.capanno; return cached(`${b.t}_${b.lvl}_${b.seed % 3}${b.t === 'stendardo' ? JSON.stringify(ARMS()) : ''}`, b.w, b.h, top, c => fn(c, b.lvl, 11 + b.seed % 3 * 7));
}
function rubbleCache(b) { const v = ((b.x * 7 + b.y * 13) >>> 0) % 3; return cached(`rub${b.w}x${b.h}_${v}`, b.w, b.h, 30, c => paintRubble(c, b.w, b.h, b.w * 13 + v * 101)); }

// ---------- rendering ----------
const cam = { x: 0, y: 0, z: 1 };
function worldToScreen(wx, wy) { return [(wx - cam.x) * cam.z + VW / 2, (wy - cam.y) * cam.z + VH / 2]; }
function screenToTile(sx, sy) { const wx = (sx - VW / 2) / cam.z + cam.x, wy = (sy - VH / 2) / cam.z + cam.y; const a = wx / (TW / 2), b = wy / (TH / 2); return rotPinv((b + a) / 2, (b - a) / 2); }
function unitFrame(u) {
  const k = u.k;
  if (u.dead) return [k + '.death', u.flip];
  const dir = u.face;
  if (u.atkT > 0 || u.working) { const f = (u.working && !u.moving) ? ((u.phase * 1.6 | 0) % 2 ? 'attack' : 'idle') : 'attack'; return [k + '.' + f + dir, u.flip]; }
  if (u.moving) { const st = (u.phase * 2.2 | 0) % 2; return [k + (st ? '.walk' : '.idle') + dir, u.flip]; }
  return [k + '.idle' + dir, u.flip];
}
function render(sc, dt) {
  const c = ctx;
  c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = sc.night ? '#1b2016' : '#2f3a1f'; c.fillRect(0, 0, cv.width, cv.height);
  const z = cam.z * DPR; let shx = 0, shy = 0; if (SHAKE.a > 0.2) { shx = (Math.random() - .5) * SHAKE.a; shy = (Math.random() - .5) * SHAKE.a; SHAKE.a *= 0.86; } else SHAKE.a = 0;
  c.setTransform(z, 0, 0, z, DPR * (VW / 2 - cam.x * cam.z + shx), DPR * (VH / 2 - cam.y * cam.z + shy));
  c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
  // view bounds in world
  const vx0 = cam.x - VW / 2 / cam.z - 120, vx1 = cam.x + VW / 2 / cam.z + 120, vy0 = cam.y - VH / 2 / cam.z - 60, vy1 = cam.y + VH / 2 / cam.z + 260;
  drawGround(c, sc, cam.x - VW / 2 / cam.z - 8, cam.y - VH / 2 / cam.z - 8, cam.x + VW / 2 / cam.z + 8, cam.y + VH / 2 / cam.z + 8);
  seasonGround(c, sc);
  const vis = (wx, wy) => wx > vx0 && wx < vx1 && wy > vy0 && wy < vy1;
  // floor overlays
  if (sc.zoneCv && sc.deploySel) { c.save(); c.globalAlpha = 0.75 + 0.2 * Math.sin(sc.time * 4); tileTransform(c, 8); c.drawImage(sc.zoneCv, 0, 0); c.restore();
    if (sc.rally && MODE === 'attack') { const [rx, ry] = W(sc.rally[0] + 0.5, sc.rally[1] + 0.5); const k = 0.5 + 0.5 * Math.sin(sc.time * 4); c.strokeStyle = `rgba(120,230,120,${0.6 + 0.4 * k})`; c.lineWidth = 3; c.beginPath(); c.ellipse(rx, ry, 30 + k * 6, 15 + k * 3, 0, 0, 7); c.stroke(); c.fillStyle = 'rgba(120,230,120,0.18)'; c.fill();
      c.fillStyle = '#3a2a18'; c.fillRect(rx - 1.2, ry - 44, 2.4, 44); c.fillStyle = '#2f8a3a'; c.beginPath(); c.moveTo(rx + 1, ry - 44); c.lineTo(rx + 20, ry - 39); c.lineTo(rx + 1, ry - 33); c.closePath(); c.fill();
      c.font = 'bold 12px Cinzel, serif'; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.75)'; c.strokeText('Schiera qui', rx, ry + 30); c.fillStyle = '#d8ffcf'; c.fillText('Schiera qui', rx, ry + 30); c.textAlign = 'start'; } }
  // rubble & dead buildings (floor)
  for (const b of sc.B) if (b.dead) { const vr = vRect(b); const [wx, wy] = WR(vr[0], vr[1]); const e = rubbleCache(b); if (!e) continue; c.drawImage(e.cv, wx - e.ox, wy - e.oy, e.w, e.h); }
  // selection
  if (sc.selN) { const [x, y] = W(sc.selN.x, sc.selN.y); c.strokeStyle = 'rgba(255,230,140,0.95)'; c.lineWidth = 2; c.fillStyle = 'rgba(255,230,140,0.18)'; c.beginPath(); c.ellipse(x, y, 24, 12, 0, 0, 7); c.fill(); c.stroke(); }
  if (sc.sel && !sc.sel.dead) { const b = sc.sel; poly(c, [W(b.x, b.y), W(b.x + b.w, b.y), W(b.x + b.w, b.y + b.h), W(b.x, b.y + b.h)], 'rgba(255,230,140,0.18)', 'rgba(255,230,140,0.9)', 2); }
  if (sc.ghosts) for (const gh of sc.ghosts) poly(c, [W(gh.x, gh.y), W(gh.x + 1, gh.y), W(gh.x + 1, gh.y + 1), W(gh.x, gh.y + 1)], 'rgba(120,220,120,0.3)', '#9f9', 1.2);
  if (sc.ghost) { const ok = sc.ghost.ok; const gh = sc.ghost; poly(c, [W(gh.x, gh.y), W(gh.x + gh.w, gh.y), W(gh.x + gh.w, gh.y + gh.h), W(gh.x, gh.y + gh.h)], ok ? 'rgba(120,220,120,0.35)' : 'rgba(230,80,60,0.4)', ok ? '#9f9' : '#f88', 2); }
  // drawables
  const L = [];
  for (const b of sc.B) if (!b.dead) { const vr = vRect(b); const [wx, wy] = WR(vr[0], vr[1]); if (vis(wx, wy + 40)) L.push([BDEF[b.t].moat || BDEF[b.t].flat ? -1e6 + vr[0] + vr[1] : vr[0] + vr[1] + (b.w + b.h) / 2 - (BDEF[b.t].wall ? 0.0 : 0.02), 0, b]); }
  for (const u of sc.U) { const [wx, wy] = W(u.x, u.y); const p = rotP(u.x, u.y); if (vis(wx, wy)) L.push([u.dead ? p[0] + p[1] - 1.2 : p[0] + p[1], 1, u]); }
  for (const t of sc.trees) { const [wx, wy] = W(t.x, t.y); if (vis(wx, wy)) { const gi = sc.grid[(t.y | 0) * N + (t.x | 0)]; if (gi >= 0 && sc.B[gi] && !sc.B[gi].dead && !BDEF[sc.B[gi].t].decor) continue; const tq = QQ().tr; if (tq < 1 && Math.hypot(t.x - MCX, t.y - MCX) > 26 && ((((t.x * 73) | 0) ^ ((t.y * 151) | 0)) & 1023) / 1024 > tq) continue; const p = rotP(t.x, t.y); L.push([p[0] + p[1], 2, t]); } }
  for (const r of sc.rocks) { const [wx, wy] = W(r.x, r.y); if (vis(wx, wy)) { const p = rotP(r.x, r.y); L.push([p[0] + p[1] - 0.3, 3, r]); } }
  if (sc.mode === 'village' && S && S.fauna) for (const a of S.fauna) { const [wx, wy] = W(a.x, a.y); if (vis(wx, wy)) { const p = rotP(a.x, a.y); L.push([p[0] + p[1], 5, a]); } }
  const bans = (sc.mode === 'village' || sc.mode === 'raid') && PATHC.banners && sc.pathG === PATHC.grid ? PATHC.banners : sc.props || []; for (const l of bans) { const [wx, wy] = W(l.x, l.y); if (vis(wx, wy)) { const p = rotP(l.x, l.y); L.push([p[0] + p[1], 9, l]); } }
  if ((sc.mode === 'village' || sc.mode === 'raid') && PATHC.lamps && sc.pathG === PATHC.grid) for (const l of PATHC.lamps) { const [wx, wy] = W(l.x, l.y); if (vis(wx, wy)) { const p = rotP(l.x, l.y); L.push([p[0] + p[1], 8, l]); } }
  if (sc.ghost && sc.ghost.t) { const vr = vRect(sc.ghost); L.push([vr[0] + vr[1] + (sc.ghost.w + sc.ghost.h) / 2, 4, sc.ghost]); }
  if (sc.ghosts) for (const gh of sc.ghosts) { const vr = vRect(gh); L.push([vr[0] + vr[1] + 1, 4, gh]); }
  L.sort((a, b) => a[0] - b[0]);
  for (const [, kind, o] of L) {
    if (kind === 0) drawBuilding(c, sc, o);
    else if (kind === 1) { if (sc.selU === o && !o.dead) { const [ux, uy] = W(o.x, o.y); c.strokeStyle = 'rgba(255,230,140,0.95)'; c.lineWidth = 2; c.beginPath(); c.ellipse(ux, uy, 13, 6, 0, 0, 7); c.stroke(); } drawUnit(c, sc, o); }
    else if (kind === 8) drawLamp(c, o);
    else if (kind === 9) drawBanner(c, o);
    else if (kind === 2) { const [wx, wy] = W(o.x, o.y); const tv = treeVariants();
      if (drawTree3D(c, o, wx, wy)) { }
      else if (tv) { const v = tv[o.k % 6]; const w = (v.k === 'quercia' ? 96 : 66) * o.s, h = w * v.cv.height / v.cv.width; const fl = ((o.x * 13 + o.y * 7) | 0) % 2; c.fillStyle = 'rgba(0,0,0,0.2)'; c.beginPath(); c.ellipse(wx, wy, w * 0.32, w * 0.14, 0, 0, 7); c.fill(); if (fl) { c.save(); c.translate(wx, 0); c.scale(-1, 1); c.drawImage(v.cv, -w / 2, wy - h + 5 * o.s, w, h); c.restore(); } else c.drawImage(v.cv, wx - w / 2, wy - h + 5 * o.s, w, h); }
      else { const tc = TREES[o.k]; const w = 90 * o.s, h = 110 * o.s; c.drawImage(tc, wx - w / 2, wy - h + 8 * o.s, w, h); } }
    else if (kind === 3) { const [wx, wy] = W(o.x, o.y); if (EATL_OK) { const f = EFR.roccia; const w = o.big ? 64 : 22 + (o.s % 22), h = w * f[3] / f[2]; c.drawImage(EATL, f[0], f[1], f[2], f[3], wx - w / 2, wy - h * 0.82, w, h); } else { c.save(); c.translate(wx, wy); paintRock(c, o.s); c.restore(); } }
    else if (kind === 5) { if (BATL_OK && BFR[o.k]) { const F = FAUNA[o.k]; const [wx, wy] = W(o.x, o.y); const atk = o.atk > 0; const [f, w, h] = animFrame(o.k, o.mv && o.dying == null && !atk, o.ph * 0.75, atk ? 'atk' : null, atk ? (0.8 - o.atk) / 0.2 : o.gph, o.fast); const bob = o.mv ? Math.abs(Math.sin(o.ph)) * (o.k === 'lepre' ? 1.2 : 0.8) : Math.sin(sc.time * 1.5 + o.id) * 0.4; const dk = o.dying != null ? Math.min(1, o.dying / 0.4) : 0;
      c.fillStyle = 'rgba(0,0,0,0.22)'; c.beginPath(); c.ellipse(wx, wy, w * 0.38, w * 0.11, 0, 0, 7); c.fill();
      if (sc.selA === o) { c.strokeStyle = 'rgba(255,230,140,0.95)'; c.lineWidth = 2; c.beginPath(); c.ellipse(wx, wy, w * 0.45, w * 0.16, 0, 0, 7); c.stroke(); }
      c.save(); c.translate(wx, wy - bob); if (o.fl) c.scale(-1, 1); if (dk) { c.globalAlpha = Math.max(0, 1 - (o.dying - 0.6)); c.rotate(dk * Math.PI / 2 * 0.9); } 
      c.drawImage(f.img || BATL, f[0], f[1], f[2], f[3], -w / 2, -h + 2, w, h); c.restore(); c.globalAlpha = 1; } }
    else if (kind === 4) { // anteprima di piazzamento: lo stesso modello che verrà costruito
      let fb = o._fb; if (!fb || fb.t !== o.t) fb = o._fb = { t: o.t, x: o.x, y: o.y, w: o.w, h: o.h, lvl: 1, seed: 0, mask: 0, id: -7, side: 'D', hp: 1, maxhp: 1, aim: {}, ghost: true, ref: { rot: o.rot || 0 } };
      fb.x = o.x; fb.y = o.y; fb.ref.rot = o.rot || 0; fb.mask = o.mask || 0; fb._wu = fb._wv = fb._wd = fb._we = fb._hu = fb._hv = null; const mk = o.t === 'mastio' ? 'castello' : BDEF[o.t].wall ? 'palizzata' : o.t; if (!G3.models[mk]) need3d(mk);
      c.globalAlpha = 0.7; if ((G3.models[mk] && G3.models[mk].ready) || PAINT[o.t] || (bSprite(fb) && BATL_OK)) drawBuilding(c, sc, fb); else { poly(c, [W(o.x, o.y), W(o.x + o.w, o.y), W(o.x + o.w, o.y + o.h), W(o.x, o.y + o.h)], 'rgba(255,240,200,0.25)', 'rgba(255,240,200,0.8)', 1.5); const [cx, cy] = W(o.x + o.w / 2, o.y + o.h / 2); c.font = '22px serif'; c.textAlign = 'center'; c.fillText(BDEF[o.t].icon || '?', cx, cy - 8); c.textAlign = 'start'; } c.globalAlpha = 1; }
  }
  drawWorks(c, sc);
  // projectiles
  for (const p of sc.P) {
    const k = Math.min(1, p.t / p.dur); const x = p.x0 + (p.tx - p.x0) * k, y = p.y0 + (p.ty - p.y0) * k, zz = p.z0 * (1 - k) + 14 * k + p.arc * 4 * k * (1 - k);
    const k2 = Math.min(1, k + 0.05); const x2 = p.x0 + (p.tx - p.x0) * k2, y2 = p.y0 + (p.ty - p.y0) * k2, z2 = p.z0 * (1 - k2) + 14 * k2 + p.arc * 4 * k2 * (1 - k2);
    const [a, b] = W(x, y), [a2, b2] = W(x2, y2); const ang = Math.atan2((b2 - z2) - (b - zz), a2 - a);
    c.save(); c.translate(a, b - zz); c.rotate(ang);
    if (p.type === 'stone') { c.fillStyle = '#7d766a'; c.beginPath(); c.arc(0, 0, 5, 0, 7); c.fill(); c.fillStyle = '#a49c8e'; c.beginPath(); c.arc(-1.5, -1.5, 2, 0, 7); c.fill(); }
    else if (p.type === 'bolt') { c.fillStyle = '#4a3420'; c.fillRect(-12, -1.6, 22, 3.2); c.fillStyle = '#ccc'; c.beginPath(); c.moveTo(10, -3); c.lineTo(16, 0); c.lineTo(10, 3); c.fill(); }
    else { c.strokeStyle = '#3b2a18'; c.lineWidth = 1.3; c.beginPath(); c.moveTo(-8, 0); c.lineTo(7, 0); c.stroke(); c.fillStyle = '#ddd'; c.beginPath(); c.moveTo(7, -1.6); c.lineTo(10, 0); c.lineTo(7, 1.6); c.fill(); c.fillStyle = '#eee'; c.fillRect(-9, -1.5, 3, 3); }
    c.restore();
  }
  // fx
  for (const f of sc.FX) {
    const [wx, wy] = f.k === 'chim' ? [0, 0] : W(f.x, f.y); const k = f.t / f.dur;
    if (f.draw) f.draw(c, sc, f, wx, wy);
    else if (f.k === 'deb') { c.save(); c.globalAlpha = Math.min(1, (1 - k) * 2.5); c.translate(wx, wy - f.z); c.rotate(f.rot); c.fillStyle = f.col; c.fillRect(-f.s / 2, -f.s / 3, f.s, f.s * 0.66); c.restore(); }
    else if (f.k === 'puff') { c.fillStyle = shade(f.col, 1, 0.35 * (1 - k)); c.beginPath(); c.arc(wx, wy - f.z, f.r, 0, 7); c.fill(); }
    else if (f.k === 'ring') { c.strokeStyle = `rgba(${f.col},${1 - k})`; c.lineWidth = 3; c.beginPath(); c.ellipse(wx, wy, f.r * 32 * k, f.r * 16 * k, 0, 0, 7); c.stroke(); c.fillStyle = `rgba(${f.col},${0.15 * (1 - k)})`; c.fill(); }
    else if (f.k === 'rain') { c.strokeStyle = 'rgba(40,25,10,0.8)'; c.lineWidth = 1.2; for (let i = 0; i < 26; i++) { const R = rng(i * 13 + (f.t * 10 | 0)); const ox = (R() - 0.5) * 150, oy = (R() - 0.5) * 70; const h = (f.t * 300 + R() * 200) % 160; c.beginPath(); c.moveTo(wx + ox - 8, wy + oy - 160 + h); c.lineTo(wx + ox, wy + oy - 160 + h + 14); c.stroke(); } c.fillStyle = 'rgba(120,20,10,0.12)'; c.beginPath(); c.ellipse(wx, wy, 90, 45, 0, 0, 7); c.fill(); }
    else if (f.k === 'dome') { const u = f.follow; const [ux, uy] = u && !u.dead ? W(u.x, u.y) : [wx, wy]; c.strokeStyle = `rgba(150,210,255,${0.8 * (1 - k * 0.5)})`; c.lineWidth = 2; c.fillStyle = `rgba(150,210,255,${0.14})`; c.beginPath(); c.ellipse(ux, uy, 100, 50, 0, 0, 7); c.fill(); c.stroke(); }
    else if (f.k === 'chim') { c.fillStyle = `rgba(200,195,185,${0.32 * (1 - k)})`; c.beginPath(); c.arc(f.x0 + f.dx * k, f.y0 - k * 34, f.r + k * 9, 0, 7); c.fill(); }
    else if (f.k === 'spark') { c.fillStyle = `rgba(255,220,120,${1 - k})`; c.beginPath(); c.arc(wx, wy - 30 - k * 30, 3, 0, 7); c.fill(); }
  }
  // night lighting
  if (sc.night) {
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = 'rgba(10,18,40,0.5)'; c.fillRect(0, 0, cv.width, cv.height);
    c.globalCompositeOperation = 'lighter';
    c.setTransform(z, 0, 0, z, DPR * (VW / 2 - cam.x * cam.z), DPR * (VH / 2 - cam.y * cam.z));
    nightLights(c, sc, 1);
    for (const b of sc.B) if (!b.dead && BDEF[b.t].shoot) { const [wx, wy] = W(b.x + b.w / 2, b.y + b.h / 2); const fl = 0.85 + Math.sin(sc.time * 9 + b.id) * 0.1; for (const sx of [-9, 9]) { const x = wx + sx, y = wy - 26; const gr = c.createRadialGradient(x, y, 1, x, y, 16 * fl); gr.addColorStop(0, 'rgba(255,180,80,0.5)'); gr.addColorStop(1, 'rgba(255,120,40,0)'); c.fillStyle = gr; c.fillRect(x - 16, y - 16, 32, 32); c.fillStyle = 'rgba(255,225,140,0.95)'; c.fillRect(x - 1.2, y - 2.5, 2.4, 3.5); } }
    for (const b of sc.B) if (b.dead && b.deadT < 8) { const [wx, wy] = W(b.x + b.w / 2, b.y + b.h / 2); const gr = c.createRadialGradient(wx, wy, 2, wx, wy, 50); gr.addColorStop(0, 'rgba(255,90,30,0.35)'); gr.addColorStop(1, 'rgba(255,60,20,0)'); c.fillStyle = gr; c.beginPath(); c.arc(wx, wy, 50, 0, 7); c.fill(); }
    c.restore();
  }
  drawDayNight(c, sc, z);
  drawWeather(c, sc, Math.min(0.05, dt || 0.016));
  // overlays: hp bars, bubbles, texts
  for (const b of sc.B) {
    if (b.dead) continue; const [wx, wy] = W(b.x + b.w / 2, b.y + b.h / 2);
    if (b.hp < b.maxhp && sc.mode !== 'village') hpBar(c, wx, wy - (BDEF[b.t].wall ? 34 : 50 + b.w * 12), 30 + b.w * 6, b.hp / b.maxhp, b.side === 'D' && sc.mode === 'attack' ? '#e0583a' : '#7ccf5a');
    if (b.ref && b.ref.end) { const k = 1 - Math.max(0, (b.ref.end - Date.now()) / (b.ref.dur || 1)); hpBar(c, wx, wy - 40 - b.w * 14, 40, k, '#e8c24a'); drawScaffold(c, b); }
    if (b.bubble) { const sr = bSprite(b) ? bSpriteRect(b) : null; const by = (sr ? sr[1] + 6 : wy - 60 - b.w * 16) + Math.sin(sc.time * 3 + b.id) * 3; const bb = THM().bub; c.fillStyle = bb[0]; c.strokeStyle = bb[1]; c.lineWidth = 1.6; c.beginPath(); if (SET.theme === 'araldica') { c.rect(wx - 11, by - 11, 22, 22); } else c.arc(wx, by, 11.5, 0, 7); c.fill(); c.stroke(); const im = ICOIMG[b.bubbleK]; if (im && im.complete && im.naturalWidth) c.drawImage(im, wx - 9, by - 9.5, 18, 18); else { c.font = '13px serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(b.bubble, wx, by + 1); } }
  }
  for (const u of sc.U) {
    if (u.dead || u.ai) continue; if (u.hp >= u.maxhp && !u.hero) continue;
    const [wx, wy] = W(u.x, u.y); const hh = (FR[u.k + '.idleF'] || [0, 0, 0, 120])[3] * uScale(u);
    hpBar(c, wx, wy - hh - 6, u.hero ? 28 : 18, u.hp / u.maxhp, u.side === 'A' ? (sc.mode === 'raid' ? '#e0583a' : '#7ccf5a') : (sc.mode === 'raid' ? '#7ccf5a' : '#e0583a'));
    if (u.hero) { c.font = '10px serif'; c.textAlign = 'center'; c.fillStyle = '#ffd86b'; c.fillText('♔', wx, wy - hh - 12); }
  }
  c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  for (const t of sc.T) { const [wx, wy] = W(t.x, t.y); const k = t.t / t.dur; c.font = THM().cf; c.lineWidth = 3; c.strokeStyle = `rgba(20,10,0,${1 - k})`; c.fillStyle = t.col; c.globalAlpha = 1 - k * k; c.strokeText(t.txt, wx, wy - 60 - k * 26); c.fillText(t.txt, wx, wy - 60 - k * 26); c.globalAlpha = 1; }
}
function hpBar(c, x, y, w, k, col) { c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(x - w / 2 - 1, y - 1, w + 2, 5); c.fillStyle = col; c.fillRect(x - w / 2, y, w * Math.max(0, k), 3); }
function drawScaffold(c, b0) {
  const vr = vRect(b0); const b = { x: vr[0], y: vr[1], w: vr[2], h: vr[3] }; const W = WR;
  c.strokeStyle = 'rgba(120,85,45,0.9)'; c.lineWidth = 1.5; const h = 24 + b.w * 6;
  for (const [u, v] of [[b.x + 0.1, b.y + b.h - 0.1], [b.x + b.w - 0.1, b.y + b.h - 0.1], [b.x + b.w - 0.1, b.y + 0.1]]) { const [x, y] = W(u, v); c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - h); c.stroke(); }
  const a = W(b.x + 0.1, b.y + b.h - 0.1), d = W(b.x + b.w - 0.1, b.y + b.h - 0.1), e = W(b.x + b.w - 0.1, b.y + 0.1);
  for (const hh of [h * 0.45, h]) { c.beginPath(); c.moveTo(a[0], a[1] - hh); c.lineTo(d[0], d[1] - hh); c.lineTo(e[0], e[1] - hh); c.stroke(); }
}
function plotCache(w, h) { return cached(`plot${w}x${h}${TEX_OK ? "t" : ""}`, w, h, 16, c => {
  const [x, y] = isoP(w / 2, h / 2); const g = c.createRadialGradient(x, y + 4, 4, x, y + 4, (w + h) * 18); g.addColorStop(0, 'rgba(0,0,0,0.26)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.beginPath(); c.ellipse(x, y + 4, (w + h) * 18, (w + h) * 9, 0, 0, 7); c.fill();
  if (!TEX_OK) { poly(c, [isoP(0.02, 0.02), isoP(w - 0.02, 0.02), isoP(w - 0.02, h - 0.02), isoP(0.02, h - 0.02)], 'rgba(96,76,48,0.75)'); return; }
  const T = 32, m = 0.38, PW = Math.round((w + m * 2) * T), PH = Math.round((h + m * 2) * T);
  const tv = document.createElement('canvas'); tv.width = PW; tv.height = PH; const t = tv.getContext('2d');
  t.fillStyle = t.createPattern(texTile('dirt', T, 9), 'repeat'); t.fillRect(0, 0, PW, PH);
  const nz = makeNoise(w * 31 + h * 7), id = t.getImageData(0, 0, PW, PH), d = id.data;
  for (let py = 0; py < PH; py++) for (let px = 0; px < PW; px++) {
    const u = px / T - m, v = py / T - m, e = Math.min(u, v, w - u, h - v), n = nz(u * 1.3, v * 1.3, 2);
    const a = Math.min(1, Math.max(0, (e + m * 0.85 + (n - 0.5) * 0.7) / (m * 1.1))); const o = (py * PW + px) * 4;
    const sh = 0.9 + 0.1 * Math.min(1, Math.max(0, e + 0.3)); d[o] *= sh; d[o + 1] *= sh; d[o + 2] *= sh; d[o + 3] = 255 * a * a * (3 - 2 * a) * 0.96;
  }
  t.putImageData(id, 0, 0);
  const o0 = isoP(-m, -m), ex = isoP(1, 0), ey = isoP(0, 1), oz = isoP(0, 0);
  c.save(); c.transform((ex[0] - oz[0]) / T, (ex[1] - oz[1]) / T, (ey[0] - oz[0]) / T, (ey[1] - oz[1]) / T, o0[0], o0[1]); c.drawImage(tv, 0, 0); c.restore();
}); }
const H3FREE = { cripta: 1, torrepietra: 1, torre: 1, mura: 1, palizzata: 1, cancello: 1, balista: 1 };
function drawBuilding(c, sc, b) {
  const vr0 = vRect(b); const [wx, wy] = WR(vr0[0], vr0[1]);
  if (b.hitT > 0) { c.save(); c.translate((Math.random() - .5) * 2, 0); }
  if (!G3.models[b.t === 'mastio' ? 'castello' : b.t]) need3d(b.t === 'mastio' ? 'castello' : b.t);
  const sk = b.t === 'mastio' && G3.models.castello && G3.models.castello.ready ? 'castello' : (G3.models[b.t] && G3.models[b.t].ready ? b.t : bSprite(b));
  if (sk && G3.models[sk] && G3.models[sk].ready) {
    if (!BDEF[b.t].decor) { const p = plotCache(b.w, b.h); c.drawImage(p.cv, wx - p.ox, wy - p.oy, p.w, p.h); } else if (!DFIT[b.t]) { const [cx2, cy2] = W(b.x + b.w / 2, b.y + b.h / 2); c.fillStyle = 'rgba(0,0,0,0.2)'; c.beginPath(); c.ellipse(cx2, cy2, (b.w + b.h) * 13, (b.w + b.h) * 5.5, 0, 0, 7); c.fill(); } const ga = c.globalAlpha; if (b.ref && b.ref.end && b.ref.toLvl === 1) c.globalAlpha = 0.5; let k3 = sk, yaw = 0, fitm = 1;
    if (b.t === 'cancello') { yaw = ((((b.ref && b.ref.rot) || 0) % 2) ? -1 : 1) * Math.PI / 4; fitm = 1.3; }
    if (b.t === 'tronco') { const hh = (((b.x * 7 + b.y * 13) | 0) >>> 0) + (b.ref ? b.ref.id : 0); yaw = [-Math.PI / 4, 3 * Math.PI / 4, Math.PI / 4, -3 * Math.PI / 4][hh % 4] + ((hh >> 2) % 5 - 2) * 0.07; }
    if (b.t === 'balista') { need3d('balista_b'); need3d('balista_c'); fitm = 0.68; if (b.yawT != null) { let d = b.yawT - (b.yaw || 0); while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; b.yaw = (b.yaw || 0) + d * 0.18; } yaw = b.yaw || 0;
      const tf = b.fired != null ? sc.time - b.fired : 99; if (tf < 0.35 && G3.models.balista_c && G3.models.balista_c.ready) k3 = 'balista_c'; else if (tf < 1.4 && G3.models.balista_b && G3.models.balista_b.ready) k3 = 'balista_b'; }
    if (b.t === 'cancello' && M3D_FILES.has('cancello_aperto')) { need3d('cancello_aperto'); const om = G3.models.cancello_aperto; if (om && om.ready && sc.U.some(u => !u.dead && u.side === b.side && Math.hypot(u.x - (b.x + 1), u.y - (b.y + 1)) < 2.2)) k3 = 'cancello_aperto'; }
    const dfit = DFIT[b.t] && G3.models[k3] && G3.models[k3].m; if (dfit) { const mm = G3.models[k3].m, hz = Math.max(mm.size[0], mm.size[2]); fitm = DFIT[b.t].h ? DFIT[b.t].h * hz / Math.max(1e-6, mm.size[1]) / (b.w * 1.3) : DFIT[b.t].w / (b.w * 1.3); yaw = ((b.ref && b.ref.rot) || 0) * Math.PI / 2 + (DYAW_RND[b.t] ? ((b.id * 2654435761) >>> 0) % 628 / 100 : 0); }
    let fit3 = fitm * b.w * 1.3 * (b.t === 'mastio' ? (b.lvl <= 8 ? 1.25 + 0.03 * b.lvl : 1.49 + 0.014 * (b.lvl - 8)) : b.t === 'caserma' ? 0.82 : b.t === 'falo' ? 0.8 : b.t === 'tronco' ? 0.55 : 1);
    // nessun edificio deve superare in altezza il Mastio: tetto all'altezza in base all'impronta
    if (b.t !== 'mastio' && !H3FREE[b.t] && b.w >= 2) { const mm = G3.models[k3].m, hNow = mm.size[1] * fit3 / Math.max(mm.size[0], mm.size[2]), hMax = 0.75 * b.w + 0.3; if (hNow > hMax) fit3 *= hMax / hNow; }
    const dark = (b.t === 'casa' || b.t === 'taverna') && sc.mode === 'village' && famine(); if (dark) c.filter = 'brightness(0.6) saturate(0.5)';
    g3draw(c, b, k3, fit3, yaw); c.globalAlpha = ga; if (dark) c.filter = 'none';
    if (CHIM3[b.t] && b.r3d && !b.dead && !b.ghost && sc.mode !== 'title' && !(dark)) { b.chimT = (b.chimT || 0) - 1 / 60; if (b.chimT <= 0) { b.chimT = 0.45 + Math.random() * 0.6; const [cxp, cyp] = CHIM3[b.t]; const r = b.r3d; sc.FX.push({ k: 'chim', x0: r[0] + r[2] * cxp, y0: r[1] + r[3] * cyp, t: 0, dur: 2.8, r: 3 + Math.random() * 2.5, dx: 5 + Math.random() * 7 }); } }
  } else if (sk && BATL_OK && BFR[sk]) {
    if (BDEF[b.t].decor) { const [cx, cy] = W(b.x + b.w / 2, b.y + b.h / 2); c.fillStyle = 'rgba(0,0,0,0.22)'; c.beginPath(); c.ellipse(cx, cy, (b.w + b.h) * 12, (b.w + b.h) * 6, 0, 0, 7); c.fill(); }
    else { const p = plotCache(b.w, b.h); c.drawImage(p.cv, wx - p.ox, wy - p.oy, p.w, p.h); }
    const r = bSpriteRect(b); const building = b.ref && b.ref.end && b.ref.toLvl === 1;
    if (building) c.globalAlpha = 0.5;
    drawSpriteBox(c, b);
    c.globalAlpha = 1;
    if (sk === 'fucina' || sk === 'casa' || sk === 'taverna') { b.chimT = (b.chimT || 0) - 1 / 60; if (b.chimT <= 0 && !b.dead && sc.mode !== 'title') { b.chimT = 0.5 + Math.random() * 0.6; const cx = sk === 'fucina' ? 0.73 : sk === 'casa' ? 0.68 : 0.7; const cy = sk === 'fucina' ? 0.06 : sk === 'casa' ? 0.22 : 0.12; sc.FX.push({ k: 'chim', x0: r[0] + r[2] * cx, y0: r[1] + r[3] * cy, t: 0, dur: 2.6, r: 3 + Math.random() * 2, dx: 4 + Math.random() * 6 }); } }
  } else {
    const e = bCache(b);
    const wk = BDEF[b.t].wall ? (b.lvl >= 2 ? 'mura' : 'palizzata') : null; if (wk && !G3.models[wk]) need3d(wk);
    if (wk && G3.models[wk] && G3.models[wk].ready) { const m = b.mask || 0; const segs = []; const rr = (b.ref && b.ref.rot) || 0;
      // direzione scelta col pulsante ↻ (0 = automatica, segue i pezzi vicini)
      if (rr === 1) segs.push(['_wu', Math.PI / 4, 1.1]); else if (rr === 2) segs.push(['_wv', 3 * Math.PI / 4, 1.1]); else if (rr === 3) segs.push(['_wd', 0, 1.5]); else if (rr === 4) segs.push(['_we', Math.PI / 2, 1.5]);
      else if ((m & 3) && (m & 12)) { // angolo o incrocio: mezzo pezzo verso ogni vicino, niente punte che sporgono
        if ((m & 3) === 3) segs.push(['_wu', Math.PI / 4, 1.1]); else segs.push(['_hu', Math.PI / 4, 0.62, m & 1 ? 0.24 : -0.24, 0]);
        if ((m & 12) === 12) segs.push(['_wv', 3 * Math.PI / 4, 1.1]); else segs.push(['_hv', 3 * Math.PI / 4, 0.62, 0, m & 4 ? 0.24 : -0.24]); }
      else { if ((m & 3) || !m) segs.push(['_wu', Math.PI / 4, 1.1]); if (m & 12) segs.push(['_wv', 3 * Math.PI / 4, 1.1]); }
      for (const [kk, yw, ft, ox, oy] of segs) { if (!b[kk]) b[kk] = { x: b.x + (ox || 0), y: b.y + (oy || 0), w: 1, h: 1 }; g3draw(c, b[kk], wk, ft, yw); }
      if (wk === 'mura' && (m & 3) && (m & 12) && (m & 3) !== 3 && (m & 12) !== 12) { if (!G3.models.torrepietra) need3d('torrepietra'); if (G3.models.torrepietra && G3.models.torrepietra.ready) { if (!b._tw) b._tw = { x: b.x, y: b.y, w: 1, h: 1 }; g3draw(c, b._tw, 'torrepietra', 1.15, 0); } } }
    else if (BDEF[b.t].wall || BDEF[b.t].moat) c.drawImage(e.cv, wx - e.ox, wy - e.oy, e.w, e.h);
    else { const q = ((ANG / (Math.PI / 2)) % 4 + 4) % 4, i = Math.floor(q), sm0 = Math.min(1, Math.max(0, (q - i - 0.38) / 0.24)), t = sm0 * sm0 * (3 - 2 * sm0); const ga = c.globalAlpha; const [cx] = W(b.x + b.w / 2, b.y + b.h / 2); const ox = cx - wx;
      for (const [fl, al] of [[i % 2, 1 - t], [(i + 1) % 2, t]]) { if (al < 0.01) continue; c.globalAlpha = ga * (al > 0.99 ? 1 : al); if (fl) { c.save(); c.translate(wx + ox, 0); c.scale(-1, 1); c.translate(-ox, 0); c.drawImage(e.cv, -e.ox, wy - e.oy, e.w, e.h); c.restore(); } else c.drawImage(e.cv, wx - e.ox, wy - e.oy, e.w, e.h); }
      c.globalAlpha = ga; }
    if (DANIM[b.t]) { const [cx, cy] = W(b.x + b.w / 2, b.y + b.h / 2); DANIM[b.t](c, b, cx, cy, sc.time); }
  }
  if (b.hitT > 0) c.restore();
  if (b.t === 'balista' && !(G3.models.balista && G3.models.balista.ready)) {
    const [cx, cy] = W(b.x + 1, b.y + 1); const firing = b.fireT > 0;
    const key = b.aim.b ? (firing ? 'balista.attackF' : 'balista.idleF') : (firing ? 'balista.attackB' : 'balista.idleB');
    sprDraw(c, key, cx, cy - 12, 0.42, b.aim.flip);
  } else if (b.t === 'torre') {
    const firing = b.fireT > 0; const key = 'guardiatorre.' + (firing ? 'attack' : 'idle') + (b.aim.b ? 'B' : 'F');
    if (BATL_OK && BFR.torre) { const r = bSpriteRect(b); sprDraw(c, key, r[0] + r[2] * 0.5, r[1] + r[3] * 0.53, 0.2, b.aim.flip); }
    else { const [cx, cy] = W(b.x + 0.5, b.y + 0.5); const h = 44 + b.lvl * 4; sprDraw(c, key, cx, cy - h + 2, 0.28, b.aim.flip); }
  } else if (b.t === 'cancello' && BATL_OK && BFR.cancello) {
    const firing = b.fireT > 0; const key = 'guardiatorre.' + (firing ? 'attack' : 'idle') + (b.aim.b ? 'B' : 'F'); const r = bSpriteRect(b);
    for (const fx of [0.18, 0.82]) sprDraw(c, key, r[0] + r[2] * fx, r[1] + r[3] * 0.2, 0.17, b.aim.flip);
  } else if (b.t === 'falo' && !(G3.models.falo && G3.models.falo.ready)) {
    const [cx, cy] = W(b.x + 0.5, b.y + 0.5);
    for (let i = 0; i < 3; i++) { const fl = Math.sin(sc.time * 12 + i * 2) * 2; c.fillStyle = ['#ffcf4a', '#ff8a2a', '#e8481a'][i]; c.beginPath(); c.moveTo(cx - 6 + i * 2, cy); c.quadraticCurveTo(cx - 3 + fl, cy - 16 + i * 4, cx + fl * 0.5, cy - 22 + i * 5); c.quadraticCurveTo(cx + 3 + fl, cy - 12 + i * 4, cx + 6 - i * 2, cy); c.fill(); }
  }
}
function drawHero3D(c, sc, u, wx, wy) {
  if (!G3.models[u.k]) need3d(u.k); if (!G3.models[u.k] || !G3.models[u.k].ready) return false;
  let a = 1, rot = 0; if (u.dead) { a = Math.max(0, 1 - Math.max(0, u.deadT - 4) / 3); if (a <= 0) return true; rot = Math.min(1, u.deadT / 0.5) * 1.35; }
  const back = u.face === 'B', yaw = back ? (u.flip ? 2.4 : 3.9) : (u.flip ? 0.75 : -0.75);
  const sp = g3sprite(u.k, 64, yaw, 0); if (!sp) return false;
  u.phase += (u.moving ? 1 : 0.15) * (1 / 60) * 4; const bob = u.moving && !u.dead ? Math.abs(Math.sin(u.phase * Math.PI * 1.1)) * 2.2 : Math.sin(u.phase) * 0.4;
  const lunge = !u.dead && u.atkT > 0 ? Math.sin(Math.min(1, u.atkT / 0.3) * Math.PI) * 4 : 0;
  if (!u.dead) { c.fillStyle = 'rgba(0,0,0,0.28)'; c.beginPath(); c.ellipse(wx, wy, 14, 6, 0, 0, 7); c.fill(); c.strokeStyle = 'rgba(255,215,100,0.85)'; c.lineWidth = 2; c.beginPath(); c.ellipse(wx, wy, 15, 7, 0, 0, 7); c.stroke(); }
  c.save(); c.globalAlpha = a; c.translate(wx + (u.flip ? -lunge : lunge), wy - bob); if (rot) c.rotate(u.flip ? -rot : rot); if (u.hitT > 0) c.filter = 'brightness(1.6)';
  c.drawImage(sp.cv, sp.x0, sp.y0, sp.w, sp.h); c.restore(); c.filter = 'none';
  if (u.gb > 0 && !u.dead) { c.strokeStyle = 'rgba(255,190,80,0.7)'; c.lineWidth = 1.5; c.beginPath(); c.arc(wx, wy - 34, 26, 0, 7); c.stroke(); }
  if (u.inv > 0) { c.strokeStyle = 'rgba(160,215,255,0.8)'; c.lineWidth = 1.5; c.beginPath(); c.arc(wx, wy - 30, 24, 0, 7); c.stroke(); }
  return true;
}
// truppe con personaggio 3D animato (Meshy): unità -> modello e altezza in pixel
const ANIM3D = { arclungo: { k: 'arciere3d', h: 58 }, arccorto: { k: 'arciere3d', v: 'marrone', h: 55 }, balestriere: { k: 'arciere3d', v: 'rosso', h: 58 } };
const a3key = (A, f) => A.k + (A.v ? '~' + A.v : '') + '#' + f;
function drawAnim3D(c, sc, u, wx, wy) {
  const A = ANIM3D[u.k]; if (!A || (u.hero && HDEF[u.k])) return false; const o = G3.models[A.k]; if (!o) { need3d(A.k); const qi = L3.q.indexOf(A.k); if (qi > 0) { L3.q.splice(qi, 1); L3.q.unshift(A.k); } else if (qi < 0 && L3.state[A.k] === 'q') { const pi = L3.prefetch.indexOf(A.k); if (pi >= 0) { L3.prefetch.splice(pi, 1); L3.q.unshift(A.k); pump3d(); } } return false; } if (!o.ready || !o.anims) return false;
  let a = 1, rot = 0; if (u.dead) { a = Math.max(0, 1 - Math.max(0, u.deadT - 4) / 3); if (a <= 0) return true; rot = Math.min(1, u.deadT / 0.5) * 1.35; }
  const back = u.face === 'B', yaw = back ? (u.flip ? 2.4 : 3.9) : (u.flip ? 0.75 : -0.75);
  u.phase += (u.moving ? 1 : 0.15) * (1 / 60) * 4;
  const walk = u.moving && !u.dead && o.anims.walk; const fk = walk ? 'walk' + (Math.floor(u.phase * 2.1) % o.anims.walk) : 'idle0';
  const sp = g3sprite(a3key(A, fk), A.h, yaw, 0); if (!sp) return false;
  const recoil = !u.dead && u.atkT > 0 ? Math.sin(Math.min(1, u.atkT / 0.3) * Math.PI) * 2 : 0, breathe = !walk && !u.dead ? Math.sin(u.phase * 1.3) * 0.5 : 0;
  const ring = u.side === 'A' ? (sc.mode === 'raid' ? 'rgba(200,50,40,0.55)' : 'rgba(70,120,230,0.55)') : u.side === 'D' ? (sc.mode === 'raid' ? 'rgba(70,120,230,0.55)' : 'rgba(200,50,40,0.55)') : null;
  if (!u.dead && ring) { c.strokeStyle = ring; c.lineWidth = 1.6; c.beginPath(); c.ellipse(wx, wy, 10, 5, 0, 0, 7); c.stroke(); }
  c.save(); c.globalAlpha = a; c.translate(wx + (u.flip ? recoil : -recoil), wy - breathe); if (rot) c.rotate(u.flip ? -rot : rot); if (u.hitT > 0) c.filter = 'brightness(1.6)';
  c.drawImage(sp.cv, sp.x0, sp.y0, sp.w, sp.h); c.restore(); c.filter = 'none'; c.globalAlpha = 1;
  if (u.inv > 0) { c.strokeStyle = 'rgba(160,215,255,0.8)'; c.lineWidth = 1.5; c.beginPath(); c.arc(wx, wy - 26, 22, 0, 7); c.stroke(); }
  return true;
}
const HPORT = {};
function heroPortrait(k) { if (HPORT[k]) return HPORT[k]; need3d(k); const sp = G3.models[k] && G3.models[k].ready ? g3sprite(k, 140, 0.5, 0) : null; if (!sp) return ''; const cv2 = document.createElement('canvas'); cv2.width = 120; cv2.height = 148; const s = Math.min(140 / sp.h, 116 / sp.w); cv2.getContext('2d').drawImage(sp.cv, (120 - sp.w * s) / 2, 148 - sp.h * s, sp.w * s, sp.h * s); return HPORT[k] = cv2.toDataURL(); }
function drawUnit(c, sc, u) { drawUnit0(c, sc, u); if (u.vis) drawVisitorMark(c, sc, u); }
function drawUnit0(c, sc, u) {
  const [wx, wy] = W(u.x, u.y); if (u.k === 'carro') { if (!u.dead) drawCart(c, u, wx, wy); return; }
  if (u.climb) drawLadder(c, u);
  if (UDEF[u.k] && UDEF[u.k].siege) { if (u.dead) { const a = Math.max(0, 1 - u.deadT / 3); if (a <= 0) return; c.globalAlpha = a; } u.wph = (u.wph || 0) + (u.moving ? 0.08 : 0); const fire = u.atkT > 0 ? 1 - u.atkT / 0.6 : 0; const mk = UDEF[u.k].siege === 'ram' ? 'ariete3d' : 'catapulta3d'; if (!G3.models[mk]) need3d(mk); if (G3.models[mk] && G3.models[mk].ready) { const yaw = (u.face === 'B' ? (u.flip ? 2.4 : 3.9) : (u.flip ? 0.75 : -0.75)) + (UDEF[u.k].siege === 'ram' ? -Math.PI / 2 : 0); const yq = Math.round(yaw / 0.3927) * 0.3927; const mm = G3.models[mk].m, hp = Math.round((mk === 'ariete3d' ? 1.35 : 1.5) * mm.size[1] * ISO_H / Math.max(mm.size[0], mm.size[2])); const sp = g3sprite(mk, hp, yq, 0); const jolt = fire > 0 && fire < 1 ? Math.sin(fire * Math.PI) * (mk === 'ariete3d' ? 4 : 2.5) : 0; if (sp) c.drawImage(sp.cv, wx + sp.x0 + jolt * (u.flip ? -1 : 1), wy + sp.y0 - (mk === 'catapulta3d' ? jolt : 0), sp.w, sp.h); if (fire > 0.3 && fire < 0.5 && mk === 'catapulta3d') { c.fillStyle = 'rgba(200,190,170,0.5)'; c.beginPath(); c.arc(wx, wy - 40, 8, 0, 7); c.fill(); } } else drawSiegeAt(c, UDEF[u.k].siege === 'ram' ? 'ariete' : 'catapulta', wx, wy, u.flip, u.wph, fire > 0 && fire < 1 ? fire : 0); c.globalAlpha = 1; if (!u.dead && u.hp < u.maxhp) hpBar(c, wx, wy - 50, 34, u.hp / u.maxhp, '#7ccf6a'); return; }
  if (u.d.beast) { if (!BATL_OK || !BFR[u.k]) return; const fight = !u.dead && u.atkT > 0.32 - u.d.cd; const [f, w, h] = animFrame(u.k, u.moving && !u.dead && !fight, u.phase * 1.4, fight ? 'atk' : null, fight ? (0.32 - u.atkT) / (u.d.cd / 4) : 0);
    let a = 1, rot = 0; if (u.dead) { a = Math.max(0, 1 - Math.max(0, u.deadT - 4) / 3); if (a <= 0) return; rot = Math.min(1, u.deadT / 0.4) * 1.4; }
    u.phase += (u.moving ? 1 : 0.15) * (1 / 60) * 6; const bob = u.moving && !u.dead ? Math.abs(Math.sin(u.phase * 2)) * 0.8 : 0; const lunge = 0;
    if (!u.dead) { c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(wx, wy, w * 0.38, w * 0.11, 0, 0, 7); c.fill(); c.strokeStyle = 'rgba(200,50,40,0.55)'; c.lineWidth = 1.6; c.beginPath(); c.ellipse(wx, wy, w * 0.42, w * 0.13, 0, 0, 7); c.stroke(); }
    c.save(); c.globalAlpha = a; c.translate(wx, wy - bob); if (u.flip) c.scale(-1, 1); c.translate(lunge, 0); if (rot) c.rotate(rot); if (u.hitT > 0) c.filter = 'brightness(1.6)';
    if (sc.night && !u.dead) { c.shadowColor = 'rgba(255,200,60,0.9)'; c.shadowBlur = 6; }
    c.drawImage(BATL, f[0], f[1], f[2], f[3], -w / 2, -h + 2, w, h); c.restore(); c.filter = 'none'; c.globalAlpha = 1; return; }
  if (u.d.model && drawHero3D(c, sc, u, wx, wy)) return;
  if (ANIM3D[u.k] && drawAnim3D(c, sc, u, wx, wy)) return;
  if (u.dead) { const a = Math.max(0, 1 - Math.max(0, u.deadT - 5) / 3); if (a <= 0) return; sprDraw(c, u.k + '.death', wx, wy + 4, uScale(u) * 0.95, u.flip, a * 0.95); return; }
  u.phase += (u.moving ? 1 : 0.15) * (1 / 60) * 4;
  const ring = u.side === 'A' ? (sc.mode === 'raid' ? 'rgba(200,50,40,0.55)' : 'rgba(70,120,230,0.55)') : u.side === 'D' ? (sc.mode === 'raid' ? 'rgba(70,120,230,0.55)' : 'rgba(200,50,40,0.55)') : null;
  c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(wx, wy, u.d.cav ? 15 : 9, u.d.cav ? 6 : 4.5, 0, 0, 7); c.fill();
  if (ring) { c.strokeStyle = ring; c.lineWidth = 1.6; c.beginPath(); c.ellipse(wx, wy, u.d.cav ? 15 : 10, u.d.cav ? 6.5 : 5, 0, 0, 7); c.stroke(); }
  if (u.hero) { c.strokeStyle = 'rgba(255,215,100,0.8)'; c.lineWidth = 2; c.beginPath(); c.ellipse(wx, wy, 13, 6.5, 0, 0, 7); c.stroke(); }
  const [key, flip] = unitFrame(u);
  const bob = u.moving ? Math.abs(Math.sin(u.phase * Math.PI * 1.1)) * 1.6 : 0;
  if (u.hitT > 0) c.filter = 'brightness(1.6)';
  sprDraw(c, key, wx, wy + 1 - bob, uScale(u), flip);
  if (u.hitT > 0) c.filter = 'none';
  if (u.inv > 0) { c.strokeStyle = 'rgba(160,215,255,0.8)'; c.lineWidth = 1.5; c.beginPath(); c.arc(wx, wy - 26, 22, 0, 7); c.stroke(); }
}

// ---------- camera & input ----------
// ---- smooth map rotation ----
let ROTA = null; const Q90 = Math.PI / 2;
function rotLabel() { const rl = $('#rotlbl'); if (rl) rl.textContent = ['N', 'E', 'S', 'O'][rstep()]; }
function animRot(target, dur, pivot) { ROTA = { from: ANG, to: target, t: 0, dur, pivot: pivot || screenToTile(VW / 2, VH / 2), px: VW / 2, py: VH / 2 }; }
function rotTick(dt) {
  if (!ROTA) return; ROTA.t += dt; const k = Math.min(1, ROTA.t / ROTA.dur); const e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
  setAng(ROTA.from + (ROTA.to - ROTA.from) * e); keepPivot(ROTA.pivot, ROTA.px, ROTA.py);
  if (k >= 1) { setAng(ROTA.to); ROTA = null; rotLabel(); }
}
function keepPivot(p, sx, sy) { const [wx, wy] = W(p[0], p[1]); cam.x = wx - (sx - VW / 2) / cam.z; cam.y = wy - (sy - VH / 2) / cam.z; }
function rotateView(d) {
  if (!SC || MODE === 'title') return;
  const base = ROTA ? ROTA.to : Math.round(ANG / Q90) * Q90; const piv = ROTA ? ROTA.pivot : null;
  animRot(base + d * Q90, 0.55, piv); sfx('click');
}
function snapRot(pivot, sx, sy) { const tgt = Math.round(ANG / Q90) * Q90; animRot(tgt, Math.min(0.35, 0.12 + Math.abs(tgt - ANG) * 0.5), pivot); if (sx != null) { ROTA.px = sx; ROTA.py = sy; } }
function centerCam(tx, ty) { const [wx, wy] = W(tx, ty); cam.x = wx; cam.y = wy; }
function clampCam() { cam.z = Math.max(0.32, Math.min(2.4, cam.z)); cam.x = Math.max(-N * 30, Math.min(N * 30, cam.x)); cam.y = Math.max(N * 2, Math.min(N * 30, cam.y)); }
const ptr = new Map(); let G = null, holdTimer = null, holdIv = null, lastPos = null;
function stopHold() { clearTimeout(holdTimer); clearInterval(holdIv); holdTimer = holdIv = null; }
cv.addEventListener('pointerdown', e => {
  ac(); cv.setPointerCapture(e.pointerId); ptr.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (ptr.size === 1 && (e.button === 2 || e.shiftKey) && MODE !== 'title') { ROTA = null; G = { k: 'twist', sx: e.clientX, a0: ANG, pivot: screenToTile(VW / 2, VH / 2) }; return; }
  if (ptr.size === 1) {
    G = { k: 'tap', sx: e.clientX, sy: e.clientY, cx: cam.x, cy: cam.y, held: false }; lastPos = [e.clientX, e.clientY];
    if ((MODE === 'attack' || MODE === 'raid') && SC.deploySel && !SC.deploySel.hero) { holdTimer = setTimeout(() => { if (G && G.k === 'tap') { G.held = true; deployAt(lastPos[0], lastPos[1]); holdIv = setInterval(() => { if (G && G.held) deployAt(lastPos[0] + (Math.random() - .5) * 14, lastPos[1] + (Math.random() - .5) * 8); }, 110); } }, 260); }
  } else if (ptr.size === 2) { stopHold(); const [a, b] = [...ptr.values()]; ROTA = null; const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2; G = { k: 'pinch', d0: Math.hypot(a.x - b.x, a.y - b.y), z0: cam.z, f0: Math.atan2(b.y - a.y, b.x - a.x), a0: ANG, pivot: screenToTile(mx, my), rot: false }; }
});
cv.addEventListener('pointermove', e => {
  if (!ptr.has(e.pointerId)) return; ptr.set(e.pointerId, { x: e.clientX, y: e.clientY }); lastPos = [e.clientX, e.clientY];
  if (!G) return;
  if (G.k === 'tap' && !G.held && Math.hypot(e.clientX - G.sx, e.clientY - G.sy) > 8) { G.k = 'pan'; stopHold(); }
  if (G.k === 'pan') { cam.x = G.cx - (e.clientX - G.sx) / cam.z; cam.y = G.cy - (e.clientY - G.sy) / cam.z; clampCam(); }
  else if (G.k === 'pinch' && ptr.size >= 2) {
    const [a, b] = [...ptr.values()]; let da = Math.atan2(b.y - a.y, b.x - a.x) - G.f0; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
    if (MODE !== 'title' && (G.rot || Math.abs(da) > 0.14)) { if (!G.rot) { G.rot = true; G.f0 += Math.sign(da) * 0.14; da -= Math.sign(da) * 0.14; } setAng(G.a0 - da); }
    const d = Math.hypot(a.x - b.x, a.y - b.y); cam.z = Math.max(0.32, Math.min(2.4, G.z0 * d / G.d0));
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2; keepPivot(G.pivot, mx, my); G.mx = mx; G.my = my; clampCam(); }
  else if (G.k === 'twist') { setAng(G.a0 + (e.clientX - G.sx) * 0.009); keepPivot(G.pivot, VW / 2, VH / 2); }
});
function endPtr(e) {
  if (!ptr.has(e.pointerId)) return; ptr.delete(e.pointerId);
  if (G && G.k === 'tap' && !G.held && ptr.size === 0) onTap(e.clientX, e.clientY);
  if (G && (G.k === 'twist' || (G.k === 'pinch' && G.rot))) snapRot(G.k === 'twist' ? G.pivot : screenToTile(G.mx || VW / 2, G.my || VH / 2), G.k === 'twist' ? null : G.mx, G.k === 'twist' ? null : G.my);
  if (ptr.size === 0) { G = null; stopHold(); } else if (G && G.k === 'pinch') { const [a] = [...ptr.values()]; G = { k: 'pan', sx: a.x, sy: a.y, cx: cam.x, cy: cam.y }; }
}
cv.addEventListener('pointerup', endPtr); cv.addEventListener('pointercancel', endPtr);
cv.addEventListener('contextmenu', e => e.preventDefault());
window.addEventListener('keydown', e => { if (e.key === 'q' || e.key === 'Q') rotateView(-1); if (e.key === 'e' || e.key === 'E') rotateView(1); });
cv.addEventListener('wheel', e => { e.preventDefault(); const z0 = cam.z, z = Math.max(0.32, Math.min(2.4, z0 * Math.exp(-e.deltaY * 0.0015))); const wx = (e.clientX - VW / 2) / z0 + cam.x, wy = (e.clientY - VH / 2) / z0 + cam.y; cam.z = z; cam.x = wx - (e.clientX - VW / 2) / z; cam.y = wy - (e.clientY - VH / 2) / z; clampCam(); }, { passive: false });
function onTap(sx, sy) {
  if (MODE === 'visit') { visitTap(sx, sy); return; }
  if (MODE === 'attack' || MODE === 'raid') { deployAt(sx, sy); return; }
  if (MODE !== 'village') return;
  const [tx, ty] = screenToTile(sx, sy);
  if (placing && placing.line) { wallTap(tx, ty); return; }
  if (placing) { const d = BDEF[placing.t]; placing.x = Math.floor(tx - d.w / 2 + 0.5); placing.y = Math.floor(ty - d.h / 2 + 0.5); updateGhost(); return; }
  // pick building: prefer one whose sprite area contains point; test tile then tiles below (tall sprites)
  let hit = bAt(SC, Math.floor(tx), Math.floor(ty));
  if (!hit) { const wx = (sx - VW / 2) / cam.z + cam.x, wy = (sy - VH / 2) / cam.z + cam.y; let best = -1; for (const b of SC.B) { if (b.dead || BDEF[b.t].wall) continue; let r = bSprite(b) ? bSpriteRect(b) : null; if (!r) { const e = bCache(b); const vr = vRect(b); const [bx, by] = WR(vr[0], vr[1]); r = [bx - e.ox + 20, by - e.oy + 20, e.w - 40, e.h - 40]; } if (wx >= r[0] && wx <= r[0] + r[2] && wy >= r[1] && wy <= r[1] + r[3]) { const vk = vRect(b); const key = vk[0] + vk[1] + (b.w + b.h) / 2; if (key > best) { best = key; hit = b; } } } }
  for (let k = 1; k <= 3 && !hit; k++) { const b = bAt(SC, Math.floor(tx + k * 0.5), Math.floor(ty + k * 0.5)); if (b) hit = b; }
  { const vu = pickVisitor(sx, sy); if (vu) { const e = EVENTS.find(x => x.id === vu.vis); if (e) { sfx('click'); openEvent(e); return; } } }
  { const fu = pickFolk(sx, sy, tx, ty); if (fu) { sfx('click'); if (FOLK_NAV && !FOLK_NAV.includes(folkOf(fu) && folkOf(fu).id)) FOLK_NAV = null; openFolk(fu); return; } if ($('#fcard') && !$('#fcard').classList.contains('hidden')) { closeFolk(); return; } }
  { const an = pickAnimal(sx, sy, tx, ty); if (an) { sfx('click'); openAnimal(an); return; } }
  if (!bAt(SC, Math.floor(tx), Math.floor(ty))) { const nat = pickNature(sx, sy, tx, ty); if (nat && (!hit || (nat.k == null && Math.hypot(nat.x - tx, nat.y - ty) < 0.75) || Math.hypot(nat.x - tx, nat.y - ty) < 0.75)) { sfx('click'); openNature(nat); return; } if (!hit && nat) { sfx('click'); openNature(nat); return; } }
  if (hit) {
    if (hit.ref && hit.bubble && collect(hit.ref)) { hit.bubble = null; return; }
    SC.sel = hit; sfx('click'); openBuildingInfo(hit.ref);
  } else { SC.sel = null; closeSheet(); }
}

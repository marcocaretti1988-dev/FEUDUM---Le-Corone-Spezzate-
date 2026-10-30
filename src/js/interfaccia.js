// FEUDUM · INTERFACCIA: temi, finestre, menu, stemma, guida, promemoria, risorse mancanti, HUD di battaglia, schermata del titolo
// ---- temi ----
const THEMES = {
  pergamena: { n: 'Pergamena', d: 'Legno, pergamena e cera rossa. Lo stile classico di FEUDUM.', fh: 'Cinzel', fb: 'Lora', sw: ['#f3e6c4', '#2f271f', '#8f1d1d', '#d9b25a'],
    ico: { O: '#3a2410', w: 1.5, H: 'rgba(255,255,255,.45)' }, cf: 'bold 12px Cinzel, serif', bub: ['rgba(253,246,227,0.95)', '#5c3a25'] },
  miniatura: { n: 'Miniatura', d: 'Codice miniato: pergamena chiara, blu lapislazzuli e foglia d\'oro.', fh: 'Cormorant SC', fb: 'EB Garamond', sw: ['#f7efd9', '#1f3a8a', '#c99a2e', '#b3261e'],
    ico: { O: '#16306e', w: 1.6, H: '#fff7d0', gold: 1 }, cf: '700 14px "Cormorant SC", serif', bub: ['rgba(247,239,217,0.97)', '#c99a2e'] },
  pietra: { n: 'Pietra e Ferro', d: 'Ardesia scura, ferro battuto e braci. Stile da fortezza.', fh: 'IM Fell English SC', fb: 'Alegreya Sans', sw: ['#2b2f33', '#8d959c', '#e07a2f', '#d7dadc'],
    ico: { O: '#15171a', w: 1.5, H: 'rgba(255,255,255,.55)', mono: 1 }, cf: '13px "IM Fell English SC", serif', bub: ['rgba(43,47,51,0.95)', '#8d959c'] },
  araldica: { n: 'Araldica', d: 'Smalti piatti come uno stemma: rosso, azzurro e oro su argento.', fh: 'Grenze Gotisch', fb: 'Alegreya', sw: ['#f4f1ea', '#1d4aa0', '#b3201f', '#e8b923'],
    ico: { O: '#111', w: 2.1, H: null, flat: 1 }, cf: '700 14px "Grenze Gotisch", serif', bub: ['#f4f1ea', '#111'] },
};
function THM() { return THEMES[SET.theme] || THEMES.pergamena; }

// ---- icone disegnate (SVG) ----
// colori naturali [A, B] e versione araldica (smalti piatti)
const ICOL = {
  gear: [['#b9c0c6', '#6d4b2a'], ['#f4f1ea', '#b3201f']], sound: [['#d9c39a', '#c8382c'], ['#f4f1ea', '#e8b923']],
  cibo: [['#e3b445', '#a8761f'], ['#e8b923', '#8b5a2b']], legno: [['#9c6a3a', '#dcb27a'], ['#b5651d', '#f4f1ea']],
  oro: [['#f2c23a', '#b98516'], ['#e8b923', '#b3201f']], pietra: [['#9b968e', '#c9c4bb'], ['#9aa0a6', '#f4f1ea']],
  ferro: [['#69737c', '#aeb7bf'], ['#c9ced3', '#1d4aa0']], pelli: [['#94663a', '#c99a62'], ['#b5651d', '#e8b923']],
  favore: [['#f2c94c', '#c0392b'], ['#e8b923', '#b3201f']], build: [['#7d8790', '#8b5a2b'], ['#2b2b2b', '#b5651d']],
  army: [['#d3dae0', '#8b5a2b'], ['#f4f1ea', '#e8b923']], castle: [['#a9a39a', '#2f4f8f'], ['#f4f1ea', '#1d4aa0']],
  map: [['#ead7a7', '#3d7a3a'], ['#f4f1ea', '#2f8a3a']], scroll: [['#ecd9a8', '#c49a5a'], ['#f4f1ea', '#e8b923']],
  pop: [['#c98b5a', '#2f4f8f'], ['#b3201f', '#1d4aa0']], moon: [['#f2e2a0', '#f7f0c8'], ['#f4f1ea', '#e8b923']],
  truce: [['#f4f1e8', '#8b5a2b'], ['#f4f1ea', '#b5651d']], hammer: [['#7d8790', '#8b5a2b'], ['#2b2b2b', '#b5651d']],
  star: [['#f2c23a', '#b98516'], ['#e8b923', '#b3201f']], skull: [['#efe6d2', '#3a2410'], ['#f4f1ea', '#111']],
};
const IDRAW = {
  gear: P => { let t = ''; for (let i = 0; i < 8; i++) t += `<rect x="14" y="2.2" width="4" height="6" rx="1" fill="${P.A}" transform="rotate(${i * 45} 16 16)"/>`; return `<g stroke="${P.O}" stroke-width="${P.w}" stroke-linejoin="round">${t}<circle cx="16" cy="16" r="9.6" fill="${P.A}"/><circle cx="16" cy="16" r="4" fill="${P.B}"/></g>`; },
  sound: P => `<g stroke="${P.O}" stroke-width="${P.w}" stroke-linejoin="round"><path d="M4 12h6l7-6v20l-7-6H4z" fill="${P.A}"/><path d="M21 11q3 5 0 10M24.5 8q5.5 8 0 16" fill="none" stroke="${P.B}" stroke-width="${P.w + 1}" stroke-linecap="round"/></g>`,
  cibo: P => { const ear = a => { let g = `<g transform="rotate(${a} 16 29)"><path d="M16 29V11" fill="none" stroke="${P.B}" stroke-width="${P.w + 0.8}" stroke-linecap="round"/>`; for (let i = 0; i < 3; i++) { const y = 6 + i * 3.4; g += `<ellipse cx="13.9" cy="${y + 1.6}" rx="1.9" ry="2.7" transform="rotate(-28 13.9 ${y + 1.6})"/><ellipse cx="18.1" cy="${y + 1.6}" rx="1.9" ry="2.7" transform="rotate(28 18.1 ${y + 1.6})"/>`; } return g + `<ellipse cx="16" cy="4.6" rx="1.8" ry="2.8"/></g>`; };
    return `<g fill="${P.A}" stroke="${P.O}" stroke-width="${P.w}">${ear(-30)}${ear(30)}${ear(0)}</g><path d="M11 23.5h10" stroke="${P.O}" stroke-width="${P.w + 1.2}" stroke-linecap="round"/>`; },
  legno: P => { const log = (x, y) => `<circle cx="${x}" cy="${y}" r="6.2" fill="${P.A}"/><circle cx="${x}" cy="${y}" r="4.2" fill="${P.B}" stroke-width="${P.w * 0.7}"/><circle cx="${x}" cy="${y}" r="2" fill="none" stroke-width="${P.w * 0.6}"/>`;
    return `<g stroke="${P.O}" stroke-width="${P.w}">${log(9.5, 22.5)}${log(22.5, 22.5)}${log(16, 11.5)}</g>`; },
  oro: P => `<g stroke="${P.O}" stroke-width="${P.w}"><circle cx="16" cy="16" r="12.3" fill="${P.A}"/><circle cx="16" cy="16" r="8.6" fill="none" stroke="${P.B}" stroke-width="${P.w + 0.4}"/><path d="M16 9.5v13M10.8 14.5h10.4" fill="none" stroke="${P.B}" stroke-width="${P.w + 1.1}" stroke-linecap="round"/></g>${P.H ? `<path d="M8 11a9.5 9.5 0 0 1 6-5" fill="none" stroke="${P.H}" stroke-width="1.8" stroke-linecap="round"/>` : ''}`,
  pietra: P => `<g stroke="${P.O}" stroke-width="${P.w}" stroke-linejoin="round"><path d="M5 22 8.5 11.5 16 6.5 24.5 9.5 27.5 19 22 26.5 11.5 27z" fill="${P.A}"/><path d="M15 16 27.5 19 22 26.5z" fill="${P.B}"/><path d="M16 6.5 15 16 8.5 11.5M15 16 11.5 27" fill="none"/></g>`,
  ferro: P => { const ing = (x, y) => `<path d="M${x} ${y}l2.5-5.5h9l2.5 5.5z" fill="${P.A}"/><path d="M${x + 2.5} ${y - 5.5}l1.2-2.3h6.6l1.2 2.3z" fill="${P.B}"/>`;
    return `<g stroke="${P.O}" stroke-width="${P.w}" stroke-linejoin="round">${ing(2, 27)}${ing(16, 27)}${ing(9, 19)}</g>`; },
  pelli: P => `<g stroke="${P.O}" stroke-width="${P.w}" stroke-linejoin="round"><path d="M16 4c3 0 5 2 5 4l5-1c1 3-1 5-3 6 1 4 1 7 0 9l4 3c-2 3-5 2-7 1-2 2-6 2-8 0-2 1-5 2-7-1l4-3c-1-2-1-5 0-9-2-1-4-3-3-6l5 1c0-2 2-4 5-4z" fill="${P.A}"/><ellipse cx="16" cy="16.5" rx="4.2" ry="6.5" fill="${P.B}" stroke="none" opacity=".8"/></g>`,
  favore: P => `<g stroke="${P.O}" stroke-width="${P.w}" stroke-linejoin="round"><path d="M5 23 3.8 10l6.4 6L16 7l5.8 9 6.4-6L27 23z" fill="${P.A}"/><rect x="4.6" y="22" width="22.8" height="5.5" rx="1.2" fill="${P.A}"/><circle cx="3.8" cy="10" r="1.9" fill="${P.A}"/><circle cx="16" cy="7" r="1.9" fill="${P.A}"/><circle cx="28.2" cy="10" r="1.9" fill="${P.A}"/><circle cx="10.5" cy="24.7" r="1.6" fill="${P.B}"/><circle cx="16" cy="24.7" r="1.6" fill="${P.B}"/><circle cx="21.5" cy="24.7" r="1.6" fill="${P.B}"/></g>`,
  hammer: P => `<g stroke="${P.O}" stroke-width="${P.w}" stroke-linejoin="round" transform="rotate(-40 16 16)"><rect x="14.2" y="11" width="3.6" height="18.5" rx="1.6" fill="${P.B}"/><path d="M7 5.5h15l3.2 2.6v3.4L22 14H7z" fill="${P.A}"/></g>`,
  build: P => IDRAW.hammer(P),
  army: P => { const sw = a => `<g transform="rotate(${a} 16 16)"><path d="M16 2.5l2 3.2V20h-4V5.7z" fill="${P.A}"/><rect x="10" y="20" width="12" height="2.6" rx="1" fill="${P.B}"/><rect x="14.8" y="22.6" width="2.4" height="5" fill="${P.B}"/><circle cx="16" cy="29" r="1.9" fill="${P.B}"/></g>`;
    return `<g stroke="${P.O}" stroke-width="${P.w}" stroke-linejoin="round">${sw(40)}${sw(-40)}</g>`; },
  castle: P => `<g stroke="${P.O}" stroke-width="${P.w}" stroke-linejoin="round"><path d="M16 8.5V2.5" fill="none"/><path d="M16 2.5l7 2-7 2z" fill="${P.B}"/><path d="M7 29V9h4v3h3V9h4v3h3V9h4v20z" fill="${P.A}"/><path d="M13 29v-5.5a3 3 0 0 1 6 0V29z" fill="${P.O}"/><rect x="15" y="14" width="2" height="4" fill="${P.O}"/></g>`,
  map: P => `<g stroke="${P.O}" stroke-width="${P.w}" stroke-linejoin="round"><path d="M3.5 8 11.5 5l9 3 8-3v19l-8 3-9-3-8 3z" fill="${P.A}"/><path d="M11.5 5v19M20.5 8v19" fill="none" stroke-width="${P.w * 0.7}"/><path d="M7 21q5-7 9-4t9-7" fill="none" stroke="${P.B}" stroke-width="${P.w + 0.5}" stroke-dasharray="2 2"/><path d="M23 8l4 4m0-4-4 4" stroke="${P.B}" stroke-width="${P.w + 0.6}"/></g>`,
  scroll: P => `<g stroke="${P.O}" stroke-width="${P.w}" stroke-linejoin="round"><rect x="8" y="6" width="16" height="20" fill="${P.A}"/><rect x="5" y="3.5" width="22" height="5" rx="2.5" fill="${P.B}"/><rect x="5" y="23.5" width="22" height="5" rx="2.5" fill="${P.B}"/><path d="M11 12h10M11 15h10M11 18h7" fill="none" stroke-width="${P.w * 0.8}"/></g>`,
  pop: P => `<g stroke="${P.O}" stroke-width="${P.w}"><circle cx="21" cy="10" r="4" fill="${P.B}"/><path d="M14 27a7 8 0 0 1 14 0z" fill="${P.B}"/><circle cx="12" cy="12.5" r="4.6" fill="${P.A}"/><path d="M3.5 29a8.5 9 0 0 1 17 0z" fill="${P.A}"/></g>`,
  moon: P => `<g stroke="${P.O}" stroke-width="${P.w}" stroke-linejoin="round"><path d="M19 3.5A12.5 12.5 0 1 0 28.5 22 10 10 0 1 1 19 3.5z" fill="${P.A}"/><path d="M25 6l.8 1.8 1.8.8-1.8.8-.8 1.8-.8-1.8-1.8-.8 1.8-.8z" fill="${P.B}" stroke-width="${P.w * 0.6}"/></g>`,
  truce: P => `<g stroke="${P.O}" stroke-width="${P.w}" stroke-linejoin="round"><path d="M9 3.5V29" stroke="${P.B}" stroke-width="${P.w + 1.4}" stroke-linecap="round"/><path d="M10 6c5-3 9 3 15 0v11c-6 3-10-3-15 0z" fill="${P.A}"/></g>`,
  star: P => `<path d="M16 3l3.8 8.2 8.9 1-6.6 6.1 1.8 8.8L16 22.7l-7.9 4.4 1.8-8.8-6.6-6.1 8.9-1z" fill="${P.A}" stroke="${P.O}" stroke-width="${P.w}" stroke-linejoin="round"/>`,
  skull: P => `<g stroke="${P.O}" stroke-width="${P.w}" stroke-linejoin="round"><path d="M16 4c6.5 0 10.5 4.3 10.5 10 0 3.2-1.5 5.4-3.5 6.7V25h-3v2h-3v-2h-2v2h-3v-2H9v-4.3C7 19.4 5.5 17.2 5.5 14 5.5 8.3 9.5 4 16 4z" fill="${P.A}"/><circle cx="11.6" cy="14.6" r="2.8" fill="${P.B}"/><circle cx="20.4" cy="14.6" r="2.8" fill="${P.B}"/><path d="M16 18.2l-1.6 3h3.2z" fill="${P.B}"/></g>`,
};
let ICOURL = {}, ICOIMG = {};
function icoPalette(k) {
  const t = THM().ico, nat = ICOL[k] || [['#999', '#666'], ['#999', '#666']];
  let A = nat[0][0], B = nat[0][1];
  if (t.flat) { A = nat[1][0]; B = nat[1][1]; }
  else if (t.mono) { A = '#c3c9ce'; B = '#7d858c'; if (k === 'oro' || k === 'favore' || k === 'star') { A = '#e3b54a'; B = '#9c6c18'; } if (k === 'cibo') { A = '#d9b15a'; B = '#6d5a3a'; } }
  else if (t.gold) { A = 'url(#g)'; B = (k === 'favore' || k === 'oro' || k === 'star' || k === 'pop' || k === 'castle' || k === 'map') ? '#c8382c' : '#f6e7bd'; }
  return { A, B, O: t.O, w: t.w, H: t.H };
}
function icoSVG(k) {
  const P = icoPalette(k); const t = THM().ico;
  const defs = t.gold ? `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2b8"/><stop offset=".55" stop-color="#e2b13a"/><stop offset="1" stop-color="#a8741c"/></linearGradient></defs>` : '';
  const shadow = t.flat ? '' : `<ellipse cx="16" cy="30" rx="10" ry="1.6" fill="rgba(0,0,0,.18)"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">${defs}${shadow}${IDRAW[k](P)}</svg>`;
}
function buildIcons() {
  ICOURL = {}; ICOIMG = {}; let css = '';
  for (const k in IDRAW) {
    const u = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(icoSVG(k)); ICOURL[k] = u;
    css += `.ico-${k}{background-image:url("${u}")}`;
    const im = new Image(); im.src = u; ICOIMG[k] = im;
  }
  let st = document.getElementById('icostyle'); if (!st) { st = document.createElement('style'); st.id = 'icostyle'; document.head.appendChild(st); }
  st.textContent = css;
}
function ICO(k, cls) { return `<i class="ico ico-${k}${cls ? ' ' + cls : ''}"></i>`; }
function applyTheme(name) {
  if (name) { SET.theme = name; saveSet(); }
  const t = THM(); const R = document.documentElement;
  R.dataset.theme = SET.theme;
  R.style.setProperty('--fh', `'${t.fh}', Cinzel, serif`);
  R.style.setProperty('--fb', `'${t.fb}', Lora, Georgia, serif`);
  R.style.setProperty('--fd', SET.theme === 'pergamena' ? `'Cinzel Decorative', Cinzel, serif` : `'${t.fh}', Cinzel, serif`);
  buildIcons();
  if (typeof updateHUD === 'function' && typeof S !== 'undefined' && S && MODE !== 'title') { updateHUD(); if (typeof lastCards !== 'undefined') lastCards = ''; if (typeof BT !== 'undefined' && BT) updateBattleHUD(true); }
}

// ================= UI =================
function toast(msg) { const t = $('#toast'); const d = document.createElement('div'); d.className = 'tmsg'; d.innerHTML = msg; t.appendChild(d); setTimeout(() => d.classList.add('out'), 2600); setTimeout(() => d.remove(), 3200); }
function fmt(n) { n = Math.floor(n); return n >= 10000 ? (n / 1000).toFixed(1) + 'k' : String(n); }
function updateHUD() {
  if (!S) return; const c = caps();
  $('#res').innerHTML = RES.map(r => { const full = r !== 'favore' && S.res[r] >= c[r]; return `<div class="chip${full ? ' full' : ''}" title="${RNAME[r]}" onclick="resInfo('${r}')"><span class="ic">${ICO(r)}</span><span class="v">${fmt(S.res[r])}</span>${r !== 'favore' ? `<span class="cap">/${fmt(c[r])}</span>` : ''}<i style="width:${r === 'favore' ? 0 : Math.min(100, S.res[r] / c[r] * 100)}%"></i></div>`; }).join('');
  const e = ERA(S.mastio);
  const nt = Math.max(0, S.nightIn || 0) * 1000; const mm = Math.floor(nt / 60000), ss = Math.floor(nt / 1000) % 60; const truce = !S.raids;
  if (S.creative) { const qe0 = $('#quest'); if (qe0) qe0.innerHTML = '<span class="ql">🧱 Modalità Creativa</span> <span class="qt">tutto sbloccato · risorse infinite · niente razzie</span>'; }
  const qe = S.creative ? null : $('#quest'); if (qe) { const h = questHTML(); if (qe.dataset.h !== h) { qe.innerHTML = h; qe.dataset.h = h; } qe.classList.toggle('ready', !!(QUESTS[S.mq] && QUESTS[S.mq].c())); }
  $('#era').innerHTML = `<div class="m">${S.creative ? '' : `<span onclick="openArms()" style="cursor:pointer;margin-right:3px">${crestSVG(ARMS(), 13)}</span>`}<b>Mastio ${S.mastio}</b> · <span style="color:${e.hc}">${e.n}</span> · A.D. ${YEAR(S.mastio)}${S.creative || S.sandbox ? '' : ` · <span class="gday" onclick="openDiary()">📅 Giorno ${giorniGioco()} · ⏱ ${oreGioco()}</span>`}</div><div class="n">${truce ? ICO('truce') + ' Tregua: predoni tra' : ICO('moon') + ' Notte tra'} ${mm}:${String(ss).padStart(2, '0')} · ${ICO('pop')} ${popTxt()} · ${ICO('hammer')} ${builders()}/${MAX_BUILDERS}${S.creative ? '' : ` · <span onclick="openMood()" style="cursor:pointer">${umoreWord(umore())[0]} ${umore()}</span>`}</div>`;
}
function resInfo(r) { if (!S) return; const c = caps(); toast(`${ICO(r)} ${RNAME[r]}: ${fmt(S.res[r])}${r !== 'favore' ? ' / ' + fmt(c[r]) + (S.res[r] >= c[r] ? ' — magazzino pieno!' : '') : ''}`); }
function audioHTML(back) {
  const row = (k, lbl, ic) => `<div class="vrow"><div class="vl">${ic} ${lbl}<b id="v_${k}">${Math.round(SET[k] * 100)}%</b></div><input type="range" min="0" max="100" step="5" value="${Math.round(SET[k] * 100)}" oninput="setVol('${k}',+this.value)" ${k === 'fvol' ? `onchange="sfx('coin')"` : ''}></div>`;
  return `<button class="btn ${SET.mute ? '' : 'ghost'} big mute" onclick="toggleMute();${back}">${SET.mute ? '🔇 Audio spento · tocca per riattivare' : '🔊 Audio attivo · tocca per silenziare'}</button>
    <div class="vbox"><div class="vh"><span>🎵 Colonna sonora</span><button class="btn ghost" onclick="musicToggle();${back}">${MUS.on ? 'Attiva' : 'Spenta'}</button></div>${row('mvol', 'Volume musica', '🎼')}</div>
    <div class="vbox"><div class="vh"><span>⚔ Effetti sonori</span><span class="vs">battaglia, costruzioni, campane</span></div>${row('fvol', 'Volume effetti', '🔔')}</div>`;
}
function openMenu(tab) {
  tab = tab || openMenu.tab || 'audio'; openMenu.tab = tab;
  const tabs = [['audio', 'sound', 'Audio'], ['look', 'scroll', 'Layout'], ['diff', 'army', 'Difficoltà'], ['game', 'castle', 'Partita']];
  let body = '';
  if (tab === 'audio') body = audioHTML(`openMenu('audio')`) + sndTestHTML();
  else if (tab === 'look') body = `<div class="lay">${layoutCards(`openMenu('look')`)}</div><h4 style="margin:12px 0 6px">🖥️ Qualità grafica</h4><div class="dif">${Object.keys(QUAL).map(k => `<button class="card ${QQ() === QUAL[k] ? 'on' : ''}" onclick="setQual('${k}')" style="text-align:left"><div class="cn">${QUAL[k].n}${QQ() === QUAL[k] ? ' ✓' : ''}</div><div class="cd">${QUAL[k].d}</div></button>`).join('')}</div>`;
  else if (tab === 'diff') body = `<div class="dif">${diffCards(`openMenu('diff')`)}</div>`;
  else body = `<div class="mlist">
    <button class="btn ghost" onclick="openHelp()">${ICO('scroll')} Come si gioca · missioni</button>
    ${S && !S.creative && !S.sandbox ? `<button class="btn ghost" onclick="openCronache()">📜 Cronache della Marca</button><button class="btn ghost" onclick="openBackups()">🛟 Copie di sicurezza</button><button class="btn ghost" onclick="closeSheet();tutStart()">🕯️ Rifai la guida passo passo</button><button class="btn ghost" onclick="openArms()">🛡️ Stemma della casata</button>` : ''}
    <button class="btn ghost" onclick="save();saveCode()">📋 Copia codice partita<small>salvalo in Note: con Importa la riprendi ovunque</small></button>
    <button class="btn ghost" onclick="save();cloudPush(true);toast(CLOUD.ready ? '💾 Partita salvata anche nel cloud' : '💾 Partita salvata su questo browser')">💾 Salva ora</button>
    ${S && !S.creative && !S.sandbox ? `<button class="btn ghost" onclick="openDiary()">📈 Diario del ritmo<small>quanto dura davvero ogni traguardo</small></button>` : ''}
    <button class="btn ghost" onclick="SET.pace = SET.pace === 'rapido' ? 'normale' : 'rapido'; saveSet(); openMenu('game'); toast(SET.pace === 'rapido' ? '⏩ Ritmo rapido: tutti i tempi ÷10 (per provare)' : '⏱ Ritmo normale')">${SET.pace === 'rapido' ? '⏩ Ritmo: rapido (tempi ÷10)' : '⏱ Ritmo: normale'}<small>tocca per cambiare · il rapido serve per provare il gioco</small></button>
    ${S && !S.creative && !S.sandbox ? `<button class="btn ghost" onclick="newCampaign()">↺ Nuova partita</button>` : ''}
    <button class="btn" onclick="closeSheet();toMenu()">🏠 Menu principale</button></div>`;
  openSheet(ICO('gear') + ' Menu', `<div class="mtabs">${tabs.map(([k, i, n]) => `<button class="${k === tab ? 'on' : ''}" onclick="openMenu('${k}')">${ICO(i)}<span>${n}</span></button>`).join('')}</div><div class="aud mbody">${body}</div>`, 'menu');
}
function openSheet(title, html, key) { if (BLD_NAV && !(key && String(key).startsWith('b:') && BLD_NAV.includes(+String(key).slice(2)))) BLD_NAV = null; setTimeout(() => { try { if (MODE === 'village') tutTick(); } catch (e) { } }, 0); if (typeof closeFolk === 'function' && $('#fcard')) closeFolk(); const s = $('#sheet'); s.dataset.p = key || ''; $('#sheet-t').innerHTML = title; $('#sheet-b').innerHTML = html; s.classList.remove('hidden'); }
function closeSheet() { const s = $('#sheet'); s.classList.add('hidden'); s.dataset.p = ''; if (SC && MODE === 'village' && !placing) { SC.sel = null; SC.selN = null; SC.selA = null; SC.selU = null; } }
function refreshSheet() { const p = $('#sheet').dataset.p; if (!p) return; if (p === 'army') openArmy(); else if (p === 'build') openBuild(); else if (p.startsWith('b:')) { const r = S.buildings.find(b => b.id === +p.slice(2)); if (r) openBuildingInfo(r); } }
const CHIM3 = { casa: [0.62, 0.1], taverna: [0.6, 0.08], fucina: [0.7, 0.08], fattoria: [0.4, 0.12], armeria: [0.65, 0.08], infermeria: [0.6, 0.1], capanna: [0.6, 0.12] };
function openMood() { const v = umore(), w = umoreWord(v), c = caps(), food = (S.res.cibo || 0) / Math.max(1, c.cibo); const row = (ok, t) => `<div class="row">${ok ? '✅' : '▫️'} ${t}</div>`;
  openSheet(`${w[0]} Umore del popolo`, `<p class="desc">Il popolo è <b>${w[1]}</b> (${v}/100). ${v >= 75 ? 'Produzione +5% e ogni tanto una festa in piazza.' : v < 35 ? 'Produzione -10%: il popolo lavora malvolentieri.' : 'Sopra 75 il popolo fa festa e produce di più.'}</p>
    ${row(LIFEC.pr > 0, `✨ Prestigio delle decorazioni: +${Math.round(Math.min(30, LIFEC.pr * 0.6))}`)}${row(countB('taverna') > 0, `🍺 Taverne: +${Math.min(3, countB('taverna')) * 4}`)}${row(hasB('chiesa'), '⛪ Chiesa: +6')}${row(hasB('mercato'), '🏪 Mercato: +4')}
    ${row(food > 0.4, food > 0.4 ? '🌾 Granai pieni: +8' : food < 0.01 ? '🍂 Carestia: -35' : food < 0.12 ? '🌾 Poco cibo: -12' : '🌾 Cibo nella norma')}${S.raidLostT && now() - S.raidLostT < 20 * 60000 ? row(false, '🔥 Razzia persa da poco: -12') : ''}
    ${S.fest && now() < S.fest.end ? '<p class="desc">🎉 <b>Festa in corso!</b></p>' : ''}<div class="acts"><button class="btn" onclick="openBuild('d')">🌷 Decorazioni</button><button class="btn ghost" onclick="closeSheet()">Chiudi</button></div>`, 'mood'); }
// ================= STEMMA DELLA CASATA =================
const ARMS_COL = [['Rosso', '#a8322a'], ['Azzurro', '#1e4a9a'], ['Verde', '#2f6b2f'], ['Nero', '#1c1c1c'], ['Porpora', '#5b2a6e'], ['Oro', '#d4a72c'], ['Argento', '#ece8de']];
const ARMS_DIV = [['pieno', 'Pieno'], ['partito', 'Partito'], ['troncato', 'Troncato'], ['inquartato', 'Inquartato'], ['banda', 'In banda']];
const ARMS_SYM = ['✠', '♔', '⚜', '🦁', '🦅', '🐺', '🐻', '🐗', '🐉', '🗝️', '⚔️', '🌹', '☀️', '🏰'];
const ARMS = () => (S && S.arms) || { c1: '#a8322a', c2: '#d4a72c', div: 'partito', sym: '🦅' };
function crestSVG(a, sz) { a = a || ARMS(); const id = 'cl' + Math.random().toString(36).slice(2, 7); const P = 'M2 2 H38 V20 C38 34 28 42 20 46 C12 42 2 34 2 20 Z';
  const part = a.div === 'partito' ? `<rect x="20" y="0" width="20" height="48" fill="${a.c2}"/>` : a.div === 'troncato' ? `<rect x="0" y="20" width="40" height="28" fill="${a.c2}"/>` : a.div === 'inquartato' ? `<rect x="20" y="0" width="20" height="20" fill="${a.c2}"/><rect x="0" y="20" width="20" height="28" fill="${a.c2}"/>` : a.div === 'banda' ? `<path d="M0 6 L6 0 L40 34 L40 46 Z" fill="${a.c2}"/>` : '';
  return `<svg viewBox="0 0 40 48" width="${sz}" height="${sz * 1.2}" style="vertical-align:middle"><defs><clipPath id="${id}"><path d="${P}"/></clipPath></defs><g clip-path="url(#${id})"><rect width="40" height="48" fill="${a.c1}"/>${part}</g><path d="${P}" fill="none" stroke="#1a1208" stroke-width="2.2"/><text x="20" y="27" font-size="18" text-anchor="middle" dominant-baseline="middle">${a.sym}</text></svg>`; }
function openArms() { if (!S) return; if (!S.arms) S.arms = Object.assign({}, ARMS()); const a = S.arms;
  const chips = (k, list) => list.map(([n, v]) => `<button class="achip ${a[k] === v ? 'on' : ''}" onclick="setArms('${k}','${v}')" title="${n}"><i style="background:${v}"></i></button>`).join('');
  openSheet('🛡️ Stemma della casata', `<div class="arms"><div class="aprev">${crestSVG(a, 92)}</div><p class="desc">Il tuo stemma sventola sugli stendardi del feudo, sulla classifica degli Altri Regni e in cima allo schermo.</p>
    <h4>Campo</h4><div class="arow">${chips('c1', ARMS_COL)}</div><h4>Seconda tintura</h4><div class="arow">${chips('c2', ARMS_COL)}</div>
    <h4>Partizione</h4><div class="arow">${ARMS_DIV.map(([v, n]) => `<button class="achip w ${a.div === v ? 'on' : ''}" onclick="setArms('div','${v}')">${crestSVG(Object.assign({}, a, { div: v, sym: '' }), 22)}<small>${n}</small></button>`).join('')}</div>
    <h4>Figura</h4><div class="arow">${ARMS_SYM.map(v => `<button class="achip s ${a.sym === v ? 'on' : ''}" onclick="setArms('sym','${v}')">${v}</button>`).join('')}</div>
    <div class="acts"><button class="btn" onclick="closeSheet()">✓ Fatto</button></div></div>`, 'arms'); }
function setArms(k, v) { if (!S.arms) S.arms = Object.assign({}, ARMS()); S.arms[k] = v; for (const key in CACHE) if (key.startsWith('stendardo')) delete CACHE[key]; save(); updateHUD(); openArms(); }
const WALL_DIR = ['automatica (segue i pezzi vicini)', 'dritta ↘', 'dritta ↙', 'in diagonale ↕', 'in diagonale ↔'];
function rotDeco(id) { const r = S.buildings.find(b => b.id === id); if (!r) return; r.rot = ((r.rot || 0) + 1) % (BDEF[r.t].wall ? 5 : 4); if (BDEF[r.t].wall) toast('↻ Direzione: ' + WALL_DIR[r.rot]); const b = SC && SC.B.find(x => x.ref === r); if (b) { b.c3k = null; } save(); sfx('tock'); }
let BTAB = 'b';
function openBuild(tab) {
  if (tab) BTAB = tab; const deco = BTAB === 'd';
  const lockMsg = t => { const d = BDEF[t]; const lv = d.max.findIndex(v => v > 0) + 1; return `Mastio ${lv}`; };
  const pr = prestige(), pm = Math.round((prestigeMult() - 1) * 100);
  const tabs = `<div class="btabs"><button class="${deco ? '' : 'on'}" onclick="openBuild('b')">🏠 Edifici</button><button class="${deco ? 'on' : ''}" onclick="openBuild('d')">🌷 Decorazioni</button></div>`
    + (deco ? `<div class="prest"><b>✨ Prestigio ${pr}</b><span>produzione +${pm}%${pm < 20 ? ` · prossimo +1% a ${(Math.floor(pr / 4) + 1) * 4}` : ' · massimo'}</span><i style="width:${Math.min(100, pr / 80 * 100)}%"></i></div>` : '');
  const html = tabs + `<div class="grid">${(deco ? DECOR_ORDER : BUILD_ORDER).map(t => {
    const d = BDEF[t], n = countB(t), m = maxB(t), needReq = d.req && !S.creative && !hasB(d.req), locked = m === 0 || needReq, full = n >= m; const th = d.spr && bThumb(d.spr);
    return `<button class="card ${locked || full ? 'dis' : ''}" ${locked || full ? '' : !canPay(d.cost) ? `onclick="needSheet(BDEF['${t}'].cost,'costruire ${d.n.replace(/'/g, '’')}')"` : `onclick="startPlacement('${t}')"`}>
      <div class="ci">${th ? `<img src="${th}" style="width:46px;height:46px;object-fit:contain">` : d.icon}</div><div class="cn">${d.n}</div>
      <div class="cs">${deco && d.pr ? `✨${d.pr} · ` : ''}${m === 0 ? '🔒 ' + lockMsg(t) : needReq ? '🔒 Serve ' + BDEF[d.req].n : `${n}/${m}`}</div>
      <div class="cc">${costStr(d.cost)}${!locked && !full && !canPay(d.cost) ? `<div class="cneed">${needLabel(d.cost)}</div>` : ''}${d.t && !S.creative ? ` <span class="tm">⏱ ${fmtT(buildSecs(d) * 1000 * seasonBuildMul())}</span>` : ''}</div><div class="cd">${d.desc}</div></button>`;
  }).join('')}</div>`;
  openSheet(ICO('build') + ' Costruisci', html, 'build');
}
// scorri tra gli edifici migliorabili (aperto dal Promemoria)
var BLD_NAV = null;
const bldUpOk = r => r && r.t !== 'mastio' && !BDEF[r.t].wall && !BDEF[r.t].decor && !r.nat && !canUp(r) && canPay(upCost(r));
function bldUps() { return S.buildings.filter(bldUpOk).sort((a, b) => a.lvl - b.lvl || BDEF[a.t].n.localeCompare(BDEF[b.t].n)); }
function bldFocus(r) { const [x, y] = W(r.x + (BDEF[r.t].w || 2) / 2, r.y + (BDEF[r.t].h || 2) / 2); cam.x = x; cam.y = y + 40; }
function bldNav(id) { closeSheet(); let L = bldUps().map(r => r.id); if (!L.includes(id)) L.unshift(id); const i0 = L.indexOf(id); L = L.slice(i0).concat(L.slice(0, i0)); BLD_NAV = L.length > 1 ? L : null; const r = S.buildings.find(b => b.id === id); if (!r) return; bldFocus(r); SC.sel = SC.B.find(b => b.ref === r) || null; openBuildingInfo(r); }
function bldGo(d) { if (!BLD_NAV) return; const cur = +($('#sheet').dataset.p || '').slice(2); let i = BLD_NAV.indexOf(cur); const n = BLD_NAV.length; const ok = BLD_NAV.filter(id => bldUpOk(S.buildings.find(b => b.id === id)));
  for (let k = 0; k < n; k++) { i = (i + d + n) % n; const r = S.buildings.find(b => b.id === BLD_NAV[i]); if (r && (!ok.length || bldUpOk(r))) { sfx('click'); bldFocus(r); SC.sel = SC.B.find(b => b.ref === r) || null; openBuildingInfo(r); return; } } }
function bldNavHTML(r) { if (!BLD_NAV || !BLD_NAV.includes(r.id)) return ''; const ok = BLD_NAV.filter(id => bldUpOk(S.buildings.find(b => b.id === id))).length, free = maxBuilders() - builders();
  return `<div class="bnav"><button onclick="bldGo(-1)" aria-label="Precedente">‹</button><div><span>⬆ ${BLD_NAV.indexOf(r.id) + 1} di ${BLD_NAV.length} · <b>${ok}</b> migliorabili · 🔨 ${free > 0 ? free + ' mastr' + (free > 1 ? 'i' : 'o') + ' liber' + (free > 1 ? 'i' : 'o') : 'mastri tutti occupati'}</span>${ok && free > 0 ? `<button class="btn sm" onclick="bldUpAll()">⬆ Migliora tutti<small>${Math.min(ok, free)} ora</small></button>` : ''}</div><button class="${!bldUpOk(r) && ok && free > 0 ? 'go' : ''}" onclick="bldGo(1)" aria-label="Successivo">›</button></div>`; }
function bldUpAll() { if (!BLD_NAV) return; let n = 0; const names = [];
  for (const id of BLD_NAV.slice().sort((a, b) => (S.buildings.find(x => x.id === a) || {}).lvl - (S.buildings.find(x => x.id === b) || {}).lvl)) { const r = S.buildings.find(b => b.id === id); if (!bldUpOk(r)) continue; const t = upTime(r); if (t && builders() >= maxBuilders()) break;
    pay(upCost(r)); if (resOf(r)) collect(r); if (t && !S.creative) { r.end = now() + t * 1000; r.dur = t * 1000; r.toLvl = r.lvl + 1; } else r.lvl++; n++; names.push(BDEF[r.t].n); }
  if (!n) { toast('Niente da migliorare adesso'); return; } sfx('build'); SC = buildVillage(); save(); updateHUD();
  const left = BLD_NAV.filter(id => bldUpOk(S.buildings.find(b => b.id === id))).length;
  toast(`⬆ In miglioramento: ${names.join(', ')}${left ? ` · altri ${left} quando si liberano i mastri d'opera` : ''}`);
  const cur = S.buildings.find(b => b.id === +($('#sheet').dataset.p || '').slice(2)); if (cur) openBuildingInfo(cur); }
function openBuildingInfo(r) {
  const d = BDEF[r.t]; const why = canUp(r); const res = resOf(r);
  let body = `${bldNavHTML(r)}<p class="desc">${d.desc}</p>${r.t === 'cripta' ? cryptHTML() : ''}${r.t === 'mastio' ? crownHTML() : ''}<div class="stats">`;
  body += `<span>Livello <b>${r.lvl}</b>${r.end ? ` → ${r.toLvl}` : ''}</span><span>Vita <b>${Math.round(d.hp * (1 + 0.35 * (r.lvl - 1)))}</b></span>`;
  if (res) body += `<span>${ICO(res)} <b>${rateOf(r) < 1 ? rateOf(r).toFixed(1) : Math.round(rateOf(r))}</b>/min</span><span>In deposito <b>${Math.floor(r.stock || 0)}</b>/${stockCap(r)}</span>`;
  if (d.store) body += `<span>Capienza ${Object.keys(d.store).map(k => ICO(k) + ' +' + d.store[k] * r.lvl).join(' ')}</span>`;
  if (d.pop) body += `<span>👥 Popolazione <b>+${d.pop * r.lvl}</b></span>`;
  if (d.arms) body += `<span>🗡️ Danno truppe <b>+${Math.round(d.arms * r.lvl * 100)}%</b></span>`;
  if (d.cure) body += `<span>✚ Recupero caduti <b>${Math.min(60, Math.round(d.cure * r.lvl * 100))}%</b></span>`;
  if (d.shoot) body += `<span>Gittata <b>${d.shoot.range}</b> · Danno <b>${Math.round(d.shoot.dmg * (1 + 0.3 * (r.lvl - 1)))}</b></span>`;
  body += `</div>`;
  if (r.end) { body += `<div class="note">🔨 Lavori in corso: ancora ${fmtT(r.end - now())}</div>`; }
  if (r.t === 'mastio') {
    const nx = r.lvl + 1;
    if (nx <= 8) {
      const un = []; for (const t of BUILD_ORDER) { const m0 = BDEF[t].max[r.lvl - 1], m1 = BDEF[t].max[nx - 1]; if (m1 > m0) un.push(`${BDEF[t].icon} ${BDEF[t].n} ${m0 ? `(${m0}→${m1})` : '(nuovo)'}`); }
      for (const k of UNIT_ORDER) if (UDEF[k].lv === nx) un.push(`⚔ ${UDEF[k].n}`); for (const k in HDEF) if (HDEF[k].lv === nx) un.push(`♔ Eroe: ${HDEF[k].n}`);
      if (nx % 2 === 0) un.push(`⬆ Edifici fino al livello ${Math.min(4, 1 + Math.floor(nx / 2))}`);
      if (nx === 5) un.push('🧱 Mura di pietra');
      body += `<div class="unl"><b>Livello ${nx} — ${ERA(nx).n}, A.D. ${YEAR(nx)}</b><br><i>${MASTIO_DESC[nx]}</i><br>${un.join(' · ')}</div>`;
    }
  }
  body += `<div class="acts">`;
  if (r.t === 'mercato' && !r.end) body += `<button class="btn" onclick="openMarket()">⚖ Commercia<small>compra e vendi risorse</small></button><button class="btn ghost" onclick="openDiplo()">🤝 Diplomazia</button>`;
  if (d.decor && d.rm) { if (workOn('obj', r.id)) body += `<button class="btn dis">🪓 In rimozione… ${fmtT(workOn('obj', r.id).end - now())}</button>`; else if (r.nat) body += `<button class="btn" onclick="removeObj(${r.id})">✖ Rimuovi<small>${Object.keys(d.rm.cost).length ? costStr(d.rm.cost) : 'gratis'} · ⏱ ${d.rm.t || 4}s → ${Object.keys(d.rm.gain).map(k => ICO(k) + ' +' + d.rm.gain[k]).join(' ')}${r.t === 'funghi' ? ' (+👑?)' : ''}</small></button>`; else body += `<button class="btn" onclick="removeObj(${r.id})">✖ Rimuovi<small>${costStr({ cibo: 5 })} · ⏱ 3s · rimborso ${Object.keys(d.cost).map(k => ICO(k) + ' ' + Math.floor(d.cost[k] / 2)).join(' ')}</small></button>`; }
  else if (!why) body += `<button class="btn" onclick="doUpgrade(${r.id})">⬆ Migliora a liv. ${r.lvl + 1}<small>${costStr(upCost(r))} ${upTime(r) ? '· ⏱ ' + fmtT(upTime(r) * 1000) : ''}</small></button>`;
  else if (!d.decor) body += `<button class="btn dis">⬆ ${why}</button>`;
  if (res && r.stock >= 1) body += `<button class="btn" onclick="collect(S.buildings.find(b=>b.id===${r.id}));openBuildingInfo(S.buildings.find(b=>b.id===${r.id}))">${ICO(res)} Raccogli ${Math.floor(r.stock)}</button>`;
  let extra = '';
  if (r.t === 'mercato' && !r.end) extra += `<h4>Scambi del Mercato</h4><div class="acts">${TRADES.map((t, i) => `<button class="btn sm" onclick="doTrade(${i},${r.id})">${costStr(t.give)} → ${Object.entries(tradeGet(t)).map(e => ICO(e[0]) + ' ' + e[1]).join(' ')}</button>`).join('')}</div>`;
  if (r.t === 'accademia' && !r.end) extra += `<h4>Ricerche (max liv. ${Math.min(5, lvlSum('accademia') * 2)})</h4><div class="ulist">${Object.keys(TECH).map(k => { const T = TECH[k], l = tech(k); return `<div class="urow"><div class="uimg" style="display:flex;align-items:center;justify-content:center;font-size:28px">${T.icon}</div><div class="uinfo"><b>${T.n}</b> <span class="cnt">liv. ${l}</span><div class="role">${T.d}</div></div><div class="ubtn">${l < 5 ? `<button class="btn sm" onclick="doResearch('${k}',${r.id})">Studia<small>${costStr(T.cost(l + 1))}</small></button>` : '<span class="ok">Max</span>'}</div></div>`; }).join('')}</div>`;
  if (d.army || r.t === 'monastero' || r.t === 'scuderia') body += `<button class="btn" onclick="openArmy()">⚔ Addestra</button>`;
  if (r.t === 'muro' && S.mastio >= 5) body += `<button class="btn" onclick="upgradeAllWalls()">🧱 Tutte in pietra<small>🪨 12 l'una</small></button>`;
  if (r.nat) body = body.replace('<p class="desc">', '<p class="desc"><b>Ostacolo naturale.</b> Impedisce di costruire qui: rimuovilo per liberare spazio e ottenere risorse. ');
  if (r.t !== 'mastio' && !(d.decor && d.rm)) body += workOn('demo', r.id) ? `<button class="btn dis">🔨 Demolizione… ${fmtT(workOn('demo', r.id).end - now())}</button>` : `<button class="btn ghost" onclick="demolish(${r.id})">🔨 Demolisci<small>${costStr({ cibo: 10 * r.lvl })} · ⏱ ${Math.max(4, Math.round((d.t || 4) * 0.6 * r.lvl))}s · rimborso 30%</small></button>`;
  if (r.t !== 'mastio' && !r.nat) body += `<button class="btn ghost" onclick="startPlacement('${r.t}', S.buildings.find(b=>b.id===${r.id}))">✥ Sposta</button>`;
  if ((d.decor && DFIT[r.t] && !DYAW_RND[r.t]) || d.wall) body += `<button class="btn ghost" onclick="rotDeco(${r.id})">↻ Ruota</button>`;
  body += `</div>`;
  body = body.replace('<div class="acts">', extra + '<div class="acts">');
  openSheet(`${d.icon} ${d.n}`, body, 'b:' + r.id);
}
function unitRow(k) {
  const d = UDEF[k]; const ok = unlockedUnit(k);
  const lockTxt = ok ? '' : S.mastio < d.lv ? `Mastio ${d.lv}` : !hasB(d.at) ? `serve ${(BDEF[d.at] || {}).n || d.at}` : d.need ? `serve ${(BDEF[d.need] || {}).n || d.need}` : '';
  const thumb = FR[k + '.idleF'];
  return `<div class="urow ${ok ? '' : 'dis'}"><div class="uimg" style="${thumbStyle(k)}"></div>
   <div class="uinfo"><b>${d.n}</b> <span class="cnt">×${S.army[k] || 0}</span><div class="role">${d.role}</div>
   <div class="ust">❤ ${d.hp} · ⚔ ${d.dmg} · ${d.ranged ? '🏹 ' + d.rng : 'mischia'} · 👥 ${d.sp}</div></div>
   <div class="ubtn">${ok ? `<button class="btn sm" onclick="train('${k}',1)">+1<small>${costStr(d.cost)}</small></button><button class="btn sm" onclick="train('${k}',5)">+5</button>` : `<span class="lock">🔒 ${lockTxt}</span>`}</div></div>`;
}
let THUMB_URL = null;
// ritratto dal modello 3D animato (posa da fermo)
const A3PORT = {};
function anim3dPortrait(k) { const A = ANIM3D[k]; if (!A) return ''; if (A3PORT[k]) return A3PORT[k]; const o = G3.models[A.k]; if (!o) { need3d(A.k); return ''; } if (!o.ready) return '';
  const sp = g3sprite(a3key(A, 'idle0'), 150, 0.45, 0); if (!sp) return ''; const cv2 = document.createElement('canvas'); cv2.width = 120; cv2.height = 148; const s = 205 / -sp.y0; cv2.getContext("2d").drawImage(sp.cv, 56 + sp.x0 * s, 172 + sp.y0 * s, sp.w * s, sp.h * s); return A3PORT[k] = cv2.toDataURL(); }
function thumbStyle(k) {
  if (ANIM3D[k]) { const u = anim3dPortrait(k); if (u) return `background-image:url(${u});background-size:contain;background-repeat:no-repeat;background-position:center bottom;`; }
  if (UDEF[k] && UDEF[k].siege) return `background-image:url(${siegeThumb(k)});background-size:contain;background-repeat:no-repeat;background-position:center bottom;`;
  if (HDEF[k] && HDEF[k].model) { const u = heroPortrait(k); return u ? `background-image:url(${u});background-size:contain;background-repeat:no-repeat;background-position:center bottom;` : ''; }
  const f = FR[k + '.idleF']; if (!f) return '';
  const s = 54 / f[3];
  return `background-image:url(${ATL.src});background-size:${ATLW * s}px ${ATLH * s}px;background-position:${-f[0] * s + (54 - f[2] * s) / 2}px ${-f[1] * s}px;`;
}
function openArmy() {
  for (const k in ANIM3D) if (!A3PORT[k]) { let n = 0; const tk = () => { if ($('#sheet').dataset.p !== 'army' || A3PORT[k] || ++n > 30) return; if (anim3dPortrait(k)) openArmy(); else setTimeout(tk, 1000); }; setTimeout(tk, 800); }
  const q = S.queue.length ? `<div class="queue">In addestramento: ${S.queue.slice(0, 12).map((q, i) => `<span class="${i === 0 ? 'act' : ''}">${UDEF[q.k].n.split(' ')[0]}</span>`).join('')}${S.queue.length > 12 ? ' …' : ''}</div>` : '';
  const hs = Object.keys(HDEF).map(k => { const h = HDEF[k]; const ok = S.mastio >= h.lv; return `<div class="urow hero ${ok ? '' : 'dis'}"><div class="uimg" style="${thumbStyle(k)}"></div><div class="uinfo"><b>${h.n}</b> <span class="cnt">${h.title}</span><div class="role"><b>${h.ult}:</b> ${h.ultd}</div><div class="ust">❤ ${h.hp} · ⚔ ${h.dmg} · ${h.ranged ? '🏹 ' + h.rng : 'mischia'}</div></div><div class="ubtn">${ok ? '<span class="ok">Giurato ✓</span>' : `<span class="lock">🔒 Mastio ${h.lv}</span>`}</div></div>`; }).join('');
  const html = `<div class="capbar"><span>👥 Popolazione ${armyUsed()}/${armyCap()} · 🗡️ Armi +${Math.round((armsMult() - 1) * 100)}% · ✚ Cure ${Math.round(curePct() * 100)}%</span><i style="width:${Math.min(100, armyUsed() / armyCap() * 100)}%"></i></div>${q}
   <div class="ulist">${UNIT_ORDER.map(unitRow).join('')}</div><h4>Eroi</h4><div class="ulist">${hs}</div>`;
  openSheet(ICO('army') + ' Esercito', html, 'army');
}
// ================= GUIDA DEI PRIMI 10 MINUTI: il Siniscalco ti accompagna passo passo =================
const TUT = [
  { t: 'Benvenuto, mio signore', x: 'Sono il vostro Siniscalco. Questo è il Mastio di legno che vostro padre vi ha lasciato. Vi mostro come far crescere il feudo: ci vorrà qualche minuto.', next: 'Cominciamo' },
  { t: 'Raccogli le monete', x: 'Le botteghe producono da sole. Quando sopra un edificio compare un\'icona, toccala per raccogliere. Tocca la moneta sopra il Mastio.', world: () => { const b = SC.B.find(b => b.t === 'mastio'); return b && [b.x + b.w / 2, b.y + b.h / 2, 110]; }, done: () => (S.collects || 0) > 0, prep: () => { const m = S.buildings.find(b => b.t === 'mastio'); if (m) m.stock = Math.max(m.stock || 0, 40); } },
  { t: 'Costruisci la Taverna', x: 'La Taverna dà cibo al borgo ed è la vostra prima missione. Tocca «Costruisci», scegli la Taverna e posizionala dove preferite.', el: () => $('#hud-bot .hb'), done: () => (placing && placing.t === 'taverna') || S.buildings.some(b => b.t === 'taverna') },
  { t: 'Conferma il posto', x: 'Spostala col dito o con le frecce, poi tocca ✓ per far partire i lavori. I mastri d\'opera ci metteranno qualche minuto.', el: () => placing && $('#placebar .pbtn.ok'), skipIf: () => S.buildings.some(b => b.t === 'taverna'), done: () => S.buildings.some(b => b.t === 'taverna') },
  { t: 'Addestra i soldati', x: 'Di notte arrivano i predoni. Tocca «Esercito» e addestra qualche Miliziano: costano solo cibo.', el: () => $('#hud-bot .hb:nth-child(2)'), done: () => S.queue.length > 0 || (S.tutArmy != null && Object.values(S.army).reduce((a, b) => a + b, 0) > S.tutArmy), prep: () => { S.tutArmy = Object.values(S.army).reduce((a, b) => a + b, 0); } },
  { t: 'Conosci la tua gente', x: 'Ogni contadino e soldato ha un nome e può crescere. Tocca una persona che cammina per il villaggio.', world: () => { const u = SC.U.find(u => !u.dead && u.side === 'V' && u.home); return u && [u.x, u.y, 46]; }, done: () => !!(SC.folkU) },
  { t: 'Il Promemoria', x: 'Quando non sapete cosa fare, toccate la pergamena: vi dico io cosa attende la vostra attenzione.', el: () => $('#memob'), done: () => $('#sheet').dataset.p === 'memo' },
  { t: 'Le missioni', x: 'In alto c\'è la missione del capitolo. Quando è compiuta compare «Riscuoti»: la ricompensa vi aiuta a crescere. Finite la Taverna e riscuotetela.', el: () => $('#quest'), done: () => S.mq >= 1 },
  { t: 'Il feudo è vostro', x: 'Ora sapete l\'essenziale. Dalla «Mappa» potrete assediare i vicini, trattare con i signori e commerciare. Che le campane suonino il vostro nome!', next: 'Al lavoro!' },
];
let TUT_SHOWN = -1;
function tutActive() { return S && !S.creative && !S.sandbox && S.tut != null && S.tut >= 0 && S.tut < TUT.length; }
function tutStart() { S.tut = 0; TUT_SHOWN = -1; }
function tutSkip() { S.tut = -1; tutHide(); save(); toast('Guida chiusa: la trovi in Menu → Partita'); }
function tutNext() { S.tut++; TUT_SHOWN = -1; sfx('click'); if (S.tut >= TUT.length) { S.tut = -1; tutHide(); } save(); }
function tutHide() { const b = $('#tutb'), a = $('#tuta'); if (b) b.classList.add('hidden'); if (a) a.classList.add('hidden'); }
// suggerimenti brevi quando la finestra giusta è aperta
const TUT_MINI = { 2: { build: 'Scegli la Taverna nell\'elenco' }, 4: { army: 'Tocca «+1» sul Miliziano' } };
function tutTick() {
  if (!tutActive() || MODE !== 'village') { tutHide(); return; }
  const st = TUT[S.tut]; if (st.skipIf && st.skipIf()) { tutNext(); return; }
  if (st.done && st.done()) { sfx('coin'); tutNext(); return; }
  let b = $('#tutb'); if (!b) { b = document.createElement('div'); b.id = 'tutb'; document.body.appendChild(b); } let a = $('#tuta'); if (!a) { a = document.createElement('div'); a.id = 'tuta'; a.textContent = '👇'; document.body.appendChild(a); }
  const sp = !$('#sheet').classList.contains('hidden') ? $('#sheet').dataset.p : '';
  const fcard = $('#fcard') && !$('#fcard').classList.contains('hidden'), ask = $('#askd') && !$('#askd').classList.contains('hidden'), story = $('#story') && !$('#story').classList.contains('hidden');
  const mini = sp && TUT_MINI[S.tut] && TUT_MINI[S.tut][sp];
  // con una finestra aperta la guida si fa da parte: niente sovrapposizioni
  if (ask || story || fcard || (sp && !mini)) { tutHide(); TUT_SHOWN = -2; return; }
  const key = mini ? 'm' + S.tut : S.tut;
  if (TUT_SHOWN !== key) { if (TUT_SHOWN !== -2 && !mini && st.prep && TUT_SHOWN !== 'm' + S.tut) st.prep(); TUT_SHOWN = key;
    b.className = mini ? 'mini' : '';
    b.innerHTML = mini ? `<div class="tav">🕯️</div><div class="ttx"><small>Guida · ${S.tut + 1}/${TUT.length}</small><b>${mini}</b></div>`
      : `<div class="tav">🕯️</div><div class="ttx"><small>Guida · ${S.tut + 1}/${TUT.length}</small><b>${st.t}</b><p>${st.x}</p><div class="tbt">${st.next ? `<button class="btn" onclick="tutNext()">${st.next}</button>` : ''}<button class="btn ghost" onclick="tutSkip()">Salta guida</button></div></div>`; }
  b.classList.remove('hidden'); b.classList.toggle('top', !!placing && !mini);
  // freccia: solo senza finestre aperte, e mai sotto la nuvoletta
  let pt = null;
  if (!sp) { if (st.el) { const e = st.el(); if (e && e.offsetParent !== null) { const r = e.getBoundingClientRect(); pt = [r.left + r.width / 2, r.top]; } }
    else if (st.world) { const w = st.world(); if (w) { const [px, py] = W(w[0], w[1]); pt = [(px - cam.x) * cam.z + VW / 2, (py - cam.y) * cam.z + VH / 2 - w[2] * cam.z]; } } }
  const br = b.getBoundingClientRect(); if (pt && pt[1] - 46 < br.bottom && pt[1] > br.top - 10 && pt[0] > br.left && pt[0] < br.right && !(st.el && st.el() && st.el().closest && st.el().closest('#hud-bot'))) pt = null;
  if (pt && pt[0] > 0 && pt[0] < VW && pt[1] > 0 && pt[1] < VH) { a.style.left = (pt[0] - 18) + 'px'; a.style.top = (pt[1] - 46) + 'px'; a.classList.remove('hidden'); } else a.classList.add('hidden');
}
// ================= MEMO: la pergamena delle cose da fare =================
function memoItems() {
  if (!S || S.creative || MODE !== 'village') return []; const it = []; const add = (pri, ic, t, sub, act, lbl) => it.push({ pri, ic, t, sub, act, lbl });
  // missione pronta
  const q = QUESTS[S.mq]; if (q && q.c()) add(0, '📜', 'Missione compiuta: riscuoti!', q.t, 'claimQuest();openMemo()', 'Riscuoti');
  // missione bloccata dai materiali
  { const qc = questCost(); if (qc && Object.keys(lacking(qc.cost)).length) add(1, '🧱', `Per ${qc.what} manca qualcosa`, needLabel(qc.cost), `questNeed()`, 'Dove trovarlo'); }
  // razzia in arrivo
  if (S.raids != null && S.nightIn > 0 && S.nightIn <= 180) add(0, '🔥', `Predoni tra ${fmtT(S.nightIn * 1000)}`, 'Controlla mura, torri ed esercito', "closeSheet();openArmy()", 'Esercito');
  // raccolto
  const ready = S.buildings.filter(r => !r.end && resOf(r) && r.stock >= Math.max(1, stockCap(r) * 0.15)); if (ready.length) { const tot = {}; for (const r of ready) { const k = resOf(r); tot[k] = (tot[k] || 0) + Math.floor(r.stock); } add(1, '🧺', `${ready.length} botteghe da raccogliere`, Object.keys(tot).map(k => ICO(k) + ' ' + fmt(tot[k])).join('  '), 'memoCollect()', 'Raccogli tutto'); }
  // magazzini pieni
  const c = caps(); const full = RES.filter(r => r !== 'favore' && S.res[r] >= c[r] * 0.97); if (full.length) add(1, '📦', 'Magazzino pieno', full.map(r => ICO(r) + ' ' + RNAME[r]).join(', ') + ': spendi o costruisci un Granaio', "closeSheet();openBuild()", 'Costruisci');
  // mastri d'opera liberi
  const free = maxBuilders() - builders(); if (free > 0) { const m = S.buildings.find(b => b.t === 'mastio'); const mc = m && !m.end && !canUp(m) ? upCost(m) : null; if (mc && canPay(mc)) add(1, '🏰', `Puoi alzare il Mastio al livello ${m.lvl + 1}`, 'Sblocca edifici, truppe e la prossima era', `closeSheet();openBuildingInfo(S.buildings.find(b=>b.t==='mastio'))`, 'Vai');
    else add(2, '🔨', `${free} mastr${free > 1 ? 'i' : 'o'} d'opera senza lavoro`, 'Costruisci o migliora un edificio', "closeSheet();openBuild()", 'Costruisci'); }
  // edifici migliorabili ora
  if (free > 0) { const ups = S.buildings.filter(r => r.t !== 'mastio' && !BDEF[r.t].wall && !BDEF[r.t].decor && !r.nat && !canUp(r) && canPay(upCost(r))); if (ups.length) { const r = ups.sort((a, b) => a.lvl - b.lvl)[0]; add(2, '⬆', `${ups.length} edifici migliorabili`, `Per esempio ${BDEF[r.t].n} al livello ${r.lvl + 1}`, `bldNav(${r.id})`, 'Mostra'); } }
  // persone con punti da spendere
  const pts = []; for (const k in (S.vets || {})) for (const r of S.vets[k]) if (r.pts) pts.push(r); for (const k in (S.wrk || {})) if (S.wrk[k].pts) pts.push(S.wrk[k]); for (const k in (S.hrec || {})) if (S.hrec[k].pts) pts.push(S.hrec[k]);
  if (pts.length) add(1, '⭐', `${pts.length} ${pts.length > 1 ? 'persone hanno' : 'persona ha'} punti da spendere`, pts.slice(0, 3).map(r => r.nm).join(', ') + (pts.length > 3 ? '…' : ''), `memoFolk(${pts[0].id})`, 'Mostra');
  // persone da addestrare
  const busyT = new Set((S.works || []).filter(w => w.kind === 'train').map(w => w.rid)); const all = []; for (const k in (S.wrk || {})) all.push(S.wrk[k]); for (const k in (S.vets || {})) for (const r of S.vets[k]) all.push(r);
  const tr = all.filter(r => !busyT.has(r.id) && r.lvl < FOLK_MAX() && canPay(trainCost(r))).sort((a, b) => a.lvl - b.lvl);
  if (tr.length && !busyT.size) add(3, '🎯', 'Nessuno si sta addestrando', `${tr[0].nm} può salire di livello`, `memoFolk(${tr[0].id})`, 'Addestra');
  // esercito
  if (!S.queue.length && armyUsed() < armyCap()) add(3, '⚔', 'La caserma è ferma', `Posti liberi nell'esercito: ${armyCap() - armyUsed()}`, "closeSheet();openArmy()", 'Addestra');
  // diplomazia
  const reqs = typeof feudi === 'function' ? feudi().filter(f => f.req) : []; if (reqs.length) add(1, '🤝', `${reqs.length} ${reqs.length > 1 ? 'signori aspettano' : 'signore aspetta'} una risposta`, reqs.map(f => `${fBase(f).lord} (scade ${fmtT(f.req.left * 1000)})`).join(', '), "closeSheet();openDiplo()", 'Diplomazia');
  if (typeof feudi === 'function') { const g = feudi().find(f => f.st !== 'guerra' && now() >= (f.gift || 0) && f.rel < 60 && canPay(giftCost(f))); if (g && S.mq >= 10) add(3, '🎁', `Puoi mandare un dono a ${fBase(g).lord}`, `Rapporto: ${relWord(g.rel)}`, "closeSheet();openDiplo()", 'Diplomazia'); }
  // stagione in arrivo
  const si = seasonInfo(); if (si.left < 30 * 60000) { const n = SEASONS[(si.i + 1) % 4]; add(2, n.ic, `${n.n} tra ${fmtT(si.left)}`, n.fx + (n.k === 'inverno' ? ' · fai scorte di cibo' : n.k === 'autunno' ? ' · ottimo per vendere il grano dopo' : ''), "closeSheet();openWeather()", 'Meteo'); }
  if (!S.arms && S.mq >= 1) add(3, '🛡️', 'Scegli lo stemma della casata', 'Colori e figura per stendardi e bandiere', 'openArms()', 'Stemma');
  if (prestige() < 6 && S.mastio >= 2) add(4, '🌷', 'Abbellisci il borgo', 'Le decorazioni danno Prestigio: più produzione e un popolo felice', "closeSheet();openBuild('d')", 'Decorazioni');
  // caccia
  if ((S.hunted || 0) < 3 && S.fauna && S.fauna.some(a => !FAUNA[a.k].need)) add(4, '🏹', 'Animali da cacciare nei boschi', 'Tocca un cervo, una capra o una lepre sulla mappa', null, '');
  return it.sort((a, b) => a.pri - b.pri);
}
function memoCollect() { let n = 0; for (const r of S.buildings) if (!r.end && resOf(r) && r.stock >= 1) { if (collect(r)) n++; } if (SC) for (const b of SC.B) b.bubble = null; toast(`🧺 Raccolto da ${n} botteghe`); save(); openMemo(); }
// scorri tra le persone con punti da spendere (aperto dal Promemoria)
let FOLK_NAV = null;
function folkUnit(id) { if (!SC) return null; const u = SC.U.find(u => !u.dead && u.side === 'V' && folkOf(u) && folkOf(u).id === id); if (u) return u;
  // non cammina per il villaggio (in caserma o a riposo): scheda "virtuale" vicino all'edificio
  const at = t => { const b = S.buildings.find(b => b.t === t) || S.buildings.find(b => b.t === 'mastio'); return b ? [b.x + (BDEF[b.t].w || 2) / 2, b.y + (BDEF[b.t].h || 2) / 2] : [N / 2, N / 2]; };
  for (const k in (S.vets || {})) { const i = S.vets[k].findIndex(r => r.id === id); if (i >= 0) { const [x, y] = at(UDEF[k] && UDEF[k].at || 'caserma'); return { k, vi: i, wrec: S.vets[k][i], x, y, d: UDEF[k], fake: 1 }; } }
  for (const k in (S.hrec || {})) if (S.hrec[k].id === id && HDEF[k]) { const [x, y] = at('mastio'); return { k, hero: 1, wrec: S.hrec[k], x, y, d: HDEF[k], fake: 1 }; }
  return null; }
function folkFocus(u) { const [x, y] = W(u.x, u.y); cam.x = x; cam.y = y + 60; cam.z = Math.max(cam.z, 1.3); }
function folkWithPts() { const L = []; for (const k in (S.vets || {})) for (const r of S.vets[k]) if (r.pts) L.push(r.id); for (const k in (S.wrk || {})) if (S.wrk[k].pts) L.push(S.wrk[k].id); for (const k in (S.hrec || {})) if (S.hrec[k].pts) L.push(S.hrec[k].id); return L.filter(folkUnit); }
function memoFolk(id) { closeSheet(); let L = folkWithPts(); if (!L.includes(id)) L.unshift(id); const i0 = L.indexOf(id); L = L.slice(i0).concat(L.slice(0, i0)); const u = folkUnit(id) || L.map(folkUnit).find(Boolean);
  if (u) { FOLK_NAV = L.length > 1 ? L : null; folkFocus(u); openFolk(u); } else toast('Nessuno da migliorare in questo momento'); }
function folkGo(d) { if (!FOLK_NAV || !SC || !SC.folkU) return; const cur = folkOf(SC.folkU).id; let i = FOLK_NAV.indexOf(cur); const n = FOLK_NAV.length;
  // salta chi ha già speso tutto, se qualcuno ha ancora punti
  const rest = FOLK_NAV.filter(id => { const u = folkUnit(id); return u && folkOf(u).pts; });
  for (let k = 0; k < n; k++) { i = (i + d + n) % n; const u = folkUnit(FOLK_NAV[i]); if (u && (!rest.length || folkOf(u).pts || rest.length === 1 && rest[0] === cur)) { sfx('click'); folkFocus(u); openFolk(u); return; } } }
function folkNavHTML(rec) { if (!FOLK_NAV || !FOLK_NAV.includes(rec.id)) return ''; const left = FOLK_NAV.filter(id => { const u = folkUnit(id); return u && folkOf(u).pts; }).length;
  return `<div class="fnav"><button onclick="folkGo(-1)" aria-label="Precedente">‹</button><span>${left ? `⭐ ${FOLK_NAV.indexOf(rec.id) + 1} di ${FOLK_NAV.length} · <b>${left}</b> con punti da spendere` : '✓ Tutti i punti sono stati spesi'}</span><button class="${!rec.pts && left ? 'go' : ''}" onclick="folkGo(1)" aria-label="Successivo">›</button></div>${left ? `<button class="fall" onclick="folkSpendAll()">⭐ Migliora tutti <small>spende i punti di ${left} ${left > 1 ? 'persone' : 'persona'} in modo bilanciato</small></button>` : ''}`; }
function spendRec(rec, sold) { const keys = sold ? ['str', 'vit', 'def'] : ['abi', 'spd']; const cap = 5 + Math.floor(rec.lvl / 3); let n = 0;
  while (rec.pts > 0) { const k = keys.filter(k => (rec[k] || 0) < cap).sort((a, b) => (rec[a] || 0) - (rec[b] || 0))[0]; if (!k) break; rec[k] = (rec[k] || 0) + 1; rec.pts--; n++; } return n; }
function folkSpendAll() { if (!FOLK_NAV) return; let pp = 0, ppl = 0; for (const id of FOLK_NAV) { const u = folkUnit(id); if (!u) continue; const rec = folkOf(u); if (!rec || !rec.pts) continue; const sold = !!UDEF[u.k] || !!(u.hero && HDEF[u.k]); const n = spendRec(rec, sold); if (n) { pp += n; ppl++; if (!sold && u.d && !u.fake && rec.spd) u.d.spd = 0.7 * (1 + 0.1 * rec.spd); } }
  if (!pp) { toast('Nessun punto da spendere'); return; } sfx('coin'); save(); toast(`⭐ ${pp} punt${pp > 1 ? 'i' : 'o'} spes${pp > 1 ? 'i' : 'o'} su ${ppl} ${ppl > 1 ? 'persone' : 'persona'}`); if (SC && SC.folkU) openFolk(SC.folkU); }
function openMemo() {
  const it = memoItems();
  openSheet('📜 Promemoria del Siniscalco', it.length ? `<p class="desc"><i>«Mio signore, ecco cosa attende la vostra attenzione.»</i></p><div class="memo">${it.map(x => `<div class="mi p${x.pri}"><span class="mic">${x.ic}</span><div class="mt"><b>${x.t}</b><small>${x.sub}</small></div>${x.act ? `<button class="btn ${x.pri <= 1 ? '' : 'ghost'}" onclick="${x.act}">${x.lbl}</button>` : ''}</div>`).join('')}</div>` : `<div class="memo0"><div>🕯️</div><p><i>«Tutto è in ordine, mio signore. Il feudo lavora per voi.»</i></p></div>`, 'memo');
}
let MEMO_T = 0;
function memoTick(dt) { MEMO_T -= dt; if (MEMO_T > 0) return; MEMO_T = 1; const el = $('#memob'); if (!el) return; if (!S || S.creative || MODE !== 'village') { el.classList.add('hidden'); return; } el.classList.remove('hidden'); const it = memoItems(); const urgent = it.filter(x => x.pri <= 1).length; const b = el.querySelector('b'); b.textContent = it.length; b.style.display = it.length ? '' : 'none'; el.classList.toggle('urg', urgent > 0); if ($('#sheet').dataset.p === 'memo' && (el.dataset.n !== String(it.length))) openMemo(); el.dataset.n = it.length; }

// ================= RISORSE MANCANTI: la pergamena dice dove produrle =================
const RSRC = { cibo: ['fattoria', 'taverna'], legno: ['capanna'], oro: ['casa', 'municipio', 'mercato', 'mastio'], pietra: ['cava', 'miniera'], ferro: ['fucina', 'miniera'], pelli: [], favore: ['monastero'] };
const RXTRA = { cibo: 'Caccia cervi e cinghiali nei boschi', legno: 'Rimuovi tronchi caduti e cespugli dalla mappa', oro: 'Vinci assedi o vendi merci al Mercato', pietra: 'Rimuovi i massi muschiosi dalla mappa', ferro: 'Compra ferro al Mercato', pelli: 'Caccia animali o abbatti lupi e orsi durante le razzie', favore: 'Completa missioni e vinci assedi con molte stelle' };
function lacking(cost) { const o = {}; if (!cost || (S && S.creative)) return o; for (const r in cost) { const m = cost[r] - Math.floor(S.res[r] || 0); if (m > 0) o[r] = m; } return o; }
function needLabel(cost) { const l = lacking(cost); const k = Object.keys(l); if (!k.length) return ''; const r = k[0]; const own = S.buildings.filter(b => RSRC[r].includes(b.t) && !b.nat && !(b.end && b.toLvl === 1)); const w = own.length ? BDEF[own[0].t].n : (RSRC[r].find(t => t !== 'mastio' && maxB(t) > 0) ? BDEF[RSRC[r].find(t => t !== 'mastio' && maxB(t) > 0)].n : ''); return `Manca ${k.map(x => ICO(x) + ' ' + fmt(l[x])).join(' ')}${w ? ' → ' + w : ''}`; }
function needItems(cost) {
  const l = lacking(cost); const out = []; const c = caps();
  for (const r in l) {
    const miss = l[r]; const lines = []; const acts = [];
    if (cost[r] > c[r]) lines.push(`⚠️ Il magazzino ne tiene solo ${fmt(c[r])}: ${r === 'oro' ? 'costruisci o migliora la Tesoreria' : 'costruisci o migliora un Granaio'}`);
    const own = S.buildings.filter(b => RSRC[r].includes(b.t) && !b.nat && !(b.end && b.toLvl === 1));
    if (own.length) {
      const stock = own.reduce((a, b) => a + Math.floor(b.stock || 0), 0); const rate = own.reduce((a, b) => a + rateOf(b), 0);
      const names = [...new Set(own.map(b => BDEF[b.t].n))].join(', ');
      if (stock > 0) lines.push(`🧺 ${stock >= miss ? 'Basta raccogliere' : 'Raccogli'} ${ICO(r)} ${fmt(stock)} già pronti da: <b>${names}</b>`);
      else lines.push(`Lo producono le tue botteghe: <b>${names}</b>`);
      if (rate > 0 && stock < miss) lines.push(`⏳ Con la produzione attuale (${rate < 1 ? rate.toFixed(1) : Math.round(rate)}/min) ti servono circa ${fmtT((miss - stock) / rate * 60000)}`);
      const best = own.filter(b => !b.end).sort((a, b) => (b.stock || 0) - (a.stock || 0))[0] || own[0];
      acts.push([stock > 0 ? 'Raccogli' : 'Vai', `closeSheet();needGo(${best.id})`]);
      const up = own.find(b => b.t !== 'mastio' && !canUp(b)); if (up) lines.push(`⬆ Migliora ${BDEF[up.t].n} per produrne di più`);
    }
    const canNew = RSRC[r].filter(t => t !== 'mastio' && maxB(t) > 0 && countB(t) < maxB(t) && !(BDEF[t].req && !hasB(BDEF[t].req)));
    if (canNew.length) { lines.push(`🔨 ${own.length ? 'Oppure costruisci' : 'Costruisci'}: <b>${canNew.map(t => BDEF[t].n).join(' o ')}</b>`); acts.push(['Costruisci', `closeSheet();openBuild()`]); }
    else if (!own.length && RSRC[r].length) { const lk = RSRC[r].filter(t => t !== 'mastio').map(t => { const d = BDEF[t]; if (d.req && !hasB(d.req)) return `${d.n} (serve ${BDEF[d.req].n})`; const lv = d.max.findIndex(v => v > 0) + 1; return lv > S.mastio ? `${d.n} (Mastio ${lv})` : null; }).filter(Boolean); if (lk.length) lines.push(`🔒 Si sblocca: ${lk.join(', ')}`); }
    if (RXTRA[r]) lines.push(`💡 ${RXTRA[r]}`);
    if (hasB('mercato') && ['oro', 'ferro'].includes(r)) acts.push(['Mercato', `closeSheet();openMarket()`]);
    out.push({ r, miss, lines, acts });
  }
  return out;
}
function needGo(id) { const r = S.buildings.find(b => b.id === id); if (!r) return; if (!r.end && resOf(r) && (r.stock || 0) >= 1) { collect(r); save(); updateHUD(); } const b = SC && SC.B.find(b => b.ref === r); if (b) { const [x, y] = W(b.x + b.w / 2, b.y + b.h / 2); cam.x = x; cam.y = y + 60; SC.sel = b; } openBuildingInfo(r); }
function needSheet(cost, what) {
  const it = needItems(cost); if (!it.length) return false;
  openSheet('📜 Ti mancano i materiali', `<p class="desc"><i>«Mio signore, per ${what} non basta ciò che abbiamo nei magazzini. Ecco dove trovare il resto.»</i></p><div class="memo need">${it.map(x => `<div class="mi p1"><span class="mic">${ICO(x.r)}</span><div class="mt"><b>Mancano ${fmt(x.miss)} ${RNAME[x.r]}</b>${x.lines.map(l => `<small>${l}</small>`).join('')}</div>${x.acts.length ? `<div class="nacts">${x.acts.map(a => `<button class="btn" onclick="${a[1]}">${a[0]}</button>`).join('')}</div>` : ''}</div>`).join('')}</div><div class="acts"><button class="btn ghost" onclick="closeSheet()">Ho capito</button></div>`, 'need');
  return true;
}
function questCost() { const q = QUESTS[S.mq]; if (!q || q.c()) return null; if (q.m) { const m = S.buildings.find(b => b.t === 'mastio'); return m && !m.end && !canUp(m) ? { cost: upCost(m), what: `alzare il Mastio al livello ${m.lvl + 1}` } : null; } if (q.b) { const d = BDEF[q.b]; return maxB(q.b) > countB(q.b) ? { cost: d.cost, what: `costruire ${d.n}` } : null; } return null; }
function questNeed() { const qc = questCost(); if (qc) needSheet(qc.cost, qc.what); }
// ---------- battle HUD ----------
function showBattleHUD() { $('#hud').classList.add('hidden'); $('#bhud').classList.remove('hidden'); $('#placebar').classList.add('hidden'); if (SC) SC.order = MODE === 'raid' ? 'guard' : 'free'; renderOrders(); updateBattleHUD(true); }
let lastCards = '';
function updateBattleHUD(force) {
  if (!BT) return;
  const t = Math.max(0, Math.ceil(BT.timer)); const mm = Math.floor(t / 60), ss = t % 60;
  if (MODE === 'attack') {
    $('#btop').innerHTML = `<div class="bt-name">${BT.tg.name}</div><div class="bt-row"><span class="tm">${BT.started ? '' : '⚑ '}${mm}:${String(ss).padStart(2, '0')}</span><span class="st">${'★'.repeat(BT.stars || 0)}<i>${'★'.repeat(3 - (BT.stars || 0))}</i></span><span class="pc">${BT.pct || 0}%</span></div><div class="bt-loot">${Object.keys(BT.lootGot).filter(k => BT.lootGot[k] > 0).map(k => ICO(k) + ' ' + BT.lootGot[k]).join(' ') || 'Bottino: —'}</div>`;
  } else {
    const alive = SC.U.filter(u => !u.dead && u.side === 'A').length + BT.spawnLeft;
    $('#btop').innerHTML = `<div class="bt-name">${BT.pack ? '🐺 Notte del branco' : '🌙 Razzia notturna'}</div><div class="bt-row"><span class="tm">${mm}:${String(ss).padStart(2, '0')}</span><span class="pc">${BT.pack ? "Bestie" : "Predoni"}: ${alive}</span><span class="pc">Danni ${BT.pct || 0}%</span></div>`;
  }
  // cards (only rebuild when something changes)
  const sel = SC.deploySel; const sig = JSON.stringify([BT.avail, BT.heroes.map(h => [h.k, !!h.u, h.u && h.u.ultUsed, h.u && h.u.dead]), sel, BT.ended]);
  if (!force && sig === lastCards) return; lastCards = sig;
  let html = '';
  if (MODE === 'attack') for (const k of UNIT_ORDER) { const n = BT.avail[k] || 0, used = BT.used[k] || 0; if (!n && !used) continue; html += `<button class="ucard ${sel && sel.k === k ? 'on' : ''} ${n ? '' : 'dis'}" onclick="selDeploy('${k}')"><div class="uimg" style="${thumbStyle(k)}"></div><span class="n">×${n}</span><span class="nm">${UDEF[k].sn}</span></button>`; }
  for (const h of BT.heroes) {
    const d = HDEF[h.k]; let cls = '', lab = d.n.split(' ').pop();
    if (!h.u) cls = sel && sel.hero === h.k ? 'on' : ''; else if (h.u.dead) { cls = 'dis'; lab = 'Caduto'; } else if (h.u.ultUsed) { cls = 'dis'; lab = 'Usata'; } else { cls = 'ult'; lab = d.ult; }
    html += `<button class="ucard hero ${cls}" onclick="heroCard('${h.k}')"><div class="uimg" style="${thumbStyle(h.k)}"></div><span class="n">♔</span><span class="nm">${lab}</span></button>`;
  }
  const left = MODE === 'attack' ? UNIT_ORDER.reduce((s, k) => s + (BT.avail[k] || 0), 0) : 0;
  $('#bcards').innerHTML = (left > 1 ? `<button class="ucard all" onclick="deployAll()"><div class="uimg">⚔</div><span class="n">×${left}</span><span class="nm">Schiera tutti</span></button>` : '') + (html || '<div class="empty">Nessuna truppa: difesa automatica</div>');
}
function selDeploy(k) { if (!BT || BT.ended || !(BT.avail[k] > 0)) return; SC.deploySel = { k }; autoDeploy(); }
// punto di raccolta: casella libera appena fuori dalla zona nemica, la più vicina al centro dello schermo
// punto di raccolta davanti al campo: la casella libera fuori dalla zona rossa più in basso sullo schermo (il lato da cui arrivi)
function frontRally() { let best = null, bv = -1e9; for (let y = 2; y < N - 2; y++) for (let x = 2; x < N - 2; x++) { if (SC.zone[y * N + x] || isWater(SC, x, y) || bAt(SC, x, y)) continue; let near = false; for (let dy = -2; dy <= 2 && !near; dy++) for (let dx = -2; dx <= 2; dx++) if (inMap(x + dx, y + dy) && SC.zone[(y + dy) * N + x + dx] === 1) { near = true; break; } if (!near) continue; const p = rotP(x + 0.5, y + 0.5); const v = p[0] + p[1] - Math.abs((p[0] - p[1])) * 0.3; if (v > bv) { bv = v; best = [x, y]; } } return best; }
function rallyPoint() {
  const [cx, cy] = screenToTile(VW / 2, VH * 0.62); let best = null, bd = 1e9;
  const free = (x, y) => inMap(x, y) && x > 1 && y > 1 && x < N - 2 && y < N - 2 && !(MODE === 'attack' && SC.zone[y * N + x]) && !isWater(SC, x, y) && !bAt(SC, x, y);
  for (let y = 2; y < N - 2; y++) for (let x = 2; x < N - 2; x++) { if (!free(x, y)) continue; let near = false; if (MODE === 'attack') { for (let dy = -2; dy <= 2 && !near; dy++) for (let dx = -2; dx <= 2; dx++) if (inMap(x + dx, y + dy) && SC.zone[(y + dy) * N + x + dx]) { near = true; break; } } else near = true; if (!near) continue; const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy); if (d < bd) { bd = d; best = [x, y]; } }
  return best;
}
function autoDeploy(all) {
  if (!BT || BT.ended || !SC.deploySel) return; if (!SC.rally) SC.rally = rallyPoint(); const r = SC.rally; if (!r) { toast('Nessun punto libero per schierare: tocca la mappa fuori dalla zona rossa'); return; }
  let tries = 0, done = 0; const want = all ? 999 : 1;
  while (done < want && SC.deploySel && tries < 400) { tries++; SC.dn = (SC.dn || 0) + 1; const a = SC.dn * 2.4, rr = 0.3 + Math.sqrt(SC.dn) * 0.45; const x = r[0] + 0.5 + Math.cos(a) * rr, y = r[1] + 0.5 + Math.sin(a) * rr;
    const [wx, wy] = W(x, y); const sx = (wx - cam.x) * cam.z + VW / 2, sy = (wy - cam.y) * cam.z + VH / 2; const ok = deployAtQuiet(sx, sy); if (ok) done++; if (SC.dn > 300) SC.dn = 0; }
  if (all && done) { toast(`⚔ Schierati ${done} uomini`); sfx('horn'); }
}
function deployAtQuiet(sx, sy) { const T = SC.T.length; deployAt.auto = 1; const r = deployAt(sx, sy); deployAt.auto = 0; if (!r) SC.T.length = T; return r; }
function deployAll() { if (!BT || BT.ended || MODE !== 'attack') return; for (const k of UNIT_ORDER) { if (!(BT.avail[k] > 0)) continue; SC.deploySel = { k }; autoDeploy(true); } updateBattleHUD(true); }
function heroCard(k) { const h = BT.heroes.find(h => h.k === k); if (!h) return; if (!h.u) { SC.deploySel = { hero: k }; autoDeploy(); } else if (heroUlt(SC, h.u)) { } updateBattleHUD(true); }

// ---------- title ----------
// conferma dentro al gioco (i popup del browser sono bloccati nella pagina pubblicata)
let ASK = null;
// ---- aggiornamento automatico: se su GitHub c'è una versione nuova, ricarica scavalcando la cache ----
const BUILD = '__BUILD__';
function checkUpdate() { if (BUILD.startsWith('__') || !/github\.io$/.test(location.hostname)) return;
  fetch('version.txt?t=' + Date.now(), { cache: 'no-store' }).then(r => r.ok ? r.text() : '').then(v => { v = (v || '').trim(); if (!v || v === BUILD) return; let tried = ''; try { tried = sessionStorage.getItem('feudum_upd') || ''; } catch (e) { } if (tried === v) return; try { sessionStorage.setItem('feudum_upd', v); } catch (e) { }
    try { if (S && MODE !== 'title') save(); } catch (e) { } location.replace(location.pathname + '?v=' + v); }).catch(() => { }); }
setTimeout(checkUpdate, 1500); document.addEventListener('visibilitychange', () => { if (!document.hidden) checkUpdate(); });
function askYes(msg, fn, yes) { ASK = fn; let el = $('#askd'); if (!el) { el = document.createElement('div'); el.id = 'askd'; document.body.appendChild(el); }
  el.innerHTML = `<div class="ab"><p>${msg}</p><div class="aa"><button class="btn ghost" onclick="askClose()">Annulla</button><button class="btn" onclick="askOk()">${yes || 'Conferma'}</button></div></div>`; el.classList.remove('hidden'); document.body.classList.add('asking');
  el.querySelectorAll('button').forEach((b, i) => b.addEventListener('touchend', ev => { ev.preventDefault(); i === 0 ? askClose() : askOk(); }, { passive: false })); }
function askClose() { const el = $('#askd'); if (el) el.classList.add('hidden'); document.body.classList.remove('asking'); ASK = null; }
function askOk() { const f = ASK; askClose(); if (f) f(); }
function newCampaign() { askYes('Ricominciare la campagna da capo?<br><small>Tengo una copia della partita attuale in «Copie di sicurezza».</small>', () => { closeSheet(); closeFolk(); try { const cur = localStorage.getItem(SAVE_KEY); if (cur) bkPut('nuova', cur, bkMeta()); localStorage.removeItem(SAVE_KEY); } catch (e) { } if (CLOUD.mem) delete CLOUD.mem[SAVE_KEY]; CLOUD.lastS = null; beginGame(true); cloudPush(true); toast('⚔ Nuova campagna iniziata'); }, 'Ricomincia'); }
function saveCode() { const s = load(); if (!s) { toast('Nessuna partita da esportare'); return; } const code = 'FEUDUM1:' + btoa(unescape(encodeURIComponent(JSON.stringify(s)))); try { navigator.clipboard.writeText(code).then(() => toast('📋 Codice della partita copiato: incollalo in Note per conservarlo'), () => prompt('Copia questo codice:', code)); } catch (e) { prompt('Copia questo codice:', code); } }
function openImport() { openSheet('📥 Importa partita', `<p class="desc">Incolla qui il codice della partita che avevi copiato (inizia con FEUDUM1:).</p><textarea id="impc" style="width:100%;height:120px;font-size:12px;border-radius:8px;padding:6px"></textarea><div class="acts"><button class="btn" onclick="doImport()">Carica partita</button><button class="btn ghost" onclick="closeSheet()">Annulla</button></div>`, 'imp'); }
function doImport() { const v = ($('#impc').value || '').trim(); try { if (!v.startsWith('FEUDUM1:')) throw 0; const s = JSON.parse(decodeURIComponent(escape(atob(v.slice(8))))); if (!s || s.v !== 1) throw 0; SAVE_KEY = 'feudum_proto_v1'; CLOUD.mem = CLOUD.mem || {}; CLOUD.mem[SAVE_KEY] = JSON.stringify(s); try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch (e) { } closeSheet(); beginGame(false); toast('📥 Partita caricata'); } catch (e) { toast('Codice non valido'); } }
function showTitle() {
  MODE = 'title'; $('#title').classList.remove('hidden'); renderTset();
  const tb = (cls, on, ic, lb, sub, dis) => `<button class="btn tb ${cls}" ${dis ? 'disabled' : `onclick="${on}"`}><i class="bi">${ic}</i><span class="bl">${lb}</span>${sub ? `<small>${sub}</small>` : ''}</button>`;
  const sv = load(); const when = sv && sv.last ? new Date(sv.last).toLocaleString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
  const cs = !window.claude ? '💾 Salvataggio su questo dispositivo · usa 📋 Copia codice partita per spostarlo' : CLOUD.ready ? '☁ Salvataggio nel cloud del tuo account: attivo' : '⚠ Salvataggio solo su questo browser' + (CLOUD.why ? ' · motivo: ' + CLOUD.why : ' · controllo del cloud in corso…') + '<br><button class="btn ghost" style="margin-top:5px;font-size:12px;padding:6px 12px" onclick="cloudAsk()">☁ Attiva salvataggio cloud</button>';
  const bNew = tb('big k-new', sv ? 'newCampaign()' : 'beginGame(true)', '⚔', sv ? 'Nuova Campagna' : 'Inizia Campagna', sv ? 'ricomincia da capo (cancella il salvataggio)' : 'una nuova Marca da conquistare');
  const bCont = tb('big cont' + (sv ? '' : ' dis'), 'beginGame(false)', '📜', 'Continua Campagna', sv ? `Mastio ${sv.mastio} · ${ERA(sv.mastio).n} · salvata ${when}` : (CLOUD.ready ? 'nessun salvataggio sul tuo account' : 'nessun salvataggio su questo dispositivo'), !sv);
  $('#tbtns').innerHTML = (sv ? bCont + bNew : bNew + bCont)
    + `<div class="savex">${sv ? '<button class="btn ghost" onclick="saveCode()">📋 Copia codice partita</button>' : ''}<button class="btn ghost" onclick="openImport()">📥 Importa partita</button>${Object.keys(bkMeta()).length ? '<button class="btn ghost" onclick="openBackups(1)">🛟 Copie</button>' : ''}</div>`
    + `<div class="cloudst">${cs}</div>`
    + tb('k-max', 'pickEra()', '🏰', 'Città al massimo', "scegli l'era, tutto sbloccato")
    + tb('k-cre', 'pickCreative()', '🧱', 'Modalità Creativa', 'tutto sbloccato, risorse infinite')
    + tb('ghost k-rlm', 'openRealms(1)', '🌍', 'Altri Regni', 'classifica e cronache dei signori della Marca')
    + tb('ghost k-cron', 'openCronache()', '📜', 'Cronache', 'rileggi la storia della Marca');
}
function pickCreative() {
  SAVE_KEY = 'feudum_creativo'; const has = !!load(); SAVE_KEY = 'feudum_proto_v1';
  if (!has) { startCreative(true); return; }
  $('#tset').classList.add('hidden');
  $('#tbtns').innerHTML = `<button class="btn big" style="background:linear-gradient(180deg,#3f7a2e,#245216)" onclick="startCreative(false)">🧱 Continua la creazione</button><button class="btn ghost" onclick="askYes('Ripartire con la mappa vuota?', () => startCreative(true), 'Riparti')">Mappa vuota</button><button class="btn ghost" onclick="showTitle()">← Indietro</button>`;
}
function renderTset() { const t = $('#tset'); if (!t) return; t.innerHTML = `<button class="btn ghost" onclick="pickLayout()">🎨 Layout<small>${THM().n}</small></button><button class="btn ghost" onclick="pickDiff()">⚔ Difficoltà<small>${DF().n}</small></button><button class="btn ghost" onclick="openAudio('closeSheet();renderTset()')">${SET.mute ? '🔇' : '🔊'} Audio<small>${SET.mute ? 'Muto' : 'Musica ' + Math.round(SET.mvol * 100) + '%'}</small></button>`; t.classList.remove('hidden'); }
function icoURLFor(th, k) { const o = SET.theme; SET.theme = th; const u = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(icoSVG(k)); SET.theme = o; return u; }
function layoutCards(after) { return Object.keys(THEMES).map(k => { const t = THEMES[k]; return `<div class="card ${SET.theme === k ? 'on' : ''}" onclick="applyTheme('${k}');${after}"><div class="cn">${SET.theme === k ? '✓ ' : ''}${t.n}</div><div class="fs" style="font-family:'${t.fh}',serif">Feudum</div><div class="cs" style="font-family:'${t.fb}',serif">${t.fh} · ${t.fb}</div><div class="sw">${t.sw.map(s => `<i style="background:${s}"></i>`).join('')}</div><div class="ics">${['cibo', 'legno', 'oro', 'ferro', 'favore', 'army'].map(i => `<i class="ico" style="background-image:url('${icoURLFor(k, i)}')"></i>`).join('')}</div><div class="cd">${t.d}</div></div>`; }).join(''); }
function diffCards(after) { return Object.keys(DIFFS).map(k => { const d = DIFFS[k]; return `<div class="card ${SET.diff === k ? 'on' : ''}" onclick="setDiff('${k}');${after}"><div class="cn"><b style="background:${d.col}"></b>${SET.diff === k ? '✓ ' : ''}${d.n}</div><div class="cd">${d.d}</div></div>`; }).join(''); }
function setDiff(k) { SET.diff = k; saveSet(); if (typeof S !== 'undefined' && S && MODE !== 'title') { if (!S.raids && S.nightIn > DF().truce) S.nightIn = DF().truce; updateHUD(); toast('⚔ Difficoltà: ' + DF().n); } }
function pickLayout() { $('#tset').classList.add('hidden'); $('#tbtns').innerHTML = `<div class="lay">${layoutCards('pickLayout()')}</div><button class="btn big" onclick="showTitle()">✓ Fatto</button>`; }
function pickDiff() { $('#tset').classList.add('hidden'); $('#tbtns').innerHTML = `<div class="dif">${diffCards('pickDiff()')}</div><p style="font-size:12px;margin:2px 0">Vale per le partite normali, le razzie e gli assedi. Puoi cambiarla anche durante il gioco dal menu 📜.</p><button class="btn big" onclick="showTitle()">✓ Fatto</button>`; }
function pickEra() {
  $('#tset').classList.add('hidden');
  const era = (s, n, y, l, d, ok) => `<button class="card ${ok ? '' : 'dis'}" style="text-align:left;width:100%" ${ok ? `onclick="startMax(${l})"` : ''}><div class="cn">${s} · ${n}</div><div class="cs">${y}</div><div class="cd">${d}</div></button>`;
  $('#tbtns').innerHTML = `<div style="display:flex;flex-direction:column;gap:6px;width:100%">
   ${era('I', 'Età del Legno', 'A.D. 1254-1258 · Mastio 4', 4, 'Torre di tronchi, palizzate, prime case, Municipio, Mercato e Chiesa al massimo dell\'era.', true)}
   ${era('II', 'Età Feudale', 'A.D. 1258-1264 · Castello livello 8', 8, 'Castello di pietra, mura, Stalla, Accademia con tutte le ricerche, esercito completo con eroi.', true)}
   ${era('III', 'Età dei Castelli', 'A.D. 1266-1272 · Castello livello 12', 12, 'Donjon e torri agli angoli della cinta, baliste e torri raddoppiate, edifici al livello 6, città più grande.', true)}
   ${era('IV', 'Età Imperiale', 'A.D. 1273-1279 · Castello livello 16', 16, 'Castello imperiale con mura concentriche, barbacani con baliste, stendardi reali, edifici al livello 8.', true)}
   <button class="btn ghost" onclick="showTitle()">← Indietro</button></div>`;
}
function beginGame(fresh, preset) {
  ac(); $('#title').classList.add('hidden');
  if (preset) { } else if (fresh || !load()) startNew(); else { S = load(); offlineCatchup(); }
  if (!fresh && S.mapv !== 3) { const sh = S.mapv === 2 ? 24 : 32; for (const r of S.buildings) { r.x += sh; r.y += sh; } S.removed = []; S.mapv = 3; }
  if (!S.buildings.some(b => b.t === 'mastio')) S.buildings.unshift({ id: S.nextId++, t: 'mastio', x: 14 + OFF, y: 14 + OFF, lvl: S.mastio, stock: 0, end: 0 });
  for (const r of S.buildings) { if (r.t === 'mastio' || r.nat) continue; if (!canPlace(r.t, r.x, r.y, r)) { const f = findFree(r.t, r.x, r.y, r); if (f) { r.x = f[0]; r.y = f[1]; } } }
  S.buildings = S.buildings.filter(r => !r.nat || canPlace(r.t, r.x, r.y, r));
  for (const r of S.buildings) { if (r.t === 'mastio') continue; const d = BDEF[r.t]; const wv = villageWater(); let wet = false; for (let yy = r.y; yy < r.y + d.h; yy++) for (let xx = r.x; xx < r.x + d.w; xx++) if (wv[yy * N + xx]) wet = true; if (wet) { const f = findFree(r.t, r.x, r.y, r); if (f) { r.x = f[0]; r.y = f[1]; } } }
  { let k = 0; S.buildings = S.buildings.filter(b => !(b.nat && b.t === 'tronco') || ++k <= TRONCHI_MAX); }
  if (!S.fauna) S.fauna = []; faunaFill(true);
  if (S.nightIn == null) S.nightIn = S.raids ? 180 : DF().truce;
  if (!S.natInit) { S.natInit = 1; spawnNature(14); S.natIn = 240; }
  if (!S.natBig) { S.natBig = 1; spawnNature(12); }
  if (!S.natHuge) { S.natHuge = 1; spawnNature(45); }
  for (const r of RES) if (S.res[r] == null) S.res[r] = 0; if (S.mq == null) S.mq = 0; if (S.best3 == null) S.best3 = 0;
  if (!S.creative && !S.buildings.some(b => b.t === 'casa')) { let n = 0; for (let rr = 4; rr < 12 && n < 2; rr++) for (let y = (MCX | 0) - rr; y <= (MCX | 0) + rr && n < 2; y++) for (let x = (MCX | 0) - rr; x <= (MCX | 0) + rr && n < 2; x++) if (canPlace('casa', x, y)) { S.buildings.push({ id: S.nextId++, t: 'casa', x, y, lvl: 1, stock: 0, end: 0 }); n++; } if (n) setTimeout(() => toast('🏠 Il feudo cresce: 2 Case regalate ai tuoi contadini'), 1200); }
  refreshTargets(false);
  questMigrate(); MODE = 'village'; SC = buildVillage(); prefetchEra(); centerCam(MCX, MCX); cam.z = VW < 600 ? 1.05 : Math.max(0.7, Math.min(1.25, VW / 900));
  $('#hud').classList.remove('hidden'); $('#rotbar').classList.remove('hidden'); updateHUD();
  if (fresh && !S.creative && !S.sandbox) tutStart();
}

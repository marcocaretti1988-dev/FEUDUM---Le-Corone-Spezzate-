// FEUDUM · BASE: impostazioni, difficoltà e variabili globali usate da tutti i moduli (va caricato per primo)
// ================= THEME: 4 layout grafici, icone disegnate, difficoltà =================
const SET_KEY = 'feudum_settings';
let SET = { theme: 'pergamena', diff: 'normale' };
try { const j = JSON.parse(localStorage.getItem(SET_KEY) || 'null'); if (j) SET = Object.assign(SET, j); } catch (e) { }
function saveSet() { try { localStorage.setItem(SET_KEY, JSON.stringify(SET)); } catch (e) { } }

// ---- difficoltà ----
const DIFFS = {
  facile: { n: 'Facile', d: 'Tregua di 15 min, notti ogni 14 min, nemici più deboli, +30% produzione e bottino più ricco.', truce: 900, night: 840, prod: 1.3, loot: 1.25, ehp: 0.75, edmg: 0.75, raid: 0.6, def: 0.7, col: '#3f7a2e' },
  normale: { n: 'Normale', d: 'L\'esperienza bilanciata: tregua di 10 min e una razzia ogni 10 minuti.', truce: 600, night: 600, prod: 1, loot: 1, ehp: 1, edmg: 1, raid: 1, def: 1, col: '#b45309' },
  difficile: { n: 'Difficile', d: 'Tregua di 6 min, notti ogni 7 min, nemici più numerosi e resistenti, risorse più scarse.', truce: 360, night: 420, prod: 0.85, loot: 0.9, ehp: 1.3, edmg: 1.25, raid: 1.4, def: 1.35, col: '#8f1d1d' },
};
function DF() { return DIFFS[SET.diff] || DIFFS.normale; }

// ================= GAME: village, battles, input, UI =================
const cv = document.getElementById('cv'), ctx = cv.getContext('2d');
let DPR = 1, VW = 0, VH = 0;
// ---- qualità grafica ----
const QUAL = { alta: { n: 'Alta', d: 'Tutto attivo: ombre, foreste piene, luci, nitidezza massima.', dpr: 2, sh: 1, tr: 1, fx: 1, fps: 60 }, media: { n: 'Media', d: 'Bilanciata per iPhone: un po\' meno nitidezza, foreste più leggere.', dpr: 1.5, sh: 1, tr: 0.7, fx: 0.7, fps: 60 }, bassa: { n: 'Bassa', d: 'Batteria e fluidità prima di tutto: niente ombre, meno alberi ed effetti, 30 fotogrammi al secondo.', dpr: 1, sh: 0, tr: 0.45, fx: 0.4, fps: 30 } };
const QQ = () => QUAL[SET.q] || QUAL[(innerWidth < 700 ? 'media' : 'alta')];
function setQual(k) { SET.q = k; saveSet(); resize(); for (const k2 in G3S) delete G3S[k2]; if (SC) for (const b of SC.B) { b.c3k = null; } toast('🖥️ Qualità grafica: ' + QUAL[k].n); openMenu('look'); }
function resize() { DPR = Math.min(QQ().dpr, window.devicePixelRatio || 1); VW = innerWidth; VH = innerHeight; cv.width = Math.round(VW * DPR); cv.height = Math.round(VH * DPR); cv.style.width = VW + 'px'; cv.style.height = VH + 'px'; }
const $ = s => document.querySelector(s);
const now = () => Date.now();
let GROUND_V = null, GROUND_E = null, GROUND_R = null;
let MODE = 'title';
let placing = null; // {t, x, y, w, h, move: bref}

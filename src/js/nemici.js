// FEUDUM · NEMICI: animali selvatici, unità e intelligenza in battaglia, poteri degli eroi, predoni, battaglie e assedi
// ---------- fauna ----------
const FAUNA = {
  cervo: { n: 'Cervo', w: 70, spd: 0.9, desc: 'Cervo nobile della Foresta Nera. Cacciarlo è facile e sfama il borgo. Compare dall\'Età dei Castelli.', gain: { cibo: 90 }, need: 0, risk: 0, max: 7, eras: [3, 4] },
  capra: { n: 'Capra Selvatica', w: 46, spd: 0.6, desc: 'Capra di montagna dal pelo folto. Facile da prendere.', gain: { cibo: 55 }, need: 0, risk: 0, max: 7, eras: [1, 2, 3, 4] },
  lupo: { n: 'Lupo', w: 54, spd: 1.1, desc: 'Lupo grigio dal collare runico. Pericoloso: serve una battuta di almeno 3 soldati. Pelli pregiate per armature.', gain: { pelli: 3 }, need: 3, risk: 0.3, max: 7, eras: [1, 2, 3, 4] },
  orso: { n: 'Orso Bruno', w: 90, spd: 0.5, desc: 'Orso bruno enorme. Serve una battuta di almeno 6 soldati e qualcuno può non tornare. Molte pelli e carne. Scende dai monti nell\'Età dei Castelli.', gain: { pelli: 6, cibo: 40 }, need: 6, risk: 0.5, max: 2, eras: [3, 4] },
  maiale: { n: 'Maiale Brado', w: 50, spd: 0.55, desc: 'Maiale dei primi coloni, lasciato libero nei boschi a mangiare ghiande. Facile da prendere e pieno di carne. Sparisce con la fine dell\'Età del Legno.', gain: { cibo: 75 }, need: 0, risk: 0, max: 6, eras: [1] },
  cinghiale: { n: 'Cinghiale', w: 60, spd: 0.75, desc: 'Cinghiale dalle zanne ricurve. Non scappa: carica. Un lupo da solo spesso ne esce sventrato, due lupi lo abbattono. Per cacciarlo servono almeno 2 soldati.', gain: { cibo: 70, pelli: 2 }, need: 2, risk: 0.15, max: 5, eras: [1, 2, 3, 4] },
  lepre: { n: 'Lepre', w: 40, spd: 1.6, desc: 'Lepre dei campi, scatta via a balzi. Poca carne, ma si caccia senza rischi.', gain: { cibo: 25 }, need: 0, risk: 0, max: 9, eras: [1, 2, 3, 4] },
};
const FHK = { orso: 150, capra: 110, cervo: 140, lupo: 100, maiale: 159, lepre: 150, cinghiale: 158 }, FIDLE = { cinghiale: 0, orso: 2, capra: 1, cervo: 1, lupo: 1, maiale: 0, lepre: 1 };
const ERAI = l => l <= 4 ? 1 : l <= 8 ? 2 : l <= 12 ? 3 : 4;
const faunaOk = k => FAUNA[k].eras.includes(ERAI(S && S.mastio || 1));
const PREY = { cervo: 1, capra: 1, maiale: 1, lepre: 1 };
// probabilità che vincano i lupi, per numero di lupi [0,1,2,3+]
const STRONG = { orso: { k: 'orso', p: [0, 0, 0.5, 1], reach: 5, e: '🐻', art: "l'orso" }, cinghiale: { k: 'cinghiale', p: [0, 0.5, 1, 1], reach: 3, e: '🐗', art: 'il cinghiale' } };
const GRAZE = [0, 1, 2, 1, 2, 1, 2, 3, 0, 0, 0];
function animFrame(k, moving, ph, mode, mph, fast) { // -> [frameRect, drawW, drawH]
  const st = BFR[k], F = FAUNA[k]; const hs = F.w * st[3] / st[2];
  let key;
  if (mode === 'atk' && BFR[k + '_a0']) key = k + '_a' + Math.min(3, Math.max(0, Math.floor(mph)));
  else if (!moving && BFR[k + '_g0']) key = k + '_g' + GRAZE[((Math.floor(mph || 0) % GRAZE.length) + GRAZE.length) % GRAZE.length];
  else if (moving && fast > 1.3 && BFR[k + '_r0']) key = k + '_r' + (Math.floor(ph * 1.2) % 4 + 4) % 4;
  else key = k + '_w' + (moving ? (Math.floor(ph) % 4 + 4) % 4 : FIDLE[k]);
  const f = BFR[key];
  if (!f) return [st, F.w, hs]; const s = hs / FHK[k] * 1.05; return [f, f[2] * s, f[3] * s];
}
// ---------- nuovi animali (maiale, lepre): sprite di Marco in un atlante a parte ----------
const FATL2 = new Image(); FATL2.src = FATL2_SRC;
function buildFaunaSprites() { for (const k in FFR2) { const r = FFR2[k].slice(); r.img = FATL2; BFR[k] = r; } }
// ---------- units ----------
function mkUnit(k, side, x, y, hero) {
  const d = hero ? HDEF[k] : UDEF[k];
  const lvlBoost = 1;
  return {
    id: EID++, k, d, hero: !!hero, side, x, y, hp: d.hp * lvlBoost, maxhp: d.hp * lvlBoost, cd: Math.random() * 0.5, atkT: 0, rt: 0, tgt: null, path: null, pi: 0, prt: 0,
    face: 'F', flip: Math.random() < 0.5, phase: Math.random() * 6, moving: false, dead: false, deadT: 0, post: { x, y }, slow: 0, inv: 0, charged: false, ultUsed: false, hitT: 0, auraT: 0
  };
}
function uScale(u) { return u.kid ? 0.3 : u.hero ? 0.5 : (u.d.cav ? 0.46 : 0.45); }
function distToB(x, y, b) { const cx = Math.max(b.x, Math.min(b.x + b.w, x)), cy = Math.max(b.y, Math.min(b.y + b.h, y)); return Math.hypot(x - cx, y - cy); }
function distTo(u, t) { return t.isB ? distToB(u.x, u.y, t) : Math.hypot(u.x - t.x, u.y - t.y); }
function tPos(t) { return t.isB ? [t.x + t.w / 2, t.y + t.h / 2] : [t.x, t.y]; }
function enemiesOf(side) { return side === 'A' ? 'D' : 'A'; }
function nearestUnit(sc, u, side, maxD) { if (u.pl && !u.hero) return spreadUnit(sc, u, side, maxD); return nearestUnit0(sc, u, side, maxD); }
function spreadUnit(sc, u, side, maxD) { const load = new Map(); for (const o of sc.U) if (!o.dead && o.pl && o !== u && o.tgt && !o.tgt.isB) load.set(o.tgt, (load.get(o.tgt) || 0) + 1);
  let best = null, bs = 1e9; for (const o of sc.U) { if (o.dead || o.side !== side) continue; const d = Math.hypot(o.x - u.x, o.y - u.y); if (d >= maxD) continue; const sc2 = d + (load.get(o) || 0) * (o.d && o.d.hp > 200 ? 0.9 : 1.8) + (o === u.tgt ? -1 : 0); if (sc2 < bs) { bs = sc2; best = o; } } return best; }
function nearestUnit0(sc, u, side, maxD) { let best = null, bd = maxD; for (const o of sc.U) { if (o.dead || o.side !== side) continue; const d = Math.hypot(o.x - u.x, o.y - u.y); if (d < bd) { bd = d; best = o; } } return best; }
function pickBuilding(sc, u) {
  let best = null, bd = 1e9; const towersFirst = u.pl && sc.order === 'towers';
  for (const b of sc.B) {
    if (b.dead || b.side === u.side) continue; const d = BDEF[b.t]; if (d.wall || d.decor || (u.d.beast && d.gate)) continue;
    let dist = distToB(u.x, u.y, b); if (u.pl) { let n = 0; for (const o of sc.U) if (!o.dead && o.pl && o !== u && o.tgt === b) n++; dist += n * (0.5 + 2.5 / Math.max(1, b.w * b.h)); }
    if (u.d.bld && !d.shoot) dist *= 0.9; if (towersFirst) dist *= d.shoot ? 0.25 : 3;
    if (dist < bd) { bd = dist; best = b; }
  }
  return best;
}
function costFnFor(sc, u, tgt) {
  return (x, y) => {
    if (sc.water[y * N + x]) return Infinity;
    const b = bAt(sc, x, y); if (!b) return 1;
    if (b === tgt) return 1;
    if (BDEF[b.t].wall || BDEF[b.t].gate) return u.side === b.side ? 1.5 : u.d.beast ? Infinity : (BDEF[b.t].gate ? 14 : 7);
    if (BDEF[b.t].moat) return u.side === b.side ? 1.3 : 6;
    if (BDEF[b.t].decor) return 2;
    return Infinity;
  };
}
// bestie fuori dal recinto: girano lungo la palizzata in attesa (gli arcieri delle torri possono colpirle)
function beastProwl(sc, u, dt) {
  if (u.pw && u.pw.path && u.pw.i < u.pw.path.length) { const [px, py] = u.pw.path[u.pw.i]; if (moveTo(sc, u, px + 0.5, py + 0.5, dt)) u.pw.i++; return; }
  u.pw = u.pw || {}; u.pw.wait = (u.pw.wait || 0) - dt; if (u.pw.wait > 0) return; u.pw.wait = 1 + Math.random() * 2.5;
  for (let k = 0; k < 6; k++) { const a = Math.random() * 6.283, r = 2 + Math.random() * 4, tx = Math.floor(u.x + Math.cos(a) * r), ty = Math.floor(u.y + Math.sin(a) * r); if (!inMap(tx, ty) || bAt(sc, tx, ty) || isWater(sc, tx, ty)) continue;
    const p = astar(Math.floor(u.x), Math.floor(u.y), (x, y) => x === tx && y === ty, costFnFor(sc, u, null), tx, ty, 500); if (p) { u.pw.path = p; u.pw.i = 0; return; } } }
function repath(sc, u) {
  const t = u.tgt; if (!t) { u.path = null; return; }
  const r = Math.max(u.d.rng, 0.75);
  const goal = t.isB ? (x, y) => distToB(x + 0.5, y + 0.5, t) <= r + 0.15 && !(bAt(sc, x, y) && bAt(sc, x, y) !== t) : (x, y) => Math.hypot(x + 0.5 - t.x, y + 0.5 - t.y) <= Math.max(r, 1.0);
  const [tx, ty] = tPos(t);
  u.path = astar(Math.floor(u.x), Math.floor(u.y), goal, costFnFor(sc, u, t), tx, ty, 2500); u.pi = 0; u.prt = t.isB ? 3 : 1.2;
}
function moveTo(sc, u, tx, ty, dt) {
  const dx = tx - u.x, dy = ty - u.y, d = Math.hypot(dx, dy); if (d < 0.02) return true;
  const mb = sc.mode !== 'village' ? bAt(sc, Math.floor(u.x), Math.floor(u.y)) : null; const inMoat = mb && BDEF[mb.t].moat && mb.side !== u.side;
  const sp = u.d.spd * 1.3 * (u.sm || 1) * (u.gb > 0 ? 1.25 : 1) * (u.slow > 0 ? 0.6 : 1) * (inMoat ? 0.4 : 1) * dt;
  const st = Math.min(sp, d) / d;
  stepTo(sc, u, u.x + dx * st, u.y + dy * st);
  u.moving = true; setFace(u, dx, dy);
  return d <= sp;
}
function blockedFor(sc, u, x, y) { if (isWater(sc, Math.floor(x), Math.floor(y))) return true; const b = bAt(sc, Math.floor(x), Math.floor(y)); if (!b) return false; if (b === u.tgt && !b.isB) return false; if (BDEF[b.t].decor) return false; if ((BDEF[b.t].wall || BDEF[b.t].gate) && b.side === u.side) return false; return true; }
function stepTo(sc, u, nx, ny) {
  if (!blockedFor(sc, u, nx, ny)) { u.x = nx; u.y = ny; }
  else if (!blockedFor(sc, u, nx, u.y)) u.x = nx; else if (!blockedFor(sc, u, u.x, ny)) u.y = ny;
  u.x = Math.max(0.3, Math.min(N - 0.3, u.x)); u.y = Math.max(0.3, Math.min(N - 0.3, u.y));
}
function setFace(u, dx, dy) { [dx, dy] = rotV(dx, dy); const sx = dx - dy, sy = dx + dy; if (Math.abs(sx) + Math.abs(sy) < 1e-4) return; u.face = sy >= -0.15 ? 'F' : 'B'; u.flip = sx < 0; }
function dealDamage(sc, t, amt, src, kind) {
  if (t.dead) return;
  if (!t.isB) {
    if (t.inv > 0) { floatText(sc, t.x, t.y, '🛡', '#9cf', 0.6); return; }
    let a = t.d.armor || 0; if (kind === 'melee') a *= 0.5; if (src && src.d && src.d.pierce) a = 0; amt *= 1 - a;
    if (src && src.d && src.d.anticav && t.d.cav) amt *= src.d.anticav;
  } else {
    if (src && src.d && src.d.bld) amt *= 1.6;
    if (src && src.d && src.d.ranged && !src.hero && !src.d.siege) amt *= 0.55;
    if (src && src.d && src.d.siege === 'ram' && (BDEF[t.t].wall || BDEF[t.t].gate)) amt *= 3;
  }
  if (t.df) amt *= t.df; t.hp -= amt; t.hitT = 0.15; if (amt > 30 && sc.mode !== 'village') shake(amt > 60 ? 4 : 2);
  if (t.hp <= 0 && t.duro) { t.duro = 0; t.hp = Math.max(1, t.maxhp * 0.15); t.inv = 1.2; floatText(sc, t.x, t.y, '💀 Duro a Morire!', '#ffd27a', 1.3); }
  if (t.hp <= 0) { t.hp = 0; kill(sc, t); }
}
function kill(sc, t) {
  t.dead = true; t.deadT = 0;
  if (t.isB) {
    sfx('crash'); sceneIndex(sc); if (sc.mode !== 'village') { debris(sc, t); shake(BDEF[t.t].wall ? 3 : t.t === 'mastio' ? 14 : 7); }
    for (let i = 0; i < 10; i++) puff(sc, t.x + Math.random() * t.w, t.y + Math.random() * t.h, 10 + Math.random() * 30, '#7a6a55');
    if (sc.onBDead) sc.onBDead(t);
  } else { if (Math.random() < 0.5) sfx('hit'); if (sc.onUDead) sc.onUDead(t); }
}
function attack(sc, u, t) {
  const [tx, ty] = tPos(t); setFace(u, tx - u.x, ty - u.y);
  if (u.cd > 0) return;
  u.cd = u.d.cd * (u.slow > 0 ? 1.3 : 1); u.atkT = 0.32;
  if (u.d.siege === 'ram') sfx('ram'); else if (u.d.siege === 'cat') sfx('launch');
  let dmg = u.d.dmg * (u.dm || 1) * (u.gb > 0 ? 1.4 : 1) * (u.ga > 0 ? 1.1 : 1); if (u.pl && sc.arms) dmg *= sc.arms; if (u.pl && u.d.ranged && u.rm) dmg *= u.rm;
  if (u.d.fury && u.hp < u.maxhp * 0.3) { dmg *= 2; if (Math.random() < 0.3) floatText(sc, u.x, u.y, 'FURIA!', '#f55', 0.7); }
  if (u.d.charge && !u.charged) { dmg *= 2; u.charged = true; floatText(sc, u.x, u.y, 'Carica!', '#fd6', 0.8); }
  if (u.d.ranged) { shoot(sc, u.x, u.y, 26, t, dmg, u.d.ranged, u); }
  else { dealDamage(sc, t, dmg, u, 'melee'); if (Math.random() < 0.35) sfx('hit'); if (t.isB && Math.random() < 0.3) puff(sc, tx + (Math.random() - .5) * t.w * .6, ty + (Math.random() - .5) * t.h * .6, 10, '#8a7a60'); }
}
function shoot(sc, x, y, z, t, dmg, type, src) {
  const [tx, ty] = tPos(t); const d = Math.hypot(tx - x, ty - y);
  sc.P.push({ x0: x, y0: y, z0: z, t: 0, dur: Math.max(0.25, d / (type === 'bolt' ? 14 : type === 'stone' ? 6 : 10)), tgt: t, tx, ty, dmg, type, src, arc: type === 'bolt' ? 8 : type === 'stone' ? 30 + d * 5 : 14 + d * 3 });
  if (Math.random() < 0.5) sfx(type === 'bolt' ? 'bolt' : 'arrow');
}
function floatText(sc, x, y, txt, col, dur) { sc.T.push({ x, y, txt, col, t: 0, dur: dur || 1.2 }); }
function puff(sc, x, y, z, col) { sc.FX.push({ k: 'puff', x, y, z, vx: (Math.random() - .5) * 0.3, vz: 10 + Math.random() * 14, r: 4 + Math.random() * 6, t: 0, dur: 1.2 + Math.random(), col }); }

function updateScene(sc, dt) {
  sc.time += dt;
  const U = sc.U;
  for (const u of U) {
    if (u.dead) { u.deadT += dt; continue; }
    u.cd -= dt; u.atkT -= dt; u.rt -= dt; u.slow -= dt; u.inv -= dt; u.hitT -= dt; u.prt -= dt; u.moving = false;
    if (u.ai) { u.ai(sc, u, dt); continue; }
    if (u.tgt && u.tgt.dead) { u.tgt = null; u.path = null; }
    if (u.wall && u.wall.dead) { u.wall = null; u.path = null; }
    const foe = enemiesOf(u.side);
    if (u.side === 'A') {
      if (u.prowlT > 0) u.prowlT -= dt;
      if (u.rt <= 0 && !(u.d.beast && u.prowlT > 0)) {
        u.rt = 0.5;
        const aggro = u.d.ranged ? u.d.rng + 1 : 2.6;
        const hero = u.pl && sc.order === 'hero' && !u.hero ? sc.U.find(o => o.hero && o.pl && !o.dead) : null;
        if (hero) { const nu = nearestUnit(sc, hero, foe, 3.2); if (nu) { if (u.tgt !== nu) { u.tgt = nu; u.wall = null; repath(sc, u); } } else if (Math.hypot(hero.x - u.x, hero.y - u.y) > 1.8) { u.tgt = null; u.wall = null; u.path = astar(Math.floor(u.x), Math.floor(u.y), (x, y) => Math.hypot(x + .5 - hero.x, y + .5 - hero.y) < 1.5, (x, y) => { const b = bAt(sc, x, y); return sc.water[y * N + x] ? Infinity : b ? (b.side === u.side ? Infinity : 8) : 1; }, Math.floor(hero.x), Math.floor(hero.y), 1500); u.pi = 0; u.follow = hero; } }
        else {
        if (sc.order === 'towers' && u.pl && u.tgt && !u.tgt.isB && !u.d.ranged) { u.tgt = null; }
        const nu = u.d.bld || (u.pl && sc.order === 'towers' && !u.d.ranged) ? null : nearestUnit(sc, u, foe, aggro);
        if (nu && (!u.tgt || u.tgt.isB)) { u.tgt = nu; u.wall = null; repath(sc, u); }
        else if (!u.tgt) { u.tgt = pickBuilding(sc, u); if (u.tgt) repath(sc, u); } }
      }
      // le bestie non sfondano le palizzate: se non c'è un passaggio rinunciano e girano fuori dal recinto
      if (u.d.beast && u.tgt && !u.path && distTo(u, u.tgt) > Math.max(u.d.rng, 0.7) + 0.5) { u.tgt = null; u.wall = null; u.prowlT = 3 + Math.random() * 2; }
    } else { // defender guard
      if (u.rt <= 0) {
        u.rt = 0.5;
        if (u.pl && sc.order === 'hero' && !u.hero) { const h = sc.U.find(o => o.hero && o.pl && !o.dead); if (h) u.post = { x: h.x + ((u.id % 5) - 2) * 0.45, y: h.y + (((u.id / 5) | 0) % 3 - 1) * 0.45 }; }
        const charge = u.pl && sc.order === 'charge';
        const nu = nearestUnit(sc, u, foe, charge ? 60 : (u.guardR || 5));
        if (nu && (charge || Math.hypot(nu.x - u.post.x, nu.y - u.post.y) < (u.leash || 8))) { if (u.tgt !== nu) { u.tgt = nu; repath(sc, u); } }
        else if (u.tgt) { u.tgt = null; u.path = null; }
      }
    }
    if (u.gb > 0) u.gb -= dt; if (u.ga > 0) u.ga -= dt;
    if (u.hero && u.k === 'generale') { u.auraT -= dt; if (u.auraT <= 0) { u.auraT = 0.5; for (const o of U) if (!o.dead && o.side === u.side && o !== u && Math.hypot(o.x - u.x, o.y - u.y) < 3.5) o.ga = 0.7; } }
    if (u.hero && HDEF[u.k].aura) { u.auraT -= dt; if (u.auraT <= 0) { u.auraT = 1; for (const o of U) if (!o.dead && o.side === u.side && Math.hypot(o.x - u.x, o.y - u.y) < 3) o.hp = Math.min(o.maxhp, o.hp + 4); } }
    if (tryClimb(sc, u, dt)) continue;
    const t = u.wall || u.tgt;
    if (t) {
      const d = distTo(u, t), r = t.isB ? Math.max(u.d.rng, 0.55) + 0.2 : Math.max(u.d.rng, 0.7);
      if (d <= r) { attack(sc, u, t); }
      else {
        if (!t.isB && u.prt <= 0) repath(sc, u);
        if (!u.path || u.pi >= u.path.length) {
          if (!t.isB) { let [tx, ty] = tPos(t); if (u.pl && d > 1.6) { const a = (u.id * 2.39996) % 6.283, rr = Math.min(1.4, (d - 1) * 0.6); tx += Math.cos(a) * rr; ty += Math.sin(a) * rr; } moveTo(sc, u, tx, ty, dt); }
          else { if (u.prt <= 0) repath(sc, u); const [tx, ty] = tPos(t); moveTo(sc, u, tx, ty, dt); }
        } else {
          const [px, py] = u.path[u.pi];
          const wb = bAt(sc, px, py);
          if (wb && (BDEF[wb.t].wall || BDEF[wb.t].gate) && wb.side !== u.side && wb !== t) { u.wall = wb; }
          else if (moveTo(sc, u, px + 0.5, py + 0.5, dt)) u.pi++;
        }
      }
    } else if (u.d.beast) { beastProwl(sc, u, dt);
    } else if (u.side === 'D') {
      if (Math.hypot(u.x - u.post.x, u.y - u.post.y) > 0.4) moveTo(sc, u, u.post.x, u.post.y, dt);
    } else if (u.follow && u.path && u.pi < u.path.length) { const [px, py] = u.path[u.pi]; if (moveTo(sc, u, px + 0.5, py + 0.5, dt)) u.pi++; }
  }
  // separation
  for (let i = 0; i < U.length; i++) {
    const a = U[i]; if (a.dead) continue;
    for (let j = i + 1; j < U.length; j++) {
      const b = U[j]; if (b.dead) continue; const dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy, R = (a.d.cav || b.d.cav) ? 0.55 : (a.pl && b.pl ? 0.48 : 0.36);
      if (d2 < R * R && d2 > 1e-6) { const d = Math.sqrt(d2), p = (R - d) / d * 0.25;
        if (a.moving !== b.moving) { // uno cammina e l'altro è fermo: chi cammina gira attorno (scivola di lato), chi è fermo si scosta un poco
          const m = a.moving ? a : b, o = a.moving ? b : a, ux = (o.x - m.x) / d, uy = (o.y - m.y) / d; if (!m.sg) m.sg = Math.random() < 0.5 ? 1 : -1;
          const k = (R - d) * 0.9 + 0.02; stepTo(sc, m, m.x - uy * m.sg * k - ux * k * 0.3, m.y + ux * m.sg * k - uy * k * 0.3); stepTo(sc, o, o.x + uy * m.sg * k * 0.35 + ux * k * 0.2, o.y - ux * m.sg * k * 0.35 + uy * k * 0.2);
        } else { stepTo(sc, a, a.x - dx * p, a.y - dy * p); stepTo(sc, b, b.x + dx * p, b.y + dy * p); } }
    }
  }
  // towers
  for (const b of sc.B) {
    if (b.dead) { b.deadT = (b.deadT || 0) + dt; continue; }
    b.hitT -= dt;
    const sh = BDEF[b.t].shoot; if (!sh || b.inactive || sc.mode === 'village') continue;
    b.cd -= dt; if (b.cd > 0) continue;
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2; let best = null, bd = sh.range + b.lvl * 0.15;
    for (const u of U) { if (u.dead || u.side === b.side || u.side === 'V') continue; const d = Math.hypot(u.x - cx, u.y - cy); if (d < bd) { bd = d; best = u; } }
    if (best) {
      { const ddx = best.x - cx, ddy = best.y - cy; b.yawT = Math.atan2(-(ddx - ddy), ddx + ddy); b.fired = sc.time; }
      b.cd = sh.cd; const z = b.t === 'torrepietra' ? 96 : b.t === 'torre' ? 80 : b.t === 'mastio' ? 70 : b.t === 'cancello' ? 60 : 34;
      shoot(sc, cx, cy, z, best, sh.dmg * (1 + 0.3 * (b.lvl - 1)) * (b.side === 'D' && sc.mode === 'raid' ? 1 + 0.1 * tech('bal') : 1) * (b.side === 'D' && sc.mode === 'attack' ? DF().edmg : 1), sh.type, { d: { pierce: sh.type === 'bolt' } });
      const [dx, dy] = rotV(best.x - cx, best.y - cy); b.aim = { b: dx + dy < 0, flip: dx - dy < 0 }; b.fireT = 0.25;
    }
    b.fireT = (b.fireT || 0) - dt;
  }
  // projectiles
  for (const p of sc.P) {
    p.t += dt; if (!p.tgt.dead) { const [tx, ty] = tPos(p.tgt); p.tx = tx; p.ty = ty; }
    if (p.t >= p.dur) { p.done = true; if (!p.tgt.dead) dealDamage(sc, p.tgt, p.dmg, p.src, p.type); if (p.type === 'stone') { for (const o of sc.U) if (!o.dead && p.src && o.side !== p.src.side && Math.hypot(o.x - p.tx, o.y - p.ty) < 1.6) dealDamage(sc, o, p.dmg * 0.35, p.src, 'stone'); for (let i = 0; i < 5; i++) puff(sc, p.tx + (Math.random() - .5), p.ty + (Math.random() - .5), 8, '#8a7a60'); shake(3); sfx('boulder'); } }
  }
  sc.P = sc.P.filter(p => !p.done);
  // smoke from damaged buildings
  for (const b of sc.B) {
    if (b.dead ? (b.deadT < 8) : (b.hp < b.maxhp * 0.5 && !BDEF[b.t].wall)) { b.smokeT -= dt; if (b.smokeT <= 0) { b.smokeT = 0.25 + Math.random() * 0.3; puff(sc, b.x + b.w / 2 + (Math.random() - .5) * b.w * 0.5, b.y + b.h / 2 + (Math.random() - .5) * b.h * .5, b.dead ? 5 : 30, b.dead ? '#3d3833' : '#4a4540'); } }
  }
  for (const f of sc.FX) { f.t += dt; if (f.k === 'deb') debrisUpd(f, dt); else if (f.k === 'puff') { f.x += f.vx * dt; f.z += f.vz * dt; f.r += dt * 6; } if (f.upd) f.upd(sc, f, dt); }
  sc.FX = sc.FX.filter(f => f.t < f.dur);
  for (const t of sc.T) t.t += dt; sc.T = sc.T.filter(t => t.t < t.dur);
  // remove long-dead units to keep lists small
  if (sc.U.length > 160) sc.U = sc.U.filter(u => !u.dead || u.deadT < 4);
}

// ---------- hero ultimates ----------
function heroUlt(sc, u) {
  if (u.ultUsed || u.dead) return false; u.ultUsed = true; sfx('ult');
  if (u.k === 'isolde') {
    let cx = u.x, cy = u.y; const t = u.tgt || pickBuilding(sc, u); if (t) { [cx, cy] = tPos(t); }
    const foe = enemiesOf(u.side);
    sc.FX.push({ k: 'rain', x: cx, y: cy, t: 0, dur: 2.4, tick: 0, upd(sc, f, dt) { f.tick -= dt; if (f.tick <= 0 && f.t < 2) { f.tick = 0.4; for (const o of sc.U) if (!o.dead && o.side === foe && Math.hypot(o.x - f.x, o.y - f.y) < 2.8) { dealDamage(sc, o, 24, u, 'arrow'); o.slow = 4; } for (const b of sc.B) if (!b.dead && b.side === foe && distToB(f.x, f.y, b) < 2.2) dealDamage(sc, b, 40, null); } } });
    floatText(sc, u.x, u.y, 'Pioggia di Frecce!', '#ffe08a', 1.5);
  } else if (u.k === 'tomas') {
    let rev = 0; const dead = sc.U.filter(o => o.dead && o.side === u.side && !o.hero && Math.hypot(o.x - u.x, o.y - u.y) < 5);
    const n = Math.ceil(dead.length * 0.3);
    for (let i = 0; i < n; i++) { const o = dead[i]; o.dead = false; o.hp = o.maxhp * 0.5; o.deadT = 0; o.tgt = null; rev++; if (sc.onRevive) sc.onRevive(o); }
    for (const o of sc.U) if (!o.dead && o.side === u.side && Math.hypot(o.x - u.x, o.y - u.y) < 4.5) { o.hp = o.maxhp; o.slow = 0; }
    sc.FX.push({ k: 'ring', x: u.x, y: u.y, t: 0, dur: 1.4, col: '255,215,110', r: 4.5 });
    floatText(sc, u.x, u.y, `Ultima Unzione! ${rev ? '+' + rev + ' rialzati' : ''}`, '#ffe08a', 1.6);
  } else if (u.k === 'generale') {
    let n = 0; for (const o of sc.U) if (!o.dead && o.side === u.side && Math.hypot(o.x - u.x, o.y - u.y) < 5.5) { o.gb = 8; n++; }
    sc.FX.push({ k: 'ring', x: u.x, y: u.y, t: 0, dur: 1.6, col: '255,190,80', r: 5.5 });
    floatText(sc, u.x, u.y, `Giuramento di Ferro! ${n} uomini`, '#ffcf7a', 1.6);
  } else if (u.k === 'templare') {
    for (const o of sc.U) if (!o.dead && o.side === u.side && Math.hypot(o.x - u.x, o.y - u.y) < 3.2) o.inv = 6;
    for (const o of sc.U) if (!o.dead && o.side !== u.side && Math.hypot(o.x - u.x, o.y - u.y) < 5) { o.tgt = u; o.path = null; }
    sc.FX.push({ k: 'dome', x: u.x, y: u.y, t: 0, dur: 6, follow: u });
    floatText(sc, u.x, u.y, 'Muro di Scudi!', '#9cd2ff', 1.6);
  }
  return true;
}

// ---------- enemy generation ----------
const TNAMES = [['Accampamento dei Briganti', 'nella Foresta Nera'], ['Borgo del Conte Ottokar', 'sulle rive del Danubio'], ['Torre del Barone Ulrich', 'al guado di Weissfurt'], ['Grangia fortificata', 'dei monaci di Melk'], ['Rocca del Cavaliere Rinnegato', 'sul passo di Semmering'], ['Villaggio di Krems', 'tra le vigne'], ['Mastio del Vescovo', 'di Passavia'], ['Covo dei Predoni Cumani', 'nella palude'], ['Castello di Dürnstein', 'sopra il fiume']];
function refreshTargets(force) {
  if (S.targets && !force) return; const wars = (S.targets || []).filter(t => t.fid != null);
  const base = Math.max(1, S.mastio - 1 + Math.floor(S.wins / 4) * 0);
  const pool = TNAMES.slice().sort(() => Math.random() - 0.5); S.targets = [-1, 0, 1].map((k, i) => { const d = Math.max(1, Math.min(10, base + k + (i === 2 ? 1 : 0))); const nm = pool[i % pool.length]; return { d, name: nm[0], where: nm[1], seed: (Math.random() * 1e9) | 0 }; }); S.targets = wars.concat(S.targets);
}
function lootPool(d) { const m = DF().loot; const o = { cibo: 160 + 140 * d, legno: 180 + 150 * d, oro: 100 + 120 * d, pietra: d >= 3 ? 50 * d : 0, ferro: d >= 2 ? 35 * d : 0 }; for (const k in o) o[k] = Math.round(o[k] * m); return o; }
function genEnemy(tg) {
  const d = tg.d, R = rng(tg.seed);
  const sc = newScene('attack');
  if (R() < 0.7) { const sp = [[3, 3], [N - 10, 3], [3, N - 11], [N - 10, N - 11]][(R() * 4) | 0]; const pd = { k: 'lago', x: sp[0], y: sp[1], w: 7, h: 8 }; stampMask(sc.water, EMASK.pond.mask, sp[0], sp[1]); sc.decals.push(pd); }
  sc.ground = paintGround(true, sc.decals, 99 + (tg.seed % 50));
  addForests(sc, tg.seed % 1000);
  for (let i = 0; i < 4; i++) { const x = 3.5 + R() * (N - 7), y = 3.5 + R() * (N - 7); if (Math.hypot(x - MCX, y - MCX) > 9 && !isWater(sc, x | 0, y | 0)) sc.rocks.push({ x, y, s: 7, big: true }); }
  const c = N / 2 - 1; const add = (t, x, y, lvl) => { const dd = BDEF[t]; for (let yy = y; yy < y + dd.h; yy++) for (let xx = x; xx < x + dd.w; xx++) if (!inMap(xx, yy) || xx < 3 || yy < 3 || xx >= N - 3 || yy >= N - 3 || bAt(sc, xx, yy) || sc.water[yy * N + xx]) return null; const b = mkBuilding(t, x, y, lvl, 'D'); b.hp = Math.round(b.hp * DF().ehp); b.maxhp = b.hp; sc.B.push(b); sceneIndex(sc); return b; };
  const rl = Math.min(8, 1 + Math.floor(d * 0.75));
  add('mastio', c - 1, c - 1, rl);
  const r = d <= 2 ? 3 : d <= 5 ? 4 : 5; const wl = d >= 6 ? 2 : 1;
  sc.props = []; for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283 + R() * 0.4, rr = r + 3 + R() * 1.5; const x = c + 0.5 + Math.cos(a) * rr, y = c + 0.5 + Math.sin(a) * rr; if (!isWater(sc, x | 0, y | 0)) sc.props.push({ x, y, yaw: a + Math.PI / 2, h: 104 + R() * 16 }); }
  // walls ring
  const gaps = d <= 2 ? 0.45 : d <= 4 ? 0.12 : 0;
  for (let i = -r; i <= r; i++) for (const [x, y] of [[c + i, c - r], [c + i, c + r + 1], [c - r, c + i], [c + r + 1, c + i]]) { if (R() < gaps) continue; add('muro', x, y, wl); }
  add('muro', c + r + 1, c + r + 1, wl); add('muro', c + r + 1, c - r, wl);
  // inner defenses
  const nT = Math.min(4, 1 + Math.floor(d / 2)); const corners = [[c - r + 1, c - r + 1], [c + r - 1, c + r - 1], [c + r - 1, c - r + 1], [c - r + 1, c + r - 1]];
  for (let i = 0; i < nT; i++) add('torre', corners[i][0], corners[i][1], Math.min(4, 1 + Math.floor(d / 3)));
  const nB = d >= 3 ? Math.min(3, Math.floor((d - 1) / 2)) : 0; const bsp = [[c + 2, c - 1], [c - 3, c - 1], [c - 1, c + 2], [c - 1, c - 3]];
  for (let i = 0; i < nB; i++) add('balista', bsp[i][0], bsp[i][1], Math.min(3, 1 + Math.floor(d / 4)));
  if (d >= 2) { add('bottino', c + 2, c + 2, 1) || add('bottino', c - 3, c + 2, 1); }
  // outside camp
  const outs = d <= 2 ? ['tenda', 'capanno', 'tenda', 'bottino', 'tenda', 'falo', 'casa', 'fattoria'] : ['tenda', 'casa', 'taverna', 'bottino', 'casa', 'fucina', 'falo', 'granaio', 'fattoria', 'capanna', 'mercato', 'chiesa', 'municipio', 'scuderia', 'armeria', 'infermeria'];
  const nO = 4 + Math.min(6, d);
  for (let i = 0, tries = 0; i < nO && tries < 300; tries++) { const t = outs[(R() * outs.length) | 0]; const ang = R() * 6.283, rr = r + 2.5 + R() * 3.5; const x = Math.round(c + Math.cos(ang) * rr), y = Math.round(c + Math.sin(ang) * rr); if (add(t, x, y, Math.min(3, 1 + (d >> 2)))) i++; }
  for (let i = 0; i < 2; i++) add('falo', c + (i ? -2 : 1), c + (i ? 1 : -2), 1);
  for (let i = 0, tries = 0; i < 6 && tries < 80; tries++) { const t = NATURE[(R() * NATURE.length) | 0]; const x = 3 + ((R() * (N - 7)) | 0), y = 3 + ((R() * (N - 7)) | 0); if (Math.hypot(x - c, y - c) > r + 2 && add(t, x, y, 1)) i++; }
  // loot
  const pool = lootPool(d); const wt = b => ({ mastio: 3, bottino: 3, tenda: 1, capanno: 1.5, granaio: 2, fattoria: 1, torre: 0.3, balista: 0.4, casa: 1.2, taverna: 2, mercato: 2.5, municipio: 3, chiesa: 1.5, scuderia: 1.2, miniera: 1.5, fucina: 1.5, armeria: 1.5, infermeria: 1, capanna: 1.2 })[b.t] || 0;
  const tot = sc.B.reduce((s, b) => s + wt(b), 0);
  for (const b of sc.B) { const w = wt(b); for (const k in pool) b.loot[k] = Math.round(pool[k] * w / tot); }
  // defenders
  const roster = ENEMY_UNITS.slice(0, Math.min(ENEMY_UNITS.length, 2 + Math.floor(d / 1.5)));
  const nD = Math.max(1, Math.round((2 + d) * DF().def));
  for (let i = 0; i < nD; i++) { const k = roster[(R() * roster.length) | 0]; const a = R() * 6.28, rr = 1.8 + R() * (r - 1.5); let x = c + 0.5 + Math.cos(a) * rr, y = c + 0.5 + Math.sin(a) * rr; if (bAt(sc, Math.floor(x), Math.floor(y))) { x = c + 0.5 + Math.cos(a) * (r - 0.5); y = c + 0.5 + Math.sin(a) * (r - 0.5); } if (bAt(sc, Math.floor(x), Math.floor(y)) || isWater(sc, Math.floor(x), Math.floor(y))) continue; const u = mkUnit(k, 'D', x, y); u.guardR = 4.5; u.leash = 9; u.hp *= DF().ehp; u.maxhp *= DF().ehp; u.dm = DF().edmg; sc.U.push(u); }
  sc.countable = sc.B.filter(b => !BDEF[b.t].wall && !BDEF[b.t].decor).length;
  return sc;
}
function buildZone(sc) {
  const f = new Uint8Array(N * N);
  for (const b of sc.B) { if (b.dead || BDEF[b.t].decor) continue; for (let y = b.y - 2; y < b.y + b.h + 2; y++) for (let x = b.x - 2; x < b.x + b.w + 2; x++) if (inMap(x, y)) f[y * N + x] = 1; }
  sc.zone = f;
  for (let i = 0; i < N * N; i++) if (sc.water[i]) f[i] = 2;
  const cvs = sc.zoneCv || document.createElement('canvas'); cvs.width = N * 8; cvs.height = N * 8;
  const c = cvs.getContext('2d'); c.clearRect(0, 0, cvs.width, cvs.height);
  c.fillStyle = 'rgba(190,30,20,0.2)'; for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (f[y * N + x] === 1) c.fillRect(x * 8, y * 8, 8, 8);
  c.fillStyle = 'rgba(255,70,50,0.85)'; const zz = (x, y) => inMap(x, y) && f[y * N + x] === 1; for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (zz(x, y)) { if (!zz(x - 1, y)) c.fillRect(x * 8, y * 8, 1.6, 8); if (!zz(x + 1, y)) c.fillRect(x * 8 + 6.4, y * 8, 1.6, 8); if (!zz(x, y - 1)) c.fillRect(x * 8, y * 8, 8, 1.6); if (!zz(x, y + 1)) c.fillRect(x * 8, y * 8 + 6.4, 8, 1.6); }
  sc.zoneCv = cvs;
}

// ================= BATTAGLIE 2: ordini, impatto, assedio nel villaggio del regno =================
const ORDERS = { attack: [['free', '⚔', 'Libera', 'Ognuno attacca ciò che ha vicino'], ['towers', '🗼', 'Alle torri', 'La fanteria punta torri e baliste'], ['hero', '🛡', 'Con l\'eroe', 'Tutti seguono e proteggono l\'eroe']],
  raid: [['guard', '🏰', 'In difesa', 'Ognuno difende il suo posto'], ['charge', '⚔', 'Carica', 'Tutti all\'assalto dei predoni'], ['hero', '🛡', 'Con l\'eroe', 'Tutti si stringono attorno all\'eroe']] };
function renderOrders() { const el = $('#bord'); if (!el || !SC) return; const list = ORDERS[MODE === 'raid' ? 'raid' : 'attack']; const cur = SC.order || list[0][0];
  el.innerHTML = list.map(([k, ic, n, d]) => `<button class="${cur === k ? 'on' : ''}" title="${d}" onclick="setOrder('${k}')"><span>${ic}</span>${n}</button>`).join(''); }
function setOrder(k) { if (!SC) return; SC.order = k; sfx('horn'); const o = ORDERS[MODE === 'raid' ? 'raid' : 'attack'].find(x => x[0] === k); toast(`${o[1]} Ordine: ${o[3]}`); for (const u of SC.U) if (u.pl && !u.dead) { u.rt = 0; u.follow = null; if (k !== 'hero' && MODE === 'raid' && u.home0) u.post = { ...u.home0 }; } renderOrders(); }
// --- impatto: scossa e macerie ---
const SHAKE = { a: 0 };
function shake(a) { SHAKE.a = Math.min(14, Math.max(SHAKE.a, a)); }
function debris(sc, b) { const cols = BDEF[b.t].wall ? ['#7d7468', '#5c5248', '#8b6b47'] : ['#6b4e2e', '#8a6a42', '#7d7468', '#3e2c1a', '#a08356'];
  for (let i = 0; i < 26; i++) { const a = Math.random() * 6.283, v = 0.6 + Math.random() * 1.8; sc.FX.push({ k: 'deb', x: b.x + b.w / 2 + (Math.random() - .5) * b.w * 0.6, y: b.y + b.h / 2 + (Math.random() - .5) * b.h * 0.6, z: 10 + Math.random() * 30, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vz: 40 + Math.random() * 70, s: 2 + Math.random() * 4, rot: Math.random() * 6, col: cols[(Math.random() * cols.length) | 0], t: 0, dur: 1.6 + Math.random() * 0.8 }); } }
function debrisUpd(f, dt) { if (f.z > 0) { f.x += f.vx * dt; f.y += f.vy * dt; f.vz -= 220 * dt; f.z += f.vz * dt; f.rot += dt * 9; if (f.z <= 0) { f.z = 0; f.vx *= 0.2; f.vy *= 0.2; } } }
// --- assedio dentro il villaggio di un regno visitato ---
function genRealmSiege(tg) {
  const r = realms()[tg.rid]; const sc = buildRealmScene(r); sc.mode = 'attack'; sc.U = []; sc.realmSiege = true;
  for (const b of sc.B) { b.hp = Math.round(b.hp * DF().ehp); b.maxhp = b.hp; }
  const d = tg.d; const pool = lootPool(d); const wt = b => ({ mastio: 3, bottino: 3, granaio: 2, fattoria: 1, torre: 0.3, balista: 0.4, casa: 1.2, taverna: 2, mercato: 2.5, municipio: 3, chiesa: 1.5, scuderia: 1.2, miniera: 1.5, fucina: 1.5, armeria: 1.5, infermeria: 1, capanna: 1.2, tesoreria: 3, cava: 1.5 })[b.t] || 0;
  const tot = sc.B.reduce((s, b) => s + wt(b), 0) || 1; for (const b of sc.B) { const w = wt(b); for (const k in pool) b.loot[k] = Math.round(pool[k] * w / tot); }
  const m = sc.B.find(b => b.t === 'mastio'); const roster = ENEMY_UNITS.slice(0, Math.min(ENEMY_UNITS.length, 2 + Math.floor(d / 1.5))); const nD = Math.max(2, Math.round((3 + d * 1.3) * DF().def)); const R = rng(r.seed + 5);
  for (let i = 0, tries = 0; i < nD && tries < 200; tries++) { const a = R() * 6.28, rr = 2 + R() * 7; const x = m.x + 1.5 + Math.cos(a) * rr, y = m.y + 1.5 + Math.sin(a) * rr; if (!inMap(x | 0, y | 0) || bAt(sc, x | 0, y | 0) || isWater(sc, x | 0, y | 0)) continue; const u = mkUnit(roster[(R() * roster.length) | 0], 'D', x, y); u.guardR = 4.5; u.leash = 9; u.hp *= DF().ehp; u.maxhp *= DF().ehp; u.dm = DF().edmg; sc.U.push(u); i++; }
  sc.countable = sc.B.filter(b => !BDEF[b.t].wall && !BDEF[b.t].decor).length; return sc;
}
// ---------- battle flow ----------
let BT = null; // battle meta
function startAttack(i) {
  const tg = S.targets[i]; if (!tg) return; if ((S.army.ariete || 0) + (S.army.catapulta || 0)) { need3d('ariete3d'); need3d('catapulta3d'); }
  const total = Object.values(S.army).reduce((a, b) => a + b, 0); const heroes = heroList();
  if (!total && !heroes.length) { toast('Non hai truppe! Addestra prima un esercito.'); return; }
  closeSheet(); sfx('horn'); tensionStart('attack');
  closeFolk(); SC = tg.rid != null ? genRealmSiege(tg) : genEnemy(tg); if (tg.boss) bossSetup(SC); MODE = 'attack'; buildZone(SC); SC.arms = armsMult(); if (tg.boss) setTimeout(() => toast('👑 Il Margravio di Steyr in persona difende la fortezza'), 1500);
  BT = { tg, idx: i, avail: { ...S.army }, used: {}, heroes: heroes.map(k => ({ k, u: null })), timer: 210, started: false, lootGot: {}, mastioDown: false, ended: false };
  SC.onBDead = b => { for (const k in b.loot) { BT.lootGot[k] = (BT.lootGot[k] || 0) + b.loot[k]; } if (b.t === 'mastio') BT.mastioDown = true; buildZone(SC); const [x, y] = [b.x + b.w / 2, b.y + b.h / 2]; const s = Object.entries(b.loot).filter(e => e[1] > 0).map(e => `+${e[1]}${RICON[e[0]]}`).join(' '); if (s) floatText(SC, x, y, s, '#ffe9a6', 1.6); };
  SC.onRevive = u => { if (!u.hero) BT.used[u.k] = BT.used[u.k]; };
  SC.deploySel = firstAvail();
  centerCam(MCX, MCX); cam.z = VW < 600 ? 0.75 : Math.max(0.6, Math.min(1.0, VW / 1250));
  SC.rally = frontRally(); if (SC.rally) { const [rx, ry] = SC.rally; centerCam((rx + MCX) / 2, (ry + MCX) / 2); const [ax, ay] = W(rx, ry), [bx, by] = W(MCX, MCX); const span = Math.max(Math.abs(ax - bx) / (VW * 0.8), Math.abs(ay - by) / (VH * 0.45), 0.01); cam.z = Math.max(0.5, Math.min(1.1, 1 / span)); }
  showBattleHUD(); setTimeout(() => { if (BT && !BT.started) toast('⚔ Tocca le carte in basso per schierare, o «Schiera tutti»'); }, 900);
}
function heroList() { return Object.keys(HDEF).filter(k => S.mastio >= HDEF[k].lv); }
function firstAvail() { for (const k of UNIT_ORDER) if (BT.avail[k] > 0) return { k }; const h = BT.heroes.find(h => !h.u); return h ? { hero: h.k } : null; }
function startRaid() {
  closeSheet(); closeFolk(); MODE = 'raid'; sfx('bell'); S.raids++; tensionStart('raid');
  const sc = newScene('raid'); villageSetup(sc);
  for (const r of S.buildings) { const b = mkBuilding(r.t, r.x, r.y, r.lvl, 'D', null); b.raidRef = r; if (r.end) b.inactive = true; sc.B.push(b); }
  sceneIndex(sc); try { computePaths(sc); } catch (e) { }
  sc.countable = sc.B.filter(b => !BDEF[b.t].wall && !BDEF[b.t].decor).length;
  // defenders = army
  const m = sc.B.find(b => b.t === 'mastio'); const cas = sc.B.filter(b => b.t === 'caserma' || b.t === 'mastio');
  let i = 0;
  for (const k of UNIT_ORDER) for (let n = 0; n < (S.army[k] || 0); n++) { if (i > 45) break; const home = cas[i % cas.length]; const [fx, fy] = frontTile(sc, home); const u = mkUnit(k, 'D', fx + 0.5 + (Math.random() - .5) * 1.5, fy + 0.5 + (Math.random() - .5) * 1.5); if (bAt(sc, Math.floor(u.x), Math.floor(u.y))) { u.x = fx + 0.5; u.y = fy + 0.5; } u.post = { x: u.x, y: u.y }; u.guardR = 7; u.leash = 13; u.pl = true; u.home0 = { ...u.post }; unitBonus(u); recApply(u, vets(k)[n]); sc.U.push(u); i++; }
  { const al = allyReinforcements(); const m0 = sc.B.find(b => b.t === 'mastio'); if (al.length && m0) { let j = 0; for (const k of al) { const [fx, fy] = frontTile(sc, m0); const u = mkUnit(k, 'D', fx + 0.5 + (Math.random() - .5) * 3, fy + 0.5 + (Math.random() - .5) * 3); if (bAt(sc, Math.floor(u.x), Math.floor(u.y))) { u.x = fx + 0.5; u.y = fy + 0.5; } u.post = { x: u.x, y: u.y }; u.guardR = 8; u.leash = 14; u.ally = true; sc.U.push(u); j++; } setTimeout(() => toast(`🤝 Gli alleati mandano ${j} uomini in tuo aiuto`), 1500); } }
  const lv = S.mastio; const pool = ['miliziano', 'arccorto', 'miliziano']; if (lv >= 2) pool.push('scudata'); if (lv >= 3) pool.push('picchiere', 'arccorto'); if (lv >= 4) pool.push('balestriere'); if (lv >= 5) pool.push('berserker', 'scudata'); if (lv >= 6) pool.push('uomoarme');
  const pack = S.raids >= 2 && Math.random() < 0.3; if (pack) { pool.length = 0; pool.push('lupo', 'lupo', 'lupo'); if (lv >= 2) pool.push('orso'); } else { pool.push('lupo'); if (lv >= 3) pool.push('orso'); }
  const count = Math.min(50, Math.max(2, Math.round((4 + lv * 2 + Math.min(10, S.raids)) * DF().raid)));
  const side = (Math.random() * 4) | 0;
  BT = { raid: true, timer: 150, heroes: heroList().map(k => ({ k, u: null })), avail: {}, used: {}, raiders: count, killed: 0, ended: false, spawnLeft: count, spawnT: 1.5, side, pool, pack, beasts: { lupo: 0, orso: 0 } };
  SC = sc; SC.deploySel = null; SC.arms = armsMult();
  SC.onUDead = u => { if (u.side === 'A') { BT.killed++; if (u.d.beast) BT.beasts[u.k]++; } };
  centerCam(MCX, MCX); cam.z = VW < 600 ? 0.75 : Math.max(0.6, Math.min(1.0, VW / 1250));
  showBattleHUD(); toast(BT.pack ? '🐺 Ululati nella notte! Un branco di lupi e orsi scende dai boschi…' : '🔔 Le campane suonano! Predoni e bestie arrivano con la nebbia…'); if (BT.pack) sfx('horn');
}
function raidSpawn(dt) {
  if (BT.spawnLeft <= 0) return; BT.spawnT -= dt; if (BT.spawnT > 0) return;
  BT.spawnT = 0.5; const n = Math.min(BT.spawnLeft, 3); BT.spawnLeft -= n;
  for (let i = 0; i < n; i++) {
    const s = BT.side, ang = [-Math.PI / 2, 0, Math.PI / 2, Math.PI][s] + (Math.random() - .5) * 1.2, rr = 21 + Math.random() * 4;
    const x = Math.max(3, Math.min(N - 3, MCX + Math.cos(ang) * rr)), y = Math.max(3, Math.min(N - 3, MCX + Math.sin(ang) * rr));
    if (isWater(SC, x | 0, y | 0)) { BT.spawnLeft++; continue; }
    const k = BT.pool[(Math.random() * BT.pool.length) | 0]; const u = mkUnit(k, 'A', x, y); u.hp *= DF().ehp; u.maxhp *= DF().ehp; u.dm = DF().edmg; SC.U.push(u);
  }
}
function deployAt(sx, sy) {
  if (!BT || BT.ended || !SC.deploySel) return false;
  const [tx, ty] = screenToTile(sx, sy); const ix = Math.floor(tx), iy = Math.floor(ty);
  if (!inMap(ix, iy) || ix < 1 || iy < 1 || ix > N - 2 || iy > N - 2) return false;
  if (MODE === 'attack' && SC.zone[iy * N + ix]) { floatText(SC, tx, ty, '✕', '#f66', 0.6); return false; }
  if (MODE === 'raid' && bAt(SC, ix, iy)) return false;
  if (isWater(SC, ix, iy)) { floatText(SC, tx, ty, '≈', '#9cf', 0.6); return false; }
  const sel = SC.deploySel;
  if (sel.hero) {
    const h = BT.heroes.find(h => h.k === sel.hero && !h.u); if (!h) return false;
    const u = mkUnit(sel.hero, MODE === 'raid' ? 'D' : 'A', tx, ty, true); u.pl = true; unitBonus(u); recApply(u, heroRec(sel.hero)); if (MODE === 'raid') { u.guardR = 9; u.leash = 30; }
    h.u = u; SC.U.push(u); sfx('horn'); SC.deploySel = firstAvailOrNull(); BT.started = true; updateBattleHUD(true); return true;
  }
  if (!(BT.avail[sel.k] > 0)) return false;
  BT.avail[sel.k]--; BT.used[sel.k] = (BT.used[sel.k] || 0) + 1;
  const u = mkUnit(sel.k, 'A', tx + (Math.random() - .5) * 0.2, ty + (Math.random() - .5) * 0.2); u.bt = true; u.pl = true; unitBonus(u); { SC.usedRec = SC.usedRec || new Set(); const r = vets(sel.k).filter(r => !SC.usedRec.has(r.id)).sort((a, b) => (b.lvl - a.lvl) || (b.xp - a.xp))[0]; if (r) { SC.usedRec.add(r.id); recApply(u, r); } } SC.U.push(u);
  puff(SC, tx, ty, 2, '#9a8a6a'); sfx('deploy'); BT.started = true; if (!deployAt.auto) { SC.rally = [ix, iy]; SC.dn = 0; }
  if (BT.avail[sel.k] <= 0) SC.deploySel = firstAvailOrNull();
  updateBattleHUD(true); return true;
}
function firstAvailOrNull() { if (MODE === 'raid') { const h = BT.heroes.find(h => !h.u); return h ? { hero: h.k } : null; } return firstAvail(); }
// ================= MACCHINE D'ASSEDIO, SCALE E SORTITE =================
function drawSiegeAt(c, k, x, y, flip, ph, fire) {
  c.save(); c.translate(x, y); if (flip) c.scale(-1, 1);
  c.fillStyle = 'rgba(0,0,0,0.28)'; c.beginPath(); c.ellipse(0, 0, 26, 9, 0, 0, 7); c.fill();
  const wheel = (wx, wy, r) => { c.fillStyle = '#3a2614'; c.beginPath(); c.arc(wx, wy, r, 0, 7); c.fill(); c.strokeStyle = '#8a6a44'; c.lineWidth = 1.4; c.beginPath(); c.arc(wx, wy, r - 1.6, 0, 7); c.stroke(); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 4 + ph; c.beginPath(); c.moveTo(wx + Math.cos(a) * (r - 1.5), wy + Math.sin(a) * (r - 1.5)); c.lineTo(wx - Math.cos(a) * (r - 1.5), wy - Math.sin(a) * (r - 1.5)); c.stroke(); } };
  if (k === 'ariete') {
    const sw = fire ? Math.sin(Math.min(1, fire) * Math.PI) * 9 : 0;
    c.fillStyle = '#6b4424'; c.fillRect(-22, -18, 40, 8); // telaio
    c.fillStyle = '#4a2f18'; c.beginPath(); c.moveTo(-24, -18); c.lineTo(-2, -40); c.lineTo(20, -18); c.closePath(); c.fill(); // tetto
    c.fillStyle = '#8a5a32'; for (let i = 0; i < 5; i++) { c.fillRect(-21 + i * 8, -18 - (i < 3 ? i : 4 - i) * 5.5 - 6, 7, 2); }
    c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(-24, -18); c.lineTo(-2, -40); c.lineTo(20, -18); c.stroke();
    c.fillStyle = '#7a5230'; c.fillRect(-14 + sw, -15, 40, 6); c.fillStyle = '#4b4b4b'; c.beginPath(); c.moveTo(26 + sw, -17); c.lineTo(33 + sw, -12); c.lineTo(26 + sw, -7); c.closePath(); c.fill(); // tronco con punta di ferro
    wheel(-14, -6, 6); wheel(12, -6, 6);
  } else {
    const arm = fire ? (fire < 0.3 ? -1.1 + fire / 0.3 * 2.0 : 0.9 - (fire - 0.3) * 1.2) : -1.1;
    c.fillStyle = '#6b4424'; c.fillRect(-22, -14, 44, 7); c.fillStyle = '#5a3818'; c.fillRect(-4, -34, 6, 22); c.fillRect(8, -30, 5, 18);
    c.save(); c.translate(0, -30); c.rotate(arm); c.fillStyle = '#7a5230'; c.fillRect(-2, -30, 4, 34); c.fillStyle = '#3a2614'; c.beginPath(); c.arc(0, -30, 4.5, 0, 7); c.fill(); if (!fire || fire > 0.3) { c.fillStyle = '#8a8378'; c.beginPath(); c.arc(0, -33, 3.6, 0, 7); c.fill(); } c.restore();
    c.fillStyle = '#4b4b4b'; c.fillRect(-20, -18, 9, 6); wheel(-14, -6, 6); wheel(14, -6, 6);
  }
  c.restore();
}
const SIEGE_TH = {};
function siegeThumb(k) { if (SIEGE_TH[k]) return SIEGE_TH[k]; const mk = k === 'ariete' ? 'ariete3d' : 'catapulta3d'; if (!G3.models[mk]) need3d(mk); if (G3.models[mk] && G3.models[mk].ready) { const mm = G3.models[mk].m; const sp = g3sprite(mk, Math.round(1.4 * mm.size[1] * ISO_H / Math.max(mm.size[0], mm.size[2])), k === 'ariete' ? -0.75 - Math.PI / 2 : -0.75, 0); if (sp) { const cv = document.createElement('canvas'); cv.width = cv.height = 108; const c = cv.getContext('2d'); const sc = Math.min(100 / sp.w, 100 / sp.h); c.drawImage(sp.cv, (108 - sp.w * sc) / 2, 104 - sp.h * sc, sp.w * sc, sp.h * sc); return SIEGE_TH[k] = cv.toDataURL(); } } const cv = document.createElement('canvas'); cv.width = cv.height = 108; const c = cv.getContext('2d'); c.scale(1.6, 1.6); drawSiegeAt(c, k, 34, 58, false, 0, 0); return cv.toDataURL(); }
// scale: i fanti bloccati da un muro piantano una scala e lo scavalcano
function tryClimb(sc, u, dt) {
  if (!u.pl || u.side !== 'A' || u.d.cav || u.d.ranged || u.d.siege || u.hero || !u.wall || !BDEF[u.wall.t].wall) { u.clT = 0; return false; }
  if (u.climb) { u.climb.t += dt; u.moving = false; if (u.climb.t >= 1.6) { u.x = u.climb.to[0]; u.y = u.climb.to[1]; u.climb = null; u.wall = null; u.clT = 0; if (u.path) u.pi = Math.min(u.path.length, u.pi + 2); floatText(sc, u.x, u.y, '🪜', '#ffe9a6', 0.8); } return true; }
  u.clT = (u.clT || 0) + dt; if (u.clT < 3.5) return false;
  const w = u.wall, dx = w.x + 0.5 - u.x, dy = w.y + 0.5 - u.y, l = Math.hypot(dx, dy) || 1; const tx = w.x + 0.5 + dx / l * 1.0, ty = w.y + 0.5 + dy / l * 1.0;
  if (!inMap(Math.floor(tx), Math.floor(ty)) || bAt(sc, Math.floor(tx), Math.floor(ty)) || isWater(sc, Math.floor(tx), Math.floor(ty))) { u.clT = 0; return false; }
  u.climb = { t: 0, to: [tx, ty], w: [w.x + 0.5, w.y + 0.5] }; sfx('ladder'); return true;
}
function drawLadder(c, u) { if (!u.climb) return; const [ax, ay] = W(u.x, u.y), [bx, by] = W(u.climb.w[0], u.climb.w[1]); const top = by - 34; c.strokeStyle = '#7a5230'; c.lineWidth = 2; for (const o of [-4, 4]) { c.beginPath(); c.moveTo(ax + o, ay); c.lineTo(bx + o * 0.6, top); c.stroke(); } c.lineWidth = 1.4; for (let i = 1; i < 6; i++) { const k = i / 6, x = ax + (bx - ax) * k, y = ay + (top - ay) * k; c.beginPath(); c.moveTo(x - 4 + 1.6 * k, y); c.lineTo(x + 4 - 1.6 * k, y); c.stroke(); } }
// sortita: se l'assedio ristagna i difensori escono dal castello
function sortieTick(dt) {
  if (MODE !== 'attack' || !BT || BT.ended || !BT.started || BT.sortie) return; BT.stall = (BT.stall || 0) + dt; if (BT.pct > (BT.lastPct || 0)) { BT.lastPct = BT.pct; BT.stall = 0; }
  if (BT.stall < 35) return; BT.sortie = 1; const m = SC.B.find(b => b.t === 'mastio' && !b.dead); if (!m) return; const d = BT.tg.d || 1; const ks = ENEMY_UNITS.slice(0, Math.min(ENEMY_UNITS.length, 2 + Math.floor(d / 1.5))); const n = 3 + Math.min(5, Math.floor(d / 2));
  for (let i = 0; i < n; i++) { const a = i / n * 6.283, x = m.x + m.w / 2 + Math.cos(a) * (m.w / 2 + 0.8), y = m.y + m.h / 2 + Math.sin(a) * (m.h / 2 + 0.8); if (bAt(SC, Math.floor(x), Math.floor(y)) || isWater(SC, Math.floor(x), Math.floor(y))) continue; const u = mkUnit(ks[i % ks.length], 'D', x, y); u.guardR = 60; u.leash = 99; u.hp *= DF().ehp; u.maxhp *= DF().ehp; u.dm = DF().edmg; SC.U.push(u); puff(SC, x, y, 4, '#9a8a6a'); }
  toast('⚔ Sortita! I difensori escono dal castello per caricare i tuoi uomini'); sfx('horn'); shake(4);
}
function battleTick(dt) {
  if (!BT || BT.ended) return; sortieTick(dt);
  if (MODE === 'raid') { raidSpawn(dt); BT.healT = (BT.healT || 0) - dt; if (BT.healT <= 0) { BT.healT = 1; for (const b of SC.B) if ((b.t === 'infermeria' || b.t === 'chiesa') && !b.dead) for (const u of SC.U) if (!u.dead && u.side === 'D' && Math.hypot(u.x - b.x - 1, u.y - b.y - 1) < 5 && u.hp < u.maxhp) { u.hp = Math.min(u.maxhp, u.hp + 3 * b.lvl); if (Math.random() < 0.15) floatText(SC, u.x, u.y, '✚', '#9f9', 0.7); } } }
  if (BT.started || MODE === 'raid') BT.timer -= dt;
  const alive = SC.B.filter(b => !b.dead && !BDEF[b.t].wall && !BDEF[b.t].decor).length;
  const pct = Math.round((1 - alive / Math.max(1, SC.countable)) * 100);
  if (MODE === 'attack') {
    BT.pct = pct; BT.stars = (pct >= 50 ? 1 : 0) + (BT.mastioDown ? 1 : 0) + (pct >= 100 ? 1 : 0);
    const att = SC.U.some(u => !u.dead && u.side === 'A'); const left = Object.values(BT.avail).some(v => v > 0) || BT.heroes.some(h => !h.u);
    if (BT.timer <= 0 || pct >= 100 || (BT.started && !att && !left)) endBattle();
  } else {
    BT.pct = pct; const raidersAlive = SC.U.some(u => !u.dead && u.side === 'A');
    if ((BT.spawnLeft <= 0 && !raidersAlive) || BT.timer <= 0 || pct >= 100) endBattle();
  }
  updateBattleHUD();
}
function endBattle() {
  BT.ended = true; SC.deploySel = null; tensionStop();
  const dead = {}; for (const u of SC.U) if (u.dead && !u.hero && !u.ally && (u.side === (MODE === 'raid' ? 'D' : 'A'))) dead[u.k] = (dead[u.k] || 0) + 1;
  const cp = curePct(); const cured = {}; let curedN = 0; for (const k in dead) { cured[k] = Math.floor(dead[k] * cp + (Math.random() < (dead[k] * cp) % 1 ? 1 : 0)); curedN += cured[k]; dead[k] -= cured[k]; if (!dead[k]) delete dead[k]; }
  const fallen = [];
  { const side = MODE === 'raid' ? 'D' : 'A'; const left = Object.assign({}, dead); let ups = 0;
    for (const u of SC.U) if (u.rec && u.hero && u.side === side) { if (recGainXP(u.rec, u.dead ? 20 : 50)) ups++; continue; }
    for (const u of SC.U) if (u.rec && !u.hero && u.side === side) { if (u.dead && left[u.k] > 0) { left[u.k]--; u.rec.dead = true; if (u.rec.lvl >= 2 || u.rec.tr) { (S.crypt = S.crypt || []).unshift({ nm: u.rec.nm, k: u.k, lvl: u.rec.lvl, tr: u.rec.tr || null, t: now(), w: MODE === 'raid' ? 'difendendo il feudo' : (BT.tg ? 'all\'assedio di ' + BT.tg.name : 'in battaglia') }); S.crypt = S.crypt.slice(0, 60); fallen.push(u.rec); } } else if (recGainXP(u.rec, u.dead ? 15 : 35)) ups++; }
    BT.vetUps = ups; }
  for (const k in dead) S.army[k] = Math.max(0, (S.army[k] || 0) - dead[k]);
  const cureLine = ((curedN ? `<div class="row"><b>✚ Curati dall'Infermeria:</b> ${curedN}</div>` : '') + (BT.vetUps ? `<div class="row"><b>⬆ Veterani:</b> ${BT.vetUps} soldati salgono di livello</div>` : '') + (fallen.length ? `<div class="row fallen"><b>✝ Caduti con onore:</b> ${fallen.map(r => `${r.nm} (liv. ${r.lvl}${r.tr ? ', ' + TRAITS[r.tr].n : ''})`).join(', ')}${hasB('cripta') ? ' — i loro nomi riposano nella Cripta' : ''}</div>` : ''));
  let html = '';
  if (MODE === 'attack') {
    const st = BT.stars; const got = {};
    for (const k in BT.lootGot) got[k] = addRes(k, BT.lootGot[k]);
    const fav = st * 2 + (st === 3 ? Math.ceil(BT.tg.d / 2) : 0); if (fav) got.favore = addRes('favore', fav);
    if (BT.tg && BT.tg.fid != null) warResult(BT.tg.fid, st);
    if (st === 3) S.best3 = 1; if (st >= 1) { S.wins++; S.targets.splice(BT.idx, 1); if (S.targets.length < 3) { const nm = TNAMES[(Math.random() * TNAMES.length) | 0]; S.targets.push({ d: Math.max(1, S.mastio + ((Math.random() * 3) | 0) - 1), name: nm[0], where: nm[1], seed: (Math.random() * 1e9) | 0 }); } }
    html = `<div class="stars">${'★'.repeat(st)}<span>${'★'.repeat(3 - st)}</span></div><h3>${st ? 'Vittoria!' : 'Sconfitta'}</h3><p class="sub">${BT.tg.name} — distruzione ${BT.pct}%</p>
      <div class="row"><b>Bottino:</b> ${Object.keys(got).filter(k => got[k] > 0).map(k => `${ICO(k)} ${got[k]}`).join('  ') || 'nessuno'}</div>
      <div class="row"><b>Caduti:</b> ${Object.keys(dead).map(k => `${UDEF[k].n} ×${dead[k]}`).join(', ') || 'nessuno'}</div>
      ${fragReward(st)}${cureLine}<p class="lore">${st >= 2 ? '«Le campane della Marca suonano il tuo nome.»' : st ? '«Un passo in più verso la Corona.»' : '«Il fango ha inghiottito il tuo stendardo. Ritorna più forte.»'}</p>`;
  } else {
    const won = (!SC.U.some(u => !u.dead && u.side === 'A') && BT.spawnLeft <= 0) || BT.pct < 10;
    let stolen = {};
    if (!won) S.raidLostT = now();
    if (won) { S.raidsWon++; const b = addRes('oro', 12 * BT.raiders); const f = addRes('favore', 1); stolen = null; html = `<h3>Il feudo resiste!</h3><p class="sub">Predoni respinti: ${BT.killed}/${BT.raiders}</p><div class="row"><b>Taglia sui briganti:</b> 🪙 ${b}  👑 ${f}</div>`; }
    else { const k = Math.min(0.35, BT.pct / 100 * 0.6); for (const r of ['cibo', 'legno', 'oro']) { stolen[r] = Math.floor(S.res[r] * k); S.res[r] -= stolen[r]; } html = `<h3>I predoni fuggono col bottino</h3><p class="sub">Distruzione ${BT.pct}% — predoni abbattuti ${BT.killed}/${BT.raiders}</p><div class="row"><b>Rubato:</b> ${Object.keys(stolen).map(k => `${ICO(k)} ${stolen[k]}`).join('  ')}</div>`; }
    const pl = BT.beasts.lupo * 1 + BT.beasts.orso * 3; if (pl) { const gp = addRes('pelli', pl); html += `<div class="row"><b>Bestie abbattute:</b> 🐺 ${BT.beasts.lupo} · 🐻 ${BT.beasts.orso} → 🧥 +${gp} Pelli</div>`; }
    html += `<div class="row"><b>Difensori caduti:</b> ${Object.keys(dead).map(k => `${UDEF[k].n} ×${dead[k]}`).join(', ') || 'nessuno'}</div>${cureLine}<p class="lore">Le mura vengono rattoppate all'alba. Il prossimo buio arriverà.</p>`;
    S.nightIn = DF().night * seasonRaidMul() * (S.mastio <= 4 ? 1.4 : 1);
  }
  save();
  setTimeout(() => { openSheet('Esito', `<div class="result">${html}<button class="btn big" onclick="backToVillage()">Torna al feudo</button></div>`, 'result'); }, 900);
}
function backToVillage() { setTimeout(() => { if (S && S.fragStory != null) fragStoryShow(); }, 600); if (TENS.kind) tensionStop(); else if (MUS.duck) { MUS.duck = false; musicStart(); musicApply(); } closeSheet(); BT = null; MODE = 'village'; SC = buildVillage(); $('#bhud').classList.add('hidden'); $('#hud').classList.remove('hidden'); centerCam(MCX, MCX); cam.z = VW < 600 ? 1.05 : Math.max(0.7, Math.min(1.25, VW / 900)); updateHUD(); save(); }
function retreat() { if (BT && !BT.ended) { if (MODE === 'raid') { BT.timer = 0; } else endBattle(); } }

// FEUDUM · AVVIO: ciclo principale del gioco e partenza (va caricato per ultimo)
// ---------- main loop ----------
let lastT = performance.now(), hudT = 0;
function frame(t) {
  if (QQ().fps < 60 && t - lastT < 30) { requestAnimationFrame(frame); return; }
  const dt = Math.min(0.1, (t - lastT) / 1000); lastT = t;
  if (!S && MODE === 'visit' && SC) { rotTick(dt); updateScene(SC, dt); }
  if (S && MODE !== 'title') {
    economy(dt);
    rotTick(dt); if (MODE === 'village' && S) { faunaTick(dt); campaignTick(dt); lifeTick(dt); }
    if (SC) updateScene(SC, dt);
    if (MODE === 'attack' || MODE === 'raid') battleTick(dt);
    hudT -= dt; if (hudT <= 0 && MODE === 'village') { hudT = 0.5; updateHUD(); if ($('#sheet').dataset.p && $('#sheet').dataset.p.startsWith('b:')) { const r = S.buildings.find(b => b.id === +$('#sheet').dataset.p.slice(2)); if (r && r.end) openBuildingInfo(r); } }
    saveT -= dt; if (saveT <= 0) { saveT = 5; save(); }
    if (MODE === 'village' && S.creative) { S.nightIn = 600; for (const r of RES) if (r !== 'favore') S.res[r] = caps()[r]; }
    if (MODE === 'village' && !S.creative) S.nightIn = Math.max(0, (S.nightIn == null ? 600 : S.nightIn) - dt);
    if (MODE === 'village' && !placing) { S.natIn = (S.natIn == null ? 240 : S.natIn) - dt; if (S.natIn <= 0) { S.natIn = 240; if (S.buildings.filter(b => b.nat).length < 80 && spawnNature(1)) { const sel = SC.sel && SC.sel.ref; SC = buildVillage(); if (sel) SC.sel = SC.B.find(b => b.ref === sel) || null; } } }
    if (MODE === 'village' && S.nightIn <= 0 && $('#sheet').classList.contains('hidden') && !placing) {
      S.nightIn = DF().night * seasonRaidMul() * (S.mastio <= 4 ? 1.4 : 1); { const rv = realms().filter(r => Math.abs(r.lvl - S.mastio) <= 2); const who = rv.length && Math.random() < 0.5 ? rv[(Math.random() * rv.length) | 0] : null; toast(who ? `🌙 Cala la notte: i predoni di ${who.user} ${who.ic} attaccano!` : '🌙 Cala la notte. Le campane della torre…'); } setTimeout(() => { if (MODE === 'village') startRaid(); }, 2500);
    }
  }
  if (SC) { render(SC, dt); updateWxWidget(); memoTick(dt); tutTick(); } else { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#1c150e'; ctx.fillRect(0, 0, cv.width, cv.height); }
  requestAnimationFrame(frame);
}
window.addEventListener('resize', resize);
document.addEventListener('visibilitychange', () => { if (document.hidden && S) { save(); cloudPush(true); } });
window.addEventListener('pagehide', () => { if (S) { save(); cloudPush(true); } });
setInterval(() => { if (CLOUD.pend && S) cloudPush(true); }, 21000);
cloudInit(); try { if (!window.claude && navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { }
applyTheme(); resize(); treeSprites(); updateSndBtn(); buildFaunaSprites();
g3init(); ATL.src = ATLAS_SRC; BATL.src = BATLAS_SRC; EATL.src = EATLAS_SRC;
// title backdrop: show an enemy-ish village behind title
function titleScene() { const tg = { d: 7, seed: 777, name: '', where: '' }; SC = genEnemy(tg); SC.U = []; SC.mode = 'title'; centerCam(MCX, MCX); cam.z = Math.max(0.7, Math.min(1.2, VW / 1000)); cam.y += VH * 0.3 / cam.z; }
titleScene();
showTitle(); if (!SET.storySeen) storyPreload(PROLOGO); setTimeout(prologueMaybe, 400);
requestAnimationFrame(frame);

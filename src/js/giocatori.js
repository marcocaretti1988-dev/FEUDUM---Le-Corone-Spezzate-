// FEUDUM · GIOCATORI: il tuo regno — dati di edifici/truppe/eroi, salvataggi, villaggio, economia, gente, lavori, costruzione, caccia, miglioramenti
// ================= CORE: data, state, map, pathfinding =================
const RES = ['cibo', 'legno', 'oro', 'pietra', 'ferro', 'pelli', 'favore'];
const RICON = { cibo: '🌾', legno: '🪵', oro: '🪙', pietra: '🪨', ferro: '⚒️', pelli: '🧥', favore: '👑' };
const RNAME = { cibo: 'Cibo', legno: 'Legno', oro: 'Oro', pietra: 'Pietra', ferro: 'Ferro', pelli: 'Pelli', favore: 'Favore Reale' };
// building defs. max[] = max count per Mastio level 1..8. spr = sprite building (from Marco's art)
const BDEF = {
  mastio: { n: 'Mastio', w: 3, h: 3, hp: 1600, desc: 'Quartier generale del feudo. Il suo livello sblocca edifici, truppe ed eroi. Dal livello 5 diventa un Castello di pietra.', max: [1, 1, 1, 1, 1, 1, 1, 1], icon: '🏰', shoot: { range: 5.5, dmg: 8, cd: 1.3, type: 'arrow' }, pop: 2 },
  casa: { n: 'Casa', w: 2, h: 2, hp: 320, cost: { legno: 70, cibo: 30 }, prod: ['oro', 5], pop: 6, desc: 'Famiglie di contadini: +6 Popolazione per livello (posti esercito) e qualche tassa in oro.', max: [2, 3, 4, 5, 6, 7, 8, 9], icon: '🏠', t: 5, spr: 'casa' },
  taverna: { n: 'Taverna', w: 2, h: 2, hp: 450, cost: { legno: 90, oro: 20 }, prod: ['cibo', 42], desc: 'Cucina, salumi e pane per tutto il borgo. Produce molto Cibo.', max: [1, 1, 2, 2, 2, 3, 3, 3], icon: '🍖', t: 8, spr: 'taverna' },
  fattoria: { n: 'Fattoria', w: 3, h: 3, hp: 450, cost: { legno: 80 }, prod: ['cibo', 30], pop: 3, desc: 'Casa, fienile, mulino a vento e campi recintati. +30 Cibo/min, mantiene 3 abitanti in più e fornisce il fieno alla Stalla.', max: [2, 2, 3, 3, 4, 4, 5, 5], icon: '🌾', t: 6, spr: 'fattoria' },
  capanna: { n: 'Falegnameria', w: 2, h: 2, hp: 400, cost: { legno: 40, cibo: 20 }, prod: ['legno', 28], desc: 'Segheria ad acqua: il taglialegna porta i tronchi della Foresta Nera, la sega li fa assi. Produce Legno.', max: [2, 2, 3, 3, 4, 4, 5, 5], icon: '🪚', t: 6, spr: 'falegnameria' },
  fucina: { n: 'Fabbro', w: 2, h: 2, hp: 480, cost: { legno: 110, cibo: 40 }, prod: ['ferro', 12], desc: 'Forgia e incudine. Produce Ferro per armature, balestre e armi.', max: [0, 1, 1, 2, 2, 2, 3, 3], icon: '⚒️', t: 10, spr: 'fucina' },
  armeria: { n: 'Armeria', w: 2, h: 2, hp: 550, cost: { legno: 150, ferro: 60 }, arms: 0.08, desc: 'Spade, scudi e lance per tutto l\'esercito: +8% danno a tutte le truppe per livello. Serve per le truppe pesanti.', max: [0, 0, 1, 1, 1, 1, 1, 1], icon: '🗡️', t: 12, spr: 'armeria' },
  infermeria: { n: 'Infermeria', w: 2, h: 2, hp: 450, cost: { legno: 120, cibo: 80 }, cure: 0.15, desc: 'Erbe, bende e mani esperte: dopo ogni battaglia recupera il 15% dei caduti per livello. Di notte cura i difensori vicini.', max: [0, 1, 1, 1, 1, 1, 1, 1], icon: '✚', t: 10, spr: 'infermeria' },
  miniera: { n: 'Miniera', w: 3, h: 3, hp: 550, cost: { legno: 120, cibo: 60 }, prod: ['ferro', 20], bonus: { pietra: 0.5 }, desc: 'Galleria nella roccia puntellata dal legno. +20 Ferro/min e +10 Pietra/min: alimenta il Fabbro e le Mura.', max: [0, 1, 1, 2, 2, 2, 3, 3], icon: '⛏️', t: 10, spr: 'miniera' },
  cava: { n: 'Cava di Pietra', w: 2, h: 2, hp: 500, cost: { legno: 150, oro: 60 }, prod: ['pietra', 12], desc: 'Pietra per mura e Castello. Lenta da estrarre.', max: [0, 0, 1, 1, 1, 2, 2, 2], icon: '🪨', t: 12 },
  granaio: { n: 'Granaio', w: 2, h: 2, hp: 500, cost: { legno: 100 }, store: { cibo: 900, legno: 500, pietra: 300, ferro: 250 }, desc: 'Stocca Cibo, Legno, Pietra e Ferro. Evita la carestia.', max: [1, 1, 2, 2, 2, 3, 3, 3], icon: '🏚️', t: 8 },
  tesoreria: { n: 'Tesoreria', w: 2, h: 2, hp: 650, cost: { legno: 120, pietra: 40 }, store: { oro: 1000 }, desc: "Deposito dell'oro del feudo.", max: [0, 0, 1, 1, 1, 2, 2, 2], icon: '💰', t: 12 },
  caserma: { n: 'Caserma', w: 3, h: 3, hp: 700, cost: { legno: 150, cibo: 50 }, army: 1, desc: 'Addestra la fanteria.', max: [1, 1, 1, 1, 2, 2, 2, 2], icon: '⚔️', t: 10 },
  poligono: { n: 'Poligono di Tiro', w: 3, h: 3, hp: 600, cost: { legno: 200, oro: 80 }, army: 1, desc: 'Arcieri lunghi e balestrieri genovesi.', max: [0, 1, 1, 1, 1, 1, 2, 2], icon: '🏹', t: 12 },
  scuderia: { n: 'Stalla', w: 3, h: 3, hp: 650, cost: { legno: 260, oro: 150, cibo: 100 }, req: 'fattoria', desc: 'Cavalleria: Arciere a Cavallo, Guardia Reale. I cavalli addestrati qui sono +30% più veloci. Serve una Fattoria per il fieno.', max: [0, 0, 0, 1, 1, 1, 1, 1], icon: '🐎', t: 15, spr: 'stalla' },
  monastero: { n: 'Monastero', w: 3, h: 3, hp: 800, cost: { legno: 300, pietra: 200, oro: 200 }, prod: ['favore', 0.6], desc: 'Preghiere e reliquie. Lento Favore Reale e accesso alle Asce Variaghe.', max: [0, 0, 0, 0, 0, 1, 1, 1], icon: '✝️', t: 18 },
  torre: { n: 'Torre di Guardia', w: 1, h: 1, hp: 450, cost: { legno: 80, pietra: 10 }, desc: 'Torre alta con balcone di avvistamento: un arciere di guardia tira da solo con gittata lunga. Costa poco, proteggi Miniera e Fattoria.', max: [1, 2, 2, 3, 3, 4, 4, 5], icon: '🗼', t: 6, shoot: { range: 7.5, dmg: 10, cd: 1.1, type: 'arrow' }, spr: 'torre' },
  torrepietra: { n: 'Torre di Pietra', w: 2, h: 2, hp: 1500, cost: { pietra: 220, legno: 100, oro: 80 }, desc: 'Torre di guardia in pietra squadrata, con merli e tetto a punta. Gli arcieri tirano più lontano e più forte, e regge a lungo agli assedi. Arriva con l\'Età Feudale.', max: [0, 0, 0, 0, 1, 1, 2, 2], icon: '🏰', t: 16, shoot: { range: 9, dmg: 18, cd: 0.9, type: 'arrow' } },
  balista: { n: 'Torre Balista', w: 2, h: 2, hp: 700, cost: { legno: 150, pietra: 80, ferro: 40 }, desc: 'Grande balestra a torsione. Colpi pesanti, anti-cavalleria.', max: [0, 0, 1, 1, 2, 2, 3, 3], icon: '🎯', t: 12, shoot: { range: 7.5, dmg: 42, cd: 2.6, type: 'bolt' } },
  fossato: { n: 'Fossato', w: 1, h: 1, hp: 9999, cost: { pietra: 25, cibo: 10 }, desc: 'Fossato pieno d\'acqua davanti alle mura. I nemici lo attraversano a fatica (60% più lenti), le tue truppe conoscono il guado. Si unisce da solo ai fossati vicini.', max: [0, 0, 10, 20, 30, 40, 50, 60], icon: '🌊', t: 4, decor: true, moat: true, pr: 0 },
  muro: { n: 'Palizzata', w: 1, h: 1, hp: 260, cost: { legno: 6 }, desc: 'Tronchi appuntiti. Dal livello 2 (Mastio 5) diventa Mura di Pietra.', max: [60, 100, 160, 220, 280, 340, 400, 460], icon: '🪵', t: 3, wall: true },
  stendardo: { n: 'Stendardo di Casata', w: 1, h: 1, hp: 120, cost: { oro: 30 }, desc: 'Colori blu e cremisi. Puro orgoglio feudale.', max: [2, 2, 3, 3, 4, 4, 5, 5], icon: '🚩', t: 5, decor: true },
  municipio: { n: 'Municipio', w: 3, h: 3, hp: 1000, cost: { legno: 300, pietra: 120, oro: 150 }, prod: ['oro', 20], pop: 20, desc: 'Cuore amministrativo con torre dell\'orologio. +20 Popolazione per livello e tasse (+20 Oro/min). Sblocca Chiesa, Mercato e Accademia.', max: [0, 1, 1, 1, 1, 1, 1, 1], icon: '🏛️', t: 15, spr: 'municipio' },
  mercato: { n: 'Mercato', w: 3, h: 3, hp: 600, cost: { legno: 220, oro: 80 }, prod: ['oro', 10], req: 'municipio', desc: 'Cinque bancarelle colorate. +10 Oro/min e scambi: vendi legno, cibo e ferro in cambio d\'oro, o compra ferro.', max: [0, 0, 1, 1, 1, 1, 2, 2], icon: '🏪', t: 12, spr: 'mercato' },
  cripta: { n: 'Cripta degli Eroi', w: 2, h: 2, hp: 900, cost: { pietra: 160, oro: 90, legno: 40 }, desc: 'Qui riposano i veterani caduti, col loro nome e le loro gesta. Ogni eroe custodito dà +1% vita a tutte le truppe (massimo +15%).', max: [0, 0, 1, 1, 1, 1, 1, 1], icon: '⚱️', t: 14, spr: 'chiesa' },
  chiesa: { n: 'Chiesa', w: 2, h: 2, hp: 700, cost: { pietra: 200, legno: 120, oro: 100 }, req: 'municipio', desc: 'Pietra gotica, vetrate e campane. Morale: +10% vita a tutte le truppe. L\'Infermeria cura il 20% in più e di notte cura i difensori vicini.', max: [0, 0, 1, 1, 1, 1, 1, 1], icon: '⛪', t: 14, spr: 'chiesa' },
  accademia: { n: 'Accademia', w: 3, h: 3, hp: 800, cost: { legno: 300, pietra: 200, oro: 250 }, req: 'municipio', desc: 'Biblioteca e scuola di guerra: ricerche permanenti su armature, balistica e logistica.', max: [0, 0, 0, 1, 1, 1, 1, 1], icon: '📚', t: 18, spr: 'accademia' },
  cancello: { n: 'Mura con Cancello', w: 3, h: 3, hp: 1000, cost: { pietra: 150, legno: 80, ferro: 30 }, gate: true, desc: 'Torri merlate, saracinesca e porta ferrata. 1000 vita, i nemici devono abbatterla, le tue truppe passano. Ospita 2 arcieri.', max: [0, 0, 1, 1, 2, 2, 3, 4], icon: '🏯', t: 12, shoot: { range: 6, dmg: 8, cd: 0.8, type: 'arrow' }, spr: 'cancello' },
  // decorazioni / ostacoli naturali (acquistabili e rimovibili)
  funghi: { n: 'Funghi del Bosco', w: 1, h: 1, hp: 60, cost: { oro: 40 }, desc: 'Amanite rosse tra l\'erba e i fiori. Belle da vedere, da non mangiare.', max: [3, 4, 5, 6, 7, 8, 9, 10], icon: '🍄', t: 4, decor: true, spr: 'funghi', rm: { cost: { cibo: 5 }, t: 3, gain: { cibo: 40 } } },
  cespuglio: { n: 'Cespuglio', w: 1, h: 1, hp: 60, cost: { oro: 25 }, desc: 'Siepe fitta di foglie: verde e riparo per gli uccelli.', max: [4, 5, 6, 7, 8, 9, 10, 12], icon: '🌿', t: 4, decor: true, spr: 'cespuglio', rm: { cost: { cibo: 8 }, t: 5, gain: { legno: 20, cibo: 15 } } },
  masso: { n: 'Masso Muschioso', w: 1, h: 1, hp: 200, cost: { oro: 60 }, desc: 'Pietra antica coperta di muschio.', max: [2, 3, 3, 4, 4, 5, 5, 6], icon: '🪨', t: 6, decor: true, spr: 'masso', rm: { cost: { oro: 30 }, t: 12, gain: { pietra: 45 } } },
  tronco: { n: 'Tronco Caduto', w: 2, h: 1, hp: 120, cost: { oro: 50 }, desc: 'Vecchio tronco caduto, coperto di licheni.', max: [2, 2, 3, 3, 4, 4, 5, 5], icon: '🪵', t: 5, decor: true, spr: 'tronco', rm: { cost: { cibo: 20 }, t: 9, gain: { legno: 70 } } },
  // enemy-only
  tenda: { n: 'Tenda dei Briganti', w: 2, h: 2, hp: 300, icon: '⛺' },
  bottino: { n: 'Carro del Bottino', w: 2, h: 2, hp: 450, icon: '💰' },
  capanno: { n: 'Capanno', w: 2, h: 2, hp: 320, icon: '🛖' },
  falo: { n: 'Falò', w: 1, h: 1, hp: 80, icon: '🔥', decor: true },
  pozzo: { n: 'Pozzo', w: 1, h: 1, hp: 200, cost: { oro: 60, pietra: 20 }, desc: 'Il pozzo del villaggio, con il tetto di legno e la carrucola. Qui si fermano a chiacchierare le donne del borgo.', max: [1, 1, 2, 2, 3, 3, 4, 4], icon: '🪣', t: 6, decor: true, pr: 3 },
  aiuola: { n: 'Aiuola Fiorita', w: 1, h: 1, hp: 40, cost: { cibo: 20, oro: 15 }, desc: 'Papaveri, calendule e fiordalisi in un bordo di pietra.', max: [3, 4, 6, 8, 10, 12, 14, 16], icon: '🌷', t: 3, decor: true, pr: 1 },
  siepe: { n: 'Siepe Potata', w: 1, h: 1, hp: 60, cost: { legno: 15 }, desc: 'Bosso potato a regola d\'arte dai giardinieri del castello.', max: [4, 6, 8, 10, 12, 14, 16, 20], icon: '🟩', t: 3, decor: true, pr: 1 },
  lanterna: { n: 'Lanterna', w: 1, h: 1, hp: 50, cost: { legno: 10, ferro: 10 }, desc: 'Lanterna su palo di ferro. Di notte illumina strade e piazze.', max: [2, 4, 6, 8, 10, 12, 14, 16], icon: '🏮', t: 3, decor: true, pr: 1 },
  pagliaio: { n: 'Pagliaio', w: 1, h: 1, hp: 60, cost: { cibo: 30 }, desc: 'Fieno accatastato per l\'inverno attorno a un palo.', max: [2, 3, 4, 5, 6, 7, 8, 9], icon: '🌾', t: 3, decor: true, pr: 1 },
  catasta: { n: 'Catasta di Legna', w: 1, h: 1, hp: 60, cost: { legno: 40 }, desc: 'Ciocchi spaccati e impilati per scaldare le case.', max: [2, 3, 4, 5, 6, 7, 8, 9], icon: '🪵', t: 3, decor: true, pr: 1 },
  panni: { n: 'Panni Stesi', w: 1, h: 1, hp: 40, cost: { legno: 10, cibo: 10 }, desc: 'Lenzuola e tuniche ad asciugare al vento.', max: [1, 2, 3, 4, 5, 6, 7, 8], icon: '👕', t: 2, decor: true, pr: 1 },
  spaventapasseri: { n: 'Spaventapasseri', w: 1, h: 1, hp: 40, cost: { cibo: 15, legno: 10 }, desc: 'Cappello di paglia e camicia rossa: i corvi stanno alla larga.', max: [1, 2, 3, 3, 4, 4, 5, 5], icon: '🧑‍🌾', t: 2, decor: true, pr: 1 },
  carretto: { n: 'Carretto', w: 1, h: 1, hp: 80, cost: { legno: 50 }, desc: 'Un carretto carico di sacchi e grano, pronto per il mercato.', max: [1, 2, 2, 3, 3, 4, 4, 5], icon: '🛒', t: 4, decor: true, pr: 2 },
  alveari: { n: 'Alveari', w: 1, h: 1, hp: 50, cost: { legno: 30, cibo: 20 }, desc: 'Tre arnie di paglia intrecciata. Le api ronzano tra i fiori.', max: [0, 1, 2, 2, 3, 3, 4, 4], icon: '🐝', t: 4, decor: true, pr: 2 },
  recinto: { n: 'Recinto degli Animali', w: 2, h: 2, hp: 150, cost: { legno: 60, cibo: 40 }, desc: 'Pecore e galline dietro uno steccato di legno.', max: [0, 1, 1, 2, 2, 3, 3, 4], icon: '🐑', t: 6, decor: true, pr: 4 },
  bancarella: { n: 'Bancarella', w: 1, h: 1, hp: 80, cost: { legno: 40, oro: 30 }, desc: 'Banco a strisce con frutta, spezie e stoffe.', max: [0, 1, 2, 3, 4, 5, 6, 7], icon: '🎪', t: 4, decor: true, pr: 3 },
  croce: { n: 'Croce Votiva', w: 1, h: 1, hp: 150, cost: { pietra: 40 }, desc: 'Croce di pietra sui gradini, dove si prega per il raccolto.', max: [0, 1, 1, 2, 2, 3, 3, 4], icon: '✝️', t: 5, decor: true, pr: 2 },
  gogna: { n: 'Gogna', w: 1, h: 1, hp: 100, cost: { legno: 40, ferro: 10 }, desc: 'La gogna in piazza: la giustizia del signore è sotto gli occhi di tutti.', max: [0, 0, 1, 1, 1, 2, 2, 2], icon: '⛓️', t: 5, decor: true, pr: 2 },
  staccionata: { n: 'Staccionata', w: 1, h: 1, hp: 60, cost: { legno: 12 }, desc: 'Staccionata di pali grezzi. Toccala e usa ↻ Ruota per orientarla.', max: [6, 10, 14, 18, 24, 30, 36, 44], icon: '🪵', t: 2, decor: true, pr: 1 },
  steccato: { n: 'Steccato Appuntito', w: 1, h: 1, hp: 80, cost: { legno: 18 }, desc: 'Pali appuntiti piantati fitti: un recinto da villaggio di frontiera.', max: [4, 8, 12, 16, 20, 24, 28, 32], icon: '🪵', t: 2, decor: true, pr: 1 },
  cavallofrisia: { n: 'Cavallo di Frisia', w: 1, h: 1, hp: 120, cost: { legno: 30, ferro: 5 }, desc: 'Tronchi incrociati e appuntiti contro le cariche dei cavalieri.', max: [0, 2, 4, 6, 8, 10, 12, 14], icon: '✖️', t: 3, decor: true, pr: 1 },
  cassa: { n: 'Cassa di Legno', w: 1, h: 1, hp: 40, cost: { legno: 15 }, desc: 'Una cassa inchiodata, piena di attrezzi e chiodi.', max: [3, 5, 7, 9, 11, 13, 15, 18], icon: '📦', t: 2, decor: true, pr: 1 },
  cassafieno: { n: 'Cassa di Fieno', w: 1, h: 1, hp: 40, cost: { legno: 12, cibo: 10 }, desc: 'Fieno fresco per le bestie della stalla.', max: [2, 4, 6, 8, 10, 12, 14, 16], icon: '📦', t: 2, decor: true, pr: 1 },
  cassaortaggi: { n: 'Cassa di Ortaggi', w: 1, h: 1, hp: 40, cost: { legno: 12, cibo: 15 }, desc: 'Cavoli e verze appena raccolti dall\'orto.', max: [2, 4, 6, 8, 10, 12, 14, 16], icon: '🥬', t: 2, decor: true, pr: 1 },
  botte: { n: 'Botte', w: 1, h: 1, hp: 50, cost: { legno: 20 }, desc: 'Botte di rovere cerchiata di ferro: vino, birra o acqua piovana.', max: [2, 4, 6, 8, 10, 12, 14, 16], icon: '🛢️', t: 2, decor: true, pr: 1 },
  anfora: { n: 'Anfora', w: 1, h: 1, hp: 30, cost: { oro: 15 }, desc: 'Anfora di terracotta per olio e granaglie.', max: [2, 3, 4, 5, 6, 7, 8, 9], icon: '🏺', t: 2, decor: true, pr: 1 },
  fontanella: { n: 'Pompa dell\'Acqua', w: 1, h: 1, hp: 120, cost: { pietra: 30, ferro: 10 }, desc: 'Pompa di pietra con il secchio appeso: acqua fresca per il borgo.', max: [0, 1, 2, 2, 3, 3, 4, 4], icon: '🚰', t: 4, decor: true, pr: 2 },
  stenditoio: { n: 'Stenditoio delle Pelli', w: 1, h: 1, hp: 50, cost: { legno: 20, pelli: 1 }, desc: 'Pelli conciate tese ad asciugare al sole.', max: [1, 2, 3, 4, 5, 6, 7, 8], icon: '🦌', t: 3, decor: true, pr: 2 },
  rastrelliera: { n: 'Rastrelliera d\'Armi', w: 1, h: 1, hp: 150, cost: { legno: 40, ferro: 25 }, desc: 'Spade, asce, lance e uno scudo tondo, pronti per la milizia.', max: [0, 1, 2, 3, 4, 5, 6, 7], icon: '⚔️', t: 4, decor: true, pr: 3 },
  carriola: { n: 'Carriola', w: 1, h: 1, hp: 40, cost: { legno: 25 }, desc: 'Carriola di legno con la ruota a raggi, lasciata dai muratori.', max: [1, 2, 3, 4, 5, 6, 7, 8], icon: '🛞', t: 2, decor: true, pr: 1 },
  mucchiosassi: { n: 'Ometto di Pietre', w: 1, h: 1, hp: 100, cost: { pietra: 20 }, desc: 'Pietre tonde impilate a mano, come si fa lungo i sentieri.', max: [2, 3, 4, 5, 6, 7, 8, 9], icon: '🪨', t: 2, decor: true, pr: 1 },
  felce: { n: 'Felce', w: 1, h: 1, hp: 20, cost: { cibo: 8 }, desc: 'Un ciuffo di felci verdi.', max: [4, 6, 8, 10, 12, 14, 16, 20], icon: '🌿', t: 1, decor: true, pr: 1 },
  segnavia: { n: 'Segnavia', w: 1, h: 1, hp: 40, cost: { legno: 15 }, desc: 'Palo con le frecce di legno verso i villaggi vicini.', max: [1, 2, 3, 4, 5, 6, 7, 8], icon: '🪧', t: 2, decor: true, pr: 1 },
  gonfalone: { n: 'Gonfalone', w: 1, h: 1, hp: 60, cost: { oro: 40, pelli: 1 }, desc: 'Gonfalone cremisi sul palo di quercia, per le feste e le parate.', max: [0, 1, 2, 3, 4, 5, 6, 7], icon: '🚩', t: 3, decor: true, pr: 2 },
  lastricato: { n: 'Lastricato', w: 1, h: 1, hp: 999, cost: { pietra: 10 }, desc: 'Lastre di pietra per pavimentare piazze e cortili attorno agli edifici.', max: [0, 10, 20, 30, 45, 60, 80, 100], icon: '🔲', t: 1, decor: true, pr: 1, flat: true },
  muretto: { n: 'Muretto di Pietra', w: 1, h: 1, hp: 200, cost: { pietra: 25 }, desc: 'Muretto a secco di pietre squadrate. Ruotalo con ↻.', max: [0, 4, 8, 12, 16, 20, 24, 30], icon: '🧱', t: 3, decor: true, pr: 1 },
  rovinamuro: { n: 'Muro Diroccato', w: 1, h: 1, hp: 200, cost: { pietra: 30 }, desc: 'Ciò che resta di una vecchia cinta, coperto di muschio.', max: [0, 1, 2, 3, 4, 5, 6, 7], icon: '🏚️', t: 3, decor: true, pr: 2 },
  arco: { n: 'Arco Antico', w: 1, h: 1, hp: 300, cost: { pietra: 60, oro: 20 }, desc: 'Un arco di pietra rimasto in piedi da tempi dimenticati.', max: [0, 0, 1, 2, 2, 3, 3, 4], icon: '🚪', t: 5, decor: true, pr: 4 },
  colonna: { n: 'Colonna Antica', w: 1, h: 1, hp: 300, cost: { pietra: 50 }, desc: 'Colonna squadrata con capitello, segnata dai secoli.', max: [0, 0, 2, 2, 4, 4, 6, 6], icon: '🏛️', t: 5, decor: true, pr: 3 },
  rovine: { n: 'Rovine Antiche', w: 2, h: 2, hp: 400, cost: { pietra: 90, oro: 40 }, desc: 'Un angolo di muro e un pavimento di lastre: le rovine di un antico tempio.', max: [0, 0, 1, 1, 2, 2, 3, 3], icon: '🏛️', t: 6, decor: true, pr: 6 },
  insegna: { n: 'Insegna di Guerra', w: 1, h: 1, hp: 60, cost: { legno: 20, pelli: 1 }, desc: 'Lancia con il drappo di tela logora: segna i confini e le adunate. Ruotala con ↻.', max: [2, 3, 4, 6, 8, 10, 12, 14], icon: '🏴', t: 2, decor: true, pr: 1 },
  pozzogrande: { n: 'Pozzo Muschioso', w: 2, h: 2, hp: 300, cost: { pietra: 60, legno: 40, oro: 30 }, desc: 'Un grande pozzo di pietra coperto di muschio, con il tetto di assi e la carrucola.', max: [0, 1, 1, 2, 2, 3, 3, 4], icon: '🪣', t: 6, decor: true, pr: 5 },
  fontana: { n: 'Fontana di Pietra', w: 2, h: 2, hp: 400, cost: { pietra: 120, oro: 80 }, desc: 'Una vasca ottagonale con lo zampillo. Il cuore della piazza.', max: [0, 0, 1, 1, 2, 2, 2, 3], icon: '⛲', t: 10, decor: true, pr: 8 },
  statua: { n: 'Statua del Fondatore', w: 1, h: 1, hp: 500, cost: { pietra: 150, oro: 150 }, desc: 'Il primo signore della Marca, in bronzo, con la spada alzata.', max: [0, 0, 0, 0, 1, 1, 2, 2], icon: '🗽', t: 12, decor: true, pr: 12 },
};
const BUILD_ORDER = ['municipio', 'casa', 'taverna', 'mercato', 'fattoria', 'capanna', 'granaio', 'fucina', 'infermeria', 'armeria', 'miniera', 'cava', 'tesoreria', 'caserma', 'poligono', 'scuderia', 'monastero', 'chiesa', 'accademia', 'cripta', 'torre', 'torrepietra', 'cancello', 'balista', 'muro', 'fossato'];
const DECOR_ORDER = ['pozzogrande', 'pozzo', 'insegna', 'fontana', 'fontanella', 'statua', 'lastricato', 'lanterna', 'gonfalone', 'stendardo', 'aiuola', 'siepe', 'cespuglio', 'felce', 'staccionata', 'steccato', 'muretto', 'cavallofrisia', 'bancarella', 'carretto', 'carriola', 'rastrelliera', 'cassa', 'cassafieno', 'cassaortaggi', 'botte', 'anfora', 'panni', 'stenditoio', 'pagliaio', 'catasta', 'recinto', 'alveari', 'spaventapasseri', 'segnavia', 'croce', 'gogna', 'arco', 'colonna', 'rovinamuro', 'rovine', 'mucchiosassi', 'funghi', 'masso', 'tronco'];
// dimensione dei modelli delle decorazioni: w = larghezza in caselle, h = altezza in caselle
const DFIT = { pozzogrande: { w: 1.5 }, insegna: { h: 1.5 }, staccionata: { w: 1 }, steccato: { w: 0.95 }, cavallofrisia: { w: 0.85 }, cassa: { w: 0.5 }, cassafieno: { w: 0.55 }, cassaortaggi: { w: 0.55 }, botte: { h: 0.5 }, anfora: { h: 0.45 }, pozzo: { w: 0.85 }, fontanella: { h: 0.8 }, carretto: { w: 0.95 }, carriola: { w: 0.9 }, stenditoio: { w: 0.95 }, rastrelliera: { w: 1 }, mucchiosassi: { w: 0.55 }, felce: { w: 0.7 }, croce: { h: 0.85 }, segnavia: { h: 1.05 }, gonfalone: { h: 1.2 }, lanterna: { h: 1.2 }, rovinamuro: { w: 1 }, arco: { h: 1.25 }, colonna: { h: 1.3 }, rovine: { w: 1.9 }, lastricato: { w: 1.02 }, muretto: { w: 1 } };
const DYAW_RND = { botte: 1, anfora: 1, felce: 1, mucchiosassi: 1, cassa: 1, cassafieno: 1, cassaortaggi: 1 };
// prestigio: ogni decorazione completata dà punti; ogni 4 punti +1% produzione (max +20%)
function prestige() { return lifeCache().pr; }
function prestige0() { if (!S) return 0; let p = 0; for (const b of S.buildings) { const d = BDEF[b.t]; if (d.decor && !b.end && !b.nat) p += d.pr || (d.cost ? 1 : 0); } return p; }
const prestigeMult = () => (S && S.creative ? 1 : 1 + Math.min(0.2, Math.floor(prestige() / 4) / 100));
// ================= VITA DEL BORGO: umore del popolo, feste in piazza, carestia, bambini =================
const LIFEC = { t: -1, pr: 0, um: 50 };
function lifeCache() { const t = performance.now(); if (t - LIFEC.t < 1000 && LIFEC.t >= 0) return LIFEC; LIFEC.t = t; LIFEC.pr = prestige0(); LIFEC.um = umore0(); return LIFEC; }
function umore0() { if (!S) return 50; const c = caps(); const food = (S.res.cibo || 0) / Math.max(1, c.cibo);
  let u = 45 + Math.min(30, LIFEC.pr * 0.6) + Math.min(3, countB('taverna')) * 4 + (hasB('chiesa') ? 6 : 0) + (hasB('mercato') ? 4 : 0);
  u += food > 0.4 ? 8 : food < 0.01 ? -35 : food < 0.12 ? -12 : 0; if (S.raidLostT && now() - S.raidLostT < 20 * 60000) u -= 12; if (S.fest && now() < S.fest.end) u += 5;
  return Math.max(0, Math.min(100, Math.round(u))); }
const umore = () => lifeCache().um;
const umoreWord = v => v >= 75 ? ['😄', 'Festoso'] : v >= 55 ? ['🙂', 'Contento'] : v >= 35 ? ['😐', 'Inquieto'] : ['😠', 'Malcontento'];
const umoreMult = () => { if (!S || S.creative) return 1; const v = umore(); return v >= 75 ? 1.05 : v < 35 ? 0.9 : 1; };
const famine = () => !!(S && !S.creative && MODE === 'village' && (S.res.cibo || 0) < 1);
let FEST_T = 240, FEST_MT = 0;
function festTick(dt) {
  if (!S || S.creative || MODE !== 'village' || !SC) return;
  if (S.fest && now() > S.fest.end) { S.fest = null; }
  musicFesta(!!S.fest || !!FESTM.test);
  if (S.fest && !FESTM.node) { FEST_MT = (FEST_MT || 0) - dt; if (FEST_MT <= 0) { FEST_MT = 9.1; if (!festaTrack()) sfx('festa'); } }
  if (!S.fest && FESTM.node && !FESTM.test) festaTrackStop();
  if (famine()) { if (!S.famineWarned) { S.famineWarned = 1; toast('🍂 Carestia! Il granaio è vuoto: le case si spengono e il popolo è malcontento (-10% produzione)'); sfx('bell'); } } else S.famineWarned = 0;
  FEST_T -= dt; if (FEST_T > 0 || S.fest) return; FEST_T = 420 + Math.random() * 300;
  if (umore() < 70 || !PATHC.plaza || (S.nightIn != null && S.nightIn < 120)) return;
  festStart();
}
// le feste si alternano: una volta la Festa del Raccolto, la volta dopo la Festa Feudale (ognuna con la sua musica)
const FESTE = { raccolto: { n: 'Festa del Raccolto', ic: '🌾', d: 'il popolo balla attorno al falò per il grano nuovo', dur: 49 }, feudale: { n: 'Festa Feudale', ic: '🏰', d: 'stendardi, musici e danze in tondo davanti al Mastio', dur: 52 } };
const FESTM = { node: null, g: null, test: false };
function festaTrack(kk) { const k = kk || (S && S.fest && S.fest.k) || 'raccolto'; const a = ac(); if (!a || !MUS.on || SET.mute) return false; const T = trackLoad('festa_' + k); if (!T || !T.buf) return false;
  festaTrackStop(true); FESTM.g = a.createGain(); FESTM.g.gain.value = 0.0001; FESTM.g.connect(a.destination); FESTM.node = trackPlay('festa_' + k, FESTM.g, false); if (!FESTM.node) return false; fadeGain(FESTM.g, SET.mvol, 1.5); return true; }
function festaTrackStop(subito) { const nd = FESTM.node, g = FESTM.g; FESTM.node = null; FESTM.g = null; if (!nd) return; fadeGain(g, 0.0001, subito ? 0.2 : 2.5); setTimeout(() => { try { nd.stop(); g.disconnect(); } catch (e) { } }, subito ? 300 : 2700); }
function festStart() {
  const [px, py] = PATHC.plaza || [MCX, MCX]; S.festN = (S.festN || 0) + 1; const k = S.festN % 2 ? 'raccolto' : 'feudale', F = FESTE[k];
  S.fest = { end: now() + F.dur * 1000, x: px + 1.2, y: py + 1.4, k };
  addRes('favore', 1); toast(`${F.ic} ${F.n}! ${F.d[0].toUpperCase() + F.d.slice(1)}: +1 👑 Favore`); FEST_MT = 9.1; if (!festaTrack()) sfx('festa'); festFX();
  for (const u of SC.U) if (u.ai === workerAI || u.kid) { u.st = 'rest'; u.wt = Math.random() * 2; }
}
function festFX() { if (!S.fest || !SC) return; if (SC.FX.some(f => f.k === 'festa')) return; SC.FX.push({ k: 'festa', x: S.fest.x, y: S.fest.y, t: 0, dur: Math.max(1, (S.fest.end - now()) / 1000), draw: drawFesta }); }
function drawFesta(c, sc, f, wx, wy) {
  const t = sc.time, fade = Math.min(1, f.t / 2, (f.dur - f.t) / 3);
  // ghirlanda di bandierine su due pali
  const A = W(f.x - 1.6, f.y - 1.6), B = W(f.x + 1.6, f.y - 1.6); c.globalAlpha = fade;
  for (const P of [A, B]) { c.fillStyle = '#55381f'; c.fillRect(P[0] - 1.2, P[1] - 46, 2.4, 46); }
  const cols = ['#c0392b', '#f1c40f', '#2e86de', '#27ae60', '#f5f1e8'];
  for (let i = 0; i < 11; i++) { const k = (i + 0.5) / 11, x = A[0] + (B[0] - A[0]) * k, y = A[1] - 44 + (B[1] - A[1]) * k + Math.sin(k * Math.PI) * 10 + Math.sin(t * 3 + i) * 0.8; c.fillStyle = cols[i % 5]; c.beginPath(); c.moveTo(x - 3, y); c.lineTo(x + 3, y); c.lineTo(x, y + 6); c.closePath(); c.fill(); }
  // falò
  c.fillStyle = '#3a2a1a'; c.beginPath(); c.ellipse(wx, wy, 9, 4.5, 0, 0, 7); c.fill();
  for (let i = 0; i < 9; i++) { const k = ((t * 1.7 + i / 9) % 1), x = wx + Math.sin(i * 2.3 + t * 5) * 4 * (1 - k), y = wy - 3 - k * 24; c.fillStyle = `rgba(255,${(200 - k * 140) | 0},40,${0.85 * (1 - k)})`; c.beginPath(); c.arc(x, y, 5 * (1 - k) + 1.5, 0, 7); c.fill(); }
  const g = c.createRadialGradient(wx, wy - 8, 2, wx, wy - 8, 60); g.addColorStop(0, `rgba(255,180,80,${0.35 * fade})`); g.addColorStop(1, 'rgba(255,140,50,0)'); c.fillStyle = g; c.fillRect(wx - 60, wy - 68, 120, 120);
  // note musicali
  c.fillStyle = 'rgba(255,245,210,0.9)'; c.font = '11px serif'; for (let i = 0; i < 3; i++) { const k = (t * 0.5 + i / 3) % 1; c.globalAlpha = fade * (1 - k); c.fillText(i % 2 ? '♪' : '♫', wx - 18 + i * 16 + Math.sin(t * 2 + i) * 4, wy - 34 - k * 26); }
  c.globalAlpha = 1;
}
// durante la festa i paesani vanno a ballare attorno al falò
function festSpot(u) { if (!S.fest) return null; const a = Math.random() * 6.283, r = 1.3 + Math.random() * 1.1; const tx = Math.floor(S.fest.x + Math.cos(a) * r), ty = Math.floor(S.fest.y + Math.sin(a) * r); return [tx, ty]; }
// bambini che giocano a rincorrersi tra le case
function spawnKids(sc) {
  const houses = sc.B.filter(b => b.t === 'casa' && !b.dead); const n = Math.min(5, Math.floor(houses.length / 2) + (hasB('taverna') ? 1 : 0)); const R = rng(91);
  for (let i = 0; i < n; i++) { const h = houses[i % houses.length]; const [hx, hy] = frontTile(sc, h); const u = mkUnit('miliziano', 'V', hx + 0.5, hy + 0.5); u.k = ['cuoco', 'infermiera', 'fabbro', 'cuoco', 'infermiera'][i]; u.kid = true; u.d = { spd: 1.25 + R() * 0.3, hp: 1, cd: 1, rng: 0 }; u.st = 'rest'; u.wt = R() * 4; u.ai = kidAI; sc.U.push(u); }
}
function kidAI(sc, u, dt) {
  if (u.st === 'rest') { u.wt -= dt; if (u.wt > 0) return; let tx, ty; const fs = S && S.fest && now() < S.fest.end ? festSpot(u) : null;
    if (fs) [tx, ty] = fs; else { const others = sc.U.filter(o => o.kid && o !== u); if (others.length && Math.random() < 0.5) { const o = others[(Math.random() * others.length) | 0]; tx = Math.floor(o.x + (Math.random() - 0.5) * 2); ty = Math.floor(o.y + (Math.random() - 0.5) * 2); } else { const p = PATHC.plaza || [MCX, MCX]; tx = Math.floor(p[0] + (Math.random() - 0.5) * 14); ty = Math.floor(p[1] + (Math.random() - 0.5) * 14); } }
    if (!inMap(tx, ty) || bAt(sc, tx, ty) || isWater(sc, tx, ty)) { u.wt = 0.5; return; }
    u.path = astar(Math.floor(u.x), Math.floor(u.y), (x, y) => x === tx && y === ty, villagerCost(sc), tx, ty, 1500); u.pi = 0; u.st = u.path ? 'go' : 'rest'; u.wt = 1; }
  else if (u.st === 'go') { if (followPath(sc, u, dt)) { u.st = 'rest'; u.wt = (S && S.fest ? 0.6 : 1) + Math.random() * 3; } }
}

const NATURE = ['funghi', 'cespuglio', 'cespuglio', 'masso', 'funghi', 'cespuglio', 'masso', 'tronco'];
const TRONCHI_MAX = 8;
// units
const UDEF = {
  miliziano: { sn: 'Miliziano', n: 'Miliziano', hp: 55, dmg: 8, cd: 1.0, rng: 0.8, spd: 1.15, sp: 1, cost: { cibo: 40 }, lv: 1, at: 'caserma', role: 'Fanteria leggera di leva', t: 2 },
  arccorto: { sn: 'Arc. Corto', n: 'Arciere Corto', hp: 35, dmg: 9, cd: 1.1, rng: 4.5, spd: 1.15, sp: 1, cost: { legno: 50 }, lv: 1, at: 'caserma', role: 'Tiro rapido, debole vs armatura', ranged: 'arrow', t: 2 },
  scudata: { sn: 'Scudata', n: 'Guerriera Scudata', hp: 120, dmg: 12, cd: 1.0, rng: 0.8, spd: 1.0, sp: 1, cost: { cibo: 40, oro: 20, ferro: 10 }, lv: 2, at: 'caserma', role: 'Scudo rotondo: -25% danno da frecce', armor: 0.25, t: 3 },
  picchiere: { sn: 'Picchiere', n: 'Picchiere', hp: 95, dmg: 13, cd: 1.2, rng: 1.3, spd: 0.95, sp: 1, cost: { cibo: 35, legno: 30, ferro: 5 }, lv: 3, at: 'caserma', role: 'Anti-cavalleria: x3 contro i cavalli', anticav: 3, t: 3 },
  arclungo: { sn: 'Arc. Lungo', n: 'Arciere Lungo', hp: 50, dmg: 16, cd: 1.5, rng: 6.5, spd: 1.0, sp: 1, cost: { legno: 90, oro: 60 }, lv: 4, at: 'poligono', role: 'Cecchino a lunga gittata', ranged: 'arrow', t: 4 },
  balestriere: { sn: 'Balestriere', n: 'Balestriere Genovese', hp: 65, dmg: 26, cd: 2.2, rng: 5.5, spd: 0.9, sp: 1, cost: { oro: 100, ferro: 25 }, lv: 4, at: 'poligono', role: 'Dardi perforanti: ignora le armature', ranged: 'bolt', pierce: true, t: 4 },
  arccavallo: { sn: 'Arc. Cavallo', n: 'Arciere a Cavallo', hp: 140, dmg: 13, cd: 1.0, rng: 4.5, spd: 1.9, sp: 3, cost: { oro: 100, cibo: 80 }, lv: 5, at: 'scuderia', role: 'Razzia veloce, tiro al galoppo', ranged: 'arrow', cav: true, t: 5 },
  uomoarme: { sn: 'Uomo d\'Arme', n: "Uomo d'Arme", hp: 190, dmg: 20, cd: 1.1, rng: 0.8, spd: 0.95, sp: 2, cost: { oro: 100, ferro: 40, pelli: 2 }, lv: 6, at: 'caserma', need: 'armeria', role: 'Fanteria pesante: -30% frecce', armor: 0.3, t: 5 },
  berserker: { sn: 'Ascia Var.', n: 'Ascia Variaga', hp: 260, dmg: 38, cd: 1.1, rng: 0.8, spd: 1.15, sp: 2, cost: { favore: 6, oro: 80 }, lv: 6, at: 'monastero', role: 'Furia sotto il 30% di vita: danno x2. Punta agli edifici', fury: true, bld: true, t: 6 },
  guardiareale: { sn: 'Guardia R.', n: 'Guardia a Cavallo Reale', hp: 330, dmg: 34, cd: 1.4, rng: 1.0, spd: 1.8, sp: 4, cost: { oro: 200, ferro: 60, cibo: 60, pelli: 3 }, lv: 7, at: 'scuderia', need: 'armeria', role: 'Carica: il primo colpo fa danno doppio', cav: true, charge: true, armor: 0.2, t: 7 },
  ariete: { sn: 'Ariete', n: 'Ariete', hp: 650, dmg: 60, cd: 2.2, rng: 0.75, spd: 0.5, sp: 4, cost: { legno: 220, ferro: 40, cibo: 60 }, lv: 5, at: 'caserma', need: 'fucina', role: 'Sfonda mura e cancelli (danno x3). Non attacca le truppe', siege: 'ram', bld: true, armor: 0.4, t: 6 },
  catapulta: { sn: 'Catapulta', n: 'Catapulta', hp: 260, dmg: 55, cd: 4.5, rng: 9, spd: 0.45, sp: 4, cost: { legno: 300, pietra: 120, ferro: 60, oro: 80 }, lv: 7, at: 'caserma', need: 'armeria', role: 'Tira massi da lontano sugli edifici, colpisce anche chi sta vicino', siege: 'cat', ranged: 'stone', bld: true, t: 8 },
  cavpesante: { sn: 'Cav. Pesante', n: 'Cavaliere Pesante', hp: 320, dmg: 30, cd: 1.2, rng: 0.9, spd: 0.85, sp: 3, cost: { oro: 180, ferro: 80, pelli: 4 }, lv: 8, at: 'caserma', need: 'armeria', role: 'Armatura a piastre: -35% danni', armor: 0.35, t: 7 },
};
// bestie notturne (non addestrabili)
UDEF.lupo = { sn: 'Lupo', n: 'Lupo', hp: 70, dmg: 11, cd: 0.8, rng: 0.8, spd: 1.7, sp: 1, beast: true, cost: {}, lv: 99 };
UDEF.orso = { sn: 'Orso', n: 'Orso Bruno', hp: 340, dmg: 30, cd: 1.4, rng: 0.9, spd: 1.0, sp: 3, beast: true, bld: true, cost: {}, lv: 99, armor: 0.15 };
const UNIT_ORDER = ['miliziano', 'arccorto', 'scudata', 'picchiere', 'arclungo', 'balestriere', 'arccavallo', 'uomoarme', 'berserker', 'guardiareale', 'cavpesante', 'ariete', 'catapulta'];
const HDEF = {
  isolde: { n: 'Lady Isolde', title: 'Signora delle Valli', hp: 420, dmg: 22, cd: 0.9, rng: 7, spd: 1.1, lv: 2, ranged: 'arrow', ult: 'Pioggia di Frecce', ultd: 'Raffica di frecce su un\'area: danni pesanti e rallenta i nemici del 40%.' },
  tomas: { n: 'Fratello Tomas', title: 'Il Confessore', hp: 650, dmg: 18, cd: 1.0, rng: 1.0, spd: 1.0, lv: 4, ult: 'Ultima Unzione', ultd: 'Cura completa degli alleati vicini e rialza il 30% dei caduti. Aura: cura lenta.', aura: true },
  generale: { n: 'Gottfried di Ferro', title: 'Generale, il Portatore del Giuramento', hp: 1100, dmg: 34, cd: 1.0, rng: 1.0, spd: 0.95, lv: 5, armor: 0.35, model: 1, ult: 'Giuramento di Ferro', ultd: 'Alza lo stendardo: per 8 secondi le truppe vicine fanno +40% danno e si muovono più in fretta. Aura: +10% danno alle truppe attorno a lui.' },
  templare: { n: 'Sir Aldric', title: 'Templare, Difensore della Marca', hp: 950, dmg: 40, cd: 1.0, rng: 1.0, spd: 1.0, lv: 6, armor: 0.3, ult: 'Muro di Scudi', ultd: 'Lui e gli alleati vicini diventano invulnerabili per 6 secondi e attira i nemici.' },
};
const ENEMY_UNITS = ['miliziano', 'arccorto', 'scudata', 'picchiere', 'balestriere', 'uomoarme', 'berserker'];
const MASTIO_UP = [null,
  { legno: 200, cibo: 100 }, { legno: 650, cibo: 400, oro: 200 }, { legno: 1100, cibo: 600, oro: 450, pietra: 250 },
  { legno: 1700, cibo: 1500, oro: 1000, pietra: 700, ferro: 260, favore: 5 }, { legno: 2600, cibo: 2400, oro: 1600, pietra: 1300, ferro: 450 }, { legno: 3600, cibo: 3400, oro: 2300, pietra: 1900, ferro: 700, favore: 10 }, { legno: 4800, cibo: 4500, oro: 3100, pietra: 2600, ferro: 1000, favore: 20 },
  { legno: 3800, oro: 2500, pietra: 2100, ferro: 850, favore: 25 }, { legno: 5000, oro: 3300, pietra: 2800, ferro: 1100, favore: 30 }, { legno: 6500, oro: 4300, pietra: 3600, ferro: 1450, favore: 35 }, { legno: 8400, oro: 5600, pietra: 4600, ferro: 1900, favore: 40 },
  { legno: 11000, oro: 7300, pietra: 6000, ferro: 2500, favore: 50 }, { legno: 14000, oro: 9500, pietra: 7800, ferro: 3200, favore: 60 }, { legno: 18000, oro: 12000, pietra: 10000, ferro: 4200, favore: 70 }, { legno: 23000, oro: 15500, pietra: 13000, ferro: 5500, favore: 90 }];
const ERA = l => l <= 4 ? { n: 'Età del Legno', s: 'I', c: '#8B5A2B', hc: '#e0b07a' } : l <= 8 ? { n: 'Età Feudale', s: 'II', c: '#1e3a8a', hc: '#9fb6ff' } : l <= 12 ? { n: 'Età dei Castelli', s: 'III', c: '#991b1b', hc: '#ff9a8a' } : { n: 'Età Imperiale', s: 'IV', c: '#b45309', hc: '#ffd27a' };
const YEAR = l => l <= 4 ? 1253 + l : l <= 8 ? 1258 + (l - 5) * 2 : l <= 12 ? 1266 + (l - 9) * 2 : 1273 + (l - 13) * 2;
const MASTIO_DESC = ['', 'Torre di tronchi con tetto di paglia e fossato fangoso.', 'Torre di tronchi più alta, primo stendardo.', 'Annesso di legno e guardie fisse.', 'Palizzata ai piedi del Mastio.', 'Il Mastio diventa Castello: torri, stendardi e porta ferrata. Inizia l\'Età Feudale.', 'Castello più alto e massiccio, mura merlate.', 'Castello imponente: la Marca lo vede da lontano.', 'Rocca feudale completa: la Corona Spezzata ti attende.', 'Donjon normanno a pianta quadrata: inizia l\'Età dei Castelli.', 'Torri circolari agli angoli e cammino di ronda.', 'Mura di pietra squadrata e saracinesca.', 'Fortezza da assedio con macchine sulle mura.', 'Castello imperiale: inizia l\'Età Imperiale.', 'Mura concentriche e barbacane.', 'Pietra bianca di Caen e stendardi reali.', 'La Corona Spezzata è tua.'];

// ---------- state ----------
let S = null;
let SAVE_KEY = 'feudum_proto_v1';
function newState() {
  return {
    v: 1, mapv: 3, res: { cibo: 300, legno: 450, oro: 150, pietra: 0, ferro: 0, favore: 0 }, mastio: 1, mastioEnd: 0,
    buildings: [], army: { miliziano: 6, arccorto: 3 }, queue: [], heroes: {}, wins: 0, raids: 0, raidsWon: 0,
    nightAt: 0, nightIn: DF().truce, last: Date.now(), targets: null, log: [], sound: true, nextId: 1, tut: 0, fauna: [], faunaIn: 0, mapv: 3, mq: 0, best3: 0
  };
}
// ---- salvataggio: nel browser + nel cloud del tuo account claude.ai (sopravvive a chiusure, cache pulita, altri dispositivi) ----
const CLOUD = { doc: null, ready: false, pend: false, t: 0, last: 0, err: 0 };
function cloudDoc(key) { return CLOUD.col ? CLOUD.col.doc(key) : null; }
async function cloudPerms() { try { const p = window.claude && await claude.use('permissions'); if (!p) return null; return await p.state(); } catch (e) { return null; } }
async function cloudAsk() { try { const p = window.claude && await claude.use('permissions'); if (!p) { toast('Permessi non disponibili qui: apri il gioco dall\'app Claude'); return; } const st = await p.state(); const want = ['db', 'user'].filter(k => st[k] !== 'granted'); if (want.some(k => st[k] === 'denied')) { try { await p.manage(); } catch (e) { toast('Apri il menu Permessi dell\'artefatto (in alto) e attiva Archivio e Utente'); } } else if (want.length) await p.request(want); CLOUD.why = 'controllo…'; if (MODE === 'title') showTitle(); await cloudInit(); if (CLOUD.ready) toast('☁ Salvataggio nel cloud attivo'); } catch (e) { toast('Non riesco ad attivare il cloud'); } }
async function cloudInit() {
  try { if (!window.claude || !window.claude.use) { CLOUD.why = 'pagina fuori da claude.ai'; return; } const [db, user] = await Promise.all([claude.use('db'), claude.use('user')]); if (!user || !db) { const ps = await cloudPerms(); CLOUD.ps = ps; }
    if (!user) { CLOUD.why = 'account non riconosciuto' + (CLOUD.ps ? ` (permessi: archivio ${CLOUD.ps.db || 'non offerto'}, utente ${CLOUD.ps.user || 'non offerto'})` : ''); if (MODE === 'title') showTitle(); return; } const lvl = { own: user.isOwner ? await user.isOwner() : null, edit: user.canEdit ? await user.canEdit() : null }; CLOUD.lvl = lvl; if (!db) { CLOUD.why = lvl.own === false ? 'stai usando un account diverso da quello del gioco' : 'archivio non disponibile'; if (MODE === 'title') showTitle(); return; } const id = await user.id(); if (!id) { CLOUD.why = 'non hai fatto l\'accesso a claude.ai'; if (MODE === 'title') showTitle(); return; }
    CLOUD.col = db.collection('data/users/' + id); try { await CLOUD.col.doc('ping').set({ t: Date.now() }); } catch (e) { CLOUD.why = 'scrittura rifiutata (' + (e && e.code || 'errore') + ')'; if (MODE === 'title') showTitle(); return; } CLOUD.ready = true;
    for (const key of ['feudum_proto_v1', 'feudum_creativo']) { const snap = await cloudDoc(key).get(); if (!snap.exists) continue; const d = snap.data(); let loc = null; try { loc = JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { }
      if (d && d.s && (!loc || (d.t || 0) > (loc.last || 0) + 1000)) { try { localStorage.setItem(key, d.s); } catch (e) { } CLOUD.mem = CLOUD.mem || {}; CLOUD.mem[key] = d.s; } }
    if (MODE === 'title') showTitle();
  } catch (e) { CLOUD.err++; }
}
function cloudPush(now_) {
  if (!CLOUD.ready || !S || SAVE_KEY.startsWith('feudum_max')) return; const t = Date.now(); if (!now_ && t - CLOUD.t < 20000) { CLOUD.pend = true; return; }
  CLOUD.t = t; CLOUD.pend = false; const s = JSON.stringify(S); if (s === CLOUD.lastS) return; CLOUD.lastS = s;
  cloudDoc(SAVE_KEY).set({ s, t: S.last || t, m: S.mastio || 1 }).then(() => { CLOUD.last = Date.now(); }).catch(e => { CLOUD.err++; CLOUD.lastS = null; });
}
function save() { S.last = Date.now(); const j = JSON.stringify(S); CLOUD.mem = CLOUD.mem || {}; CLOUD.mem[SAVE_KEY] = j; try { localStorage.setItem(SAVE_KEY, j); } catch (e) { } backupTick(j); cloudPush(false); }
// ---- copie di sicurezza: ultima ora, ieri, l'altro ieri (+ quella fatta prima di una nuova campagna) ----
const BK_SLOTS = { h: 'Un\'ora fa circa', d1: 'Ieri', d2: 'L\'altro ieri', nuova: 'Prima di «Nuova Campagna»' };
function bkMeta() { try { return JSON.parse(localStorage.getItem('feudum_bk_' + SAVE_KEY) || '{}'); } catch (e) { return {}; } }
function bkPut(slot, j, meta) { try { localStorage.setItem(SAVE_KEY + '_bk_' + slot, j); const s = JSON.parse(j); meta[slot] = { t: Date.now(), m: s.mastio, ch: s.mq }; localStorage.setItem('feudum_bk_' + SAVE_KEY, JSON.stringify(meta)); } catch (e) { } }
function backupTick(j) { if (!S || S.sandbox || S.creative) return; const M = bkMeta(), t = Date.now(); const day = x => new Date(x).toDateString();
  if (!M.h || t - M.h.t > 3600000) bkPut('h', j, M);
  if (!M.d1 || day(M.d1.t) !== day(t)) { if (M.d1) { try { const old = localStorage.getItem(SAVE_KEY + '_bk_d1'); if (old) bkPut('d2', old, M); M.d2 && (M.d2.t = M.d1.t); localStorage.setItem('feudum_bk_' + SAVE_KEY, JSON.stringify(M)); } catch (e) { } } bkPut('d1', j, M); } }
function openBackups(fromTitle) { const M = bkMeta(); const rows = Object.keys(BK_SLOTS).filter(k => M[k]).map(k => { const m = M[k]; const w = new Date(m.t).toLocaleString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); return `<div class="row" style="display:flex;align-items:center;gap:8px;justify-content:space-between"><div><b>${BK_SLOTS[k]}</b><br><small>Mastio ${m.m || 1} · salvata ${w}</small></div><button class="btn" onclick="restoreBk('${k}',${fromTitle ? 1 : 0})">Ripristina</button></div>`; }).join('');
  openSheet('🛟 Copie di sicurezza', `<p class="desc">Il gioco conserva da solo alcune copie della tua campagna. Se qualcosa va storto puoi tornare a una di queste.</p>${rows || '<p class="desc"><i>Nessuna copia ancora: si creano mentre giochi.</i></p>'}`, 'bk'); }
function restoreBk(k, fromTitle) { askYes(`Tornare alla copia «${BK_SLOTS[k]}»?<br><small>La partita attuale viene sostituita (ne tengo comunque una copia).</small>`, () => { try { const j = localStorage.getItem(SAVE_KEY + '_bk_' + k); if (!j) { toast('Copia non trovata'); return; } const cur = localStorage.getItem(SAVE_KEY); if (cur) bkPut('nuova', cur, bkMeta()); localStorage.setItem(SAVE_KEY, j); CLOUD.mem = CLOUD.mem || {}; CLOUD.mem[SAVE_KEY] = j; closeSheet(); toast('🛟 Copia ripristinata'); beginGame(false); } catch (e) { toast('Ripristino non riuscito'); } }, 'Ripristina'); }
function load() { try { const j = localStorage.getItem(SAVE_KEY) || (CLOUD.mem && CLOUD.mem[SAVE_KEY]); if (j) { const s = JSON.parse(j); if (s && s.v === 1) return s; } } catch (e) { } return null; }
function bLvlCap() { if (S && S.creative) return 4; return S.mastio <= 8 ? Math.min(4, 1 + Math.floor(S.mastio / 2)) : Math.min(8, 4 + Math.ceil((S.mastio - 8) / 2)); }
function caps() {
  const c = { cibo: 800 + 550 * S.mastio, legno: 600 + 450 * S.mastio, oro: 400 + 350 * S.mastio, pietra: 300 + 300 * S.mastio, ferro: 250 + 200 * S.mastio, pelli: 60 + 40 * S.mastio, favore: 999 };
  for (const b of S.buildings) { const d = BDEF[b.t]; if (d.store && !b.end) for (const r in d.store) c[r] += d.store[r] * b.lvl; }
  return c;
}
function armyCap() { let c = 6; for (const b of S.buildings) { const d = BDEF[b.t]; if (d.pop && !(b.end && b.lvl <= 1 && b.toLvl === 1)) c += d.pop * b.lvl; } return c; }
function popTxt() { return `${armyUsed()}/${armyCap()}`; }
function lvlSum(t) { return S.buildings.filter(b => b.t === t && !(b.end && b.toLvl === 1)).reduce((a, b) => a + b.lvl, 0); }
function armsMult() { return 1 + 0.08 * lvlSum('armeria'); }
function curePct() { return Math.min(0.7, 0.15 * lvlSum('infermeria') * (lvlSum('chiesa') ? 1.2 : 1)); }
const TECH = { arm: { n: 'Armature', icon: '🛡️', d: '+8% vita a tutte le truppe', cost: l => ({ ferro: 80 * l, oro: 120 * l, pelli: 4 * l }) }, bal: { n: 'Balistica', icon: '🎯', d: '+10% danno a distanza (arcieri, balestre, torri)', cost: l => ({ legno: 150 * l, oro: 120 * l }) }, log: { n: 'Logistica', icon: '🐾', d: '+8% velocità di marcia', cost: l => ({ cibo: 200 * l, oro: 100 * l }) } };
function tech(k) { return (S.tech && S.tech[k]) || 0; }
function unitBonus(u) { if (!S) return; const hm = (1 + 0.08 * tech('arm')) * (lvlSum('chiesa') ? 1.1 : 1) * (1 + cryptBonus()); u.maxhp *= hm; u.hp *= hm; u.sm = (1 + 0.08 * tech('log')) * (!u.hero && UDEF[u.k] && UDEF[u.k].at === 'scuderia' ? 1.3 : 1); u.rm = 1 + 0.1 * tech('bal'); }
let BTHUMB = {};
function bThumb(k) { if (BTHUMB[k] || !BATL_OK || !BFR[k]) return BTHUMB[k] || null; const f = BFR[k], s = 64 / Math.max(f[2], f[3]); const cv2 = document.createElement('canvas'); cv2.width = 64; cv2.height = 64; cv2.getContext('2d').drawImage(BATL, f[0], f[1], f[2], f[3], (64 - f[2] * s) / 2, (64 - f[3] * s) / 2, f[2] * s, f[3] * s); return BTHUMB[k] = cv2.toDataURL(); }
function armyUsed() { let n = 0; for (const k in S.army) n += S.army[k] * UDEF[k].sp; for (const q of S.queue) n += UDEF[q.k].sp; return n; }
function canPay(cost) { if (S && S.creative) return true; for (const r in cost) if ((S.res[r] || 0) < cost[r]) return false; return true; }
function pay(cost) { if (S && S.creative) return; for (const r in cost) S.res[r] -= cost[r]; }
function addRes(r, v) { const c = caps(); const before = S.res[r]; S.res[r] = Math.min(c[r], S.res[r] + v); const got = S.res[r] - before; if (got < v && typeof diaryWaste === 'function') diaryWaste(r, v - got); return got; }
function scaleCost(cost, lvl) { const o = {}; for (const r in cost) o[r] = Math.round(cost[r] * Math.pow(1.9, lvl - 1)); return o; }
function costStr(cost) { return Object.keys(cost).map(r => `<span class="${(S.res[r] || 0) >= cost[r] ? '' : 'no'}">${ICO(r)} ${cost[r]}</span>`).join(' '); }
function countB(t) { return S.buildings.filter(b => b.t === t && !b.nat).length; }
function maxB(t) { if (S && S.creative && BDEF[t].max) return BDEF[t].wall ? 999 : 99; if (!BDEF[t].max) return 0; const base = BDEF[t].max[Math.min(8, S.mastio) - 1]; return S.mastio > 8 && t !== 'mastio' ? base + Math.round(base * (S.mastio - 8) / 8) : base; }
function builders() { if (S && S.creative) return 0; return S.buildings.filter(b => b.end && !BDEF[b.t].wall && !BDEF[b.t].decor).length + (S.mastioEnd ? 1 : 0); }
const MAX_BUILDERS = 2;
// ---------- initial state ----------
function initialBuildings() {
  const L = [['mastio', 14, 14], ['caserma', 8, 13], ['fattoria', 13, 7], ['capanna', 20, 14], ['granaio', 14, 20], ['casa', 8, 8], ['casa', 19, 8], ['torre', 6, 17], ['torre', 23, 10], ['stendardo', 13, 17], ['stendardo', 17, 13]];
  return L.map(([t, x, y]) => ({ id: S.nextId++, t, x: x + OFF, y: y + OFF, lvl: 1, stock: 0, end: 0 }));
}
function startNew() { S = newState(); S.buildings = initialBuildings(); save(); }
function mastioRef() { return S.buildings.find(b => b.t === 'mastio'); }

// ---------- village scene ----------
function occupiedBy(x, y, w, h, ignore, skipMuro) {
  for (const b of S.buildings) { if (b === ignore || (skipMuro && b.t === 'muro')) continue; const d = BDEF[b.t]; if (x < b.x + d.w && x + w > b.x && y < b.y + d.h && y + h > b.y) return b; }
  return null;
}
function canPlace(t, x, y, ignore) { const d = BDEF[t]; if (x < 3 || y < 3 || x + d.w > N - 3 || y + d.h > N - 3) return false; const wv = villageWater(); for (let yy = y; yy < y + d.h; yy++) for (let xx = x; xx < x + d.w; xx++) if (wv[yy * N + xx]) return false; return !occupiedBy(x, y, d.w, d.h, ignore, !!d.gate); }
function buildVillage() {
  const sc = newScene('village'); villageSetup(sc);
  for (const r of S.buildings) { const b = mkBuilding(r.t, r.x, r.y, r.lvl, 'D', r); if (r.rotto) { b.dead = true; b.deadT = 99; } sc.B.push(b); }
  sceneIndex(sc);
  computePaths(sc);
  // workers
  const jobs = [];
  for (const b of sc.B) {
    if (b.t === 'capanna') jobs.push(['taglialegna', b, 'tree']);
    if (b.t === 'mercato') jobs.push(['cuoco', b, 'self']);
    if (b.t === 'chiesa' || b.t === 'municipio' || b.t === 'accademia') jobs.push(['infermiera', b, 'wander']);
    if (b.t === 'taverna' || b.t === 'fattoria') jobs.push(['cuoco', b, 'self']);
    if (b.t === 'fucina' || b.t === 'armeria' || b.t === 'caserma' || b.t === 'miniera' || b.t === 'cava') jobs.push(['fabbro', b, 'self']);
    if (b.t === 'infermeria' || b.t === 'mastio' || b.t === 'monastero') jobs.push(['infermiera', b, b.t === 'infermeria' ? 'self' : 'wander']);
  }
  for (const [k, home, kind] of jobs) {
    const [hx, hy] = frontTile(sc, home);
    const u = mkUnit('miliziano', 'V', hx + 0.5, hy + 0.5); u.k = k; u.d = { spd: 0.7, hp: 1, cd: 1, rng: 0 }; u.home = home; u.jk = kind; u.st = 'rest'; u.wt = Math.random() * 4; u.ai = workerAI; { const wr = workRec(home.ref ? home.ref.id : home.id, k); u.wrec = wr; u.d.spd = 0.7 * (1 + 0.1 * (wr.spd || 0)); }
    sc.U.push(u);
  }
  // idle soldiers in formation near first caserma
  const cas = sc.B.find(b => b.t === 'caserma');
  if (cas) {
    let i = 0; const list = [];
    // un po' di ogni tipo (a turno), così si vedono anche arcieri e truppe speciali
    { const left = {}; for (const k of UNIT_ORDER) left[k] = S.army[k] || 0; let more = true; while (more && list.length < 14) { more = false; for (const k of UNIT_ORDER) if (left[k] > 0 && list.length < 14) { list.push(k); left[k]--; more = true; } } list.sort((a, b) => (ANIM3D[b] ? 1 : 0) - (ANIM3D[a] ? 1 : 0) || UNIT_ORDER.indexOf(a) - UNIT_ORDER.indexOf(b)); }
    // schierati in riga davanti alla caserma: file parallele allo schermo, tutti rivolti verso di noi
    const PER = 5, DX = 0.82, DR = 0.9, rx = Math.SQRT1_2, ry = -Math.SQRT1_2, bx = -Math.SQRT1_2, by = -Math.SQRT1_2;
    const slots = a0 => { const out = []; for (let n = 0; n < list.length; n++) { const c = n % PER - (PER - 1) / 2, r = Math.floor(n / PER); out.push([a0[0] + rx * c * DX - bx * r * DR, a0[1] + ry * c * DX - by * r * DR]); } return out; };
    const free = ([x, y]) => inMap(Math.floor(x), Math.floor(y)) && !bAt(sc, Math.floor(x), Math.floor(y)) && !isWater(sc, Math.floor(x), Math.floor(y));
    const anchors = [[cas.x + cas.w + 1.3, cas.y + cas.h + 1.3], [cas.x + cas.w + 2.2, cas.y + cas.h / 2], [cas.x + cas.w / 2, cas.y + cas.h + 2.2], [cas.x - 2.2, cas.y + cas.h + 1.3], [cas.x + cas.w + 1.3, cas.y - 2.2]];
    let best = null, bn = -1; for (const a0 of anchors) { const sl = slots(a0), n = sl.filter(free).length; if (n > bn) { bn = n; best = sl; } if (n === sl.length) break; }
    const vix = {};
    for (const k of list) {
      const vi = vix[k] = (vix[k] == null ? 0 : vix[k] + 1);
      const p = best[i++]; if (!free(p)) continue; const [x, y] = p;
      const u = mkUnit(k, 'V', x, y); u.vi = vi; u.face = 'F'; u.flip = false; u.post = { x, y }; u.ai = soldierAI; sc.U.push(u);
    }
  }
  if (S && S.hunts && S.fauna) for (const id of S.hunts) { const a = S.fauna.find(f => f.id === id && f.dying == null); if (a) { a.huntBy = 1; hunterSpawn(sc, a); } }
  if (S && !S.creative) { spawnKids(sc); if (S.fest && now() < S.fest.end) setTimeout(festFX, 0); }
  if (S && S.mastio >= HDEF.generale.lv && !S.sandbox) { const m = sc.B.find(b => b.t === 'mastio'); if (m) { const [fx, fy] = frontTile(sc, m); const u = mkUnit('generale', 'V', fx + 1.2, fy + 0.6, true); u.face = 'F'; u.flip = true; u.ai = soldierAI; sc.U.push(u); } }
  return sc;
}
function villageSetup(sc) {
  sc.water.set(villageWater()); sc.decals = [RIVER_AT, POND_AT, ...EXTRA_PONDS];
  if (!GROUND_V || (GROUND_V.stale && EATL_OK && TEX_OK)) GROUND_V = paintGround(false, sc.decals, 42); sc.ground = GROUND_V;
  addForests(sc, 7);
  for (const [x, y] of [[28.6, 19.4], [5.2, 6.4], [24.5, 3.5]].map(p => [p[0] + OFF, p[1] + OFF])) if (!isWater(sc, x | 0, y | 0)) sc.rocks.push({ x, y, s: 7, big: true });
  const rem = new Set(S && S.removed || []); sc.trees = sc.trees.filter(t => !rem.has(natKey(t))); sc.rocks = sc.rocks.filter(r => !rem.has(natKey(r)));
}
// ---- alberi e rocce del paesaggio: tutti rimovibili ----
function natKey(o) { return (o.k != null ? 'T' : o.big ? 'R' : 'r') + Math.round(o.x * 10) + ',' + Math.round(o.y * 10); }
function natInfo(o) {
  if (o.k != null && bareKind(o)) return bareKind(o) === 'olmo' ? { n: 'Olmo Spoglio', icon: '🌳', desc: 'Vecchio olmo senza foglie, rami fitti e radici nodose.', cost: { cibo: 12 }, gain: { legno: 40 }, t: 10 } : { n: 'Albero Morto', icon: '🪵', desc: 'Albero secco e contorto. Si abbatte in fretta: legna da ardere.', cost: { cibo: 5 }, gain: { legno: 25 }, t: 6 };
  if (o.k != null) { const oak = (o.k % 6) >= 3; return oak ? { n: 'Quercia', icon: '🌳', desc: 'Quercia secolare della Marca. Abbatterla dà molto legname.', cost: { cibo: 15 }, gain: { legno: 55 }, t: 12 } : { n: 'Abete', icon: '🌲', desc: 'Abete della Foresta Nera. Legno dritto e resinoso.', cost: { cibo: 10 }, gain: { legno: 35 }, t: 8 }; }
  return o.big ? { n: 'Masso', icon: '🪨', desc: 'Grosso masso muschioso. Spaccarlo richiede tempo e paga in pietra.', cost: { oro: 20 }, gain: { pietra: 50 }, t: 15 } : { n: 'Sasso', icon: '🪨', desc: 'Sassi sparsi nel prato.', cost: { cibo: 5 }, gain: { pietra: 12 }, t: 4 };
}
function pickNature(sx, sy, tx, ty) {
  let best = null, bd = 0.75;
  for (const o of SC.trees.concat(SC.rocks)) { const d = Math.hypot(o.x - tx, o.y - ty); if (d < bd) { bd = d; best = o; } }
  if (best) return best;
  const wx = (sx - VW / 2) / cam.z + cam.x, wy = (sy - VH / 2) / cam.z + cam.y; let key = -1e9;
  for (const o of SC.trees) { const [bx, by] = W(o.x, o.y); const w = (((o.k % 6) >= 3) ? 96 : 66) * o.s * 0.7, h = 150 * o.s; if (wx > bx - w / 2 && wx < bx + w / 2 && wy > by - h && wy < by) { const p = rotP(o.x, o.y); if (p[0] + p[1] > key) { key = p[0] + p[1]; best = o; } } }
  return best;
}
function openNature(o) {
  const n = natInfo(o); SC.selN = o; SC.sel = null;
  const cs = Object.keys(n.cost).length ? costStr(n.cost) : 'gratis'; const wk = workOn('nat', natKey(o));
  openSheet(`${n.icon} ${n.n}`, `<p class="desc">${n.desc}</p><div class="acts">${wk ? `<button class="btn dis">🪓 In rimozione… ${fmtT(wk.end - now())}</button>` : `<button class="btn" onclick="removeNature()">✖ Rimuovi<small>${cs} · ⏱ ${n.t}s → ${Object.keys(n.gain).map(k => ICO(k) + ' +' + n.gain[k]).join(' ')}</small></button>`}</div>`, 'n');
}
function removeNature() {
  const o = SC.selN; if (!o) return; const n = natInfo(o); const key = natKey(o);
  if (workOn('nat', key)) return;
  if (!canPay(n.cost)) { toast('Risorse insufficienti'); return; }
  if (timedOn() && crewBusy() >= MAX_CREW) { toast(`Le squadre di sgombero sono occupate (max ${MAX_CREW})`); return; }
  pay(n.cost); addWork({ kind: 'nat', key, x: o.x, y: o.y, tree: o.k != null, gain: n.gain, dur: n.t });
  closeSheet(); sfx('tock'); save(); updateHUD();
}
// ---- demolizione edifici ----
function demolish(id) {
  const i = S.buildings.findIndex(b => b.id === id); if (i < 0) return; const r = S.buildings[i], d = BDEF[r.t];
  if (r.t === 'mastio') return;
  if (workOn('demo', r.id) || r.end) { toast(r.end ? 'Prima finisci i lavori in corso' : 'Demolizione già in corso'); return; }
  const dc = { cibo: 10 * r.lvl }, dt2 = Math.max(4, Math.round((d.t || 4) * 0.6 * r.lvl));
  if (!demolish.ok) { askYes(`Demolire ${d.n}?<br><small>Costa ${dc.cibo} cibo e ${fmtT(dt2 * 1000)} di lavoro, recuperi il 30% del costo.</small>`, () => { demolish.ok = 1; demolish(id); demolish.ok = 0; }, 'Demolisci'); return; }
  if (!canPay(dc)) { toast('Risorse insufficienti'); return; }
  if (timedOn() && crewBusy() >= MAX_CREW) { toast(`Le squadre di sgombero sono occupate (max ${MAX_CREW})`); return; }
  const base = d.cost ? scaleCost(d.cost, r.lvl) : {}; const gain = {}; for (const k in base) gain[k] = Math.floor(base[k] * 0.3);
  pay(dc); r.demo = 1; addWork({ kind: 'demo', key: r.id, x: r.x + d.w / 2, y: r.y + d.h / 2, w: d.w, h: d.h, gain, dur: dt2 });
  closeSheet(); sfx('tock'); save(); updateHUD();
}
// foreste fitte stile RTS: una fascia di bosco ai bordi dal profilo irregolare e qualche macchia isolata, prati puliti al centro
function addForests(sc, seed) {
  const R = rng(seed * 13 + 1), nA = makeNoise(seed * 5 + 3), nB = makeNoise(seed * 5 + 4), nC = makeNoise(seed * 5 + 9), c0 = N / 2;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const e = Math.min(x, y, N - 1 - x, N - 1 - y), dc = Math.hypot(x + .5 - c0, y + .5 - c0);
    const band = 6 + nA(x / 9, y / 9, 3) * 9; // spessore del bosco ai bordi: 6..15 caselle
    const clump = dc > 21 && nB(x / 7, y / 7, 3) > 0.64; // macchie di bosco nel prato esterno
    let p = e < band ? (e < band - 2 ? 0.62 : 0.32) : clump ? 0.55 : dc > 18 ? 0.004 : 0;
    if (!p || isWater(sc, x, y) || isWater(sc, x - 1, y) || isWater(sc, x, y - 1) || isWater(sc, x + 1, y) || isWater(sc, x, y + 1)) continue;
    if (R() < p) { const oak = nC(x / 14, y / 14, 2) > 0.52; sc.trees.push({ x: x + 0.15 + R() * 0.7, y: y + 0.15 + R() * 0.7, k: (oak ? 3 : 0) + ((R() * 3) | 0), s: 0.85 + R() * 0.4 }); }
    else if (e >= band && dc > 14 && R() < 0.003) sc.rocks.push({ x: x + 0.5, y: y + 0.5, s: (R() * 1000) | 0 });
  }
}
function addGroves(sc, seed, minD) {
  const R = rng(seed * 31 + 5); const cx = N / 2;
  for (let g = 0; g < 14; g++) {
    const a = R() * 6.283, d = minD + R() * (N / 2 - minD - 3); const gx = cx + Math.cos(a) * d, gy = cx + Math.sin(a) * d; const n = 3 + ((R() * 6) | 0), oak = R() < 0.5;
    for (let i = 0; i < n; i++) { const x = gx + (R() - .5) * 3.5, y = gy + (R() - .5) * 3.5; if (x < 3 || y < 3 || x > N - 3 || y > N - 3) continue; if (isWater(sc, x | 0, y | 0) || isWater(sc, (x | 0) + 1, y | 0) || isWater(sc, (x | 0) - 1, y | 0) || isWater(sc, x | 0, (y | 0) + 1) || isWater(sc, x | 0, (y | 0) - 1) || bAt(sc, x | 0, y | 0) || (S && S.buildings && sc.mode !== 'attack' && occupiedBy(x | 0, y | 0, 1, 1))) continue; sc.trees.push({ x, y, k: (oak ? 3 : 0) + ((R() * 3) | 0), s: 0.85 + R() * 0.4 }); }
  }
}
function frontTile(sc, b) {
  const cand = [];
  for (let x = b.x - 1; x <= b.x + b.w; x++) cand.push([x, b.y + b.h]);
  for (let y = b.y - 1; y <= b.y + b.h; y++) cand.push([b.x + b.w, y]);
  for (let x = b.x - 1; x <= b.x + b.w; x++) cand.push([x, b.y - 1]);
  for (let y = b.y; y < b.y + b.h; y++) cand.push([b.x - 1, y]);
  for (const [x, y] of cand) if (inMap(x, y) && !bAt(sc, x, y) && !isWater(sc, x, y)) return [x, y];
  return [b.x + b.w, b.y + b.h];
}
function villagerCost(sc) { const G = sc.pathG; return (x, y) => { if (sc.water[y * N + x]) return Infinity; const b = bAt(sc, x, y); const on = G && G[y * N + x]; if (!b) return on ? 1 : 12; const d = BDEF[b.t]; if (d.wall) return on ? 1.5 : 14; if (d.decor) return on ? 1 : 12; return Infinity; }; }
function followPath(sc, u, dt) {
  if (!u.path || u.pi >= u.path.length) return true;
  const [px, py] = u.path[u.pi];
  const dx = px + 0.5 - u.x, dy = py + 0.5 - u.y, d = Math.hypot(dx, dy), sp = u.d.spd * dt;
  // la tappa è occupata da qualcuno fermo, oppure da un po' non si avanza: salto alla tappa dopo (si gira attorno)
  if (d < 0.8 && sc.U.some(o => o !== u && !o.dead && !o.moving && Math.hypot(o.x - px - 0.5, o.y - py - 0.5) < 0.42)) { u.pi++; u.moving = true; u.stk = 0; return u.pi >= u.path.length; }
  if (u.lastD != null && d > u.lastD - sp * 0.3) { u.stk = (u.stk || 0) + dt; if (u.stk > 1.2) { u.stk = 0; u.pi++; u.lastD = null; return u.pi >= u.path.length; } } else u.stk = 0; u.lastD = d;
  if (d <= sp) { u.x = px + 0.5; u.y = py + 0.5; u.pi++; u.lastD = null; } else { u.x += dx / d * sp; u.y += dy / d * sp; }
  u.moving = true; setFace(u, dx, dy); return u.pi >= u.path.length;
}
function workerAI(sc, u, dt) {
  u.working = false;
  if (u.st === 'rest') { u.wt -= dt; if (u.wt <= 0) { pickWork(sc, u); } }
  else if (u.st === 'go') { if (followPath(sc, u, dt)) { u.st = 'work'; u.wt = 5 + Math.random() * 6; if (u.fx != null) setFace(u, u.fx - u.x, u.fy - u.y); } }
  else if (u.st === 'work') { u.working = true; u.wt -= dt; u.phase += dt * 0.6; if (u.wt <= 0) { const [hx, hy] = frontTile(sc, u.home); u.path = astar(Math.floor(u.x), Math.floor(u.y), (x, y) => x === hx && y === hy, villagerCost(sc), hx, hy, 2500); u.pi = 0; u.st = 'back'; } }
  else if (u.st === 'back') { if (followPath(sc, u, dt)) { u.st = 'rest'; u.wt = 2 + Math.random() * 4; } }
}
function pickWork(sc, u) {
  let tx, ty;
  if (S && S.fest && now() < S.fest.end && Math.random() < 0.8) { [tx, ty] = festSpot(u); u.fx = S.fest.x; u.fy = S.fest.y; }
  else if (u.jk === 'tree') { let best = null, bd = 1e9; for (const t of sc.trees) { const e = Math.min(t.x, t.y, N - t.x, N - t.y); if (e < 2.2) continue; const d = Math.hypot(t.x - u.x, t.y - u.y) + Math.random() * 3; if (d < bd) { bd = d; best = t; } } if (best) { tx = Math.floor(best.x + (best.x < N / 2 ? 1 : -1)); ty = Math.floor(best.y); u.fx = best.x; u.fy = best.y; } }
  else if (u.jk === 'self') { const [x, y] = frontTile(sc, u.home); tx = x; ty = y; u.fx = u.home.x + u.home.w / 2; u.fy = u.home.y + u.home.h / 2; }
  else { const bs = sc.B.filter(b => !BDEF[b.t].wall && !BDEF[b.t].decor); const b = bs[(Math.random() * bs.length) | 0]; [tx, ty] = frontTile(sc, b); u.fx = b.x + b.w / 2; u.fy = b.y + b.h / 2; }
  if (tx == null || !inMap(tx, ty) || bAt(sc, tx, ty) || isWater(sc, tx, ty)) { u.wt = 3; return; }
  u.path = astar(Math.floor(u.x), Math.floor(u.y), (x, y) => x === tx && y === ty, villagerCost(sc), tx, ty, 2500); u.pi = 0;
  u.st = u.path ? 'go' : 'rest'; if (!u.path) u.wt = 4;
}
function soldierAI(sc, u, dt) { u.phase += dt * 0.2; if (u.post) { u.x += (u.post.x - u.x) * Math.min(1, dt * 3); u.y += (u.post.y - u.y) * Math.min(1, dt * 3); u.face = 'F'; } }

// ---------- economy tick ----------
function rateOf(r) { const d = BDEF[r.t]; const m = DF().prod * prestigeMult() * umoreMult() * workMult(r) * seasonMod(resOf(r)); if (r.t === 'mastio') return 6 * r.lvl * m; return d.prod ? d.prod[1] * r.lvl * m : 0; }
function resOf(r) { return r.t === 'mastio' ? 'oro' : (BDEF[r.t].prod || [])[0]; }
function stockCap(r) { const rt = rateOf(r); return r.t === 'monastero' ? 4 * r.lvl : Math.max(30, Math.round(rt * Math.min(180, 20 + 10 * r.lvl))); }
let accT = 0, saveT = 0;
function economy(dt) {
  worksTick(); wxTick();
  const t = now();
  let changed = false;
  for (const r of S.buildings) {
    if (r.end && t >= r.end) {
      r.end = 0; r.lvl = r.toLvl || r.lvl; r.toLvl = 0; changed = true;
      if (r.t === 'mastio') { S.mastio = r.lvl; prefetchEra(); if (ERAI(r.lvl) !== ERAI(r.lvl - 1)) setTimeout(() => { faunaFill(true); toast(ERAI(r.lvl) === 2 ? '🐖 I maiali bradi spariscono dai boschi' : ERAI(r.lvl) === 3 ? '🦌 Cervi e orsi scendono nella Marca' : '🐺 Nuove bestie popolano la Marca'); }, 2500); toast(`🏰 Mastio livello ${r.lvl}! ${r.lvl === 5 ? 'Inizia l\'Età Feudale!' : ''}`); sfx('bell'); refreshTargets(true); }
      else if (!BDEF[r.t].wall && !BDEF[r.t].decor) { toast(`🔨 ${BDEF[r.t].n} completato (liv. ${r.lvl})`); sfx('build'); } else if (Math.random() < 0.3) sfx('tock');
    }
    if (!r.end && resOf(r)) { r.stock = Math.min(stockCap(r), (r.stock || 0) + rateOf(r) * dt / 60); }
  }
  // training queue
  if (S.queue.length) {
    const q = S.queue[0]; q.left = (q.left == null ? UDEF[q.k].t * 4 * PACE() : q.left) - dt;
    if (q.left <= 0) { S.queue.shift(); S.army[q.k] = (S.army[q.k] || 0) + 1; if (!S.queue.length) toast('⚔️ Addestramento completato'); if ($('#sheet').dataset.p === 'army') openArmy(); }
  }
  if (changed && MODE === 'village') { const sel = SC.sel && SC.sel.ref; SC = buildVillage(); if (sel) SC.sel = SC.B.find(b => b.ref === sel) || null; refreshSheet(); }
  if (MODE === 'village' && SC) for (const b of SC.B) { const r = b.ref; if (!r) continue; const res = resOf(r); b.bubble = (res && r.stock >= Math.max(1, stockCap(r) * 0.15) && !r.end) ? RICON[res] : null; b.bubbleK = res; }
}
function buildVillageUnitsOnly() { if (MODE !== 'village') return; const sel = SC.sel && SC.sel.ref; SC = buildVillage(); if (sel) SC.sel = SC.B.find(b => b.ref === sel) || null; }
function collect(r) {
  const res = resOf(r); if (!res) return false; const v = Math.floor(r.stock); if (v < 1) return false;
  const got = addRes(res, v); r.stock -= v; const bon = BDEF[r.t].bonus; let bonTxt = ''; if (bon) for (const k in bon) { const gb = addRes(k, Math.floor(v * bon[k])); if (gb) bonTxt += ` +${gb} ${ICO(k)}`; }
  const b = SC.B.find(b => b.ref === r); if (b) { floatText(SC, b.x + b.w / 2, b.y + b.h / 2, got > 0 ? `+${got} ${RICON[res]}${bonTxt}` : 'Magazzini pieni!', got > 0 ? '#ffe9a6' : '#f99', 1.3); }
  S.collects = (S.collects || 0) + 1; sfx('coin'); updateHUD(); return true;
}
function offlineCatchup() {
  const el = Math.min(28800, Math.max(0, (now() - (S.last || now())) / 1000));
  if (el > 5) { for (const r of S.buildings) if (!r.end && resOf(r)) r.stock = Math.min(stockCap(r), (r.stock || 0) + rateOf(r) * el / 60); let left = el; while (S.queue.length && left > 0) { const q = S.queue[0]; const need = q.left == null ? UDEF[q.k].t * 4 * PACE() : q.left; if (left >= need) { left -= need; S.queue.shift(); S.army[q.k] = (S.army[q.k] || 0) + 1; } else { q.left = need - left; left = 0; } } }
}

// ---------- placement ----------
function startPlacement(t, moveRef) {
  closeSheet(); const d = BDEF[t];
  const [tx, ty] = screenToTile(VW / 2, VH / 2);
  placing = { t, w: d.w, h: d.h, x: Math.floor(tx - d.w / 2 + 0.5), y: Math.floor(ty - d.h / 2 + 0.5), move: moveRef || null };
  if (moveRef) { placing.x = moveRef.x; placing.y = moveRef.y; placing.rot = moveRef.rot || 0; } else { const f = findFree(t, placing.x, placing.y); if (f) { placing.x = f[0]; placing.y = f[1]; } }
  { const girabile = !!(d.wall || d.gate || (d.decor && DFIT[t] && !DYAW_RND[t])); $('#pbrot').classList.toggle('hidden', !girabile); }
  $('#pbring').classList.toggle('hidden', !(d.wall && !moveRef));
  if (d.wall && !moveRef) { placing.line = true; placing.a = null; placing.b = null; updateGhost(); $('#placebar').classList.remove('hidden'); $('#hud-bot').classList.add('hidden'); wallInfo(); return; }
  updateGhost(); $('#placebar').classList.remove('hidden'); $('#hud-bot').classList.add('hidden');
  $('#placeinfo').innerHTML = moveRef ? `Sposta: <b>${d.n}</b>` : `<b>${d.n}</b> ${costStr(d.cost || {})}`;
}
// ---- palizzata a linea continua: tocca dove inizia e dove finisce; se arriva su un edificio si salda a lui ----
function wallSolid(x, y) { const b = SC && bAt(SC, x, y); if (!b) return false; const d = BDEF[b.t]; return !d.wall; }
function wallHas(x, y) { const b = SC && bAt(SC, x, y); return !!(b && BDEF[b.t].wall); }
function wallPath() { // tiles della linea (a «L»: prima un lato poi l'altro; ↻ Gira scambia l'angolo)
  const A = placing.a, B = placing.b || placing.a; if (!A) return []; const out = []; const sx = Math.sign(B[0] - A[0]), sy = Math.sign(B[1] - A[1]);
  let x = A[0], y = A[1]; const step = (dx, dy, n) => { for (let i = 0; i < n; i++) { x += dx; y += dy; out.push([x, y]); } };
  out.push([x, y]); if (placing.lflip) { step(0, sy, Math.abs(B[1] - A[1])); step(sx, 0, Math.abs(B[0] - A[0])); } else { step(sx, 0, Math.abs(B[0] - A[0])); step(0, sy, Math.abs(B[1] - A[1])); }
  const res = []; for (const [tx, ty] of out) { if (!inMap(tx, ty) || tx < 3 || ty < 3 || tx > N - 4 || ty > N - 4 || isWater(SC, tx, ty) || wallSolid(tx, ty)) break; res.push([tx, ty, wallHas(tx, ty)]); }
  return res; }
function wallGhosts() { const P = wallPath(); const set = new Set(P.map(p => p[0] + ',' + p[1])); const conn = (x, y) => set.has(x + ',' + y) || wallHas(x, y) || wallSolid(x, y);
  return P.filter(p => !p[2]).map(([x, y]) => ({ t: placing.t, x, y, w: 1, h: 1, ok: true, line: true, mask: (conn(x + 1, y) ? 1 : 0) | (conn(x - 1, y) ? 2 : 0) | (conn(x, y + 1) ? 4 : 0) | (conn(x, y - 1) ? 8 : 0) })); }
function wallInfo() { const d = BDEF[placing.t]; if (!placing.a) { $('#placeinfo').innerHTML = `<b>${d.n}</b>: tocca dove <b>inizia</b> la linea`; return; }
  const n = wallGhosts().length, c = {}; for (const k in d.cost) c[k] = d.cost[k] * n; const left = maxB(placing.t) - countB(placing.t);
  $('#placeinfo').innerHTML = !placing.b ? `<b>${d.n}</b>: ora tocca dove <b>finisce</b> (se arriva a un edificio si salda)` : `<b>${d.n}</b> · ${n} pezzi ${costStr(c)}${n > left ? ` · <span class="no">ne puoi fare ancora ${left}</span>` : ''} · ✓ per costruire`; }
function wallTap(tx, ty) { const p = [Math.floor(tx), Math.floor(ty)]; if (!placing.a || placing.done) { placing.a = p; placing.b = null; placing.done = false; } else placing.b = p; updateGhost(); wallInfo(); sfx('tock'); }
// ---- chiudi il recinto: un quadrato di palizzata attorno a tutto il villaggio; i pezzi vecchi fuori posto si tolgono (rimborsati) ----
function ringSquare() {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const r of S.buildings) { const d = BDEF[r.t]; if (r.nat || d.wall || d.decor) continue; x0 = Math.min(x0, r.x); y0 = Math.min(y0, r.y); x1 = Math.max(x1, r.x + d.w - 1); y1 = Math.max(y1, r.y + d.h - 1); }
  const M = 2, side = Math.max(x1 - x0, y1 - y0) + 2 * M, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  let ax0 = Math.round(cx - side / 2), ay0 = Math.round(cy - side / 2); ax0 = Math.max(3, Math.min(N - 4 - side, ax0)); ay0 = Math.max(3, Math.min(N - 4 - side, ay0));
  const ax1 = Math.min(N - 4, ax0 + side), ay1 = Math.min(N - 4, ay0 + side);
  const ring = []; for (let x = ax0; x <= ax1; x++) ring.push([x, ay0], [x, ay1]); for (let y = ay0 + 1; y < ay1; y++) ring.push([ax0, y], [ax1, y]);
  return ring; }
function wallRing() {
  const ring = ringSquare(), key = (x, y) => x + ',' + y, onRing = new Set(ring.map(([x, y]) => key(x, y))), wv = villageWater();
  const at = (x, y) => S.buildings.filter(r => { const d = BDEF[r.t]; return x >= r.x && x < r.x + d.w && y >= r.y && y < r.y + d.h; });
  const nuovi = [], nat = [], tenuti = new Set();
  for (const [x, y] of ring) { if (wv[y * N + x]) continue; const os = at(x, y); if (os.some(r => r.t === 'muro')) { tenuti.add(key(x, y)); continue; } if (os.some(r => !r.nat)) continue; for (const r of os) nat.push(r); nuovi.push([x, y]); }
  const vecchi = S.buildings.filter(r => r.t === 'muro' && !onRing.has(key(r.x, r.y)));
  return { nuovi, nat, vecchi, tenuti: tenuti.size }; }
function closeRing() {
  const d = BDEF.muro, R = wallRing(); if (!R.nuovi.length && !R.vecchi.length) { toast('Il recinto è già chiuso'); return; }
  const c = {}; for (const k in d.cost) c[k] = d.cost[k] * Math.max(0, R.nuovi.length - R.vecchi.length);
  askYes(`Fare un recinto quadrato attorno al villaggio?<br><small>${R.nuovi.length} pezzi nuovi${R.tenuti ? ` · ${R.tenuti} già al loro posto` : ''}${R.vecchi.length ? ` · ${R.vecchi.length} pezzi vecchi fuori dal quadrato vengono tolti e rimborsati` : ''}${R.nat.length ? ` · ${R.nat.length} rocce o cespugli sgomberati` : ''}<br>Costo: ${R.nuovi.length > R.vecchi.length ? costStr(c) : 'niente (bastano i pezzi vecchi)'}</small>`, () => {
    for (const r of R.vecchi) for (const k in d.cost) S.res[k] = (S.res[k] || 0) + d.cost[k];
    const via = new Set([...R.vecchi, ...R.nat]); S.buildings = S.buildings.filter(r => !via.has(r));
    let k = 0; for (const [x, y] of R.nuovi) { if (!canPay(d.cost)) break; pay(d.cost); S.buildings.push({ id: S.nextId++, t: 'muro', x, y, lvl: 1, stock: 0, end: d.t && !S.creative ? now() + (buildSecs(d) * 1000 + k * 100) * seasonBuildMul() : 0, dur: buildSecs(d) * 1000 * seasonBuildMul(), toLvl: 1 }); k++; }
    if (placing) cancelPlace(); closeSheet(); sfx('build'); SC = buildVillage(); save(); updateHUD();
    toast(`🏰 Recinto quadrato: ${k} pezzi in costruzione${k < R.nuovi.length ? ` · mancano risorse per ${R.nuovi.length - k}` : ''}`); }, 'Fai il recinto'); }
function wallConfirm() {
  const d = BDEF[placing.t]; if (!placing.a || !placing.b) { toast('Tocca prima dove inizia e dove finisce la palizzata'); return; }
  const G = wallGhosts(); if (!G.length) { toast('Lì c\'è già la palizzata'); return; } let n = 0;
  for (const g of G) { if (countB(placing.t) >= maxB(placing.t)) { toast('Limite raggiunto: alza il livello del Mastio'); break; } if (!canPay(d.cost)) { if (!n) { const nm = d.n; needSheet(d.cost, 'costruire ' + nm); return; } toast('Risorse finite: costruiti ' + n + ' pezzi'); break; }
    pay(d.cost); S.buildings.push({ id: S.nextId++, t: placing.t, x: g.x, y: g.y, lvl: 1, stock: 0, end: d.t && !S.creative ? now() + (buildSecs(d) * 1000 + n * 250) * seasonBuildMul() : 0, dur: buildSecs(d) * 1000 * seasonBuildMul(), toLvl: 1 }); n++; }
  if (!n) return; sfx('build'); SC = buildVillage(); save(); updateHUD(); toast(`🪵 ${n} pezzi di ${d.n.toLowerCase()} in costruzione`);
  // si può continuare la linea dal punto in cui finisce
  const P = wallPath(); placing.a = P.length ? [P[P.length - 1][0], P[P.length - 1][1]] : placing.b; placing.b = null; updateGhost(); wallInfo(); }
function findFree(t, x0, y0, ignore) { for (let r = 0; r < 14; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue; if (canPlace(t, x0 + dx, y0 + dy, ignore)) return [x0 + dx, y0 + dy]; } return null; }
function updateGhost() { if (!placing) { SC.ghost = null; SC.ghosts = null; return; } if (placing.line) { SC.ghost = null; SC.ghosts = placing.a ? wallGhosts() : null; return; } SC.ghosts = null; placing.ok = canPlace(placing.t, placing.x, placing.y, placing.move); SC.ghost = { ...placing }; }
function confirmPlace() {
  if (!placing) return; const d = BDEF[placing.t]; if (placing.line) { wallConfirm(); return; }
  if (!placing.ok) { toast('Spazio occupato o fuori dal feudo'); return; }
  // il cancello si apre nella palizzata: i pezzi sotto di lui vengono tolti
  const sottoGate = () => { if (!d.gate) return; const sotto = S.buildings.filter(b => b.t === 'muro' && b.x >= placing.x && b.x < placing.x + d.w && b.y >= placing.y && b.y < placing.y + d.h); if (!sotto.length) return; S.buildings = S.buildings.filter(b => !sotto.includes(b)); const xs = new Set(sotto.map(b => b.x)).size, ys = new Set(sotto.map(b => b.y)).size; if (xs !== ys) placing.rot = ys > xs ? 1 : 0; }; // si gira da solo lungo la palizzata
  if (placing.move) { sottoGate(); placing.move.x = placing.x; placing.move.y = placing.y; if (placing.rot != null) placing.move.rot = placing.rot; cancelPlace(); SC = buildVillage(); save(); return; }
  if (countB(placing.t) >= maxB(placing.t)) { toast('Limite raggiunto: alza il livello del Mastio'); cancelPlace(); return; }
  if (d.req && !S.creative && !hasB(d.req)) { toast(`Serve prima: ${BDEF[d.req].n}`); cancelPlace(); return; }
  if (!canPay(d.cost)) { const nm = d.n; cancelPlace(); needSheet(d.cost, 'costruire ' + nm); return; }
  if (d.t && !d.wall && !d.decor && builders() >= maxBuilders()) { toast(`Tutti i mastri d'opera sono occupati (max ${maxBuilders()})`); return; }
  pay(d.cost);
  const r = { id: S.nextId++, t: placing.t, x: placing.x, y: placing.y, lvl: 1, stock: 0, end: d.t && !S.creative ? now() + buildSecs(d) * 1000 * seasonBuildMul() : 0, dur: buildSecs(d) * 1000 * seasonBuildMul(), toLvl: 1 };
  if (placing.t === 'muro' && S.mastio >= 5) r.lvl = 1;
  sottoGate(); if (placing.rot) r.rot = placing.rot;
  S.buildings.push(r); sfx('build'); SC = buildVillage(); save(); updateHUD();
  if (d.wall || d.decor) { // keep placing next
    const nx = placing.x + 1; placing.x = nx; if (!canPlace(placing.t, placing.x, placing.y)) { const f = findFree(placing.t, placing.x, placing.y); if (f) { placing.x = f[0]; placing.y = f[1]; } } if (countB(placing.t) >= maxB(placing.t) || !canPay(d.cost)) { cancelPlace(); return; } updateGhost(); $('#placeinfo').innerHTML = `<b>${d.n}</b> ${countB(placing.t)}/${maxB(placing.t)} — tocca per posizionare, ✓ per costruire`;
  } else cancelPlace();
}
function rotPlace() { if (!placing) return; const d = BDEF[placing.t]; if (placing.line) { placing.lflip = !placing.lflip; updateGhost(); wallInfo(); sfx('tock'); toast('↻ Angolo della palizzata girato'); return; } placing.rot = ((placing.rot || 0) + 1) % (d.wall ? 5 : d.gate ? 2 : 4); updateGhost(); sfx('tock'); if (d.wall) toast('↻ Direzione: ' + WALL_DIR[placing.rot]); }
function cancelPlace() { placing = null; if (SC) { SC.ghost = null; SC.ghosts = null; } $('#placebar').classList.add('hidden'); $('#hud-bot').classList.remove('hidden'); }
function nudge(dx, dy) { if (!placing) return; [dx, dy] = rotVinv(dx, dy).map(Math.round); if (placing.line) { const k = placing.b ? 'b' : 'a'; if (!placing[k]) { const [tx, ty] = screenToTile(VW / 2, VH / 2); placing.a = [Math.floor(tx), Math.floor(ty)]; } else placing[k] = [placing[k][0] + dx, placing[k][1] + dy]; updateGhost(); wallInfo(); return; } placing.x += dx; placing.y += dy; updateGhost(); }

// ---------- ostacoli naturali & decorazioni ----------
function spawnNature(n) {
  let made = 0;
  for (let tries = 0; tries < 400 && made < n; tries++) {
    const t = NATURE[(Math.random() * NATURE.length) | 0], x = 3 + ((Math.random() * (N - 7)) | 0), y = 3 + ((Math.random() * (N - 7)) | 0);
    if (Math.hypot(x - MCX, y - MCX) < 11 || !canPlace(t, x, y)) continue;
    if (t === 'tronco' && S.buildings.filter(b => b.nat && b.t === 'tronco').length >= TRONCHI_MAX) continue;
    S.buildings.push({ id: S.nextId++, t, x, y, lvl: 1, stock: 0, end: 0, nat: true }); made++;
  }
  return made;
}
function removeObj(id) {
  const i = S.buildings.findIndex(b => b.id === id); if (i < 0) return; const r = S.buildings[i], d = BDEF[r.t];
  if (workOn('obj', r.id)) return;
  let gain = {}, cost = {}, tt = d.rm && d.rm.t || 4;
  if (r.nat) { cost = d.rm.cost; gain = { ...d.rm.gain }; } else { cost = { cibo: 5 }; tt = 3; for (const k in d.cost) gain[k] = Math.floor(d.cost[k] / 2); }
  if (!canPay(cost)) { toast('Risorse insufficienti per rimuoverlo'); return; }
  if (timedOn() && crewBusy() >= MAX_CREW) { toast(`Le squadre di sgombero sono occupate (max ${MAX_CREW})`); return; }
  pay(cost); addWork({ kind: 'obj', key: r.id, nat: !!r.nat, fav: r.t === 'funghi' && r.nat, x: r.x + d.w / 2, y: r.y + d.h / 2, w: d.w, h: d.h, gain, dur: tt });
  closeSheet(); sfx('tock'); save(); updateHUD();
}
// ================= GENTE: ogni soldato e contadino ha nome, livello, esperienza e punti da spendere =================
const NOMI_M = ['Aldo', 'Bertoldo', 'Corrado', 'Duccio', 'Ezzelino', 'Folco', 'Gualtiero', 'Guido', 'Ildebrando', 'Lapo', 'Manfredi', 'Nanni', 'Oddone', 'Pietro', 'Ranieri', 'Salimbene', 'Tancredi', 'Ugolino', 'Vanni', 'Arnolfo', 'Brunetto', 'Cecco', 'Dino', 'Ghino', 'Rinaldo', 'Ottone', 'Bonifacio', 'Giannotto', 'Mainardo', 'Uberto'];
const NOMI_F = ['Adelasia', 'Beatrice', 'Bona', 'Cunizza', 'Diamante', 'Emilia', 'Fiordaliso', 'Gemma', 'Ginevra', 'Ildegarda', 'Lapa', 'Matilde', 'Nera', 'Oringa', 'Piccarda', 'Sibilla', 'Tessa', 'Umiltà', 'Verdiana', 'Zita'];
const SOPRA = ['il Rosso', 'Mezzalancia', 'dal Guado', 'Ferrabraccio', 'il Muto', 'Spaccalegna', 'da Monteforte', 'Malaspina', 'il Lesto', 'Occhiodifalco', 'Testadura', 'del Mulino', 'il Pio', 'Sanguebuono', 'Barbagrigia', 'da Valbruna'];
const FEMK = { infermiera: 1, scudata: 1 };
const WROLE = {
  taglialegna: { n: 'Taglialegna', d: 'Abbatte alberi e porta tronchi alla capanna. Più è esperto, più legna produce la sua capanna.' },
  cuoco: { n: 'Contadino', d: 'Lavora i campi, la cucina e il mercato. Più è esperto, più rende il suo edificio.' },
  fabbro: { n: 'Artigiano', d: 'Fabbro, minatore o cavatore: batte il ferro e spacca la pietra. Più è esperto, più produce la sua bottega.' },
  infermiera: { n: 'Guaritrice', d: 'Cura i feriti e assiste il borgo. Più è esperta, più rende l\'edificio a cui è legata.' },
};
function folkName(id, k) { const R = rng(id * 7919 + 13); const f = FEMK[k] || (R() < 0.12 && !UDEF[k]); const n = f ? NOMI_F[(R() * NOMI_F.length) | 0] : NOMI_M[(R() * NOMI_M.length) | 0]; return n + ' ' + SOPRA[(R() * SOPRA.length) | 0]; }
const FOLK_MAX = () => Math.min(10, 2 + S.mastio);
const xpNeed = l => 60 + l * 50;
function newRec(k) { const id = (S.folkId = (S.folkId || 0) + 1); return { id, k, nm: folkName(id, k), lvl: 1, xp: 0, pts: 0, str: 0, vit: 0, def: 0, abi: 0, spd: 0 }; }
// soldati: lista per tipo, sincronizzata con S.army (prima tolgo i caduti segnati, poi taglio/aggiungo in coda)
function vets(k) {
  S.vets = S.vets || {}; let a = S.vets[k] || (S.vets[k] = []); const n = S.army[k] || 0;
  if (a.some(r => r.dead)) { let rm = a.filter(r => r.dead).length; S.vets[k] = a = a.filter(r => !r.dead); }
  while (a.length > n) a.pop(); while (a.length < n) a.push(newRec(k)); return a;
}
// contadini: uno per edificio-lavoro
function heroRec(k) { S.hrec = S.hrec || {}; let r = S.hrec[k]; if (!r) { r = S.hrec[k] = newRec(k); r.nm = HDEF[k].n; } return r; }
function workRec(bid, k) { S.wrk = S.wrk || {}; let r = S.wrk[bid]; if (!r || r.k !== k) r = S.wrk[bid] = newRec(k); return r; }
function workMult(r) { const w = S && S.wrk && S.wrk[r.id]; return w ? 1 + 0.08 * (w.lvl - 1) + 0.06 * (w.abi || 0) : 1; }
// effetti in battaglia
// ---- tratti dei veterani (dal livello 3) ----
const TRAITS = {
  furia: { n: 'Furia del Nord', ic: '🔥', d: '+20% danno' }, scudo: { n: 'Scudo di Quercia', ic: '🛡', d: '-15% danno subito' },
  duro: { n: 'Duro a Morire', ic: '💀', d: 'sopravvive al primo colpo mortale' }, lesto: { n: 'Piè Veloce', ic: '🏃', d: '+20% velocità' },
  gigante: { n: 'Gigante', ic: '🪨', d: '+25% vita, -10% velocità' }, cento: { n: 'Cento Battaglie', ic: '⚔', d: '+10% a tutto' },
  occhio: { n: 'Occhio di Falco', ic: '🦅', d: '+25% danno a distanza' }, codardo: { n: 'Codardo', ic: '🐇', d: '-15% danno, +25% velocità' },
};
function giveTrait(rec) { if (rec.tr || !UDEF[rec.k] || rec.lvl < 3) return; const pool = Object.keys(TRAITS).filter(k => k !== 'occhio' || UDEF[rec.k].ranged); const R = rng(rec.id * 131 + 7); rec.tr = pool[(R() * pool.length) | 0]; const T = TRAITS[rec.tr]; setTimeout(() => toast(`${T.ic} ${rec.nm} si è guadagnato un soprannome di guerra: «${T.n}» (${T.d})`), 900); }
function cryptHTML() { const L = S.crypt || []; return `<div class="crypt"><b>⚱️ ${L.length ? L.length + ' eroi custoditi · +' + Math.round(cryptBonus() * 100) + '% vita alle truppe' : 'Nessun eroe ancora: i veterani caduti verranno sepolti qui'}</b>${L.slice(0, 20).map(x => `<div><span>✝ ${x.nm}</span><small>${UDEF[x.k] ? UDEF[x.k].n : x.k} · liv. ${x.lvl}${x.tr ? ' · ' + TRAITS[x.tr].ic + ' ' + TRAITS[x.tr].n : ''} · caduto ${x.w}</small></div>`).join('')}</div>`; }
function cryptBonus() { return S && hasB('cripta') ? Math.min(0.15, 0.01 * (S.crypt || []).length) : 0; }
function recApply(u, rec) {
  if (!rec) return; u.rec = rec; const L = 1 + 0.03 * (rec.lvl - 1);
  const hm = L * (1 + 0.12 * rec.vit); u.maxhp *= hm; u.hp *= hm;
  u.dm = (u.dm || 1) * L * (1 + 0.12 * rec.str); u.df = Math.max(0.55, 1 - 0.06 * rec.def);
  const t = rec.tr; if (t === 'furia') u.dm *= 1.2; else if (t === 'scudo') u.df *= 0.85; else if (t === 'lesto') u.sm = (u.sm || 1) * 1.2; else if (t === 'gigante') { u.maxhp *= 1.25; u.hp *= 1.25; u.sm = (u.sm || 1) * 0.9; } else if (t === 'cento') { u.dm *= 1.1; u.maxhp *= 1.1; u.hp *= 1.1; } else if (t === 'occhio' && u.d.ranged) u.dm *= 1.25; else if (t === 'codardo') { u.dm *= 0.85; u.sm = (u.sm || 1) * 1.25; }
  if (t === 'duro') u.duro = 1;
}
function recGainXP(rec, v) {
  if (!rec || rec.lvl >= FOLK_MAX()) { if (rec) rec.xp = Math.min(rec.xp + v, xpNeed(rec.lvl)); return false; }
  rec.xp += v; let up = false;
  while (rec.lvl < FOLK_MAX() && rec.xp >= xpNeed(rec.lvl)) { rec.xp -= xpNeed(rec.lvl); rec.lvl++; rec.pts++; up = true; } if (up) giveTrait(rec);
  return up;
}
function trainCost(rec) { const l = rec.lvl; if (HDEF[rec.k]) return { cibo: 40 + l * 25, oro: 30 + l * 25 }; return UDEF[rec.k] ? { cibo: 20 + l * 15, oro: 10 + l * 12 } : { cibo: 15 + l * 12, oro: 5 + l * 8 }; }
// selezione sulla mappa
function pickFolk(sx, sy, tx, ty) {
  if (!SC || MODE !== 'village') return null; const wx = (sx - VW / 2) / cam.z + cam.x, wy = (sy - VH / 2) / cam.z + cam.y; let best = null, bd = 1e9;
  for (const u of SC.U) { if (u.dead || u.side !== 'V' || u.k === 'carro' || u.kid || u.vis || u.hunter) continue; const [bx, by] = W(u.x, u.y); const tall = u.d && u.d.model ? 34 : 26; const dx = wx - bx, dy = wy - (by - (tall === 34 ? 28 : 20)); if (Math.abs(dx) < 16 && Math.abs(dy) < tall) { const d = dx * dx + dy * dy; if (d < bd) { bd = d; best = u; } } }
  return best;
}
function folkOf(u) {
  if (u.wrec) return u.wrec;
  if (u.home && WROLE[u.k]) return u.wrec = workRec(u.home.ref ? u.home.ref.id : u.home.id, u.k);
  if (u.hero && HDEF[u.k]) return heroRec(u.k);
  if (UDEF[u.k]) { const a = vets(u.k); return a[u.vi || 0]; }
  return null;
}
const PORT = {};
function thumbAt(k, h) { if (ANIM3D[k]) { const u = anim3dPortrait(k); if (u) return `background-image:url(${u});background-size:cover;background-position:center bottom;`; } if (!PORT[k]) { const f = FR[k + '.idleF']; if (!f || !ATL.complete) return ''; const cv2 = document.createElement('canvas'); cv2.width = 120; cv2.height = 148; const s = Math.min(140 / f[3], 116 / f[2]); const x2 = cv2.getContext('2d'); x2.drawImage(ATL, f[0], f[1], f[2], f[3], (120 - f[2] * s) / 2, 148 - f[3] * s, f[2] * s, f[3] * s); PORT[k] = cv2.toDataURL(); }
  return `background-image:url(${PORT[k]});background-size:cover;background-position:center bottom;`; }
setInterval(() => { if (!S || MODE !== 'village') return; const el = $('#fcard'); if (el && !el.classList.contains('hidden') && SC && SC.folkU && workOn('train', folkOf(SC.folkU).id)) openFolk(SC.folkU); const p = $('#sheet').dataset.p; if (p === 'n' && SC && SC.selN && workOn('nat', natKey(SC.selN))) openNature(SC.selN); else if (p && p.startsWith('b:') && S.works && S.works.some(w => w.key === +p.slice(2))) refreshSheet(); }, 1000);
function closeFolk() { FOLK_NAV = null; const el = $('#fcard'); if (el) el.classList.add('hidden'); if (SC) { SC.selU = null; SC.folkU = null; } }
function openFolk(u) {
  const rec = folkOf(u); if (!rec) return; if (!$('#sheet').classList.contains('hidden')) closeSheet(); SC.selU = u; SC.folkU = u; const hero = !!(u.hero && HDEF[u.k]); const sold = !!UDEF[u.k] || hero;
  const role = hero ? HDEF[u.k] : sold ? UDEF[u.k] : WROLE[u.k]; const need = xpNeed(rec.lvl), mx = FOLK_MAX(), maxed = rec.lvl >= mx;
  const L = 1 + 0.03 * (rec.lvl - 1), hid = u.home ? (u.home.ref ? u.home.ref.id : u.home.id) : 0;
  const st = sold ? [
    ['str', '⚔', 'Forza', `${Math.round(role.dmg * L * (1 + 0.12 * rec.str) * 10) / 10}`],
    ['vit', '❤', 'Vita', `${Math.round(role.hp * L * (1 + 0.12 * rec.vit))}`],
    ['def', '🛡', 'Difesa', `${Math.round((1 - Math.max(0.55, 1 - 0.06 * rec.def)) * 100)}%`],
  ] : [
    ['abi', '⚒', 'Abilità', `+${Math.round((workMult({ id: hid }) - 1) * 100)}%`],
    ['spd', '🏃', 'Rapidità', `+${(rec.spd || 0) * 10}%`],
  ];
  const c = trainCost(rec), can = canPay(c) && !maxed && !workOn('train', rec.id);
  const desc = hero ? `<b>${role.ult}:</b> ${role.ultd}` : sold ? `${role.role}. ${role.ranged ? 'Tiro a distanza.' : 'Mischia.'}` : role.d.split('.')[0] + '.';
  let el = $('#fcard'); if (!el) { el = document.createElement('div'); el.id = 'fcard'; document.body.appendChild(el); let t0 = null; el.addEventListener('touchstart', e => { const t = e.touches[0]; t0 = [t.clientX, t.clientY]; }, { passive: true }); el.addEventListener('touchend', e => { if (!t0 || !FOLK_NAV) return; const t = e.changedTouches[0], dx = t.clientX - t0[0], dy = t.clientY - t0[1]; t0 = null; if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) folkGo(dx < 0 ? 1 : -1); }, { passive: true }); } el.classList.toggle('hero', hero);
  el.innerHTML = `<button class="fx" onclick="closeFolk()">✕</button>
    <div class="ftop"><div class="fpor" style="${hero ? thumbStyle(u.k) : thumbAt(u.k, 74)}"></div>
      <div class="fid"><div class="fnm">${rec.nm}${rec.tr ? ` <span class="ftr2" title="${TRAITS[rec.tr].d}">${TRAITS[rec.tr].ic} ${TRAITS[rec.tr].n}</span>` : ''}</div><div class="frl">${hero ? 'Eroe · ' + role.title.split(',')[0] : role.n}${u.fake ? ' · <small>a riposo</small>' : ''}</div><div class="fds">${desc}</div></div>
      <div class="flv"><small>LIV</small><b>${rec.lvl}</b><small>/${mx}</small></div></div>
    <div class="fxp" title="Esperienza"><i style="width:${maxed ? 100 : Math.min(100, rec.xp / need * 100)}%"></i><span>${maxed ? (rec.lvl >= 10 ? 'Livello massimo' : 'Max per ora · sali di Mastio') : `Esp. ${rec.xp}/${need}`}${rec.pts ? ` · <b>${rec.pts} punt${rec.pts > 1 ? 'i' : 'o'}!</b>` : ''}</span></div>
    <div class="fsts">${st.map(([k, ic, n, v]) => { const cap = 5 + Math.floor(rec.lvl / 3), up = rec.pts && (rec[k] || 0) < cap; return `<div class="fst ${up ? 'up' : ''}" ${up ? `onclick="folkPoint('${k}')"` : ''}><span class="i">${ic}</span><b>${v}</b><small>${n}${rec[k] ? ' ' + '•'.repeat(rec[k]) : ''}</small>${up ? '<em>+1</em>' : ''}</div>`; }).join('')}</div>
    ${workOn('train', rec.id) ? `<button class="ftr dis busy" disabled>🎯 In addestramento… <span>${fmtT(workOn('train', rec.id).end - now())}</span></button>` : `<button class="ftr ${can ? '' : 'dis'}" ${can ? '' : 'disabled'} onclick="folkTrain()">🎯 Addestra <small>+40 esp. · ⏱ ${fmtT((30 + 30 * rec.lvl) * PACE() * 1000)}</small><span>${maxed ? '—' : costStr(c)}</span></button>`}${folkNavHTML(rec)}`;
  el.classList.remove('hidden');
}
function folkTrain() { const u = SC && SC.folkU; if (!u) return; const rec = folkOf(u); const c = trainCost(rec); if (!canPay(c) || rec.lvl >= FOLK_MAX() || workOn('train', rec.id)) return; pay(c);
  const dur = Math.round((30 + 30 * rec.lvl) * PACE()); if (timedOn()) { addWork({ kind: 'train', key: rec.id, rid: rec.id, xp: 40, dur }); sfx('tock'); toast(`🎯 ${rec.nm} si addestra (${dur}s)`); } else finishWork({ kind: 'train', rec, xp: 40 }); save(); updateHUD(); openFolk(u); }
function folkPoint(k) { const u = SC && SC.folkU; if (!u) return; const rec = folkOf(u); if (!rec.pts) return; rec.pts--; rec[k] = (rec[k] || 0) + 1; sfx('coin'); if (k === 'spd' && u.d) u.d.spd = 0.7 * (1 + 0.1 * rec.spd); save(); openFolk(u);
  // punti finiti: passa da solo al prossimo da migliorare
  if (!rec.pts && FOLK_NAV && FOLK_NAV.some(id => id !== rec.id && folkUnit(id) && folkOf(folkUnit(id)).pts)) setTimeout(() => { if (SC && SC.folkU && folkOf(SC.folkU) === rec && FOLK_NAV) folkGo(1); }, 650); }
// ================= LAVORI: rimozioni, demolizioni e addestramenti richiedono tempo =================
const MAX_CREW = 2; // squadre di sgombero (separate dai mastri d'opera)
const timedOn = () => S && !S.creative;
function crewBusy() { return (S.works || []).filter(w => w.kind !== 'train').length; }
function workOn(kind, key) { return (S.works || []).find(w => w.kind === kind && w.key === key); }
function fmtT(ms) { const s = Math.max(0, Math.ceil(ms / 1000)); if (s >= 3600) { const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60; return m ? `${h}h ${m}m` : `${h}h`; } return s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : `${s}s`; }
function addWork(w) { if (!timedOn() || !w.dur) { finishWork(w); return true; } w.end = now() + w.dur * 1000; w.d = w.dur * 1000; (S.works = S.works || []).push(w); return true; }
function finishWork(w) {
  const got = {}; for (const k in (w.gain || {})) got[k] = addRes(k, w.gain[k]);
  if (w.fav && Math.random() < 0.25) got.favore = addRes('favore', 1);
  const txt = Object.keys(got).filter(k => got[k] > 0).map(k => `+${got[k]}${RICON[k]}`).join(' ');
  if (w.kind === 'nat') {
    if (!(S.removed = S.removed || []).includes(w.key)) S.removed.push(w.key); S.cleared = (S.cleared || 0) + 1;
    if (MODE === 'village' && SC) { const o = SC.trees.concat(SC.rocks).find(o => natKey(o) === w.key); SC.trees = SC.trees.filter(t => t !== o); SC.rocks = SC.rocks.filter(r => r !== o); if (SC.selN === o) { SC.selN = null; closeSheet(); }
      for (let k = 0; k < 6; k++) puff(SC, w.x + (Math.random() - .5) * .6, w.y + (Math.random() - .5) * .6, 10, w.tree ? '#6a7a3a' : '#8a8278'); floatText(SC, w.x, w.y, txt || 'Rimosso', '#ffe9a6', 1.3); sfx(w.tree ? 'crash' : 'coin'); }
  } else if (w.kind === 'obj' || w.kind === 'demo') {
    const i = S.buildings.findIndex(b => b.id === w.key); if (i >= 0) { if (w.kind === 'obj' && w.nat) S.cleared = (S.cleared || 0) + 1; S.buildings.splice(i, 1); }
    if (MODE === 'village') { const sel = SC.sel && SC.sel.ref; SC = buildVillage(); if (sel && sel.id !== w.key) SC.sel = SC.B.find(b => b.ref === sel) || null; for (let k = 0; k < 8; k++) puff(SC, w.x + (Math.random() - .5) * (w.w || 1), w.y + (Math.random() - .5) * (w.h || 1), 12, '#7a6a55'); floatText(SC, w.x, w.y, txt || (w.kind === 'demo' ? 'Demolito' : 'Rimosso'), '#ffe9a6', 1.4); sfx(w.kind === 'demo' ? 'crash' : 'coin'); }
  } else if (w.kind === 'train') {
    const rec = w.rec; const up = recGainXP(rec, w.xp || 40); rec.trainEnd = 0;
    const u = MODE === 'village' && SC && SC.U.find(u => !u.dead && u.side === 'V' && folkOf(u) === rec);
    if (u) floatText(SC, u.x, u.y, up ? `⬆ Livello ${rec.lvl}!` : `+${w.xp || 40} esp.`, up ? '#ffe08a' : '#cfe8ff', 1.5);
    toast(up ? `⬆ ${rec.nm} sale al livello ${rec.lvl}: hai un punto da spendere` : `🎯 ${rec.nm} ha finito l'addestramento`); sfx(up ? 'bell' : 'tock');
    if (SC && SC.folkU && folkOf(SC.folkU) === rec) openFolk(SC.folkU);
  }
  save(); updateHUD();
}
function worksTick() {
  if (!S || !S.works || !S.works.length) return; const t = now(); const done = S.works.filter(w => t >= w.end); if (!done.length) return;
  S.works = S.works.filter(w => t < w.end); for (const w of done) { if (w.kind === 'train') { const r = findRec(w.rid); if (!r) continue; w.rec = r; } finishWork(w); }
}
function findRec(id) { for (const k in (S.vets || {})) { const r = S.vets[k].find(r => r.id === id); if (r) return r; } for (const k in (S.wrk || {})) if (S.wrk[k].id === id) return S.wrk[k]; return null; }
// barre di avanzamento sulla mappa
function drawWorks(c, sc) {
  if (!S || !S.works || MODE !== 'village') return; const t = now();
  for (const w of S.works) {
    let x = w.x, y = w.y; if (w.kind === 'train') { const u = sc.U.find(u => { if (u.dead || u.side !== 'V') return false; const r = u.wrec || (UDEF[u.k] ? folkOf(u) : null); return r && r.id === w.rid; }); if (!u) continue; x = u.x; y = u.y; }
    const [px, py0] = W(x, y); const py = py0 - (w.kind === 'train' ? 58 : w.tree ? 92 : w.kind === 'demo' ? 70 : 34); const p = Math.min(1, 1 - (w.end - t) / w.d);
    c.fillStyle = 'rgba(20,14,8,0.8)'; c.beginPath(); c.roundRect ? c.roundRect(px - 24, py - 5, 48, 10, 5) : c.rect(px - 24, py - 5, 48, 10); c.fill();
    c.fillStyle = w.kind === 'train' ? '#6fb3ea' : w.kind === 'demo' ? '#d0643a' : '#d9b25a'; c.fillRect(px - 22, py - 3, 44 * p, 6);
    c.font = `700 10px ${THM().cf || 'serif'}`; c.textAlign = 'center'; c.fillStyle = '#fff3d6'; c.fillText((w.kind === 'train' ? '🎯 ' : w.kind === 'demo' ? '🔨 ' : '🪓 ') + fmtT(w.end - t), px, py - 9);
    if (w.kind !== 'train' && Math.random() < 0.02) puff(sc, x + (Math.random() - .5) * .5, y + (Math.random() - .5) * .5, 6, w.tree ? '#7a6a3a' : '#8a8278');
  }
}
// ---------- fauna: animali selvatici e caccia ----------
function wildOk(x, y) { const ix = x | 0, iy = y | 0; if (ix < 2 || iy < 2 || ix >= N - 2 || iy >= N - 2) return false; if (villageWater()[iy * N + ix]) return false; if (Math.hypot(x - MCX, y - MCX) < 13) return false; return !S.buildings.some(b => !BDEF[b.t].decor && ix >= b.x && ix < b.x + BDEF[b.t].w && iy >= b.y && iy < b.y + BDEF[b.t].h); }
function spawnFauna(k) {
  if (k === 'lupo') { for (let t = 0; t < 60; t++) { const a = Math.random() * 6.283, r = 16 + Math.random() * (N / 2 - 20); const x = MCX + Math.cos(a) * r, y = MCX + Math.sin(a) * r; if (!wildOk(x, y)) continue;
      const n = Math.random() < 0.5 ? 1 : 2 + (Math.random() < 0.4 ? 1 : 0); const lid = S.nextId; let made = 0;
      for (let i = 0; i < n; i++) { const px = x + (i ? (Math.random() - .5) * 5 : 0), py = y + (i ? (Math.random() - .5) * 5 : 0); if (!wildOk(px, py)) continue; S.fauna.push({ id: S.nextId++, k, x: px, y: py, tx: px, ty: py, wt: Math.random() * 3, fl: Math.random() < .5, ph: Math.random() * 6, pack: n > 1 ? lid : 0 }); made++; }
      return made; } return 0; }
  for (let t = 0; t < 60; t++) { const a = Math.random() * 6.283, r = 16 + Math.random() * (N / 2 - 20); const x = MCX + Math.cos(a) * r, y = MCX + Math.sin(a) * r; if (wildOk(x, y)) { S.fauna.push({ id: S.nextId++, k, x, y, tx: x, ty: y, wt: Math.random() * 3, fl: Math.random() < .5, ph: Math.random() * 6 }); return true; } } return false; }
function faunaFill(all) { S.fauna = S.fauna || []; S.fauna = S.fauna.filter(a => FAUNA[a.k] && (faunaOk(a.k) || a.dying != null)); for (const k in FAUNA) { if (!faunaOk(k)) continue; let n = S.fauna.filter(a => a.k === k).length; while (n < FAUNA[k].max) { const m = spawnFauna(k); if (!m) break; n += m === true ? 1 : m; if (!all) return; } } }
function faunaTick(dt) {
  if (!S.fauna) return; S.faunaIn = (S.faunaIn || 0) - dt; if (S.faunaIn <= 0) { S.faunaIn = seasonInfo().s.k === 'primavera' ? 40 : seasonInfo().s.k === 'inverno' ? 110 : 75; faunaFill(false); }
  const live = S.fauna.filter(a => a.dying == null);
  const byId = {}; for (const a of live) byId[a.id] = a;
  // packs: keep a living leader
  for (const a of live) if (a.k === 'lupo' && a.pack && !byId[a.pack]) { const mem = live.filter(o => o.pack === a.pack); if (mem.length > 1) { const nl = mem[0].id; for (const o of mem) o.pack = nl; } else a.pack = 0; }
  // ---- scontri tra lupi e bestie forti (orso, cinghiale): conta il numero ----
  const near = (a) => Math.hypot(a.x - MCX, a.y - MCX) < 34 && SC && MODE === 'village';
  for (const bear of live) {
    const SG = STRONG[bear.k]; if (!SG || bear.fight || (bear.fcd || 0) > 0) continue;
    let w0 = null, wd = SG.reach; for (const o of live) if (o.k === 'lupo' && !o.infight && !((o.fcd || 0) > 0) && (bear.k === 'orso' || !o.sated || o.chId === bear.id)) { const d2 = Math.hypot(o.x - bear.x, o.y - bear.y); if (d2 < wd) { wd = d2; w0 = o; } }
    if (!w0) continue;
    const grp = live.filter(o => o.k === 'lupo' && !o.infight && !((o.fcd || 0) > 0) && (o === w0 || (w0.pack && o.pack === w0.pack)) && Math.hypot(o.x - w0.x, o.y - w0.y) < 6);
    for (const o of grp) { o.tx = bear.x; o.ty = bear.y; o.charge = 2.3; }
    bear.tx = w0.x; bear.ty = w0.y; bear.charge = bear.k === 'cinghiale' ? 2.4 : 1.8;
    if (grp.some(o => Math.hypot(o.x - bear.x, o.y - bear.y) < 1.1)) {
      const n = Math.min(3, grp.length), wolvesWin = Math.random() < SG.p[n];
      bear.fight = { t: 0, wolves: grp.map(o => o.id), win: wolvesWin ? 'lupi' : 'bestia' }; bear.infight = true; for (const o of grp) o.infight = bear.id;
      if (near(bear)) { floatText(SC, bear.x, bear.y, grp.length > 1 ? `🐺×${grp.length} attaccano ${SG.art}!` : `${SG.e} contro 🐺!`, '#f3c9a8', 1.4); sfx('hit'); }
    }
  }
  for (const bear of live) if (bear.fight) {
    const F2 = bear.fight, SG = STRONG[bear.k]; F2.t += dt; const ws = F2.wolves.map(id => byId[id]).filter(Boolean);
    if (F2.t > 2.2 || !ws.length) {
      if (F2.win === 'lupi' && ws.length) { bear.dying = 0; for (const o of ws) { o.sated = 90; o.fcd = 20; } if (near(bear)) { floatText(SC, bear.x, bear.y, ws.length > 1 ? `🐺 il branco ha abbattuto ${SG.art}` : `🐺 il lupo ha avuto la meglio sul${SG.k === 'orso' ? "l'orso" : ' cinghiale'}`, '#f3c9a8', 1.8); for (let i = 0; i < 5; i++) puff(SC, bear.x + (Math.random() - .5) * .6, bear.y + (Math.random() - .5) * .6, 6, '#8a2a1a'); } }
      else if (ws.length) { const dead = ws[0]; dead.dying = 0; for (const o of ws.slice(1)) { o.fcd = 30; o.hunting = false; const ex = o.x - bear.x, ey = o.y - bear.y, el = Math.hypot(ex, ey) || 1; o.tx = o.x + ex / el * 6; o.ty = o.y + ey / el * 6; o.charge = 2; } bear.sated = 40; bear.fcd = 25; if (near(bear)) { floatText(SC, bear.x, bear.y, `${SG.e} ${SG.art} ha ${SG.k === 'orso' ? 'sbranato' : 'sventrato'} il lupo${ws.length > 1 ? ', il branco fugge' : ''}`, '#f3c9a8', 1.8); for (let i = 0; i < 4; i++) puff(SC, dead.x + (Math.random() - .5) * .5, dead.y + (Math.random() - .5) * .5, 5, '#8a2a1a'); } }
      for (const o of ws) o.infight = 0; bear.fight = null; bear.infight = false; if (near(bear)) sfx('hit');
    }
  }
  for (const a of S.fauna) {
    if (a.dying != null) { a.dying += dt; continue; }
    a.gph = (a.gph || Math.random() * 10) + dt * 1.6; if (a.atk > 0) a.atk -= dt; if (a.fcd > 0) a.fcd -= dt;
    if (a.infight) { a.mv = false; if (!(a.atk > 0)) a.atk = 0.8; const op = STRONG[a.k] ? byId[(a.fight && a.fight.wolves[0])] : byId[a.infight]; if (op) { const sv = rotV(op.x - a.x, op.y - a.y); a.fl = (sv[0] - sv[1]) < 0; } continue; }
    const chg = a.charge; a.charge = 0;
    if (!chg && a.k === 'lupo' && a.pack && a.pack !== a.id && byId[a.pack]) { const L = byId[a.pack], dl = Math.hypot(L.x - a.x, L.y - a.y); if (dl > 8) { a.tx = L.x + (Math.random() - .5) * 5; a.ty = L.y + (Math.random() - .5) * 5; a.fast = 1.4; } else if (!a.hunting && Math.hypot(a.tx - a.x, a.ty - a.y) < 0.05 && a.wt <= 0) { const nx = L.tx + (Math.random() - .5) * 7, ny = L.ty + (Math.random() - .5) * 7; if (wildOk(nx, ny)) { a.tx = nx; a.ty = ny; a.wt = 2 + Math.random() * 5; } } }
    const pred = a.k === 'lupo' || a.k === 'orso'; a.sated = Math.max(0, (a.sated || 0) - dt); a.fast = 1; if (chg) { a.fast = chg; a.hunting = true; }
    if (pred && !a.sated && !chg) { let prey = null, pd = a.k === 'lupo' ? 7 : 5; if (a.ignT > 0) a.ignT -= dt; for (const o of live) if (!o.huntBy && (PREY[o.k] || (a.k === 'lupo' && o.k === 'cinghiale' && !o.infight)) && o.dying == null && (a.k === 'lupo' || o.k !== 'lepre') && !(a.ignT > 0 && a.ign === o.id)) { const d2 = Math.hypot(o.x - a.x, o.y - a.y) * (o.k === 'lepre' ? 2.2 : 1); if (d2 < pd) { pd = d2; prey = o; } } if (prey) pd = Math.hypot(prey.x - a.x, prey.y - a.y);
      if (prey && a.chId === prey.id) { a.chT = (a.chT || 0) + dt; if (a.chT > (prey.k === 'lepre' ? 3 : 7)) { a.ign = prey.id; a.ignT = 40; a.sated = 20; a.chT = 0; a.chId = 0; prey = null; a.hunting = false; a.tx = a.x; a.ty = a.y; a.wt = 3; } } else if (prey) { a.chId = prey.id; a.chT = 0; }
      if (prey) { a.tx = prey.x; a.ty = prey.y; a.fast = a.k === 'lupo' ? 2.2 : 1.8; a.hunting = true;
        if (pd < 1.4 && !(a.atk > 0)) a.atk = 0.8;
        if (pd < 0.7 && !STRONG[prey.k]) { prey.dying = 0; a.sated = 100; a.chId = 0; a.hunting = false; a.tx = a.x; a.ty = a.y; a.wt = 6; if (SC && MODE === 'village') { for (let i = 0; i < 4; i++) puff(SC, prey.x + (Math.random() - .5) * .5, prey.y + (Math.random() - .5) * .5, 5, '#8a2a1a'); if (Math.hypot(prey.x - MCX, prey.y - MCX) < 30) floatText(SC, prey.x, prey.y, `${a.k === 'lupo' ? '🐺' : '🐻'} ha cacciato ${FAUNA[prey.k].n.split(' ')[0].toLowerCase()}`, '#f3c9a8', 1.6); sfx('hit'); } }
      } else a.hunting = false; }
    if (!pred && a.k !== 'cinghiale') { let th = null, td = 4.5; for (const o of live) if ((o.k === 'lupo' || o.k === 'orso') && o.hunting) { const d2 = Math.hypot(o.x - a.x, o.y - a.y); if (d2 < td) { td = d2; th = o; } }
      if (th) { const ex = a.x - th.x, ey = a.y - th.y, el = Math.hypot(ex, ey) || 1; let nx = a.x + ex / el * 3, ny = a.y + ey / el * 3; if (!wildOk(nx, ny)) { nx = a.x + ey / el * 3; ny = a.y - ex / el * 3; } a.tx = nx; a.ty = ny; a.fast = 2; a.wt = 1; } }
    if (a.huntBy) a.fast = Math.min(a.fast || 1, 0.6);
    const F = FAUNA[a.k], dx = a.tx - a.x, dy = a.ty - a.y, d = Math.hypot(dx, dy);
    if (d < 0.05) { a.mv = false; a.wt -= dt; if (a.wt <= 0) { for (let t = 0; t < 8; t++) { const nx = a.x + (Math.random() - .5) * 8, ny = a.y + (Math.random() - .5) * 8; if (wildOk(nx, ny)) { a.tx = nx; a.ty = ny; break; } } a.wt = 2 + Math.random() * 6; } }
    else { const st = Math.min(d, F.spd * a.fast * dt); const nx = a.x + dx / d * st, ny = a.y + dy / d * st; if (wildOk(nx, ny)) { a.x = nx; a.y = ny; a.mv = true; a.ph += dt * 9; const sv = rotV(dx, dy); a.fl = (sv[0] - sv[1]) < 0; } else { a.tx = a.x; a.ty = a.y; } }
  }
  S.fauna = S.fauna.filter(a => a.dying == null || a.dying < 1.6);
}
function pickAnimal(sx, sy, tx, ty) {
  if (!S || !S.fauna || MODE !== 'village') return null; let best = null, bd = 1.1;
  for (const a of S.fauna) { if (a.dying != null) continue; const d = Math.hypot(a.x - tx, a.y - ty); if (d < bd) { bd = d; best = a; } }
  if (best) return best;
  const wx = (sx - VW / 2) / cam.z + cam.x, wy = (sy - VH / 2) / cam.z + cam.y;
  for (const a of S.fauna) { if (a.dying != null) continue; const [bx, by] = W(a.x, a.y); const w = FAUNA[a.k].w; if (Math.abs(wx - bx) < w / 2 && wy < by + 4 && wy > by - w * 0.9) return a; }
  return null;
}
function soldiers() { return Object.keys(S.army).reduce((s, k) => s + (S.army[k] || 0), 0); }
function openAnimal(a) {
  const F = FAUNA[a.k]; SC.selA = a; SC.sel = null; SC.selN = null;
  const can = soldiers() >= F.need; const risk = Math.round(F.risk * DF().edmg * (1 - curePct()) * 100);
  openSheet(`🏹 ${F.n}`, `<p class="desc">${F.desc}</p><div class="stats"><span>Bottino ${Object.keys(F.gain).map(k => ICO(k) + ' +' + F.gain[k]).join(' ')}</span>${F.need ? `<span>Battuta: ${F.need} soldati (hai ${soldiers()})</span><span>Rischio di perdere un uomo: ${risk}%</span>` : '<span>Caccia sicura</span>'}</div><div class="acts">${a.huntBy ? '<button class="btn dis">🏹 I cacciatori sono in cammino…</button>' : can ? `<button class="btn" onclick="huntAnimal(${a.id})">🏹 Caccia</button>` : `<button class="btn dis">Servono ${F.need} soldati</button>`}</div>`, 'a');
}
// ---- la caccia vera: il cacciatore parte dal Mastio, cammina fino all'animale, tira e torna ----
function huntAnimal(id) {
  const a = S.fauna.find(f => f.id === id); if (!a || a.dying != null) return; const F = FAUNA[a.k];
  if (soldiers() < F.need) return; if (a.huntBy) { toast('🏹 I cacciatori sono già sulle sue tracce'); return; }
  S.hunts = (S.hunts || []).filter(h => S.fauna.some(f => f.id === h)); S.hunts.push(id); a.huntBy = 1;
  hunterSpawn(SC, a); SC.selA = null; closeSheet(); sfx('horn'); save();
  toast(F.need ? `🏹 La battuta di caccia parte verso ${F.n.toLowerCase()}` : `🏹 Il cacciatore parte verso ${F.n.toLowerCase()}`);
}
function hunterSpawn(sc, a) {
  if (!sc || sc.mode !== 'village') return; const m = sc.B.find(b => b.t === 'mastio'); if (!m) return; const [hx, hy] = frontTile(sc, m); const F = FAUNA[a.k];
  const pos = a.hpos || [hx + 0.5, hy + 0.5]; const n = Math.max(1, Math.min(4, F.need || 1)); const kinds = ['arccorto', 'miliziano', 'arccorto', 'scudata'];
  for (let i = 0; i < n; i++) { const u = mkUnit(kinds[i], 'V', pos[0] + i * 0.3, pos[1] + (i % 2) * 0.3); u.d = Object.assign({}, UDEF[kinds[i]], { spd: 0.95 }); u.hunter = a.id; u.hLead = i === 0; u.st = 'go'; u.rp = 0; u.delay = i * 0.5; u.home = [hx, hy]; u.ai = hunterAI; sc.U.push(u); }
}
function hunterAI(sc, u, dt) {
  if (u.delay > 0) { u.delay -= dt; return; }
  if (u.st === 'back') { if (!u.path || followPath(sc, u, dt)) { u.dead = true; u.deadT = 9; } return; }
  const a = S.fauna.find(f => f.id === u.hunter && f.dying == null);
  if (!a) { if (u.hLead) { S.hunts = (S.hunts || []).filter(h => h !== u.hunter); floatText(sc, u.x, u.y, 'La preda è sfuggita', '#ffe9a6', 1.6); }
    u.st = 'back'; u.path = astar(Math.floor(u.x), Math.floor(u.y), (x, y) => x === u.home[0] && y === u.home[1], villagerCost(sc), u.home[0], u.home[1], 6000); u.pi = 0; return; }
  const d = Math.hypot(a.x - u.x, a.y - u.y); if (u.hLead) a.hpos = [u.x, u.y];
  if (u.hLead && d < 3.2) { u.moving = false; setFace(u, a.x - u.x, a.y - u.y); u.aim = (u.aim || 0) + dt; a.tx = a.x; a.ty = a.y; a.wt = 2;
    if (u.aim > 0.9) { sfx('bow'); shoot(sc, u.x, u.y, 26, { x: a.x, y: a.y, dead: true }, 0, 'arrow', u); u.resT = 0.45; u.aim = -99; } if (u.resT > 0) { u.resT -= dt; if (u.resT <= 0) huntResolve(a.id); } return; }
  if (!u.hLead) { const L = sc.U.find(o => o.hunter === u.hunter && o.hLead && !o.dead); if (L && Math.hypot(L.x - u.x, L.y - u.y) < 1.4) { u.moving = false; return; } }
  u.rp -= dt; if (u.rp <= 0 || !u.path || u.pi >= u.path.length) { u.rp = 3; const tx = Math.floor(a.x), ty = Math.floor(a.y); u.path = astar(Math.floor(u.x), Math.floor(u.y), (x, y) => Math.hypot(x + 0.5 - a.x, y + 0.5 - a.y) < 2.4, (x, y) => sc.water[y * N + x] ? Infinity : (bAt(sc, x, y) && !BDEF[bAt(sc, x, y).t].decor ? Infinity : (sc.pathG && sc.pathG[y * N + x] ? 1 : 1.6)), tx, ty, 6000); u.pi = 0; if (u.path && u.path.length > 1 && u.path[0][0] === Math.floor(u.x) && u.path[0][1] === Math.floor(u.y)) u.pi = 1; }
  if (u.path) { followPath(sc, u, dt); if (u.hLead) { u.stT = (u.stT || 0) - dt; if (u.stT <= 0) { u.stT = 0.42; const [px, py] = W(u.x, u.y); const sx = (px - cam.x) * cam.z + VW / 2, sy = (py - cam.y) * cam.z + VH / 2; if (sx > 0 && sx < VW && sy > 0 && sy < VH) sfx('step'); } } }
}
function huntResolve(id) {
  const a = S.fauna.find(f => f.id === id); if (!a || a.dying != null) return; const F = FAUNA[a.k];
  S.hunts = (S.hunts || []).filter(h => h !== id);
  const got = {}; for (const k in F.gain) got[k] = addRes(k, F.gain[k]);
  let lost = '';
  if (F.risk && Math.random() < F.risk * DF().edmg * (1 - curePct())) { const ks = UNIT_ORDER.filter(k => S.army[k] > 0); const k = ks[0]; if (k) { S.army[k]--; lost = ` — ${UDEF[k].n} caduto nella caccia`; } }
  a.dying = 0; S.hunted = (S.hunted || 0) + 1; if (a.k === 'orso') S.bears = (S.bears || 0) + 1;
  for (let i = 0; i < 4; i++) puff(SC, a.x + (Math.random() - .5) * .5, a.y + (Math.random() - .5) * .5, 6, '#7a6a55');
  floatText(SC, a.x, a.y, Object.keys(got).filter(k => got[k] > 0).map(k => `+${got[k]}${RICON[k]}`).join(' ') || 'Magazzini pieni', '#ffe9a6', 1.5);
  if (lost) toast('🐻' + lost);
  sfx('hit'); save(); updateHUD();
  if (SC) for (const u of SC.U) if (u.hunter === id && !u.dead) { u.st = 'back'; u.delay = 1.2; u.path = astar(Math.floor(u.x), Math.floor(u.y), (x, y) => x === u.home[0] && y === u.home[1], villagerCost(SC), u.home[0], u.home[1], 6000); u.pi = 0; }
}
// ---------- mercato & accademia ----------
const TRADES = [{ give: { pelli: 10 }, get: { oro: 70 } }, { give: { legno: 100 }, get: { oro: 35 } }, { give: { cibo: 100 }, get: { oro: 30 } }, { give: { ferro: 50 }, get: { oro: 45 } }, { give: { pietra: 50 }, get: { oro: 40 } }, { give: { oro: 80 }, get: { ferro: 50 } }];
function tradeMul() { return 1 + 0.1 * (lvlSum('mercato') - 1); }
function tradeGet(t) { const o = {}; for (const k in t.get) o[k] = Math.round(t.get[k] * (t.give.oro ? 1 : tradeMul())); return o; }
function doTrade(i, id) { const t = TRADES[i]; if (!canPay(t.give)) { toast('Risorse insufficienti'); return; } pay(t.give); const g2 = tradeGet(t); for (const k in g2) addRes(k, g2[k]); sfx('coin'); save(); updateHUD(); openBuildingInfo(S.buildings.find(b => b.id === id)); }
function doResearch(k, id) { const l = tech(k) + 1, mx = lvlSum('accademia') * 2; if (l > Math.min(5, mx)) { toast('Migliora l\'Accademia per ricerche più avanzate'); return; } const c2 = TECH[k].cost(l); if (!canPay(c2)) { toast('Risorse insufficienti'); return; } pay(c2); (S.tech = S.tech || {})[k] = l; sfx('bell'); toast(`📚 ${TECH[k].n} livello ${l}!`); save(); updateHUD(); openBuildingInfo(S.buildings.find(b => b.id === id)); }
// ---------- upgrades / training ----------
function upCost(r) { if (r.t === 'mastio') return MASTIO_UP[r.lvl]; if (r.t === 'muro') return { pietra: 12 }; return scaleCost(BDEF[r.t].cost, r.lvl + 1); }
function upTime(r) { return Math.round(upTime0(r) * seasonBuildMul()); }
function upTime0(r) { const p = PACE(); if (r.t === 'mastio') return Math.round((MASTIO_T[r.lvl] || 720) * 60 * TEMPI.mastio * p); if (r.t === 'muro') return Math.round(6 * r.lvl * p); const w = Math.max(0.4, (BDEF[r.t].t || 6) / 10); return Math.max(20, Math.round((UP_T[r.lvl + 1] || 150) * 60 * w * TEMPI.miglioria * p)); }
function canUp(r) {
  if (r.end) return 'In costruzione…';
  if (r.t === 'mastio') return r.lvl >= 16 ? `Livello massimo (${ERA(r.lvl).n})` : null;
  if (r.t === 'muro') return r.lvl >= 2 ? 'Già in pietra' : S.mastio < 5 ? 'Serve Mastio 5 (Età Feudale)' : null;
  if (BDEF[r.t].decor) return 'Decorazione';
  if (r.lvl >= bLvlCap()) return `Livello massimo con Mastio ${S.mastio}`;
  return null;
}
function doUpgrade(id) {
  const r = S.buildings.find(b => b.id === id); if (!r) return; const why = canUp(r); if (why) { toast(why); return; }
  const c = upCost(r); if (!canPay(c)) { needSheet(c, r.t === 'mastio' ? `alzare il Mastio al livello ${r.lvl + 1}` : `migliorare ${BDEF[r.t].n}`); return; }
  const t = upTime(r); if (t && !BDEF[r.t].wall && builders() >= maxBuilders()) { toast(`Tutti i mastri d'opera sono occupati (max ${maxBuilders()})`); return; }
  pay(c); if (resOf(r)) collect(r);
  if (t && !S.creative) { r.end = now() + t * 1000; r.dur = t * 1000; r.toLvl = r.lvl + 1; } else { r.lvl++; }
  sfx('build'); const sel = r; SC = buildVillage(); SC.sel = SC.B.find(b => b.ref === sel) || null; save(); updateHUD(); openBuildingInfo(r);
  if (BLD_NAV && BLD_NAV.includes(r.id) && builders() < maxBuilders() && BLD_NAV.some(id => bldUpOk(S.buildings.find(b => b.id === id)))) setTimeout(() => { if ($('#sheet').dataset.p === 'b:' + r.id) bldGo(1); }, 650);
}
// ---- riparazioni: palizzata e cancello sfondati durante le razzie
function repairCost(r) { const d = BDEF[r.t]; const base = r.t === 'muro' && r.lvl >= 2 ? { pietra: 12 } : d.cost; const o = {}; for (const k in base) o[k] = Math.max(1, Math.ceil(base[k] * 0.5)); return o; }
function sumCost(list) { const o = {}; for (const r of list) { const c = repairCost(r); for (const k in c) o[k] = (o[k] || 0) + c[k]; } return o; }
function openRepair(r) { const d = BDEF[r.t]; const rotti = S.buildings.filter(b => b.rotto && (BDEF[b.t].wall || BDEF[b.t].gate)); const c1 = repairCost(r), ca = sumCost(rotti);
  let body = `<p class="desc">${d.wall ? 'Questo pezzo di palizzata' : 'Il cancello'} è stato sfondato durante la razzia: da qui il nemico passa finché non lo ripari.</p>`;
  body += `<button class="btn${canPay(c1) ? '' : ' dis'}" onclick="repairWalls(${r.id})">🔧 Ripara ${d.wall ? 'questo pezzo' : 'il cancello'}<small>${costStr(c1)}</small></button>`;
  if (rotti.length > 1) body += `<button class="btn${canPay(ca) ? '' : ' dis'}" onclick="repairWalls()">🔧 Ripara tutto (${rotti.length} pezzi)<small>${costStr(ca)}</small></button>`;
  openSheet(`🔧 ${d.n} rotta`, body, 'b:' + r.id); }
function repairWalls(id) { const list = S.buildings.filter(b => b.rotto && (id == null ? (BDEF[b.t].wall || BDEF[b.t].gate) : b.id === id)); let n = 0;
  for (const r of list) { const c = repairCost(r); if (!canPay(c)) break; pay(c); delete r.rotto; n++; }
  if (n) { toast(`🔧 ${n === 1 ? 'Riparato!' : n + ' pezzi riparati'}`); sfx('build'); SC = buildVillage(); save(); updateHUD(); closeSheet(); } else toast('Risorse insufficienti per riparare'); }
function upgradeAllWalls() {
  const ws = S.buildings.filter(b => b.t === 'muro' && b.lvl < 2); let n = 0;
  for (const w of ws) { if (w.end) continue; if (S.res.pietra < 12) break; S.res.pietra -= 12; if (timedOn()) { w.end = now() + (4 + n * 0.3) * 1000; w.dur = (4 + n * 0.3) * 1000; w.toLvl = 2; } else w.lvl = 2; n++; }
  if (n) { toast(`🧱 ${n} pezzi di palizzata diventano Mura di Pietra`); sfx('build'); SC = buildVillage(); save(); updateHUD(); } else toast('Serve pietra (12 per pezzo)');
  closeSheet();
}
function finishNow(id) { /* no premium: just info */ }
function train(k, n) {
  const d = UDEF[k]; let done = 0;
  for (let i = 0; i < n; i++) { if (armyUsed() + d.sp > armyCap()) { toast('👥 Popolazione al completo: costruisci o migliora le Case'); break; } if (!canPay(d.cost)) { if (!done) toast('Risorse insufficienti'); break; } pay(d.cost); S.queue.push({ k }); done++; }
  if (done) { sfx('click'); save(); updateHUD(); openArmy(); }
}
function hasB(t) { return S.buildings.some(b => b.t === t && !(b.end && b.toLvl === 1)); }
function unlockedUnit(k) { const d = UDEF[k]; return S.mastio >= d.lv && hasB(d.at) && (!d.need || hasB(d.need)); }

// ================= VITA NEL VILLAGGIO: giorno e notte, carovane, suoni d'ambiente =================
const DAY_MS = 24 * 60 * 1000; // una giornata = 24 minuti reali
function dayInfo() { const t0 = (S && S.seasonEpoch) || 0; const p = (((now() - t0) % DAY_MS) + DAY_MS) % DAY_MS / DAY_MS; // 0=alba
  const night = p < 0.06 ? 1 - p / 0.06 : p < 0.62 ? 0 : p < 0.7 ? (p - 0.62) / 0.08 : p < 0.94 ? 1 : 1 - (p - 0.94) / 0.06;
  const ph = p < 0.08 ? ['🌅', 'Alba'] : p < 0.55 ? ['☀️', 'Giorno'] : p < 0.68 ? ['🌇', 'Tramonto'] : p < 0.94 ? ['🌙', 'Notte'] : ['🌅', 'Alba'];
  const hour = Math.floor((6 + p * 24) % 24); return { p, night: Math.max(0, Math.min(1, night)), ic: ph[0], n: ph[1], hour, dusk: p > 0.55 && p < 0.7 }; }
function drawBanner(c, l) { if (!G3.models.insegna) need3d('insegna'); const m = G3.models.insegna; if (!m || !m.ready) return; const [wx, wy] = W(l.x, l.y); const yr = ((l.yaw - ANG) % 6.283 + 6.283) % 6.283; const yq = [0, 0.45, 2.69, 3.14, 3.59, 5.83].reduce((b, v) => Math.abs(Math.atan2(Math.sin(v - yr), Math.cos(v - yr))) < Math.abs(Math.atan2(Math.sin(b - yr), Math.cos(b - yr))) ? v : b, 0); const sp = g3sprite('insegna', l.h || 112, yq, 0); if (sp) c.drawImage(sp.cv, wx + sp.x0, wy + sp.y0, sp.w, sp.h); }
function drawLamp(c, l) { if (!G3.models.lampione) need3d('lampione'); need3d('insegna'); const [wx, wy] = W(l.x, l.y); const m = G3.models.lampione; if (!m || !m.ready) { c.fillStyle = '#4a3420'; c.fillRect(wx - 1.2, wy - 40, 2.4, 40); return; }
  const yq = Math.round(((l.yaw - ANG) % 6.283 + 6.283) % 6.283 / 0.785) % 8 * 0.785; const sp = g3sprite('lampione', 84, yq, 0); if (sp) c.drawImage(sp.cv, wx + sp.x0, wy + sp.y0, sp.w, sp.h); }
function nightLights(c, sc, k) {
  if (PATHC.lamps && sc.pathG === PATHC.grid) for (const l of PATHC.lamps) { const [lx, ly] = W(l.x, l.y); const fl = 0.9 + Math.sin(sc.time * 6 + l.x * 3) * 0.08; for (const [x, y, r, a] of [[lx, ly - 60, 15, 0.32], [lx, ly, 26, 0.07]]) { const gr = c.createRadialGradient(x, y, 1, x, y, r * fl); gr.addColorStop(0, `rgba(255,200,110,${a * k})`); gr.addColorStop(1, 'rgba(255,150,60,0)'); c.fillStyle = gr; c.fillRect(x - r, y - r, r * 2, r * 2); } }
    for (const b of sc.B) { if (b.dead) continue; const d = BDEF[b.t]; if (b.t === 'lanterna') { const [lx, ly] = W(b.x + 0.5, b.y + 0.5); const x = lx + 7, y = ly - 37; const fl = 0.9 + Math.sin(sc.time * 7 + b.id) * 0.08; const gr = c.createRadialGradient(x, y, 1, x, y, 34 * fl); gr.addColorStop(0, `rgba(255,200,110,${0.55 * k})`); gr.addColorStop(1, 'rgba(255,150,60,0)'); c.fillStyle = gr; c.fillRect(x - 34, y - 34, 68, 68); const g2 = c.createRadialGradient(lx, ly, 1, lx, ly, 40); g2.addColorStop(0, `rgba(255,190,100,${0.18 * k})`); g2.addColorStop(1, 'rgba(255,150,60,0)'); c.fillStyle = g2; c.fillRect(lx - 40, ly - 40, 80, 80); continue; }
      if (d.wall || (d.decor && b.t !== 'falo') || b.nat) continue; const [wx, wy] = W(b.x + b.w / 2, b.y + b.h / 2); const h0 = ((b.x * 73856093) ^ (b.y * 19349663) ^ (b.id * 83492791)) >>> 0;
      if (b.t === 'falo') { const fl = 0.8 + Math.sin(sc.time * 11 + b.id) * 0.12 + Math.sin(sc.time * 17) * 0.06; const gr = c.createRadialGradient(wx, wy - 8, 1, wx, wy - 8, 26 * fl); gr.addColorStop(0, `rgba(255,190,90,${0.55 * k})`); gr.addColorStop(1, 'rgba(255,120,40,0)'); c.fillStyle = gr; c.beginPath(); c.arc(wx, wy - 8, 26 * fl, 0, 7); c.fill(); continue; }
      if (NOLIGHT.has(b.t) || (b.t !== 'mastio' && h0 % 4 === 0)) continue; // qualche casa resta al buio
      const nW = b.t === 'mastio' ? 6 : Math.min(4, 1 + (h0 >> 3) % 2 + (b.w > 2 ? 1 : 0)); const sp = b.t === 'mastio' ? 9 + (S.mastio || 1) * 2.6 : 9 + b.w * 3;
      for (let i = 0; i < nW; i++) { const hh = (h0 >> (i * 3)) & 63; const side = i % 2 ? 1 : -1; const ox = side * (5 + (hh % 5) * 0.2 * sp) ; const oy = -10 - (hh >> 2) % 4 * 4 - b.w * 3 + Math.abs(ox) * 0.35; const x = wx + ox, y = wy + oy;
        const fl = 0.85 + Math.sin(sc.time * 2.3 + b.id * 3 + i * 1.7) * 0.1 + (Math.sin(sc.time * 9 + i * 5 + b.id) > 0.97 ? -0.3 : 0); const al = k * fl;
        const gr = c.createRadialGradient(x, y, 0.5, x, y, 9); gr.addColorStop(0, `rgba(255,190,100,${0.35 * al})`); gr.addColorStop(1, 'rgba(255,150,60,0)'); c.fillStyle = gr; c.fillRect(x - 9, y - 9, 18, 18);
        c.fillStyle = `rgba(255,214,130,${0.95 * al})`; c.fillRect(x - 1.3, y - 2, 2.6, 3.6); c.fillStyle = `rgba(255,245,200,${0.8 * al})`; c.fillRect(x - 0.6, y - 1.4, 1.2, 1.6); }
    }
}
const NOLIGHT = new Set(['poligono', 'stendardo', 'cripta', 'cancello', 'balista', 'bottino', 'tenda']);
function drawDayNight(c, sc, z) {
  if (sc.mode !== 'village' && sc.mode !== 'visit') return; const D = dayInfo(); const k = D.night;
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
  if (D.dusk) { c.fillStyle = `rgba(255,120,40,${0.12 * Math.sin(Math.PI * (D.p - 0.55) / 0.15)})`; c.globalCompositeOperation = 'soft-light'; c.fillRect(0, 0, cv.width, cv.height); c.globalCompositeOperation = 'source-over'; }
  if (k > 0.01) {
    c.fillStyle = `rgba(12,20,45,${0.5 * k})`; c.fillRect(0, 0, cv.width, cv.height);
    c.globalCompositeOperation = 'lighter'; c.setTransform(z, 0, 0, z, DPR * (VW / 2 - cam.x * cam.z), DPR * (VH / 2 - cam.y * cam.z));
    nightLights(c, sc, k);
    // lucciole d'estate e stelle
    if (seasonInfo().s.k === 'estate') for (let i = 0; i < 18; i++) { const px = ((i * 977 + sc.time * 6 * (i % 3 + 1)) % VW), py = ((i * 613 + Math.sin(sc.time + i) * 30) % VH); const al = (0.5 + 0.5 * Math.sin(sc.time * 3 + i * 2)) * k; c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = `rgba(220,255,140,${al * 0.8})`; c.beginPath(); c.arc(px * DPR, py * DPR, 1.8 * DPR, 0, 7); c.fill(); }
  }
  c.restore();
}
// --- carovane che arrivano lungo i sentieri ---
function caravanSpawn(sc, label) {
  if (!sc || sc.mode !== 'village') return; const dest = sc.B.find(b => b.t === 'mercato' && !b.dead) || sc.B.find(b => b.t === 'mastio'); if (!dest) return;
  const [tx, ty] = frontTile(sc, dest); const edges = []; for (let i = 4; i < N - 4; i += 6) edges.push([i, 3], [i, N - 4], [3, i], [N - 4, i]);
  const G = sc.pathG; let best = null, bd = 1e9; for (const [ex, ey] of edges) { if (isWater(sc, ex, ey) || bAt(sc, ex, ey)) continue; const d = Math.hypot(ex - tx, ey - ty) + Math.random() * 25; if (d < bd) { bd = d; best = [ex, ey]; } } if (!best) return;
  const path = astar(best[0], best[1], (x, y) => x === tx && y === ty, villagerCost(sc), tx, ty, 9000); if (!path) return;
  const u = mkUnit('miliziano', 'V', best[0] + 0.5, best[1] + 0.5); u.k = 'carro'; u.d = { spd: 0.9, hp: 1, cd: 1, rng: 0, model: 1 }; u.path = path; u.pi = 0; u.cart = label || 'Carovana di mercanti';
  u.ai = (sc, u, dt) => { if (followPath(sc, u, dt)) { u.dead = true; u.deadT = 9; if (u.cart) floatText(sc, u.x, u.y, '🐴 ' + u.cart, '#ffe9a6', 1.6); } };
  sc.U.push(u); return u;
}
function drawCart(c, u, wx, wy) {
  if (!G3.models.bottino) need3d('bottino'); if (!G3.models.bottino || !G3.models.bottino.ready) { c.font = '22px serif'; c.textAlign = 'center'; c.fillText('🐴', wx, wy - 4); return true; }
  const yaw = u.face === 'B' ? (u.flip ? 2.4 : 3.9) : (u.flip ? 0.75 : -0.75); const sp = g3sprite('bottino', 44, yaw, 0); if (!sp) return false;
  const bob = Math.abs(Math.sin(u.phase * 6)) * 1.2; u.phase += 1 / 60;
  c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(wx, wy, 18, 7, 0, 0, 7); c.fill(); c.drawImage(sp.cv, wx + sp.x0, wy + sp.y0 - bob, sp.w, sp.h); return true;
}
let CARAVAN_T = 90;
function lifeTick(dt) { if (!S || MODE !== 'village' || S.creative) return; festTick(dt); visitorTick(dt); CARAVAN_T -= dt; if (CARAVAN_T <= 0) { CARAVAN_T = 150 + Math.random() * 150; if (dayInfo().night < 0.5 && SC.U.filter(u => u.k === 'carro' && !u.dead).length < 2) caravanSpawn(SC, ['Mercanti di stoffe', 'Carro del mugnaio', 'Pellegrini con un carro', 'Venditori di sale'][(Math.random() * 4) | 0]); } ambientTick(dt); }
// --- suoni d'ambiente (sintetizzati, al volume degli effetti) ---
const AMB = { t: 2, hammer: 1, bell: -1 };
function ambientTick(dt) {
  if (SET.mute || SET.fvol <= 0 || document.hidden || !AC || MODE !== 'village') return; const a = AC; const out = fxOut(a); const D = dayInfo(), si = seasonInfo().s.k, w = S.wx || { k: 'sereno' };
  const blip = (f0, f1, dur, vol, type, delay) => { const t = a.currentTime + (delay || 0); const o = a.createOscillator(); o.type = type || 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur); const g = a.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.15); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g).connect(out); o.start(t); o.stop(t + dur + 0.05); };
  AMB.t -= dt; if (AMB.t <= 0) {
    AMB.t = 2.5 + Math.random() * 4;
    if (D.night < 0.5 && w.k !== 'pioggia' && w.k !== 'temporale' && si !== 'inverno') { const n = 2 + ((Math.random() * 4) | 0), f = 2600 + Math.random() * 1800; for (let i = 0; i < n; i++) blip(f * (1 + Math.random() * 0.2), f * (0.75 + Math.random() * 0.5), 0.09 + Math.random() * 0.06, 0.035, 'sine', i * 0.12); }
    else if (D.night >= 0.5 && si !== 'inverno') { for (let i = 0; i < 6; i++) blip(4300, 4200, 0.035, 0.012, 'square', i * 0.07); }
    if (D.night >= 0.5 && Math.random() < 0.15) { blip(420, 380, 0.5, 0.03, 'sine'); blip(330, 300, 0.7, 0.03, 'sine', 0.55); } // gufo
  }
  AMB.hammer -= dt; if (AMB.hammer <= 0) { AMB.hammer = 1.1 + Math.random() * 1.5; if (S.buildings.some(b => b.end && !BDEF[b.t].wall && !BDEF[b.t].decor)) for (let i = 0; i < 2; i++) blip(900, 300, 0.06, 0.05, 'triangle', i * 0.32); }
  const dawn = D.p < 0.02; if (dawn && AMB.bell !== Math.floor((now() - (S.seasonEpoch || 0)) / DAY_MS)) { AMB.bell = Math.floor((now() - (S.seasonEpoch || 0)) / DAY_MS); for (let i = 0; i < 3; i++) [1, 2.01, 2.76].forEach((m, j) => blip(330 * m, 330 * m, 2.2 - j * 0.4, 0.05 / (j + 1), 'sine', i * 1.4)); toast('🔔 Le campane suonano: è l\'alba'); }
}

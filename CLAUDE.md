# FEUDUM – Le Corone Spezzate (progetto unico)

Questo repository è L'UNICA fonte del gioco. Pubblicato con GitHub Pages: https://marcocaretti1988-dev.github.io/feudum---le-corone-spezzate-/

- Sorgenti: `src/` → `shell_pre.html` (HTML+CSS), `data.js` (atlanti sprite/texture), `fauna2_data.js`, `shell_post.html` e il codice del gioco diviso in moduli in `src/js/`:
  - `base.js` impostazioni, difficoltà, variabili globali (caricato per primo)
  - `motore.js` grafica 3D, disegno di edifici/alberi/terreno, sentieri, sprite, personaggi 3D animati (ANIM3D), audio, rendering, camera e tocchi
  - `giocatori.js` il tuo regno: dati di edifici/truppe/eroi (BDEF, UDEF, HDEF), salvataggi, villaggio, economia, gente, lavori, costruzione, caccia
  - `nemici.js` animali, unità e IA in battaglia, poteri degli eroi, predoni, battaglie e assedi
  - `livelli.js` ritmo, stagioni, città al massimo, frammenti della corona, altri regni, campagna, feudi, mercato, eventi, capitoli, storia
  - `interfaccia.js` temi, finestre e menu, stemma, guida, promemoria, HUD di battaglia, titolo
  - `avvio.js` ciclo principale e partenza (caricato per ultimo)
  `build.py` li unisce in quest'ordine in un unico script (stesso spazio globale: una funzione di un modulo si usa negli altri senza import). Dopo uno spostamento tra moduli controllare che il gioco si apra senza errori (collaudo).
- NON modificare a mano `index.html` in radice: si genera con `python3 src/build.py`.
- Modelli 3D: file `m3d_<nome>.js` in radice (caricati a pezzi). Nuovi modelli Meshy: `python3 src/tools/glb2m3d.py file.glb <nome> m3d_<nome>.js 30000`, poi aggiungere `<nome>` a `M3D_FILES` in `src/js/motore.js`.
- Personaggi Meshy animati (con scheletro): `python3 src/tools/glbanim2m3d.py file.glb <nome> m3d_<nome>.js "walk=Walking:8,idle=Walking@pose:1"` (cuoce le animazioni in pose), poi `<nome>` in `M3D_FILES` e l'unità in `ANIM3D` in `src/js/motore.js` (es. `arclungo` → `arciere3d`).
- Musica: `feudum.mp3` (villaggio), `raid.mp3` ("Ombre delle Terre Feudali", durante le razzie). Icone/manifest: `icon-*.png`, `apple-touch-icon.png`, `manifest.json`.
- `build.py` scrive anche `version.txt` (impronta): il gioco su GitHub controlla quel file e si ricarica da solo quando esce una versione nuova.
- Collaudo automatico (misura iPhone): `python3 src/tools/collaudo.py [cartella_schermate]` — deve finire con "0 problemi trovati".
- Flusso: modifica `src/` → `python3 src/build.py` → `python3 src/tools/collaudo.py` → commit e push su `main`.
- Lingua del progetto e dei testi: italiano. Utente: Marco.

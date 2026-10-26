# FEUDUM – Le Corone Spezzate (progetto unico)

Questo repository è L'UNICA fonte del gioco. Pubblicato con GitHub Pages: https://marcocaretti1988-dev.github.io/feudum---le-corone-spezzate-/

- Sorgenti: `src/` → `shell_pre.html` (HTML+CSS), `data.js` (atlanti sprite/texture), `fauna2_data.js`, `code.js` (tutto il gioco), `shell_post.html`.
- NON modificare a mano `index.html` in radice: si genera con `python3 src/build.py`.
- Modelli 3D: file `m3d_<nome>.js` in radice (caricati a pezzi). Nuovi modelli Meshy: `python3 src/tools/glb2m3d.py file.glb <nome> m3d_<nome>.js 30000`, poi aggiungere `<nome>` a `M3D_FILES` in `src/code.js`.
- Personaggi Meshy animati (con scheletro): `python3 src/tools/glbanim2m3d.py file.glb <nome> m3d_<nome>.js "walk=Walking:8,idle=Walking@pose:1"` (cuoce le animazioni in pose), poi `<nome>` in `M3D_FILES` e l'unità in `ANIM3D` in `src/code.js` (es. `arclungo` → `arciere3d`).
- Musica: `feudum.mp3` (villaggio), `raid.mp3` ("Ombre delle Terre Feudali", durante le razzie). Icone/manifest: `icon-*.png`, `apple-touch-icon.png`, `manifest.json`.
- `build.py` scrive anche `version.txt` (impronta): il gioco su GitHub controlla quel file e si ricarica da solo quando esce una versione nuova.
- Collaudo automatico (misura iPhone): `python3 src/tools/collaudo.py [cartella_schermate]` — deve finire con "0 problemi trovati".
- Flusso: modifica `src/` → `python3 src/build.py` → `python3 src/tools/collaudo.py` → commit e push su `main`.
- Lingua del progetto e dei testi: italiano. Utente: Marco.

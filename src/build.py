# Costruisce index.html (sito GitHub Pages) dai sorgenti in src/.  Uso: python3 src/build.py
import os
D = os.path.dirname(os.path.abspath(__file__)); R = os.path.dirname(D)
rd = lambda f: open(os.path.join(D, f), encoding='utf-8').read()
html = rd('shell_pre.html') + rd('data.js') + rd('fauna2_data.js') + rd('code.js') + rd('shell_post.html')
extra = ('<link rel="manifest" href="manifest.json">\n<link rel="apple-touch-icon" href="apple-touch-icon.png">\n<link rel="icon" href="icon-192.png">\n'
         '<meta name="apple-mobile-web-app-title" content="FEUDUM">\n<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n<meta name="mobile-web-app-capable" content="yes">\n')
html = html.replace('<title>', extra + '<title>', 1)
html = html.replace("'m3d/' + k + '.js'", "'m3d_' + k + '.js'").replace("'music/feudum.mp3'", "'feudum.mp3'").replace("'music/raid.mp3'", "'raid.mp3'")
open(os.path.join(R, 'index.html'), 'w', encoding='utf-8').write(html)
print('index.html', len(html) // 1024, 'KB')

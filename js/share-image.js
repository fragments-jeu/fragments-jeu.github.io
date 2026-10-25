/* FRAGMENTS — partage du Dossier du jour en image (carte 1080×1920, format story), style « dossier sous la lampe ».
 * Le texte partagé reste celui de defi.js ; l'image l'accompagne. Repli : téléchargement du PNG.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.FragShareImage = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const W = 1080, H = 1920, URL_JEU = 'https://fragments-jeu.github.io/';
  // Cases par énigme : 0 indice vert, 1 jaune, 2 orange, 3 rouge ; non résolue noire (mêmes règles que shareDaily).
  const CELL = ['#5d9e4f', '#d9b23a', '#d9782b', '#b8322a'], CELL_NONE = '#17140f';

  /** Niveau de chaque case : 0..3 = indices utilisés (plafonné à 3), -1 = énigme non résolue. */
  function levels(hints, solved) { return hints.map((h, i) => (i < solved ? Math.min(h, 3) : -1)); }
  function fileName(n) { return 'fragments-dossier-' + n + '.png'; }

  /** Envoie l'image : feuille de partage si elle accepte les fichiers, sinon téléchargement.
   * Promesse 'partage' | 'fichier' | null (annulé). nav, doc : injectables pour les tests. */
  function deliver(blob, text, name, nav, doc) {
    const file = typeof File === 'function' ? new File([blob], name, { type: 'image/png' }) : null;
    if (file && nav && typeof nav.share === 'function' && typeof nav.canShare === 'function' && nav.canShare({ files: [file] })) {
      return Promise.resolve().then(() => nav.share({ files: [file], text: text }))
        .then(() => 'partage', (e) => (e && e.name === 'AbortError' ? null : download(blob, name, doc)));
    }
    return Promise.resolve(download(blob, name, doc));
  }
  function download(blob, name, doc) {
    const a = doc.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    doc.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    return 'fichier';
  }

  // ---------- dessin ----------
  const STAR = 'M12 2l2.9 6.9l7.1.6l-5.4 4.7l1.7 7.3L12 17.6l-6.3 3.9l1.7-7.3L2 9.5l7.1-.6z';
  const FLAME = 'M12 3c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-3.8 2.5-5c.3 1.6 1 2.6 2 3c.4-2.6-.4-5.4.5-8z';
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function icon(c, d, x, y, size, fill, stroke) {
    c.save(); c.translate(x, y); c.scale(size / 24, size / 24);
    const p = new Path2D(d);
    if (fill) { c.fillStyle = fill; c.fill(p); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = 1.4; c.lineJoin = 'round'; c.stroke(p); }
    c.restore();
  }
  function fit(c, text, font, size, max) { // réduit la taille jusqu'à tenir dans max
    do { c.font = font.replace('#', size); size -= 4; } while (c.measureText(text).width > max && size > 30);
  }

  function draw(c, d) {
    // bureau d'acier olive et cône de lampe
    c.fillStyle = '#1b211a'; c.fillRect(0, 0, W, H);
    let g = c.createRadialGradient(W / 2, 260, 40, W / 2, 520, 1200);
    g.addColorStop(0, 'rgba(255,190,110,.34)'); g.addColorStop(.45, 'rgba(255,178,74,.08)'); g.addColorStop(1, 'rgba(0,0,0,.55)');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.strokeStyle = 'rgba(72,84,63,.45)'; c.lineWidth = 2;
    for (let y = 120; y < H; y += 96) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y + 14); c.stroke(); }

    // FRAGMENTS en papiers découpés
    const letters = 'FRAGMENTS'.split(''), rot = [-4, 3, -2, 5, -3, 2, -5, 3, -2], dy = [2, -3, 4, -1, 3, -4, 1, -2, 3];
    c.font = '900 120px Stencil, Impact, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    letters.forEach((l, i) => {
      const x = 108 + i * 108, y = 230 + dy[i] * 3;
      c.save(); c.translate(x, y); c.rotate(rot[i] * Math.PI / 180);
      c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(-44, -62, 96, 132);
      c.fillStyle = i === 4 ? '#b8322a' : '#e8dec6'; c.fillRect(-48, -68, 96, 132);
      c.fillStyle = i === 4 ? '#f3e6c8' : '#26211a'; c.fillText(l, 0, 4);
      c.restore();
    });

    // chemise cartonnée + feuille
    c.save(); c.translate(W / 2, 1060); c.rotate(-1.2 * Math.PI / 180);
    c.fillStyle = 'rgba(0,0,0,.45)'; rr(c, -440, -560, 900, 1150, 18); c.fill();
    c.fillStyle = '#c9ae76'; rr(c, -460, -600, 340, 90, 14); c.fill();
    c.fillStyle = '#d9c08a'; rr(c, -460, -560, 920, 1140, 16); c.fill();
    c.fillStyle = '#e8dec6'; c.fillRect(-410, -500, 820, 1030);
    c.fillStyle = 'rgba(91,82,68,.10)'; for (let y = -420; y < 520; y += 54) c.fillRect(-370, y, 740, 2);
    c.fillStyle = '#5b5244'; c.font = '700 30px Typewriter, "Courier New", monospace'; c.textAlign = 'left';
    c.fillText(d.label.toUpperCase(), -440, -555);

    c.textAlign = 'center'; c.fillStyle = '#26211a';
    c.font = '700 54px Typewriter, "Courier New", monospace'; c.fillText(d.tag, 0, -410);
    fit(c, d.title, '900 #px Stencil, Impact, sans-serif', 112, 740); c.fillText(d.title, 0, -290);
    for (let i = 0; i < 3; i++) icon(c, STAR, -195 + i * 140, -205, 110, i < d.stars ? '#e39a2a' : null, i < d.stars ? '#7a4a12' : '#8a7f6a');

    // cases par énigme (dessinées, pas d'emoji)
    const n = d.cells.length, cs = 118, gap = 26, x0 = -(n * cs + (n - 1) * gap) / 2;
    d.cells.forEach((v, i) => {
      const x = x0 + i * (cs + gap);
      c.fillStyle = 'rgba(0,0,0,.18)'; rr(c, x + 5, 25, cs, cs, 14); c.fill();
      c.fillStyle = v < 0 ? CELL_NONE : CELL[v]; rr(c, x, 18, cs, cs, 14); c.fill();
      c.fillStyle = 'rgba(255,255,255,.16)'; rr(c, x + 10, 26, cs - 20, 18, 8); c.fill();
    });
    c.fillStyle = '#5b5244'; c.font = '400 40px Typewriter, "Courier New", monospace';
    c.fillText(d.detail1, 0, 230); c.fillText(d.detail2, 0, 290);

    // série
    if (d.serie > 0) {
      icon(c, FLAME, -250, 345, 76, '#e39a2a', '#7a4a12');
      c.textAlign = 'left'; c.fillStyle = '#26211a'; c.font = '800 56px Shoulders, "Arial Narrow", sans-serif';
      c.fillText(d.serieText, -160, 386); c.textAlign = 'center';
    }
    // tampon
    c.save(); c.translate(200, 470); c.rotate(-12 * Math.PI / 180);
    c.font = '900 72px Stencil, Impact, sans-serif';
    const sw = c.measureText(d.stamp).width + 64;
    c.strokeStyle = 'rgba(184,50,42,.85)'; c.lineWidth = 7; rr(c, -sw / 2, -52, sw, 104, 10); c.stroke();
    c.fillStyle = 'rgba(184,50,42,.85)'; c.fillText(d.stamp, 0, 6);
    c.restore();
    c.restore();

    // lien
    c.fillStyle = '#ffb24a'; c.font = '700 44px Typewriter, "Courier New", monospace'; c.textAlign = 'center';
    c.fillText(URL_JEU, W / 2, 1810);
  }

  /** Données de la carte à partir de la partie terminée (game.ended.daily présent). */
  function cardData(g, T) {
    const e = g.ended, solved = e.won ? g.hints.length : g.stage, nh = g.hints.reduce((a, b) => a + b, 0);
    const I = self.FragI18n, word = (n, one, many) => I.tn(n, one, many);
    return {
      label: T('Dossier du jour'), tag: T('Dossier du jour #{0}', g.defi.n), title: g._sc.title, stars: e.stars,
      cells: levels(g.hints, solved),
      detail1: (e.won ? self.FragEngine.fmtTime(e.used) : T('hors temps')) + ' · ' + T('{0} joueurs', g.players),
      detail2: word(nh, '{0} indice', '{0} indices') + ' · ' + word(g.wrong, '{0} erreur', '{0} erreurs'),
      serie: e.daily.serie, serieText: word(e.daily.serie, 'Série : {0} jour', 'Série : {0} jours'),
      stamp: T(e.won ? 'CLOS' : 'HORS TEMPS')
    };
  }

  /** Bouton « Partager l'image » : dessine, partage ou télécharge, puis annonce le résultat. */
  async function run(g, T, status, toast) {
    if (!g || !g.ended || !g.ended.daily) return null;
    try {
      if (document.fonts && document.fonts.load) {
        await Promise.all(['900 100px Stencil', '700 40px Typewriter', '400 40px Typewriter', '800 50px Shoulders'].map((f) => document.fonts.load(f).catch(() => null)));
      }
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      draw(cv.getContext('2d'), cardData(g, T));
      const blob = await new Promise((res) => cv.toBlob(res, 'image/png'));
      if (!blob) throw new Error('canvas vide');
      const r = await deliver(blob, g.ended.share, fileName(g.defi.n), navigator, document);
      const msg = r === 'partage' ? T('Image partagée') : r === 'fichier' ? T('Image téléchargée') : '';
      if (status && msg) status.textContent = msg;
      if (r === 'fichier') toast(msg);
      return r;
    } catch (err) {
      toast(T('Image impossible à créer sur ce navigateur'));
      return null;
    }
  }

  return { W: W, H: H, CELL: CELL, levels: levels, fileName: fileName, deliver: deliver, cardData: cardData, draw: draw, run: run };
});

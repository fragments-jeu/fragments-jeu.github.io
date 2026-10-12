/* FRAGMENTS — rendu des fragments en « documents » (papier, télex, polaroid, plan, calque, billet, tarot, journal).
 * Toutes les figures sont dessinées en SVG à partir des données du scénario.
 */
(function (root) {
  'use strict';
  let GLYPHS = {};
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const inline = (s) => esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/\[\[(X+)\]\]/g, (m, x) => '<span class="redact" aria-label="texte caviardé">' + x.replace(/X/g, '█') + '</span>');
  const LAMP = { r: '#ff4b3a', v: '#52e06a', b: '#4aa8ff', a: '#ffb02e' };
  const LAMP_L = { r: 'R', v: 'V', b: 'B', a: 'A' };

  function glyph(name, x, y, size, extra) {
    const p = GLYPHS[name] || '';
    const k = size / 24;
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + k + ')"><path d="' + p + '" fill="none" stroke="currentColor" stroke-width="' + (1.7 / Math.max(k, .5) * k > 0 ? 1.8 : 1.8) + '" stroke-linecap="round" stroke-linejoin="round" ' + (extra || '') + '/></g>';
  }
  const svg = (w, h, body, label) => '<svg class="fig" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + esc(label || 'figure') + '">' + body + '</svg>';
  const T = (x, y, s, size, extra) => '<text x="' + x + '" y="' + y + '" font-size="' + size + '" fill="currentColor" text-anchor="middle" ' + (extra || '') + '>' + esc(s) + '</text>';

  const FIG = {
    keypad(b) {
      const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];
      let o = '<rect x="6" y="6" width="228" height="288" rx="14" fill="#2f322d" stroke="#555" />';
      keys.forEach((k, i) => {
        const x = 22 + (i % 3) * 70, y = 22 + Math.floor(i / 3) * 68;
        const worn = b.worn.indexOf(k) >= 0;
        o += '<rect x="' + x + '" y="' + y + '" width="58" height="54" rx="8" fill="' + (worn ? '#a39a86' : '#cfcbbf') + '" />';
        if (worn) o += '<ellipse cx="' + (x + 29) + '" cy="' + (y + 30) + '" rx="20" ry="15" fill="#6e6655" opacity=".55"/>';
        o += T(x + 29, y + 38, k, 26, 'font-family="Stencil" font-weight="900" fill="' + (worn ? '#4a4436' : '#2b2b28') + '" style="fill:' + (worn ? '#4a4436' : '#2b2b28') + '"');
      });
      return svg(240, 300, o, 'Clavier à codes : touches usées ' + b.worn.join(', '));
    },
    grid(b) {
      const cs = 44, gx = 30, gy = b.loco ? 54 : 28; // marge haute pour les étiquettes
      const W = gx + b.cols * cs + (b.north ? 34 : 12), H = gy + b.rows * cs + 12;
      let o = '';
      if (b.loco) o += '<path d="M' + (gx + b.cols * cs / 2 - 60) + ' 26h120l-10 -14M' + (gx + b.cols * cs / 2 + 60) + ' 26l-10 14" fill="none" stroke="currentColor" stroke-width="2"/>' + T(gx + b.cols * cs / 2, 18, 'LOCOMOTIVE', 13, 'letter-spacing="2" font-family="Typewriter"');
      if (b.north) o += '<g transform="translate(' + (W - 14) + ' 40)"><path d="M0 -10l5 12h-10z" fill="currentColor"/>' + T(0, 14, 'N', 11, 'font-family="Typewriter" font-weight="700"') + '</g>';
      for (let c = 0; c <= b.cols; c++) o += '<line x1="' + (gx + c * cs) + '" y1="' + gy + '" x2="' + (gx + c * cs) + '" y2="' + (gy + b.rows * cs) + '" stroke="currentColor" stroke-opacity="' + (c % b.cols === 0 ? .9 : .45) + '" stroke-width="' + (c % b.cols === 0 ? 2 : 1) + '"/>';
      for (let r = 0; r <= b.rows; r++) o += '<line x1="' + gx + '" y1="' + (gy + r * cs) + '" x2="' + (gx + b.cols * cs) + '" y2="' + (gy + r * cs) + '" stroke="currentColor" stroke-opacity="' + (r % b.rows === 0 ? .9 : .45) + '" stroke-width="' + (r % b.rows === 0 ? 2 : 1) + '"/>';
      if (b.colLabels) b.colLabels.forEach((l, c) => { o += T(gx + c * cs + cs / 2, gy - 8, l, 15, 'font-family="Typewriter" font-weight="700"'); });
      if (b.rowLabels) b.rowLabels.forEach((l, r) => { o += T(gx / 2, gy + r * cs + cs / 2 + 5, l, 15, 'font-family="Typewriter" font-weight="700"'); });
      if (b.cells) for (let r = 0; r < b.rows; r++) for (let c = 0; c < b.cols; c++) {
        const v = b.cells[r][c];
        if (v) o += '<circle cx="' + (gx + c * cs + cs / 2) + '" cy="' + (gy + r * cs + cs / 2) + '" r="14" fill="none" stroke="currentColor" stroke-opacity=".5"/>' + T(gx + c * cs + cs / 2, gy + r * cs + cs / 2 + 7, v, 20, 'font-family="Stencil" font-weight="900"');
      }
      (b.marks || []).forEach((m) => {
        const x = gx + m.c * cs + cs / 2, y = gy + m.r * cs + cs / 2;
        if (m.k === 'dot') o += '<circle cx="' + x + '" cy="' + y + '" r="15" fill="none" stroke="#b8322a" stroke-width="3"/><circle cx="' + x + '" cy="' + y + '" r="5" fill="#b8322a"/>';
        else if (m.k === 'cross') o += '<path d="M' + (x - 12) + ' ' + (y - 12) + 'l24 24M' + (x + 12) + ' ' + (y - 12) + 'l-24 24" stroke="#26211a" stroke-width="3.5" stroke-linecap="round"/>';
        else if (m.k === 'scratch') o += '<path d="M' + (x - 16) + ' ' + (y - 8) + 'l30 6M' + (x - 14) + ' ' + (y + 1) + 'l28 7M' + (x - 10) + ' ' + (y + 9) + 'l22 4" stroke="currentColor" stroke-width="1.6" stroke-opacity=".8"/>';
      });
      return svg(W, H, o, 'Plan quadrillé');
    },
    dials(b) {
      const n = b.dials.length, w = 92;
      let o = '';
      b.dials.forEach((d, i) => {
        const cx = 46 + i * w, cy = 58;
        o += '<circle cx="' + cx + '" cy="' + cy + '" r="38" fill="#e9e3d0" stroke="#2c2c28" stroke-width="4"/>';
        for (let k = 0; k <= b.max; k++) {
          const a = (-225 + (270 * k) / b.max) * Math.PI / 180;
          o += '<line x1="' + (cx + Math.cos(a) * 30) + '" y1="' + (cy + Math.sin(a) * 30) + '" x2="' + (cx + Math.cos(a) * 35) + '" y2="' + (cy + Math.sin(a) * 35) + '" stroke="#2c2c28" stroke-width="2"/>';
          o += '<text x="' + (cx + Math.cos(a) * 22) + '" y="' + (cy + Math.sin(a) * 22 + 3.5) + '" font-size="9" text-anchor="middle" fill="#2c2c28" font-family="Typewriter" font-weight="700">' + k + '</text>';
        }
        if (d.value != null) {
          const a = (-225 + (270 * d.value) / b.max) * Math.PI / 180;
          o += '<line x1="' + cx + '" y1="' + cy + '" x2="' + (cx + Math.cos(a) * 30) + '" y2="' + (cy + Math.sin(a) * 30) + '" stroke="#b8322a" stroke-width="3" stroke-linecap="round"/>';
        } else {
          o += T(cx, cy + 6, '?', 18, 'font-family="Stencil" font-weight="900" style="fill:#b8322a"');
        }
        o += '<circle cx="' + cx + '" cy="' + cy + '" r="4" fill="#2c2c28"/>';
        if (d.color) o += '<circle cx="' + cx + '" cy="' + (cy + 52) + '" r="6" fill="' + LAMP[d.color] + '"/>';
        o += T(cx, cy + 74, d.label, 12, 'font-family="Typewriter" font-weight="700" letter-spacing="1"');
      });
      return svg(n * w, 140, o, 'Cadrans');
    },
    glyphs(b) {
      const per = Math.min(b.seq.length, 5), rows = Math.ceil(b.seq.length / per), s = 56;
      let o = '';
      b.seq.forEach((g, i) => {
        const x = 6 + (i % per) * (s + 8), y = 6 + Math.floor(i / per) * (s + 22);
        o += '<rect x="' + x + '" y="' + y + '" width="' + s + '" height="' + s + '" fill="none" stroke="currentColor" stroke-opacity=".35" stroke-dasharray="3 3"/>';
        if (g) o += glyph(g, x + 10, y + 10, 36);
        else o += '<path d="M' + (x + 12) + ' ' + (y + 30) + 'q4-18 18-16q14-6 16 10q8 12-6 18q-14 8-22-2q-10-2-6-10z" fill="#2a2418" opacity=".85"/>';
        o += T(x + s / 2, y + s + 16, String(i + 1), 12, 'font-family="Typewriter" fill-opacity=".6"');
      });
      return svg(12 + per * (s + 8), 6 + rows * (s + 22), o, 'Message en symboles');
    },
    key(b) {
      let o = '';
      const cols = 2, cw = 130, rh = 56;
      b.pairs.forEach(([g, l], i) => {
        const x = 4 + (i % cols) * cw, y = 4 + Math.floor(i / cols) * rh;
        o += '<rect x="' + x + '" y="' + y + '" width="' + (cw - 8) + '" height="' + (rh - 8) + '" rx="3" fill="none" stroke="currentColor" stroke-opacity=".4"/>';
        o += glyph(g, x + 10, y + 8, 32);
        o += '<text x="' + (x + 58) + '" y="' + (y + 34) + '" font-size="14" fill="currentColor" font-family="Typewriter">=</text>';
        o += T(x + 92, y + 37, l, 30, 'font-family="Stencil" font-weight="900"');
      });
      return svg(cols * cw, Math.ceil(b.pairs.length / cols) * rh + 4, o, 'Table de correspondance symboles / lettres');
    },
    lamps(b) {
      let o = '';
      const cw = 52, rh = 62;
      b.rows.forEach((row, r) => row.forEach((l, c) => {
        const x = 30 + c * cw, y = 30 + r * rh;
        o += '<circle cx="' + x + '" cy="' + y + '" r="17" fill="#0f1a26" stroke="#cfe3f2" stroke-opacity=".5"/>';
        if (l.on) o += '<circle cx="' + x + '" cy="' + y + '" r="12" fill="' + LAMP[l.c] + '"/><circle cx="' + x + '" cy="' + y + '" r="16" fill="' + LAMP[l.c] + '" opacity=".25"/><circle cx="' + (x - 4) + '" cy="' + (y - 4) + '" r="3" fill="#fff" opacity=".7"/>';
        else o += '<circle cx="' + x + '" cy="' + y + '" r="12" fill="' + LAMP[l.c] + '" opacity=".14"/>';
        if (l.ring) o += '<circle cx="' + x + '" cy="' + y + '" r="23" fill="none" stroke="#fff" stroke-width="2.5" stroke-dasharray="5 3"/>';
        o += T(x, y + 36, LAMP_L[l.c] + (l.on ? '' : ' ·'), 11, 'font-family="Typewriter" font-weight="700" fill-opacity="' + (l.on ? .9 : .45) + '"');
      }));
      return svg(5 * cw + 8, b.rows.length * rh + 6, o, 'Pupitre de voyants (lettres : R rouge, V vert, B bleu, A ambre ; point : éteint)');
    },
    ticketstub(b) {
      return '<div class="stub" style="display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px;margin:6px 0 12px;font-family:var(--f-stencil);font-weight:900;text-align:center">' +
        '<div><div style="font:13px var(--f-type)">DÉPART</div><div style="font-size:40px;letter-spacing:.06em">' + esc(b.from) + '</div></div>' +
        '<div style="font-size:26px">→</div>' +
        '<div><div style="font:13px var(--f-type)">ARRIVÉE</div><div style="font-size:40px;letter-spacing:.06em">' + esc(b.to) + '</div></div>' +
        '<div style="grid-column:1/-1;display:flex;justify-content:space-around;border-top:1px dashed #a2874d;padding-top:8px;font:700 15px var(--f-type)">' +
        '<span>Classe ' + esc(b.cls) + '</span><span>Voiture ' + esc(b.car) + '</span><span>Place ' + esc(b.seat) + '</span></div></div>';
    },
    carriage(b) {
      let o = '<path d="M14 40l-10 10l10 10" fill="none" stroke="currentColor" stroke-width="2"/>' + T(46, 30, 'LOCO', 11, 'font-family="Typewriter"');
      o += '<rect x="24" y="16" width="' + (b.n * 56 + 8) + '" height="70" rx="8" fill="none" stroke="currentColor" stroke-width="2"/>';
      for (let i = 0; i < b.n; i++) {
        const x = 28 + i * 56;
        o += '<rect x="' + x + '" y="20" width="52" height="44" fill="none" stroke="currentColor" stroke-opacity=".7"/>' + T(x + 26, 50, String(i + 1), 22, 'font-family="Stencil" font-weight="900"');
      }
      o += '<line x1="28" y1="76" x2="' + (28 + b.n * 56) + '" y2="76" stroke="currentColor" stroke-dasharray="4 4"/>' + T(28 + b.n * 28, 100, 'couloir', 12, 'font-family="Typewriter"');
      return svg(b.n * 56 + 40, 106, o, 'Plan de la voiture : compartiments 1 à ' + b.n + ' depuis la locomotive');
    },
    train(b) {
      const cw = 30;
      const loco = b.loco !== false, x0 = loco ? 72 : 8;
      let o = '<g fill="none" stroke="currentColor" stroke-width="1.8">';
      if (loco) o += '<path d="M8 70v-34h22v-14h14v14h12l10 16v18z"/><circle cx="22" cy="76" r="6"/><circle cx="52" cy="76" r="6"/><path d="M30 14q6-10 16-6"/>';
      for (let i = 0; i < b.cars; i++) {
        const x = x0 + i * (cw + 6);
        o += '<rect x="' + x + '" y="38" width="' + cw + '" height="32" rx="3"/><rect x="' + (x + 5) + '" y="44" width="' + (cw - 10) + '" height="9"/><circle cx="' + (x + 8) + '" cy="76" r="5"/><circle cx="' + (x + cw - 8) + '" cy="76" r="5"/>';
        o += '<line x1="' + (x - 6) + '" y1="62" x2="' + x + '" y2="62"/>';
      }
      const W = x0 + 8 + b.cars * (cw + 6) + (loco ? 0 : 16);
      if (!loco) o += '<circle cx="' + (W - 14) + '" cy="50" r="4" fill="#ff4b3a" stroke="none"/>';
      o += '<line x1="0" y1="84" x2="' + W + '" y2="84" stroke-opacity=".5"/></g>';
      return svg(W, 92, o, loco ? 'Photo : locomotive et ' + b.cars + ' voitures' : 'Photo : ' + b.cars + ' voitures et le feu de queue');
    },
    strip(b) {
      return '<div class="strip">' + b.text.split('').map((c) => '<span>' + esc(c) + '</span>').join('') + '</div>';
    },
    bigtext(b) { return '<div class="bigtext">' + esc(b.text) + '</div>'; },
    clock(b) {
      let o = '<circle cx="100" cy="100" r="86" fill="#efe9d6" stroke="#b49a5c" stroke-width="8"/>';
      for (let i = 1; i <= 12; i++) {
        const a = (i * 30 - 90) * Math.PI / 180;
        o += '<text x="' + (100 + Math.cos(a) * 64) + '" y="' + (100 + Math.sin(a) * 64 + 6) + '" font-size="17" text-anchor="middle" fill="#2c2c28" font-family="Stencil" font-weight="900">' + ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][i] + '</text>';
      }
      for (let i = 0; i < 60; i++) {
        const a = i * 6 * Math.PI / 180;
        o += '<line x1="' + (100 + Math.cos(a) * 78) + '" y1="' + (100 + Math.sin(a) * 78) + '" x2="' + (100 + Math.cos(a) * (i % 5 ? 75 : 72)) + '" y2="' + (100 + Math.sin(a) * (i % 5 ? 75 : 72)) + '" stroke="#2c2c28" stroke-width="' + (i % 5 ? 1 : 2) + '"/>';
      }
      const ha = ((b.h % 12) * 30 + b.m * 0.5 - 90) * Math.PI / 180, ma = (b.m * 6 - 90) * Math.PI / 180;
      o += '<line x1="100" y1="100" x2="' + (100 + Math.cos(ha) * 40) + '" y2="' + (100 + Math.sin(ha) * 40) + '" stroke="#1d1d1a" stroke-width="6" stroke-linecap="round"/>';
      o += '<line x1="100" y1="100" x2="' + (100 + Math.cos(ma) * 62) + '" y2="' + (100 + Math.sin(ma) * 62) + '" stroke="#1d1d1a" stroke-width="3.5" stroke-linecap="round"/><circle cx="100" cy="100" r="5" fill="#1d1d1a"/>';
      o += '<path d="M60 40l30 46l-6 22l28 30M90 86l34-20M84 108l-40 18" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="1.3"/>';
      o += '<text x="100" y="140" font-size="10" text-anchor="middle" fill="#6b5a32" font-family="Typewriter">SOIR</text>';
      return svg(200, 200, o, 'Montre arrêtée');
    },
    seats(b) {
      let o = '<circle cx="130" cy="130" r="74" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="130" cy="130" r="66" fill="none" stroke="currentColor" stroke-opacity=".3"/>';
      o += '<g opacity=".25">' + glyph('etoile', 112, 112, 36) + '</g>';
      b.items.forEach((it) => {
        const a = (it.angle - 90) * Math.PI / 180, x = 130 + Math.cos(a) * 100, y = 130 + Math.sin(a) * 100;
        o += '<circle cx="' + x + '" cy="' + y + '" r="23" fill="none" stroke="currentColor" stroke-width="2"/>' + glyph(it.g, x - 15, y - 15, 30);
      });
      const da = (b.door - 90) * Math.PI / 180, dx = 130 + Math.cos(da) * 124, dy = 130 + Math.sin(da) * 124;
      o += '<g transform="translate(' + dx + ' ' + dy + ') rotate(' + b.door + ')"><rect x="-24" y="-6" width="48" height="12" fill="#b8322a"/><path d="M-24 6a48 48 0 0 1 48 0" fill="none" stroke="#b8322a" stroke-dasharray="3 3"/></g>';
      o += '<text x="' + (130 + Math.cos(da) * 104) + '" y="' + (130 + Math.sin(da) * 104 + 5) + '" font-size="13" text-anchor="middle" fill="#b8322a" font-family="Typewriter" font-weight="700">porte</text>';
      return svg(260, 260, o, 'Plan de la table de séance');
    },
    tarot(b) {
      return '<div class="tarot-card"><div class="num">' + esc(b.numeral) + '</div><svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + (GLYPHS[b.g] || '') + '" fill="none" stroke="#ecd9a4" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/></svg><div class="name">' + esc(b.name) + '</div></div>';
    },
    shelf(b) {
      const COL = { rouge: '#a3241c', bleu: '#27407a', vert: '#2f5f3c', noir: '#1a1a1a' };
      let x = 8, o = '';
      const ws = b.books.map((_, i) => 34 + ((i * 7) % 4) * 3);
      const W = ws.reduce((a, c) => a + c + 3, 0) + 16;
      o += '<rect x="0" y="176" width="' + W + '" height="12" fill="#5a3c22"/>';
      b.books.forEach((bk, i) => {
        const h = 128 + ((i * 13) % 5) * 9, w = ws[i];
        o += '<rect x="' + x + '" y="' + (176 - h) + '" width="' + w + '" height="' + h + '" rx="2" fill="' + COL[bk.color] + '"/>';
        o += '<rect x="' + x + '" y="' + (176 - h + 12) + '" width="' + w + '" height="3" fill="#c9a958" opacity=".7"/>';
        o += '<rect x="' + (x + 4) + '" y="' + (176 - h / 2 - 16) + '" width="' + (w - 8) + '" height="32" fill="#efe4c9"/>';
        o += '<text x="' + (x + w / 2) + '" y="' + (176 - h / 2 + 6) + '" font-size="14" text-anchor="middle" fill="#2b2418" font-family="Typewriter" font-weight="700" transform="rotate(-90 ' + (x + w / 2) + ' ' + (176 - h / 2) + ')">' + bk.num + '</text>';
        x += w + 3;
      });
      return svg(W, 192, o, 'Étagère : ' + b.books.map((bk) => bk.color + ' ' + bk.num).join(', '));
    },
    candles(b) {
      const from = b.from || 0, W = 20 + b.lit.length * 43;
      let o = '<rect x="6" y="150" width="' + (W - 12) + '" height="10" rx="5" fill="#b49a5c"/>';
      b.lit.forEach((l, j) => {
        const i = from + j, x = 30 + j * 43;
        o += '<rect x="' + (x - 9) + '" y="70" width="18" height="80" rx="2" fill="#e9e1c8"/><path d="M' + (x - 9) + ' 74q4 8 0 18" stroke="#cfc4a3" fill="none"/>';
        o += '<line x1="' + x + '" y1="70" x2="' + x + '" y2="62" stroke="#222" stroke-width="2"/>';
        if (l) o += '<circle cx="' + x + '" cy="44" r="22" fill="#ffcf6a" opacity=".22"/><path d="M' + x + ' 30q10 16 0 30q-10-14 0-30z" fill="#ffc044"/><path d="M' + x + ' 42q4 8 0 16q-4-8 0-16z" fill="#fff6d0"/>';
        else o += '<path d="M' + x + ' 60q-6-10 2-20q-6 8 1 16" fill="none" stroke="#999" stroke-opacity=".6"/>';
        o += T(x, 180, String(i + 1), 15, 'font-family="Stencil" font-weight="900"');
      });
      return svg(Math.max(W, 180), 190, o, 'Chandelier, bougies ' + (from + 1) + ' à ' + (from + b.lit.length) + ' ; allumées : ' + (b.lit.map((l, j) => (l ? from + j + 1 : '')).filter(Boolean).join(', ') || 'aucune'));
    },
    letters(b) {
      const cs = 44;
      let o = '';
      b.rows.forEach((row, r) => row.forEach((L, c) => {
        o += '<rect x="' + (30 + c * cs) + '" y="' + (6 + r * cs) + '" width="' + cs + '" height="' + cs + '" fill="none" stroke="currentColor" stroke-opacity=".25"/>';
        o += T(30 + c * cs + cs / 2, 6 + r * cs + 31, L, 26, 'font-family="Typewriter" font-weight="700"');
      }));
      b.rows.forEach((_, r) => { o += T(14, 6 + r * cs + 28, String(b.startRow + r + 1), 12, 'font-family="Typewriter" fill-opacity=".55"'); });
      const tear = (y) => '<path d="M0 ' + y + ' l20 5l18 -4l22 6l25 -5l20 4l30 -6l25 5l30 -3" fill="none" stroke="currentColor" stroke-opacity=".5" stroke-dasharray="2 3"/>';
      if (b.startRow > 0) o += tear(3);
      if (b.startRow + b.rows.length < (b.total || 5)) o += tear(8 + b.rows.length * cs);
      return svg(30 + 5 * cs + 10, 12 + b.rows.length * cs + 8, o, 'Lettres du grimoire, lignes ' + (b.startRow + 1) + ' à ' + (b.startRow + b.rows.length));
    },
    mask(b) {
      const cs = 44;
      const nr = b.cells.length, st = b.startRow || 0;
      let o = '<rect x="26" y="2" width="' + (5 * cs + 8) + '" height="' + (nr * cs + 8) + '" rx="6" fill="#b08d47" stroke="#6f5524" stroke-width="2"/>';
      for (let i = 0; i < 4; i++) o += '<circle cx="' + (34 + (i % 2) * (5 * cs - 8)) + '" cy="' + (10 + Math.floor(i / 2) * (nr * cs - 8)) + '" r="3" fill="#6f5524"/>';
      for (let r = 0; r < nr; r++) o += T(12, 6 + r * cs + 28, String(st + r + 1), 12, 'font-family="Typewriter" fill-opacity=".6"');
      b.cells.forEach((row, r) => row.forEach((h, c) => {
        if (h) o += '<rect x="' + (30 + c * cs + 8) + '" y="' + (6 + r * cs + 8) + '" width="' + (cs - 16) + '" height="' + (cs - 16) + '" rx="2" fill="#0b1f33" stroke="#4c3812" stroke-width="2"/>';
      }));
      return svg(30 + 5 * cs + 10, nr * cs + 14, o, 'Grille de laiton, rangées ' + (st + 1) + ' à ' + (st + nr) + ', ' + b.cells.flat().filter(Boolean).length + ' trous');
    },
    inkletter(b) { return '<div class="inkletter"><span>' + esc(b.letter) + '</span></div>'; }
  };

  function blockHtml(b) {
    switch (b.t) {
      case 'p': return '<p>' + inline(b.text) + '</p>';
      case 'h': return '<h4>' + inline(b.text) + '</h4>';
      case 'sign': return '<div class="sign">' + esc(b.text) + '</div>';
      case 'stamp': return '<div class="stamp">' + esc(b.text) + '</div>';
      case 'list': return '<ul>' + b.items.map((i) => '<li>' + inline(i) + '</li>').join('') + '</ul>';
      case 'table': return '<table><thead><tr>' + b.head.map((h) => '<th>' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' +
        b.rows.map((r) => '<tr>' + r.map((c) => '<td>' + inline(c) + '</td>').join('') + '</tr>').join('') + '</tbody></table>';
      default: return FIG[b.t] ? FIG[b.t](b) : '';
    }
  }

  function docHtml(f, extraRef) {
    let body = '';
    let figDone = false;
    f.blocks.forEach((b) => {
      const h = blockHtml(b);
      if (f.style === 'polaroid' && !figDone && FIG[b.t]) { body += '<div class="photo">' + h + '</div><div class="dtitle">' + esc(f.title) + '</div>'; figDone = true; }
      else body += h;
    });
    const head = '<div class="dref">' + esc(f.ref) + (extraRef ? ' — ' + esc(extraRef) : '') + '</div>' + (f.style === 'polaroid' && figDone ? '' : '<div class="dtitle">' + esc(f.title) + '</div>');
    return '<article class="doc ' + esc(f.style) + '" data-style="' + esc(f.style) + '" data-title="' + esc(f.title) + '">' + head + body + '</article>';
  }

  root.FragDocs = { setGlyphs: (g) => { GLYPHS = g; }, docHtml, blockHtml, esc, inline, glyphPath: (n) => GLYPHS[n] || '' };
})(typeof self !== 'undefined' ? self : this);

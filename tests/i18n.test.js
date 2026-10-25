// Tests de l'anglais (lot 7) : scénarios anglais = scénarios français à l'identique sauf les textes, dictionnaire complet.
// Lancer depuis la racine du dépôt : node --test   (FRAG_CLES=1 node tests/i18n.test.js : liste les textes sans anglais)
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const E = require('../js/engine.js');
const I = require('../js/i18n.js');

const racine = path.join(__dirname, '..');
const lire = (p) => JSON.parse(fs.readFileSync(path.join(racine, p), 'utf8'));
const STRINGS = lire('i18n/strings.json');
const EN = STRINGS.en;

// Clés dont la valeur est du texte traduisible (tout le reste doit être identique au caractère près).
const TEXTE = new Set(['title', 'tagline', 'duration', 'intro', 'ending', 'failEnding', 'name', 'label', 'flavor', 'prompt', 'hints', 'solution',
  'atomTitles', 'herringTitles', 'ref', 'text', 'head', 'rows', 'items']);
const nombres = (s) => (s.match(/\d+/g) || []).map(Number).sort((a, b) => a - b).join(',');
const sansAccent = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();

/** Compare fr et en ; renvoie la liste des écarts (chemin + raison). */
function ecarts(fr, en, chemin, cle, parent, out) {
  if (typeof fr !== typeof en || Array.isArray(fr) !== Array.isArray(en)) { out.push(chemin + ' : type différent'); return out; }
  if (Array.isArray(fr)) {
    if (fr.length !== en.length) out.push(chemin + ' : longueur ' + fr.length + ' ≠ ' + en.length);
    else fr.forEach((x, i) => ecarts(x, en[i], chemin + '[' + i + ']', cle, parent, out));
  } else if (fr && typeof fr === 'object') {
    const kf = Object.keys(fr).join(), ke = Object.keys(en).join();
    if (kf !== ke) out.push(chemin + ' : clés ' + kf + ' ≠ ' + ke);
    else for (const k of Object.keys(fr)) ecarts(fr[k], en[k], chemin + '.' + k, /^\d+$/.test(k) ? cle : k, fr, out);
  } else if (typeof fr === 'string') {
    const verrou = !TEXTE.has(cle) || (cle === 'text' && parent && (parent.t === 'bigtext' || parent.t === 'strip')) ||
      ((cle === 'rows' || cle === 'items') && /^[A-Z0-9 .-]+$/.test(fr)) || !/[A-Za-zÀ-ÿ]/.test(fr);
    if (verrou) { if (fr !== en) out.push(chemin + ' : doit rester « ' + fr + ' » (trouvé « ' + en + ' »)'); }
    else {
      if (!en.trim()) out.push(chemin + ' : texte vide');
      if (nombres(fr) !== nombres(en)) out.push(chemin + ' : nombres différents « ' + fr + ' » / « ' + en + ' »');
      if ((fr.match(/\*\*/g) || []).length !== (en.match(/\*\*/g) || []).length) out.push(chemin + ' : marques ** différentes');
      if ((fr.match(/\[\[X+\]\]/g) || []).join() !== (en.match(/\[\[X+\]\]/g) || []).join()) out.push(chemin + ' : caviardage différent');
    }
  } else if (fr !== en) out.push(chemin + ' : ' + fr + ' ≠ ' + en);
  return out;
}

const INDEX_FR = lire('data/index.json'), INDEX_EN = lire('i18n/scenarios/en/index.json');

test('index anglais : mêmes scénarios, mêmes préfixes, mêmes symboles', () => {
  assert.deepEqual(ecarts(INDEX_FR, INDEX_EN, 'index', '', null, []), []);
  assert.notEqual(INDEX_EN.scenarios[0].title, INDEX_FR.scenarios[0].title, 'titres traduits');
});

for (const s of INDEX_FR.scenarios) {
  test('scénario ' + s.id + ' : structure, réponses, mots et nombres identiques en anglais', () => {
    const fr = lire('data/' + s.file), en = lire('i18n/scenarios/en/' + s.file);
    assert.deepEqual(ecarts(fr, en, s.id, '', null, []), []);
    assert.deepEqual(en.words, fr.words, 'mots de passage identiques');
    fr.stages.forEach((st, i) => assert.deepEqual(en.stages[i].variants.map((v) => v.answer), st.variants.map((v) => v.answer)));
    assert.notEqual(en.intro[0], fr.intro[0], 'textes traduits');
  });
  test('scénario ' + s.id + ' : une partie FR et une partie EN sont la même partie', () => {
    const fr = lire('data/' + s.file), en = lire('i18n/scenarios/en/' + s.file);
    for (const n of [3, 4, 5, 6]) for (const seed of [0, 1, 777, 19429, 32767]) {
      const a = E.setupGame(fr, n, seed), b = E.setupGame(en, n, seed);
      assert.deepEqual(b, a);
      assert.equal(E.encodeCode(en.prefix, n, seed), E.encodeCode(fr.prefix, n, seed));
    }
  });
}

test('bibliothèque du manoir : les titres anglais gardent l\'initiale (réponse = initiales des livres rouges)', () => {
  const fr = lire('data/manoir.json'), en = lire('i18n/scenarios/en/manoir.json');
  const v2f = fr.stages.find((x) => x.id === 'v2'), v2e = en.stages.find((x) => x.id === 'v2');
  let n = 0;
  v2f.variants.forEach((v, vi) => Object.keys(v.layouts).forEach((p) => v.layouts[p].items.forEach((it, ii) => it.docs.forEach((d, di) => d.blocks.forEach((b, bi) => {
    if (b.t !== 'table') return;
    b.rows.forEach((r, ri) => r.forEach((c, ci) => {
      if (!/[a-z]/.test(c)) return;
      const e = v2e.variants[vi].layouts[p].items[ii].docs[di].blocks[bi].rows[ri][ci];
      assert.equal(sansAccent(e)[0], sansAccent(c)[0], c + ' → ' + e); n++;
    }));
  })))));
  assert.ok(n > 20);
});

// ---------- dictionnaire de l'interface ----------
/** Textes français passés à T( / tr( / TN( / word( / count(tr, …) dans le code : littéraux entre quotes, appels imbriqués compris. */
function clesDuCode(src) {
  const out = new Set();
  const re = /\b(?:T|TN|tr|word)\(|\bcount\(tr,/g;
  let m;
  while ((m = re.exec(src))) {
    let i = m.index + m[0].length, prof = 1;
    while (i < src.length && prof > 0) {
      const ch = src[i];
      if (ch === "'") {
        let j = i + 1, lit = '';
        while (src[j] !== "'") { if (src[j] === '\\') { lit += src[j + 1]; j += 2; } else lit += src[j++]; }
        if (/[A-Za-zÀ-ÿ]{2,}/.test(lit) && !/[="]/.test(lit) && !/^(partage|copie|manuel|fichier|en|fr)$/.test(lit)) out.add(lit);
        i = j + 1; continue;
      }
      if (ch === '(') prof++;
      else if (ch === ')') prof--;
      i++;
    }
  }
  return out;
}
const SOURCES = ['app.js', 'docs.js', 'engine.js', 'autres-jeux.js', 'howto.js', 'share-image.js'];
function manquantes() {
  const cles = new Set();
  for (const f of SOURCES) clesDuCode(fs.readFileSync(path.join(racine, 'js', f), 'utf8')).forEach((k) => cles.add(k));
  ['bleu', 'vert', 'rouge', 'noir'].forEach((k) => cles.add(k)); // couleurs des livres (tr(bk.color) dans docs.js)
  require('../js/autres-jeux.js').JEUX.forEach((j) => cles.add(j.texte));
  return [...cles].filter((k) => typeof EN[k] !== 'string' || !EN[k].trim());
}
if (process.env.FRAG_CLES) { console.log(JSON.stringify(manquantes(), null, 1)); }

test('chaque texte de l\'interface a sa traduction anglaise', () => {
  assert.deepEqual(manquantes(), []);
});

test('mêmes paramètres {0} {1} dans le texte anglais', () => {
  for (const [fr, en] of Object.entries(EN)) {
    const p = (s) => (s.match(/\{\d\}/g) || []).sort().join();
    assert.equal(p(en), p(fr), fr);
  }
});

test('i18n : langue détectée, choix mémorisé prioritaire, repli français, pluriels', () => {
  assert.equal(I.detect(null, { languages: ['fr-FR'] }), 'fr');
  assert.equal(I.detect(null, { language: 'fr-CA' }), 'fr');
  assert.equal(I.detect(null, { languages: ['en-US'] }), 'en');
  assert.equal(I.detect(null, { language: 'de-DE' }), 'en');
  assert.equal(I.detect('fr', { languages: ['en-US'] }), 'fr');
  assert.equal(I.detect('en', { languages: ['fr-FR'] }), 'en');
  assert.equal(I.detect('xx', {}), 'en');
  I.init(STRINGS, { languages: ['en-GB'] });
  assert.equal(I.lang, 'en');
  assert.equal(I.scenarioDir(), 'i18n/scenarios/en/');
  assert.equal(I.t('Énigme {0} sur {1}', 2, 5), 'Puzzle 2 of 5');
  assert.equal(I.t('texte jamais traduit {0}', 7), 'texte jamais traduit 7');
  assert.equal(I.tn(0, '{0} jour', '{0} jours'), '0 days');
  assert.equal(I.tn(1, '{0} jour', '{0} jours'), '1 day');
  I.init(STRINGS, { languages: ['fr-FR'] });
  assert.equal(I.scenarioDir(), 'data/');
  assert.equal(I.tn(0, '{0} jour', '{0} jours'), '0 jour');
  assert.equal(I.tn(2, '{0} jour', '{0} jours'), '2 jours');
});

test('textes partagés en anglais (le français reste celui des vecteurs de parité)', () => {
  I.init(STRINGS, { languages: ['en'] });
  const T = I.t;
  assert.equal(E.shareText('The Bunker', 2, 2292, 2, false, T), 'FRAGMENTS — The Bunker ⭐⭐ in 38:12, 2 hints');
  assert.equal(E.shareText('The Bunker', 0, 2700, 0, true, T), 'FRAGMENTS — The Bunker ☆ out of time, no hints');
  assert.equal(E.shareText('Le Bunker', 2, 2292, 1, false), 'FRAGMENTS — Le Bunker ⭐⭐ en 38:12, 1 indice');
  const d = { n: 24, title: 'The Night Train', stars: 2, used: 2292, hints: [0, 1, 0, 3, 2], solved: 4, wrong: 1, players: 4, timedOut: false, serie: 2 };
  const a = E.shareDaily(d, T);
  assert.equal(a.detail, '38:12 · 6 hints · 1 mistake · 4 players');
  assert.equal(a.libelleSerie, '{0} days in a row');
  assert.equal(E.shareDaily(d).libelleSerie, '{0} jours de suite');
  I.init(STRINGS, { languages: ['fr'] });
});

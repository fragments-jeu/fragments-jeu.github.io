// Tests du « Dossier du jour » propre à Fragments (moteur pur, sans lire data/).
// Lancer depuis la racine du dépôt : node --test
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('../js/engine.js');
const Defi = require('../js/defi.js');

// Faux index de 3 scénarios, volontairement dans le désordre (le tri par id doit l'ignorer).
const FAUX = [{ id: 'cc', prefix: 'CCC' }, { id: 'aa', prefix: 'AAA' }, { id: 'bb', prefix: 'BBB' }];

test('scénario et graine du 24/10/2026', () => {
  const t = Defi.today(Date.parse('2026-10-24T10:00:00Z'));
  const p = E.dailyPick(FAUX, Defi.seed('fragments', t.key));
  assert.equal(p.scenario.id, 'bb', 'index 1 des scénarios triés par id');
  assert.equal(p.seed, 19429);
  assert.deepEqual(E.dailyPick(FAUX.slice().reverse(), Defi.seed('fragments', t.key)), p, 'ordre du fichier sans effet');
});

test('même dossier toute la journée de Paris, nouveau dossier à minuit de Paris', () => {
  const pick = (iso) => E.dailyPick(FAUX, Defi.seed('fragments', Defi.today(Date.parse(iso)).key));
  assert.deepEqual(pick('2026-10-23T22:00:00Z'), pick('2026-10-24T21:59:59Z'));
  assert.equal(Defi.today(Date.parse('2026-10-24T21:59:59Z')).key, '2026-10-24');
  assert.equal(Defi.today(Date.parse('2026-10-24T22:00:00Z')).key, '2026-10-25');
  assert.notEqual(pick('2026-10-24T21:59:59Z').seed, pick('2026-10-24T22:00:00Z').seed);
});

test('le code du jour est un code normal', () => {
  const p = E.dailyPick(FAUX, Defi.seed('fragments', '2026-10-24'));
  for (const n of [3, 4, 5, 6]) {
    const code = E.encodeCode(p.scenario.prefix, n, p.seed);
    const d = E.decodeCode(code);
    assert.deepEqual([d.prefix, d.players, d.seed, d.code], [p.scenario.prefix, n, p.seed, code]);
  }
});

const base = { n: 24, title: 'Le Train de Nuit', stars: 2, used: 38 * 60 + 12, hints: [0, 1, 0, 3, 2], solved: 4, wrong: 1, players: 4, timedOut: false, serie: 2 };

test('shareDaily : cases par énigme et détail', () => {
  const a = E.shareDaily(base);
  assert.deepEqual(a.lignes, ['🟩🟨🟩🟥⬛']);
  assert.equal(a.detail, '38:12 · 6 indices · 1 erreur · 4 joueurs');
  assert.equal(E.shareDaily({ ...base, hints: [0, 2, 0, 0, 0], solved: 5 }).lignes[0], '🟩🟧🟩🟩🟩');
  const t = Defi.shareText(a).split('\n');
  assert.equal(t[0], 'FRAGMENTS #24 🗂️ Le Train de Nuit ⭐⭐');
  assert.equal(t[3], '🔥 2 jours de suite');
  assert.equal(t[t.length - 1], 'https://fragments-jeu.github.io/');
  const h = Defi.shareText(E.shareDaily({ ...base, stars: 0, timedOut: true, hints: [0, 0, 0, 0, 0], wrong: 0, serie: 1 }));
  assert.ok(h.includes('☆') && h.includes('hors temps · sans indice · sans erreur'));
  assert.ok(!h.includes('🔥'));
});

test('abandon : pas de texte du jour, rien d\'enregistré', () => {
  assert.equal(E.shareDaily({ ...base, abandon: true }), null);
});

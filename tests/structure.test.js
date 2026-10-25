// Structure des fichiers statiques (lot 18) : tout ce que charge index.html existe et est mis en cache par sw.js.
// Lancer depuis la racine du dépôt : node --test tests/*.test.js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const racine = path.join(__dirname, '..');
const lire = (f) => fs.readFileSync(path.join(racine, f), 'utf8');
const html = lire('index.html');
const sw = lire('sw.js');
const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);
const feuilles = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)].map((m) => m[1]);
const cache = [...sw.match(/const ASSETS = \[([\s\S]*?)\];/)[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);

test('index.html : chaque script et chaque feuille existe et est dans le cache de sw.js', () => {
  assert.equal(scripts[0], 'js/defi.js');
  assert.equal(scripts[scripts.length - 1], 'js/app.js', 'app.js (démarrage) doit rester le dernier script');
  for (const f of scripts.concat(feuilles)) {
    assert.ok(fs.existsSync(path.join(racine, f)), f + ' introuvable');
    assert.ok(cache.includes(f), f + ' absent du cache de sw.js');
  }
  assert.equal(feuilles[feuilles.length - 1], 'css/extras.css');
});

test('sw.js : tous les fichiers js/ et css/ mis en cache existent et sont chargés par index.html', () => {
  for (const f of cache.filter((c) => /^(js|css)\//.test(c))) {
    assert.ok(fs.existsSync(path.join(racine, f)), f + ' en cache mais introuvable');
    assert.ok(scripts.includes(f) || feuilles.includes(f), f + ' en cache mais jamais chargé');
  }
});

test('aucun module js/ ni feuille css/ au-delà de 420 lignes (seuil 400, marge de commentaires)', () => {
  for (const f of scripts.concat(feuilles)) {
    const n = lire(f).split('\n').length;
    assert.ok(n <= 420, f + ' : ' + n + ' lignes');
  }
});

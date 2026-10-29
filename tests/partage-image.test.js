// Tests du partage en image (lot 4) et de la carte « Les autres jeux d'Aulit » (lot 6).
// Lancer depuis la racine du dépôt : node --test
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../js/share-image.js');
const A = require('../js/autres-jeux.js');

test('cases de la carte : indices par énigme plafonnés à 3, non résolues à -1 (comme shareDaily)', () => {
  assert.deepEqual(S.levels([0, 1, 0, 3, 2], 4), [0, 1, 0, 3, -1]);
  assert.deepEqual(S.levels([0, 5, 2, 0, 0], 5), [0, 3, 2, 0, 0]);
  assert.deepEqual(S.levels([1, 0, 0, 0, 0], 0), [-1, -1, -1, -1, -1]);
  assert.equal(S.CELL.length, 4);
  assert.deepEqual([S.W, S.H], [1080, 1920]);
  assert.equal(S.fileName(25), 'fragments-dossier-25.png');
});

function fauxDoc() {
  const clics = [];
  return { clics, body: { appendChild() {} }, createElement: () => ({ click() { clics.push(this.download); }, remove() {} }) };
}
const blob = new Blob([new Uint8Array([137, 80, 78, 71])], { type: 'image/png' });

test('partage : feuille de partage avec le fichier et le texte quand elle accepte les fichiers', async () => {
  let recu = null;
  const nav = { canShare: (d) => !!(d.files && d.files[0].type === 'image/png'), share: async (d) => { recu = d; } };
  const doc = fauxDoc();
  assert.equal(await S.deliver(blob, 'FRAGMENTS #25', 'x.png', nav, doc), 'partage');
  assert.equal(recu.text, 'FRAGMENTS #25');
  assert.equal(recu.files[0].name, 'x.png');
  assert.deepEqual(doc.clics, []);
});

test('partage : annulé = rien ; refusé ou sans partage de fichiers = téléchargement', async () => {
  const abort = Object.assign(new Error('a'), { name: 'AbortError' });
  assert.equal(await S.deliver(blob, 't', 'a.png', { canShare: () => true, share: async () => { throw abort; } }, fauxDoc()), null);
  const d1 = fauxDoc();
  assert.equal(await S.deliver(blob, 't', 'b.png', { canShare: () => true, share: async () => { throw new Error('NotAllowed'); } }, d1), 'fichier');
  assert.deepEqual(d1.clics, ['b.png']);
  const d2 = fauxDoc();
  assert.equal(await S.deliver(blob, 't', 'c.png', { canShare: () => false, share: async () => {} }, d2), 'fichier');
  assert.equal(await S.deliver(blob, 't', 'd.png', {}, d2), 'fichier');
  assert.deepEqual(d2.clics, ['c.png', 'd.png']);
});

test('autres jeux : les 3 autres, textes et liens convenus, nouvel onglet', () => {
  assert.deepEqual(A.autres().map((j) => [j.nom, j.texte, j.url]), [
    ['ÉCHO', 'Un labyrinthe dans le noir, guidé par l\'écho', 'https://echo-jeu.github.io/'],
    ['LUMEN', 'Reliez les orbes, faites monter la lumière', 'https://lumen-jeu.github.io/'],
    ['Résonance', 'Croise les ondes, allume les nœuds', 'https://resonance-jeu.github.io/']
  ]);
  assert.equal(A.JEUX.find((j) => j.id === 'fragments').texte, 'Party game : chacun tient une pièce du dossier');
  const h = A.html((s) => s);
  assert.equal((h.match(/target="_blank" rel="noopener"/g) || []).length, 3);
  assert.ok(h.includes('Les autres jeux d&#39;Aulit') && !h.includes('fragments-jeu.github.io'));
});

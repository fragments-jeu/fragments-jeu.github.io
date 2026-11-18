// Correctifs de l'audit du 18/11/2026 : un code faux ne compte qu'une fois (verrou), bouton Retour géré, plus d'attribut style.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const lire = (f) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const fonction = (src, nom) => { const i = src.indexOf('function ' + nom + '('); assert.ok(i >= 0, nom); let n = 0; for (let k = src.indexOf('{', i); k < src.length; k++) { if (src[k] === '{') n++; else if (src[k] === '}' && !--n) return src.slice(i, k + 1); } };

test('serrure : validation auto (260 ms) + bouton Valider sur le même code faux → une seule erreur comptée', () => {
  const minuteries = [];
  const S = { view: { entry: '1234' }, game: { stage: 0, penalty: 0, wrong: 0 } };
  const env = {
    S, E: { normalize: (x) => x, WRONG_COST: 10 }, answerOf: () => '9999', toast() {}, saveGame() {}, penaltyFloat() {}, buzz() {}, A: { play() {} },
    $app: { querySelector: () => ({ classList: { add() {} }, parentNode: { insertAdjacentHTML() {} } }) }, PADLOCK: '', stageSolved() {}, refreshConsole() {},
    setTimeout: (f) => minuteries.push(f), T: (s) => s,
  };
  const submit = new Function(...Object.keys(env), fonction(lire('js/app-mj.js'), 'submit') + '; return submit;')(...Object.values(env));
  submit('1234'); submit('1234'); // les deux chemins arrivent sur le même code
  assert.equal(S.game.wrong, 1, 'une seule erreur');
  assert.equal(S.game.penalty, 10, 'une seule pénalité');
  minuteries.forEach((f) => f()); // fin de l'animation : la serrure se déverrouille, saisie vidée
  assert.equal(S.view.verif, false);
  assert.equal(S.view.entry, '');
  submit('1234');
  assert.equal(S.game.wrong, 2, 'un nouvel essai compte de nouveau');
});

test('bouton Retour : écouteur popstate, entrée d\'historique posée hors de l\'accueil, pause en partie', () => {
  const etat = lire('js/app-etat.js'), app = lire('js/app.js');
  assert.match(etat, /history\.pushState\(/);
  assert.match(app, /addEventListener\('popstate'/);
  assert.match(fonction(app, 'boutonRetour'), /ouvrirPause\(\)/);
});

test('aucun attribut style dans index.html ni dans le HTML généré par les scripts', () => {
  const html = lire('index.html');
  assert.doesNotMatch(html, /\sstyle="|<style/);
  for (const [, src] of html.matchAll(/<script src="([^"]+)"/g)) {
    if (/^https?:/.test(src)) continue;
    assert.doesNotMatch(lire(src), /(?<![-\w])style=\\?"/, src);
  }
});

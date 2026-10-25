/* FRAGMENTS — moteur de jeu pur (aucune dépendance au DOM).
 * Parité exacte avec android/.../engine/Engine.kt : toute modification ici doit y être reportée.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.FragEngine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Alphabet sans 0/O/1/I pour éviter les confusions à l'oral et au clavier.
  const ALPH = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const SEED_MAX = 32768; // 3 caractères base 32
  const GAME_SECONDS = 45 * 60;
  const HINT_COST = [60, 120, 180]; // secondes retirées au chrono pour l'indice 1, 2, 3
  const WRONG_COST = 10; // secondes retirées par mauvaise réponse

  function fnv1a(str) {
    let h = 0x811c9dc5 | 0;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function Rng(seed, tag) {
    this.a = (fnv1a(tag) ^ Math.imul(seed | 0, -1640531535)) | 0;
  }
  Rng.prototype.next = function () {
    this.a = (this.a + 0x6d2b79f5) | 0;
    let t = Math.imul(this.a ^ (this.a >>> 15), 1 | this.a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return (t ^ (t >>> 14)) >>> 0;
  };
  Rng.prototype.nextInt = function (n) {
    return this.next() % n;
  };

  function shuffle(arr, rng) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = rng.nextInt(i + 1);
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function checksumChar(prefix, players, s3) {
    return ALPH[fnv1a(prefix + players + s3) % 32];
  }

  function encodeCode(prefix, players, seed) {
    const s = ((seed % SEED_MAX) + SEED_MAX) % SEED_MAX;
    const s3 = ALPH[(s >> 10) & 31] + ALPH[(s >> 5) & 31] + ALPH[s & 31];
    return prefix + '-' + players + '-' + s3 + checksumChar(prefix, players, s3);
  }

  /** Accepte « bnk 4 7q2x », « BNK-4-7Q2X », ou une URL contenant #j=… */
  function decodeCode(input) {
    if (!input) return null;
    let s = String(input);
    const m = s.match(/[#?&]j=([A-Za-z0-9-]+)/);
    if (m) s = m[1];
    s = s.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (s.length !== 8) return null;
    const prefix = s.slice(0, 3);
    const players = s.charCodeAt(3) - 48;
    const s3 = s.slice(4, 7);
    const chk = s[7];
    if (!/^[A-Z]{3}$/.test(prefix)) return null;
    if (!(players >= 3 && players <= 6)) return null;
    let seed = 0;
    for (let i = 0; i < 3; i++) {
      const v = ALPH.indexOf(s3[i]);
      if (v < 0) return null;
      seed = seed * 32 + v;
    }
    if (checksumChar(prefix, players, s3) !== chk) return null;
    return { prefix: prefix, players: players, seed: seed, code: prefix + '-' + players + '-' + s3 + chk };
  }

  function range(n) { const a = []; for (let i = 0; i < n; i++) a.push(i); return a; }

  /** Distribution des objets d'une étape (v1.1).
   * Objets 0..nreq-1 : indispensables (nreq >= joueurs) ; nreq..nreq+nherr-1 : leurres (nherr <= joueurs).
   * Chaque joueur reçoit au moins un objet indispensable et au plus un leurre.
   * Retourne [joueur] -> liste triée d'indices d'objets. */
  function assignItems(nreq, nherr, players, seed, stageId) {
    if (nreq < players || nherr > players) throw new Error('répartition impossible');
    const rng = new Rng(seed, 'deal:' + stageId);
    const order = shuffle(range(players), rng);
    const req = shuffle(range(nreq), rng);
    const her = shuffle(range(nherr).map(function (i) { return nreq + i; }), rng);
    const hands = range(players).map(function () { return []; });
    req.forEach(function (it, i) { hands[order[i % players]].push(it); });
    her.forEach(function (it, i) { hands[order[players - 1 - i]].push(it); });
    hands.forEach(function (h) { h.sort(function (x, y) { return x - y; }); });
    return hands;
  }

  /** Zone (pièce à fouiller) de chaque joueur pour une étape : toutes différentes. */
  function zonesFor(nZones, players, seed, stageId) {
    return shuffle(range(nZones), new Rng(seed, 'zone:' + stageId)).slice(0, players);
  }

  /** Contenu des cachettes d'une zone pour un joueur.
   * Retour : tableau [cachette] -> k >= 0 : k-ième objet du joueur ; -1 : rien ; -2-f : objet d'ambiance f. */
  function searchLayout(nItems, nSpots, nFlavor, seed, stageId, player) {
    if (nItems > nSpots) throw new Error('pas assez de cachettes');
    const rng = new Rng(seed, 'spot:' + stageId + ':' + player);
    const order = shuffle(range(nSpots), rng);
    const res = new Array(nSpots).fill(-1);
    for (let i = 0; i < order.length; i++) {
      if (i < nItems) res[order[i]] = i;
      else { const r = rng.nextInt(nFlavor + 1); res[order[i]] = r < nFlavor ? -2 - r : -1; }
    }
    return res;
  }

  function variantIndex(variantCount, seed, stageId) {
    return new Rng(seed, 'var:' + stageId).nextInt(variantCount);
  }

  function unlockWordIndices(wordCount, stageCount, seed) {
    const idx = [];
    for (let i = 0; i < wordCount; i++) idx.push(i);
    return shuffle(idx, new Rng(seed, 'words')).slice(0, stageCount);
  }

  function normalize(s) {
    return String(s || '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');
  }

  function stars(remaining, timedOut) {
    if (timedOut || remaining <= 0) return 0;
    if (remaining >= 15 * 60) return 3;
    if (remaining >= 6 * 60) return 2;
    return 1;
  }

  function fmtTime(sec) {
    sec = Math.max(0, Math.floor(sec));
    const m = Math.floor(sec / 60), s = sec % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  // ---- Helpers haut niveau sur un scénario JSON ----
  function setupGame(scenario, players, seed) {
    const stages = scenario.stages.map(function (st) {
      const v = variantIndex(st.variants.length, seed, st.id);
      const lay = st.layout[players];
      const hands = assignItems(lay[0], lay[1], players, seed, st.id);
      const zones = zonesFor(scenario.zones.length, players, seed, st.id);
      const spots = hands.map(function (h, p) {
        const z = scenario.zones[zones[p]];
        return searchLayout(h.length, z.hotspots.length, z.flavor.length, seed, st.id, p);
      });
      return { id: st.id, variant: v, hands: hands, zones: zones, spots: spots };
    });
    const wi = unlockWordIndices(scenario.words.length, scenario.stages.length, seed);
    return { stages: stages, words: wi.map(function (i) { return scenario.words[i]; }) };
  }

  function shareText(title, starCount, elapsedSec, hints, timedOut) {
    const st = starCount > 0 ? new Array(starCount + 1).join('⭐') : '☆';
    const tail = hints === 0 ? 'sans indice' : hints === 1 ? '1 indice' : hints + ' indices';
    if (timedOut) return 'FRAGMENTS — ' + title + ' ☆ hors temps, ' + tail;
    return 'FRAGMENTS — ' + title + ' ' + st + ' en ' + fmtTime(elapsedSec) + ', ' + tail;
  }

  // ---- Dossier du jour (PWA seulement : Engine.kt n'a pas de mode du jour) ----
  const DAILY_URL = 'https://fragments-jeu.github.io/';
  const DAILY_CELLS = ['🟩', '🟨', '🟧', '🟥'];

  /** Scénario et graine du jour. scenarios : liste de data/index.json ; seed32 : Defi.seed('fragments', key).
   * Tri par id : réordonner le fichier ne change pas les dossiers (en ajouter un, si). */
  function dailyPick(scenarios, seed32) {
    const list = scenarios.slice().sort(function (a, b) { return a.id < b.id ? -1 : a.id > b.id ? 1 : 0; });
    const u = seed32 >>> 0;
    return { scenario: list[u % list.length], seed: u % SEED_MAX };
  }

  /** Arguments de Defi.shareText pour une partie du jour terminée ; null si abandon (ne compte pas).
   * d : { n, title, stars, used, hints: [par énigme], solved, wrong, players, timedOut, serie, abandon } */
  function shareDaily(d) {
    if (d.abandon) return null;
    const cells = d.hints.map(function (h, i) { return i < d.solved ? DAILY_CELLS[Math.min(h, 3)] : '⬛'; }).join('');
    const nh = d.hints.reduce(function (a, b) { return a + b; }, 0);
    const detail = (d.timedOut ? 'hors temps' : fmtTime(d.used)) + ' · ' +
      (nh === 0 ? 'sans indice' : nh === 1 ? '1 indice' : nh + ' indices') + ' · ' +
      (d.wrong === 0 ? 'sans erreur' : d.wrong === 1 ? '1 erreur' : d.wrong + ' erreurs') + ' · ' + d.players + ' joueurs';
    return { nom: 'FRAGMENTS', n: d.n, emoji: '🗂️', score: d.title + ' ' + (d.stars > 0 ? new Array(d.stars + 1).join('⭐') : '☆'),
      lignes: [cells], detail: detail, serie: d.serie, url: DAILY_URL };
  }

  return {
    ALPH: ALPH, SEED_MAX: SEED_MAX, GAME_SECONDS: GAME_SECONDS, HINT_COST: HINT_COST, WRONG_COST: WRONG_COST,
    fnv1a: fnv1a, Rng: Rng, shuffle: shuffle,
    encodeCode: encodeCode, decodeCode: decodeCode,
    assignItems: assignItems, zonesFor: zonesFor, searchLayout: searchLayout, variantIndex: variantIndex, unlockWordIndices: unlockWordIndices,
    normalize: normalize, stars: stars, fmtTime: fmtTime, setupGame: setupGame, shareText: shareText,
    DAILY_URL: DAILY_URL, dailyPick: dailyPick, shareDaily: shareDaily
  };
});

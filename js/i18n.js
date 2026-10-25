/* FRAGMENTS — langue de l'interface et des scénarios (fr / en).
 * Clé = texte français tel qu'écrit dans le code ; i18n/strings.json donne l'anglais (fichier partagé avec l'appli Android).
 * Texte absent du dictionnaire : le français s'affiche (jamais de trou). Paramètres : {0}, {1}…
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.FragI18n = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const LS = 'fragments.lang.v1';
  let lang = 'fr', EN = {};

  /** Choix mémorisé, sinon langue du navigateur : français si elle commence par « fr », anglais sinon. */
  function detect(stored, nav) {
    if (stored === 'fr' || stored === 'en') return stored;
    const l = nav ? (nav.languages && nav.languages[0]) || nav.language || '' : '';
    return /^fr\b/i.test(l) ? 'fr' : 'en';
  }
  function stored() { try { return localStorage.getItem(LS); } catch (e) { return null; } }
  function setLang(l) {
    lang = l === 'en' ? 'en' : 'fr';
    try { localStorage.setItem(LS, lang); } catch (e) { /* stockage indisponible : choix non mémorisé */ }
  }
  function fill(s, args) {
    for (let i = 0; i < args.length; i++) s = s.split('{' + i + '}').join(args[i]);
    return s;
  }
  function t(s) {
    const r = lang === 'en' && typeof EN[s] === 'string' ? EN[s] : s;
    return fill(r, Array.prototype.slice.call(arguments, 1));
  }
  /** Pluriel : français « 0 ou 1 = singulier », anglais « 1 = singulier ». */
  function tn(n, one, many) { return t((lang === 'en' ? n !== 1 : n > 1) ? many : one, n); }

  return {
    LS: LS, detect: detect, t: t, tn: tn,
    get lang() { return lang; },
    /** strings : contenu de i18n/strings.json ({ en: { fr: en } }). */
    init(strings, nav) { EN = (strings && strings.en) || {}; lang = detect(stored(), nav); return lang; },
    setLang: setLang,
    /** Dossier des scénarios : data/ (français, source) ou i18n/scenarios/en/ (même structure, textes anglais). */
    scenarioDir() { return lang === 'en' ? 'i18n/scenarios/en/' : 'data/'; }
  };
});

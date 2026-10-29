/* FRAGMENTS — carte « Les autres jeux d'Aulit » (Réglages). Textes identiques dans les 4 jeux. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.FragAutresJeux = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const MOI = 'fragments';
  // Liens web des 4 jeux : à remplacer par le lien Play Store quand l'appli sera publiée
  // (https://play.google.com/store/apps/details?id= com.aulit.echo, com.aulit.lumen, com.aulit.fragments, fr.aulit.resonance).
  const JEUX = [
    { id: 'echo', nom: 'ÉCHO', texte: 'Un labyrinthe dans le noir, guidé par l\'écho', url: 'https://echo-jeu.github.io/' },
    { id: 'lumen', nom: 'LUMEN', texte: 'Reliez les orbes, faites monter la lumière', url: 'https://lumen-jeu.github.io/' },
    { id: 'fragments', nom: 'Fragments', texte: 'Party game : chacun tient une pièce du dossier', url: 'https://fragments-jeu.github.io/' },
    { id: 'resonance', nom: 'Résonance', texte: 'Croise les ondes, allume les nœuds', url: 'https://resonance-jeu.github.io/' }
  ];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const autres = () => JEUX.filter((j) => j.id !== MOI);
  const fleche = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6l-6 6"/></svg>';

  /** T : traduction (js/i18n.js). Liens ouverts dans un nouvel onglet. */
  function html(T) {
    return '<section class="autres" aria-labelledby="autresT"><div class="autres-tab">' + esc(T('Archives')) + '</div>' +
      '<h3 id="autresT">' + esc(T('Les autres jeux d\'Aulit')) + '</h3><ul>' +
      autres().map((j, i) => '<li><a href="' + j.url + '" target="_blank" rel="noopener"><i>N° ' + (i + 1) + '</i><b>' + esc(j.nom) + '</b><span>' + esc(T(j.texte)) + '</span>' + fleche + '</a></li>').join('') +
      '</ul></section>';
  }
  return { JEUX: JEUX, autres: autres, html: html };
});

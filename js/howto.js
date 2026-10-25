/* FRAGMENTS — écran « Comment jouer » (sorti de app.js). */
(function (root) {
  'use strict';
  /** T : traduction (js/i18n.js) ; topbar : barre de titre de app.js. */
  root.FragHowto = function (T, topbar) {
    const ill1 = '<svg viewBox="0 0 112 112" aria-hidden="true"><rect x="30" y="10" width="52" height="92" rx="8" fill="#252c22" stroke="currentColor" stroke-width="2"/><rect x="40" y="26" width="32" height="32" fill="#e8dec6"/><path d="M44 30h6v6h-6zM62 30h6v6h-6zM44 48h6v6h-6zM56 42h4v4h-4zM62 50h4v4h-4z" fill="#1d1a14"/><text x="56" y="78" font-family="Stencil" font-weight="900" font-size="12" text-anchor="middle" fill="var(--glow)">BNK-4</text><circle cx="56" cy="92" r="4" fill="var(--glow)"/></svg>';
    const ill2 = '<svg viewBox="0 0 112 112" aria-hidden="true"><g transform="rotate(-10 36 60)"><rect x="12" y="24" width="44" height="60" fill="#e8dec6"/><path d="M18 34h30M18 42h22M18 50h28" stroke="#5b5244" stroke-width="2"/></g><g transform="rotate(8 76 60)"><rect x="54" y="26" width="44" height="60" fill="#f1e9a8"/><path d="M60 38h30M60 46h20M60 54h26" stroke="#23285a" stroke-width="2"/></g><path d="M40 98q16 -10 32 0" stroke="var(--glow)" stroke-width="2.5" fill="none"/><circle cx="56" cy="16" r="6" fill="none" stroke="var(--glow)" stroke-width="2"/></svg>';
    const ill3 = '<svg viewBox="0 0 112 112" aria-hidden="true"><rect x="14" y="20" width="84" height="76" rx="10" fill="#3b3f37"/><rect x="22" y="28" width="68" height="20" rx="4" fill="#0d0f0c"/><text x="56" y="44" font-family="Stencil" font-weight="900" font-size="16" text-anchor="middle" fill="#8fd18a" letter-spacing="3">4758</text>' +
      [0, 1, 2].map((r) => [0, 1, 2].map((c) => '<rect x="' + (26 + c * 22) + '" y="' + (54 + r * 13) + '" width="16" height="9" rx="2" fill="#5a5f55"/>').join('')).join('') + '</svg>';
    return '<main class="screen">' + topbar(T('Comment jouer'), 'home') +
      '<div class="howto">' +
      '<div class="step">' + ill1 + '<div><h4>' + T('Un maître du jeu') + '</h4><p>' + T('Un téléphone crée la partie et affiche un code. Il garde le chrono, la serrure et les indices.') + '</p></div></div>' +
      '<div class="step">' + ill2 + '<div><h4>' + T('Chacun sa pièce à fouiller') + '</h4><p>' + T('Chaque joueur rejoint avec le code et fouille une salle différente : tiroirs, poches, dessous de matelas. Décrivez vos trouvailles à voix haute, sans montrer votre écran.') + '</p></div></div>' +
      '<div class="step">' + ill3 + '<div><h4>' + T('La serrure') + '</h4><p>' + T('Quand le groupe a trouvé, il tape la réponse sur le téléphone du maître du jeu. Un mot de passage s\'affiche : chacun le tape pour recevoir la suite.') + '</p></div></div>' +
      '</div><div class="intro" style="margin-top:20px"><p>' + T('De 3 à 6 joueurs, 45 minutes. Une erreur coûte 10 secondes, un indice de 1 à 3 minutes. Finissez avec plus de 15 minutes pour trois étoiles.') + '</p></div>' +
      '<div class="grow"></div><button class="btn" data-act="create" style="margin-top:18px">' + T('Créer une partie') + '</button></main>';
  };
})(typeof self !== 'undefined' ? self : this);

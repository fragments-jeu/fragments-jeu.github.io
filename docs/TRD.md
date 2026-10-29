# Fragments — TRD (exigences techniques)

## Pile
- HTML + CSS + JavaScript classique (scripts sans `import`), **aucune dépendance npm**, aucun outil de construction.
- Rendu : chaque écran est une chaîne HTML (`SCREENS.xxx`) injectée dans `#app` ; documents en SVG (`js/docs.js`), QR (`js/qr.js`), carte image au canvas.
- Sons : WebAudio généré (`js/audio.js`). Polices locales (Big Shoulders Stencil / Text, Courier Prime, Caveat).
- Ordre de chargement imposé : `js/defi.js` (premier) → `engine.js` → `i18n.js` → `qr.js` → `docs.js` → `audio.js` → `autres-jeux.js` → `howto.js` → `share-image.js` → `app-etat.js` → `app-joueur.js` → `app-mj.js` → `app-accueil.js` → `app.js` (dernier).

## PWA
- Hébergement : GitHub Pages, `https://fragments-jeu.github.io/` (organisation dédiée).
- `sw.js` : cache d'abord, hors ligne complet ; `CACHE` (`fragments-v2.14` au 29/10/2026) à monter à chaque livraison ; ne purge que les caches `fragments-*`.
- Manifest : `id` `/fragments/` (ne jamais changer).
- CSP en balise meta : `script-src 'self'` + empreinte `sha256` du seul script en ligne exécutable (compteur GoatCounter) + `https://gc.zgo.at` ; `connect-src`/`img-src` + `https://aulit42369.goatcounter.com`.

## Traceurs (28/10/2026)
- Aucun cookie. Seul traceur : **GoatCounter**, mesure d'audience sans cookie (compte `aulit42369.goatcounter.com`, le même que le Site et la vitrine de La Cabane), chemins préfixés `/fragments/…` (option `path`) pour distinguer le jeu dans le tableau de bord.
- Script d'une ligne en fin de `index.html` : charge `count.v4.js` (version figée + SRI `sha384`, comme le Site) **seulement** si `location.hostname` se termine par `github.io` (jamais dans une appli Android, une WebView, `file://` ni en local) et si `localStorage.skipgc` ≠ `'t'`.
- CSP : empreinte `sha256` de ce script + `https://gc.zgo.at` dans `script-src`, `https://aulit42369.goatcounter.com` dans `connect-src` et `img-src`. Modifier le script = recalculer l'empreinte (`tests/statistiques.test.js` échoue sinon).
- Le SW ignore les requêtes d'autres origines : `count.js` et les envois ne sont jamais mis en cache.
- Opposition : bouton « Ne pas être compté » de `privacy.html` (toutes les langues), clé locale `skipgc` ; bouton masqué hors `github.io`.

## Android
- Appli Kotlin + Compose 2.0/2.1 : `F:\Stream\files\JEUX\fragments\android` (hors de ce dépôt), AAB prêt, pas encore publié.
- Parité exacte : `engine.js` ⇄ `Engine.kt` + `Daily.kt` (codes, répartition, pièces, cachettes, dossier du jour), `defi.js` ⇄ `Defi.kt`, `qr.js` ⇄ `Qr.kt` ;
  une partie créée sur le web se rejoint depuis l'appli et inversement (vérifié sur 4 800 parties).
- `data/*.json` et `i18n/strings.json` recopiés dans `assets/` de l'appli.

## Contraintes
- `data/` intouchable. `defi.js` identique octet pour octet dans les 4 jeux (empreinte vérifiée), toujours premier `<script>`.
- JSON-LD en fin de `<body>`.
- Accessibilité : chaque écran est rendu dans un `<main class="screen">` (modèle repris par les 3 autres jeux), `<h1>` masqué sur l'accueil,
  `#app` en `aria-live="polite"`, contraste AA. Pas de pied de page : le lien `privacy.html` est dans les Réglages.
- Textes : `T('texte français')` + anglais dans `i18n/strings.json` (vérifié par `tests/i18n.test.js`).
- Tests : `node --test` à la racine (Node 24 ; jamais `node --test tests/`).

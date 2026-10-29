# Fragments — pièges

- **`data/` est intouchable** : le dossier du jour ne fait que lire les scénarios déjà chargés ; les tests utilisent un faux index.
- **`defi.js` est commun aux 4 jeux** : toute modification se fait dans les 4 dépôts en même temps, puis on met à jour `EMPREINTE` dans les 4 `tests/defi.test.js`.
- **Ajouter un scénario change les dossiers du jour suivants** (index = graine modulo le nombre de scénarios, triés par `id`). Réordonner le fichier n'a pas d'effet.
- **Changer la version du cache dans `sw.js`** à chaque livraison (`fragments-vX.Y`), sinon les téléphones gardent l'ancienne version.
- **Parité Android** : `engine.js` et `Engine.kt`/`Daily.kt` (appli 2.0) doivent rester identiques pour les codes, la répartition, les pièces, les cachettes et le dossier du jour. Toute modification ici (ou de `data/`) → recopier `data/*.json` dans l'appli, `node tools/make-parity.js` dans `JEUX\fragments`, puis `gradlew testDebugUnitTest`. (Le commentaire « PWA seulement » au-dessus de `dailyPick` dans `engine.js` est périmé ; laissé tel quel pour ne pas toucher au jeu.)
- **Abandon ≠ temps écoulé** : `finish(false, 'abandon')` ne compte pas pour la série ; le temps écoulé compte (score 0).
- **`404.html` est servie à n'importe quelle profondeur** (`/a/b/c`) : tous ses liens, polices et icônes en chemin absolu (`/…`), jamais relatif. Elle n'est pas mise en cache par le SW.
- **Aperçus de liens** : `og:image` doit rester une URL absolue (`https://fragments-jeu.github.io/og-image.png`) ; après modification de l'image, Facebook/Discord gardent l'ancienne en cache plusieurs jours.
- **`node --test tests/` échoue sous Node 24** : lancer `node --test` à la racine.
- Les boutons `.btn` avec icône n'avaient pas de taille d'icône (icône géante) : règle `.btn svg` ajoutée le 24/10.
- **JSON-LD en fin de `<body>`** (25/10) : `tests/defi.test.js` exige que `defi.js` soit le **premier** `<script>` de `index.html` ; un bloc `application/ld+json` dans le `<head>` fait échouer le test.

- **Anglais (25/10)** : tout nouveau texte d'interface s'écrit `T('texte français')` (ou `TN` pour un pluriel) et son anglais va dans `i18n/strings.json` — sinon `tests/i18n.test.js` échoue. Ne jamais écrire de gabarit `'… ' + x + ' …'` : `T('… {0} …', x)`. Recopier `i18n/strings.json` dans l'appli Android (`assets/i18n/`).
- **Scénarios anglais** : ne jamais les éditer à la main ; corriger le dictionnaire `JEUX\fragments\tools\i18n\en-<scénario>.json` puis `node tools/make-en.js` (et recopier dans `android/app/src/main/assets/scenarios-en/`). Une modification de `data/` (interdite ici) casserait le test de structure tant que le dictionnaire n'est pas complété.
- **Réponses en français dans les deux langues** : un groupe FR/EN tape sur la même serrure. Ne pas « traduire » une réponse ni un mot de passage, ni l'initiale d'un titre de livre du manoir.
- **Changer de langue recharge la page** (les scénarios sont relus dans l'autre dossier) ; la partie en cours est gardée (mêmes id, même structure).
- **Modules de l'appli (lot 18)** : l'ordre des scripts compte (`app-etat` → `app-joueur` → `app-mj` → `app-accueil` → `app`) : chaque module prend dans `window.FragApp` ce que les précédents ont exporté, au chargement. Un module ne peut donc pas utiliser une fonction d'un module chargé après lui, sauf à la lire dans `F.xxx` au moment de l'appel. Les valeurs réassignées vivent dans `S` (`S.game = null`, jamais `game = null` local : la copie ne serait pas vue des autres modules).
- **Nouveau fichier js/css** : l'ajouter à `index.html` **et** à `ASSETS` de `sw.js` (sinon `tests/structure.test.js` échoue), et pour un js contenant des `T(…)`, à `SOURCES` de `tests/i18n.test.js`.
- **Fichier `google9ad7f8bd44912903.html` (25/10)** : validation Google Search Console (propriété + sitemap envoyé). Ne jamais le supprimer ni le renommer, sinon la propriété perd sa validation.

- **Compteur GoatCounter (28/10)** : script en ligne d'une ligne en fin de `index.html`, son empreinte `sha256` est dans la CSP : le modifier = recalculer l'empreinte (`tests/statistiques.test.js`). Ne jamais retirer la garde `github.io` : compter dans une appli Android obligerait à déclarer des analytics sur le Play Store. Garder `count.v4.js` + `integrity` (pas `count.js`), comme le Site.

## Identités d'appli (manifest `id`) — NE JAMAIS CHANGER (29/10)
Chrome identifie une PWA installée par son `id` ; en changer = une autre appli, l'ancienne reste orpheline. Valeurs en ligne des 5 apps :
ÉCHO `/` (echo-jeu.github.io depuis le 29/10 ; avant : `/Echo/` sur aulit42369.github.io) · LUMEN `/` (lumen-jeu.github.io) · Fragments `/fragments/` (fragments-jeu.github.io, volontairement différent de `/`) · Résonance `/` (resonance-jeu.github.io) · CRA `/Cra/` (cra-aulit.github.io/Cra/).
`tests/manifest-sw.test.js` (identique dans les 5 projets) fige ces valeurs : si tu le modifies, copie-le à l'identique dans les 4 autres.

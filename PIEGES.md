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

- **Fichier `google9ad7f8bd44912903.html` (25/10)** : validation Google Search Console (propriété + sitemap envoyé). Ne jamais le supprimer ni le renommer, sinon la propriété perd sa validation.

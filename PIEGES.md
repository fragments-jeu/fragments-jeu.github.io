# Fragments — pièges

- **`data/` est intouchable** : le dossier du jour ne fait que lire les scénarios déjà chargés ; les tests utilisent un faux index.
- **`defi.js` est commun aux 4 jeux** : toute modification se fait dans les 4 dépôts en même temps, puis on met à jour `EMPREINTE` dans les 4 `tests/defi.test.js`.
- **Ajouter un scénario change les dossiers du jour suivants** (index = graine modulo le nombre de scénarios, triés par `id`). Réordonner le fichier n'a pas d'effet.
- **Changer la version du cache dans `sw.js`** à chaque livraison (`fragments-vX.Y`), sinon les téléphones gardent l'ancienne version.
- **Parité Android** : `engine.js` et `Engine.kt` doivent rester identiques pour les codes et la répartition. `dailyPick`/`shareDaily` n'existent que côté PWA (un joueur Android rejoint quand même un dossier du jour, c'est un code normal).
- **Abandon ≠ temps écoulé** : `finish(false, 'abandon')` ne compte pas pour la série ; le temps écoulé compte (score 0).
- **`404.html` est servie à n'importe quelle profondeur** (`/a/b/c`) : tous ses liens, polices et icônes en chemin absolu (`/…`), jamais relatif. Elle n'est pas mise en cache par le SW.
- **Aperçus de liens** : `og:image` doit rester une URL absolue (`https://fragments-jeu.github.io/og-image.png`) ; après modification de l'image, Facebook/Discord gardent l'ancienne en cache plusieurs jours.
- **`node --test tests/` échoue sous Node 24** : lancer `node --test` à la racine.
- Les boutons `.btn` avec icône n'avaient pas de taille d'icône (icône géante) : règle `.btn svg` ajoutée le 24/10.

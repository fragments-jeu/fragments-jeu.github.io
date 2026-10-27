# Fragments — plan de mise en œuvre

## État au 28/10/2026
- PWA en ligne (cache `fragments-v2.11`), 35 tests `node --test` verts.
- Fait : Dossier du jour commun, partage texte + image, anglais (interface + 3 scénarios relus avec DeepL), autres jeux,
  lot 18 (découpage de `app.js` et `app.css`), politique LCEN/RGPD, CSP, `<main>` sur chaque écran (modèle des 3 autres jeux).
- Android 2.0 / 2.1 au même niveau (dans `JEUX\fragments\android`), AAB prêt, pas encore publié.

## Prochaines étapes (d'après `A_FAIRE.md`)
1. Sur téléphone (Chrome Android) : partage de l'image (WhatsApp, story Instagram), passage FR ⇄ EN, une partie réelle en anglais.
2. Android : tester l'APK puis envoyer `Fragments-2.0.aab` sur la Play Console.
3. Play Console : fiche « Sécurité des données » cohérente avec `privacy.html` (aucune donnée collectée).
4. Remplacer les liens de `js/autres-jeux.js` par les liens Play Store à la publication.
5. Rebrancher les tests de `JEUX\fragments\tests` sur ce dépôt (ils pointent vers l'ancienne copie `pwa\`).

## Décisions en attente (Olivier)
- Mesure d'audience : rien d'installé (option sans cookie si oui).
- Série quotidienne gardée malgré les parties de 45 min (Q3, en attente de confirmation).

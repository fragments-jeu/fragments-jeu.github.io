# Fragments — à faire

## Fait
- 24/10 : « Dossier du jour » (idée 14) : dossier sur l'accueil entre « Créer une partie » et « Rejoindre », scénario et graine communs à tous (minuit heure de Paris), aussi en mode test solo, série de jours, écran de fin avec série, record, compte à rebours et partage en un message (repli zone de texte). Module commun `js/defi.js`, tests `node --test` (16 verts), cache `fragments-v2.3`.
- 24/10 : correctif des icônes géantes dans les boutons (« Partager le résultat », « Scanner le QR »).
- 24/10 : création de README, ARCHITECTURE, PIEGES, A_FAIRE.

- 25/10 : checklist « avant lancement » : `privacy.html` créée (confidentialité exacte : stockage local, caméra du scan QR, partage, cookies ; conditions d'utilisation ; mentions légales), lien dans les Réglages, titre + description + Open Graph + `og-image.png` 1200×630, `404.html`, `robots.txt` + `sitemap.xml`, contraste AA (sous-titres des dossiers, tampon des documents, exemple du champ code), cache `fragments-v2.4` (+ `privacy.html` hors ligne).
- 25/10 : appli Android prête pour le Play Store : API 36, signature release via `keystore.properties`, clé d'importation créée (`JEUX/fragments/CLE-A-GARDER-PRECIEUSEMENT`), AAB signé `JEUX/fragments/1-A-ENVOYER-SUR-PLAY/Fragments-1.0.aab` (code 1) + APK de test. Contenu inchangé (sources du 12/10, scénarios format v1 embarqués).
- 25/10 : passe SEO éditoriale (requête « party game entre amis sur téléphone ») : `<title>`, description, Open Graph alignés ; `<h1>` masqué de l'accueil (`js/app.js`) et paragraphe `<noscript>` reprenant la requête ; données structurées `VideoGame` (3 à 6 joueurs, coop) en fin de `<body>` ; cache `fragments-v2.5`.
- 25/10 : appli Android 2.0 (code 2) au niveau de ce dépôt : scénarios v2 (copie exacte de `data/`), fouille des pièces, trouvailles, Dossier du jour (même graine, même série, même texte partagé), lien Confidentialité, contrastes AA, QR vers `fragments-jeu.github.io`. Parité vérifiée sur 4 800 parties : une partie créée ici se rejoint depuis l'appli et inversement. AAB `JEUX/fragments/1-A-ENVOYER-SUR-PLAY/Fragments-2.0.aab` (les 1.0, jamais publiés, sont supprimés). Aucun fichier du jeu web modifié.

- 25/10 : lots 4 à 7. (4) « Partager l'image » sur la fin du Dossier du jour : carte 1080×1920 dessinée (FRAGMENTS en papiers découpés, chemise, n°, scénario, étoiles, cases dessinées, série, tampon, lien), `navigator.share({files, text})`, repli téléchargement. (6) Carte « Les autres jeux d'Aulit » dans les Réglages (ÉCHO, LUMEN, Résonance). (7) Anglais : langue du navigateur + sélecteur FR/EN mémorisé dans les Réglages, interface (`i18n/strings.json`) et 3 scénarios (`i18n/scenarios/en/`), clavier QWERTY en anglais, `privacy.html` bilingue (#en). `data/` inchangé, `defi.js` inchangé. Cache `fragments-v2.7`. Tests : 32 verts.

## En cours

## À faire
- Lots 4-7 : vérifier sur téléphone (Chrome Android) le partage de l'image (WhatsApp, Instagram story) et le passage FR ⇄ EN dans les Réglages ; relire l'anglais des scénarios en jouant (traduction faite d'un bloc, non relue en partie réelle).
- Liens des autres jeux : remplacer par les liens Play Store quand les applis seront publiées (`js/autres-jeux.js`).
- Android 2.0 : tester l'APK sur téléphone puis envoyer `Fragments-2.0.aab` sur la Play Console (voir `JEUX\fragments\android\A_FAIRE.md`).
- Découper `js/app.js` (783 lignes) et `css/app.css` (510 lignes) sous le seuil de 400 lignes.
- Les tests de `JEUX\fragments\tests` pointent vers l'ancienne copie `pwa\` (12/10) : les rebrancher sur ce dépôt.

- Ajouter une adresse e-mail de contact publique dans `privacy.html` si souhaité (aujourd'hui : tickets GitHub). URL pour le Play Store : `https://fragments-jeu.github.io/privacy.html`.
- Mesure d'audience : rien d'installé (à décider ; option sans cookie si oui).

## Décisions prises
- 25/10 (lot 7) : en anglais, **réponses et mots de passage restent en français** (FILTRE, OMBRE, FOURGON, BOUSSOLE…) : ils sont tapés sur la serrure commune et doivent être identiques pour un groupe mixte FR/EN. Les indices anglais les glosent (« FOURGON (French for the luggage van) »). Les titres des livres du manoir gardent leur initiale (réponse = initiales). Le voyant vert du pupitre est noté G en anglais (V en français), heures « 23h40 » écrites « 23:40 » (mêmes chiffres).
- 25/10 (lot 6) : carte des autres jeux dans les Réglages (pas sur l'accueil, déjà chargé de 3 dossiers).
- 25/10 (lot 4) : image seulement pour le Dossier du jour (pas pour les parties normales), le texte partagé reste celui de `defi.js`.
- 25/10 : contact = page « Issues » du dépôt GitHub ; CGU et mentions légales dans `privacy.html`.
- 25/10 : accueil avec deux entrées principales (Créer / Rejoindre) gardé tel quel : le jeu a deux rôles (MJ, joueur), un bouton « Jouer » unique n'aurait pas de sens.
- 24/10 : le jour change à minuit heure de Paris pour tout le monde (Q1 de la spec, option appliquée par défaut).
- 24/10 : série quotidienne gardée pour Fragments malgré les parties de 45 min (Q3, par cohérence entre les 4 jeux, en attente de confirmation).
- 24/10 : score du jour = secondes restantes (0 hors temps) ; seul le téléphone du MJ (ou le solo) enregistre ; abandon non compté.
- 24/10 : scénario du jour = scénarios triés par `id`, index = graine modulo leur nombre ; graine de partie = graine modulo 32768.

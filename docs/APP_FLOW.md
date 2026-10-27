# Fragments — parcours (écran par écran)

Chaque écran est un `<main class="screen">` rendu dans `#app` par `SCREENS.<nom>` ; `go(nom)` passe de l'un à l'autre.

1. **Accueil** (`home`) : lampe, titre, **Créer une partie**, **Dossier du jour** (n°, série), **Rejoindre** ; accès Comment jouer, Réglages, mode test solo.
   Une partie en cours (`fragments.game.v1`) peut être reprise.
2. **Création** (`create`) : scénario, nombre de joueurs (3 à 6) ou mode solo → « Générer le code » / « Lancer le test ».
3. **Salle d'attente du MJ** (`lobby`) : code de partie + QR à montrer aux joueurs → « Lancer le chrono (45:00) ».
4. **Rejoindre** (`join`) : saisie du code (clavier AZERTY / QWERTY selon la langue) ou scan du QR (caméra) → choix du siège.
5. **Console du MJ** (`host`) : chrono, serrure commune (saisie des réponses), indices, énigmes résolues ; Quitter.
6. **Vue joueur** (`player`) : documents de son siège, fouille des pièces et cachettes (« maintenir pour forcer »), trouvailles,
   mot de passage pour l'étape suivante ; Quitter.
7. **Mode solo** (`solo`) : un seul téléphone, onglets MJ + joueurs.
8. **Fin** (`end`) : dossier clos ou temps écoulé, étoiles ; pour le Dossier du jour : série, record, « Partager le résultat », « Partager l'image », compte à rebours ; Retour à l'accueil.
9. **Comment jouer** (`howto`) et **Réglages** (`settings`) : langue, son, vibrations, autres jeux d'Aulit, lien « Confidentialité, conditions et mentions légales ».
10. **Pages annexes** : `privacy.html` (FR + `#en`), `404.html`.

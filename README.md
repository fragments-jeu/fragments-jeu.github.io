# Fragments — jeu d'évasion entre amis (PWA)

Jeu d'évasion coopératif hors ligne, de 3 à 6 joueurs, chacun sur son téléphone. Un téléphone est le
maître du jeu (chrono, serrure, indices), les autres rejoignent avec un code (`BNK-4-7Q2X`) ou un QR.

Publié sur https://fragments-jeu.github.io/ (dépôt `fragments-jeu.github.io`, GitHub Pages).
L'appli Android (Kotlin, Compose) vit dans `F:\Stream\files\JEUX\fragments\android`.

## Dossier du jour
Sur l'accueil, « Dossier du jour » propose le même scénario et la même graine à tout le monde, changés à
minuit heure de Paris. Le code de partie est un code normal : les joueurs rejoignent comme d'habitude.
À la fin, « Partager le résultat » envoie un texte à une seule bulle (grille d'emoji, série, lien).

## Tests
À la racine : `node --test` (Node 24 ; ne pas écrire `node --test tests/`). Aucune dépendance npm.

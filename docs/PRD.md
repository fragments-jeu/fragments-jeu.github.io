# Fragments — PRD (cahier des charges produit)

Rédigé le 28/10/2026 d'après le code et les docs du dépôt (`README.md`, `ARCHITECTURE.md`, `A_FAIRE.md`).

## Concept
Party game d'évasion coopératif, de 3 à 6 joueurs, chacun sur son téléphone : chacun tient une pièce du dossier
(documents, indices) qu'il doit décrire aux autres. Un téléphone est le maître du jeu (chrono 45:00, serrure, indices),
les autres rejoignent avec un code (`BNK-4-7Q2X`) ou un QR. Gratuit, hors ligne (aucun réseau entre les téléphones), sans compte.

## Joueurs visés
- Groupes d'amis réunis dans la même pièce qui cherchent un « party game entre amis sur téléphone » (requête SEO visée).
- Groupes mixtes français / anglais (les réponses restent en français pour tous).
- Communauté du stream d'Aulit42369 (Dossier du jour commun aux 4 jeux).
- Profil estimé : 13 ans et plus (groupes d'amis, ados et jeunes adultes), surtout France et pays francophones, quelques groupes anglophones via la langue anglaise (proposé par Claude le 29/10/2026, à corriger si besoin).

## Fonctions (présentes dans le code)
| Fonction | Détail |
|---|---|
| Créer une partie | Choix du scénario et du nombre de joueurs → code de partie + QR (téléphone du MJ) |
| Rejoindre | Saisie du code ou scan du QR (caméra), choix du siège |
| Console du MJ | Chrono, serrure commune, indices, résolution des énigmes |
| Vue joueur | Documents (8 styles), fouille des pièces et cachettes, « maintenir pour forcer », trouvailles, mot de passage |
| Mode test solo | Un seul téléphone joue tous les rôles (onglets) |
| Dossier du jour | Même scénario et même graine pour tous, change à minuit heure de Paris, série, partage texte + image 1080×1920 |
| Comment jouer | Écran d'aide |
| Réglages | Langue FR / EN, son, vibrations, autres jeux d'Aulit, lien Confidentialité |
| Scénarios | 3 scénarios dans `data/` (contenu non relu ici, dossier intouchable) |

## Hors périmètre
- Pas de serveur ni de synchronisation réseau : les téléphones ne communiquent pas, la partie est décrite par le code.
- Pas de compte, de classement en ligne, d'achat ni de publicité.
- Pas d'éditeur de scénarios dans l'appli.
- Pas de mesure d'audience (non décidé).

## Critères de réussite
À confirmer par Olivier (ex. : parties jouées en soirée, installations Play Store).

# Fragments — schéma des données

**Aucun serveur, aucune base de données, aucun compte, aucune communication entre téléphones.** La partie est décrite
par son code (`BNK-4-7Q2X` : scénario, nombre de joueurs, graine) : chaque téléphone recalcule la même répartition avec `engine.js`.
Tout le reste est stocké sur l'appareil (localStorage du navigateur, ou stockage de l'appli Android).

## Stockage local (localStorage)
| Clé | Contenu | Écrit par |
|---|---|---|
| `fragments.game.v1` | Partie en cours (rôle, siège, étape, chrono…), dont `defi: {key, day, n}` pour un Dossier du jour | `js/app-etat.js` |
| `fragments.settings.v1` | Son, vibrations | `js/app-etat.js` |
| `fragments.lang.v1` | `fr` / `en` (absent = langue du navigateur) | `js/i18n.js` |
| `fragments.defi.v1` | Série du Dossier du jour `{last, count, best, jours}` (30 jours) ; écrite seulement par le MJ ou en solo | `js/defi.js` |

## Données fixes
- `data/index.json` + un fichier par scénario (**intouchable**, non lu pour ces docs).
- `i18n/scenarios/en/*.json` : scénarios anglais générés (mêmes réponses, en français).
- `i18n/strings.json` : textes anglais de l'interface (web et Android).

## Cache hors ligne
Cache du service worker `fragments-v2.11` : copie des fichiers du site, aucune donnée de joueur.

## Caméra
Le scan du QR utilise la caméra du téléphone, seulement sur l'écran « Rejoindre », sans enregistrement ni envoi d'image.

## Données partagées
Texte et image du Dossier du jour, envoyés seulement quand le joueur appuie sur « Partager » (numéro, étoiles, cases, série, lien fixe).

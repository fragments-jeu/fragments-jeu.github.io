# Fragments — architecture (PWA)

## 1. Modules
| Fichier | Rôle |
|---|---|
| `index.html` | coquille, ordre des scripts (`defi.js` en premier) |
| `js/defi.js` | **commun aux 4 jeux** : date de Paris, graine, série, texte partagé. Copie identique dans ÉCHO, LUMEN, Résonance |
| `js/engine.js` | moteur pur (codes, répartition, graines, étoiles, textes de partage, `dailyPick`, `shareDaily`). Parité exacte avec l'appli Android 2.0 (`Engine.kt` + `Daily.kt`, dossier du jour compris), vérifiée par ses tests à partir de vecteurs tirés de ce fichier |
| `js/app.js` | écrans et actions (vanilla JS) — **783 lignes, au-delà du seuil de 400 : écart préexistant** (taille inchangée au 25/10 : « Comment jouer » sorti dans `howto.js`) |
| `js/i18n.js` | langue (fr/en) : détection navigateur, choix mémorisé, `T(texte français, …)`, `TN` (pluriels), dossier des scénarios |
| `js/share-image.js` | carte image 1080×1920 du Dossier du jour (canvas), partage `navigator.share({files, text})`, repli téléchargement |
| `js/autres-jeux.js` | carte « Les autres jeux d'Aulit » (Réglages) ; constante `JEUX` des 4 jeux, textes identiques dans les 4 dépôts |
| `js/howto.js` | écran « Comment jouer » |
| `css/extras.css` | choix de la langue, carte des autres jeux (app.css dépasse déjà 400 lignes) |
| `i18n/strings.json` | textes anglais de l'interface (web **et** appli Android), clé = texte français du code |
| `i18n/scenarios/en/*.json` | scénarios anglais : même structure que `data/`, seuls les textes changent ; générés par `JEUXragments	oolsmake-en.js` depuis `data/` + dictionnaires `tools/i18n/en-*.json` |
| `js/docs.js` | rendu SVG des documents |
| `js/audio.js` | sons WebAudio générés |
| `js/qr.js` | encodeur QR (parité `Qr.kt`) |
| (Android) | `F:\Stream\files\JEUX\fragments\android` : copie exacte de `data/*.json` dans `assets/scenarios/`, `defi.js` porté dans `Defi.kt` (copie de LUMEN), vecteurs `node tools/make-parity.js` (lit ce dépôt sans y écrire) |
| `css/app.css` | thème « dossier sous la lampe » (510 lignes, écart préexistant) |
| `data/*.json` | scénarios (**ne jamais modifier**) |
| `sw.js` | cache d'abord, hors ligne complet |
| `privacy.html` | confidentialité + conditions d'utilisation + mentions légales (lien dans les Réglages) |
| `404.html`, `robots.txt`, `sitemap.xml`, `og-image.png` | page introuvable (chemins absolus), référencement, aperçu des liens 1200×630 |

## 2. Sources de vérité
- Scénarios : `data/index.json` + un fichier par scénario.
- Logique du défi du jour : `js/defi.js` (une seule version pour les 4 jeux, empreinte FNV vérifiée par `tests/defi.test.js`).
- URL de partage du jour : `E.DAILY_URL` dans `js/engine.js`.
- Textes de l'interface : le français est dans le code, l'anglais dans `i18n/strings.json` (un seul fichier pour web + Android).
- Scénarios anglais : dictionnaires `JEUXragments	oolsi18nen-<scénario>.json` → `node tools/make-en.js` (ne modifie jamais `data/`).
- Liens des autres jeux : `JEUX` dans `js/autres-jeux.js` (à remplacer par les liens Play Store à la publication).

## 3. Persistance (localStorage)
- `fragments.game.v1` : partie en cours (dont `defi: { key, day, n }` pour un dossier du jour).
- `fragments.settings.v1` : son, vibrations.
- `fragments.lang.v1` : `fr` ou `en`, choisi dans les Réglages (absent : langue du navigateur, français si elle commence par « fr », anglais sinon).
- `fragments.defi.v1` : série du dossier du jour (`last`, `count`, `best`, 30 derniers `jours`). Écrite par `defi.js`, seulement par le téléphone du MJ ou en mode solo.

## 4. Sécurité
Aucun secret, aucun réseau, aucune donnée personnelle. Le texte partagé ne contient ni score ni paramètre dans l'URL.

## 5. Identité
- Domaine : organisation GitHub `fragments-jeu` → `https://fragments-jeu.github.io/`.
- `id` du manifest : `/fragments/` (ne jamais changer).
- Cache : `fragments-v2.7` ; le SW ne supprime que les caches `fragments-*`.

## 6. Dépendances externes
Aucune. `navigator.share` / presse-papiers facultatifs (repli : zone de texte à copier ; pour l'image : téléchargement du PNG si le partage de fichiers est refusé).

## 7. Plan de tests
`node --test` à la racine :
- `tests/defi.test.js` (commun aux 4 jeux) : vecteurs FNV/graines, date de Paris = `Intl` toutes les heures 2026-2035, série, texte partagé, partage, empreinte du fichier, ordre des scripts, cache SW.
- `tests/fragments-jour.test.js` : scénario/graine du 24/10/2026 (faux index, `data/` jamais lu), changement à minuit de Paris, code du jour décodable, cases 🟩🟨🟧🟥⬛, abandon non compté.
- `tests/i18n.test.js` : scénarios anglais = français (structure, réponses, mots de passage, nombres, `**`, caviardage ; `setupGame` identique pour 3 à 6 joueurs × 5 graines), initiales des livres du manoir, chaque `T(…)` du code a son anglais, mêmes `{0}`, détection de langue, textes partagés anglais.
- `tests/partage-image.test.js` : cases de la carte, partage de fichier / annulation / repli téléchargement (faux navigateur), autres jeux.
Vérification navigateur : Chrome sans tête piloté par CDP (accueil, création, partie solo, fin, repli de partage). Le 25/10 (lots 4-7) : parcours complet FR et EN dans jsdom (accueil, réglages, aide, dossier du jour en solo, 5 énigmes, fin, texte partagé) et rendu de la carte image avec @napi-rs/canvas, sans Chrome.

## 8. Risques connus
Voir `PIEGES.md`.

# Fragments — architecture (PWA)

## 0. Lot 18 (25/10/2026) — découpage (refactorisation pure, aucun changement de comportement) — **fait**, plan suivi tel quel
Objectif : plus aucun fichier au-delà de ~400 lignes, une responsabilité par fichier, rendu / FR-EN / clés de sauvegarde / id du manifest / parité Android inchangés.
1. **Filet d'abord** : parcours jsdom FR + EN (solo du jour complet avec indice, erreur, fouille, « forcer », trouvailles, pause, fin, partage manuel ; MJ lobby → abandon ; joueur code → siège → fouille → mot faux/juste → quitter → reprendre) qui enregistre le DOM complet + `localStorage` à 44 étapes par langue. Instantané « avant » pris sur le code d'origine ; « après » doit être identique à l'octet. Ajout d'un test `node --test` sans dépendance : chaque script/feuille de `index.html` existe et est dans le cache de `sw.js`, `defi.js` reste premier, le CSS découpé recolle à l'identique.
2. **`js/app.js` (783) → 5 fichiers chargés dans cet ordre, après `share-image.js`** (aucune dépendance vers l'avant, donc les fonctions sont prises dans `window.FragApp` au chargement) :
   `app-etat.js` (état partagé `S.game`/`S.view`/`S.INDEX`, stockage, icônes, données, chrono, verrouillage d'écran, navigation `go`/`toast`/`overlay`/`topbar`) →
   `app-joueur.js` (vue joueur : fouille, trouvailles, feuilles, mot de passage) →
   `app-mj.js` (lobby, console, serrure, solo, fin de partie, dossier du jour enregistré, écran de fin) →
   `app-accueil.js` (accueil, création, rejoindre + scan QR, comment jouer, réglages) →
   `app.js` (actions des boutons, clavier, toucher direct, démarrage).
   Seul changement de code : les variables réassignées (`game`, `view`, `INDEX`, `tickTimer`) deviennent `S.game`… ; le reste est déplacé tel quel.
3. **`css/app.css` (512) → 4 feuilles contiguës** sans toucher une règle : `app.css` (base, barre du haut, accueil, boutons), `ecrans.css` (création, lobby, console, serrure, surcouches, fin, vue joueur), `documents.css` (documents + comment jouer), `fouille.css` (fouille, trouvailles, feuille, dossier du jour) ; `extras.css` reste en dernier.
4. `sw.js` : nouvelle liste + `fragments-v2.8`. `tests/i18n.test.js` : la liste des fichiers scannés pour `T(…)` suit les nouveaux modules.
5. Android : mesuré, aucun fichier Kotlin > 400 lignes (max `ui/Figures.kt` 371) → rien à découper, AAB/APK non refaits.

## 1. Modules
| Fichier | Rôle |
|---|---|
| `index.html` | coquille, ordre des scripts (`defi.js` en premier, `app.js` en dernier) et des feuilles |
| `js/defi.js` | **commun aux 4 jeux** : date de Paris, graine, série, texte partagé. Copie identique dans ÉCHO, LUMEN, Résonance |
| `js/engine.js` | moteur pur (codes, répartition, graines, étoiles, textes de partage, `dailyPick`, `shareDaily`). Parité exacte avec l'appli Android 2.0 (`Engine.kt` + `Daily.kt`, dossier du jour compris), vérifiée par ses tests à partir de vecteurs tirés de ce fichier |
| `js/app-etat.js` (122) | état partagé `window.FragApp` : `S.game`, `S.view`, `S.INDEX`, `S.tickTimer` (seules valeurs réassignées), stockage, icônes, chargement des données, dossier du jour (helpers), chrono, verrouillage d'écran, `go` / `toast` / `overlay` / `topbar`, registres `SCREENS` / `AFTER` |
| `js/app-joueur.js` (251) | vue joueur : fouille, cachettes, « maintenir pour forcer », trouvailles, balayage, écran `player` + mot de passage |
| `js/app-mj.js` (186) | lobby + QR, console MJ et serrure, mode solo (onglets), chrono, résolution d'énigme, `finish`, dossier du jour enregistré, écran de fin |
| `js/app-accueil.js` (120) | accueil, création (`draft`, `newGame`), rejoindre + scan QR, comment jouer, réglages |
| `js/app.js` (136) | actions des boutons, clavier physique, toucher direct, démarrage ; expose `window.__frag` (tests) |
| `js/i18n.js` | langue (fr/en) : détection navigateur, choix mémorisé, `T(texte français, …)`, `TN` (pluriels), dossier des scénarios |
| `js/share-image.js` | carte image 1080×1920 du Dossier du jour (canvas), partage `navigator.share({files, text})`, repli téléchargement |
| `js/autres-jeux.js` | carte « Les autres jeux d'Aulit » (Réglages) ; constante `JEUX` des 4 jeux, textes identiques dans les 4 dépôts |
| `js/howto.js` | écran « Comment jouer » |
| `css/extras.css` | choix de la langue, carte des autres jeux (chargée en dernier) |
| `i18n/strings.json` | textes anglais de l'interface (web **et** appli Android), clé = texte français du code |
| `i18n/scenarios/en/*.json` | scénarios anglais : même structure que `data/`, seuls les textes changent ; générés par `JEUX\fragments\tools\make-en.js` depuis `data/` + dictionnaires `tools/i18n/en-*.json` |
| `js/docs.js` | rendu SVG des documents |
| `js/audio.js` | sons WebAudio générés |
| `js/qr.js` | encodeur QR (parité `Qr.kt`) |
| (Android) | `F:\Stream\files\JEUX\fragments\android` : copie exacte de `data/*.json` dans `assets/scenarios/`, `defi.js` porté dans `Defi.kt` (copie de LUMEN), vecteurs `node tools/make-parity.js` (lit ce dépôt sans y écrire) |
| `css/app.css` (137) | thème « dossier sous la lampe » : variables, base, barre du haut, accueil, boutons |
| `css/ecrans.css` (149) | création, lobby, console, serrure, onglets, surcouches, fin, vue joueur |
| `css/documents.css` (123) | les 8 styles de documents + comment jouer (+ réduction des animations) |
| `css/fouille.css` (103) | fouille, trouvailles, feuille de fouille, Dossier du jour |
| `data/*.json` | scénarios (**ne jamais modifier**) |
| `sw.js` | cache d'abord, hors ligne complet |
| `privacy.html` | confidentialité + conditions d'utilisation + mentions légales (lien dans les Réglages) |
| `404.html`, `robots.txt`, `sitemap.xml`, `og-image.png` | page introuvable (chemins absolus), référencement, aperçu des liens 1200×630 |

Accessibilité : chaque écran est rendu dans un `<main class="screen">` (modèle repris le 28/10 par LUMEN, ÉCHO et Résonance) ; pas de pied de page, lien `privacy.html` dans les Réglages.
Documents de cadrage dans `docs/` : `PRD.md`, `TRD.md`, `APP_FLOW.md`, `DESIGN_BRIEF.md`, `BACKEND_SCHEMA.md`, `IMPLEMENTATION_PLAN.md`.

## 2. Sources de vérité
- Scénarios : `data/index.json` + un fichier par scénario.
- Logique du défi du jour : `js/defi.js` (une seule version pour les 4 jeux, empreinte FNV vérifiée par `tests/defi.test.js`).
- URL de partage du jour : `E.DAILY_URL` dans `js/engine.js`.
- Textes de l'interface : le français est dans le code, l'anglais dans `i18n/strings.json` (un seul fichier pour web + Android).
- Scénarios anglais : dictionnaires `JEUX\fragments\tools\i18n\en-<scénario>.json` → `node tools/make-en.js` (ne modifie jamais `data/`).
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
- Cache : `fragments-v2.14` ; le SW ne supprime que les caches `fragments-*`.

## 6. Dépendances externes
Aucune. `navigator.share` / presse-papiers facultatifs (repli : zone de texte à copier ; pour l'image : téléchargement du PNG si le partage de fichiers est refusé).

## 7. Plan de tests
`node --test` à la racine :
- `tests/defi.test.js` (commun aux 4 jeux) : vecteurs FNV/graines, date de Paris = `Intl` toutes les heures 2026-2035, série, texte partagé, partage, empreinte du fichier, ordre des scripts, cache SW.
- `tests/fragments-jour.test.js` : scénario/graine du 24/10/2026 (faux index, `data/` jamais lu), changement à minuit de Paris, code du jour décodable, cases 🟩🟨🟧🟥⬛, abandon non compté.
- `tests/i18n.test.js` : scénarios anglais = français (structure, réponses, mots de passage, nombres, `**`, caviardage ; `setupGame` identique pour 3 à 6 joueurs × 5 graines), initiales des livres du manoir, chaque `T(…)` du code a son anglais, mêmes `{0}`, détection de langue, textes partagés anglais.
- `tests/partage-image.test.js` : cases de la carte, partage de fichier / annulation / repli téléchargement (faux navigateur), autres jeux.
- `tests/structure.test.js` (lot 18) : chaque script / feuille de `index.html` existe et est dans le cache de `sw.js` (et inversement), `defi.js` premier, `app.js` dernier, `extras.css` dernière, aucun module au-delà de 420 lignes.
Non-régression du lot 18 : parcours jsdom FR + EN (44 étapes par langue : solo du jour complet, indice, erreur, fouille, forcer, trouvailles, pause, fin, partage manuel ; MJ lobby → abandon ; joueur code → siège → fouille → mot faux/juste → quitter → reprendre), DOM complet + `localStorage` identiques à l'octet avant/après ; CSS recollé = `app.css` d'origine à l'identique. Outil hors dépôt (jsdom non installé ici) : `JEUX\fragments\tools\parcours-jsdom.js` (à lancer sur une copie du site avant puis après une modification, et comparer les deux sorties).
Vérification navigateur : Chrome sans tête piloté par CDP (accueil, création, partie solo, fin, repli de partage). Le 25/10 (lots 4-7) : parcours complet FR et EN dans jsdom (accueil, réglages, aide, dossier du jour en solo, 5 énigmes, fin, texte partagé) et rendu de la carte image avec @napi-rs/canvas, sans Chrome.

## 8. Risques connus
Voir `PIEGES.md`.

## Statistiques de visite (28/10/2026)
GoatCounter sans cookie, chemins `/fragments/…`, chargé par le script d'une ligne en fin de `index.html` uniquement sur `*.github.io` et sans `skipgc` (détail : `docs/TRD.md`, section Traceurs). `privacy.html` le déclare dans toutes ses langues, avec le bouton « Ne pas être compté ». Test : `tests/statistiques.test.js` (identique dans les 4 jeux, seul `PREFIXE` change).

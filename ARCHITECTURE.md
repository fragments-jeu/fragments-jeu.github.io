# Fragments — architecture (PWA)

## 1. Modules
| Fichier | Rôle |
|---|---|
| `index.html` | coquille, ordre des scripts (`defi.js` en premier) |
| `js/defi.js` | **commun aux 4 jeux** : date de Paris, graine, série, texte partagé. Copie identique dans ÉCHO, LUMEN, Résonance |
| `js/engine.js` | moteur pur (codes, répartition, graines, étoiles, textes de partage, `dailyPick`, `shareDaily`). Parité avec `Engine.kt` sauf le dossier du jour |
| `js/app.js` | écrans et actions (vanilla JS) — **783 lignes, au-delà du seuil de 400 : écart préexistant** |
| `js/docs.js` | rendu SVG des documents |
| `js/audio.js` | sons WebAudio générés |
| `js/qr.js` | encodeur QR (parité `Qr.kt`) |
| `css/app.css` | thème « dossier sous la lampe » (510 lignes, écart préexistant) |
| `data/*.json` | scénarios (**ne jamais modifier**) |
| `sw.js` | cache d'abord, hors ligne complet |
| `privacy.html` | confidentialité + conditions d'utilisation + mentions légales (lien dans les Réglages) |
| `404.html`, `robots.txt`, `sitemap.xml`, `og-image.png` | page introuvable (chemins absolus), référencement, aperçu des liens 1200×630 |

## 2. Sources de vérité
- Scénarios : `data/index.json` + un fichier par scénario.
- Logique du défi du jour : `js/defi.js` (une seule version pour les 4 jeux, empreinte FNV vérifiée par `tests/defi.test.js`).
- URL de partage du jour : `E.DAILY_URL` dans `js/engine.js`.

## 3. Persistance (localStorage)
- `fragments.game.v1` : partie en cours (dont `defi: { key, day, n }` pour un dossier du jour).
- `fragments.settings.v1` : son, vibrations.
- `fragments.defi.v1` : série du dossier du jour (`last`, `count`, `best`, 30 derniers `jours`). Écrite par `defi.js`, seulement par le téléphone du MJ ou en mode solo.

## 4. Sécurité
Aucun secret, aucun réseau, aucune donnée personnelle. Le texte partagé ne contient ni score ni paramètre dans l'URL.

## 5. Identité
- Domaine : organisation GitHub `fragments-jeu` → `https://fragments-jeu.github.io/`.
- `id` du manifest : `/fragments/` (ne jamais changer).
- Cache : `fragments-v2.4` ; le SW ne supprime que les caches `fragments-*`.

## 6. Dépendances externes
Aucune. `navigator.share` / presse-papiers facultatifs (repli : zone de texte à copier).

## 7. Plan de tests
`node --test` à la racine :
- `tests/defi.test.js` (commun aux 4 jeux) : vecteurs FNV/graines, date de Paris = `Intl` toutes les heures 2026-2035, série, texte partagé, partage, empreinte du fichier, ordre des scripts, cache SW.
- `tests/fragments-jour.test.js` : scénario/graine du 24/10/2026 (faux index, `data/` jamais lu), changement à minuit de Paris, code du jour décodable, cases 🟩🟨🟧🟥⬛, abandon non compté.
Vérification navigateur : Chrome sans tête piloté par CDP (accueil, création, partie solo, fin, repli de partage).

## 8. Risques connus
Voir `PIEGES.md`.

# Fragments — brief de design (identité réelle)

## Direction
« Dossier sous la lampe » : bureau d'acier olive, papiers vieillis, voyants ambrés, tampons. Chaque scénario repeint le bureau
(`data-theme` sur `<body>`). Logo FRAGMENTS en papiers déchirés / découpés.

## Couleurs (`css/app.css`, `:root`)
| Rôle | Valeur |
|---|---|
| Bureau (fond) | `--desk` #1b211a, `--desk-2` #252c22, `--desk-3` #323b2e, filets `--rule` #48543f |
| Texte | `--chalk` #e4e6d6 ; secondaire `--chalk-dim` #a7ad97 |
| Lampe / accent | `--glow` #ffb24a (halo `--glow-ghost`) |
| Papier | `--paper` #e8dec6, `--paper-2` #d9cba9, encre `--ink` #26211a, `--ink-soft` #5b5244 |
| Tampon / alerte | `--red` #b8322a |

## Typographie (fichiers locaux, licence OFL)
- Titres : **Big Shoulders Stencil Display** 700/900 (pochoir).
- Interface : **Big Shoulders Text** 400/600/800.
- Documents : **Courier Prime** (machine à écrire) ; annotations : **Caveat** (manuscrit).

## Formes et mouvement
8 styles de documents dessinés en SVG (fiches, plans, journaux…), cases d'étoiles dessinées, halo de lampe sur l'accueil.
Animations réduites si « mouvement réduit ». Carte de partage 1080×1920 : FRAGMENTS en papiers découpés, chemise, tampon.

## Accessibilité
Contraste AA (sous-titres, tampon, exemple du champ code corrigés le 25/10), `<main>` par écran, `<h1>` masqué sur l'accueil, `aria-live` sur `#app`.

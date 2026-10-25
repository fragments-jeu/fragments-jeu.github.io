# Fragments — à faire

## Fait
- 24/10 : « Dossier du jour » (idée 14) : dossier sur l'accueil entre « Créer une partie » et « Rejoindre », scénario et graine communs à tous (minuit heure de Paris), aussi en mode test solo, série de jours, écran de fin avec série, record, compte à rebours et partage en un message (repli zone de texte). Module commun `js/defi.js`, tests `node --test` (16 verts), cache `fragments-v2.3`.
- 24/10 : correctif des icônes géantes dans les boutons (« Partager le résultat », « Scanner le QR »).
- 24/10 : création de README, ARCHITECTURE, PIEGES, A_FAIRE.

## En cours

## À faire
- Android (`JEUX\fragments\android`) : bouton « Dossier du jour » côté appli (facultatif : rejoindre marche déjà).
- Découper `js/app.js` (783 lignes) et `css/app.css` (510 lignes) sous le seuil de 400 lignes.
- Les tests de `JEUX\fragments\tests` pointent vers l'ancienne copie `pwa\` (12/10) : les rebrancher sur ce dépôt.

## Décisions prises
- 24/10 : le jour change à minuit heure de Paris pour tout le monde (Q1 de la spec, option appliquée par défaut).
- 24/10 : série quotidienne gardée pour Fragments malgré les parties de 45 min (Q3, par cohérence entre les 4 jeux, en attente de confirmation).
- 24/10 : score du jour = secondes restantes (0 hors temps) ; seul le téléphone du MJ (ou le solo) enregistre ; abandon non compté.
- 24/10 : scénario du jour = scénarios triés par `id`, index = graine modulo leur nombre ; graine de partie = graine modulo 32768.

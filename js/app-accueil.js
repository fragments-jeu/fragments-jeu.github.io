/* FRAGMENTS — accueil, création de partie, rejoindre (code / scan QR), comment jouer, réglages. */
(function () {
  'use strict';
  const F = window.FragApp;
  const { E, $app, esc, S, SCN, settings, icon, glyphSvg, THEME_GLYPH, byPrefix, hydrate, JEU, dailyOf, flame, go, toast, overlay, topbar, SCREENS, AFTER, A, J, I, T } = F;

  SCREENS.home = () => {
    const letters = 'FRAGMENTS'.split('');
    const rot = [-4, 3, -2, 5, -3, 2, -5, 3, -2], dy = [2, -3, 4, -1, 3, -4, 1, -2, 3];
    const title = letters.map((l, i) => '<span class="scrap' + (i === 4 ? ' red' : '') + '" style="--r:' + rot[i] + 'deg;--dx:0px;--dy:' + dy[i] + 'px;--d:' + (i * 60) + 'ms">' + l + '</span>').join('');
    const resume = S.game && !S.game.ended && S.game.role
      ? '<button class="folder alt" data-act="resume"><b>' + T('Reprendre') + '</b><span>' + esc(SCN[S.game.scenarioId] ? SCN[S.game.scenarioId].title : '') + ' — ' + (S.game.role === 'player' ? T('joueur {0}', S.game.playerNo) : S.game.role === 'solo' ? T('mode test') : T('maître du jeu')) + '</span>' + icon('resume') + '</button>'
      : '';
    return '<div class="lamp" aria-hidden="true"></div><main class="screen home">' +
      '<div class="title-wrap"><h1 class="sr">' + T('Fragments, party game entre amis sur téléphone') + '</h1><div class="scraps" aria-hidden="true">' + title + '</div>' +
      '<p class="subtitle">' + T('Chacun tient une pièce du dossier. Personne ne s\'en sortira seul.') + '</p></div>' +
      '<nav class="folders">' + resume +
      '<button class="folder" data-act="create"><b>' + T('Créer une partie') + '</b><span>' + T('Ce téléphone devient le maître du jeu') + '</span>' + icon('lock') + '</button>' +
      dailyFolder() +
      '<button class="folder" data-act="join"><b>' + T('Rejoindre') + '</b><span>' + T('Avec le code ou le QR du maître du jeu') + '</span>' + icon('join') + '</button>' +
      '</nav>' +
      '<div class="minor"><button data-act="solo">' + icon('solo') + T('Mode test solo') + '</button><button data-act="howto">' + icon('help') + T('Comment jouer') + '</button><button data-act="settings">' + icon('gear') + T('Réglages') + '</button></div>' +
      '</main>';
  };

  function dailyFolder() {
    const t = J.today(), sc = dailyOf(t).scenario, done = J.load(JEU).jours[t.key];
    const etat = done ? T('fait ✓') + (done.score ? ' ' + '★'.repeat(E.stars(done.score, false)) : '') : T('à faire');
    return '<button class="folder daily" data-act="daily"><b>' + T('Dossier du jour') + '</b><span>#' + t.n + ' · ' + esc(sc.title) + ' · ' + etat + flame(J.serie(JEU, t)) + '</span>' +
      icon('daily') + '<i class="stamp" aria-hidden="true">N° ' + t.n + '</i></button>';
  }

  // ---- création ----
  const draft = { scenarioId: 'bunker', players: 4, solo: false };
  SCREENS.create = () => {
    const dossiers = S.INDEX.scenarios.filter((s) => !draft.defi || s.id === draft.scenarioId).map((s) => '<button class="dossier" data-theme="' + s.theme + '" data-pick="' + s.id + '" aria-pressed="' + (draft.scenarioId === s.id) + '">' +
      '<span class="seal">' + glyphSvg(THEME_GLYPH[s.theme]) + '</span><b>' + esc(s.title) + '</b><i>' + esc(s.tagline) + '</i><small>' + s.year + ' — ' + T('difficulté') + ' ' + '●'.repeat(s.difficulty) + '○'.repeat(3 - s.difficulty) + '</small></button>').join('');
    const counts = [3, 4, 5, 6].map((n) => '<button data-n="' + n + '" aria-pressed="' + (draft.players === n) + '">' + n + '</button>').join('');
    const jour = draft.solo && !draft.defi ? '<button class="btn ghost" data-act="daily" style="margin-top:12px">' + icon('daily') + ' ' + T('Dossier du jour #{0}', J.today().n) + '</button>' : '';
    return '<main class="screen">' + topbar(draft.defi ? T('Dossier du jour #{0}', draft.defi.n) : T(draft.solo ? 'Mode test solo' : 'Nouvelle partie'), 'home') +
      '<div class="label" style="margin-top:4px">' + T(draft.defi ? 'Scénario du jour, le même pour tous' : 'Scénario') + '</div><div class="dossiers">' + dossiers + '</div>' + jour +
      '<div class="label">' + T(draft.solo ? 'Nombre de joueurs simulés' : 'Nombre de joueurs') + '</div><div class="counter" role="group" aria-label="' + T('Nombre de joueurs') + '">' + counts + '</div>' +
      '<div class="grow"></div><div style="margin-top:22px"><button class="btn" data-act="doCreate">' + T(draft.solo ? 'Lancer le test' : 'Générer le code') + '</button></div></main>';
  };

  function newGame(role) {
    const seed = draft.defi ? dailyOf(draft.defi).seed : crypto.getRandomValues(new Uint16Array(1))[0] % E.SEED_MAX;
    const sc = SCN[draft.scenarioId];
    return hydrate({ defi: draft.defi || null,
      role, scenarioId: sc.id, players: draft.players, seed, code: E.encodeCode(sc.prefix, draft.players, seed),
      stage: 0, started: false, runningSince: 0, elapsedBefore: 0, paused: false, penalty: 0,
      hints: sc.stages.map(() => 0), wrong: 0, lastWord: null, ended: null, soloView: 0
    });
  }

  // ---- rejoindre ----
  SCREENS.join = () => '<main class="screen">' + topbar(T('Rejoindre'), 'home') +
    '<div class="label">' + T('Code donné par le maître du jeu') + '</div>' +
    '<input class="codefield" data-codein inputmode="text" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="BNK-4-XXXX" maxlength="12" value="' + esc(S.view.prefill || '') + '" aria-label="' + T('Code de la partie') + '">' +
    '<div class="err" data-err role="alert"></div>' +
    ('BarcodeDetector' in window ? '<button class="btn ghost" data-act="scan" style="margin-top:4px">' + icon('scan') + ' ' + T('Scanner le QR') + '</button>' : '<p class="prompt">' + T('Astuce : scannez le QR avec l\'appareil photo du téléphone, la partie s\'ouvre directement.') + '</p>') +
    '<div data-seat></div><div class="grow"></div></main>';
  AFTER.join = () => {
    const inp = $app.querySelector('[data-codein]');
    const check = () => {
      const raw = inp.value;
      const d = E.decodeCode(raw);
      const err = $app.querySelector('[data-err]'), seat = $app.querySelector('[data-seat]');
      const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (!d) {
        err.textContent = clean.length >= 8 ? T('Code inconnu. Vérifiez chaque caractère avec le maître du jeu.') : '';
        seat.innerHTML = ''; return;
      }
      const sc = byPrefix(d.prefix);
      if (!sc) { err.textContent = T('Ce scénario n\'est pas installé sur ce téléphone.'); seat.innerHTML = ''; return; }
      err.textContent = '';
      inp.value = d.code;
      seat.innerHTML = '<div class="label">' + T('{0} — quel joueur êtes-vous ?', esc(sc.title)) + '</div><div class="counter" style="grid-template-columns:repeat(' + Math.min(d.players, 6) + ',1fr)">' +
        [...Array(d.players)].map((_, i) => '<button data-seatn="' + (i + 1) + '">' + (i + 1) + '</button>').join('') + '</div>' +
        '<p class="prompt" style="margin-top:10px">' + T('Chaque joueur doit prendre un numéro différent.') + '</p>';
      S.view.decoded = d;
    };
    inp.addEventListener('input', check);
    check();
    if (!S.view.prefill) inp.focus();
  };

  async function scanQr() {
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    } catch (e) { toast(T('Caméra indisponible')); return; }
    const o = overlay('<h3>' + T('Scanner') + '</h3><video playsinline muted style="width:100%;border-radius:10px;background:#000"></video><button class="btn ghost" data-o="x" style="margin-top:12px">' + T('Annuler') + '</button>', () => { stop(); });
    const video = o.querySelector('video'); video.srcObject = stream; await video.play();
    const det = new window.BarcodeDetector({ formats: ['qr_code'] });
    let alive = true;
    function stop() { alive = false; stream.getTracks().forEach((t) => t.stop()); }
    (async function loop() {
      while (alive) {
        try { const r = await det.detect(video); if (r[0]) { stop(); o.remove(); go('join', { prefill: r[0].rawValue.split('#j=').pop() }); return; } } catch (e) { /* image suivante */ }
        await new Promise((res) => setTimeout(res, 250));
      }
    })();
  }

  // ---- comment jouer / réglages ----
  SCREENS.howto = () => window.FragHowto(T, topbar);
  SCREENS.settings = () => '<main class="screen">' + topbar(T('Réglages'), 'home') +
    langRow() +
    '<div class="toggle"><span>' + T('Son') + '<small>' + T('Ambiance et signaux générés en direct') + '</small></span><button class="switch" role="switch" data-set="sound" aria-checked="' + settings.sound + '" aria-label="' + T('Son') + '"></button></div>' +
    '<div class="toggle"><span>' + T('Vibrations') + '<small>' + T('Retour au toucher et aux réponses') + '</small></span><button class="switch" role="switch" data-set="vibrate" aria-checked="' + settings.vibrate + '" aria-label="' + T('Vibrations') + '"></button></div>' +
    '<div class="toggle"><span>' + T('Partie en cours') + '<small>' + T(S.game && !S.game.ended ? 'Une partie est sauvegardée sur ce téléphone' : 'Aucune') + '</small></span><button class="btn danger" data-act="wipe" style="min-height:44px;font-size:17px" ' + (S.game ? '' : 'disabled') + '>' + T('Effacer') + '</button></div>' +
    '<p class="prompt" style="margin-top:20px">' + T('Fragments fonctionne sans connexion. Les parties restent sur ce téléphone.') + '</p>' +
    window.FragAutresJeux.html(T) +
    '<p class="prompt"><a class="legal" href="privacy.html' + (I.lang === 'en' ? '#en' : '') + '">' + T('Confidentialité, conditions et mentions légales') + '</a></p></main>';
  const langRow = () => '<div class="toggle"><span>' + T('Langue') + '<small>' + T('Interface et scénarios') + '</small></span><div class="langs" role="group" aria-label="' + T('Langue') + '">' +
    [['fr', 'FR'], ['en', 'EN']].map(([l, n]) => '<button data-lang="' + l + '" aria-pressed="' + (I.lang === l) + '" lang="' + l + '">' + n + '</button>').join('') + '</div></div>';

  Object.assign(F, { dailyFolder, draft, newGame, scanQr, langRow });
})();

/* FRAGMENTS — actions des boutons, clavier, toucher direct, démarrage (dernier script chargé). */
(function () {
  'use strict';
  const F = window.FragApp;
  const { E, $app, esc, LS_GAME, S, SCN, settings, save, saveGame, buzz, loadData, byPrefix, hydrate, dailyOf, elapsed, keepAwake, go, toast, overlay, A, J, I, T, TN, LS_SET, ui, invGo, answerOf, refreshConsole, pressKey, showWord, finish, draft, newGame, scanQr } = F;

  // =============== ACTIONS ===============
  const ACTIONS = {
    home: () => go('home'),
    howto: () => go('howto'),
    settings: () => go('settings'),
    create: () => { draft.solo = false; draft.defi = null; go('create'); },
    daily: () => { const t = J.today(); draft.solo = S.view.name === 'create' && draft.solo; draft.defi = { key: t.key, day: t.day, n: t.n }; draft.scenarioId = dailyOf(t).scenario.id; go('create'); },
    solo: () => { draft.solo = true; draft.defi = null; draft.players = Math.max(draft.players, 3); go('create'); },
    join: () => go('join'),
    scan: scanQr,
    resume: () => resumeGame(),
    doCreate: () => {
      S.game = newGame(draft.solo ? 'solo' : 'host'); saveGame();
      if (draft.solo) { startClock(); go('solo'); } else go('lobby');
    },
    startClock: () => { startClock(); go('host'); },
    // Bouton pause : arrête le chrono et ouvre la feuille Reprendre / Recommencer / Menu (même feuille dans les 4 jeux).
    // Partie déjà en pause (reprise depuis l'accueil) : le bouton ▶ relance le chrono directement.
    pause: () => { if (S.game.paused) reprendreChrono(); else ouvrirPause(); },
    hint: () => {
      const n = S.game.hints[S.game.stage];
      if (n >= 3) return;
      overlay('<h3>' + T('Indice {0}', n + 1) + '</h3><p>' + TN(E.HINT_COST[n] / 60, 'Il coûte {0} minute au chrono. Le groupe est d\'accord ?', 'Il coûte {0} minutes au chrono. Le groupe est d\'accord ?') + '</p><div class="row"><button class="btn ghost" data-o="no">' + T('Annuler') + '</button><button class="btn" data-o="yes">' + T('Révéler') + '</button></div>', (o) => {
        if (o !== 'yes') return;
        S.game.penalty += E.HINT_COST[n]; S.game.hints[S.game.stage] = n + 1; saveGame(); A.play('hint'); buzz(20); refreshConsole(); F.penaltyFloat(E.HINT_COST[n]);
      });
    },
    showWord: () => showWord(false),
    abandon: () => {
      overlay('<h3>' + T('Abandonner ?') + '</h3><p>' + T('Le chrono s\'arrête et la partie est perdue.') + '</p><div class="row"><button class="btn ghost" data-o="no">' + T('Continuer') + '</button><button class="btn danger" data-o="yes">' + T('Abandonner') + '</button></div>', (o) => { if (o === 'yes') finish(false, 'abandon'); });
    },
    quitGame: () => { S.game = null; saveGame(); go('home'); },
    share: async () => {
      const text = S.game.ended.share, r = await J.share(text); // null : partage annulé
      if (!r) return;
      const msg = T({ partage: 'Résultat partagé', copie: 'Résultat copié', manuel: 'Copiez le texte ci-dessous' }[r]);
      const st = $app.querySelector('[data-sharestatus]'), box = $app.querySelector('[data-sharebox]');
      if (st) st.textContent = msg;
      if (r === 'copie') toast(msg);
      if (r === 'manuel' && box) {
        box.innerHTML = '<label class="label" for="shareTa">' + T('Texte à copier') + '</label><textarea id="shareTa" class="share-ta" readonly rows="6">' + esc(text) + '</textarea>';
        const ta = box.querySelector('textarea'); ta.focus(); ta.select();
      }
    },
    shareImage: () => window.FragShareImage.run(S.game, T, $app.querySelector('[data-sharestatus]'), toast), // carte 1080×1920 : js/share-image.js
    newGame: () => { S.game = null; saveGame(); go('home'); },
    leave: () => {
      if (S.game && S.game.ended) { S.game = null; saveGame(); go('home'); return; }
      overlay('<h3>' + T('Quitter la partie ?') + '</h3><p>' + T('Vous pourrez la reprendre depuis l\'accueil.') + '</p><div class="row"><button class="btn ghost" data-o="no">' + T('Rester') + '</button><button class="btn" data-o="yes">' + T('Quitter') + '</button></div>', (o) => { if (o === 'yes') { keepAwake(false); A.stopDrone(); go('home'); } });
    },
    wipe: () => { S.game = null; saveGame(); toast(T('Partie effacée')); go('settings'); }
  };
  const vueMJ = () => (S.game.role === 'solo' ? 'solo' : 'host');
  function reprendreChrono() {
    S.game.paused = false; S.game.runningSince = Date.now(); A.startDrone(S.game.scenarioId); keepAwake(true);
    saveGame(); go(vueMJ(), { entry: S.view.entry });
  }
  function ouvrirPause() {
    if (!S.game.paused) { S.game.elapsedBefore = elapsed(S.game); S.game.paused = true; S.game.runningSince = 0; A.stopDrone(); saveGame(); go(vueMJ(), { entry: S.view.entry }); }
    overlay('<div class="pause-card"><h3>' + T('Pause') + '</h3><p class="tc">' + T('Le chrono est arrêté.') + '</p><div class="stack">' +
      '<button class="btn" data-o="resume">' + T('Reprendre') + '</button>' +
      '<button class="btn ghost" data-o="restart">' + T('Recommencer') + '</button>' +
      '<button class="btn ghost" data-o="menu">' + T('Menu') + '</button></div></div>', (o) => {
      if (o === 'resume') reprendreChrono();
      else if (o === 'restart') { // même scénario, même code : chrono, énigmes, indices et erreurs remis à zéro
        Object.assign(S.game, { stage: 0, started: false, runningSince: 0, elapsedBefore: 0, paused: false, penalty: 0, hints: S.game.hints.map(() => 0), wrong: 0, lastWord: null, ended: null });
        saveGame();
        if (S.game.role === 'solo') { startClock(); go('solo', { entry: '' }); } else go('lobby');
      } else if (o === 'menu') go('home'); // partie gardée en pause : « Reprendre » sur l'accueil
    });
  }
  // Bouton Retour du téléphone : ferme la fenêtre ouverte, ouvre la pause en partie, sinon revient à l'accueil.
  function boutonRetour() {
    const o = document.querySelector('.overlay');
    if (o) { const b = o.querySelector('[data-o=resume], [data-o=no], [data-o=x], [data-o=ok]'); if (b) b.click(); else o.remove(); return; }
    const sh = document.querySelector('.sheet-wrap');
    if (sh) { sh.remove(); return; }
    const v = S.view.name;
    if ((v === 'host' || v === 'solo') && S.game && !S.game.ended) ouvrirPause();
    else if (v === 'player' && S.game) ACTIONS.leave();
    else if (v === 'end' && S.game) ACTIONS.newGame();
    else go('home'); // création, rejoindre, comment jouer, réglages, salle d'attente (partie gardée : « Reprendre »)
  }
  window.addEventListener('popstate', () => {
    if (F.hist.retour) { F.hist.retour = false; F.histSync(); return; }
    F.hist.pose = false; boutonRetour(); F.histSync();
  });
  function startClock() {
    S.game.started = true; S.game.paused = false; S.game.runningSince = Date.now(); saveGame();
    A.unlock(); A.startDrone(S.game.scenarioId); keepAwake(true);
  }
  function resumeGame() {
    if (!S.game) return go('home');
    hydrate(S.game);
    A.unlock();
    if (S.game.ended && S.game.role !== 'player') return go('end');
    if (S.game.role === 'player') { keepAwake(true); A.startDrone(S.game.scenarioId); return go('player'); }
    if (!S.game.started) return go('lobby');
    if (!S.game.paused) { A.startDrone(S.game.scenarioId); keepAwake(true); }
    go(S.game.role === 'solo' ? 'solo' : 'host', { entry: '' });
  }

  $app.addEventListener('click', (e) => {
    A.unlock();
    const t = e.target.closest('button');
    if (!t) return;
    if (t.dataset.act && ACTIONS[t.dataset.act]) { ACTIONS[t.dataset.act](); return; }
    if (t.dataset.k && !t.closest('[data-pview]')) { pressKey(t.dataset.k); return; }
    if (t.dataset.pick) { draft.scenarioId = t.dataset.pick; document.body.dataset.theme = SCN[draft.scenarioId].theme; $app.querySelectorAll('[data-pick]').forEach((b) => b.setAttribute('aria-pressed', b === t)); return; }
    if (t.dataset.n) { draft.players = +t.dataset.n; $app.querySelectorAll('[data-n]').forEach((b) => b.setAttribute('aria-pressed', b === t)); return; }
    if (t.dataset.tab) { S.game.soloView = +t.dataset.tab; saveGame(); go('solo', { entry: S.view.entry, ui: S.view.ui, forced: S.view.forced }); return; }
    if (t.dataset.lang) { if (t.dataset.lang !== I.lang) { I.setLang(t.dataset.lang); location.reload(); } return; }
    if (t.dataset.set) { settings[t.dataset.set] = !settings[t.dataset.set]; save(LS_SET, settings); A.setEnabled(settings.sound); F.applyMotion(); t.setAttribute('aria-checked', settings[t.dataset.set]); if (t.dataset.set === 'vibrate') buzz(30); return; }
    if (t.dataset.seatn) {
      const d = S.view.decoded, sc = byPrefix(d.prefix);
      S.game = hydrate({ role: 'player', scenarioId: sc.id, players: d.players, seed: d.seed, code: d.code, playerNo: +t.dataset.seatn, stage: 0, ended: null });
      saveGame(); keepAwake(true); A.startDrone(sc.id); go('player');
    }
  });
  // Toucher direct sur tous les boutons : relâcher le doigt suffit (les navigateurs mobiles avalent parfois
  // le « click » qui suit un balayage). Les contrôles de la vue joueur ont leur propre gestion.
  let ftBtn = null, ftX = 0, ftY = 0;
  document.addEventListener('touchstart', (e) => {
    const b = e.target.closest && e.target.closest('button');
    ftBtn = b && !b.disabled && !b.hasAttribute('data-hold') && !(b.closest('[data-pview]') && b.matches('[data-pv],[data-spot],[data-invstep],[data-inv]')) ? b : null;
    if (ftBtn) { ftX = e.touches[0].clientX; ftY = e.touches[0].clientY; }
  }, { passive: true, capture: true });
  document.addEventListener('touchend', (e) => {
    const b = ftBtn; ftBtn = null;
    if (!b || !b.isConnected) return;
    const c = e.changedTouches[0];
    if (Math.abs(c.clientX - ftX) > 10 || Math.abs(c.clientY - ftY) > 10) return;
    if (document.elementFromPoint(c.clientX, c.clientY) && !b.contains(document.elementFromPoint(c.clientX, c.clientY))) return;
    if (e.cancelable) e.preventDefault();
    b.click();
  }, { capture: true });

  // clavier physique sur la console (utile sur tablette / tests)
  document.addEventListener('keydown', (e) => {
    if (document.querySelector('.sheet-wrap')) { if (e.key === 'Escape') document.querySelector('.sheet-wrap').remove(); return; }
    if (S.game && (e.key === 'ArrowLeft' || e.key === 'ArrowRight') && e.target.tagName !== 'INPUT') {
      const pv = $app.querySelector('[data-pview]');
      if (pv && ui(+pv.dataset.pview).pv === 'inv') { invGo(+pv.dataset.pview, ui(+pv.dataset.pview).idx + (e.key === 'ArrowRight' ? 1 : -1)); e.preventDefault(); return; }
    }
    if (!S.game || !['host', 'solo'].includes(S.view.name) || document.querySelector('.overlay')) return;
    if (S.view.name === 'solo' && S.game.soloView !== 0) return;
    if (e.target.tagName === 'INPUT') return;
    if (e.key === 'Backspace') pressKey('DEL');
    else if (e.key === 'Enter') pressKey('OK');
    else if (/^[a-z0-9]$/i.test(e.key)) pressKey(e.key.toUpperCase());
  });

  // ---------- démarrage ----------
  (async function boot() {
    try { await loadData(); } catch (e) { $app.innerHTML = '<main class="screen"><h2>' + T('Données introuvables') + '</h2><p>' + T('Rechargez la page avec une connexion pour la première installation.') + '</p></main>'; return; }
    if (S.game) { try { hydrate(S.game); } catch (e) { S.game = null; save(LS_GAME, null); } }
    const m = location.hash.match(/j=([A-Za-z0-9-]+)/);
    if (m) { history.replaceState(null, '', location.pathname); go('join', { prefill: m[1] }); }
    else go('home');
    if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
    window.__frag = { get game() { return S.game; }, get view() { return S.view; }, E, go, answerOf: (s) => answerOf(s), submit: (x) => F.submit(x) };
  })();
})();

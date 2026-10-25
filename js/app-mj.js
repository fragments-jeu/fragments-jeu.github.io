/* FRAGMENTS — maître du jeu : lobby, console et serrure, mode solo, fin de partie, dossier du jour, écran de fin. */
(function () {
  'use strict';
  const F = window.FragApp;
  const { E, $app, esc, S, saveGame, buzz, IC, icon, JEU, flame, days, untilMidnight, elapsed, remaining, keepAwake, go, toast, overlay, topbar, SCREENS, AFTER, A, Q, J, I, T, TN, playerView, bindPlayer } = F;

  // ---- lobby MJ ----
  function joinUrl(code) { return location.href.split('#')[0].split('?')[0] + '#j=' + code; }
  SCREENS.lobby = () => {
    const sc = S.game._sc;
    let qr = '';
    try { qr = Q.toSvg(Q.encode(joinUrl(S.game.code)), { fg: '#1d1a14', bg: '#e8dec6' }); } catch (e) { qr = ''; }
    return '<main class="screen">' + topbar(sc.title, 'quitGame') +
      '<div class="ticket-code"><div class="label" style="margin:0">' + T('Code de la partie') + '</div><div class="big" data-code>' + esc(S.game.code) + '</div></div>' +
      '<div class="qr" aria-label="' + T('QR code de la partie') + '">' + qr + '</div>' +
      '<p class="prompt" style="text-align:center">' + T('Les {0} joueurs scannent ce QR ou tapent le code, puis choisissent chacun un numéro différent, de 1 à {0}.', S.game.players) + '</p>' +
      '<div class="intro">' + sc.intro.map((p) => '<p>' + esc(p) + '</p>').join('') + '</div>' +
      '<p class="prompt" style="margin-top:12px">' + T('Lisez ce texte à voix haute, puis lancez le chrono quand tout le monde est prêt.') + '</p>' +
      '<button class="btn" data-act="startClock" style="margin-top:6px">' + T('Lancer le chrono (45:00)') + '</button></main>';
  };

  // ---- console MJ ----
  function lockState() { return S.view.entry || ''; }
  function consoleHtml() {
    const sc = S.game._sc, st = sc.stages[S.game.stage];
    const rem = remaining(S.game);
    const pips = sc.stages.map((_, i) => '<span class="pip ' + (i < S.game.stage ? 'done' : i === S.game.stage ? 'now' : '') + '"></span>').join('');
    const ans = answerOf(S.game.stage);
    const entry = lockState();
    const slots = ans.split('').map((_, i) => '<span class="slot' + (i === entry.length ? ' cur' : '') + '">' + esc(entry[i] || '') + '</span>').join('');
    const kind = st.input;
    let keys;
    if (kind === 'digits') {
      keys = '<div class="keys digits">' + ['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((k) => '<button class="key" data-k="' + k + '">' + k + '</button>').join('') +
        '<button class="key fn" data-k="DEL" aria-label="' + T('Effacer') + '">' + T('Effacer') + '</button><button class="key" data-k="0">0</button><button class="key fn go" data-k="OK">' + T('Valider') + '</button></div>';
    } else {
      const en = I.lang === 'en', rows = en ? ['QWERTYUIOP', 'ASDFGHJKL'] : ['AZERTYUIOP', 'QSDFGHJKLM']; // clavier QWERTY en anglais
      if (kind === 'alnum') rows.unshift('1234567890');
      keys = '<div class="keys letters">' + rows.join('').split('').map((k) => '<button class="key" data-k="' + k + '">' + k + '</button>').join('') +
        (en ? 'ZXCVBNM' : 'WXCVBN').split('').map((k) => '<button class="key" data-k="' + k + '">' + k + '</button>').join('') +
        '<button class="key fn wide" data-k="DEL" aria-label="' + T('Effacer') + '">⌫</button><button class="key fn go wide" data-k="OK">OK</button></div>';
    }
    const nh = S.game.hints[S.game.stage];
    const hints = st.variants[S.game._setup.stages[S.game.stage].variant].hints.slice(0, nh).map((h, i) => '<div class="hint" data-n="' + (i + 1) + '">' + esc(h) + '</div>').join('');
    const hintLabel = nh >= 3 ? T('Plus d\'indice') : T('Indice {0} (−{1}:00)', nh + 1, E.HINT_COST[nh] / 60);
    return '<div class="vfd' + (rem < 300 ? ' low' : '') + (S.game.paused ? ' paused' : '') + '"><div class="time" aria-live="off"><span class="ghost" aria-hidden="true">88:88</span><span class="live" data-time>' + E.fmtTime(rem) + '</span></div>' +
      '<div class="meta"><span>' + T('Énigme {0} sur {1}', S.game.stage + 1, sc.stages.length) + '</span><span class="pips">' + pips + '</span></div></div>' +
      '<div class="stage-head"><h3>' + esc(st.title) + '</h3></div><p class="prompt">' + esc(st.prompt) + '</p>' +
      '<div class="lock"><div class="slots" data-slots aria-label="' + T('Saisie') + '">' + slots + '</div>' + keys + '</div>' +
      '<div class="tools"><button class="btn ghost" data-act="hint" ' + (nh >= 3 ? 'disabled' : '') + '>' + hintLabel + '</button><button class="btn ghost" data-act="showWord" ' + (S.game.lastWord ? '' : 'disabled') + '>' + T('Dernier mot') + '</button></div>' +
      '<div class="hintbox">' + hints + '</div>';
  }
  const answerOf = (s) => E.normalize(S.game._sc.stages[s].variants[S.game._setup.stages[s].variant].answer);

  SCREENS.host = () => '<main class="screen" data-screen="host">' + topbar(S.game._sc.title, null,
    '<button class="iconbtn" data-act="pause" aria-label="' + T(S.game.paused ? 'Reprendre' : 'Pause') + '">' + icon(S.game.paused ? 'play' : 'pause') + '</button><button class="iconbtn" data-act="abandon" aria-label="' + T('Abandonner') + '">' + icon('close') + '</button>') +
    '<div data-console>' + consoleHtml() + '</div></main>';
  AFTER.host = () => { startTick(); };

  // ---- mode solo : console + vues joueurs dans des onglets (pas de balayage : seuls les onglets changent de joueur) ----
  SCREENS.solo = () => {
    const tabs = [T('Console')].concat([...Array(S.game.players)].map((_, i) => T('Joueur {0}', i + 1)));
    const tabHtml = tabs.map((t, i) => '<button role="tab" data-tab="' + i + '" aria-selected="' + (S.game.soloView === i) + '">' + t + '</button>').join('');
    const body = S.game.soloView === 0 ? '<div data-console>' + consoleHtml() + '</div>' : playerView(S.game.soloView, S.game.stage);
    return '<main class="screen" data-screen="solo">' + topbar(S.game._sc.title, null,
      '<button class="iconbtn" data-act="pause" aria-label="' + T(S.game.paused ? 'Reprendre' : 'Pause') + '">' + icon(S.game.paused ? 'play' : 'pause') + '</button><button class="iconbtn" data-act="abandon" aria-label="' + T('Abandonner') + '">' + icon('close') + '</button>') +
      '<div class="tabs" role="tablist">' + tabHtml + '</div>' + body + '</main>';
  };
  AFTER.solo = () => { startTick(); if (S.game.soloView > 0) bindPlayer(S.game.soloView); };

  function startTick() {
    clearInterval(S.tickTimer);
    let lastSec = -1;
    S.tickTimer = setInterval(() => {
      if (!S.game || S.game.ended || !S.game.started) return;
      const rem = remaining(S.game);
      const el = $app.querySelector('[data-time]');
      if (el) el.textContent = E.fmtTime(rem);
      const vfd = $app.querySelector('.vfd');
      if (vfd) vfd.classList.toggle('low', rem < 300);
      const s = Math.floor(rem);
      if (s !== lastSec) { lastSec = s; if (rem < 60 && rem > 0 && !S.game.paused) A.play('tick'); if (s % 5 === 0) saveGame(); }
      if (rem <= 0) finish(false);
    }, 250);
  }
  function refreshConsole() {
    const c = $app.querySelector('[data-console]');
    if (c) c.innerHTML = consoleHtml();
  }

  function pressKey(k) {
    if (S.game.paused) { toast(T('Partie en pause')); return; }
    const ans = answerOf(S.game.stage);
    let entry = S.view.entry || '';
    if (k === 'DEL') entry = entry.slice(0, -1);
    else if (k === 'OK') { submit(entry); return; }
    else if (entry.length < ans.length) entry += k;
    A.play('click'); buzz(8);
    S.view.entry = entry;
    refreshConsole();
    if (entry.length === ans.length && S.game._sc.stages[S.game.stage].input === 'digits') setTimeout(() => { if (S.view.entry === entry) submit(entry); }, 260);
  }
  function submit(entry) {
    const ans = answerOf(S.game.stage);
    if (entry.length < ans.length) { toast(T('Code incomplet')); return; }
    const slots = $app.querySelector('[data-slots]');
    if (E.normalize(entry) === ans) {
      slots && slots.classList.add('right');
      A.play('success'); buzz([30, 40, 80]);
      setTimeout(stageSolved, 650);
    } else {
      S.game.penalty += E.WRONG_COST; S.game.wrong++; saveGame();
      slots && slots.classList.add('wrong');
      A.play('fail'); buzz([120, 60, 120]);
      setTimeout(() => { S.view.entry = ''; refreshConsole(); }, 520);
    }
  }
  function stageSolved() {
    const sc = S.game._sc;
    const word = S.game._setup.words[S.game.stage];
    S.game.lastWord = { stage: S.game.stage, word };
    const last = S.game.stage === sc.stages.length - 1;
    S.view.entry = '';
    if (last) { finish(true); return; }
    S.game.stage++;
    saveGame();
    document.body.classList.add('flash-ok'); setTimeout(() => document.body.classList.remove('flash-ok'), 900);
    showWord(true);
    go(S.game.role === 'solo' ? 'solo' : 'host', { entry: '' });
  }
  function showWord(fresh) {
    const w = S.game.lastWord; if (!w) return;
    const solo = S.game.role === 'solo';
    overlay('<h3>' + T(fresh ? 'Énigme résolue' : 'Mot de passage') + '</h3>' +
      '<p>' + (solo ? T('En vraie partie, chaque joueur taperait ce mot pour débloquer l\'énigme suivante.') : T('Chaque joueur tape ce mot sur son téléphone pour recevoir les pièces de l\'énigme {0}.', w.stage + 2)) + '</p>' +
      '<div class="password" data-word>' + esc(w.word) + '</div><button class="btn" data-o="ok">' + T('C\'est noté') + '</button>', () => {});
  }

  function finish(won, why) {
    if (S.game.ended) return;
    const rem = Math.max(0, remaining(S.game));
    S.game.elapsedBefore = elapsed(S.game); S.game.runningSince = 0; S.game.paused = true;
    const used = E.GAME_SECONDS - rem;
    const nh = S.game.hints.reduce((a, b) => a + b, 0);
    const stars = won ? E.stars(rem, false) : 0;
    S.game.ended = { won, remaining: rem, used, hints: nh, stars, share: E.shareText(S.game._sc.title, stars, used, nh, !won, T), abandon: why === 'abandon' };
    if (S.game.defi && !S.game.ended.abandon) recordDaily(S.game, won ? Math.round(rem) : 0);
    saveGame();
    keepAwake(false); A.stopDrone();
    A.play(won ? 'win' : 'lose'); buzz(won ? [60, 60, 60, 60, 200] : [400]);
    go('end');
  }

  /** Score = secondes restantes (0 hors temps). La série compte pour le jour du lancement (S.game.defi). */
  function recordDaily(g, score) {
    const e = g.ended, avant = J.record(JEU, g.defi, score, '');
    e.share = J.shareText(E.shareDaily({ n: g.defi.n, title: g._sc.title, stars: e.stars, used: e.used, hints: g.hints,
      solved: e.won ? g.hints.length : g.stage, wrong: g.wrong, players: g.players, timedOut: !e.won, serie: avant.count }, T));
    const s = J.record(JEU, g.defi, score, e.share);
    e.daily = { serie: s.count, best: s.best,
      resume: e.won ? T('Dossier du jour {0} clos, {1}, série de {2}', g.defi.n, TN(e.stars, '{0} étoile', '{0} étoiles'), days(s.count)) : T('Dossier du jour {0}, hors temps, série de {1}', g.defi.n, days(s.count)) };
  }

  SCREENS.end = () => {
    const g = S.game, sc = g._sc, e = g.ended;
    const st = [0, 1, 2].map((i) => '<span class="' + (i < e.stars ? 'on' : 'off') + '"><svg viewBox="0 0 24 24"><path d="' + IC.star.match(/d="([^"]+)"/)[1] + '"/></svg></span>').join('');
    const finalWord = e.won && g.lastWord ? '<p class="prompt">' + T('Mot final pour lire l\'épilogue sur les téléphones des joueurs :') + '</p><div class="password" data-word>' + esc(g.lastWord.word) + '</div>' : '';
    return '<main class="screen end">' +
      (g.defi ? '<div class="label daily-tag">' + T('Dossier du jour #{0}', g.defi.n) + '</div>' : '') +
      '<div class="verdict">' + T(e.won ? 'Dossier clos' : e.abandon ? 'Abandon' : 'Temps écoulé') + '</div>' +
      '<p class="prompt">' + esc(sc.title) + '</p>' +
      '<div class="stars" aria-label="' + TN(e.stars, '{0} étoile sur 3', '{0} étoiles sur 3') + '">' + st + '</div>' +
      '<div class="stats"><div><b>' + E.fmtTime(e.used) + '</b><small>' + T('temps') + '</small></div><div><b>' + e.hints + '</b><small>' + TN(e.hints, 'indice', 'indices') + '</small></div><div><b>' + g.wrong + '</b><small>' + TN(g.wrong, 'erreur', 'erreurs') + '</small></div></div>' +
      '<div class="intro" style="text-align:left;margin-bottom:14px">' + (e.won ? sc.ending : sc.failEnding).map((p) => '<p>' + esc(p) + '</p>').join('') + '</div>' +
      (S.game.role === 'host' ? finalWord : '') +
      (e.daily ? '<div class="streak">' + flame(e.daily.serie) + '<span>' + T('Série : {0} (record {1})', days(e.daily.serie), e.daily.best) + '</span><small>' + T('Prochain dossier dans {0}', untilMidnight()) + '</small></div><p class="sr">' + esc(e.daily.resume) + '</p>' : '') +
      (g.defi && e.abandon ? '<p class="prompt">' + T('Abandon : ce dossier du jour ne compte pas pour la série.') + '</p>' : '') +
      '<div class="share-text" data-share' + (e.daily ? ' aria-hidden="true"' : '') + '>' + esc(e.share) + '</div>' +
      '<div class="sr" role="status" aria-live="polite" data-sharestatus></div><div data-sharebox></div>' +
      '<div class="stack"><button class="btn" data-act="share">' + icon('share') + ' ' + T('Partager le résultat') + '</button>' +
      (e.daily ? '<button class="btn ghost" data-act="shareImage">' + icon('share') + ' ' + T('Partager l\'image') + '</button>' : '') +
      '<button class="btn ghost" data-act="newGame">' + T('Retour à l\'accueil') + '</button></div></main>';
  };

  Object.assign(F, { joinUrl, lockState, consoleHtml, answerOf, startTick, refreshConsole, pressKey, submit, stageSolved, showWord, finish, recordDaily });
})();

/* FRAGMENTS — application (vanilla JS, hors ligne, sans serveur). */
(function () {
  'use strict';
  const E = window.FragEngine, D = window.FragDocs, A = window.FragAudio, Q = window.FragQR, J = window.Defi, I = window.FragI18n, T = I.t, TN = I.tn;
  const $app = document.getElementById('app');
  const esc = D.esc;
  const cap = (t) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t);
  const LS_GAME = 'fragments.game.v1', LS_SET = 'fragments.settings.v1';

  // ---------- état ----------
  let INDEX = null;
  const SCN = {};
  let settings = load(LS_SET) || { sound: true, vibrate: true };
  let game = load(LS_GAME); // partie en cours (hôte, joueur ou solo)
  let view = { name: 'home' };
  let tickTimer = null, wakeLock = null;

  function load(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function save(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* stockage indisponible */ } }
  const saveGame = () => save(LS_GAME, game ? plain(game) : null);
  const buzz = (p) => { if (settings.vibrate && navigator.vibrate) navigator.vibrate(p); };
  A.setEnabled(settings.sound);

  // ---------- icônes ----------
  const IC = {
    back: '<path d="M15 5l-7 7l7 7"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    pause: '<path d="M9 5v14M15 5v14"/>',
    play: '<path d="M7 4l13 8l-13 8z"/>',
    gear: '<path d="M12 8.5a3.5 3.5 0 1 0 0 7a3.5 3.5 0 1 0 0-7z"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9L7 7M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
    help: '<path d="M4 4h12l4 4v12H4z"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5V14M12 17v.5"/>',
    solo: '<rect x="4" y="3" width="10" height="16" rx="2"/><path d="M10 7h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-6"/>',
    lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>',
    join: '<path d="M3 7V4h3M18 4h3v3M21 17v3h-3M6 20H3v-3M7 8h4v4H7zM14 8h3M14 12h3M7 15h10"/>',
    share: '<path d="M12 3v12M7 8l5-5l5 5M5 13v7h14v-7"/>',
    bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
    star: '<path d="M12 2l2.9 6.9l7.1.6l-5.4 4.7l1.7 7.3L12 17.6l-6.3 3.9l1.7-7.3L2 9.5l7.1-.6z"/>',
    scan: '<path d="M3 8V4h4M17 4h4v4M21 16v4h-4M7 20H3v-4M3 12h18"/>',
    resume: '<path d="M4 12a8 8 0 1 0 2.3-5.7M4 4v4h4"/><path d="M12 8v4l3 2"/>',
    flame: '<path d="M12 3c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-3.8 2.5-5c.3 1.6 1 2.6 2 3c.4-2.6-.4-5.4.5-8z"/>',
    daily: '<path d="M4 7h16v13H4zM4 7l2-3h12l2 3"/><path d="M9 12h6M9 16h4"/>'
  };
  const icon = (n, cls) => '<svg viewBox="0 0 24 24" aria-hidden="true" ' + (cls ? 'class="' + cls + '"' : '') + '>' + IC[n] + '</svg>';
  const glyphSvg = (n) => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + D.glyphPath(n) + '"/></svg>';
  const THEME_GLYPH = { bunker: 'eclair', train: 'onde', manoir: 'oeil' };

  // ---------- données ----------
  async function loadData() {
    try { I.init(await (await fetch('i18n/strings.json')).json(), navigator); } catch (e) { I.init(null, navigator); }
    document.documentElement.lang = I.lang;
    const dir = I.scenarioDir();
    INDEX = await (await fetch(dir + 'index.json')).json();
    D.setGlyphs(INDEX.glyphs);
    await Promise.all(INDEX.scenarios.map(async (s) => { SCN[s.id] = await (await fetch(dir + s.file)).json(); }));
  }
  const byPrefix = (p) => Object.values(SCN).find((s) => s.prefix === p);

  function hydrate(g) {
    const sc = SCN[g.scenarioId];
    g._sc = sc;
    g._setup = E.setupGame(sc, g.players, g.seed);
    return g;
  }
  function plain(g) { const o = Object.assign({}, g); delete o._sc; delete o._setup; return o; }

  // ---------- dossier du jour (logique commune : js/defi.js) ----------
  const JEU = 'fragments';
  const dailyOf = (t) => E.dailyPick(INDEX.scenarios, J.seed(JEU, t.key));
  const flame = (n) => (n > 0 ? '<span class="flame">' + icon('flame') + n + '</span>' : '');
  const days = (n) => TN(n, '{0} jour', '{0} jours');
  function untilMidnight() { // minuit de Paris = 22 h UTC l'été, 23 h l'hiver
    const p = J.parisDate(), a = Date.UTC(p.y, p.m - 1, p.d + 1) - 7200000;
    const m = Math.max(1, Math.ceil(((J.parisDate(a).key !== p.key ? a : a + 3600000) - Date.now()) / 60000));
    return T('{0} h {1}', Math.floor(m / 60), String(m % 60).padStart(2, '0'));
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && view.name === 'home' && INDEX) go('home'); });

  // ---------- chrono ----------
  function elapsed(g) { return g.elapsedBefore + (g.paused || !g.runningSince ? 0 : (Date.now() - g.runningSince) / 1000); }
  function remaining(g) { return E.GAME_SECONDS - elapsed(g) - g.penalty; }

  // ---------- verrouillage d'écran ----------
  async function keepAwake(on) {
    try {
      if (on && 'wakeLock' in navigator && !wakeLock && document.visibilityState === 'visible') {
        wakeLock = await navigator.wakeLock.request('screen');
        wakeLock.addEventListener('release', () => { wakeLock = null; });
      } else if (!on && wakeLock) { await wakeLock.release(); wakeLock = null; }
    } catch (e) { wakeLock = null; }
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && game && !game.ended) keepAwake(true); });

  // ---------- navigation ----------
  function go(name, extra) {
    view = Object.assign({ name }, extra || {});
    clearInterval(tickTimer); tickTimer = null;
    const theme = game && game.scenarioId && ['host', 'player', 'solo', 'end', 'lobby'].includes(name) ? game.scenarioId : (view.theme || '');
    document.body.dataset.theme = theme;
    const fn = SCREENS[name] || SCREENS.home;
    $app.innerHTML = fn();
    window.scrollTo(0, 0);
    if (AFTER[name]) AFTER[name]();
  }
  function toast(msg) {
    const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
    document.body.appendChild(t); setTimeout(() => t.remove(), 2200);
  }
  function overlay(html, onClick) {
    const o = document.createElement('div'); o.className = 'overlay'; o.innerHTML = '<div class="card" role="dialog" aria-modal="true">' + html + '</div>';
    document.body.appendChild(o);
    o.addEventListener('click', (e) => { const b = e.target.closest('[data-o]'); if (b) { const r = onClick(b.dataset.o, o); if (r !== false) o.remove(); } });
    const f = o.querySelector('button'); if (f) f.focus();
    return o;
  }
  const topbar = (title, back, right) => '<header class="topbar">' + (back ? '<button class="iconbtn" data-act="' + back + '" aria-label="' + T('Retour') + '">' + icon('back') + '</button>' : '') + '<h2>' + esc(title) + '</h2>' + (right || '') + '</header>';

  // =============== ÉCRANS ===============
  const SCREENS = {};
  const AFTER = {};

  SCREENS.home = () => {
    const letters = 'FRAGMENTS'.split('');
    const rot = [-4, 3, -2, 5, -3, 2, -5, 3, -2], dy = [2, -3, 4, -1, 3, -4, 1, -2, 3];
    const title = letters.map((l, i) => '<span class="scrap' + (i === 4 ? ' red' : '') + '" style="--r:' + rot[i] + 'deg;--dx:0px;--dy:' + dy[i] + 'px;--d:' + (i * 60) + 'ms">' + l + '</span>').join('');
    const resume = game && !game.ended && game.role
      ? '<button class="folder alt" data-act="resume"><b>' + T('Reprendre') + '</b><span>' + esc(SCN[game.scenarioId] ? SCN[game.scenarioId].title : '') + ' — ' + (game.role === 'player' ? T('joueur {0}', game.playerNo) : game.role === 'solo' ? T('mode test') : T('maître du jeu')) + '</span>' + icon('resume') + '</button>'
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
  let draft = { scenarioId: 'bunker', players: 4, solo: false };
  SCREENS.create = () => {
    const dossiers = INDEX.scenarios.filter((s) => !draft.defi || s.id === draft.scenarioId).map((s) => '<button class="dossier" data-theme="' + s.theme + '" data-pick="' + s.id + '" aria-pressed="' + (draft.scenarioId === s.id) + '">' +
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

  // ---- lobby MJ ----
  function joinUrl(code) { return location.href.split('#')[0].split('?')[0] + '#j=' + code; }
  SCREENS.lobby = () => {
    const sc = game._sc;
    let qr = '';
    try { qr = Q.toSvg(Q.encode(joinUrl(game.code)), { fg: '#1d1a14', bg: '#e8dec6' }); } catch (e) { qr = ''; }
    return '<main class="screen">' + topbar(sc.title, 'quitGame') +
      '<div class="ticket-code"><div class="label" style="margin:0">' + T('Code de la partie') + '</div><div class="big" data-code>' + esc(game.code) + '</div></div>' +
      '<div class="qr" aria-label="' + T('QR code de la partie') + '">' + qr + '</div>' +
      '<p class="prompt" style="text-align:center">' + T('Les {0} joueurs scannent ce QR ou tapent le code, puis choisissent chacun un numéro différent, de 1 à {0}.', game.players) + '</p>' +
      '<div class="intro">' + sc.intro.map((p) => '<p>' + esc(p) + '</p>').join('') + '</div>' +
      '<p class="prompt" style="margin-top:12px">' + T('Lisez ce texte à voix haute, puis lancez le chrono quand tout le monde est prêt.') + '</p>' +
      '<button class="btn" data-act="startClock" style="margin-top:6px">' + T('Lancer le chrono (45:00)') + '</button></main>';
  };

  // ---- console MJ ----
  function lockState() { return view.entry || ''; }
  function consoleHtml() {
    const sc = game._sc, st = sc.stages[game.stage];
    const rem = remaining(game);
    const pips = sc.stages.map((_, i) => '<span class="pip ' + (i < game.stage ? 'done' : i === game.stage ? 'now' : '') + '"></span>').join('');
    const ans = answerOf(game.stage);
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
    const nh = game.hints[game.stage];
    const hints = st.variants[game._setup.stages[game.stage].variant].hints.slice(0, nh).map((h, i) => '<div class="hint" data-n="' + (i + 1) + '">' + esc(h) + '</div>').join('');
    const hintLabel = nh >= 3 ? T('Plus d\'indice') : T('Indice {0} (−{1}:00)', nh + 1, E.HINT_COST[nh] / 60);
    return '<div class="vfd' + (rem < 300 ? ' low' : '') + (game.paused ? ' paused' : '') + '"><div class="time" aria-live="off"><span class="ghost" aria-hidden="true">88:88</span><span class="live" data-time>' + E.fmtTime(rem) + '</span></div>' +
      '<div class="meta"><span>' + T('Énigme {0} sur {1}', game.stage + 1, sc.stages.length) + '</span><span class="pips">' + pips + '</span></div></div>' +
      '<div class="stage-head"><h3>' + esc(st.title) + '</h3></div><p class="prompt">' + esc(st.prompt) + '</p>' +
      '<div class="lock"><div class="slots" data-slots aria-label="' + T('Saisie') + '">' + slots + '</div>' + keys + '</div>' +
      '<div class="tools"><button class="btn ghost" data-act="hint" ' + (nh >= 3 ? 'disabled' : '') + '>' + hintLabel + '</button><button class="btn ghost" data-act="showWord" ' + (game.lastWord ? '' : 'disabled') + '>' + T('Dernier mot') + '</button></div>' +
      '<div class="hintbox">' + hints + '</div>';
  }
  const answerOf = (s) => E.normalize(game._sc.stages[s].variants[game._setup.stages[s].variant].answer);

  SCREENS.host = () => '<main class="screen" data-screen="host">' + topbar(game._sc.title, null,
    '<button class="iconbtn" data-act="pause" aria-label="' + T(game.paused ? 'Reprendre' : 'Pause') + '">' + icon(game.paused ? 'play' : 'pause') + '</button><button class="iconbtn" data-act="abandon" aria-label="' + T('Abandonner') + '">' + icon('close') + '</button>') +
    '<div data-console>' + consoleHtml() + '</div></main>';
  AFTER.host = () => { startTick(); };

  // ---- mode solo : console + vues joueurs dans des onglets (pas de balayage : seuls les onglets changent de joueur) ----
  SCREENS.solo = () => {
    const tabs = [T('Console')].concat([...Array(game.players)].map((_, i) => T('Joueur {0}', i + 1)));
    const tabHtml = tabs.map((t, i) => '<button role="tab" data-tab="' + i + '" aria-selected="' + (game.soloView === i) + '">' + t + '</button>').join('');
    const body = game.soloView === 0 ? '<div data-console>' + consoleHtml() + '</div>' : playerView(game.soloView, game.stage);
    return '<main class="screen" data-screen="solo">' + topbar(game._sc.title, null,
      '<button class="iconbtn" data-act="pause" aria-label="' + T(game.paused ? 'Reprendre' : 'Pause') + '">' + icon(game.paused ? 'play' : 'pause') + '</button><button class="iconbtn" data-act="abandon" aria-label="' + T('Abandonner') + '">' + icon('close') + '</button>') +
      '<div class="tabs" role="tablist">' + tabHtml + '</div>' + body + '</main>';
  };
  AFTER.solo = () => { startTick(); if (game.soloView > 0) bindPlayer(game.soloView); };

  function startTick() {
    clearInterval(tickTimer);
    let lastSec = -1;
    tickTimer = setInterval(() => {
      if (!game || game.ended || !game.started) return;
      const rem = remaining(game);
      const el = $app.querySelector('[data-time]');
      if (el) el.textContent = E.fmtTime(rem);
      const vfd = $app.querySelector('.vfd');
      if (vfd) vfd.classList.toggle('low', rem < 300);
      const s = Math.floor(rem);
      if (s !== lastSec) { lastSec = s; if (rem < 60 && rem > 0 && !game.paused) A.play('tick'); if (s % 5 === 0) saveGame(); }
      if (rem <= 0) finish(false);
    }, 250);
  }
  function refreshConsole() {
    const c = $app.querySelector('[data-console]');
    if (c) c.innerHTML = consoleHtml();
  }

  function pressKey(k) {
    if (game.paused) { toast(T('Partie en pause')); return; }
    const ans = answerOf(game.stage);
    let entry = view.entry || '';
    if (k === 'DEL') entry = entry.slice(0, -1);
    else if (k === 'OK') { submit(entry); return; }
    else if (entry.length < ans.length) entry += k;
    A.play('click'); buzz(8);
    view.entry = entry;
    refreshConsole();
    if (entry.length === ans.length && game._sc.stages[game.stage].input === 'digits') setTimeout(() => { if (view.entry === entry) submit(entry); }, 260);
  }
  function submit(entry) {
    const ans = answerOf(game.stage);
    if (entry.length < ans.length) { toast(T('Code incomplet')); return; }
    const slots = $app.querySelector('[data-slots]');
    if (E.normalize(entry) === ans) {
      slots && slots.classList.add('right');
      A.play('success'); buzz([30, 40, 80]);
      setTimeout(stageSolved, 650);
    } else {
      game.penalty += E.WRONG_COST; game.wrong++; saveGame();
      slots && slots.classList.add('wrong');
      A.play('fail'); buzz([120, 60, 120]);
      setTimeout(() => { view.entry = ''; refreshConsole(); }, 520);
    }
  }
  function stageSolved() {
    const sc = game._sc;
    const word = game._setup.words[game.stage];
    game.lastWord = { stage: game.stage, word };
    const last = game.stage === sc.stages.length - 1;
    view.entry = '';
    if (last) { finish(true); return; }
    game.stage++;
    saveGame();
    document.body.classList.add('flash-ok'); setTimeout(() => document.body.classList.remove('flash-ok'), 900);
    showWord(true);
    go(game.role === 'solo' ? 'solo' : 'host', { entry: '' });
  }
  function showWord(fresh) {
    const w = game.lastWord; if (!w) return;
    const solo = game.role === 'solo';
    overlay('<h3>' + T(fresh ? 'Énigme résolue' : 'Mot de passage') + '</h3>' +
      '<p>' + (solo ? T('En vraie partie, chaque joueur taperait ce mot pour débloquer l\'énigme suivante.') : T('Chaque joueur tape ce mot sur son téléphone pour recevoir les pièces de l\'énigme {0}.', w.stage + 2)) + '</p>' +
      '<div class="password" data-word>' + esc(w.word) + '</div><button class="btn" data-o="ok">' + T('C\'est noté') + '</button>', () => {});
  }

  function finish(won, why) {
    if (game.ended) return;
    const rem = Math.max(0, remaining(game));
    game.elapsedBefore = elapsed(game); game.runningSince = 0; game.paused = true;
    const used = E.GAME_SECONDS - rem;
    const nh = game.hints.reduce((a, b) => a + b, 0);
    const stars = won ? E.stars(rem, false) : 0;
    game.ended = { won, remaining: rem, used, hints: nh, stars, share: E.shareText(game._sc.title, stars, used, nh, !won, T), abandon: why === 'abandon' };
    if (game.defi && !game.ended.abandon) recordDaily(game, won ? Math.round(rem) : 0);
    saveGame();
    keepAwake(false); A.stopDrone();
    A.play(won ? 'win' : 'lose'); buzz(won ? [60, 60, 60, 60, 200] : [400]);
    go('end');
  }

  /** Score = secondes restantes (0 hors temps). La série compte pour le jour du lancement (game.defi). */
  function recordDaily(g, score) {
    const e = g.ended, avant = J.record(JEU, g.defi, score, '');
    e.share = J.shareText(E.shareDaily({ n: g.defi.n, title: g._sc.title, stars: e.stars, used: e.used, hints: g.hints,
      solved: e.won ? g.hints.length : g.stage, wrong: g.wrong, players: g.players, timedOut: !e.won, serie: avant.count }, T));
    const s = J.record(JEU, g.defi, score, e.share);
    e.daily = { serie: s.count, best: s.best,
      resume: e.won ? T('Dossier du jour {0} clos, {1}, série de {2}', g.defi.n, TN(e.stars, '{0} étoile', '{0} étoiles'), days(s.count)) : T('Dossier du jour {0}, hors temps, série de {1}', g.defi.n, days(s.count)) };
  }

  SCREENS.end = () => {
    const g = game, sc = g._sc, e = g.ended;
    const st = [0, 1, 2].map((i) => '<span class="' + (i < e.stars ? 'on' : 'off') + '"><svg viewBox="0 0 24 24"><path d="' + IC.star.match(/d="([^"]+)"/)[1] + '"/></svg></span>').join('');
    const finalWord = e.won && g.lastWord ? '<p class="prompt">' + T('Mot final pour lire l\'épilogue sur les téléphones des joueurs :') + '</p><div class="password" data-word>' + esc(g.lastWord.word) + '</div>' : '';
    return '<main class="screen end">' +
      (g.defi ? '<div class="label daily-tag">' + T('Dossier du jour #{0}', g.defi.n) + '</div>' : '') +
      '<div class="verdict">' + T(e.won ? 'Dossier clos' : e.abandon ? 'Abandon' : 'Temps écoulé') + '</div>' +
      '<p class="prompt">' + esc(sc.title) + '</p>' +
      '<div class="stars" aria-label="' + TN(e.stars, '{0} étoile sur 3', '{0} étoiles sur 3') + '">' + st + '</div>' +
      '<div class="stats"><div><b>' + E.fmtTime(e.used) + '</b><small>' + T('temps') + '</small></div><div><b>' + e.hints + '</b><small>' + TN(e.hints, 'indice', 'indices') + '</small></div><div><b>' + g.wrong + '</b><small>' + TN(g.wrong, 'erreur', 'erreurs') + '</small></div></div>' +
      '<div class="intro" style="text-align:left;margin-bottom:14px">' + (e.won ? sc.ending : sc.failEnding).map((p) => '<p>' + esc(p) + '</p>').join('') + '</div>' +
      (game.role === 'host' ? finalWord : '') +
      (e.daily ? '<div class="streak">' + flame(e.daily.serie) + '<span>' + T('Série : {0} (record {1})', days(e.daily.serie), e.daily.best) + '</span><small>' + T('Prochain dossier dans {0}', untilMidnight()) + '</small></div><p class="sr">' + esc(e.daily.resume) + '</p>' : '') +
      (g.defi && e.abandon ? '<p class="prompt">' + T('Abandon : ce dossier du jour ne compte pas pour la série.') + '</p>' : '') +
      '<div class="share-text" data-share' + (e.daily ? ' aria-hidden="true"' : '') + '>' + esc(e.share) + '</div>' +
      '<div class="sr" role="status" aria-live="polite" data-sharestatus></div><div data-sharebox></div>' +
      '<div class="stack"><button class="btn" data-act="share">' + icon('share') + ' ' + T('Partager le résultat') + '</button>' +
      (e.daily ? '<button class="btn ghost" data-act="shareImage">' + icon('share') + ' ' + T('Partager l\'image') + '</button>' : '') +
      '<button class="btn ghost" data-act="newGame">' + T('Retour à l\'accueil') + '</button></div></main>';
  };

  // ---- rejoindre ----
  SCREENS.join = () => '<main class="screen">' + topbar(T('Rejoindre'), 'home') +
    '<div class="label">' + T('Code donné par le maître du jeu') + '</div>' +
    '<input class="codefield" data-codein inputmode="text" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="BNK-4-XXXX" maxlength="12" value="' + esc(view.prefill || '') + '" aria-label="' + T('Code de la partie') + '">' +
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
      view.decoded = d;
    };
    inp.addEventListener('input', check);
    check();
    if (!view.prefill) inp.focus();
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

  // ======================= VUE JOUEUR : FOUILLE + TROUVAILLES =======================
  // État d'interface par joueur (onglet, pièce affichée) : view.ui[p]
  function ui(p) { view.ui = view.ui || {}; return (view.ui[p] = view.ui[p] || { pv: 'search', idx: 0 }); }
  function foundKey(stage, p) { return stage + ':' + p; }
  function foundOf(stage, p) { game.found = game.found || {}; return (game.found[foundKey(stage, p)] = game.found[foundKey(stage, p)] || []); }
  function ctxOf(p, stage) {
    const sc = game._sc, st = sc.stages[stage], gs = game._setup.stages[stage];
    const zone = sc.zones[gs.zones[p - 1]];
    const hand = gs.hands[p - 1];
    const items = st.variants[gs.variant].layouts[game.players].items;
    return { sc, st, gs, zone, hand, items, spots: gs.spots[p - 1] };
  }
  /** Documents trouvés, dans l'ordre de découverte : [{doc, spot}] */
  function invOf(p, stage) {
    const c = ctxOf(p, stage), out = [];
    foundOf(stage, p).forEach((spot) => {
      const k = c.spots[spot];
      if (k >= 0) c.items[c.hand[k]].docs.forEach((d) => out.push({ doc: d, spot }));
    });
    return out;
  }

  function sceneSvg(c, p, stage) {
    const z = c.zone, L = z.light, found = foundOf(stage, p), uid = 'z' + p + '_' + stage;
    let o = '<defs><radialGradient id="' + uid + 'l" cx="' + L.x + '" cy="' + L.y + '" r="' + L.r + '" gradientUnits="userSpaceOnUse">' +
      '<stop offset="0" stop-color="#ffd9a0" stop-opacity=".24"/><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient>' +
      '<filter id="' + uid + 'n"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .35 0"/></filter></defs>';
    o += z.art.map((a) => '<path d="' + a.d + '" fill="' + (a.f || 'none') + '"' + (a.s ? ' stroke="' + a.s + '" stroke-width="' + a.w + '" stroke-linecap="round" stroke-linejoin="round"' : '') + (a.o != null ? ' opacity="' + a.o + '"' : '') + '/>').join('');
    o += '<rect width="360" height="240" filter="url(#' + uid + 'n)" opacity=".3"/><rect width="360" height="240" fill="url(#' + uid + 'l)"/>';
    z.hotspots.forEach((h, i) => {
      const done = found.indexOf(i) >= 0, k = c.spots[i];
      const cls = 'hs' + (done ? (k >= 0 ? ' got' : ' empty') : '') + (h.lock && !done ? ' locked' : '');
      o += '<g class="' + cls + '" data-spot="' + i + '" role="button" tabindex="0" aria-label="' + T('Fouiller {0}', esc(h.label)) + (done ? T(' (déjà fouillé)') : '') + '">' +
        '<circle class="hit" cx="' + h.x + '" cy="' + h.y + '" r="' + Math.max(h.r, 20) + '"/>' +
        '<circle class="ring" cx="' + h.x + '" cy="' + h.y + '" r="' + h.r + '"/>' +
        (done ? (k >= 0 ? '<path class="mark" d="M' + (h.x - 6) + ' ' + h.y + 'l4 5l9-10"/>' : '<path class="mark" d="M' + (h.x - 5) + ' ' + (h.y - 5) + 'l10 10M' + (h.x + 5) + ' ' + (h.y - 5) + 'l-10 10"/>')
          : (h.lock ? '<path class="pad" d="M' + (h.x - 5) + ' ' + (h.y - 1) + 'h10v8h-10zM' + (h.x - 3) + ' ' + (h.y - 1) + 'v-3a3 3 0 0 1 6 0v3"/>' : '<circle class="glint" cx="' + h.x + '" cy="' + h.y + '" r="3"/>')) +
        '</g>';
    });
    return '<svg class="scene" viewBox="0 0 360 240" role="group" aria-label="' + esc(z.name) + '">' + o + '</svg>';
  }

  function playerView(p, stage) {
    const c = ctxOf(p, stage), u = ui(p);
    const inv = invOf(p, stage), found = foundOf(stage, p);
    const tabs = '<div class="seg" role="tablist" aria-label="' + T('Vue du joueur') + '">' +
      '<button role="tab" data-pv="search" aria-selected="' + (u.pv === 'search') + '">' + T('Fouiller') + '</button>' +
      '<button role="tab" data-pv="inv" aria-selected="' + (u.pv === 'inv') + '">' + T('Mes trouvailles') + (inv.length ? ' <span class="count">' + inv.length + '</span>' : '') + '</button></div>';
    const head = '<div class="pl-head"><span class="badge">' + T('J{0}', p) + '</span><div class="what"><small>' + T('Énigme {0} sur {1}', stage + 1, c.sc.stages.length) + ' — ' + esc(c.zone.name) + '</small><b>' + esc(c.st.title) + '</b></div></div>';
    let body;
    if (u.pv === 'search') {
      const chips = c.zone.hotspots.map((h, i) => {
        const done = found.indexOf(i) >= 0, k = c.spots[i];
        const st = T(!done ? (h.lock ? 'Coincé' : 'À fouiller') : k >= 0 ? 'Trouvé' : k <= -2 ? 'Fouillé' : 'Rien');
        return '<button class="spot' + (done ? ' done' : '') + (done && k >= 0 ? ' got' : '') + '" data-spot="' + i + '"><span>' + esc(cap(h.label)) + '</span><small>' + st + '</small></button>';
      }).join('');
      body = '<div class="scene-wrap">' + sceneSvg(c, p, stage) + '<div class="zone-name">' + esc(c.zone.name) + '</div></div>' +
        '<p class="rule">' + T('Touchez un endroit pour le fouiller. Décrivez vos trouvailles à voix haute, sans montrer votre écran.') + '</p>' +
        '<div class="spots">' + chips + '</div>' +
        '<p class="progress">' + T('{0} sur {1} endroits fouillés', found.length, c.zone.hotspots.length) + '</p>';
    } else if (!inv.length) {
      body = '<div class="inv-empty"><p>' + T('Rien pour l\'instant.') + '</p><p>' + T('Fouillez {0} : vos pièces sont cachées quelque part.', esc(c.zone.name.toLowerCase())) + '</p><button class="btn ghost" data-pv="search">' + T('Fouiller') + '</button></div>';
    } else {
      u.idx = Math.max(0, Math.min(u.idx, inv.length - 1));
      const dots = inv.map((_, i) => '<button class="dot' + (i === u.idx ? ' on' : '') + '" data-inv="' + i + '" aria-label="' + T('Pièce {0}', i + 1) + '"></button>').join('');
      body = '<div class="inv" data-invwrap>' +
        '<div class="inv-bar"><button class="navbtn" data-invstep="-1" aria-label="' + T('Pièce précédente') + '" ' + (u.idx === 0 ? 'disabled' : '') + '>' + icon('back') + '</button>' +
        '<div class="inv-pos" aria-live="polite"><b>' + T('Pièce {0} / {1}', u.idx + 1, inv.length) + '</b><small>' + esc(cap(c.zone.hotspots[inv[u.idx].spot].label)) + '</small></div>' +
        '<button class="navbtn next" data-invstep="1" aria-label="' + T('Pièce suivante') + '" ' + (u.idx === inv.length - 1 ? 'disabled' : '') + '>' + icon('back') + '</button></div>' +
        (inv.length > 1 ? '<div class="inv-dots">' + dots + '</div>' : '') +
        '<div class="inv-doc" data-swipe>' + D.docHtml(inv[u.idx].doc) + '</div></div>';
    }
    return '<div class="pview" data-pview="' + p + '">' + head + tabs + body + '</div>';
  }

  function rerenderPlayer(p) {
    const el = $app.querySelector('[data-pview="' + p + '"]');
    if (!el) return;
    el.outerHTML = playerView(p, game.stage);
    bindPlayer(p);
  }
  function bindPlayer(p) {
    const el = $app.querySelector('[data-pview="' + p + '"]');
    if (!el) return;
    const SEL = '[data-pv],[data-spot],[data-invstep],[data-inv]';
    const act = (t) => {
      if (t.disabled) return;
      if (t.dataset.pv) { ui(p).pv = t.dataset.pv; rerenderPlayer(p); return; }
      if (t.dataset.spot != null) { searchSpot(p, +t.dataset.spot); return; }
      if (t.dataset.invstep) { invGo(p, ui(p).idx + +t.dataset.invstep); return; }
      if (t.dataset.inv != null) invGo(p, +t.dataset.inv);
    };
    el.addEventListener('click', (e) => {
      const t = e.target.closest(SEL);
      if (!t || !el.contains(t)) return;
      e.stopPropagation();
      act(t);
    });
    // Toucher direct : certains navigateurs mobiles avalent le « click » qui suit un balayage.
    // On agit au relâcher du doigt (si le doigt n'a presque pas bougé) et on empêche le click en double.
    let tx = 0, ty = 0, tt = null;
    el.addEventListener('touchstart', (e) => { tt = e.target.closest(SEL); tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
    el.addEventListener('touchend', (e) => {
      const t = tt; tt = null;
      if (!t || !el.contains(t)) return;
      const c = e.changedTouches[0];
      if (Math.abs(c.clientX - tx) > 10 || Math.abs(c.clientY - ty) > 10) return;
      if (e.cancelable) e.preventDefault();
      act(t);
    });
    el.addEventListener('keydown', (e) => {
      const g = e.target.closest && e.target.closest('g[data-spot]');
      if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); searchSpot(p, +g.dataset.spot); }
    });
    const sw = el.querySelector('[data-swipe]');
    if (sw) {
      let x0 = null, y0 = 0;
      const start = (x, y) => { x0 = x; y0 = y; };
      const end = (x, y) => {
        if (x0 == null) return;
        const dx = x - x0, dy = y - y0; x0 = null;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) invGo(p, ui(p).idx + (dx < 0 ? 1 : -1));
      };
      sw.addEventListener('touchstart', (e) => start(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
      sw.addEventListener('touchend', (e) => end(e.changedTouches[0].clientX, e.changedTouches[0].clientY), { passive: true });
      sw.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse') start(e.clientX, e.clientY); });
      sw.addEventListener('pointerup', (e) => { if (e.pointerType === 'mouse') end(e.clientX, e.clientY); });
    }
  }
  function invGo(p, i) {
    const n = invOf(p, game.stage).length;
    if (i < 0 || i >= n || i === ui(p).idx) return;
    ui(p).idx = i; A.play('click'); buzz(6);
    rerenderPlayer(p);
    const d = $app.querySelector('[data-pview="' + p + '"] .inv-doc');
    if (d) d.classList.add(i > 0 ? 'in' : 'in');
  }

  // ---- fouiller une cachette ----
  function searchSpot(p, i) {
    const stage = game.stage, c = ctxOf(p, stage), h = c.zone.hotspots[i], found = foundOf(stage, p);
    if (found.indexOf(i) >= 0) { revealSheet(p, i, false); return; }
    if (h.lock && !(view.forced && view.forced[p + ':' + i])) { forceSheet(p, i); return; }
    found.push(i); saveGame();
    revealSheet(p, i, true);
  }
  function sheet(html) {
    const old = document.querySelector('.sheet-wrap'); if (old) old.remove();
    const w = document.createElement('div');
    w.className = 'sheet-wrap';
    w.innerHTML = '<div class="sheet" role="dialog" aria-modal="true">' + html + '</div>';
    document.body.appendChild(w);
    w.addEventListener('click', (e) => { if (e.target === w || e.target.closest('[data-sheet=close]')) w.remove(); });
    return w;
  }
  function forceSheet(p, i) {
    const h = ctxOf(p, game.stage).zone.hotspots[i];
    const w = sheet('<h3>' + esc(cap(h.label)) + '</h3><p>' + T('C\'est coincé. Il va falloir forcer.') + '</p>' +
      '<button class="hold" data-hold><span class="fill"></span><span class="lbl">' + T('Maintenir pour forcer') + '</span></button>' +
      '<button class="btn ghost" data-sheet="close">' + T('Laisser') + '</button>');
    const b = w.querySelector('[data-hold]');
    let tm = null;
    const startH = (e) => { if (e) e.preventDefault(); if (tm) return; b.classList.add('holding'); buzz(15); tm = setTimeout(done, 900); };
    const stopH = () => { if (!tm) return; clearTimeout(tm); tm = null; b.classList.remove('holding'); };
    const done = () => {
      tm = null; view.forced = view.forced || {}; view.forced[p + ':' + i] = true;
      buzz([40, 30, 60]); A.play('fail');
      w.remove(); searchSpot(p, i);
    };
    b.addEventListener('pointerdown', startH);
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => b.addEventListener(ev, stopH));
    b.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) startH(e); });
    b.addEventListener('keyup', stopH);
    b.addEventListener('contextmenu', (e) => e.preventDefault());
    b.focus();
  }
  function revealSheet(p, i, fresh) {
    const stage = game.stage, c = ctxOf(p, stage), h = c.zone.hotspots[i], k = c.spots[i];
    const result = () => {
      if (k >= 0) {
        const docs = c.items[c.hand[k]].docs;
        const inv = invOf(p, stage);
        const first = inv.findIndex((x) => x.spot === i);
        return '<div class="found"><div class="found-title">' + T('Trouvé !') + '</div>' +
          docs.map((d) => '<div class="tag ' + esc(d.style) + '"><b>' + esc(d.title) + '</b><small>' + esc(d.ref) + '</small></div>').join('') +
          '</div><div class="row"><button class="btn ghost" data-sheet="close">' + T('Continuer') + '</button><button class="btn" data-goinv="' + first + '">' + T('Lire') + '</button></div>';
      }
      const txt = k <= -2 ? c.zone.flavor[-2 - k] : T('Rien ici.');
      return '<p class="flavor' + (k <= -2 ? '' : ' nothing') + '">' + esc(txt) + '</p><button class="btn ghost" data-sheet="close">' + T('Continuer') + '</button>';
    };
    const w = sheet('<h3>' + esc(cap(h.label)) + '</h3><div class="search-anim"' + (fresh ? '' : ' hidden') + '><div class="beam"></div><span>' + T('Vous fouillez…') + '</span></div><div class="result"' + (fresh ? ' hidden' : '') + '>' + result() + '</div>');
    w.addEventListener('click', (e) => {
      const g = e.target.closest('[data-goinv]');
      if (g) { w.remove(); ui(p).pv = 'inv'; ui(p).idx = +g.dataset.goinv; rerenderPlayer(p); }
    });
    if (fresh) {
      A.play('search'); buzz([12, 50, 12, 50, 12]);
      setTimeout(() => {
        const r = w.querySelector('.result'), a = w.querySelector('.search-anim');
        if (!r) return;
        a.hidden = true; r.hidden = false;
        if (k >= 0) { A.play('hint'); buzz([30, 30, 80]); }
        const f = r.querySelector('button:last-child'); if (f) f.focus();
      }, 750);
    }
    rerenderPlayer(p);
  }

  function passBar(last) {
    return '<form class="passbar" data-pass><input data-passin autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="' + T(last ? 'Mot final (épilogue)' : 'Mot de passage') + '" aria-label="' + T('Mot de passage') + '"><button class="btn" type="submit">' + T('Valider') + '</button></form>';
  }

  SCREENS.player = () => {
    const sc = game._sc;
    if (game.stage >= sc.stages.length) {
      return '<main class="screen end">' + '<div class="verdict">' + T('Dossier clos') + '</div><p class="prompt">' + esc(sc.title) + '</p>' +
        '<div class="intro" style="text-align:left;margin:16px 0">' + sc.ending.map((p) => '<p>' + esc(p) + '</p>').join('') + '</div>' +
        '<button class="btn ghost" data-act="leave">' + T('Retour à l\'accueil') + '</button></main>';
    }
    return '<main class="screen" data-screen="player">' + topbar(sc.title, null, '<button class="iconbtn" data-act="leave" aria-label="' + T('Quitter') + '">' + icon('close') + '</button>') +
      playerView(game.playerNo, game.stage) + '<div class="grow"></div>' + passBar(game.stage === sc.stages.length - 1) + '</main>';
  };
  AFTER.player = () => {
    if (game.stage >= game._sc.stages.length) return;
    bindPlayer(game.playerNo);
    const f = $app.querySelector('[data-pass]');
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const inp = f.querySelector('input');
      if (E.normalize(inp.value) === E.normalize(game._setup.words[game.stage])) {
        game.stage++; saveGame(); A.play('success'); buzz([30, 40, 80]);
        view.ui = {};
        if (game.stage >= game._sc.stages.length) { game.ended = { won: true }; saveGame(); keepAwake(false); A.stopDrone(); }
        go('player');
        document.body.classList.add('flash-ok'); setTimeout(() => document.body.classList.remove('flash-ok'), 900);
      } else {
        A.play('fail'); buzz([120, 60, 120]);
        inp.value = ''; inp.placeholder = T('Ce n\'est pas le bon mot');
        f.style.animation = 'shake .4s'; setTimeout(() => { f.style.animation = ''; }, 420);
      }
    });
  };

  // ---- comment jouer / réglages ----
  SCREENS.howto = () => window.FragHowto(T, topbar);
  SCREENS.settings = () => '<main class="screen">' + topbar(T('Réglages'), 'home') +
    langRow() +
    '<div class="toggle"><span>' + T('Son') + '<small>' + T('Ambiance et signaux générés en direct') + '</small></span><button class="switch" role="switch" data-set="sound" aria-checked="' + settings.sound + '" aria-label="' + T('Son') + '"></button></div>' +
    '<div class="toggle"><span>' + T('Vibrations') + '<small>' + T('Retour au toucher et aux réponses') + '</small></span><button class="switch" role="switch" data-set="vibrate" aria-checked="' + settings.vibrate + '" aria-label="' + T('Vibrations') + '"></button></div>' +
    '<div class="toggle"><span>' + T('Partie en cours') + '<small>' + T(game && !game.ended ? 'Une partie est sauvegardée sur ce téléphone' : 'Aucune') + '</small></span><button class="btn danger" data-act="wipe" style="min-height:44px;font-size:17px" ' + (game ? '' : 'disabled') + '>' + T('Effacer') + '</button></div>' +
    '<p class="prompt" style="margin-top:20px">' + T('Fragments fonctionne sans connexion. Les parties restent sur ce téléphone.') + '</p>' +
    window.FragAutresJeux.html(T) +
    '<p class="prompt"><a class="legal" href="privacy.html' + (I.lang === 'en' ? '#en' : '') + '">' + T('Confidentialité, conditions et mentions légales') + '</a></p></main>';
  const langRow = () => '<div class="toggle"><span>' + T('Langue') + '<small>' + T('Interface et scénarios') + '</small></span><div class="langs" role="group" aria-label="' + T('Langue') + '">' +
    [['fr', 'FR'], ['en', 'EN']].map(([l, n]) => '<button data-lang="' + l + '" aria-pressed="' + (I.lang === l) + '" lang="' + l + '">' + n + '</button>').join('') + '</div></div>';

  // =============== ACTIONS ===============
  const ACTIONS = {
    home: () => go('home'),
    howto: () => go('howto'),
    settings: () => go('settings'),
    create: () => { draft.solo = false; draft.defi = null; go('create'); },
    daily: () => { const t = J.today(); draft.solo = view.name === 'create' && draft.solo; draft.defi = { key: t.key, day: t.day, n: t.n }; draft.scenarioId = dailyOf(t).scenario.id; go('create'); },
    solo: () => { draft.solo = true; draft.defi = null; draft.players = Math.max(draft.players, 3); go('create'); },
    join: () => go('join'),
    scan: scanQr,
    resume: () => resumeGame(),
    doCreate: () => {
      game = newGame(draft.solo ? 'solo' : 'host'); saveGame();
      if (draft.solo) { startClock(); go('solo'); } else go('lobby');
    },
    startClock: () => { startClock(); go('host'); },
    pause: () => {
      if (game.paused) { game.paused = false; game.runningSince = Date.now(); A.startDrone(game.scenarioId); keepAwake(true); }
      else { game.elapsedBefore = elapsed(game); game.paused = true; game.runningSince = 0; A.stopDrone(); }
      saveGame(); go(game.role === 'solo' ? 'solo' : 'host', { entry: view.entry });
    },
    hint: () => {
      const n = game.hints[game.stage];
      if (n >= 3) return;
      overlay('<h3>' + T('Indice {0}', n + 1) + '</h3><p>' + TN(E.HINT_COST[n] / 60, 'Il coûte {0} minute au chrono. Le groupe est d\'accord ?', 'Il coûte {0} minutes au chrono. Le groupe est d\'accord ?') + '</p><div class="row"><button class="btn ghost" data-o="no">' + T('Annuler') + '</button><button class="btn" data-o="yes">' + T('Révéler') + '</button></div>', (o) => {
        if (o !== 'yes') return;
        game.penalty += E.HINT_COST[n]; game.hints[game.stage] = n + 1; saveGame(); A.play('hint'); buzz(20); refreshConsole();
      });
    },
    showWord: () => showWord(false),
    abandon: () => {
      overlay('<h3>' + T('Abandonner ?') + '</h3><p>' + T('Le chrono s\'arrête et la partie est perdue.') + '</p><div class="row"><button class="btn ghost" data-o="no">' + T('Continuer') + '</button><button class="btn danger" data-o="yes">' + T('Abandonner') + '</button></div>', (o) => { if (o === 'yes') finish(false, 'abandon'); });
    },
    quitGame: () => { game = null; saveGame(); go('home'); },
    share: async () => {
      const text = game.ended.share, r = await J.share(text); // null : partage annulé
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
    shareImage: () => window.FragShareImage.run(game, T, $app.querySelector('[data-sharestatus]'), toast), // carte 1080×1920 : js/share-image.js
    newGame: () => { game = null; saveGame(); go('home'); },
    leave: () => {
      if (game && game.ended) { game = null; saveGame(); go('home'); return; }
      overlay('<h3>' + T('Quitter la partie ?') + '</h3><p>' + T('Vous pourrez la reprendre depuis l\'accueil.') + '</p><div class="row"><button class="btn ghost" data-o="no">' + T('Rester') + '</button><button class="btn" data-o="yes">' + T('Quitter') + '</button></div>', (o) => { if (o === 'yes') { keepAwake(false); A.stopDrone(); go('home'); } });
    },
    wipe: () => { game = null; saveGame(); toast(T('Partie effacée')); go('settings'); }
  };
  function startClock() {
    game.started = true; game.paused = false; game.runningSince = Date.now(); saveGame();
    A.unlock(); A.startDrone(game.scenarioId); keepAwake(true);
  }
  function resumeGame() {
    if (!game) return go('home');
    hydrate(game);
    A.unlock();
    if (game.ended && game.role !== 'player') return go('end');
    if (game.role === 'player') { keepAwake(true); A.startDrone(game.scenarioId); return go('player'); }
    if (!game.started) return go('lobby');
    if (!game.paused) { A.startDrone(game.scenarioId); keepAwake(true); }
    go(game.role === 'solo' ? 'solo' : 'host', { entry: '' });
  }

  $app.addEventListener('click', (e) => {
    A.unlock();
    const t = e.target.closest('button');
    if (!t) return;
    if (t.dataset.act && ACTIONS[t.dataset.act]) { ACTIONS[t.dataset.act](); return; }
    if (t.dataset.k && !t.closest('[data-pview]')) { pressKey(t.dataset.k); return; }
    if (t.dataset.pick) { draft.scenarioId = t.dataset.pick; document.body.dataset.theme = SCN[draft.scenarioId].theme; $app.querySelectorAll('[data-pick]').forEach((b) => b.setAttribute('aria-pressed', b === t)); return; }
    if (t.dataset.n) { draft.players = +t.dataset.n; $app.querySelectorAll('[data-n]').forEach((b) => b.setAttribute('aria-pressed', b === t)); return; }
    if (t.dataset.tab) { game.soloView = +t.dataset.tab; saveGame(); go('solo', { entry: view.entry, ui: view.ui, forced: view.forced }); return; }
    if (t.dataset.lang) { if (t.dataset.lang !== I.lang) { I.setLang(t.dataset.lang); location.reload(); } return; }
    if (t.dataset.set) { settings[t.dataset.set] = !settings[t.dataset.set]; save(LS_SET, settings); A.setEnabled(settings.sound); t.setAttribute('aria-checked', settings[t.dataset.set]); if (t.dataset.set === 'vibrate') buzz(30); return; }
    if (t.dataset.seatn) {
      const d = view.decoded, sc = byPrefix(d.prefix);
      game = hydrate({ role: 'player', scenarioId: sc.id, players: d.players, seed: d.seed, code: d.code, playerNo: +t.dataset.seatn, stage: 0, ended: null });
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
    if (game && (e.key === 'ArrowLeft' || e.key === 'ArrowRight') && e.target.tagName !== 'INPUT') {
      const pv = $app.querySelector('[data-pview]');
      if (pv && ui(+pv.dataset.pview).pv === 'inv') { invGo(+pv.dataset.pview, ui(+pv.dataset.pview).idx + (e.key === 'ArrowRight' ? 1 : -1)); e.preventDefault(); return; }
    }
    if (!game || !['host', 'solo'].includes(view.name) || document.querySelector('.overlay')) return;
    if (view.name === 'solo' && game.soloView !== 0) return;
    if (e.target.tagName === 'INPUT') return;
    if (e.key === 'Backspace') pressKey('DEL');
    else if (e.key === 'Enter') pressKey('OK');
    else if (/^[a-z0-9]$/i.test(e.key)) pressKey(e.key.toUpperCase());
  });

  // ---------- démarrage ----------
  (async function boot() {
    try { await loadData(); } catch (e) { $app.innerHTML = '<main class="screen"><h2>' + T('Données introuvables') + '</h2><p>' + T('Rechargez la page avec une connexion pour la première installation.') + '</p></main>'; return; }
    if (game) { try { hydrate(game); } catch (e) { game = null; save(LS_GAME, null); } }
    const m = location.hash.match(/j=([A-Za-z0-9-]+)/);
    if (m) { history.replaceState(null, '', location.pathname); go('join', { prefill: m[1] }); }
    else go('home');
    if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
    window.__frag = { get game() { return game; }, E, go, answerOf: (s) => answerOf(s) };
  })();
})();

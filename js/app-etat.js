/* FRAGMENTS — état partagé, stockage, icônes, données, chrono, navigation (go / toast / overlay / topbar). */
(function () {
  'use strict';
  const E = window.FragEngine, D = window.FragDocs, A = window.FragAudio, Q = window.FragQR, J = window.Defi, I = window.FragI18n, T = I.t, TN = I.tn;
  const $app = document.getElementById('app');
  const esc = D.esc;
  const cap = (t) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t);
  const LS_GAME = 'fragments.game.v1', LS_SET = 'fragments.settings.v1';

  // ---------- état (partagé entre les modules ; seules ces 4 valeurs sont réassignées) ----------
  const S = { INDEX: null, game: null, view: { name: 'home' }, tickTimer: null };
  const SCN = {};
  const settings = load(LS_SET) || { sound: true, vibrate: true };
  S.game = load(LS_GAME); // partie en cours (hôte, joueur ou solo)
  let wakeLock = null;

  function load(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function save(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* stockage indisponible */ } }
  const saveGame = () => save(LS_GAME, S.game ? plain(S.game) : null);
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
    S.INDEX = await (await fetch(dir + 'index.json')).json();
    D.setGlyphs(S.INDEX.glyphs);
    await Promise.all(S.INDEX.scenarios.map(async (s) => { SCN[s.id] = await (await fetch(dir + s.file)).json(); }));
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
  const dailyOf = (t) => E.dailyPick(S.INDEX.scenarios, J.seed(JEU, t.key));
  const flame = (n) => (n > 0 ? '<span class="flame">' + icon('flame') + n + '</span>' : '');
  const days = (n) => TN(n, '{0} jour', '{0} jours');
  function untilMidnight() { // minuit de Paris = 22 h UTC l'été, 23 h l'hiver
    const p = J.parisDate(), a = Date.UTC(p.y, p.m - 1, p.d + 1) - 7200000;
    const m = Math.max(1, Math.ceil(((J.parisDate(a).key !== p.key ? a : a + 3600000) - Date.now()) / 60000));
    return T('{0} h {1}', Math.floor(m / 60), String(m % 60).padStart(2, '0'));
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && S.view.name === 'home' && S.INDEX) go('home'); });

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
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && S.game && !S.game.ended) keepAwake(true); });

  // ---------- navigation ----------
  function go(name, extra) {
    S.view = Object.assign({ name }, extra || {});
    clearInterval(S.tickTimer); S.tickTimer = null;
    const theme = S.game && S.game.scenarioId && ['host', 'player', 'solo', 'end', 'lobby'].includes(name) ? S.game.scenarioId : (S.view.theme || '');
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

  window.FragApp = { E, $app, esc, cap, LS_GAME, S, SCN, settings, load, save, saveGame, buzz, IC, icon, glyphSvg, THEME_GLYPH, loadData, byPrefix, hydrate, plain, JEU, dailyOf, flame, days, untilMidnight, elapsed, remaining, keepAwake, go, toast, overlay, topbar, SCREENS, AFTER, D, A, Q, J, I, T, TN, LS_SET };
})();

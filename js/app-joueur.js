/* FRAGMENTS — vue joueur : fouille des pièces, trouvailles, feuilles « forcer » / résultat, mot de passage. */
(function () {
  'use strict';
  const F = window.FragApp;
  const { E, $app, esc, cap, S, saveGame, buzz, icon, keepAwake, go, topbar, SCREENS, AFTER, D, A, J, T } = F;

  // ======================= VUE JOUEUR : FOUILLE + TROUVAILLES =======================
  // État d'interface par joueur (onglet, pièce affichée) : S.view.ui[p]
  function ui(p) { S.view.ui = S.view.ui || {}; return (S.view.ui[p] = S.view.ui[p] || { pv: 'search', idx: 0 }); }
  function foundKey(stage, p) { return stage + ':' + p; }
  function foundOf(stage, p) { S.game.found = S.game.found || {}; return (S.game.found[foundKey(stage, p)] = S.game.found[foundKey(stage, p)] || []); }
  function ctxOf(p, stage) {
    const sc = S.game._sc, st = sc.stages[stage], gs = S.game._setup.stages[stage];
    const zone = sc.zones[gs.zones[p - 1]];
    const hand = gs.hands[p - 1];
    const items = st.variants[gs.variant].layouts[S.game.players].items;
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
    el.outerHTML = playerView(p, S.game.stage);
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
    const n = invOf(p, S.game.stage).length;
    if (i < 0 || i >= n || i === ui(p).idx) return;
    ui(p).idx = i; A.play('click'); buzz(6);
    rerenderPlayer(p);
    const d = $app.querySelector('[data-pview="' + p + '"] .inv-doc');
    if (d) d.classList.add(i > 0 ? 'in' : 'in');
  }

  // ---- fouiller une cachette ----
  function searchSpot(p, i) {
    const stage = S.game.stage, c = ctxOf(p, stage), h = c.zone.hotspots[i], found = foundOf(stage, p);
    if (found.indexOf(i) >= 0) { revealSheet(p, i, false); return; }
    if (h.lock && !(S.view.forced && S.view.forced[p + ':' + i])) { forceSheet(p, i); return; }
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
    const h = ctxOf(p, S.game.stage).zone.hotspots[i];
    const w = sheet('<h3>' + esc(cap(h.label)) + '</h3><p>' + T('C\'est coincé. Il va falloir forcer.') + '</p>' +
      '<button class="hold" data-hold><span class="fill"></span><span class="lbl">' + T('Maintenir pour forcer') + '</span></button>' +
      '<button class="btn ghost" data-sheet="close">' + T('Laisser') + '</button>');
    const b = w.querySelector('[data-hold]');
    let tm = null;
    const startH = (e) => { if (e) e.preventDefault(); if (tm) return; b.classList.add('holding'); buzz(15); tm = setTimeout(done, 900); };
    const stopH = () => { if (!tm) return; clearTimeout(tm); tm = null; b.classList.remove('holding'); };
    const done = () => {
      tm = null; S.view.forced = S.view.forced || {}; S.view.forced[p + ':' + i] = true;
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
    const stage = S.game.stage, c = ctxOf(p, stage), h = c.zone.hotspots[i], k = c.spots[i];
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
    const sc = S.game._sc;
    if (S.game.stage >= sc.stages.length) {
      return '<main class="screen end">' + '<div class="verdict">' + T('Dossier clos') + '</div><p class="prompt">' + esc(sc.title) + '</p>' +
        '<div class="intro" style="text-align:left;margin:16px 0">' + sc.ending.map((p) => '<p>' + esc(p) + '</p>').join('') + '</div>' +
        '<button class="btn ghost" data-act="leave">' + T('Retour à l\'accueil') + '</button></main>';
    }
    return '<main class="screen" data-screen="player">' + topbar(sc.title, null, '<button class="iconbtn" data-act="leave" aria-label="' + T('Quitter') + '">' + icon('close') + '</button>') +
      playerView(S.game.playerNo, S.game.stage) + '<div class="grow"></div>' + passBar(S.game.stage === sc.stages.length - 1) + '</main>';
  };
  AFTER.player = () => {
    if (S.game.stage >= S.game._sc.stages.length) return;
    bindPlayer(S.game.playerNo);
    const f = $app.querySelector('[data-pass]');
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const inp = f.querySelector('input');
      if (E.normalize(inp.value) === E.normalize(S.game._setup.words[S.game.stage])) {
        S.game.stage++; saveGame(); A.play('success'); buzz([30, 40, 80]);
        S.view.ui = {};
        if (S.game.stage >= S.game._sc.stages.length) { S.game.ended = { won: true }; saveGame(); keepAwake(false); A.stopDrone(); }
        go('player');
        document.body.classList.add('flash-ok'); setTimeout(() => document.body.classList.remove('flash-ok'), 900);
      } else {
        A.play('fail'); buzz([120, 60, 120]);
        inp.value = ''; inp.placeholder = T('Ce n\'est pas le bon mot');
        f.style.animation = 'shake .4s'; setTimeout(() => { f.style.animation = ''; }, 420);
      }
    });
  };

  Object.assign(F, { ui, foundKey, foundOf, ctxOf, invOf, sceneSvg, playerView, rerenderPlayer, bindPlayer, invGo, searchSpot, sheet, forceSheet, revealSheet, passBar });
})();

/* FRAGMENTS — encodeur QR minimal (mode octet, correction M, versions 1 à 10).
 * Aucune dépendance. Porté à l'identique dans android/.../engine/Qr.kt.
 * Inspiré de l'algorithme de référence (ISO/IEC 18004) : Reed-Solomon GF(256), masques, pénalités.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.FragQR = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  // Correction M : [codewords EC par bloc, nombre de blocs] par version
  const EC_M = [null, [10, 1], [16, 1], [26, 1], [18, 2], [24, 2], [16, 4], [18, 4], [22, 4], [22, 5], [26, 5]];

  function rawModules(ver) {
    let r = (16 * ver + 128) * ver + 64;
    if (ver >= 2) {
      const na = Math.floor(ver / 7) + 2;
      r -= (25 * na - 10) * na - 55;
      if (ver >= 7) r -= 36;
    }
    return r;
  }
  function dataCodewords(ver) {
    return Math.floor(rawModules(ver) / 8) - EC_M[ver][0] * EC_M[ver][1];
  }
  function alignPos(ver) {
    if (ver === 1) return [];
    const na = Math.floor(ver / 7) + 2;
    const step = Math.ceil((ver * 4 + 4) / (na * 2 - 2)) * 2;
    const res = [6];
    for (let pos = ver * 4 + 10; res.length < na; pos -= step) res.splice(1, 0, pos);
    return res;
  }
  function gfMul(x, y) {
    let z = 0;
    for (let i = 7; i >= 0; i--) {
      z = (z << 1) ^ ((z >>> 7) * 0x11d);
      z ^= ((y >>> i) & 1) * x;
    }
    return z & 0xff;
  }
  function rsDivisor(deg) {
    const res = new Array(deg).fill(0);
    res[deg - 1] = 1;
    let root = 1;
    for (let i = 0; i < deg; i++) {
      for (let j = 0; j < deg; j++) {
        res[j] = gfMul(res[j], root);
        if (j + 1 < deg) res[j] ^= res[j + 1];
      }
      root = gfMul(root, 2);
    }
    return res;
  }
  function rsRemainder(data, div) {
    const res = new Array(div.length).fill(0);
    for (const b of data) {
      const f = b ^ res.shift();
      res.push(0);
      for (let i = 0; i < div.length; i++) res[i] ^= gfMul(div[i], f);
    }
    return res;
  }
  function utf8(str) {
    const out = [];
    const s = unescape(encodeURIComponent(str));
    for (let i = 0; i < s.length; i++) out.push(s.charCodeAt(i));
    return out;
  }

  /** Retourne une matrice carrée de booléens (true = module noir). */
  function encode(text) {
    const bytes = utf8(text);
    let ver = 1;
    for (; ver <= 10; ver++) {
      const ccBits = ver < 10 ? 8 : 16;
      if (4 + ccBits + bytes.length * 8 <= dataCodewords(ver) * 8) break;
    }
    if (ver > 10) throw new Error('Texte trop long pour le QR');
    const ccBits = ver < 10 ? 8 : 16;
    const cap = dataCodewords(ver) * 8;
    const bits = [];
    const put = (v, n) => { for (let i = n - 1; i >= 0; i--) bits.push((v >>> i) & 1); };
    put(4, 4);
    put(bytes.length, ccBits);
    bytes.forEach((b) => put(b, 8));
    put(0, Math.min(4, cap - bits.length));
    put(0, (8 - (bits.length % 8)) % 8);
    for (let pad = 0xec; bits.length < cap; pad ^= 0xec ^ 0x11) put(pad, 8);
    const data = [];
    for (let i = 0; i < bits.length; i += 8) {
      let v = 0;
      for (let j = 0; j < 8; j++) v = (v << 1) | bits[i + j];
      data.push(v);
    }
    // Blocs + correction, entrelacement
    const ecLen = EC_M[ver][0], nb = EC_M[ver][1];
    const raw = Math.floor(rawModules(ver) / 8);
    const nShort = nb - (raw % nb);
    const shortLen = Math.floor(raw / nb);
    const div = rsDivisor(ecLen);
    const blocks = [];
    for (let i = 0, k = 0; i < nb; i++) {
      const dlen = shortLen - ecLen + (i < nShort ? 0 : 1);
      const dat = data.slice(k, k + dlen);
      k += dlen;
      const ec = rsRemainder(dat, div);
      if (i < nShort) dat.push(0);
      blocks.push(dat.concat(ec));
    }
    const all = [];
    for (let i = 0; i < blocks[0].length; i++) {
      for (let j = 0; j < blocks.length; j++) {
        if (i !== shortLen - ecLen || j >= nShort) all.push(blocks[j][i]);
      }
    }

    const size = ver * 4 + 17;
    const m = [], fn = [];
    for (let i = 0; i < size; i++) { m.push(new Array(size).fill(false)); fn.push(new Array(size).fill(false)); }
    const set = (x, y, d) => { m[y][x] = d; fn[y][x] = true; };
    for (let i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
    const finder = (cx, cy) => {
      for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
        const d = Math.max(Math.abs(dx), Math.abs(dy)), x = cx + dx, y = cy + dy;
        if (x >= 0 && x < size && y >= 0 && y < size) set(x, y, d !== 2 && d !== 4);
      }
    };
    finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
    const ap = alignPos(ver);
    for (let i = 0; i < ap.length; i++) for (let j = 0; j < ap.length; j++) {
      if ((i === 0 && j === 0) || (i === 0 && j === ap.length - 1) || (i === ap.length - 1 && j === 0)) continue;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(ap[i] + dx, ap[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }
    const drawFormat = (mask) => {
      const d = (0 << 3) | mask; // M = 00
      let rem = d;
      for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
      const b = ((d << 10) | rem) ^ 0x5412;
      const bit = (i) => ((b >>> i) & 1) !== 0;
      for (let i = 0; i <= 5; i++) set(8, i, bit(i));
      set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8));
      for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i));
      for (let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(i));
      for (let i = 8; i < 15; i++) set(8, size - 15 + i, bit(i));
      set(8, size - 8, true);
    };
    drawFormat(0);
    if (ver >= 7) {
      let rem = ver;
      for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
      const b = (ver << 12) | rem;
      for (let i = 0; i < 18; i++) {
        const bt = ((b >>> i) & 1) !== 0;
        const a = size - 11 + (i % 3), c = Math.floor(i / 3);
        set(a, c, bt); set(c, a, bt);
      }
    }
    // Placement en zigzag
    let i = 0;
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let vert = 0; vert < size; vert++) {
        for (let j = 0; j < 2; j++) {
          const x = right - j;
          const up = ((right + 1) & 2) === 0;
          const y = up ? size - 1 - vert : vert;
          if (!fn[y][x] && i < all.length * 8) {
            m[y][x] = ((all[i >>> 3] >>> (7 - (i & 7))) & 1) !== 0;
            i++;
          }
        }
      }
    }
    const applyMask = (mask) => {
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
        let inv;
        switch (mask) {
          case 0: inv = (x + y) % 2 === 0; break;
          case 1: inv = y % 2 === 0; break;
          case 2: inv = x % 3 === 0; break;
          case 3: inv = (x + y) % 3 === 0; break;
          case 4: inv = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break;
          case 5: inv = ((x * y) % 2) + ((x * y) % 3) === 0; break;
          case 6: inv = (((x * y) % 2) + ((x * y) % 3)) % 2 === 0; break;
          default: inv = (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
        }
        if (!fn[y][x] && inv) m[y][x] = !m[y][x];
      }
    };
    let best = 0, bestPen = Infinity;
    for (let k = 0; k < 8; k++) {
      applyMask(k); drawFormat(k);
      const p = penalty(m, size);
      if (p < bestPen) { bestPen = p; best = k; }
      applyMask(k);
    }
    applyMask(best); drawFormat(best);
    return m;
  }

  function penalty(m, size) {
    let res = 0;
    const lineRuns = (get) => {
      let r = 0;
      for (let a = 0; a < size; a++) {
        let run = 1;
        for (let b = 1; b < size; b++) {
          if (get(a, b) === get(a, b - 1)) { run++; if (run === 5) r += 3; else if (run > 5) r++; }
          else run = 1;
        }
      }
      return r;
    };
    res += lineRuns((a, b) => m[a][b]);
    res += lineRuns((a, b) => m[b][a]);
    for (let y = 0; y < size - 1; y++) for (let x = 0; x < size - 1; x++) {
      const c = m[y][x];
      if (c === m[y][x + 1] && c === m[y + 1][x] && c === m[y + 1][x + 1]) res += 3;
    }
    let dark = 0;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (m[y][x]) dark++;
    const total = size * size;
    const k = Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1;
    res += Math.max(0, k) * 10;
    return res;
  }

  function toSvg(m, opts) {
    opts = opts || {};
    const q = 2, n = m.length + q * 2;
    let d = '';
    for (let y = 0; y < m.length; y++) for (let x = 0; x < m.length; x++) if (m[y][x]) d += 'M' + (x + q) + ' ' + (y + q) + 'h1v1h-1z';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + n + ' ' + n + '" shape-rendering="crispEdges" role="img" aria-label="QR code">' +
      '<rect width="' + n + '" height="' + n + '" fill="' + (opts.bg || '#fff') + '"/><path d="' + d + '" fill="' + (opts.fg || '#000') + '"/></svg>';
  }

  return { encode: encode, toSvg: toSvg, penalty: penalty };
});

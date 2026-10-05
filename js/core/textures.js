/* =====================================================================
   Procedural textures (drawn on 2D canvases at startup).
   No image files are needed — every surface is generated from a seed.
   ===================================================================== */

const Tex = {
  maxAniso: 8,
  fontSans: '"Inter", "Helvetica Neue", "Segoe UI", Roboto, Arial, sans-serif',
  fontCond: '"Oswald", "Arial Narrow", "Roboto Condensed", "Helvetica Neue", Arial, sans-serif',

  canvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  },

  tex(canvas, { srgb = true, repeat = true } = {}) {
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = Tex.maxAniso;
    t.generateMipmaps = true;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.needsUpdate = true;
    return t;
  },

  // per-pixel noise on an existing canvas
  noise(ctx, w, h, amount, rng, mono = true) {
    const img = ctx.getImageData(0, 0, w, h), d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (rng.next() - 0.5) * amount;
      if (mono) { d[i] += n; d[i + 1] += n; d[i + 2] += n; }
      else { d[i] += n; d[i + 1] += (rng.next() - 0.5) * amount; d[i + 2] += (rng.next() - 0.5) * amount; }
    }
    ctx.putImageData(img, 0, 0);
  },

  blotches(ctx, w, h, count, rMin, rMax, colorFn, rng) {
    for (let i = 0; i < count; i++) {
      const x = rng.next() * w, y = rng.next() * h, r = rng.range(rMin, rMax);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, colorFn(rng));
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      // wrap so the tile stays seamless
      for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) {
        if (x + ox + r < 0 || x + ox - r > w || y + oy + r < 0 || y + oy - r > h) continue;
        ctx.save(); ctx.translate(ox, oy); ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
      }
    }
  },

  /* ---------------- ROAD ---------------- */
  asphalt(seed) {
    const rng = new RNG(seed);
    const S = 1024, c = Tex.canvas(S, S), x = c.getContext('2d');
    x.fillStyle = '#3c3e42'; x.fillRect(0, 0, S, S);
    Tex.blotches(x, S, S, 60, 40, 180, (r) => `rgba(${r.next() < 0.5 ? '20,20,22' : '90,90,92'},${r.range(0.05, 0.14)})`, rng);
    // patched repairs
    for (let i = 0; i < 3; i++) {
      x.fillStyle = `rgba(28,29,32,${rng.range(0.35, 0.6)})`;
      const px = rng.next() * S, py = rng.next() * S, pw = rng.range(80, 260), ph = rng.range(60, 200);
      x.fillRect(px, py, pw, ph);
      x.strokeStyle = 'rgba(15,15,15,0.5)'; x.lineWidth = 2; x.strokeRect(px, py, pw, ph);
    }
    // cracks
    x.strokeStyle = 'rgba(12,12,14,0.65)';
    for (let i = 0; i < 14; i++) {
      let cx = rng.next() * S, cy = rng.next() * S, a = rng.next() * Math.PI * 2;
      x.lineWidth = rng.range(0.8, 2.2);
      x.beginPath(); x.moveTo(cx, cy);
      for (let k = 0; k < 18; k++) { a += rng.range(-0.6, 0.6); cx += Math.cos(a) * 9; cy += Math.sin(a) * 9; x.lineTo(cx, cy); }
      x.stroke();
    }
    // aggregate speckle
    for (let i = 0; i < 9000; i++) {
      const g = rng.range(70, 150);
      x.fillStyle = `rgba(${g},${g},${g},${rng.range(0.25, 0.7)})`;
      x.fillRect(rng.next() * S, rng.next() * S, rng.range(1, 2.5), rng.range(1, 2.5));
    }
    Tex.noise(x, S, S, 22, rng);
    const rough = Tex.canvas(256, 256), rx = rough.getContext('2d');
    rx.fillStyle = '#e0e0e0'; rx.fillRect(0, 0, 256, 256);
    Tex.blotches(rx, 256, 256, 30, 10, 50, (r) => `rgba(140,140,140,${r.range(0.1, 0.35)})`, rng);
    Tex.noise(rx, 256, 256, 30, rng);
    return { map: Tex.tex(c), roughnessMap: Tex.tex(rough, { srgb: false }), bumpMap: Tex.tex(c, { srgb: false }) };
  },

  sidewalk(seed) {
    const rng = new RNG(seed);
    const S = 512, c = Tex.canvas(S, S), x = c.getContext('2d');
    const b = Tex.canvas(S, S), bx = b.getContext('2d');
    x.fillStyle = '#a8a398'; x.fillRect(0, 0, S, S);
    bx.fillStyle = '#909090'; bx.fillRect(0, 0, S, S);
    const n = 2, cs = S / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const v = rng.range(-10, 10);
      x.fillStyle = `rgb(${168 + v},${163 + v},${153 + v})`;
      x.fillRect(i * cs + 2, j * cs + 2, cs - 4, cs - 4);
    }
    Tex.blotches(x, S, S, 70, 8, 70, (r) => `rgba(${r.next() < 0.75 ? '70,64,58' : '225,218,206'},${r.range(0.06, 0.2)})`, rng);
    Tex.blotches(x, S, S, 12, 30, 110, (r) => `rgba(60,55,50,${r.range(0.05, 0.12)})`, rng);
    // gum spots / stains
    for (let i = 0; i < 26; i++) {
      x.fillStyle = `rgba(60,58,55,${rng.range(0.15, 0.45)})`;
      x.beginPath(); x.arc(rng.next() * S, rng.next() * S, rng.range(1.5, 4), 0, 7); x.fill();
    }
    Tex.noise(x, S, S, 16, rng);
    // joints
    x.strokeStyle = 'rgba(70,66,60,0.85)'; x.lineWidth = 3;
    bx.strokeStyle = '#202020'; bx.lineWidth = 5;
    for (let i = 0; i <= n; i++) {
      for (const ctx of [x, bx]) {
        ctx.beginPath(); ctx.moveTo(i * cs, 0); ctx.lineTo(i * cs, S); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i * cs); ctx.lineTo(S, i * cs); ctx.stroke();
      }
    }
    return { map: Tex.tex(c), bumpMap: Tex.tex(b, { srgb: false }) };
  },

  concrete(seed, base = [168, 164, 156], S = 256) {
    const rng = new RNG(seed);
    const c = Tex.canvas(S, S), x = c.getContext('2d');
    x.fillStyle = `rgb(${base[0]},${base[1]},${base[2]})`; x.fillRect(0, 0, S, S);
    Tex.blotches(x, S, S, 25, 6, 40, (r) => `rgba(${r.next() < 0.6 ? '70,68,64' : '230,226,218'},${r.range(0.06, 0.18)})`, rng);
    Tex.noise(x, S, S, 18, rng);
    return Tex.tex(c);
  },

  /* ---------------- FACADES ---------------- */
  // style: { wall:[r,g,b], kind:'brick'|'stucco'|'stone'|'panel'|'curtain', frame, glass, sill,
  //          winW, winH, sillH, panes, bayW, floorH }
  facade(style, seed) {
    const rng = new RNG(seed);
    const W = 512, H = 512, bays = 4, floors = 4;
    const cw = W / bays, ch = H / floors;
    const c = Tex.canvas(W, H), x = c.getContext('2d');
    const r = Tex.canvas(W, H), rx = r.getContext('2d');
    const b = Tex.canvas(W, H), bx = b.getContext('2d');
    const [wr, wg, wb] = style.wall;
    const rgb = (a, v = 0) => `rgb(${a[0] + v},${a[1] + v},${a[2] + v})`;

    // --- wall base
    x.fillStyle = rgb(style.wall); x.fillRect(0, 0, W, H);
    rx.fillStyle = '#e6e6e6'; rx.fillRect(0, 0, W, H);
    bx.fillStyle = '#808080'; bx.fillRect(0, 0, W, H);

    if (style.kind === 'brick') {
      const bh = 4.2, bw = 11;
      for (let row = 0; row * bh < H; row++) {
        const off = (row % 2) * bw * 0.5;
        for (let col = -1; col * bw < W; col++) {
          const v = rng.range(-16, 14);
          x.fillStyle = `rgb(${wr + v},${wg + v * 0.7},${wb + v * 0.6})`;
          x.fillRect(col * bw + off + 0.6, row * bh + 0.6, bw - 1.2, bh - 1.2);
        }
        bx.fillStyle = '#5a5a5a'; bx.fillRect(0, row * bh, W, 0.8);
      }
    } else if (style.kind === 'stone') {
      const bh = ch / 4;
      x.strokeStyle = `rgba(0,0,0,0.18)`; x.lineWidth = 1.2;
      bx.strokeStyle = '#555'; bx.lineWidth = 1.5;
      for (let row = 0; row * bh < H; row++) {
        const v = rng.range(-6, 6);
        x.fillStyle = rgb(style.wall, v | 0); x.fillRect(0, row * bh, W, bh);
        for (const ctx of [x, bx]) { ctx.beginPath(); ctx.moveTo(0, row * bh); ctx.lineTo(W, row * bh); ctx.stroke(); }
        const off = (row % 2) * 30;
        for (let col = 0; col * 60 < W + 60; col++) {
          for (const ctx of [x, bx]) { ctx.beginPath(); ctx.moveTo(col * 60 + off, row * bh); ctx.lineTo(col * 60 + off, row * bh + bh); ctx.stroke(); }
        }
      }
    } else if (style.kind === 'panel') {
      x.strokeStyle = 'rgba(0,0,0,0.25)'; bx.strokeStyle = '#4a4a4a'; x.lineWidth = bx.lineWidth = 1.5;
      for (let i = 0; i <= bays * 2; i++) for (const ctx of [x, bx]) { ctx.beginPath(); ctx.moveTo(i * cw / 2, 0); ctx.lineTo(i * cw / 2, H); ctx.stroke(); }
      for (let j = 0; j <= floors * 2; j++) for (const ctx of [x, bx]) { ctx.beginPath(); ctx.moveTo(0, j * ch / 2); ctx.lineTo(W, j * ch / 2); ctx.stroke(); }
      rx.fillStyle = '#9a9a9a'; rx.fillRect(0, 0, W, H);
    }
    Tex.blotches(x, W, H, 18, 20, 90, (q) => `rgba(${q.next() < 0.7 ? '40,35,30' : '255,250,240'},${q.range(0.03, 0.08)})`, rng);
    if (style.kind !== 'curtain') Tex.noise(x, W, H, 10, rng);

    // streaks of grime under windows
    const glassColors = style.glass || ['#6f8698', '#2a3846'];
    for (let j = 0; j < floors; j++) {
      for (let i = 0; i < bays; i++) {
        const x0 = i * cw, y0 = H - (j + 1) * ch;
        if (style.kind === 'curtain') {
          Tex._curtainCell(x, rx, bx, x0, y0, cw, ch, style, rng);
          continue;
        }
        const ww = cw * style.winW, wh = ch * style.winH;
        const wx = x0 + (cw - ww) / 2, wy = y0 + ch * (1 - style.sillH) - wh;
        // pilaster shading between bays
        if (style.pilasters) {
          x.fillStyle = 'rgba(255,255,255,0.06)'; x.fillRect(x0, y0, 6, ch);
          x.fillStyle = 'rgba(0,0,0,0.10)'; x.fillRect(x0 + cw - 6, y0, 6, ch);
          bx.fillStyle = '#a0a0a0'; bx.fillRect(x0, y0, 8, ch); bx.fillRect(x0 + cw - 8, y0, 8, ch);
        }
        // lintel + sill
        const sillC = style.sill || [200, 196, 186];
        x.fillStyle = rgb(sillC); x.fillRect(wx - 5, wy + wh, ww + 10, 6);
        x.fillStyle = rgb(sillC, -10); x.fillRect(wx - 4, wy - 7, ww + 8, 7);
        bx.fillStyle = '#d8d8d8'; bx.fillRect(wx - 5, wy + wh, ww + 10, 6); bx.fillRect(wx - 4, wy - 7, ww + 8, 7);
        // grime streak
        const gs = x.createLinearGradient(0, wy + wh + 6, 0, wy + wh + 40);
        gs.addColorStop(0, 'rgba(30,25,20,0.16)'); gs.addColorStop(1, 'rgba(30,25,20,0)');
        x.fillStyle = gs; x.fillRect(wx, wy + wh + 6, ww, 34);
        // frame
        x.fillStyle = style.frame || '#e8e4dc'; x.fillRect(wx - 2.5, wy - 2.5, ww + 5, wh + 5);
        if (style.arch) { x.beginPath(); x.arc(wx + ww / 2, wy + 2, ww / 2 + 2.5, Math.PI, 0); x.fill(); }
        // glass with sky reflection gradient (varies per window)
        const g = x.createLinearGradient(wx, wy, wx + ww * 0.4, wy + wh);
        const tint = rng.range(-12, 12);
        g.addColorStop(0, Tex._shade(glassColors[0], tint + 15));
        g.addColorStop(0.55, Tex._shade(glassColors[1], tint));
        g.addColorStop(1, Tex._shade(glassColors[1], tint - 10));
        x.fillStyle = g; x.fillRect(wx, wy, ww, wh);
        if (style.arch) { x.beginPath(); x.arc(wx + ww / 2, wy + 2, ww / 2, Math.PI, 0); x.fill(); }
        // interiors: curtains / blinds / dark
        const it = rng.next();
        if (it < 0.3) {
          x.fillStyle = `rgba(${rng.pick(['235,226,205', '210,220,230', '240,235,225', '190,170,150'])},0.55)`;
          x.fillRect(wx + 2, wy + 2, ww * 0.26, wh - 4); x.fillRect(wx + ww * 0.74 - 2, wy + 2, ww * 0.26, wh - 4);
        } else if (it < 0.5) {
          x.fillStyle = 'rgba(230,225,215,0.45)';
          const bh = wh * rng.range(0.3, 0.8);
          for (let k = 0; k < bh; k += 3) x.fillRect(wx + 1, wy + 1 + k, ww - 2, 1.4);
        } else if (it < 0.58) {
          x.fillStyle = 'rgba(255,214,150,0.30)'; x.fillRect(wx + 2, wy + wh * 0.4, ww - 4, wh * 0.6 - 2);
        }
        // reflection streak
        x.fillStyle = 'rgba(255,255,255,0.07)';
        x.beginPath(); x.moveTo(wx + ww * 0.15, wy + wh); x.lineTo(wx + ww * 0.45, wy); x.lineTo(wx + ww * 0.62, wy); x.lineTo(wx + ww * 0.32, wy + wh); x.fill();
        // mullions
        x.fillStyle = style.frame || '#e8e4dc';
        if (style.panes >= 2) x.fillRect(wx + ww / 2 - 1.5, wy, 3, wh);
        if (style.panes >= 3) x.fillRect(wx, wy + wh * 0.32, ww, 3);
        // roughness / bump for glass
        rx.fillStyle = '#141414'; rx.fillRect(wx, wy, ww, wh);
        bx.fillStyle = '#262626'; bx.fillRect(wx, wy, ww, wh);
        bx.fillStyle = '#5c5c5c'; bx.fillRect(wx - 2.5, wy - 2.5, ww + 5, 2.5); bx.fillRect(wx - 2.5, wy, 2.5, wh);
        // window AC unit occasionally
        if (style.ac && rng.next() < 0.12) {
          x.fillStyle = '#c9c9c4'; x.fillRect(wx + ww * 0.2, wy + wh - 16, ww * 0.6, 16);
          x.fillStyle = '#9a9a96'; for (let k = 0; k < 5; k++) x.fillRect(wx + ww * 0.24, wy + wh - 14 + k * 3, ww * 0.52, 1);
          rx.fillStyle = '#909090'; rx.fillRect(wx + ww * 0.2, wy + wh - 16, ww * 0.6, 16);
          bx.fillStyle = '#e0e0e0'; bx.fillRect(wx + ww * 0.2, wy + wh - 16, ww * 0.6, 16);
        }
      }
      // floor band / cornice line
      if (style.bands) {
        const y0 = H - (j + 1) * ch;
        x.fillStyle = rgb(style.sill || style.wall, 14); x.fillRect(0, y0 + ch - 5, W, 5);
        bx.fillStyle = '#c8c8c8'; bx.fillRect(0, y0 + ch - 5, W, 5);
      }
    }
    return {
      map: Tex.tex(c), roughnessMap: Tex.tex(r, { srgb: false }), bumpMap: Tex.tex(b, { srgb: false }),
      tileW: bays * style.bayW, tileH: floors * style.floorH,
    };
  },

  _curtainCell(x, rx, bx, x0, y0, cw, ch, style, rng) {
    const spandrel = ch * 0.22;
    const g = x.createLinearGradient(x0, y0, x0 + cw * 0.3, y0 + ch);
    const t = rng.range(-10, 10);
    g.addColorStop(0, Tex._shade(style.glass[0], t + 10));
    g.addColorStop(1, Tex._shade(style.glass[1], t));
    x.fillStyle = g; x.fillRect(x0, y0, cw, ch - spandrel);
    x.fillStyle = Tex._shade(style.glass[1], -18); x.fillRect(x0, y0 + ch - spandrel, cw, spandrel);
    x.fillStyle = style.frame; x.fillRect(x0, y0, 3, ch); x.fillRect(x0, y0 + ch - spandrel, cw, 2.5); x.fillRect(x0 + cw / 2 - 1, y0, 2, ch - spandrel);
    if (rng.next() < 0.25) { x.fillStyle = 'rgba(230,225,215,0.18)'; x.fillRect(x0 + 3, y0, cw - 4, (ch - spandrel) * rng.range(0.3, 0.9)); }
    rx.fillStyle = '#101010'; rx.fillRect(x0, y0, cw, ch);
    rx.fillStyle = '#707070'; rx.fillRect(x0, y0 + ch - spandrel, cw, spandrel);
    bx.fillStyle = '#7a7a7a'; bx.fillRect(x0, y0, cw, ch);
    bx.fillStyle = '#b0b0b0'; bx.fillRect(x0, y0, 3, ch);
  },

  _shade(hex, amt) {
    const v = parseInt(hex.slice(1), 16);
    const r = MathX.clamp(((v >> 16) & 255) + amt, 0, 255) | 0;
    const g = MathX.clamp(((v >> 8) & 255) + amt, 0, 255) | 0;
    const b = MathX.clamp((v & 255) + amt, 0, 255) | 0;
    return `rgb(${r},${g},${b})`;
  },

  /* ---------------- STOREFRONTS ---------------- */
  // A ground-floor shop unit, 8 m wide x 4.2 m tall. Interiors are lit (emissive) —
  // electricity keeps working after the oxygen is gone.
  storefront(shop, seed) {
    const rng = new RNG(seed);
    const W = 1024, H = 540;
    const c = Tex.canvas(W, H), x = c.getContext('2d');
    const e = Tex.canvas(W / 2, H / 2), ex = e.getContext('2d');
    const r = Tex.canvas(W / 2, H / 2), rx = r.getContext('2d');
    ex.fillStyle = '#000'; ex.fillRect(0, 0, W / 2, H / 2);
    rx.fillStyle = '#d0d0d0'; rx.fillRect(0, 0, W / 2, H / 2);
    // wall / pilasters
    x.fillStyle = shop.wall; x.fillRect(0, 0, W, H);
    Tex.noise(x, W, H, 8, rng);
    const signY = 18, signH = 96;
    // sign band
    x.fillStyle = shop.sign; x.fillRect(26, signY, W - 52, signH);
    x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(26, signY + signH - 6, W - 52, 6);
    x.fillStyle = shop.text;
    x.font = `700 64px ${Tex.fontCond}`; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(shop.name, W / 2, signY + signH / 2 + 2);
    ex.fillStyle = 'rgba(255,255,255,0.35)'; ex.font = `700 32px ${Tex.fontCond}`; ex.textAlign = 'center'; ex.textBaseline = 'middle';
    ex.fillText(shop.name, W / 4, (signY + signH / 2 + 2) / 2);
    // window + door
    const gy = 150, gh = H - gy - 34;
    const doorW = 150, doorX = shop.doorLeft ? 60 : W - 60 - doorW;
    const winX = shop.doorLeft ? doorX + doorW + 24 : 60, winW = W - 120 - doorW - 24;
    const interior = (X, Y, Wd, Ht) => {
      const g = x.createLinearGradient(0, Y, 0, Y + Ht);
      g.addColorStop(0, shop.inside[0]); g.addColorStop(1, shop.inside[1]);
      x.fillStyle = g; x.fillRect(X, Y, Wd, Ht);
      // ceiling lights
      for (let i = 0; i < Wd / 90; i++) {
        x.fillStyle = 'rgba(255,248,225,0.8)'; x.fillRect(X + 30 + i * 90, Y + 10, 44, 6);
        ex.fillStyle = 'rgba(255,240,210,0.9)'; ex.fillRect((X + 30 + i * 90) / 2, (Y + 10) / 2, 22, 3);
      }
      // shelves / products / silhouettes
      for (let k = 0; k < 3; k++) {
        const sy = Y + Ht * (0.35 + k * 0.2);
        x.fillStyle = 'rgba(60,45,35,0.55)'; x.fillRect(X + 10, sy, Wd - 20, 5);
        for (let p = 0; p < Wd / 22; p++) {
          if (rng.next() < 0.25) continue;
          x.fillStyle = rng.pick(shop.products);
          const ph = rng.range(12, 30);
          x.fillRect(X + 14 + p * 22, sy - ph, rng.range(10, 18), ph);
        }
      }
      // counter
      x.fillStyle = 'rgba(40,30,25,0.55)'; x.fillRect(X + Wd * 0.55, Y + Ht * 0.7, Wd * 0.4, Ht * 0.3);
      // glow emissive for interior
      ex.fillStyle = 'rgba(255,236,200,0.42)'; ex.fillRect(X / 2, Y / 2, Wd / 2, Ht / 2);
      // reflection streaks
      x.fillStyle = 'rgba(255,255,255,0.09)';
      x.beginPath(); x.moveTo(X + Wd * 0.1, Y + Ht); x.lineTo(X + Wd * 0.35, Y); x.lineTo(X + Wd * 0.45, Y); x.lineTo(X + Wd * 0.2, Y + Ht); x.fill();
      x.beginPath(); x.moveTo(X + Wd * 0.55, Y + Ht); x.lineTo(X + Wd * 0.8, Y); x.lineTo(X + Wd * 0.83, Y); x.lineTo(X + Wd * 0.58, Y + Ht); x.fill();
      rx.fillStyle = '#121212'; rx.fillRect(X / 2, Y / 2, Wd / 2, Ht / 2);
    };
    x.fillStyle = shop.frame; x.fillRect(winX - 8, gy - 8, winW + 16, gh + 16); x.fillRect(doorX - 8, gy - 8, doorW + 16, gh + 8);
    interior(winX, gy, winW, gh);
    interior(doorX, gy, doorW, gh);
    x.fillStyle = shop.frame;
    x.fillRect(winX + winW / 2 - 3, gy, 6, gh);
    x.fillRect(doorX + doorW - 22, gy + gh * 0.45, 8, 60); // handle
    // window decal
    if (shop.decal) {
      x.fillStyle = 'rgba(255,255,255,0.85)'; x.font = `600 30px ${Tex.fontSans}`; x.textAlign = 'center';
      x.fillText(shop.decal, winX + winW / 4, gy + gh * 0.22);
    }
    // kick plate
    x.fillStyle = 'rgba(30,30,30,0.85)'; x.fillRect(0, H - 34, W, 34);
    return { map: Tex.tex(c, { repeat: false }), emissiveMap: Tex.tex(e, { repeat: false }), roughnessMap: Tex.tex(r, { srgb: false, repeat: false }) };
  },

  /* ---------------- MISC ---------------- */
  hoarding(seed) {
    const rng = new RNG(seed);
    const W = 1024, H = 320, c = Tex.canvas(W, H), x = c.getContext('2d');
    x.fillStyle = '#2f4d3c'; x.fillRect(0, 0, W, H);
    Tex.noise(x, W, H, 10, rng);
    x.strokeStyle = 'rgba(0,0,0,0.35)'; x.lineWidth = 3;
    for (let i = 0; i <= 8; i++) { x.beginPath(); x.moveTo(i * W / 8, 0); x.lineTo(i * W / 8, H); x.stroke(); }
    x.fillStyle = '#f2f2ea'; x.font = `700 34px ${Tex.fontCond}`; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText('CONSTRUCTION SITE  ·  AUTHORISED ACCESS ONLY', W * 0.5, 42);
    // safety signs
    const sign = (sx, title, sub, col) => {
      x.fillStyle = '#f4f4f0'; x.fillRect(sx, 90, 170, 190);
      x.fillStyle = col; x.fillRect(sx, 90, 170, 54);
      x.fillStyle = col === '#f2c21b' ? '#111' : '#fff'; x.font = `700 30px ${Tex.fontCond}`;
      x.fillText(title, sx + 85, 118);
      x.fillStyle = '#222'; x.font = `600 21px ${Tex.fontSans}`;
      sub.forEach((s, i) => x.fillText(s, sx + 85, 178 + i * 28));
    };
    sign(60, 'DANGER', ['OVERHEAD', 'WORK'], '#c8202a');
    sign(290, 'CAUTION', ['HOT WORK', 'IN PROGRESS'], '#f2c21b');
    sign(520, 'NOTICE', ['HARD HATS', 'REQUIRED'], '#1d62b5');
    // posters
    for (let i = 0; i < 2; i++) {
      const px = 760 + i * 120;
      x.fillStyle = rng.pick(['#e8473e', '#f5c23d', '#3f8fd8', '#ef7ab0']); x.fillRect(px, 96, 104, 150);
      x.fillStyle = 'rgba(255,255,255,0.85)'; x.font = `700 22px ${Tex.fontCond}`;
      x.fillText(rng.pick(['LIVE', 'JAZZ', 'FRI']), px + 52, 130); x.font = `500 14px ${Tex.fontSans}`; x.fillText('CITY HALL', px + 52, 222);
    }
    return Tex.tex(c);
  },

  lattice(color = '#e8b91c') {
    const W = 64, H = 64, c = Tex.canvas(W, H), x = c.getContext('2d');
    x.clearRect(0, 0, W, H);
    x.strokeStyle = color; x.lineWidth = 5;
    x.strokeRect(2.5, -5, W - 5, H + 10);
    x.lineWidth = 3;
    x.beginPath(); x.moveTo(3, 0); x.lineTo(W - 3, H); x.moveTo(W - 3, 0); x.lineTo(3, H); x.stroke();
    x.beginPath(); x.moveTo(0, 2); x.lineTo(W, 2); x.stroke();
    return Tex.tex(c);
  },

  rim() {
    const S = 128, c = Tex.canvas(S, S), x = c.getContext('2d');
    x.fillStyle = '#151516'; x.fillRect(0, 0, S, S);
    x.fillStyle = '#9ea3a8'; x.beginPath(); x.arc(64, 64, 42, 0, 7); x.fill();
    x.fillStyle = '#2a2c2f'; x.beginPath(); x.arc(64, 64, 36, 0, 7); x.fill();
    x.strokeStyle = '#c4c8cc'; x.lineWidth = 9;
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; x.beginPath(); x.moveTo(64, 64); x.lineTo(64 + Math.cos(a) * 38, 64 + Math.sin(a) * 38); x.stroke(); }
    x.fillStyle = '#d4d8dc'; x.beginPath(); x.arc(64, 64, 9, 0, 7); x.fill();
    return Tex.tex(c, { repeat: false });
  },

  ledSign(text, color = '#ffad2a') {
    const W = 512, H = 64, c = Tex.canvas(W, H), x = c.getContext('2d');
    x.fillStyle = '#050505'; x.fillRect(0, 0, W, H);
    x.fillStyle = color; x.font = `700 44px ${Tex.fontCond}`; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(text, W / 2, H / 2 + 2);
    // dot-matrix mask
    x.fillStyle = 'rgba(0,0,0,0.55)';
    for (let i = 0; i < W; i += 4) x.fillRect(i, 0, 1.4, H);
    for (let j = 0; j < H; j += 4) x.fillRect(0, j, W, 1.4);
    return Tex.tex(c, { repeat: false });
  },

  label(lines, { w = 512, h = 256, bg = '#1c6b3a', fg = '#fff', font = 64, border = null, align = 'center' } = {}) {
    const c = Tex.canvas(w, h), x = c.getContext('2d');
    x.fillStyle = bg; x.fillRect(0, 0, w, h);
    if (border) { x.strokeStyle = border; x.lineWidth = 8; x.strokeRect(6, 6, w - 12, h - 12); }
    x.fillStyle = fg; x.textAlign = align; x.textBaseline = 'middle';
    const n = lines.length;
    lines.forEach((ln, i) => {
      const f = Array.isArray(ln) ? ln[1] : font;
      x.font = `700 ${f}px ${Tex.fontCond}`;
      x.fillText(Array.isArray(ln) ? ln[0] : ln, align === 'center' ? w / 2 : 24, (h / (n + 1)) * (i + 1));
    });
    return Tex.tex(c, { repeat: false });
  },

  adPanel(seed) {
    const rng = new RNG(seed);
    const W = 256, H = 448, c = Tex.canvas(W, H), x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#ff7a3d'); g.addColorStop(0.55, '#f13d6b'); g.addColorStop(1, '#5b2bd1');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.fillStyle = 'rgba(255,255,255,0.18)';
    for (let i = 0; i < 6; i++) { x.beginPath(); x.arc(rng.next() * W, rng.next() * H, rng.range(20, 70), 0, 7); x.fill(); }
    // product (stylised shoe)
    x.fillStyle = '#fff';
    x.beginPath(); x.moveTo(40, 300); x.quadraticCurveTo(70, 230, 120, 250); x.lineTo(160, 262); x.quadraticCurveTo(220, 270, 222, 300); x.lineTo(222, 318); x.lineTo(40, 318); x.closePath(); x.fill();
    x.fillStyle = '#ffd23d'; x.fillRect(40, 312, 182, 8);
    x.fillStyle = '#fff'; x.font = `800 46px ${Tex.fontCond}`; x.textAlign = 'center';
    x.fillText('RUN THE', W / 2, 92); x.fillText('CITY', W / 2, 142);
    x.font = `600 18px ${Tex.fontSans}`; x.fillText('NEW AIRFLOW 2', W / 2, 380);
    return Tex.tex(c, { repeat: false });
  },

  // big rooftop LED billboard (mains powered — it dies with the grid)
  billboard() {
    // a muted, image-led ad (minimal text): sea-grey gradient, soft sun disc, horizon line
    const W = 1024, H = 512, c = Tex.canvas(W, H), x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#2f4a57'); g.addColorStop(0.62, '#7d97a0'); g.addColorStop(0.63, '#4e6872'); g.addColorStop(1, '#22343d');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    const sun = x.createRadialGradient(690, 300, 10, 690, 300, 170);
    sun.addColorStop(0, 'rgba(255,236,206,0.95)'); sun.addColorStop(0.35, 'rgba(255,220,180,0.55)'); sun.addColorStop(1, 'rgba(255,210,170,0)');
    x.fillStyle = sun; x.fillRect(0, 0, W, H);
    // a runner silhouette on the shoreline
    x.fillStyle = 'rgba(15,22,28,0.85)';
    x.beginPath(); x.ellipse(300, 248, 14, 16, 0, 0, 7); x.fill();
    x.beginPath(); x.moveTo(292, 264); x.lineTo(312, 264); x.lineTo(320, 318); x.lineTo(346, 348); x.lineTo(336, 356); x.lineTo(306, 328); x.lineTo(284, 360); x.lineTo(272, 352); x.lineTo(290, 318); x.closePath(); x.fill();
    x.fillStyle = 'rgba(240,235,225,0.85)'; x.font = `500 30px ${Tex.fontSans}`; x.textAlign = 'left'; x.textBaseline = 'middle';
    x.fillText('AERO', 60, 450); x.font = `400 20px ${Tex.fontSans}`; x.fillStyle = 'rgba(240,235,225,0.6)'; x.fillText('new season', 150, 452);
    x.fillStyle = 'rgba(0,0,0,0.3)';
    for (let i = 0; i < W; i += 4) x.fillRect(i, 0, 1, H);
    for (let j = 0; j < H; j += 4) x.fillRect(0, j, W, 1);
    return Tex.tex(c, { repeat: false });
  },

  cartSign() {
    const W = 512, H = 128, c = Tex.canvas(W, H), x = c.getContext('2d');
    x.fillStyle = '#c62f24'; x.fillRect(0, 0, W, H);
    x.fillStyle = '#ffd34a'; x.fillRect(0, H - 16, W, 16);
    x.fillStyle = '#fff'; x.font = `800 58px ${Tex.fontCond}`; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText('CHARCOAL GRILL', W / 2, 52);
    return Tex.tex(c, { repeat: false });
  },

  softDot() {
    const S = 64, c = Tex.canvas(S, S), x = c.getContext('2d');
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.45, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, S, S);
    return Tex.tex(c, { srgb: false, repeat: false });
  },
};

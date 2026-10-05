/* =====================================================================
   Geometry helpers + static batching.
   Static scenery is merged into a handful of meshes (one per material)
   so the city renders with few draw calls.
   ===================================================================== */

const Geo = {
  _m: new THREE.Matrix4(),
  _q: new THREE.Quaternion(),
  _e: new THREE.Euler(0, 0, 0, 'YXZ'),
  _s: new THREE.Vector3(),
  _p: new THREE.Vector3(),

  matrix(x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
    Geo._e.set(rx, ry, rz, 'YXZ');
    Geo._q.setFromEuler(Geo._e);
    return new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), Geo._q.clone(), new THREE.Vector3(sx, sy, sz));
  },

  // Quad from 4 corners (BL, BR, TR, TL as seen from the front), UVs given per corner
  quad(a, b, c, d, u0 = 0, v0 = 0, u1 = 1, v1 = 1) {
    const g = new THREE.BufferGeometry();
    const pos = [...a, ...b, ...c, ...a, ...c, ...d];
    const uv = [u0, v0, u1, v0, u1, v1, u0, v0, u1, v1, u0, v1];
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.computeVertexNormals();
    return g;
  },

  // Four outward-facing walls of a box with UVs measured in texture tiles
  // (so facade windows line up with real floor heights).
  boxSides(x0, x1, y0, y1, z0, z1, tileW, tileH, vOffset = 0) {
    const geos = [];
    const v0 = vOffset, v1 = vOffset + (y1 - y0) / tileH;
    const faces = [
      [[x0, z1], [x1, z1]], // +Z
      [[x1, z1], [x1, z0]], // +X
      [[x1, z0], [x0, z0]], // -Z
      [[x0, z0], [x0, z1]], // -X
    ];
    let u = 0;
    for (const [p, q] of faces) {
      const len = Math.hypot(q[0] - p[0], q[1] - p[1]);
      const u1 = u + len / tileW;
      geos.push(Geo.quad([p[0], y0, p[1]], [q[0], y0, q[1]], [q[0], y1, q[1]], [p[0], y1, p[1]], u, v0, u1, v1));
      u = Math.round(u1 * 4) / 4; // restart near a bay boundary
    }
    return THREE.mergeGeometries(geos);
  },

  // Horizontal rectangle (y up), UV in metres / tile
  flat(x0, x1, z0, z1, y, tile = 1) {
    return Geo.quad([x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0], x0 / tile, -z1 / tile, x1 / tile, -z0 / tile);
  },

  prep(g) {
    let geo = g.index ? g.toNonIndexed() : g;
    if (!geo.attributes.uv) {
      const n = geo.attributes.position.count;
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(n * 2), 2));
    }
    if (!geo.attributes.normal) geo.computeVertexNormals();
    for (const k of Object.keys(geo.attributes)) if (!['position', 'normal', 'uv', 'color'].includes(k)) geo.deleteAttribute(k);
    return geo;
  },
};

/**
 * Collects geometry per material and merges it into single meshes.
 */
class Batcher {
  constructor() { this.buckets = new Map(); }

  add(geo, material, matrix, opts = {}) {
    const key = material.uuid + (opts.noShadow ? '_ns' : '') + (opts.noReceive ? '_nr' : '');
    if (!this.buckets.has(key)) this.buckets.set(key, { material, geos: [], opts });
    let g = Geo.prep(geo.clone());
    if (matrix) g.applyMatrix4(matrix);
    if (opts.color) {
      const n = g.attributes.position.count, arr = new Float32Array(n * 3), c = new THREE.Color(opts.color);
      for (let i = 0; i < n; i++) { arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b; }
      g.setAttribute('color', new THREE.Float32BufferAttribute(arr, 3));
    }
    this.buckets.get(key).geos.push(g);
  }

  box(w, h, d, x, y, z, material, ry = 0, opts) {
    this.add(new THREE.BoxGeometry(w, h, d), material, Geo.matrix(x, y, z, 0, ry, 0), opts);
  }

  build(parent, name = 'static') {
    const meshes = [];
    for (const { material, geos, opts } of this.buckets.values()) {
      // all geos in a bucket must share attribute sets
      const hasColor = geos.some((g) => g.attributes.color);
      if (hasColor) for (const g of geos) if (!g.attributes.color) {
        const n = g.attributes.position.count, arr = new Float32Array(n * 3).fill(1);
        g.setAttribute('color', new THREE.Float32BufferAttribute(arr, 3));
      }
      const merged = THREE.mergeGeometries(geos, false);
      if (!merged) { console.warn('merge failed for', material.name); continue; }
      merged.computeBoundingSphere();
      const mesh = new THREE.Mesh(merged, material);
      mesh.name = name + ':' + (material.name || 'mat');
      mesh.castShadow = !opts.noShadow;
      mesh.receiveShadow = !opts.noReceive;
      mesh.matrixAutoUpdate = false;
      mesh.updateMatrix();
      parent.add(mesh);
      meshes.push(mesh);
    }
    this.buckets.clear();
    return meshes;
  }
}

/** Material cache so identical colours share one material */
const Mat = {
  cache: new Map(),
  std(color, opts = {}) {
    const key = 'std' + color + JSON.stringify(opts);
    if (!Mat.cache.has(key)) {
      const m = new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0, ...opts });
      m.name = 'std' + color;
      Mat.cache.set(key, m);
    }
    return Mat.cache.get(key);
  },
};

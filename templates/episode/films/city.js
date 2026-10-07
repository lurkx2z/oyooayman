/* =====================================================================
   CITY — the episode's street: a subclass of the shared overcast city (js/world/environment.js).
   Override only what this episode changes (_sky, _lights, _buildings, props…). Environment.update is
   Oxygen-specific, so every subclass writes its own update(t).
   ===================================================================== */

// the street (metres; the camera looks down −Z; you walk the right-hand sidewalk). Environment reads this global.
const LAYOUT = {
  roadHalf: 7.0, curbH: 0.15, frontage: 12.5, laneW: 3.5,
  crossZ: -48, crossHalf: 7,
  zNear: 160, zFar: -1200,
  busStop: { x: -10.2, z: -21 },
  lot: { x0: 12.5, x1: 12.5, z0: -35.5, z1: -35.5 },      // no construction lot: buildings run up to the cross street
};

class __Tag__City extends Environment {
  build() {
    this._materials();
    this._sky();             // overcast default (override for sunny / night / rain: see films/sim/city.js, films/slip/street.js)
    this._lights();
    this._ground();
    this._markings();
    this._buildings();
    this._skyline();
    this._trees();
    this._streetFurniture();
    this._signals();
    this._hazeCards();       // soft drifting haze layers between blocks (needs this.camera, set before build)
    this.batch.build(this.root, 'env');
    this._environmentMap();
  }

  update(t) {
    // haze cards face the viewer and drift (same as the base class)
    if (this.haze && this.camera) {
      const cp = this.camera.position;
      for (const hz of this.haze) {
        hz.m.rotation.y = Math.atan2(cp.x - hz.m.position.x, cp.z - hz.m.position.z);
        hz.mat.uniforms.uOff.value.x = hash1(hz.drift * 1000) + t * hz.drift;
        hz.mat.uniforms.uColor.value.copy(this.scene.fog.color).multiplyScalar(1.06);
        hz.mat.uniforms.uNear.value = MathX.smooth(Math.hypot(cp.x - hz.m.position.x, cp.z - hz.m.position.z), 14, 30);
      }
    }
    this.skyUniforms.uTime.value = t;
    if (this.skyUniforms.uO2) this.skyUniforms.uO2.value = 1;     // (the base sky has an Oxygen-film darkening uniform)
    this._updateSignals(t, 1);                                    // normal signal cycle, mains power on
  }
}

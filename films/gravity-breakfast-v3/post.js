/* =====================================================================
   POST — GbPost: the shared PostProcessing chain + a cheap DEPTH OF FIELD term (film-side subclass;
   js/fx/postprocessing.js is unchanged). It reuses what the chain already computes: the AO pass keeps the view
   depth in its G channel, and the bloom pyramid's quarter/eighth-res blurs are the out-of-focus image.
   params: dof (0 = off; ~0.2 subtle … 2+ macro), focus (metres).
   ===================================================================== */

class GbPost extends PostProcessing {
  constructor(renderer) {
    super(renderer);
    this.params.dof = 0; this.params.focus = 5;
    const u = this.compMat.uniforms;
    u.uDof = { value: 0 }; u.uFocus = { value: 5 };
    let fs = this.compMat.fragmentShader;
    fs = fs.replace('uniform float uAO, uAODebug, uFogDensity, uUneven;', 'uniform float uAO, uAODebug, uFogDensity, uUneven;\n        uniform float uDof, uFocus;');
    fs = fs.replace('vec2 aoz = texture2D(tAO, uv).rg;', `vec2 aoz = texture2D(tAO, uv).rg;
          float gbCoc = 0.0;
          if (uDof > 0.0) {
            float zz = aoz.y < -9000.0 ? 1000.0 : -aoz.y;
            gbCoc = clamp(uDof * abs(zz - uFocus) / max(zz, 0.05), 0.0, 1.0);
            vec3 gbB = mix(bq, be, smoothstep(0.4, 1.0, gbCoc));
            col = mix(col, gbB, smoothstep(0.04, 0.5, gbCoc));
          }`);
    fs = fs.replace('float aoK = (1.0 - aoz.x) * uAO * exp(-uFogDensity * -aoz.y);', 'float aoK = (1.0 - aoz.x) * uAO * exp(-uFogDensity * -aoz.y) * (1.0 - gbCoc);');
    if (!/gbCoc = clamp/.test(fs) || !/\(1\.0 - gbCoc\)/.test(fs)) console.warn('GbPost: depth-of-field injection did not apply (postprocessing.js changed?)');
    this.compMat.fragmentShader = fs;
  }

  render(scene, camera) {
    const u = this.compMat.uniforms;
    u.uDof.value = this.params.dof || 0; u.uFocus.value = this.params.focus || 5;
    super.render(scene, camera);
  }
}

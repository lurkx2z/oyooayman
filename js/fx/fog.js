/* =====================================================================
   FOG — shared atmospheric haze for every film (patches three's fog chunks).

   Plain exponential fog (three's FogExp2 is squared, which keeps the midground
   too clear and then slams far objects to a flat wall). Foreground stays crisp,
   the midground fades a little, the background washes out. The haze is uneven:
   denser near the ground and varying in slow banks, and capped so far shapes
   keep a silhouette instead of turning into a flat wall.

   Call installFog(options) once, before any material compiles:
     bankScale  size of the slow banks (1 / metres)      default 0.011
     bankAmount how much the banks vary the density      default 0.56
     lowHeight  ground-haze falloff height (m)           default 4.5
     lowAmount  extra density at ground level            default 0.75
     cap        maximum fog cover (0..1)                 default 0.9
   ===================================================================== */

function installFog(o = {}) {
  if (installFog.done) return;
  installFog.done = true;
  const f = (v) => Number(v).toFixed(4);
  const bankScale = f(o.bankScale ?? 0.011), bankAmount = o.bankAmount ?? 0.56, lowHeight = f(o.lowHeight ?? 4.5), lowAmount = f(o.lowAmount ?? 0.75), cap = f(o.cap ?? 0.9);
  const SC = THREE.ShaderChunk;
  SC.fog_pars_vertex = SC.fog_pars_vertex.replace('varying float vFogDepth;', 'varying float vFogDepth;\n\tvarying vec3 vFogWorld;');
  SC.fog_vertex = SC.fog_vertex.replace(
    'vFogDepth = - mvPosition.z;',
    // world position from view space (the view matrix is rigid), so instancing / skinning are already included
    'vFogDepth = - mvPosition.z;\n\tvFogWorld = transpose( mat3( viewMatrix ) ) * ( mvPosition.xyz - viewMatrix[ 3 ].xyz );');
  SC.fog_pars_fragment = SC.fog_pars_fragment.replace(
    'varying float vFogDepth;',
    `varying float vFogDepth;
\tvarying vec3 vFogWorld;
\tfloat fogHash( vec2 p ) { return fract( sin( dot( p, vec2( 127.1, 311.7 ) ) ) * 43758.5453 ); }
\tfloat fogNoise( vec2 p ) { vec2 i = floor( p ), f = fract( p ); vec2 u = f * f * ( 3.0 - 2.0 * f );
\t\treturn mix( mix( fogHash( i ), fogHash( i + vec2( 1, 0 ) ), u.x ), mix( fogHash( i + vec2( 0, 1 ) ), fogHash( i + vec2( 1, 1 ) ), u.x ), u.y ); }`);
  SC.fog_fragment = SC.fog_fragment.replace(
    'fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );',
    // (the chunk line starts with "float ", so this continues that declaration)
    `fogBank = ${f(1 - bankAmount / 2)} + ${f(bankAmount)} * fogNoise( vFogWorld.xz * ${bankScale} + 3.0 );   // slow banks
\t\tfloat fogLow = 1.0 + ${lowAmount} * exp( - max( vFogWorld.y, 0.0 ) / ${lowHeight} );            // ground haze
\t\tfloat fogFactor = min( 1.0 - exp( - fogDensity * vFogDepth * fogBank * fogLow ), ${cap} );   // capped: far shapes keep a silhouette`);
}

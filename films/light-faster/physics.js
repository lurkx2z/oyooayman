/* =====================================================================
   PHYSICS — "What if the speed of light increased and couldn't stop?" Every number on screen comes from here.
   STORY time s: seconds after Saturday 7 November 2026, 9:00:00.000 PM (a moonless night on a southern coast,
   latitude 33.9° S). From s = 0 light gets 1% faster every second, compounding, for ever: c(s) = c₀ · 1.01^s.
   THE ONE IMPOSSIBLE THING: c changes while the electron's charge and mass, Planck's constant, ε₀ and gravity stay put.
   (Physically that is the fine-structure constant α = e²/4πε₀ħc falling as 1/k.) Light already on its way speeds up
   too and keeps its energy. Everything else follows (k = c/c₀):
     magnetism             μ₀ = 1/(ε₀c²): every magnetic force at a given current or magnetisation ∝ 1/k²
     iron's saturation     B_sat = μ₀·M_sat ∝ 1/k²: transformers run at ~1.7 of ~2.0 T → saturate at k = 1.085
     MRI (persistent)      the flux in a superconducting loop is fixed (fluxoid), L ∝ μ₀ → I ∝ k²; quench at I = 1.21 I₀
     relativistic chemistry ∝ (Zα)² ∝ 1/k²: gold's colour (absorption edge 2.4 eV → 3.7 eV, like silver), mercury's
                           melting point (relativity lowers it by 105 K: Calvo et al. 2013), the lead-acid cell
                           (1.7 of its 2.13 V: Ahuja et al. 2011)
     thermal glow          Planck: B_ν = 2hν³/c² /(e^{hν/kT} − 1) ∝ 1/k² at the same temperature
     LEDs, plankton        spontaneous emission A ∝ 1/k³ against fixed non-radiative losses: η = 1/(1 + r k³), r = 1/9
     colour, eyes          absorption per metre = 2ωκ/c ∝ 1/k: dyes and the retina catch less (retina OD 0.4)
     old light             light that left before 9 PM arrives k× faster (and k× as much per second); together with the
                           eye's catch it looks about as bright as before (starlight ×1.4–1.5). It runs out when light
                           has swallowed the whole column: c₀∫k ds = D → k = 1 + D·ln(1.01)/c₀
     GPS                   receivers time light with the old c (and the satellites' atomic clocks drift: their
                           hyperfine splitting ∝ μ₀): they lose lock at once
     wavelength            a photon keeps its energy, so its frequency stays and its wavelength grows as k: the eye's
                           diffraction blur 1.22 λ/D (D = 7 mm at night) passes a pixel at about ×10, is 2° at ×400, and
                           at ×12,700 green light's waves are as wide as the pupil; past that almost none gets in
                           (an aperture smaller than the wave passes about (D/λ)⁴ of it)
     the Sun after 9:03    light it sends at k_e arrives squeezed by k/k_e with 1/k_e² of the power: k/k_e³, where
                           k − k_e = 499 light-s × ln 1.01 (×6 at 9:03:00, about ×1 at 9:03:17, 8% at 9:03:51)
   ===================================================================== */

const LFP = {
  C0: 299792.458,              // km/s
  RATE: 1.01,                  // per second
  LN: Math.log(1.01),
  // the rooms
  tCold: 6,                    // °C in the observatory's dome (open to the mountain night)
  // what the film shows
  kTrans: Math.sqrt(2.0 / 1.7),          // 1.085: the grid's transformer iron saturates
  kQuench: Math.sqrt(1.21),              // 1.1: the MRI wire's current is 21% over
  kGrid: 1.15,                           // the grid trips (cascading, a few seconds after the iron saturates)
  kSpark: 1.3,                           // ignition coils: ½LI² 40% down; batteries 8.6 V
};
LFP.k = (s) => (s <= 0 ? 1 : Math.exp(LFP.LN * s));
LFP.sAt = (k) => Math.log(k) / LFP.LN;
LFP.c = (s) => LFP.C0 * LFP.k(s);
LFP.magnet = (k) => 1 / (k * k);
LFP.glow = (k) => 1 / (k * k);
LFP.led = (k) => (1 + 1 / 9) / (1 + k * k * k / 9);
LFP.eye = (k) => (1 - Math.pow(10, -0.4 / k)) / (1 - Math.pow(10, -0.4));
LFP.dye = (k) => 1 / k;                                       // absorbance, relative
LFP.oldLight = (k) => k * LFP.eye(k);                          // light that left before 9 PM, as your eye sees it
LFP.gpsKm = (k) => (k - 1) * 10000;
LFP.battery = (k) => 6 * (0.43 + 1.7 / (k * k));               // a car battery's open-circuit volts
LFP.hgMelt = (k) => -38.8 + 105 * (1 - 1 / (k * k));           // °C
LFP.goldEdge = (k) => 3.7 - 1.3 / (k * k);                     // eV (visible ends at 3.1)
LFP.speakerDb = (k) => -40 * Math.log10(k);                    // amplitude ∝ B ∝ 1/k²
LFP.mriI = (k) => k * k;
// when light has used up a column of old light D light-seconds long
LFP.kOut = (Dls) => 1 + Dls * LFP.LN;
LFP.sOut = (Dls) => LFP.sAt(LFP.kOut(Dls));
LFP.LY = 365.25 * 86400;
LFP.sHgCold = LFP.sAt(Math.sqrt(1 / (1 - (LFP.tCold + 38.8) / 105)));   // 28.0 s
LFP.kGold = Math.sqrt(1.3 / (3.7 - 3.1));                                // 1.47
LFP.sGold = LFP.sAt(LFP.kGold);                                          // 38.9 s
LFP.sSun = LFP.sOut(499.0);                                              // 9:03:00: the Sun's old light is all used up
LFP.dSaturn = 4740 + 4330;                                               // light-s: Sun → Saturn → Earth (Nov 2026)
LFP.sSaturn = LFP.sOut(LFP.dSaturn);                                     // 9:07:33
LFP.dAlphaCen = 4.37 * LFP.LY;
LFP.sAlphaCen = LFP.sOut(LFP.dAlphaCen);                                 // 9:23:40

// the waves: λ ∝ k (the frequency stays). The eye's blur angle (rad) and how much light still gets through the pupil
LFP.pupil = 7e-3;                                                          // m, dark-adapted
LFP.eyeBlur = (k) => 1.22 * 550e-9 * k / LFP.pupil;                        // rad (green light)
LFP.kPupil = LFP.pupil / 550e-9;                                           // 12,727: green waves as wide as the pupil
LFP.through = (k) => 1 / (1 + Math.pow(k / LFP.kPupil, 4));               // the share that still gets in
// the Sun's light on the day side: the old light (×k) until 9:03, then the new light, squeezed, from a dimmer Sun
LFP.sunNow = (k) => { const ke = k - 499 * LFP.LN; return ke <= 1 ? k : k / (ke * ke * ke); };

// the train: 120 km/h east along the sea wall; the driver brakes when the grid goes (0.75 m/s²); its front stops by the
// beach steps (x = LF_ST.stopX)
LFP.train = { v: 33.3, a: 0.75, sBrake: 16.6 };
LFP.train.sStop = LFP.train.sBrake + LFP.train.v / LFP.train.a;          // 60.7 s
// the cars on the coast road: their engines cut out over a few seconds around ×1.3
LFP.sSpark = LFP.sAt(LFP.kSpark);                                        // 26.4 s
LFP.sQuench = LFP.sAt(LFP.kQuench);                                      // 9.58 s
LFP.sTrans = LFP.sAt(LFP.kTrans);                                        // 8.2 s
LFP.sGrid = LFP.sAt(LFP.kGrid);                                          // 14.0 s
LFP.sMag2 = LFP.sAt(2);                                                  // 69.7 s: magnets ÷4

// "×1.15" style labels
function lfKx(k) {
  if (k < 1.0005) return '×1.000';
  if (k < 2) return '×' + k.toFixed(k < 1.1 ? 3 : 2).replace(/0+$/, '').replace(/\.$/, '');
  if (k < 10) return '×' + k.toFixed(1).replace(/\.0$/, '');
  if (k < 1000) return '×' + Math.round(k);
  if (k < 1e6) return '×' + Math.round(k).toLocaleString('en-US');
  return '×' + (k / 1e6).toFixed(1) + ' million';
}
// the speed of light, km/s, for the counter
function lfCkm(s) { const c = LFP.c(s); return c < 1e7 ? Math.round(c).toLocaleString('en-US') : c < 1e9 ? (c / 1e6).toFixed(2) + ' million' : (c / 1e9).toFixed(2) + ' billion'; }

if (typeof module !== 'undefined') module.exports = { LFP, lfKx };

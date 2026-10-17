/* =====================================================================
   HUD DATA — the top-left readouts, the top tags and the "three ways" chips, as functions of time.
   Sources and numbers (PLAN.md § 1):
     the demo: Tesla event, Oct 15 2026, a SpaceX test site near McGregor, Texas (CNN, CBS/AFP, TechCrunch, Euronews)
     fans "pull up to 2 Gs" (Tesla's Lars Moravy, at the event); 10 cold-gas nozzles, ~600 L of compressed air in
       carbon-overwrapped tanks (Moravy; TechCrunch); production planned for 2028 (Musk); the flying model is not
       approved for public roads (Tesla's site, via CBS); the FAA says it does not meet its definition of an aircraft
     our estimates (labelled as such): a ~1.8 t car; suction to hold 2 g over ~5 m² of floor ≈ 7 kPa ≈ 7 % of 101 kPa;
       hovering needs ~18 kN of thrust; cold air gives ~600 m/s exhaust (Isp ≈ 60 s) → ~30 kg of air per second;
       600 L holds ~100–300 kg depending on the (unpublished) pressure → seconds of hover
   ===================================================================== */

const TR_READOUTS = [
  { from: () => TR.go + 0.3, until: () => TR.go + 2.4, label: '0–60 MPH', value: 'UNDER 1 s', sub: 'TESLA\'S CLAIM · ON THE REAR THRUSTERS' },
  { from: () => trW(5, 'moves').start, until: () => TR.inv - 0.3, label: 'AIRSPEED', value: (t) => `${Math.round(trSkyV(t) * 3.6)} km/h`, sub: 'LIFT HOLDS THE PLANE UP' },
  { from: () => TR.slow + 0.1, until: () => TR.fall + 0.6, label: 'AIRSPEED', value: (t) => `${Math.round(trSkyV(t) * 3.6)} km/h`, sub: (t) => t < TR.stall ? 'LIFT FALLS WITH SPEED²' : 'STALL · LIFT GONE' },
  { from: () => TR.twoG - 0.1, until: () => TR.tenth - 0.3, label: 'FAN SUCTION', value: 'UP TO 2 g', sub: 'TESLA\'S CLAIM' },
  { from: () => TR.tenth, until: () => TR.leave - 0.3, label: 'PRESSURE DIFFERENCE', value: '≈ 7 kPa', sub: 'UNDER 1/10 OF THE AIR\'S 101 kPa · OUR ESTIMATE' },
  { from: () => trW(13, 'six').start - 0.2, until: () => TR.blast - 0.2, label: 'COMPRESSED AIR', value: '≈ 600 L', sub: '10 NOZZLES · TESLA' },
  { from: () => trW(15, 'thirty').start - 0.2, until: () => trW(15, 'those').start - 0.15, label: 'AIR NEEDED TO HOVER', value: '≈ 30 kg/s', sub: 'OUR ESTIMATE · ~1.8 t CAR' },
  { from: () => trW(15, 'those').start, until: () => TR.heli - 0.3, label: 'HOVER TIME', value: (t) => `${Math.max(0, Math.min(t, TR.empty) - (TR.hover + 0.9)).toFixed(1)} s`,
    sub: (t) => t < TR.empty ? `TANKS ≈ ${Math.max(0, Math.round(250 - 30 * Math.max(0, t - TR.hover - 0.9)))} kg LEFT` : 'TANKS EMPTY' },
];
const TR_TAGS = [
  { from: () => TR.go + 0.1, until: () => TR.replay - 0.2, text: 'RECONSTRUCTION · FROM REPORTS OF THE DEMO' },
  { from: () => TR.replay + 0.1, until: () => TR.plane - 0.2, text: 'SLOW MOTION' },
  { from: () => TR.suck + 0.2, until: () => TR.drop - 0.2, text: 'EXPLAINER · SLOWED DOWN' },
  { from: () => TR.drop, until: () => TR.brk - 0.1, text: 'SLOW MOTION' },
  { from: () => TR.hover + 0.2, until: () => TR.heli - 0.2, text: 'WHAT IF IT TRIED TO HOVER? · OUR ESTIMATE' },
  { from: () => TR.kick - 0.3, until: () => TR.real - 0.2, text: 'RECONSTRUCTION · FROM REPORTS OF THE DEMO' },
];
// the three ways to beat gravity: shown from "three ways" to the end of the hop; the current one lit
function trWayAt(t) {
  if (t < TR.three - 0.1 || t > TR.real) return null;
  const a = StoryHUD.win(t, TR.three - 0.1, TR.real - 0.3, 0.3, 0.3);
  const on = t < TR.suck ? (t < TR.wing - 0.1 ? -1 : 0) : t < TR.thrust - 0.1 ? 1 : t < TR.hop ? 2 : -1;
  return { a, on, seen: [t >= TR.three + 0.2, t >= TR.three + 0.45, t >= TR.three + 0.7] };
}
function trReadoutAt(t) {
  for (const R of TR_READOUTS) {
    const a = R.from(), b = R.until();
    if (t >= a - 0.2 && t <= b + 0.2) {
      const k = StoryHUD.win(t, a, b, 0.2, 0.2);
      if (k <= 0) continue;
      const f = (x) => typeof x === 'function' ? x(t) : x;
      return { a: k, label: R.label, value: f(R.value), sub: f(R.sub) };
    }
  }
  return null;
}
function trTagAt(t) {
  for (const G of TR_TAGS) { const a = G.from(), b = G.until(); const k = StoryHUD.win(t, a, b, 0.15, 0.15); if (k > 0) return { a: k, text: G.text }; }
  return null;
}
// the verdict panel (section 6): what was shown, what is promised
const TR_VERDICT = {
  shown: ['Clings to a ramp upside down', 'Jumps on air thrusters', 'On a closed test site'],
  promised: ['Production in 2028', 'Flying mode not road legal'],
};

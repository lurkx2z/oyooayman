/* =====================================================================
   HUD DATA — the top-left readouts, the top tags, the "three ways" chips, the chapter cards, the verdict and the
   timeline, as functions of time. Sources and numbers (PLAN.md § 1):
     the demo: Tesla event, Oct 15 2026, a SpaceX test site near McGregor, Texas (CNN, CBS/AFP, TechCrunch, Euronews)
     fans "pull up to 2 Gs" (Tesla's Lars Moravy, at the event); 10 cold-gas nozzles, ~600 L of compressed air in
       carbon-overwrapped tanks (Moravy; TechCrunch); production planned for 2028 (Musk); the flying model is not
       approved for public roads (Tesla's site, via CBS); the FAA says it does not meet its definition of an aircraft;
       the Roadster was first shown in Nov 2017 for 2020
     history: Chaparral 2J (1970, two rear fans, banned after the season), Brabham BT46B (1978, won the Swedish GP on
       its debut, then withdrawn), McMurtry Spéirling (2025, drove upside down on its fans)
     our estimates (labelled as such): a ~1.8 t car; suction to hold 2 g over ~5 m² of floor ≈ 7 kPa ≈ 7 % of 101 kPa;
       hovering needs ~18 kN of thrust; cold air gives ~600 m/s exhaust (Isp ≈ 60 s) → ~30 kg of air per second;
       600 L holds ~200–350 kg depending on the (unpublished) pressure → seconds of hover; the loop's top (R = 4.6 m)
       needs v ≥ √(gR) ≈ 6.7 m/s ≈ 24 km/h
   ===================================================================== */

const TR_CLAIM = 'TESLA\'S CLAIM';
const TR_READOUTS = [
  // the claims, one after another on the words
  { from: () => trW(5, 'zero').start - 0.1, until: () => trW(5, 'ten').start - 0.15, label: '0–60 MPH', value: 'UNDER 1 s', sub: TR_CLAIM },
  { from: () => trW(5, 'ten').start, until: () => trW(5, 'fans').start - 0.15, label: 'THRUSTERS', value: '10', sub: TR_CLAIM + ' · COLD GAS' },
  { from: () => trW(5, 'fans').start, until: () => trW(5, 'on').start - 0.15, label: 'FAN SUCTION', value: 'UP TO 2 g', sub: TR_CLAIM },
  { from: () => trW(5, 'on').start, until: () => TR.questions - 0.3, label: 'ON SALE', value: '2028', sub: TR_CLAIM },
  // the wing
  { from: () => trW(9, 'moves').start, until: () => TR.speed - 0.2, label: 'AIRSPEED', value: (t) => `${Math.round(trSkyV(t) * 3.6)} km/h`, sub: 'LIFT HOLDS THE PLANE UP · ILLUSTRATIVE' },
  { from: () => TR.speed + 0.1, until: () => trE(10) + 1.2, label: (t) => t < trW(10, 'twice').start ? 'AIRSPEED' : 'TWICE THE SPEED', value: (t) => t < trW(10, 'four').start ? `${Math.round(trSkyV(t) * 3.6)} km/h` : '4× THE LIFT', sub: 'LIFT GROWS WITH SPEED² · ILLUSTRATIVE' },
  { from: () => TR.slow + 0.1, until: () => TR.fall + 0.6, label: 'AIRSPEED', value: (t) => `${Math.round(trSkyV(t) * 3.6)} km/h`, sub: (t) => t < TR.stall ? 'LIFT NEEDS SPEED² · ILLUSTRATIVE' : 'STALL · LIFT COLLAPSES' },
  { from: () => trS(15) + 1.2, until: () => TR.race - 0.3, label: 'AIRSPEED', value: (t) => `${Math.round(trSkyV(t) * 3.6)} km/h`, sub: 'SPEED BACK · LIFT BACK' },
  // the race car
  { from: () => trW(16, 'downforce').start, until: () => TR.theory - 0.2, label: 'DOWNFORCE', value: 'MORE THAN ITS WEIGHT', sub: 'AT RACING SPEED · AN OFTEN-QUOTED ESTIMATE' },
  { from: () => TR.catch + 0.3, until: () => TR.toy - 0.3, label: 'SPEED', value: (t) => `${Math.round(trTrackCatchV(t) * 3.6)} km/h`, sub: (t) => `DOWNFORCE ≈ ${Math.round(100 * trTrackCatchDF(t))} % OF ITS WEIGHT · ILLUSTRATIVE` },
  // the loop
  { from: () => TR.numbers + 0.2, until: () => TR.flat - 0.3, label: 'SPEED NEEDED AT THE TOP', value: '≈ 25 km/h', sub: 'v² / R ≥ g ON THIS LOOP · OUR ESTIMATE' },
  { from: () => trW(21, 'flat').start, until: () => TR.flatFall + 0.4, label: 'A FLAT CEILING', value: 'NO CURVE', sub: 'NOTHING PINS YOU UP THERE' },
  // suction
  { from: () => TR.twoG - 0.1, until: () => TR.tenth - 0.3, label: 'FAN SUCTION', value: 'UP TO 2 g', sub: TR_CLAIM + ' · TWICE ITS WEIGHT' },
  { from: () => TR.tenth, until: () => TR.old - 0.3, label: 'PRESSURE DIFFERENCE', value: '≈ 7 kPa', sub: 'UNDER 1/10 OF THE AIR\'S 101 kPa · OUR ESTIMATE' },
  { from: () => TR.old + 0.3, until: () => TR.brabham - 0.3, label: 'CHAPARRAL 2J', value: '1970', sub: 'TWO FANS AT THE BACK · BANNED' },
  { from: () => TR.brabham + 0.3, until: () => TR.mcm - 0.3, label: 'BRABHAM BT46B', value: '1978', sub: 'WON ITS FIRST RACE · WITHDRAWN' },
  { from: () => TR.mcm + 0.3, until: () => TR.surface - 0.3, label: 'McMURTRY SPÉIRLING', value: '2025', sub: (t) => t < trW(29, 'grip').start ? 'DROVE UPSIDE DOWN ON ITS FANS' : 'FANS GRIP EVEN STANDING STILL' },
  { from: () => TR.surface + 0.3, until: () => TR.leave - 0.3, label: 'SUCTION NEEDS', value: 'A SURFACE', sub: 'FANS CAN ONLY PULL YOU TOWARDS SOMETHING' },
  // thrust
  { from: () => trW(34, 'cold').start - 0.1, until: () => TR.space2 - 0.2, label: 'COLD-GAS THRUSTERS', value: 'NOTHING BURNS', sub: 'COMPRESSED AIR, LET OUT THROUGH NOZZLES' },
  { from: () => trW(35, 'six').start - 0.2, until: () => TR.blast - 0.2, label: 'COMPRESSED AIR', value: '≈ 600 L', sub: '10 NOZZLES · ' + TR_CLAIM },
  // the hover thought-experiment
  { from: () => trW(39, 'almost').start - 0.1, until: () => TR.kilos - 0.3, label: 'THRUST TO HOVER', value: '≈ 18 kN', sub: 'THE CAR\'S WHOLE WEIGHT (≈ 1.8 t) · OUR ESTIMATE' },
  { from: () => trW(40, 'thirty').start - 0.2, until: () => TR.lift0 + 0.2, label: 'AIR NEEDED TO HOVER', value: '≈ 30 kg/s', sub: 'OUR ESTIMATE · COLD AIR LEAVES AT ≈ 600 m/s' },
  { from: () => TR.lift0 + 0.5, until: () => TR.heli - 0.3, label: 'HOVER TIME', value: (t) => `${Math.max(0, Math.min(t, TR.empty) - (TR.lift0 + 0.5)).toFixed(1)} s`,
    sub: (t) => t < TR.empty ? `TANKS ≈ ${Math.max(0, Math.round(30 * (TR.empty - Math.max(t, TR.lift0 + 0.5))))} kg LEFT · OUR ESTIMATE` : 'TANKS EMPTY' },
  // the reality check
  { from: () => trW(50, 'america').start - 0.1, until: () => TR.human - 0.4, label: 'THE FAA', value: 'NOT AN AIRCRAFT', sub: 'FLYING MODE NOT LEGAL ON PUBLIC ROADS' },
];
const TR_TAGS = [
  { from: () => TR.when + 0.2, until: () => TR.did - 0.2, text: 'OCT 15 2026 · SPACEX TEST SITE · McGREGOR, TEXAS' },
  { from: () => TR.did + 0.2, until: () => TR.questions - 0.2, text: 'RECONSTRUCTION · FROM REPORTS OF THE DEMO' },
  { from: () => TR.questions + 0.1, until: () => TR.three - 0.2, text: 'SLOW MOTION · RECONSTRUCTION' },
  { from: () => TR.theory + 0.1, until: () => TR.toy - 0.2, text: 'IN THEORY · NOBODY HAS TRIED IT' },
  { from: () => TR.toy + 5.9, until: () => TR.toyRun - 0.1, text: 'SLOW MOTION' },
  { from: () => TR.numbers + 0.1, until: () => TR.flat - 0.2, text: 'RECONSTRUCTION · SLOWED DOWN' },
  { from: () => TR.flat + 0.1, until: () => TR.flatFall - 0.7, text: 'RECONSTRUCTION · SLOWED DOWN' },
  { from: () => TR.flatFall - 0.5, until: () => TR.suck - 0.2, text: 'WHAT IF · THE FANS STOPPED' },
  { from: () => TR.suck + 0.2, until: () => TR.old - 0.2, text: 'EXPLAINER · SLOWED DOWN' },
  { from: () => TR.old + 0.1, until: () => TR.surface - 0.2, text: 'ILLUSTRATION · NOT THE REAL CARS' },
  { from: () => TR.surface + 0.1, until: () => TR.drop - 0.2, text: 'EXPLAINER · SLOWED DOWN' },
  { from: () => TR.drop, until: () => TR.newton - 0.1, text: 'SLOW MOTION' },
  { from: () => TR.newton + 0.1, until: () => TR.cold - 0.1, text: 'ILLUSTRATION' },
  { from: () => TR.cold + 0.1, until: () => TR.space2 - 0.1, text: 'FROZEN IN MID-AIR' },
  { from: () => TR.space2 + 0.1, until: () => TR.nozzles - 0.1, text: 'ILLUSTRATION' },
  { from: () => TR.nozzles + 0.1, until: () => TR.brk - 0.1, text: 'SLOW MOTION' },
  { from: () => TR.hover + 0.2, until: () => TR.heli - 0.2, text: 'WHAT IF IT TRIED TO HOVER? · OUR ESTIMATE' },
  { from: () => TR.kick - 0.3, until: () => TR.real - 0.2, text: 'RECONSTRUCTION · FROM REPORTS OF THE DEMO' },
  { from: () => TR.human + 0.2, until: () => TR.end, text: 'WHAT IF · IN THE DEMO NOBODY WAS ON BOARD' },
];
// the three ways to beat gravity: shown from "three ways" to the hop; the current one lit (none in the loop interlude)
function trWayAt(t) {
  if (t < TR.three - 0.1 || t > TR.real) return null;
  if (t > TR.old - 0.2 && t < TR.surface) return null;                         // the history cars carry their own panel
  const a = StoryHUD.win(t, TR.three - 0.1, TR.real - 0.3, 0.3, 0.3);
  const on = t < TR.wing - 0.1 ? -1 : t < TR.toy ? 0 : t < TR.suck ? -1 : t < TR.thrust - 0.1 ? 1 : t < TR.hop ? 2 : -1;
  return { a, on, seen: [t >= TR.three + 1.6, t >= TR.three + 1.9, t >= TR.three + 2.2] };
}
// the chapter cards, left of centre: [from, until, small line, big line]
const TR_CHAPTERS = [
  [() => trS(8) - 0.2, () => trS(9) + 0.6, 'WAY 1 OF 3', 'A wing'],
  [() => TR.toy + 0.1, () => TR.toy + 3.2, 'THE RAMP\'S OTHER TRICK', 'A loop'],
  [() => trS(22) - 0.2, () => trS(23) - 0.4, 'WAY 2 OF 3', 'Suction'],
  [() => trS(32) - 0.2, () => TR.newton - 0.15, 'WAY 3 OF 3', 'Thrust'],
  [() => trS(47) - 0.2, () => trS(47) + 3.4, 'SHOWN, OR PROMISED?', 'Reality check'],
  [() => trW(51, 'you').start - 0.1, () => trS(52) - 0.2, 'ONE MORE QUESTION', 'You'],
];
function trChapAt(t) {
  for (const [f, u, n, x] of TR_CHAPTERS) { const k = StoryHUD.win(t, f(), u(), 0.25, 0.35); if (k > 0) return { a: k, n, t: x }; }
  return null;
}
function trReadoutAt(t) {
  for (const R of TR_READOUTS) {
    const a = R.from(), b = R.until();
    if (t >= a - 0.2 && t <= b + 0.2) {
      const k = StoryHUD.win(t, a, b, 0.2, 0.2);
      if (k <= 0) continue;
      const f = (x) => typeof x === 'function' ? x(t) : x;
      return { a: k, label: f(R.label), value: f(R.value), sub: f(R.sub) };
    }
  }
  return null;
}
function trTagAt(t) {
  for (const G of TR_TAGS) { const a = G.from(), b = G.until(); const k = StoryHUD.win(t, a, b, 0.15, 0.15); if (k > 0) return { a: k, text: G.text }; }
  return null;
}
// the verdict panel (section 6): what was shown, what is still promised; each line on its word
const TR_VERDICT = {
  shown: [['Clings to a ramp upside down', 48, 'clings'], ['Jumps and flips on air thrusters', 48, 'jumps'], ['On a closed test site', 48, 'closed'], ['Nobody inside, as reported', 48, 'nobody']],
  promised: [['0–60 mph in under 1 second', 49, 'onesecond'], ['A road-going version', 49, 'roadgoing'], ['The price', 49, 'price']],
};
// the timeline: [year, note, appears on (clip, word, from)]
const TR_TIMELINE = [[2017, 'FIRST SHOWN', 49, 'seventeen'], [2020, 'FIRST PROMISED', 49, 'twenty', 27], [2026, 'THE DEMO', 49, 'that'], [2028, 'NOW PROMISED', 49, 'twentyeight']];

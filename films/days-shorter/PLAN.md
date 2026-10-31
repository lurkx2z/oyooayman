# What if days kept getting shorter and couldn't stop?

This is a voiceless 16:9 long-form film: 1920×1080, 30 fps, about 5:35. It follows the Slower light / Friction 10s /
Liquid air formula and the owner's YouTube lessons and retention playbook of 28 October 2026:
- an everyday place: your bedroom and the street outside it, a church at the west end, a park to the south. It stays
  on this one street for the whole week (no globe-spinning film; "Earth spins faster" is taken);
- action under the title on frame 1 (in the park, the sun racing west across the sky at 18 minutes a second);
- the first anomaly at 0:18 (every satellite dish aims at empty sky), the first early sunset at 0:30;
- the real nuance in the first minute (over the centuries real days get longer: tides, 2 ms a century; nothing could
  spin a planet up like this, which is the one impossible thing, and the HUD says so);
- a new consequence every few seconds, escalating from odd (dishes aimed at empty sky, early sunsets, the birds) to
  physical (the marble, the pond, the car) to dangerous (the sofa, the spire, the parked cars, a street that becomes a
  cliff);
- tension to the last frame: the film ends at sunrise number 18, on a mother holding her child to the railings of a
  street that is now a cliff: "At 5:07, down points sideways. And the days are still getting shorter. What would you
  hold on to?", mid-shot, no recap.

It follows the owner's rule of 29 October 2026: **the story clock only runs forward**. One clock (`DS_CLOCK`) for the
whole film, Sunday 11:30 AM to Saturday 4:32 AM. It runs as a time-lapse where we watch days go by (the HUD says
"TIME-LAPSE ×N"), at real speed for the human moments ("REAL SPEED"), and it only jumps forward at a cut ("+N h" on the
HUD clock). `shots.js` throws if a jump falls inside a shot, `script.js` throws if a segment runs backwards.

Page: `days-shorter.html`. Captions: `CAPTIONS.md` → `node build-timing.cjs` → `timing.js`. Every number on screen
comes from `physics.js` (§ 2).

## 1. The rule

From **Sunday 12:00 noon**, every hour the length of a day gets **10 minutes shorter**, and it never stops:
P(s) = 86,400 − s/6 seconds (s = story seconds after Sunday noon). P is the day's length at that moment (one turn
relative to the sun); a whole noon-to-noon is shorter still (Sunday noon to Monday noon takes 22 h 06 min), so the
film says "right now a day lasts" and labels the chips "LENGTH OF A DAY AT NOON". The day would reach zero length at s = 518,400
(144 h, the next Sunday noon); the film ends long before that, at Saturday 4:32 AM, when a day lasts 75 minutes.

- **The one impossible thing:** nothing is spinning the Earth up. Over the centuries real days get longer (tidal
  braking by the Moon adds about 2.3 ms per century; the observed net is about 1.7; a few recent years were
  record-short, which is why the caption says "over the centuries"). The film says so in the first minute (caption and HUD tag).
- The impossible push acts on everything at once, rock, sea, air and every loose object (otherwise loose things would
  feel a westward push of 0.1–0.27 m/s² on Saturday, a lean of 1–2.5° to the west). Everything else is what the faster
  spin itself does.
- An equinox week: the sun is on the celestial equator, so day and night are equal, and the sun rises due east down
  the street and sets due west down the street, past the church.

## 2. The physics (physics.js)

**The sun.** The hour angle is H(s) = 2π ∫ ds/P = 12π ln(T/(T − s)), T = 518,400 s. Sunrise at H = 270° + 360°k,
sunset at 90° + 360°k. Sunsets and sunrises (all computed, all on screen as they come):

| | time | day length then |
|---|---|---|
| Sunday sunset | 5:52 PM (7 min early) | 23 h 01 min |
| Monday sunrise / sunset | 4:55 AM / 3:04 PM | 21 h 11 min at sunrise |
| Tuesday sunrise / sunset | 12:25 AM / 9:01 AM | 17 h 56 min at sunrise |
| Wednesday | 12-hour days: 6 h of light (8:56 AM–2:56 PM), then 5 h 31 min of dark | 12 h at 12:00 |
| Thursday | 8-hour days | 7 h 35 min at 2:30 PM |
| Friday | a sunrise every 4 h, then every 3 | 2 h 45 min at 7:30 PM |
| Saturday 3:52:33 AM | the sun sets in **8.8 s** (0.53° disc on a 54.7° path) | 81 min |
| Saturday 4:31:32 AM | the last sunrise in the film | 75 min |

The stars turn with the spin against the stars (a little faster than the sun). At 4:14 AM Saturday a full turn takes
78 minutes (a clock's minute hand: 60), anticlockwise round the Pole Star. The Moon is a waxing gibbous, 110° east of the sun on Sunday.

**The push.** The spin's outward push (centrifugal) grows with ω². Only the **extra** push matters: the ground's shape
already allows for today's spin. Δ = (ω² − ω0²) R, pointing away from Earth's axis. In your town at latitude φ:
- its part against gravity is Δ cos²φ (a scale reads less);
- its part along the ground, towards the equator (due south), is Δ cos φ sin φ;
- so **down leans south** by θ = atan(Δ cos φ sin φ / (g − Δ cos²φ)).

The town is at **φ = 35.26° N**, where sin φ = 1/√3 (cos²φ = ⅔, cos φ sin φ = 0.471). That latitude is the node of the
new level surface (below), so the sea and the air stay where they are in your town (for now).

| when | day | down leans | a scale reads | at the equator, things weigh |
|---|---|---|---|---|
| Wednesday 12:45 PM (sugar) | 11 h 53 min | 0.29° | 993 g per kg | 98.9 % |
| Wednesday 1:00 PM (marble) | 11 h 50 min | 0.29° | | |
| Thursday 2:30 PM (pond) | 7 h 35 min | 0.85° | | |
| Friday 7:30 PM (walkers) | 2 h 45 min | 8.4° | you feel 84 % ("16 % lighter"); a scale on the floor reads 83 % | 74 % |
| Friday 9:40 PM (glass) | 2 h 23 min | 11.9° | | |
| Saturday 0:00 | 2 h 00 min | 19.0° | 67 % | 51 % ("half") |
| Saturday 0:15 (spire) | 1 h 57 min | 20.2° | sideways push = 0.35 of what it weighs now ("a third") | |
| Saturday 1:44 AM | 1 h 43 min | 29.9° (a roof pitch) | 55 % | 33 % |
| Saturday 2:15 AM (parked cars) | 1 h 38 min | 35.0° | 50 % | 25 % |
| Saturday 3:33:40 AM | 1 h 24 min (= a low orbit: the equator moves at 7.9 km/s) | 54.5° | 34 % | **0** (weightless) |
| Saturday 4:31 AM (last sunrise) | 1 h 15 min | 75.9° ("a cliff") | 15 % | 0 |
| Saturday **5:06:46 AM** | 1 h 09 min | **90°**: down points sideways | 0 | 0 |

**Things that slide.** Each loose thing breaks free when tan θ reaches its static friction μ (or rolling resistance),
then slides on kinetic friction 0.8 μ: a = k g_eff (sin θ − 0.8 μ cos θ), k = 5/7 for a rolling ball (`dsSlider`, a
pure table built once). μ: the marble 0.005 (0.29°; it is put down at 1:00 PM and rolls 1.3 m to the skirting), the
car in neutral without its handbrake 0.016 (rolling, 0.9°), the bins 0.15, the sofa, chair, table 0.35 (19.4°), parked
cars 0.70 (35°: tyre grip sideways; they slide before they tip). The water in the glass, the pond and
every hanging thing (swings, lamps, ropes) line up with the leaning down; so do the people (they lean north into it,
like walking up a hill). From Friday the camera's "up" follows the local up a little, so the street itself tilts.

**The sea and the air (the node).** The new level surface rises at the equator and falls at the poles as
(cos²φ − ⅔), with the elastic Earth's factor 0.7: by Monday 10 AM (the news beat) the equilibrium sea level would be
**+1,000 m at the equator and −2,000 m at the poles**, by Wednesday +8 km / −16 km. The news inset shows this
("THE SEA'S NEW LEVEL") and why 35° doesn't change.

**The quakes.** The rock is being pushed into a fatter shape. The film shows the first quake Sunday 11:40 PM, a
stronger one Wednesday 8:10 PM, and the ground trembling from Friday on. A rigid planet is assumed for every number
above; real rock would crack far worse (honest tag).

### Honest limits (said on screen where it matters)

1. **Nothing could do this** (HUD tag in the first minute: "THE ONE IMPOSSIBLE THING: NOTHING IS SPINNING IT UP").
2. **The air is pushed too, and it thins here too.** Settling on the new level surface, the air at the poles would thin and pile up at the
   equator. An estimate: the wind needed to balance the new sideways push (u ≈ push / Coriolis) would be about 70 m/s
   by Monday morning and far beyond any storm by Wednesday; at full equilibrium, the air pressure at 35° itself would
   fall (0.95 bar by Tuesday noon, 0.55 by Thursday, 0.04 by Friday). The film keeps your street's air calm and
   breathable for clarity. The caption says "for now", the news beat carries "LEFT OUT: THE AIR IS PUSHED TOO. REAL
   SKIES WOULD TURN TO STORMS", and Friday's walkers and jumping kids carry "LEFT OUT: BY NOW, THE AIR HERE WOULD BE
   THINNING TOO".
3. **The oceans.** Real polar seas (a few km deep) would drain by about Tuesday and the water would take time to
   flow, so the real sea surface would lag the equilibrium numbers. The node holds only for a global ocean that has settled, at 35° N and 35° S.
4. **Rigid ground.** The lean and slide numbers treat the ground as rigid; the sea-level numbers use the elastic
   Earth's factor 0.7. Elastic ground would follow part of the new shape, so early in the week the lean relative to the
   ground would be about 30 % smaller. Real rock would
   crack and flow: "LEFT OUT: REAL ROCK WOULD CRACK FAR WORSE" at the first quake, "LEFT OUT: BY NOW, REAL ROCK WOULD
   BE BREAKING UP" at the equator going weightless.
5. **Rounding.** "Every hour 10 minutes shorter" is exact; "about an hour" on Saturday (75 min at the end); "a third
   of what it now weighs" (0.35, sin θ; 0.24 of what it weighed on Sunday); the stars "once every 78 minutes"; "down leans 0.9°" on Thursday (0.85–0.87°).

## 3. Story time (script.js)

Story s = seconds after Sunday 12:00 noon. Real speed: the first quake (Sunday 11:40 PM), people out in daylight at
12:35 AM Tuesday, the dawn chorus, the marble (Wednesday 1:00 PM), the second quake, the car (Thursday 3:30 PM), the
walkers and the jumping kids (Friday 7:30 PM), and **all of Saturday from midnight**: the sofa (0:04:30), the spire
(0:15), the lean (1:44), the parked cars (2:15), the equator (3:33), the 9-second sunset (3:52:29), and sunrise number
18 to the end (4:31:29). Time-lapse elsewhere, from ×3,700 (Wednesday's whole day across your floor) down to ×16 (the
glass); the opening runs at ×1,100 (about 18 minutes a second: noon falls 1.6 s in), the Moon on Sunday evening at
×600, the stars at ×88 so the sky visibly wheels.

## 4. Shots (shots.js)

37 shots, cut from the captions.
- **A, Sunday to Monday:** the title in the park, looking up at the sun racing west; the park from your window; the
  street (the day-length chips); a dish seen from behind, its beam running out to empty sky, the satellite 1.4° west;
  the TV's NO SIGNAL; the early sunset down the street; the Moon racing across the night sky; ★ the first quake in your
  room; Monday's sunrise; the news (the sea's new level).
- **B, Tuesday to Thursday:** your clock at 12:25 AM; people out at night in daylight; the birds; the lamps on at
  9:01 AM; Wednesday's whole day across your floor; the scale; the push diagram; ★ the marble rolling away from you to
  the skirting, south; the second quake; the pond with its two depth gauges (water down 12 cm at the north end, up
  12 cm at the south); the car rolling away, its owner chasing it (the second angle skips 7 s ahead, so the car
  meets the park railings 4 s into it).
- **C, Friday:** the days strobing; the crooked swings; the walkers leaning into a level street; the kids' jump; the
  glass (first level with the table, the water crooked; then the camera rolls to the new down: the water is level and
  the table isn't).
- **D, Saturday:** midnight in daylight; ★ the sofa sliding across your room; ★ the spire, pushed over, tumbling into
  the churchyard; the lean (a roof pitch); the parked cars sliding; the equator diagram (the push equals gravity, one
  turn in 84 minutes, like a low orbit); ★ the 9-second sunset on a long lens; the stars wheeling round the Pole Star;
  ★ sunrise number 18 along a street that is now a cliff face, neighbours standing on the railings as on a ledge; the
  question, on a mother and her child.

## 5. Look and HUD

The gravity / friction / liquid-air films' street, park and block, low-poly stylised, warm amber sun and violet
shadows. Axes: x west, y up, z north (right-handed, so the sky turns the right way: the sun rises at the east end of
the street and sets at the west end, past the church; the stars turn anticlockwise round the Pole Star, due north,
35° up).

HUD: top left LENGTH OF A DAY, SUNRISES SINCE SUNDAY, NEXT SUNSET / SUNRISE (with "IN N s" when close); top right the
clock (weekday, h:mm:ss AM/PM, "+N h · TIME-LAPSE ×N" or "REAL SPEED") and, from the push beat, a DOWN dial (the old
down dashed, the new one leaning south). One context line per scene (kg, %, degrees, countdowns). Captions at the
bottom, numbers amber. Two diagrams: the push (Earth, its axis, gravity, the spin's push, down leaning) and the sea's
new level. Labels pinned in the scene. The honest tags bottom left.

## 6. Sound (sound-*.js, mix.js; all synthesised, seeded)

Places: inside (your room: a low room tone, the wall clock at real speed) and outside (traffic by day, crickets at
night, wind rising with the lean). Effects: a chime at each sunrise we see, TV static then the news murmur, the quakes
(rumble, rattles, car alarms in the second), the scale beep, the marble rolling, the car rolling and crashing, footsteps,
jump thuds, lamps clicking on and humming, furniture scraping and hitting (the radiator rings), the spire cracking,
creaking, falling, the parked cars' tyres scraping, the dawn chorus. Score: a D major figure for Sunday, a drone under
the quake, an accelerating pulse in B minor through the week (thinning for the marble), bells over the jump, a
heartbeat on Saturday, hits on the sofa and the spire, a 9-second swell for the last sunset, stars on F minor 9 with
bells, a big chord and the theme at the last sunrise, cut on the question. The soundtrack is baked
(`soundtrack.js`, `final-soundtrack.m4a`) with the shared fingerprint check.

## 7. Review log

Round 1 (three independent reviewers on stills every 2 s of the whole 5:45 cut, before fixes). Scores as given:

- **Retention** 5/10 overall (hook 3, first 30 s 3, middle 5, payoff 5, clarity 6). Top problems: frame 1 was a calm
  living room (no anomaly in the first 5 s); 30 s of explaining before any proof (the first visible effect at 0:34,
  a dish you couldn't see); a run of still explainer shots at 1:20–2:40; Saturday's tilt reading as a camera effect;
  the climax images not landing (no sun disc in the 9-second sunset, the "cliff" one confusing rolled frame for 20 s).
  Best teaser Shorts: the sofa (4:16), climbing the street plus the parked cars (4:42), the crooked glass (3:54).
- **Visuals**: image 6, composition 5, phone readability 6, hero moments 3.5, shots prove their captions 4.5. Failing
  shots: the Moon (a few pixels), the dish (tiny), the marble (the camera followed it, so it never moved), the pond
  (nothing changes), the spire (gone in 2 s, then bare tower), the equator (nothing about weightlessness), the
  9-second sunset (no disc, a lamp post across it), the cliff; the push diagram's text cut off; a ghost mesh in the
  glass. Best: the stars and the Pole Star, people out in daylight at 12:35 AM, the sofa.
- **Physics**: accuracy 8, honesty 7, clarity 8, learning 8, believability 7. Every number checked matched to the
  minute. Errors: "0.8°" (0.86°); "at the equator, a day is 84 minutes long" (it's 84 minutes everywhere);
  "Wednesday will last 12" and "noon to noon" (those are the day's length at that moment); "six of dark" (5 h 31);
  the node "the one latitude" (35° N and S, settled ocean only) and the air thinning in your town too (left out after
  Monday); rigid vs elastic Earth mixed; "almost as fast as a minute hand"; "downhill is south everywhere"; "without
  its handbrake" (in neutral); "real days are getting longer" (over centuries); "a third of its own weight"; "with
  their brakes on"; "the last sunrise" (reads as the last ever).

Fixed after round 1:
1. The opening: the title is now outside in the park, looking up at the sun racing west (18 minutes a second); the
   math is one caption; the dish beat comes at 0:18 (was 0:33), the early sunset at 0:30, the real-physics beat after
   it, over a night sky with the Moon crossing it in 12 s. Pauses between beats tightened (5:45 → 5:35).
2. The dish: seen from behind on its balcony, its beam drawn as amber dashes out to "THE DISH IS AIMED HERE · EMPTY
   SKY", with the satellite's real place beside it ("1.4° WEST · THE BEAM IS ONLY ~1.5° WIDE").
3. Proof shots: the marble rolls away from a still floor-level camera, 1.3 m to the skirting under a SOUTH label; the
   pond has two depth gauges (water down 12 cm at the north end, up 12 cm at the south) and gentle banks that show
   mud; the spire is pushed over, its foot snaps and it tumbles 24 m into the churchyard (dust where it lands), all in
   one wide frame; the glass water is a column with a sloping top (no ghost), and the camera rolls to the new down on
   "The water is level. Your table isn't".
4. The climax: the 9-second sunset on a 9° lens down the middle of the road, exposed for the disc (now visible, with
   "GONE IN n s" counting); sunrise number 18 along the cliff face of the street towards the sun, neighbours standing
   on the railings as on a ledge, ending close on a mother and child for "What would you hold on to?".
5. The equator beat has a diagram (the push now equals gravity; one turn in 84 min, like a low orbit; 7.9 km/s).
6. All the physics wording above; a Friday tag "LEFT OUT: BY NOW, THE AIR HERE WOULD BE THINNING TOO"; the push
   diagram re-laid out.

Not fixed (still weak): the swings are still seen end-on (8° is hard to see); the birds are specks and the lamps
barely glow; the HUD is busy; Saturday's tilted camera still has no plumb line in most frames; no big human-scale jump
on Saturday; the Moon is small at that field of view. No second scoring round was run.

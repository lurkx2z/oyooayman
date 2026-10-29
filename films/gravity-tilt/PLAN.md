# What if gravity tilted 90° for one hour?

This is a voiceless 16:9 long-form film: 1920×1080, 30 fps, 5:35. It follows the Slower light / Friction 10s formula and
the owner's YouTube lessons and retention playbook of 28 October 2026:
- an everyday place: your bedroom at 7:42 on a weekday morning, and your street;
- action under the title on frame 1;
- the physics nuance in the first minute;
- a new consequence every few seconds, escalating;
- silences before the two big moments;
- tension to the last frame, with no recap.

It also follows the owner's rule of 29 October 2026: **the story clock only runs forward.** No shot replays a second
that has already been shown, and every cut moves the hour on.

Page: `gravity-tilt.html`. Captions: `CAPTIONS.md` → `node build-timing.cjs` → `timing.js`. Every number on screen comes
from `physics.js` (§ 2).

## 1. The rule (the physical reading)

At **7:42:00 AM**, gravity on everything loose turns 90° to point **east**, with its usual strength (9.81 m/s²), for
exactly **one hour**. At 8:42:00 it turns back.

Three things keep their old down, and the film says so on screen:
- **The air.** If it fell sideways, the wind would pass the speed of sound in about 35 s, and that would be the whole
  film.
- **The ground.** Rock, soil and anything set in concrete stay put.
- **The sea.** The film notes once that every ocean would pour sideways, then stays in your town.

Nothing known can turn gravity. The film calls this a thought experiment. The real nuance it uses is Einstein's
equivalence principle: your body can't tell gravity from acceleration, so to you it is as if your house had been tipped
on its side.

## 2. The physics (physics.js)

| story time | what | how |
|---|---|---|
| 0 → 0.19 | you fall the 17 cm onto your bedroom window; the mug in your hand cracks it | GT_YOU, gtFall |
| 0.38 → 0.83 | the room falls 0.7–3.4 m east: rug, bed and wardrobe (0.45), desk, lamp, the chair's corner into the glass (0.56, a second crack), laptop, the cat (0.63, feet first: the righting reflex), the books | GT_ROOM, gtDropT |
| 1.23 | the wardrobe topples onto the bed | gtWardrobe |
| 1.5 | the shed in the back garden falls 11 m onto your back wall | room.js |
| 0.72 | the jogger, thrown back past a lamp post (she was running uphill at 3 m/s), hooks it at 4 m/s | GT_JOG |
| 2.4 → 18.8 | everything loose falls the 285 m down your street and piles up against the retaining wall at the end. The parked cars hit at **24–67 m/s** (terminal speed ~180 m/s: almost no drag over 285 m), the bins at 19–27 m/s, and a garden chair at 15 m/s (18.8 s) | GT_FALLERS, gtSolvePile |
| all hour | 385 roof tiles work loose (most in the first minutes) and flutter down the street at 20–30 m/s | GT_TILES |
| 0 → 3600 | your house (timber, bolted down by 22 anchor bolts) racks 0.55° east at once, then creeps (wood under a lasting load creeps: log time) | gtLean |
| 25 → 446 | the river 4 km west falls along its own bed; where it bends, the water doesn't. It breaks into drops that fall east at their terminal speed (~9.5 m/s) and reach your street at **7:49:26** as sideways rain | GT_RIVER, gtRain |
| 100 → 132 | the jogger climbs on top of the post and sits on it like a branch (a grip lasts about a minute) | gtJog |
| 170 → 380 | next door's bath (150 litres) comes through the edges of your door: 1.9 cm lying on your window | GT_BATH, gtPool |
| 235 | your phone's emergency alert | GTP.alert |
| 0 → 3600 | the trees bend 20–35° at the crown and hold (a tree is a branch that grew upright); they whip back at the return | gtTreeBend |
| 0 → 1620 | the brick terrace opposite (30 houses, 150 m) is held on its damp-proof course only by the mortar's grip. It creeps east in tertiary creep (d = k/(T − s) − k/T, k 88, T 1700): **30 cm at 8:06:10** (s 1450), 1.05 m when it **lets go at 8:09:00** (s 1620) | GT_TER, gtTerSlip |
| 1620 → 1626.6 | the terrace falls 120 m freely as one block (nothing inside it is loaded) and hits the end of the street at **48.5 m/s = 175 km/h**, then crumples house by house (1.7 m each) | gtTerHouse |
| 2530 | the cracked window, carrying the pool, the chair, the mug and the books under a load that never stops, lets go at **8:24:10** (static fatigue) | GT_GLASS, gtCrack |
| 3000 → 3030 | 10 minutes left: you get down into the corner where the wall meets the old floor | GT_YOU.corner |
| 3020 → 3080 | the jogger edges down to the foot of her post | GT_JOG.down |
| 3330 | one anchor bolt snaps (**8:37:30**); the house lurches 0.2° and swings | GT_BOLT |
| **3600** | gravity turns back. You drop 36 cm, the cat 57 cm (feet first), the jogger 45 cm. The house springs most of the way back and keeps **0.9°** of lean for good. The pile at the bottom drops. The rain in the air falls onto the ground for ~12 s (drops from up to 100 m) | GTP.tBack |

These are assumptions, and PLAN-level choices rather than facts:
- The falling river spreads into a sheet up to 100 m tall, densest in its lowest ~40 m.
- Your house's lee makes a rain shadow that fills in over ~45 m.
- At 7:42 the parked cars are empty, and the jogger is the only person out in the street.

## 3. Story time (script.js: GT_CLOCK)

One clock for the whole film. Story time `s` is seconds after 7:42:00, and it never goes back. It runs at real speed:
- through the first 40 s of the hour;
- when the rain arrives;
- when the terrace lets go and hits;
- when the window goes;
- at the bolt;
- through the last ten seconds and the return.

In between it runs faster (×1.2 to ×31) and jumps forward, always at a cut. The HUD shows how much and how far.
`shots.js` checks that every jump is a cut. The film times of the beats are:

| beat | film t |
|---|---|
| title | 1.5 |
| rain arrives | 184.2 |
| terrace lets go | 227.7 |
| terrace hits | 232.65 |
| window goes | 260.2 |
| bolt | 281.5 |
| 0.4 s of silence | 307.6 |
| the return | 308.0 |
| end | 334.8 |

## 4. Shots (shots.js: 55 shots; the count down has 6 quick cuts inside one shot)

The 55 shots are grouped into nine parts:

1. **The first seconds:** pov0 (your eyes at the window), room0, master (the street, falling), chair (falling with a garden chair), bottom
2. **The glass:** front, povglass, crawl, roomroll (the nuance), tipped
3. **Air, sea, river, jogger:** dust, dust2 (dust still rises the old way), town, river, bend, spray, jogger, climb
4. **The hour settles:** pit, house, sick, cat, bath, phone, trees, sun
5. **Brick and rain:** terrace, dpc, slip, rainfront, rainjog, bow (the sideways rainbow)
6. **Wood, and the terrace goes:** wood, creak, creep, going, still, release, impact, cloud
7. **The window:** pool, glassclose, glassgo
8. **The last ten minutes:** ready, jogdown, bolt, lurch, last, lastin, count
9. **Down is down:** back, backstreet, rainfall, after, question (cut on the last frame)

## 5. Look and HUD

This is the house style (STYLE_BIBLE, and § 6 of the hybrid study):
- a real-feeling low-poly world with a low autumn sun in the east-south-east, which ends up "at the bottom of your street";
- a serif title centred on frame 1, over the action;
- serif captions;
- top left, the countdown: GRAVITY BACK IN 59:42. Under it, how fast we're watching (REAL SPEED, SPED UP 25×) and,
  on a cut that moves the hour on, how far (+8 MIN). After the return it reads GRAVITY · BACK +0:12. Under that, one
  context line for the scene (the fastest car, the terrace's slip, your house's lean…);
- top right, the time this morning, and a DOWN dial showing which way down is on the screen right now;
- seven small diagrams: the glass's load, Einstein's equivalence, the air, the pits, the damp-proof course, a river
  becoming rain, wood under a long load;
- pinned labels.

When gravity has turned, the camera's up follows the new down in the shots seen "as you feel it", and the old up in
the ones seen from outside.

## 6. Sound (sound-*.js, mix.js; all synthesised, seeded)

- **The score (D).** A calm D major for a second and a half, then one low blow, and the chord slides sideways into the
  **hour chord** (D–A–E–G♯–B: no third, a raised fourth). It never lands. The hour chord is under the whole hour and
  resolves to D major only when down comes back. The theme (D–A–G♯–E, its last note bent down a semitone, like
  something tipping over) plays at the title, at Einstein, the sun, the rainbow and the question; the question's
  statement is cut on the last frame. There is a pulse when things move, a heartbeat where a body is at risk, and
  silence before the terrace lets go and before the return.
- **The places.** The bedroom's room tone. The street through the walls, and through the hole once the window has gone.
  The air: no gale, because the air keeps its old down. The car alarms of the pile, as loud as the camera is near it
  (the pile is 285 m from your window). Alarms all over town. The rain's roar coming down the street as the falling
  river's front arrives, then rain everywhere. At the return, the rain hits the ground for ~12 s, and stops. The river's
  roar.
- **The events.** Each is heard once, at the film time its story second comes round; an event that falls in a jump is
  not heard. Long sounds are cut at the next jump. The level and the low-pass follow the camera's distance (gtNear), and
  sounds are muffled through the walls from inside.
- **The mix.** The target is −16 to −14 LUFS integrated, true peak ≤ −1 dBTP, with a real loudness range. Stem levels
  and the dynamics map are in `mix.js`; a true-peak limiter (gtLimit) follows.

## 7. Review log

See EPISODE_REPORT.md.

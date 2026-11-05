# What if all men suddenly disappeared?

A voiceless 16:9 long-form film: 1920×1080, 30 fps, 6:02. It follows the Gravity keeps tilting / Friction 10s / Air
solid / Speed of light formula and the owner's YouTube lessons (28 October 2026):
- **an everyday place, and new scenery:** the passenger seat of your dad's car on a motorway viaduct across a river
  valley on a Tuesday morning (no kitchen, flat, street or city reused). From it the film visits the lorry ahead, the
  stopped traffic, a train and a barge on the river below, an airliner overhead (outside, its cockpit and its cabin),
  the airport's control tower, the town and its kitchens, the hospital's maternity ward, and the viaduct again two
  and a half hours later;
- **action on frame 1:** under the title your dad is driving at 100 km/h, coffee in hand, the lorry ahead. At 3.75 s
  (7:42:00 AM) every man and boy on Earth vanishes: his clothes fold onto the seat, the cup falls, nobody is steering;
- **the real nuance in the first minute:** "Hold the parking-brake switch. In most modern cars, that's an emergency
  stop." (true: an electronic parking brake held while moving brakes the car hard; owner's manuals) and the honest
  label "THE ONE IMPOSSIBLE THING: EVERY MAN AND BOY VANISHES AT 7:42. THE REST FOLLOWS FROM IT";
- **a stake by 0:40:** the lorry drifts across your lane into the barrier and grinds along it, 3 m in front of you;
- **tension to the last frame:** flight 2207 has no pilots and 3 h 20 min of fuel; a flight attendant who has never flown
  a plane gets into the cockpit; 24 planes are circling one airport with 2 controllers; the tower talks her through
  setting up the autoland and the plane lands itself. The last caption, "Who will talk them all down?", over 23 planes
  still circling, is cut on the last frame. There is no recap.

Respect: nobody is hurt on screen and no body is shown. The men vanish with what they were wearing (the clothes stay
folded on the seat, as a sign); the town's fires are seen from far off as smoke; the film's warmest scene is a birth.
The facts are about jobs and numbers, not about blame.

The owner's rule of 29 October 2026: **the story clock only runs forward**. One clock (`MG_CLOCK`, script.js): real
speed under the title, then the first 15.5 story seconds after 7:42 slowed (up to 13 times), real speed from the radio
on, jumping forward only at cuts (the HUD says by how much): +7 min (7:51, the smoke), +13 min (8:04, the ward), +66 min
(9:10), +21 min (9:31), +16 min (9:47), +27 min (10:14), +6 min (10:21). `script.js` throws if a segment runs backwards,
if a caption's clock time ("7:51 AM") or fuel figure ("1 hour 17 minutes") disagrees with the HUD, and if the clock jumps
during the cockpit door's 30 seconds; `shots.js` throws if the clock jumps anywhere but on a cut.

Page: `men-disappear-long.html`. Captions: `CAPTIONS.md` → `node build-timing.cjs` → `timing.js`. Every number on
screen comes from `physics.js` (§ 2).

## 1. The rule

At 7:42:00.000 AM on Tuesday 10 November 2026 every man and boy alive vanishes, with what he is wearing. Whatever he was
holding stays and falls. Boys not yet born stay (the twist of the maternity ward: "It only took the ones already born").
Everything else follows from ordinary physics and how the world is staffed.

## 2. The numbers (physics.js)

| What | Value | Source |
| --- | --- | --- |
| Men and boys alive | 4.12 billion (women and girls 4.13 billion) | UN World Population Prospects 2024, mid-2026 |
| Boys born per second | 2.14 ("about 2") | 132 million births a year, 105 boys per 100 girls |
| Boys due in the next 9 months | ≈ 50 million | ≈ 99 million births in 9 months, half boys |
| Your car | 100 km/h on cruise control; parking brake held: 6.5 m/s² after a 0.4 s build-up; stops 3.0 m behind the lorry | owners' manuals; physics.js |
| The lorry | 40 t, 90 km/h, drifts left, hits the central barrier at 3.54 s, grinds along it at 5.66 m/s² | physics.js |
| Cars on this stretch | 56: 34 with nobody at the wheel, 22 still with a driver (each car seeded; about 4 in 10 had a woman driving) | rush-hour drivers ≈ 6 in 10 men (rough) |
| Lorry drivers in Europe | ≈ 3% women | IRU 2023 |
| The train | 25 m/s; vigilance pedal released: 4 s warning, then 0.6 m/s²; stops at 45.7 s | typical driver's safety device |
| Airliners in the air | ≈ 9,000 at the daily peak; 19 in 20 airline pilots men; both pilots men in ≈ 9 of 10 cockpits | ISWAP / IATA; flight trackers |
| The cockpit door | the crew's emergency code opens it after 30 s unless someone inside denies it | airline door systems |
| Flight 2207 | 11,000 m, 830 km/h; 64 passengers left; fuel runs out at 11:05 AM (3 h 20 min at 7:45) | physics.js |
| Air traffic controllers | ≈ 1 in 5 women: the tower had 9, 2 are left | rough |
| Firefighters | ≈ 9% women: "9 in 10 were men" | UK Home Office 2024, NFPA |
| Midwives | more than 9 in 10 women | UNFPA / WHO 2021 |
| Leaders | women at the top in 27 of 193 countries: 166 led only by men | UN Women 2025 |
| The landing queue | 24 planes circling, one talked down every 15 min: the last at 6 h; most have 2 h of fuel | physics.js |
| The landing | 3° glide slope, 72 m/s (259 km/h); over the motorway 2,120 m before touchdown, ≈ 110 m up; touchdown 29 s later | ILS approach |

## 3. The beats (CAPTIONS.md: the title and 25 beats, 65 captions)

7:41:56 the title in the car → 7:42 every man and boy vanishes (half of everyone) → your dad was driving, 100 km/h, cruise
control → grab the wheel, hold the parking brake → the lorry drifts into the barrier, its cab empty → you stop 3 m from
it → all along the viaduct cars stop themselves or drift → the radio still playing → his phone: MUM; the network jams →
the train stops itself (the vigilance pedal) → the barge holds its course into the bank → flight 2207 at 11,000 m; 9,000
airliners, 9 in 10 cockpits empty → the flight attendant and the locked door (30 s) → alone up front with 3 h 20 min of
fuel → the tower: 2 of 9 controllers → 7:51 smoke over the town (firefighters) → 8:04 the maternity ward: a boy is born
→ 9:10 nothing has moved; people walk home → 9:31 the emergency alert from a deputy minister (166 of 193 countries) →
9:47 flight 2207 circling with 1 h 17 min → 24 planes, one every 15 min → autoland: the tower reads it out → 10:21 it
comes in over the motorway and lands itself → 23 planes still up there: who will talk them all down?

## 4. Sets and shots (shots.js: 62 shots)

Two sets: `world` (set.js: the valley with the viaduct and its traffic, the railway and the river, the town and the
hospital outside, the airport and its tower, the sky, flight 2207 inside and out) and `ward` (ward.js: the delivery
room). New scenery: a motorway viaduct, a car's interior, a lorry cab, a train cab, a barge, an airliner's cockpit and
cabin, a control tower, a delivery room. Long geometry is split into ≤ 60 m pieces (a kilometre-long triangle loses
depth precision next to the camera and flickers) and every camera's near/far planes are set per shot.

## 5. Sound (sound-lib.js, sound-music.js, sound-amb.js, sound-sfx.js; mix.js)

No narrator. The score leads (the owner's rule of 31 October 2026, measured stem by stem: the beds about 10 dB under it).
- **score:** D minor, eerie and sparse, a felt piano motif, glass bells, low strings; a heartbeat quickening into the
  lorry's hit; a tick for each second of the cockpit door; warmth at the birth (the motif rises, D major); from 9:47 an
  endless rise under everything, faster at the end; the motif left a note short on the question, cut on the last frame.
- **beds:** where the camera is (your car: the road with the car's speed, the idle; the deck's wind; the river; the air
  outside the plane; the cockpit and the cabin; the tower; the airfield; the town; the ward). Darker and lower in the
  slow minutes.
- **effects:** at their story seconds, slowed with the picture in the slow minutes (at most 4×, like tape): the car radio's
  pop song (a computer still picking the songs), the cup, the parking brake's switch, motor and warning beeps, the tyres,
  the lorry's hit and grind and sparks, the hazard relay ticking from then on, the cars hitting the barriers and two car
  alarms, his phone vibrating (MUM), the train's brakes and its cab's vigilance alarm, the barge running aground, the
  cabin's call chime in the empty cockpit, the door keypad and its 30 s buzzer, radio calls in the tower (the voices of
  the women still in the cockpits and cabins, their words not made out), the flap and gear levers, the town's smoke
  alarms, the baby's heartbeat on the monitor and his first cry, footsteps on the deck, the emergency alert (853 + 960 Hz)
  on every phone at once, the jet over the motorway (delayed by the sound's travel time, Doppler-shifted), touchdown.

## 6. Checks and review log

(see EPISODE_REPORT.md)

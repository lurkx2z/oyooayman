# What if air became solid for 3 seconds?

A voiceless 16:9 long-form film: 1920×1080, 30 fps, 5:29. It follows the Slower light / Friction 10s / Gravity tilts
formula and the owner's YouTube lessons (28 October 2026):
- **an everyday place:** your 5th-floor kitchen on a Sunday afternoon, the street below it, the park across the road,
  the main road past the park;
- **action on frame 1:** under the title you are pouring a glass of water, the radio is playing and your cat jumps off
  the table (slow motion). At 2.85 s the radio cuts dead and everything stops;
- **the real nuance in the first minute:** real air does turn solid, below −210 °C, shrinking about 800 times (0:40);
  this air set where it stood, as light and warm as before, and nothing can move it: that is the impossible part;
- **a stake by 0:17:** "Three seconds is nothing. Unless you were moving." Every scene after that is a speed, and the
  hit it means (a belly flop from h = v²/2g), climbing from 10 cm (walking) to 48 m (a motorway), then the whole
  planet's winds;
- **tension to the last frame:** after the release, the aftermath gets colder (stalled cars, sirens, no wind) and the
  last beat is the planes: "No fall from any height lands that hard." The question "How fast were you going at 2:00?"
  is cut on the last frame. There is no recap.

The owner's rule of 29 October 2026: **the story clock only runs forward**. One clock (`SA_CLOCK`, script.js): real
speed under the title, slow motion into the lock, then the three seconds stretched over 3 min 45 s (110× slower: every
new angle is a few thousandths of a second later), the last second ×0.1, the release ×0.05, the park ×0.2, then real
speed with forward jumps at cuts ("+20 s", "+40 s", "a minute", "two minutes"). `script.js` throws if a segment runs
backwards; `shots.js` throws if the clock jumps anywhere but on a cut.

Page: `air-solid.html`. Captions: `CAPTIONS.md` → `node build-timing.cjs` → `timing.js`. Every number on screen comes
from `physics.js` (§ 2).

## 1. The rule

At **2:00:00.000 PM** all the air on Earth sets solid where it stands, for **exactly 3 seconds**. It keeps its weight,
temperature and density (1.2 kg/m³); nothing can push through it and it can't move. Anything moving through air stops
dead in that instant; anything at rest stays at rest; water, bodies and ground are not air. At 2:00:03.000 it is air
again, and everything it was holding starts again **from a standstill**.

- **The one impossible thing:** air that sets at 12 °C without shrinking, and can't be moved. (Real solid nitrogen is
  soft and carries sound; the HUD says "THE ONE IMPOSSIBLE THING".)
- **Everything else follows:** sound is air moving, so for three seconds there is none (the score is the film's: the
  HUD says so); your heartbeat comes through your bones; a body stopped dead from speed v is hit like a belly flop from
  h = v²/2g; things in the air at the release fall from rest; a sound wave frozen mid-flight splits into two halves
  when released (d'Alembert: the pressure pulse with zero velocity); the winds' angular momentum goes into the planet.

## 2. The physics (physics.js)

| Thing | Speed | Belly flop from h = v²/2g |
|---|---|---|
| walking | 5 km/h | 10 cm |
| your cat (falling off the table, 0.3 s into its jump) | 3 m/s | 46 cm |
| running | 11 km/h | 48 cm |
| cycling | 20 km/h | 1.6 m |
| the car | 30 km/h | 3.5 m |
| a pigeon | 36 km/h | 5.1 m |
| main road | 50 km/h | 9.8 m (your window is 12 m up) |
| motorway | 110 km/h | 48 m (air drag would cost ~10 % in a real fall) |
| airliner | 900 km/h | 3.2 km by the formula; no real fall lands that hard (terminal speed ~55 m/s), so the caption says that |

- **After the release (from rest):** the girl off the climbing frame drops 1.1 m (lands at 2:00:03.47); the kicked ball
  falls 3.9 m and bounces (e = 0.62); the runner, mid-stride 10 cm up, lands and tips over like an inverted pendulum
  (θ = θ₀ cosh(√(g/L) t), θ₀ = 0.045, L = 1 m: down at about 2:00:04.5); the bike, with no speed to steer with, tips
  from its 0.006 rad lean (L = 1.6 m: on its side at 2:00:05.5); the swing carries on from the top of its arc
  (57°, period 2.98 s); leaves fall at their terminal speed; the fountain's frozen column drops into the basin.
- **The bell:** the church struck two at 1:59:59.88; its first stroke was 41 m out from the tower when the air set
  (338 m/s × 0.12 s). Released from rest, the frozen pulse splits into two half-amplitude pulses going opposite ways:
  one reaches your window (89 m from the tower) at 2:00:03.144, the other goes back to the tower. The hammer, stuck in
  the solid air of the belfry, strikes the second stroke late (2:00:09.4).
- **The winds:** the atmosphere's net eastward spin relative to the ground is ≈1.5 × 10²⁶ kg m²/s; Earth's is
  5.86 × 10³³. Stopping the winds hands it to the planet: ΔLOD = 86,400 s × 1.5e26/5.86e33 ≈ 2.2 ms. "For now, a day is
  2 thousandths of a second shorter" (it comes back as the winds rebuild over hours).
- **Your heart** beats at 70 bpm: four beats in the three seconds (2:00:00.45, 01.30, 02.15, 03.00).
- **Engines:** every running engine stops at 2:00 (the air in its cylinders and intake set); a minute later few have
  been restarted.
- **Planes:** about 10,000 airliners airborne at any moment (flight trackers show 8,000–12,000): a stand-in number,
  labelled as such.

## 3. The beats (CAPTIONS.md, 31 beats, 63 captions)

1. **Your kitchen** (0:00–1:44): the title over you pouring and the cat jumping; 2:00 (POV: the jug, the stream, your
   hand); the stakes; everything stopped (the water, the cat in mid-air); you can't breathe or blink; real solid air
   and the impossible part; silence (the bell you didn't hear, your heartbeat); the steam and the dust; the clock's
   stuck second hand; your cat is fine (46 cm).
2. **The city** (1:45–3:41): from the window; the pigeon (5.1 m); walkers (10 cm); the cyclist (1.6 m); the car and its
   driver (3.5 m); the fountain turned to glass and the carp under the locked surface; the girl off the climbing frame;
   the boy at the top of his swing; the dog 30 cm from its frisbee; the runner in flight (48 cm); the main road
   (9.8 m) and motorways (48 m); every wind on Earth (the day 2 ms shorter).
3. **One second left** (3:41–3:51), counted down big from the window and through your eyes.
4. **2:00:03** (3:51–4:18): it's air again; everyone breathes in at once; the park falling from a standstill (the girl,
   the runner, the cyclist, the swing).
5. **After** (4:18–5:29): the bell's frozen sound split in two; 20 s later (bruises); 40 s later (every engine stopped,
   nobody has restarted); a minute later (the first sirens, a police car squeezing down the middle of the road); two
   minutes later (hardly a breath of wind, chimney smoke straight up, the flag limp); the planes; "How fast were you
   going at 2:00?"

## 4. Look and sound

- **Look:** the house low-poly style (the Days shorter street and park, a new 5th-floor kitchen, people, a new
  pigeon, koi, flag, slide). During the lock the grade is a touch colder and stiller. HUD: the countdown ("THE AIR IS
  SOLID FOR 2.837 s"), the clock with milliseconds and "110× SLOWER" / "REAL SPEED" / "+20 s", the speed ladder (each
  speed and its belly-flop height on a log scale, your window's 12 m marked), the cube of air, the bell's ring, honest
  labels bottom left.
- **Sound** (no narrator; all synthesised): the radio and the pour before 2:00, cut dead; during the lock nothing but
  the score, your heartbeat, the blood in your ears and a faint ringing; at 2:00:03 the air rushing back, the gasp,
  the bell's half arriving, the radio coming back slowed; car alarms, a starter that won't catch, sirens, no wind.
  Score: the ice motif (A F E D) over cold D minor pads; a pulse through the city that tightens to the main road; a low
  drum on every belly flop, harder the higher; the floor drops for the wind; a roll to the release, a breath of
  nothing, one hit and the film's first major chord; thinner after; the motif without its last note at the end.
  Mix: music clearly leads (the owner's rule of 31 October 2026), beds measured stem by stem (§ 5).

## 5. Review log

**Look-dev passes (before review):** contact sheets of every shot, two passes: new title, start, stop and cat cameras;
a real pigeon model (two spread wings, iridescent neck, wing bars, fanned tail); the leaves as leaf shapes (and a bug
that kept leaves above 4.3 m in the air for ever fixed); the slide moved off the swings; the limp flag's cloth made
visible; chimney smoke as thin straight columns; steam that thins out a hand's width above the cup.

**Independent reviews** (scores as given):
- Story and retention **6/10**: a list-like park stretch (1:35–3:15), no stakes stated up front, the bell paid off
  without a set-up, the wind interrupting the speed ladder, a flat aftermath.
- Physics **8/10**: all heights right; "like falling flat from 3.2 km" misleading for planes (terminal speed);
  "almost the height of your kitchen" wrong (the window is meant); "no wind anywhere" overstated; wording nits (the
  cat didn't "hit" the air; below −210 °C; air that also can't move).
- Visuals **6/10**: weak hook (a faceless stranger pouring for 9 s), the steam like straight rods, the swing boy looking
  like a ragdoll, the runner reading as standing (he was also facing the wrong way), the cat and jumper not reading as
  airborne, HUD collisions (caption into the ladder, labels on heads, the cube's labels overprinting), the carp and
  pigeon models, empty frames (leaves, ball, sirens, flag).

**Fixed:** the park cut by three beats (leaves, ball, flock); "Three seconds is nothing. Unless you were moving." at
0:13; the bell set up in the silence ("The church bell just struck two. You didn't hear it."); the wind moved after the
motorway (the whole planet is the last step before "One second left"); the aftermath rewritten (engines stopped at
2:00, nobody has restarted; hardly a breath of wind; planes: "No fall from any height lands that hard"); every
physics wording fix. Pictures: the first shot after the title is now through your eyes (jug, stream, your hand); "You
can't breathe" shows you frozen at the table; steam in curls; the swing filmed side-on so the chains show the height;
the runner faces his way, legs apart, 10 cm up, filmed in profile; the cat and the girl filmed from below with the
gap under them; the caption width and the ladder kept apart; labels moved off heads; the cube's labels one after the
other; the pigeon from the front; the carp's locked surface (frozen ripples); a police car with flashing lights for
the sirens; the flag and the smoke reframed. Last pass: the ladder moved below the clock (it overlapped "110× SLOWER"), the
motorway row now comes in with its caption, and the airliner row says "NO FALL LANDS THAT HARD" instead of 3.2 km.

**Still weak (honest):** the motorway shot is the main road on a long lens, not a motorway; the cars on the street
look parked rather than stopped mid-motion (nothing in frame says "moving a moment ago" except the labels); the
people are the house's simple figures; the second half of the aftermath leans on the same street and park.

**Status (4 November 2026):** sound measured stem by stem (music 10.4 to 23.9 dB over the beds in 10 s windows, median
13.5) and baked: −15.6 LUFS, −2.5 dBTP, LRA 6.0 LU; `final-soundtrack.m4a` −15.6 LUFS / −2.4 dBTP. Runnable ZIP
tested (SOUND READY at once). Final 1080p render on the owner's PC: `render-gpu.cjs` (see `EPISODE_REPORT.md`).

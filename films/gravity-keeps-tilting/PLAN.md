# What if gravity kept tilting sideways every second and couldn't stop?

This is a voiceless 16:9 long-form film: 1920×1080, 30 fps, about 6:15. It follows the Slower light / Friction 10s
formula and the owner's YouTube lessons and retention playbook of 28 October 2026:
- an everyday place: your living room on a Saturday afternoon, and the park across the street;
- action under the title on frame 1;
- the physics nuance in the first minute;
- a new consequence every few seconds, escalating;
- tension to the last frame, with no recap.

It also follows the owner's rule of 29 October 2026: **the story clock only runs forward.** This film goes further:
it runs at real speed from the first frame to the last. The film *is* the turn: one degree a second, 360 seconds,
one full turn of down, and every cut moves on with it.

The title is the owner's own words. ("Kept … couldn't stop" overrides the no-"kept getting X" lesson for this film.)

Page: `gravity-keeps-tilting.html`. Captions: `CAPTIONS.md` → `node build-timing.cjs` → `timing.js`. The room and the
street are a rigid-body simulation run once offline (`bake-sim.cjs` → `simdata.js`); every other number on screen comes
from `physics.js` (§ 2).

## 1. The rule (the physical reading)

At **4:00:00 PM** on a Saturday in late October, down starts to turn. **Every second it tilts one more degree** to the
east (your right, looking out of your window), at its usual strength (9.81 m/s²): east at 90°, straight up at 180°,
west at 270°, down again at 360°. Then it carries on. It doesn't stop.

- **The tick.** The tilt comes in steps, one degree on each second, so the world jolts once a second: lamps swing, glass
  chinks, water slops. (A step of 1° is a sideways kick of 0.17 m/s², about what you feel when a train pulls away.)
- **The air and the ground keep their old down.** If the air turned, it would leave or flatten everything in the first
  minute. The ground is rock and soil. Everything else follows the new down: water, people, cars, furniture, trees,
  buildings (which are held to the ground by their foundations).
- **The sea isn't in the film.** Your town is inland.

Nothing known can turn gravity. The real nuance the film uses: your inner ear feels the tilt (the otoliths sense the
direction of gravity), while your eyes see a level room. That mismatch is what makes people seasick.

## 2. The physics (physics.js, bake-sim.cjs)

| angle (s) | what | how |
|---|---|---|
| 1° | the ceiling lamp kicks over 1°, the water in a glass tilts, the pond spills over its east bank (it is level to a few cm over 30 m) | gkLamp, gkPond |
| 1° | the football on your floor rolls off on the first tick (rolling resistance on boards ≈ 0.6 % of its weight, a third of sin 1°) and knocks against the sideboard at ~6° | GK_BALL |
| 2–5° | the footballs in the park roll (1–6 %) | sim |
| ~26° | the wheelie bins go (their wheels are braked by the kerb) | sim |
| ~13° | the church spire goes: a stone needle 17 m tall standing on its weight alone rocks onto its edge once down leans past its base (atan(r / (L/3)) ≈ 10°), visibly at about 13°, and comes off the tower at about 16°. The tower under it is a 1960s concrete tower with steel inside (labelled): it holds, as a chimney holds in a gale | GK_SPIRE (integrated rocking) |
| ~14° | the books pour off the shelves; the TV tips off its stand at about 15° | sim |
| 21–31° | the parked cars go (a handbrake holds the rear wheels only) and slide east down the street | sim |
| 24–30° | the room's first avalanche: the sofa, armchair, table and bookcase (it falls at 28–30°) slide and topple into the east wall | sim |
| 41–43° | the cars pile into the church at the end of the street; the last one arrives at 78 km/h | sim |
| 90° | sideways: anything not fixed to the ground starts to fall off it | |
| ~97° | the stack of cars against the church topples off its wall into the sky | sim |
| 90–130° | it falls into the sky. Each thing falls at its terminal speed in still air, so it travels in a **circle of radius v/ω** (ω = 1°/s): leaves (≈1.5 m/s) 86 m, the pond's water as drops (≈9 m/s) 516 m, bins and balls (≈25 m/s) 1.4 km, cars (≈80 m/s) 4.6 km. Highest at 270°: twice that | gkFly |
| 122–132° | the room's second avalanche, onto the ceiling (the armchair follows at 156°) | sim |
| 100–200° | roof tiles lift off their battens (they're held down only by their weight) | gkTiles |
| ~150° | the weakest balconies on the next block (4 of 15) hinge up over ~2 s as their top steel yields, then tear off: most of a balcony's steel is at the top, where hanging down needs it. Nothing loose is left on them (planters are built in) | gkBalcony |
| 180° | you stand on your ceiling. The block hangs from its foundations: its columns, built to be squeezed, are stretched, and only their steel holds; the slab under you, built to carry weight down, cracks (210–217°) | gkCrackDraw |
| 200–210° | the third avalanche, across the ceiling into the west wall; the sofa smashes the ceiling lamp at about 202° | sim |
| 218° | the cars are 7.2 km up | sim |
| 258–312° | the fourth: the room's contents come back down onto the floor (the sofa at 278–284°, small things until 312°) | sim |
| 270–290° | the things in the sky are highest: leaves ≈170 m, the pond's water ≈1 km, the cars 9.8 km (as high as airliners fly) | sim, gkFly |
| 360° | down is down again, for one second. The cars are 5.6 km up and 7.2 km west. A thing that left the ground at θ₁ is back at ground height at 540° − θ₁, about 2R·|cos θ₁| west of where it left: only the first things to go (at 90°) come back past their start. The last tiles (left near 200°) land first, nearly straight down, at about 340°; the balconies at ~4:06:30, 10–12 km west; **the first car at 4:07:05, 6 km west, slanting in at 91 m/s (over 300 km/h)** (each car's flight carried on past the simulation with the same drag: GK_LAND). The film counts down to it | sim, gkFly, GK_LAND |

Honest limits: a car's terminal speed depends on how it tumbles (≈60–90 m/s at sea level); thinner air high up would make it faster still and the circle egg-shaped; the simulation keeps sea-level air. Assumptions, not facts: the cars are empty; the people we follow outside are a mother and her child, who get into the
playground's climbing dome (bars set in concrete all round them); the ducks and pigeons simply fly.

## 3. Story time (script.js)

Story time `s` is seconds after 4:00:00 PM, and the angle is `θ = floor(s)` degrees: the first tick is at s = 1.
There is one clock and it runs at **real speed** the whole film (film t = s + 1.0). Nothing is sped up and nothing
jumps, so every cut lands on the next moment of the same turn.

## 4. Shots (shots.js)

Every shot is a mode in world.js (48 shots, plus six quick cuts in the last ten seconds). Shots seen "as you feel it"
roll the camera with the turn (felt up = −down); a turn about the north–south axis only rolls a camera that looks north
or south, so those shots look north or along a diagonal. Shots from outside keep the world upright and show things
moving. Things too small to see at a distance (leaves, tiles, drops, cars in the sky) are drawn as specks at a minimum
size. Parts:

1. **The first seconds** (0–35°): your room, the glass, the park from the window; the spire; your ears; the street
   becoming a hill; the first avalanche; holding on
2. **Sliding** (35–90°): the street; the cars into the church; the climbing dome; the park as a ski slope; the empty
   pond; your east wall; the window on its side; 90°
3. **Falling off the world** (90–180°): the stack of cars goes; things falling up, in circles; rain going up; the roof
   tiles; the balconies; the trees; ten degrees to go
4. **Upside down** (180–270°): your ceiling; your block, hanging; the furniture goes again and smashes the lamp; the
   crack; the cars 7 km up; the pigeons; the swings; the girl on the dome; everything climbing
5. **The way back** (270–360°): as high as it goes; coming back down; your things home; nothing has landed; the last
   30°; the count; down is down for one second; it all comes round again

## 5. Look and HUD

House style (STYLE_BIBLE, § 6 of the hybrid study): a real-feeling low-poly world, a low autumn sun in the west-south-west
lighting the park from your left; a serif title centred on frame 1 over the action; serif captions. Top left: DOWN HAS
TURNED, the angle (one degree per tick) and +1° EVERY SECOND, with a context line under it. Top right: the time, 4:00:00 PM
on, and the DOWN dial: its arrow sweeps once round in six minutes. A few diagrams (friction angle, the circle of a falling
thing, a balcony's steel, a column stretched) and pinned labels.

## 6. Sound (sound-*.js, mix.js; all synthesised, seeded)

- **The tick:** a deep wooden knock on every second the world jolts, with glass chinking in the room and the building
  creaking. It is the film's metronome (60 BPM) and the score is in its time.
- **The score** (sound-music.js), one key per quarter turn: A minor for the first 90° (an ostinato on the ticks, a roll
  into the spire, a seasick wobble for your ears, a pulse into the church crash, a heartbeat at the dome, a glide up
  into 90°); A lydian floating for 90–180°; D minor for 180–270° (a pulse into the lamp smash, then a lullaby); a falling
  line for 270–360° and the count with heartbeat and roll. At 360° one big A chord for exactly the one second that
  down is down, then it bends down a semitone; the theme returns for the last question.
- **The places** (sound-amb.js, sound-sfx.js): the room tone, the city and the TV crowd through the glass, birds; then
  every room impact by material, your slides, the lamps going out, the ceiling lamp smashing, groans and the crack;
  outside, tyres scrubbing, the cars into the church, the spire cracking and landing, the balconies snapping, the swings
  creaking on each tick, pigeons, the pond spilling, and the car alarms falling away into the sky (each follows its car).
- **The mix:** −16 to −14 LUFS integrated, true peak ≤ −1 dBTP, with a real loudness range; then the true-peak limiter.

## 7. Review log

**Round 1** (the first full cut, 6:15, as a 480×270 preview with sound and contact sheets; three reviewers who had not
written the film). Scores as given:

| review | score | the main points |
|---|---|---|
| retention | **4/10** (hook 3, first 30 s 5, middle 4, payoff 5, which way is down 5) | the second half shrinks to one image (a white plume on blue) for ~63 s; nothing visibly happens until the spire at 0:14; dead stretches 0:58–1:37 and 2:11–3:00 (still park, invisible tiles, a 13 s façade for the balconies, trees "holding"); the girl's moment at 4:07 tiny and she was never introduced; the ending's countdown tiny, two unreadable quick cuts, you missing from the return; the real-speed idea never said; the ⊗ on the dial unreadable; caption/readout slips |
| visuals | **4/10** (image 6, composition 4, phone readability 4, down readable 5, hero moments 3) | ~75 s of near-static sky with no scale; the circle never seen in the world; hero moments hidden (the church crash in dust, the stack dissolving in puffs, 90° a hazy frame, the girl behind bars, the ceiling reading as a messy room); camera against the sofa / inside your head; diagrams covering the action and overlapping labels; tiny subjects (balconies, tiles, pigeons, a 5 px car) |
| physics | **6.5/10** (accuracy 6, honesty 6, clarity 7, learned 8, believability 6) | the ending was wrong by the film's own model (only things that left at 90° come back past their start; the cars land ~4–6 km west at 4:07:05–4:07:16, slanting in); "falling straight down" at 340° is 17–30° off; a stone church tower would have fallen like its spire; loose pots and chairs left on balconies; captions vs readouts (1°, 7 km, 80 km/h, 90°); the air rule never said; overstatements (all steel at the top, every balcony snaps, trees, tiles, ski run, car speed, false precision in the circle diagram) |

**What changed:**
- the opening: a football rolls off by itself under the title (physics.js GK_BALL) and knocks against the sideboard;
  the pond spilling over its bank with the mother and daughter labelled behind it; the spire followed to the ground;
  "A full turn is 6 minutes: this whole video." and "At 4:06:00, down is down again. For one second.";
- the physics: the ending rewritten (most of it lands kilometres west; the cars first, at 4:07, over 300 km/h, counted
  down on screen from GK_LAND); "falling back down, steeper every second"; the tower labelled as concrete with steel
  inside; nothing loose on the balconies; every slipped caption and readout fixed (the fastest car is its top speed
  so far); "The air doesn't tilt"; most/many/the weakest/piste/60 to 90/about/up to; ~90 m / ~500 m / ~5 km;
- the sky: every sky shot now has the tower, a block's face, the dome or the roofs in frame, and none runs past ~6 s;
  a long lens locked on one car 8 km up; one pigeon chased, belly up; leaves drawn orange; the girl and her mother close
  up at 85° and on the far side of the dome at 247° (hand over hand); the balconies close, hinging up over 2 s;
  the roof tiles as courses over dark battens, peeling; the leaves off the grass and the cars going up past the tower;
  the rain going up seen from inside its band; under a tree looking up for "Most trees hold";
- the end: big 9 … 1 on the last ticks; you standing at the window for the one second; the quick cuts re-framed;
- smaller: lighter, shorter crash dust; the street shot (cars sliding past you); the crack shot; the window glass
  tinted so the outside reads from inside; the friction and circle diagrams moved to the left; larger diagram text and
  captions; the dial says AWAY / AT YOU instead of ⊗; you no longer sit inside the furniture pile at the end.

**Second look** (my own, on a new preview; no new scores): the new moments read; the rain-going-up and trees shots were
re-framed. Still weak: see EPISODE_REPORT.md.

Not done: the church tower falling (we made it concrete instead); a felt 90° shot of the park as a wall (it read as
haze; we show the water and leaves lifting instead); trails drawn on hero objects; thinner air high up.

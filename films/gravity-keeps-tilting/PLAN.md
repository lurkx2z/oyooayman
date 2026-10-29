# What if gravity kept tilting sideways every second and couldn't stop?

This is a voiceless 16:9 long-form film: 1920×1080, 30 fps, about 6:10. It follows the Slower light / Friction 10s
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
| 1–3° | balls and wheelie bins roll (rolling resistance is 1–3 % of weight) | sim |
| 10° | the bookcase on the west wall topples into the room (depth 0.3 m, centre of mass 0.85 m up) | sim |
| ~10° | the church spire goes: masonry stands on its weight alone, and a slender spire tips over once its weight leans past its base | gkSpire |
| ~17° | the TV tips off its stand | sim |
| 20–35° | the parked cars go (a handbrake holds the rear wheels only), the furniture slides (≈25–30°), people can't stand | sim |
| 30–90° | everything loose outside slides east: the cars down the street into the church at the end (sim speeds), the flood from the pond, the leaves | sim, gkLeaf |
| 90° | sideways: anything not fixed to the ground starts to fall off it | |
| 90–130° | it falls into the sky. Each thing falls at its terminal speed in still air, so it travels in a **circle of radius v/ω** (ω = 1°/s): leaves (≈1.5 m/s) 86 m, the pond's water as drops (≈9 m/s) 516 m, bins and balls (≈25 m/s) 1.4 km, cars (≈80 m/s) 4.6 km. Highest at 270°: twice that | gkFly |
| ~120° | the cars piled against the church slide up its wall and over the roof | sim |
| 100–200° | roof tiles lift off their battens (they're held down only by their weight) | gkTiles |
| ~150° | the balconies on the next block snap off upward: their steel is at the top, where a balcony hanging down needs it | gkBalcony |
| 180° | you stand on your ceiling. The block hangs from its foundations: its columns, built to be squeezed, are stretched, and only their steel holds; the slab under you, built to carry weight down, cracks | |
| every 90° | your room tips its contents into the next corner, about 27° past each wall (the friction angle): east wall (≈27°), ceiling (≈117°), west wall (≈207°), floor (≈297°) | sim |
| 270° | the things in the sky are highest: leaves 170 m, the pond 1 km, cars ≈9 km (near where airliners fly) | gkFly |
| 360° | down is down again, for one second. Everything in the sky is falling straight down at its terminal speed. Each circle closes 360° after it began, so from about 7:30 it all comes back past where it left, **sideways, at the speed it fell** — and goes round again | gkFly |

Assumptions, not facts: the cars are empty; the people we follow outside are a mother and her child, who get into the
playground's climbing dome (bars set in concrete all round them); the ducks and pigeons simply fly.

## 3. Story time (script.js)

Story time `s` is seconds after 4:00:00 PM, and the angle is `θ = floor(s)` degrees: the first tick is at s = 1.
There is one clock and it runs at **real speed** the whole film (film t = s + 1.0). Nothing is sped up and nothing
jumps, so every cut lands on the next moment of the same turn.

## 4. Shots (shots.js)

Every shot is a mode in world.js. Shots seen "as you feel it" roll the camera with the turn (felt up = −down); shots
from outside keep the world upright and show things moving. Parts:

1. **The first seconds** (0–30°): your room, the window, the park; the tick; the bookcase; the spire; the car handbrakes
2. **Sliding** (30–90°): the first avalanche (you on the radiator), the street emptying into the church, the dome
3. **Falling off the world** (90–180°): the rain going up, the leaves, the cars over the church roof, the tiles, the balconies
4. **The ceiling** (180–270°): the park upside down, the block hanging from its foundations, the third avalanche
5. **The way back** (270–360°): as high as it gets; the fourth avalanche; the countdown; down for one second; what's coming

## 5. Look and HUD

House style (STYLE_BIBLE, § 6 of the hybrid study): a real-feeling low-poly world, a low autumn sun in the west-south-west
lighting the park from your left; a serif title centred on frame 1 over the action; serif captions. Top left: DOWN HAS
TURNED, the angle (one degree per tick) and +1° EVERY SECOND, with a context line under it. Top right: the time, 4:00:00 PM
on, and the DOWN dial: its arrow sweeps once round in six minutes. A few diagrams (friction angle, the circle of a falling
thing, a balcony's steel, a column stretched) and pinned labels.

## 6. Sound (sound-*.js, mix.js; all synthesised, seeded)

- **The tick:** a deep wooden knock on every second the world jolts, with glass chinking in the room and the building
  creaking. It is the film's metronome (60 BPM) and the score is in its time.
- **The score:** a calm D for the first second, then a slow figure that climbs one step every 90° and never resolves
  until down comes back; it starts over at 360°.
- **The places:** the room tone, the park (children, ducks, traffic) and the street through the glass; then crashes,
  car alarms falling away into the sky, the church bell swinging and ringing on its own, the roar of water going up.
- **The mix:** −16 to −14 LUFS integrated, true peak ≤ −1 dBTP, with a real loudness range; then the true-peak limiter.

## 7. Review log

(Filled in after the reviews.)

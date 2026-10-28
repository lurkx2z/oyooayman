# What if friction disappeared for 10 seconds?

Voiceless 16:9 long-form (1920×1080, 30 fps, 5:02), in the Slower light / Universe cut formula, built to the owner's
YouTube lessons and retention playbook of 28 October 2026: an everyday place (your kitchen at 8:14 on a weekday
morning, and the hill street outside), visual action in the first second, the physics nuance in the first minute,
escalating phases, a reset every few seconds, sudden silences, tension to the last frame. Page: `friction-10s.html`.
Captions: `CAPTIONS.md` → `node build-timing.cjs` → `timing.js`. Every number on screen: `physics.js` (§ 2).

## 1. The rule (the physical reading)

At **8:14:07 AM** every solid-on-solid contact above ground loses its sideways grip (static and kinetic friction both
zero) for exactly **10 seconds**. Everything else is unchanged: things still push on each other (normal forces), air
still drags, liquids are still liquids, gravity is the same. Then friction comes back, all at once.

Why only the grip: friction is electromagnetic (atoms on two surfaces snagging on each other). Switching that force
off completely would also switch off what holds solids together, so the film keeps the push and removes only the snag,
and says so in the first minute. Underground every fault would slip (that would be the real catastrophe); the film
says so, and stays above ground (tagged THIS FILM: ABOVE GROUND ONLY).

## 2. The physics (physics.js)

| story time | what | how |
|---|---|---|
| −0.55 → 0 | the car coming down the hill brakes hard for the bus pulling out (10.3 → 7.0 m/s); its screech | FZ_CAR |
| 0 | friction goes. The screech stops dead (nothing to squeal against); the car slides on at 7 m/s | the rule |
| 0 → 0.42 | your phone is squeezed out of your hand (grip is squeezing plus friction), lands screen up, slides for the door | FZ_PHONE |
| 0 → 0.1 | screws under load turn (a screw is a ramp wrapped round a pin): the wall cabinets drop onto the worktop at 0.42 s, then their feet skate out and they end on their backs (0.95 s); the TV's wall plugs slide out (0.12) | fzCabPose, fzTvPose |
| 0 → 1.06 | the cat, mid-leap onto the island, keeps sliding at 2 m/s, knocks the mug (0.2), drops off at 0.53, lands 0.96, hits the units 1.06; from 1.35 runs on the spot | FZ_CAT |
| 0.2 → 0.85 | the mug slides off the island and smashes at 0.85 s; its pieces glide until a wall | FZ_MUG |
| 0.3 → 1.2 | you reach for the mug; your feet shoot out (0.55); your hand slides off the island (0.75); you're down (1.2); you hook the oven door handle (1.45 → 1.9) | FZ_FALL |
| 0 → 1.5 | cotton (short fibres twisted together) comes apart: the curtains crumble; piles of grains slump (sugar, the builders' sand) | home.js, FZ_SAND |
| 0 → 1.5 | the scaffold's clamps let go: every tube and board falls; the window cleaner's ladder (it only leans because its feet grip) slides flat by 1.15 s; the cyclist can't steer, so can't balance (down by 1.3 s); the walker's push-off foot shoots back (0.22) | FZ_SCAF, FZ_LADDER, FZ_BIKE, FZ_WALKER |
| 0 → 10 | on a slope everything slides at a = g sin θ whatever its mass. Your floor slopes 0.5° (an old house): 0.0856 m/s²; the street is an 8 % hill: **0.782 m/s²**, so by 10 s everything on it is doing **28 km/h** and has slid **39 m** (cars, bins, people, sand: almost exactly together; light boxy things 5–8 % behind, air drag) | FZP |
| 5.82 | the sofa reaches the window and the standard lamp | fzSolvePile |
| 6.11 | the braking car catches the bus's back corner (the bus is still turning: its wheels were turned when it pulled out, so it keeps rotating, 0.085 rad/s, and slides sideways) | FZ_CRASH |
| 7.03 | your phone leaves the house: it slides along the doorstep, flies off each step's edge and lands on the next (7.44, 7.66, 7.89: three clacks), across the pavement, into the gutter, screen up | fzPhoneOut, fzStepY |
| 10 | friction comes back (tyres μ ≈ 0.7, clothes on asphalt 0.55, wood 0.45): everything still moving stops in about a second (28 km/h → 0 in about 1.3 s, like being thrown off a bike); cars sliding sideways only rock on their springs (static stability factor ≈ 1.3 > μ: no wheel lifts); the bus, sliding sideways, goes over (its static stability factor ≈ 0.6 < μ), on its side by 11.25 s; the fridge, sliding at 3 km/h, rocks about 5° up on its front edge and drops back with a thud (not enough spin to lift its centre of mass over the edge; a bin, lighter and squatter for its speed, the same check); the cat's paws grip mid-stride and she shoots onto the sofa | fzBusAt, fzTumble, fzTipInfo, fzTip, fzCat |

## 3. Story time

The film is ten seconds told over five minutes. Every shot has its own clock (shots.js: keys [[t, s], …], straight
lines between); the HUD reads the speed off it (SLOWED DOWN 10×, REAL SPEED, REWIND, REPLAY ·, FLASH-FORWARD ·).

1. the cold open: the title is up on frame 1 over the first 1.58 s in real time (the brakes, the cat, the phone, the
   mug, your fall), then the clock slows to 1/80 while the rule is set out; a flash-forward to s = 10.2 (the bus going
   over), left open until the end
2. that first second again, 10× slower, in the kitchen from every side
3. the same second in the rest of the house; 4. the same second outside
5. everything slides: one continuous clock from 1.55 s (the floor, the hill, Galileo), the first five seconds again at
   real speed, faster every second, the warning, the count down (8 quick cuts round the house and the street, a tick-tock speeding up), **s = 10** (0.42 s
   of silence, then four hard cuts in 1.6 s: the street, the cat, the walker, wide), its replays, then real time; the last
   question is cut off mid-shot (no fade, no outro)

## 4. Shots (shots.js; the count down has 8 quick cuts inside one shot, the return 4)

A0 open (POV) · A1 floor (low across the kitchen floor) · A2 teaser · A3 flash-forward · A4 atoms · A5 apart · A6 push
· A7 faults · B0 replay (rewind, POV) · B0b drop (the phone, at floor level) · B1 cat · B2 mug · B3 reach (POV) · B4
feet · B5 slap (POV) · B6 hook (close-up) · B7 cat runs · C0 house (rewind) · C1 screws (inside the cabinet, 100×) ·
C2 cabinets · C3 TV · C4 curtains · C5 clothes (POV) · C6 sugar · D0 street (rewind) · D1 brakes · D2 bike · D3 laces
· D4 walk · D5 ladder · D6 scaffold · D7 sand · E0 slide · E1 floor · E2 hill · E3 same rate · E4 real speed · E5
faster · E6 sofa · E7 bus · E8 phone · E9/E10 warning · E11 count down · E12 back · E13 stop · E14 bus goes over · E15
cat · E16 after · E17 phone in the gutter · E18 question

## 5. Look and HUD

The house style (STYLE_BIBLE, the hybrid study § 6): a real-feeling low-poly world, warm morning sun from the
east-south-east, a serif title centred on frame 1 over the action, serif captions, a corner readout (FRICTION GOES IN
→ FRICTION BACK IN x.xx s → FRICTION BACK +x.xx s), a clock (THIS MORNING 8:14:07.38 AM, hundredths in the replays), a
context line (the hill's speed and how far everything has slid, the bus's turn), pinned labels, honest tags, and five
small diagrams (atoms snagging, the screw's ramp, cotton thread, a grain pile, Galileo's ramp).

## 6. Sound (sound-*.js, mix.js; all synthesised, seeded)

- the score (E minor): one low blow when friction goes; the chord glides down an octave as the clock slows (a tape
  stopping); a steady pulse under each replay section; the build from "Now everything starts to slide"; a heartbeat
  and a roll into the count down; **0.42 s of total silence** before s = 10; the blow; the question's theme never
  resolves (its last chord is cut on the last frame)
- the places: the kitchen and the street at real speed, and stretched (darker, an octave down) when slowed down; the
  bus's diesel until it goes over; car alarms after
- the events at their story seconds, the same sound in every replay, slowed down with the picture: the brakes'
  screech cut dead at s = 0; nothing scrapes or skids while friction is gone (things slide in silence); at s = 10 every
  tyre at once, the bodies, the bins, the bus going over

## 7. Review log

See EPISODE_REPORT.md.

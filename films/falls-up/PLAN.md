# What if everything you dropped fell up for 10 minutes?

A voiceless 16:9 long-form film: 1920×1080, 30 fps, 4:55. It follows the Slower light / Friction 10s / Days shorter
formula and the owner's YouTube lessons (28 October 2026):
- **an everyday place:** your 5th-floor kitchen, the street below it and the park across the road. It is a Saturday
  in late October, from 3:00 PM to 3:10 PM;
- **action on frame 1:** under the title, the glass of water slips out of your hand (slow motion) and falls up into
  the ceiling;
- **the real nuance in the first minute:** Galileo's rule still holds (a spoon and a grape land on the ceiling
  together), and "gravity only ever pulls; nothing we know of could make it push" is the one impossible part, said
  at 0:25;
- **a new consequence every few seconds,** escalating from odd (the glass, the tea) to funny (the cat) to far (the
  apple going to space) to dangerous (the runner in the tree) to the crash at 3:10;
- **tension to the last frame:** the film ends a few seconds after 3:10, with the frozen fountain water still 5.5 km
  up, your apple still climbing at 148 km, and "Where would you stand?". There is no recap.

It also follows the owner's rule of 29 October 2026: **the story clock only runs forward**. One clock (`FU_CLOCK`,
script.js) runs at real speed, in slow motion for six moments (the glass, the spoon and the grape, the cat's jump, the
runner leaving the ground, the coat, and 3:10 in the kitchen), and jumps forward only at a cut ("+N s" on the HUD).
`script.js` throws if a segment runs backwards.

Page: `falls-up.html`. Captions: `CAPTIONS.md` → `node build-timing.cjs` → `timing.js`. Every number on screen comes
from `physics.js` (§ 2).

## 1. The rule

From **3:00:00 PM to 3:10:00 PM**, anything that loses its support (a hand, a shelf, the ground) falls **up** at
9.81 m/s² (weaker with height, as gravity is) and keeps falling up until something stops it. Whatever it lands on (a
ceiling, the underside of a branch) holds it there. Anything still held, or standing on something, is untouched. The
air keeps its weight (otherwise the sky would leave), and the HUD says so. At 3:10:00 everything goes back to normal
and whatever went up starts to fall.

- **The one impossible thing:** gravity only ever attracts. No known physics makes it push.
- **Everything else follows:** everything falls up at the same rate (the spoon and the grape); air drag limits each
  thing to its terminal speed and the air thins with height (US Standard Atmosphere), so things speed up as they
  climb; running is a series of jumps (both feet are off the ground twice a stride), so a runner falls up; walking is
  safe.

## 2. The physics (physics.js)

`fuFlight(s0, vt, {h0, v0})` integrates each flight once at load (fixed steps): gravity with height, quadratic drag
with the terminal speed vt scaled by the air density at height. The tables are pure; the HUD reads them.

| thing | let go | vt (sea level) | at 3:10 | top (then falls) | lands |
|---|---|---|---|---|---|
| your apple (from 13.4 m) | 3:01:30 | 38 m/s | 124 km | 214 km at 3:12:20 | 3:21:13 |
| it crosses 100 km (space) | | | 3:09:40 | | |
| keys | 3:02:11 | 22 m/s | 15.0 km | | |
| phone | 3:02:15 | 30 m/s | 28.9 km | | |
| the carp | 3:03:31 | 25 m/s | 13.6 km | | |
| the kicked football | 3:03:40 | 27 m/s | 14.8 km | | |
| ice cream | 3:03:45 | 12 m/s | 5.1 km | | |
| the coat | 3:05:09 | 9 m/s | 2.8 km | | |
| the fountain's first water | 3:00:00 | 8 m/s (3 mm drops) | 5.5 km, frozen | | falls until ~3:20 |
| the runner, if she let go | 3:04:18 | 55 m/s | 72 km (the HUD: "62 km" if she let go at 3:04:29) | 113 km | |

- At 14.6 km (3:06) the air is −57 °C: the apple's skin is freezing.
- Lost phones reach 11 km (airliner height) around 3:07, so planes near the city are turned away.
- The kitchen: the ceiling is 2.6 m. The glass (from 1.0 m) hits it 0.56 s after it leaves your hand; the spoon and
  the grape hit 0.57 s after they are let go.
- The cat jumps off the counter (0.92 m) and lands on the ceiling 0.60 s later: it rights itself in the air, as cats
  do, so it lands on its feet. Its two tries to jump "down" (2.4 m/s) last 0.49 s each.
- At 3:10 everything on the ceiling falls 1.8 m onto the table (0.61 s) or 2.6 m to the floor (0.72 s).

## 3. The beats (CAPTIONS.md, 55 captions)

1. **Kitchen, 3:00–3:01:20.** The glass (title). "For the next 10 minutes, anything you let go of falls up." The spoon
   and the grape (Galileo). The window: the park's leaves going up, the fountain's column. "Gravity only ever pulls…
   the one impossible part." The kettle: the tea pours up and pools on the ceiling. The cat jumps down, lands on the
   ceiling on its feet, and can't get down (every jump takes it back up).
2. **The apple, 3:01:27–3:01:40.** Out of the window: it climbs out of sight (a tracking shot from the park, the
   height on a pinned label).
3. **The street, 3:02:07.** Keys, coffee, a phone.
4. **The park, 3:03–3:05:52.** Autumn in reverse (leaves). The fountain's water goes up and doesn't come back (1.6 km
   by 3:03:18). A carp jumps and keeps going. Every kick is a lost ball, every scoop of ice cream. Walking is safe;
   running isn't (the stride inset). **The runner:** music on, she hasn't heard; her first stride takes her up into the
   plane tree; she grabs a branch and has to hold on for 5 min 30 s. A coat thrown to her falls straight past her. A
   dog jumps for a stick: its owner is flying a 20 kg balloon. Pigeons land on the undersides of things.
5. **3:06–3:07.** Your apple at 14.6 km (higher than Everest, than airliners; −57 °C). Lost phones at 11 km: planes
   turned away. (The height ladder inset.)
6. **3:07:20–3:09:59.** Everyone is holding on. "At 3:10 it all switches back." Back home, the ceiling is full, right
   above your table. She's still holding on. 3:09:40: your apple crosses 100 km. Ten seconds (the count, 10 to 1).
7. **3:10.** Your kitchen: everything comes down at once (slow motion). The park: she drops to the path; the leaves
   and the fountain's frozen water come back down (until 3:20). "Your apple lands at 3:21. Somewhere. Where would you
   stand?"

Three signature moments: the cat landing on the ceiling on its feet; the runner falling up into the tree; the
ceiling coming down at 3:10.

## 4. Look and sound

Engine pieces reused: Person rigs, ViewerHands (your hands hold the glass, the spoon and the grape, the kettle, the
apple), StoryHUD, PostProcessing, fog. The kitchen, street, park and cast are this film's own (films/falls-up/). The
HUD: the countdown top left ("DROPPED THINGS FALL UP FOR 9:11"), your apple's height and the next mark under it; the
clock top right (SATURDAY 3:01:10 PM, "SLOW MOTION ×0.38" / "REAL SPEED", "+N s" on a jump); serif captions bottom
centre; the big count for the last ten seconds.

Sound: an original synthesised score (a theme that climbs every time something falls up and comes back down at the
end), ambience, and effects at their story seconds. The score leads: the beds sit about 10 dB under it (the owner's
rule after Days shorter). See audio.js and mix.js.

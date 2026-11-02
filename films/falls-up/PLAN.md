# What if everything you dropped fell up for 10 minutes?

A voiceless 16:9 long-form film: 1920×1080, 30 fps, 4:58. It follows the Slower light / Friction 10s / Days shorter
formula and the owner's YouTube lessons (28 October 2026):
- **an everyday place:** your 5th-floor kitchen, the street below it and the park across the road. It is a Saturday
  in late October, from 3:00 PM to 3:10 PM;
- **action on frame 1:** under the title, the glass of water slips out of your hand (slow motion) and falls up into
  the ceiling;
- **the real nuance in the first minute:** Galileo's rule still holds (without air in the way, a spoon and a grape
  land on the ceiling together), and "between masses, gravity only ever pulls; nothing we know of could make the Earth
  push" (dark energy is not a push between masses) is the impossible part, with gravity choosing what to push, at
  0:25;
- **a new consequence every few seconds,** escalating from odd (the glass, the tea) to funny (the cat) to far (the
  apple going to space) to dangerous (the runner in the tree) to the crash at 3:10;
- **tension to the last frame:** the film ends a few seconds after 3:10, with the frozen fountain water still 5.5 km
  up (melting on the way down), your apple still coasting up past 140 km, and "Where would you stand?". There is no
  recap.

It also follows the owner's rule of 29 October 2026: **the story clock only runs forward**. One clock (`FU_CLOCK`,
script.js) runs at real speed, in slow motion for six moments (the glass ×0.38, the spoon and the grape ×0.38, the
cat's jump ×0.25, the runner leaving the ground ×0.33, the coat ×0.33, and 3:10 in the kitchen ×0.2 for 4.6 s), and jumps forward only at a cut ("+N s" on the HUD).
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
with the terminal speed vt scaled by the air density at height, and a drag coefficient that about doubles through the
sound barrier (a sphere's Cd against Mach, `FU_CDM`; the speed of sound from the standard atmosphere's temperature).
The tables are pure; the HUD reads them.

| thing | let go | vt (sea level) | at 3:10 | top (then falls) | lands |
|---|---|---|---|---|---|
| your apple (200 g, 7.5 cm, Cd 0.47, from 13.4 m) | 3:01:30 | 39.3 m/s | 124.6 km | 210.7 km at 3:12:16 | about 3:21 |
| it goes supersonic (36 km) | | | 3:07:58 | | |
| it crosses 100 km (space) | | | 3:09:39 | | |
| keys | 3:02:11 | 22 m/s | 14.9 km | | |
| phone (170 g, tumbling) | 3:02:15 | 20 m/s | 12.7 km | | |
| a phone lost at 3:00 reaches 11 km | | 20 m/s | 3:07:01 | | |
| the carp | 3:03:31 | 25 m/s | 13.5 km | | |
| the kicked football | 3:03:40 | 27 m/s | 14.8 km | | |
| ice cream (a dense scoop) | 3:03:45 | 30 m/s | 17.2 km | | |
| the coat | 3:05:09 | 9 m/s | 2.8 km | | |
| the fountain's first water | 3:00:00 | 8 m/s (3 mm drops) | 5.5 km, frozen | | melts below ~2.3 km: ice-cold rain until ~3:20 |
| the runner, if she let go | 3:04:18 | 55 m/s | 64 km (the HUD: "if she lets go now", 54–58 km) | 92 km | |

- At 15.3 km (3:06) the air is −56.5 °C (the HUD rounds to −56): the apple's skin is freezing.
- The first phones lost at 3:00 reach 11 km (airliner height) at 3:07, so planes near the city are turned away.
- The kitchen: the ceiling is 2.6 m. The glass (from 1.0 m) hits it 0.56 s after it leaves your hand; the spoon and
  the grape hit 0.57 s after they are let go.
- The cat jumps off the counter (0.92 m) and lands on the ceiling 0.60 s later. Falling up feels exactly like falling
  down (weightless), so its inner ear can't tell it which way to turn: it sees the ceiling coming, twists, and lands
  on its feet (the caption says so). Its two tries to jump "down" (2.4 m/s) last 0.49 s each.
- The tap by the window drips: each drop falls up 28 cm into the cupboard over it (0.24 s).
- At 3:10 everything on the ceiling falls 1.8 m onto the table (0.61 s) or 2.6 m to the floor (0.72 s), and the hard
  things bounce (restitution 0.1 to 0.55) and roll; nothing lands under the lamp's shade. The cat comes down on the
  table, on its feet, beside the clutter.
- The runner: nobody can dead-hang for five minutes, so by 3:04:48 (off camera) she lies along the branch on its sky
  side, arms and legs locked round it.

## 3. The beats (CAPTIONS.md, 55 captions)

1. **Kitchen, 3:00–3:01:20.** The glass (title). "For the next 10 minutes, anything you let go of falls up." The
   dripping tap ("And it stays up, on whatever stops it"). The spoon
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
5. **3:06–3:07.** Your apple at 15.3 km (higher than Everest, than airliners; −56 °C). The first phones lost at 3:00
   at 11 km: planes turned away. (The height ladder inset.)
6. **3:07:20–3:09:59.** Everyone is holding on. "At 3:10 it all switches back." Back home, the ceiling is full, right
   above your table. She's still holding on (arms and legs round the branch). 3:09:39: your apple crosses 100 km
   (supersonic since 3:07:58, on the HUD). Ten seconds (the count, cut between her, her hands, the crowd and you under
   your ceiling).
7. **3:10.** Your kitchen from the corner by the door: everything comes down at once (×0.2), the camera tilting down with it onto your table, bounces and rolls; the cat lands
   on your table on its feet. The park: she drops to the path; "everything that fell up is falling back; your apple is
   still coasting up"; the fountain's frozen top melts on the way down (ice-cold rain until 3:20). "Your apple lands
   at about 3:21. Somewhere. Where would you stand?"

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

## 5. Review log

**Round 1** (three independent reviewers on the first preview, 4:55, 480×270): retention 4/10 overall (hook 6, first
30 s 4, pacing 4, escalation 6, clarity 6, payoff 5); visuals 5/10 overall (composition 5, light and colour 6,
readability 4, cat 4, runner 5, crash 4, HUD 6); physics 7/10 accuracy (honesty 8, consistency 7, numbers 8).

Fixed after round 1:
- **the crash at 3:10:** 4.6 s of slow motion (×0.2) from a locked camera at table height looking up across the table;
  bounces and rolls; nothing passes through the lamp; the big count only in the count shots; the cat comes down on
  your table on its feet;
- **the cat:** a medium shot at counter height (×0.25), cut mid-air to a camera just under the ceiling rolled 180°
  (the cat lands "on the floor"), then rolling back over to show it upside down;
- **the opening:** the glass slips at 0.5 s; bigger shards, bluer water; a shorter ceiling crane; a new dripping-tap
  shot; the window shot zooms in on the fountain's column;
- **the middle:** one shot per lost thing in the street; chase shots riding up beside the carp and the ball; a closer
  ice-cream shot; the leaves from under the plane tree; the fountain from the basin's edge; the stray head in front of
  the runner moved; her hold cut into wide, hands and above; more sway;
- **the count:** cut between her, her hands, the crowd and you under your full ceiling;
- **the HUD:** the "NEXT" line only in the sky shots ("SUPERSONIC · MACH n" once the apple breaks the sound barrier),
  bigger corner text, the count in the left third;
- **physics:** Mach-dependent drag (the apple's vt 39.3 m/s: 15.3 km at 3:06, 100 km at 3:09:39); phones at 20 m/s
  (the caption is now about phones lost at 3:00); the scoop at 30 m/s; "between masses" and "gravity choosing what to
  push"; "without air in the way"; the cat "sees the ceiling coming"; pigeons "fly upside down"; "nobody runs, nobody
  jumps"; the apple "still coasting up"; the ice melts into ice-cold rain; "about 3:21"; 200 N for the dog; heights
  with one decimal below 20 km; no temperature above 85 km; fainter stars beside the sunlit apple; the runner's arms
  and legs locked round the branch from 3:04:48.

Not done: the fountain is still one straight column (no break-up into drops, no lean in the breeze); pigeons are not
flipped from take-off; there is no airliner banking in the planes shot; the walk diagram is still a diagram.


**Round 2** (one independent reviewer on the revised cut, 4:58, 480×270 sheets at two frames a second): retention 5/10
overall (hook 7, first 30 s 5, pacing 5, escalation 6, clarity 6, payoff 6); visuals 6/10 overall (composition 6,
light and colour 6, readability 5, cat 6, runner 6, crash 5, HUD 6). Best: the cat sequence, the runner close-up with
the count montage, the carp and ball chase shots. Swipe risks: the tap (0:09), the Galileo hold and the window
(0:18–0:36, the worst), 0:45–0:50, 1:12–1:15, the leaves and the fountain (1:36–1:58), the walk diagram (2:14–2:26),
the coat throw in a wide (2:53–3:03), the sky data shots (3:21–3:44), the still crowd at the railings (3:44–3:57).

Fixed after round 2 (no change to the captions or the length):
- **the crash:** the cut skips the last 0.17 s of 3:09:59, so everything lets go 0.4 s after the cut (not 1.25 s); a
  new camera from the corner by the door sees the whole full ceiling, then tilts down with everything and tightens onto
  your table (lower third), where the cat lands; the cushion and the slipper that fell past the lens now land
  elsewhere;
- **long holds split with a new angle each** (the clock keeps running): the spoon and the grape up close on the
  ceiling (0:20); the plane tree across the road streaming leaves into the sky, from your window (0:30); the leaves
  from the top of its crown, against the sky (1:42); straight up the fountain's column from the jet, "ITS TOP 1.7 km"
  at its vanishing point (1:52); an old man with his arms round a lamp post (3:50);
- **the tap:** a close-up from just above the counter: the spout, a drop climbing, the cupboard's wet underside;
- **readability:** a closer camera on the apple (it sits right of centre, its label clear of the speed inset); the
  apple's label in the sky shots moved to its right (off the context line); the planes shot now follows a phone lost
  at 3:00 (11.0 km at 3:07, matching the caption; it was a later phone at 6.8 km); a bigger height ladder with fewer
  marks (Everest dropped from it: too close to the airliners to read; the caption still names it).

Still not done: the walk diagram and the coat throw are unchanged; the tap's drop is still small in frame; the sky data
shots (3:21–3:44) are still mostly an apple and a phone against clouds.

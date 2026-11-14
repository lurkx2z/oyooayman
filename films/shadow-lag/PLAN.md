# What if your shadow lagged 1 second behind you?

Voiceless 16:9 long-form, 4:50 (289.9 s), slug `shadow-lag`, page `shadow-lag.html`. Built the way of Gravity tilts
90°, Friction 10 s, Light stopped bouncing and Magnets 1,000×, to the owner's YouTube lessons of 2026-10-28, in the
eerie horror tone of Slower light (the channel's best):
- an everyday, human-scale place: a multi-storey car park at midnight (new scenery: no kitchen, flat, street or city);
- action in the first 5 s (the title is over the stair door; at 0:03.6 your shadow stays in the doorway);
- the real physics in minute one (a shadow is where light can't reach; a normal shadow is 5 billionths of a second
  late; 1 s is more than 100 million times later);
- under 5 minutes, no filler; the story clock only runs forward (no replays, 2026-10-29);
- tension to the last frame, no recap: the last shot is the back seat, and the question;
- the music clearly leads, beds about 10 dB under it, measured stem by stem (2026-10-31);
- no z-fighting.

## 1. The rule

From 11:58 PM on Friday 13 November, your shadow (everywhere your body stops light) is your body as it was exactly
1 second ago. Light, reflections and everyone else's shadows are on time. The one impossible part, said on screen:
where your shadow should be, light lands as if you weren't there; where you were a second ago, it never lands at all.
The film draws you twice: your body (seen, casting no shadow) at story time s, and an invisible copy of you (casting
the shadow, never seen) at s − 1. In your car, the copy sits in a ghost of the car where the car was 1 s ago, so your
shadow rides "on nothing" 7 m behind it.

## 2. The physics (physics.js; every caption number is checked against it in script.js)

- A normal shadow's delay: light that just misses your shoulders still has 1.5 m to the floor: 1.5 m / c = 5.0 ns.
  1 s is 200 million times that (the caption says "more than 100 million").
- Your walk 1.4 m/s, so the shadow walks 1.4 m behind; your run 5.0 m/s, 5 m behind.
- The ramp: 25 km/h (the sign says 5 mph = 8 km/h: about 3 times the limit); 6.94 m/s, so the shadow is 7 m behind.
- "Compared to what?": at 52.6° N the Earth's spin carries you east at 282 m/s (the caption rounds to 280), its orbit
  at 29.8 km/s; left behind in space, a 1 s late shadow would be 30 km back along the orbit.
- 8.2 billion people on Earth (late 2026, rounded); the caption says 8 billion shadows.
- Four lamps light you in the top shot: four shadows, all late.
- At 12:00 AM half the lamps switch off (a checkerboard; the one over your car's aisle stays on).

## 3. The beats (CAPTIONS.md: 29 beats after the title, 63 captions)

start (your shadow stays in the doorway) · only · warn · light · hand · film (your phone sees it too) · walk · stop ·
turn · jump · mirror (on time) · lamps · impossible · where · midnight · steps · hide · still · moving · guard (his
torch) · seen · radio · run · lock · car · speed (the ramp) · cctv (camera 7, +34 s) · exit (the barrier, +27 s) ·
question ("So whose shadow is that?").

## 4. Sets and shots (shots.js: 39 shots)

- Level 4 (deck.js, deckset.js): the concrete deck under the soffit's beams, columns and fluorescent tubes, the stair
  door, a mirror, the open parapet with the town below, parked cars and a van, your car (car.js), the night guard and
  his torch (cast.js). Three bulkhead lamps ("wall keys") throw hard, dark late shadows on the wall for the tests and on
  the floor for the pillar and the run.
- Level 2 seen by camera 7 (a grey, timestamped CCTV picture).
- The exit lane at street level (exit.js): the barrier, the ticket terminal, the sodium lamps, the wall beside your car.

## 5. Sound (sound-lib.js, sound-music.js, sound-amb.js, sound-sfx.js; mix.js)

No narrator. Three stems, all synthesised from seeded code. The score's idea: every note of the motif has a "shadow",
the same note an octave down and dark, 1 story second later. Beds by place (level 4's lamp hum and concrete, the open
edge and the town, camera 7's hiss, the exit lane's sodium lamps and street), sinking a little in the slowed stretches.
Effects on their story moments (footsteps, the stair door, the guard's steps and torch click, his radio, your run, the
car's locks, engine and tyres, the barrier).

## 6. Checks and review log

- script.js throws if a caption's moment or number drifts from physics.js (14 caption moments, 13 caption numbers).
- Review round 1 (story, visuals, physics) and the fixes: EPISODE_REPORT.md.

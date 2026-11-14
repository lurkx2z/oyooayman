# What if magnets got 1,000 times stronger for 10 seconds?

Voiceless 16:9 long-form, 5:08 (308.25 s), slug `magnets-1000x`, page `magnets-1000x.html`. Built the way of Gravity
tilts 90°, Gravity keeps tilting and Friction 10 s, to the owner's YouTube lessons of 2026-10-28:
- an everyday, human-scale place (a narrowboat on a river beside a scrapyard; the hospital across the water);
- action in the first 5 s (the title is over the boat; at 0:02.9 the radio goes silent and the yard's magnet slams on);
- the real physics in minute one (a speaker is a coil in a magnet's field; the cube law; the 1997 frog);
- about 5 minutes, no filler; the story clock only runs forward (no replays, 2026-10-29);
- tension to the last frame, no recap;
- the music clearly leads, beds about 10 dB under it, measured stem by stem (2026-10-31);
- new scenery only (no kitchen, apartment, street or city), no z-fighting.

## 1. The rule

At 10:42:00 AM on a Saturday every magnet's field becomes 1,000 times stronger: permanent magnets, electromagnets, the
MRI's coil, the magnets in phones, speakers, motors and generators. Earth's own field stays as it is. At 10:42:10 every
magnet goes back to normal. Steel stays steel (it saturates; its pull grows ×1,000, and up to ×10⁶ for unsaturated steel
or magnet on magnet). The one impossible thing, said on screen: the magnets survive their own field, and the field's
energy comes from nowhere.

## 2. The physics (physics.js; every caption number is checked against it in script.js)

- The scrapyard's lifting magnet: 1.8 m across, about 1 tesla at its face, a dipole far away. Steel lifts at 1 g from
  1.8 m normally, 14.6 m now (the cube law: 10 × 10 × 10 = 1,000; the field reaches 10× as far, pull on steel 8×).
  Labelled GENEROUS on screen: a real scrap magnet this size reaches less far.
- The pile: 1,811 bodies (scrap, old cars, a site office) integrated under the pull, gravity, ground, friction and drag;
  they stick where they touch the ball. The crane's rope parts at s 0.012. The ball holds 159 tonnes at 10:42:10.
  Fastest hit 781 km/h; to get away a bolt would need 530 km/h.
- Your boat: 16 t (12 t of steel) in 12 segments, 20 m from the ball; sideways water drag ∝ speed²; the engine pushes
  1.5 kN. It hits the wharf's wall at s 9.13 (7.7 m/s) and is lifted until 10:42:10. Halve the distance: about 43×.
- The squeeze between a magnet's ends: B²/2μ₀ = 3.9 million atmospheres (Earth's centre: 3.6 million).
- The MRI: 3 T → 3,000 T; it pulls steel from about 6 m; the oxygen cylinder (15 kg) comes through the wall at s 0.205
  and hits the bore at s 0.316; water in the cup is thrown out (diamagnetic; the 16 T frog); a patient would be pushed
  out at up to 5,500 g; the waiting room's phones 10 m away are pulled at 2.4× their weight and wrenched round like
  compass needles.
- Your phone: held until the pull passes 5× its weight (s 6.19); it hits the ball at 1,783 km/h (s 6.72).
- Electric cars' motors become brakes; the turbines' generators lock and the 10 t blades snap off.
- After: the ball's outside falls away; its middle stays one crushed, partly welded lump; steel keeps a little
  magnetism (a spanner holds nails; paperclips would stick to the hull).

## 3. The beats (CAPTIONS.md: 24 beats after the title, 59 captions)

start · radio (silent, still on) · phone (you hold on) · pile (rope snaps) · reach (cube law; your boat 20 m) · mri ·
cylinder · water · waiting · speed · boat · real (impossible) · cars · road · turbine · boat2 (your mum; the engine
loses) · inside (the kettle) · phonehit · close · count · back · after · question.

## 4. Sets and shots (shots.js: 39 shots)

- The river: the narrowboat "Kingfisher" (boat.js), the scrapyard on a wharf with its crane and ball (yard.js), the
  bypass bridge with traffic, the wind turbines 1.6 km off, the south bank (river.js; cameras and labels riverset.js).
- The hospital's MRI suite (hospital.js): the scanner room, a cutaway plan, the corridor, the waiting room.
- Three short check-ins on your boat between the far-away beats (over the ball's shoulder; low on the water; your eyes).

## 5. Sound (sound-lib.js, sound-music.js, sound-amb.js, sound-sfx.js; mix.js)

No narrator. Three stems, all synthesised from seeded code. The score in D minor carries a five-note motif; the boat
has a low ostinato that returns at each check-in. Beds per place (river, inside, hospital, bridge, hill, high) run at
the world's slowed speed. Effects land on their story moments (the radio's song stops dead; every magnet's hum, cut at
10:42:10; clanks, groans, the cylinder, the phones, the kettle, the bike, the crash, the drop).

## 6. Checks and review log

- script.js throws if a caption's moment or number drifts from physics.js (12 caption numbers, 8 caption moments).
- Review round 1 (story, visuals, physics) and the fixes: EPISODE_REPORT.md.

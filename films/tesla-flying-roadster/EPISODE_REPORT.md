# Episode report — What if your car could fly? (the Tesla Roadster)

**Format:** vertical 1080×1920, 30 fps, 2:32, narrated (Charlie, ElevenLabs). Page `tesla-flying-roadster.html`.
**Branch:** `episode/tesla-flying-roadster-4iom0h`. Plan, physics and sources: `PLAN.md`.

## What it is
Tesla's Oct 15 2026 demo, reconstructed, then explained through the three ways anything beats gravity:
1. **Wing.** A stunt plane does fly upside down (the owner's premise is corrected on screen), but lift needs speed:
   slow down and the wing stalls. A wing can't just hang there.
2. **Suction.** X-ray of the two underbody fans; the air around presses harder than the air beneath. Tesla's 2 g ≈ 7 kPa,
   under a tenth of air pressure (our estimate). At speed the curve alone pins it (v²/R > g); the fans hold it slow.
   Leave the ramp and nothing holds you.
3. **Thrust.** 10 cold-gas nozzles, ~600 L of air: the mid-air roll and the braking burst. A hover test (our estimate):
   ~30 kg of air a second against a few hundred kg in the tanks, so seconds, not minutes. A helicopter for contrast.

Then the kickflip over a row of cars, a verdict (SHOWN vs STILL A PROMISE) and the driver's seat stopped upside down:
"So… would you ride in it upside down?"

## Signature moments
The car upside down on the ramp's ceiling; the plane's stall; the hover running out of air on "seconds"; the kickflip;
the upside-down driver's seat.

## Honesty
Reconstruction / slow motion / our estimate tags on every non-footage claim; airspeeds marked illustrative; "nobody on
board" on the verdict and the last shot; Tesla's claims labelled as claims (2 g, 0–60 under 1 s, 2028).

## Sound
Four synthesised stems: voice, an original E-minor score, per-place ambience, event effects. −15.2 LUFS, −1.5 dBTP,
LRA 4.8 LU (WAV); the video's AAC copies −15.3 LUFS / −1.8 and −1.9 dBTP.

## Reviews
Independent reviews of v1 (stills, script, plan, sound code): viewer 6, retention 4, clarity 5, visuals 6, science 7,
sound 7. Top fixes applied in v2 (see `PLAN.md` § 5). v2 not re-scored.

## Still weak
- The sky section (24–54 s) is long and has no Roadster in it; the narration can't be cut, so the shots carry it.
- The car is boxier than the real one; the cabin in the last shot is simple.
- The mix was checked by measurement and code review, not by ear.
- The title is a static shot for its first 4 s.

## Deliverables
- Runnable ZIPs: `/mnt/project-files/tesla-flying-roadster/tesla-flying-roadster-v1.zip`, `-v2.zip`.
- Final MP4: rendered on the owner's GPU with `node films/tesla-flying-roadster/render-gpu.cjs --channel chrome`
  (output in `renders/tesla-flying-roadster/` on that PC).

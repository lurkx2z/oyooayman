# EPISODE REPORT: WHAT IF MEN SUDDENLY DISAPPEARED FROM THE WORLD?

Page `men-disappear.html` · folder `films/men-disappear/` · branch `episode/men-disappear-p0297u` · 67.0 s, 1080×1920,
30 fps · one MP4 under 30 MiB plus a runnable ZIP (unzip, open `men-disappear.html`, press Space).

## The idea

Every man aged 18 and over vanishes in the same second. The film is about **systems, not people**: what keeps running
when the person operating it is gone. You are a woman in the front car of a commuter train on a harbour viaduct. The
rule is shown, then checked against machines that were built to notice a missing operator and machines that weren't.
Tone: neutral. Men simply vanish (no bodies, no gore, no jokes about either sex).

## The beats

| Time | Beat | Why it's there |
|---|---|---|
| 0–4.5 | The full car; at 1.8 s every man vanishes. A strap swings, a cup falls, a newspaper flutters, a phone drops. World population 8,301,468,2xx → 5,379,867,7xx. | The hook: the rule, seen in one frame. |
| 4.5–9.3 | **Signature 1:** the driver's seat is empty; the dead man's switch trips the emergency brake. The train stops itself. | First surprise: a machine *designed* for this. |
| 9.3–16.6 | The waterfront road: cars coast, women drivers brake, an old SUV on plain cruise control hits a parked van. | The contrast: most cars have no such switch. |
| 16.6–24 | **Signature 2:** a 180 m container ship crossing toward the viaduct; telephoto on its lit, empty wheelhouse. 98.7 % of merchant seafarers are men. | The impossible-looking consequence: a ghost ship under way. |
| 24–31.7 | MEANWHILE: an empty cockpit (≈ 95 % of airline pilots are men), an alarm in an empty fire station (≈ 95 % of US firefighters), a hospital ward that keeps running (≈ 90 % of nurses are women). | Scale, and the other side of the rule. |
| 31.7–46.4 | The bow is closer. The women take the children to the back. You walk into the cab. PIER IMPACT IN 00:11 … the bow comes in through the windscreen; a cut inside the ship's empty wheelhouse (autopilot on, the wheel making its own small corrections). | Tension, built on the ship you can see. |
| 46.4–54.4 | **Signature 3:** the bow hits the pier; the 60 m span falls onto the bow and into the water four metres in front of the train. | The payoff. |
| 54.4–67 | TRAIN STOPPED 4 m SHORT OF THE FALLEN SPAN. *The train stopped itself. The ship couldn't.* End line: *They were gone in an instant. / Some machines were built to notice. Most weren't.* | The point, stated once. |

## Numbers on screen and their sources

| On screen | Value | Source |
|---|---|---|
| World population | 8.30 billion → 5.38 billion (2.92 billion men 18+ gone) | UN World Population Prospects 2024 (late-2026 medium variant). Men 18+ ≈ 35.2 % of everyone, derived from the WPP 2024 age structure; an estimate, rounded. |
| Merchant seafarers | 98.7 % men · 1.89 million seafarers | ICS/BIMCO Seafarer Workforce Report 2021 (women ≈ 1.28 %). |
| Airline pilots | ≈ 95 % men | ISWAP estimates (women ≈ 5–6 % of airline pilots worldwide). |
| Firefighters (US) | ≈ 95 % men | US Bureau of Labor Statistics, Current Population Survey. |
| Nurses worldwide | ≈ 90 % women | WHO, State of the World's Nursing 2020. |
| Train | 58 km/h → stops in ~12 s | Vigilance (dead man's) device → emergency brake at up to 1.4 m/s² (`MD_TRAIN` in script.js). |
| Ship | 6.2 knots, about thirty thousand tonnes | A 180 m feeder container ship; the 2024 Francis Scott Key Bridge collapse is the real precedent for a ship hitting a pier. |

The note on screen: *FIGURES ARE ESTIMATES. EVENTS COMPRESSED FOR THIS SIMULATION. NOT A PREDICTION.*

## Reviews (scores as given, independent reviewers)

| Pass | Retention | Viewer | Phone clarity | Cinematography | Visual quality | Physics / accuracy | Differentiation |
|---|---|---|---|---|---|---|---|
| Preview (270×480, before fixes) | 6 | 5.5 | 5 | 6 | 6.5 | 8 | 5 |
| Final 1080×1920 audit (v1 final) | 6.5 | 6 | 6 | 6 | 6 | 8 | — |

The fixes made after the final audit (below) were not re-scored.

### Fixed after the preview reviews
Seafarer share corrected (98.7 % of *merchant* seafarers); "Most cars" / "an older car" with no auto-brake; "Thirty
thousand tonnes"; FIGURES ARE ESTIMATES in the note; end line rewritten so it no longer contradicts the train stopping;
the countdown shortened and broken by a new shot inside the empty wheelhouse; the impact reframed low by the pier; a
TRAIN STOPPED 4 m readout; a closing crane shot; brake shot pushed in; telephoto fog thinned; loudness trimmed to −16.7
LUFS (true peak −1.1 dBTP).

### Top 3 fixed after the final 1080×1920 audit
1. **A render glitch at 31.70–31.77 s:** on the cut back from the montage, a passenger stood up from the seat under the
   camera and filled the frame for three frames. Her move to the back of the car now starts during the montage.
2. **The countdown showed empty track.** The cab now looks at the ship: the bow comes in through the windscreen and grows
   as PIER IMPACT IN counts down, with the fog thinned. The countdown is now the big number (the metres became the
   subline).
3. **The impact had little contrast** (only ~5 dB above the countdown bed). The countdown pulse stops 0.6 s early and the
   whole mix sinks for the last moment, so the impact now lands ~11 dB above the half-second before it. The ship beat
   at 17–20 s also got a slow push-in so it isn't static.

## What is still weak (honest)

- The road / SUV crash (9.3–16.6) and the MEANWHILE montage (24–31.7) echo earlier films; the differentiation reviewer
  scored the film 5 / 10 for this. Replacing them would have meant rebuilding a third of the film.
- The SUV crash is a small event in the distance on a phone; it reads mostly through the km/h readout and the red tag.
- The telephoto wheelhouse (20.4–24) reads as lit windows more than "empty".
- The hospital nurse's pose is stiff.
- "Boys stay" is part of the rule but is never shown; the children in the car are too small to read as boys.
- The high shot behind the train (51.5–54.4) doesn't clearly show the gap in front of the train.
- The 8.6 s outro has little motion.
- HUD sublines (e.g. "2.92 BILLION MEN (18+) · GONE") are small on a phone.
- The sound has been level-measured and synced (impact peak at 47.62 s, span landing at 48.85 s) but never listened to.

## Creative assessment

The strongest idea is the comparison the premise gives for free: one machine built to notice a missing operator (the
train), and one that isn't (the ship), meeting at the same bridge. That's grounded, counterintuitive and specific, which
is what has performed on the channel (Friction, Oxygen). The weakest part is the middle third, which is a familiar
template (car crash, montage). A stronger v2 would cut the road beat and the cockpit, and spend that time on the ship and
the wheelhouse.

## Files

`script.js` (beats, braking table, camera, HUD) · `film.js` (camera carry, looks, outside angles, hands, effects, grade)
· `harbour.js` · `bridge.js` · `ship.js` · `train.js` · `cast.js` · `road.js` · `montage.js` · `audio.js` ·
`soundtrack.js` (baked) · `PLAN.md` (rules, sources, shot list, review log).

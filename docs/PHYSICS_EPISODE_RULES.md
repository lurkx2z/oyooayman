# Physics episode rules — how to do a "What if …?" honestly

> Viewers comment on accuracy. Reviewers predicted comments like *"why is the kebab guy still cooking at 0 % oxygen
> lol"* and *"concrete would crumble / ozone would go, this is wrong"*. A plausible simulation keeps the comment section
> arguing about the *interesting* edge cases instead of dismissing the video. The owner's very first rule: *"Avoid viral
> misinformation."*

## 1. Every episode's PLAN.md must define

| Item | Example (Friction) |
|---|---|
| **Exact fictional rule** | Solid-on-solid friction (static and kinetic) → 0 for exactly 60 s, then back to μ 0.8 over 0.1 s |
| **Variables held constant** | air resistance, fluid viscosity, structural integrity, gravity, electricity, biology |
| **Variables changed** | μ between solid surfaces |
| **Real consequences** (each one a beat) | no traction for walking; wheels spin without moving the car; brakes stop wheels, not cars; steering does nothing; slopes pull with m·g·sinθ; held objects need normal forces; collisions still happen; sliding is silent; the return skids, trips and rolls things |
| **Artificial simplifications** | 2D top-down rigid bodies (OBB cars, circle props) at 240 Hz; scripted kicks/holds for hero moments; impulses clamped; a rollover needs a kerb trip |
| **Common misconceptions to avoid** | "everything starts sliding instantly" (no: nothing moves without a force); "cars stop when they brake" |
| **Formulas used internally** | F = m·g·sinθ (7° → 1.2 m/s²); drag ½ρC<sub>d</sub>Av²; skid deceleration ≈ 7 m/s²; trip threshold ≈ 2.8 m/s lateral (truck 2.2) |
| **What must NOT be claimed** | that the timeline or magnitudes are realistic where they aren't; "this would happen"-certainty on contested points |

Write it as a table in § 1 of PLAN.md (`films/friction/PLAN.md` § 1 is the model).

## 2. The method

1. **Isolate the rule.** Define it as narrowly as needed for the physics to stay defined:
   - "only molecular O₂ vanishes, not oxygen atoms";
   - "aerodynamic effects isolated: ρ ×10, pressure/temperature/breathing normal";
   - "solid-surface friction only".
   Say what is held constant.
2. **Derive consequences from first principles, then rank them by surprise.** Each beat = one mechanism the viewer
   didn't think of (batteries keep working; no fireball because nothing can burn; brakes can't grip the discs either;
   a 60 km/h wind in 10× air pushes like 190 km/h).
3. **Compute the numbers you show.** HUD numbers must be the right order of magnitude and internally consistent:
   - O₂ pressure drop 21 % instantly, settling toward 23 %;
   - flames out at ≈ 15 % O₂;
   - engines die at 14–5 %;
   - hypoxia: functional 10–15 s, unconscious 15–25 s; holding your breath stops the washout and buys ~30 s;
   - terminal velocity ∝ 1/√ρ, so 10× air → 0.316× terminal speed;
   - wind pressure ∝ ρU², so v_eq = √10 · 60 ≈ 190 km/h;
   - sound delay d/343 s.
4. **Prefer precomputed simulation for the hero motions** (Friction slide sim, Air drag tables integrated at 1 ms,
   Andromeda restricted N-body, Before Screens marbles). Sample by time; tune initial conditions, not keyframes. Script
   only what the sim can't do cinematically, with plausible forces.
5. **Mark the fiction where the brief is fiction:**
   - accelerated timelines (`TIMELINE DRAMATICALLY ACCELERATED FOR THIS SIMULATION`, Andromeda's
     `REAL MERGER TIMESCALE: BILLIONS OF YEARS / OUR SIMULATION: ONE NIGHT`);
   - isolated effects (`Aerodynamic effects isolated for this simulation.`);
   - satire (`SATIRICAL SIMULATION · NO, SLIPPING CANNOT ACTUALLY CAUSE THIS.`).
   **After** the hook and the payoff, small and short.
6. **Run a science reviewer** (an independent agent) on the preview: *"Does anything violate basic physics? What would a
   pedantic commenter say?"* Fix real errors; keep defensible stylisation.

## 3. Fixes the science reviews forced (learn from them)

| Episode | Original | Corrected |
|---|---|---|
| Oxygen | the city lights stay on after O₂ is gone | ~60 % of electricity comes from burning fuel → the grid collapses ~4 s after zero; battery things keep going |
| Oxygen | instant collapse / falls looked staged | hypoxia timing 10–15 s functional, 15–25 s unconscious; the hard worker goes first |
| Oxygen | a "boom" when O₂ vanishes | no pressure wave; the thump is inside your ears (ear pop) |
| Oxygen | viewer conscious until ~55 s while others drop at ~20 s (draws "fake" comments) | holding your breath is real: it stops the washout of O₂ from the blood; CO₂ forces a breath at ~50 s |
| Oxygen | a fireball at the crash | no fireball (fuel can't burn): a dust column, the thud arriving 1.5 s late |
| Oxygen | grinder sparks still bright at 15 % O₂ | dull, short sparks (bright sparks are steel *burning*) |
| Friction | braked wheels lock | brake pads can't grip the discs either → braked wheels keep turning |
| Friction | wheel-spin car with an engine roar | an EV (no engine sound, the motor whines) |
| Friction | hooking an arm round a pole | chest-first hit, foot braced on the kerb (normal forces only) |
| Friction | people hop kerbs while sliding | they don't (only contact-point speed > threshold hops) |
| Friction | smoke and sparks from frictionless hits | none (sparks need friction) |
| Friction | a sedan rolls from tyre grip alone | not physical at μ 0.8; it needs a kerb trip (bus island) |
| Friction | a perfectly flat road | roads have ≈ 2 % camber (noted; small drift) |
| Moon | one permanent water wall under the Moon | changing levels, drains and surges, inundation; nonlinear tidal escalation |
| Andromeda | discs smashing, shockwaves hitting Earth | no star–star collisions; gravity, tidal tails, star formation, passes, merger |
| Air | "everything moves 10× slower" | motion depends on speed, mass, shape, area; drag ∝ ρv² |
| Depersonalization | SENSE OF SELF draining like a game meter | it visibly recovers to 96 % (the self doesn't shrink; the feeling of connection dulls). "It doesn't happen to everyone"; a gentle health note |

## 4. The parody exception (Slip and Fall)

- The causal chain is **intentionally fictional**, but each link imitates real science language and **starts tiny**:
  1.7 kN impact, 0.07 J into the ground, 1.4 mm pebble, a fault at 99.999 % stress, 0.2 mm slip, M2.1 → M8.7,
  1,674.40 → 1,674.41 km/h, +0.0006 %, sea −38 m, wave 3 → 146 m.
- *"Do not use obviously impossible giant numbers too early. Start tiny. The numbers become more ridiculous through
  CONSEQUENCES, not magnitude."*
- **Never let it be mistaken for real earthquake prediction.** The satire note comes after the punchline.
- The joke only works if the production is as serious and polished as a real episode.

## 5. What must never be claimed

- Real-world predictions, dates, or "this will happen" for fictional scenarios.
- Medical claims beyond the brief's careful framing (Depersonalization: "can feel like", "for some people", "if it
  keeps happening, talk to a healthcare professional").
- Fake private data about the viewer (Game/Sim briefs: no IP, name, city, account, battery, contacts, camera status,
  device ID; never claim real touch/tilt detection).
- That a WWII outcome changed ("avoid stating literally that WWII would end").
- Real brands, insignia or platform UI.

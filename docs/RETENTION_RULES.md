# Retention rules — what we learned from real uploads

> Only numbers and observations **supplied by the owner** are listed as facts. The quotes can be checked in `docs/briefs/`
> (07 = the 22.4 s stat, 10 = the 45.9 % stat, 12 = "best-performing so far", 16 = the tsunami joke, 17 = the latest
> observations). Nothing here is invented. Where the
> owner has not reported a result, it says **UNKNOWN**.

## 1. Real performance data (owner-supplied)

| Episode | Owner's report | When |
|---|---|---|
| **Oxygen** (91 s) | *"Your oxygen video got 22.4s average watch time on 91s."* *"Performed strongly on TikTok but had 45.9 % STAYED TO WATCH / 54.1 % SWIPED AWAY on its initial YouTube Shorts test."* At the time of the Air brief: *"The best-performing video so far was: WHAT IF OXYGEN DISAPPEARED?"* | Depersonalization override, Moon brief, Air brief |
| **Cosmic videos** (Andromeda, and/or Moon) | *"The weaker cosmic videos were visually large, but more predictable."* *"The Moon video taught us that spectacle alone does not guarantee retention."* | Air brief |
| **Friction** | **The strongest serious-physics performer.** | Handoff brief |
| **Oxygen** | **Also performed very strongly.** | Handoff brief |
| **Slip and Fall** (parody) | **Performed extremely strongly.** | Handoff brief |
| **Moon** | **Underperformed** relative to the stronger physics concepts. | Handoff brief |
| **Air (10× denser), 48.6 s short format** | **Did not perform as hoped.** | Handoff brief |
| Audience behaviour | *"The audience has repeatedly joked that somehow every scenario eventually ends in a tsunami."* | Slip brief |
| Before Screens, Depersonalization, Andromeda, Simulation, Game, Crossover | **UNKNOWN**. Whether each was uploaded, and how it did, has not been reported. | — |

No view counts, follower numbers or per-second retention curves have been shared. Don't make any up.

## 2. Lessons (directly supported by the data above)

1. **Grounded, surprising physics beats predictable spectacle.** Oxygen and Friction (one invisible everyday property
   changes → many consequences) beat Moon and Andromeda (huge visuals, predictable outcome: "the big thing gets bigger
   and hits").
2. **Many distinct consequences, not one escalating one.** The Air brief, written from the Oxygen result: *"That concept
   worked because ONE invisible physical property changed and then caused MANY DIFFERENT surprising consequences."*
3. **Shorter is better than 90 s, but ultra-short isn't the answer.** 22.4 s average on a 91 s video argued for
   ~70 s. The 45–50 s cold-open/rewind experiment (Air) didn't perform as hoped. **Current sweet spot: ~60–72 s.**
4. **A cold open (money shot first + rewind) is not a reliable fix.** It was tried on Moon to fight the 54 % swipe-away;
   Moon underperformed. The default is now: centred question over a normal world, the rule changing within seconds.
5. **Self-aware parody that keeps the production deadly serious works extremely well.** The parody fed the audience's
   tsunami joke back to them. Comment bait was designed in (*"NOT THE TSUNAMI AGAIN 😭"*, *"the 0.01 km/h took me out"*).
6. **Accuracy matters for comments.** Reviewers predicted comments like *"why is the kebab guy still cooking at 0 %
   oxygen lol"* and *"concrete would crumble, this is wrong"*. Plausibility protects the comment section (see
   `PHYSICS_EPISODE_RULES.md`).

## 3. The concept filter (use it before building anything)

A GOOD idea usually has **all six**:

| | Test question | Oxygen | Friction | Slip | Moon (weak) |
|---|---|---|---|---|---|
| 1 | **Simple, understandable rule** in the title? | ✔ O₂ → 0 | ✔ μ → 0 for 60 s | ✔ you slip | ✔ but not a rule; an event |
| 2 | **Many distinct consequences** (≥ 5 different systems)? | flames, engines, grid, EVs, people, aircraft, phones, Earth | walking, wheels, brakes, steering, hills, conveyors, cranes, the return | vibration, pebble, fault, quake, rotation, sea, wave | mostly "tides get bigger" |
| 3 | **Surprising physics** ("wait, THAT too?")? | no fireball; batteries keep working; no feeling of suffocation | brakes can't stop wheels; still objects stay still | absurdly precise tiny numbers | predictable |
| 4 | **Commentable edge cases** (people argue, correct, joke)? | breath-hold, pressure drop, grid | "what about…" | the tsunami joke | few |
| 5 | **Visual escalation** (person → street → city → planet)? | ✔ | ✔ | ✔ | sky gets bigger |
| 6 | **A major payoff** saved for the end? | collapse + Earth | friction returns | the 146 m wave | impact by implication |

If an idea fails 2 or 3, rework the angle before building. Examples: "the Moon gets closer" → *"what if the Moon's
gravity switched off for 60 s?"* (a rule with many consequences). That example is a suggestion, not a tested idea.

## 4. Retention mechanics that are always on

- **0–1 s:** the question is on screen and readable; the scene is already moving. The rule change starts under the
  title (≤ 3 s). Reviewers' most common swipe point is "1–2 s, nothing has happened yet".
- **No dead time.** No 3+ s stretch without new information. "A number changing" doesn't count as new information.
- **Something new every 2–4 s; a new consequence every 5–8 s.** Audit every interval: *what new thing happens? what
  rule is learned? what question stays open? could this be shorter?*
- **Open loop planted early, paid late:** a countdown to the return, a sea drawing back, a "what's coming".
- **Pattern interrupts every 5–8 s:** a look-down, a whip pan, a cut to a montage, sound dropping out, a new HUD element.
- **Mid-video reset** at ~45–55 % (montage / planet cut / new act).
- **Final 12 s must be the best** (Crossover rule). Don't peak early.
- **Sound-off clarity:** 70–80 % of the story must work muted (big visual cues, short captions).
- **Captions 4–9 words**, one at a time, in the safe zone, readable on a phone.

## 5. Reviewer swipe-test protocol (what the owner asks for)

Independent reviewer agents must answer **"At which exact timestamp would you swipe?"**. Don't accept "overall pacing
is good"; demand timestamped criticism (*"6.2 s — title is still on screen but nothing new happens"*). Fix the biggest
dropout risks first. Score targets the owner has set (Depersonalization override): HOOK ≥ 9, FIRST 5 SEC CLARITY ≥ 9,
CURIOSITY ≥ 8.5, PACING ≥ 8.5, MID-VIDEO RESET ≥ 8, CLIMAX ≥ 8.5, ENDING ≥ 8, OVERALL ≥ 8.5. *"Do NOT manipulate
scores. If reviewers score lower, improve the actual video."* In practice first-round scores were 4–5.5 and second-round
6–7; no episode has reached the targets yet. Say so honestly.

## 6. Obsolete retention ideas (don't reuse as defaults)

- 90 s length "because it's cinematic" (Oxygen, Before Screens).
- Cold open on the money shot + "24 HOURS EARLIER" rewind (Moon) / "33 SECONDS EARLIER" (Air) as the default hook.
- Ultra-short 42–50 s cuts with a beat every 3 s (Air).
- More HUD readouts to "explain" the physics. Text density read as an infographic and hurt.

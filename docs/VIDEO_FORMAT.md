# Video format — the current default (Oxygen / Friction structure)

> **Default = the Oxygen / Friction structure.** The owner's later briefs (Crossover, Slip) say it outright:
> *"Use the OXYGEN / FRICTION style structure … Do NOT use the ultra-compressed 45-second cold-open rewind format.
> Do NOT open with the final shot."*
> The cold-open/rewind format is obsolete as a default; see `LESSONS_LEARNED.md` § Retention mistakes.

## 1. Duration

| | |
|---|---|
| **Target** | **60–72 s** of finished film |
| Real cuts | Friction 70.3 s · Slip 57.3 s · Crossover 68 s · Depersonalization 71.2 s · Sim 79.8 s · Andromeda / Moon 80 s · Oxygen / Before Screens 90 s |
| Hard maximum | whatever the brief says (usually 68–78 s) |
| Never | "force 90 seconds". The owner: *"Your oxygen video got 22.4s average watch time on 91s … I'd rather make a tight 72-second banger"* |

Write the story long, then **cut it with `CONFIG.edit`** (see `ENGINE_ARCHITECTURE.md` § Edit). Slip went from a 67.4 s
story to a 57 s film; Friction from 74.6 s to 70.3 s.

## 2. The structure

```
CENTRED QUESTION over a NORMAL, ACTIVE world  (0–3.5 s)
   ↓ the rule changes, visibly, before the title fades   (≈1.5–3 s)
FIRST CONSEQUENCE on a human scale, at YOU      (≈3–10 s)
   ↓ a new, DIFFERENT consequence every ~5–8 s (people → machines → vehicles → slopes / systems → city)
OPEN LOOP: what happens when ___? / it's coming back / the wave   (planted early, paid late)
ESCALATION of scale: personal → street → city → planet
   ↓ a mid-film reset (a montage, a cut to the planet, a countdown)
DESTRUCTION PAYOFF: the single biggest event, near the end   (last 15–20 %)
SHORT AFTERMATH + one ending line (+ a tiny honesty note if needed) → black
```

### 2.0 When the rule has its own duration ("for 60 seconds", "for 30 seconds")

The rule's duration is a **story fact**. The HUD clock (`… RETURNS IN 00:24`) counts story time and must be honest. The
film around it can still hit 60–72 s:
- **Friction:** 60 s of μ = 0 (story 1.5 → 61.5) inside a 70.3 s film. The cuts removed 4 + 1.5 story seconds (the HUD
  clock visibly jumps at those cuts, which is acceptable), the knock plays at ⅓ speed, and the return is shown twice in
  4× slow motion. Montage shots are "meanwhile", the same clock.
- **A shorter rule (e.g. 30 s) in a ~65 s film:**
  - spend ~2–3 s of normal world first (under the title);
  - run the 30 s of consequences;
  - make the return the payoff, stretched with slow motion and several angles (≈ 6–10 s of film for ~2 s of story);
  - follow with ~8–10 s of aftermath (the consequences of the return are new beats too: things that were held up now
    fall, things stretched now snap back);
  - and/or show "meanwhile" shots elsewhere at the same story time.
- Never fake the clock (a "30 s" countdown that takes 50 s of film without visible slow motion). Pedantic commenters time
  it.

### 2.1 Centred title (non-negotiable)

- On screen **within the first second**. Since Slip it is on the **first frame**: start the title window *before* the
  first kept story second.
- **Centred in the middle of the screen**, large elegant serif, 2–3 lines, the brief's exact words
  (e.g. `WHAT IF FRICTION / DISAPPEARED / FOR 60 SECONDS?`). Visible **≈ 2.5–4 s**.
- **Over active visuals.** The scene keeps moving and the rule change starts *under* the title. The title box has a soft
  radial dark backdrop, no opaque plate. Compose the action **below** the title (Friction reviewers: the title hid the
  falling people).
- It is a **comprehension tool, not branding.** For less self-explanatory topics (Depersonalization) it stays longer and
  is more prominent.
- Implementation: `SCRIPT.hud.title = { in, out, html, cls: 'big center' }`, styled per page (`#hud .story-title.big.center`).

### 2.2 Normal-world opening

- One ordinary, **busy** place: a street with traffic, people, props, weather. It sets the baseline and gives the rule
  something to break.
- The rule change is **visible, not explained**: the O₂ number falls and flames die; friction drains and a foot shoots
  forward; a shoe lands on a wet plate.
- The HUD's first number appears with the title: `ATMOSPHERIC OXYGEN 21.0 %`, `SURFACE FRICTION 1.0 → 0.0`.

### 2.3 Consequence progression

- Each beat = **one new physical consequence the viewer did not predict.** "Wait, THAT needs friction too?" Never just
  a bigger number on the same thing.
- **Answer → new question → answer → new question.** Each beat should answer something and open something.
- Order by scale and danger: your body → people near you → machines and vehicles → terrain/slopes → systems (grid,
  conveyor, crane) → city → planet.
- **Something meaningful every 2–4 s** (Oxygen brief); **a distinct beat every ~5–8 s** (later briefs). There must be no
  3+ s stretch without new information (Depersonalization override).
- A **mid-film reset** around 45–55 % keeps the second half alive: Friction's MEANWHILE montage; Slip's cut to the
  planet; Depersonalization's *"The panic can make it stronger."*

### 2.4 Escalation timing (reference timelines)

**Friction (70.3 s film; the benchmark).** Times are story seconds; the cut removes 20.6–24.6 and 53.0–54.5.

| Time | Beat |
|---|---|
| 0–3.6 | title; friction drains; you slip at 1.5; the phone squirts away; people fall and glide; you hit a pole |
| 3.6–7.5 | walking is impossible (your foot, your hands slide); the splits at the corner |
| 7.6–9.7 | wheels spin, the car doesn't (EV) |
| 9.8–16.4 | no brakes, no steering; junction crashes; a lamp post snaps |
| 16.6–20.6 | the hill: the truck stops and starts sliding back |
| 24.6–34 | *"Even a small hill becomes dangerous."*; the truck hits the parked stack; the hill pours down |
| 34–42.5 | *"Now you're part of it."*: you get knocked off the pole (slow motion), slide into a shopfront; FRICTION RETURNS IN 00:24 |
| 46.5–53 | MEANWHILE montage: conveyor, bike, crane, tray, ambulance (≈1.3 s each, one-line reason each) |
| 54.5–58.4 | *"And then you realize… it's coming back."* |
| 58.5–61.5 | 3 · 2 · 1 (tunnel, heartbeat) |
| 61.5–67.6 | **payoff:** everything grips at once; 4× slow-motion drone angles; a rollover |
| 67.6–74.6 | aftermath; you stand; one gripping step; *"You'd never notice friction… until it was gone."* |

**Oxygen (90 s, the original).** Title + O₂ 21 % → 0 % by 2.4 s; flames die; engines, then the grid fail; an EV keeps
moving; TIME WITHOUT OXYGEN; people collapse; breath-hold; a silent gliding airliner → a dust column (no fireball);
phones ringing; CO₂ forces a breath; you collapse; silence; pull-back to an Earth with no fires and night lights going
out; *"You would only have seconds to react."* (Too long by today's standard; the structure is still right.)

**Slip (57.3 s film; parody of the format).** Title on frame 1; the slip at ≈2 s (half speed); thud and silence;
*"Normally… you'd just get back up." / "But not this time."*; underground 0.07 J; the pebble moves 1.4 mm; a fault at
99.999 %; M2.1 → M8.7; a quake on your street; Earth's rotation 1,674.40 → 1,674.41 km/h; the sea drains 0 → −38 m;
the distant wave 3 → 78 m; run; look back at 146 m; impact; black; a recap of the chain; *CAUSE OF GLOBAL CATASTROPHE:
SLIPPED ON WET SIDEWALK*; *"yes. somehow it became a tsunami again."*; the satire note.

**Generic template (≈65 s film):**

| Film time | Beat |
|---|---|
| 0–3.5 | centred title over the normal world; the rule starts changing at ≈1.5–2.5; HUD value falls |
| 3–10 | the first consequence hits YOU (body, hands, footing) + one person near you |
| 10–17 | consequence 2 (a different system: vehicles / machines / light / sound…) |
| 17–24 | consequence 3 + the open loop planted (countdown starts / something is coming) |
| 24–32 | a scale jump (a hill, the city, an aerial or telephoto view) |
| 32–40 | mid reset: a montage of 4–5 quick "meanwhile" consequences, or a cut to planet scale |
| 40–48 | the danger turns personal again; the open loop tightens (countdown, sea drawing back, a sound) |
| 48–58 | **the payoff:** biggest event, slow motion once, multiple angles |
| 58–64 | aftermath, silence, one closing line (+ a small note) → black |

### 2.5 Destruction payoff

- **The single biggest event in the film.** Friction's brief: *"the return of friction must be the biggest event in the
  entire video."* Don't peak early (the Crossover override: *"Do not peak at Eren's transformation and then decline"*).
- Physically legible, not arcade. No explosions from every touch. Weight, rotation, skids, debris, dust, glass, water.
- Slow motion is allowed **once or twice** for the payoff (Friction 4× for 6 s; Crossover a few 0.2–0.3× moments). If
  everything is slow, nothing is.
- Several angles are fine: a drone or third-person angle for the payoff, then back to your eyes.

### 2.6 Ending

- Short. A beat of aftermath or silence, one closing line in serif, then black. Total ≤ 6–8 s.
  - *"You'd never notice friction… / …until it was gone."*
  - *"You would only have seconds to react."*
- The emotional resolution comes **first**. An honesty or safety note comes **after**, small, ≤ 2 s:
  - `TIMELINE DRAMATICALLY ACCELERATED FOR THIS SIMULATION`
  - `SATIRICAL SIMULATION · NO, SLIPPING CANNOT ACTUALLY CAUSE THIS.`
  - *"If it keeps happening or doesn't go away, talk to a healthcare professional."*
- Never end on a wall of text. Never put the disclaimer before the hook.

## 3. Caption philosophy

- **One short line at a time, 4–9 words.** It must hit emotionally, not academically.
  Good: *"You know those are your hands."* Bad: *"People experiencing depersonalization may report…"*
- **Show first, explain second.** Don't narrate what is visible. A caption adds tension or the mechanism the eye can't see
  (*"Brakes and steering depend on friction too."*, *"Its engines had died twenty seconds earlier."*).
- Two-part captions with a beat in between work well (*"And then you realize…" → "…it's coming back."*).
- Tone: calm, documentary, sincere. In the parody, dead serious until the payoff.
- Placement: lower-middle (top ≈ 1300–1400 u), inside the safe zone, on a dark plate when the ground is bright.
- 70–80 % of the story must be understandable with the sound off (Depersonalization override).

## 4. HUD philosophy

- **Minimal, top-left, simulation-style.** Small caps label → large serif value → small secondary line → tiny context.
  One primary readout; at most one more temporary one.
- **Precise numbers are a storytelling device** (and, in the parody, the joke): `ROCK DISPLACEMENT 1.4 MM`,
  `EARTH ROTATION 1,674.40 → 1,674.41 KM/H`, `SLOPE 7° · DOWNHILL PULL 1.2 m/s²`. Numbers must be plausible orders of
  magnitude (see `PHYSICS_EPISODE_RULES.md`).
- Countdowns create the open loop: `FRICTION RETURNS IN 00:24`, `MERGER BEGINS IN`, a big 3 · 2 · 1.
- Small world tags are OK when they explain physics at a glance (Friction's `HELD ONLY BY THE BOLLARDS`, Air's
  `PLYWOOD · 18 kg / STEEL CLAMP · 1.2 kg`). Never label every object; never stack many readouts.
- The HUD fades out for cinematic sections (collapse, Earth pull-back, payoff close-ups) and returns for the ending.
- Avoid game-stat meters for sensitive topics (`SENSE OF SELF %` drew a reviewer warning; it had to visibly recover).

## 5. When exceptions make sense

| Exception | When | Example |
|---|---|---|
| Longer title hold, more prominent | the topic isn't self-explanatory | Depersonalization |
| No physics rule; experience structure | "what it feels like" / psychological | Depersonalization: normal → off → self → world → panic → loop → comedown |
| Fourth-wall / fake-interactive | the format itself is the hook | Sim (79.8 s), Game (51.6 s, fixed screen-space touch targets) |
| Cut-based action edit | character/crossover concepts | Crossover: 120 BPM, shot list, beat-synced cuts, two camera languages |
| A parody of the format | the audience knows the channel's tropes | Slip: the same structure and production quality, joke only at the end |
| A cold open (money shot first) | **only if a brief explicitly asks.** It was tested (Moon, Air) and is not the default | — |
| ≤ 50 s | only if a brief demands it. The 48.6 s Air experiment didn't perform as hoped | — |

## 6. Cover / thumbnail

- A 9:16 frame that communicates the premise without spoiling the payoff (Slip: the slip on the wet sidewalk + the
  title, **not** the wave). Leave clean space for the title. For action concepts, a poster frame with both characters
  (Crossover).

# What if you suddenly knew everything? (slug `know-everything`)

A narrated 2D stickman story film, 16:9 1920×1080, 30 fps, about 5½ minutes. Same look and cast style as
`strong-bones` (you in the teal hoodie, your sister Maya in yellow), built to the owner's notes on that film:

- "The story is all over the place, hard to keep up": **one simple thread, one week, told day by day**
  (Tuesday → Sunday, each day named on screen), few places, few characters, shots held long enough to read
  (about 4 s each), every turn of the plot set up on screen before it pays off.
- "More narration … like a narrator of the story, not explaining boring science": **the narrator tells the story**
  (second person, present tense, describing what is on screen). Characters speak short lines on top. Real physics only
  as story lines (the black hole a head full of everything should become; the universe "rolls dice", so you see odds).
- Retention rules from the channel analytics: action in the first 5 s, relatable places (bedroom, kitchen, school,
  backyard), a moral choice with a long silence, no recap, a cliffhanger and one comment question at the end.

## The one visual idea
Everything you look at has a small **fact tag** floating over it (what it is, a number, the odds of what happens next).
People get their next move. You get a **question mark**: a mind can't hold a copy of itself, so you are the one thing
you can't predict. That rule decides the ending.

## Story
1. **Tuesday 7:00** — bedroom. You open your eyes and the room fills with tags (spider 41 days old, 2 million specks
   of dust, phone buzzes "now"). Kitchen: toaster tag "94 % burnt" → "Mom. The toast." → it burns → "How did you know
   that?" Maya's tag: not the library. "So… how was Jake's party?" → "Jake's party?!" → "I am going to kill you."
   *Lesson one: don't say everything.* **Title.**
2. **The rules** — the walk to school, tags on every car, bird and stranger; the zoom out (Moon's far side, the Sun's
   heart, the edge of the universe); the black hole that should have formed; the odds (a kicked can, 71 %, in the bin);
   your reflection in a shop window with a question mark.
3. **School** — the 40-second test, "Your answer key is wrong." Kids follow you: "Does Emma like me?" "Ask her
   yourself." *You're learning.*
4. **Backyard** — you dig by the old tree: a tin of 200 gold coins from 1851. "Eighty thousand dollars real." Maya
   filmed it: 40 million views.
5. **Wednesday–Friday** — news vans; the physicist's whiteboard (dark matter, she cries: "It's so simple"); cures;
   the most famous person on Earth.
6. **The price** — no surprises (Maya's present: "Is there anything I can give you that you don't already know?"),
   no sleep (the walls fill with the universe at 3 a.m.).
7. **Saturday night** — the black car, the agent: "You're coming with us. Midnight." You know they want the secrets
   and you'd never come home.
8. **The choice** — your options with their odds, and one more: forget everything. Their computers say 99 % you get in
   the car. Over your head: the question mark. Silence while the clock reaches midnight and the tags fade one by one.
9. **Sunday 7:00** — the ceiling is just a ceiling; the toast burns and you laugh; "What's in my hand?" "I have no
   idea." "Good." The car is gone. Cliffhanger: a note to yourself under your pillow, unread. *What would you have
   written?*

## Voices (ElevenLabs via GitHub Actions, `.github/workflows/narrate-know-everything.yml`)
Narrator Michael (speed 1.06), you Liam, Maya Jessica, Mom Matilda, the teacher Bill, a classmate Will, the news anchor
Brian, the physicist Alice, the agent Lily. Scripts: `VO-*.md`; clips and word timings land in `voices/<role>/`.

## Files
- `../../know-everything.html` — the page (Space plays). Canvas 2D, no WebGL.
- `VO-*.md` — one voice script per character; `voices/<role>/` — the clips + word timings (from Actions).
- `build-timing.cjs` → `timing.js` (clips placed on measured gaps; the 10 s midnight silence lives here).
- `core.js` (player, cached layers, parallax camera, bloom, grade), `rig.js` (stickmen, costumes, lip-flap),
  `props.js` (painted building blocks), `world.js` (the sets: bedroom day/night, kitchen, street, classroom, hallway,
  backyard, the house front day/night, the lab, the bookshop window, the living room), `items.js` (fact tags, story
  objects, space), `shots.js` (the edit, ~88 shots placed on word times), `hud.js` (captions with a speaker dot, day
  cards, title, closing question).
- `sound/cues.cjs` → `cues.json`; `sound/mix.py` (score, effects, ambience beds, nine voices, ducking);
  `sound/master.sh` (−15 LUFS, about −1.5 dBTP) → `sound/out/mix.m4a` and `soundtrack.js`.
- `stills.cjs`, `render.cjs` (parallel cloud render).

## Rebuild
```bash
node films/know-everything/build-timing.cjs
node films/know-everything/sound/cues.cjs && python3 films/know-everything/sound/mix.py && bash films/know-everything/sound/master.sh
NODE_PATH=$(npm root -g) node films/know-everything/render.cjs --out renders/know-everything --workers 4
```

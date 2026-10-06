# What if you realized you were in a simulation? — production plan

An 80-second vertical (9:16, 1080×1920, 30 fps) first-person film on the shared engine. A polished low-poly city street
on a sunny afternoon. It opens like any other video on the channel. Then the world starts to repeat itself, then it
breaks, then one character in it realizes that someone is watching — you — and the system resets him.

**The idea.** The fourth wall goes down one level at a time and nothing is ever explained:

| Level | What the character knows | Beats |
|---|---|---|
| 1 | Something is odd | déjà vu, the repeat, the ball |
| 2 | Someone is watching | the first look into the lens |
| 3 | The world is fake | wireframe, debug labels, the breaks |
| 4 | The watcher is a viewer | VIEWER DETECTED, the captions, PLAYBACK POSITION, the right edge |
| 5 | He can reach the viewer | the approach, the tap, the fake pause |
| 6 | The system notices | session, alarm, the repair, the countdown |
| 7 | The screen itself | the crack, the void, the reset, the failed reset |

**Rules.** Not cyberpunk, not a Matrix parody: no green code rain, no hacker screens. The city stays a pleasant, ordinary
place; the glitches are small and precise (engine bugs, not explosions). The fake interface never imitates a real app
(no like or comment buttons, no logos). Nothing claims to know anything about the real viewer (no name, place, device,
camera or account). The only number that refers to the viewer, the playback position, is true: it is the video's own
timestamp.

## 1. Three visual languages

- **The channel** — the serif title, italic captions, the top-left readout `REALITY STATUS · NORMAL` (the house HUD).
- **Him** — dialogue subtitles (sans, white, near his face). He has no voice; you hear his breath and silence.
- **The system** — monospace, small, letter-spaced, camera-locked, neutral white; red only for the alarm. Engine debug
  labels are yellow with thin bounding boxes.

## 2. Clocks

Film time `t` drives the camera, the HUD and him. The world runs on `simW(t)` (script.js): the same as `t`, frozen
during the fake pause, rewound at the reset, restarted at 74.2 s. The cyclist, the horn and the pigeons run 3 s behind
from 14.4 s (the repeat). Background people restart from their spawn points at the repair. The aware man (NPC_AWARE_01)
has his own scripted performance; his first walk-by is replayed, shifted by the distance you walked, so that relative to
you it is exactly the same moment.

The soundtrack is made the same way (audio.js): the world's sound is rendered on its own clock and remapped to the film
(the repeat with a small seam, silence in the pause, reversed in the reset, the opening replayed exactly at the end);
everything that belongs to the film's time (your steps, him, the interface, the glass) is laid on top.

## 3. Beat sheet (film seconds)

| Time | Beat | Picture | Text |
|---|---|---|---|
| 0–4.2 | Normal | Walking down a sunny avenue; café ahead; a man in a dark-green jacket with a coffee stands ahead | Title 0.15–3.8; "At first, you probably wouldn't." |
| 4.2–7.2 | Déjà vu | He walks toward you and passes; your head follows him | REALITY STATUS · NORMAL (from 4.4) |
| 7.0–10.0 | …again | Your head comes back: he is standing ahead again, sips, walks, passes — identical | |
| 10.0–11.6 | Look back | Over your shoulder: one of him, walking away | "You'd probably blame your memory." |
| 11.6–14.4 | Bell, horn, birds | A cyclist rings and passes, a taxi honks, pigeons take off | |
| 14.4–15.9 | The repeat | Everything again, exactly (the pigeons pop back to the ground); a seam in the sound; you stop | |
| 16.2–19.7 | Physics | A ball rolls off the café awning, bounces twice, then runs exactly backwards up onto the awning | NORMAL → "NOR—" (18.9) |
| 20.0–26.0 | First look | He is at the café, talking; he freezes, turns his head to the lens, holds; silence | "Wait." "Who's watching us?" — then he snaps back |
| 26.2–29.2 | Structure | You touch the wall: wireframe spreads from your fingers; your hand repeats the touch | |
| 29.4–32.8 | Debug | TREE_07, NPC_CIVILIAN_14, VEHICLE_SEDAN_03, SKY_ENV_02 with boxes | |
| 32.8–38.2 | Breaks | LOD pop, a tree turns into a flat card, the red car freezes (a taxi drives through it), its shadow vanishes, a car drifts out of lane, a cloud loops, a facade loses its texture (checker) | UNSTABLE for one frame (37.5) |
| 38.2–43.0 | Viewer detected | You look up at the sky; your hand stutters; the HUD is gone | VIEWER DETECTED · ACTIVE OBSERVER: 1 |
| 43.0–46.8 | Captions | Looking down: he is standing right in front of you; he reads the caption | "You begin to realize something is wrong." → "Wait." → "HE CAN SEE THIS." |
| 46.8–49.8 | Playback | He looks at the counter | PLAYBACK POSITION 00:46.80… (the real timestamp) |
| 49.8–52.4 | Format | His eyes go to the lens, then to the right edge of the frame, then back | "What's that?" |
| 52.4–56.9 | Approach | His face fills the frame | "Can you hear me?" … "Not you." "You." |
| 57.0–58.2 | Tap | His fingertip taps the lens: the whole picture, HUD and captions included, ripples | |
| 59.3–60.2 | Pause | Second tap: everything stops, total silence, no icon — only he moves and looks around; then it resumes | |
| 60.9–64.0 | Session | | VIEWER SESSION ACTIVE · "Don't leave." "If you leave, it resets." |
| 64.0–66.6 | Alarm | The world repairs itself: cars snap into lanes, people snap to their spawn points, textures and the tree pop back; he is snapped back to the café | SYSTEM: UNAUTHORIZED AWARENESS |
| 66.6–69.6 | Escape | He runs at you | RESET IN 3 "No—" · 2 (he hits the screen: a crack in the video itself) · 1 "WAIT—" |
| 69.6–72.2 | Screen break | The crack spreads; pieces of the picture fall away: a black void with wireframe blocks, floating assets, bounding boxes, light gizmos, a camera frustum | |
| 72.2–74.2 | Reset | RESETTING… he is yanked away, the world rewinds, the pieces fly back, the sound reverses; white, black | |
| 74.2–76.6 | Start again | The exact opening frame; the title begins again — "WHAT IF YOU REALIZED / YOU WERE IN—" — and stops | |
| 76.6–79.4 | Reset failed | Everyone repeats the opening except him: he stands still where he belongs, turns to you | RESET FAILED · he puts a finger to his lips |
| 79.4 | Black | Cut. | |

## 4. Systems

- `script.js` — clocks, every beat time, the camera, your hands, the HUD (title, captions, readout, subtitles).
- `city.js` — the street (a sunny Environment subclass): avenue and cross street, shops with a café, the plain stone wall
  you touch, trees, lamps, a bus stop, a billboard, signals; the tree, the facade and the parked car that break are
  built separately so they can.
- `actors.js` — traffic on the world clock (the red sedan, a taxi, a bus, the drifting hatch), the cyclist, people,
  a dog, pigeons, the ball and the looping cloud.
- `aware.js` — NPC_AWARE_01: the shared body with a hero head (eyes with irises and catchlights that aim exactly at the
  lens, lids that blink, brows, lips that move), a coffee cup, an index finger, arm IK for the tap, the slam and the shhh.
- `glitch.js` — the wireframe wall, debug labels, LOD pop, flat tree, checker, the system text, the ripple (an SVG
  displacement on the whole stage), the crack (in the picture and over the interface), the void and the composite.
- `audio.js` — see §2.
- `film.js` — wiring, the fake pause (your breathing and hands stop too), the rewind, the grade.

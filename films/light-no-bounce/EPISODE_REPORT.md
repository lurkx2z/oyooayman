# Episode report — *What if light stopped bouncing for 10 seconds?*

**Format.** 16:9 long-form, 1920×1080, 30 fps, 5:25 (324.95 s). Voiceless, in the Gravity tilts 90° / Gravity keeps
tilting / Friction 10s formula and the eerie tone of Slower light, built to the owner's YouTube lessons of 28 October
2026 (an everyday place, action in the first seconds, a real-physics nod in the first minute, about five to six
minutes, tension to the last frame), the rule of 29 October 2026 (**the story clock only runs forward**) and "more new
scenery" (4 November): a hilltop funfair, a motorway and an airport in the valley below it, a flight deck, a control
tower, a rollercoaster's front seat and the space station. One clock (`NB_CLOCK`, `script.js`) runs from Saturday
3:29:57 PM to 4:42:16 PM: real speed under the title, the ten seconds 26 then 39 times slower, the last three about 3
times slower (the count), 12 times slower out of the return to the Moon's, then real speed with forward jumps only at
cuts ("+2 min", then 4:42 PM). The HUD says how slowly or how far. `script.js` throws if the clock runs backwards and
`shots.js` throws if it jumps anywhere but on a cut. The film is told by 61 short second-person captions, the HUD
(light bouncing 0%, back in …, the clock), one context box per beat, labels pinned in the scene, insets (the
mirror, the Moon's light-time, Rayleigh scattering, the electron, the motorway's 306 m, the airport's radar, a fibre,
the undersea cables, a laser, the energy, your pupil, Saturn's light-time) and the sound. Page `light-no-bounce.html`,
code `films/light-no-bounce/`, every number in `PLAN.md` § 2 (computed in `physics.js`), captions `CAPTIONS.md`.

**The physical reading.** From Saturday 21 November 2026, 3:30:00 PM, for ten seconds nothing anywhere reflects or
scatters light, of any colour, radio to X-rays. Light goes straight on through clear things (air, glass, water, your
eyes' lenses: refraction stays) or is absorbed. Everything that makes its own light carries on. **The one impossible
part**, said at 1:25: reflection, scattering and refraction are the same electrons shaking with the light, so there is
no switch for only one of them. What follows:

- only light sources are visible; everything else is pure black, seen only as a shape against a source (your
  reflection goes from the Fun House's mirror; you can't see your hands, only your phone's screen; 400 people around
  you show as phones and as the bulbs they block; something passes between you and the lights);
- old light is still on its way: the Moon (1.28 light-seconds) shines on for 1.28 s and goes; it comes back 1.28 s
  after everything else. Saturn (72 light-minutes) shines on all through, and at 4:42:10 PM goes out for ten seconds;
- the sky is blue because air scatters blue about 4 times more than red (Rayleigh, (650/450)⁴ = 4.35): the sky goes
  black at 3:30 PM, the stars come out, and the low Sun (3.8° up, through about 11 air masses) arrives whole: white
  and about 3× brighter;
- about 58 million drivers (1.45 billion cars, about 4% moving) see only lights; at 110 km/h ten seconds is 306 m;
- a plane on final approach lands on its approach lights (as at night); radar is light too, so the tower's primary
  radar gets no echoes, but the plane's transponder sends its own signal;
- the internet's glass fibres hold light by total internal reflection: every fibre goes dark, about 600 undersea cables
  (about 99% of traffic between continents); every laser stops (it is light bouncing between two mirrors);
- from the space station the Earth is gone except its night side's city lights;
- everything absorbs what it used to reflect: Earth's albedo 0.30 → 0 for ten seconds is 5.2 × 10¹⁷ J, about 8,300
  Hiroshima bombs, spread over the day side;
- your pupils open (2.5 → 6.6 mm, 7× the light) so more stars appear and more of the Sun gets in; at 3:30:10 you are
  dazzled until they close.

## Shot list (current cut, 42 shots)

| time | what | clock |
|---|---|---|
| 0:00 | the title over your reflection in the Fun House's wavy mirror, the carousel's organ playing; at 0:02.85 light stops bouncing and the reflection goes | 3:29:57 PM |
| 0:03–0:23 | the fair in the dark (only its bulbs), the stalls, the mirror empty | 3:30:00.03–00.77 (26× slower) |
| 0:23–0:42 | at the fence: the Moon still there; at 0:36.5 its last light arrives and it goes | 00.77–01.49 |
| 0:42–1:14 | the sky black at 3:30 PM, the Sun white, the stars; only light sources | 01.49–02.32 (39× slower) |
| 1:14–1:51 | your phone floating in the dark; the impossible part; 400 people you can't see; something passes in front of you | 02.32–03.27 |
| 1:51–2:11 | the motorway in the valley: a river of lights; at the wheel, braking blind; the verge | 03.27–03.79 |
| 2:11–2:34 | a plane landing across the valley: on the flight deck; the tower's radar with no echoes; beside the plane | 03.79–04.38 |
| 2:34–3:02 | your friend's rollercoaster (its track lights, her view), the dodgems' sparks, the fire juggler | 04.38–05.09 |
| 3:02–3:24 | your video stops sending; the undersea cables and lasers dark | 05.09–05.65 |
| 3:24–3:36 | from the space station: only the cities | 05.65–05.94 |
| 3:36–3:52 | the heat: 8,300 atomic bombs' worth | 05.94–06.36 |
| 3:52–4:17 | Saturn shines on (72 light-minutes); your pupils open; don't look at the Sun | 06.36–07.00 |
| 4:17–4:25 | 3 · 2 · 1 | 07.00–10.00 (3× slower) |
| 4:25–4:35 | 3:30:10: light floods back, blinding | 10.00–10.79 (12× slower) |
| 4:35–4:40 | someone in a bear suit was standing right in front of you | 10.79–11.23 |
| 4:40–4:46 | the Moon comes back last, 1.28 s late | 11.23–16.2 (real speed) |
| 4:46–4:52 | the motorway from the hill: the pile-ups | +5 s |
| 4:52–5:08 | +2 minutes: every video of it is black with dots; the internet finding its way back | 3:32:10 PM |
| 5:08–5:25 | 4:42 PM: everyone watching Saturn; at 5:18.8 it goes out; "What would you have done?", cut on the last frame | 4:41:59–4:42:16 PM |

## How it follows the owner's lessons and playbook

- Everyday place, human scale: a Saturday afternoon at a funfair, with a friend on the rollercoaster; the motorway,
  the airport and the space station are seen from it or cut to as "meanwhile". All new sets.
- Action on frame 1: you are looking at yourself in a wavy mirror under the title; at 0:02.85 your reflection goes.
- Real nuance in the first minute: the Moon's light-time (0:24–0:33), why the sky is blue (0:43–0:52), and at 1:25
  why the premise is impossible.
- A stake by 1:45: something passes between you and the lights; 58 million drivers can't see the road.
- No clock resets: one forward clock; the slow minutes say how slowly, every jump says how far.
- About five and a half minutes, no recap; the count, the reveal, the crash, then the quiet 4:42 PM ending on a
  question.
- Not an "X kept getting slower" derivative: the dark is ten seconds long and the film is about seeing.
- Teaser Shorts: the reflection going (0:00–0:12), the Moon going out (0:23–0:42), the count and the reveal
  (4:17–4:40), Saturn at 4:42 (5:08–5:25).
- Thumbnails (house style, real frames): `thumb-bear.jpg` (10 seconds, "and someone was right here"),
  `thumb-crowd.jpg` (400, "and you can't see one of them"), `thumb-motorway.jpg` (58 million, "and still they're
  moving").

## Reviews

(to come)

## What is still weak

(to come)

## Sound

(to come)

## Delivery

(to come)

## Files

- page `light-no-bounce.html`; code and plan `films/light-no-bounce/`
- runnable ZIP, report and thumbnails: `/mnt/project-files/light-no-bounce/`

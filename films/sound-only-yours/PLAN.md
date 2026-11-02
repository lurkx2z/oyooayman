# What if every sound vanished except yours?

A 16:9 long-form film with no narrator: 1920×1080, 30 fps, 5:30. The only voice is the main character's own (ten
short lines made with ElevenLabs, `VO-you.md`, voice "Liam"), because his is the only voice left in the world. It
is built for the mood the owner asked for on 2 November 2026 (the Slower light film's comments: "scary, like a horror
game"), and to the owner's YouTube lessons of 28 October 2026:
- **an everyday place:** your 5th-floor kitchen on a rainy Thursday night, your stairwell, the street, the park across
  the road and the dark under its plane tree, from 9:41 PM to 10:09 PM;
- **action on frame 1:** under the title the cat pats a glass off the counter; the TV, the rain and the fridge stop
  dead at 0.7 s, and the glass smashes on the tiles in slow motion without a sound;
- **the real nuance in the first minute:** "sound is just air being pushed" (your pushes still travel at 343 m/s and
  fade as they always did); the quietest room on Earth (−20 dB) and the 1953 soundproof-booth study (94 % heard
  sounds that weren't there) explain what you hear instead: your own body, then a ringing;
- **a new consequence every few seconds,** escalating from strange (the silent glass, the clap) to lonely (Mum can't
  hear you) to unnerving (every window across the park lights up and looks at yours; the man on the stairs) to
  dangerous (the silent car, the ambulance nobody hears) to frightening (the shout heard by 400,000 people, who all
  start walking towards it) to horror (the dark, the crowd you can only see with your own clicks, the one behind you);
- **tension to the last frame:** the film ends on "Would you make a sound?" with the figure standing 0.95 m behind
  you, cut hard while the question is still on screen. There is no recap.

It also follows the owner's rule of 29 October 2026: **the story clock only runs forward**. One clock (`SO_CLOCK`,
script.js) runs at real speed, in slow motion once (the glass, ×0.35), and jumps forward only at cuts between places
(9:43:30, 9:47, 9:52, +30 s, 9:56, +50 s, 10:09; the HUD says how far). `script.js` throws if a segment runs
backwards and `shots.js` throws if the clock jumps anywhere but on a cut.

Page: `sound-only-yours.html`. Captions: `CAPTIONS.md` → `node build-timing.cjs` → `timing.js`. Voice lines:
`VO-you.md` → GitHub Action "Voices sound-only-yours" (ElevenLabs, repository secret) → `voices/you/*.mp3` →
`node make-voices.cjs` → `voices.js`. Every number on screen comes from `physics.js` (§ 2).

## 1. The rule

From **9:41:00 PM**, every sound wave that you did not start dies the instant it starts: voices, rain, engines,
speakers, animals, alarms, thunder. Yours stay: your voice, your breath, your heartbeat, your steps, your claps,
anything your body strikes, and every echo of them (a reflection of your sound is still your sound). Light, motion and
everything else carry on as normal.

- **The one impossible thing** (the HUD says so): nothing makes a sound but you.
- **Everything else follows:** with no other sound to mask it, a quiet sound carries much further; everybody inside
  that circle hears you, and nothing else; every warning made of sound fails (sirens, horns, alarms); silent cars are
  why EVs must hum below 20 km/h; bats can't hear their own calls; echolocation (clicks) works perfectly.

## 2. The physics (physics.js)

A level L (dB SPL at 1 m) falls by spreading (20·log₁₀ r) and by air absorption (0.002 dB/m at ~500 Hz, ISO 9613-1,
10 °C, 80 % humidity). It is heard until it drops to the threshold of hearing at speech frequencies (5 dB): `soHeard`.
People inside: π r² × 5,000 per km² (a big city's average): `soPeople`.

| your sound | dB at 1 m | heard out to | people inside |
|---|---|---|---|
| a breath | 10 | 1.8 m | |
| scared breathing | 28 | 14 m | |
| a whisper ("Who's there?") | 30 | 18 m | |
| counting, low | 54 | 265 m | |
| a footstep | 55 | 295 m | |
| your voice ("Hello? …Is anyone out there?") | 60 | **501 m** ("about 500 metres") | **3,944** ("about 4,000") |
| a call | 66 | 910 m | 13,000 |
| a tongue click | 72 | 1.6 km | |
| a clap | 84 | 3.8 km | |
| a shout ("HELLO!") | 89 | **5.0 km** ("about 5 km") | **393,566** ("about 400,000") |

- Walls: the HUD's "neighbours through the walls" counts only flats within reach after a 38 dB loss (a party wall) or
  30 dB (the stairwell's doors).
- Echoes from the middle of the park (there and back at 343 m/s): your block 50 m → 0.29 s, the flats across 56 m →
  0.33 s, the church 69 m → 0.40 s, **the tower block 170 m → 0.99 s** ("1 second there and back"), the terraces
  262 m → 1.53 s. Real echo levels are −43 to −58 dB under the shout (`soEchoDb`); the mix plays them about 35 dB
  louder so they can be heard on a phone (the HUD says so).
- Lightning counted to six: 6 × 343 m = **2.06 km** ("2 km away"); the thunder would arrive at six seconds.
- Silence: the film's clock shows minutes since 9:41: "in 11 minutes" (9:52:44) and "for 16 minutes" (9:57:32).
- The quietest room: Microsoft's anechoic chamber, −20.35 dBA (Guinness World Records, 2015). The ringing: Heller &
  Bergman (1953), 94 % of 80 people with normal hearing heard sounds in a soundproof booth.
- Silent cars: EU Regulation 540/2014, an acoustic vehicle alerting system on new types of electric cars from July
  2019, on every new one from July 2021, up to 20 km/h.
- Echo pictures: a click comes back from a tree 3 m off in 17 ms, a bench at 5 m in 29 ms, someone at 7 m in 41 ms.
  The picture draws the wave at 5 m/s, about 70× slower than sound (the HUD says so).

## 3. The beats (CAPTIONS.md, 72 captions, 29 beats)

1. **Your kitchen, 9:41 (0:00–1:47).** The title over the glass. "What…?" The clock: "9:41 PM. Every sound in the
   world just stopped. / Except yours." "Hello?" The news, the rain, the cat: nothing. You clap, and hear it. The pulse
   of air (a diagram). Your breath and heart get loud; the ringing starts. You call Mum: connected, and neither of you
   hears a thing. A text from a number you don't know. You open the window: "Hello? …Is anyone out there?" (the 500 m
   circle from above, 4,000 people). One by one the windows across the park light up; a telephoto shot from the flats
   shows you, small, in yours.
2. **The stairwell, 9:47 (1:48–2:23).** Down in the timer light ("Okay. Okay…"), every step echoing; the light runs
   out; you keep going in the dark; you turn: a neighbour is two steps behind you ("God! …You scared me."). He types on
   his phone: "DON'T SHOUT. everyone can hear you".
3. **The street, 9:52 (2:24–3:35).** Rain that makes no sound, car alarms flashing, a dog barking: nothing. You step
   off the kerb and a silent car passes 1.2 m in front of you. An ambulance, siren on, that nobody hears. "Can anyone
   hear me?": every head in the street turns. Lightning over the park: you count to six, and the thunder never comes.
4. **The park, 9:56 (3:36–4:34).** The middle of the park. The bats fly blind and hit the lamp. "HELLO!": the
   buildings answer one by one (the tower in 1 second); from above, the circle reaches 5 km: 400,000 people. From
   every street round the park, people start walking towards the only sound left, phone torches on.
5. **The dark, 10:09 (4:35–5:30).** You hide under the plane tree. A dog lunges out of the dark: you never heard it.
   You click your tongue to see with the echoes: a tree at 3 m, a bench at 5 m, something at 7 m, then people, dozens,
   all round you, not moving. "Who's there?": they all take a step closer. They can hear every breath you take. You
   turn: one is standing right behind you. "Would you make a sound?"

Signature moments: the windows across the park lighting up and looking at yours; your shout and its echoes, heard by
400,000 people; the echo pictures in the dark and the figure behind you.

## 4. Look and sound

- The house style (STYLE_BIBLE): first person, serif captions, a minimal HUD: the clock (THURSDAY 9:41 PM, "SILENT
  FOR …"), a sound meter (your sound's level, how far it carries, through how many walls), a counter ("HAVE HEARD YOU
  TONIGHT", climbing at 343 m/s), one tag per assumption. Night, rain, sodium lamps, cold blue windows.
- Echo vision (echo.js): every surface is replaced by a dark shader lit only by the slowed wave from your click.
- Sound (audio.js + sound-*.js, all synthesised except the voice): the world for 0.7 s, then **only your sounds**,
  each in the acoustics of where you are, and an original eerie score that leads. Three stems: music, amb (the world's
  last 0.7 s; then only your body's rush and the ringing), sfx (your voice, steps, claps, breath, heart, clicks and
  their echoes). The echoes are played louder than real (§ 2). Mix targets: −16 to −14 LUFS, ≤ −1 dBTP; the score
  clearly leads, beds about 10 dB under it measured solo (the owner's rule after days-shorter).

## 5. Review log

(Filled in as the reviews come back.)

# What if every sound vanished except yours?

A 16:9 long-form film with no narrator: 1920×1080, 30 fps, 5:09. The only voice is the main character's own (ten
short lines made with ElevenLabs, `VO-you.md`, voice "Liam"), because his is the only voice left in the world. It
is built for the mood the owner asked for on 2 November 2026 (the Slower light film's comments: "scary, like a horror
game"), and to the owner's YouTube lessons of 28 October 2026:
- **an everyday place:** your 5th-floor kitchen on a rainy Thursday night, your stairwell, the street, the park across
  the road and the dark under its plane tree, from 9:41 PM to 10:09 PM;
- **action on frame 1:** under the title the cat pats a glass off the counter; the TV, the rain and the fridge stop
  dead at 0.7 s, and the glass smashes on the tiles in slow motion without a sound;
- **a hook at 0:16:** a text from a number you don't know: "was that you? saying hello? you're the only sound I can
  hear" (someone heard you, through the walls);
- **the real nuance in the first minute:** "sound is just air being pushed" (your pushes still travel at 337 m/s and
  fade as they always did); the quietest room on Earth (−20 dB) explains what you hear instead: your own body (and a
  ringing creeps in under it);
- **a new consequence every few seconds,** escalating from strange (the silent glass, the clap) to lonely (Mum can't
  hear you) to unnerving (every window across the park lights up and looks at yours; the man on the stairs) to
  dangerous (the silent car, the ambulance nobody hears) to frightening (a shout up to 400,000 people could have heard,
  and they start walking towards it) to horror (the dark, the crowd you can only see with your own clicks, the one
  behind you);
- **tension to the last frame:** "To see them, you have to click. / They hear every click 1.6 km away." Your last click
  finds the figure standing 0.95 m behind you; it holds a beat, then "Would you make a sound?", cut hard while the
  question is still on screen. There is no recap.

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
  why EVs must hum below 20 km/h; echolocation (clicks) works perfectly.

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
| your voice ("Hello? …Is anyone out there?") | 60 | **501 m** ("about 500 metres") | 3,944 (the HUD's counter) |
| a call | 66 | 910 m | 13,000 |
| a tongue click | 72 | 1.6 km | |
| a clap | 84 | 3.8 km | |
| a shout ("HELLO!") | 89 | **5.0 km** ("about 5 km") | **393,566** ("up to 400,000") |

- **Nothing in the way.** These reaches are for listeners in the open air. Behind shut windows (about 25 dB) your voice
  carries about 30 m and the shout about 750 m (about 9,000 people); with windows ajar (15 dB) the shout carries about
  1.8 km (53,000). So the captions say "if nothing's in the way", "up to" and "could have", the window beat says
  "Anyone with a window open can hear you", the HUD's counter is "COULD HAVE HEARD YOU", and the tags say "OPEN AIR"
  and "SHUT WINDOWS: ~750 m". (With 10 dB as the threshold for understanding speech: 295 m and 3.7 km.)

- Walls: the HUD's "neighbours through the walls" counts only flats within reach after a 38 dB loss (a party wall) or
  30 dB (the stairwell's doors).
- The speed of sound is 337 m/s (a 10 °C night, the same air the absorption assumes; "about 340 metres a second").
- Echoes from the middle of the park (there and back at 337 m/s): your block 50 m → 0.30 s, the flats across 56 m →
  0.33 s, the church 69 m → 0.41 s, **the tower block 170 m → 1.01 s** ("1 second there and back"), the terraces
  262 m → 1.55 s. Real echo levels are −43 to −58 dB under the shout (`soEchoDb`); the mix plays them about 40 dB
  louder so they can be heard on a phone (the HUD says so). Echoes that would arrive below hearing are not played (the
  tower and the double bounce from your window; the double bounce of the count; any echo of the whisper).
- Lightning: the flash comes 1.0 s before you say "One", and the count on screen follows your voice, so "six" lands
  about 6 s after the flash: 6 × 337 m = **2.0 km** ("2 km away"); the thunder would arrive at six seconds.
- Silence: the film's clock shows minutes since 9:41: "in 11 minutes" (9:52:44) and "for 16 minutes" (9:57:32).
- The quietest room: Microsoft's anechoic chamber, −20.35 dBA (Guinness World Records, 2015). The ringing that creeps
  in under it is the tinnitus most people hear in deep silence (Heller & Bergman, 1953: 94 % of 80 people; no longer
  a caption).
- Silent cars: EU Regulation 540/2014, an acoustic vehicle alerting system on new types of electric cars from July
  2019, on every new one from July 2021, up to 20 km/h.
- Echo pictures: a click comes back from a tree 3 m off in 17 ms, a bench at 5 m in 29 ms, someone at 7 m in 41 ms.
  The picture draws the wave at 5 m/s, about 67× slower than sound, and it is stylised: real echolocators pick out far
  less than dozens of people at 7–15 m (the HUD says so). Scared breathing (28 dB) carries 14 m, so everyone in the
  ring (7–15.7 m) can hear it; the one at 0.95 m hears you breathe (your heartbeat, 0 dB, is below hearing).

## 3. The beats (CAPTIONS.md, 68 captions, 27 beats)

1. **Your kitchen, 9:41 (0:00–1:31).** The title over the glass. "What…?" The clock: "9:41 PM. Every sound in the
   world just stopped. / Except yours." "Hello?" into the dark hall. A text from a number you don't know: "was that
   you? saying hello?" The news, the rain, the cat: nothing. You clap, and hear it; the pulse of air (a diagram). Your
   breath and heart get loud. You call Mum: connected, and neither of you hears a thing. You open the window: "Hello?
   …Is anyone out there?" (500 m; anyone with a window open hears you). One by one the windows across the park light
   up; a telephoto shot from the flats shows you, small, in yours.
2. **The stairwell, 9:47 (1:32–2:06).** Down in the timer light ("Okay. Okay…"), every step echoing; the light runs
   out; only the green EXIT sign is left. You feel for the light switch, turn right round: a neighbour is three steps
   behind you, lit by his phone ("God! …You scared me."). He types: "DON'T SHOUT. everyone can hear you".
3. **The street, 9:52 (2:07–3:12).** Rain that makes no sound, car alarms flashing, a dog barking: nothing. You step
   off the kerb and a silent car passes 1.2 m in front of you; you watch its tail-lights go. An ambulance, siren on,
   that nobody hears. "Can anyone hear me?": every head in the street comes round, nearest first. A storm over the
   rooftops: you count to six, and the thunder never comes.
4. **The park, 9:56 (3:13–4:05).** The middle of the park: if anyone else can still make a sound, they'll answer.
   "HELLO!": the buildings answer one by one (the tower in 1 second); from above, the circle reaches 5 km: up to
   400,000 people. From every street round the park, people start walking towards the only sound left.
5. **The dark, 10:09 (4:06–5:09).** You ran, and every footstep told them where. You hide under the plane tree. A dog
   comes out of the dark: you never heard it. You click your tongue to see with the echoes: a tree at 3 m, a bench at
   5 m, something at 7 m, then people, dozens, all round you, not moving. "Who's there?": they all take a step closer.
   To see them you have to click, and they hear every click 1.6 km away. Your last click finds one standing right
   behind you, looking down at you. "Would you make a sound?"

Signature moments: the windows across the park lighting up and looking at yours; your shout and its echoes; the echo
pictures in the dark and the figure behind you.

## 4. Look and sound

- The house style (STYLE_BIBLE): first person, serif captions, a minimal HUD: the clock (THURSDAY 9:41 PM, "SILENT
  FOR …"), a sound meter (your sound's level, how far it carries, through how many walls), a counter ("COULD HAVE
  HEARD YOU", climbing at 337 m/s), one tag per assumption. Night, rain, sodium lamps, cold blue windows.
- Echo vision (echo.js): every surface is replaced by a dark shader lit only by the slowed wave from your click.
- Sound (audio.js + sound-*.js, all synthesised except the voice): the world for 0.7 s, then **only your sounds**,
  each in the acoustics of where you are, and an original eerie score that leads. Three stems: music, amb (the world's
  last 0.7 s; then only your body's rush and the ringing), sfx (your voice, steps, claps, breath, heart, clicks and
  their echoes). The echoes are played louder than real (§ 2). Nothing in the score may imitate a sound the world has
  lost: no siren wail under the ambulance, no drum roll for the thunder, no march at walking pace under the crowd. Mix targets: −16 to −14 LUFS, ≤ −1 dBTP; the score
  clearly leads, beds about 10 dB under it measured solo (the owner's rule after days-shorter).

## 5. Review log

Round 1 (2 November 2026, three independent reviewers on the 5:30 preview; scores as given):
- **Retention 3/5.** Drops at 0:24–1:00 (a 13 s static clap shot, four facts in a row, the ringing never paid off),
  2:37–3:02 (the silent-car lecture), 3:16–3:52 (a static count, then the bats), 4:36–4:50 (near-black, the dog
  unreadable). Recycled: call-out → circle → counter three times; "X. Nothing." twice; the ending line repeating "He can
  hear you. You can't hear him."; "You'd never hear anyone coming" giving the stairwell scare away.
- **Visuals 3/5.** The laptop's news facing away; "Hello?" on a blank wall; flat white glass shards; the 500 m map on
  near-black; a beige, black-voided stairwell and a glitchy green wedge after the timer; the neighbour a static
  mannequin with green hands and no visible turn; the ambulance a speck (its markings floating off the van); upside-down
  umbrellas, heads too small to see turn; a toy-bright lawn and lollipop trees; "under the trees" showing an open field;
  the dog invisible; the trunk reading as a searchlight in echo light; leaf cards; the figure behind you looking 2–3 m
  away with a head like a bust in a wig.
- **Physics 7/10.** Arithmetic and facts right; audience counts assumed nobody indoors; the lightning count ran 7.5 s
  from the flash; "IT CAN HEAR YOUR HEART" though the heart is below hearing; 14 m rounded to "10 m"; echoes "a little
  louder" when they are ~40 dB louder; echoes played that would be below hearing; the car's air rustling your jacket
  (a sound the car started); "every warning is a sound" against flashing lights; score cues that could pass for a siren,
  thunder and footsteps; 343 m/s with 10 °C absorption.

Fixed for round 2 (the top three of each, and the cheap ones):
- Story (5:30 → 5:09): the stranger's text moved up to right after "Hello?" (a hook at 0:16); clap and rule cut to one
  caption each; the ringing beat and the bats cut; no map for the window (one circle-and-counter fewer); the car beat
  is two captions over its tail-lights going silently away; "You feel for the light switch." replaces the line that gave
  the scare away; the park says why you shout ("If anyone else can still make a sound, they'll answer."); the hide beat
  bridges ("You ran. Every footstep told them where."); the ending is "To see them, you have to click. / They hear every
  click 1.6 km away.", and the last click finds the figure and holds before the question.
- Physics: every audience number qualified (nothing in the way, up to, could have, open air, shut windows ~750 m);
  337 m/s throughout (tower 1.01 s, lightning 2.0 km); the flash 1.0 s before "One", the count on screen following the
  voice; "IT CAN HEAR YOU BREATHE"; metres under 100 shown exactly; "ABOUT 40 dB LOUDER"; inaudible echoes removed; the
  jacket rustle removed; "Our most urgent warnings are sounds."; the echo picture tagged as stylised; no siren wail,
  thunder roll or walking-pace drum in the score.
- Visuals: the hall door open onto a black hall (your "Hello?" goes into the dark); clear glass shards; the stairwell lit warm while the timer runs, the
  EXIT sign the only light after it, a full half turn to the neighbour (alive, phone in both hands, lit from below);
  street people with their backs to you turning one by one, nearest first, with a push-in, umbrellas upright; the
  ambulance close, its markings on the van; the car's tail-lights followed; a darker lawn and fuller crowns; the trunk
  and a low bough in frame when you hide; a cold rim light on the dog; echo light with grain, bark ridges and a longer
  afterglow; the crown blobs hidden in echo light; leaf-shaped fallen leaves; the 7 m figure moved clear of the HUD;
  labels appear as their echoes return; the figure behind you hooded, looking down at you, filling the frame.

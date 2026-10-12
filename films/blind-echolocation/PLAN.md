# What If You Went Blind… And Learned to See With Sound? — plan

The channel's first long-form film: a 16:9 animated science documentary (1920×1080, 30 fps), built on the shared
engine plus the hybrid-look pieces of the gravity films. Page: `blind-echolocation.html`. Approved screenplay:
[`SCREENPLAY.md`](SCREENPLAY.md); exact narration: [`NARRATION.md`](NARRATION.md); the film's master timeline is
generated from the page (`export-docs.cjs` → `TIMELINE.md`, `timeline.json`).

**Length: 8:23 (503.14 s).** The screenplay targets 7:00, but the fourteen recorded narration clips (408 s of voice,
Charlie, ElevenLabs, made by the narration thread and never regenerated here) are longer than its estimate. The owner's
rule: the voice is never cut or sped up, and every NO NARRATION section stays. So each scene is a short lead-in, its
clip, then the screenplay's silent section (`GAP` / `LEAD` in `build-timing.cjs`), and every picture beat is keyed to a
real word time (`bnE(scene, 'word')`).

## The three visual modes

| Mode | What it is | How it looks |
|---|---|---|
| Reality | the objective, third-person film | warm stylised 3D: authored sets, soft sun and practicals, AO, depth of field, filmic grade |
| Sound information | an artistic metaphor for what echoes can tell a listener; never what a blind person "sees" | near-black; a click is a pulse whose front sweeps surfaces; the return depends on material, distance and facing; arrival-time contours and a broken dot grid; everything fades; background sounds give only a direction (rings) |
| Science | explanatory cutaways | the void stage (scenes 4, 7): particles of air, image sources, traces in milliseconds, the brain model |

Colour code in the sound view: cyan = echoes from her clicks; amber = sounds the world makes (traffic, steps, voices,
rain); violet = background direction cues. Any wave slowed for the eye carries the on-screen **slowed** label (with the
real time shown in ms where it matters); the soundtrack is always real time.

## The protagonist

One design through the whole film (`cast.js`, rig `rig.js`): a woman (Noor in the code, never named on screen), low bun,
warm brown skin, a teal top in scenes 1–2 and from scene 3 the ochre cardigan from the chair, dark trousers, light
trainers, later the white mobility cane. Her eyes are open and calm but never fixate: she turns an ear toward sounds.
Uncertain early, learning in supervised settings (a coach, an instructor), steady by the end. The cane, touch, memory,
other people and accessible signals are always part of how she gets around; echolocation is one tool among them.

## Scenes and shots

| # | Scene | Set | Shots |
|---|---|---|---|
| 1 | The last thing you see | bedroom (`apartment.js`) | first person at sunrise, reaching for the ringing phone; the light goes; the alarm, a car, steps behind the door as rings; the phone falls and slides under the dresser (slowed wave, labelled) |
| 2 | A world without light | bedroom | finding the phone, the sweater, the glass, the door lever; her face listening; the "movie version" neon map that fails on "superhuman"; the sparse real sound map; the accidental wall tap |
| 3 | The first echo | hallway | her first click; the same click slowed ≈ 1000× with a live ms readout; image-source reflections; a wall / a doorway / a bookcase; the echo traces; the word "Echolocation"; the click down the hall into the open doorways |
| 4 | How a human can echolocate | void | the tongue click close; air particles pushed by the front; 2 m wall: 5.8 ms out, 11.7 ms back, 4 m ÷ 343 m/s ≈ 12 ms; one click in real time (inside one frame); separate vs blended echo; three cues; three surfaces |
| 5 | Building a world from sound | training centre (`centre.js`) | weeks 1–10: scattered fragments → an opening → a column → flat vs round; the ten-week study card (blind and sighted adults both improved); the corridor where a wall ends; first person in the lobby |
| 6 | What does an echo actually reveal? | practice room | no colours, signs or faces in sound; steel panel vs blanket block; the room in fragments vs the full picture; three directions, three answers |
| 7 | The brain starts changing | void + brain (`brain.js`) | into her ear; the auditory regions answer, then the regions normally associated with vision; blind and sighted brains both; the dive; the click through the network |
| 8 | The room that swallows sound | test room (`lab.js`) | the bare ringing room; foam wedges grow; clicks return almost nothing (only the hard floor); the room's real size; she checks with the cane |
| 9 | The city becomes a wall of sound | street (`city.js`) | aerial; walking; each word lights its sources; her click masked; tactile paving and the kerb; the wall ending at the side street; the accessible signal; the crossing on the walk signal |
| 10 | The sound of rain | street + `rain.js` | the sky closes; a slowed drop on the rail; five inserts; the storm from above and as sound; her click lost in the rain; scaffold, arcade; the sheet of rain; under the arcade |
| 11 | You don't need a perfect picture | arcade, café-bookshop | the friend approaching; voice, steps, touch (sighted-guide grip), memory; a click at the glass door; the café pouring out; in together |
| 12 | The final experiment | drill hall (`arena.js`) | months later; the hall answers late and long; the lamps go out; the course from above (labels); the dark; three clicks: the obstacle, the enclosed bay, the open passage; through with the cane |
| 13 | The world returns in a different form | `sfield.js` | the rise; the roof dissolves; the city appears as sound only (traffic lines, steps, the fountain, the weir), most of it dark; a woman with a cane at a corner; a man with a cane on a bridge; three clicks, black |
| 14 | The last question | bedroom + hallway | the alarm again, silenced and set down square; the walk to the door (a landmark on the dresser); a restrained sound view of the room's small sounds; the door opens on the warm hallway; the cane unfolds; the opening's own view, one click, the fade |

Every scene file (`scene2.js` … `scene14.js`) starts with its shot list in words; `TIMELINE.md` has every shot's
times.

## Sound

Five stems (`audio.js`, a subclass; `js/audio/audioEngine.js` is untouched): voice, music, ambience, foley, sfx. Every
sound is synthesised from seeded noise (a pure function of time). Each place has its own acoustics, built from the same
geometry the picture uses (an image-source impulse response per room, `beRoomIR`, plus the explicit echoes of the
surfaces that matter): the small soft bedroom, the fluttering hallway, the almost anechoic void, the lively practice
room, the hemi-anechoic test room, the street (shopfronts at ≈ 15 ms, far facades at ≈ 125 ms), the rain built from
impacts, the warm café, the big drill hall (RT60 ≈ 2.4 s), the city from the camera. No two scenes use the same click:
every click is rendered with the echoes its surroundings would return (`sound-<chapter>.js` headers list the delays).

Mix (`mix.js`): the gravity films' v3 dynamic approach. Music ducks 8 dB under the narrator (attack 0.22 s, release
0.8 s) and rises in the silences; ambience and foley duck less; the dynamics map lifts the street, the rain and the café
where the screenplay wants them to take over. Master: −15 LUFS integrated, peaks limited below −1 dBTP.

## Science and representation rules (checked)

- 343 m/s; a wall 2 m away: 4 m round trip ≈ 11.7 ms ("about twelve milliseconds"). All echo delays in the sound are
  computed from the modelled distances.
- Slowed waves are always labelled; the real-time click is shown fitting inside one video frame.
- No superhuman hearing; blindness does not sharpen the ears (scene 2 shows the movie myth failing).
- Echolocation reveals surfaces, openings and rough shapes, not colours, text or faces (scene 6); absorbing rooms and
  noise defeat it (scenes 8–10); it never replaces the cane or accessible signals (scenes 9, 12–14).
- The ten-week training study: blind and sighted adults both improved. Brain imaging: trained echolocators showed
  increased responses to echoes in regions normally associated with vision, sighted participants too. Shown as a
  colour-coded illustration of findings, not as "what the brain shows".
- All practice and tests are supervised (a coach, an instructor, a control room).
- Scene 13's city is a metaphor for the audience, never a claim that anyone hears a whole city.

## Commands

```bash
NODE_PATH=$(npm root -g) node tools/check-page.cjs blind-echolocation.html                 # boot + full sound check
NODE_PATH=$(npm root -g) node tools/stills.cjs --page blind-echolocation.html --w 960 --h 540 --t 30,200 --out /tmp/s
NODE_PATH=$(npm root -g) node films/blind-echolocation/render-stems.cjs /tmp/st mix,voice,music,amb,foley,sfx
NODE_PATH=$(npm root -g) node films/blind-echolocation/export-docs.cjs /tmp/docs          # SRT, VTT, transcript, timeline
python3 films/blind-echolocation/contact-sheets.py /tmp/stills /tmp/docs/timeline.json /tmp/sheets
films/blind-echolocation/make-zip.sh /tmp/blind.zip blind-echolocation                      # runnable ZIP (sound baked)
tools/render-parallel.sh blind-echolocation.html /tmp/full 1920 1080 4 30                   # final frames
```

## Review log

See `EPISODE_REPORT.md` for the independent reviews, their scores as given, the fixes and what is still weak.

# What if light kept getting slower and couldn't stop? — plan

A voiceless 16:9 long-form film (1920×1080, 30 fps, ≈ 5:57). The owner picked the premise, asked for a hybrid of four
successful "What if" channels (study: `/mnt/project-files/what-if-channels-study/STUDY.md`), then chose **no
narrator** (2026-10-18): the film is told by short second-person captions (`CAPTIONS.md`), the corner readout and
the sound. One evening, first person: your flat on a harbour, the street outside, then the dark. Every caption line
is our own.

Page: `slow-light.html`. Code: `films/slow-light/`. Captions and their timing: `CAPTIONS.md` → `build-timing.cjs` →
`timing.js`; every beat in `script.js` (SL) is keyed to a caption's words. Speed of light over time: `SL_CKEYS`.

## 1 · Structure

| | time | what you see |
|---|---|---|
| cold open | 0:00 | later tonight: lamplight crawling across the floor in an egg shape |
| title, the rule | 0:07 | the title; light laps the Earth (shown 40× slower); "Tonight, it starts slowing down. Just light." |
| the call | 0:27 | Gran in Sydney on a video call: a fraction of a second behind, then 1 s, then 3 s; she laughs at your joke 8.7 s late |
| the map, the Sun | 0:55 | GPS is radio: your phone puts you at sea; the Sun's light arrives slower, so night comes early |
| fireworks | 1:16 | 2 km away: the bang 6 s after the flash, then 4 s, 2 s, together, then the bang FIRST, then a big one heard 2.4 s before it's seen |
| the street | 1:50 | light at 100 km/h: car 1's headlights blue as it comes; driving away the whole car turns red, then infrared (gone); car 2 is faster than light, like a jet outrunning its sound: heard, not seen, then it appears from nowhere and splits in two (it driving on, and its past running backwards), with a diagram from above |
| the cat | 2:38 | light at 9 km/h: she sees your thumb on the laser pointer and is at the wall before the dot |
| the mirror | 3:02 | walking pace: your reflection 2 s late; walking in, everything ahead turns blue, behind you dark and red |
| the lamp | 3:28 | slower than you walk: switch it off, the room stays bright, the dark spills out of the lamp; back on: the egg shape from the cold open |
| the knock | 4:06 | 22 cm a minute: you hear the knock at once and see your hand land 6.5 s later; then nothing new reaches you; then light stops |
| the dark | 4:37 | the next light you'd see is already inside your eye and never gets there. Mum comes home (the flat from above, x-ray cut-away): "Why are all the lights off?" They're all on. Her "On my way" text is stuck 675 m away |
| it's real | 5:12 | Harvard 1999: inside an atom cloud, light slowed to 17 m/s; 2001: a pulse stopped, stored in the atoms, let go |
| the question | 5:45 | "If light slowed to walking pace… what would you race first?" |

## 2 · The physics: the rules of this world, and every number

**The one rule.** Only light slows (the label says so: "THOUGHT EXPERIMENT · ONLY LIGHT SLOWS · WIRES AND CHIPS STILL WORK"; in reality the signals in wires and chips are the same field and would slow too). Sound (343 m/s), cats, cars, you, chemistry and eyes stay as they are. Light
moves at c(t) relative to the ground and air of this one world, everywhere at once, and light already on its way
slows with it. (In real physics c is the same for every observer and is woven into atoms; a world where it fell to
walking pace could not hold together. The film says "Just light. Nothing else." and keeps that promise.)

**What follows, and is drawn.**
- *Seeing is late.* You see a thing where it was when the light you are getting now left it: t_seen solves
  ∫ c dt from t_left to now = distance (`slSeen`, and `slSeenAcross` when c changes during the trip). Every moving
  thing in the film is drawn this way, vertex by vertex for the cars (`kit.js` slPatch `move`).
- *Colours shift.* With light moving through the world like sound through air, the classical Doppler factor applies:
  frequency × (1 + u·n) / |1 + v·n| (u your velocity, v the source's, in units of c). The shift is applied to an LED
  white spectrum through the CIE colour-matching curves (`slShiftRGB`); light shifted outside 380–750 nm is drawn as
  nothing (black).
- *Brightness.* Light already in flight keeps its energy per metre, so what arrives each second scales with c: when c
  falls, things look dimmer for a while (the Sun). Approaching sources brighten by the same factor (capped at 2.5).

**The numbers** (`script.js` SL_CKEYS; a caption's claim is what sets each one).

| scene | c | what it does |
|---|---|---|
| start | 299,792 km/s | light laps the Earth 7.48 times a second (shown 40× slower) |
| the call | 2 × 10⁸ → 1 × 10⁷ m/s | London–Sydney cable ≈ 20,000 km, light in glass 1.47× slower: delay 0.25 s → 0.4 s → 1 s → 3 s; 4.2 s when she laughs |
| the map | 6000 → 2200 km/s | GPS satellites are 20,200 km up; at these speeds their signals are seconds late, so your phone's position runs off into the harbour (illustrated) |
| the Sun | 1500 → 400 km/s | the light arriving each second drops with c: night comes early |
| fireworks, 2 km | 100,000 → 243 m/s | the bang always comes 5.83 s after the burst (2000 / 343); light's trip sets the gap. Light already on its way slows too, so c is held in steps and each step is solved so that ∫ c dt over every 2 km trip is exact (`script.js` SL_FW_STEP): 1,101 m/s (4 s gap), 611 then 368 (2 s), 368 then 313 (together), 313 then 243 (bang 1.6 s first), 243 (bang 2.4 s first). The readout's stopwatch runs from each pair's first event to its second |
| street, car 1 | 27.8 m/s (100 km/h) | car at 25 km/h = a quarter of light: headlights × 1.33 in frequency (blue), tail lights × 0.8 (deep red); it speeds off to 70 km/h: × 0.6, infrared, gone |
| street, car 2 | 3.5 m/s (12.6 km/h) | car at 25 km/h = twice light: it outruns its own light, like a jet outrunning its sound (its light's circles pile up into a cone behind it; the diagram shows this from above). Its light first reaches you from a point b/√3 up the road (b = 3.7 m), 0.9 s after it has really passed you; that one moment then splits into two images: light it gave off later (it, driving on, shifted into the infrared: a dark shape) and light it gave off earlier, arriving later (its past, running backwards up the road). Both images are its past |
| the cat | 2.5 m/s (9 km/h) | her 4.2 m sprint takes 0.9 s and peaks near 25 km/h; she sees your thumb 0.5 s after you press, and is under the dot before it is lit (the beam takes 1.8 s to reach the wall) |
| the mirror | 1.4 m/s (5 km/h) | you stand 1.4 m from the glass: 2.8 m there and back = 2 s late. Walking at 0.55 m/s (0.39 of light): ahead × 1.39 (blue), behind × 0.61 (dark red) |
| the lamp | 0.75 m/s (2.7 km/h) | the bulb 4.1 m from you: 5.5 s to see it change; the light you see bounced off the floor, and every floor point with the same total path is on one ellipse: the egg |
| the knock | 0.065 → 0.06 m/s (≈ 0.2 km/h, slower than a tortoise's 0.27) | knuckles 39 cm from your eye: seen 6.5 s after you hear them ("There." is placed on that moment); the readout counts down to it |
| the freeze | 0.02 → 0.0006 m/s | nothing new reaches you; what you see keeps dimming (arrival scales with c) |
| the stop | 0 | the room and the inside of your eye are full of light that has stopped; the next light you'd see is a hair from your retina and never gets there |
| the text | — | sent from a mast 800 m away when light did about 17 km/h and falling: it covers 125 m and is stuck 675 m away |
| the lab | 17 m/s, then 0 | Hau et al., Nature 1999 (inside a cloud of sodium atoms a fraction of a millionth of a degree above absolute zero, a light pulse slowed to 17 m/s); Liu et al., Nature 2001 (a pulse stopped: stored in the atoms, with no light left inside, and released up to a thousandth of a second later). c itself never changed: the film says "Slow light is. In a lab." |

**Simplifications, said on screen where it matters.** The globe is "LIGHT, AS IT REALLY IS · SHOWN 40× SLOWER". The
lab is "REAL EXPERIMENT · HARVARD, 1999 / 2001 · ILLUSTRATED, SLOWED DOWN" (an optical table, not the real
apparatus). Car 2's backwards image is mirrored front to back (light from its earlier moments arrives later). The map
app's drift is illustrated, not a computed GPS fix. The clock and Mum's arrival compress one evening.

## 3 · Three signature moments

1. **The bang before the flash** (1:40–1:48): the crowd below says "ooh" when it SEES each burst, and the bell for
   each flash moves from before the bang to after it.
2. **The car you can hear but not see** (2:15–2:40): it passes you unseen, appears from nowhere two metres up the
   road and splits into the car and its past.
3. **The knock, then the stop** (4:06–4:35): you hear your knock and wait 6.5 seconds to see your hand land; then
   nothing new arrives, and the picture fades out for good.

## 4 · Sound (no narrator)

`sound-music.js`, `sound-amb.js`, `sound-sfx.js` (generators in `sound-lib.js`, DSP in `audiokit.js`), mixed in
`mix.js`: −16 to −14 LUFS, true peak ≤ −1 dBTP, a real loudness range. Sound is never slowed, so every effect is placed
when it really happens (plus its trip through the air), never when it is seen: that gap is the story. Voices (Gran on
the phone, you, Mum through the wall, the crowd) are synthesised speech shapes with no words you can make out. The
score's theme (E–B–A–F#… G) slows as light does; the stop takes its last note; it lands when the lab lets the light go.

## 5 · Delivery

Runnable ZIP (unzip, open `slow-light.html`, press Space), then the final 1080p MP4 rendered on the owner's PC (GPU,
through his Chrome) plus a small copy under 30 MiB. Report: `EPISODE_REPORT.md`.

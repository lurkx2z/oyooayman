# What happens if you slip and fall? — production plan

A 66-second vertical (9:16, 1080×1920, 30 fps) first-person physics parody on the shared engine. It plays dead
serious, like a disaster documentary, until the last card. One continuous chain of cause and effect: a slip on a wet
sidewalk → a vibration → a pebble → a fault → an earthquake → Earth's rotation → the sea → a 146 m tsunami. Every link
is shown, and the numbers are honest about how small the start is. Only after the punchline does a small note say it is
satire.

## 1. Rules

- **Tone**: a serious documentary. Serif title and captions, plain HUD, no meme sounds, no emoji, no cartoon motion.
  The joke is the chain itself and the deadpan end card.
- **Honest numbers**: the fall really is about 1.7 kN; really only about 0.07 J reaches the ground; the pebble moves
  1.4 mm. The exaggeration happens at the links (a fault at 99.999 %, momentum into Earth's rotation), and the end note
  owns up to it.
- **One location**: the wet avenue runs down to the sea. The sea shows as a grey band at the end of the street in the
  first shot (it is not a spoiler), and the tsunami comes back up the same avenue.
- **Every transition is causal**: the camera follows the energy. The thud turns into a ring in a puddle; the ring goes
  down into the ground; it reaches the pebble; the pebble falls into the fault; the fault's waves reach the street; the
  street pulls out to the planet; the planet's oceans shift; the camera comes back down to the coast.
- **Words on screen**: the centred question, eight short captions, small readouts top-left, the end card.
- **Silence**: after the thud (0.8 s); at the black after the impact; under the end card.

## 2. The places

- **The avenue** (`street.js`): the overcast street from the first film, now in rain: wet asphalt and paving with
  real reflections (a planar mirror sampled through a puddle mask), drizzle, people with umbrellas, parked cars. You
  walk the right-hand sidewalk (x ≈ 9.6) toward −Z, toward the sea. The avenue ends at a seafront road at z = −330: a
  promenade, a railing, a sea wall, a beach, a breakwater with a lighthouse, moored boats.
- **Underground** (`under.js`): a documentary cut-away below the place where you fell: paving, sand, soil with pipes,
  clay, gravel, weathered rock, granite. A pale ring spreads from the impact point and fades. At 30 m down, a pebble
  sits in a crack beside a millimetre scale.
- **The fault** (`under.js`): the crust under the city at kilometre scale: two blocks locked along a dipping fault,
  the locked patch glowing with stress, the coast and the sea on the surface above.
- **The planet** (`globe.js`): the shared Earth, turning, with seismic rings spreading from the city and an ocean
  slosh after the rotation changes.
- **The sea and the wave** (`sea.js`): water over an analytic seabed (it drains to −38 m and shows the mud, rocks and
  boats lying on their sides); the wave: a long curling wall with a translucent face, foam streaks, a whitewater lip,
  spray mist, debris in the face, varying along its length (not a flat wall).

## 3. Shot list (film seconds)

| Time | Beat | Shot |
|---|---|---|
| 0.0–3.3 | **Question** | POV walking in the rain down the wet avenue; shop light in the puddles; the sea at the end of the street. Centred: *WHAT HAPPENS / IF YOU SLIP / AND FALL?* (0.2–3.4) |
| 3.3–3.8 | **The slip** | Looking down: your right shoe lands on a wet steel plate and shoots forward; the view tips back; your hands fly up |
| 3.8 | THUD | The camera slams down; a jolt |
| 3.8–4.7 | Silence | On your back, rain falling at you from a grey sky · IMPACT FORCE ≈ 1.7 kN |
| 4.7–6.3 | Setup | You sit up, hands on the wet paving · *Normally… you'd just get back up.* |
| 6.3–7.4 | Turn | You look down between your hands: a ring spreads in the puddle · *But not this time.* · the camera follows it into the ground |
| 7.4–11.8 | **Underground** | Down through the layers; the ring spreads and fades · ENERGY TRANSFERRED TO THE GROUND 0.07 J · *A tiny part of the impact becomes vibration.* |
| 11.8–17.4 | **The pebble** | Macro: a pebble in a crack, a millimetre scale; it moves · ROCK DISPLACEMENT 1.4 MM · *Usually, this would mean nothing.* · *Unfortunately…* · it slips and drops into the crack |
| 17.4–24.6 | **The fault** | Pull back to kilometre scale: a locked fault under the city · FAULT STRESS 99.999 % · *You fell in exactly the wrong place.* · FAULT SLIP 0.2 MM · the rupture races along the fault · MAGNITUDE M2.1 → M8.7 · waves race up to the city |
| 24.6–32.0 | **Earthquake** | POV on hands and knees on the sidewalk: the street heaves, puddles jump, a shop window bursts, a car rocks with its hazards flashing, a signal swings, a cornice falls, people stumble, a crack runs past your hand · MAGNITUDE 8.7 |
| 32.0–39.2 | **Earth** | Rush out to the planet; rings spread from the city · EARTH ROTATION 1,674.40 KM/H → 1,674.41 · *The earthquake transferred momentum into Earth's rotation.* · *But even a tiny change… can have consequences.* · ROTATION CHANGE +0.0006 % · the oceans shift; dive to the coast |
| 39.2–46.0 | **The sea leaves** | At the seafront railing: the sea draws back · SEA LEVEL 0 / −2 / −9 / −21 / −38 M · boats tip over on the mud; people walk out onto the seabed |
| 46.0–52.6 | **The line** | DISTANT WATER MASS DETECTED · a white line on the horizon · WAVE HEIGHT 3 / 7 / 16 / 34 / 78 M · sirens; people run |
| 52.6–59.6 | **Run** | You run up the avenue; look back: 146 M over the rooftops, the lighthouse gone, debris and mist; last look back: the lip overhead |
| 59.6–60.6 | **Impact** | The whitewater takes the street and you; black |
| 60.6–61.2 | | Black, silence |
| 61.2–63.6 | **Payoff** | *CAUSE OF GLOBAL CATASTROPHE:* / *SLIPPED ON WET SIDEWALK* |
| 63.8–66.0 | **Meta** | *yes. somehow it became a tsunami again.* · small: *SATIRICAL SIMULATION · NO, SLIPPING CANNOT ACTUALLY CAUSE THIS.* |

## 4. Hero shots

1. **The slip** (3.5): the shoe in the air over the wet plate, the street tipping away.
2. **The ring going into the ground** (7.6): the cut-away under the sidewalk, the pale ring under the fallen figure.
3. **The pebble and the scale** (13.0).
4. **The rupture** (21.5): the fault lights up under the city.
5. **The planet with the rings** (34.5).
6. **The drained bay** (45.0): the boats on their sides, the sea gone to the horizon.
7. **The wave over the avenue** (57.5, 59.0): the cover-worthy shot (not used as the cover).

The cover is the slip (frame 0–3.5 with the title), never the wave.

## 5. Escalation (a new link every 3–7 s)

thud 3.8 · ring 6.5 · underground 7.4 · pebble moves 12.9 · pebble drops 16.2 · fault 17.4 · rupture 20.3 ·
M8.7 23.8 · quake 24.6 · planet 32.0 · rotation 35.4 · sea leaves 39.6 · line 46.0 · 78 m 51.6 · run 52.6 ·
146 m 55.0 · impact 59.6 · payoff 61.2 · meta 63.8.

## 6. Sound

Rain, footsteps on wet paving, a car hissing past; a soft piano and pad. The thud is a real body thud followed by
silence and rain. Underground: a low tone and a single heartbeat-like pulse that slowly grows into a rhythm; the
pebble's click is tiny and dry. The fault: a rising string cluster, the rupture as a long tearing rumble, timpani.
The quake: sub-bass, rattling glass, car alarms, a crash. The planet: wide and quiet, the rumble far away, a low
choir pad; the number tick is a soft click. The coast: gulls stop, a dull drone, the hiss of water draining, then
sirens; the wave: a growing roar, drums and brass on a pulse, the music climbs. The impact cuts to total silence.
The end card has none (maybe a single drop of rain under the meta line).

## 7. Systems

`script.js` (beats, captions, readouts, camera, hands, legs, sea and wave curves) · `street.js` (the wet avenue,
the seafront, rain, reflections, quake damage) · `under.js` (the cut-away and the fault) · `globe.js` (the planet) ·
`sea.js` (water, seabed, boats, the wave, spray, debris) · `cast.js` (people) · `body.js` (your legs and shoes) ·
`audio.js` (score and sound) · `film.js` (which scene, camera, flashes, words, grade). Page: `slip.html`.

## 8. Review log

(filled in as reviews come back)

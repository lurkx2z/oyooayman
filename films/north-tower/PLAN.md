# PLAN — *What if you were in the North Tower on September 11, 2001?*

16:9 long-form, 1920×1080, 30 fps, 6:01. Voiceless, in the house format of *Slower light* and *Universe expanding
faster* (short second-person serif captions with empty screen between them, a corner readout, first person, one
continuous morning), but in a different register: a memorial, not a spectacle. Owner's ask (2026-10-25): "POV, office
worker during 911 … starts in one of the towers as a office worker … research the event accurately, and the buildings
and inside the buildings too."

Page `north-tower.html`, code `films/north-tower/`, captions `CAPTIONS.md` (timed by `build-timing.cjs` into
`timing.js`), every fact from `RESEARCH.md` (9/11 Commission Report, NIST NCSTAR 1 and 1-7, FEMA 403, the 9/11
Memorial & Museum).

## 1 · The idea

You are one of the people who worked below the impact zone of the North Tower: a composite of survivors' accounts, on
the 73rd floor (20 floors under the impact). The film follows your morning by the real clock, from 8:41 to 10:29, and
your real way out: stairway C, the transfer hallway on 48, the firefighters climbing past on 37, water on 20, the
mezzanine, the concourse, up by 5 World Trade Center onto Vesey Street, north. The two collapses are seen as people on
the street saw them: from blocks away. It ends on the empty stairway, the numbers, and the Tribute in Light.

The point of view is the evacuation that worked. Almost everyone below the impact in the North Tower got out (about
7,500 people), down the stairs, helping each other, past the firefighters going up.

## 2 · What the film will not show (and why)

- **No plane** (nobody on 73 saw it; the impact is felt and heard, not seen).
- **No one falling, no one hurt on screen, no bodies, no gore.** The hurt man on the stairs is walking, helped.
- **No collapse closer than it was seen** (tag on screen: "NOTHING HERE IS SHOWN CLOSER THAN IT WAS SEEN"): the South
  Tower from Church & Vesey (≈ 360 m), the North Tower from West Broadway ≈ 1 km north, its sound arriving 3 s late.
- **No voices with words.** Murmur, breathing, coughs, radios garbled. Caption quotes are short and attested in kind
  ("Stay to the right!", "Don't look outside. Keep moving.", "Keep walking north.").
- **No villains, no politics, no names.** The film is about the people in the building.
- A remembrance card: *In memory of the 2,977 people killed on September 11, 2001, and the six killed in the bombing of
  February 26, 1993.*

## 3 · Structure (35 beats; times from `timing.js`)

| # | film time | clock | where | beats |
|---|---|---|---|---|
| 1 | 0:00–1:33 | 8:40–8:50 | floor 73 | title · morning · sky · tower · windows · 8:46 impact · after · outside · nobody · known |
| 2 | 1:33–3:26 | 8:50–9:44 | stairway C | stair · glow · pace · 9:03 second · calm · right · transfer (48) · firefighters (37) · water (20) · thin (8) |
| 3 | 3:26–4:11 | 9:45–9:58 | mezzanine, concourse, Vesey | mezz · police · escalator/concourse · out by 5 WTC · you look back |
| 4 | 4:11–5:07 | 9:59–10:29 | Church & Vesey, West Broadway | 9:59 roar · cloud (near-black) · grey · walk · 10:28 |
| 5 | 5:07–6:01 | — | empty stairway, black, the Hudson at night | out (7,500) · how · cost (2,977 · 2,753 · 343) · light · card |

## 4 · Shots (`shots.js`)

A1 title (the floor, wide) · A2 your desk (Q3 forecast.xls, the calendar: Tuesday 11 September) · A3 the sky through a
22-inch slot · A4 the South Tower across the plaza · A5 looking down the façade to the plaza · A6 8:46 at your desk (the
jolt) · A7 tiles and lights · A8 paper and smoke past the windows · A9 people standing, you go · A10 the core corridor,
the door to stairway C · B1–B10 stairway C (the infinite shaft, re-placed as you go; the floor number on each landing
follows you) · the transfer hallway · C1–C4 the mezzanine, the police officer, the escalator, the concourse under
sprinklers · C5–C6 Vesey Street, the towers burning · D1–D5 9:59 from Church & Vesey, the cloud, the grey, West Broadway,
10:28 · E1 the empty stairway (lights out, only the glow paint) · E2 black · E3 the Tribute in Light from across the
Hudson (from the Battery Parking Garage, where it is set up), One World Trade Center beside it, the card under the
skyline, over the river.

## 5 · Sets

- **office.js** — the south half of floor 73: the column-free span from the core to the outer wall (≈ 18 m), 59 columns a
  face (covers 19 in), 22-in window slots, 8 ft 7 in ceiling of 2 × 4 tiles and troffers, cubicles of 2001 (CRTs, beige
  towers, desk phones), the core corridor and stair C's door. Outside: the South Tower (its mechanical band on 75–76),
  Lower Manhattan, the harbour. 8:46: the jolt and the 6.5 s sway, the troffers flickering, five tiles falling, paper and
  black smoke outside.
- **stair.js** — stairway C: 44 in wide, 20 risers a floor round a narrow well, glow paint on every nosing, rail and
  landing edge (post-1993), the door and the floor number beside it, the crowd in two lanes
  at about one floor a minute with stops; the firefighters (turnout gear, SCBA, hose rolls) on the outer lane; water;
  the transfer hallway on 48.
- **lobby.js** — the mezzanine (cracked windows, glass on the floor, police directing), the stopped escalator, the
  concourse with its shops and the sprinklers raining.
- **street.js** — the WTC plaza buildings (5 WTC's dark 9 floors), Vesey and Church, West Broadway running north to the
  North Tower; both towers burning (black band and orange windows at 92–100 and 77–85, the smoke going south-east); the
  collapses (top coming down in ≈ 10 and ≈ 12 s, the cloud), the surge, the grey.
- **memorial.js** — black for the numbers; the Tribute in Light from the New Jersey shore.

## 6 · Sound (`sound-*.js`)

An original score in D minor, synthesised (the house kit): a four-note descent (A–G–F–E–D) that the film keeps coming
back to, a rising "climb" for the firefighters, and at the end the descent turned upward into D major for the light.
No music under 8:46, 9:59, the cloud, or 10:28. Ambience per place (office air and hum, the echoing shaft and its
hundreds of feet, the mezzanine hall, the sprinklers, sirens, the dead air inside the cloud, the grey). Effects placed
on the real moments; outside, placed on when their sound would arrive.

## 7 · Platform note

9/11 content is sensitive on YouTube and TikTok. The film follows YouTube's guidance for tragic events (educational,
documentary, no graphic imagery, a memorial framing). It may still be limited for ads; see EPISODE_REPORT.md.

## 8 · Review log

Three independent reviewers (a first-time viewer, a cinematographer, a historian checking accuracy and respect) watched
the 5 fps preview as contact sheets. Scores as given, out of 10.

**Round 1 (first cut, 5:57).**
- Viewer: enjoyment 5, retention 4, clarity 6, emotional impact 6, visuals 4, tone 8.
- Cinematography: image 5, composition 4, lighting 5, text 6 on a TV / 4 on a phone, picture matches caption 4,
  overall 4.5.
- History and respect: accuracy 8, architecture and interiors 6, respectfulness 7, platform safety 7.

What they found and what was done:
- The smoke outside was pale everywhere: a real bug (every particle pool shares one shader program, so pools were drawn
  with another pool's fog). Fixed in `kit.js`; the smoke is black again.
- 9:59 did not read: the collapse now starts on the caption, the camera holds on the South Tower, you turn and run
  after the third caption, the cloud is darker. "Day turns to night" is now near-black for about four seconds, then the
  grey lifts, with paper falling like snow.
- 10:28 looked like a cotton-ball mushroom: rebuilt as filmed (the antenna sinks first; dust bursts out round the
  falling front and never rises above the roofline; dark debris arcs out with pale trails; a ground cloud at the foot);
  people on West Broadway stop and turn round, one with a hand to the mouth.
- RGB glitch at both impacts, the "COLLAPSES IN 10 SECONDS" card, the seconds counter on the stairs: removed (game-like
  in a memorial).
- Accuracy: the transfer hallway readout (now 48 throughout), "all three stairways are gone" (now: impassable from
  the 92nd floor up), the glow-paint beat (now: where the lights fail), elevators ("most elevators are out"), the
  Tribute in Light (it stands on the Battery Parking Garage; the caption no longer says "where the towers stood"),
  7 World Trade Center placed west of West Broadway, the clock (it now runs steadily inside each shot and
  moves on only at cuts, the floor number with it).
- The Vesey exit: stairs up out of the concourse by 5 WTC, fire engines, a ladder, ambulances and police cars with
  flashing lights, paper on the ground, people coming out with you, 5 WTC's dark bronze front; the camera no longer
  passes through a parked car.
- Stairs: firefighters in 2001 FDNY gear (long-brimmed helmets with front shields, bunker coats with reflective bands,
  hose rolls), a bottle of water passed hand to hand, the hurt man walking with help; the "crowd thins" beat thinner.
- The mezzanine: cracked windows (star cracks), glass shards on the floor, a police officer mid-frame pointing the way.
- The end: wider, softer beams with a glow; a longer hold on the light before the card; the card under the skyline;
  the numbers (2,977 · 2,753 · 343) large, centred, amber. Captions larger for phones (62 px).


# What if Africa suddenly disappeared? — production plan

A 117.1-second vertical (9:16, 1080×1920, 30 fps) narrated film on the shared engine, built around the owner's own
script (project thread, 2026-10-13) read by the house narrator (Charlie, ElevenLabs, 25 clips — `NARRATION.md`). The
picture is cut to the real voice: every beat in `script.js` (`AF`) comes from the clips' word times
(`narration-timing.js`, made by `build-timing.cjs`). The voice is never cut or sped up; scenes stretch to fit.

Seven sections, as in the script, with both narration-free beats kept: 3 s of water, ship and music after the oceans
section, and the final 3 s pull-away where the music swells and then cuts to silence on the last frame.

## 1. The physics and the numbers (checked)

| Claim | Where | Basis |
|---|---|---|
| ≈ 1.58 billion people | readout, "nearly one point six billion" | UN WPP 2024, 2026 value |
| 30.1 M km², ≈ 20 % of Earth's land | readout | Natural Earth outlines measured in `make-planet.py` |
| ≈ 30 % of world mineral reserves | readout (the script's figure) | UNEP / AfDB |
| platinum ≈ 70 % (South Africa), cobalt ≈ 75 % (DR Congo), chromium ≈ 40 % (South Africa) | readouts on the car plant | USGS MCS 2025 (2024 output) |
| cocoa ≈ 70 % grown in Africa | readout on the chocolate aisle | ICCO |
| the basin holds ≈ 120 M km³ ≈ 9 % of the oceans | readout over the filling | 30.1 M km² × ~4 km; oceans 1.335 billion km³ |
| sea level falls ≈ 300 m worldwide, so coastlines move **outward** | the coast shot (counter −0 → −117 m), the final Earth | 120 M km³ ÷ ~390 M km² of remaining ocean |
| the fronts cross the floor in days; the basin fills over weeks | tags "TIME-LAPSE · 2 DAYS", "TIME-LAPSE · WEEKS" | weir-flow estimate over a 4 km wall, ~20 000 km of rim |
| circulation changes are drawn as an illustration | tag "ILLUSTRATION · NOT A FORECAST" | the script says "could change" |

What the picture must not imply: the land does not collapse or explode (it simply stops existing, a seam sweeping
across it); the old coast is a cliff 4 km high, the floor dark rock; the sea level **falls** elsewhere.

## 2. Shot list (as built)

| # | Film time | Set | What we see | Sound |
|---|---|---|---|---|
| P1 | 0–9.2 | planet | Today's Earth, Africa in daylight under the centred title. At 3.1 s the continent goes (a seam, ~1 s); the camera falls toward the Gabon coast and tips over until it looks across the dark floor at the 4 km wall, the Atlantic standing on top of it | low drone, felt piano; the vanish: an inward rush, the seam's fizz, a sub blow; a swell |
| P2 | 9.2–14.8 | planet | Dusk over the Mediterranean, looking south: Europe's lights on, where Lagos, Kinshasa and Cairo shone, nothing; the old coast glows faintly | lights going out (small fizzes); piano |
| M1 | 14.8–21.8 | mine | South Africa, the same second: a platinum open pit, haul trucks, dust. At 18.7 the seam sweeps in from the horizon; everything is gone; the camera tips down to the basin floor 4 km below | veld wind, cicadas, diesel; a growing roar, then the deep wind of the void |
| F1–F2 | 21.8–28.8 | factory | A car body line (robots welding, sparks); then a battery-cell line | muted-piano ostinato; servos, weld crackle, the cells' clatter |
| F3 | 28.8–32.4 | factory | Weeks later: the line is starved; on "gone" it stops and the lights go out row by row toward us | a clunk, air let out, motors winding down, relay thunks |
| T1–T2 | 32.4–42.7 | planet | The trade map: routes glowing, the African lanes and ports blink out; the Suez line snaps; detours draw | a tightening pulse; digital cuts; the snap |
| B1 | 42.7–44.4 | board | A departures board: every African destination flips to CANCELLED; travellers under it | the hall's murmur, a chime, the flaps |
| H1 | 44.4–47.2 | port | Rotterdam, time-lapse: idle cranes, the anchorage queue growing, cloud shadows | wind, gulls, a far horn |
| S1 | 47.2–49.9 | shelf | The chocolate aisle: prices re-label twice, nearest first | till ticks |
| O1 | 49.9–53.2 | planet | Low over the Gulf of Guinea's old coast: the ocean pours over the rim into the basin | the roar of the falls; a low rising drone |
| O2–O3 | 53.2–60.1 | planet | The whole basin filling (2 days); then the churn where the fronts meet | the big swell, drums |
| W1 | 60.1–68.2 | storm | A container ship in the churned Atlantic, bow slamming into the swell, spray, rain. **65.5–68.2: no narration** | wind, rain, slams sampled from the ship's own motion; the music's peak |
| R1 | 68.2–73.4 | forest | The Congo rainforest at dawn, the same second; it goes, the floor 4 km below | birds, insects; the vanish; the void |
| R2 | 73.4–76.0 | forest | A waterhole at dusk: elephants, a giraffe; an elephant calls; it goes | crickets, the rumble, the call; the vanish |
| C1 | 76.0–83.9 | planet | The turning Earth with the basin full: wind and current lines bend into a new pattern | high winds; an airy progression, bells |
| G1 | 83.9–87.7 | room | An emergency session: officials, the wall map with the basin, "MISSING: 1.58 BILLION" | room tone, keyboards; a slow low tick |
| F4 | 87.7–91.3 | factory | Months later: the dead hall, daylight shafts, the board: LINE 3 · STOPPED · NO PARTS | wind through the hall, a far drip, a dark drone |
| K1 | 91.3–98.1 | phone | A kitchen table at night: calling "Mama", Lagos. Call failed. Call again. Call failed. The recents list: every call failed. The screen dims | the ringing tone, the three rising failure tones, the clock; almost no music |
| L1 | 98.1–108.6 | coast | A European harbour from above, time-lapse over weeks: the sea draws back, boats settle on the mud, kilometres of seabed dry out; on "maps" a dashed line marks the old coast | wind, gulls, the surf getting farther; the progression rebuilds |
| E1 | 108.6–117.1 | planet | The new Earth: an ocean where Africa stood. **113.5–117.1: no narration**, the camera pulls away | F major on "survive"; the final swell, cut to silence on the last frame |

## 3. Sound (all synthesised, seeded)

Four stems (`audio.js`, `sound-music.js`, `sound-amb.js`, `sound-sfx.js`, levels in `mix.js`): voice (the 25 clips,
compressed and levelled), an original score in D minor (string pads, felt piano, low drums, bells), ambience per shot,
and event effects. Music ducks −9 dB under the voice, ambience −6, effects −2.5. A dynamics map lifts the oceans and the
storm and drops the human section back; the narrator is a little softer for the families. A look-ahead true-peak
limiter (`afLimit`) holds the master at −1.5 dBTP. Measured: about −15.5 LUFS integrated, loudness range ≈ 6 LU.

## 4. Review log

(see `EPISODE_REPORT.md`)

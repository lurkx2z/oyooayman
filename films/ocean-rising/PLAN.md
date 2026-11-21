# What if the ocean kept rising and couldn't stop?

A voiceless 16:9 long-form film (4:47) in the house formula (Friction 10 s, Gravity keeps tilting, Sound faster than
light, Everything kept shrinking), with the "kept … and couldn't stop" title the channel's views come from and the
eerie, quiet tone of Slower light. Page: `ocean-rising.html`. Captions: `CAPTIONS.md` → `build-timing.cjs` →
`timing.js`. The story clock (`clock.js`) only runs forward. It jumps only at cuts, and the HUD says "+N MIN LATER".

**Setting (new scenery).** Harrow Rock, a granite islet 22 km off the coast of Maine, with a 47 m stone lighthouse,
the keeper's house, a fog-signal house and a landing with your boat. Thursday 9 September 2027, 6:42 PM EDT: high
water (on the Gulf of Maine high water comes ~11 h after the Moon crosses the meridian, which puts it near 6:42 PM that
evening; a gibbous Moon stands in the south-south-east), the Sun 2° above the sea, setting at 6:52. You are the keeper
(no US light has had a resident keeper since 2023: the keeper, the rock and the town are fictional, said on screen).
Your daughter Isla (12) is in Port Ellery, the harbour town on the coast, with her mum.

## 1. The rule
At 6:42 PM the tide should turn. It doesn't. From then on the sea everywhere on Earth rises 1 metre every minute and
keeps rising. The film's one cheat: the water comes from nowhere (a caption says so). Nothing else changes: the swell,
the Moon, the weight of water, the light.

## 2. The numbers (`physics.js`; `script.js` checks every caption number against it)
- **The sea's height** above high water at 6:42 PM: h = s / 60 m (s = seconds after 6:42 PM).
- **361,000 km³ a minute.** The oceans cover 361.1 million km², so 1 m of sea is 361,100 km³. Every river on Earth
  brings the sea about 37,300 km³ a year (Dai & Trenberth 2002), so one minute's water is 9.7 years of every river.
- **The lamp** is 47 m above high water. At the height caption the sea is at ~2 m: 45 minutes left. It keeps turning
  under the water (a sealed lamp, motor and battery could; said on screen), but its lens can't focus there, so the
  beams spread into a glow, and no light gets out sideways through the surface: from the hill it has gone out.
- **The lichen bands** (supralittoral zonation on North Atlantic granite): rockweed and barnacles below high water,
  black *Verrucaria* up to ~1.6 m, orange *Xanthoria/Caloplaca* in the spray zone up to ~3.6 m, grey lichens above.
  The sea passes the orange at 6:45:36.
- **The boat** is moored by a 1.15 m bow line: the line comes taut with the sea at about +0.57 m, the bow goes under at
  about +0.85 m, and the boat lies on the shelf at the landing's foot (−1.9 m). At the ship beat it is 31 m down.
- **The bell buoy:** 26 m of chain in 18 m of water, so its chain runs out when the sea is 8 m up (6:50 PM).
- **One person in ten** lives less than 10 m above the sea (CIESIN's low-elevation coastal zone, ~10 %).
- **The fog signal** (built 1907): 120 years. Its compressor floods with the sea at +10.8 m.
- **The house's ground floor** fills in 2.8 minutes once the sea is at its door sill.
- **The tower door** (1.0 × 2.0 m, sill at +15.3 m) is rated for storm waves, not a standing sea. With the sea 4 m
  over its top the push on it is ρ·g·A·depth = 1025 × 9.81 × 2 m² × 4.9 m ≈ 9.8 tonnes-force ("10 tonnes"). It gives at
  +21.2 m (7:03 PM). The shaft then fills to the sea's height in ~16 s.
- **The stairs:** 142 steps of 0.188 m: at 1 m a minute the sea climbs one every 11.3 s.
- **The grid:** the coast's substations flood at +27 m (7:09 PM); every light in Port Ellery goes out.
- **All the ice on Earth** melted would raise the sea about 66 m (IPCC AR6: Antarctica 57.9, Greenland 7.4, glaciers
  0.32). At the ice caption the sea is at +33 m: 33 minutes to pass that.
- **The ship:** a container ship 25 km out; you call it and it turns for you at 16 knots (29.6 km/h): 50.6 minutes. On
  the roof it is still 31 minutes away (the HUD rounds to the minute). Its lights show over the sea's curve (masthead ~45 m); its horn is too far to hear.
- **Isla's hill** (240 m): the sea reaches its top at 10:42 PM (shown on the hill's HUD): the truth is hers too.
- **The stairs, again:** when "It has 105 steps to go" shows, the water in the tower is 37 steps up.
- **The hill** over Port Ellery is 240 m high and 24 km from the tower. A light 47 − h m up is visible over the sea's
  curve to 3.85 (√a + √b) km with normal refraction, so Isla sees your light until the sea reaches the lamp.
- **Your phone:** 31 % at 6:42, 4 % on the roof (the HUD and the caption read the same function, `OC_BAT`).

## 3. The beats (28 beats including the title and the question; 52 captions)
title (a fast low run over the swell to the rock) · start (6:42, high tide: it doesn't turn; 1 m a minute; you are
the keeper) · boat (the short line won't let it rise; the knot is already under) · phone (Isla, at 0:36: go up the
hill) · rule (361,000 km³ from nowhere) · height (47 m above high tide: 45 minutes) · lichen (one caption) · radio
(every harbour; you call too, nobody answers) · bell (the buoy's chain, one caption) · world (one in ten, 10 m; then
Isla's text: in the car, going up) · fog (you sound it one last time) · cottage (the sea under the door) · island ·
door (built for waves that hit and fall back; 10 tonnes; you run for the stairs) · burst · dark (all but the lamp, on
its sealed battery) · stairs (a step every 11 s; it never stops; 105 steps to go) · town (Isla walking up; the lights
go out) · lights (yours is the last lighthouse still lit) · ship (the safest place is a boat; yours is 31 m down; you
call the ship: 50 minutes) · ice (66 m, in 33 minutes) · hill (she can see your light; her hill goes under at 10:42 PM)
· lie ("I'm fine") · watch (the radio dies) · gallery (just the light on the open sea) · lamp (it keeps turning under
the water) · roof (the sea at your boots; 4 %; the ship 31 minutes away) · question: "Would you tell her the
truth?"

## 4. Sets and shots (`shots.js`: 53 shots, two sets)
- **The rock** (`set.js`, `island.js`, `station.js`, `world.js`): the islet's terrain with its lichen bands, the
  landing, boat, bell buoy, keeper's house (kitchen, radio), fog-signal house, the tower (door, shaft, 142 stairs,
  power room, watch room, ladder, lantern, lens, gallery, roof), the sea (swell, foam on the rock, clear shallows,
  the lamp's glow under water), the sky (sunset to dusk, the Earth's shadow, a gibbous Moon in the south), the
  far coast and its towns, the container ship (its lights, its hull).
- **The hill** (`hill.js`): Isla, her mum and the crowd on the hilltop over the drowned town, your light far out.

## 5. Sound (`sound-lib.js`, `sound-music.js`, `sound-amb.js`, `sound-sfx.js`; `mix.js`)
- **Music leads.** An original synthesised score: string pads, felt piano, glass bells, a low drum, a synth pulse and
  the endless (Shepard) rise. Its theme is five notes rising a step at a time; each time it returns it starts a step
  higher, until on the roof it stops short. Isla has her own motif (F A C G), and on the hill it turns to D major.
- **Beds by place:** the rock (the swell washing up the rock, gulls, the bell buoy far off), drone views, the house
  (the sea through the walls, a kitchen clock), the tower's shaft (the swell booming on the stone, the lights' hum
  until the dark, the sea churning below), the gallery (wind in the railing), the watch room and lantern (the lamp's
  motor), the roof, the hill (people, sirens in the town). No constant breathing (two breaths at the top of the
  stairs, no more).
- **Effects** at their story moments: texts, the rope and the boat flooding, the radio's mayday calls (and your own call), the bell buoy
  and its last stroke, the fog signal's last blast choking, the door shut and bolted, straining, bursting, the power
  room's sparks, the stairs, the radio dying, the ladder, the lamp going under, the low battery.
- **Mix rules:** music clearly leads, the beds about 10 dB under it measured stem by stem (10 s windows);
  −16 to −14 LUFS integrated; true peak ≤ −1 dBTP.

## 6. Checks and review log
See `EPISODE_REPORT.md`.

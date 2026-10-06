# Killua × Eren in WWII — production plan

A 72-second vertical (9:16, 1080×1920, 30 fps) cinematic crossover edit on the shared engine. Two forces on the same
side walk into a WWII battlefield (a generic WWII-era army, no real insignia, no gore). Killua is speed compression —
calm, tiny, impossible to track. Eren is impact expansion — after a transformation that is an event, the war's scale
changes around him. Every 5–7 s the power, scale or danger goes up; music beats, camera moves, actions and VFX land
together on edit points.

## 1. Rules of the action

- **Killua:** normal speed → a cut-short burst → a 0.25 s slow-motion consequence → he is already somewhere else. The
  camera is close, low, fast; it whips, loses him, finds a flash elsewhere. Electricity is blue-white, thin, local.
- **Eren / the Titan:** wind-up → impact → a brief slow-motion debris moment → aftermath. The camera is low, wide, slow
  and heavy; it shakes only on footsteps and impacts. His colour is warm: orange-white flash, steam, dust, embers.
- **World:** mud brown, charcoal, grey, desaturated green, steel. Particles at three depths (foreground motes, midground
  smoke and dust, background plumes and columns).
- **Slow motion only** for: the bullet miss, the transformation, the tank throw, one Killua strike, the final break.
- **Silence** twice: before the first shot at Killua, and before the transformation.
- **No gore.** Impacts, ragdolls, smoke, debris, electricity, vehicles, the environment.

## 2. The map (metres, north = −Z)

Road along x = 0 · ruined village z +30…−20 (church tower at (−13, −8)) · fields z −20…−75 (tank road) · trench line
z ≈ −80 with a bunker (16, −84) and machine-gun nests (−14, −79), (30, −81) · ridge z ≈ −108 · artillery battery
z ≈ −126 (four guns). Eren transforms by the road at the village edge (−10, −26).

## 3. Beat sheet (film seconds; 120 BPM, a beat every 0.5 s)

| Time | Section | Shots |
|---|---|---|
| 0–5 | Arrival | Wide: the burning valley, a squad and a tank advancing (title). Ground: two small figures stand in the road ahead. |
| 5–12 | The reaction | A soldier squints; the officer halts the squad; Killua, hands in pockets, a spark at his fingertips; Eren's cloak moves. The officer orders fire; a rifle comes up on Killua. Near-silence. |
| 12–19 | **Killua reveal** | Trigger, MUZZLE FLASH (drop) — he is gone; 0.25 s slow-mo: the bullet through empty air, a casing falling, an electric trace. Whip pan: nothing. The tank commander turns — crack — Killua crouched on the tank behind him, calm. Black. The tank dead; Killua looks north; gone. |
| 19–27 | **Transformation** | Eren raises his hand, bites. Silence. A soldier notices. LIGHTNING (orange-white) — white-out, bass; a dust ring, soldiers thrown, the tank rocks, windows burst, steam. The camera struggles upward: a silhouette in the steam. Reveal: tiny soldiers and a tank in front, smoke, the Titan's head near the top of frame. Roar. |
| 27–34 | Eren vs armour | Three tanks fire; a shell bursts on his chest (steam, scorch); he walks on. He grabs one and throws it (slow-mo debris); another reverses and is stomped flat; a commander opens his hatch and stares up. |
| 34–41 | Killua vs the tank column | He runs alongside a moving tank in the village, touches the hull — electricity crawls over it; he leaps to the second (flashes only); the first rolls to a stop, the second turret freezes; the third fires at him — he is behind it. A machine gun cannot track him; he is behind the gunner, who lowers his rifle. A flash races down the trench. |
| 41–49 | Parallel destruction | Cuts of 0.8–1.8 s: a tank thrown · Killua behind the MG · the Titan through the bunker · Killua across a falling wall · the roar through smoke · **AURA WALK**: Killua walks toward us, hands in pockets; behind him the Titan smashes an armoured position, a huge blast; he does not turn. |
| 49–57 | The army adapts | Radio; the battery loads; four guns fire on Eren — explosions all over him, not enough. The barrage on Eren is Killua's opening: flashes cross the field untouched. **SIZE CONTRAST**: Killua at the bottom, wrecks and fleeing soldiers in the middle, the Titan at the top. |
| 57–65 | It fails | The guns go silent one by one through electric flashes. The last armoured push fires; the Titan breaks through; a huge smoke wall. Silence. Soldiers retreat; one trips. |
| 65–72 | **Final poster** | Killua standing on a destroyed tank; the camera reframes; the Titan emerges behind him through the smoke; soldiers retreat in the foreground. *The battlefield never stood a chance.* |

## 4. Quality gate

At least 3 edit-worthy Killua shots (the reveal on the tank, the run alongside the column, the aura walk) and 3 Eren
shots (the reveal through steam, the tank throw, the break through the barrage); 2+ shots with both (the aura walk, the
size contrast, the poster); one transformation; one speed reveal; one poster frame (also the cover).

## 5. Systems

`script.js` (beats, the world clock with slow-motion, the shot list) · `world.js` (the battlefield) · `titan.js` · `cast.js`
(Killua, Eren, soldiers) · `tank.js` · `fx.js` (billboards, ribbons, sparks, debris) · `action.js` (who is where, doing
what, at every world time; events that spawn effects) · `shots.js` (the camera of every shot) · `audio.js` · `film.js`.

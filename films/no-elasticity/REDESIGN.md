# No elasticity: creative redesign (2026-10-08)

This applies the owner's creative direction override ("stop making repetitive videos") to the delivered 60.2 s cut. Plan
first, then build. The working systems stay: the engine, the city, the ball, the montage, the trampoline, the hands, the
people, the HUD, the sound engine and the render pipeline.

## The five questions

1. **What can this episode show that none of our videos have shown?** Time stopping. Every quartz clock counts time with a
   tiny tuning fork that springs back 32,768 times a second. With no elastic recovery, every clock and watch on Earth stopped
   the instant the rule began, one second into the video. Nobody notices, and the day carries on without them.
2. **The most surprising consequence:** your watch stopped at the start of the video, and the reason is elasticity.
3. **The most visually unusual consequence:** you draw a bow, let go, and the arrow just drops at your feet. The limbs stay
   bent and the string hangs limp.
4. **The scene viewers will remember:** the plaza in time-lapse. The sun crosses the sky and shadows swing round, while the
   clock in the foreground never moves. Everything people use keeps the shape they left it in: the trampoline sinks deeper
   after every heavier jumper and the plaza's trees lean further with every gust.
5. **Without the HUD, could someone tell this film from the others?** Yes. There are no cars, aircraft, cranes or crashes,
   and no shot looks down a street. The film shows bouncing, bows, a tuning fork, a watch, the inside of a quartz watch
   and a time-lapse of one plaza.

## The rule's ten most interesting genuine consequences, ranked

Each is scored for surprise, visual clarity and emotional impact (1–5 each), out of 15.

| # | Consequence | S | V | E | Total | Use |
|---|---|---|---|---|---|---|
| 1 | Quartz clocks and watches stop (the crystal is a tiny tuning fork) | 5 | 3 | 5 | 13 | **New: payoff** |
| 2 | A bow can't shoot: the arrow drops | 5 | 5 | 3 | 13 | **New: signature B** |
| 3 | A bouncing ball lands dead | 4 | 5 | 3 | 12 | Keep: signature A |
| 4 | A trampoline becomes a funnel | 3 | 5 | 3 | 11 | Keep |
| 5 | Things that ring go dead (a tuning fork, bells, strings) | 4 | 3 | 3 | 10 | **New** |
| 6 | Everything used keeps the shape of its heaviest use (the plaza by evening) | 3 | 4 | 3 | 10 | **New: payoff image** |
| 7 | Strings, foam, cushions and rubber bands keep every stretch | 2 | 4 | 2 | 8 | Keep (montage) |
| 8 | Car springs ratchet lower at every bump | 3 | 2 | 2 | 7 | Cut |
| 9 | A bridge keeps its deepest sag (mm) | 2 | 1 | 2 | 5 | Cut |
| 10 | A crash doesn't rebound (real crashes barely rebound anyway) | 1 | 4 | 3 | 8 | Cut (template car crash) |

## Three signature moments

- **A, first surprise (kept):** a solid rubber ball lands and stays down, flattened.
- **B, impossible-looking (new):** first person, you draw a bow and let go. Nothing happens to the arrow except that it
  falls off the bow. The limbs stay bent, the string hangs limp, and the target 14 m away is untouched.
- **C, payoff (new):** your watch stopped one second into the video. Inside it, the quartz tuning fork stopped. So did every
  clock on Earth. A time-lapse of the plaza follows: the sun goes down, the frozen clock never moves, and the plaza fills
  with the dents of the day.

The escalation is natural for this rule. It goes from things that bounce (ball), to things that cushion (shoe, cushion),
to things that store energy (trampoline, bow), to things that vibrate (tuning fork), to the vibration that keeps time
(quartz). It ends on the whole world carrying every mark.

## Revised shot list (film seconds)

| Original shot (delivered cut) | Why it feels repetitive | Replacement | Why it is more interesting |
|---|---|---|---|
| 0–5.6 ball hook; 5.6–13.4 montage; 13.4–18.2 trampoline | Not repetitive; this is the episode's own material | **Kept** (a quartz post clock is added to the plaza, and your hands now wear a watch in the rubber-band shot: both stopped at 1.0 s, planted for the payoff) | Plants the twist. Rewatchers can see the clock's second hand stop under the title |
| 18.2–23.5 a red hatch over a speed table, a low wheel shot | The car-on-a-street beat every episode has | **18.2–23.4 The bow.** First person: draw, aim, let go; the arrow drops at your feet; a low insert of the arrow on the paving with the untouched target behind | Impossible-looking and instant to read. Nobody has seen it, and it is pure elasticity (a bow is a spring you load by hand) |
| 23.5–30.7 low cars scraping, a loaded truck on its bump stops | A second and third car beat; looking down the same avenue | **23.4–27.3 The tuning fork.** Seated at a café table you slap the fork's prong flat on the table top; the prong stays pushed in and it goes "tk" instead of ringing | Sound itself depends on springing back. It also sets up the next beat |
| 30.7–36.1 the footbridge (7 mm sag, drawn 300×) | Invisible numbers on generic city infrastructure | **27.3–30.9 Your watch.** You raise your wrist: it stopped at 3:41:52, one second into this video | A personal "wait, what?" twist. It turns the viewer back to the start |
| 36.1–46.0 a three-car crash at an intersection, an arc round the wreck | "Car sliding across intersection", the template destruction payoff | **30.9–37.3 Inside the watch** (macro): past the gears to the quartz crystal, a tuning fork the size of a grain of rice that should spring back 32,768 times a second. It is still | A new environment (a microscopic world) and the hidden spring that runs modern life |
| 46.0–50.0 a 5 km/h tap dents a bumper | One more car beat | **37.3–40.9 The plaza clock**, frozen at 3:41:52: "Every quartz clock on Earth stopped at the same instant" | Scales the twist from your wrist to the planet without any destruction |
| 50.0–60.2 an empty street, then back to the ball close-up | A quiet return to the opening after the strongest event | **40.9–59.6 Time-lapse payoff**, from above the plaza with the frozen clock in the foreground. THE CLOCKS SAY 3:41 PM against THE SUN SAYS 3:42 → 9:04 PM. The sun goes down, building shadows sweep the plaza, people stream through, and the dents pile up: the trampoline sinks deeper after every heavier jumper, the trees lean further with every gust. Dusk, lamps and the clock's dial light up, then the closing lines | The ending is the biggest idea, not a recap. The world keeps the shape of its whole day while time itself has stopped |

The cut code stays in the repository: cars, crash and footbridge in `cars.js` and `city.js`, switched off by `NE_STREET`.

## Physics notes for the new beats

- **Bow:** the limbs store the draw as elastic bending and give it back to the arrow (a recurve shoots at about 55–60 m/s,
  about 200 km/h). Without recovery, drawing still takes the full force (the limbs resist), but on release nothing pushes
  back. The string goes slack and the arrow drops.
- **Tuning fork:** an A4 fork sings at 440 Hz because its prongs spring back. Now a strike just pushes them in, and they stay.
- **Quartz:** a watch crystal is a quartz tuning fork a few millimetres long that resonates at 32,768 Hz (2¹⁵). The watch
  counts those vibrations to step its second hand. With no elastic restoring force there is no oscillation, so the count
  stops. This holds for every quartz clock and watch, and for wind-up ones too (their hairspring is a spring).
- **Time-lapse:** each object keeps the running maximum of what it was loaded with. The trampoline gets deeper only when
  someone heavier lands (a lighter kid changes nothing). A tree bends in a gust like a tree today, but no longer straightens
  afterwards, so its lean only ever grows, gust by gust. Nothing recovers overnight.
- **Why no flat basketballs:** an inflated ball is held round by the air inside it, and air is unchanged, so a basketball
  still bounces (a bit worse, since its rubber skin no longer helps). The film uses a solid rubber ball instead.
- **Not claimed:** phones, computers and cars (many use quartz too; left for the comments; no moving vehicles are shown).
  The closing note says: people, air and water are unchanged.

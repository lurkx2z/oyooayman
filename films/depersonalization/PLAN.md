# What weed-induced depersonalization can feel like — production plan

A 74-second vertical (9:16, 1080×1920, 30 fps) first-person film on the shared engine.
**Retention has equal priority to accuracy and look**: the title and the story start together, something new happens
every 2–3 seconds, and each section ends on an open question that the next one answers.

**Framing (non-negotiable):** a respectful simulation of what depersonalization / derealization *can* feel like for
*some* people after cannabis. The world stays ordinary; the friends stay kind and normal; there are no monsters, faces,
glitch spam or "going crazy" clichés. The fear comes from feeling detached from yourself and from a reality that looks
right but feels wrong — and from anxiety feeding on it. It ends calmer, with a small, unalarming note.

## 1. Shape of the film

```
NORMAL → SLIGHTLY OFF → BODY FEELS UNFAMILIAR → MIRROR → WORLD FEELS UNREAL → TIME STRETCHES
       → (mid reset) PANIC MAKES IT STRONGER → THE CHECKING LOOP (climax) → QUIET COMEDOWN → NOTE
```

Open loops (answer → new question):

| t | Question left open |
|---|---|
| 11 s | *So what happens in a mirror?* |
| 21 s | *And then the world starts feeling wrong too.* |
| 34 s | *It looks normal. So why does it feel fake?* |
| 46 s | *The feeling isn't always the worst part.* → *The panic can make it stronger.* |
| 61 s | *The more you check…* → *…the stranger it can feel.* (payoff) |

Pattern interrupts roughly every 5–8 s: look-down at hands (5.2), stand-up / cut to the hall (12.5), mirror reveal (14),
audio drop-out (22.5), dolly-zoom in the hallway (25), friends' motion going slow (28), phone clock (37),
"you good?" (42), heartbeat entering (47), loop cuts (56–64), sit-down and sound clearing (66).

## 2. Shot list

| # | Time | Shot | What we SEE (works with sound off) | What we HEAR | Caption / HUD |
|---|---|---|---|---|---|
| **1** | **0–13** | **Living room → hands** | | | |
| 1a | 0.0–3.8 | On the couch at night with two friends: Jay in the armchair mid-story, gesturing; Mia on a beanbag laughing at her phone; TV glow, floor lamp, faint haze. At ~2.2 s Jay's gesture lags for half a second — barely noticeable. | Lo-fi music from a speaker, room tone, Jay talking, both laugh; your own short laugh. At 2.2 the laugh trails a fraction late. | **TITLE (big, 0.2–3.8):** WHAT WEED-INDUCED / DEPERSONALIZATION / CAN FEEL LIKE |
| 1b | 3.9–5.6 | Jay turns to you and says something. You lean in; the room seems to stretch away behind him (dolly-zoom); colour drains a little; Jay's motion goes slightly slow. | His line starts clear, then drops away: muffled, farther, roomier. Faint ringing begins. | *At first, everything feels normal.* |
| 1c | 5.2–7.6 | Sudden look-down: your hands resting on your jeans. They lift, palms up. | Fabric rustle; your breathing becomes audible. | *Then your own body starts feeling unfamiliar.* · SENSE OF SELF 100 % → 78 % |
| 1d | 7.7–11.0 | The hands turn over, fingers flex — slightly lagging, edges soft. | Ringing a little higher, room thinner. | *You know those are your hands.* → *They just don't feel like yours.* |
| 1e | 11.1–13.0 | You look up toward the hallway and stand. | Couch creak, the room muffled. | *So what happens in a mirror?* |
| **2** | **13–22** | **Mirror (≤ 9 s)** | Hallway → bathroom: you step up to the mirror; your reflection (grey hoodie, tired face) is exactly right. You raise a hand; it does too. Pause. Then you turn away. | Bathroom acoustic: close, dry; tap drip; breathing. | *Everything looks right.* → *But it doesn't feel like you.* |
| **3** | **22–36** | **Derealization, layered** | 22–25 hall: sound drops out; 25–28 the hall stretches (depth wrong); 28–31 back in the living room: friends laughing, but their motion slow and far; 31–34 the room looks flat, like a set; 34–36 you touch the wall. | Audio thins to a distant hum; voices sound "behind glass". | *It can start feeling like a dream…* → *…or weirdly far away.* → *It looks normal. So why does it feel fake?* · REALITY FEEL NORMAL → DISTANT |
| **4** | **36–46** | **Time** | Phone check: 11:47. Look away (friends, window). Look back: still 11:47. TIME SINCE CHECK 00:12. Jay: "You good?" (subtitle) — his face kind, normal, but far. | His voice clear but distant; your answer is a muffled "yeah". | *Seconds can feel strangely long.* |
| **5** | **46–56** | **Panic (mid reset, second act)** | Heartbeat enters; checking: hand on chest, touching your face, gripping the counter; camera hesitates; vignette tightens. | Heartbeat, tighter breathing, room nearly gone. | *The feeling isn't always the worst part.* → *The panic can make it stronger.* · ANXIETY ↑ |
| **6** | **56–66** | **The loop (climax, fastest)** | 0.7–1.5 s cuts: hands / mirror / clock / Jay / phone / wall / hands. | Each cut: a breath, a heartbeat; sound gets more internal. | *Do I feel normal?* → *Why don't I feel normal?* → *Am I stuck like this?* → *The more you check…* → *…the stranger it can feel.* |
| **7** | **66–74** | **Comedown + note** | You sit on the couch; Mia sits quietly beside you; breathing slows; colour and sound return a little. | Room tone clearer, the music back, a calm low note. | *Nothing around you actually changed.* → *But it felt like everything did.* → small: *If it continues after the high wears off, talk to a healthcare professional.* |

## 3. Sets (one apartment, built once; cuts are camera jumps)

| Set | Where (world) | Contents |
|---|---|---|
| Living room | x −3…3, z −2.6…2.6 | couch (you), armchair (Jay), beanbag (Mia), coffee table (cans, snacks, a grinder and lighter — implied, never featured), TV on a media unit, floor lamp, fairy lights, window with the night city, bookshelf, speaker, plants, rug |
| Hallway | x −6…−3, z 0.5…1.7 | narrow, coats on hooks, framed print, a switch; the derealization dolly-zoom happens here |
| Bathroom | x −8.4…−6, z −0.2…2.4 | sink and counter, **real planar mirror** with your reflected body, towel, toothbrush cup, tiles |
| Kitchen nook | living room north-west | counter to grip, wall clock, microwave clock |

## 4. Systems

- **Reuse:** CameraController (seated / standing / steps), ViewerHands (adult, grey hoodie sleeves), StoryHUD (+ a big-title style),
  PostProcessing (saturation, contrast, vignette, edge blur, soft focus, tunnel, chroma), AudioEngine + SoundKit, baked soundtrack,
  the cast system from *Before Screens* (`films/before-screens/children.js`, adult looks), deterministic timeline, dev controls, render tools.
- **New:** `Mirror` (planar reflection render target, oblique clipping), a self-avatar seen only in reflections (layers),
  per-person time warp (friends' motion lagging / slowing), hands aimed at world points (resting on your thighs, gripping the counter),
  a "detachment" grade track driving desaturation, flatness, vignette, edge blur and focus breathing, a world-sound bus that can be
  muffled / distanced while breathing, heartbeat and ringing stay close.

## 5. Effect language (all subtle)

| Feeling | Picture | Sound |
|---|---|---|
| something's off | half-second motion lag on Jay | his laugh trails late |
| far away | lean-in dolly-zoom; wider lens | low-pass + more room on voices |
| body unfamiliar | hand motion slightly lagging, soft edges, cooler skin | breathing in your head |
| unreal / flat | desaturation, lower contrast, less warm light | room tone thins |
| time stretches | friends slow to ~0.6× | sounds smeared |
| panic | tighter vignette, camera hesitation | heartbeat, short breaths |
| comedown | colour back, contrast back | world sound clears |

## 6. Assets

Everything is procedural. Optional upgrades (drop-in, not required):

| Asset | Format | Search terms | Used in |
|---|---|---|---|
| Real recorded voice lines ("dude, you good?", casual chatter, laughs) | WAV/MP3, mono, dry | record two friends, or "casual conversation room tone CC0", "male laugh CC0" | Jay/Mia lines (the formant-synth voices are placeholders) |
| Lo-fi loop | WAV/MP3, CC0 / royalty-free | "lofi hip hop loop CC0" | the speaker music |

## 7. Phases and review

| Phase | Seconds | Content | Status |
|---|---|---|---|
| 1 | 0–13 | hook, title, voice drop-out, hands, open loop to the mirror | building |
| 2 | 13–36 | mirror, derealization | |
| 3 | 36–56 | time, panic | |
| 4 | 56–74 | loop, comedown, note | |

After each preview: a section-by-section retention audit (0–2, 2–5, 5–10, 10–15, 15–25 … end: what's new, what happens,
what's left open, why keep watching, dead time, could it be shorter), and swipe-away timestamps from independent
reviewers (normal viewer, retention, mental-health sensitivity, cinematography). Scores are never inflated; low scores
mean changing the film.

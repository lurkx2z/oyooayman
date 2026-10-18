# What if your car could fly? — the long cut (16:9, 8:07)

Narrated widescreen documentary, 486.9 s, voice by Charlie (ElevenLabs, `NARRATION.md`, 53 clips). Page:
`tesla-flying-roadster-long-michael.html`. A separate film from the 2:32 vertical short (`films/tesla-flying-roadster/`), which
is unchanged. Owner's ask (2026-10-17): "make it long form 8 min video".

Physics and sources: the same as the short (`films/tesla-flying-roadster/PLAN.md` § 1). The long cut adds the race-car
ceiling question, the loop speed, the fan-car history (Chaparral 2J 1970, Brabham BT46B 1978, McMurtry Spéirling 2025),
a space-walk Newton's-third-law demo, the "what if it tried to hover" estimate, the reality check (shown vs promised,
2017 → 2028 timeline) and a closing first-person passage ("what would it be like inside").

## Structure (beats in `script.js`, shots in `shots.js`)

| Time | Section | Sets / modes |
|---|---|---|
| 0:00–0:57 | Cold open, title, the demo, the claims | site: cold, title, when, did, run, claims |
| 0:57–1:15 | Replay in slow motion, three ways to beat gravity | site: replay |
| 1:15–2:16 | Way 1: a wing. Inverted flight, the stall | sky |
| 2:16–2:41 | Race cars, the ceiling idea, the catch (slow down, grip gone) | track: race, theory, catch |
| 2:41–3:24 | The loop: a toy loop, the loop speed, the flat ceiling | toy; site: loopspeed, flat |
| 3:24–4:56 | Way 2: suction. 2 g, 7 kPa, the fan cars, needs a surface | site: ex; track: chap70, fan78, mcm |
| 4:56–5:45 | Way 3: thrust. Newton in space, cold gas, nozzles, the brake burst | space; site: ex |
| 5:45–6:59 | What if it hovered (seconds), helicopter, bottle rocket, the hop | site: hover, heli, bottle, hop |
| 6:59–7:42 | Reality check: shown vs promised, timeline, legal | site: real, legal |
| 7:42–8:07 | You: a human on board, the harness, POV | site: human, pov |

Rules kept: narration pauses while action plays; no static shot ~15 s; every narrated phenomenon is shown; tags say
RECONSTRUCTION / ILLUSTRATION / OUR ESTIMATE wherever the picture is not the real thing.

## Sound
Stems voice / music / amb / sfx (`sound-*.js`, `sound-worlds.js` for the track, desk and space), mix in `mix.js`
(targets −16 to −14 LUFS, ≤ −1 dBTP, a real loudness range). Baked into `soundtrack.js`; mastered
`final-soundtrack.m4a` / `small-soundtrack.m4a` for the GPU render.

## Render
`node films/tesla-flying-roadster-long-michael/render-gpu.cjs --channel chrome` on the owner's PC → `renders/tesla-flying-roadster-long-michael/`.

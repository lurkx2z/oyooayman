# Asset guide

> **Reality check first:** this project contains **zero external model, texture or sound files.** Every mesh is built
> in code, every texture is drawn on a canvas, every sound is synthesised. GLB/GLTF assets were requested several times
> in briefs (people, first-person arms, buildings, kites); none was supplied, so authored procedural versions were built
> instead. **GLB loading is not implemented** (the bundled three.js has no GLTFLoader). Read § 6 before adding any
> external asset.

## 1. Asset sources (current)

| Kind | Source | Where |
|---|---|---|
| Geometry | procedural: lofts (`loftGeo`, `smoothLoft`, `facetBall`), extrusions (vehicle profiles), boxes and quads batched per material | `js/world/*`, `js/camera/viewerHands.js`, `films/<slug>/*` |
| Textures | `Tex.*` canvas generators (facades, storefronts, asphalt, sidewalk, signs, labels, billboards) + film-specific canvases (moon albedo baked on the GPU, Earth maps, phone screens) | `js/core/textures.js`, films |
| Fonts | Inter, Lora, Oswald, JetBrains Mono, Latin subsets as **data URIs** in `fonts/fonts.css` (SIL OFL, `fonts/OFL.txt`) | `fonts/` |
| Sound | Web Audio synthesis rendered offline; baked to MP3 inside `films/<slug>/soundtrack.js` | `js/audio/audioEngine.js`, films |
| Three.js | r186, bundled as a classic global with `mergeGeometries` and `RoundedBoxGeometry` (MIT, `lib/THREE-LICENSE.txt`) | `lib/three.bundle.min.js` |

## 2. Conventions for procedural assets

- **Units:** metres, seconds, degrees in scripts (radians in code). Y up.
- **World axes:** the camera's default view is −Z. The street runs along Z (Oxygen `LAYOUT`: road `|x| ≤ 7`,
  building fronts at `|x| = 12.5`, curb height 0.15). Right-hand traffic (vehicles heading −Z use +X lanes).
- **Vehicles:** local forward +X, up +Y, right +Z, origin at ground centre. Face a yaw with `rotation.y = yaw + π/2`.
- **People:** the rig faces +Z in local space; `root.rotation.y = π + faceθ`. Adult scale is 0.94–1.06 per person
  (seeded). Children use `scale` + `BUILDS.kid…` (films/before-screens/children.js). Eye height ≈ 1.62–1.70 m for adult
  POV, 1.25–1.4 for a child.
- **Naming** (rules key off names):
  - material names containing `glass` → glossy glass rule;
  - root names `veh:*` → vehicle gloss and lighter grime;
  - `person:*` → skipped by grime.
  - Film objects: name them for the debug isolate trick (hide objects one by one to find a stray artefact; the
    Oxygen "white blob" was found this way in vehicle `n1a`).
- **Materials:**
  - `Mat.std(color, opts)` (cached MeshStandardMaterial);
  - environment roughness ≥ 0.75; cars 0.42–0.6 with clearcoat; glass ≤ 0.12; metal 0.25–0.5.
  - Run `Look.apply(scene, camera)` once after building.
  - Vertex colours for cheap variation (tree crowns darker underneath).
  - Flat shading for faceted low-poly (people, foliage); smooth for hero hands.
- **Batching:** static scenery goes into `Batcher` (one mesh per material). Repeated dynamic things use `InstancedMesh`
  (debris, particles, rain streaks, shards, grass blades: Before Screens has 7,000).
- **Winding:** `Geo.quad(a,b,c,d)` takes BL, BR, TR, TL as seen from the front. Reversed winding = invisible
  (curbs, storefronts, seabed and water were all invisible once for this reason). For lofts with reversed rings, reverse
  the ring order (`xLimb` in Crossover).
- **Indexed vs non-indexed:** `Batcher` converts to non-indexed (`Geo.prep`). Check `g.index` before `toNonIndexed()`
  to avoid warning spam.
- **Determinism:** any variation comes from `RNG(seed).fork(salt)` at build time, or `hash1/hash2` at runtime.

## 3. Character requirements (what "good enough" means here)

- **3–5 reusable body variants** with different builds, real shoulder width, tapered faceted limbs, joint caps, shoes
  with soles, clothing layers, accessories. Silhouette over detail.
- Muted clothing palettes (`LOOKS` in `js/world/people.js`). Add film looks with `Object.assign(LOOKS, {…})`.
- **Faces optional** for crowds. A **hero face** for close-ups (`js/world/heroes.js`: eye whites, irises with
  texture, pupils aiming at the lens, lids/blinks, brows, lips, talking) used by the Sim's aware NPC, the Game NPC and the
  Crossover officer.
- Never let a crowd animate in sync. Vary start times, speeds, strides and reactions per person (seeded).
- Stylised named characters (Killua, Eren, the Titan) need their signature silhouette features (hair shape, cloak
  emblem, mane, green eyes). The first versions read as generic ("Jack Frost hair", "orange bodybuilder golem") until
  those were added.

## 4. Vehicle, tree and first-person arm requirements

- **Vehicles:** at least 3–4 body types per scene, muted colours, satin paint, dark glass, working lights
  (tail/brake/hazard), wheels that rotate with distance. Add spoke decals or blur discs when spin matters.
- **Trees:** a few large faceted puffs per crown (round + columnar variants), darker underside, 2–3 branches, varied
  size and rotation. Never spheres on sticks; never shard piles. Air bends trees in the vertex shader
  (`onBeforeCompile` + `customDepthMaterial` so shadows bend too).
- **First-person arms:**
  - must have a sleeve + cuff, a wrist, a palm with a thenar pad, three-segment fingers with nails, a two-joint thumb;
  - smooth shading, muted colours, skin-tone nails, scale 0.84 (child) to 1.08 (adult).
  - Poses are authored in camera space (wrist p, finger direction F, palm normal N, curls). Bad hands are worse than no
    hands: hide them (`hidden`) rather than show a broken pose.
- **Legs:** optional, per film (`FrLegs`, `SlLegs`), visible only when looking down. Jeans + a real trainer shape (a
  placeholder shoe was flagged in Friction v1).

## 5. Bad asset patterns we hit (don't repeat)

| Pattern | Seen in | Fix |
|---|---|---|
| Capsule/tube people with sphere heads and mitten hands | Oxygen v1–v3 | authored low-poly parts (V4) |
| Blocky procedural first-person hand | Oxygen v1–v3 | removed, then the authored `smoothLoft` arm |
| Finger joint spheres z-fighting | authored arm v1 | segments overlap their joints instead |
| "Piles of broken triangles" trees | Oxygen V3/V4 close-ups | clean faceted crowns |
| Perfectly regular facade window grids | Oxygen V3 | facade dressing near the camera (reveals, sills, AC units, fire escapes, pipes, signs) |
| Box boats / flat olive slab seabed / ruler-straight waterline | Slip v1 coast | rounded hulls tipping 35–55°, glossy mud with pools, curving bars |
| A flat blue wall tsunami | Slip v1 | GPU-deformed body + pitching lip from one profile, colour ramp, foam bands, spray, debris |
| Hair as ice shards / cat-ear tufts | Crossover v1 | soft clumps / tufts pointing down |
| Huge white circles for torch flames | Before Screens | small orange billboards |
| Hard-edged band in the sky from square smoke sprites | Crossover | sprites fade to nothing before their edge |
| "See-through smoke discs" | Friction v1 | smaller, greyer, fewer, hanging smoke |

## 6. If external assets are introduced (not done yet; NEEDS the owner's go-ahead)

The owner's original asset rule: *"If you can make a convincing asset procedurally, do it. If an external asset is truly
necessary: tell me exactly what is needed, what format, what search terms, and where it will be used."* Past asks were
phrased like this: *"a CC0 low-poly first-person arm-and-hand model with a sleeve, as a `.glb`, ideally rigged …
roughly 2–5k triangles. Search 'low poly first person arms rigged CC0' on Poly Pizza, Quaternius or Sketchfab (CC0
filter)."*

If you do add GLBs:
- **Licence:** CC0 / public domain only (Quaternius, Kenney, Poly Pizza CC0). Record the source and licence in a
  `CREDITS.md` next to the asset. The repo is public.
- **Format:** `.glb` (binary glTF), ≤ 2–5k triangles for hero props/arms, ≤ 10k for a hero character, metres, Y-up,
  +Z forward (or document the rotation), origin at the feet / ground centre.
- **Loading from `file://`:** `fetch()` of local files is blocked in Chrome. You must (a) add GLTFLoader to the bundle
  in `lib/` (rebuild the classic-script bundle) and (b) embed each GLB as base64 in a `.js` file
  (`window.ASSET_X = 'data:model/gltf-binary;base64,…'`) and parse it with `loader.parse(arrayBuffer, …)`.
  Fonts were bundled as data URIs for exactly this reason.
- **Style match:** strip or replace PBR textures with flat colours/vertex colours so the asset matches the procedural
  world. Run `Look.surface` rules. Never mix photoreal assets into the stylised world.
- **Cloning/instancing:** clone a parsed scene with `SkeletonUtils.clone` (needs bundling too) for skinned meshes, or
  share geometry/material and use `InstancedMesh` for static ones.
- Keep a procedural fallback so pages never break if an asset is missing.
- **Recorded sound** was listed as an optional upgrade (tyre screech, crash, city ambience, siren: WAV 48 kHz, CC0,
  freesound) but never used. Same embedding rules apply.

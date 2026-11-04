# The Last Lantern (starter)

A story-driven 3D action game starter: a playable vertical slice with a village, an NPC with branching
dialogue, a quest, melee combat against enemies, and a climactic beacon to light. Remotion cutscenes are
rendered from code and play in-game.

```
epic-game/
├── game/        Vite + React Three Fiber game (play this)
└── cutscenes/   Remotion project; renders MP4s into game/public/cutscenes/
```

## Play it

Online: https://claude.ai/artifact/2HRzucp8zqq9U4NjqMJdjv (private to the owner until shared from its Share menu).
Works on desktop (keyboard) and phones (on-screen stick and buttons).

## Run it

```bash
cd game && npm install && npm run dev      # open http://localhost:5173
```

Controls: **WASD** move · **Space** jump · **F** / click punch · **Q** / right-click throw bottle · **C** drink · **E** interact · **Space/Enter** advance dialogue · **1–9** pick a choice · **R** restart after death.

## The stack

| Piece | Library | Where |
|---|---|---|
| 3D rendering | `three`, `@react-three/fiber`, `@react-three/drei` | `game/src/App.tsx`, `world/` |
| Physics | `@react-three/rapier` | `world/Player.tsx`, `world/Enemies.tsx`, `world/Level.tsx` |
| Glow / mood | `@react-three/postprocessing` (bloom, vignette) | `App.tsx` |
| Game state | `zustand` | `store.ts` |
| Story & dialogue | `inkjs` (Ink scripting language) | `story/story.ink` |
| Cutscenes | `remotion`, `@remotion/three` | `cutscenes/src/` |

## Gimlet (the hero)

Gimlet is built entirely in code in `game/src/gimlet/`: `Gimlet.tsx` is the model and its procedural
animation rig (idle slouch, run, punch, overhand throw, drink, frenzy), and `textures.ts` paints the
tie-dye, plaid, tattoo sleeve and "Danger & Sons" bottle labels onto canvases.
Open **http://localhost:5173/?view=gimlet** (or `?view=saz`) for a turntable viewer with buttons for each move.

His kit (tuning constants at the top of `store.ts`):

- **Bottles**: holds 2, thrown in an arc with real physics, shatter for area damage, refill every 3.5 s
- **Frenzy meter** fills while he **stands still** (slow), **hides in reeds** (faster, and enemies lose
  track of him), or **drinks** a bottle (fastest, but he's rooted and takes double damage)
- **Frenzy** (8 s): faster movement, double damage, faster punches, unlimited bottles, heals 1 heart,
  and he glows

## Character handover kits

`handover/gimlet/`, `handover/saz/` and `handover/kiai/` each hold everything needed to take that character to another
project or another Claude: a `*_HANDOVER.md` (character bible, rig notes, full source), a `.glb` model with
named joints, and the concept art. Re-export a model any time with the **Export .glb** button in the
character viewer (`?view=gimlet`, `?view=saz` or `?view=kiai`).

## Kiai (playable)

Pick her on the title screen. Built in `game/src/characters/kiai/`: the model with IK-driven arms
(`Kiai.tsx`), her keytar with individually pressable keys (`Keytar.tsx`), painted textures and tattoos
(`textures.ts`), and her two original songs plus a Web Audio synth (`music.ts`).
- **Harmony** (Q / right-click): charms Hollow ones within 7 m; twice-charmed ones switch sides and go cuddle
  other Hollow ones until those switch too.
- **Shred** (F / click): a 7 m distorted shockwave cone that destroys them.
When you play Gimlet, she's in the village instead.

## The valley

`game/src/world/Nature.tsx` grows the scenery with instancing: about 240 trees (oak, blossom, pine, birch),
flower meadows, 3,200 grass tufts, bushes, a lily pond and butterflies. The sun follows the hero so shadows
stay sharp.

## Saz

Gimlet's friend in the village, built in `game/src/characters/Saz.tsx` (textures and his word-cloud
tattoo sleeve in `sazTextures.ts`). He waves when you come near, talks during his conversation and dances
once the beacon is lit. Shared building blocks for both characters (fingered hands, fabric textures, body
shapes) live in `game/src/characters/parts.tsx`.

## Writing story

All dialogue lives in `game/src/story/story.ink`. Write `Name: line` for spoken lines; anything else is narration.
Choices are `* [choice text]`. The game and the script share variables:

- the script sets `quest_accepted` and `beacon_lit` (the game spawns enemies and lights the beacon from these)
- the game sets `enemies_left` before each conversation

To add a new interaction, add a knot to the `.ink` file (`=== my_knot ===`) and a proximity check in
`Interactions` (`world/Level.tsx`) that calls `setPrompt({ label, knot: 'my_knot' })`.
Inky (inklestudios.com/ink) is a good editor for previewing branches.

## Using your own hero model

Put a rigged glTF character at `game/public/models/hero.glb`. It replaces the placeholder automatically,
is scaled to about 1.7 m, and animation clips are picked by name: one containing `idle`, one with `run` or
`walk`, and optionally `attack`/`slash`/`punch`. Mixamo → Blender → export as glTF Binary works well.
Only use models you have the rights to (your own, CC0/CC-BY, or properly licensed). Fan uploads of
studio characters usually aren't.

## Cutscenes

```bash
cd cutscenes && npm install
npm run studio              # live preview/editor
npm run render:prologue     # writes ../game/public/cutscenes/prologue.mp4
```

The title screen plays `prologue.mp4` if present. In a container without Chrome, add
`--browser-executable=/path/to/chromium --gl=swangle` to the render command.

## Debugging

In dev builds, `__game.getState()` and `__player.position` are on `window`.

## Next steps

- Precompile the Ink story to JSON for production (`inklecate`), rather than compiling at startup
- Swap the placeholder meshes for real assets (Kenney, Quaternius, Poly Haven are free)
- Add audio with `howler`, and a timeline tool such as `theatre.js` for in-engine cutscenes
- Code-split the bundle (`build` warns about chunk size)

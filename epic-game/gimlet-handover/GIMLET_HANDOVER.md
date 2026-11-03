# Gimlet: Character Handover

This file is a complete handover for **Gimlet**, an original character created by the project owner
for the game *The Last Lantern*. Give this file (plus the files listed below) to another Claude
conversation and it has everything needed to rebuild, extend or reuse him.

## Files in this kit

| File | What it is |
|---|---|
| `GIMLET_HANDOVER.md` | This document: character bible, gameplay kit, rig notes and full source code |
| `gimlet.glb` | The 3D model as a standard glTF binary. Opens in Blender, three.js, Godot, Unity (via glTF importer), Babylon.js, and online glTF viewers |
| `gimlet-concept.png` | The original concept art. **This is the design reference: when in doubt, match it** |

## Who he is

- **Name:** Gimlet
- **Role:** Player character. A wandering seller of "Danger & Sons" bottles who ends up relighting the beacon of Emberfall.
- **Personality:** Laid-back, cocky, unbothered. A smug half-smile, one eyebrow cocked, talks like
  he already knows how this ends. Funny under pressure. Loyal once he commits.
- **Voice samples** (from the game script):
  - "Saw it. Figured somebody forgot to pay the light bill."
  - "Just passing through. Places to be, bottles to sell."
  - "Danger and Sons. We deliver."
  - "First round's on me."
- **Brand:** "Danger & Sons" is his own bottle label (cream label, brown border, script lettering, a
  little mascot in sunglasses).

## Look (from the concept art)

**Silhouette:** tall, lanky, wiry-muscular. Relaxed slouch with the hips forward and the upper body leaning
back. Arms hang slightly away from the body, feet planted apart. Huge baggy pants make the lower half
much wider than the torso.

| Part | Description | Colour(s) |
|---|---|---|
| Skin | Warm tan | `#c98a5e` |
| Hair | Messy, voluminous mullet, swept fringe, longer at the back | pale sage-blond `#c9d09b` |
| Face | Narrow, sharp jaw. Half-lidded eyes, one eyebrow raised. Thin curled mustache, small goatee, smirk. Small hoop earrings | facial hair `#2b1d14` |
| Neck | Small script/feather tattoo on the side of the neck | dark ink |
| Top | Ragged tie-dye tank top with a big spiral on the chest, deep armholes, a couple of worn holes near the hem | purple `#9b6cb5`, lime `#d8d877`, olive `#a7ad5e`, lilac `#c39ad0` |
| Necklace | Red cord with two small round beads | cord `#a3262a`, beads `#d9b77a` |
| Arms | His **left** arm has a full tattoo sleeve (wings, swirls, stars, a football). His **right** wrist has stacked string bracelets | ink `rgba(40,28,24)`, bracelets red/blue/yellow |
| Hands | Silver ring on the left hand | `#b8bcc4` |
| Underwear | Blue-and-white plaid boxers showing above the belt | `#304eaa` on `#e9edf5` |
| Belt | Wide, worn brown leather belt, square silver buckle | `#6b3f22` |
| Holsters | One leather holster on each hip, each holding a green glass "Danger & Sons" bottle with a cork | glass `#2f5c3c`, cork `#b08454` |
| Pants | Very baggy burnt-orange work/track pants, dusty and worn, two pale stripes down the outer side of each leg, cargo pocket, cuffs bunched over the shoes | `#c8642c`, stripes `#e7cba4` |
| Shoes | Chunky high-top-style sneakers in cream and sage with **glowing neon-green soles** | `#c9c3ac`, `#7e9670`, soles `#a4ff4c` (emissive) |

**Design guardrails:** keep the tattoos generic (no real club crests or logos) and the sneakers unbranded
(no swoosh-style marks). The neon soles are his visual signature, so they should always glow at least a little.

## Gameplay kit

All numbers are the current tuning in the game (`game/src/store.ts`).

- **Punch** (melee): range 2.4 m, 1 damage, 380 ms cooldown.
- **Bottle throw:** he holds **2 bottles**, shown in his hip holsters. A thrown bottle flies in an arc
  (forward 11 m/s, up 5.5 m/s, real physics), shatters on the first thing it hits, and splashes green for
  **1 damage to every enemy within 2.8 m**. 450 ms cooldown. Bottles **refill one at a time every 3.5 s**.
- **Frenzy meter** (0–100) fills from three sources that stack:
  - **Standing still:** +7 per second
  - **Hiding** (inside tall reeds): +14 per second. Enemies more than 2.5 m away lose track of him.
  - **Drinking a bottle:** +45 per second for 1.6 s. Uses a bottle, **roots him in place**, and he takes
    **double damage** while drinking. High risk, fastest payoff.
  - Moving in the open with none of the above drains it at 3 per second.
- **Frenzy** (when the meter hits 100) lasts **8 s**:
  - movement speed ×1.6
  - punches do 2 damage, reach 30% further and recover twice as fast
  - bottles are free (unlimited) and throw twice as fast
  - heals 1 heart when it starts
  - visuals: hair and eyes glow green, the soles flare, a pulsing green aura, slight camera shake and a
    green screen-edge vignette

Design intent: Gimlet is a **patience-and-burst** character. You play him by finding a safe moment (cover,
stillness, or a risky drink) to build up, then unleashing a short, overpowered frenzy.

## Rig and animation

The model is a hierarchy of named joints. Rotate them to pose him. These names are the same in
`gimlet.glb` and in the code:

```
Gimlet                 (root, feet at y = 0, faces +Z, about 2 m tall including hair)
└─ hips                (y = 1.0)
   ├─ thigh_L ─ knee_L     (shin, cuff and sneaker hang below the knee)
   ├─ thigh_R ─ knee_R
   └─ spine
      ├─ shoulder_L ─ elbow_L   (tattooed arm, ring hand)
      ├─ shoulder_R ─ elbow_R   (bracelet arm, throwing arm)
      └─ head
```

"Left" and "right" are **his** left and right. Limbs hang straight down at rest.
- Rotating a shoulder or thigh negatively around X swings it forward.
- Rotating a knee positively around X bends the shin back.
- Rotating `shoulder_L` positively around Z (or `shoulder_R` negatively) moves the arm out to the side.

**Procedural animations in the code** (no keyframes; everything is computed each frame from a small
state object, `GimletPose`):

| Move | What it looks like |
|---|---|
| Idle | Leans back, weight on one leg, slow sway, head tilted with a smug angle |
| Run | Leans forward, legs and arms swing in opposition, hips bob and twist |
| Punch | Right arm drives straight forward with a torso twist (260 ms) |
| Throw | Right arm winds up behind the head holding a bottle, then whips over the top (450 ms) |
| Drink | Left arm lifts a bottle to his mouth, head tips back (1.6 s) |
| Frenzy | Hunched forward, arms flared out, slight shake, everything glows |

**About `gimlet.glb`:** it is a static model in his idle pose with the named joints above. It has no
skinning and no animation clips, because each body part is a separate rigid mesh parented to a joint, like
an action figure. That's enough to pose or animate him by rotating joints in any engine. For a smooth,
deformable body with Mixamo-style animations, use the GLB and the concept art as reference and sculpt
or retopologise a single skinned mesh in Blender. The file also contains one stray point light (from his
frenzy glow) set to zero intensity, which you can delete.

## Using the code

The code is React Three Fiber (React + three.js). It depends on `react`, `three`, `@react-three/fiber`
and (for the viewer only) `@react-three/drei`. There are no image files; every texture is painted onto a
canvas in `textures.ts`.

Minimal usage:

```tsx
import { Canvas } from '@react-three/fiber'
import { Gimlet, type GimletPose } from './Gimlet'

const pose: GimletPose = {
  moving: false, frenzy: false, bottles: 2,
  attackAt: 0, throwAt: 0, drinkStart: 0, drinkUntil: 0,
}
// Trigger moves by writing timestamps, e.g.:
//   pose.throwAt = performance.now()
//   pose.drinkStart = performance.now(); pose.drinkUntil = pose.drinkStart + 1600

export default function Scene() {
  return (
    <Canvas camera={{ position: [1.2, 1.3, 4.6] }}>
      <ambientLight intensity={1} />
      <directionalLight position={[3, 5, 4]} intensity={2} />
      <Gimlet getPose={() => pose} />
    </Canvas>
  )
}
```

For the glow to bloom, add `@react-three/postprocessing` with `<Bloom luminanceThreshold={1} mipmapBlur />`.

## Prompt to paste into another Claude

> I'm handing over an original game character called Gimlet. The attached `GIMLET_HANDOVER.md` is the
> character bible and full source code, `gimlet-concept.png` is the concept art (the design
> reference), and `gimlet.glb` is the current 3D model. Please read the handover fully before starting.
> Keep his look, personality and gameplay kit consistent with it. What I'd like to do next is: …

## Full source

### `Gimlet.tsx`: model and procedural animation rig

```tsx
import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, BackSide, DoubleSide, Group, MathUtils, Mesh, MeshStandardMaterial, PointLight } from 'three'
import { SKIN, labelTexture, plaidTexture, tattooTexture, tieDyeTexture } from './textures'

// What the rig needs to know each frame. The game fills this from the store;
// the character viewer fills it from buttons.
export type GimletPose = {
  moving: boolean
  frenzy: boolean
  bottles: number // 0..2 shown in the belt holsters
  attackAt: number // performance.now() of last punch
  throwAt: number // performance.now() of last bottle throw
  drinkStart: number
  drinkUntil: number
}

export const DRINK_MS = 1600
const THROW_MS = 450
const PUNCH_MS = 260

const COLORS = {
  pants: '#c8642c',
  pantsStripe: '#e7cba4',
  belt: '#6b3f22',
  buckle: '#b8bcc4',
  glass: '#2f5c3c',
  cork: '#b08454',
  hair: '#c9d09b',
  facialHair: '#2b1d14',
  shoe: '#c9c3ac',
  shoeAccent: '#7e9670',
  sole: '#a4ff4c',
  cord: '#a3262a',
}

const lerp = MathUtils.lerp

export function Gimlet({ getPose }: { getPose: () => GimletPose }) {
  const root = useRef<Group>(null)
  const hips = useRef<Group>(null)
  const spine = useRef<Group>(null)
  const head = useRef<Group>(null)
  const shoulderL = useRef<Group>(null)
  const shoulderR = useRef<Group>(null)
  const elbowL = useRef<Group>(null)
  const elbowR = useRef<Group>(null)
  const thighL = useRef<Group>(null)
  const thighR = useRef<Group>(null)
  const kneeL = useRef<Group>(null)
  const kneeR = useRef<Group>(null)
  const beltBottleL = useRef<Group>(null)
  const beltBottleR = useRef<Group>(null)
  const handBottleL = useRef<Group>(null)
  const handBottleR = useRef<Group>(null)
  const aura = useRef<Mesh>(null)
  const auraLight = useRef<PointLight>(null)
  const anim = useRef({ run: 0, phase: 0, frenzy: 0 })

  const tex = useMemo(
    () => ({ tieDye: tieDyeTexture(), plaid: plaidTexture(), label: labelTexture(), tattoo: tattooTexture() }),
    [],
  )
  const mats = useMemo(
    () => ({
      skin: new MeshStandardMaterial({ color: SKIN, roughness: 0.65 }),
      tattoo: new MeshStandardMaterial({ map: tex.tattoo, roughness: 0.65 }),
      top: new MeshStandardMaterial({ map: tex.tieDye, roughness: 0.95 }),
      plaid: new MeshStandardMaterial({ map: tex.plaid, roughness: 0.9 }),
      pants: new MeshStandardMaterial({ color: COLORS.pants, roughness: 0.95 }),
      stripe: new MeshStandardMaterial({ color: COLORS.pantsStripe, roughness: 0.95 }),
      belt: new MeshStandardMaterial({ color: COLORS.belt, roughness: 0.75 }),
      metal: new MeshStandardMaterial({ color: COLORS.buckle, metalness: 0.9, roughness: 0.3 }),
      glass: new MeshStandardMaterial({ color: COLORS.glass, roughness: 0.15, metalness: 0.2, transparent: true, opacity: 0.92 }),
      cork: new MeshStandardMaterial({ color: COLORS.cork, roughness: 0.9 }),
      label: new MeshStandardMaterial({ map: tex.label, roughness: 0.8, side: DoubleSide }),
      hair: new MeshStandardMaterial({ color: COLORS.hair, roughness: 0.85, emissive: '#7dff4a', emissiveIntensity: 0, flatShading: true }),
      facial: new MeshStandardMaterial({ color: COLORS.facialHair, roughness: 0.9 }),
      eye: new MeshStandardMaterial({ color: '#1b120c', emissive: '#9dff4a', emissiveIntensity: 0, toneMapped: false }),
      shoe: new MeshStandardMaterial({ color: COLORS.shoe, roughness: 0.8 }),
      shoeAccent: new MeshStandardMaterial({ color: COLORS.shoeAccent, roughness: 0.8 }),
      sole: new MeshStandardMaterial({ color: COLORS.sole, emissive: COLORS.sole, emissiveIntensity: 2.5, toneMapped: false }),
      cord: new MeshStandardMaterial({ color: COLORS.cord, roughness: 0.8 }),
      bead: new MeshStandardMaterial({ color: '#d9b77a', roughness: 0.6 }),
    }),
    [tex],
  )

  useLayoutEffect(() => {
    root.current?.traverse((o) => {
      if ((o as Mesh).isMesh && o !== aura.current) o.castShadow = true
    })
  }, [])

  useFrame((state, dt) => {
    const p = getPose()
    const a = anim.current
    const now = performance.now()
    const t = state.clock.elapsedTime
    a.run = MathUtils.damp(a.run, p.moving ? 1 : 0, 10, dt)
    a.frenzy = MathUtils.damp(a.frenzy, p.frenzy ? 1 : 0, 6, dt)
    const speed = 1 + a.frenzy * 0.6
    a.phase += dt * 10 * speed * (0.3 + a.run * 0.7)
    const run = a.run
    const fz = a.frenzy
    const swing = Math.sin(a.phase) * 0.75 * run

    // ---- base locomotion ----
    hips.current!.position.y = 1.0 + Math.abs(Math.sin(a.phase)) * 0.05 * run + Math.sin(t * 2) * 0.008 * (1 - run)
    hips.current!.position.x = fz * Math.sin(t * 40) * 0.008
    hips.current!.rotation.y = Math.sin(a.phase) * 0.12 * run
    thighL.current!.rotation.x = -swing
    thighR.current!.rotation.x = swing
    kneeL.current!.rotation.x = Math.max(0, Math.sin(a.phase + 1.4)) * 1.1 * run
    kneeR.current!.rotation.x = Math.max(0, Math.sin(a.phase + 1.4 + Math.PI)) * 1.1 * run
    // idle stance: feet apart, weight on one leg
    thighL.current!.rotation.z = lerp(0.07, 0.02, run)
    thighR.current!.rotation.z = lerp(-0.1, -0.02, run)

    // lean back when idle (smug), forward when running, hunched in frenzy
    spine.current!.rotation.x = lerp(-0.1, 0.18, run) + fz * 0.22
    spine.current!.rotation.z = Math.sin(t * 1.1) * 0.03 * (1 - run) + 0.04
    spine.current!.rotation.y = -Math.sin(a.phase) * 0.15 * run

    head.current!.rotation.z = lerp(0.12, 0.02, run) + Math.sin(t * 0.9) * 0.03
    head.current!.rotation.x = lerp(0.1, 0.0, run) + fz * 0.1
    head.current!.rotation.y = Math.sin(t * 0.5) * 0.12 * (1 - run)

    let sLx = swing * 0.9
    let sLz = lerp(0.22, 0.12, run) + fz * 0.35
    let eLx = lerp(-0.12, -1.0, run) - fz * 0.5
    let sRx = -swing * 0.9
    let sRz = lerp(-0.22, -0.12, run) - fz * 0.35
    let eRx = lerp(-0.12, -1.0, run) - fz * 0.5
    let sRy = 0
    let headTiltBack = 0

    // ---- punch (right arm) ----
    const pk = (now - p.attackAt) / PUNCH_MS
    if (pk >= 0 && pk < 1) {
      const w = Math.sin(pk * Math.PI)
      sRx = lerp(sRx, -1.55, w)
      sRz = lerp(sRz, -0.05, w)
      eRx = lerp(eRx, -0.05, w)
      spine.current!.rotation.y += -0.45 * w
    }

    // ---- bottle throw (right arm, overhand) ----
    const tk = (now - p.throwAt) / THROW_MS
    let holdingThrow = false
    if (tk >= 0 && tk < 1) {
      if (tk < 0.35) {
        const w = tk / 0.35
        sRx = lerp(sRx, -2.9, w)
        eRx = lerp(eRx, -1.5, w)
        sRy = -0.3 * w
        spine.current!.rotation.y += 0.35 * w
        holdingThrow = true
      } else {
        const w = 1 - (tk - 0.35) / 0.65
        sRx = lerp(sRx, -0.9, w)
        eRx = lerp(eRx, -0.15, w)
        spine.current!.rotation.y += -0.4 * w
        spine.current!.rotation.x += 0.2 * w
      }
    }

    // ---- drinking (left arm brings bottle to mouth, head tips back) ----
    const drinking = now < p.drinkUntil && now >= p.drinkStart
    if (drinking) {
      const k = (now - p.drinkStart) / (p.drinkUntil - p.drinkStart)
      const w = Math.min(1, k / 0.15, (1 - k) / 0.15)
      sLx = lerp(sLx, -2.25, w)
      sLz = lerp(sLz, -0.45, w)
      eLx = lerp(eLx, -2.05, w)
      headTiltBack = 0.5 * w
    }
    head.current!.rotation.x -= headTiltBack

    shoulderL.current!.rotation.set(sLx, 0, sLz)
    shoulderR.current!.rotation.set(sRx, sRy, sRz)
    elbowL.current!.rotation.x = eLx
    elbowR.current!.rotation.x = eRx

    // ---- props ----
    const shownBottles = p.frenzy ? 2 : p.bottles
    beltBottleL.current!.visible = shownBottles >= 1 && !drinking
    beltBottleR.current!.visible = shownBottles >= 2 && !holdingThrow
    handBottleL.current!.visible = drinking
    handBottleR.current!.visible = holdingThrow

    // ---- frenzy glow ----
    mats.sole.emissiveIntensity = 2.5 + fz * 6 + Math.sin(t * 12) * fz
    mats.hair.emissiveIntensity = fz * 0.35
    mats.eye.emissiveIntensity = fz * 6
    if (aura.current) {
      aura.current.visible = fz > 0.02
      aura.current.scale.set(0.8 + Math.sin(t * 10) * 0.04, 1.35, 0.8 + Math.sin(t * 10) * 0.04)
      ;(aura.current.material as MeshStandardMaterial).opacity = fz * (0.1 + Math.sin(t * 10) * 0.03)
    }
    if (auraLight.current) auraLight.current.intensity = fz * 4
  })

  const Bottle = ({ withLabel = true }: { withLabel?: boolean }) => (
    <group>
      <mesh material={mats.glass}>
        <cylinderGeometry args={[0.045, 0.045, 0.13, 14]} />
      </mesh>
      <mesh material={mats.glass} position-y={0.08}>
        <cylinderGeometry args={[0.018, 0.04, 0.04, 12]} />
      </mesh>
      <mesh material={mats.glass} position-y={0.115}>
        <cylinderGeometry args={[0.017, 0.017, 0.035, 10]} />
      </mesh>
      <mesh material={mats.cork} position-y={0.14}>
        <cylinderGeometry args={[0.014, 0.016, 0.025, 8]} />
      </mesh>
      {withLabel && (
        <mesh material={mats.label} position-z={0.0465}>
          <planeGeometry args={[0.07, 0.085]} />
        </mesh>
      )}
    </group>
  )

  const Stripes = ({ side, y, len, r0, r1 }: { side: 1 | -1; y: number; len: number; r0: number; r1: number }) => {
    const r = (r0 + r1) / 2 + 0.004
    const tilt = Math.atan2(r1 - r0, len)
    return (
      <>
        {[0.95, 1.15].map((ang) => (
          <group key={ang} rotation-y={side * ang} position-y={y}>
            <mesh material={mats.stripe} position-z={r} rotation-x={-tilt}>
              <boxGeometry args={[0.02, len, 0.006]} />
            </mesh>
          </group>
        ))}
      </>
    )
  }

  const Leg = ({ side, thigh, knee }: { side: 1 | -1; thigh: React.RefObject<Group | null>; knee: React.RefObject<Group | null> }) => (
    <group ref={thigh} name={side === 1 ? 'thigh_L' : 'thigh_R'} position={[side * 0.12, -0.04, 0]}>
      <mesh material={mats.pants} position-y={-0.24}>
        <cylinderGeometry args={[0.135, 0.15, 0.5, 14]} />
      </mesh>
      <Stripes side={side} y={-0.24} len={0.48} r0={0.137} r1={0.15} />
      <group ref={knee} name={side === 1 ? 'knee_L' : 'knee_R'} position-y={-0.47}>
        <mesh material={mats.pants} position-y={-0.19}>
          <cylinderGeometry args={[0.15, 0.2, 0.38, 14]} />
        </mesh>
        <Stripes side={side} y={-0.2} len={0.42} r0={0.152} r1={0.19} />
        {/* bunched cuff */}
        <mesh material={mats.pants} position-y={-0.37} rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.18, 0.04, 8, 16]} />
        </mesh>
        {/* sneaker */}
        <group position={[0, -0.44, 0.04]}>
          <mesh material={mats.shoe} position-y={0.0}>
            <boxGeometry args={[0.16, 0.09, 0.3]} />
          </mesh>
          <mesh material={mats.shoe} position={[0, -0.005, 0.14]} scale={[1, 0.55, 0.8]}>
            <sphereGeometry args={[0.085, 14, 10]} />
          </mesh>
          <mesh material={mats.shoeAccent} position={[0, 0.0, -0.11]}>
            <boxGeometry args={[0.165, 0.07, 0.07]} />
          </mesh>
          <mesh material={mats.shoeAccent} position={[side * 0.083, 0.0, 0.03]}>
            <boxGeometry args={[0.005, 0.04, 0.14]} />
          </mesh>
          <mesh material={mats.sole} position-y={-0.06}>
            <boxGeometry args={[0.175, 0.035, 0.32]} />
          </mesh>
        </group>
      </group>
    </group>
  )

  const Arm = ({
    side,
    shoulder,
    elbow,
    handBottle,
    skin,
  }: {
    side: 1 | -1
    shoulder: React.RefObject<Group | null>
    elbow: React.RefObject<Group | null>
    handBottle: React.RefObject<Group | null>
    skin: MeshStandardMaterial
  }) => (
    <group ref={shoulder} name={side === 1 ? 'shoulder_L' : 'shoulder_R'} position={[side * 0.25, 0.44, 0]}>
      <mesh material={mats.skin}>
        <sphereGeometry args={[0.072, 14, 12]} />
      </mesh>
      <mesh material={skin} position-y={-0.15}>
        <capsuleGeometry args={[0.058, 0.2, 6, 12]} />
      </mesh>
      <group ref={elbow} name={side === 1 ? 'elbow_L' : 'elbow_R'} position-y={-0.3}>
        <mesh material={skin} position-y={-0.13}>
          <capsuleGeometry args={[0.05, 0.2, 6, 12]} />
        </mesh>
        {side === -1 &&
          ['#a3262a', '#2a4fa3', '#e0b040'].map((c, i) => (
            <mesh key={c} position-y={-0.21 - i * 0.018} rotation-x={Math.PI / 2}>
              <torusGeometry args={[0.052, 0.007, 6, 16]} />
              <meshStandardMaterial color={c} roughness={0.8} />
            </mesh>
          ))}
        <group position-y={-0.3}>
          <mesh material={mats.skin} position-y={-0.03}>
            <boxGeometry args={[0.07, 0.1, 0.04]} />
          </mesh>
          {side === 1 && (
            <mesh material={mats.metal} position={[0, -0.07, 0.012]} rotation-x={Math.PI / 2}>
              <torusGeometry args={[0.012, 0.004, 6, 12]} />
            </mesh>
          )}
          <group ref={handBottle} position={[0, -0.06, 0.04]} rotation-x={side === 1 ? Math.PI * 0.9 : 0} visible={false}>
            <Bottle withLabel={false} />
          </group>
        </group>
      </group>
    </group>
  )

  return (
    <group ref={root} name="Gimlet">
      <group ref={hips} name="hips" position-y={1.0}>
        {/* waist: baggy pants top, boxers band, belt, holsters */}
        <mesh material={mats.pants} position-y={-0.03}>
          <cylinderGeometry args={[0.2, 0.23, 0.16, 16]} />
        </mesh>
        <mesh material={mats.plaid} position-y={0.08}>
          <cylinderGeometry args={[0.185, 0.19, 0.05, 16]} />
        </mesh>
        <mesh material={mats.belt} position-y={0.03}>
          <cylinderGeometry args={[0.205, 0.21, 0.06, 18]} />
        </mesh>
        <mesh material={mats.metal} position={[0, 0.03, 0.212]}>
          <boxGeometry args={[0.07, 0.055, 0.012]} />
        </mesh>
        {([-1, 1] as const).map((side) => (
          <group key={side} position={[side * 0.23, -0.06, 0.06]} rotation-y={side * 0.5}>
            <mesh material={mats.belt}>
              <boxGeometry args={[0.105, 0.1, 0.1]} />
            </mesh>
            <mesh material={mats.belt} position={[0, 0.07, -0.04]}>
              <boxGeometry args={[0.03, 0.1, 0.01]} />
            </mesh>
            <group ref={side === -1 ? beltBottleR : beltBottleL} position-y={0.04}>
              <Bottle />
            </group>
          </group>
        ))}

        <Leg side={1} thigh={thighL} knee={kneeL} />
        <Leg side={-1} thigh={thighR} knee={kneeR} />

        <group ref={spine} name="spine" position-y={0.1}>
          {/* tank top torso (rotated so the spiral faces forward) */}
          <mesh material={mats.top} position-y={0.22} rotation-y={Math.PI} scale={[1, 1, 0.72]}>
            <cylinderGeometry args={[0.235, 0.19, 0.48, 20, 1]} />
          </mesh>
          {/* tank top shoulder straps */}
          {[-1, 1].map((s) => (
            <mesh key={s} material={mats.top} position={[s * 0.12, 0.47, 0]} scale={[1, 1, 0.72]}>
              <boxGeometry args={[0.07, 0.03, 0.3]} />
            </mesh>
          ))}
          {/* chest skin / collarbones under the scoop */}
          <mesh material={mats.skin} position={[0, 0.43, 0.04]} scale={[1.6, 0.6, 0.9]}>
            <sphereGeometry args={[0.1, 14, 10]} />
          </mesh>
          {/* necklace */}
          <mesh material={mats.cord} position={[0, 0.44, 0.06]} rotation-x={1.15}>
            <torusGeometry args={[0.1, 0.005, 6, 24]} />
          </mesh>
          {[-0.018, 0.018].map((x) => (
            <mesh key={x} material={mats.bead} position={[x, 0.36, 0.135]}>
              <sphereGeometry args={[0.016, 10, 8]} />
            </mesh>
          ))}

          <Arm side={1} shoulder={shoulderL} elbow={elbowL} handBottle={handBottleL} skin={mats.tattoo} />
          <Arm side={-1} shoulder={shoulderR} elbow={elbowR} handBottle={handBottleR} skin={mats.skin} />

          <mesh material={mats.skin} position-y={0.52}>
            <cylinderGeometry args={[0.055, 0.065, 0.12, 12]} />
          </mesh>
          <group ref={head} name="head" position-y={0.58}>
            <Head mats={mats} />
          </group>
        </group>
      </group>

      {/* frenzy aura */}
      <mesh ref={aura} name="frenzy_aura" position-y={1.0} visible={false}>
        <sphereGeometry args={[0.75, 24, 16]} />
        <meshBasicMaterial color="#5dff3a" transparent opacity={0} depthWrite={false} side={BackSide} blending={AdditiveBlending} />
      </mesh>
      <pointLight ref={auraLight} position-y={1.1} color="#8dff4a" intensity={0} distance={6} decay={2} />
    </group>
  )
}

type Mats = Record<'skin' | 'hair' | 'facial' | 'eye' | 'metal', MeshStandardMaterial>

function Head({ mats }: { mats: Mats }) {
  // Messy mullet: seeded tufts so the silhouette is the same every load.
  const tufts = useMemo(() => {
    let seed = 11
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    const out: { pos: [number, number, number]; rot: [number, number, number]; s: number }[] = []
    // crown & sides
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2
      const front = Math.cos(a) > 0.55 // skip the face
      if (front) continue
      out.push({
        pos: [Math.sin(a) * 0.12, 0.2 + rand() * 0.05, Math.cos(a) * 0.11 - 0.01],
        rot: [Math.cos(a) * -1.1 + (rand() - 0.5) * 0.4, 0, Math.sin(a) * 1.1 + (rand() - 0.5) * 0.4],
        s: 0.9 + rand() * 0.5,
      })
    }
    // long back (mullet) hanging toward the shoulders
    for (let i = 0; i < 9; i++) {
      const x = (i / 8 - 0.5) * 0.24
      out.push({ pos: [x, 0.04 - rand() * 0.06, -0.1], rot: [2.6 + (rand() - 0.5) * 0.5, 0, x * 3], s: 1.2 + rand() * 0.6 })
    }
    // swept fringe
    for (let i = 0; i < 4; i++) {
      out.push({ pos: [0.03 + i * 0.03, 0.24 - i * 0.012, 0.08], rot: [0.9, 0, -1.3 - i * 0.15], s: 0.9 + rand() * 0.3 })
    }
    return out
  }, [])

  return (
    <group>
      {/* skull + jaw */}
      <mesh material={mats.skin} position-y={0.12} scale={[0.9, 1.08, 0.98]}>
        <sphereGeometry args={[0.13, 24, 18]} />
      </mesh>
      <mesh material={mats.skin} position={[0, 0.04, 0.03]} scale={[0.8, 0.6, 0.85]}>
        <sphereGeometry args={[0.11, 18, 12]} />
      </mesh>
      {/* ears + hoop earrings */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh material={mats.skin} position={[s * 0.118, 0.12, -0.005]} scale={[0.5, 1, 0.8]}>
            <sphereGeometry args={[0.03, 10, 8]} />
          </mesh>
          <mesh material={mats.metal} position={[s * 0.123, 0.085, 0]} rotation-y={Math.PI / 2}>
            <torusGeometry args={[0.012, 0.0025, 6, 12]} />
          </mesh>
        </group>
      ))}
      {/* eyes, smug half-lidded */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.045, 0.135, 0.112]}>
          <mesh material={mats.eye} scale={[1, 0.55, 0.5]}>
            <sphereGeometry args={[0.018, 10, 8]} />
          </mesh>
          {/* heavy lid */}
          <mesh material={mats.skin} position={[0, 0.009, 0.002]} scale={[1.2, 0.5, 0.6]}>
            <sphereGeometry args={[0.019, 10, 8]} />
          </mesh>
          {/* brows: one cocked */}
          <mesh material={mats.facial} position={[0, s === 1 ? 0.037 : 0.028, 0.004]} rotation-z={s === 1 ? -0.25 : 0.12}>
            <boxGeometry args={[0.045, 0.01, 0.012]} />
          </mesh>
        </group>
      ))}
      {/* nose */}
      <mesh material={mats.skin} position={[0, 0.1, 0.13]} rotation-x={Math.PI / 2 + 0.3}>
        <coneGeometry args={[0.018, 0.05, 8]} />
      </mesh>
      {/* thin curled mustache */}
      {[-1, 1].map((s) => (
        <mesh key={s} material={mats.facial} position={[s * 0.025, 0.07, 0.122]} rotation-z={s * -0.35}>
          <boxGeometry args={[0.04, 0.008, 0.01]} />
        </mesh>
      ))}
      {/* smirk */}
      <mesh material={mats.facial} position={[0.008, 0.048, 0.118]} rotation-z={0.18}>
        <boxGeometry args={[0.04, 0.005, 0.006]} />
      </mesh>
      {/* goatee */}
      <mesh material={mats.facial} position={[0, 0.0, 0.098]} scale={[1.1, 1.2, 0.55]}>
        <sphereGeometry args={[0.016, 10, 8]} />
      </mesh>
      {/* hair cap + tufts */}
      <mesh material={mats.hair} position={[0, 0.17, -0.02]} scale={[1.05, 0.85, 1.08]}>
        <icosahedronGeometry args={[0.135, 1]} />
      </mesh>
      {tufts.map((t, i) => (
        <mesh key={i} material={mats.hair} position={t.pos} rotation={t.rot} scale={t.s}>
          <coneGeometry args={[0.04, 0.14, 5]} />
        </mesh>
      ))}
    </group>
  )
}
```

### `textures.ts`: painted textures (tie-dye, plaid, label, tattoo sleeve)

```ts
import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'

// All of Gimlet's surface detail is painted procedurally onto canvases, so the
// character needs no external image files. Tweak colours here to restyle him.

export const SKIN = '#c98a5e'

function canvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')!] as const
}

function toTexture(c: HTMLCanvasElement) {
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  t.anisotropy = 4
  return t
}

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

// Tie-dye spiral tank top. The front of the torso maps to u = 0.5.
export function tieDyeTexture() {
  const W = 512
  const H = 256
  const [c, ctx] = canvas(W, H)
  const img = ctx.createImageData(W, H)
  const purple = hexToRgb('#9b6cb5')
  const lime = hexToRgb('#d8d877')
  const olive = hexToRgb('#a7ad5e')
  const lilac = hexToRgb('#c39ad0')
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      // spiral centred on the front, a little below the chest
      const dx = (x - W * 0.5) / (W * 0.25)
      const dy = (y - H * 0.55) / (H * 0.5)
      const r = Math.hypot(dx, dy)
      const a = Math.atan2(dy, dx)
      const noise = Math.sin(x * 0.11 + y * 0.07) * 0.25 + Math.sin(x * 0.031 - y * 0.05) * 0.35
      const v = Math.sin(a * 2 + r * 7 + noise)
      const w = Math.sin(a * 2 + r * 7 + noise + 1.7)
      const mixAB = (v + 1) / 2
      const col = [0, 1, 2].map((i) => {
        const base = purple[i] * mixAB + lime[i] * (1 - mixAB)
        const accent = w > 0.7 ? olive[i] : w < -0.8 ? lilac[i] : base
        return base * 0.6 + accent * 0.4
      })
      const k = (y * W + x) * 4
      img.data[k] = col[0]
      img.data[k + 1] = col[1]
      img.data[k + 2] = col[2]
      img.data[k + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)

  // skin showing: scoop neck (front + back) and deep armholes on the sides
  ctx.fillStyle = SKIN
  const ellipse = (cx: number, cy: number, rx: number, ry: number) => {
    ctx.beginPath()
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  ellipse(W * 0.5, 0, 46, 58) // front scoop
  ellipse(0, 0, 40, 30) // back (wraps)
  ellipse(W, 0, 40, 30)
  ellipse(W * 0.25, 0, 62, 120) // armholes
  ellipse(W * 0.75, 0, 62, 120)

  // a few worn holes near the hem
  ctx.fillStyle = 'rgba(60,40,50,0.8)'
  ellipse(W * 0.38, H * 0.88, 6, 4)
  ellipse(W * 0.6, H * 0.8, 4, 3)
  return toTexture(c)
}

export function plaidTexture() {
  const [c, ctx] = canvas(64, 16)
  ctx.fillStyle = '#e9edf5'
  ctx.fillRect(0, 0, 64, 16)
  ctx.fillStyle = 'rgba(48,78,170,0.75)'
  for (let i = 0; i < 64; i += 8) ctx.fillRect(i, 0, 4, 16)
  for (let j = 0; j < 16; j += 8) ctx.fillRect(0, j, 64, 4)
  const t = toTexture(c)
  t.wrapS = RepeatWrapping
  t.repeat.set(4, 1)
  return t
}

// Brand label for Gimlet's bottles.
export function labelTexture() {
  const [c, ctx] = canvas(128, 160)
  ctx.fillStyle = '#efe2bf'
  ctx.fillRect(0, 0, 128, 160)
  ctx.strokeStyle = '#5a3a1e'
  ctx.lineWidth = 6
  ctx.strokeRect(6, 6, 116, 148)
  ctx.fillStyle = '#3a2412'
  ctx.textAlign = 'center'
  ctx.font = 'bold italic 26px Georgia, serif'
  ctx.fillText('Danger &', 64, 44)
  ctx.font = 'bold italic 30px Georgia, serif'
  ctx.fillText('Sons', 64, 74)
  // little mascot medallion
  ctx.fillStyle = '#8a5a32'
  ctx.beginPath()
  ctx.arc(64, 112, 24, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#efe2bf'
  ctx.beginPath()
  ctx.arc(64, 108, 10, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#222'
  ctx.fillRect(54, 104, 20, 4) // sunglasses
  return toTexture(c)
}

// Skin with a generic ink sleeve: swirls, a wing, stars and a ball.
export function tattooTexture() {
  const W = 256
  const H = 256
  const [c, ctx] = canvas(W, H)
  ctx.fillStyle = SKIN
  ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = 'rgba(40,28,24,0.85)'
  ctx.fillStyle = 'rgba(40,28,24,0.85)'
  ctx.lineCap = 'round'

  // flowing swirls around the arm
  ctx.lineWidth = 5
  for (let i = 0; i < 7; i++) {
    ctx.beginPath()
    const y0 = 20 + i * 34
    ctx.moveTo(0, y0)
    ctx.bezierCurveTo(W * 0.3, y0 - 30, W * 0.6, y0 + 40, W, y0)
    ctx.stroke()
  }
  // wing feathers
  ctx.lineWidth = 3
  for (let f = 0; f < 6; f++) {
    ctx.beginPath()
    ctx.ellipse(W * 0.5 + f * 9, 50 + f * 6, 26 - f * 2, 7, -0.6, 0, Math.PI * 2)
    ctx.stroke()
  }
  // ball on the forearm
  const bx = W * 0.5
  const by = H * 0.8
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(bx, by, 18, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  for (let k = 0; k < 5; k++) {
    const a = -Math.PI / 2 + (k * 2 * Math.PI) / 5
    ctx.lineTo(bx + Math.cos(a) * 7, by + Math.sin(a) * 7)
  }
  ctx.closePath()
  ctx.fill()
  // stars
  for (const [sx, sy] of [
    [40, 150],
    [200, 120],
    [90, 220],
  ]) {
    ctx.beginPath()
    for (let k = 0; k < 10; k++) {
      const r = k % 2 ? 4 : 10
      const a = -Math.PI / 2 + (k * Math.PI) / 5
      ctx.lineTo(sx + Math.cos(a) * r, sy + Math.sin(a) * r)
    }
    ctx.closePath()
    ctx.fill()
  }
  return toTexture(c)
}
```

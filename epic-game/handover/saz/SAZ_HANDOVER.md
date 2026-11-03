# Saz: Character Handover

This file is a complete handover for **Saz** (short for Sazerac), an original character created by the project
owner for the game *The Last Lantern*. Give this file plus the files below to another Claude conversation and
it has everything needed to rebuild, extend or reuse him.

## Files in this kit

| File | What it is |
|---|---|
| `SAZ_HANDOVER.md` | This document: character bible, rig notes and full source code |
| `saz.glb` | The 3D model as a standard glTF binary (Blender, three.js, Godot, Unity via glTF importer, online viewers) |
| `saz-concept.png` | The original concept art. **This is the design reference: when in doubt, match it** |

His friend Gimlet has his own kit in `../gimlet/`.

## Who he is

- **Name:** Saz (Sazerac). The name is a working title and can be changed freely.
- **Role:** Gimlet's old friend in the village of Emberfall. Non-player character; gives encouragement and
  advice, and celebrates when the beacon is lit.
- **Personality:** Warm, easygoing, a little philosophical, and fully committed to the 1970s. He teases
  Gimlet but has his back. Believes in being kind "even when it's dark out."
- **Voice samples** (from the game script):
  - "Gimlet! Thought I smelled trouble and cheap glass."
  - "Funk. Soul. Jazz. Vibe. Kind. Every word four letters, every one earned."
  - "Kind. Because you gotta be, even when it's dark out."
  - "It's the only move that matters, brother." (about his point-up, point-down dance)

## Look (from the concept art)

**Silhouette:** tall and slim with a big halo of curly hair on top and dramatic bell-bottoms flaring out at
the bottom, so the shape is wide, narrow, then wide again. Relaxed, friendly stance with arms slightly away
from the body and a gentle smile.

| Part | Description | Colour(s) |
|---|---|---|
| Skin | Warm brown | `#a8704a` |
| Hair | Big, voluminous, shoulder-framing curls, very dark brown | `#2a1d17` |
| Face | Warm closed-mouth smile, soft cheeks, dark brown eyes, thick brows | iris `#2b1a10` |
| Glasses | Thick square black frames, heavier top rim, clear lenses | `#1a1717` |
| Facial hair | Full beard along the jaw, moustache, pointed goatee, sideburns joining the hair | `#1f1611` |
| Shirt | Cream/off-white button-up, wide spread collar, top buttons open (chest hair showing), one chest pocket on his left, sleeves rolled to just below the elbow, tucked in | `#efe7d8` |
| Pants | High-waisted burgundy wool flares: wide waistband with side buckle tabs, pressed centre crease, front pocket slits, slim through the thigh, dramatic bell-bottom flare from the knee | `#7c2230`, seams `#5c1622`, buckles `#c8ccd2` |
| Shoes | Polished dark-brown leather shoes with a stacked heel, toes peeking out from under the flares | `#3a2117` |
| Forearms | Hairy forearms | hair `#2a1a10` |
| **Tattoo sleeve** | His **left forearm** is covered in a word cloud of four-letter words in mixed lettering styles (serif, italic, typewriter, heavy block, script), with small dots between. Biggest words on the outside of the arm | ink `rgba(28,22,30,0.88)` |
| Hand tattoo | The word **KIND** on the back of his left hand, with three small stars | same ink |
| Ring | Gold ring on his right hand | `#d8b45a` |

**Tattoo words:** FUNK, SOUL, JAZZ, VIBE, GLOW, FREE, ROAM, RIFF, BASS, HOPE, KIND, WILD, LOVE, ECHO, DUSK, COOL, SWAY, DIGS, GOLD, HUSH. Every one is four letters. Swap them freely in `SAZ_TATTOO_WORDS`
(`sazTextures.ts`); the layout repacks itself.

## Rig and animation

The joints have the same names and layout as Gimlet's, so tools and animations can be shared between them:

```
Saz                    (root, feet at y = 0, faces +Z, about 2 m tall including hair)
└─ hips                (y = 1.02, high waistband)
   ├─ thigh_L ─ knee_L     (flare and shoe hang below the knee)
   ├─ thigh_R ─ knee_R
   └─ spine
      ├─ shoulder_L ─ elbow_L   (word-sleeve forearm, KIND hand)
      ├─ shoulder_R ─ elbow_R   (gold ring hand, the pointing arm)
      └─ head                   (glasses, beard, curls; the jaw moves when he talks)
```

Left and right are **his** left and right.
- Rotating a shoulder or thigh negatively around X swings it forward.
- Rotating a knee positively around X bends the shin back.

**Procedural animations** (computed each frame from `SazPose`):

| Move | What it looks like |
|---|---|
| Idle | Slow weight shift from foot to foot, breathing, head tilted and slowly looking around |
| Wave | Left arm up (so the word sleeve shows), forearm waving, head tilt (1.4 s) |
| Talk | Beard and jaw bob while he speaks |
| Dance | At 118 bpm: hips sway and bob, knees pump, and his right arm alternates pointing to the sky and to the floor |

In the game he turns to face Gimlet when Gimlet comes near, waves on approach, talks during his own lines and
dances once the beacon is lit.

**About `saz.glb`:** a static model in his idle pose with the named joints above. No skinning and no
animation clips; each body part is a rigid mesh parented to a joint, like an action figure. His hair
curls are merged into one mesh in the file so every 3D app can open it.

## Using the code

React Three Fiber (React + three.js). Depends on `react`, `three` and `@react-three/fiber`. No image files:
every texture (word sleeve, hairy skin, shirt weave, wool twill) is painted onto a canvas in `sazTextures.ts`.
Keep `parts.tsx` next to `Saz.tsx` (shared hands and helpers).

```tsx
import { Canvas } from '@react-three/fiber'
import { Saz, type SazPose } from './Saz'

const pose: SazPose = { dancing: false, waveAt: 0, talking: false }
// pose.waveAt = performance.now()  -> wave
// pose.dancing = true              -> dance

export default function Scene() {
  return (
    <Canvas camera={{ position: [1.2, 1.3, 4.6] }}>
      <ambientLight intensity={1} />
      <directionalLight position={[3, 5, 4]} intensity={2} />
      <Saz getPose={() => pose} />
    </Canvas>
  )
}
```

## Prompt to paste into another Claude

> I'm handing over an original game character called Saz. The attached `SAZ_HANDOVER.md` is the character
> bible and full source code, `saz-concept.png` is the concept art (the design reference), and `saz.glb`
> is the current 3D model. Please read the handover fully before starting. Keep his look and personality
> consistent with it. What I'd like to do next is: …

## Full source

### `characters/Saz.tsx: model and procedural animation rig`

```tsx
import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { DoubleSide, Group, InstancedMesh, MathUtils, Matrix4, Mesh, MeshStandardMaterial, Quaternion, Euler, Vector3 } from 'three'
import { Hand, rng, useLathe } from './parts'
import {
  SAZ_SKIN,
  chestTexture,
  flaresTexture,
  forearmTexture,
  handWordTexture,
  shirtTexture,
  wordCloudTexture,
} from './sazTextures'

// Saz (Sazerac): Gimlet's friend from Emberfall. 70s through and through.
// Same joint layout and naming as Gimlet so tools and animations transfer.

export type SazPose = {
  dancing: boolean
  waveAt: number // performance.now() of the last wave/greeting
  talking: boolean
}

const WAVE_MS = 1400
const lerp = MathUtils.lerp

const C = {
  hair: '#2a1d17',
  beard: '#1f1611',
  frame: '#1a1717',
  shoe: '#3a2117',
  buckle: '#c8ccd2',
  lips: '#8a4f3a',
}

export function Saz({ getPose }: { getPose: () => SazPose }) {
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
  const jaw = useRef<Group>(null)
  const anim = useRef({ dance: 0, t0: 0 })

  const mats = useMemo(() => {
    const flares = flaresTexture()
    return {
      skin: new MeshStandardMaterial({ color: SAZ_SKIN, roughness: 0.6 }),
      forearm: new MeshStandardMaterial({ map: forearmTexture(), roughness: 0.65 }),
      tattoo: new MeshStandardMaterial({ map: wordCloudTexture(), roughness: 0.65 }),
      handWord: new MeshStandardMaterial({ map: handWordTexture(), roughness: 0.65 }),
      chest: new MeshStandardMaterial({ map: chestTexture(), roughness: 0.7 }),
      shirt: new MeshStandardMaterial({ map: shirtTexture(), roughness: 0.85 }),
      shirtSolid: new MeshStandardMaterial({ color: '#ece4d4', roughness: 0.85, side: DoubleSide }),
      button: new MeshStandardMaterial({ color: '#f7f2e8', roughness: 0.3 }),
      flares: new MeshStandardMaterial({ map: flares, roughness: 0.9, side: DoubleSide }),
      flaresDark: new MeshStandardMaterial({ color: '#5c1622', roughness: 0.9 }),
      buckle: new MeshStandardMaterial({ color: C.buckle, metalness: 0.9, roughness: 0.25 }),
      shoe: new MeshStandardMaterial({ color: C.shoe, roughness: 0.3, metalness: 0.1 }),
      sole: new MeshStandardMaterial({ color: '#1d120c', roughness: 0.7 }),
      hair: new MeshStandardMaterial({ color: C.hair, roughness: 0.75 }),
      beard: new MeshStandardMaterial({ color: C.beard, roughness: 0.95 }),
      frame: new MeshStandardMaterial({ color: C.frame, roughness: 0.25, metalness: 0.2 }),
      lens: new MeshStandardMaterial({ color: '#cfe0ff', roughness: 0.05, metalness: 0.4, transparent: true, opacity: 0.18 }),
      eyeWhite: new MeshStandardMaterial({ color: '#f1ece4', roughness: 0.3 }),
      iris: new MeshStandardMaterial({ color: '#2b1a10', roughness: 0.2 }),
      lips: new MeshStandardMaterial({ color: C.lips, roughness: 0.5 }),
      ring: new MeshStandardMaterial({ color: '#d8b45a', metalness: 0.9, roughness: 0.3 }),
    }
  }, [])

  // Body shapes (radius, height), bottom to top
  const torsoGeo = useLathe([
    [0.168, 0.0], [0.172, 0.08], [0.178, 0.18], [0.205, 0.3], [0.218, 0.38], [0.21, 0.44], [0.15, 0.49], [0.07, 0.505],
  ])
  const flareGeo = useLathe([
    [0.205, -0.5], [0.17, -0.42], [0.125, -0.28], [0.1, -0.12], [0.098, 0.0],
  ], 20)

  useLayoutEffect(() => {
    root.current?.traverse((o) => {
      if ((o as Mesh).isMesh && !(o as Mesh).userData.noShadow) o.castShadow = true
    })
  }, [])

  useFrame((state, dt) => {
    const p = getPose()
    const a = anim.current
    const now = performance.now()
    const t = state.clock.elapsedTime
    a.dance = MathUtils.damp(a.dance, p.dancing ? 1 : 0, 5, dt)
    const d = a.dance
    const beat = t * Math.PI * 2 * (118 / 60) // 118 bpm
    const idle = 1 - d

    // ---- idle: easy weight shift, breathing, friendly head tilt ----
    const shift = Math.sin(t * 0.7)
    hips.current!.position.x = shift * 0.02 * idle + Math.sin(beat / 2) * 0.06 * d
    hips.current!.position.y = 1.02 - Math.abs(Math.sin(beat)) * 0.04 * d
    hips.current!.rotation.z = shift * 0.03 * idle + Math.sin(beat / 2) * 0.12 * d
    hips.current!.rotation.y = 0.12 * idle + Math.sin(beat / 2) * 0.25 * d
    thighL.current!.rotation.z = lerp(0.06, 0.12, d) + shift * 0.02 * idle
    thighR.current!.rotation.z = lerp(-0.08, -0.12, d) + shift * 0.02 * idle
    thighL.current!.rotation.x = -Math.max(0, Math.sin(beat / 2)) * 0.35 * d
    thighR.current!.rotation.x = -Math.max(0, -Math.sin(beat / 2)) * 0.35 * d
    kneeL.current!.rotation.x = Math.max(0, Math.sin(beat / 2)) * 0.6 * d
    kneeR.current!.rotation.x = Math.max(0, -Math.sin(beat / 2)) * 0.6 * d

    const breathe = Math.sin(t * 1.6) * 0.012
    spine.current!.scale.set(1 + breathe * 0.6, 1, 1 + breathe)
    spine.current!.rotation.z = -shift * 0.025 * idle - Math.sin(beat / 2) * 0.1 * d
    spine.current!.rotation.x = 0.02 + Math.sin(beat) * 0.04 * d

    head.current!.rotation.z = -0.08 * idle + Math.sin(beat / 2) * 0.15 * d
    head.current!.rotation.y = Math.sin(t * 0.4) * 0.15 * idle
    head.current!.rotation.x = 0.03 + Math.sin(beat) * 0.1 * d

    // arms: relaxed, slightly away from the body, palms in
    let sLx = 0.05
    let sLz = 0.18
    let eLx = -0.25
    let sRx = 0.05
    let sRz = -0.18
    let eRx = -0.25

    // dance: the classic point-up / point-down with the right arm
    if (d > 0.001) {
      const up = Math.sin(beat / 2) > 0
      sRx = lerp(sRx, up ? -2.6 : -0.2, d)
      sRz = lerp(sRz, up ? -0.5 : -0.6, d)
      eRx = lerp(eRx, -0.05, d)
      sLx = lerp(sLx, -0.3, d)
      sLz = lerp(sLz, 0.35, d)
      eLx = lerp(eLx, -1.6, d)
    }

    // wave hello (left arm, so the word sleeve shows)
    const wk = (now - p.waveAt) / WAVE_MS
    if (wk >= 0 && wk < 1) {
      const w = Math.min(1, wk / 0.15, (1 - wk) / 0.15)
      sLx = lerp(sLx, -0.5, w)
      sLz = lerp(sLz, 2.4, w)
      eLx = lerp(eLx, -0.4 + Math.sin(wk * Math.PI * 6) * 0.35, w)
      head.current!.rotation.z += 0.1 * w
    }

    shoulderL.current!.rotation.set(sLx, 0, sLz)
    shoulderR.current!.rotation.set(sRx, 0, sRz)
    elbowL.current!.rotation.x = eLx
    elbowR.current!.rotation.x = eRx

    // jaw moves while talking
    if (jaw.current) jaw.current.rotation.x = p.talking ? Math.abs(Math.sin(t * 14)) * 0.12 : 0
  })

  const Leg = ({ side, thigh, knee }: { side: 1 | -1; thigh: React.RefObject<Group | null>; knee: React.RefObject<Group | null> }) => (
    <group ref={thigh} name={side === 1 ? 'thigh_L' : 'thigh_R'} position={[side * 0.092, -0.03, 0]}>
      <mesh material={mats.flares} position-y={-0.235}>
        <cylinderGeometry args={[0.112, 0.098, 0.47, 16]} />
      </mesh>
      {/* pressed centre crease */}
      <mesh material={mats.flaresDark} position={[0, -0.235, 0.104]}>
        <boxGeometry args={[0.006, 0.47, 0.004]} />
      </mesh>
      <group ref={knee} name={side === 1 ? 'knee_L' : 'knee_R'} position-y={-0.47}>
        {/* bell-bottom flare, open at the hem so the shoe shows */}
        <mesh material={mats.flares} geometry={flareGeo} />
        {/* hem */}
        <mesh material={mats.flaresDark} position-y={-0.497} rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.204, 0.006, 6, 24]} />
        </mesh>
        {/* shoe: polished leather with a stacked heel */}
        <group position={[0, -0.475, 0.1]}>
          <mesh material={mats.shoe} position={[0, 0.012, 0.03]} scale={[0.95, 0.62, 2.1]}>
            <sphereGeometry args={[0.065, 16, 12]} />
          </mesh>
          <mesh material={mats.shoe} position={[0, 0.02, -0.06]}>
            <boxGeometry args={[0.1, 0.06, 0.1]} />
          </mesh>
          <mesh material={mats.sole} position={[0, -0.028, 0.0]}>
            <boxGeometry args={[0.105, 0.016, 0.26]} />
          </mesh>
          <mesh material={mats.sole} position={[0, -0.025, -0.085]}>
            <boxGeometry args={[0.095, 0.03, 0.07]} />
          </mesh>
        </group>
      </group>
    </group>
  )

  const Arm = ({ side, shoulder, elbow }: { side: 1 | -1; shoulder: React.RefObject<Group | null>; elbow: React.RefObject<Group | null> }) => (
    <group ref={shoulder} name={side === 1 ? 'shoulder_L' : 'shoulder_R'} position={[side * 0.235, 0.42, 0]}>
      {/* shirt sleeve */}
      <mesh material={mats.shirt}>
        <sphereGeometry args={[0.068, 14, 12]} />
      </mesh>
      <mesh material={mats.shirt} position-y={-0.15}>
        <cylinderGeometry args={[0.066, 0.062, 0.29, 14]} />
      </mesh>
      <group ref={elbow} name={side === 1 ? 'elbow_L' : 'elbow_R'} position-y={-0.29}>
        {/* rolled cuff just below the elbow */}
        <mesh material={mats.shirtSolid} position-y={-0.035} rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.058, 0.022, 8, 18]} />
        </mesh>
        <mesh material={mats.shirt} position-y={-0.01}>
          <cylinderGeometry args={[0.066, 0.06, 0.05, 14]} />
        </mesh>
        <mesh material={side === 1 ? mats.tattoo : mats.forearm} position-y={-0.14}>
          <cylinderGeometry args={[0.05, 0.038, 0.22, 16]} />
        </mesh>
        <group position-y={-0.255}>
          <Hand side={side} skin={mats.skin} backDecal={side === 1 ? mats.handWord : undefined} ring={side === -1 ? mats.ring : undefined} curl={0.4} />
        </group>
      </group>
    </group>
  )

  return (
    <group ref={root} name="Saz">
      <group ref={hips} name="hips" position-y={1.02}>
        {/* high-waisted band with side buckle tabs */}
        <mesh material={mats.flares} position-y={0.06} scale={[1, 1, 0.8]}>
          <cylinderGeometry args={[0.178, 0.19, 0.16, 20]} />
        </mesh>
        <mesh material={mats.flares} position-y={-0.06} scale={[1, 1, 0.8]}>
          <cylinderGeometry args={[0.19, 0.212, 0.1, 20]} />
        </mesh>
        <mesh material={mats.flaresDark} position-y={0.135} scale={[1, 1, 0.8]}>
          <cylinderGeometry args={[0.18, 0.18, 0.012, 20]} />
        </mesh>
        {([-1, 1] as const).map((s) => (
          <group key={s} rotation-y={s * 1.05}>
            <mesh material={mats.flares} position={[0, 0.1, 0.165]}>
              <boxGeometry args={[0.07, 0.025, 0.01]} />
            </mesh>
            <mesh material={mats.buckle} position={[0.012, 0.1, 0.172]} rotation-z={Math.PI / 4}>
              <torusGeometry args={[0.017, 0.0035, 4, 4]} />
            </mesh>
          </group>
        ))}
        {/* fly seam + front pocket slits */}
        <mesh material={mats.flaresDark} position={[0.012, 0.02, 0.155]}>
          <boxGeometry args={[0.005, 0.13, 0.004]} />
        </mesh>
        {([-1, 1] as const).map((s) => (
          <mesh key={s} material={mats.flaresDark} position={[s * 0.13, 0.04, 0.115]} rotation={[0, s * 0.7, s * 0.35]}>
            <boxGeometry args={[0.005, 0.1, 0.004]} />
          </mesh>
        ))}

        <Leg side={1} thigh={thighL} knee={kneeL} />
        <Leg side={-1} thigh={thighR} knee={kneeR} />

        <group ref={spine} name="spine" position-y={0.12}>
          {/* shirt torso, tucked in */}
          <mesh material={mats.shirt} geometry={torsoGeo} scale={[1, 1, 0.74]} rotation-y={Math.PI} />
          {/* open collar V with chest hair */}
          <mesh material={mats.chest} position={[0, 0.405, 0.14]} rotation-x={-0.25}>
            <circleGeometry args={[0.06, 3, -Math.PI / 2]} />
          </mesh>
          {/* spread collar flaps */}
          {([-1, 1] as const).map((s) => (
            <group key={s} position={[s * 0.06, 0.47, 0.085]} rotation={[-0.55, s * 0.5, s * 0.55]}>
              <mesh material={mats.shirtSolid}>
                <boxGeometry args={[0.075, 0.1, 0.008]} />
              </mesh>
            </group>
          ))}
          <mesh material={mats.shirtSolid} position={[0, 0.49, -0.02]} rotation-x={-0.2}>
            <torusGeometry args={[0.075, 0.012, 6, 18, Math.PI]} />
          </mesh>
          {/* placket + buttons */}
          <mesh material={mats.shirtSolid} position={[0, 0.17, 0.15]} rotation-x={-0.06}>
            <boxGeometry args={[0.03, 0.34, 0.006]} />
          </mesh>
          {[0.3, 0.22, 0.14, 0.06].map((y) => (
            <mesh key={y} material={mats.button} position={[0, y, 0.156 - (0.3 - y) * 0.06]} scale={[1, 1, 0.4]}>
              <sphereGeometry args={[0.007, 8, 6]} />
            </mesh>
          ))}
          {/* chest pocket on his left */}
          <mesh material={mats.shirtSolid} position={[0.095, 0.3, 0.152]} rotation-y={0.25}>
            <boxGeometry args={[0.075, 0.08, 0.006]} />
          </mesh>
          <mesh material={mats.shirtSolid} position={[0.095, 0.338, 0.156]} rotation-y={0.25}>
            <boxGeometry args={[0.077, 0.006, 0.008]} />
          </mesh>

          <Arm side={1} shoulder={shoulderL} elbow={elbowL} />
          <Arm side={-1} shoulder={shoulderR} elbow={elbowR} />

          {/* neck */}
          <mesh material={mats.skin} position-y={0.52}>
            <cylinderGeometry args={[0.055, 0.062, 0.1, 12]} />
          </mesh>
          <group ref={head} name="head" position-y={0.57}>
            <SazHead mats={mats} jaw={jaw} />
          </group>
        </group>
      </group>
    </group>
  )
}

type HeadMats = Record<'skin' | 'hair' | 'beard' | 'frame' | 'lens' | 'eyeWhite' | 'iris' | 'lips', MeshStandardMaterial>

function SazHead({ mats, jaw }: { mats: HeadMats; jaw: React.RefObject<Group | null> }) {
  const curls = useRef<InstancedMesh>(null)
  const puffs = useRef<InstancedMesh>(null)

  // Big curly hair: torus curls + soft puffs scattered over an ellipsoid shell.
  const { curlMats, puffMats } = useMemo(() => {
    const rand = rng(1971)
    const m = new Matrix4()
    const q = new Quaternion()
    const e = new Euler()
    const curlMats: Matrix4[] = []
    const puffMats: Matrix4[] = []
    const center = new Vector3(0, 0.16, -0.04)
    const R = new Vector3(0.235, 0.2, 0.205)
    let tries = 0
    while ((curlMats.length < 230 || puffMats.length < 70) && tries++ < 5000) {
      // random direction
      const u = rand() * 2 - 1
      const th = rand() * Math.PI * 2
      const s = Math.sqrt(1 - u * u)
      const dir = new Vector3(s * Math.cos(th), u, s * Math.sin(th))
      // keep the face clear, let it fall a little lower at the back and sides
      if (dir.z > 0.25 && dir.y < 0.55) continue
      if (dir.y < -0.55) continue
      if (dir.y < -0.15 && dir.z > 0.0) continue
      const shell = 0.82 + rand() * 0.22
      const pos = new Vector3(dir.x * R.x, dir.y * R.y, dir.z * R.z).multiplyScalar(shell).add(center)
      e.set(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI)
      q.setFromEuler(e)
      if (curlMats.length < 230 && rand() > 0.22) {
        const sc = 0.8 + rand() * 0.6
        m.compose(pos, q, new Vector3(sc, sc, sc))
        curlMats.push(m.clone())
      } else if (puffMats.length < 70) {
        const sc = 0.9 + rand() * 0.5
        m.compose(pos.clone().multiplyScalar(1), q, new Vector3(sc, sc, sc))
        puffMats.push(m.clone())
      }
    }
    return { curlMats, puffMats }
  }, [])

  useLayoutEffect(() => {
    curlMats.forEach((m, i) => curls.current!.setMatrixAt(i, m))
    puffMats.forEach((m, i) => puffs.current!.setMatrixAt(i, m))
    curls.current!.instanceMatrix.needsUpdate = true
    puffs.current!.instanceMatrix.needsUpdate = true
  }, [curlMats, puffMats])

  return (
    <group>
      {/* skull */}
      <mesh material={mats.skin} position-y={0.12} scale={[0.88, 1.06, 0.97]}>
        <sphereGeometry args={[0.13, 28, 20]} />
      </mesh>
      {/* cheeks */}
      {[-1, 1].map((s) => (
        <mesh key={s} material={mats.skin} position={[s * 0.06, 0.085, 0.085]}>
          <sphereGeometry args={[0.04, 12, 10]} />
        </mesh>
      ))}
      {/* nose */}
      <mesh material={mats.skin} position={[0, 0.105, 0.128]} rotation-x={0.25} scale={[0.8, 1.3, 1]}>
        <sphereGeometry args={[0.022, 12, 10]} />
      </mesh>
      <mesh material={mats.skin} position={[0, 0.085, 0.137]}>
        <sphereGeometry args={[0.017, 10, 8]} />
      </mesh>
      {/* eyes: whites, irises, warm half-smile lids */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.043, 0.138, 0.108]}>
          <mesh material={mats.eyeWhite} scale={[1, 0.7, 0.6]}>
            <sphereGeometry args={[0.017, 12, 10]} />
          </mesh>
          <mesh material={mats.iris} position-z={0.009} scale={[1, 1, 0.5]}>
            <sphereGeometry args={[0.009, 10, 8]} />
          </mesh>
          <mesh material={mats.skin} position={[0, 0.009, 0.002]} scale={[1.15, 0.45, 0.7]}>
            <sphereGeometry args={[0.019, 10, 8]} />
          </mesh>
          <mesh material={mats.beard} position={[0, 0.03, 0.006]} rotation-z={s * -0.12}>
            <boxGeometry args={[0.042, 0.011, 0.01]} />
          </mesh>
        </group>
      ))}
      {/* thick square glasses */}
      <group position={[0, 0.138, 0.128]}>
        {[-1, 1].map((s) => (
          <group key={s} position-x={s * 0.044}>
            <mesh material={mats.frame} position-y={0.024}>
              <boxGeometry args={[0.058, 0.012, 0.01]} />
            </mesh>
            <mesh material={mats.frame} position-y={-0.022}>
              <boxGeometry args={[0.058, 0.008, 0.01]} />
            </mesh>
            <mesh material={mats.frame} position-x={s * 0.027}>
              <boxGeometry args={[0.009, 0.054, 0.01]} />
            </mesh>
            <mesh material={mats.frame} position-x={-s * 0.025}>
              <boxGeometry args={[0.007, 0.05, 0.01]} />
            </mesh>
            <mesh material={mats.lens} userData={{ noShadow: true }}>
              <planeGeometry args={[0.048, 0.04]} />
            </mesh>
            {/* temple arm back to the ear */}
            <mesh material={mats.frame} position={[s * 0.032, 0.018, -0.06]} rotation-y={s * 0.08}>
              <boxGeometry args={[0.006, 0.008, 0.12]} />
            </mesh>
          </group>
        ))}
        <mesh material={mats.frame} position-y={0.012}>
          <boxGeometry args={[0.022, 0.007, 0.01]} />
        </mesh>
      </group>
      {/* beard: full jaw, moustache, smiling lips, pointed goatee */}
      <group ref={jaw} position={[0, 0.07, 0.01]}>
        <mesh material={mats.beard} position={[0, 0.0, 0.025]} scale={[0.92, 0.8, 0.95]}>
          <sphereGeometry args={[0.108, 20, 14, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.42]} />
        </mesh>
        <mesh material={mats.beard} position={[0, -0.075, 0.075]} rotation-x={Math.PI + 0.35}>
          <coneGeometry args={[0.042, 0.1, 10]} />
        </mesh>
        <mesh material={mats.lips} position={[0, 0.0, 0.122]} rotation-z={Math.PI / 2} scale={[1, 1, 0.6]}>
          <capsuleGeometry args={[0.008, 0.035, 4, 8]} />
        </mesh>
      </group>
      {/* moustache, curving down into the beard */}
      {[-1, 1].map((s) => (
        <mesh key={s} material={mats.beard} position={[s * 0.026, 0.078, 0.128]} rotation-z={s * -0.35} scale={[1, 0.6, 0.6]}>
          <capsuleGeometry args={[0.011, 0.03, 4, 8]} />
        </mesh>
      ))}
      {/* sideburns joining hair and beard */}
      {[-1, 1].map((s) => (
        <mesh key={s} material={mats.beard} position={[s * 0.108, 0.1, 0.02]} scale={[0.4, 1.2, 0.8]}>
          <sphereGeometry args={[0.04, 10, 8]} />
        </mesh>
      ))}
      {/* hair */}
      <mesh material={mats.hair} position={[0, 0.19, -0.06]} scale={[0.185, 0.15, 0.16]}>
        <sphereGeometry args={[1, 20, 16]} />
      </mesh>
      <instancedMesh ref={curls} args={[undefined, undefined, curlMats.length]} material={mats.hair} castShadow>
        <torusGeometry args={[0.024, 0.012, 6, 10]} />
      </instancedMesh>
      <instancedMesh ref={puffs} args={[undefined, undefined, puffMats.length]} material={mats.hair} castShadow>
        <icosahedronGeometry args={[0.038, 1]} />
      </instancedMesh>
    </group>
  )
}
```

### `characters/sazTextures.ts: painted textures and the word-cloud sleeve`

```ts
import { canvasTexture, fabricTexture, hairySkin, makeCanvas, rng } from './parts'

export const SAZ_SKIN = '#a8704a'
const ARM_HAIR = '#2a1a10'
const INK = 'rgba(28,22,30,0.88)'

// The words in his tattoo sleeve. All four letters, all 70s mood.
export const SAZ_TATTOO_WORDS = [
  'FUNK', 'SOUL', 'JAZZ', 'VIBE', 'GLOW', 'FREE', 'ROAM', 'RIFF',
  'BASS', 'HOPE', 'KIND', 'WILD', 'LOVE', 'ECHO', 'DUSK', 'COOL',
  'SWAY', 'DIGS', 'GOLD', 'HUSH',
]
export const SAZ_HAND_WORD = 'KIND'

const FONTS = [
  'bold {s}px Georgia, serif',
  'italic {s}px Georgia, serif',
  'bold {s}px "Courier New", monospace',
  '900 {s}px Impact, "Arial Black", sans-serif',
  'italic bold {s}px "Brush Script MT", cursive',
  '{s}px "Trebuchet MS", sans-serif',
]

/**
 * Forearm sleeve: four-letter words packed as a word cloud, wrapped around
 * the arm (u = around, v = along). Big words on the outside of the forearm.
 */
export function wordCloudTexture() {
  const W = 512
  const H = 512
  const [c, ctx] = makeCanvas(W, H)
  hairySkin(ctx, W, H, SAZ_SKIN, ARM_HAIR, 2200, 21)
  const rand = rng(77)
  const placed: { x: number; y: number; w: number; h: number }[] = []
  const overlaps = (b: { x: number; y: number; w: number; h: number }) =>
    placed.some((p) => b.x < p.x + p.w && b.x + b.w > p.x && b.y < p.y + p.h && b.y + b.h > p.y)

  ctx.fillStyle = INK
  ctx.textBaseline = 'top'
  // biggest first so they claim the visible outer side of the arm
  const words = [...SAZ_TATTOO_WORDS, ...SAZ_TATTOO_WORDS.slice(0, 10)]
  words.forEach((word, i) => {
    const size = Math.round(i < 6 ? 84 - i * 6 : 32 + rand() * 18)
    const vertical = i > 3 && rand() > 0.7
    ctx.font = FONTS[Math.floor(rand() * FONTS.length)].replace('{s}', String(size))
    const tw = ctx.measureText(word).width
    const bw = vertical ? size : tw
    const bh = vertical ? tw : size
    for (let attempt = 0; attempt < 120; attempt++) {
      // favour the outer face of the arm (u around 0.25..0.75 of the strip)
      const x = (i < 6 ? W * 0.18 + rand() * W * 0.5 : rand() * (W - bw))
      const y = H * 0.12 + rand() * (H * 0.76 - bh)
      const box = { x: x - 3, y: y - 3, w: bw + 6, h: bh + 6 }
      if (overlaps(box)) continue
      placed.push(box)
      ctx.save()
      if (vertical) {
        ctx.translate(x + size, y)
        ctx.rotate(Math.PI / 2)
        ctx.fillText(word, 0, 0)
      } else ctx.fillText(word, x, y)
      ctx.restore()
      break
    }
  })
  // a few small stars and dots to fill gaps
  for (let i = 0; i < 26; i++) {
    const x = rand() * W
    const y = H * 0.1 + rand() * H * 0.8
    const box = { x: x - 4, y: y - 4, w: 8, h: 8 }
    if (overlaps(box)) continue
    ctx.beginPath()
    ctx.arc(x, y, 2 + rand() * 2, 0, Math.PI * 2)
    ctx.fill()
  }
  return canvasTexture(c)
}

/** Back-of-hand tattoo: one word, square tile with transparency. */
export function handWordTexture() {
  const [c, ctx] = makeCanvas(128, 128)
  hairySkin(ctx, 128, 128, SAZ_SKIN, ARM_HAIR, 120, 4)
  ctx.fillStyle = INK
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = 'bold italic 40px Georgia, serif'
  ctx.fillText(SAZ_HAND_WORD, 64, 64)
  ctx.font = '14px Georgia, serif'
  ctx.fillText('* * *', 64, 96)
  return canvasTexture(c)
}

export function forearmTexture() {
  const [c, ctx] = makeCanvas(256, 256)
  hairySkin(ctx, 256, 256, SAZ_SKIN, ARM_HAIR, 900, 13)
  return canvasTexture(c)
}

/** Cream shirt: fine weave + soft fold shading. */
export function shirtTexture() {
  const c = fabricTexture('#efe7d8', { grain: 0.035, seed: 3 })
  const ctx = c.getContext('2d')!
  for (let i = 0; i < 9; i++) {
    const x = 20 + i * 28
    const g = ctx.createLinearGradient(x - 10, 0, x + 10, 0)
    g.addColorStop(0, 'rgba(0,0,0,0)')
    g.addColorStop(0.5, 'rgba(120,100,80,0.07)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(x - 10, 0, 20, 256)
  }
  return canvasTexture(c)
}

export function flaresTexture() {
  return canvasTexture(fabricTexture('#7c2230', { grain: 0.07, seed: 8 }), [2, 2])
}

/** Patch of skin with chest hair for the open collar. */
export function chestTexture() {
  const [c, ctx] = makeCanvas(128, 128)
  hairySkin(ctx, 128, 128, SAZ_SKIN, '#1c120c', 500, 31)
  return canvasTexture(c)
}
```

### `characters/parts.tsx: shared hands, fabric and shape helpers`

```tsx
import { useMemo } from 'react'
import { CanvasTexture, LatheGeometry, Material, RepeatWrapping, SRGBColorSpace, Vector2 } from 'three'

// Shared building blocks for the hand-built characters.

/** Round body section from (radius, height) pairs, bottom to top. Front (+Z) is u = 0. */
export function useLathe(profile: [number, number][], segments = 24) {
  return useMemo(() => new LatheGeometry(profile.map(([r, y]) => new Vector2(r, y)), segments), [profile, segments])
}

/**
 * A hand hanging down from the wrist: palm faces the body, back of the hand faces out.
 * `side` is +1 for the character's left hand (+X), -1 for the right.
 */
export function Hand({
  side,
  skin,
  curl = 0.35,
  backDecal,
  ring,
}: {
  side: 1 | -1
  skin: Material
  curl?: number
  backDecal?: Material
  ring?: Material
}) {
  const fingers = [
    { z: 0.026, len: 0.04 }, // index (front)
    { z: 0.009, len: 0.046 },
    { z: -0.008, len: 0.043 },
    { z: -0.024, len: 0.034 }, // pinky
  ]
  return (
    <group>
      {/* palm */}
      <mesh material={skin} position-y={-0.035} scale={[1, 1, 1]}>
        <boxGeometry args={[0.028, 0.072, 0.07]} />
      </mesh>
      <mesh material={skin} position={[0, -0.003, 0]} scale={[0.6, 0.45, 1]}>
        <sphereGeometry args={[0.035, 12, 8]} />
      </mesh>
      {backDecal && (
        <mesh material={backDecal} position={[side * 0.0145, -0.036, 0]} rotation-y={side * (Math.PI / 2)}>
          <planeGeometry args={[0.062, 0.062]} />
        </mesh>
      )}
      {fingers.map((f, i) => (
        <group key={i} position={[0, -0.07, f.z]} rotation-z={-side * curl * 0.6}>
          <mesh material={skin} position-y={-f.len * 0.25}>
            <capsuleGeometry args={[0.0085, f.len * 0.5, 4, 8]} />
          </mesh>
          <group position-y={-f.len * 0.55} rotation-z={-side * curl}>
            <mesh material={skin} position-y={-f.len * 0.22}>
              <capsuleGeometry args={[0.0078, f.len * 0.42, 4, 8]} />
            </mesh>
          </group>
          {ring && i === 2 && (
            <mesh material={ring} position-y={-f.len * 0.3} rotation-z={Math.PI / 2}>
              <torusGeometry args={[0.011, 0.0028, 6, 12]} />
            </mesh>
          )}
        </group>
      ))}
      {/* thumb, angled forward and in */}
      <group position={[-side * 0.008, -0.025, 0.033]} rotation={[0.5, 0, -side * 0.45]}>
        <mesh material={skin} position-y={-0.018}>
          <capsuleGeometry args={[0.01, 0.03, 4, 8]} />
        </mesh>
      </group>
    </group>
  )
}

// ---- canvas helpers ------------------------------------------------------

export function makeCanvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')!] as const
}

export function canvasTexture(c: HTMLCanvasElement, repeat?: [number, number]) {
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  t.anisotropy = 4
  if (repeat) {
    t.wrapS = t.wrapT = RepeatWrapping
    t.repeat.set(...repeat)
  }
  return t
}

/** Seeded RNG so procedural details are identical on every load. */
export function rng(seed: number) {
  let s = seed % 2147483647 || 1
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

/** Base colour with woven grain and optional dusty smudges. */
export function fabricTexture(base: string, opts: { grain?: number; dust?: string; dustAmount?: number; seed?: number; size?: number } = {}) {
  const size = opts.size ?? 256
  const [c, ctx] = makeCanvas(size, size)
  ctx.fillStyle = base
  ctx.fillRect(0, 0, size, size)
  const rand = rng(opts.seed ?? 5)
  const grain = opts.grain ?? 0.06
  // twill lines
  for (let i = -size; i < size * 2; i += 3) {
    ctx.strokeStyle = `rgba(0,0,0,${grain * (0.5 + rand())})`
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i + size * 0.5, size)
    ctx.stroke()
  }
  // speckle
  for (let i = 0; i < size * 6; i++) {
    ctx.fillStyle = rand() > 0.5 ? `rgba(255,255,255,${grain})` : `rgba(0,0,0,${grain})`
    ctx.fillRect(rand() * size, rand() * size, 1, 1)
  }
  if (opts.dust) {
    for (let i = 0; i < (opts.dustAmount ?? 14); i++) {
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1)
      g.addColorStop(0, opts.dust)
      g.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.save()
      ctx.translate(rand() * size, rand() * size)
      ctx.scale(8 + rand() * 26, 6 + rand() * 18)
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(0, 0, 1, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
  }
  return c
}

/** Skin with fine body hair, for forearms. */
export function hairySkin(ctx: CanvasRenderingContext2D, w: number, h: number, skin: string, hair: string, density = 900, seed = 9) {
  ctx.fillStyle = skin
  ctx.fillRect(0, 0, w, h)
  const rand = rng(seed)
  ctx.strokeStyle = hair
  ctx.lineWidth = 1
  for (let i = 0; i < density; i++) {
    const x = rand() * w
    const y = rand() * h
    ctx.globalAlpha = 0.15 + rand() * 0.3
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + (rand() - 0.5) * 3, y + 3 + rand() * 4)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}
```


# Kiai: Character Handover

A complete handover for **Kiai** (気合, the shout in martial arts, said "kee-eye"), an original character
created by the project owner for the game *The Last Lantern*. Give this file plus the files below to another
Claude conversation and it has everything needed to rebuild, extend or reuse her.

## Files in this kit

| File | What it is |
|---|---|
| `KIAI_HANDOVER.md` | This document: character bible, gameplay kit, music, rig notes and full source |
| `kiai.glb` | The 3D model (with her keytar) as a standard glTF binary |
| `kiai-concept.png` | The original concept art. **This is the design reference: when in doubt, match it** |

Her friends Gimlet and Saz have kits in `../gimlet/` and `../saz/`.

## Who she is

- **Name:** Kiai. She shouts it, and occasionally apologises for it.
- **Role:** Playable hero (choose her on the title screen), and a village character when you play Gimlet.
- **Personality:** Bright, confident, a big warm grin. A performer who believes even the scariest things just
  need the right song. Gentle first, but she will absolutely turn it up.
- **Voice samples** (from the game script):
  - "Or maybe nobody's ever sung to them."
  - "KIAI! ...Sorry. Force of habit. Yes. I'll do it."
  - "Sing to the sad ones, shred the mean ones. Got it."
  - "Only if there's a stage."

## Look (from the concept art)

**Silhouette:** short and curvy with a confident hip-cocked stance, a spiky blue pixie cut on top, and a big
angular purple keytar slung diagonally across her body.

| Part | Description | Colour(s) |
|---|---|---|
| Skin | Warm golden tan | `#cf9a6c` |
| Hair | Short layered pixie, long side-swept fringe falling toward her left, piecey crown with a cowlick, tapered nape | royal blue `#2f52e6`, deep `#1f37b8`, highlights `#5a86ff` |
| Face | Big warm brown eyes with lashes and a flick at the outer corner, defined brows, small nose, wide toothy smile, rosy blush, **magenta bindi** | iris browns, lips `#c75a6a`, bindi `#c2185b` |
| Ears | Large gold hoop earrings | gold `#e3b04b` |
| Top | Strapless bandeau: lime with pink roses and curling vines, teal trim top and bottom | lime `#c9df7c`, teal `#2a8c7e`, rose `#e2487f` |
| Skirt | Layered wrap mini: rose-print lime wrap over a teal underlayer, gathered at her left hip with a gold ring | as above |
| Knees | Rose-print knee bands with teal trim | as above |
| Jewellery | Gold bangle on each wrist, gold rings around both ankles | gold |
| Shoes | Hot-pink platform sandals with block heels and criss-cross straps, pink toenails | `#e2489a` |
| Keytar | Angular purple keytar: pointed tail with a neon circuit line and four buttons, 37 lilac and violet keys, a pitch ribbon, an open-triangle head. Lilac strap over her left shoulder | body `#8b45d8`, strap `#c9a2f5` |

### Tattoos

- **Midriff,** just under her top: **"louder, please"** in flowing script with two tiny stars.
- **Right collarbone:** a **circular seal** reading **"CERTIFIED TROUBLE ✦ NO REFUNDS ✦"** around a winking face
  with its tongue out.

Both are painted in `textures.ts` (`KIAI_MIDRIFF_TEXT`, `KIAI_SEAL_TEXT`), so the wording can be changed in
one place.

## Gameplay kit (tuning in `game/src/store.ts`)

Kiai has two modes:

- **Harmony** (Q / right-click / "Harmony" button): she sings a sweet arpeggio. Every hostile Hollow one within
  **7 m** is charmed; on the **second** charm it **switches sides**. 1.6 s cooldown.
  - **Befriended** Hollow ones turn lavender with golden eyes. Each one walks to the nearest hostile Hollow one
    and **cuddles** it; after **1.5 s** of hugging, that one switches sides too, and the chain continues.
    A hostile one being hugged stops attacking. With no hostile ones left, friends trail after Kiai.
- **Shred** (F / click / "Shred" button): a heavy distorted power chord plus a rising screech. A **7 m, 70°
  cone** in front of her does **2 damage** to hostile Hollow ones (they have 3 HP). 0.7 s cooldown.

Design intent: she can finish the level without destroying anything. Befriended Hollow ones count toward
clearing the road, and they gather at the beacon when it's lit.

## Music (all original, in `music.ts`)

Her animation and her sound share one score, so the keys she presses are the notes you hear.
- **Harmony:** 132 bpm, a lilting major-key arpeggio, voiced as a soft "sung" triangle/sine with vibrato.
- **Shred:** 168 bpm, power chords (root, fifth, octave) through distortion, with a wailing filtered lead.
- **Idle:** 84 bpm, a few soft notes while she noodles.
The synth is built from scratch with the Web Audio API (no samples).

## Rig and animation

Same joint names as Gimlet and Saz. Her arms are positioned with **two-bone IK** (`ik.ts`): every frame the
right wrist is sent to the key she's playing and the left wrist to the keytar neck, so her hands stay on the
instrument whatever her body does.

```
Kiai
└─ hips (y = 0.95)
   ├─ thigh_L ─ knee_L   (knee band, foot, platform sandal)
   ├─ thigh_R ─ knee_R
   └─ spine
      ├─ shoulder_L ─ elbow_L   (holds the keytar neck)
      ├─ shoulder_R ─ elbow_R   (plays the keys)
      ├─ keytar                 (37 keys that press down individually)
      └─ head
```

| Move | What it looks like |
|---|---|
| Idle | Hip cocked, weight on her right leg, plays a few soft notes, smiling head tilt |
| Harmony | Sways side to side with the beat, head tilts, mouth opens to sing, right hand walks the arpeggio |
| Shred | Wide power stance, keytar neck raised, headbangs on the beat, hammers chords; recoils on each blast |
| Run | Keytar held steady while she runs |

**About `kiai.glb`:** a static model (idle pose) with named joints. Her hair is a single merged mesh of
tapered strands. No skinning or animation clips.

## Prompt to paste into another Claude

> I'm handing over an original game character called Kiai. The attached `KIAI_HANDOVER.md` is the character
> bible and full source code, `kiai-concept.png` is the concept art (the design reference), and `kiai.glb` is
> the current 3D model. Please read the handover fully before starting. Keep her look, tattoos, personality
> and two-mode kit consistent with it. What I'd like to do next is: …

## Full source

### `characters/kiai/Kiai.tsx: model, IK-driven arms and animation`

```tsx
import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, DoubleSide, Euler, Group, LatheGeometry, MathUtils, Matrix4, Mesh, MeshStandardMaterial, Quaternion, Vector2, Vector3 } from 'three'
import { Hand, rng } from '../parts'
import { solveArmIK } from '../ik'
import { hairGeometry, strandGeometry, type Strand } from '../hair'
import { KIAI, faceTexture, irisTexture, midriffTattoo, roseFabric, sealTattoo } from './textures'
import { Keytar, NECK_GRIP, NECK_PIN, TAIL_PIN, keyPoint, type KeytarHandle } from './Keytar'
import { HARMONY, IDLE, SHRED, chord, stepAt } from './music'

// Kiai: keytar-slinging musician. Original character from the project owner's
// concept art. Same joint names as Gimlet and Saz.

export type KiaiMode = 'idle' | 'harmony' | 'shred'
export type KiaiPose = {
  moving: boolean
  mode: KiaiMode
  modeStart: number // performance.now() when the current song started
  castAt: number // last Harmony cast
  shredAt: number // last Shred blast
  talking?: boolean
}

const UPPER = 0.27
const LOWER = 0.245
const lerp = MathUtils.lerp

// torso profile (radius, height) in spine space, bottom to top
const TORSO: [number, number][] = [
  [0.158, -0.12], [0.162, -0.06], [0.136, 0.0], [0.128, 0.04], [0.131, 0.08], [0.142, 0.13], [0.158, 0.19], [0.156, 0.225], [0.144, 0.26], [0.134, 0.3], [0.118, 0.33], [0.075, 0.36],
]
const torsoR = (y: number) => {
  for (let i = 1; i < TORSO.length; i++) {
    const [r0, y0] = TORSO[i - 1]
    const [r1, y1] = TORSO[i]
    if (y <= y1) return lerp(r0, r1, (y - y0) / (y1 - y0))
  }
  return TORSO[TORSO.length - 1][0]
}
const Z_SCALE = 0.72

const lathe = (pts: [number, number][], seg = 24, phiStart = 0, phiLength = Math.PI * 2) =>
  new LatheGeometry(pts.map(([r, y]) => new Vector2(r, y)), seg, phiStart, phiLength)

// keytar placement in spine space
const KEYTAR_POS = new Vector3(0.03, -0.05, 0.19)
const KEYTAR_ROT = new Euler(-0.25, -0.1, 0.33)

export function Kiai({ getPose }: { getPose: () => KiaiPose }) {
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
  const keytarGroup = useRef<Group>(null)
  const keytar = useRef<KeytarHandle>(null)
  const mouth = useRef<Mesh>(null)
  const anim = useRef({ run: 0, phase: 0, shred: 0, harmony: 0, handX: 0, lastStep: -1 })

  const mats = useMemo(() => {
    const skin = new MeshStandardMaterial({ color: KIAI.skin, roughness: 0.5 })
    return {
      skin,
      face: new MeshStandardMaterial({ map: faceTexture(), roughness: 0.5 }),
      top: new MeshStandardMaterial({ map: roseFabric({ trimTop: 34, trimBottom: 34, roses: 5, seed: 4 }), roughness: 0.8 }),
      skirt: new MeshStandardMaterial({ map: roseFabric({ trimBottom: 0, roses: 7, seed: 9, h: 192 }), roughness: 0.85, side: DoubleSide }),
      teal: new MeshStandardMaterial({ color: KIAI.teal, roughness: 0.85, side: DoubleSide }),
      knee: new MeshStandardMaterial({ map: roseFabric({ trimTop: 26, trimBottom: 26, roses: 2, seed: 2, w: 256, h: 128 }), roughness: 0.8 }),
      gold: new MeshStandardMaterial({ color: KIAI.gold, metalness: 0.95, roughness: 0.22 }),
      sandal: new MeshStandardMaterial({ color: KIAI.sandal, roughness: 0.35 }),
      sandalDark: new MeshStandardMaterial({ color: '#c23384', roughness: 0.4 }),
      strap: new MeshStandardMaterial({ color: KIAI.keytarLight, roughness: 0.6 }),
      buckle: new MeshStandardMaterial({ color: '#d9dce2', metalness: 0.9, roughness: 0.25 }),
      hair: new MeshStandardMaterial({ vertexColors: true, roughness: 0.42, metalness: 0.05 }),
      hairCap: new MeshStandardMaterial({ color: KIAI.hairDeep, roughness: 0.6 }),
      sclera: new MeshStandardMaterial({ color: '#f7f1ea', roughness: 0.25 }),
      iris: new MeshStandardMaterial({ map: irisTexture(), roughness: 0.15 }),
      glint: new MeshStandardMaterial({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 1.5 }),
      lash: new MeshStandardMaterial({ color: '#160d0b', roughness: 0.6 }),
      brow: new MeshStandardMaterial({ color: '#2a1913', roughness: 0.9 }),
      lips: new MeshStandardMaterial({ color: KIAI.lips, roughness: 0.35 }),
      teeth: new MeshStandardMaterial({ color: '#fbf7f0', roughness: 0.3 }),
      mouthIn: new MeshStandardMaterial({ color: '#5a1f26', roughness: 0.8 }),
      toenail: new MeshStandardMaterial({ color: '#e46aa3', roughness: 0.3 }),
      midriffInk: new MeshStandardMaterial({ map: midriffTattoo(), transparent: true, roughness: 0.5, depthWrite: false }),
      sealInk: new MeshStandardMaterial({ map: sealTattoo(), transparent: true, roughness: 0.5, depthWrite: false }),
    }
  }, [])

  const geo = useMemo(() => {
    const torso = lathe(TORSO, 32)
    const bandeauPts: [number, number][] = []
    for (let y = 0.11; y <= 0.245; y += 0.015) bandeauPts.push([torsoR(y) + 0.007, y])
    const bandeau = lathe(bandeauPts, 32)
    const midPts: [number, number][] = []
    for (let y = 0.072; y <= 0.108; y += 0.006) midPts.push([torsoR(y) + 0.0015, y])
    // the tattoo band only wraps the front of the waist
    const midriff = lathe(midPts, 16, -0.8, 1.6)
    const skirtProfile: [number, number][] = [[0.228, -0.24], [0.214, -0.15], [0.195, -0.06], [0.177, 0.02], [0.158, 0.07], [0.149, 0.095]]
    const skirtUnder = lathe(skirtProfile.map(([r, y], i) => [r - 0.003, i === 0 ? y - 0.02 : y]), 32)
    const skirtOuter = lathe(skirtProfile.map(([r, y], i) => [r + 0.004, i === 0 ? y + 0.025 : y]), 40, 0.94, Math.PI * 2 - 0.26)
    const thigh = lathe([[0.052, -0.42], [0.06, -0.38], [0.076, -0.25], [0.089, -0.12], [0.094, -0.03], [0.094, 0.02]], 20)
    const shin = lathe([[0.031, -0.4], [0.035, -0.35], [0.046, -0.22], [0.052, -0.13], [0.049, -0.06], [0.047, 0]], 20)
    const upperArm = lathe([[0.033, -0.27], [0.036, -0.22], [0.041, -0.12], [0.043, -0.05], [0.044, 0]], 16)
    const foreArm = lathe([[0.023, -0.245], [0.026, -0.2], [0.032, -0.1], [0.034, -0.04], [0.032, 0]], 16)
    return { torso, bandeau, midriff, skirtUnder, skirtOuter, thigh, shin, upperArm, foreArm }
  }, [])

  // keytar strap, in spine space, passing behind her back and over her left shoulder
  const strapGeo = useMemo(() => {
    const m = new Matrix4().compose(KEYTAR_POS, new Quaternion().setFromEuler(KEYTAR_ROT), new Vector3(1, 1, 1))
    const tail = TAIL_PIN.clone().applyMatrix4(m)
    const neck = NECK_PIN.clone().applyMatrix4(m)
    const pts = [
      tail,
      new Vector3(-0.17, -0.02, 0.07),
      new Vector3(-0.15, 0.06, -0.09),
      new Vector3(-0.02, 0.18, -0.12),
      new Vector3(0.1, 0.3, -0.1),
      new Vector3(0.13, 0.385, -0.02),
      new Vector3(0.13, 0.36, 0.08),
      new Vector3(0.16, 0.26, 0.135),
      neck,
    ]
    return strandGeometry({ points: pts, radius: 0.016, color: new Color(KIAI.keytarLight), flatten: 0.75, taper: 0 }, 60, 6)
  }, [])

  // where the clavicle seal sits on her right collarbone
  const seal = useMemo(() => {
    const y = 0.3
    const x = -0.068
    const a = torsoR(y)
    const b = a * Z_SCALE
    const z = b * Math.sqrt(Math.max(0, 1 - (x * x) / (a * a)))
    const n = new Vector3(x / (a * a), 0.35 / a, z / (b * b)).normalize()
    const q = new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), n)
    return { pos: new Vector3(x, y, z).addScaledVector(n, 0.002), q }
  }, [])

  useLayoutEffect(() => {
    root.current?.traverse((o) => {
      const m = o as Mesh
      if (m.isMesh && !m.userData.noShadow) m.castShadow = true
    })
  }, [])

  // scratch
  const keytarM = useMemo(() => new Matrix4(), [])
  const tmp = useMemo(() => ({ kq: new Quaternion(), ke: new Euler(), one: new Vector3(1, 1, 1), tR: new Vector3(), tL: new Vector3(), kp: new Vector3() }), [])
  const poleR = useMemo(() => new Vector3(-1, -0.3, -0.6).normalize(), [])
  const poleL = useMemo(() => new Vector3(1, -0.6, -0.4).normalize(), [])

  useFrame((state, dt) => {
    const p = getPose()
    const a = anim.current
    const now = performance.now()
    const t = state.clock.elapsedTime
    a.run = MathUtils.damp(a.run, p.moving ? 1 : 0, 10, dt)
    a.shred = MathUtils.damp(a.shred, p.mode === 'shred' ? 1 : 0, 8, dt)
    a.harmony = MathUtils.damp(a.harmony, p.mode === 'harmony' ? 1 : 0, 6, dt)
    a.phase += dt * 10 * (0.3 + a.run * 0.7)
    const run = a.run
    const sh = a.shred
    const hm = a.harmony
    const still = 1 - run
    const swing = Math.sin(a.phase) * 0.7 * run

    // which song and which step are we on
    const song = p.mode === 'shred' ? SHRED.bpm : p.mode === 'harmony' ? HARMONY.bpm : IDLE.bpm
    const step = stepAt(song, p.modeStart, now)
    const stepPhase = ((now - p.modeStart) % (60000 / song / 2)) / (60000 / song / 2)
    let pressed: number[] = []
    let handKey = 14
    if (p.mode === 'harmony') {
      handKey = HARMONY.notes[((step % HARMONY.notes.length) + HARMONY.notes.length) % HARMONY.notes.length]
      pressed = stepPhase < 0.85 ? [handKey] : []
    } else if (p.mode === 'shred') {
      const r = SHRED.roots[((step % SHRED.roots.length) + SHRED.roots.length) % SHRED.roots.length]
      handKey = r + 6
      pressed = stepPhase < 0.7 ? chord(r) : []
    } else {
      const n = IDLE.notes[((step % IDLE.notes.length) + IDLE.notes.length) % IDLE.notes.length]
      if (n >= 0 && run < 0.5) {
        handKey = n
        pressed = stepPhase < 0.6 ? [n] : []
      }
    }
    keytar.current?.press(pressed)

    // ---- body ----
    const beat = Math.sin(((now - p.modeStart) / (60000 / song)) * Math.PI)
    hips.current!.position.y = 0.95 + Math.abs(Math.sin(a.phase)) * 0.04 * run - Math.abs(beat) * 0.02 * sh
    hips.current!.position.x = 0.018 * still * (1 - sh) + beat * 0.02 * hm
    hips.current!.rotation.z = 0.06 * still * (1 - sh) + beat * 0.05 * hm
    hips.current!.rotation.y = Math.sin(a.phase) * 0.1 * run - 0.12 * still
    // weight on her right leg, left knee relaxed; wide power stance when shredding
    thighL.current!.rotation.set(-swing - 0.08 * still * (1 - sh), 0, 0.05 + 0.14 * sh)
    thighR.current!.rotation.set(swing, 0, -0.04 - 0.14 * sh)
    kneeL.current!.rotation.x = Math.max(0, Math.sin(a.phase + 1.4)) * 1.0 * run + 0.18 * still * (1 - sh) + 0.15 * sh
    kneeR.current!.rotation.x = Math.max(0, Math.sin(a.phase + 1.4 + Math.PI)) * 1.0 * run + 0.15 * sh

    const recoil = Math.max(0, 1 - (now - p.shredAt) / 250)
    const sing = Math.max(0, 1 - (now - p.castAt) / 1400)
    spine.current!.rotation.x = 0.02 + 0.12 * run + 0.12 * sh - recoil * 0.18
    spine.current!.rotation.z = -0.04 * still - beat * 0.04 * hm
    spine.current!.rotation.y = -Math.sin(a.phase) * 0.12 * run + 0.1 * still
    const breathe = Math.sin(t * 1.7) * 0.008
    spine.current!.scale.set(1, 1 + breathe, 1 + breathe)

    // head: smiling tilt; sways to Harmony, bangs to Shred, tips back to sing
    head.current!.rotation.x = -0.02 + Math.abs(beat) * 0.32 * sh - sing * 0.3
    head.current!.rotation.z = 0.1 * still * (1 - sh) + beat * 0.12 * hm
    head.current!.rotation.y = -0.1 * still + Math.sin(t * 0.6) * 0.06
    if (mouth.current) {
      const open = Math.max(sing, hm * 0.6 * Math.abs(Math.sin(t * 7)), sh * 0.8 * Math.abs(beat), p.talking ? Math.abs(Math.sin(t * 13)) * 0.6 : 0)
      mouth.current.scale.set(1, 0.15 + open * 0.85, 1)
    }

    // keytar: neck lifts when shredding, kicks on a blast
    const kg = keytarGroup.current!
    kg.position.copy(KEYTAR_POS)
    kg.position.y += Math.abs(Math.sin(a.phase)) * 0.015 * run
    kg.rotation.set(KEYTAR_ROT.x - recoil * 0.1, KEYTAR_ROT.y, KEYTAR_ROT.z + sh * (0.22 + beat * 0.05) + recoil * 0.15)
    kg.updateMatrix()
    keytarM.copy(kg.matrix)

    // ---- arms by IK: right hand plays the keys, left hand holds the neck ----
    a.handX = MathUtils.damp(a.handX, handKey, 22, dt)
    keyPoint(Math.round(a.handX), tmp.kp)
    const lift = p.mode === 'shred' ? (stepPhase < 0.5 ? 0.0 : 0.045) : pressed.length ? 0 : 0.02
    tmp.tR.copy(tmp.kp).add(new Vector3(0, -0.01, 0.06 + lift)).applyMatrix4(keytarM)
    tmp.tL.copy(NECK_GRIP).add(new Vector3(0, -0.03, 0.02)).applyMatrix4(keytarM)
    solveArmIK(shoulderR.current!, elbowR.current!, tmp.tR, poleR, UPPER, LOWER)
    solveArmIK(shoulderL.current!, elbowL.current!, tmp.tL, poleL, UPPER, LOWER)
  })

  const Leg = ({ side, thigh, knee }: { side: 1 | -1; thigh: React.RefObject<Group | null>; knee: React.RefObject<Group | null> }) => (
    <group ref={thigh} name={side === 1 ? 'thigh_L' : 'thigh_R'} position={[side * 0.085, -0.03, 0]}>
      <mesh material={mats.skin} geometry={geo.thigh} />
      <group ref={knee} name={side === 1 ? 'knee_L' : 'knee_R'} position-y={-0.42}>
        <mesh material={mats.skin}>
          <sphereGeometry args={[0.049, 14, 12]} />
        </mesh>
        <mesh material={mats.skin} geometry={geo.shin} />
        {/* rose knee band */}
        <mesh material={mats.knee} position-y={-0.01} rotation-y={Math.PI}>
          <cylinderGeometry args={[0.058, 0.055, 0.075, 20, 1, true]} />
        </mesh>
        {/* foot + platform sandal */}
        <group position-y={-0.4}>
          <mesh material={mats.skin} position={[0, -0.035, 0.045]} scale={[0.95, 0.62, 2.5]}>
            <sphereGeometry args={[0.032, 14, 10]} />
          </mesh>
          {[-0.022, -0.01, 0.002, 0.013, 0.023].map((x, i) => (
            <group key={i} position={[x * side, -0.045, 0.118 - Math.abs(x) * 0.5]}>
              <mesh material={mats.skin}>
                <sphereGeometry args={[i === 0 ? 0.011 : 0.0085, 8, 6]} />
              </mesh>
              <mesh material={mats.toenail} position={[0, 0.004, 0.006]} scale={[1, 0.4, 0.6]}>
                <sphereGeometry args={[i === 0 ? 0.008 : 0.006, 8, 6]} />
              </mesh>
            </group>
          ))}
          <mesh material={mats.sandal} position={[0, -0.075, 0.075]}>
            <boxGeometry args={[0.085, 0.045, 0.11]} />
          </mesh>
          <mesh material={mats.sandal} position={[0, -0.07, -0.025]}>
            <boxGeometry args={[0.075, 0.055, 0.1]} />
          </mesh>
          <mesh material={mats.sandalDark} position={[0, -0.05, 0.03]}>
            <boxGeometry args={[0.078, 0.008, 0.2]} />
          </mesh>
          {/* criss-cross straps and ankle strap */}
          {[-0.5, 0.5].map((r) => (
            <mesh key={r} material={mats.sandal} position={[0, -0.022, 0.065]} rotation={[Math.PI / 2, 0, r]} scale={[1, 1, 0.55]}>
              <torusGeometry args={[0.036, 0.006, 6, 18, Math.PI]} />
            </mesh>
          ))}
          <mesh material={mats.sandal} position={[0, 0.0, 0.0]} rotation-x={Math.PI / 2}>
            <torusGeometry args={[0.036, 0.006, 6, 18]} />
          </mesh>
          <mesh material={mats.gold} position={[0, 0.02, 0.0]} rotation-x={Math.PI / 2}>
            <torusGeometry args={[0.045, 0.009, 10, 24]} />
          </mesh>
        </group>
      </group>
    </group>
  )

  const Arm = ({ side, shoulder, elbow }: { side: 1 | -1; shoulder: React.RefObject<Group | null>; elbow: React.RefObject<Group | null> }) => (
    <group ref={shoulder} name={side === 1 ? 'shoulder_L' : 'shoulder_R'} position={[side * 0.165, 0.3, -0.005]}>
      <mesh material={mats.skin}>
        <sphereGeometry args={[0.046, 16, 12]} />
      </mesh>
      <mesh material={mats.skin} geometry={geo.upperArm} />
      <group ref={elbow} name={side === 1 ? 'elbow_L' : 'elbow_R'} position-y={-UPPER}>
        <mesh material={mats.skin}>
          <sphereGeometry args={[0.033, 12, 10]} />
        </mesh>
        <mesh material={mats.skin} geometry={geo.foreArm} />
        <mesh material={mats.gold} position-y={-0.205} rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.036, 0.009, 10, 24]} />
        </mesh>
        <group position-y={-LOWER} scale={0.88} rotation={side === -1 ? [-0.9, 0, 0.3] : [-0.5, 0, -0.6]}>
          <Hand side={side} skin={mats.skin} curl={0.55} />
        </group>
      </group>
    </group>
  )

  return (
    <group ref={root} name="Kiai">
      <group ref={hips} name="hips" position-y={0.95}>
        {/* layered wrap skirt: teal under, rose-print wrap over, gold ring at her left hip */}
        <mesh material={mats.teal} geometry={geo.skirtUnder} scale={[1, 1, 0.82]} />
        <mesh material={mats.skirt} geometry={geo.skirtOuter} scale={[1, 1, 0.82]} rotation-z={-0.07} />
        <group position={[0.12, 0.02, 0.115]} rotation-y={0.75}>
          <mesh material={mats.gold}>
            <torusGeometry args={[0.02, 0.005, 8, 20]} />
          </mesh>
          <mesh material={mats.skirt} position={[0, -0.05, 0.005]} rotation-z={0.15}>
            <coneGeometry args={[0.022, 0.09, 8, 1, true]} />
          </mesh>
        </group>

        <Leg side={1} thigh={thighL} knee={kneeL} />
        <Leg side={-1} thigh={thighR} knee={kneeR} />

        <group ref={spine} name="spine" position-y={0.1}>
          <mesh material={mats.skin} geometry={geo.torso} scale={[1, 1, Z_SCALE]} />
          <mesh material={mats.top} geometry={geo.bandeau} scale={[1, 1, Z_SCALE]} rotation-y={Math.PI} />
          <mesh material={mats.midriffInk} geometry={geo.midriff} scale={[1, 1, Z_SCALE]} userData={{ noShadow: true }} />
          {/* collarbones */}
          {[-1, 1].map((s) => (
            <mesh key={s} material={mats.skin} position={[s * 0.07, 0.322, 0.06]} rotation={[0, s * 0.45, s * -0.12 + Math.PI / 2]} scale={[0.6, 1, 0.6]}>
              <capsuleGeometry args={[0.007, 0.085, 4, 8]} />
            </mesh>
          ))}
          <mesh material={mats.sealInk} position={seal.pos} quaternion={seal.q} userData={{ noShadow: true }}>
            <circleGeometry args={[0.03, 32]} />
          </mesh>

          <Arm side={1} shoulder={shoulderL} elbow={elbowL} />
          <Arm side={-1} shoulder={shoulderR} elbow={elbowR} />

          <group ref={keytarGroup} matrixAutoUpdate>
            <Keytar ref={keytar} />
          </group>
          <mesh geometry={strapGeo} material={mats.strap} />

          <mesh material={mats.skin} position-y={0.385}>
            <cylinderGeometry args={[0.04, 0.046, 0.09, 14]} />
          </mesh>
          <group ref={head} name="head" position-y={0.405} scale={1.1}>
            <KiaiHead mats={mats} mouth={mouth} />
          </group>
        </group>
      </group>
    </group>
  )
}

type HeadMats = Record<
  'skin' | 'face' | 'gold' | 'hair' | 'hairCap' | 'sclera' | 'iris' | 'glint' | 'lash' | 'brow' | 'lips' | 'teeth' | 'mouthIn',
  MeshStandardMaterial
>

function KiaiHead({ mats, mouth }: { mats: HeadMats; mouth: React.RefObject<Mesh | null> }) {
  const hair = useMemo(() => buildPixie(), [])
  return (
    <group>
      {/* skull with painted face (blush, bindi) */}
      <mesh material={mats.face} position-y={0.1} scale={[0.9, 1.04, 0.95]}>
        <sphereGeometry args={[0.105, 40, 28]} />
      </mesh>
      {/* jaw and chin */}
      <mesh material={mats.skin} position={[0, 0.045, 0.028]} scale={[0.82, 0.72, 0.9]}>
        <sphereGeometry args={[0.075, 24, 16]} />
      </mesh>
      {/* eyes: big and warm, lashes with a flick at the outer corner */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.037, 0.112, 0.083]} rotation-y={s * 0.18}>
          <mesh material={mats.sclera} scale={[1, 0.82, 0.62]}>
            <sphereGeometry args={[0.019, 16, 12]} />
          </mesh>
          <mesh material={mats.iris} position-z={0.0124}>
            <circleGeometry args={[0.0122, 24]} />
          </mesh>
          <mesh material={mats.glint} position={[s * -0.003, 0.004, 0.0132]}>
            <sphereGeometry args={[0.0026, 8, 6]} />
          </mesh>
          {/* upper lid */}
          <mesh material={mats.skin} position={[0, 0.002, 0.001]} scale={[1.06, 0.86, 0.68]} rotation-x={-0.25}>
            <sphereGeometry args={[0.0198, 16, 8, 0, Math.PI * 2, 0, 1.05]} />
          </mesh>
          {/* lash line */}
          <mesh material={mats.lash} position={[0, -0.0005, 0.006]} rotation={[0.2, 0, 0]} scale={[1, 0.85, 1]}>
            <torusGeometry args={[0.0195, 0.0021, 6, 20, Math.PI * 0.95]} />
          </mesh>
          <mesh material={mats.lash} position={[s * 0.021, 0.006, 0.004]} rotation-z={s * -0.9}>
            <coneGeometry args={[0.0028, 0.013, 6]} />
          </mesh>
          {/* brow */}
          <mesh material={mats.brow} position={[s * 0.002, 0.03, 0.006]} rotation-z={s * -0.12}>
            <torusGeometry args={[0.024, 0.0028, 6, 16, Math.PI * 0.7]} />
          </mesh>
        </group>
      ))}
      {/* nose */}
      <mesh material={mats.skin} position={[0, 0.09, 0.099]} scale={[0.75, 1.25, 0.9]}>
        <sphereGeometry args={[0.011, 12, 10]} />
      </mesh>
      <mesh material={mats.skin} position={[0, 0.079, 0.104]} scale={[1.15, 0.85, 0.9]}>
        <sphereGeometry args={[0.011, 12, 10]} />
      </mesh>
      {/* big smile: lips, teeth, and a mouth that opens to sing */}
      <group position={[0, 0.072, 0.093]}>
        <mesh ref={mouth} material={mats.mouthIn} position={[0, -0.022, -0.004]} scale={[1, 0.2, 1]}>
          <sphereGeometry args={[0.02, 16, 10]} />
        </mesh>
        <mesh material={mats.teeth} rotation-z={Math.PI * 1.5 - 0.85} scale={[1, 1, 0.45]}>
          <torusGeometry args={[0.025, 0.0055, 6, 20, 1.7]} />
        </mesh>
        <mesh material={mats.lips} position-z={0.002} rotation-z={Math.PI * 1.5 - 0.95} scale={[1, 1, 0.5]}>
          <torusGeometry args={[0.022, 0.0042, 8, 22, 1.9]} />
        </mesh>
        <mesh material={mats.lips} position={[0, 0.0, 0.0]} rotation-z={Math.PI * 1.5 - 0.8} scale={[1, 1, 0.55]}>
          <torusGeometry args={[0.031, 0.0055, 8, 22, 1.6]} />
        </mesh>
      </group>
      {/* ears + big gold hoops */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh material={mats.skin} position={[s * 0.093, 0.098, -0.004]} scale={[0.45, 1, 0.75]}>
            <sphereGeometry args={[0.022, 12, 10]} />
          </mesh>
          <mesh material={mats.gold} position={[s * 0.097, 0.058, 0.004]} rotation-y={Math.PI / 2}>
            <torusGeometry args={[0.02, 0.0042, 10, 24]} />
          </mesh>
        </group>
      ))}
      {/* pixie cut: a scalp cap plus layered, swept strands */}
      <mesh material={mats.hairCap} position={[0, 0.103, -0.006]} rotation-x={-1.0} scale={[0.92, 1.0, 0.97]}>
        <sphereGeometry args={[0.108, 28, 18, 0, Math.PI * 2, 0, 1.9]} />
      </mesh>
      <mesh geometry={hair} material={mats.hair} />
    </group>
  )
}

/** Short layered pixie with a long side-swept fringe to her left and a crown cowlick. */
function buildPixie() {
  const rand = rng(2024)
  const center = new Vector3(0, 0.103, -0.006)
  const R = 0.106
  const palette = [KIAI.hairDeep, KIAI.hair, KIAI.hair, KIAI.hairLight].map((c) => new Color(c))
  const strands: Strand[] = []
  const up = new Vector3(0, 1, 0)

  const walk = (d0: Vector3, flow: Vector3, len: number, puff: number, tipLift: number) => {
    const pts: Vector3[] = []
    const tangent = flow.clone().addScaledVector(d0, -flow.dot(d0)).normalize()
    for (let i = 0; i <= 4; i++) {
      const s = (i / 4) * len
      const dir = d0.clone().addScaledVector(tangent, s / R).normalize()
      const lift = 0.004 + puff * Math.sin((Math.PI * i) / 4) + (i === 4 ? tipLift : 0)
      pts.push(dir.multiplyScalar(R + lift).add(center))
    }
    return pts
  }

  let made = 0
  while (made < 150) {
    const u = rand() * 2 - 1
    const th = rand() * Math.PI * 2
    const s = Math.sqrt(1 - u * u)
    const d = new Vector3(s * Math.cos(th), u, s * Math.sin(th))
    // hairline: clear the face, keep the sides short above the ears
    if (d.y < -0.25) continue
    if (d.z > 0.45 && d.y < 0.42) continue
    if (Math.abs(d.x) > 0.75 && d.y < 0.05 && d.z > -0.2) continue
    let flow: Vector3
    let len: number
    let puff: number
    let tip: number
    if (d.z > 0.15 && d.y > 0.35) {
      // fringe: long, sweeping across the forehead toward her left
      flow = new Vector3(1, -0.55, 0.25)
      len = 0.13 + rand() * 0.06
      puff = 0.016
      tip = 0.006
    } else if (d.y > 0.55) {
      // crown: layered, piecey, swept left and back with lifted tips
      flow = new Vector3(0.7, 0.1, -0.6)
      len = 0.08 + rand() * 0.05
      puff = 0.022
      tip = 0.012 + rand() * 0.014
    } else if (d.z < -0.3) {
      // back: short, tapered into the nape
      flow = new Vector3(d.x * 0.3, -1, -0.15)
      len = 0.05 + rand() * 0.03
      puff = 0.012
      tip = 0.002
    } else {
      // sides: short, brushed down and back
      flow = new Vector3(0, -0.8, -0.6)
      len = 0.05 + rand() * 0.03
      puff = 0.01
      tip = 0.003
    }
    flow.x += (rand() - 0.5) * 0.3
    flow.z += (rand() - 0.5) * 0.3
    strands.push({
      points: walk(d, flow, len, puff, tip),
      radius: 0.011 + rand() * 0.007,
      color: palette[Math.floor(rand() * palette.length)],
      flatten: 0.55,
      taper: 0.9,
    })
    made++
  }
  // cowlick spikes at the crown
  for (let i = 0; i < 7; i++) {
    const d = new Vector3((rand() - 0.5) * 0.3, 1, -0.25 + (rand() - 0.5) * 0.3).normalize()
    const base = d.clone().multiplyScalar(R).add(center)
    const tip = base.clone().addScaledVector(up, 0.04 + rand() * 0.03).add(new Vector3(0.02 + rand() * 0.02, 0, -0.02))
    const mid = base.clone().lerp(tip, 0.5).addScaledVector(d, 0.01)
    strands.push({ points: [base, mid, tip], radius: 0.012, color: palette[2 + Math.floor(rand() * 2)], flatten: 0.4, taper: 0.95 })
  }
  return hairGeometry(strands)
}
```

### `characters/kiai/Keytar.tsx: the keytar and its pressable keys`

```tsx
import { forwardRef, useMemo, useRef, useImperativeHandle } from 'react'
import { ExtrudeGeometry, Group, Mesh, MeshStandardMaterial, Shape, Vector3 } from 'three'
import { KIAI } from './textures'

// Kiai's keytar. Local frame: length along +X (tail at -X, pointed head at +X),
// keys face +Z, black keys toward +Y.

export const KEY_COUNT = 37 // three octaves + top C, starting on C
const WHITE_PATTERN = [0, 2, 4, 5, 7, 9, 11] // semitones of white keys in an octave
const KEYS_X0 = -0.255
const KEYS_X1 = 0.275
const WHITE_COUNT = 22
const WHITE_W = (KEYS_X1 - KEYS_X0) / WHITE_COUNT
const FACE_Z = 0.0255

export type KeyInfo = { index: number; black: boolean; x: number }
export const KEYS: KeyInfo[] = (() => {
  const out: KeyInfo[] = []
  let white = 0
  for (let i = 0; i < KEY_COUNT; i++) {
    const s = i % 12
    const isWhite = WHITE_PATTERN.includes(s)
    if (isWhite) {
      out.push({ index: i, black: false, x: KEYS_X0 + (white + 0.5) * WHITE_W })
      white++
    } else {
      out.push({ index: i, black: true, x: KEYS_X0 + white * WHITE_W })
    }
  }
  return out
})()

/** Where a fingertip should press key `i`, in keytar-local space. */
export function keyPoint(i: number, out = new Vector3()) {
  const k = KEYS[Math.max(0, Math.min(KEY_COUNT - 1, i))]
  return out.set(k.x, k.black ? 0.028 : -0.012, FACE_Z + 0.02)
}

// strap pins and the neck grip, keytar-local
export const TAIL_PIN = new Vector3(-0.42, -0.04, -0.02)
export const NECK_PIN = new Vector3(0.47, 0.06, -0.02)
export const NECK_GRIP = new Vector3(0.4, 0.05, 0.0)

export type KeytarHandle = { press: (indices: number[]) => void }

export const Keytar = forwardRef<KeytarHandle>(function Keytar(_, ref) {
  const keys = useRef<(Mesh | null)[]>([])
  const pressed = useRef<Set<number>>(new Set())
  useImperativeHandle(ref, () => ({
    press(indices) {
      const next = new Set(indices)
      KEYS.forEach((k, i) => {
        const m = keys.current[i]
        if (!m) return
        const down = next.has(i)
        m.position.z = (k.black ? FACE_Z + 0.012 : FACE_Z + 0.006) - (down ? 0.006 : 0)
        m.rotation.x = down ? (k.black ? 0.06 : 0.05) : 0
      })
      pressed.current = next
    },
  }))

  const { bodyGeo, headGeo, mats } = useMemo(() => {
    const body = new Shape()
    body.moveTo(-0.47, -0.08)
    body.lineTo(-0.3, 0.07)
    body.lineTo(0.3, 0.07)
    body.lineTo(0.5, 0.1)
    body.lineTo(0.6, 0.11)
    body.lineTo(0.5, 0.04)
    body.lineTo(0.32, -0.04)
    body.lineTo(-0.3, -0.07)
    body.closePath()
    const head = new Shape()
    head.moveTo(0.46, 0.09)
    head.lineTo(0.66, 0.12)
    head.lineTo(0.5, 0.17)
    head.closePath()
    const hole = new Shape()
    hole.moveTo(0.5, 0.11)
    hole.lineTo(0.6, 0.123)
    hole.lineTo(0.515, 0.148)
    hole.closePath()
    head.holes.push(hole)
    const ex = { depth: 0.04, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 2 }
    const bodyGeo = new ExtrudeGeometry(body, ex)
    bodyGeo.translate(0, 0, -0.02)
    const headGeo = new ExtrudeGeometry(head, { ...ex, depth: 0.03 })
    headGeo.translate(0, 0, -0.015)
    return {
      bodyGeo,
      headGeo,
      mats: {
        body: new MeshStandardMaterial({ color: KIAI.keytar, roughness: 0.25, metalness: 0.15 }),
        white: new MeshStandardMaterial({ color: '#f1e8ff', roughness: 0.35 }),
        black: new MeshStandardMaterial({ color: '#5b2a9e', roughness: 0.3 }),
        neon: new MeshStandardMaterial({ color: '#e9d6ff', emissive: '#c79bff', emissiveIntensity: 2.2, toneMapped: false }),
        knob: new MeshStandardMaterial({ color: '#6a2fb5', roughness: 0.3, metalness: 0.4 }),
        pin: new MeshStandardMaterial({ color: '#c8ccd2', metalness: 0.9, roughness: 0.3 }),
      },
    }
  }, [])

  return (
    <group name="keytar">
      <mesh geometry={bodyGeo} material={mats.body} castShadow />
      <mesh geometry={headGeo} material={mats.body} castShadow />
      {/* key bed */}
      <mesh material={mats.black} position={[(KEYS_X0 + KEYS_X1) / 2, 0.0, FACE_Z - 0.002]}>
        <boxGeometry args={[KEYS_X1 - KEYS_X0 + 0.01, 0.112, 0.004]} />
      </mesh>
      {KEYS.map((k, i) => (
        <mesh
          key={i}
          ref={(m) => (keys.current[i] = m)}
          material={k.black ? mats.black : mats.white}
          position={[k.x, k.black ? 0.022 : -0.004, k.black ? FACE_Z + 0.012 : FACE_Z + 0.006]}
        >
          <boxGeometry args={k.black ? [WHITE_W * 0.55, 0.06, 0.012] : [WHITE_W * 0.92, 0.104, 0.01]} />
        </mesh>
      ))}
      {/* neon accent line on the tail, like a circuit trace */}
      <mesh material={mats.neon} position={[-0.38, 0.0, FACE_Z]} rotation-z={0.72}>
        <boxGeometry args={[0.1, 0.006, 0.004]} />
      </mesh>
      <mesh material={mats.neon} position={[-0.325, 0.034, FACE_Z]}>
        <boxGeometry args={[0.05, 0.006, 0.004]} />
      </mesh>
      {/* control buttons */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} material={mats.knob} position={[-0.4 + i * 0.022, -0.045 + i * 0.012, FACE_Z]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.006, 0.006, 0.006, 10]} />
        </mesh>
      ))}
      {/* pitch ribbon on the neck */}
      <mesh material={mats.neon} position={[0.42, 0.075, FACE_Z - 0.006]} rotation-z={0.19}>
        <boxGeometry args={[0.12, 0.012, 0.004]} />
      </mesh>
      {[TAIL_PIN, NECK_PIN].map((p, i) => (
        <mesh key={i} material={mats.pin} position={p} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.008, 0.008, 0.02, 8]} />
        </mesh>
      ))}
    </group>
  )
})

export type { Group }
```

### `characters/kiai/textures.ts: rose fabric, face, eyes and tattoos`

```ts
import { canvasTexture, makeCanvas, rng } from '../parts'

export const KIAI_SKIN = '#cf9a6c'
export const KIAI = {
  skin: KIAI_SKIN,
  hairDeep: '#1f37b8',
  hair: '#2f52e6',
  hairLight: '#5a86ff',
  lime: '#c9df7c',
  teal: '#2a8c7e',
  rose: '#e2487f',
  roseDark: '#b02a5e',
  leaf: '#3f8f4a',
  gold: '#e3b04b',
  sandal: '#e2489a',
  keytar: '#8b45d8',
  keytarLight: '#c9a2f5',
  lips: '#c75a6a',
}

// Midriff tattoo text and the circular collarbone seal.
export const KIAI_MIDRIFF_TEXT = 'louder, please'
export const KIAI_SEAL_TEXT = 'CERTIFIED TROUBLE ✦ NO REFUNDS ✦ '

function rose(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  // leaves
  ctx.fillStyle = KIAI.leaf
  for (const a of [-0.9, 2.3]) {
    ctx.save()
    ctx.translate(x + Math.cos(a) * r * 1.2, y + Math.sin(a) * r * 1.2)
    ctx.rotate(a)
    ctx.beginPath()
    ctx.ellipse(0, 0, r * 0.9, r * 0.42, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
  // petals: concentric swirls
  ctx.fillStyle = KIAI.rose
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = KIAI.roseDark
  ctx.lineWidth = Math.max(1.5, r * 0.12)
  ctx.beginPath()
  for (let t = 0; t < Math.PI * 5; t += 0.15) {
    const rr = (r * 0.9 * t) / (Math.PI * 5)
    ctx.lineTo(x + Math.cos(t) * rr, y + Math.sin(t) * rr)
  }
  ctx.stroke()
}

function vine(ctx: CanvasRenderingContext2D, x: number, y: number, len: number, rand: () => number) {
  ctx.strokeStyle = '#2f7d55'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.bezierCurveTo(x + len * 0.3, y - len * 0.4, x + len * 0.7, y + len * 0.3, x + len, y - len * 0.1)
  ctx.stroke()
  // curl at the end
  ctx.beginPath()
  ctx.arc(x + len + 6, y - len * 0.1 - 2, 6, Math.PI, Math.PI * 2.6)
  ctx.stroke()
  ctx.fillStyle = KIAI.leaf
  for (let i = 0; i < 3; i++) {
    const t = 0.25 + i * 0.25
    ctx.save()
    ctx.translate(x + len * t, y - len * 0.05 + (rand() - 0.5) * 8)
    ctx.rotate(rand() * 3)
    ctx.beginPath()
    ctx.ellipse(0, 0, 8, 4, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}

/** Lime fabric with pink roses and curling vines; optional teal trim bands top and bottom. */
export function roseFabric(opts: { trimTop?: number; trimBottom?: number; seed?: number; roses?: number; w?: number; h?: number } = {}) {
  const W = opts.w ?? 512
  const H = opts.h ?? 256
  const [c, ctx] = makeCanvas(W, H)
  const rand = rng(opts.seed ?? 3)
  ctx.fillStyle = KIAI.lime
  ctx.fillRect(0, 0, W, H)
  // soft fabric shading
  for (let i = 0; i < 2000; i++) {
    ctx.fillStyle = `rgba(0,0,0,${rand() * 0.04})`
    ctx.fillRect(rand() * W, rand() * H, 2, 2)
  }
  const top = opts.trimTop ?? 0
  const bottom = opts.trimBottom ?? 0
  const count = opts.roses ?? 6
  for (let i = 0; i < count; i++) {
    const x = ((i + 0.5) / count) * W + (rand() - 0.5) * 30
    const y = top + 20 + rand() * (H - top - bottom - 40)
    vine(ctx, x - 40, y + 18, 70 + rand() * 30, rand)
    rose(ctx, x, y, 16 + rand() * 10)
  }
  ctx.fillStyle = KIAI.teal
  if (top) ctx.fillRect(0, 0, W, top)
  if (bottom) ctx.fillRect(0, H - bottom, W, bottom)
  return canvasTexture(c)
}

/**
 * Face paint on the head sphere: SphereGeometry maps the front (+Z) to u = 0.25,
 * and theta (from the top) to canvas y. Blush, the bindi and soft shading.
 */
export function faceTexture() {
  const W = 1024
  const H = 512
  const [c, ctx] = makeCanvas(W, H)
  ctx.fillStyle = KIAI_SKIN
  ctx.fillRect(0, 0, W, H)
  const fx = W * 0.25 // front of face
  const at = (dPhi: number, theta: number): [number, number] => [fx + (dPhi / (Math.PI * 2)) * W, (theta / Math.PI) * H]
  const blob = (x: number, y: number, rx: number, ry: number, color: string) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, rx)
    g.addColorStop(0, color)
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.save()
    ctx.scale(1, ry / rx)
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, (y * rx) / ry, rx, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
  // cheek blush
  for (const s of [-1, 1]) {
    const [x, y] = at(s * 0.42, Math.PI * 0.6)
    blob(x, y, 46, 30, 'rgba(232,110,120,0.45)')
  }
  // eye sockets: a touch of warm shadow / liner
  for (const s of [-1, 1]) {
    const [x, y] = at(s * 0.36, Math.PI * 0.47)
    blob(x, y, 36, 20, 'rgba(120,60,50,0.18)')
  }
  // bindi
  const [bx, by] = at(0, Math.PI * 0.335)
  ctx.fillStyle = '#c2185b'
  ctx.beginPath()
  ctx.arc(bx, by, 7, 0, Math.PI * 2)
  ctx.fill()
  return canvasTexture(c)
}

export function irisTexture() {
  const [c, ctx] = makeCanvas(128, 128)
  const g = ctx.createRadialGradient(64, 64, 8, 64, 64, 64)
  g.addColorStop(0, '#120a06')
  g.addColorStop(0.32, '#120a06')
  g.addColorStop(0.36, '#6b3d1f')
  g.addColorStop(0.8, '#9c6233')
  g.addColorStop(1, '#3a200f')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 128)
  // fibres
  ctx.strokeStyle = 'rgba(210,150,90,0.35)'
  for (let a = 0; a < Math.PI * 2; a += 0.12) {
    ctx.beginPath()
    ctx.moveTo(64 + Math.cos(a) * 22, 64 + Math.sin(a) * 22)
    ctx.lineTo(64 + Math.cos(a) * 58, 64 + Math.sin(a) * 58)
    ctx.stroke()
  }
  return canvasTexture(c)
}

/** "louder, please" in a flowing script, transparent background. */
export function midriffTattoo() {
  const [c, ctx] = makeCanvas(1024, 160)
  ctx.fillStyle = 'rgba(32,22,30,0.85)'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = 'italic 74px "Brush Script MT", "Segoe Script", "Snell Roundhand", cursive'
  ctx.fillText(KIAI_MIDRIFF_TEXT, 512, 80)
  // tiny flourish stars
  ctx.font = '28px serif'
  ctx.fillText('✦', 512 - 300, 60)
  ctx.fillText('✦', 512 + 300, 100)
  return canvasTexture(c)
}

/** Circular seal for the right collarbone: ring text and a winking face. */
export function sealTattoo() {
  const S = 256
  const [c, ctx] = makeCanvas(S, S)
  const ink = 'rgba(32,22,30,0.88)'
  ctx.strokeStyle = ink
  ctx.fillStyle = ink
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.arc(S / 2, S / 2, 118, 0, Math.PI * 2)
  ctx.stroke()
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(S / 2, S / 2, 78, 0, Math.PI * 2)
  ctx.stroke()
  // ring text
  ctx.font = 'bold 26px Georgia, serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const text = KIAI_SEAL_TEXT
  const step = (Math.PI * 2) / text.length
  for (let i = 0; i < text.length; i++) {
    const a = -Math.PI / 2 + i * step
    ctx.save()
    ctx.translate(S / 2 + Math.cos(a) * 98, S / 2 + Math.sin(a) * 98)
    ctx.rotate(a + Math.PI / 2)
    ctx.fillText(text[i], 0, 0)
    ctx.restore()
  }
  // winking face
  const cx = S / 2
  const cy = S / 2
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.arc(cx - 22, cy - 14, 7, 0, Math.PI * 2) // open eye
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(cx + 12, cy - 14)
  ctx.lineTo(cx + 34, cy - 14) // wink
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(cx, cy + 6, 30, 0.15 * Math.PI, 0.85 * Math.PI) // grin
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(cx + 18, cy + 30)
  ctx.quadraticCurveTo(cx + 24, cy + 46, cx + 12, cy + 44) // tongue out
  ctx.stroke()
  return canvasTexture(c)
}
```

### `characters/kiai/music.ts: her songs and the Web Audio synth`

```ts
// Kiai's two songs, shared by the animation (which keys she presses) and the
// synth (what you hear), so fingers and sound stay in sync. All original.
// Key index 0 = C3 on her keytar.

export const HARMONY = {
  bpm: 132,
  // lilting major-key arpeggios, eighth notes
  notes: [12, 16, 19, 24, 23, 19, 16, 19, 17, 21, 24, 29, 28, 24, 21, 24, 14, 17, 21, 26, 24, 21, 17, 21, 19, 23, 26, 31, 29, 26, 23, 19],
}

export const SHRED = {
  bpm: 168,
  // power chords (root, fifth, octave), eighth notes
  roots: [4, 4, 4, 7, 4, 4, 9, 7, 2, 2, 2, 5, 2, 7, 4, 4],
}
export const chord = (root: number) => [root, root + 7, root + 12]

export const IDLE = { bpm: 84, notes: [12, -1, 16, -1, 19, -1, 16, -1] } // -1 = rest

export const eighth = (bpm: number) => 60000 / bpm / 2
export function stepAt(bpm: number, t0: number, now: number) {
  return Math.floor((now - t0) / eighth(bpm))
}
export const keyFreq = (k: number) => 130.81 * Math.pow(2, k / 12)

// ---- synth ---------------------------------------------------------------

let ctx: AudioContext | null = null
let master: GainNode | null = null

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = 0.28
    const comp = ctx.createDynamicsCompressor()
    master.connect(comp).connect(ctx.destination)
  }
  if (ctx.state === 'suspended') ctx.resume()
  return { ctx, out: master! }
}

function distortion(c: AudioContext, amount = 380) {
  const ws = c.createWaveShaper()
  const n = 1024
  const curve = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1
    curve[i] = ((3 + amount) * x * 20 * (Math.PI / 180)) / (Math.PI + amount * Math.abs(x))
  }
  ws.curve = curve
  ws.oversample = '4x'
  return ws
}

/** A sung, sweet note: soft triangle + sine with vibrato. */
function voiceNote(freq: number, at: number, dur: number) {
  const { ctx: c, out } = audio()
  const g = c.createGain()
  g.gain.setValueAtTime(0, at)
  g.gain.linearRampToValueAtTime(0.35, at + 0.04)
  g.gain.exponentialRampToValueAtTime(0.001, at + dur)
  const vib = c.createOscillator()
  const vibGain = c.createGain()
  vib.frequency.value = 5.5
  vibGain.gain.value = freq * 0.012
  vib.connect(vibGain)
  for (const [type, mul, lvl] of [['triangle', 1, 0.6], ['sine', 2, 0.25], ['sine', 1.003, 0.4]] as const) {
    const o = c.createOscillator()
    o.type = type
    o.frequency.value = freq * mul
    vibGain.connect(o.frequency)
    const og = c.createGain()
    og.gain.value = lvl
    o.connect(og).connect(g)
    o.start(at)
    o.stop(at + dur + 0.05)
  }
  vib.start(at)
  vib.stop(at + dur + 0.05)
  g.connect(out)
}

/** A heavy distorted power chord. */
function powerChord(root: number, at: number, dur: number) {
  const { ctx: c, out } = audio()
  const g = c.createGain()
  g.gain.setValueAtTime(0.0, at)
  g.gain.linearRampToValueAtTime(0.5, at + 0.01)
  g.gain.exponentialRampToValueAtTime(0.001, at + dur)
  const lp = c.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 3200
  const dist = distortion(c)
  for (const k of chord(root - 12)) {
    for (const det of [-6, 6]) {
      const o = c.createOscillator()
      o.type = 'sawtooth'
      o.frequency.value = keyFreq(k)
      o.detune.value = det
      o.connect(dist)
      o.start(at)
      o.stop(at + dur + 0.05)
    }
  }
  dist.connect(lp).connect(g).connect(out)
}

/** The screech: a rising, wailing distorted lead. */
function screech(at: number, dur: number) {
  const { ctx: c, out } = audio()
  const o = c.createOscillator()
  o.type = 'sawtooth'
  o.frequency.setValueAtTime(900, at)
  o.frequency.exponentialRampToValueAtTime(2300, at + dur * 0.6)
  const vib = c.createOscillator()
  const vg = c.createGain()
  vib.frequency.value = 9
  vg.gain.value = 60
  vib.connect(vg).connect(o.frequency)
  const bp = c.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = 2000
  bp.Q.value = 3
  const g = c.createGain()
  g.gain.setValueAtTime(0, at)
  g.gain.linearRampToValueAtTime(0.22, at + 0.05)
  g.gain.exponentialRampToValueAtTime(0.001, at + dur)
  o.connect(distortion(c, 200)).connect(bp).connect(g).connect(out)
  o.start(at)
  vib.start(at)
  o.stop(at + dur + 0.05)
  vib.stop(at + dur + 0.05)
}

/** Play `steps` eighth notes of a song starting at `fromStep`, beginning now. Returns its length in ms. */
export function playPhrase(mode: 'harmony' | 'shred', fromStep: number, steps: number) {
  const { ctx: c } = audio()
  const now = c.currentTime + 0.02
  if (mode === 'harmony') {
    const e = eighth(HARMONY.bpm) / 1000
    for (let i = 0; i < steps; i++) {
      const k = HARMONY.notes[(fromStep + i) % HARMONY.notes.length]
      voiceNote(keyFreq(k), now + i * e, e * 1.8)
    }
    return steps * e * 1000
  }
  const e = eighth(SHRED.bpm) / 1000
  for (let i = 0; i < steps; i++) powerChord(SHRED.roots[(fromStep + i) % SHRED.roots.length], now + i * e, e * 0.95)
  screech(now + e * 0.5, e * steps)
  return steps * e * 1000
}

/** Continuous loop for the character viewer. */
let loop: number | null = null
export function startLoop(mode: 'harmony' | 'shred', t0: number) {
  stopLoop()
  const bpm = mode === 'harmony' ? HARMONY.bpm : SHRED.bpm
  const barMs = eighth(bpm) * 8
  let step = stepAt(bpm, t0, performance.now())
  const tick = () => {
    playPhrase(mode, step, 8)
    step += 8
  }
  tick()
  loop = window.setInterval(tick, barMs)
}
export function stopLoop() {
  if (loop !== null) clearInterval(loop)
  loop = null
}
```

### `characters/ik.ts: two-bone arm IK`

```ts
import { Matrix4, Object3D, Quaternion, Vector3 } from 'three'

// Analytic two-bone IK for the hand-built rigs.
// The shoulder's arm points down its local -Y, and the elbow bends by a
// negative rotation about its local X (forearm swings toward local +Z).

const _d = new Vector3()
const _p = new Vector3()
const _u = new Vector3()
const _x = new Vector3()
const _y = new Vector3()
const _z = new Vector3()
const _m = new Matrix4()
const _q = new Quaternion()

/**
 * Point `shoulder` and bend `elbow` so the wrist reaches `target`.
 * `target` and `pole` are in the shoulder's parent space; `pole` is the
 * direction the elbow should point (e.g. out and back).
 */
export function solveArmIK(
  shoulder: Object3D,
  elbow: Object3D,
  target: Vector3,
  pole: Vector3,
  upper: number,
  lower: number,
) {
  _d.copy(target).sub(shoulder.position)
  const dist = Math.min(_d.length(), (upper + lower) * 0.999)
  _d.normalize()

  // angle between upper arm and the shoulder→target line
  const cosA = (upper * upper + dist * dist - lower * lower) / (2 * upper * dist)
  const a = Math.acos(Math.min(1, Math.max(-1, cosA)))
  // elbow interior angle
  const cosE = (upper * upper + lower * lower - dist * dist) / (2 * upper * lower)
  const bend = Math.PI - Math.acos(Math.min(1, Math.max(-1, cosE)))

  _p.copy(pole).addScaledVector(_d, -pole.dot(_d)).normalize()
  _u.copy(_d).multiplyScalar(Math.cos(a)).addScaledVector(_p, Math.sin(a)).normalize()

  // shoulder basis: -Y along the upper arm, +Z toward the target side
  _y.copy(_u).negate()
  _z.copy(_d).addScaledVector(_u, -_d.dot(_u))
  if (_z.lengthSq() < 1e-8) _z.copy(_p).negate()
  _z.normalize()
  _x.crossVectors(_y, _z).normalize()
  _m.makeBasis(_x, _y, _z)
  _q.setFromRotationMatrix(_m)
  shoulder.quaternion.copy(_q)
  elbow.rotation.set(-bend, 0, 0)
}
```

### `characters/hair.ts: tapered hair strands`

```ts
import { BufferAttribute, BufferGeometry, CatmullRomCurve3, Color, TubeGeometry, Vector3 } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export type Strand = {
  points: Vector3[]
  radius: number
  color: Color
  flatten?: number // 0..1, squash the cross-section into a ribbon
  taper?: number // 0..1, how thin the tip gets
}

/** One tapered, curved clump of hair. */
export function strandGeometry(s: Strand, tubular = 12, radial = 6) {
  const curve = new CatmullRomCurve3(s.points, false, 'catmullrom', 0.5)
  const geo = new TubeGeometry(curve, tubular, s.radius, radial, false)
  const pos = geo.attributes.position as BufferAttribute
  const center = new Vector3()
  const v = new Vector3()
  const taper = s.taper ?? 0.92
  const frames = curve.computeFrenetFrames(tubular, false)
  for (let i = 0; i <= tubular; i++) {
    const t = i / tubular
    curve.getPointAt(t, center)
    const k = 1 - taper * Math.pow(t, 1.3)
    const bin = frames.binormals[i]
    for (let j = 0; j <= radial; j++) {
      const idx = i * (radial + 1) + j
      v.fromBufferAttribute(pos, idx).sub(center)
      // squash along the binormal to make a flat lock of hair
      if (s.flatten) v.addScaledVector(bin, -v.dot(bin) * s.flatten)
      v.multiplyScalar(k).add(center)
      pos.setXYZ(idx, v.x, v.y, v.z)
    }
  }
  geo.computeVertexNormals()
  const colors = new Float32Array(pos.count * 3)
  for (let i = 0; i <= tubular; i++) {
    const t = i / tubular
    // roots a little darker, tips catch the light
    const c = s.color.clone().multiplyScalar(0.75 + t * 0.4)
    for (let j = 0; j <= radial; j++) {
      const idx = i * (radial + 1) + j
      colors.set([c.r, c.g, c.b], idx * 3)
    }
  }
  geo.setAttribute('color', new BufferAttribute(colors, 3))
  return geo
}

/** All strands merged into a single mesh for speed. */
export function hairGeometry(strands: Strand[]): BufferGeometry {
  return mergeGeometries(strands.map((s) => strandGeometry(s)))
}
```

### `characters/parts.tsx: shared hands and helpers`

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


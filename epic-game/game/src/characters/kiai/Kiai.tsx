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

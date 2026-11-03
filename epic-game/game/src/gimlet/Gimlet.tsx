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

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { CuboidCollider, CylinderCollider, RigidBody } from '@react-three/rapier'
import { Group, MathUtils, PointLight, Mesh, Vector3 } from 'three'
import { playerState, useGame } from '../store'
import { Nature } from './Nature'
import { canvasTexture, fabricTexture } from '../characters/parts'
import { Saz, type SazPose } from '../characters/Saz'
import { Kiai, type KiaiPose } from '../characters/kiai/Kiai'

export const MIRA_POS = new Vector3(2.5, 0, 0)
export const SAZ_POS = new Vector3(-2.8, 0, -3)
export const KIAI_POS = new Vector3(4.6, 0, -5.5)
export const BEACON_POS = new Vector3(0, 3, -43)

// Tall reeds Gimlet can hide in: builds frenzy and enemies lose track of him.
export const HIDE_SPOTS: { pos: Vector3; r: number }[] = [
  { pos: new Vector3(4.5, 0, 4), r: 1.5 },
  { pos: new Vector3(-6, 0, -9), r: 1.6 },
  { pos: new Vector3(6, 0, -21), r: 1.6 },
  { pos: new Vector3(-8.5, 0, -27), r: 1.6 },
  { pos: new Vector3(5.5, 3, -40), r: 1.5 },
]

const RAMP_ANGLE = Math.atan2(3, 8)
const RAMP_LENGTH = Math.hypot(3, 8)

export function Level() {
  return (
    <>
      {/* Ground */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[80, 0.5, 80]} position={[0, -0.5, 0]} />
        <Ground />
      </RigidBody>

      {/* Path north */}
      <mesh receiveShadow rotation-x={-Math.PI / 2} position={[0, 0.01, -14]}>
        <planeGeometry args={[3, 30]} />
        <meshStandardMaterial color="#d6b37c" roughness={1} />
      </mesh>

      {/* Ramp and ridge */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh receiveShadow castShadow position={[0, 1.3, -33]} rotation-x={RAMP_ANGLE}>
          <boxGeometry args={[6, 0.4, RAMP_LENGTH]} />
          <meshStandardMaterial color="#c9a774" roughness={1} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh receiveShadow castShadow position={[0, 1.5, -42]}>
          <boxGeometry args={[16, 3, 10]} />
          <meshStandardMaterial color="#9b9a86" roughness={1} />
        </mesh>
        <mesh receiveShadow position={[0, 3.01, -42]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[16, 10]} />
          <meshStandardMaterial color="#7fb455" roughness={1} />
        </mesh>
      </RigidBody>

      <Village />
      <Stones />
      <Nature />
      <Mira />
      <SazNpc />
      <KiaiNpc />
      <Beacon />
      {HIDE_SPOTS.map((h, i) => (
        <Reeds key={i} spot={h} seed={i + 3} />
      ))}
    </>
  )
}

function House({ position, rotation = 0, wall = '#f1e3c6', roof = '#b5523b' }: { position: [number, number, number]; rotation?: number; wall?: string; roof?: string }) {
  return (
    <RigidBody type="fixed" colliders={false} position={position} rotation-y={rotation}>
      <CuboidCollider args={[1.8, 1.2, 1.6]} position={[0, 1.2, 0]} />
      <mesh castShadow receiveShadow position-y={1.2}>
        <boxGeometry args={[3.6, 2.4, 3.2]} />
        <meshStandardMaterial color={wall} roughness={0.9} />
      </mesh>
      <mesh castShadow position-y={3.1} rotation-y={Math.PI / 4}>
        <coneGeometry args={[2.9, 1.6, 4]} />
        <meshStandardMaterial color={roof} roughness={0.8} />
      </mesh>
      {/* lit window */}
      <mesh position={[0, 1.3, 1.61]}>
        <planeGeometry args={[0.7, 0.6]} />
        <meshStandardMaterial color="#ffe2a8" emissive="#ffae42" emissiveIntensity={0.4} />
      </mesh>
      {/* door + flower box */}
      <mesh position={[1.0, 0.7, 1.61]}>
        <planeGeometry args={[0.7, 1.4]} />
        <meshStandardMaterial color="#7a4a2b" />
      </mesh>
      <mesh position={[0, 0.92, 1.7]}>
        <boxGeometry args={[0.8, 0.15, 0.18]} />
        <meshStandardMaterial color="#8a5a35" />
      </mesh>
      {[-0.28, -0.1, 0.08, 0.26].map((x, i) => (
        <mesh key={x} position={[x, 1.05, 1.7]}>
          <icosahedronGeometry args={[0.09, 0]} />
          <meshStandardMaterial color={['#ff5c8a', '#ffd23f', '#ff8a3d', '#b38cff'][i]} />
        </mesh>
      ))}
    </RigidBody>
  )
}

function Village() {
  return (
    <>
      <House position={[-6, 0, 2]} rotation={0.3} wall="#f1e3c6" roof="#b5523b" />
      <House position={[7.5, 0, -1]} rotation={-0.4} wall="#cfe0ea" roof="#3e7e8c" />
      <House position={[-5, 0, 10]} rotation={2.8} wall="#f3d7a6" roof="#c8743c" />
      <House position={[6, 0, 9]} rotation={3.4} wall="#e9c2d0" roof="#7a4a8c" />
    </>
  )
}

function Stones() {
  const stones = useMemo(() => {
    const out: { pos: [number, number, number]; size: number; rot: number }[] = []
    let seed = 7
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    for (let i = 0; i < 18; i++) {
      const z = -12 - rand() * 18
      const side = rand() > 0.5 ? 1 : -1
      out.push({ pos: [side * (3 + rand() * 9), 0, z], size: 0.6 + rand() * 1.2, rot: rand() * Math.PI })
    }
    return out
  }, [])
  return (
    <>
      {stones.map((s, i) => (
        <RigidBody key={i} type="fixed" colliders="hull" position={s.pos} rotation-y={s.rot}>
          <mesh castShadow receiveShadow position-y={s.size * 0.5}>
            <dodecahedronGeometry args={[s.size, 0]} />
            <meshStandardMaterial color="#a8a89c" roughness={1} flatShading />
          </mesh>
        </RigidBody>
      ))}
    </>
  )
}

function Mira() {
  return (
    <RigidBody type="fixed" colliders={false} position={MIRA_POS.toArray()}>
      <CylinderCollider args={[0.9, 0.4]} position-y={0.9} />
      <mesh castShadow position-y={0.75}>
        <coneGeometry args={[0.55, 1.5, 12]} />
        <meshStandardMaterial color="#5a6b4a" roughness={0.9} />
      </mesh>
      <mesh castShadow position-y={1.65}>
        <sphereGeometry args={[0.22, 20, 16]} />
        <meshStandardMaterial color="#c99a7a" />
      </mesh>
      <mesh castShadow position-y={1.78}>
        <coneGeometry args={[0.3, 0.55, 12]} />
        <meshStandardMaterial color="#4a5a3c" />
      </mesh>
      <mesh position={[0.45, 1.0, 0.2]}>
        <boxGeometry args={[0.18, 0.25, 0.18]} />
        <meshStandardMaterial color="#ffd27a" emissive="#ffae42" emissiveIntensity={4} toneMapped={false} />
      </mesh>
      <pointLight position={[0.45, 1.2, 0.4]} color="#ffb347" intensity={8} distance={8} decay={2} />
      <Html position={[0, 2.4, 0]} center distanceFactor={10} zIndexRange={[10, 0]} className="nameplate">
        Mira
      </Html>
    </RigidBody>
  )
}

function Beacon() {
  const lit = useGame((s) => s.beaconLit)
  const light = useRef<PointLight>(null)
  const flame = useRef<Mesh>(null)

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    if (light.current) {
      const target = lit ? 120 + Math.sin(t * 9) * 12 : 0
      light.current.intensity = MathUtils.damp(light.current.intensity, target, 1.5, dt)
    }
    if (flame.current) {
      const s = MathUtils.damp(flame.current.scale.x, lit ? 1 + Math.sin(t * 11) * 0.08 : 0.15, 2, dt)
      flame.current.scale.setScalar(s)
    }
  })

  return (
    <group position={BEACON_POS.toArray()}>
      <RigidBody type="fixed" colliders={false}>
        <CylinderCollider args={[1.5, 0.9]} position-y={1.5} />
      </RigidBody>
      <mesh castShadow position-y={0.4}>
        <cylinderGeometry args={[1.1, 1.3, 0.8, 8]} />
        <meshStandardMaterial color="#4a4a52" roughness={0.9} />
      </mesh>
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2
        return (
          <mesh key={i} castShadow position={[Math.cos(a) * 0.8, 1.8, Math.sin(a) * 0.8]}>
            <cylinderGeometry args={[0.05, 0.05, 2]} />
            <meshStandardMaterial color="#2a2a2e" metalness={0.8} roughness={0.4} />
          </mesh>
        )
      })}
      <mesh ref={flame} position-y={1.9} scale={0.15}>
        <icosahedronGeometry args={[0.65, 2]} />
        <meshStandardMaterial color="#ffd27a" emissive="#ff7a1a" emissiveIntensity={10} toneMapped={false} />
      </mesh>
      <pointLight ref={light} position-y={2.4} color="#ff9a3c" intensity={0} distance={60} decay={1.6} castShadow />
    </group>
  )
}

// Shows "[E] ..." when the player is near something they can interact with.
export function Interactions() {
  const setPrompt = useGame((s) => s.setPrompt)
  useFrame(() => {
    const p = playerState.position
    const { questAccepted, beaconLit } = useGame.getState()
    if (p.distanceTo(MIRA_POS) < 3) setPrompt({ label: 'Talk to Mira', knot: 'mira' })
    else if (p.distanceTo(SAZ_POS) < 2.6) setPrompt({ label: 'Talk to Saz', knot: 'saz' })
    else if (useGame.getState().hero === 'gimlet' && p.distanceTo(KIAI_POS) < 2.6) setPrompt({ label: 'Talk to Kiai', knot: 'kiai' })
    else if (p.distanceTo(BEACON_POS) < 3.5)
      setPrompt({ label: questAccepted && !beaconLit ? 'Light the beacon' : 'Examine the beacon', knot: 'beacon' })
    else setPrompt(null)
  })
  return null
}

function Reeds({ spot, seed }: { spot: { pos: Vector3; r: number }; seed: number }) {
  const blades = useMemo(() => {
    let x = seed * 9301
    const rand = () => ((x = (x * 16807) % 2147483647) / 2147483647)
    return Array.from({ length: 34 }, () => {
      const a = rand() * Math.PI * 2
      const d = Math.sqrt(rand()) * spot.r
      return { p: [Math.cos(a) * d, 0, Math.sin(a) * d] as [number, number, number], h: 1.4 + rand() * 0.9, lean: (rand() - 0.5) * 0.4, rot: rand() * 3 }
    })
  }, [seed, spot.r])
  return (
    <group position={spot.pos.toArray()}>
      {blades.map((b, i) => (
        <mesh key={i} castShadow position={[b.p[0], b.h / 2, b.p[2]]} rotation={[b.lean, b.rot, b.lean * 0.5]}>
          <coneGeometry args={[0.07, b.h, 4]} />
          <meshStandardMaterial color={i % 3 ? '#6f9a3b' : '#9aa647'} roughness={1} flatShading />
        </mesh>
      ))}
    </group>
  )
}

// Saz hangs around the village: waves when Gimlet comes near, talks during
// his conversation, and dances once the beacon is lit.
function SazNpc() {
  const pose = useRef<SazPose>({ dancing: false, waveAt: 0, talking: false })
  const turn = useRef<Group>(null)
  const near = useRef(false)
  useFrame((_, dt) => {
    const g = useGame.getState()
    const d = playerState.position.distanceTo(SAZ_POS)
    if (d < 6 && !near.current) pose.current.waveAt = performance.now()
    near.current = d < 6
    pose.current.dancing = g.beaconLit && !g.dialogue
    pose.current.talking = g.dialogue?.speaker === 'Saz'
    if (turn.current) {
      const yaw = Math.atan2(playerState.position.x - SAZ_POS.x, playerState.position.z - SAZ_POS.z)
      const cur = turn.current.rotation.y
      const delta = Math.atan2(Math.sin(yaw - cur), Math.cos(yaw - cur))
      if (d < 8) turn.current.rotation.y = cur + delta * Math.min(1, dt * 3)
    }
  })
  return (
    <RigidBody type="fixed" colliders={false} position={SAZ_POS.toArray()}>
      <CylinderCollider args={[0.9, 0.35]} position-y={0.9} />
      <group ref={turn} rotation-y={0.6}>
        <Saz getPose={() => pose.current} />
      </group>
      <Html position={[0, 2.35, 0]} center distanceFactor={10} zIndexRange={[10, 0]} className="nameplate">
        Saz
      </Html>
    </RigidBody>
  )
}

// When you play Gimlet, Kiai is in the village. She noodles on her keytar,
// and plays Harmony for the party once the beacon is lit.
function KiaiNpc() {
  const hero = useGame((g) => g.hero)
  const pose = useRef<KiaiPose>({ moving: false, mode: 'idle', modeStart: performance.now(), castAt: 0, shredAt: 0 })
  const turn = useRef<Group>(null)
  useFrame((_, dt) => {
    const g = useGame.getState()
    const want = g.beaconLit && !g.dialogue ? 'harmony' : 'idle'
    if (pose.current.mode !== want) {
      pose.current.mode = want
      pose.current.modeStart = performance.now()
    }
    pose.current.talking = g.dialogue?.speaker === 'Kiai'
    const d = playerState.position.distanceTo(KIAI_POS)
    if (turn.current && d < 8) {
      const yaw = Math.atan2(playerState.position.x - KIAI_POS.x, playerState.position.z - KIAI_POS.z)
      const cur = turn.current.rotation.y
      turn.current.rotation.y = cur + Math.atan2(Math.sin(yaw - cur), Math.cos(yaw - cur)) * Math.min(1, dt * 3)
    }
  })
  if (hero !== 'gimlet') return null
  return (
    <RigidBody type="fixed" colliders={false} position={KIAI_POS.toArray()}>
      <CylinderCollider args={[0.9, 0.35]} position-y={0.9} />
      <group ref={turn} rotation-y={0.9}>
        <Kiai getPose={() => pose.current} />
      </group>
      <Html position={[0, 2.2, 0]} center distanceFactor={10} zIndexRange={[10, 0]} className="nameplate">
        Kiai
      </Html>
    </RigidBody>
  )
}

function Ground() {
  const map = useMemo(() => canvasTexture(fabricTexture('#78b04f', { grain: 0.05, dust: 'rgba(60,110,40,0.35)', dustAmount: 30, seed: 2 }), [40, 40]), [])
  return (
    <mesh receiveShadow rotation-x={-Math.PI / 2}>
      <planeGeometry args={[160, 160]} />
      <meshStandardMaterial map={map} roughness={1} />
    </mesh>
  )
}

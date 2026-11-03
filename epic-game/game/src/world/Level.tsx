import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { CuboidCollider, CylinderCollider, RigidBody } from '@react-three/rapier'
import { MathUtils, PointLight, Mesh, Vector3 } from 'three'
import { playerState, useGame } from '../store'

export const MIRA_POS = new Vector3(2.5, 0, 0)
export const BEACON_POS = new Vector3(0, 3, -43)

const RAMP_ANGLE = Math.atan2(3, 8)
const RAMP_LENGTH = Math.hypot(3, 8)

export function Level() {
  return (
    <>
      {/* Ground */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[60, 0.5, 60]} position={[0, -0.5, 0]} />
        <mesh receiveShadow rotation-x={-Math.PI / 2}>
          <planeGeometry args={[120, 120]} />
          <meshStandardMaterial color="#2c3326" roughness={1} />
        </mesh>
      </RigidBody>

      {/* Path north */}
      <mesh receiveShadow rotation-x={-Math.PI / 2} position={[0, 0.01, -14]}>
        <planeGeometry args={[3, 30]} />
        <meshStandardMaterial color="#4a4136" roughness={1} />
      </mesh>

      {/* Ramp and ridge */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh receiveShadow castShadow position={[0, 1.3, -33]} rotation-x={RAMP_ANGLE}>
          <boxGeometry args={[6, 0.4, RAMP_LENGTH]} />
          <meshStandardMaterial color="#4a4136" roughness={1} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh receiveShadow castShadow position={[0, 1.5, -42]}>
          <boxGeometry args={[16, 3, 10]} />
          <meshStandardMaterial color="#3a3a40" roughness={1} />
        </mesh>
      </RigidBody>

      <Village />
      <Stones />
      <Trees />
      <Mira />
      <Beacon />
    </>
  )
}

function House({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <RigidBody type="fixed" colliders={false} position={position} rotation-y={rotation}>
      <CuboidCollider args={[1.8, 1.2, 1.6]} position={[0, 1.2, 0]} />
      <mesh castShadow receiveShadow position-y={1.2}>
        <boxGeometry args={[3.6, 2.4, 3.2]} />
        <meshStandardMaterial color="#6b5a48" roughness={0.9} />
      </mesh>
      <mesh castShadow position-y={3.1} rotation-y={Math.PI / 4}>
        <coneGeometry args={[2.9, 1.6, 4]} />
        <meshStandardMaterial color="#3b2a24" roughness={0.9} />
      </mesh>
      {/* lit window */}
      <mesh position={[0, 1.3, 1.61]}>
        <planeGeometry args={[0.7, 0.6]} />
        <meshStandardMaterial color="#ffcf7a" emissive="#ffae42" emissiveIntensity={3} toneMapped={false} />
      </mesh>
    </RigidBody>
  )
}

function Village() {
  return (
    <>
      <House position={[-6, 0, 2]} rotation={0.3} />
      <House position={[7.5, 0, -1]} rotation={-0.4} />
      <House position={[-5, 0, 10]} rotation={2.8} />
      <House position={[6, 0, 9]} rotation={3.4} />
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
            <meshStandardMaterial color="#5d5f63" roughness={1} flatShading />
          </mesh>
        </RigidBody>
      ))}
    </>
  )
}

function Trees() {
  const trees = useMemo(() => {
    const out: [number, number, number][] = []
    let seed = 42
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    while (out.length < 60) {
      const x = (rand() - 0.5) * 100
      const z = (rand() - 0.5) * 100
      if (Math.abs(x) < 14 && z > -50 && z < 14) continue // keep play space clear
      out.push([x, 0, z])
    }
    return out
  }, [])
  return (
    <>
      {trees.map((p, i) => (
        <RigidBody key={i} type="fixed" colliders={false} position={p}>
          <CylinderCollider args={[1.5, 0.4]} position-y={1.5} />
          <mesh castShadow position-y={0.8}>
            <cylinderGeometry args={[0.2, 0.3, 1.6]} />
            <meshStandardMaterial color="#3b2b1f" />
          </mesh>
          <mesh castShadow position-y={2.8}>
            <coneGeometry args={[1.4, 3.6, 7]} />
            <meshStandardMaterial color="#1d3324" roughness={1} flatShading />
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
      <Html position={[0, 2.4, 0]} center distanceFactor={10} className="nameplate">
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
    else if (p.distanceTo(BEACON_POS) < 3.5)
      setPrompt({ label: questAccepted && !beaconLit ? 'Light the beacon' : 'Examine the beacon', knot: 'beacon' })
    else setPrompt(null)
  })
  return null
}

import { Suspense, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useKeyboardControls } from '@react-three/drei'
import { CapsuleCollider, RigidBody, useRapier, type RapierRigidBody } from '@react-three/rapier'
import { Group, MathUtils, Vector3 } from 'three'
import { playerState, useGame } from '../store'
import type { Controls } from '../controls'
import { HeroModel, useHeroAvailable } from './HeroModel'

const SPEED = 5.5
const JUMP_VELOCITY = 6.5
const CAMERA_OFFSET = new Vector3(0, 5.5, 8.5)

const move = new Vector3()
const camTarget = new Vector3()
const lookAt = new Vector3()

// The hero. Drop a rigged character at public/models/hero.glb and it replaces
// the placeholder automatically (see HeroModel.tsx).
export function Player() {
  const body = useRef<RapierRigidBody>(null)
  const model = useRef<Group>(null)
  const swordArm = useRef<Group>(null)
  const jumpHeld = useRef(false)
  const moving = useRef(false)
  const hasHero = useHeroAvailable()
  const [, getKeys] = useKeyboardControls<Controls>()
  const { world, rapier } = useRapier()
  const questAccepted = useGame((s) => s.questAccepted)

  useFrame((state, dt) => {
    const b = body.current
    if (!b) return
    const { dialogue, health, attackAt } = useGame.getState()
    const frozen = dialogue !== null || health <= 0
    const keys = getKeys()
    const t = b.translation()
    const vel = b.linvel()

    // Respawn if we fall off the world.
    if (t.y < -15) {
      b.setTranslation({ x: 0, y: 2, z: 6 }, true)
      b.setLinvel({ x: 0, y: 0, z: 0 }, true)
      useGame.getState().hurt()
    }

    move.set(Number(keys.right) - Number(keys.left), 0, Number(keys.back) - Number(keys.forward))
    if (frozen) move.set(0, 0, 0)
    moving.current = move.lengthSq() > 0
    if (moving.current) move.normalize().multiplyScalar(SPEED)

    const ray = new rapier.Ray({ x: t.x, y: t.y, z: t.z }, { x: 0, y: -1, z: 0 })
    const grounded = world.castRay(ray, 1.0, true, undefined, undefined, undefined, b) !== null

    let vy = vel.y
    if (keys.jump && !jumpHeld.current && grounded && !frozen) vy = JUMP_VELOCITY
    jumpHeld.current = keys.jump

    b.setLinvel({ x: move.x, y: vy, z: move.z }, true)
    playerState.position.set(t.x, t.y, t.z)

    // Face movement direction.
    if (model.current && move.lengthSq() > 0) {
      const targetYaw = Math.atan2(move.x, move.z)
      const current = model.current.rotation.y
      const delta = Math.atan2(Math.sin(targetYaw - current), Math.cos(targetYaw - current))
      model.current.rotation.y = current + delta * Math.min(1, dt * 12)
    }

    // Sword swing: a quick arc right after an attack.
    if (swordArm.current) {
      const p = (performance.now() - attackAt) / 220
      swordArm.current.rotation.x = p < 1 ? MathUtils.lerp(-2.2, 0.9, p) : MathUtils.damp(swordArm.current.rotation.x, 0, 10, dt)
    }

    // Follow camera.
    camTarget.set(t.x, t.y, t.z).add(CAMERA_OFFSET)
    state.camera.position.lerp(camTarget, 1 - Math.exp(-5 * dt))
    lookAt.set(t.x, t.y + 1, t.z - 2)
    state.camera.lookAt(lookAt)
  })

  return (
    <RigidBody ref={body} position={[0, 1.5, 6]} colliders={false} lockRotations friction={0} name="player">
      <CapsuleCollider args={[0.5, 0.35]} />
      <group ref={model} rotation-y={Math.PI}>
        {hasHero ? (
          <Suspense fallback={null}>
            <HeroModel moving={moving} />
          </Suspense>
        ) : (
          <PlaceholderBody />
        )}
        <group ref={swordArm} position={[0.42, 0.35, 0]}>
          <mesh castShadow position={[0, 0, 0.55]} rotation-x={Math.PI / 2}>
            <boxGeometry args={[0.07, 1.0, 0.02]} />
            <meshStandardMaterial color="#d8dde6" metalness={0.9} roughness={0.25} />
          </mesh>
        </group>
        {questAccepted && (
          <group position={[-0.45, 0.2, 0.15]}>
            <mesh>
              <sphereGeometry args={[0.09, 16, 12]} />
              <meshStandardMaterial color="#ffb347" emissive="#ff8a1f" emissiveIntensity={6} toneMapped={false} />
            </mesh>
            <pointLight color="#ff9a3c" intensity={6} distance={7} decay={2} />
          </group>
        )}
      </group>
    </RigidBody>
  )
}

function PlaceholderBody() {
  return (
    <>
      <mesh castShadow position-y={-0.1}>
        <capsuleGeometry args={[0.35, 0.9, 6, 16]} />
        <meshStandardMaterial color="#3d4b6b" roughness={0.6} />
      </mesh>
      <mesh castShadow position-y={0.72}>
        <sphereGeometry args={[0.24, 24, 16]} />
        <meshStandardMaterial color="#e2b896" />
      </mesh>
      {/* cloak */}
      <mesh castShadow position={[0, 0.05, -0.18]} rotation-x={0.12}>
        <boxGeometry args={[0.7, 1.1, 0.06]} />
        <meshStandardMaterial color="#7a1f2b" roughness={0.9} />
      </mesh>
    </>
  )
}

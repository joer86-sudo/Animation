import { Suspense, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useKeyboardControls } from '@react-three/drei'
import { CapsuleCollider, RigidBody, useRapier, type RapierRigidBody } from '@react-three/rapier'
import { Group, Vector3 } from 'three'
import { isDrinking, isFrenzy, playerState, useGame } from '../store'
import { touchInput, type Controls } from '../controls'
import { HeroModel, useHeroAvailable } from './HeroModel'
import { HIDE_SPOTS } from './Level'
import { Gimlet, type GimletPose } from '../gimlet/Gimlet'

const SPEED = 5.5
const FRENZY_SPEED_MUL = 1.6
const JUMP_VELOCITY = 6.5
const CAMERA_OFFSET = new Vector3(0, 5.5, 8.5)
const MODEL_SCALE = 0.9

const move = new Vector3()
const camTarget = new Vector3()
const lookAt = new Vector3()
const flat = new Vector3()

// The hero is Gimlet (see gimlet/Gimlet.tsx). If public/models/hero.glb exists,
// that model is used instead (see HeroModel.tsx).
export function Player() {
  const body = useRef<RapierRigidBody>(null)
  const model = useRef<Group>(null)
  const jumpHeld = useRef(false)
  const moving = useRef(false)
  const hasHero = useHeroAvailable()
  const [, getKeys] = useKeyboardControls<Controls>()
  const { world, rapier } = useRapier()
  const questAccepted = useGame((s) => s.questAccepted)

  const pose = useRef<GimletPose>({ moving: false, frenzy: false, bottles: 2, attackAt: 0, throwAt: 0, drinkStart: 0, drinkUntil: 0 })

  useFrame((state, dt) => {
    const b = body.current
    if (!b) return
    const g = useGame.getState()
    const drinking = isDrinking(g)
    const frenzy = isFrenzy(g)
    const frozen = g.dialogue !== null || g.health <= 0 || !g.started
    const rooted = frozen || drinking // can't move while drinking
    const keys = getKeys()
    const t = b.translation()
    const vel = b.linvel()

    if (t.y < -15) {
      b.setTranslation({ x: 0, y: 2, z: 6 }, true)
      b.setLinvel({ x: 0, y: 0, z: 0 }, true)
      g.hurt()
    }

    move.set(Number(keys.right) - Number(keys.left) + touchInput.x, 0, Number(keys.back) - Number(keys.forward) + touchInput.z)
    if (rooted) move.set(0, 0, 0)
    moving.current = move.lengthSq() > 0
    if (moving.current) move.normalize().multiplyScalar(SPEED * (frenzy ? FRENZY_SPEED_MUL : 1))

    const ray = new rapier.Ray({ x: t.x, y: t.y, z: t.z }, { x: 0, y: -1, z: 0 })
    const grounded = world.castRay(ray, 1.0, true, undefined, undefined, undefined, b) !== null

    let vy = vel.y
    const jump = keys.jump || touchInput.jump
    if (jump && !jumpHeld.current && grounded && !rooted) vy = JUMP_VELOCITY
    jumpHeld.current = jump

    b.setLinvel({ x: move.x, y: vy, z: move.z }, true)
    playerState.position.set(t.x, t.y, t.z)

    // hidden = standing inside a reed patch
    playerState.hidden = HIDE_SPOTS.some((h) => flat.set(t.x, h.pos.y, t.z).distanceTo(h.pos) < h.r && Math.abs(t.y - h.pos.y) < 2)
    if (!frozen) g.tick(dt, moving.current || !grounded, playerState.hidden)

    // face movement direction
    if (model.current && moving.current) {
      const targetYaw = Math.atan2(move.x, move.z)
      const current = model.current.rotation.y
      const delta = Math.atan2(Math.sin(targetYaw - current), Math.cos(targetYaw - current))
      model.current.rotation.y = current + delta * Math.min(1, dt * 12)
    }
    if (model.current) {
      const yaw = model.current.rotation.y
      playerState.facing.set(Math.sin(yaw), 0, Math.cos(yaw))
    }

    // feed the animation rig
    const p = pose.current
    p.moving = moving.current
    p.frenzy = frenzy
    p.bottles = g.bottles
    p.attackAt = g.attackAt
    p.throwAt = g.throwAt
    p.drinkStart = g.drinkStart
    p.drinkUntil = g.drinkUntil

    // follow camera (a little shake during frenzy)
    camTarget.set(t.x, t.y, t.z).add(CAMERA_OFFSET)
    if (frenzy) camTarget.x += Math.sin(state.clock.elapsedTime * 50) * 0.04
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
          <group position-y={-0.85} scale={MODEL_SCALE}>
            <Gimlet getPose={() => pose.current} />
          </group>
        )}
        {questAccepted && (
          // the ember Mira gave him floats at his shoulder
          <group position={[-0.45, 0.75, -0.1]}>
            <mesh>
              <sphereGeometry args={[0.07, 16, 12]} />
              <meshStandardMaterial color="#ffb347" emissive="#ff8a1f" emissiveIntensity={6} toneMapped={false} />
            </mesh>
            <pointLight color="#ff9a3c" intensity={5} distance={7} decay={2} />
          </group>
        )}
      </group>
    </RigidBody>
  )
}

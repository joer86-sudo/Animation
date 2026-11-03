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

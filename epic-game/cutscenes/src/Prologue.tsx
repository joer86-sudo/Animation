import { AbsoluteFill, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig, Easing } from 'remotion'
import { ThreeCanvas } from '@remotion/three'
import { useThree } from '@react-three/fiber'

// Prologue: the camera drifts up the valley toward the ridge while the
// beacon gutters out, then the title rises from the dark.
export const Prologue = () => {
  const { width, height } = useVideoConfig()
  return (
    <AbsoluteFill style={{ backgroundColor: '#0b0910' }}>
      <ThreeCanvas width={width} height={height} shadows camera={{ fov: 40, position: [0, 3, 30] }}>
        <Scene />
      </ThreeCanvas>
      <Sequence from={20} durationInFrames={95}>
        <Caption text="For a hundred years, the lantern on the ridge kept the dark away." />
      </Sequence>
      <Sequence from={120} durationInFrames={70}>
        <Caption text="Then, one autumn night, it went out." />
      </Sequence>
      <Sequence from={195}>
        <Title />
      </Sequence>
    </AbsoluteFill>
  )
}

function Scene() {
  const frame = useCurrentFrame()
  const t = frame / 30
  // Camera push-in.
  const camZ = interpolate(frame, [0, 300], [30, 10], { easing: Easing.inOut(Easing.cubic) })
  const camY = interpolate(frame, [0, 300], [2.5, 4.5])
  // Beacon dies between frames 120 and 160, with a last flicker.
  const flicker = 1 + Math.sin(t * 23) * 0.15 + Math.sin(t * 7) * 0.1
  const life = interpolate(frame, [115, 130, 136, 160], [1, 0.35, 0.7, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const beacon = life * flicker

  return (
    <>
      <CameraRig y={camY} z={camZ} />
      <color attach="background" args={['#14111c']} />
      <fog attach="fog" args={['#14111c', 8, 45]} />
      <hemisphereLight args={['#5c6390', '#1a140f', 0.35]} />
      <directionalLight position={[-10, 8, -20]} intensity={0.4} color="#c38a7a" />

      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#1f241b" roughness={1} />
      </mesh>
      {/* ridge */}
      <mesh position={[0, 1.5, -8]} receiveShadow castShadow>
        <boxGeometry args={[18, 3, 8]} />
        <meshStandardMaterial color="#2a2a30" roughness={1} />
      </mesh>
      {/* standing stones along the road */}
      {[-4, 4, -5.5, 5, -3.5, 4.5].map((x, i) => (
        <mesh key={i} position={[x, 0.8, 12 - i * 3.5]} rotation-y={i} castShadow>
          <dodecahedronGeometry args={[0.9, 0]} />
          <meshStandardMaterial color="#45464b" roughness={1} flatShading />
        </mesh>
      ))}
      {/* beacon */}
      <group position={[0, 3, -8]}>
        <mesh position-y={0.4}>
          <cylinderGeometry args={[1.1, 1.3, 0.8, 8]} />
          <meshStandardMaterial color="#3a3a42" />
        </mesh>
        <mesh position-y={1.9} scale={0.2 + beacon * 0.8}>
          <icosahedronGeometry args={[0.65, 2]} />
          <meshStandardMaterial color="#ffd27a" emissive="#ff7a1a" emissiveIntensity={3 * beacon} toneMapped={false} />
        </mesh>
        <pointLight position-y={2.4} color="#ff9a3c" intensity={180 * beacon} distance={50} decay={1.6} castShadow />
      </group>
      {/* the Hollow ones open their eyes once the light is gone */}
      {[-6, -2.5, 3, 6.5].map((x, i) => {
        const open = interpolate(frame, [170 + i * 8, 180 + i * 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
        return (
          <group key={i} position={[x, 0.7, 2 - i * 2]}>
            {[-0.18, 0.18].map((ex) => (
              <mesh key={ex} position={[ex, 0, 0]} scale={[1, open, 1]}>
                <sphereGeometry args={[0.07, 8, 8]} />
                <meshStandardMaterial color="#ff2a3a" emissive="#ff1030" emissiveIntensity={6} toneMapped={false} />
              </mesh>
            ))}
          </group>
        )
      })}
    </>
  )
}

function CameraRig({ y, z }: { y: number; z: number }) {
  const camera = useThree((s) => s.camera)
  camera.position.set(0, y, z)
  camera.lookAt(0, 2.5, -8)
  return null
}

function Caption({ text }: { text: string }) {
  const frame = useCurrentFrame()
  const opacity = interpolate(frame, [0, 15, 60, 75], [0, 1, 1, 0], { extrapolateRight: 'clamp' })
  return (
    <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 140 }}>
      <p style={{ opacity, color: '#efe4cf', fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 46, textAlign: 'center', maxWidth: 1300, textShadow: '0 2px 12px #000' }}>
        {text}
      </p>
    </AbsoluteFill>
  )
}

function Title() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const rise = spring({ frame, fps, config: { damping: 200 } })
  const sub = interpolate(frame, [25, 50], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', background: `rgba(8,6,12,${0.55 * rise})` }}>
      <h1 style={{ margin: 0, opacity: rise, transform: `translateY(${(1 - rise) * 40}px)`, color: '#f3ead8', fontFamily: 'Georgia, serif', fontSize: 150, letterSpacing: 6, textShadow: '0 0 60px #ff8a1f88' }}>
        THE LAST LANTERN
      </h1>
      <p style={{ opacity: sub, color: '#b9ad96', fontFamily: 'Georgia, serif', fontSize: 34, letterSpacing: 14 }}>A STORY OF EMBERFALL</p>
    </AbsoluteFill>
  )
}

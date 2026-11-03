import { useRef, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import type { Object3D } from 'three'
import { ContactShadows, OrbitControls } from '@react-three/drei'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { DRINK_MS, Gimlet, type GimletPose } from './Gimlet'

// Turntable for designing Gimlet: open the game with ?view=gimlet
export function CharacterViewer() {
  const pose = useRef<GimletPose>({ moving: false, frenzy: false, bottles: 2, attackAt: 0, throwAt: 0, drinkStart: 0, drinkUntil: 0 })
  const [, force] = useState(0)
  const p = pose.current
  const toggle = (k: 'moving' | 'frenzy') => {
    p[k] = !p[k]
    force((n) => n + 1)
  }
  const actions: [string, () => void, boolean?][] = [
    ['Run', () => toggle('moving'), p.moving],
    ['Frenzy', () => toggle('frenzy'), p.frenzy],
    ['Punch', () => (p.attackAt = performance.now())],
    ['Throw', () => (p.throwAt = performance.now())],
    ['Drink', () => ((p.drinkStart = performance.now()), (p.drinkUntil = p.drinkStart + DRINK_MS))],
    ['Export .glb', () => downloadGlb()],
  ]

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#8a8790' }}>
      <Canvas shadows camera={{ position: [1.2, 1.3, 4.6], fov: 35 }}>
        <color attach="background" args={['#8a8790']} />
        <hemisphereLight args={['#ffffff', '#6a6570', 1.1]} />
        <directionalLight position={[3, 5, 4]} intensity={2.2} castShadow shadow-mapSize={[2048, 2048]} />
        <directionalLight position={[-4, 2, -3]} intensity={0.8} color="#cfd8ff" />
        <Gimlet getPose={() => pose.current} />
        <ExportHook />
        <ContactShadows position={[0, 0.001, 0]} opacity={0.5} scale={4} blur={2} far={2} />
        <OrbitControls target={[0, 0.95, 0]} autoRotate={false} enablePan={false} minDistance={1.5} maxDistance={7} />
        <EffectComposer>
          <Bloom mipmapBlur luminanceThreshold={1} intensity={0.8} />
        </EffectComposer>
      </Canvas>
      <div className="viewer-bar">
        <strong>Gimlet</strong>
        {actions.map(([label, fn, active]) => (
          <button key={label} className={active ? 'active' : ''} onClick={fn}>
            {label}
          </button>
        ))}
        <span className="hint">drag to orbit</span>
      </div>
    </div>
  )
}

// ---- .glb export -------------------------------------------------------
// Saves Gimlet's current pose as a binary glTF with named joints
// (hips, spine, head, shoulder_L/R, elbow_L/R, thigh_L/R, knee_L/R) and his
// painted textures embedded. Exposed on window for scripted export too.
let sceneRef: Object3D | null = null

function ExportHook() {
  sceneRef = useThree((s) => s.scene)
  return null
}

export async function exportGimletGlb(): Promise<ArrayBuffer> {
  const gimlet = sceneRef?.getObjectByName('Gimlet')
  if (!gimlet) throw new Error('Gimlet is not in the scene yet')
  const result = await new GLTFExporter().parseAsync(gimlet, { binary: true, onlyVisible: true })
  return result as ArrayBuffer
}

async function downloadGlb() {
  const buf = await exportGimletGlb()
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([buf], { type: 'model/gltf-binary' }))
  a.download = 'gimlet.glb'
  a.click()
  URL.revokeObjectURL(a.href)
}

Object.assign(window, { __exportGimlet: exportGimletGlb })

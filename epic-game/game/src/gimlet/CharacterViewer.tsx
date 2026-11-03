import { useRef, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { ContactShadows, OrbitControls } from '@react-three/drei'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { InstancedMesh, Matrix4, Mesh, type BufferGeometry, type Object3D } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { DRINK_MS, Gimlet, type GimletPose } from './Gimlet'
import { Saz, type SazPose } from '../characters/Saz'

type Who = 'Gimlet' | 'Saz'

// Turntable for designing the cast: open the game with ?view=gimlet or ?view=saz
export function CharacterViewer() {
  const initial: Who = new URLSearchParams(location.search).get('view') === 'saz' ? 'Saz' : 'Gimlet'
  const [who, setWho] = useState<Who>(initial)
  const gimlet = useRef<GimletPose>({ moving: false, frenzy: false, bottles: 2, attackAt: 0, throwAt: 0, drinkStart: 0, drinkUntil: 0 })
  const saz = useRef<SazPose>({ dancing: false, waveAt: 0, talking: false })
  const [, force] = useState(0)
  const rerender = () => force((n) => n + 1)
  const g = gimlet.current
  const s = saz.current

  const actions: [string, () => void, boolean?][] =
    who === 'Gimlet'
      ? [
          ['Run', () => ((g.moving = !g.moving), rerender()), g.moving],
          ['Frenzy', () => ((g.frenzy = !g.frenzy), rerender()), g.frenzy],
          ['Punch', () => (g.attackAt = performance.now())],
          ['Throw', () => (g.throwAt = performance.now())],
          ['Drink', () => ((g.drinkStart = performance.now()), (g.drinkUntil = g.drinkStart + DRINK_MS))],
        ]
      : [
          ['Dance', () => ((s.dancing = !s.dancing), rerender()), s.dancing],
          ['Talk', () => ((s.talking = !s.talking), rerender()), s.talking],
          ['Wave', () => (s.waveAt = performance.now())],
        ]

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#8a8790' }}>
      <Canvas shadows camera={{ position: [1.2, 1.3, 4.6], fov: 35 }}>
        <color attach="background" args={['#8a8790']} />
        <hemisphereLight args={['#ffffff', '#6a6570', 1.1]} />
        <directionalLight position={[3, 5, 4]} intensity={2.2} castShadow shadow-mapSize={[2048, 2048]} />
        <directionalLight position={[-4, 2, -3]} intensity={0.8} color="#cfd8ff" />
        {who === 'Gimlet' ? <Gimlet getPose={() => gimlet.current} /> : <Saz getPose={() => saz.current} />}
        <ExportHook />
        <ContactShadows position={[0, 0.001, 0]} opacity={0.5} scale={4} blur={2} far={2} />
        <OrbitControls target={[0, 0.95, 0]} enablePan={false} minDistance={0.8} maxDistance={7} />
        <EffectComposer>
          <Bloom mipmapBlur luminanceThreshold={1} intensity={0.8} />
        </EffectComposer>
      </Canvas>
      <div className="viewer-bar">
        <div className="who" role="tablist">
          {(['Gimlet', 'Saz'] as Who[]).map((n) => (
            <button key={n} role="tab" aria-selected={who === n} className={who === n ? 'active' : ''} onClick={() => setWho(n)}>
              {n}
            </button>
          ))}
        </div>
        {actions.map(([label, fn, active]) => (
          <button key={label} className={active ? 'active' : ''} onClick={fn}>
            {label}
          </button>
        ))}
        <button onClick={() => downloadGlb(who)}>Export .glb</button>
        <span className="hint">drag to orbit · scroll to zoom</span>
      </div>
    </div>
  )
}

// ---- .glb export -------------------------------------------------------
// Saves the character's current pose as a binary glTF with named joints
// (hips, spine, head, shoulder_L/R, elbow_L/R, thigh_L/R, knee_L/R) and the
// painted textures embedded. Exposed on window for scripted export too.
let sceneRef: Object3D | null = null

function ExportHook() {
  sceneRef = useThree((s) => s.scene)
  return null
}

export async function exportCharacterGlb(name: Who = 'Gimlet'): Promise<ArrayBuffer> {
  const live = sceneRef?.getObjectByName(name)
  if (!live) throw new Error(`${name} is not in the scene`)
  // Bake instanced meshes (Saz's curls) into plain meshes so every 3D app can open the file.
  const obj = live.clone(true)
  const swaps: [InstancedMesh, Mesh][] = []
  obj.traverse((o) => {
    if (!(o as InstancedMesh).isInstancedMesh) return
    const im = o as InstancedMesh
    const m = new Matrix4()
    const parts: BufferGeometry[] = []
    for (let i = 0; i < im.count; i++) {
      im.getMatrixAt(i, m)
      parts.push(im.geometry.clone().applyMatrix4(m))
    }
    const merged = new Mesh(mergeGeometries(parts), im.material)
    merged.name = im.name || 'hair_curls'
    merged.position.copy(im.position)
    merged.quaternion.copy(im.quaternion)
    merged.scale.copy(im.scale)
    swaps.push([im, merged])
  })
  swaps.forEach(([im, mesh]) => im.parent?.add(mesh) && im.parent?.remove(im))
  const result = await new GLTFExporter().parseAsync(obj, { binary: true, onlyVisible: true })
  return result as ArrayBuffer
}

async function downloadGlb(name: Who) {
  const buf = await exportCharacterGlb(name)
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([buf], { type: 'model/gltf-binary' }))
  a.download = `${name.toLowerCase()}.glb`
  a.click()
  URL.revokeObjectURL(a.href)
}

Object.assign(window, { __exportCharacter: exportCharacterGlb, __exportGimlet: () => exportCharacterGlb('Gimlet') })

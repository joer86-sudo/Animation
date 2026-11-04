import { BufferAttribute, BufferGeometry, CatmullRomCurve3, Color, TubeGeometry, Vector3 } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export type Strand = {
  points: Vector3[]
  radius: number
  color: Color
  flatten?: number // 0..1, squash the cross-section into a ribbon
  taper?: number // 0..1, how thin the tip gets
}

/** One tapered, curved clump of hair. */
export function strandGeometry(s: Strand, tubular = 12, radial = 6) {
  const curve = new CatmullRomCurve3(s.points, false, 'catmullrom', 0.5)
  const geo = new TubeGeometry(curve, tubular, s.radius, radial, false)
  const pos = geo.attributes.position as BufferAttribute
  const center = new Vector3()
  const v = new Vector3()
  const taper = s.taper ?? 0.92
  const frames = curve.computeFrenetFrames(tubular, false)
  for (let i = 0; i <= tubular; i++) {
    const t = i / tubular
    curve.getPointAt(t, center)
    const k = 1 - taper * Math.pow(t, 1.3)
    const bin = frames.binormals[i]
    for (let j = 0; j <= radial; j++) {
      const idx = i * (radial + 1) + j
      v.fromBufferAttribute(pos, idx).sub(center)
      // squash along the binormal to make a flat lock of hair
      if (s.flatten) v.addScaledVector(bin, -v.dot(bin) * s.flatten)
      v.multiplyScalar(k).add(center)
      pos.setXYZ(idx, v.x, v.y, v.z)
    }
  }
  geo.computeVertexNormals()
  const colors = new Float32Array(pos.count * 3)
  for (let i = 0; i <= tubular; i++) {
    const t = i / tubular
    // roots a little darker, tips catch the light
    const c = s.color.clone().multiplyScalar(0.75 + t * 0.4)
    for (let j = 0; j <= radial; j++) {
      const idx = i * (radial + 1) + j
      colors.set([c.r, c.g, c.b], idx * 3)
    }
  }
  geo.setAttribute('color', new BufferAttribute(colors, 3))
  return geo
}

/** All strands merged into a single mesh for speed. */
export function hairGeometry(strands: Strand[]): BufferGeometry {
  return mergeGeometries(strands.map((s) => strandGeometry(s)))
}

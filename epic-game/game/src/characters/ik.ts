import { Matrix4, Object3D, Quaternion, Vector3 } from 'three'

// Analytic two-bone IK for the hand-built rigs.
// The shoulder's arm points down its local -Y, and the elbow bends by a
// negative rotation about its local X (forearm swings toward local +Z).

const _d = new Vector3()
const _p = new Vector3()
const _u = new Vector3()
const _x = new Vector3()
const _y = new Vector3()
const _z = new Vector3()
const _m = new Matrix4()
const _q = new Quaternion()

/**
 * Point `shoulder` and bend `elbow` so the wrist reaches `target`.
 * `target` and `pole` are in the shoulder's parent space; `pole` is the
 * direction the elbow should point (e.g. out and back).
 */
export function solveArmIK(
  shoulder: Object3D,
  elbow: Object3D,
  target: Vector3,
  pole: Vector3,
  upper: number,
  lower: number,
) {
  _d.copy(target).sub(shoulder.position)
  const dist = Math.min(_d.length(), (upper + lower) * 0.999)
  _d.normalize()

  // angle between upper arm and the shoulder→target line
  const cosA = (upper * upper + dist * dist - lower * lower) / (2 * upper * dist)
  const a = Math.acos(Math.min(1, Math.max(-1, cosA)))
  // elbow interior angle
  const cosE = (upper * upper + lower * lower - dist * dist) / (2 * upper * lower)
  const bend = Math.PI - Math.acos(Math.min(1, Math.max(-1, cosE)))

  _p.copy(pole).addScaledVector(_d, -pole.dot(_d)).normalize()
  _u.copy(_d).multiplyScalar(Math.cos(a)).addScaledVector(_p, Math.sin(a)).normalize()

  // shoulder basis: -Y along the upper arm, +Z toward the target side
  _y.copy(_u).negate()
  _z.copy(_d).addScaledVector(_u, -_d.dot(_u))
  if (_z.lengthSq() < 1e-8) _z.copy(_p).negate()
  _z.normalize()
  _x.crossVectors(_y, _z).normalize()
  _m.makeBasis(_x, _y, _z)
  _q.setFromRotationMatrix(_m)
  shoulder.quaternion.copy(_q)
  elbow.rotation.set(-bend, 0, 0)
}

// Kiai's two songs, shared by the animation (which keys she presses) and the
// synth (what you hear), so fingers and sound stay in sync. All original.
// Key index 0 = C3 on her keytar.

export const HARMONY = {
  bpm: 132,
  // lilting major-key arpeggios, eighth notes
  notes: [12, 16, 19, 24, 23, 19, 16, 19, 17, 21, 24, 29, 28, 24, 21, 24, 14, 17, 21, 26, 24, 21, 17, 21, 19, 23, 26, 31, 29, 26, 23, 19],
}

export const SHRED = {
  bpm: 168,
  // power chords (root, fifth, octave), eighth notes
  roots: [4, 4, 4, 7, 4, 4, 9, 7, 2, 2, 2, 5, 2, 7, 4, 4],
}
export const chord = (root: number) => [root, root + 7, root + 12]

export const IDLE = { bpm: 84, notes: [12, -1, 16, -1, 19, -1, 16, -1] } // -1 = rest

export const eighth = (bpm: number) => 60000 / bpm / 2
export function stepAt(bpm: number, t0: number, now: number) {
  return Math.floor((now - t0) / eighth(bpm))
}
export const keyFreq = (k: number) => 130.81 * Math.pow(2, k / 12)

// ---- synth ---------------------------------------------------------------

let ctx: AudioContext | null = null
let master: GainNode | null = null

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = 0.28
    const comp = ctx.createDynamicsCompressor()
    master.connect(comp).connect(ctx.destination)
  }
  if (ctx.state === 'suspended') ctx.resume()
  return { ctx, out: master! }
}

function distortion(c: AudioContext, amount = 380) {
  const ws = c.createWaveShaper()
  const n = 1024
  const curve = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1
    curve[i] = ((3 + amount) * x * 20 * (Math.PI / 180)) / (Math.PI + amount * Math.abs(x))
  }
  ws.curve = curve
  ws.oversample = '4x'
  return ws
}

/** A sung, sweet note: soft triangle + sine with vibrato. */
function voiceNote(freq: number, at: number, dur: number) {
  const { ctx: c, out } = audio()
  const g = c.createGain()
  g.gain.setValueAtTime(0, at)
  g.gain.linearRampToValueAtTime(0.35, at + 0.04)
  g.gain.exponentialRampToValueAtTime(0.001, at + dur)
  const vib = c.createOscillator()
  const vibGain = c.createGain()
  vib.frequency.value = 5.5
  vibGain.gain.value = freq * 0.012
  vib.connect(vibGain)
  for (const [type, mul, lvl] of [['triangle', 1, 0.6], ['sine', 2, 0.25], ['sine', 1.003, 0.4]] as const) {
    const o = c.createOscillator()
    o.type = type
    o.frequency.value = freq * mul
    vibGain.connect(o.frequency)
    const og = c.createGain()
    og.gain.value = lvl
    o.connect(og).connect(g)
    o.start(at)
    o.stop(at + dur + 0.05)
  }
  vib.start(at)
  vib.stop(at + dur + 0.05)
  g.connect(out)
}

/** A heavy distorted power chord. */
function powerChord(root: number, at: number, dur: number) {
  const { ctx: c, out } = audio()
  const g = c.createGain()
  g.gain.setValueAtTime(0.0, at)
  g.gain.linearRampToValueAtTime(0.5, at + 0.01)
  g.gain.exponentialRampToValueAtTime(0.001, at + dur)
  const lp = c.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 3200
  const dist = distortion(c)
  for (const k of chord(root - 12)) {
    for (const det of [-6, 6]) {
      const o = c.createOscillator()
      o.type = 'sawtooth'
      o.frequency.value = keyFreq(k)
      o.detune.value = det
      o.connect(dist)
      o.start(at)
      o.stop(at + dur + 0.05)
    }
  }
  dist.connect(lp).connect(g).connect(out)
}

/** The screech: a rising, wailing distorted lead. */
function screech(at: number, dur: number) {
  const { ctx: c, out } = audio()
  const o = c.createOscillator()
  o.type = 'sawtooth'
  o.frequency.setValueAtTime(900, at)
  o.frequency.exponentialRampToValueAtTime(2300, at + dur * 0.6)
  const vib = c.createOscillator()
  const vg = c.createGain()
  vib.frequency.value = 9
  vg.gain.value = 60
  vib.connect(vg).connect(o.frequency)
  const bp = c.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = 2000
  bp.Q.value = 3
  const g = c.createGain()
  g.gain.setValueAtTime(0, at)
  g.gain.linearRampToValueAtTime(0.22, at + 0.05)
  g.gain.exponentialRampToValueAtTime(0.001, at + dur)
  o.connect(distortion(c, 200)).connect(bp).connect(g).connect(out)
  o.start(at)
  vib.start(at)
  o.stop(at + dur + 0.05)
  vib.stop(at + dur + 0.05)
}

/** Play `steps` eighth notes of a song starting at `fromStep`, beginning now. Returns its length in ms. */
export function playPhrase(mode: 'harmony' | 'shred', fromStep: number, steps: number) {
  const { ctx: c } = audio()
  const now = c.currentTime + 0.02
  if (mode === 'harmony') {
    const e = eighth(HARMONY.bpm) / 1000
    for (let i = 0; i < steps; i++) {
      const k = HARMONY.notes[(fromStep + i) % HARMONY.notes.length]
      voiceNote(keyFreq(k), now + i * e, e * 1.8)
    }
    return steps * e * 1000
  }
  const e = eighth(SHRED.bpm) / 1000
  for (let i = 0; i < steps; i++) powerChord(SHRED.roots[(fromStep + i) % SHRED.roots.length], now + i * e, e * 0.95)
  screech(now + e * 0.5, e * steps)
  return steps * e * 1000
}

/** Continuous loop for the character viewer. */
let loop: number | null = null
export function startLoop(mode: 'harmony' | 'shred', t0: number) {
  stopLoop()
  const bpm = mode === 'harmony' ? HARMONY.bpm : SHRED.bpm
  const barMs = eighth(bpm) * 8
  let step = stepAt(bpm, t0, performance.now())
  const tick = () => {
    playPhrase(mode, step, 8)
    step += 8
  }
  tick()
  loop = window.setInterval(tick, barMs)
}
export function stopLoop() {
  if (loop !== null) clearInterval(loop)
  loop = null
}

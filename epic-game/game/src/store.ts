import { create } from 'zustand'
import { Vector3 } from 'three'
import type { Story } from 'inkjs/full'
import { createStory, parseLine, type DialogueLine } from './story/dialogue'

// Hot, per-frame data lives outside React state so nothing re-renders 60x/second.
export const playerState = {
  position: new Vector3(0, 1, 6),
  facing: new Vector3(0, 0, -1),
  hidden: false,
}
export const enemyPositions = new Map<number, Vector3>()

export type Enemy = { id: number; spawn: [number, number, number]; hp: number; hitAt: number }

const ENEMY_SPAWNS: [number, number, number][] = [
  [-6, 1, -16],
  [5, 1, -19],
  [-2, 1, -24],
  [7, 1, -27],
  [-4, 4, -41],
]

const ATTACK_RANGE = 2.4
const ATTACK_COOLDOWN = 380
const HURT_COOLDOWN = 900

// Gimlet's kit
export const MAX_BOTTLES = 2
const BOTTLE_REGEN_S = 3.5 // seconds per bottle
const THROW_COOLDOWN = 450
import { DRINK_MS } from './gimlet/Gimlet'
export { DRINK_MS }
export const FRENZY_MS = 8000
const SPLASH_RADIUS = 2.8
// Frenzy meter gain per second (0..100)
const GAIN_STILL = 7
const GAIN_HIDDEN = 14
const GAIN_DRINKING = 45
const DECAY_MOVING = 3

export type Projectile = { id: number; pos: [number, number, number]; vel: [number, number, number] }
export type Splash = { id: number; pos: [number, number, number]; at: number }
let nextId = 1

type Dialogue = DialogueLine & { choices: string[] }

type GameState = {
  started: boolean
  runId: number
  health: number
  maxHealth: number
  embers: number
  questAccepted: boolean
  beaconLit: boolean
  enemies: Enemy[]
  dialogue: Dialogue | null
  prompt: { label: string; knot: string } | null
  attackAt: number
  hurtAt: number

  bottles: number
  bottleRegen: number // 0..1 progress to next bottle
  frenzyMeter: number // 0..100
  frenzyUntil: number
  drinkStart: number
  drinkUntil: number
  throwAt: number
  projectiles: Projectile[]
  splashes: Splash[]

  start: () => void
  setPrompt: (p: GameState['prompt']) => void
  interact: () => void
  advance: () => void
  choose: (i: number) => void
  attack: () => void
  hurt: () => void
  restart: () => void

  tick: (dt: number, moving: boolean, hidden: boolean) => void
  throwBottle: () => void
  drink: () => void
  explode: (id: number, pos: [number, number, number]) => void
  clearSplash: (id: number) => void
}

export const isFrenzy = (s: { frenzyUntil: number }) => performance.now() < s.frenzyUntil
export const isDrinking = (s: { drinkUntil: number }) => performance.now() < s.drinkUntil

const kitDefaults = () => ({
  bottles: MAX_BOTTLES,
  bottleRegen: 0,
  frenzyMeter: 0,
  frenzyUntil: 0,
  drinkStart: 0,
  drinkUntil: 0,
  throwAt: 0,
  projectiles: [] as Projectile[],
  splashes: [] as Splash[],
})

let story: Story = createStory()
let queue: string[] = []

export const useGame = create<GameState>((set, get) => {
  // Damage every enemy within `radius` of `center`; returns nothing, updates store.
  const damageArea = (center: Vector3, radius: number, dmg: number) => {
    const s = get()
    const now = performance.now()
    let killed = 0
    const enemies = s.enemies.flatMap((e) => {
      const p = enemyPositions.get(e.id)
      if (!p || p.distanceTo(center) > radius) return [e]
      if (e.hp <= dmg) {
        killed++
        return []
      }
      return [{ ...e, hp: e.hp - dmg, hitAt: now }]
    })
    set({ enemies, embers: s.embers + killed })
  }

  // Pull every line Ink can produce until it reaches choices or the end.
  const pull = () => {
    queue = []
    while (story.canContinue) {
      const line = story.Continue()?.trim()
      if (line) queue.push(line)
    }
    syncFromStory()
    showNext()
  }

  const showNext = () => {
    const choices = story.currentChoices.map((c) => c.text)
    const raw = queue.shift()
    if (raw === undefined) {
      if (choices.length) set({ dialogue: { speaker: null, text: '', choices } })
      else set({ dialogue: null })
      return
    }
    set({ dialogue: { ...parseLine(raw), choices: queue.length === 0 ? choices : [] } })
  }

  const syncFromStory = () => {
    const vars = story.variablesState
    const questAccepted = Boolean(vars['quest_accepted'])
    const beaconLit = Boolean(vars['beacon_lit'])
    const s = get()
    const spawnNow = questAccepted && !s.questAccepted
    set({
      questAccepted,
      beaconLit,
      enemies: spawnNow
        ? ENEMY_SPAWNS.map((spawn, id) => ({ id, spawn, hp: 3, hitAt: 0 }))
        : s.enemies,
    })
  }

  return {
    started: false,
    runId: 0,
    health: 5,
    maxHealth: 5,
    embers: 0,
    questAccepted: false,
    beaconLit: false,
    enemies: [],
    dialogue: null,
    prompt: null,
    attackAt: 0,
    hurtAt: 0,
    ...kitDefaults(),

    start: () => set({ started: true }),
    setPrompt: (prompt) => {
      if (get().prompt?.label !== prompt?.label) set({ prompt })
    },

    interact: () => {
      const { prompt, dialogue, health, enemies } = get()
      if (!prompt || dialogue || health <= 0) return
      story.variablesState['enemies_left'] = enemies.length
      story.ChoosePathString(prompt.knot)
      pull()
    },

    advance: () => {
      const d = get().dialogue
      if (d && d.choices.length === 0) showNext()
    },

    choose: (i) => {
      story.ChooseChoiceIndex(i)
      pull()
    },

    attack: () => {
      const s = get()
      const now = performance.now()
      const frenzy = isFrenzy(s)
      const cooldown = frenzy ? ATTACK_COOLDOWN / 2 : ATTACK_COOLDOWN
      if (s.dialogue || s.health <= 0 || isDrinking(s) || now - s.attackAt < cooldown) return
      set({ attackAt: now })
      damageArea(playerState.position, frenzy ? ATTACK_RANGE * 1.3 : ATTACK_RANGE, frenzy ? 2 : 1)
    },

    hurt: () => {
      const s = get()
      const now = performance.now()
      if (s.health <= 0 || now - s.hurtAt < HURT_COOLDOWN) return
      // Drinking leaves Gimlet wide open: double damage.
      const dmg = isDrinking(s) ? 2 : 1
      set({ health: Math.max(0, s.health - dmg), hurtAt: now })
    },

    restart: () => {
      story = createStory()
      queue = []
      enemyPositions.clear()
      playerState.position.set(0, 1, 6)
      playerState.hidden = false
      set((s) => ({
        runId: s.runId + 1,
        health: s.maxHealth,
        embers: 0,
        questAccepted: false,
        beaconLit: false,
        enemies: [],
        dialogue: null,
        prompt: null,
        attackAt: 0,
        hurtAt: 0,
        ...kitDefaults(),
      }))
    },

    tick: (dt, moving, hidden) => {
      const s = get()
      if (s.dialogue || s.health <= 0 || !s.started) return
      const now = performance.now()
      const patch: Partial<GameState> = {}

      // bottles refill over time
      if (s.bottles < MAX_BOTTLES) {
        const regen = s.bottleRegen + dt / BOTTLE_REGEN_S
        if (regen >= 1) {
          patch.bottles = s.bottles + 1
          patch.bottleRegen = 0
        } else patch.bottleRegen = regen
      }

      // frenzy meter
      if (now < s.frenzyUntil) {
        patch.frenzyMeter = (100 * (s.frenzyUntil - now)) / FRENZY_MS
      } else {
        const drinking = now < s.drinkUntil
        let gain = 0
        if (drinking) gain += GAIN_DRINKING
        if (hidden) gain += GAIN_HIDDEN
        if (!moving) gain += GAIN_STILL
        if (gain === 0) gain = -DECAY_MOVING
        const meter = Math.max(0, Math.min(100, s.frenzyMeter + gain * dt))
        if (meter >= 100) {
          patch.frenzyUntil = now + FRENZY_MS
          patch.frenzyMeter = 100
          patch.drinkUntil = 0
          patch.health = Math.min(s.maxHealth, s.health + 1)
        } else patch.frenzyMeter = meter
      }
      set(patch)
    },

    throwBottle: () => {
      const s = get()
      const now = performance.now()
      const frenzy = isFrenzy(s)
      if (s.dialogue || s.health <= 0 || isDrinking(s)) return
      if (now - s.throwAt < (frenzy ? THROW_COOLDOWN / 2 : THROW_COOLDOWN)) return
      if (!frenzy && s.bottles <= 0) return
      const f = playerState.facing
      const p = playerState.position
      const proj: Projectile = {
        id: nextId++,
        pos: [p.x + f.x * 0.8, p.y + 0.7, p.z + f.z * 0.8],
        vel: [f.x * 11, 5.5, f.z * 11],
      }
      set({
        throwAt: now,
        bottles: frenzy ? s.bottles : s.bottles - 1,
        projectiles: [...s.projectiles, proj],
      })
    },

    drink: () => {
      const s = get()
      const now = performance.now()
      if (s.dialogue || s.health <= 0 || isDrinking(s) || isFrenzy(s) || s.bottles <= 0) return
      set({ bottles: s.bottles - 1, drinkStart: now, drinkUntil: now + DRINK_MS })
    },

    explode: (id, pos) => {
      const s = get()
      if (!s.projectiles.some((p) => p.id === id)) return
      set({
        projectiles: s.projectiles.filter((p) => p.id !== id),
        splashes: [...s.splashes, { id, pos, at: performance.now() }],
      })
      damageArea(new Vector3(...pos), SPLASH_RADIUS, isFrenzy(s) ? 2 : 1)
    },

    clearSplash: (id) => set((s) => ({ splashes: s.splashes.filter((x) => x.id !== id) })),
  }
})

// Handy in the browser console during development: __game.getState()
if (import.meta.env.DEV) Object.assign(window, { __game: useGame, __player: playerState })

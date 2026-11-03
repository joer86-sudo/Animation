import { create } from 'zustand'
import { Vector3 } from 'three'
import type { Story } from 'inkjs/full'
import { createStory, parseLine, type DialogueLine } from './story/dialogue'

// Hot, per-frame data lives outside React state so nothing re-renders 60x/second.
export const playerState = { position: new Vector3(0, 1, 6) }
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

  start: () => void
  setPrompt: (p: GameState['prompt']) => void
  interact: () => void
  advance: () => void
  choose: (i: number) => void
  attack: () => void
  hurt: () => void
  restart: () => void
}

let story: Story = createStory()
let queue: string[] = []

export const useGame = create<GameState>((set, get) => {
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
      if (s.dialogue || s.health <= 0 || now - s.attackAt < ATTACK_COOLDOWN) return
      let killed = 0
      const enemies = s.enemies.flatMap((e) => {
        const p = enemyPositions.get(e.id)
        if (!p || p.distanceTo(playerState.position) > ATTACK_RANGE) return [e]
        if (e.hp <= 1) {
          killed++
          return []
        }
        return [{ ...e, hp: e.hp - 1, hitAt: now }]
      })
      set({ attackAt: now, enemies, embers: s.embers + killed })
    },

    hurt: () => {
      const s = get()
      const now = performance.now()
      if (s.health <= 0 || now - s.hurtAt < HURT_COOLDOWN) return
      set({ health: s.health - 1, hurtAt: now })
    },

    restart: () => {
      story = createStory()
      queue = []
      enemyPositions.clear()
      playerState.position.set(0, 1, 6)
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
      }))
    },
  }
})

// Handy in the browser console during development: __game.getState()
if (import.meta.env.DEV) Object.assign(window, { __game: useGame, __player: playerState })

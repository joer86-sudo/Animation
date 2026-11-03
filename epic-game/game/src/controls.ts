export type Controls = 'forward' | 'back' | 'left' | 'right' | 'jump'

export const keyMap: { name: Controls; keys: string[] }[] = [
  { name: 'forward', keys: ['KeyW', 'ArrowUp'] },
  { name: 'back', keys: ['KeyS', 'ArrowDown'] },
  { name: 'left', keys: ['KeyA', 'ArrowLeft'] },
  { name: 'right', keys: ['KeyD', 'ArrowRight'] },
  { name: 'jump', keys: ['Space'] },
]

// Written by the on-screen touch controls, read by the Player each frame.
export const touchInput = { x: 0, z: 0, jump: false }

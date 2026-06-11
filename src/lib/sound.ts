import { getSettings } from './storage'

type SoundKind = 'tap' | 'magic' | 'correct' | 'wrong' | 'reward'

let ctx: AudioContext | null = null

function getContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  if (!AudioContextClass) return null
  if (!ctx) ctx = new AudioContextClass()
  return ctx
}

function playTone(
  context: AudioContext,
  start: number,
  frequency: number,
  duration: number,
  gain = 0.08,
  type: OscillatorType = 'sine'
) {
  const osc = context.createOscillator()
  const volume = context.createGain()

  osc.type = type
  osc.frequency.setValueAtTime(frequency, start)
  volume.gain.setValueAtTime(0.0001, start)
  volume.gain.exponentialRampToValueAtTime(gain, start + 0.015)
  volume.gain.exponentialRampToValueAtTime(0.0001, start + duration)

  osc.connect(volume)
  volume.connect(context.destination)
  osc.start(start)
  osc.stop(start + duration + 0.02)
}

export function unlockSound() {
  const context = getContext()
  if (context?.state === 'suspended') void context.resume()
}

export function playSound(kind: SoundKind) {
  if (!getSettings().soundEnabled) return

  const context = getContext()
  if (!context) return
  if (context.state === 'suspended') void context.resume()

  const now = context.currentTime

  if (kind === 'tap') {
    playTone(context, now, 520, 0.07, 0.035, 'triangle')
    playTone(context, now + 0.035, 740, 0.08, 0.025, 'sine')
  } else if (kind === 'magic') {
    ;[740, 988, 1319].forEach((freq, index) => {
      playTone(context, now + index * 0.055, freq, 0.22, 0.06 - index * 0.01, 'sine')
    })
  } else if (kind === 'correct') {
    playTone(context, now, 784, 0.12, 0.06, 'sine')
    playTone(context, now + 0.08, 1175, 0.18, 0.055, 'sine')
  } else if (kind === 'wrong') {
    playTone(context, now, 330, 0.12, 0.04, 'triangle')
    playTone(context, now + 0.1, 260, 0.18, 0.035, 'triangle')
  } else {
    ;[659, 880, 1047, 1319].forEach((freq, index) => {
      playTone(context, now + index * 0.07, freq, 0.28, 0.06, 'sine')
    })
  }
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext
  }
}

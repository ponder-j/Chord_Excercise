import { HttpStorage, SplendidGrandPiano } from 'smplr'
import type { AudioStatus } from '../types'

type PianoInstance = ReturnType<typeof SplendidGrandPiano>

interface AudioSnapshot {
  status: AudioStatus
  loaded: number
  total: number
  error: string | null
  playing: boolean
  velocities: number[]
}

type Listener = (snapshot: AudioSnapshot) => void

const TARGET_NOTES = Array.from({ length: 36 }, (_, index) => 48 + index)
const BASE_URL = `${import.meta.env.BASE_URL}audio/splendid-grand/`

const hashSafeStorage = {
  fetch(url: string) {
    return HttpStorage.fetch(url.replace(/%23/g, 's').replace(/#/g, 's'))
  },
}

class PianoEngine {
  private context: AudioContext | null = null
  private piano: PianoInstance | null = null
  private readyPromise: Promise<PianoInstance> | null = null
  private listeners = new Set<Listener>()
  private snapshot: AudioSnapshot = {
    status: 'idle',
    loaded: 0,
    total: 0,
    error: null,
    playing: false,
    velocities: [],
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener)
    listener(this.snapshot)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getSnapshot() {
    return this.snapshot
  }

  private emit(patch: Partial<AudioSnapshot>) {
    this.snapshot = { ...this.snapshot, ...patch }
    this.listeners.forEach((listener) => listener(this.snapshot))
  }

  async ensureReady() {
    if (this.readyPromise) return this.readyPromise

    this.emit({ status: 'loading', error: null })

    this.readyPromise = (async () => {
      const context = new AudioContext({ latencyHint: 'interactive' })
      this.context = context

      const piano = SplendidGrandPiano(context, {
        baseUrl: BASE_URL,
        notesToLoad: {
          notes: TARGET_NOTES,
          velocityRange: [1, 127],
        },
        formats: ['ogg', 'm4a'],
        storage: hashSafeStorage,
        volume: 96,
        decayTime: 0.9,
        onLoadProgress: ({ loaded, total }) => {
          this.emit({ loaded, total })
        },
      })

      this.piano = piano
      await context.resume()
      await piano.ready
      this.emit({ status: 'ready', playing: false })
      return piano
    })().catch((error: unknown) => {
      const message = error instanceof Error ? error.message : '音频加载失败'
      this.emit({ status: 'error', error: message, playing: false })
      this.readyPromise = null
      throw error
    })

    return this.readyPromise
  }

  async play(notes: number[], duration = 1.9) {
    const piano = await this.ensureReady()
    const context = this.context
    if (!context) return []
    if (context.state !== 'running') {
      await context.resume()
    }

    piano.stop()
    const now = context.currentTime + 0.035
    const ordered = [...notes].sort((a, b) => a - b)
    const velocities = ordered.map(() => this.randomVelocity())
    this.emit({ playing: true, velocities, status: 'ready', error: null })

    ordered.forEach((note, index) => {
      const strumOffset = index * 0.012 + Math.random() * 0.008
      piano.start({
        note,
        velocity: velocities[index],
        time: now + strumOffset,
        duration,
        stopId: `voice-${index}`,
      })
    })

    window.setTimeout(() => {
      this.emit({ playing: false })
    }, 900)

    return velocities
  }

  stop() {
    this.piano?.stop()
    this.emit({ playing: false })
  }

  private randomVelocity() {
    const roll = Math.random()
    if (roll < 0.12) return this.randomBetween(34, 55)
    if (roll < 0.3) return this.randomBetween(56, 74)
    if (roll < 0.72) return this.randomBetween(75, 98)
    if (roll < 0.92) return this.randomBetween(99, 113)
    return this.randomBetween(114, 124)
  }

  private randomBetween(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }
}

export const pianoEngine = new PianoEngine()

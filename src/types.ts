export type KeyMode = 'major' | 'minor'
export type ModifierKind = 'add' | 'omit'

export interface KeyRoot {
  pitchClass: number
  label: string
  useFlats: boolean
}

export interface QualityDefinition {
  id: string
  label: string
  name: string
  intervals: number[]
  level: number
  description: string
}

export interface AnswerModifier {
  kind: ModifierKind
  degree: number
}

export interface ChordAnswer {
  degree: number
  qualityId: string
  modifiers: AnswerModifier[]
}

export interface DifficultyDefinition {
  id: number
  title: string
  short: string
  description: string
  qualityIds: string[]
  modifiers: string[]
  diatonicOnly?: boolean
}

export interface ChordQuestion {
  id: string
  answer: ChordAnswer
  midiNotes: number[]
  level: number
  keyRoot: number
  keyMode: KeyMode
  createdAt: number
}

export interface AttemptRecord {
  id: string
  timestamp: number
  correct: boolean
  level: number
  keyRoot: number
  keyMode: KeyMode
  keyLabel: string
  target: ChordAnswer
  targetMidi: number[]
  selected: ChordAnswer | null
  selectedMidi: number[]
}

export interface MistakeRecord {
  id: string
  timestamp: number
  level: number
  keyRoot: number
  keyMode: KeyMode
  keyLabel: string
  target: ChordAnswer
  targetMidi: number[]
  selected: ChordAnswer | null
  selectedMidi: number[]
}

export interface LevelProgress {
  attempts: number
  correct: number
  bestStreak: number
  currentStreak: number
}

export interface AppStore {
  version: 1
  settings: {
    keyRoot: number
    keyMode: KeyMode
    level: number
  }
  totals: {
    attempts: number
    correct: number
    currentStreak: number
    bestStreak: number
  }
  progress: Record<number, LevelProgress>
  attempts: AttemptRecord[]
  mistakes: MistakeRecord[]
}

export type AudioStatus = 'idle' | 'loading' | 'ready' | 'error'

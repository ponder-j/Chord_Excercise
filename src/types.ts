export type KeyMode = 'major' | 'minor'
export type ModifierKind = 'add' | 'omit'
export type QualityGroup = 'triad' | 'sus' | 'seventh' | 'sixth' | 'ninth' | 'eleventh' | 'thirteenth'
export type TaskKind = 'note' | 'dyad' | 'chord'

export interface KeyRoot {
  pitchClass: number
  label: string
  useFlats: boolean
}

export interface QualityDefinition {
  id: string
  group: QualityGroup
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

export interface ScaleAnswer {
  degrees: number[]
}

export type QuestionAnswer = ChordAnswer | ScaleAnswer

export interface DifficultyDefinition {
  id: number
  taskKind: TaskKind
  title: string
  short: string
  description: string
  qualityIds: string[]
  modifiers: string[]
  diatonicOnly?: boolean
}

export interface TrainingQuestion {
  id: string
  taskKind: TaskKind
  answer: QuestionAnswer
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
  taskKind: TaskKind
  level: number
  keyRoot: number
  keyMode: KeyMode
  keyLabel: string
  target: QuestionAnswer
  targetMidi: number[]
  selected: QuestionAnswer | null
  selectedMidi: number[]
}

export interface MistakeRecord {
  id: string
  timestamp: number
  taskKind: TaskKind
  level: number
  keyRoot: number
  keyMode: KeyMode
  keyLabel: string
  target: QuestionAnswer
  targetMidi: number[]
  selected: QuestionAnswer | null
  selectedMidi: number[]
}

export interface LevelProgress {
  attempts: number
  correct: number
  bestStreak: number
  currentStreak: number
  recent: boolean[]
}

export interface AppStore {
  version: 2
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

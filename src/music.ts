import { KEY_ROOTS, LEVELS, QUALITIES, getLevelDefinition, getQuality } from './data/levels'
import type {
  AnswerModifier,
  ChordAnswer,
  KeyMode,
  ModifierKind,
  QuestionAnswer,
  ScaleAnswer,
  TaskKind,
  TrainingQuestion,
} from './types'

const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
const NOTE_LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
const LETTER_PITCH_CLASSES = [0, 2, 4, 5, 7, 9, 11]
const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11]
const MINOR_SCALE = [0, 2, 3, 5, 7, 8, 10]

const DIATONIC_TRIADS: Record<KeyMode, string[]> = {
  major: ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim'],
  minor: ['min', 'dim', 'maj', 'min', 'min', 'maj', 'maj'],
}

const DIATONIC_SEVENTHS: Record<KeyMode, string[]> = {
  major: ['maj7', 'min7', 'min7', 'maj7', '7', 'min7', 'm7b5'],
  minor: ['min7', 'm7b5', 'maj7', 'min7', 'min7', 'maj7', '7'],
}

export const TARGET_MIN_MIDI = 48
export const TARGET_MAX_MIDI = 83
export const CURRENT_DIFFICULTY_WEIGHT = 0.6

const MODIFIER_INTERVALS: Record<number, number> = {
  1: 12,
  2: 2,
  3: 4,
  4: 5,
  5: 7,
  6: 9,
  7: 11,
  8: 12,
  9: 14,
  10: 16,
  11: 17,
  12: 19,
  13: 21,
}

const DEGREE_PITCH_CLASSES: Record<number, number[]> = {
  1: [0],
  2: [2],
  3: [3, 4],
  4: [5],
  5: [6, 7, 8],
  6: [8, 9, 10],
  7: [10, 11],
  8: [0],
  9: [1, 2],
  10: [2, 4],
  11: [5, 6],
  12: [5, 7],
  13: [8, 9, 10],
}

export function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function uniqueId(prefix = 'id') {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function getScaleIntervals(mode: KeyMode) {
  return mode === 'major' ? MAJOR_SCALE : MINOR_SCALE
}

export function getDegreeRootMidi(keyRoot: number, mode: KeyMode, degree: number) {
  const interval = getScaleIntervals(mode)[degree - 1] ?? 0
  let midi = TARGET_MIN_MIDI + keyRoot + interval
  while (midi > TARGET_MIN_MIDI + 11) midi -= 12
  return midi
}

export function midiToPitchName(midi: number, useFlats = false) {
  const names = useFlats ? FLAT_NAMES : SHARP_NAMES
  return names[((midi % 12) + 12) % 12]
}

export function getDegreePitchName(keyRoot: number, mode: KeyMode, degree: number) {
  const tonic = KEY_ROOTS.find((root) => root.pitchClass === keyRoot) ?? KEY_ROOTS[0]
  const tonicLetterIndex = NOTE_LETTERS.indexOf(tonic.label[0])
  const degreeLetterIndex = (tonicLetterIndex + degree - 1) % NOTE_LETTERS.length
  const interval = getScaleIntervals(mode)[degree - 1] ?? 0
  const targetPitchClass = (keyRoot + interval) % 12
  const naturalPitchClass = LETTER_PITCH_CLASSES[degreeLetterIndex]

  let accidentalOffset = (targetPitchClass - naturalPitchClass) % 12
  if (accidentalOffset > 6) accidentalOffset -= 12
  if (accidentalOffset < -6) accidentalOffset += 12

  const accidental =
    accidentalOffset > 0
      ? '#'.repeat(accidentalOffset)
      : accidentalOffset < 0
        ? 'b'.repeat(Math.abs(accidentalOffset))
        : ''

  return `${NOTE_LETTERS[degreeLetterIndex]}${accidental}`
}

export function formatKeyLabel(keyRoot: number, mode: KeyMode) {
  const root = KEY_ROOTS.find((item) => item.pitchClass === keyRoot)?.label ?? FLAT_NAMES[keyRoot]
  return `${root}${mode === 'major' ? ' 大调' : ' 小调'}`
}

export function modifierKey(modifier: Pick<AnswerModifier, 'kind' | 'degree'>) {
  return `${modifier.kind}:${modifier.degree}`
}

export function parseModifierKey(key: string): AnswerModifier {
  const [kind, degree] = key.split(':')
  return { kind: kind as ModifierKind, degree: Number(degree) }
}

export function sortModifiers(modifiers: AnswerModifier[]) {
  return [...modifiers].sort((a, b) => a.degree - b.degree || a.kind.localeCompare(b.kind))
}

export function normalizeAnswer(answer: ChordAnswer): ChordAnswer {
  return {
    degree: answer.degree,
    qualityId: answer.qualityId,
    modifiers: sortModifiers(
      answer.modifiers.filter(
        (modifier, index, list) =>
          list.findIndex((item) => item.kind === modifier.kind && item.degree === modifier.degree) === index,
      ),
    ),
  }
}

export function answerKey(answer: QuestionAnswer, taskKind: TaskKind) {
  if (taskKind === 'note' || taskKind === 'dyad') {
    return `${taskKind}|${(answer as ScaleAnswer).degrees.join(',')}`
  }
  const normalized = normalizeAnswer(answer as ChordAnswer)
  const mods = normalized.modifiers.map(modifierKey).join(',')
  return `${taskKind}|${normalized.degree}|${normalized.qualityId}|${mods}`
}

export function chordPitchClasses(answer: ChordAnswer, keyRoot: number, mode: KeyMode) {
  const rootMidi = getDegreeRootMidi(keyRoot, mode, answer.degree)
  return applyChordIntervals(getQuality(answer.qualityId).intervals, answer.modifiers)
    .map((semitone) => (rootMidi + semitone) % 12)
    .filter((pitchClass, index, list) => list.indexOf(pitchClass) === index)
}

export function chordAnswerToMidi(answer: ChordAnswer, keyRoot: number, mode: KeyMode) {
  const rootMidi = getDegreeRootMidi(keyRoot, mode, answer.degree)
  return applyChordIntervals(getQuality(answer.qualityId).intervals, answer.modifiers)
    .map((semitone) => rootMidi + semitone)
    .filter((midi, index, list) => list.indexOf(midi) === index)
    .filter((midi) => midi >= TARGET_MIN_MIDI && midi <= TARGET_MAX_MIDI)
    .sort((a, b) => a - b)
}

export function answerToMidi(answer: QuestionAnswer, keyRoot: number, mode: KeyMode, taskKind: TaskKind) {
  if (taskKind === 'note' || taskKind === 'dyad') {
    return (answer as ScaleAnswer).degrees
      .map((degree) => getDegreeRootMidi(keyRoot, mode, degree))
      .filter((midi) => midi >= TARGET_MIN_MIDI && midi <= TARGET_MAX_MIDI)
      .sort((a, b) => a - b)
  }
  return chordAnswerToMidi(answer as ChordAnswer, keyRoot, mode)
}

export function sameChordSound(a: ChordAnswer, b: ChordAnswer, keyRoot: number, mode: KeyMode) {
  if (a.degree !== b.degree || !modifiersAreApplicable(a)) return false
  const left = chordPitchClasses(a, keyRoot, mode).sort((x, y) => x - y)
  const right = chordPitchClasses(b, keyRoot, mode).sort((x, y) => x - y)
  return left.length === right.length && left.every((value, index) => value === right[index])
}

export function sameAnswer(
  a: QuestionAnswer,
  b: QuestionAnswer,
  keyRoot: number,
  mode: KeyMode,
  taskKind: TaskKind,
) {
  if (taskKind === 'note' || taskKind === 'dyad') {
    const left = [...(a as ScaleAnswer).degrees].sort((x, y) => x - y)
    const right = [...(b as ScaleAnswer).degrees].sort((x, y) => x - y)
    return left.length === right.length && left.every((value, index) => value === right[index])
  }
  return sameChordSound(a as ChordAnswer, b as ChordAnswer, keyRoot, mode)
}

export function answerToLabel(answer: QuestionAnswer, taskKind: TaskKind) {
  if (taskKind === 'note') {
    return `${(answer as ScaleAnswer).degrees[0]} 级`
  }
  if (taskKind === 'dyad') {
    return `${(answer as ScaleAnswer).degrees.join(' + ')} 级`
  }
  const normalized = normalizeAnswer(answer as ChordAnswer)
  const quality = getQuality(normalized.qualityId)
  const modifierText = normalized.modifiers.map((modifier) => `${modifier.kind}${modifier.degree}`).join(' · ')
  return `${normalized.degree} · ${quality.label}${modifierText ? ` (${modifierText})` : ''}`
}

export function getChordNoteNames(midiNotes: number[], useFlats: boolean) {
  return midiNotes.map((midi) => midiToPitchName(midi, useFlats))
}

export function shouldUseFlatsForKey(keyRoot: number, mode: KeyMode) {
  if (mode === 'major') return KEY_ROOTS.find((root) => root.pitchClass === keyRoot)?.useFlats ?? false
  return [0, 1, 2, 3, 5, 7, 8, 10].includes(keyRoot)
}

export function getAbsoluteNoteName(midi: number, keyRoot: number, mode: KeyMode) {
  return midiToPitchName(midi, shouldUseFlatsForKey(keyRoot, mode))
}

export function getQualityCardsForLevel(level: number) {
  if (level < 3) return []
  const qualityIds = new Set<string>()
  for (let currentLevel = 3; currentLevel <= level; currentLevel += 1) {
    getLevelDefinition(currentLevel).qualityIds.forEach((qualityId) => qualityIds.add(qualityId))
  }
  return [...qualityIds].map((qualityId) => getQuality(qualityId))
}

export function getDifficultyPoolWeights(level: number) {
  if (level <= 3) return [{ level: level <= 3 ? level : 1, weight: 1 }]
  const lowerLevels = Array.from({ length: level - 3 }, (_, index) => index + 3)
  const lowerWeight = (1 - CURRENT_DIFFICULTY_WEIGHT) / lowerLevels.length
  return [
    { level, weight: CURRENT_DIFFICULTY_WEIGHT },
    ...lowerLevels.map((lowerLevel) => ({ level: lowerLevel, weight: lowerWeight })),
  ]
}

function pickDifficultyPool(level: number) {
  const weights = getDifficultyPoolWeights(level)
  const roll = Math.random()
  let cumulative = 0

  for (const item of weights) {
    cumulative += item.weight
    if (roll < cumulative) return item.level
  }

  return level
}

export function getAllQualities() {
  return QUALITIES
}

export function getModifierIntervals(modifier: AnswerModifier) {
  if (modifier.kind === 'add') return MODIFIER_INTERVALS[modifier.degree] ?? modifier.degree
  return DEGREE_PITCH_CLASSES[modifier.degree] ?? []
}

export function canApplyModifier(intervals: number[], modifier: AnswerModifier) {
  const pitchClasses = intervals.map((interval) => ((interval % 12) + 12) % 12)
  if (modifier.kind === 'add') {
    const interval = MODIFIER_INTERVALS[modifier.degree]
    if (interval === undefined) return false
    return !pitchClasses.includes(((interval % 12) + 12) % 12)
  }

  const targetPitchClasses = DEGREE_PITCH_CLASSES[modifier.degree] ?? []
  const remaining = pitchClasses.filter((pitchClass) => !targetPitchClasses.includes(pitchClass))
  return remaining.length >= 3 && remaining.length < pitchClasses.length
}

export function applyChordIntervals(baseIntervals: number[], modifiers: AnswerModifier[]) {
  let intervals = [...baseIntervals]

  for (const modifier of sortModifiers(modifiers)) {
    if (!canApplyModifier(intervals, modifier)) continue

    if (modifier.kind === 'add') {
      const interval = MODIFIER_INTERVALS[modifier.degree]
      if (interval !== undefined) intervals.push(interval)
    } else {
      const targetPitchClasses = DEGREE_PITCH_CLASSES[modifier.degree] ?? []
      intervals = intervals.filter((interval) => !targetPitchClasses.includes(((interval % 12) + 12) % 12))
    }
  }

  return intervals.filter((interval, index, list) => list.indexOf(interval) === index).sort((a, b) => a - b)
}

function modifiersAreApplicable(answer: ChordAnswer) {
  let intervals = [...getQuality(answer.qualityId).intervals]
  for (const modifier of normalizeAnswer(answer).modifiers) {
    if (!canApplyModifier(intervals, modifier)) return false
    intervals = applyChordIntervals(intervals, [modifier])
  }
  return true
}

function createQuestion(
  level: number,
  taskKind: TaskKind,
  answer: QuestionAnswer,
  keyRoot: number,
  mode: KeyMode,
): TrainingQuestion {
  return {
    id: uniqueId('question'),
    taskKind,
    answer,
    midiNotes: answerToMidi(answer, keyRoot, mode, taskKind),
    level,
    keyRoot,
    keyMode: mode,
    createdAt: Date.now(),
  }
}

function generateScaleQuestion(level: number, taskKind: 'note' | 'dyad', keyRoot: number, mode: KeyMode) {
  let degrees: number[]

  if (taskKind === 'note') {
    degrees = [randomInt(1, 7)]
  } else {
    const first = randomInt(1, 7)
    let second = randomInt(1, 6)
    if (second >= first) second += 1
    degrees = [first, second].sort((a, b) => a - b)
  }

  return createQuestion(level, taskKind, { degrees }, keyRoot, mode)
}

function generateChordQuestion(level: number, keyRoot: number, mode: KeyMode): TrainingQuestion {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const poolLevel = pickDifficultyPool(level)
    const definition = getLevelDefinition(poolLevel)
    if (definition.taskKind !== 'chord') continue

    const diatonic = definition.diatonicOnly
      ? getLevelDiatonicQualities(poolLevel, mode).filter((item) => definition.qualityIds.includes(item.qualityId))
      : null
    const picked =
      diatonic && diatonic.length > 0
        ? diatonic[randomInt(0, diatonic.length - 1)]
        : {
            degree: randomInt(1, 7),
            qualityId: definition.qualityIds[randomInt(0, definition.qualityIds.length - 1)],
          }
    const { degree, qualityId } = picked
    const quality = getQuality(qualityId)
    const modifiers: AnswerModifier[] = []
    let intervals = [...quality.intervals]

    if (definition.modifiers.length > 0 && Math.random() < 0.82) {
      const desiredCount = Math.random() < 0.24 ? 2 : 1
      const candidates = [...definition.modifiers].sort(() => Math.random() - 0.5)
      for (const candidate of candidates) {
        if (modifiers.length >= desiredCount) break
        const modifier = parseModifierKey(candidate)
        if (canApplyModifier(intervals, modifier)) {
          modifiers.push(modifier)
          intervals = applyChordIntervals(intervals, [modifier])
        }
      }
    }

    const answer = normalizeAnswer({ degree, qualityId, modifiers })
    const midiNotes = chordAnswerToMidi(answer, keyRoot, mode)
    const pitchClasses = new Set(midiNotes.map((midi) => midi % 12))

    if (midiNotes.length >= 3 && midiNotes.length <= 7 && pitchClasses.size === midiNotes.length) {
      return createQuestion(level, 'chord', answer, keyRoot, mode)
    }
  }

  const fallback: ChordAnswer = { degree: 1, qualityId: 'maj', modifiers: [] }
  return createQuestion(level, 'chord', fallback, keyRoot, mode)
}

export function generateQuestion(level: number, keyRoot: number, mode: KeyMode): TrainingQuestion {
  const definition = getLevelDefinition(level)
  if (definition.taskKind === 'note') return generateScaleQuestion(level, 'note', keyRoot, mode)
  if (definition.taskKind === 'dyad') return generateScaleQuestion(level, 'dyad', keyRoot, mode)
  return generateChordQuestion(level, keyRoot, mode)
}

export function getLevelDiatonicQualities(level: number, mode: KeyMode) {
  const qualityIds = level === 4 ? DIATONIC_SEVENTHS[mode] : DIATONIC_TRIADS[mode]
  return qualityIds.map((qualityId, index) => ({ degree: index + 1, qualityId }))
}

export function getLevelFromId(level: number) {
  return LEVELS.find((item) => item.id === level) ?? LEVELS[0]
}

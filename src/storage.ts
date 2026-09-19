import type { AppStore, AttemptRecord, LevelProgress, MistakeRecord, TaskKind } from './types'

const STORAGE_KEY = 'chord-training-store-v3'
const LEGACY_STORAGE_KEY = 'chord-training-store-v2'
const MAX_ATTEMPTS = 800
const MAX_MISTAKES = 200
const LEVEL_COUNT = 9
const UNLOCK_MIN_ATTEMPTS = 20
const UNLOCK_MIN_ACCURACY = 0.9

export interface UnlockState {
  unlocked: boolean
  previousLevel: number
  attempts: number
  recentCount: number
  recentCorrect: number
  recentAccuracy: number
}

function emptyLevelProgress(): LevelProgress {
  return {
    attempts: 0,
    correct: 0,
    bestStreak: 0,
    currentStreak: 0,
    recent: [],
  }
}

function createProgress() {
  return Object.fromEntries(
    Array.from({ length: LEVEL_COUNT }, (_, index) => [index + 1, emptyLevelProgress()]),
  ) as Record<number, LevelProgress>
}

export function createDefaultStore(): AppStore {
  return {
    version: 2,
    settings: {
      keyRoot: 0,
      keyMode: 'major',
      level: 1,
    },
    totals: {
      attempts: 0,
      correct: 0,
      currentStreak: 0,
      bestStreak: 0,
    },
    progress: createProgress(),
    attempts: [],
    mistakes: [],
  }
}

function normalizeProgress(value: unknown) {
  const fallback = createProgress()
  if (!value || typeof value !== 'object') return fallback

  const incoming = value as Record<string, Partial<LevelProgress>>
  for (let level = 1; level <= LEVEL_COUNT; level += 1) {
    const item = incoming[level]
    if (!item) continue
    fallback[level] = {
      attempts: Number(item.attempts ?? 0),
      correct: Number(item.correct ?? 0),
      bestStreak: Number(item.bestStreak ?? 0),
      currentStreak: Number(item.currentStreak ?? 0),
      recent: Array.isArray(item.recent) ? item.recent.slice(-20).map(Boolean) : [],
    }
  }
  return fallback
}

function migrateLegacyStore(raw: string): AppStore {
  const fallback = createDefaultStore()

  try {
    const legacy = JSON.parse(raw) as {
      settings?: { keyRoot?: number; keyMode?: AppStore['settings']['keyMode']; level?: number }
      totals?: AppStore['totals']
      progress?: Record<number, Partial<LevelProgress>>
      attempts?: Array<Record<string, unknown>>
      mistakes?: Array<Record<string, unknown>>
    }

    const attempts: AttemptRecord[] = (legacy.attempts ?? []).map((record) => ({
      ...(record as unknown as AttemptRecord),
      taskKind: 'chord',
      level: Number(record.level ?? 1) + 2,
    }))
    const mistakes: MistakeRecord[] = (legacy.mistakes ?? []).map((record) => ({
      ...(record as unknown as MistakeRecord),
      taskKind: 'chord',
      level: Number(record.level ?? 1) + 2,
    }))

    const progress = createProgress()
    for (let oldLevel = 1; oldLevel <= 7; oldLevel += 1) {
      const old = legacy.progress?.[oldLevel]
      if (!old) continue
      const recentResults = attempts
        .filter((attempt) => attempt.level === oldLevel + 2)
        .slice(0, 20)
        .reverse()
        .map((attempt) => attempt.correct)

      progress[oldLevel + 2] = {
        attempts: Number(old.attempts ?? 0),
        correct: Number(old.correct ?? 0),
        bestStreak: Number(old.bestStreak ?? 0),
        currentStreak: Number(old.currentStreak ?? 0),
        recent: recentResults,
      }
    }

    return {
      ...fallback,
      settings: {
        keyRoot: Number(legacy.settings?.keyRoot ?? 0),
        keyMode: legacy.settings?.keyMode ?? 'major',
        level: 1,
      },
      totals: { ...fallback.totals, ...legacy.totals },
      progress,
      attempts,
      mistakes,
    }
  } catch {
    return fallback
  }
}

function normalizeCurrentStore(raw: string): AppStore {
  const fallback = createDefaultStore()

  try {
    const parsed = JSON.parse(raw) as Partial<AppStore>
    const level = Math.min(LEVEL_COUNT, Math.max(1, Number(parsed.settings?.level ?? 1)))

    return {
      ...fallback,
      ...parsed,
      version: 2,
      settings: { ...fallback.settings, ...parsed.settings, level },
      totals: { ...fallback.totals, ...parsed.totals },
      progress: normalizeProgress(parsed.progress),
      attempts: Array.isArray(parsed.attempts)
        ? parsed.attempts.slice(0, MAX_ATTEMPTS).map((attempt) => ({
            ...attempt,
            taskKind: (attempt.taskKind ?? 'chord') as TaskKind,
          }))
        : [],
      mistakes: Array.isArray(parsed.mistakes)
        ? parsed.mistakes.slice(0, MAX_MISTAKES).map((mistake) => ({
            ...mistake,
            taskKind: (mistake.taskKind ?? 'chord') as TaskKind,
          }))
        : [],
    }
  } catch {
    return fallback
  }
}

export function loadStore(): AppStore {
  try {
    const current = localStorage.getItem(STORAGE_KEY)
    if (current) return normalizeCurrentStore(current)

    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (legacy) {
      const migrated = migrateLegacyStore(legacy)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
      return migrated
    }
  } catch {
    // Fall through to a clean in-memory store.
  }

  return createDefaultStore()
}

export function saveStore(store: AppStore) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // Storage can be unavailable in private mode. The trainer still works in memory.
  }
}

export function appendAttempt(store: AppStore, attempt: AttemptRecord): AppStore {
  const level = store.progress[attempt.level] ?? emptyLevelProgress()
  const nextStreak = attempt.correct ? level.currentStreak + 1 : 0
  const nextCorrect = level.correct + (attempt.correct ? 1 : 0)

  return {
    ...store,
    totals: {
      attempts: store.totals.attempts + 1,
      correct: store.totals.correct + (attempt.correct ? 1 : 0),
      currentStreak: attempt.correct ? store.totals.currentStreak + 1 : 0,
      bestStreak: Math.max(store.totals.bestStreak, attempt.correct ? store.totals.currentStreak + 1 : 0),
    },
    progress: {
      ...store.progress,
      [attempt.level]: {
        attempts: level.attempts + 1,
        correct: nextCorrect,
        currentStreak: nextStreak,
        bestStreak: Math.max(level.bestStreak, nextStreak),
        recent: [...level.recent, attempt.correct].slice(-UNLOCK_MIN_ATTEMPTS),
      },
    },
    attempts: [attempt, ...store.attempts].slice(0, MAX_ATTEMPTS),
  }
}

export function appendMistake(store: AppStore, mistake: MistakeRecord): AppStore {
  return {
    ...store,
    mistakes: [mistake, ...store.mistakes].slice(0, MAX_MISTAKES),
  }
}

export function clearMistakes(store: AppStore): AppStore {
  return { ...store, mistakes: [] }
}

export function getUnlockState(store: AppStore, level: number): UnlockState {
  if (level <= 1) {
    return {
      unlocked: true,
      previousLevel: 0,
      attempts: 0,
      recentCount: 0,
      recentCorrect: 0,
      recentAccuracy: 1,
    }
  }

  const previousLevel = level - 1
  const progress = store.progress[previousLevel] ?? emptyLevelProgress()
  const recent = progress.recent.slice(-UNLOCK_MIN_ATTEMPTS)
  const recentCorrect = recent.filter(Boolean).length
  const recentAccuracy = recent.length > 0 ? recentCorrect / recent.length : 0

  return {
    unlocked:
      progress.attempts >= UNLOCK_MIN_ATTEMPTS &&
      recent.length >= UNLOCK_MIN_ATTEMPTS &&
      recentAccuracy >= UNLOCK_MIN_ACCURACY,
    previousLevel,
    attempts: progress.attempts,
    recentCount: recent.length,
    recentCorrect,
    recentAccuracy,
  }
}

export const UNLOCK_RULES = {
  minimumAttempts: UNLOCK_MIN_ATTEMPTS,
  minimumAccuracy: UNLOCK_MIN_ACCURACY,
}

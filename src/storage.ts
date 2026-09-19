import type { AppStore, AttemptRecord, LevelProgress, MistakeRecord } from './types'

const STORAGE_KEY = 'chord-training-store-v2'
const MAX_ATTEMPTS = 500
const MAX_MISTAKES = 200

function emptyLevelProgress(): LevelProgress {
  return {
    attempts: 0,
    correct: 0,
    bestStreak: 0,
    currentStreak: 0,
  }
}

export function createDefaultStore(): AppStore {
  const progress = Object.fromEntries(
    Array.from({ length: 7 }, (_, index) => [index + 1, emptyLevelProgress()]),
  ) as Record<number, LevelProgress>

  return {
    version: 1,
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
    progress,
    attempts: [],
    mistakes: [],
  }
}

export function loadStore(): AppStore {
  const fallback = createDefaultStore()

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as Partial<AppStore>
    return {
      ...fallback,
      ...parsed,
      settings: { ...fallback.settings, ...parsed.settings },
      totals: { ...fallback.totals, ...parsed.totals },
      progress: { ...fallback.progress, ...parsed.progress },
      attempts: Array.isArray(parsed.attempts) ? parsed.attempts : [],
      mistakes: Array.isArray(parsed.mistakes) ? parsed.mistakes : [],
    }
  } catch {
    return fallback
  }
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

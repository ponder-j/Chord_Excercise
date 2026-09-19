import { useEffect, useMemo, useRef, useState } from 'react'
import { KeyPicker } from './components/KeyPicker'
import { PlayCard } from './components/PlayCard'
import { AnswerPanels } from './components/AnswerPanels'
import { MistakeBook } from './components/MistakeBook'
import { pianoEngine } from './audio/piano'
import { LEVELS, getLevelDefinition } from './data/levels'
import {
  answerToLabel,
  answerToMidi,
  formatKeyLabel,
  generateQuestion,
  getDegreePitchName,
  modifierKey,
  normalizeAnswer,
  sameChordSound,
  getQualityCardsForLevel,
  sortModifiers,
  uniqueId,
} from './music'
import {
  appendAttempt,
  appendMistake,
  clearMistakes,
  loadStore,
  saveStore,
} from './storage'
import type {
  AnswerModifier,
  AppStore,
  AttemptRecord,
  AudioStatus,
  ChordAnswer,
  ChordQuestion,
  KeyMode,
  MistakeRecord,
  ModifierKind,
} from './types'

type Feedback =
  | {
      type: 'correct'
      targetLabel: string
    }
  | {
      type: 'wrong'
      message: string
      targetLabel: string
    }
  | {
      type: 'revealed'
      targetLabel: string
    }

interface AudioViewState {
  status: AudioStatus
  loaded: number
  total: number
  error: string | null
  playing: boolean
  velocities: number[]
}

function createAttempt(
  question: ChordQuestion,
  selected: ChordAnswer | null,
  selectedMidi: number[],
  correct: boolean,
  keyLabel: string,
): AttemptRecord {
  return {
    id: uniqueId('attempt'),
    timestamp: Date.now(),
    correct,
    level: question.level,
    keyRoot: question.keyRoot,
    keyMode: question.keyMode,
    keyLabel,
    target: question.answer,
    targetMidi: question.midiNotes,
    selected,
    selectedMidi,
  }
}

function App() {
  const [store, setStore] = useState<AppStore>(() => loadStore())
  const [question, setQuestion] = useState<ChordQuestion>(() =>
    generateQuestion(store.settings.level, store.settings.keyRoot, store.settings.keyMode),
  )
  const [degree, setDegree] = useState<number | null>(null)
  const [qualityId, setQualityId] = useState<string | null>(null)
  const [modifiers, setModifiers] = useState<AnswerModifier[]>([])
  const [modifierKind, setModifierKind] = useState<ModifierKind>('add')
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [questionWrongCount, setQuestionWrongCount] = useState(0)
  const [keyPickerOpen, setKeyPickerOpen] = useState(false)
  const [mistakesOpen, setMistakesOpen] = useState(false)
  const [audioState, setAudioState] = useState<AudioViewState>({
    status: 'idle',
    loaded: 0,
    total: 0,
    error: null,
    playing: false,
    velocities: [],
  })
  const playedQuestionRef = useRef<string | null>(null)

  const levelDefinition = getLevelDefinition(store.settings.level)
  const progress = store.progress[store.settings.level] ?? {
    attempts: 0,
    correct: 0,
    bestStreak: 0,
    currentStreak: 0,
  }
  const qualityCards = useMemo(() => getQualityCardsForLevel(store.settings.level), [store.settings.level])
  const degreeNames = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) =>
        getDegreePitchName(store.settings.keyRoot, store.settings.keyMode, index + 1, store.settings.keyMode === 'minor'),
      ),
    [store.settings.keyMode, store.settings.keyRoot],
  )

  const selectedAnswer = useMemo<ChordAnswer | null>(() => {
    if (degree === null || qualityId === null) return null
    return normalizeAnswer({ degree, qualityId, modifiers })
  }, [degree, modifiers, qualityId])

  const selectedMidi = useMemo(
    () =>
      selectedAnswer
        ? answerToMidi(selectedAnswer, store.settings.keyRoot, store.settings.keyMode)
        : [],
    [selectedAnswer, store.settings.keyMode, store.settings.keyRoot],
  )

  const keyLabel = formatKeyLabel(store.settings.keyRoot, store.settings.keyMode)
  const selectedLabel = selectedAnswer ? answerToLabel(selectedAnswer) : '等待你组合答案'
  const allowModifiers = levelDefinition.modifiers.length > 0

  useEffect(() => saveStore(store), [store])

  useEffect(() => {
    return pianoEngine.subscribe((snapshot) => {
      setAudioState(snapshot)
    })
  }, [])

  useEffect(() => {
    if (!question || audioState.status !== 'ready') return
    if (playedQuestionRef.current === question.id) return
    playedQuestionRef.current = question.id
    void pianoEngine.play(question.midiNotes).catch(() => undefined)
  }, [audioState.status, question])

  function resetAnswer() {
    setDegree(null)
    setQualityId(null)
    setModifiers([])
    setFeedback(null)
    setQuestionWrongCount(0)
  }

  function loadQuestion(nextQuestion: ChordQuestion) {
    playedQuestionRef.current = null
    setQuestion(nextQuestion)
    resetAnswer()
  }

  function makeQuestion(level = store.settings.level, keyRoot = store.settings.keyRoot, mode = store.settings.keyMode) {
    return generateQuestion(level, keyRoot, mode)
  }

  function handleRootChange(nextRoot: number) {
    setStore((current) => ({
      ...current,
      settings: { ...current.settings, keyRoot: nextRoot },
    }))
    setKeyPickerOpen(false)
    loadQuestion(makeQuestion(store.settings.level, nextRoot, store.settings.keyMode))
  }

  function handleModeChange(nextMode: KeyMode) {
    setStore((current) => ({
      ...current,
      settings: { ...current.settings, keyMode: nextMode },
    }))
    setKeyPickerOpen(false)
    loadQuestion(makeQuestion(store.settings.level, store.settings.keyRoot, nextMode))
  }

  function handleLevelChange(nextLevel: number) {
    setStore((current) => ({
      ...current,
      settings: { ...current.settings, level: nextLevel },
    }))
    loadQuestion(makeQuestion(nextLevel))
  }

  async function playNotes(notes: number[]) {
    try {
      await pianoEngine.play(notes)
    } catch {
      // The audio state already exposes the error to the interface.
    }
  }

  function handlePlayQuestion() {
    playedQuestionRef.current = question.id
    void playNotes(question.midiNotes)
  }

  function handlePlayTonic() {
    playedQuestionRef.current = question.id
    const tonicRoot = 48 + store.settings.keyRoot
    const tonicIntervals = store.settings.keyMode === 'major' ? [0, 4, 7] : [0, 3, 7]
    void playNotes(tonicIntervals.map((interval) => tonicRoot + interval))
  }

  function handleSelectDegree(value: number) {
    if (feedback?.type === 'correct' || feedback?.type === 'revealed') return
    setDegree(value)
    setFeedback(null)
  }

  function handleSelectQuality(value: string) {
    if (feedback?.type === 'correct' || feedback?.type === 'revealed') return
    setQualityId(value)
    setFeedback(null)
  }

  function handleToggleModifier(modifier: AnswerModifier) {
    if (feedback?.type === 'correct' || feedback?.type === 'revealed') return
    setFeedback(null)
    setModifiers((current) => {
      const key = modifierKey(modifier)
      const exists = current.some((item) => modifierKey(item) === key)
      if (exists) return current.filter((item) => modifierKey(item) !== key)
      return sortModifiers([...current, modifier])
    })
  }

  function handleRemoveModifier(modifier: AnswerModifier) {
    if (feedback?.type === 'correct' || feedback?.type === 'revealed') return
    setModifiers((current) => current.filter((item) => modifierKey(item) !== modifierKey(modifier)))
    setFeedback(null)
  }

  function handleSubmit() {
    if (!selectedAnswer || feedback?.type === 'correct' || feedback?.type === 'revealed') return

    const correct = sameChordSound(selectedAnswer, question.answer, question.keyRoot, question.keyMode)
    const attempt = createAttempt(question, selectedAnswer, selectedMidi, correct, keyLabel)
    setStore((current) => {
      const withAttempt = appendAttempt(current, attempt)
      if (correct) return withAttempt
      const mistake: MistakeRecord = {
        id: attempt.id,
        timestamp: attempt.timestamp,
        level: attempt.level,
        keyRoot: attempt.keyRoot,
        keyMode: attempt.keyMode,
        keyLabel: attempt.keyLabel,
        target: attempt.target,
        targetMidi: attempt.targetMidi,
        selected: attempt.selected,
        selectedMidi: attempt.selectedMidi,
      }
      return appendMistake(withAttempt, mistake)
    })

    if (correct) {
      setFeedback({
        type: 'correct',
        targetLabel: answerToLabel(question.answer),
      })
      setQuestionWrongCount(0)
    } else {
      setQuestionWrongCount((count) => count + 1)
      setFeedback({
        type: 'wrong',
        message: '还差一点，试着先确定根音，再听三音、五音和延伸音。',
        targetLabel: answerToLabel(question.answer),
      })
    }
  }

  function handleReveal() {
    setFeedback({
      type: 'revealed',
      targetLabel: answerToLabel(question.answer),
    })
  }

  function handleNext() {
    loadQuestion(makeQuestion())
  }

  function handleClearMistakes() {
    setStore((current) => clearMistakes(current))
    setMistakesOpen(false)
  }

  const hasAnswer = Boolean(selectedAnswer)
  const isLockedFeedback = feedback?.type === 'correct' || feedback?.type === 'revealed'

  return (
    <div className="app-shell">
      <div className="ambient ambient--one" />
      <div className="ambient ambient--two" />

      <header className="topbar">
        <KeyPicker
          open={keyPickerOpen}
          keyRoot={store.settings.keyRoot}
          mode={store.settings.keyMode}
          onToggle={() => setKeyPickerOpen((open) => !open)}
          onChangeRoot={handleRootChange}
          onChangeMode={handleModeChange}
          onPlayTonic={handlePlayTonic}
        />

        <div className="topbar__right">
          <div className="stat-pill">
            <span className="stat-pill__label">正确率</span>
            <strong>
              {store.totals.attempts > 0 ? Math.round((store.totals.correct / store.totals.attempts) * 100) : 0}%
            </strong>
          </div>
          <button type="button" className="mistake-button" onClick={() => setMistakesOpen(true)}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 4h9l3 3v13H6z" />
              <path d="M9 10h6M9 14h6" />
            </svg>
            <span>错题本</span>
            {store.mistakes.length > 0 && <em>{store.mistakes.length}</em>}
          </button>
        </div>
      </header>

      <main>
        <section className="level-strip" aria-label="训练难度">
          <div className="level-strip__intro">
            <span className="eyebrow">Difficulty rules</span>
            <strong>选择一组随机出题规则</strong>
          </div>
          <div className="level-list">
            {LEVELS.map((level) => {
              const itemProgress = store.progress[level.id]
              const accuracy = itemProgress?.attempts ? Math.round((itemProgress.correct / itemProgress.attempts) * 100) : null
              return (
                <button
                  key={level.id}
                  type="button"
                  className={`level-card ${store.settings.level === level.id ? 'is-current' : ''}`}
                  onClick={() => handleLevelChange(level.id)}
                  title={level.description}
                >
                  <span className="level-card__number">0{level.id}</span>
                  <span className="level-card__copy">
                    <strong>{level.title}</strong>
                    <small>{level.short}</small>
                  </span>
                  <span className="level-card__progress">
                    {accuracy === null ? '∞' : `${accuracy}%`}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        <PlayCard
          playing={audioState.playing}
          audioStatus={audioState.status}
          loaded={audioState.loaded}
          total={audioState.total}
          velocities={audioState.velocities}
          difficulty={store.settings.level}
          attempts={progress.attempts}
          ruleSummary={levelDefinition.description}
          audioError={audioState.error}
          onPlay={handlePlayQuestion}
        />

        <section className="workspace">
          <div className="workspace__head">
            <div>
              <span className="eyebrow">Your answer</span>
              <h2>组合你的答案</h2>
              <p>
                {keyLabel} · {levelDefinition.description} · {store.settings.level === 1 ? '本级题池 100%' : '本级 60% + 历史难度 40%'}
              </p>
            </div>
            <div className="workspace__meta">
              <span>本难度已答 {progress.attempts}</span>
              <span>当前连续答对 {progress.currentStreak}</span>
            </div>
          </div>

          <div className={`answer-tray ${feedback?.type === 'correct' ? 'is-correct' : ''}`}>
            <div className="answer-tray__main">
              <span className="eyebrow">当前组合</span>
              <strong>{selectedLabel}</strong>
              {selectedAnswer && (
                <div className="answer-tray__mods">
                  {selectedAnswer.modifiers.map((modifier) => (
                    <button
                      type="button"
                      key={modifierKey(modifier)}
                      onClick={() => handleRemoveModifier(modifier)}
                      disabled={isLockedFeedback}
                    >
                      {modifier.kind}
                      {modifier.degree} <span>×</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button type="button" className="reset-button" onClick={resetAnswer} disabled={isLockedFeedback}>
              重置
            </button>
          </div>

          {feedback && (
            <div className={`feedback feedback--${feedback.type}`}>
              <div className="feedback__icon">{feedback.type === 'correct' ? '✓' : feedback.type === 'wrong' ? '!' : 'i'}</div>
              <div className="feedback__copy">
                <strong>
                  {feedback.type === 'correct'
                    ? '回答正确'
                    : feedback.type === 'revealed'
                      ? '正确答案'
                      : feedback.message}
                </strong>
                {feedback.type === 'correct' && <span>继续把听觉记忆变成稳定判断。</span>}
                {feedback.type !== 'correct' && <span>{feedback.targetLabel}</span>}
              </div>
              {feedback.type === 'wrong' && questionWrongCount >= 2 && (
                <button type="button" className="feedback__reveal" onClick={handleReveal}>
                  看答案
                </button>
              )}
              {feedback.type === 'correct' && (
                <button type="button" className="feedback__next" onClick={handleNext}>
                  下一题
                </button>
              )}
              {feedback.type === 'revealed' && (
                <button type="button" className="feedback__next" onClick={handleNext}>
                  下一题
                </button>
              )}
            </div>
          )}

          <div className="submit-row">
            <p>{hasAnswer ? '确认组合听起来与目标一致后再提交' : '先选择级数和和弦性质'}</p>
            <button type="button" className="submit-button" onClick={handleSubmit} disabled={!hasAnswer || isLockedFeedback}>
              提交答案
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m5 12 5 5L19 7" />
              </svg>
            </button>
          </div>

          <AnswerPanels
            degree={degree}
            qualityId={qualityId}
            qualityCards={qualityCards}
            degreeNames={degreeNames}
            allowModifiers={allowModifiers}
            modifierKind={modifierKind}
            selectedModifiers={modifiers}
            disabled={isLockedFeedback}
            onSelectDegree={handleSelectDegree}
            onSelectQuality={handleSelectQuality}
            onChangeModifierKind={setModifierKind}
            onToggleModifier={handleToggleModifier}
            onRemoveModifier={handleRemoveModifier}
          />
        </section>

        <footer className="site-footer">
          <p>
            Piano samples: <strong>Splendid Grand Piano</strong> · Public Domain by AKAI · mapped by kinwie
          </p>
          <a href="https://github.com/danigb/smplr" target="_blank" rel="noreferrer">
            Audio engine: smplr
          </a>
        </footer>
      </main>

      <MistakeBook
        open={mistakesOpen}
        mistakes={store.mistakes}
        onClose={() => setMistakesOpen(false)}
        onPlay={(notes) => void playNotes(notes)}
        onClear={handleClearMistakes}
      />
    </div>
  )
}

export default App

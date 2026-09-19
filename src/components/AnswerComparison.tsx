import { getAbsoluteNoteName } from '../music'
import type { KeyMode } from '../types'

interface AnswerComparisonProps {
  mineMidi: number[]
  standardMidi: number[]
  keyRoot: number
  mode: KeyMode
}

interface NoteCell {
  midi: number
  pitchClass: number
  name: string
}

interface ComparisonColumn {
  mine?: NoteCell
  standard?: NoteCell
  matched: boolean
}

function toCells(notes: number[], keyRoot: number, mode: KeyMode): NoteCell[] {
  return [...notes]
    .sort((a, b) => a - b)
    .map((midi) => ({
      midi,
      pitchClass: ((midi % 12) + 12) % 12,
      name: getAbsoluteNoteName(midi, keyRoot, mode),
    }))
}

function buildColumns(mine: NoteCell[], standard: NoteCell[]): ComparisonColumn[] {
  const rows = mine.length + 1
  const cols = standard.length + 1
  const dp = Array.from({ length: rows }, () => Array<number>(cols).fill(0))

  for (let i = 1; i <= mine.length; i += 1) {
    for (let j = 1; j <= standard.length; j += 1) {
      dp[i][j] =
        mine[i - 1].pitchClass === standard[j - 1].pitchClass
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1])
    }
  }

  const matches: Array<[number, number]> = []
  let i = mine.length
  let j = standard.length

  while (i > 0 && j > 0) {
    if (mine[i - 1].pitchClass === standard[j - 1].pitchClass) {
      matches.push([i - 1, j - 1])
      i -= 1
      j -= 1
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i -= 1
    } else {
      j -= 1
    }
  }

  matches.reverse()

  const columns: ComparisonColumn[] = []
  let mineIndex = 0
  let standardIndex = 0

  for (const [mineMatch, standardMatch] of matches) {
    while (mineIndex < mineMatch) {
      columns.push({ mine: mine[mineIndex], matched: false })
      mineIndex += 1
    }
    while (standardIndex < standardMatch) {
      columns.push({ standard: standard[standardIndex], matched: false })
      standardIndex += 1
    }
    columns.push({
      mine: mine[mineIndex],
      standard: standard[standardIndex],
      matched: true,
    })
    mineIndex += 1
    standardIndex += 1
  }

  while (mineIndex < mine.length) {
    columns.push({ mine: mine[mineIndex], matched: false })
    mineIndex += 1
  }
  while (standardIndex < standard.length) {
    columns.push({ standard: standard[standardIndex], matched: false })
    standardIndex += 1
  }

  return columns
}

export function AnswerComparison({ mineMidi, standardMidi, keyRoot, mode }: AnswerComparisonProps) {
  const mine = toCells(mineMidi, keyRoot, mode)
  const standard = toCells(standardMidi, keyRoot, mode)
  const columns = buildColumns(mine, standard)
  const matchedCount = columns.filter((column) => column.matched).length

  return (
    <section className="answer-comparison" aria-label="答案音高对比">
      <div className="answer-comparison__head">
        <div>
          <span className="eyebrow">Pitch comparison</span>
          <strong>音高对比</strong>
        </div>
        <span className="answer-comparison__count">{matchedCount} 个相同音</span>
      </div>

      <div className="answer-comparison__scroll">
        <div
          className="answer-comparison__grid"
          style={{ gridTemplateColumns: `76px repeat(${columns.length}, minmax(44px, 1fr))` }}
        >
          <div className="answer-comparison__label">我的答案</div>
          {columns.map((column, index) =>
            column.mine ? (
              <div
                className={`note-chip ${column.matched ? 'is-match' : 'is-diff'}`}
                key={`mine-${index}-${column.mine.midi}`}
                title={`MIDI ${column.mine.midi}`}
              >
                {column.mine.name}
              </div>
            ) : (
              <div className="note-chip is-empty" key={`mine-empty-${index}`} aria-hidden="true" />
            ),
          )}

          <div className="answer-comparison__label">标准答案</div>
          {columns.map((column, index) =>
            column.standard ? (
              <div
                className={`note-chip ${column.matched ? 'is-match' : 'is-diff'}`}
                key={`standard-${index}-${column.standard.midi}`}
                title={`MIDI ${column.standard.midi}`}
              >
                {column.standard.name}
              </div>
            ) : (
              <div className="note-chip is-empty" key={`standard-empty-${index}`} aria-hidden="true" />
            ),
          )}
        </div>
      </div>

      <p className="answer-comparison__legend">
        两行均由低到高排列。绿色为相同音，红色为不同音。
      </p>
    </section>
  )
}

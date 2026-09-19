import { formatKeyLabel, getChordNoteNames, answerToLabel } from '../music'
import type { MistakeRecord } from '../types'

interface MistakeBookProps {
  open: boolean
  mistakes: MistakeRecord[]
  onClose: () => void
  onPlay: (notes: number[]) => void
  onClear: () => void
}

function formatTime(timestamp: number) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(timestamp)
}

export function MistakeBook({ open, mistakes, onClose, onPlay, onClear }: MistakeBookProps) {
  if (!open) return null

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="mistake-book"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mistake-book-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="mistake-book__header">
          <div>
            <span className="eyebrow">Review collection</span>
            <h2 id="mistake-book-title">错题本</h2>
            <p>保留最近的错误记录，可以随时复听。</p>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="关闭错题本">
            ×
          </button>
        </header>

        {mistakes.length === 0 ? (
          <div className="mistake-empty">
            <span>✓</span>
            <h3>还没有错题</h3>
            <p>做错的题会自动出现在这里。</p>
          </div>
        ) : (
          <>
            <div className="mistake-book__summary">
              <strong>{mistakes.length}</strong>
              <span>条最近错题</span>
              <button type="button" onClick={onClear}>
                清空记录
              </button>
            </div>
            <div className="mistake-list">
              {mistakes.map((mistake) => {
                const useFlats = mistake.keyLabel.includes('b')
                return (
                  <article className="mistake-item" key={mistake.id}>
                    <button
                      type="button"
                      className="mistake-item__play"
                      onClick={() => onPlay(mistake.targetMidi)}
                      aria-label={`复听 ${answerToLabel(mistake.target)}`}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M8 5.5v13l10-6.5-10-6.5Z" />
                      </svg>
                    </button>
                    <div className="mistake-item__body">
                      <div className="mistake-item__title">
                        <strong>{answerToLabel(mistake.target)}</strong>
                        <span>L{mistake.level}</span>
                      </div>
                      <p>
                        {formatKeyLabel(mistake.keyRoot, mistake.keyMode)} ·{' '}
                        {getChordNoteNames(mistake.targetMidi, useFlats).join('  ')}
                      </p>
                      <div className="mistake-item__meta">
                        <span>{formatTime(mistake.timestamp)}</span>
                        {mistake.selected && <span>你的答案：{answerToLabel(mistake.selected)}</span>}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </>
        )}
      </section>
    </div>
  )
}

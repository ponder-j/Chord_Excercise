import { KEY_ROOTS } from '../data/levels'
import { formatKeyLabel } from '../music'
import type { KeyMode } from '../types'

interface KeyPickerProps {
  open: boolean
  keyRoot: number
  mode: KeyMode
  onToggle: () => void
  onChangeRoot: (pitchClass: number) => void
  onChangeMode: (mode: KeyMode) => void
  onPlayTonic: () => void
}

export function KeyPicker({
  open,
  keyRoot,
  mode,
  onToggle,
  onChangeRoot,
  onChangeMode,
  onPlayTonic,
}: KeyPickerProps) {
  return (
    <div className="key-picker">
      <button className="key-picker__trigger" type="button" onClick={onToggle} aria-expanded={open}>
        <span className="eyebrow">当前调式</span>
        <span className="key-picker__label">
          {formatKeyLabel(keyRoot, mode)}
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="m4 6 4 4 4-4" />
          </svg>
        </span>
      </button>

      <button className="tonic-button" type="button" onClick={onPlayTonic} title="播放当前调式的主和弦">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8 5.5v13l10-6.5-10-6.5Z" />
        </svg>
        <span>主和弦</span>
      </button>

      {open && (
        <div className="key-picker__panel">
          <div className="key-picker__panel-head">
            <div>
              <span className="eyebrow">选择主音</span>
              <strong>作为 1 级音</strong>
            </div>
            <span className="key-picker__hint">切换后会生成新题</span>
          </div>

          <div className="key-root-grid">
            {KEY_ROOTS.map((root) => (
              <button
                key={root.label}
                type="button"
                className={root.pitchClass === keyRoot ? 'is-selected' : ''}
                onClick={() => onChangeRoot(root.pitchClass)}
              >
                {root.label}
              </button>
            ))}
          </div>

          <div className="mode-switch" role="group" aria-label="调式类型">
            <button
              type="button"
              className={mode === 'major' ? 'is-selected' : ''}
              onClick={() => onChangeMode('major')}
            >
              大调
            </button>
            <button
              type="button"
              className={mode === 'minor' ? 'is-selected' : ''}
              onClick={() => onChangeMode('minor')}
            >
              小调
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

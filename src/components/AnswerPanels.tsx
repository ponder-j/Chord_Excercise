import { QUALITY_GROUPS } from '../data/levels'
import type { AnswerModifier, ModifierKind, QualityDefinition, TaskKind } from '../types'
import { modifierKey } from '../music'

const MODIFIER_DEGREES = Array.from({ length: 13 }, (_, index) => index + 1)

interface AnswerPanelsProps {
  taskKind: TaskKind
  selectedDegrees: number[]
  qualityId: string | null
  qualityCards: QualityDefinition[]
  degreeNames: string[]
  allowModifiers: boolean
  modifierKind: ModifierKind
  selectedModifiers: AnswerModifier[]
  disabled: boolean
  onSelectDegree: (degree: number) => void
  onSelectQuality: (qualityId: string) => void
  onChangeModifierKind: (kind: ModifierKind) => void
  onToggleModifier: (modifier: AnswerModifier) => void
  onRemoveModifier: (modifier: AnswerModifier) => void
}

export function AnswerPanels({
  taskKind,
  selectedDegrees,
  qualityId,
  qualityCards,
  degreeNames,
  allowModifiers,
  modifierKind,
  selectedModifiers,
  disabled,
  onSelectDegree,
  onSelectQuality,
  onChangeModifierKind,
  onToggleModifier,
  onRemoveModifier,
}: AnswerPanelsProps) {
  const selectedModifierKeys = new Set(selectedModifiers.map(modifierKey))
  const groupedQualities = QUALITY_GROUPS.map((group) => ({
    ...group,
    qualities: qualityCards.filter((quality) => quality.group === group.id),
  })).filter((group) => group.qualities.length > 0)
  const degreeCaption =
    taskKind === 'note' ? '选择 1 个音' : taskKind === 'dyad' ? '选择 2 个音' : '根音位置'
  const degreeGridClass = taskKind === 'chord' ? 'degree-grid' : 'degree-grid degree-grid--scale'

  return (
    <div className={`answer-panels ${taskKind === 'chord' ? '' : 'answer-panels--scale'}`}>
      <section className="answer-panel">
        <div className="answer-panel__head">
          <div>
            <span className="part-index">01</span>
            <h2>选择级数</h2>
          </div>
          <span className="answer-panel__caption">{degreeCaption}</span>
        </div>

        <div className={degreeGridClass}>
          {degreeNames.map((noteName, index) => {
            const value = index + 1
            const selected = selectedDegrees.includes(value)
            return (
              <button
                key={value}
                type="button"
                className={`degree-card ${selected ? 'is-selected' : ''}`}
                onClick={() => onSelectDegree(value)}
                disabled={disabled}
                aria-pressed={selected}
              >
                <strong>{value}</strong>
                <span>{noteName}</span>
              </button>
            )
          })}
        </div>
      </section>

      {taskKind === 'chord' && (
        <>
          <section className="answer-panel answer-panel--quality">
            <div className="answer-panel__head">
              <div>
                <span className="part-index">02</span>
                <h2>和弦性质</h2>
              </div>
              <span className="answer-panel__caption">Quality</span>
            </div>

            <div className="quality-groups">
              {groupedQualities.map((group) => (
                <div className="quality-group" key={group.id}>
                  <div className="quality-group__head">
                    <span>{group.label}</span>
                    <small>{group.hint}</small>
                  </div>
                  <div className="quality-group__grid">
                    {group.qualities.map((quality) => (
                      <button
                        key={quality.id}
                        type="button"
                        className={`quality-card ${qualityId === quality.id ? 'is-selected' : ''}`}
                        onClick={() => onSelectQuality(quality.id)}
                        disabled={disabled}
                        aria-pressed={qualityId === quality.id}
                      >
                        <strong>{quality.label}</strong>
                        <span>{quality.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={`answer-panel answer-panel--modifiers ${!allowModifiers ? 'is-muted' : ''}`}>
            <div className="answer-panel__head">
              <div>
                <span className="part-index">03</span>
                <h2>修饰音</h2>
              </div>
              <span className="answer-panel__caption">add / omit</span>
            </div>

            <div className="modifier-toolbar">
              <div className="modifier-switch" role="group" aria-label="修饰方式">
                <button
                  type="button"
                  className={modifierKind === 'add' ? 'is-selected' : ''}
                  onClick={() => onChangeModifierKind('add')}
                  disabled={!allowModifiers || disabled}
                >
                  add
                </button>
                <button
                  type="button"
                  className={modifierKind === 'omit' ? 'is-selected' : ''}
                  onClick={() => onChangeModifierKind('omit')}
                  disabled={!allowModifiers || disabled}
                >
                  omit
                </button>
              </div>
              <p>{allowModifiers ? `先选 ${modifierKind}，再点数字` : '本级暂不使用修饰音'}</p>
            </div>

            <div className="modifier-grid">
              {MODIFIER_DEGREES.map((value) => {
                const modifier = { kind: modifierKind, degree: value }
                const selected = selectedModifierKeys.has(modifierKey(modifier))
                return (
                  <button
                    key={value}
                    type="button"
                    className={`modifier-card ${selected ? 'is-selected' : ''}`}
                    onClick={() => (selected ? onRemoveModifier(modifier) : onToggleModifier(modifier))}
                    disabled={!allowModifiers || disabled}
                    aria-pressed={selected}
                  >
                    <strong>{value}</strong>
                    <span>{modifierKind}{value}</span>
                  </button>
                )
              })}
            </div>

            {selectedModifiers.length > 0 && (
              <div className="modifier-summary">
                {selectedModifiers.map((modifier) => (
                  <button
                    key={modifierKey(modifier)}
                    type="button"
                    onClick={() => onRemoveModifier(modifier)}
                    disabled={disabled}
                  >
                    {modifier.kind}
                    {modifier.degree}
                    <span>×</span>
                  </button>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}

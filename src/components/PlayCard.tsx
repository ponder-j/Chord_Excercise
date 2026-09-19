import type { AudioStatus } from '../types'

interface PlayCardProps {
  playing: boolean
  audioStatus: AudioStatus
  loaded: number
  total: number
  velocities: number[]
  difficulty: number
  attempts: number
  ruleSummary: string
  audioError: string | null
  onPlay: () => void
}

const IDLE_BARS = [24, 45, 30, 61, 38, 70, 46, 28, 56, 34, 48, 26]

export function PlayCard({
  playing,
  audioStatus,
  loaded,
  total,
  velocities,
  difficulty,
  attempts,
  ruleSummary,
  audioError,
  onPlay,
}: PlayCardProps) {
  const loadingProgress = total > 0 ? Math.round((loaded / total) * 100) : 0
  const bars = velocities.length > 0 ? velocities : IDLE_BARS
  const buttonLabel =
    audioStatus === 'idle' ? '启动并播放' : audioStatus === 'loading' ? `加载 ${loadingProgress}%` : '重新播放'

  return (
    <section className={`play-card ${playing ? 'is-playing' : ''}`}>
      <div className="play-card__glow" />
      <div className="play-card__topline">
        <span className="listen-badge">
          <span className="listen-badge__dot" />
          Listen & identify
        </span>
        <span className="level-chip">Difficulty {difficulty}</span>
      </div>

      <div className="play-card__content">
        <div>
          <p className="play-card__kicker">听音辨和弦</p>
          <h1>找出级数与和弦色彩</h1>
          <p className="play-card__description">
            每个音的力度已随机化排布。当前难度按“{ruleSummary}”持续生成新题，题池没有上限；更高难度会继续复用到这些问题模型。
          </p>
        </div>

        <button
          type="button"
          className="play-button"
          onClick={onPlay}
          disabled={audioStatus === 'loading'}
          aria-label={buttonLabel}
        >
          {audioStatus === 'loading' ? (
            <span className="spinner" />
          ) : playing ? (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 6h3v12H8zm5 0h3v12h-3z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 5.5v13l10-6.5-10-6.5Z" />
            </svg>
          )}
          <span>{buttonLabel}</span>
        </button>
      </div>

      <div className="visualizer" aria-hidden="true">
        {bars.map((value, index) => (
          <span
            key={`${index}-${value}`}
            className="visualizer__bar"
            style={{
              height: `${Math.max(18, Math.min(100, value))}%`,
              animationDelay: `${index * 45}ms`,
            }}
          />
        ))}
      </div>

      <div className="play-card__footer">
        <div>
          <span className="eyebrow">无限随机题池</span>
          <strong>已答 {attempts} 题</strong>
        </div>
        <p className={audioError ? 'is-error' : ''}>
          {audioError
            ? `音频加载失败：${audioError}`
            : audioStatus === 'idle'
              ? '首次播放需要点击一次以启用浏览器音频'
              : '每次播放都会重新随机每个音的力度'}
        </p>
      </div>
    </section>
  )
}

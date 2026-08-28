interface ProgressBarProps {
  progress: number
  max?: number
  label?: string
  color?: 'gold' | 'red' | 'blue' | 'green'
  height?: number
  showValue?: boolean
}

const colorClasses = {
  gold: 'progress-gold',
  red: 'progress-red',
  blue: 'progress-blue',
  green: 'progress-green',
}

export function ProgressBar({ progress, max = 100, label, color = 'gold', height = 8, showValue = true }: ProgressBarProps) {
  const percent = Math.min((progress / max) * 100, 100)

  return (
    <div className="progress-root">
      {label && (
        <div className="progress-label">
          <span>{label}</span>
          {showValue && <span>{progress}/{max}</span>}
        </div>
      )}
      <div
        className="progress-track"
        role="progressbar"
        aria-label={label || '进度'}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={progress}
        style={{ height: `${height}px` }}
      >
        <div
          className={`progress-fill ${colorClasses[color]}`}
          style={{ transform: `scaleX(${percent / 100})` }}
          aria-hidden="true"
        />
      </div>
    </div>
  )
}

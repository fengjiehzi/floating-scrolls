interface ProgressBarProps {
  progress: number
  max?: number
  label?: string
  color?: 'gold' | 'red' | 'blue' | 'green'
  height?: number
  showValue?: boolean
}

const colorClasses = {
  gold: 'from-accent-gold to-border-gold',
  red: 'from-accent-red to-red-400',
  blue: 'from-blue-500 to-blue-400',
  green: 'from-green-500 to-green-400',
}

export function ProgressBar({ progress, max = 100, label, color = 'gold', height = 8, showValue = true }: ProgressBarProps) {
  const percent = Math.min((progress / max) * 100, 100)

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <div className="flex items-center justify-between text-xs text-text-secondary">
          <span>{label}</span>
          {showValue && <span>{progress}/{max}</span>}
        </div>
      )}
      <div className="h-2 bg-bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${colorClasses[color]} transition-all duration-500 ease-out`}
          style={{ width: `${percent}%`, height: `${height}px` }}
        />
      </div>
    </div>
  )
}

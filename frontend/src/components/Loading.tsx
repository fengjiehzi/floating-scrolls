interface LoadingProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
}

export function Loading({ message, size = 'md' }: LoadingProps) {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <div className={`loading-mark ${sizeClasses[size]}`} aria-hidden="true">
        <span />
      </div>
      {message && <p>{message}</p>}
    </div>
  )
}

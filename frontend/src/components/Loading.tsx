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
    <div className="flex flex-col items-center justify-center gap-4">
      <div className={`relative ${sizeClasses[size]}`}>
        <div className="absolute inset-0 border-2 border-border-gold/30 rounded-full" />
        <div className="absolute inset-0 border-2 border-transparent border-t-border-gold rounded-full animate-spin" />
        <div className="absolute inset-0 border-2 border-transparent border-t-accent-red/50 rounded-full animate-spin" style={{ animationDuration: '1.5s' }} />
      </div>
      {message && (
        <p className="text-text-secondary text-sm animate-pulse">{message}</p>
      )}
    </div>
  )
}

import type { LucideIcon } from 'lucide-react'
import { BookOpen, RotateCcw } from 'lucide-react'
import { Loading } from '@/components/Loading'

interface PageStateProps {
  kind: 'loading' | 'error' | 'empty'
  title: string
  message?: string | null
  icon?: LucideIcon
  actionLabel?: string
  onAction?: () => void
}

export function PageState({
  kind,
  title,
  message,
  icon: Icon = BookOpen,
  actionLabel,
  onAction,
}: PageStateProps) {
  if (kind === 'loading') {
    return (
      <div className="page-state" role="status">
        <Loading message={message || title} />
      </div>
    )
  }

  return (
    <div className={`page-state page-state--${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      <Icon aria-hidden="true" />
      <h2>{title}</h2>
      {message && <p>{message}</p>}
      {onAction && actionLabel && (
        <button type="button" className="button-secondary" onClick={onAction}>
          {kind === 'error' && <RotateCcw aria-hidden="true" />}
          {actionLabel}
        </button>
      )}
    </div>
  )
}

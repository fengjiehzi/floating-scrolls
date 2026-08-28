import { useEffect } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'
import { useGameStore } from '@/store/gameStore'

const toastIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

export function ToastContainer() {
  const { toasts, removeToast } = useGameStore()

  useEffect(() => {
    const timers = toasts.map((toast) => setTimeout(() => {
      removeToast(toast.id)
    }, toast.duration || 3000))

    return () => timers.forEach(clearTimeout)
  }, [toasts, removeToast])

  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map((toast) => {
        const Icon = toastIcons[toast.type]
        return (
          <div
            key={toast.id}
            className={`toast toast-${toast.type}`}
            role={toast.type === 'error' ? 'alert' : 'status'}
          >
            <Icon className="w-5 h-5" aria-hidden="true" />
            <span>{toast.message}</span>
          </div>
        )
      })}
    </div>
  )
}

import { useEffect } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'
import { useGameStore } from '@/store/gameStore'

const toastIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const toastStyles = {
  success: 'border-green-500/50 bg-green-900/20',
  error: 'border-red-500/50 bg-red-900/20',
  warning: 'border-yellow-500/50 bg-yellow-900/20',
  info: 'border-blue-500/50 bg-blue-900/20',
}

const iconColors = {
  success: 'text-green-400',
  error: 'text-red-400',
  warning: 'text-yellow-400',
  info: 'text-blue-400',
}

export function ToastContainer() {
  const { toasts, removeToast } = useGameStore()

  useEffect(() => {
    toasts.forEach((toast) => {
      const timer = setTimeout(() => {
        removeToast(toast.id)
      }, toast.duration || 3000)
      return () => clearTimeout(timer)
    })
  }, [toasts, removeToast])

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3">
      {toasts.map((toast) => {
        const Icon = toastIcons[toast.type]
        return (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 border rounded-lg shadow-lg animate-slide-in ${toastStyles[toast.type]}`}
          >
            <Icon className={`w-5 h-5 ${iconColors[toast.type]}`} />
            <span className="text-text-primary">{toast.message}</span>
          </div>
        )
      })}
      <style>{`
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(100%); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}

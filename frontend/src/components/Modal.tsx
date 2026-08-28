import { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const previousOverflowRef = useRef('')
  const onCloseRef = useRef(onClose)
  const titleId = useId()

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current()
      if (e.key !== 'Tab' || !modalRef.current) return

      const focusable = Array.from(modalRef.current.querySelectorAll<HTMLElement>(
        'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
      ))
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement | null
      previousOverflowRef.current = document.body.style.overflow
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
      requestAnimationFrame(() => {
        modalRef.current?.querySelector<HTMLElement>('button, input, select, textarea, [href]')?.focus()
      })
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = previousOverflowRef.current
      previousFocusRef.current?.focus()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="modal-root">
      <button type="button" className="modal-backdrop" onClick={onClose} aria-label="关闭对话框" />
      <div
        ref={modalRef}
        className={`modal-panel ${sizeClasses[size]}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : '对话框'}
      >
        {title && (
          <div className="modal-header">
            <h2 id={titleId}>{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="icon-button"
              aria-label="关闭对话框"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="modal-content">{children}</div>
      </div>
    </div>
  )
}

export type ToastType = 'success' | 'error' | 'warning' | 'info'
export type LoadStatus = 'idle' | 'loading' | 'success' | 'error'

export interface ToastMessage {
  id: string
  message: string
  type: ToastType
  duration?: number
}

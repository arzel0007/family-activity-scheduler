import { createContext, useContext, useState, ReactNode } from 'react'

export type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  title?: string
  message: string
  type: ToastType
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: { title?: string; message: string; type: ToastType }) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (toast: { title?: string; message: string; type: ToastType }) => {
    const id = Date.now().toString()
    setToasts((prev) => [...prev, { id, ...toast }])
    setTimeout(() => removeToast(id), 3000)
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-md text-ink-black shadow-xl ${
              toast.type === 'success'
                ? 'bg-vivid-green'
                : toast.type === 'error'
                  ? 'bg-sunset-orange'
                  : 'bg-sky-blue'
            }`}
          >
            {toast.title && <div className="font-bold">{toast.title}</div>}
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}

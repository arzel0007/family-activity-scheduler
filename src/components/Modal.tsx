import { ReactNode } from 'react'

interface ModalProps {
  isOpen: boolean
  title: string
  children: ReactNode
  onClose: () => void
  actions?: { label: string; onClick: () => void; variant?: 'primary' | 'secondary'; disabled?: boolean }[]
}

export function Modal({ isOpen, title, children, onClose, actions }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-ink-black bg-opacity-25 flex items-center justify-center z-50">
      <div className="bg-surface-white dark:bg-gray-900 p-6 rounded-md border border-pale-granite dark:border-gray-700 shadow-xl max-w-md w-full">
        <h2 className="text-xl font-bold mb-4 text-charcoal-black dark:text-surface-white">{title}</h2>
        <div className="mb-6">{children}</div>
        {actions && (
          <div className="flex gap-2">
            {actions.map((action, idx) => (
              <button
                key={idx}
                onClick={action.onClick}
                disabled={action.disabled}
                className={`flex-1 ${action.variant === 'secondary' ? 'btn-secondary' : 'btn-primary'} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {action.label}
              </button>
            ))}
            <button onClick={onClose} className="flex-1 btn-secondary">
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

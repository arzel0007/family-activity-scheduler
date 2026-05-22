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
    <div className="fixed inset-0 backdrop-blur-sm bg-charcoal-black/20 flex items-center justify-center z-50 p-4">
      <div
        className="bg-surface-white p-6 md:p-8 rounded border border-pale-granite max-w-lg w-full mx-auto"
        style={{ boxShadow: 'var(--shadow-xl)' }}
      >
        <h2 className="text-xl font-bold mb-4 text-charcoal-black">{title}</h2>
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

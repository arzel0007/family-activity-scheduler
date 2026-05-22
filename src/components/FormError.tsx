interface FormErrorProps {
  message?: string | null
}

export function FormError({ message }: FormErrorProps) {
  if (!message) return null

  return (
    <div className="mb-4 p-3 rounded bg-vivid-green/10 border border-vivid-green text-vivid-green text-sm" role="alert">
      <div className="flex items-center gap-2">
        <span>❌</span>
        <span>{message}</span>
      </div>
    </div>
  )
}

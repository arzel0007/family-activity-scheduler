interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  touched?: boolean
  helperText?: string
  required?: boolean
}

export function FormInput({
  label,
  error,
  touched,
  helperText,
  required,
  className = '',
  ...inputProps
}: FormInputProps) {
  const showError = error && touched

  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={inputProps.id || inputProps.name} className="label">
          {label}
          {required && <span className="text-vivid-green ml-1">*</span>}
        </label>
      )}
      <input
        {...inputProps}
        className={`input ${showError ? 'border-vivid-green ring-1 ring-vivid-green' : ''} ${className}`}
        aria-invalid={showError ? 'true' : 'false'}
        aria-describedby={showError ? `${inputProps.name}-error` : helperText ? `${inputProps.name}-helper` : undefined}
      />
      {showError && (
        <p id={`${inputProps.name}-error`} className="text-vivid-green text-sm mt-1 flex items-center gap-1">
          ⚠️ {error}
        </p>
      )}
      {helperText && !showError && (
        <p id={`${inputProps.name}-helper`} className="text-graphite-grey text-sm mt-1">
          {helperText}
        </p>
      )}
    </div>
  )
}

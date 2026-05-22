import { useState, useCallback } from 'react'
import { validateForm, ValidationErrors, ValidationRule } from './formValidation'

interface UseFormOptions {
  initialValues: Record<string, any>
  validationSchema?: Record<string, ValidationRule[]>
  onSubmit: (values: Record<string, any>) => void | Promise<void>
}

export function useForm({ initialValues, validationSchema = {}, onSubmit }: UseFormOptions) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const finalValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    
    setValues(prev => ({
      ...prev,
      [name]: finalValue
    }))

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }))
    }
  }, [errors])

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name } = e.target
    setTouched(prev => ({
      ...prev,
      [name]: true
    }))

    // Validate field on blur
    if (validationSchema[name]) {
      const newErrors = validateForm({ [name]: values[name] }, { [name]: validationSchema[name] })
      setErrors(prev => ({
        ...prev,
        [name]: newErrors[name]
      }))
    }
  }, [values, validationSchema])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    // Validate all fields
    const newErrors = validateForm(values, validationSchema)
    setErrors(newErrors)
    setTouched(Object.keys(validationSchema).reduce((acc, key) => ({ ...acc, [key]: true }), {}))

    // Don't submit if there are errors
    if (Object.values(newErrors).some(Boolean)) {
      return
    }

    try {
      setIsSubmitting(true)
      await onSubmit(values)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }, [values, validationSchema, onSubmit])

  const resetForm = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
    setSubmitError(null)
  }, [initialValues])

  return {
    values,
    errors,
    touched,
    isSubmitting,
    submitError,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setValues,
    setErrors
  }
}

export interface ValidationRule {
  validate: (value: any) => boolean
  message: string
}

export interface ValidationErrors {
  [field: string]: string | undefined
}

export const validators = {
  required: (field: string): ValidationRule => ({
    validate: (value) => Boolean(value && value.trim()),
    message: `${field} is required`
  }),
  
  email: (): ValidationRule => ({
    validate: (value) => {
      if (!value) return false
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(value)
    },
    message: 'Please enter a valid email address'
  }),
  
  minLength: (length: number): ValidationRule => ({
    validate: (value) => value && String(value).length >= length,
    message: `Minimum ${length} characters required`
  }),
  
  maxLength: (length: number): ValidationRule => ({
    validate: (value) => !value || String(value).length <= length,
    message: `Maximum ${length} characters allowed`
  }),
  
  minAge: (age: number): ValidationRule => ({
    validate: (value) => {
      if (!value) return false
      const numValue = Number(value)
      return !isNaN(numValue) && numValue >= age
    },
    message: `Age must be at least ${age}`
  }),
  
  maxAge: (age: number): ValidationRule => ({
    validate: (value) => {
      if (!value) return false
      const numValue = Number(value)
      return !isNaN(numValue) && numValue <= age
    },
    message: `Age must not exceed ${age}`
  }),
  
  url: (): ValidationRule => ({
    validate: (value) => {
      if (!value) return false
      try {
        new URL(value)
        return true
      } catch {
        return false
      }
    },
    message: 'Please enter a valid URL'
  })
}

export function validateField(
  value: any,
  rules: ValidationRule[]
): string | undefined {
  for (const rule of rules) {
    if (!rule.validate(value)) {
      return rule.message
    }
  }
  return undefined
}

export function validateForm(
  formData: Record<string, any>,
  schema: Record<string, ValidationRule[]>
): ValidationErrors {
  const errors: ValidationErrors = {}
  
  for (const [field, rules] of Object.entries(schema)) {
    const error = validateField(formData[field], rules)
    if (error) {
      errors[field] = error
    }
  }
  
  return errors
}

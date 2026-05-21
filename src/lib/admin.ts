/** Super admin email — can also override via VITE_SUPER_ADMIN_EMAIL */
export const SUPER_ADMIN_EMAIL = (
  import.meta.env.VITE_SUPER_ADMIN_EMAIL || 'xxarzelxx@gmail.com'
).toLowerCase()

export type UserRole = 'parent' | 'super_admin' | 'disabled'

export function isSuperAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return email.toLowerCase() === SUPER_ADMIN_EMAIL
}

export function isSuperAdminUser(
  email: string | null | undefined,
  role?: string | null
): boolean {
  return isSuperAdminEmail(email) || role === 'super_admin'
}

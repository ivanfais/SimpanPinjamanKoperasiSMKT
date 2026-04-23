/**
 * Decode payload dari JWT token tanpa library tambahan.
 * Digunakan untuk mengambil `sub` (admin ID) dari token yang tersimpan di localStorage.
 */
export function decodeJwtPayload(token: string): Record<string, string> | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(json)
  } catch {
    return null
  }
}

export function getAdminIdFromToken(): string {
  const token = localStorage.getItem('token')
  if (!token) return ''
  const payload = decodeJwtPayload(token)
  return payload?.sub ?? payload?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ?? ''
}

export function getAdminRoleFromToken(): string {
  const token = localStorage.getItem('token')
  if (!token) return 'Staff'
  const payload = decodeJwtPayload(token)
  return payload?.AdminRole ?? 'Staff'
}

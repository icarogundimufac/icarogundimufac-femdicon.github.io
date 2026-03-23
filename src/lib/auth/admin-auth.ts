const ADMIN_SESSION_KEY = 'portal-admin-authenticated'
export const ADMIN_PASSWORD = 'SEPLANAC'

export function isAdminAuthenticated() {
  if (typeof window === 'undefined') return false
  return window.sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true'
}

export function authenticateAdmin(password: string) {
  const isValid = password === ADMIN_PASSWORD

  if (typeof window !== 'undefined') {
    if (isValid) {
      window.sessionStorage.setItem(ADMIN_SESSION_KEY, 'true')
    } else {
      window.sessionStorage.removeItem(ADMIN_SESSION_KEY)
    }
  }

  return isValid
}

export function signOutAdmin() {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(ADMIN_SESSION_KEY)
}

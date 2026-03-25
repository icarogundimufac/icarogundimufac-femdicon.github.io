import { DEFAULT_ADMIN_PASSWORD } from '@/lib/auth/admin-config'

const ADMIN_SESSION_KEY = 'portal-admin-authenticated'
export const ADMIN_PASSWORD = DEFAULT_ADMIN_PASSWORD

function setAdminAuthenticated(isAuthenticated: boolean) {
  if (typeof window === 'undefined') return

  if (isAuthenticated) {
    window.sessionStorage.setItem(ADMIN_SESSION_KEY, 'true')
    return
  }

  window.sessionStorage.removeItem(ADMIN_SESSION_KEY)
}

function canUseLocalDevFallback() {
  return import.meta.env.DEV
}

export function isAdminAuthenticated() {
  if (typeof window === 'undefined') return false
  return window.sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true'
}

export async function authenticateAdmin(password: string) {
  try {
    const response = await fetch('/api/admin/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ password }),
    })

    if (!response.ok) {
      if (canUseLocalDevFallback() && password === ADMIN_PASSWORD) {
        setAdminAuthenticated(true)
        return true
      }

      setAdminAuthenticated(false)
      return false
    }

    setAdminAuthenticated(true)
    return true
  } catch {
    if (canUseLocalDevFallback() && password === ADMIN_PASSWORD) {
      setAdminAuthenticated(true)
      return true
    }

    setAdminAuthenticated(false)
    return false
  }
}

export async function signOutAdmin() {
  setAdminAuthenticated(false)

  try {
    await fetch('/api/admin/session', {
      method: 'DELETE',
      credentials: 'same-origin',
    })
  } catch {
    // Ignora falhas de rede no logout local.
  }
}

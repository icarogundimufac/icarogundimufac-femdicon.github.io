import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { isAdminAuthenticated } from '@/lib/auth/admin-auth'

const ADMIN_TARGET_PATH = '/admin/dados'

export function AdminShortcutHandler() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!event.ctrlKey || event.key !== 'Enter') {
        return
      }

      event.preventDefault()

      if (isAdminAuthenticated()) {
        navigate(ADMIN_TARGET_PATH)
        return
      }

      if (location.pathname === '/admin/login') {
        return
      }

      navigate(`/admin/login?next=${encodeURIComponent(ADMIN_TARGET_PATH)}`, {
        state: { next: ADMIN_TARGET_PATH, from: location.pathname },
      })
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [location.pathname, navigate])

  return null
}

import { useQuery } from '@tanstack/react-query'
import { Navigate, useLocation } from 'react-router-dom'
import { AdminDataPage } from '@/components/admin/AdminDataPage'
import { isAdminAuthenticated } from '@/lib/auth/admin-auth'
import { queryKeys } from '@/lib/data/client'
import { loadPortalDataBundle } from '@/lib/data/portal-data'

export function AdminDataRoute() {
  const location = useLocation()

  if (!isAdminAuthenticated()) {
    return (
      <Navigate
        to={`/admin/login?next=${encodeURIComponent(location.pathname)}`}
        replace
      />
    )
  }

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: queryKeys.portalDataBundle,
    queryFn: loadPortalDataBundle,
    retry: false,
  })

  return (
    <AdminDataPage
      initialBundle={data ?? null}
      isLoading={isLoading}
      isError={isError}
      errorMessage={error instanceof Error ? error.message : null}
    />
  )
}

import { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AdminShortcutHandler } from '@/components/admin/AdminShortcutHandler'
import { AppShell } from '@/components/layout/AppShell'

const DashboardRoute = lazy(() =>
  import('@/routes/DashboardRoute').then((module) => ({ default: module.DashboardRoute })),
)
const IndicatorRoute = lazy(() =>
  import('@/routes/IndicatorRoute').then((module) => ({ default: module.IndicatorRoute })),
)
const MapasRoute = lazy(() =>
  import('@/routes/MapasRoute').then((module) => ({ default: module.MapasRoute })),
)
const MunicipiosRoute = lazy(() =>
  import('@/routes/MunicipiosRoute').then((module) => ({ default: module.MunicipiosRoute })),
)
const MunicipioDetailRoute = lazy(() =>
  import('@/routes/MunicipioDetailRoute').then((module) => ({
    default: module.MunicipioDetailRoute,
  })),
)
const AdminDataRoute = lazy(() =>
  import('@/routes/AdminDataRoute').then((module) => ({ default: module.AdminDataRoute })),
)
const AdminLoginRoute = lazy(() =>
  import('@/routes/AdminLoginRoute').then((module) => ({ default: module.AdminLoginRoute })),
)

function RouteFallback() {
  return (
    <div className="px-8 py-10">
      <div className="bg-white rounded-xl border border-areia-200 p-6 shadow-sm animate-pulse">
        <div className="h-4 w-40 bg-areia-200 rounded mb-4" />
        <div className="h-24 w-full bg-areia-100 rounded" />
      </div>
    </div>
  )
}

function PublicLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AdminShortcutHandler />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/admin/login" element={<AdminLoginRoute />} />
          <Route path="/admin/dados" element={<AdminDataRoute />} />
          <Route element={<PublicLayout />}>
            <Route path="/" element={<DashboardRoute />} />
            <Route path="/educacao" element={<IndicatorRoute sectionId="educacao" />} />
            <Route path="/saude" element={<IndicatorRoute sectionId="saude" />} />
            <Route path="/seguranca" element={<IndicatorRoute sectionId="seguranca" />} />
            <Route path="/orcamento" element={<IndicatorRoute sectionId="orcamento" />} />
            <Route path="/mapas" element={<MapasRoute />} />
            <Route path="/municipios" element={<MunicipiosRoute />} />
            <Route path="/municipios/:slug" element={<MunicipioDetailRoute />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

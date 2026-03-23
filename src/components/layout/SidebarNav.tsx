import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils/cn'
import { NAV } from '@/lib/constants/nav'
import {
  prefetchIndicatorSections,
  prefetchPathData,
} from '@/lib/data/client'

const ICONS: Record<string, React.ReactNode> = {
  grid: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  'book-open': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  ),
  'heart-pulse': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      <path d="M3.22 12H9.5l1.5-2 2 4.5 1.5-3 1.5 2.5h5.27" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  ),
  coins: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4">
      <circle cx="8" cy="8" r="6" />
      <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
      <path d="M7 6h1v4" />
      <path d="m16.71 13.88.7.71-2.82 2.82" />
    </svg>
  ),
  building: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4">
      <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01" />
    </svg>
  ),
  map: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4">
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" x2="9" y1="3" y2="18" />
      <line x1="15" x2="15" y1="6" y2="21" />
    </svg>
  ),
}

const PREFETCHED_ROUTES = new Set<string>()

export function SidebarNav() {
  const location = useLocation()
  const pathname = location.pathname
  const queryClient = useQueryClient()

  useEffect(() => {
    let cancelled = false

    const warmUp = () => {
      if (cancelled) return
      void prefetchIndicatorSections(queryClient)
    }

    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(warmUp, { timeout: 1200 })
      return () => {
        cancelled = true
        window.cancelIdleCallback(idleId)
      }
    }

    const timeoutId = window.setTimeout(warmUp, 500)
    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [queryClient])

  return (
    <nav className="flex-1 px-3 py-4 overflow-y-auto">
      {NAV.map((section) => (
        <div key={section.label} className="mb-6">
          <p className="mb-2 px-3 text-[10px] font-semibold tracking-[0.12em] uppercase text-[#F2C230]/60 font-jakarta">
            {section.label}
          </p>
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href)

              const prefetch = () => {
                if (PREFETCHED_ROUTES.has(item.href)) return
                PREFETCHED_ROUTES.add(item.href)
                void prefetchPathData(queryClient, item.href)
              }

              return (
                <li key={item.href}>
                  <NavLink
                    to={item.href}
                    onMouseEnter={prefetch}
                    onFocus={prefetch}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-150 font-jakarta group',
                      isActive
                        ? 'bg-[#3E8B4F]/60 text-white border-l-[3px] border-[#F2C230] pl-[9px]'
                        : 'text-white/60 hover:bg-[#3E8B4F]/40 hover:text-white border-l-[3px] border-transparent pl-[9px]',
                    )}
                  >
                    <span
                      className={cn(
                        'flex-shrink-0 transition-colors duration-150',
                        isActive ? 'text-white' : 'text-white/40 group-hover:text-white/90',
                      )}
                    >
                      {ICONS[item.icon]}
                    </span>
                    {item.label}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}

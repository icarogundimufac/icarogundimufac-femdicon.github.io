import { useEffect, useRef } from 'react'
import type { QueryClient } from '@tanstack/react-query'
import {
  persistAdminSection,
  queryKeys,
  saveAdminSection,
} from '@/lib/data/client'
import {
  INDICATOR_SECTION_IDS,
  type IndicatorSectionId,
} from '@/lib/constants/indicator-sections'
import type { PortalDataBundle } from '@/types/admin-data'
import type { StatusMessage } from './useBundleMutations'

type PersistMode = 'debounced' | 'immediate'

interface UseSectionPersistenceParams {
  bundle: PortalDataBundle | null
  queryClient: QueryClient
  setStatus: (status: StatusMessage | null) => void
}

const PERSIST_DELAY_MS = 800

function getSectionSnapshots(bundle: PortalDataBundle) {
  return Object.fromEntries(
    INDICATOR_SECTION_IDS.map((sectionId) => [
      sectionId,
      JSON.stringify(bundle.sections[sectionId]),
    ]),
  ) as Record<IndicatorSectionId, string>
}

export function useSectionPersistence({
  bundle,
  queryClient,
  setStatus,
}: UseSectionPersistenceParams) {
  const previousSnapshotsRef =
    useRef<Record<IndicatorSectionId, string> | null>(null)
  const requestedModesRef = useRef<Partial<Record<IndicatorSectionId, PersistMode>>>({})
  const timersRef =
    useRef<Partial<Record<IndicatorSectionId, ReturnType<typeof window.setTimeout>>>>({})
  const latestBundleRef = useRef<PortalDataBundle | null>(bundle)

  latestBundleRef.current = bundle

  useEffect(() => {
    return () => {
      for (const timeoutId of Object.values(timersRef.current)) {
        if (timeoutId) {
          window.clearTimeout(timeoutId)
        }
      }
    }
  }, [])

  useEffect(() => {
    if (!bundle) {
      previousSnapshotsRef.current = null
      return
    }

    queryClient.setQueryData(queryKeys.portalDataBundle, bundle)

    const currentSnapshots = getSectionSnapshots(bundle)
    const previousSnapshots = previousSnapshotsRef.current

    if (!previousSnapshots) {
      previousSnapshotsRef.current = currentSnapshots
      return
    }

    async function persistSection(sectionId: IndicatorSectionId) {
      const currentBundle = latestBundleRef.current
      if (!currentBundle) return

      try {
        await persistAdminSection(sectionId, currentBundle.sections[sectionId])
        saveAdminSection(sectionId, currentBundle.sections[sectionId])
      } catch (error) {
        setStatus({
          kind: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'Falha ao salvar a secao no servidor.',
        })
      }
    }

    for (const sectionId of INDICATOR_SECTION_IDS) {
      if (previousSnapshots[sectionId] === currentSnapshots[sectionId]) {
        continue
      }

      const nextSection = bundle.sections[sectionId]
      queryClient.setQueryData(queryKeys.section(sectionId), nextSection)
      saveAdminSection(sectionId, nextSection)

      const requestedMode = requestedModesRef.current[sectionId] ?? 'debounced'
      delete requestedModesRef.current[sectionId]

      const existingTimeout = timersRef.current[sectionId]
      if (existingTimeout) {
        window.clearTimeout(existingTimeout)
        delete timersRef.current[sectionId]
      }

      if (requestedMode === 'immediate') {
        void persistSection(sectionId)
        continue
      }

      timersRef.current[sectionId] = window.setTimeout(() => {
        delete timersRef.current[sectionId]
        void persistSection(sectionId)
      }, PERSIST_DELAY_MS)
    }

    previousSnapshotsRef.current = currentSnapshots
  }, [bundle, queryClient, setStatus])

  return {
    requestImmediateSectionPersist(sectionId: IndicatorSectionId) {
      requestedModesRef.current[sectionId] = 'immediate'
    },
  }
}

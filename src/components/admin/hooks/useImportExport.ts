import type { ChangeEvent, Dispatch, SetStateAction } from 'react'
import {
  downloadBundleAsJson,
  downloadBundleAsWorkbook,
  downloadBundleAsZip,
  downloadMunicipalTemplateWorkbook,
  importBundleFromJson,
  importBundleFromWorkbook,
  importBundleFromZip,
  importMunicipalTemplateWorkbook,
} from '@/lib/data/workbook'
import type { PortalDataBundle } from '@/types/admin-data'
import type { StatusMessage } from './useBundleMutations'

export function useImportExport(
  bundle: PortalDataBundle | null,
  setBundle: Dispatch<SetStateAction<PortalDataBundle | null>>,
  setStatus: (status: StatusMessage | null) => void,
) {
  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      let importedBundle: PortalDataBundle
      if (file.name.endsWith('.xlsx')) {
        importedBundle = await importBundleFromWorkbook(file)
      } else if (file.name.endsWith('.zip')) {
        importedBundle = await importBundleFromZip(file)
      } else if (file.name.endsWith('.json')) {
        importedBundle = await importBundleFromJson(file)
      } else {
        throw new Error('Formato de arquivo não suportado.')
      }

      setBundle(importedBundle)
      setStatus({ kind: 'success', message: `Arquivo ${file.name} importado.` })
      event.target.value = ''
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao importar arquivo.'
      setStatus({ kind: 'error', message })
      event.target.value = ''
    }
  }

  const handleMunicipalTemplateImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !bundle) return

    try {
      const importedBundle = await importMunicipalTemplateWorkbook(file, bundle)
      setBundle(importedBundle)
      setStatus({ kind: 'success', message: `Planilha municipal ${file.name} importada.` })
      event.target.value = ''
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Falha ao importar planilha municipal.'
      setStatus({ kind: 'error', message })
      event.target.value = ''
    }
  }

  const exportWorkbook = () => {
    if (!bundle) return
    void downloadBundleAsWorkbook(bundle)
    setStatus({ kind: 'success', message: 'Planilha exportada.' })
  }

  const exportZip = () => {
    if (!bundle) return
    void downloadBundleAsZip(bundle)
    setStatus({ kind: 'success', message: 'ZIP exportado.' })
  }

  const exportJson = () => {
    if (!bundle) return
    downloadBundleAsJson(bundle)
    setStatus({ kind: 'success', message: 'JSON exportado.' })
  }

  const exportMunicipalTemplate = (variableKey: string, year: number) => {
    if (!bundle) return
    void downloadMunicipalTemplateWorkbook(bundle, variableKey, year)
    setStatus({ kind: 'success', message: 'Modelo municipal exportado.' })
  }

  return {
    handleImport,
    handleMunicipalTemplateImport,
    exportWorkbook,
    exportZip,
    exportJson,
    exportMunicipalTemplate,
  }
}

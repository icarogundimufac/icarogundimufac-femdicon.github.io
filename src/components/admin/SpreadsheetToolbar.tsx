import { type ChangeEvent, type ReactNode, useRef } from 'react'
import {
  Download,
  FileDown,
  FileSpreadsheet,
  FileUp,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface SpreadsheetToolbarProps {
  onImport: (event: ChangeEvent<HTMLInputElement>) => void
  onImportTemplate: (event: ChangeEvent<HTMLInputElement>) => void
  onExportXlsx: () => void
  onExportZip: () => void
  onExportJson: () => void
  onDownloadTemplate: () => void
  onAddRow?: () => void
  onRemoveRow?: () => void
  showTemplateActions?: boolean
  templateLabel?: string
  children?: ReactNode
}

function ToolbarButton({
  children,
  onClick,
  variant = 'default',
  icon: Icon,
}: {
  children: ReactNode
  onClick: () => void
  variant?: 'primary' | 'default' | 'danger'
  icon?: React.ComponentType<{ size?: number }>
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold font-jakarta transition-all duration-100',
        'active:scale-[0.97]',
        variant === 'primary' &&
          'bg-verde-600 text-white shadow-sm hover:bg-verde-700',
        variant === 'default' &&
          'border border-areia-200 bg-white text-areia-600 hover:border-verde-300 hover:text-verde-700 shadow-sm',
        variant === 'danger' &&
          'border border-estrela-400/20 bg-white text-estrela-500 hover:bg-estrela-50 shadow-sm',
      )}
    >
      {Icon && <Icon size={13} />}
      {children}
    </button>
  )
}

function ToolbarFileInput({
  children,
  accept,
  onChange,
  icon: Icon,
}: {
  children: ReactNode
  accept: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  icon?: React.ComponentType<{ size?: number }>
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-1.5 rounded-lg border border-areia-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-areia-600 shadow-sm transition-all duration-100 hover:border-verde-300 hover:text-verde-700 active:scale-[0.97] font-jakarta"
      >
        {Icon && <Icon size={13} />}
        {children}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={onChange}
      />
    </>
  )
}

function Divider() {
  return <div className="mx-1 h-5 w-px bg-areia-200" />
}

function ToolbarGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-1">
      <span className="mr-0.5 text-[9px] font-bold uppercase tracking-[0.15em] text-areia-300 font-jakarta">
        {label}
      </span>
      {children}
    </div>
  )
}

export function SpreadsheetToolbar({
  onImport,
  onImportTemplate,
  onExportXlsx,
  onExportZip,
  onExportJson,
  onDownloadTemplate,
  onAddRow,
  onRemoveRow,
  showTemplateActions = false,
  templateLabel,
  children,
}: SpreadsheetToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-areia-200 bg-gradient-to-b from-areia-50 to-areia-100/40 px-3 py-1.5">
      <ToolbarGroup label="Arquivo">
        <ToolbarFileInput
          accept=".xlsx,.json,.zip"
          onChange={onImport}
          icon={Upload}
        >
          Importar
        </ToolbarFileInput>
      </ToolbarGroup>

      <Divider />

      <ToolbarGroup label="Exportar">
        <ToolbarButton onClick={onExportXlsx} icon={FileSpreadsheet}>
          XLSX
        </ToolbarButton>
        <ToolbarButton onClick={onExportZip} icon={FileDown}>
          ZIP
        </ToolbarButton>
        <ToolbarButton onClick={onExportJson} icon={Download}>
          JSON
        </ToolbarButton>
      </ToolbarGroup>

      {showTemplateActions && (
        <>
          <Divider />
          <ToolbarGroup label="Modelo">
            <ToolbarButton onClick={onDownloadTemplate} variant="primary" icon={FileDown}>
              {templateLabel ?? 'Baixar modelo'}
            </ToolbarButton>
            <ToolbarFileInput
              accept=".xlsx"
              onChange={onImportTemplate}
              icon={FileUp}
            >
              Importar modelo
            </ToolbarFileInput>
          </ToolbarGroup>
        </>
      )}

      <Divider />

      <ToolbarGroup label="Editar">
        {onAddRow && (
          <ToolbarButton onClick={onAddRow} variant="primary" icon={Plus}>
            Linha
          </ToolbarButton>
        )}
        {onRemoveRow && (
          <ToolbarButton onClick={onRemoveRow} variant="danger" icon={Trash2}>
            Remover
          </ToolbarButton>
        )}
      </ToolbarGroup>

      {children && (
        <>
          <Divider />
          {children}
        </>
      )}
    </div>
  )
}

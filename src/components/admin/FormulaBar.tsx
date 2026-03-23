import type { SelectedCell } from './hooks/useSpreadsheetState'

interface FormulaBarProps {
  selectedCell: SelectedCell | null
  sheetLabel: string
  rowCount: number
  contextLabel?: string
}

function getCellRef(rowIndex: number, columnId: string): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const colIndex = columnId.length % letters.length
  return `${letters[colIndex]}${rowIndex + 1}`
}

export function FormulaBar({
  selectedCell,
  sheetLabel,
  rowCount,
  contextLabel,
}: FormulaBarProps) {
  return (
    <div className="flex items-center border-b border-areia-200 bg-areia-50/50">
      <div className="flex h-[30px] w-[60px] shrink-0 items-center justify-center border-r border-areia-200 bg-areia-100/60 text-[11px] font-semibold text-areia-500 font-jakarta tabular-nums">
        {selectedCell ? getCellRef(selectedCell.rowIndex, selectedCell.columnId) : '--'}
      </div>

      <div className="flex h-[30px] w-[28px] shrink-0 items-center justify-center border-r border-areia-200 text-[11px] italic text-areia-300 font-jakarta">
        fx
      </div>

      <div className="flex h-[30px] flex-1 items-center px-3 text-[12px] text-areia-500 font-jakarta truncate">
        {selectedCell && contextLabel ? (
          <span>
            <span className="font-semibold text-areia-700">{sheetLabel}</span>
            <span className="mx-1.5 text-areia-300">&rsaquo;</span>
            <span>{contextLabel}</span>
          </span>
        ) : (
          <span>
            <span className="font-semibold text-areia-600">{sheetLabel}</span>
            <span className="mx-1.5 text-areia-300">&mdash;</span>
            <span className="tabular-nums">{rowCount} registros</span>
          </span>
        )}
      </div>
    </div>
  )
}

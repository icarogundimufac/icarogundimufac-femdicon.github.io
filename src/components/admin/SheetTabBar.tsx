import { cn } from '@/lib/utils/cn'
import type { SheetId } from './hooks/useSpreadsheetState'
import { SHEET_DEFINITIONS } from './hooks/useSpreadsheetState'

interface SheetTabBarProps {
  activeSheet: SheetId
  onSheetChange: (sheetId: SheetId) => void
  rowCounts: Record<SheetId, number>
}

export function SheetTabBar({ activeSheet, onSheetChange, rowCounts }: SheetTabBarProps) {
  return (
    <div className="flex items-end gap-0 border-t border-areia-200 bg-areia-100/80 px-1 pt-1">
      {SHEET_DEFINITIONS.map((sheet) => {
        const isActive = activeSheet === sheet.id
        const count = rowCounts[sheet.id] ?? 0

        return (
          <button
            key={sheet.id}
            type="button"
            onClick={() => onSheetChange(sheet.id)}
            className={cn(
              'group relative flex items-center gap-1.5 px-4 py-2 text-[12px] font-jakarta font-semibold tracking-wide transition-all duration-150',
              'rounded-t-lg border border-b-0',
              isActive
                ? 'border-areia-200 bg-white text-verde-700 shadow-sm z-10 -mb-px'
                : 'border-transparent bg-transparent text-areia-400 hover:text-areia-600 hover:bg-areia-50/60',
            )}
          >
            <span className="whitespace-nowrap">{sheet.label}</span>
            <span
              className={cn(
                'text-[10px] tabular-nums',
                isActive ? 'text-verde-400' : 'text-areia-300 group-hover:text-areia-400',
              )}
            >
              {count}
            </span>
            {isActive && (
              <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-verde-500" />
            )}
          </button>
        )
      })}

      <div className="flex-1" />

      <div className="px-3 py-2 text-[10px] text-areia-300 font-jakarta tabular-nums">
        {SHEET_DEFINITIONS.length} abas
      </div>
    </div>
  )
}

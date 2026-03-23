import { useCallback, useEffect, useRef, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table'
import { cn } from '@/lib/utils/cn'
import type { SelectedCell } from './hooks/useSpreadsheetState'

export interface GridColumn<T> {
  id: string
  header: string
  accessor: (row: T) => unknown
  editable?: boolean
  type?: 'text' | 'number' | 'select'
  options?: Array<{ value: string; label: string }>
  width?: number
}

interface SpreadsheetGridProps<T extends { rowId: string }> {
  data: T[]
  columns: GridColumn<T>[]
  emptyMessage: string
  selectedCell: SelectedCell | null
  editingCell: SelectedCell | null
  onSelectCell: (rowIndex: number, columnId: string) => void
  onStartEditing: (rowIndex: number, columnId: string) => void
  onStopEditing: () => void
  onCellChange?: (rowId: string, columnId: string, value: string) => void
  rowActions?: (row: T) => React.ReactNode
}

function EditableCell({
  value,
  type,
  options,
  onCommit,
  onCancel,
}: {
  value: string
  type: 'text' | 'number' | 'select'
  options?: Array<{ value: string; label: string }>
  onCommit: (value: string) => void
  onCancel: () => void
}) {
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null)
  const [localValue, setLocalValue] = useState(value)

  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.focus()
    if (el instanceof HTMLInputElement) {
      el.select()
    }
  }, [])

  if (type === 'select' && options) {
    return (
      <select
        ref={inputRef as React.RefObject<HTMLSelectElement>}
        value={localValue}
        onChange={(e) => {
          setLocalValue(e.currentTarget.value)
          onCommit(e.currentTarget.value)
        }}
        onBlur={() => onCommit(localValue)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onCancel()
        }}
        className="w-full bg-transparent px-1.5 py-0.5 text-[12px] text-areia-800 font-jakarta outline-none"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    )
  }

  return (
    <input
      ref={inputRef as React.RefObject<HTMLInputElement>}
      type={type === 'number' ? 'number' : 'text'}
      step={type === 'number' ? 'any' : undefined}
      value={localValue}
      onChange={(e) => setLocalValue(e.currentTarget.value)}
      onBlur={() => onCommit(localValue)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          onCommit(localValue)
        }
        if (e.key === 'Escape') {
          e.preventDefault()
          onCancel()
        }
        if (e.key === 'Tab') {
          onCommit(localValue)
        }
      }}
      className="w-full bg-transparent px-1.5 py-0.5 text-[12px] text-areia-800 font-jakarta outline-none tabular-nums"
    />
  )
}

export function SpreadsheetGrid<T extends { rowId: string }>({
  data,
  columns,
  emptyMessage,
  selectedCell,
  editingCell,
  onSelectCell,
  onStartEditing,
  onStopEditing,
  onCellChange,
  rowActions,
}: SpreadsheetGridProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!selectedCell || editingCell) return

      const colIds = columns.map((c) => c.id)
      const colIndex = colIds.indexOf(selectedCell.columnId)

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          if (selectedCell.rowIndex < data.length - 1) {
            onSelectCell(selectedCell.rowIndex + 1, selectedCell.columnId)
          }
          break
        case 'ArrowUp':
          e.preventDefault()
          if (selectedCell.rowIndex > 0) {
            onSelectCell(selectedCell.rowIndex - 1, selectedCell.columnId)
          }
          break
        case 'ArrowRight':
          e.preventDefault()
          if (colIndex < colIds.length - 1) {
            onSelectCell(selectedCell.rowIndex, colIds[colIndex + 1])
          }
          break
        case 'ArrowLeft':
          e.preventDefault()
          if (colIndex > 0) {
            onSelectCell(selectedCell.rowIndex, colIds[colIndex - 1])
          }
          break
        case 'Enter':
        case 'F2': {
          e.preventDefault()
          const col = columns.find((c) => c.id === selectedCell.columnId)
          if (col?.editable) {
            onStartEditing(selectedCell.rowIndex, selectedCell.columnId)
          }
          break
        }
        case 'Tab': {
          e.preventDefault()
          const nextIndex = e.shiftKey ? colIndex - 1 : colIndex + 1
          if (nextIndex >= 0 && nextIndex < colIds.length) {
            onSelectCell(selectedCell.rowIndex, colIds[nextIndex])
          } else if (!e.shiftKey && selectedCell.rowIndex < data.length - 1) {
            onSelectCell(selectedCell.rowIndex + 1, colIds[0])
          }
          break
        }
      }
    },
    [selectedCell, editingCell, columns, data.length, onSelectCell, onStartEditing],
  )

  const tableColumns: Array<ColumnDef<T>> = [
    {
      id: '__rowNum',
      header: '',
      size: 40,
      cell: ({ row }) => (
        <span className="block text-center text-[10px] tabular-nums text-areia-400 font-jakarta select-none">
          {row.index + 1}
        </span>
      ),
    },
    ...columns.map((column) => ({
      id: column.id,
      header: column.header,
      size: column.width,
      accessorFn: column.accessor,
      cell: ({ row }: { row: { index: number; original: T }; getValue: () => unknown }) => {
        const value = column.accessor(row.original)
        const isSelected =
          selectedCell?.rowIndex === row.index &&
          selectedCell?.columnId === column.id
        const isEditing =
          editingCell?.rowIndex === row.index &&
          editingCell?.columnId === column.id

        if (isEditing && column.editable && onCellChange) {
          return (
            <EditableCell
              value={String(value ?? '')}
              type={column.type ?? 'text'}
              options={column.options}
              onCommit={(nextValue) => {
                onCellChange(row.original.rowId, column.id, nextValue)
                onStopEditing()
              }}
              onCancel={onStopEditing}
            />
          )
        }

        return (
          <div
            className={cn(
              'cursor-default select-none truncate px-1.5 py-0.5 text-[12px] font-jakarta',
              column.type === 'number' ? 'text-right tabular-nums' : 'text-left',
              isSelected ? 'text-areia-900' : 'text-areia-700',
            )}
            onClick={() => onSelectCell(row.index, column.id)}
            onDoubleClick={() => {
              if (column.editable && onCellChange) {
                onStartEditing(row.index, column.id)
              }
            }}
          >
            {String(value ?? '')}
          </div>
        )
      },
    })),
  ]

  if (rowActions) {
    tableColumns.push({
      id: '__actions',
      header: '',
      size: 60,
      cell: ({ row }) => (
        <div className="flex justify-center">
          {rowActions(row.original)}
        </div>
      ),
    })
  }

  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-auto focus:outline-none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <table className="w-full border-collapse">
        <thead className="sticky top-0 z-10">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  style={{ width: header.getSize() }}
                  className={cn(
                    'border-b border-r border-areia-200 bg-areia-100 px-2 py-1.5',
                    'text-left text-[10px] font-bold uppercase tracking-[0.12em] text-areia-500 font-jakarta whitespace-nowrap',
                    header.id === '__rowNum' && 'bg-areia-100/80 text-center w-[40px]',
                    header.id === '__actions' && 'w-[60px] text-center',
                    selectedCell?.columnId === header.id && 'bg-verde-50/60',
                  )}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.length === 0 ? (
            <tr>
              <td
                colSpan={tableColumns.length}
                className="px-4 py-12 text-center text-[12px] text-areia-400 font-jakarta"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => {
              const isRowSelected = selectedCell?.rowIndex === row.index

              return (
                <tr
                  key={row.id}
                  className={cn(
                    'transition-colors duration-75',
                    isRowSelected
                      ? 'bg-verde-50/30'
                      : row.index % 2 === 0
                        ? 'bg-white'
                        : 'bg-areia-50/30',
                  )}
                >
                  {row.getVisibleCells().map((cell) => {
                    const isSelected =
                      selectedCell?.rowIndex === row.index &&
                      selectedCell?.columnId === cell.column.id
                    const isRowNumCol = cell.column.id === '__rowNum'
                    const isActionsCol = cell.column.id === '__actions'

                    return (
                      <td
                        key={cell.id}
                        className={cn(
                          'border-b border-r border-areia-200/70 px-0 py-0 align-middle',
                          isRowNumCol && 'bg-areia-100/40 border-areia-200',
                          isActionsCol && 'px-1',
                          isSelected && !isRowNumCol && !isActionsCol &&
                            'ring-2 ring-inset ring-verde-400 bg-white',
                          !isSelected && !isRowNumCol && !isActionsCol &&
                            'hover:bg-areia-50/50',
                        )}
                        onClick={() => {
                          if (!isRowNumCol && !isActionsCol) {
                            onSelectCell(row.index, cell.column.id)
                          }
                        }}
                        onDoubleClick={() => {
                          if (!isRowNumCol && !isActionsCol) {
                            const col = columns.find((c) => c.id === cell.column.id)
                            if (col?.editable && onCellChange) {
                              onStartEditing(row.index, cell.column.id)
                            }
                          }
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    )
                  })}
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}

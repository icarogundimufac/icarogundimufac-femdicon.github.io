import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table'

export interface EditableColumn<T extends { rowId: string }> {
  id: string
  header: string
  accessor: (row: T) => unknown
  editable?: boolean
  type?: 'text' | 'number' | 'select'
  options?: Array<{ value: string; label: string }>
  inputClassName?: string
}

interface EditableDataTableProps<T extends { rowId: string }> {
  data: T[]
  columns: EditableColumn<T>[]
  emptyMessage: string
  onCellChange?: (rowId: string, columnId: string, value: string) => void
  rowActions?: (row: T) => React.ReactNode
}

export function EditableDataTable<T extends { rowId: string }>({
  data,
  columns,
  emptyMessage,
  onCellChange,
  rowActions,
}: EditableDataTableProps<T>) {
  const tableColumns: Array<ColumnDef<T>> = columns.map((column) => ({
    id: column.id,
    header: column.header,
    accessorFn: column.accessor,
    cell: ({ row, getValue }) => {
      const value = getValue()

      if (!column.editable || !onCellChange) {
        return (
          <span className="block text-sm text-areia-700 font-jakarta whitespace-nowrap">
            {String(value ?? '')}
          </span>
        )
      }

      if (column.type === 'select') {
        return (
          <select
            defaultValue={String(value ?? '')}
            onChange={(event) =>
              onCellChange(row.original.rowId, column.id, event.currentTarget.value)
            }
            className="w-full rounded-md border border-areia-200 bg-white px-2 py-1.5 text-sm text-areia-700 font-jakarta"
          >
            {column.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )
      }

      return (
        <input
          type={column.type === 'number' ? 'number' : 'text'}
          step={column.type === 'number' ? 'any' : undefined}
          defaultValue={String(value ?? '')}
          onBlur={(event) =>
            onCellChange(row.original.rowId, column.id, event.currentTarget.value)
          }
          className={`w-full rounded-md border border-areia-200 bg-white px-2 py-1.5 text-sm text-areia-700 font-jakarta ${column.inputClassName ?? ''}`}
        />
      )
    },
  }))

  if (rowActions) {
    tableColumns.push({
      id: 'actions',
      header: 'Ações',
      cell: ({ row }) => rowActions(row.original),
    })
  }

  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="overflow-x-auto rounded-xl border border-areia-200 bg-white shadow-sm">
      <table className="min-w-full border-collapse">
        <thead className="bg-areia-100/80">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="border-b border-areia-200 px-3 py-2 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-areia-500 font-jakarta whitespace-nowrap"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
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
                className="px-4 py-8 text-center text-sm text-areia-400 font-jakarta"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="odd:bg-white even:bg-areia-50/40">
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="border-b border-areia-100 px-3 py-2 align-top"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

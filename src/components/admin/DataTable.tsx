import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'

export interface Column<T> {
  key: keyof T | string
  label: string
  render?: (row: T) => ReactNode
  width?: string
}

interface DataTableProps<T extends { id: string | number }> {
  rows: T[]
  columns: Column<T>[]
  loading?: boolean
  emptyMessage?: string
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
}

export function DataTable<T extends { id: string | number }>({
  rows,
  columns,
  loading = false,
  emptyMessage = 'Nenhum registro.',
  onEdit,
  onDelete,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-champagne/20 bg-midnight/40 p-8 text-center text-slate">
        Carregando...
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-champagne/20 bg-midnight/40 p-8 text-center text-slate">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-champagne/20 bg-midnight/40">
      <table className="w-full text-sm">
        <thead className="border-b border-champagne/20 text-left">
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className="px-4 py-3 font-sans text-xs uppercase tracking-widest text-champagne"
                style={{ width: col.width }}
              >
                {col.label}
              </th>
            ))}
            {(onEdit || onDelete) && <th className="px-4 py-3 w-32"></th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-champagne/5 last:border-0 hover:bg-champagne/5">
              {columns.map((col) => (
                <td key={String(col.key)} className="px-4 py-3 text-ivory">
                  {col.render ? col.render(row) : String(row[col.key as keyof T] ?? '—')}
                </td>
              ))}
              {(onEdit || onDelete) && (
                <td className="px-4 py-3 text-right">
                  <div className="flex gap-2 justify-end">
                    {onEdit && (
                      <Button variant="ghost" size="sm" onClick={() => onEdit(row)}>
                        Editar
                      </Button>
                    )}
                    {onDelete && (
                      <Button variant="destructive" size="sm" onClick={() => onDelete(row)}>
                        Excluir
                      </Button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

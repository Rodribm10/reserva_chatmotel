import { useMemo, useState } from 'react'
import type { Database } from '@/types/database'
import { useCrud } from '@/hooks/useCrud'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { formatBRL } from '@/lib/formatters'

type Reserva = Database['reserva_hotel']['Tables']['reservas']['Row']

const CHATWOOT_URL = import.meta.env.VITE_CHATWOOT_API_URL || ''

export function ReservasTab() {
  const { rows, loading, error } = useCrud<Reserva>('reservas', {
    orderBy: 'created_at',
    ascending: false,
  })

  const [statusFilter, setStatusFilter] = useState<string>('')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (statusFilter && r.status !== statusFilter) return false
      if (dateFrom && r.data_checkin < dateFrom) return false
      if (dateTo && r.data_checkin > dateTo + 'T23:59:59') return false
      return true
    })
  }, [rows, statusFilter, dateFrom, dateTo])

  const columns: Column<Reserva>[] = [
    {
      key: 'data_checkin',
      label: 'Check-in',
      render: (r) => new Date(r.data_checkin).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }),
    },
    { key: 'nome_cliente', label: 'Cliente' },
    { key: 'tipo_permanencia', label: 'Permanência' },
    {
      key: 'valor_total',
      label: 'Valor',
      render: (r) => formatBRL(Math.round(Number(r.valor_total) * 100)),
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: 'chatwoot_conversation_id',
      label: 'Conversa',
      render: (r) =>
        r.chatwoot_conversation_id && CHATWOOT_URL ? (
          <a
            href={`${CHATWOOT_URL}/app/accounts/1/conversations/${r.chatwoot_conversation_id}`}
            target="_blank"
            rel="noreferrer"
            className="text-champagne hover:underline"
          >
            #{r.chatwoot_conversation_id}
          </a>
        ) : '—',
    },
  ]

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-3xl text-gradient-gold mb-2">Reservas</h1>
        <p className="text-slate text-sm">Histórico de reservas da sua rede (somente leitura).</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-2xl border border-champagne/20 bg-midnight/40 p-4">
        <div>
          <label className="font-sans text-xs uppercase tracking-widest text-champagne">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="mt-2 w-full rounded-lg border border-champagne/30 bg-midnight/60 px-4 py-3 text-ivory focus:border-champagne focus:outline-none"
          >
            <option value="">Todos</option>
            <option value="pendente_pagamento">Pendente de pagamento</option>
            <option value="pago">Pago</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>
        <div>
          <label className="font-sans text-xs uppercase tracking-widest text-champagne">Check-in de</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="mt-2 w-full rounded-lg border border-champagne/30 bg-midnight/60 px-4 py-3 text-ivory focus:border-champagne focus:outline-none"
          />
        </div>
        <div>
          <label className="font-sans text-xs uppercase tracking-widest text-champagne">Até</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="mt-2 w-full rounded-lg border border-champagne/30 bg-midnight/60 px-4 py-3 text-ivory focus:border-champagne focus:outline-none"
          />
        </div>
      </div>

      {error && <div className="rounded-xl border border-ruby/40 bg-ruby/10 p-4 text-ivory">{error}</div>}

      <DataTable
        rows={filtered}
        columns={columns}
        loading={loading}
        emptyMessage="Nenhuma reserva encontrada."
      />
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pago: 'text-emerald border-emerald/40 bg-emerald/10',
    pendente_pagamento: 'text-champagne border-champagne/40 bg-champagne/10',
    cancelada: 'text-slate border-slate/40 bg-slate/10',
  }
  const cls = colors[status] ?? 'text-slate border-slate/40 bg-slate/10'
  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-sans uppercase tracking-widest ${cls}`}>
      {status}
    </span>
  )
}

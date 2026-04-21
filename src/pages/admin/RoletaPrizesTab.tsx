import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useTenantId } from '@/hooks/useAppConfig'
import type { Database } from '@/types/database'
import { useCrud } from '@/hooks/useCrud'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { Modal } from '@/components/admin/Modal'
import { FormField } from '@/components/FormField'
import { SelectField } from '@/components/SelectField'
import { Button } from '@/components/ui/button'

type Marca = Database['reserva_hotel']['Tables']['marcas']['Row']

interface RoulettePrize {
  id: string
  tenant_id: number
  id_marca: string | null
  nome: string
  tipo: 'desconto_percentual' | 'brinde_fisico' | 'nada'
  valor: number | null
  probabilidade: number
  estoque: number | null
  ativo: boolean
  created_at: string
  updated_at: string
}

const TIPO_OPTIONS = [
  { value: 'desconto_percentual', label: 'Desconto %' },
  { value: 'brinde_fisico', label: 'Brinde físico' },
  { value: 'nada', label: 'Sem sorte (nada)' },
]

const EMPTY_FORM = {
  id_marca: '',
  nome: '',
  tipo: 'desconto_percentual' as RoulettePrize['tipo'],
  valor: '',
  probabilidade: '10',
  estoque: '',
  ativo: true,
}

export function RoletaPrizesTab() {
  const tenantId = useTenantId()
  const { rows, loading, error, create, update, remove } = useCrud<RoulettePrize>(
    'roulette_prizes',
    { orderBy: 'created_at', ascending: true }
  )

  const [marcas, setMarcas] = useState<Marca[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<RoulettePrize | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [marcaFiltro, setMarcaFiltro] = useState<string>('')

  useEffect(() => {
    if (!tenantId) return
    void supabase
      .from('marcas')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('nome')
      .then(({ data }) => setMarcas(data ?? []))
  }, [tenantId])

  const filteredRows = useMemo(
    () => (marcaFiltro ? rows.filter((r) => r.id_marca === marcaFiltro) : rows),
    [rows, marcaFiltro]
  )

  const totalPesoAtivo = useMemo(
    () =>
      filteredRows
        .filter((r) => r.ativo)
        .reduce((sum, r) => sum + Number(r.probabilidade || 0), 0),
    [filteredRows]
  )

  const validacaoRoleta = useMemo(() => {
    const ativos = filteredRows.filter((r) => r.ativo)
    if (ativos.length === 0) return { ok: false, msg: 'Nenhum prêmio ativo — a roleta não vai funcionar.' }
    const temGanho = ativos.some((r) => r.tipo !== 'nada')
    if (!temGanho) {
      return {
        ok: false,
        msg: 'Todos os prêmios ativos são do tipo "nada". Adicione ao menos 1 desconto ou brinde.',
      }
    }
    return { ok: true, msg: `Roleta terá ${ativos.length} bloco(s) visualmente iguais.` }
  }, [filteredRows])

  const openCreate = () => {
    setEditing(null)
    setForm({ ...EMPTY_FORM, id_marca: marcaFiltro || '' })
    setFormError(null)
    setModalOpen(true)
  }

  const openEdit = (prize: RoulettePrize) => {
    setEditing(prize)
    setForm({
      id_marca: prize.id_marca ?? '',
      nome: prize.nome,
      tipo: prize.tipo,
      valor: prize.valor != null ? String(prize.valor) : '',
      probabilidade: String(prize.probabilidade),
      estoque: prize.estoque != null ? String(prize.estoque) : '',
      ativo: prize.ativo,
    })
    setFormError(null)
    setModalOpen(true)
  }

  const handleDelete = async (prize: RoulettePrize) => {
    if (!confirm(`Excluir o prêmio "${prize.nome}"?`)) return
    try {
      await remove(prize.id)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao excluir')
    }
  }

  const handleSave = async () => {
    if (!form.nome.trim()) {
      setFormError('Nome é obrigatório')
      return
    }
    const prob = Number(form.probabilidade.replace(',', '.'))
    if (isNaN(prob) || prob < 0) {
      setFormError('Probabilidade (peso) inválida')
      return
    }
    let valor: number | null = null
    if (form.tipo === 'desconto_percentual') {
      valor = Number(form.valor.replace(',', '.'))
      if (isNaN(valor) || valor <= 0 || valor > 100) {
        setFormError('Desconto % deve ser entre 0 e 100')
        return
      }
    }
    let estoque: number | null = null
    if (form.tipo === 'brinde_fisico' && form.estoque.trim()) {
      estoque = Number(form.estoque)
      if (isNaN(estoque) || estoque < 0) {
        setFormError('Estoque inválido')
        return
      }
    }
    setSaving(true)
    setFormError(null)
    try {
      const payload = {
        id_marca: form.id_marca || null,
        nome: form.nome.trim(),
        tipo: form.tipo,
        valor,
        probabilidade: prob,
        estoque,
        ativo: form.ativo,
      }
      if (editing) {
        await update(editing.id, payload)
      } else {
        await create(payload)
      }
      setModalOpen(false)
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const columns: Column<RoulettePrize>[] = [
    { key: 'nome', label: 'Nome' },
    {
      key: 'tipo',
      label: 'Tipo',
      render: (row) => TIPO_OPTIONS.find((t) => t.value === row.tipo)?.label ?? row.tipo,
    },
    {
      key: 'valor',
      label: 'Valor',
      render: (row) => (row.tipo === 'desconto_percentual' ? `${row.valor}%` : '—'),
    },
    {
      key: 'probabilidade',
      label: 'Peso',
      render: (row) => {
        if (!row.ativo || totalPesoAtivo === 0) {
          return <span className="text-slate-400">{row.probabilidade}</span>
        }
        const pct = (Number(row.probabilidade) / totalPesoAtivo) * 100
        return (
          <span>
            {row.probabilidade} <span className="text-slate-400">({pct.toFixed(1)}%)</span>
          </span>
        )
      },
    },
    {
      key: 'estoque',
      label: 'Estoque',
      render: (row) => (row.estoque == null ? 'Ilimitado' : String(row.estoque)),
    },
    {
      key: 'id_marca',
      label: 'Marca',
      render: (row) =>
        row.id_marca ? marcas.find((m) => m.id === row.id_marca)?.nome ?? '—' : 'Todas',
    },
    {
      key: 'ativo',
      label: 'Status',
      render: (row) => (
        <span className={row.ativo ? 'text-emerald-400' : 'text-slate-400'}>
          {row.ativo ? 'Ativo' : 'Inativo'}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-champagne mb-2">Roleta — Prêmios</h1>
          <p className="text-slate-400 text-sm">
            Cada prêmio ativo vira um bloco da roleta (visualmente todos iguais). O peso controla a
            chance de cair em cada um — o % de chance é calculado automaticamente.
          </p>
        </div>
        <Button variant="primary" onClick={openCreate}>+ Novo prêmio</Button>
      </header>

      <div className="flex items-end gap-4">
        <div className="min-w-[240px]">
          <SelectField
            label="Filtrar por marca"
            value={marcaFiltro}
            onChange={(e) => setMarcaFiltro(e.target.value)}
            options={[
              { value: '', label: 'Todas as marcas' },
              ...marcas.map((m) => ({ value: m.id, label: m.nome })),
            ]}
          />
        </div>
        <div
          className={`flex-1 rounded-xl border p-3 text-sm ${
            validacaoRoleta.ok
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
              : 'border-amber-500/40 bg-amber-500/10 text-amber-200'
          }`}
        >
          {validacaoRoleta.msg}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-ivory">{error}</div>
      )}

      <DataTable
        rows={filteredRows}
        columns={columns}
        loading={loading}
        emptyMessage='Nenhum prêmio cadastrado. Clique em "+ Novo prêmio" para começar.'
        onEdit={openEdit}
        onDelete={handleDelete}
      />

      <Modal
        open={modalOpen}
        title={editing ? 'Editar prêmio' : 'Novo prêmio'}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </>
        }
      >
        <SelectField
          label="Marca"
          value={form.id_marca}
          onChange={(e) => setForm({ ...form, id_marca: e.target.value })}
          options={[
            { value: '', label: 'Todas as marcas do tenant' },
            ...marcas.map((m) => ({ value: m.id, label: m.nome })),
          ]}
        />

        <FormField
          label="Nome do prêmio"
          required
          value={form.nome}
          onChange={(e) => setForm({ ...form, nome: e.target.value })}
          placeholder='Ex: "10% de desconto", "Cerveja Heineken", "Tente de novo"'
        />

        <SelectField
          label="Tipo"
          required
          value={form.tipo}
          onChange={(e) =>
            setForm({
              ...form,
              tipo: e.target.value as RoulettePrize['tipo'],
              valor: '',
              estoque: '',
            })
          }
          options={TIPO_OPTIONS}
        />

        {form.tipo === 'desconto_percentual' && (
          <FormField
            label="% de desconto"
            required
            type="text"
            inputMode="decimal"
            value={form.valor}
            onChange={(e) => setForm({ ...form, valor: e.target.value })}
            placeholder="Ex: 5, 10, 15"
          />
        )}

        {form.tipo === 'brinde_fisico' && (
          <FormField
            label="Estoque (vazio = ilimitado)"
            type="number"
            value={form.estoque}
            onChange={(e) => setForm({ ...form, estoque: e.target.value })}
            placeholder="Ex: 20"
          />
        )}

        <FormField
          label="Peso (probabilidade relativa)"
          required
          type="text"
          inputMode="decimal"
          value={form.probabilidade}
          onChange={(e) => setForm({ ...form, probabilidade: e.target.value })}
          placeholder="Ex: 10"
        />
        <p className="text-xs text-slate-400 -mt-3">
          Quanto maior o peso, maior a chance desse prêmio sair. Números relativos aos demais — não
          precisa somar 100.
        </p>

        <label className="flex items-center gap-3 text-ivory font-sans text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={form.ativo}
            onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
            className="h-4 w-4 accent-champagne"
          />
          Ativo (entra na roleta)
        </label>

        {formError && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-ivory text-sm">
            {formError}
          </div>
        )}
      </Modal>
    </div>
  )
}

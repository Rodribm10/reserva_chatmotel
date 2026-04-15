import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useTenantId } from '@/hooks/useAppConfig'
import type { Database } from '@/types/database'
import { useCrud } from '@/hooks/useCrud'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { Modal } from '@/components/admin/Modal'
import { FormField } from '@/components/FormField'
import { SelectField } from '@/components/SelectField'
import { Button } from '@/components/ui/button'
import { formatBRL } from '@/lib/formatters'

type Extra = Database['reserva_hotel']['Tables']['extras']['Row']
type Marca = Database['reserva_hotel']['Tables']['marcas']['Row']

const EMPTY_FORM = {
  id_marca: '',
  titulo: '',
  descricao: '',
  preco: '',
  imagem_url: '',
  ordem: '0',
  ativo: true,
}

export function ExtrasTab() {
  const tenantId = useTenantId()
  const { rows, loading, error, create, update, remove } = useCrud<Extra>('extras', {
    orderBy: 'ordem',
    ascending: true,
  })

  const [marcas, setMarcas] = useState<Marca[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Extra | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (!tenantId) return
    void supabase
      .from('marcas')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('nome')
      .then(({ data }) => setMarcas(data ?? []))
  }, [tenantId])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setModalOpen(true)
  }

  const openEdit = (extra: Extra) => {
    setEditing(extra)
    setForm({
      id_marca: extra.id_marca,
      titulo: extra.titulo,
      descricao: extra.descricao ?? '',
      preco: String(extra.preco),
      imagem_url: extra.imagem_url ?? '',
      ordem: String(extra.ordem),
      ativo: extra.ativo,
    })
    setFormError(null)
    setModalOpen(true)
  }

  const handleDelete = async (extra: Extra) => {
    if (!confirm(`Excluir o extra "${extra.titulo}"?`)) return
    try {
      await remove(extra.id)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao excluir')
    }
  }

  const handleSave = async () => {
    if (!form.titulo.trim()) {
      setFormError('Título é obrigatório')
      return
    }
    if (!form.id_marca) {
      setFormError('Marca é obrigatória')
      return
    }
    const preco = Number(form.preco.replace(',', '.'))
    if (isNaN(preco) || preco < 0) {
      setFormError('Preço inválido')
      return
    }
    setSaving(true)
    setFormError(null)
    try {
      const payload = {
        id_marca: form.id_marca,
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim() || null,
        preco,
        imagem_url: form.imagem_url.trim() || null,
        ordem: Number(form.ordem) || 0,
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

  const columns: Column<Extra>[] = [
    { key: 'titulo', label: 'Título' },
    {
      key: 'id_marca',
      label: 'Marca',
      render: (row) => marcas.find((m) => m.id === row.id_marca)?.nome ?? '—',
    },
    {
      key: 'preco',
      label: 'Preço',
      render: (row) => formatBRL(Math.round(Number(row.preco) * 100)),
    },
    { key: 'ordem', label: 'Ordem', render: (row) => String(row.ordem) },
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
          <h1 className="font-serif text-3xl text-champagne mb-2">Extras</h1>
          <p className="text-slate-400 text-sm">Serviços e produtos extras oferecidos na reserva.</p>
        </div>
        <Button variant="primary" onClick={openCreate}>+ Novo extra</Button>
      </header>

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-ivory">{error}</div>
      )}

      <DataTable
        rows={rows}
        columns={columns}
        loading={loading}
        emptyMessage='Nenhum extra cadastrado. Clique em "+ Novo extra" para começar.'
        onEdit={openEdit}
        onDelete={handleDelete}
      />

      <Modal
        open={modalOpen}
        title={editing ? 'Editar extra' : 'Novo extra'}
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
          required
          value={form.id_marca}
          onChange={(e) => setForm({ ...form, id_marca: e.target.value })}
          options={marcas.map((m) => ({ value: m.id, label: m.nome }))}
        />

        <FormField
          label="Título"
          required
          value={form.titulo}
          onChange={(e) => setForm({ ...form, titulo: e.target.value })}
          placeholder="Ex: Café da manhã, Espumante, Jacuzzi"
        />

        <FormField
          label="Descrição"
          value={form.descricao}
          onChange={(e) => setForm({ ...form, descricao: e.target.value })}
          placeholder="Breve descrição do extra"
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Preço (R$)"
            type="text"
            inputMode="decimal"
            value={form.preco}
            onChange={(e) => setForm({ ...form, preco: e.target.value })}
            placeholder="0.00"
          />
          <FormField
            label="Ordem"
            type="number"
            value={form.ordem}
            onChange={(e) => setForm({ ...form, ordem: e.target.value })}
            placeholder="0"
          />
        </div>

        <FormField
          label="URL da imagem"
          value={form.imagem_url}
          onChange={(e) => setForm({ ...form, imagem_url: e.target.value })}
          placeholder="https://..."
        />

        <label className="flex items-center gap-3 text-ivory font-sans text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={form.ativo}
            onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
            className="h-4 w-4 accent-champagne"
          />
          Ativo
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

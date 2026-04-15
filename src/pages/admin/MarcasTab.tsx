import { useState } from 'react'
import type { Database } from '@/types/database'
import { useCrud } from '@/hooks/useCrud'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { Modal } from '@/components/admin/Modal'
import { FormField } from '@/components/FormField'
import { Button } from '@/components/ui/button'

type Marca = Database['reserva_hotel']['Tables']['marcas']['Row']

const EMPTY_FORM = {
  nome: '',
  descricao: '',
  categoriasText: '',
  permanenciasText: '',
  ativa: true,
}

export function MarcasTab() {
  const { rows, loading, error, create, update, remove } = useCrud<Marca>('marcas', {
    orderBy: 'nome',
    ascending: true,
  })

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Marca | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setModalOpen(true)
  }

  const openEdit = (marca: Marca) => {
    setEditing(marca)
    setForm({
      nome: marca.nome,
      descricao: marca.descricao ?? '',
      categoriasText: (marca.categorias ?? []).join(', '),
      permanenciasText: (marca.permanencias ?? []).join(', '),
      ativa: marca.ativa ?? true,
    })
    setFormError(null)
    setModalOpen(true)
  }

  const handleDelete = async (marca: Marca) => {
    if (!confirm(`Excluir a marca "${marca.nome}"? Essa ação é irreversível.`)) return
    try {
      await remove(marca.id)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao excluir')
    }
  }

  const handleSave = async () => {
    if (!form.nome.trim()) {
      setFormError('Nome é obrigatório')
      return
    }
    setSaving(true)
    setFormError(null)
    try {
      const payload = {
        nome: form.nome.trim(),
        descricao: form.descricao.trim() || null,
        categorias: parseList(form.categoriasText),
        permanencias: parseList(form.permanenciasText),
        ativa: form.ativa,
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

  const columns: Column<Marca>[] = [
    { key: 'nome', label: 'Nome' },
    {
      key: 'categorias',
      label: 'Categorias',
      render: (row) => (row.categorias ?? []).join(', ') || '—',
    },
    {
      key: 'permanencias',
      label: 'Permanências',
      render: (row) => (row.permanencias ?? []).join(', ') || '—',
    },
    {
      key: 'ativa',
      label: 'Status',
      render: (row) => (
        <span className={row.ativa ? 'text-emerald-400' : 'text-slate-400'}>
          {row.ativa ? 'Ativa' : 'Inativa'}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-champagne mb-2">Marcas</h1>
          <p className="text-slate-400 text-sm">Gerencie as marcas (redes) desta conta.</p>
        </div>
        <Button variant="primary" onClick={openCreate}>+ Nova marca</Button>
      </header>

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-ivory">{error}</div>
      )}

      <DataTable
        rows={rows}
        columns={columns}
        loading={loading}
        emptyMessage='Nenhuma marca cadastrada. Clique em "+ Nova marca" para começar.'
        onEdit={openEdit}
        onDelete={handleDelete}
      />

      <Modal
        open={modalOpen}
        title={editing ? 'Editar marca' : 'Nova marca'}
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
        <FormField
          label="Nome da marca"
          required
          value={form.nome}
          onChange={(e) => setForm({ ...form, nome: e.target.value })}
          placeholder="Ex: Hotel 1001 Noites Prime"
        />
        <FormField
          label="Descrição"
          value={form.descricao}
          onChange={(e) => setForm({ ...form, descricao: e.target.value })}
          placeholder="Breve descrição"
        />
        <FormField
          label="Categorias disponíveis (separadas por vírgula)"
          value={form.categoriasText}
          onChange={(e) => setForm({ ...form, categoriasText: e.target.value })}
          placeholder="Alexa, Stilo, Hidromassagem"
        />
        <FormField
          label="Permanências disponíveis (separadas por vírgula)"
          value={form.permanenciasText}
          onChange={(e) => setForm({ ...form, permanenciasText: e.target.value })}
          placeholder="2hrs, 3hrs, 4hrs, Pernoite, Diária"
        />
        <label className="flex items-center gap-3 text-ivory font-sans text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={form.ativa}
            onChange={(e) => setForm({ ...form, ativa: e.target.checked })}
            className="h-4 w-4 accent-champagne"
          />
          Ativa
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

function parseList(text: string): string[] {
  return text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

import { useEffect, useState } from 'react'
import type { Database } from '@/types/database'
import { useCrud } from '@/hooks/useCrud'
import { useTenantId } from '@/hooks/useAppConfig'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { Modal } from '@/components/admin/Modal'
import { FormField } from '@/components/FormField'
import { SelectField } from '@/components/SelectField'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

type Unidade = Database['reserva_hotel']['Tables']['unidades']['Row']
type Marca = Database['reserva_hotel']['Tables']['marcas']['Row']
type Conta = Database['reserva_hotel']['Tables']['contas_pagamento']['Row']

const EMPTY_FORM = {
  nome: '',
  id_marca: '',
  id_conta_pagamento: '',
  chatwoot_unit_id: '',
  endereco: '',
  telefone: '',
  email: '',
  categoriasVisiveisText: '',
  ativa: true,
}

export function UnidadesTab() {
  const tenantId = useTenantId()
  const { rows, loading, error, create, update, remove } = useCrud<Unidade>('unidades', {
    orderBy: 'nome',
    ascending: true,
  })

  const [marcas, setMarcas] = useState<Marca[]>([])
  const [contas, setContas] = useState<Conta[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Unidade | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (!tenantId) return
    void supabase
      .from('marcas')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('ativa', true)
      .order('nome')
      .then(({ data }) => setMarcas(data ?? []))
    void supabase
      .from('contas_pagamento')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('nome_identificacao')
      .then(({ data }) => setContas(data ?? []))
  }, [tenantId])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setModalOpen(true)
  }

  const openEdit = (u: Unidade) => {
    setEditing(u)
    setForm({
      nome: u.nome,
      id_marca: u.id_marca,
      id_conta_pagamento: u.id_conta_pagamento,
      chatwoot_unit_id: u.chatwoot_unit_id?.toString() ?? '',
      endereco: u.endereco ?? '',
      telefone: u.telefone ?? '',
      email: u.email ?? '',
      categoriasVisiveisText: (u.categorias_visiveis ?? []).join(', '),
      ativa: u.ativa ?? true,
    })
    setFormError(null)
    setModalOpen(true)
  }

  const handleDelete = async (u: Unidade) => {
    if (!confirm(`Excluir unidade "${u.nome}"?`)) return
    try {
      await remove(u.id)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao excluir')
    }
  }

  const handleSave = async () => {
    if (!form.nome.trim()) {
      setFormError('Nome é obrigatório')
      return
    }
    if (!form.id_marca) {
      setFormError('Marca é obrigatória')
      return
    }
    if (!form.id_conta_pagamento) {
      setFormError('Conta de pagamento é obrigatória')
      return
    }
    setSaving(true)
    setFormError(null)
    try {
      const payload = {
        nome: form.nome.trim(),
        id_marca: form.id_marca,
        id_conta_pagamento: form.id_conta_pagamento,
        chatwoot_unit_id: form.chatwoot_unit_id ? Number(form.chatwoot_unit_id) : null,
        endereco: form.endereco.trim() || null,
        telefone: form.telefone.trim() || null,
        email: form.email.trim() || null,
        categorias_visiveis: parseList(form.categoriasVisiveisText),
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

  const columns: Column<Unidade>[] = [
    { key: 'nome', label: 'Unidade' },
    {
      key: 'id_marca',
      label: 'Marca',
      render: (row) => marcas.find((m) => m.id === row.id_marca)?.nome ?? '—',
    },
    {
      key: 'chatwoot_unit_id',
      label: 'Chatwoot ID',
      render: (row) => row.chatwoot_unit_id?.toString() ?? '—',
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
          <h1 className="font-serif text-3xl text-champagne mb-2">Unidades</h1>
          <p className="text-slate-400 text-sm">Unidades físicas de cada marca, vinculadas ao Chatwoot.</p>
        </div>
        <Button variant="primary" onClick={openCreate}>+ Nova unidade</Button>
      </header>

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-ivory">{error}</div>
      )}

      <DataTable
        rows={rows}
        columns={columns}
        loading={loading}
        emptyMessage="Nenhuma unidade cadastrada."
        onEdit={openEdit}
        onDelete={handleDelete}
      />

      <Modal
        open={modalOpen}
        title={editing ? 'Editar unidade' : 'Nova unidade'}
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
          label="Nome da unidade"
          required
          value={form.nome}
          onChange={(e) => setForm({ ...form, nome: e.target.value })}
          placeholder="Ex: Prime Águas Lindas"
        />

        <SelectField
          label="Marca"
          required
          value={form.id_marca}
          onChange={(e) => setForm({ ...form, id_marca: e.target.value })}
          options={marcas.map((m) => ({ value: m.id, label: m.nome }))}
        />

        <SelectField
          label="Conta de pagamento (PIX)"
          required
          value={form.id_conta_pagamento}
          onChange={(e) => setForm({ ...form, id_conta_pagamento: e.target.value })}
          options={contas.map((c) => ({ value: c.id, label: c.nome_identificacao }))}
        />

        <FormField
          label="ID da Unit no Chatwoot"
          type="number"
          value={form.chatwoot_unit_id}
          onChange={(e) => setForm({ ...form, chatwoot_unit_id: e.target.value })}
          placeholder="Ex: 4"
        />

        <FormField
          label="Endereço"
          value={form.endereco}
          onChange={(e) => setForm({ ...form, endereco: e.target.value })}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Telefone"
            value={form.telefone}
            onChange={(e) => setForm({ ...form, telefone: e.target.value })}
          />
          <FormField
            label="E-mail"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>

        <FormField
          label="Categorias visíveis (separadas por vírgula)"
          value={form.categoriasVisiveisText}
          onChange={(e) => setForm({ ...form, categoriasVisiveisText: e.target.value })}
          placeholder="Deixe vazio pra usar todas da marca"
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
  return text.split(',').map((s) => s.trim()).filter(Boolean)
}

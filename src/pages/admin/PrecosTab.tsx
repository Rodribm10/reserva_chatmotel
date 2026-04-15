import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useTenantId } from '@/hooks/useAppConfig'
import type { Database } from '@/types/database'
import { SelectField } from '@/components/SelectField'
import { FormField } from '@/components/FormField'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/admin/Modal'

type Marca = Database['reserva_hotel']['Tables']['marcas']['Row']
type Preco = Database['reserva_hotel']['Tables']['precos']['Row']
type Periodo = Database['reserva_hotel']['Tables']['marca_periodos']['Row']

// key: `${categoria}|${permanencia}` → valor em reais (string for input)
type PriceMap = Record<string, string>

const DIAS_SEMANA = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
]

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 50) || 'periodo'
}

export function PrecosTab() {
  const tenantId = useTenantId()
  const [marcas, setMarcas] = useState<Marca[]>([])
  const [selectedMarcaId, setSelectedMarcaId] = useState<string>('')
  const [periodos, setPeriodos] = useState<Periodo[]>([])
  const [selectedPeriodoId, setSelectedPeriodoId] = useState<string>('')
  const [priceMap, setPriceMap] = useState<PriceMap>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Period management modal state
  const [periodoModalOpen, setPeriodoModalOpen] = useState(false)
  const [editingPeriodo, setEditingPeriodo] = useState<Periodo | null>(null)
  const [periodoForm, setPeriodoForm] = useState({ nome: '', dias: [] as number[] })
  const [periodoFormError, setPeriodoFormError] = useState<string | null>(null)
  const [periodoSaving, setPeriodoSaving] = useState(false)

  // ----- Load marcas -----
  useEffect(() => {
    if (!tenantId) return
    supabase
      .from('marcas')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('nome')
      .then(({ data }) => {
        setMarcas(data ?? [])
        if (data && data.length > 0 && !selectedMarcaId) {
          setSelectedMarcaId(data[0].id)
        }
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId])

  // ----- Load periodos when marca changes -----
  const loadPeriodos = async (marcaId: string) => {
    if (!marcaId) return
    const { data } = await supabase
      .from('marca_periodos')
      .select('*')
      .eq('id_marca', marcaId)
      .eq('ativo', true)
      .order('ordem')
    const list = data ?? []
    setPeriodos(list)
    // Seleciona o primeiro período se nenhum está selecionado ou o atual sumiu
    if (list.length > 0 && !list.find((p) => p.id === selectedPeriodoId)) {
      setSelectedPeriodoId(list[0].id)
    }
  }

  useEffect(() => {
    if (selectedMarcaId) void loadPeriodos(selectedMarcaId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMarcaId])

  // ----- Load precos when marca+periodo selected -----
  const selectedPeriodo = periodos.find((p) => p.id === selectedPeriodoId) ?? null

  useEffect(() => {
    if (!selectedMarcaId || !selectedPeriodo) {
      setPriceMap({})
      return
    }
    setLoading(true)
    supabase
      .from('precos')
      .select('*')
      .eq('id_marca', selectedMarcaId)
      .eq('periodo_semana', selectedPeriodo.slug)
      .then(({ data }) => {
        const map: PriceMap = {}
        ;(data ?? []).forEach((p: Preco) => {
          map[`${p.categoria}|${p.permanencia}`] = String(p.valor)
        })
        setPriceMap(map)
        setLoading(false)
      })
  }, [selectedMarcaId, selectedPeriodo])

  const marca = marcas.find((m) => m.id === selectedMarcaId)
  const categorias = useMemo(() => marca?.categorias ?? [], [marca])
  const permanencias = useMemo(() => marca?.permanencias ?? [], [marca])

  const setPrice = (categoria: string, permanencia: string, value: string) => {
    setPriceMap({ ...priceMap, [`${categoria}|${permanencia}`]: value })
  }

  // ----- Save prices for selected period -----
  const handleSave = async () => {
    if (!selectedMarcaId || !tenantId || !selectedPeriodo) return
    setSaving(true)
    setError(null)
    setSuccessMsg(null)
    try {
      const rows = categorias.flatMap((cat) =>
        permanencias.map((perm) => {
          const raw = priceMap[`${cat}|${perm}`]
          const valor = raw ? Number(raw.replace(',', '.')) : 0
          return valor > 0
            ? {
                tenant_id: tenantId,
                id_marca: selectedMarcaId,
                categoria: cat,
                permanencia: perm,
                periodo_semana: selectedPeriodo.slug,
                valor,
                ativo: true,
              }
            : null
        })
      ).filter(Boolean) as Array<{
        tenant_id: number
        id_marca: string
        categoria: string
        permanencia: string
        periodo_semana: string
        valor: number
        ativo: boolean
      }>

      const { error: delErr } = await supabase
        .from('precos')
        .delete()
        .eq('id_marca', selectedMarcaId)
        .eq('periodo_semana', selectedPeriodo.slug)
      if (delErr) throw new Error(delErr.message)

      if (rows.length > 0) {
        const { error: insErr } = await supabase.from('precos').insert(rows)
        if (insErr) throw new Error(insErr.message)
      }

      setSuccessMsg(`Preços de "${selectedPeriodo.nome}" salvos!`)
      setTimeout(() => setSuccessMsg(null), 2500)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  // ----- Period CRUD -----
  const openCreatePeriodo = () => {
    setEditingPeriodo(null)
    setPeriodoForm({ nome: '', dias: [] })
    setPeriodoFormError(null)
    setPeriodoModalOpen(true)
  }

  const openEditPeriodo = (p: Periodo) => {
    setEditingPeriodo(p)
    setPeriodoForm({ nome: p.nome, dias: p.dias ?? [] })
    setPeriodoFormError(null)
    setPeriodoModalOpen(true)
  }

  const toggleDia = (dia: number) => {
    setPeriodoForm((f) => ({
      ...f,
      dias: f.dias.includes(dia) ? f.dias.filter((d) => d !== dia) : [...f.dias, dia].sort(),
    }))
  }

  const handlePeriodoSave = async () => {
    if (!tenantId || !selectedMarcaId) return
    if (!periodoForm.nome.trim()) return setPeriodoFormError('Nome é obrigatório')
    if (periodoForm.dias.length === 0) return setPeriodoFormError('Selecione pelo menos um dia')

    setPeriodoSaving(true)
    setPeriodoFormError(null)
    try {
      if (editingPeriodo) {
        const { error: err } = await supabase
          .from('marca_periodos')
          .update({
            nome: periodoForm.nome.trim(),
            dias: periodoForm.dias,
          })
          .eq('id', editingPeriodo.id)
        if (err) throw new Error(err.message)
      } else {
        const slug = slugify(periodoForm.nome)
        const ordem = periodos.length
        const { error: err } = await supabase.from('marca_periodos').insert({
          tenant_id: tenantId,
          id_marca: selectedMarcaId,
          slug,
          nome: periodoForm.nome.trim(),
          dias: periodoForm.dias,
          ordem,
          ativo: true,
        })
        if (err) throw new Error(err.message)
      }
      await loadPeriodos(selectedMarcaId)
      setPeriodoModalOpen(false)
    } catch (e) {
      setPeriodoFormError(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setPeriodoSaving(false)
    }
  }

  const handlePeriodoDelete = async (p: Periodo) => {
    if (periodos.length <= 1) {
      alert('Não pode excluir o último período. Crie outro antes.')
      return
    }
    if (!confirm(`Excluir o período "${p.nome}"? Os preços cadastrados serão removidos junto.`))
      return
    try {
      // deleta precos do período primeiro
      await supabase
        .from('precos')
        .delete()
        .eq('id_marca', selectedMarcaId)
        .eq('periodo_semana', p.slug)
      // depois o período
      const { error: err } = await supabase.from('marca_periodos').delete().eq('id', p.id)
      if (err) throw new Error(err.message)
      if (selectedPeriodoId === p.id) setSelectedPeriodoId('')
      await loadPeriodos(selectedMarcaId)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao excluir período')
    }
  }

  return (
    <div className="max-w-5xl space-y-6">
      <header>
        <h1 className="font-serif text-3xl text-gradient-gold mb-2">Preços</h1>
        <p className="text-slate text-sm">
          Grid categoria × permanência por período da semana. Valores em reais.
        </p>
      </header>

      <SelectField
        label="Marca"
        value={selectedMarcaId}
        onChange={(e) => setSelectedMarcaId(e.target.value)}
        options={marcas.map((m) => ({ value: m.id, label: m.nome }))}
      />

      {selectedMarcaId && (
        <section className="space-y-3 rounded-2xl border border-champagne/20 bg-midnight/40 p-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="font-serif text-lg text-champagne">Período da semana</h2>
            <Button variant="secondary" size="sm" onClick={openCreatePeriodo}>
              + Novo período
            </Button>
          </div>

          {periodos.length === 0 && (
            <p className="text-slate text-sm">Nenhum período cadastrado.</p>
          )}

          {periodos.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {periodos.map((p) => (
                <div
                  key={p.id}
                  className={`group rounded-lg border px-3 py-2 text-sm font-sans transition cursor-pointer ${
                    p.id === selectedPeriodoId
                      ? 'bg-champagne text-obsidian border-champagne font-semibold'
                      : 'bg-midnight/60 text-ivory border-champagne/30 hover:border-champagne'
                  }`}
                  onClick={() => setSelectedPeriodoId(p.id)}
                >
                  <span>{p.nome}</span>
                  <span className="ml-2 text-xs opacity-70">
                    ({p.dias.map((d) => DIAS_SEMANA[d]?.label).join(' ')})
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      openEditPeriodo(p)
                    }}
                    className="ml-2 opacity-60 hover:opacity-100"
                    aria-label="Editar período"
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      void handlePeriodoDelete(p)
                    }}
                    className="ml-1 opacity-60 hover:opacity-100"
                    aria-label="Excluir período"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {loading && <p className="text-slate">Carregando preços...</p>}

      {!loading && marca && (categorias.length === 0 || permanencias.length === 0) && (
        <div className="rounded-xl border border-ruby/40 bg-ruby/10 p-4 text-ivory text-sm">
          Essa marca não tem categorias e/ou permanências cadastradas. Edite primeiro na aba Marcas.
        </div>
      )}

      {!loading && selectedPeriodo && categorias.length > 0 && permanencias.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-champagne/20 bg-midnight/40">
          <table className="w-full text-sm">
            <thead className="border-b border-champagne/20">
              <tr>
                <th className="px-4 py-3 text-left font-sans text-xs uppercase tracking-widest text-champagne">
                  Categoria
                </th>
                {permanencias.map((p) => (
                  <th
                    key={p}
                    className="px-4 py-3 text-left font-sans text-xs uppercase tracking-widest text-champagne"
                  >
                    {p}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categorias.map((cat) => (
                <tr key={cat} className="border-b border-champagne/5 last:border-0">
                  <td className="px-4 py-3 text-ivory font-semibold">{cat}</td>
                  {permanencias.map((perm) => (
                    <td key={perm} className="px-4 py-3">
                      <input
                        type="text"
                        inputMode="decimal"
                        className="w-24 rounded-lg border border-champagne/30 bg-obsidian/60 px-3 py-2 text-ivory text-right focus:border-champagne focus:outline-none"
                        value={priceMap[`${cat}|${perm}`] ?? ''}
                        onChange={(e) => setPrice(cat, perm, e.target.value)}
                        placeholder="0.00"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-ruby/40 bg-ruby/10 p-4 text-ivory">{error}</div>
      )}
      {successMsg && (
        <div className="rounded-xl border border-emerald/40 bg-emerald/10 p-4 text-ivory">
          {successMsg}
        </div>
      )}

      {selectedPeriodo && (
        <Button variant="primary" size="lg" onClick={handleSave} disabled={saving}>
          {saving ? 'Salvando...' : `Salvar preços de "${selectedPeriodo.nome}"`}
        </Button>
      )}

      {/* Period CRUD modal */}
      <Modal
        open={periodoModalOpen}
        title={editingPeriodo ? 'Editar período' : 'Novo período'}
        onClose={() => setPeriodoModalOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPeriodoModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handlePeriodoSave} disabled={periodoSaving}>
              {periodoSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </>
        }
      >
        <FormField
          label="Nome do período"
          required
          value={periodoForm.nome}
          onChange={(e) => setPeriodoForm({ ...periodoForm, nome: e.target.value })}
          placeholder="Ex: Segunda a Quarta"
        />

        <div>
          <label className="font-sans text-xs uppercase tracking-widest text-champagne">
            Dias da semana
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {DIAS_SEMANA.map((dia) => {
              const selected = periodoForm.dias.includes(dia.value)
              return (
                <button
                  key={dia.value}
                  type="button"
                  onClick={() => toggleDia(dia.value)}
                  className={`rounded-lg border px-4 py-2 text-sm font-sans transition ${
                    selected
                      ? 'bg-champagne text-obsidian border-champagne font-semibold'
                      : 'bg-midnight/60 text-ivory border-champagne/30 hover:border-champagne'
                  }`}
                >
                  {dia.label}
                </button>
              )
            })}
          </div>
        </div>

        {periodoFormError && (
          <div className="rounded-xl border border-ruby/40 bg-ruby/10 p-3 text-ivory text-sm">
            {periodoFormError}
          </div>
        )}
      </Modal>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useTenantId } from '@/hooks/useAppConfig'
import type { Database } from '@/types/database'
import { SelectField } from '@/components/SelectField'
import { Button } from '@/components/ui/button'

type Marca = Database['reserva_hotel']['Tables']['marcas']['Row']
type Preco = Database['reserva_hotel']['Tables']['precos']['Row']

// key: `${categoria}|${permanencia}` → valor em reais (string for input)
type PriceMap = Record<string, string>

export function PrecosTab() {
  const tenantId = useTenantId()
  const [marcas, setMarcas] = useState<Marca[]>([])
  const [selectedMarcaId, setSelectedMarcaId] = useState<string>('')
  const [priceMap, setPriceMap] = useState<PriceMap>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!tenantId) return
    supabase
      .from('marcas')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('nome')
      .then(({ data }) => {
        setMarcas(data ?? [])
        if (data && data.length > 0 && !selectedMarcaId) setSelectedMarcaId(data[0].id)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId])

  useEffect(() => {
    if (!selectedMarcaId) return
    setLoading(true)
    supabase
      .from('precos')
      .select('*')
      .eq('id_marca', selectedMarcaId)
      .eq('periodo_semana', 'default')
      .then(({ data }) => {
        const map: PriceMap = {}
        ;(data ?? []).forEach((p: Preco) => {
          map[`${p.categoria}|${p.permanencia}`] = String(p.valor)
        })
        setPriceMap(map)
        setLoading(false)
      })
  }, [selectedMarcaId])

  const marca = marcas.find((m) => m.id === selectedMarcaId)
  const categorias = marca?.categorias ?? []
  const permanencias = marca?.permanencias ?? []

  const setPrice = (categoria: string, permanencia: string, value: string) => {
    setPriceMap({ ...priceMap, [`${categoria}|${permanencia}`]: value })
  }

  const handleSave = async () => {
    if (!selectedMarcaId || !tenantId) return
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
                periodo_semana: 'default',
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
        .eq('periodo_semana', 'default')
      if (delErr) throw new Error(delErr.message)

      if (rows.length > 0) {
        const { error: insErr } = await supabase.from('precos').insert(rows)
        if (insErr) throw new Error(insErr.message)
      }

      setSuccessMsg('Preços salvos!')
      setTimeout(() => setSuccessMsg(null), 2500)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <header>
        <h1 className="font-serif text-3xl text-gradient-gold mb-2">Preços</h1>
        <p className="text-slate text-sm">Grid categoria × permanência. Valores em reais.</p>
      </header>

      <SelectField
        label="Marca"
        value={selectedMarcaId}
        onChange={(e) => setSelectedMarcaId(e.target.value)}
        options={marcas.map((m) => ({ value: m.id, label: m.nome }))}
      />

      {loading && <p className="text-slate">Carregando preços...</p>}

      {!loading && marca && (categorias.length === 0 || permanencias.length === 0) && (
        <div className="rounded-xl border border-ruby/40 bg-ruby/10 p-4 text-ivory text-sm">
          Essa marca não tem categorias e/ou permanências cadastradas. Edite primeiro na aba Marcas.
        </div>
      )}

      {!loading && categorias.length > 0 && permanencias.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-champagne/20 bg-midnight/40">
          <table className="w-full text-sm">
            <thead className="border-b border-champagne/20">
              <tr>
                <th className="px-4 py-3 text-left font-sans text-xs uppercase tracking-widest text-champagne">Categoria</th>
                {permanencias.map((p) => (
                  <th key={p} className="px-4 py-3 text-left font-sans text-xs uppercase tracking-widest text-champagne">
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

      {error && <div className="rounded-xl border border-ruby/40 bg-ruby/10 p-4 text-ivory">{error}</div>}
      {successMsg && <div className="rounded-xl border border-emerald/40 bg-emerald/10 p-4 text-ivory">{successMsg}</div>}

      <Button variant="primary" size="lg" onClick={handleSave} disabled={saving || !selectedMarcaId}>
        {saving ? 'Salvando...' : 'Salvar preços'}
      </Button>
    </div>
  )
}

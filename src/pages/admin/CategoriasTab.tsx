import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useTenantId } from '@/hooks/useAppConfig'
import type { Database } from '@/types/database'
import { SelectField } from '@/components/SelectField'
import { FormField } from '@/components/FormField'
import { Button } from '@/components/ui/button'

type Marca = Database['reserva_hotel']['Tables']['marcas']['Row']

export function CategoriasTab() {
  const tenantId = useTenantId()
  const [marcas, setMarcas] = useState<Marca[]>([])
  const [selectedMarcaId, setSelectedMarcaId] = useState<string>('')
  const [categorias, setCategorias] = useState<string[]>([])
  const [newCat, setNewCat] = useState('')
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
        if (data && data.length > 0 && !selectedMarcaId) {
          setSelectedMarcaId(data[0].id)
        }
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId])

  useEffect(() => {
    const marca = marcas.find((m) => m.id === selectedMarcaId)
    setCategorias(marca?.categorias ?? [])
  }, [selectedMarcaId, marcas])

  const addCat = () => {
    const trimmed = newCat.trim()
    if (!trimmed) return
    if (categorias.includes(trimmed)) return
    setCategorias([...categorias, trimmed])
    setNewCat('')
  }

  const removeCat = (cat: string) => {
    setCategorias(categorias.filter((c) => c !== cat))
  }

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...categorias]
    const target = idx + dir
    if (target < 0 || target >= next.length) return
    ;[next[idx], next[target]] = [next[target], next[idx]]
    setCategorias(next)
  }

  const handleSave = async () => {
    if (!selectedMarcaId) return
    setSaving(true)
    setError(null)
    setSuccessMsg(null)
    try {
      const { error: err } = await supabase
        .from('marcas')
        .update({ categorias })
        .eq('id', selectedMarcaId)
      if (err) throw new Error(err.message)

      setMarcas(marcas.map((m) => (m.id === selectedMarcaId ? { ...m, categorias } : m)))
      setSuccessMsg('Categorias salvas!')
      setTimeout(() => setSuccessMsg(null), 2500)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <h1 className="font-serif text-3xl text-gradient-gold mb-2">Categorias de Suíte</h1>
        <p className="text-slate text-sm">Escolha uma marca e edite as categorias disponíveis.</p>
      </header>

      <SelectField
        label="Marca"
        value={selectedMarcaId}
        onChange={(e) => setSelectedMarcaId(e.target.value)}
        options={marcas.map((m) => ({ value: m.id, label: m.nome }))}
      />

      <section className="space-y-4 rounded-2xl border border-champagne/20 bg-midnight/40 p-6">
        <h2 className="font-serif text-xl text-champagne">Categorias</h2>

        {categorias.length === 0 && (
          <p className="text-slate text-sm">Nenhuma categoria cadastrada.</p>
        )}

        <ul className="space-y-2">
          {categorias.map((cat, idx) => (
            <li key={cat} className="flex items-center gap-2 rounded-lg border border-champagne/20 bg-obsidian/60 px-4 py-2">
              <span className="flex-1 text-ivory">{cat}</span>
              <Button variant="ghost" size="sm" onClick={() => move(idx, -1)} disabled={idx === 0}>↑</Button>
              <Button variant="ghost" size="sm" onClick={() => move(idx, 1)} disabled={idx === categorias.length - 1}>↓</Button>
              <Button variant="destructive" size="sm" onClick={() => removeCat(cat)}>Remover</Button>
            </li>
          ))}
        </ul>

        <div className="flex gap-2 items-end">
          <FormField
            label="Nova categoria"
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            placeholder="Ex: Alexa, Stilo, Hidromassagem"
            className="flex-1"
          />
          <Button variant="secondary" onClick={addCat}>+ Adicionar</Button>
        </div>
      </section>

      {error && <div className="rounded-xl border border-ruby/40 bg-ruby/10 p-4 text-ivory">{error}</div>}
      {successMsg && <div className="rounded-xl border border-emerald/40 bg-emerald/10 p-4 text-ivory">{successMsg}</div>}

      <Button variant="primary" size="lg" onClick={handleSave} disabled={saving || !selectedMarcaId}>
        {saving ? 'Salvando...' : 'Salvar categorias'}
      </Button>
    </div>
  )
}

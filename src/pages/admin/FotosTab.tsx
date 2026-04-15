import { useEffect, useState, type ChangeEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { useTenantId } from '@/hooks/useAppConfig'
import type { Database } from '@/types/database'
import { SelectField } from '@/components/SelectField'
import { FormField } from '@/components/FormField'
import { Button } from '@/components/ui/button'

type Unidade = Database['reserva_hotel']['Tables']['unidades']['Row']
type Foto = Database['reserva_hotel']['Tables']['fotos_categoria']['Row']

const STORAGE_BUCKET = 'reserva-fotos'

export function FotosTab() {
  const tenantId = useTenantId()
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [selectedUnidadeId, setSelectedUnidadeId] = useState<string>('')
  const [selectedCategoria, setSelectedCategoria] = useState<string>('')
  const [fotos, setFotos] = useState<Foto[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [newUrl, setNewUrl] = useState('')
  const [newAlt, setNewAlt] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!tenantId) return
    supabase
      .from('unidades')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('nome')
      .then(({ data }) => {
        setUnidades(data ?? [])
        if (data && data.length > 0 && !selectedUnidadeId) {
          setSelectedUnidadeId(data[0].id)
        }
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId])

  const unidade = unidades.find((u) => u.id === selectedUnidadeId)
  const categoriasVisiveis = unidade?.categorias_visiveis ?? []

  useEffect(() => {
    if (categoriasVisiveis.length > 0 && !selectedCategoria) {
      setSelectedCategoria(categoriasVisiveis[0])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(categoriasVisiveis)])

  const loadFotos = async () => {
    if (!selectedUnidadeId || !selectedCategoria) return
    setLoading(true)
    const { data } = await supabase
      .from('fotos_categoria')
      .select('*')
      .eq('id_unidade', selectedUnidadeId)
      .eq('categoria', selectedCategoria)
      .order('ordem')
    setFotos(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    void loadFotos()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUnidadeId, selectedCategoria])

  const handleAddUrl = async () => {
    if (!tenantId || !selectedUnidadeId || !selectedCategoria || !newUrl.trim()) return
    setError(null)
    try {
      const { error: err } = await supabase.from('fotos_categoria').insert({
        tenant_id: tenantId,
        id_unidade: selectedUnidadeId,
        categoria: selectedCategoria,
        url_foto: newUrl.trim(),
        alt: newAlt.trim() || null,
        ordem: fotos.length,
        ativa: true,
      })
      if (err) throw new Error(err.message)
      setNewUrl('')
      setNewAlt('')
      await loadFotos()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao adicionar')
    }
  }

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !tenantId || !selectedUnidadeId || !selectedCategoria) return
    setUploading(true)
    setError(null)
    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${tenantId}/${selectedUnidadeId}/${selectedCategoria}/${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, file, { upsert: false })
      if (uploadErr) throw new Error(uploadErr.message)

      const { data: publicData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)

      const { error: insertErr } = await supabase.from('fotos_categoria').insert({
        tenant_id: tenantId,
        id_unidade: selectedUnidadeId,
        categoria: selectedCategoria,
        url_foto: publicData.publicUrl,
        alt: file.name,
        ordem: fotos.length,
        ativa: true,
      })
      if (insertErr) throw new Error(insertErr.message)
      await loadFotos()
      e.target.value = ''
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro no upload')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (foto: Foto) => {
    if (!confirm('Excluir foto?')) return
    const { error: err } = await supabase.from('fotos_categoria').delete().eq('id', foto.id)
    if (err) {
      setError(err.message)
      return
    }
    await loadFotos()
  }

  const move = async (idx: number, dir: -1 | 1) => {
    const target = idx + dir
    if (target < 0 || target >= fotos.length) return
    const a = fotos[idx]
    const b = fotos[target]
    await supabase.from('fotos_categoria').update({ ordem: b.ordem }).eq('id', a.id)
    await supabase.from('fotos_categoria').update({ ordem: a.ordem }).eq('id', b.id)
    await loadFotos()
  }

  return (
    <div className="max-w-4xl space-y-6">
      <header>
        <h1 className="font-serif text-3xl text-gradient-gold mb-2">Fotos das suítes</h1>
        <p className="text-slate text-sm">Upload direto ou URL pública. Organize por unidade + categoria.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectField
          label="Unidade"
          value={selectedUnidadeId}
          onChange={(e) => setSelectedUnidadeId(e.target.value)}
          options={unidades.map((u) => ({ value: u.id, label: u.nome }))}
        />
        <SelectField
          label="Categoria"
          value={selectedCategoria}
          onChange={(e) => setSelectedCategoria(e.target.value)}
          options={categoriasVisiveis.map((c) => ({ value: c, label: c }))}
        />
      </div>

      <section className="space-y-4 rounded-2xl border border-champagne/20 bg-midnight/40 p-6">
        <h2 className="font-serif text-xl text-champagne">Adicionar foto</h2>

        <div>
          <label className="font-sans text-xs uppercase tracking-widest text-champagne">Upload de arquivo</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
            className="mt-2 block w-full text-ivory text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-champagne file:text-obsidian file:font-semibold hover:file:bg-rose-gold cursor-pointer"
          />
          {uploading && <p className="text-slate text-sm mt-2">Enviando...</p>}
        </div>

        <div className="border-t border-champagne/20 pt-4 space-y-3">
          <p className="text-slate text-xs uppercase tracking-widest">Ou cole uma URL</p>
          <FormField label="URL da imagem" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://..." />
          <FormField label="Alt text" value={newAlt} onChange={(e) => setNewAlt(e.target.value)} placeholder="Descrição curta" />
          <Button variant="secondary" onClick={handleAddUrl} disabled={!newUrl.trim()}>+ Adicionar URL</Button>
        </div>
      </section>

      {error && <div className="rounded-xl border border-ruby/40 bg-ruby/10 p-4 text-ivory">{error}</div>}

      <section className="space-y-3">
        <h2 className="font-serif text-xl text-champagne">Fotos cadastradas</h2>
        {loading && <p className="text-slate">Carregando...</p>}
        {!loading && fotos.length === 0 && <p className="text-slate text-sm">Nenhuma foto nesta categoria.</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fotos.map((foto, idx) => (
            <div key={foto.id} className="rounded-xl border border-champagne/20 overflow-hidden bg-midnight/40">
              <div className="aspect-video">
                <img src={foto.url_foto} alt={foto.alt ?? ''} className="h-full w-full object-cover" />
              </div>
              <div className="p-3 flex items-center justify-between gap-2">
                <p className="text-ivory text-xs truncate flex-1">{foto.alt ?? 'Sem alt'}</p>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => move(idx, -1)} disabled={idx === 0}>↑</Button>
                  <Button variant="ghost" size="sm" onClick={() => move(idx, 1)} disabled={idx === fotos.length - 1}>↓</Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(foto)}>✕</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

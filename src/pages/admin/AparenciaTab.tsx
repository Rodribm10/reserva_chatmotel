import { useEffect, useState } from 'react'
import { HexColorPicker } from 'react-colorful'
import { supabase } from '@/lib/supabase'
import { useTenant } from '@/contexts/TenantProvider'
import { FormField } from '@/components/FormField'
import { SelectField } from '@/components/SelectField'
import { Button } from '@/components/ui/button'

const FONT_OPTIONS = [
  { value: 'Fraunces', label: 'Fraunces (serif moderna)' },
  { value: 'Playfair Display', label: 'Playfair Display (serif clássica)' },
  { value: 'Cormorant Garamond', label: 'Cormorant Garamond (serif elegante)' },
  { value: 'Lora', label: 'Lora (serif legível)' },
  { value: 'Inter', label: 'Inter (sans moderna)' },
  { value: 'Poppins', label: 'Poppins (sans geométrica)' },
  { value: 'Manrope', label: 'Manrope (sans minimalista)' },
  { value: 'DM Sans', label: 'DM Sans (sans neutra)' },
]

export function AparenciaTab() {
  const { context, refresh } = useTenant()
  const [form, setForm] = useState(context?.config ?? null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    setForm(context?.config ?? null)
  }, [context])

  if (!form) return <p className="text-slate">Carregando configuração…</p>

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm({ ...form, [key]: value })
  }

  const handleSave = async () => {
    if (!form) return
    setSaving(true)
    setError(null)
    setSuccessMsg(null)
    try {
      const { error: err } = await supabase
        .from('app_config')
        .update({
          nome_rede: form.nome_rede,
          titulo_hero: form.titulo_hero,
          subtitulo_hero: form.subtitulo_hero,
          tagline: form.tagline,
          footer_text: form.footer_text,
          logo_url: form.logo_url,
          favicon_url: form.favicon_url,
          cor_primaria: form.cor_primaria,
          cor_secundaria: form.cor_secundaria,
          cor_fundo: form.cor_fundo,
          cor_superficie: form.cor_superficie,
          cor_texto: form.cor_texto,
          fonte_display: form.fonte_display,
          fonte_corpo: form.fonte_corpo,
        })
        .eq('tenant_id', form.tenant_id)

      if (err) throw new Error(err.message)
      await refresh()
      setSuccessMsg('Aparência salva com sucesso!')
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <header>
        <h1 className="font-serif text-3xl text-gradient-gold mb-2">Aparência</h1>
        <p className="text-slate text-sm">
          Personalize o nome da sua rede, textos, cores e fontes. As mudanças aplicam no app assim que você salvar.
        </p>
      </header>

      <section className="space-y-4 rounded-2xl border border-champagne/20 bg-midnight/40 p-6">
        <h2 className="font-serif text-2xl text-champagne">Textos</h2>
        <FormField
          label="Nome da rede"
          required
          value={form.nome_rede}
          onChange={(e) => update('nome_rede', e.target.value)}
        />
        <FormField
          label="Título da página"
          required
          value={form.titulo_hero}
          onChange={(e) => update('titulo_hero', e.target.value)}
        />
        <FormField
          label="Subtítulo (acima do título)"
          value={form.subtitulo_hero ?? ''}
          onChange={(e) => update('subtitulo_hero', e.target.value || null)}
        />
        <FormField
          label="Tagline (abaixo do título)"
          value={form.tagline ?? ''}
          onChange={(e) => update('tagline', e.target.value || null)}
        />
        <FormField
          label="Footer"
          value={form.footer_text ?? ''}
          onChange={(e) => update('footer_text', e.target.value || null)}
        />
      </section>

      <section className="space-y-4 rounded-2xl border border-champagne/20 bg-midnight/40 p-6">
        <h2 className="font-serif text-2xl text-champagne">Imagens</h2>
        <FormField
          label="URL do logo"
          value={form.logo_url ?? ''}
          onChange={(e) => update('logo_url', e.target.value || null)}
          placeholder="https://..."
        />
        <FormField
          label="URL do favicon"
          value={form.favicon_url ?? ''}
          onChange={(e) => update('favicon_url', e.target.value || null)}
          placeholder="https://..."
        />
      </section>

      <section className="space-y-4 rounded-2xl border border-champagne/20 bg-midnight/40 p-6">
        <h2 className="font-serif text-2xl text-champagne">Cores</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ColorField label="Primária (acento)" value={form.cor_primaria} onChange={(v) => update('cor_primaria', v)} />
          <ColorField label="Secundária (acento 2)" value={form.cor_secundaria} onChange={(v) => update('cor_secundaria', v)} />
          <ColorField label="Fundo" value={form.cor_fundo} onChange={(v) => update('cor_fundo', v)} />
          <ColorField label="Superfície (cards)" value={form.cor_superficie} onChange={(v) => update('cor_superficie', v)} />
          <ColorField label="Texto" value={form.cor_texto} onChange={(v) => update('cor_texto', v)} />
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-champagne/20 bg-midnight/40 p-6">
        <h2 className="font-serif text-2xl text-champagne">Tipografia</h2>
        <SelectField
          label="Fonte dos títulos"
          value={form.fonte_display}
          onChange={(e) => update('fonte_display', e.target.value)}
          options={FONT_OPTIONS}
        />
        <SelectField
          label="Fonte do corpo"
          value={form.fonte_corpo}
          onChange={(e) => update('fonte_corpo', e.target.value)}
          options={FONT_OPTIONS}
        />
      </section>

      {error && (
        <div className="rounded-xl border border-ruby/40 bg-ruby/10 p-4 text-ivory">{error}</div>
      )}
      {successMsg && (
        <div className="rounded-xl border border-emerald/40 bg-emerald/10 p-4 text-ivory">{successMsg}</div>
      )}

      <div className="flex gap-3 sticky bottom-6 z-10">
        <Button variant="primary" size="lg" onClick={handleSave} disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar aparência'}
        </Button>
      </div>
    </div>
  )
}

interface ColorFieldProps {
  label: string
  value: string
  onChange: (v: string) => void
}

function ColorField({ label, value, onChange }: ColorFieldProps) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <label className="font-sans text-xs uppercase tracking-widest text-champagne">{label}</label>
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          className="h-10 w-10 rounded-lg border border-champagne/30 shrink-0"
          style={{ backgroundColor: value }}
          onClick={() => setOpen(!open)}
          aria-label={`Abrir color picker ${label}`}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 rounded-lg border border-champagne/30 bg-midnight/60 px-4 py-3 font-mono text-sm text-ivory focus:border-champagne focus:outline-none"
        />
      </div>
      {open && (
        <div className="mt-3">
          <HexColorPicker color={value} onChange={onChange} />
        </div>
      )}
    </div>
  )
}

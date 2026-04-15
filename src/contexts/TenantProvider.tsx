import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { LoadedTenantContext } from '@/lib/appConfig'
import { loadTenantContext } from '@/lib/appConfig'
import { resolveTenantSlug } from '@/lib/tenant'

interface TenantContextValue {
  loading: boolean
  error: string | null
  context: LoadedTenantContext | null
  refresh: () => Promise<void>
}

const TenantContext = createContext<TenantContextValue | null>(null)

export function TenantProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [context, setContext] = useState<LoadedTenantContext | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const slug = resolveTenantSlug()
      const ctx = await loadTenantContext(slug)
      if (!ctx) {
        setError(`Tenant "${slug}" não encontrado ou inativo.`)
      } else {
        setContext(ctx)
        applyTheme(ctx)
        applyMetadata(ctx)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar tenant')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <TenantContext.Provider value={{ loading, error, context, refresh: load }}>
      {children}
    </TenantContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTenant() {
  const ctx = useContext(TenantContext)
  if (!ctx) throw new Error('useTenant must be used inside <TenantProvider>')
  return ctx
}

function applyTheme(ctx: LoadedTenantContext) {
  const { config } = ctx
  const root = document.documentElement
  root.style.setProperty('--color-champagne', config.cor_primaria)
  root.style.setProperty('--color-rose-gold', config.cor_secundaria)
  root.style.setProperty('--color-obsidian', config.cor_fundo)
  root.style.setProperty('--color-midnight', config.cor_superficie)
  root.style.setProperty('--color-ivory', config.cor_texto)

  loadGoogleFont(config.fonte_display)
  loadGoogleFont(config.fonte_corpo)
  root.style.setProperty('--font-serif', `'${config.fonte_display}', Georgia, serif`)
  root.style.setProperty('--font-sans', `'${config.fonte_corpo}', system-ui, sans-serif`)
}

function loadGoogleFont(family: string) {
  if (!family) return
  const id = `gfont-${family.replace(/\s+/g, '-').toLowerCase()}`
  if (document.getElementById(id)) return
  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@400;500;600;700&display=swap`
  document.head.appendChild(link)
}

function applyMetadata(ctx: LoadedTenantContext) {
  const { config } = ctx
  document.title = config.titulo_hero
  if (config.favicon_url) {
    let link = document.querySelector<HTMLLinkElement>("link[rel='icon']")
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    link.href = config.favicon_url
  }
}

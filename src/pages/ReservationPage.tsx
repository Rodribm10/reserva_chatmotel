import { ReservationFlow } from '@/components/reservation/ReservationFlow'
import { useTenant } from '@/contexts/TenantProvider'
import { useAppConfig } from '@/hooks/useAppConfig'

export default function ReservationPage() {
  const { loading, error } = useTenant()
  const config = useAppConfig()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate font-sans">Carregando...</p>
      </div>
    )
  }

  if (error || !config) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="rounded-xl border border-ruby/40 bg-ruby/10 p-6 text-ivory text-center max-w-md">
          {error ?? 'Configuração não encontrada'}
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen flex flex-col items-center px-6 py-12">
      <header className="text-center mb-10">
        {config.subtitulo_hero && (
          <p className="font-sans text-sm uppercase tracking-[0.3em] text-rose-gold mb-4">
            {config.subtitulo_hero}
          </p>
        )}
        <h1 className="font-serif text-5xl md:text-6xl text-gradient-gold mb-3">
          {config.titulo_hero}
        </h1>
        {config.tagline && (
          <p className="font-sans text-slate text-lg">{config.tagline}</p>
        )}
      </header>

      <ReservationFlow />

      {config.footer_text && (
        <footer className="mt-16 text-slate text-xs uppercase tracking-widest">
          {config.footer_text}
        </footer>
      )}
    </main>
  )
}

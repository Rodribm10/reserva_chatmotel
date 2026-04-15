import { ReservationFlow } from '@/components/reservation/ReservationFlow'
import { HeroSection } from '@/components/reservation/HeroSection'
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
      <HeroSection config={config} />

      <ReservationFlow />

      {config.footer_text && (
        <footer className="mt-16 text-slate text-xs uppercase tracking-widest">
          {config.footer_text}
        </footer>
      )}
    </main>
  )
}

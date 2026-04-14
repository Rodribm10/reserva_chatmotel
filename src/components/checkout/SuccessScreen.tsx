import { Button } from '@/components/ui/button'

interface Props {
  onRestart: () => void
}

export function SuccessScreen({ onRestart }: Props) {
  return (
    <section className="mx-auto max-w-md text-center space-y-6 rounded-2xl border border-emerald/40 bg-emerald/10 p-10 backdrop-blur">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald text-obsidian text-4xl font-bold">
        ✓
      </div>

      <h2 className="font-serif text-3xl text-ivory">Reserva confirmada!</h2>

      <p className="text-slate">
        O pagamento caiu e sua reserva já está registrada.
        <br />
        Nossa atendente foi avisada e vai confirmar os próximos passos pelo WhatsApp.
      </p>

      <Button variant="primary" size="md" onClick={onRestart} className="w-full">
        Fazer outra reserva
      </Button>
    </section>
  )
}

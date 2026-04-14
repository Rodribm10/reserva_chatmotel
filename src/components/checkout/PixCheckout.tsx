import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { chatwootApi, type CreateReservationResponse } from '@/lib/chatwootApi'
import { Button } from '@/components/ui/button'
import { formatBRL } from '@/lib/formatters'

interface Props {
  reservation: CreateReservationResponse
  depositCents: number
  onPaid: () => void
  onCancel: () => void
}

export function PixCheckout({ reservation, depositCents, onPaid, onCancel }: Props) {
  const [copied, setCopied] = useState(false)
  const [statusMsg, setStatusMsg] = useState<string>('Aguardando pagamento...')

  useEffect(() => {
    let canceled = false
    const interval = setInterval(async () => {
      try {
        const s = await chatwootApi.getStatus(reservation.reservation_id)
        if (canceled) return
        if (s.status === 'paid') {
          setStatusMsg('Pagamento confirmado!')
          clearInterval(interval)
          onPaid()
        } else if (s.status === 'expired' || s.status === 'canceled') {
          setStatusMsg(`Reserva ${s.status}`)
          clearInterval(interval)
        }
      } catch (err) {
        console.error('Erro no polling:', err)
      }
    }, 3000)

    return () => {
      canceled = true
      clearInterval(interval)
    }
  }, [reservation.reservation_id, onPaid])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(reservation.pix.copia_e_cola)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section className="mx-auto max-w-md space-y-6 rounded-2xl border border-champagne/30 bg-midnight/60 p-8 backdrop-blur">
      <header className="text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-rose-gold">Pagamento</p>
        <h2 className="mt-2 font-serif text-3xl text-gradient-gold">
          {formatBRL(depositCents)}
        </h2>
        <p className="mt-1 text-sm text-slate">{statusMsg}</p>
      </header>

      <div className="mx-auto flex w-fit items-center justify-center rounded-xl border border-champagne/40 bg-ivory p-4 glow-champagne">
        <QRCodeSVG value={reservation.pix.copia_e_cola} size={220} level="M" />
      </div>

      <div>
        <label className="text-xs uppercase tracking-widest text-champagne">
          Pix copia-e-cola
        </label>
        <div className="mt-2 flex items-stretch gap-2">
          <input
            readOnly
            value={reservation.pix.copia_e_cola}
            className="flex-1 truncate rounded-lg border border-champagne/30 bg-obsidian/60 px-3 py-2 text-xs text-ivory"
          />
          <Button variant="secondary" size="sm" onClick={handleCopy}>
            {copied ? 'Copiado!' : 'Copiar'}
          </Button>
        </div>
      </div>

      <p className="text-center text-xs text-slate">
        Expira em 1h. Após o pagamento, esta tela atualiza automaticamente.
      </p>

      <Button variant="ghost" size="sm" onClick={onCancel} className="w-full">
        Cancelar e voltar
      </Button>
    </section>
  )
}

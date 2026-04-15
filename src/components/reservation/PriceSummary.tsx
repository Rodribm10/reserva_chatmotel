import { useEffect, useRef } from 'react'
import { animate } from 'animejs'
import { formatBRL } from '@/lib/formatters'

interface Props {
  totalCents: number
  depositCents: number
}

export function PriceSummary({ totalCents, depositCents }: Props) {
  const ref = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!ref.current || totalCents === 0) return
    animate(ref.current, { scale: [1, 1.06, 1], duration: 400, easing: 'easeOutQuad' })
  }, [totalCents])

  if (totalCents === 0) return null
  const restante = totalCents - depositCents

  return (
    <section
      ref={ref}
      className="rounded-2xl border border-champagne/30 bg-midnight/60 p-6 backdrop-blur"
    >
      <div className="flex items-baseline justify-between mb-3">
        <span className="text-slate text-sm uppercase tracking-widest">Preço estimado</span>
        <span className="font-serif text-3xl text-champagne">{formatBRL(totalCents)}</span>
      </div>
      <div className="flex items-baseline justify-between text-slate text-sm mb-2">
        <span>Pagar no check-in</span>
        <span>{formatBRL(restante)}</span>
      </div>
      <div className="mt-4 flex items-baseline justify-between rounded-xl border border-champagne/40 bg-champagne/10 px-4 py-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-champagne">Entrada via PIX (50%)</div>
          <div className="text-slate text-xs">Necessário para confirmar</div>
        </div>
        <div className="font-serif text-3xl text-gradient-gold">{formatBRL(depositCents)}</div>
      </div>
    </section>
  )
}

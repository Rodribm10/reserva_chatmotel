import { useState } from 'react'
import { useReservationForm } from '@/hooks/useReservationForm'
import { chatwootApi, type CreateReservationResponse } from '@/lib/chatwootApi'
import { onlyDigits } from '@/lib/formatters'
import { StayDetailsStep } from './StayDetailsStep'
import { ImageGallery } from './ImageGallery'
import { PriceSummary } from './PriceSummary'
import { CustomerForm } from './CustomerForm'
import { PixCheckout } from '@/components/checkout/PixCheckout'
import { SuccessScreen } from '@/components/checkout/SuccessScreen'
import { Button } from '@/components/ui/button'

type Phase = 'form' | 'checkout' | 'success'

export function ReservationFlow() {
  const {
    form,
    update,
    marcas,
    unidades,
    unidadeSelecionada,
    precoTotalCents,
    depositCents,
    fotos,
    canSubmit,
    reset,
  } = useReservationForm()

  const [phase, setPhase] = useState<Phase>('form')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [reservation, setReservation] = useState<CreateReservationResponse | null>(null)

  async function handleSubmit() {
    setSubmitting(true)
    setSubmitError(null)
    try {
      if (unidadeSelecionada?.chatwoot_unit_id == null) {
        throw new Error('Unidade não está vinculada ao Chatwoot')
      }

      const res = await chatwootApi.createReservation({
        chatwoot_unit_id: Number(unidadeSelecionada.chatwoot_unit_id),
        category: form.categoria,
        stay_type: form.permanencia,
        checkin_at: new Date(form.checkinAt).toISOString(),
        customer: {
          name: form.nome,
          phone: onlyDigits(form.telefone),
          cpf: onlyDigits(form.cpf),
          email: form.email || undefined,
        },
        total_cents: precoTotalCents,
        deposit_cents: depositCents,
        notes: form.observacao || undefined,
      })

      setReservation(res)
      setPhase('checkout')
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setSubmitting(false)
    }
  }

  function restart() {
    reset()
    setReservation(null)
    setSubmitError(null)
    setPhase('form')
  }

  if (phase === 'success') {
    return <SuccessScreen onRestart={restart} />
  }

  if (phase === 'checkout' && reservation) {
    return (
      <PixCheckout
        reservation={reservation}
        depositCents={depositCents}
        onPaid={() => setPhase('success')}
        onCancel={restart}
      />
    )
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <StayDetailsStep
        form={form}
        marcas={marcas}
        unidades={unidades}
        onChange={update}
      />

      <ImageGallery fotos={fotos} />

      <PriceSummary totalCents={precoTotalCents} depositCents={depositCents} />

      <CustomerForm form={form} onChange={update} />

      {submitError && (
        <div className="rounded-xl border border-ruby/40 bg-ruby/10 p-4 text-ivory">
          {submitError}
        </div>
      )}

      <Button
        variant="primary"
        size="lg"
        className="w-full"
        disabled={!canSubmit || submitting}
        onClick={handleSubmit}
      >
        {submitting ? 'Gerando PIX...' : 'Confirmar e pagar reserva'}
      </Button>
    </div>
  )
}

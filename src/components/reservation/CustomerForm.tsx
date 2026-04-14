import { FormField } from '@/components/FormField'
import { maskCPF, maskPhone } from '@/lib/formatters'
import type { ReservationFormState } from '@/hooks/useReservationForm'

interface Props {
  form: ReservationFormState
  onChange: <K extends keyof ReservationFormState>(k: K, v: ReservationFormState[K]) => void
}

export function CustomerForm({ form, onChange }: Props) {
  return (
    <section className="space-y-4 rounded-2xl border border-champagne/20 bg-midnight/50 p-6 backdrop-blur">
      <h2 className="font-serif text-2xl text-champagne">Seus dados</h2>

      <FormField
        label="Nome completo"
        required
        placeholder="Como no documento"
        value={form.nome}
        onChange={(e) => onChange('nome', e.target.value)}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Telefone / WhatsApp"
          required
          placeholder="(99) 99999-9999"
          value={form.telefone}
          onChange={(e) => onChange('telefone', maskPhone(e.target.value))}
        />
        <FormField
          label="CPF"
          required
          placeholder="000.000.000-00"
          value={form.cpf}
          onChange={(e) => onChange('cpf', maskCPF(e.target.value))}
        />
      </div>

      <FormField
        label="E-mail"
        type="email"
        placeholder="seu@email.com"
        value={form.email}
        onChange={(e) => onChange('email', e.target.value)}
      />

      <div>
        <label className="font-sans text-xs uppercase tracking-widest text-champagne">
          Observação (opcional)
        </label>
        <textarea
          className="mt-2 w-full rounded-lg border border-champagne/30 bg-midnight/60 px-4 py-3 font-sans text-ivory placeholder:text-slate focus:border-champagne focus:outline-none"
          rows={3}
          placeholder="Alguma preferência especial?"
          value={form.observacao}
          onChange={(e) => onChange('observacao', e.target.value)}
        />
      </div>
    </section>
  )
}

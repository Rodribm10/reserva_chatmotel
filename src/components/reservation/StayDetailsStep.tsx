import { SelectField } from '@/components/SelectField'
import { FormField } from '@/components/FormField'
import type { ReservationFormState } from '@/hooks/useReservationForm'
import type { Database } from '@/types/database'

type Marca = Database['reserva_hotel']['Tables']['marcas']['Row']
type Unidade = Database['reserva_hotel']['Tables']['unidades']['Row']

interface Props {
  form: ReservationFormState
  marcas: Marca[]
  unidades: Unidade[]
  onChange: <K extends keyof ReservationFormState>(k: K, v: ReservationFormState[K]) => void
}

export function StayDetailsStep({ form, marcas, unidades, onChange }: Props) {
  const marca = marcas.find((m) => m.id === form.marcaId) ?? null
  const unidade = unidades.find((u) => u.id === form.unidadeId) ?? null

  const categoriaOptions =
    unidade?.categorias_visiveis?.map((c) => ({ value: c, label: c })) ??
    marca?.categorias?.map((c) => ({ value: c, label: c })) ??
    []

  const permanenciaOptions =
    marca?.permanencias?.map((p) => ({ value: p, label: p })) ?? []

  return (
    <section className="space-y-6 rounded-2xl border border-champagne/20 bg-midnight/50 p-6 backdrop-blur">
      <h2 className="font-serif text-2xl text-champagne">Detalhes da estadia</h2>

      <SelectField
        label="Marca"
        required
        value={form.marcaId}
        onChange={(e) => onChange('marcaId', e.target.value)}
        options={marcas.map((m) => ({ value: m.id, label: m.nome }))}
      />

      <SelectField
        label="Unidade do Hotel"
        required
        disabled={!form.marcaId}
        value={form.unidadeId}
        onChange={(e) => onChange('unidadeId', e.target.value)}
        options={unidades.map((u) => ({ value: u.id, label: u.nome }))}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectField
          label="Permanência"
          required
          disabled={!form.marcaId}
          value={form.permanencia}
          onChange={(e) => onChange('permanencia', e.target.value)}
          options={permanenciaOptions}
        />

        <SelectField
          label="Categoria da suíte"
          required
          disabled={!form.unidadeId}
          value={form.categoria}
          onChange={(e) => onChange('categoria', e.target.value)}
          options={categoriaOptions}
        />
      </div>

      <FormField
        label="Data e horário do check-in"
        required
        type="datetime-local"
        value={form.checkinAt}
        onChange={(e) => onChange('checkinAt', e.target.value)}
      />
    </section>
  )
}

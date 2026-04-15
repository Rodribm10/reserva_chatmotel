import { motion } from 'motion/react'
import { SelectField } from '@/components/SelectField'
import { FormField } from '@/components/FormField'
import { Skeleton } from '@/components/ui/skeleton'
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
}

export function StayDetailsStep({ form, marcas, unidades, onChange }: Props) {
  if (marcas.length === 0) {
    return (
      <section className="space-y-6 rounded-2xl border border-champagne/20 bg-midnight/50 p-6 backdrop-blur">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
        <Skeleton className="h-12 w-full" />
      </section>
    )
  }

  const marca = marcas.find((m) => m.id === form.marcaId) ?? null
  const unidade = unidades.find((u) => u.id === form.unidadeId) ?? null

  const categoriaOptions =
    unidade?.categorias_visiveis?.map((c) => ({ value: c, label: c })) ??
    marca?.categorias?.map((c) => ({ value: c, label: c })) ??
    []

  const permanenciaOptions =
    marca?.permanencias?.map((p) => ({ value: p, label: p })) ?? []

  return (
    <motion.section
      className="space-y-6 rounded-2xl border border-champagne/20 bg-midnight/50 p-6 backdrop-blur"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h2 variants={itemVariants} className="font-serif text-2xl text-champagne">
        Detalhes da estadia
      </motion.h2>

      <motion.div variants={itemVariants}>
        <SelectField
          label="Marca"
          required
          value={form.marcaId}
          onChange={(e) => onChange('marcaId', e.target.value)}
          options={marcas.map((m) => ({ value: m.id, label: m.nome }))}
        />
      </motion.div>

      <motion.div key={form.marcaId || 'no-marca'} variants={containerVariants} initial="hidden" animate="visible">
        <motion.div variants={itemVariants}>
          <SelectField
            label="Unidade do Hotel"
            required
            disabled={!form.marcaId}
            value={form.unidadeId}
            onChange={(e) => onChange('unidadeId', e.target.value)}
            options={unidades.map((u) => ({ value: u.id, label: u.nome }))}
          />
        </motion.div>

        <motion.div variants={itemVariants} className="mt-6">
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
        </motion.div>

        <motion.div variants={itemVariants} className="mt-6">
          <FormField
            label="Data e horário do check-in"
            required
            type="datetime-local"
            value={form.checkinAt}
            onChange={(e) => onChange('checkinAt', e.target.value)}
          />
        </motion.div>
      </motion.div>
    </motion.section>
  )
}

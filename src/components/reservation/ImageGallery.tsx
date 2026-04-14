import type { Database } from '@/types/database'

type Foto = Database['reserva_hotel']['Tables']['fotos_categoria']['Row']

interface Props {
  fotos: Foto[]
}

export function ImageGallery({ fotos }: Props) {
  if (fotos.length === 0) return null

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {fotos.map((foto) => (
        <div
          key={foto.id}
          className="aspect-video overflow-hidden rounded-xl border border-champagne/20"
        >
          <img
            src={foto.url_foto}
            alt={foto.alt ?? 'Foto da suíte'}
            className="h-full w-full object-cover transition duration-500 hover:scale-105"
          />
        </div>
      ))}
    </section>
  )
}

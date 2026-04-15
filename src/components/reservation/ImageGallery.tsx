import { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { motion, AnimatePresence } from 'motion/react'
import type { Database } from '@/types/database'

type Foto = Database['reserva_hotel']['Tables']['fotos_categoria']['Row']

interface Props {
  fotos: Foto[]
}

export function ImageGallery({ fotos }: Props) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'center' })
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIdx(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    emblaApi.on('select', onSelect)
    onSelect()
    return () => {
      emblaApi.off('select', onSelect)
    }
  }, [emblaApi, onSelect])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (lightboxIdx === null) return
      if (e.key === 'Escape') setLightboxIdx(null)
      if (e.key === 'ArrowLeft')
        setLightboxIdx((idx) => (idx !== null && idx > 0 ? idx - 1 : idx))
      if (e.key === 'ArrowRight')
        setLightboxIdx((idx) => (idx !== null && idx < fotos.length - 1 ? idx + 1 : idx))
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [lightboxIdx, fotos.length])

  if (fotos.length === 0) return null

  return (
    <>
      <section className="space-y-3">
        <div className="overflow-hidden rounded-2xl border border-champagne/20" ref={emblaRef}>
          <div className="flex">
            {fotos.map((foto, idx) => (
              <button
                type="button"
                key={foto.id}
                className="relative flex-[0_0_100%] aspect-video overflow-hidden"
                onClick={() => setLightboxIdx(idx)}
                aria-label={`Abrir foto ${idx + 1}`}
              >
                <img
                  src={foto.url_foto}
                  alt={foto.alt ?? `Foto ${idx + 1}`}
                  className="h-full w-full object-cover transition duration-500 hover:scale-105"
                />
              </button>
            ))}
          </div>
        </div>

        {fotos.length > 1 && (
          <div className="flex justify-center gap-2">
            {fotos.map((_, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`Ir para foto ${idx + 1}`}
                className={`h-1.5 w-8 rounded-full transition ${
                  idx === selectedIdx ? 'bg-champagne' : 'bg-champagne/20'
                }`}
                onClick={() => emblaApi?.scrollTo(idx)}
              />
            ))}
          </div>
        )}
      </section>

      <AnimatePresence>
        {lightboxIdx !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/95 backdrop-blur p-4"
            onClick={() => setLightboxIdx(null)}
          >
            <button
              type="button"
              className="absolute top-6 right-6 text-ivory text-3xl hover:text-champagne"
              onClick={() => setLightboxIdx(null)}
              aria-label="Fechar"
            >
              ×
            </button>
            {lightboxIdx > 0 && (
              <button
                type="button"
                className="absolute left-6 text-ivory text-4xl hover:text-champagne"
                onClick={(e) => {
                  e.stopPropagation()
                  setLightboxIdx(lightboxIdx - 1)
                }}
                aria-label="Anterior"
              >
                ‹
              </button>
            )}
            {lightboxIdx < fotos.length - 1 && (
              <button
                type="button"
                className="absolute right-6 text-ivory text-4xl hover:text-champagne"
                onClick={(e) => {
                  e.stopPropagation()
                  setLightboxIdx(lightboxIdx + 1)
                }}
                aria-label="Próxima"
              >
                ›
              </button>
            )}
            <motion.img
              key={lightboxIdx}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              src={fotos[lightboxIdx].url_foto}
              alt={fotos[lightboxIdx].alt ?? ''}
              className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

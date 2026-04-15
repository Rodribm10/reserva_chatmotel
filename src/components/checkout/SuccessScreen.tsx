import { useEffect } from 'react'
import confetti from 'canvas-confetti'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'

interface Props {
  onRestart: () => void
}

export function SuccessScreen({ onRestart }: Props) {
  useEffect(() => {
    const colors = ['#C9A961', '#E8B4A0', '#10B981', '#F5F1E8']
    confetti({ particleCount: 100, spread: 90, origin: { y: 0.6 }, colors })
    setTimeout(() => confetti({ particleCount: 60, spread: 120, origin: { y: 0.6 }, colors }), 250)
    setTimeout(() => confetti({ particleCount: 80, spread: 100, origin: { y: 0.6 }, colors }), 500)
  }, [])

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      className="mx-auto max-w-md text-center space-y-6 rounded-2xl border border-emerald/40 bg-emerald/10 p-10 backdrop-blur"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 180, damping: 12 }}
        className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald"
      >
        <svg viewBox="0 0 52 52" className="h-12 w-12">
          <motion.path
            d="M14 27 L23 36 L40 18"
            fill="none"
            stroke="#0b0d12"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.5, duration: 0.55, ease: 'easeOut' }}
          />
        </svg>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="font-serif text-3xl text-ivory"
      >
        Reserva confirmada!
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.75 }}
        className="text-slate"
      >
        O pagamento caiu e sua reserva já está registrada.
        <br />
        Nossa atendente foi avisada e vai confirmar os próximos passos pelo WhatsApp.
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
      >
        <Button variant="primary" size="md" onClick={onRestart} className="w-full">
          Fazer outra reserva
        </Button>
      </motion.div>
    </motion.section>
  )
}

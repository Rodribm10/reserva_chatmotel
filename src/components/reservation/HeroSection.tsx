import { motion } from 'motion/react'
import type { Database } from '@/types/database'

type AppConfig = Database['reserva_hotel']['Tables']['app_config']['Row']

interface Props {
  config: AppConfig
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.18, delayChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
}

export function HeroSection({ config }: Props) {
  return (
    <motion.header
      className="text-center mb-10"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {config.subtitulo_hero && (
        <motion.p
          variants={itemVariants}
          className="font-sans text-sm uppercase tracking-[0.3em] text-rose-gold mb-4"
        >
          {config.subtitulo_hero}
        </motion.p>
      )}
      <motion.h1
        variants={itemVariants}
        className="font-serif text-5xl md:text-6xl text-gradient-gold mb-3"
      >
        {config.titulo_hero}
      </motion.h1>
      {config.tagline && (
        <motion.p variants={itemVariants} className="font-sans text-slate text-lg">
          {config.tagline}
        </motion.p>
      )}
    </motion.header>
  )
}

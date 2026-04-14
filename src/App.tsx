import { ReservationFlow } from '@/components/reservation/ReservationFlow'

export default function App() {
  return (
    <main className="min-h-screen flex flex-col items-center px-6 py-12">
      <header className="text-center mb-10">
        <p className="font-sans text-sm uppercase tracking-[0.3em] text-rose-gold mb-4">
          Experiência exclusiva
        </p>
        <h1 className="font-serif text-5xl md:text-6xl text-gradient-gold mb-3">
          Reserva Rede 1001
        </h1>
        <p className="font-sans text-slate text-lg">
          Escolha, confirme e receba seu PIX na hora.
        </p>
      </header>

      <ReservationFlow />

      <footer className="mt-16 text-slate text-xs uppercase tracking-widest">
        © 2026 Reserva Rede 1001 · Experiência Exclusiva
      </footer>
    </main>
  )
}

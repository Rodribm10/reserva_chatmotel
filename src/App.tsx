import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type Marca = Database['reserva_hotel']['Tables']['marcas']['Row']

export default function App() {
  const [marcas, setMarcas] = useState<Marca[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadMarcas() {
      const { data, error } = await supabase
        .from('marcas')
        .select('*')
        .eq('ativa', true)
        .order('nome', { ascending: true })

      if (error) {
        setError(error.message)
      } else {
        setMarcas(data ?? [])
      }
      setLoading(false)
    }
    loadMarcas()
  }, [])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <header className="text-center mb-12">
        <p className="font-sans text-sm uppercase tracking-[0.3em] text-rose-gold mb-4">
          Experiência exclusiva
        </p>
        <h1 className="font-serif text-6xl md:text-7xl text-gradient-gold mb-4">
          Reserva Rede 1001
        </h1>
        <p className="font-sans text-slate text-lg">Escolha uma das nossas marcas para começar</p>
      </header>

      {loading && <p className="text-slate">Carregando marcas...</p>}

      {error && (
        <div className="rounded-xl border border-ruby/40 bg-ruby/10 p-4 text-ivory">
          Erro ao carregar: {error}
        </div>
      )}

      {!loading && !error && marcas.length === 0 && (
        <p className="text-slate">Nenhuma marca cadastrada ainda.</p>
      )}

      {!loading && !error && marcas.length > 0 && (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
          {marcas.map((marca) => (
            <li
              key={marca.id}
              className="rounded-xl border border-champagne/20 bg-midnight/60 backdrop-blur p-6 text-center transition hover:border-champagne hover:glow-champagne"
            >
              <h2 className="font-serif text-2xl text-champagne">{marca.nome}</h2>
              {marca.descricao && <p className="text-slate text-sm mt-1">{marca.descricao}</p>}
              {marca.categorias && marca.categorias.length > 0 && (
                <p className="text-rose-gold text-xs mt-2 uppercase tracking-widest">
                  {marca.categorias.join(' · ')}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      <footer className="mt-16 text-slate text-xs uppercase tracking-widest">
        © 2026 Reserva Rede 1001 · Fase 1 · Fundação
      </footer>
    </main>
  )
}

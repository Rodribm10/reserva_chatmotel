import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from '@/App'

describe('App', () => {
  it('renderiza título premium', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /reserva rede 1001/i })).toBeInTheDocument()
  })

  it('exibe marcas retornadas do supabase após carregar', async () => {
    render(<App />)
    await waitFor(() => {
      expect(screen.getByText('Hotel 1001 Noites')).toBeInTheDocument()
      expect(screen.getByText('Dolce Amore')).toBeInTheDocument()
    })
  })

  it('não mostra estado de loading após fetch completar', async () => {
    render(<App />)
    await waitFor(() => {
      expect(screen.queryByText(/carregando marcas/i)).not.toBeInTheDocument()
    })
  })
})

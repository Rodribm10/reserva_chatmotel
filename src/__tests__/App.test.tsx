import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/hooks/useReservationForm', () => ({
  useReservationForm: () => ({
    form: {
      marcaId: '',
      unidadeId: '',
      permanencia: '',
      categoria: '',
      checkinAt: '',
      nome: '',
      telefone: '',
      cpf: '',
      email: '',
      observacao: '',
    },
    update: vi.fn(),
    marcas: [],
    unidades: [],
    marcaSelecionada: null,
    unidadeSelecionada: null,
    preco: null,
    precoTotalCents: 0,
    depositCents: 0,
    fotos: [],
    loading: false,
    setLoading: vi.fn(),
    error: null,
    setError: vi.fn(),
    canSubmit: false,
    reset: vi.fn(),
  }),
}))

import App from '@/App'

describe('App', () => {
  it('renderiza o titulo premium', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /reserva rede 1001/i })).toBeInTheDocument()
  })

  it('renderiza o botao de confirmar', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: /confirmar e pagar reserva/i })).toBeInTheDocument()
  })
})

import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/contexts/TenantProvider', () => ({
  TenantProvider: ({ children }: { children: React.ReactNode }) => children,
  useTenant: () => ({
    loading: false,
    error: null,
    context: {
      tenant: {
        id: 1,
        slug: 'test',
        nome: 'Test',
        ativo: true,
        created_at: '',
        updated_at: '',
      },
      config: {
        id: 1,
        tenant_id: 1,
        nome_rede: 'Test Rede',
        titulo_hero: 'Reserva Rede 1001',
        subtitulo_hero: 'Teste',
        tagline: null,
        footer_text: null,
        logo_url: null,
        favicon_url: null,
        cor_primaria: '#C9A961',
        cor_secundaria: '#E8B4A0',
        cor_fundo: '#0B0D12',
        cor_superficie: '#0F1A2E',
        cor_texto: '#F5F1E8',
        fonte_display: 'Fraunces',
        fonte_corpo: 'Inter',
        created_at: '',
        updated_at: '',
      },
    },
    refresh: vi.fn(),
  }),
}))

vi.mock('@/hooks/useAppConfig', () => ({
  useAppConfig: () => ({
    titulo_hero: 'Reserva Rede 1001',
    subtitulo_hero: 'Teste',
    tagline: null,
    footer_text: null,
  }),
  useTenantId: () => 1,
}))

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

import App from '@/pages/ReservationPage'

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

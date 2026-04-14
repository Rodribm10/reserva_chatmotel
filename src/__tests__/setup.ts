import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

afterEach(() => {
  cleanup()
})

// Mock do Supabase client — imita from('marcas').select('*').eq('ativa', true).order('nome')
vi.mock('@/lib/supabase', () => {
  const mockMarcas = [
    {
      id: '3fac5ed4-100f-4c0a-82ce-06110758b9c9',
      nome: 'Hotel 1001 Noites',
      categorias: ['Standard', 'Superior', 'Luxo'],
      permanencias: ['3hrs', '6hrs', 'Pernoite'],
      descricao: null,
      ativa: true,
      created_at: '2026-04-13T00:00:00Z',
      updated_at: '2026-04-13T00:00:00Z',
    },
    {
      id: '11111111-1111-1111-1111-111111111111',
      nome: 'Dolce Amore',
      categorias: ['Suite Master', 'Apartamento'],
      permanencias: ['3hrs', '4hrs'],
      descricao: null,
      ativa: true,
      created_at: '2026-04-13T00:00:00Z',
      updated_at: '2026-04-13T00:00:00Z',
    },
  ]

  const orderFn = vi.fn(() => Promise.resolve({ data: mockMarcas, error: null }))
  const eqFn = vi.fn(() => ({ order: orderFn }))
  const selectFn = vi.fn(() => ({ eq: eqFn, order: orderFn }))
  const fromFn = vi.fn(() => ({ select: selectFn }))

  return {
    supabase: { from: fromFn },
  }
})

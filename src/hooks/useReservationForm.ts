import { useEffect, useState, useCallback } from 'react'
import { catalogoService } from '@/services/catalogoService'
import type { Database } from '@/types/database'

type Marca = Database['reserva_hotel']['Tables']['marcas']['Row']
type Unidade = Database['reserva_hotel']['Tables']['unidades']['Row']
type Preco = Database['reserva_hotel']['Tables']['precos']['Row']
type Foto = Database['reserva_hotel']['Tables']['fotos_categoria']['Row']

export interface ReservationFormState {
  marcaId: string
  unidadeId: string
  permanencia: string
  categoria: string
  checkinAt: string // datetime-local format
  nome: string
  telefone: string
  cpf: string
  email: string
  observacao: string
}

const empty: ReservationFormState = {
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
}

export function useReservationForm() {
  const [form, setForm] = useState<ReservationFormState>(empty)
  const [marcas, setMarcas] = useState<Marca[]>([])
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [preco, setPreco] = useState<Preco | null>(null)
  const [fotos, setFotos] = useState<Foto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    catalogoService
      .listMarcas()
      .then(setMarcas)
      .catch((err: Error) => setError(err.message))
  }, [])

  useEffect(() => {
    if (!form.marcaId) {
      setUnidades([])
      return
    }
    catalogoService
      .listUnidades(form.marcaId)
      .then(setUnidades)
      .catch((err: Error) => setError(err.message))
  }, [form.marcaId])

  useEffect(() => {
    if (!form.marcaId || !form.categoria || !form.permanencia) {
      setPreco(null)
      return
    }
    catalogoService
      .findPreco(form.marcaId, form.categoria, form.permanencia)
      .then(setPreco)
      .catch((err: Error) => setError(err.message))
  }, [form.marcaId, form.categoria, form.permanencia])

  useEffect(() => {
    if (!form.unidadeId || !form.categoria) {
      setFotos([])
      return
    }
    catalogoService
      .listFotos(form.unidadeId, form.categoria)
      .then(setFotos)
      .catch((err: Error) => setError(err.message))
  }, [form.unidadeId, form.categoria])

  const update = useCallback(<K extends keyof ReservationFormState>(
    key: K,
    value: ReservationFormState[K]
  ) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'marcaId') {
        next.unidadeId = ''
        next.categoria = ''
        next.permanencia = ''
      }
      if (key === 'unidadeId') {
        next.categoria = ''
      }
      return next
    })
  }, [])

  const marcaSelecionada = marcas.find((m) => m.id === form.marcaId) ?? null
  const unidadeSelecionada = unidades.find((u) => u.id === form.unidadeId) ?? null

  const precoTotalCents = preco ? Math.round(Number(preco.valor) * 100) : 0
  const depositCents = Math.round(precoTotalCents / 2)

  const canSubmit =
    form.marcaId !== '' &&
    form.unidadeId !== '' &&
    form.categoria !== '' &&
    form.permanencia !== '' &&
    form.checkinAt !== '' &&
    form.nome.trim() !== '' &&
    form.telefone.replace(/\D/g, '').length >= 10 &&
    form.cpf.replace(/\D/g, '').length === 11 &&
    preco !== null

  return {
    form,
    update,
    marcas,
    unidades,
    marcaSelecionada,
    unidadeSelecionada,
    preco,
    precoTotalCents,
    depositCents,
    fotos,
    loading,
    setLoading,
    error,
    setError,
    canSubmit,
    reset: () => setForm(empty),
  }
}

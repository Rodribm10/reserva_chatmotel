import { useEffect, useState, useCallback, useRef } from 'react'
import { catalogoService } from '@/services/catalogoService'
import type { Database } from '@/types/database'
import type { PrefillData } from '@/lib/prefill'
import { prefillSimpleFields } from '@/lib/prefill'

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

export function useReservationForm(initialPrefill?: PrefillData) {
  const [form, setForm] = useState<ReservationFormState>(() => ({
    ...empty,
    ...prefillSimpleFields(initialPrefill ?? {}),
  }))
  const [marcas, setMarcas] = useState<Marca[]>([])
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [preco, setPreco] = useState<Preco | null>(null)
  const [fotos, setFotos] = useState<Foto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const marcaPrefillAppliedRef = useRef(false)
  const unidadePrefillAppliedRef = useRef(false)

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

  // Resolve prefill: marcaNome -> marcaId quando marcas carregam
  useEffect(() => {
    if (marcaPrefillAppliedRef.current) return
    if (!initialPrefill?.marcaNome) return
    if (marcas.length === 0) return

    const marca = marcas.find(
      (m) => m.nome.toLowerCase() === initialPrefill.marcaNome!.toLowerCase()
    )
    if (marca) {
      // Usa setForm direto pra NÃO disparar o reset em cascata do update()
      setForm((prev) => ({ ...prev, marcaId: marca.id }))
    }
    marcaPrefillAppliedRef.current = true
  }, [marcas, initialPrefill])

  // Resolve prefill: unidadeNome -> unidadeId + seta categoria/permanencia quando unidades carregam
  useEffect(() => {
    if (unidadePrefillAppliedRef.current) return
    if (!initialPrefill?.unidadeNome) return
    if (unidades.length === 0) return

    const unidade = unidades.find(
      (u) => u.nome.toLowerCase() === initialPrefill.unidadeNome!.toLowerCase()
    )
    if (unidade) {
      setForm((prev) => ({
        ...prev,
        unidadeId: unidade.id,
        permanencia: initialPrefill.permanencia ?? prev.permanencia,
        categoria: initialPrefill.categoria ?? prev.categoria,
      }))
    }
    unidadePrefillAppliedRef.current = true
  }, [unidades, initialPrefill])

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

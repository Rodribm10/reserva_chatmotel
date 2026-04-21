import { useEffect, useState, useCallback, useRef } from 'react'
import { catalogoService } from '@/services/catalogoService'
import type { Database } from '@/types/database'
import type { PrefillData } from '@/lib/prefill'
import { prefillSimpleFields } from '@/lib/prefill'
import { useTenantId } from '@/hooks/useAppConfig'

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

function matchCanonical(candidates: string[] | null | undefined, value: string | undefined): string | undefined {
  if (!value) return undefined
  if (!candidates || candidates.length === 0) return value
  return candidates.find((c) => c.toLowerCase() === value.toLowerCase()) ?? value
}

export function useReservationForm(initialPrefill?: PrefillData) {
  const tenantId = useTenantId()

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
    if (!tenantId) return
    catalogoService
      .listMarcas(tenantId)
      .then(setMarcas)
      .catch((err: Error) => setError(err.message))
  }, [tenantId])

  useEffect(() => {
    if (!tenantId) return
    if (!form.marcaId) {
      setUnidades([])
      return
    }
    catalogoService
      .listUnidades(tenantId, form.marcaId)
      .then(setUnidades)
      .catch((err: Error) => setError(err.message))
  }, [tenantId, form.marcaId])

  useEffect(() => {
    if (!tenantId || !form.marcaId || !form.categoria || !form.permanencia) {
      setPreco(null)
      return
    }
    const fetchPreco = async () => {
      try {
        const checkinDate = form.checkinAt ? new Date(form.checkinAt) : null
        const p =
          checkinDate && !isNaN(checkinDate.getTime())
            ? await catalogoService.findPrecoForDate(
                tenantId,
                form.marcaId,
                form.categoria,
                form.permanencia,
                checkinDate
              )
            : await catalogoService.findPreco(
                tenantId,
                form.marcaId,
                form.categoria,
                form.permanencia
              )
        setPreco(p)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar preço')
      }
    }
    void fetchPreco()
  }, [tenantId, form.marcaId, form.categoria, form.permanencia, form.checkinAt])

  useEffect(() => {
    if (!tenantId) return
    if (!form.unidadeId || !form.categoria) {
      setFotos([])
      return
    }
    catalogoService
      .listFotos(tenantId, form.unidadeId, form.categoria)
      .then(setFotos)
      .catch((err: Error) => setError(err.message))
  }, [tenantId, form.unidadeId, form.categoria])

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
      // Case-insensitive match contra valores canônicos da marca — o Chatwoot envia
      // "pernoite"/"alexa" minúsculo e o DB armazena "Pernoite"/"Alexa".
      const marca = marcas.find((m) => m.id === unidade.id_marca)
      const canonicalPermanencia = matchCanonical(marca?.permanencias, initialPrefill.permanencia)
      const canonicalCategoria = matchCanonical(marca?.categorias, initialPrefill.categoria)
      setForm((prev) => ({
        ...prev,
        unidadeId: unidade.id,
        permanencia: canonicalPermanencia ?? prev.permanencia,
        categoria: canonicalCategoria ?? prev.categoria,
      }))
    }
    unidadePrefillAppliedRef.current = true
  }, [unidades, marcas, initialPrefill])

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

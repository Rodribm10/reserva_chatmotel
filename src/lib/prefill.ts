import type { ReservationFormState } from '@/hooks/useReservationForm'

// Mapeamento dos query params para o estado do form.
// marca/unidade/categoria/permanencia vêm como NOMES (string), não IDs —
// a UI resolve os IDs depois que o catálogo carrega.
export interface PrefillData {
  marcaNome?: string
  unidadeNome?: string
  permanencia?: string
  categoria?: string
  checkinAt?: string // ISO
  nome?: string
  telefone?: string
  cpf?: string
  email?: string
  observacao?: string
}

export function parsePrefillFromURL(): PrefillData {
  if (typeof window === 'undefined') return {}
  const params = new URLSearchParams(window.location.search)

  const get = (key: string): string | undefined => {
    const v = params.get(key)
    return v && v.trim() !== '' ? v.trim() : undefined
  }

  return {
    marcaNome: get('marca'),
    unidadeNome: get('unidade'),
    permanencia: get('permanencia'),
    categoria: get('categoria'),
    checkinAt: get('checkin'),
    nome: get('nome'),
    telefone: get('telefone'),
    cpf: get('cpf'),
    email: get('email'),
    observacao: get('obs'),
  }
}

// Retorna apenas os campos "simples" (não dependentes de resolução de catálogo)
// prontos para serem aplicados no estado inicial do form.
export function prefillSimpleFields(prefill: PrefillData): Partial<ReservationFormState> {
  const out: Partial<ReservationFormState> = {}
  if (prefill.nome) out.nome = prefill.nome
  if (prefill.telefone) out.telefone = prefill.telefone
  if (prefill.cpf) out.cpf = prefill.cpf
  if (prefill.email) out.email = prefill.email
  if (prefill.observacao) out.observacao = prefill.observacao
  if (prefill.checkinAt) {
    try {
      const d = new Date(prefill.checkinAt)
      if (!isNaN(d.getTime())) {
        const pad = (n: number) => String(n).padStart(2, '0')
        out.checkinAt = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
      }
    } catch {
      // ignore invalid date
    }
  }
  return out
}

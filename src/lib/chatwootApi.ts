const API_URL = import.meta.env.VITE_CHATWOOT_API_URL
const API_TOKEN = import.meta.env.VITE_CHATWOOT_API_TOKEN

if (!API_URL || !API_TOKEN) {
  console.warn('VITE_CHATWOOT_API_URL / VITE_CHATWOOT_API_TOKEN nao definidos')
}

export interface CreateReservationInput {
  chatwoot_unit_id: number
  category: string
  stay_type: string
  checkin_at: string // ISO
  customer: {
    name: string
    phone: string
    cpf: string
    email?: string
  }
  total_cents: number
  deposit_cents: number
  notes?: string
}

export interface CreateReservationResponse {
  reservation_id: number
  conversation_id: number
  pix: {
    txid: string
    copia_e_cola: string
    qrcode_base64: string | null
    expires_at: string
  }
}

export interface StatusResponse {
  reservation_id: number
  status: 'pending' | 'paid' | 'expired' | 'canceled'
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Reserva-Token': API_TOKEN,
      // Pula a pagina de aviso do ngrok quando o chatwoot esta atras do tunnel
      'ngrok-skip-browser-warning': 'true',
      ...(init.headers ?? {}),
    },
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Chatwoot API ${res.status}: ${body || res.statusText}`)
  }

  return (await res.json()) as T
}

export const chatwootApi = {
  createReservation(input: CreateReservationInput): Promise<CreateReservationResponse> {
    return request('/public/api/v1/captain/public_reservations', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },

  getStatus(id: number): Promise<StatusResponse> {
    return request(`/public/api/v1/captain/public_reservations/${id}/status`)
  },
}

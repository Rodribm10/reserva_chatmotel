import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabaseSchema = import.meta.env.VITE_SUPABASE_SCHEMA ?? 'reserva_hotel'

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não estão definidas. Copie .env.local.example para .env.local e preencha.'
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  db: { schema: supabaseSchema as 'reserva_hotel' },
})

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[SIGABIM] Faltan variables de entorno: VITE_SUPABASE_URL y/o VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type UserStatus = 'pendiente' | 'aprobado' | 'denegado'

export interface Profile {
  id: string
  nombre: string
  email: string
  telefono: string | null
  status: UserStatus
  avatar_url: string | null
  created_at: string
}

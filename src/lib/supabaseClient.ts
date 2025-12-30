import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('🔍 SUPABASE_URL:', supabaseUrl)
console.log('🔍 SUPABASE_KEY existe:', !!supabaseAnonKey) 
console.log('🔍 Todas as env vars:', import.meta.env)

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltam as variáveis de ambiente do Supabase!')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

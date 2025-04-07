import { createClient } from '@supabase/supabase-js'

let supabase: ReturnType<typeof createClient>

try {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'ariadocs-auth',
      flowType: 'pkce'
    }
  })
} catch (error) {
  console.error('Error initializing Supabase client:', error)
  // Provide a dummy client that won't throw errors
  supabase = createClient('https://placeholder.supabase.co', 'dummy-key', {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  })
}

export default supabase 
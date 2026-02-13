import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseInstance: ReturnType<typeof createClientComponentClient> | null = null

function getSupabase() {
  if (!supabaseInstance) {
    supabaseInstance = createClientComponentClient()
  }
  return supabaseInstance
}

// For backward compatibility, export as a Proxy
export const supabase = new Proxy({} as ReturnType<typeof createClientComponentClient>, {
  get(_target, prop) {
    return getSupabase()[prop as keyof ReturnType<typeof createClientComponentClient>]
  }
})

let supabaseAdminInstance: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdminInstance) {
    supabaseAdminInstance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  }
  return supabaseAdminInstance
}

// For backward compatibility, export as a getter
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return getSupabaseAdmin()[prop as keyof SupabaseClient]
  }
})

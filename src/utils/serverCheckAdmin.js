import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function serverCheckAdminStatus(token) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  })

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) throw authError

    const { data, error } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (error) throw error
    return data.is_admin
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}
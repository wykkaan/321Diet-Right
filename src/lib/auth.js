import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function signUp(email, password, username) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
      emailRedirectTo: `${window.location.origin}/email-confirmation-pending`
    }
  })
  if (error) throw error
  return data
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getUserSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function resetPassword(email) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email)
  if (error) throw error
  return data
}

export async function checkEmailConfirmation() {
  const { data: { user } } = await supabase.auth.getUser()
  return user?.email_confirmed_at !== null
}

export async function resendConfirmationEmail() {
  const { data, error } = await supabase.auth.resend({
    type: 'signup',
    options: {
      emailRedirectTo: `${window.location.origin}/email-confirmation-pending`
    }
  })
  if (error) throw error
  return data
}

export async function updatePassword(newPassword) {
  const { data, error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
  return data
}

export async function updateUserProfile(updates) {
  const { data, error } = await supabase.auth.updateUser({ data: updates })
  if (error) throw error
  return data
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session, event)
  })
}

export async function getUserById(id) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function updateUserInDatabase(id, updates) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)

  if (error) throw error
  return data
}

export async function checkUserCompletion(userId) {
  const { data: profile, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error

  const requiredFields = ['username', 'goal', 'gender', 'age', 'height', 'weight', 'target_calories']
  const missingFields = requiredFields.filter(field => !profile[field])

  return missingFields.length === 0
}
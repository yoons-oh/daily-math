import { Session, User } from '@supabase/supabase-js'
import { supabase } from './supabase'

const requireSupabase = () => {
  if (!supabase) {
    throw new Error('Supabase 환경변수 VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY를 확인해 주세요.')
  }
  return supabase
}

export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await requireSupabase().auth.signUp({ email, password })
  if (error) throw error
  return data
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await requireSupabase().auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await requireSupabase().auth.signOut()
  if (error) throw error
}

export async function resetPassword(email: string) {
  const { error } = await requireSupabase().auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth`,
  })
  if (error) throw error
}

export async function getCurrentSession(): Promise<Session | null> {
  if (!supabase) return null
  const { data, error } = await supabase.auth.getSession()
  if (error) return null
  return data.session
}

export function onAuthStateChange(callback: (user: User | null) => void) {
  if (!supabase) {
    callback(null)
    return () => undefined
  }

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null)
  })

  return () => data.subscription.unsubscribe()
}

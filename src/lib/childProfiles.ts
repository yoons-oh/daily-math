import { ChildProfile, Level } from './types'
import { supabase } from './supabase'
import { getStoredLanguage, isSupportedLanguage, SupportedLanguage } from './language'

type ChildProfileRow = {
  id: string
  user_id: string
  name: string
  age: number
  avatar: string
  current_level: Level
  created_at: string
  language?: SupportedLanguage | null
}

export type NewChildProfile = {
  name: string
  age: number
  avatar: string
  currentLevel: Level
  language?: SupportedLanguage
}

const requireSupabase = () => {
  if (!supabase) {
    throw new Error('Supabase 환경변수 VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY를 확인해 주세요.')
  }
  return supabase
}

const getUserId = async () => {
  const client = requireSupabase()
  const { data, error } = await client.auth.getUser()

  if (error || !data.user) {
    throw new Error('로그인이 필요합니다.')
  }

  return data.user.id
}

const toProfile = (row: ChildProfileRow): ChildProfile => ({
  id: row.id,
  name: row.name,
  age: row.age,
  avatar: row.avatar,
  currentLevel: row.current_level,
  createdAt: row.created_at,
  language: isSupportedLanguage(row.language) ? row.language : undefined,
})

function isMissingLanguageColumnError(error: unknown) {
  if (!error || typeof error !== 'object') return false
  const maybeError = error as { code?: string; message?: string; details?: string; hint?: string }
  const text = `${maybeError.message ?? ''} ${maybeError.details ?? ''} ${maybeError.hint ?? ''}`.toLowerCase()

  return (
    maybeError.code === 'PGRST204' ||
    maybeError.code === '42703' ||
    (text.includes('language') && (text.includes('column') || text.includes('schema cache')))
  )
}

export async function fetchChildProfiles(): Promise<ChildProfile[]> {
  const client = requireSupabase()
  const userId = await getUserId()

  const withLanguage = await client
    .from('child_profiles')
    .select('id,user_id,name,age,avatar,current_level,created_at,language')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (!withLanguage.error) return (withLanguage.data as ChildProfileRow[]).map(toProfile)
  if (!isMissingLanguageColumnError(withLanguage.error)) throw withLanguage.error

  const fallback = await client
    .from('child_profiles')
    .select('id,user_id,name,age,avatar,current_level,created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (fallback.error) throw fallback.error
  return (fallback.data as ChildProfileRow[]).map(toProfile)
}

export async function createChildProfile(profile: NewChildProfile): Promise<ChildProfile> {
  const client = requireSupabase()
  const userId = await getUserId()

  const requestedLanguage = isSupportedLanguage(profile.language) ? profile.language : getStoredLanguage()
  const withLanguage = await client
    .from('child_profiles')
    .insert({
      user_id: userId,
      name: profile.name,
      age: profile.age,
      avatar: profile.avatar,
      current_level: profile.currentLevel,
      language: requestedLanguage,
    })
    .select('id,user_id,name,age,avatar,current_level,created_at,language')
    .single()

  if (!withLanguage.error) {
    return {
      ...toProfile(withLanguage.data as ChildProfileRow),
      language: requestedLanguage,
    }
  }
  if (!isMissingLanguageColumnError(withLanguage.error)) throw withLanguage.error

  const fallback = await client
    .from('child_profiles')
    .insert({
      user_id: userId,
      name: profile.name,
      age: profile.age,
      avatar: profile.avatar,
      current_level: profile.currentLevel,
    })
    .select('id,user_id,name,age,avatar,current_level,created_at')
    .single()

  if (fallback.error) throw fallback.error
  return {
    ...toProfile(fallback.data as ChildProfileRow),
    language: requestedLanguage,
  }
}

export async function updateChildProfileLanguage(profileId: string, language: SupportedLanguage): Promise<void> {
  const client = requireSupabase()
  await getUserId()

  const { error } = await client
    .from('child_profiles')
    .update({ language })
    .eq('id', profileId)

  if (error && !isMissingLanguageColumnError(error)) {
    console.warn('Could not persist child profile language:', error.message)
  }
}

export async function updateChildProfileLevel(profileId: string, level: Level): Promise<void> {
  const client = requireSupabase()
  await getUserId()

  const { error } = await client
    .from('child_profiles')
    .update({ current_level: level })
    .eq('id', profileId)

  if (error) {
    console.warn('Could not persist child profile level:', error.message)
  }
}

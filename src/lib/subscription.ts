import { useState, useEffect } from 'react'
import { supabase } from './supabase'

export type SubscriptionStatus = 'free' | 'active' | 'cancelled' | 'past_due'

export interface Subscription {
  status: SubscriptionStatus
  isPro: boolean
  dailyLimit: number
  periodEnd: Date | null
}

export const FREE_PLAN: Subscription = {
  status: 'free',
  isPro: false,
  dailyLimit: 2,
  periodEnd: null,
}

const PRO_PLAN = (periodEnd: Date | null): Subscription => ({
  status: 'active',
  isPro: true,
  dailyLimit: 20,
  periodEnd,
})

const CACHE_KEY = 'dm_subscription_cache'
const CACHE_TTL = 5 * 60 * 1000

function loadCache(): { data: Subscription; at: number } | null {
  try {
    const v = localStorage.getItem(CACHE_KEY)
    if (!v) return null
    const parsed = JSON.parse(v)
    if (parsed.data?.periodEnd) parsed.data.periodEnd = new Date(parsed.data.periodEnd)
    return parsed
  } catch { return null }
}

function saveCache(data: Subscription) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ data, at: Date.now() })) } catch {}
}

export function clearSubscriptionCache() {
  try { localStorage.removeItem(CACHE_KEY) } catch {}
}

export async function fetchSubscription(): Promise<Subscription> {
  if (!supabase) return FREE_PLAN
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return FREE_PLAN

    const { data, error } = await supabase
      .from('subscriptions')
      .select('status, period_end')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error || !data) return FREE_PLAN

    const periodEnd = data.period_end ? new Date(data.period_end) : null
    const isPro = data.status === 'active' && periodEnd !== null && periodEnd > new Date()
    return isPro ? PRO_PLAN(periodEnd) : { ...FREE_PLAN, status: data.status as SubscriptionStatus }
  } catch {
    return FREE_PLAN
  }
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription>(FREE_PLAN)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cache = loadCache()
    if (cache && Date.now() - cache.at < CACHE_TTL) {
      setSubscription(cache.data)
      setLoading(false)
      return
    }
    fetchSubscription().then(sub => {
      setSubscription(sub)
      saveCache(sub)
      setLoading(false)
    })
  }, [])

  const refresh = () => {
    clearSubscriptionCache()
    setLoading(true)
    fetchSubscription().then(sub => {
      setSubscription(sub)
      saveCache(sub)
      setLoading(false)
    })
  }

  return { subscription, loading, refresh }
}

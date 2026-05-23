import {
  ChildProfile, PracticeSession, Reward, StreakInfo, AppSettings, Level
} from './types'

// ─── 키 상수 ──────────────────────────────────────────────
const KEYS = {
  profiles:  'dm_profiles',
  currentId: 'dm_current_profile',
  sessions:  'dm_sessions',
  rewards:   'dm_rewards',
  streaks:   'dm_streaks',
  settings:  'dm_settings',
  rateLog:   'dm_rate_log',
}

// ─── 유틸 ──────────────────────────────────────────────────
function load<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) : fallback
  } catch {
    return fallback
  }
}
function save(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch { /* ignore */ }
}

// ─── 프로필 ────────────────────────────────────────────────
export function getProfiles(): ChildProfile[] {
  return load<ChildProfile[]>(KEYS.profiles, [])
}
export function saveProfile(p: ChildProfile) {
  const list = getProfiles().filter(x => x.id !== p.id)
  save(KEYS.profiles, [...list, p])
}
export function deleteProfile(id: string) {
  save(KEYS.profiles, getProfiles().filter(p => p.id !== id))
}
export function getCurrentProfileId(): string | null {
  return localStorage.getItem(KEYS.currentId)
}
export function setCurrentProfileId(id: string) {
  localStorage.setItem(KEYS.currentId, id)
}
export function getCurrentProfile(): ChildProfile | null {
  const id = getCurrentProfileId()
  if (!id) return null
  return getProfiles().find(p => p.id === id) ?? null
}

// ─── 세션 ──────────────────────────────────────────────────
export function getSessions(): PracticeSession[] {
  return load<PracticeSession[]>(KEYS.sessions, [])
}
export function saveSession(s: PracticeSession) {
  const list = getSessions()
  const idx = list.findIndex(
    x => x.profileId === s.profileId && x.date === s.date && x.operation === s.operation
  )
  if (idx >= 0) list[idx] = s
  else list.push(s)
  save(KEYS.sessions, list)
}
export function getSessionByDate(profileId: string, date: string): PracticeSession[] {
  return getSessions().filter(s => s.profileId === profileId && s.date === date)
}
export function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10)
}

// ─── 정답률 로그 (레벨 진급 판별용) ─────────────────────────
export function getRateLog(profileId: string): Record<Level, number[]> {
  const all = load<Record<string, Record<Level, number[]>>>(KEYS.rateLog, {})
  return all[profileId] ?? { L1: [], L2A: [], L2B: [], L3A: [], L3B: [] }
}
export function appendRateLog(profileId: string, level: Level, rate: number) {
  const all = load<Record<string, Record<Level, number[]>>>(KEYS.rateLog, {})
  if (!all[profileId]) all[profileId] = { L1: [], L2A: [], L2B: [], L3A: [], L3B: [] }
  all[profileId][level] = [...(all[profileId][level] ?? []).slice(-9), rate]
  save(KEYS.rateLog, all)
}

// ─── 스트릭 ────────────────────────────────────────────────
export function getStreak(profileId: string): StreakInfo {
  const all = load<Record<string, StreakInfo>>(KEYS.streaks, {})
  return all[profileId] ?? { currentStreak: 0, longestStreak: 0, lastCompletedDate: null }
}
export function updateStreak(profileId: string): StreakInfo {
  const streak = getStreak(profileId)
  const today = getTodayDate()
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  let newStreak: number
  if (streak.lastCompletedDate === today) {
    newStreak = streak.currentStreak // 오늘 이미 완료
  } else if (streak.lastCompletedDate === yesterday) {
    newStreak = streak.currentStreak + 1
  } else {
    newStreak = 1 // 리셋
  }

  const updated: StreakInfo = {
    currentStreak: newStreak,
    longestStreak: Math.max(streak.longestStreak, newStreak),
    lastCompletedDate: today,
  }

  const all = load<Record<string, StreakInfo>>(KEYS.streaks, {})
  all[profileId] = updated
  save(KEYS.streaks, all)
  return updated
}

// ─── 보상 ──────────────────────────────────────────────────
export function getRewards(profileId: string): Reward[] {
  const all = load<Record<string, Reward[]>>(KEYS.rewards, {})
  return all[profileId] ?? []
}
export function addReward(profileId: string, reward: Reward) {
  const all = load<Record<string, Reward[]>>(KEYS.rewards, {})
  if (!all[profileId]) all[profileId] = []
  all[profileId].push(reward)
  save(KEYS.rewards, all)
}

// ─── 설정 ──────────────────────────────────────────────────
export function getSettings(): AppSettings {
  return load<AppSettings>(KEYS.settings, {
    soundEnabled: true,
    speechSpeed: 'normal',
    lockAfterMinutes: null,
  })
}
export function saveSettings(s: AppSettings) {
  save(KEYS.settings, s)
}

// ─── 오늘 학습 완료 여부 ─────────────────────────────────────
export function isTodayCompleted(profileId: string): boolean {
  const today = getTodayDate()
  const sessions = getSessionByDate(profileId, today)
  return sessions.some(s => s.completedAt !== undefined)
}

// ─── 오늘 정답률 계산 ────────────────────────────────────────
export function calcCorrectRate(session: PracticeSession): number {
  if (!session.questions.length) return 0
  const correct = session.questions.filter(q => q.isCorrect).length
  return Math.round((correct / session.questions.length) * 100)
}

// ─── 고유 ID 생성 ────────────────────────────────────────────
export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

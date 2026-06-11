import { Reward, RewardType, StreakInfo, UserRewardState } from './types'
import { generateId } from './storage'

export interface RewardResult {
  reward: Reward
  isNew: boolean
}

const REWARD_DEFS: Record<RewardType, { name: string; emoji: string }> = {
  star:    { name: '오늘의 별',        emoji: '⭐' },
  sticker: { name: '연속 학습 스티커', emoji: '🌟' },
  badge:   { name: '일주일 도전 배지', emoji: '🏅' },
  special: { name: '한 달 마스터',     emoji: '👑' },
  praise:  { name: '오답 극복 카드',   emoji: '🎉' },
  levelup: { name: '레벨 업!',         emoji: '🚀' },
}

export function makeReward(type: RewardType): Reward {
  const def = REWARD_DEFS[type]
  return {
    id: generateId(),
    type,
    name: def.name,
    emoji: def.emoji,
    earnedAt: new Date().toISOString(),
  }
}

/** 세션 완료 후 보상 계산 */
export function calcSessionRewards(
  correctRate: number,
  streak: StreakInfo,
  isWrongReviewCompleted: boolean,
  isLevelUp: boolean
): Reward[] {
  const rewards: Reward[] = []

  // 20문제 완료 시 별 1개
  rewards.push(makeReward('star'))

  // 연속 학습 보상
  if (streak.currentStreak === 3)  rewards.push(makeReward('sticker'))
  if (streak.currentStreak === 7)  rewards.push(makeReward('badge'))
  if (streak.currentStreak === 30) rewards.push(makeReward('special'))

  // 오답 복습 완료
  if (isWrongReviewCompleted) rewards.push(makeReward('praise'))

  // 레벨 업
  if (isLevelUp) rewards.push(makeReward('levelup'))

  return rewards
}

export function getRewardMessage(streak: number): string {
  if (streak >= 30) return '한 달 동안 한 번도 안 쉬었어요! 대단해요! 👑'
  if (streak >= 14) return '2주 연속 학습! 정말 대단해요! 🌟'
  if (streak >= 7)  return '일주일 연속 학습! 최고예요! 🏅'
  if (streak >= 3)  return '3일 연속! 멈추지 마세요! 🔥'
  if (streak >= 2)  return '이틀 연속! 잘하고 있어요! 💪'
  return '오늘도 수학 공부 완료! 잘했어요! ⭐'
}

export type RewardGrade = 'PERFECT' | 'S' | 'A' | 'B' | 'C'

export interface RewardGradeInfo {
  grade: RewardGrade
  message: string
}

export interface DailyMathRewardSummary {
  rate: number
  grade: RewardGrade
  gradeMessage: string
  coinsEarned: number
  starsEarned: number
  baseCoins: number
  rateStars: number
  streakBonusCoins: number
  streakBonusStars: number
  streakDays: number
  badgeMessage: string | null
  alreadyRewardedToday: boolean
  totalCoins: number
  totalStars: number
  nextState: UserRewardState
}

export function getRewardGrade(rate: number): RewardGradeInfo {
  if (rate === 100) return { grade: 'PERFECT', message: '완벽해요! 최고예요!' }
  if (rate >= 90) return { grade: 'S', message: '정말 잘했어요!' }
  if (rate >= 80) return { grade: 'A', message: '훌륭해요!' }
  if (rate >= 70) return { grade: 'B', message: '잘했어요!' }
  return { grade: 'C', message: '끝까지 해낸 것도 멋져요!' }
}

export function getRateStarReward(rate: number): number {
  if (rate === 100) return 5
  if (rate >= 90) return 3
  if (rate >= 80) return 2
  if (rate >= 70) return 1
  return 0
}

export function buildDailyMathRewardSummary(
  rate: number,
  currentState: UserRewardState,
  today: string,
): DailyMathRewardSummary {
  const gradeInfo = getRewardGrade(rate)
  const yesterday = getDateOffset(today, -1)
  const alreadyRewardedToday = currentState.lastCompletedDate === today

  if (alreadyRewardedToday) {
    return {
      rate,
      grade: gradeInfo.grade,
      gradeMessage: gradeInfo.message,
      coinsEarned: 0,
      starsEarned: 0,
      baseCoins: 0,
      rateStars: 0,
      streakBonusCoins: 0,
      streakBonusStars: 0,
      streakDays: currentState.streakDays,
      badgeMessage: null,
      alreadyRewardedToday: true,
      totalCoins: currentState.coins,
      totalStars: currentState.stars,
      nextState: currentState,
    }
  }

  const streakDays = currentState.lastCompletedDate === yesterday
    ? currentState.streakDays + 1
    : 1
  const baseCoins = 10
  const rateStars = getRateStarReward(rate)
  const streakBonusCoins = streakDays === 3 ? 30 : 0
  const streakBonusStars = streakDays === 7 ? 10 : 0
  const badgeMessage = streakDays === 14
    ? '🎉 14일 연속 학습 성공! 수학 습관왕 배지를 얻었어요!'
    : null
  const coinsEarned = baseCoins + streakBonusCoins
  const starsEarned = rateStars + streakBonusStars
  const nextState: UserRewardState = {
    coins: currentState.coins + coinsEarned,
    stars: currentState.stars + starsEarned,
    streakDays,
    lastCompletedDate: today,
  }

  return {
    rate,
    grade: gradeInfo.grade,
    gradeMessage: gradeInfo.message,
    coinsEarned,
    starsEarned,
    baseCoins,
    rateStars,
    streakBonusCoins,
    streakBonusStars,
    streakDays,
    badgeMessage,
    alreadyRewardedToday: false,
    totalCoins: nextState.coins,
    totalStars: nextState.stars,
    nextState,
  }
}

function getDateOffset(date: string, offsetDays: number): string {
  const d = new Date(`${date}T00:00:00`)
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().slice(0, 10)
}

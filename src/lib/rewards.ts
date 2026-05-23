import { Reward, RewardType, StreakInfo } from './types'
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

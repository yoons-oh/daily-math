// ─── 프로필 ──────────────────────────────────────────
export interface ChildProfile {
  id: string
  name: string
  age: number
  avatar: string          // emoji 또는 색상 코드
  currentLevel: Level
  createdAt: string
}

// ─── 레벨 ──────────────────────────────────────────
export type Level = 'L1' | 'L2A' | 'L2B' | 'L3A' | 'L3B'

export const LEVEL_LABELS: Record<Level, string> = {
  L1:  '1단계 (한 자리)',
  L2A: '2단계 A (두 자리 기본)',
  L2B: '2단계 B (두 자리 받아올림)',
  L3A: '3단계 A (세 자리 기본)',
  L3B: '3단계 B (세 자리 심화)',
}

export const LEVEL_ORDER: Level[] = ['L1', 'L2A', 'L2B', 'L3A', 'L3B']

// ─── 연산 종류 ──────────────────────────────────────
export type Operation = 'add' | 'sub'

// ─── 문제 ──────────────────────────────────────────
export interface MathQuestion {
  id: string
  num1: number
  num2: number
  operation: Operation
  answer: number
  hasCarry: boolean       // 받아올림 있음
  hasBorrow: boolean      // 받아내림 있음
}

// ─── 풀이 결과 ──────────────────────────────────────
export interface QuestionResult {
  question: MathQuestion
  userAnswer: number | null
  isCorrect: boolean
  timeSpentSeconds: number
}

// ─── 세션 (하루 20문제) ──────────────────────────────
export interface PracticeSession {
  profileId: string
  date: string             // YYYY-MM-DD
  operation: Operation
  level: Level
  questions: QuestionResult[]
  startedAt: number        // Date.now()
  completedAt?: number
}

// ─── 보상 ──────────────────────────────────────────
export type RewardType = 'star' | 'sticker' | 'badge' | 'special' | 'praise' | 'levelup'

export interface Reward {
  id: string
  type: RewardType
  name: string
  emoji: string
  earnedAt: string
}

// ─── 스트릭 ──────────────────────────────────────────
export interface StreakInfo {
  currentStreak: number
  longestStreak: number
  lastCompletedDate: string | null
}

// ─── 학습 진행 상황 ──────────────────────────────────
export interface LearningProgress {
  profileId: string
  correctRateByLevel: Record<Level, number>
  streakInfo: StreakInfo
  rewards: Reward[]
  totalDaysLearned: number
}

// ─── 앱 설정 ──────────────────────────────────────────
export interface AppSettings {
  soundEnabled: boolean
  speechSpeed: 'slow' | 'normal' | 'fast'
  lockAfterMinutes: number | null
}

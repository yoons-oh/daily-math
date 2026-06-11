import type { Level, MathQuestion, Operation } from '../../lib/types'

// ─── 레벨별 숫자 범위 정의 ───────────────────────────────
interface LevelConfig {
  min: number
  max: number
  allowCarry: boolean
  allowBorrow: boolean
  digits: 1 | 2 | 3
}

const LEVEL_CONFIGS: Record<Level, LevelConfig> = {
  L1:  { min: 0,   max: 9,   allowCarry: false, allowBorrow: false, digits: 1 },
  L2A: { min: 10,  max: 99,  allowCarry: false, allowBorrow: false, digits: 2 },
  L2B: { min: 10,  max: 99,  allowCarry: true,  allowBorrow: true,  digits: 2 },
  L3A: { min: 100, max: 999, allowCarry: false, allowBorrow: false, digits: 3 },
  L3B: { min: 100, max: 999, allowCarry: true,  allowBorrow: true,  digits: 3 },
}

// ─── 받아올림 여부 판별 ───────────────────────────────────
function checkCarry(n1: number, n2: number): boolean {
  // 일의 자리 합이 10 이상
  return (n1 % 10) + (n2 % 10) >= 10
}

// ─── 받아내림 여부 판별 ───────────────────────────────────
function checkBorrow(n1: number, n2: number): boolean {
  // 일의 자리 피감수 < 일의 자리 감수
  return (n1 % 10) < (n2 % 10)
}

// ─── 두 자리 받아올림 없는 덧셈 생성 ─────────────────────
function genNoCarryAdd(digits: 1 | 2 | 3): [number, number] {
  if (digits === 1) {
    const n1 = Math.floor(Math.random() * 9) + 1
    const n2 = Math.floor(Math.random() * (9 - n1)) + 1
    return [n1, n2]
  }
  if (digits === 2) {
    // 각 자리 합이 9 이하
    const t1 = Math.floor(Math.random() * 8) + 1  // 십의 자리 n1
    const o1 = Math.floor(Math.random() * 9)       // 일의 자리 n1
    const t2 = Math.floor(Math.random() * (9 - t1 - 1)) + 1
    const o2 = Math.floor(Math.random() * (9 - o1))
    return [t1 * 10 + o1, t2 * 10 + o2]
  }
  // digits === 3
  const h1 = Math.floor(Math.random() * 7) + 1
  const t1 = Math.floor(Math.random() * 9)
  const o1 = Math.floor(Math.random() * 9)
  const h2 = Math.floor(Math.random() * (8 - h1)) + 1
  const t2 = Math.floor(Math.random() * (9 - t1))
  const o2 = Math.floor(Math.random() * (9 - o1))
  return [h1 * 100 + t1 * 10 + o1, h2 * 100 + t2 * 10 + o2]
}

// ─── 받아올림 있는 덧셈 생성 ─────────────────────────────
function genCarryAdd(digits: 1 | 2 | 3): [number, number] {
  for (let i = 0; i < 100; i++) {
    const base = digits === 1 ? 1 : digits === 2 ? 10 : 100
    const top  = digits === 1 ? 9 : digits === 2 ? 99 : 999
    const n1 = Math.floor(Math.random() * (top - base + 1)) + base
    const n2 = Math.floor(Math.random() * (top - base + 1)) + base
    const sum = n1 + n2
    if (sum <= (digits === 1 ? 18 : digits === 2 ? 198 : 1998) && checkCarry(n1, n2)) {
      return [n1, n2]
    }
  }
  return digits === 2 ? [48, 37] : [148, 237]
}

// ─── 받아내림 없는 뺄셈 생성 ─────────────────────────────
function genNoBorrowSub(digits: 1 | 2 | 3): [number, number] {
  if (digits === 1) {
    const n2 = Math.floor(Math.random() * 8) + 1
    const n1 = Math.floor(Math.random() * (9 - n2)) + n2 + 1
    return [n1, n2]
  }
  if (digits === 2) {
    for (let i = 0; i < 100; i++) {
      const n1 = Math.floor(Math.random() * 80) + 20
      const n2 = Math.floor(Math.random() * (n1 - 10)) + 10
      if (!checkBorrow(n1, n2) && n1 > n2) return [n1, n2]
    }
    return [75, 32]
  }
  for (let i = 0; i < 100; i++) {
    const n1 = Math.floor(Math.random() * 800) + 200
    const n2 = Math.floor(Math.random() * (n1 - 100)) + 100
    if (!checkBorrow(n1, n2) && n1 > n2) return [n1, n2]
  }
  return [758, 324]
}

// ─── 받아내림 있는 뺄셈 생성 ─────────────────────────────
function genBorrowSub(digits: 1 | 2 | 3): [number, number] {
  if (digits === 2) {
    for (let i = 0; i < 100; i++) {
      const n1 = Math.floor(Math.random() * 80) + 20
      const n2 = Math.floor(Math.random() * (n1 - 10)) + 10
      if (checkBorrow(n1, n2) && n1 > n2) return [n1, n2]
    }
    return [60, 24]
  }
  for (let i = 0; i < 100; i++) {
    const n1 = Math.floor(Math.random() * 800) + 200
    const n2 = Math.floor(Math.random() * (n1 - 100)) + 100
    if (checkBorrow(n1, n2) && n1 > n2) return [n1, n2]
  }
  return [605, 247]
}

// ─── 단일 문제 생성 ───────────────────────────────────────
export function generateQuestion(
  level: Level,
  operation: Operation,
  existingIds: Set<string>
): MathQuestion {
  const config = LEVEL_CONFIGS[level]

  for (let attempt = 0; attempt < 200; attempt++) {
    let n1: number, n2: number

    if (operation === 'add') {
      if (config.allowCarry && Math.random() > 0.5) {
        ;[n1, n2] = genCarryAdd(config.digits)
      } else {
        ;[n1, n2] = genNoCarryAdd(config.digits)
      }
    } else {
      if (config.allowBorrow && Math.random() > 0.5) {
        ;[n1, n2] = genBorrowSub(config.digits)
      } else {
        ;[n1, n2] = genNoBorrowSub(config.digits)
      }
      // 항상 n1 >= n2 보장 (음수 결과 방지)
      if (n1 < n2) [n1, n2] = [n2, n1]
    }

    const answer = operation === 'add' ? n1 + n2 : n1 - n2
    if (answer < 0) continue

    const id = `${operation}_${n1}_${n2}`
    if (existingIds.has(id)) continue

    return {
      id,
      num1: n1,
      num2: n2,
      operation,
      answer,
      hasCarry: operation === 'add' ? checkCarry(n1, n2) : false,
      hasBorrow: operation === 'sub' ? checkBorrow(n1, n2) : false,
    }
  }

  // 폴백 (무한루프 방지)
  return {
    id: `${operation}_10_5_fallback`,
    num1: 10, num2: 5,
    operation,
    answer: operation === 'add' ? 15 : 5,
    hasCarry: false, hasBorrow: false,
  }
}

// ─── 세션 20문제 생성 ────────────────────────────────────
export function generateSession(level: Level, operation: Operation, count = 20): MathQuestion[] {
  const questions: MathQuestion[] = []
  const usedIds = new Set<string>()

  const TOTAL = count

  // 받아올림/내림 있는 문제를 전체의 약 40~50%로 조정
  const carryCount = LEVEL_CONFIGS[level].allowCarry
    ? Math.floor(TOTAL * 0.45)
    : 0

  for (let i = 0; i < TOTAL; i++) {
    const forceCarry = i < carryCount
    const q = generateQuestion(
      forceCarry
        ? (level === 'L2B' ? 'L2B' : level === 'L3B' ? 'L3B' : level) as Level
        : level,
      operation,
      usedIds
    )
    questions.push(q)
    usedIds.add(q.id)
  }

  // 셔플 (받아올림/내림 문제가 앞에만 몰리지 않도록)
  return shuffle(questions)
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ─── 숫자 자릿수 분해 (세로셈 표시용) ───────────────────
export function getDigits(n: number, minDigits = 1): number[] {
  const str = String(Math.abs(n)).padStart(minDigits, '0')
  return str.split('').map(Number)
}

// ─── 레벨 진급 판별 ──────────────────────────────────────
export function checkLevelUp(
  recentRates: number[],   // 최근 3일 정답률 (0~100)
  threshold = 85
): boolean {
  if (recentRates.length < 3) return false
  return recentRates.slice(-3).every(r => r >= threshold)
}

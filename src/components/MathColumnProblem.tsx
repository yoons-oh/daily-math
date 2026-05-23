import React from 'react'
import { motion } from 'framer-motion'
import { MathQuestion } from '../lib/types'
import { getDigits } from '../features/daily-practice/problemGenerator'

interface Props {
  question: MathQuestion
  userAnswer: string
  showResult?: boolean
  isCorrect?: boolean
}

// 화면 너비에 따라 셀 크기 결정
const CELL = 80    // px — 숫자 한 칸 너비/높이
const OP_W = 56    // px — 연산자 너비
const FONT = '3.2rem'
const ANS_FONT = '3.2rem'

export default function MathColumnProblem({
  question, userAnswer, showResult, isCorrect,
}: Props) {
  const { num1, num2, operation, answer } = question
  const maxDigits = Math.max(
    String(num1).length,
    String(num2).length,
    String(answer).length
  )
  const d1   = getDigits(num1, maxDigits)
  const d2   = getDigits(num2, maxDigits)
  const dAns = getDigits(answer, maxDigits)
  const dUser = userAnswer ? getDigits(Number(userAnswer), maxDigits) : []

  const opSymbol = operation === 'add' ? '+' : '−'
  const opColor  = operation === 'add' ? '#5CC8A0' : '#FF9F5B'

  const carryDigits  = operation === 'add' && question.hasCarry  ? getCarryMarks(num1, num2, maxDigits)  : []
  const borrowDigits = operation === 'sub' && question.hasBorrow ? getBorrowMarks(num1, num2, maxDigits) : []
  const markDigits   = showResult ? (operation === 'add' ? carryDigits : borrowDigits) : []

  const totalW = OP_W + CELL * maxDigits

  return (
    <div className="flex flex-col items-end select-none" style={{ width: totalW }}>

      {/* 받아올림/내림 힌트 */}
      <div className="flex items-end" style={{ width: totalW, minHeight: 28 }}>
        <div style={{ width: OP_W }} />
        {Array.from({ length: maxDigits }).map((_, i) => (
          <div key={i} style={{ width: CELL, height: 28, position: 'relative' }}>
            {markDigits[i] !== undefined && markDigits[i] > 0 && (
              <motion.span
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                style={{
                  position: 'absolute', top: 0, left: '50%',
                  transform: 'translateX(-50%)',
                  color: '#FF9F5B', fontWeight: 900, fontSize: '1rem',
                }}
              >
                {operation === 'add' ? '1' : '-1'}
              </motion.span>
            )}
          </div>
        ))}
      </div>

      {/* num1 행 */}
      <NumberRow digits={d1} color="#3A3A3A" delay={0} cell={CELL} opW={OP_W} font={FONT} />

      {/* num2 행 + 연산자 */}
      <div className="flex items-center" style={{ margin: '6px 0' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          style={{
            width: OP_W, fontSize: '2.6rem', fontWeight: 900,
            color: opColor, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {opSymbol}
        </motion.div>
        <NumberRow digits={d2} color="#3A3A3A" delay={0.1} cell={CELL} opW={0} font={FONT} />
      </div>

      {/* 구분선 */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        style={{
          width: totalW, height: 5,
          background: '#3A3A3A', borderRadius: 3,
          transformOrigin: 'left', margin: '4px 0',
        }}
      />

      {/* 답 행 */}
      {showResult ? (
        <div className="flex items-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            style={{
              width: OP_W, fontSize: '2rem', fontWeight: 900,
              color: isCorrect ? '#5CC8A0' : '#FF7676',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >=</motion.div>
          {dAns.map((d, i) => {
            const hide = d === 0 && i < dAns.length - 1 && dAns.slice(0, i).every(x => x === 0)
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.08 }}
                style={{
                  width: CELL, height: CELL,
                  borderBottom: `5px solid ${isCorrect ? '#5CC8A0' : '#FF7676'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: ANS_FONT, fontWeight: 900,
                  color: isCorrect ? '#5CC8A0' : '#FF7676',
                  background: isCorrect ? 'rgba(92,200,160,0.08)' : 'rgba(255,118,118,0.08)',
                  borderRadius: '8px 8px 0 0',
                }}
              >
                {hide ? '' : d}
              </motion.div>
            )
          })}
        </div>
      ) : (
        <div className="flex items-end">
          <div style={{ width: OP_W }} />
          {Array.from({ length: maxDigits }).map((_, i) => {
            const val = dUser.length > 0 ? (dUser[i] ?? '') : ''
            const isEmpty = dUser.length === 0
            const isActive = !isEmpty && i === dUser.length - 1
            return (
              <div
                key={i}
                style={{
                  width: CELL, height: CELL,
                  borderBottom: '5px solid #5CC8A0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: ANS_FONT, fontWeight: 900, color: '#5CC8A0',
                  background: 'rgba(92,200,160,0.06)',
                  borderRadius: '8px 8px 0 0',
                  opacity: (isEmpty && i < maxDigits - 1) || (!isEmpty && val === '') ? 0.25 : 1,
                  position: 'relative',
                }}
              >
                {String(val)}
                {(isEmpty && i === maxDigits - 1) || isActive ? (
                  <span style={{
                    position: 'absolute', right: 10,
                    animation: 'blink 1s step-end infinite', color: '#5CC8A0',
                  }}>|</span>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function NumberRow({
  digits, color, delay, cell, opW, font,
}: {
  digits: number[]; color: string; delay: number
  cell: number; opW: number; font: string
}) {
  return (
    <div className="flex items-end">
      {opW > 0 && <div style={{ width: opW }} />}
      {digits.map((d, i) => {
        const hide = d === 0 && i < digits.length - 1 && digits.slice(0, i).every(x => x === 0)
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay + i * 0.06 }}
            style={{
              width: cell, height: cell,
              borderBottom: '5px solid #3A3A3A',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: font, fontWeight: 900, color,
            }}
          >
            {hide ? '' : d}
          </motion.div>
        )
      })}
    </div>
  )
}

function getCarryMarks(n1: number, n2: number, maxDigits: number): number[] {
  const result = Array(maxDigits).fill(0)
  let carry = 0
  const s1 = String(n1).padStart(maxDigits, '0')
  const s2 = String(n2).padStart(maxDigits, '0')
  for (let i = maxDigits - 1; i >= 0; i--) {
    const sum = Number(s1[i]) + Number(s2[i]) + carry
    carry = sum >= 10 ? 1 : 0
    if (carry && i > 0) result[i - 1] = 1
  }
  return result
}

function getBorrowMarks(n1: number, n2: number, maxDigits: number): number[] {
  const result = Array(maxDigits).fill(0)
  let borrow = 0
  const s1 = String(n1).padStart(maxDigits, '0')
  const s2 = String(n2).padStart(maxDigits, '0')
  for (let i = maxDigits - 1; i >= 0; i--) {
    const d1 = Number(s1[i]) - borrow
    const d2 = Number(s2[i])
    if (d1 < d2) { borrow = 1; if (i > 0) result[i - 1] = 1 }
    else { borrow = 0 }
  }
  return result
}

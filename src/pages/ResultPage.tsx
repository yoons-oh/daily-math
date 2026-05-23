import React from 'react'
import { motion } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import { QuestionResult, Operation, Level, LEVEL_LABELS } from '../lib/types'
import { getStreak, getCurrentProfile } from '../lib/storage'
import MagicBackground from '../components/MagicBackground'

interface ResultState { results: QuestionResult[]; operation: Operation; level: Level }

export default function ResultPage() {
  const navigate = useNavigate()
  const { state } = useLocation() as { state: ResultState }
  const profile = getCurrentProfile()
  if (!state) { navigate('/home'); return null }

  const { results, operation, level } = state
  const correct   = results.filter(r => r.isCorrect).length
  const wrong     = results.length - correct
  const rate      = Math.round((correct / results.length) * 100)
  const avgTime   = Math.round(results.reduce((s, r) => s + r.timeSpentSeconds, 0) / results.length)
  const streak    = profile ? getStreak(profile.id) : null
  const wrongItems = results.filter(r => !r.isCorrect)

  const emoji   = rate >= 90 ? '🏆' : rate >= 70 ? '🌟' : rate >= 50 ? '💪' : '🌱'
  const msg     = rate >= 90 ? '완벽 마스터! 최강이에요!' : rate >= 70 ? '멋져요! 조금만 더!' : rate >= 50 ? '잘 싸웠어요! 다시 도전!' : '괜찮아요! 계속 하면 늘어요!'
  const scoreGradient = rate >= 80
    ? 'linear-gradient(135deg,rgba(98,214,178,0.2),rgba(168,240,220,0.15))'
    : 'linear-gradient(135deg,rgba(255,229,143,0.25),rgba(255,199,217,0.15))'

  return (
    <div className="app-container">
      <MagicBackground />
      <div className="relative z-10 flex-1 overflow-y-auto px-4 pt-8 pb-6">

        {/* 결과 헤더 */}
        <div className="text-center mb-5">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 10, stiffness: 200, delay: 0.15 }}
            style={{ fontSize: '5.5rem', marginBottom: 8 }}
          >
            {emoji}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{ fontWeight: 900, fontSize: '1.5rem', color: '#2D2D3A' }}
          >{msg}</motion.h1>
          <p style={{ color: '#7A7A9A', fontSize: '0.85rem', marginTop: 4, fontWeight: 600 }}>
            {operation === 'add' ? '✨ 덧셈 마법' : '🌙 뺄셈 마법'} · {LEVEL_LABELS[level]}
          </p>
        </div>

        {/* 점수 카드 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25 }}
          className="glass-card p-5 mb-4"
          style={{ background: scoreGradient }}
        >
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <div style={{ fontSize: '3.2rem', fontWeight: 900, color: '#2D2D3A' }}>{rate}%</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#7A7A9A' }}>정답률</div>
            </div>
            <div style={{ width: 1, height: 56, background: 'rgba(0,0,0,0.08)' }} />
            <div className="text-center flex-1">
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#3EC99A' }}>{correct}</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#7A7A9A' }}>맞음 ⭕</div>
            </div>
            <div style={{ width: 1, height: 56, background: 'rgba(0,0,0,0.08)' }} />
            <div className="text-center flex-1">
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#FF7676' }}>{wrong}</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#7A7A9A' }}>틀림 ❌</div>
            </div>
          </div>
        </motion.div>

        {/* 통계 */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { emoji: '⏱️', label: '평균 풀이 시간', value: `${avgTime}초`, gradient: 'linear-gradient(135deg,rgba(168,216,255,0.25),rgba(201,182,255,0.15))' },
            { emoji: '🔥', label: '연속 학습일', value: `${streak?.currentStreak ?? 0}일`, gradient: 'linear-gradient(135deg,rgba(255,229,143,0.3),rgba(255,209,180,0.2))' },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.08 }}
              className="glass-card p-4"
              style={{ background: s.gradient }}
            >
              <div style={{ fontSize: '1.8rem', marginBottom: 4 }}>{s.emoji}</div>
              <div style={{ fontWeight: 900, fontSize: '1.4rem', color: '#2D2D3A' }}>{s.value}</div>
              <div style={{ fontSize: '0.72rem', color: '#7A7A9A', fontWeight: 700, marginTop: 2 }}>{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* 오답 목록 */}
        {wrongItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.42 }}
            className="glass-card p-4 mb-4"
          >
            <h3 style={{ fontWeight: 900, color: '#2D2D3A', marginBottom: 10, fontSize: '0.95rem' }}>❌ 틀린 문제</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {wrongItems.map((r, i) => (
                <div key={i} className="result-wrong" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 800 }}>{r.question.num1} {r.question.operation === 'add' ? '+' : '−'} {r.question.num2}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: '#FF7676', textDecoration: 'line-through', fontSize: '0.9rem' }}>{r.userAnswer ?? '?'}</span>
                    <span style={{ color: '#3EC99A', fontWeight: 900, fontSize: '1.05rem' }}>→ {r.question.answer}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* 전체 결과 그리드 */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.48 }}
          className="glass-card p-4 mb-5"
        >
          <h3 style={{ fontWeight: 900, color: '#2D2D3A', marginBottom: 10, fontSize: '0.95rem' }}>📋 전체 결과</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
            {results.map((r, i) => (
              <div
                key={i}
                style={{
                  borderRadius: 12, padding: '8px 4px', textAlign: 'center',
                  background: r.isCorrect ? 'rgba(98,214,178,0.18)' : 'rgba(255,118,118,0.12)',
                  border: `1.5px solid ${r.isCorrect ? 'rgba(98,214,178,0.4)' : 'rgba(255,118,118,0.3)'}`,
                }}
              >
                <div style={{ fontSize: '0.7rem', color: '#7A7A9A', fontWeight: 700 }}>{i + 1}번</div>
                <div style={{ fontSize: '1rem' }}>{r.isCorrect ? '⭕' : '❌'}</div>
                <div style={{ fontSize: '0.68rem', color: '#7A7A9A' }}>{r.timeSpentSeconds}s</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 버튼 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {wrongItems.length > 0 && (
            <motion.button
              whileTap={{ scale: 0.97, y: 3 }}
              onClick={() => navigate('/review', { state: { wrongItems, operation, level } })}
              className="jelly-btn jelly-btn-purple"
              style={{ width: '100%', fontSize: '1rem' }}
            >
              오답 다시 풀기 💪
            </motion.button>
          )}
          <motion.button
            whileTap={{ scale: 0.97, y: 3 }}
            onClick={() => navigate('/home')}
            className="jelly-btn"
            style={{ width: '100%', fontSize: '1rem' }}
          >
            마법학교로 돌아가기 🏰
          </motion.button>
        </div>
      </div>
    </div>
  )
}

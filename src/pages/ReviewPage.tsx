import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import { QuestionResult, Operation, Level } from '../lib/types'
import MathColumnProblem from '../components/MathColumnProblem'
import MagicBackground from '../components/MagicBackground'
import { useI18n } from '../i18n'

interface ReviewState {
  wrongItems: QuestionResult[]
  operation: Operation
  level: Level
}

const KEYPAD_ROWS = [['7', '8', '9'], ['4', '5', '6'], ['1', '2', '3'], ['clear', '0', 'submit']]

export default function ReviewPage() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const { state } = useLocation() as { state: ReviewState }
  const [idx, setIdx] = useState(0)
  const [inputVal, setInputVal] = useState('')
  const [phase, setPhase] = useState<'input' | 'feedback'>('input')
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [doneCount, setDoneCount] = useState(0)

  if (!state) {
    navigate('/home')
    return null
  }

  const { wrongItems } = state
  const q = wrongItems[idx]?.question

  if (!q) {
    return (
      <div className="app-container items-center justify-center p-6">
        <MagicBackground />
        <div className="relative z-10 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ fontSize: '5rem', marginBottom: 16 }}>
            🎉
          </motion.div>
          <h2 style={{ fontWeight: 900, fontSize: '1.5rem', color: '#2D2D3A', marginBottom: 8 }}>{t('review.doneTitle')}</h2>
          <p style={{ color: '#7A7A9A', marginBottom: 32, fontWeight: 600 }}>{t('review.doneDesc')}</p>
          <motion.button whileTap={{ scale: 0.97, y: 3 }} onClick={() => navigate('/home')} className="jelly-btn" style={{ width: '100%' }}>
            {t('result.home')}
          </motion.button>
        </div>
      </div>
    )
  }

  function handleKey(k: string) {
    if (phase !== 'input') return
    if (k === 'clear') setInputVal(v => v.slice(0, -1))
    else if (k === 'submit') {
      if (inputVal) checkAnswer()
    } else setInputVal(v => (v.length >= String(q.answer).length + 1 ? v : v === '0' ? k : v + k))
  }

  function checkAnswer() {
    const correct = Number(inputVal) === q.answer
    setIsCorrect(correct)
    setPhase('feedback')
    setTimeout(() => {
      setInputVal('')
      setPhase('input')
      setIsCorrect(null)
      if (correct) {
        setDoneCount(c => c + 1)
        setIdx(i => i + 1)
      }
    }, 1000)
  }

  return (
    <div className="app-container">
      <MagicBackground />
      <div className="relative z-10 flex flex-col" style={{ height: '100dvh' }}>
        <div style={{ padding: '16px', background: 'rgba(255,209,180,0.2)', backdropFilter: 'blur(8px)' }}>
          <div className="flex items-center justify-between mb-3">
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => navigate('/home')}
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                background: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(8px)',
                border: '1.5px solid rgba(255,255,255,0.9)',
                fontWeight: 900,
                fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: '0 3px 10px rgba(0,0,0,0.08)',
              }}
            >
              ←
            </motion.button>
            <div className="text-center">
              <p style={{ fontWeight: 900, color: '#2D2D3A' }}>💪 {t('review.title')}</p>
              <p style={{ fontSize: '0.8rem', color: '#7A7A9A', fontWeight: 700 }}>
                {t('review.progress', { done: doneCount, total: wrongItems.length })}
              </p>
            </div>
            <div style={{ width: 42 }} />
          </div>
          <div className="progress-bar" style={{ height: 10 }}>
            <motion.div
              animate={{ width: `${(doneCount / wrongItems.length) * 100}%` }}
              transition={{ duration: 0.4 }}
              style={{
                height: '100%',
                borderRadius: 999,
                background: 'linear-gradient(90deg,#FFC7D9,#C9B6FF)',
                boxShadow: '0 0 8px rgba(255,199,217,0.5)',
              }}
            />
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px 16px 8px' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-3 mb-3"
                style={{ background: 'linear-gradient(135deg,rgba(255,229,143,0.3),rgba(255,199,217,0.15))', textAlign: 'center' }}
              >
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#2D2D3A' }}>💡 {t('review.hint')}</span>
              </motion.div>

              <AnimatePresence>
                {phase === 'feedback' && isCorrect !== null && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ type: 'spring', damping: 10, stiffness: 300 }}
                    style={{ fontSize: '3.5rem', marginBottom: 10 }}
                  >
                    {isCorrect ? '⭐' : '💡'}
                  </motion.div>
                )}
              </AnimatePresence>

              <div
                className="glass-card"
                style={{
                  width: '100%',
                  padding: '36px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: phase === 'feedback' && isCorrect !== null ? (isCorrect ? 'rgba(98,214,178,0.12)' : 'rgba(255,118,118,0.08)') : 'rgba(255,255,255,0.82)',
                }}
              >
                <MathColumnProblem question={q} userAnswer={inputVal} showResult={phase === 'feedback'} isCorrect={isCorrect ?? false} />
              </div>

              <AnimatePresence>
                {phase === 'feedback' && isCorrect === false && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{
                      marginTop: 12,
                      padding: '10px 24px',
                      background: 'rgba(255,118,118,0.12)',
                      border: '2px solid rgba(255,118,118,0.3)',
                      borderRadius: 16,
                    }}
                  >
                    <span style={{ fontWeight: 800, color: '#FF5555' }}>
                      {t('review.answerIs', { answer: q.answer })}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>
        </div>

        <div style={{ padding: '4px 14px 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            {KEYPAD_ROWS.flat().map((k, i) => {
              const isOk = k === 'submit'
              const isDel = k === 'clear'
              const disabled = (isOk && !inputVal) || phase !== 'input'
              const label = isOk ? '✓' : isDel ? '⌫' : k
              return (
                <motion.button
                  key={i}
                  whileTap={{ scale: 0.88, y: 4 }}
                  onClick={() => handleKey(k)}
                  disabled={disabled}
                  style={{
                    height: 68,
                    borderRadius: 20,
                    fontSize: isOk ? '1.6rem' : '2rem',
                    fontWeight: 900,
                    border: 'none',
                    cursor: disabled ? 'default' : 'pointer',
                    opacity: disabled ? 0.4 : 1,
                    background: isOk ? 'linear-gradient(135deg,#62D6B2,#3EC99A)' : isDel ? 'linear-gradient(135deg,#FFC7D9,#FF99BB)' : 'rgba(255,255,255,0.88)',
                    color: isOk ? '#fff' : isDel ? '#7A1040' : '#2D2D3A',
                    boxShadow: isOk
                      ? '0 5px 0 #28A87A,0 6px 16px rgba(98,214,178,0.3)'
                      : isDel
                        ? '0 5px 0 #CC5580,0 6px 16px rgba(255,153,187,0.3)'
                        : '0 5px 0 #C8E8DE,0 6px 14px rgba(0,0,0,0.06)',
                    backdropFilter: 'blur(8px)',
                    position: 'relative',
                    overflow: 'hidden',
                  } as React.CSSProperties}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '45%',
                      background: 'linear-gradient(180deg,rgba(255,255,255,0.3),transparent)',
                      borderRadius: '20px 20px 0 0',
                      pointerEvents: 'none',
                    }}
                  />
                  {label}
                </motion.button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

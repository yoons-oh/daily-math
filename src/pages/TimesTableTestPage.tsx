import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import MagicBackground from '../components/MagicBackground'
import { say, stopAll } from '../lib/tts'
import { useI18n } from '../i18n'
import { SupportedLanguage } from '../lib/language'
import { saveTimesTableTestMastery } from '../lib/timesTableMastery'

const PASS_SCORE = 7

function getMulFactText(dan: number, factor: number, product: number, language: SupportedLanguage): string {
  switch (language) {
    case 'ko': return `${dan} 곱하기 ${factor}는 ${product}`
    case 'en': return `${dan} times ${factor} is ${product}`
    case 'zh-CN': return `${dan}乘以${factor}等于${product}`
    case 'vi': return `${dan} nhân ${factor} bằng ${product}`
    case 'th': return `${dan} คูณ ${factor} เท่ากับ ${product}`
    case 'id': return `${dan} kali ${factor} sama dengan ${product}`
    case 'es': return `${dan} por ${factor} es ${product}`
    case 'ja': return `${dan}かける${factor}は${product}`
    default: return `${dan} times ${factor} is ${product}`
  }
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function makeQuestions(dan: number) {
  return shuffle(Array.from({ length: 9 }, (_, i) => ({ factor: i + 1, product: dan * (i + 1) })))
}

type Phase = 'question' | 'feedback' | 'result'

export default function TimesTableTestPage() {
  const navigate = useNavigate()
  const { language, t } = useI18n()
  const { dan: danParam } = useParams<{ dan: string }>()
  const dan = Number(danParam) || 2

  const [questions, setQuestions] = useState(() => makeQuestions(dan))
  const [current, setCurrent] = useState(0)
  const [digits, setDigits] = useState<string[]>([])
  const [phase, setPhase] = useState<Phase>('question')
  const [isCorrect, setIsCorrect] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const correctRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const q = questions[current]

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    stopAll()
  }, [])

  function press(key: string) {
    if (phase !== 'question') return
    if (key === 'back') { setDigits(d => d.slice(0, -1)); return }
    if (digits.length >= 3) return
    setDigits(d => [...d, key])
  }

  function submit() {
    if (phase !== 'question' || digits.length === 0) return
    const val = Number(digits.join(''))
    const correct = val === q.product
    setIsCorrect(correct)
    setPhase('feedback')

    if (correct) {
      correctRef.current++
      setCorrectCount(correctRef.current)
    }

    say(getMulFactText(dan, q.factor, q.product, language as SupportedLanguage), false, language as SupportedLanguage).catch(() => {})

    timerRef.current = setTimeout(() => {
      if (current + 1 >= questions.length) {
        if (correctRef.current >= PASS_SCORE) saveTimesTableTestMastery(dan)
        setPhase('result')
      } else {
        setCurrent(c => c + 1)
        setDigits([])
        setPhase('question')
      }
    }, 1800)
  }

  function retry() {
    if (timerRef.current) clearTimeout(timerRef.current)
    correctRef.current = 0
    setQuestions(makeQuestions(dan))
    setCurrent(0)
    setDigits([])
    setCorrectCount(0)
    setPhase('question')
  }

  const displayVal = digits.join('') || '?'
  const passed = correctCount >= PASS_SCORE

  const PAD = ['1','2','3','4','5','6','7','8','9','back','0','ok']

  return (
    <div className="app-container" style={{ background: 'linear-gradient(160deg,#FFFBEB 0%,#FEF3C7 40%,#F8F2FF 100%)' }}>
      <MagicBackground />
      <div className="relative z-10 flex flex-col" style={{ height: '100dvh' }}>
        {/* 헤더 */}
        <div style={{ padding: '16px 16px 10px', flexShrink: 0 }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.button whileTap={{ scale: 0.88 }} onClick={() => { stopAll(); navigate(-1) }}
                style={{ width: 42, height: 42, borderRadius: 14, background: 'rgba(255,255,255,0.8)', border: '1.5px solid rgba(255,255,255,0.9)', fontWeight: 900, fontSize: '1rem', cursor: 'pointer', flexShrink: 0 }}>
                ←
              </motion.button>
              <div style={{ fontWeight: 900, fontSize: '1.15rem', color: '#2D2D3A' }}>
                🌟 {t('timesTablePage.testTitle', { dan })}
              </div>
            </div>
            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#B45309' }}>
              {phase !== 'result' ? `${current + 1} / 9` : `✓ ${correctCount} / 9`}
            </div>
          </div>
          {/* 진행 바 (노란색) */}
          <div style={{ marginTop: 10, height: 6, borderRadius: 999, background: 'rgba(251,191,36,0.18)' }}>
            <motion.div
              animate={{ width: `${(phase === 'result' ? 9 : current) / 9 * 100}%` }}
              transition={{ type: 'spring', stiffness: 200, damping: 24 }}
              style={{ height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,#FBBF24,#F59E0B)' }}
            />
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '8px 16px 20px', gap: 10 }}>
          <AnimatePresence mode="wait">
            {phase !== 'result' ? (
              <motion.div key={`q-${current}`}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>

                {/* 문제 카드 */}
                <div style={{
                  flex: 1, borderRadius: 24, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 12,
                  background: 'rgba(255,255,255,0.88)',
                  boxShadow: '0 8px 0 rgba(180,83,9,0.14), 0 14px 28px rgba(251,191,36,0.16)',
                  border: '2px solid rgba(251,191,36,0.3)',
                }}>
                  <div style={{ fontWeight: 900, fontSize: 'clamp(2rem,7vw,2.8rem)', color: '#2D2D3A', letterSpacing: 2 }}>
                    {dan} × {q.factor} =
                  </div>

                  {/* 입력 표시 */}
                  <motion.div
                    animate={phase === 'feedback' ? { scale: [1, 1.15, 1] } : {}}
                    style={{
                      minWidth: 90, minHeight: 58, borderRadius: 18,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: phase === 'feedback'
                        ? isCorrect ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.12)'
                        : 'rgba(251,191,36,0.12)',
                      border: `2.5px solid ${
                        phase === 'feedback'
                          ? isCorrect ? '#34D399' : '#F87171'
                          : digits.length > 0 ? '#FBBF24' : 'rgba(251,191,36,0.3)'
                      }`,
                      fontWeight: 900,
                      fontSize: 'clamp(1.8rem,6vw,2.4rem)',
                      color: phase === 'feedback'
                        ? isCorrect ? '#059669' : '#DC2626'
                        : digits.length > 0 ? '#B45309' : '#D1A050',
                    }}
                  >
                    {phase === 'feedback' ? q.product : displayVal}
                  </motion.div>

                  {/* 피드백 메시지 */}
                  <AnimatePresence>
                    {phase === 'feedback' && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                        style={{ fontWeight: 900, fontSize: '1rem', color: isCorrect ? '#059669' : '#DC2626', textAlign: 'center' }}
                      >
                        {isCorrect
                          ? t('timesTablePage.testCorrect')
                          : t('timesTablePage.testWrong', { answer: q.product })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 키패드 */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {PAD.map(k => {
                    const isOk = k === 'ok'
                    const isBack = k === 'back'
                    return (
                      <motion.button key={k}
                        whileTap={{ scale: 0.92, y: 2 }}
                        disabled={phase === 'feedback'}
                        onClick={() => isOk ? submit() : press(k)}
                        style={{
                          height: 52, borderRadius: 16, border: 'none',
                          cursor: phase === 'feedback' ? 'default' : 'pointer',
                          fontWeight: 900, fontSize: isOk ? '1.4rem' : '1.35rem',
                          background: isOk
                            ? (digits.length > 0 ? 'linear-gradient(135deg,#FBBF24,#F59E0B)' : 'rgba(251,191,36,0.28)')
                            : isBack ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.88)',
                          color: isOk ? (digits.length > 0 ? '#5A3800' : '#A07830') : '#2D2D3A',
                          boxShadow: isOk && digits.length > 0
                            ? '0 4px 0 #B45309'
                            : '0 3px 0 rgba(180,180,210,0.45)',
                          opacity: phase === 'feedback' ? 0.4 : 1,
                          transition: 'background 0.15s',
                        }}
                      >
                        {k === 'back' ? '⌫' : k === 'ok' ? '✓' : k}
                      </motion.button>
                    )
                  })}
                </div>
              </motion.div>
            ) : (
              /* 결과 화면 */
              <motion.div key="result"
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>

                <motion.div
                  animate={{ rotate: [0, 12, -12, 0], scale: [1, 1.18, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{ fontSize: '4.5rem' }}
                >
                  {passed ? '🌟' : '💪'}
                </motion.div>

                <div style={{ fontWeight: 900, fontSize: '2.4rem', color: '#2D2D3A' }}>
                  {correctCount} / 9
                </div>

                {/* 점수 바 */}
                <div style={{ width: '80%', height: 10, borderRadius: 999, background: 'rgba(251,191,36,0.2)', overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(correctCount / 9) * 100}%` }}
                    transition={{ delay: 0.2, duration: 0.8, ease: 'easeOut' }}
                    style={{ height: '100%', borderRadius: 999, background: passed ? 'linear-gradient(90deg,#FBBF24,#F59E0B)' : 'linear-gradient(90deg,#FDA4AF,#F87171)' }}
                  />
                </div>

                <div style={{ fontWeight: 900, fontSize: '1.15rem', color: passed ? '#7C3AED' : '#F97316', textAlign: 'center', padding: '0 16px' }}>
                  {t(passed ? 'timesTablePage.testPass' : 'timesTablePage.testFail', { dan })}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', marginTop: 8 }}>
                  {/* 시험 다시 */}
                  <motion.button whileTap={{ scale: 0.97, y: 3 }} onClick={retry}
                    style={{
                      width: '100%', height: 52, borderRadius: 18, border: 'none', cursor: 'pointer',
                      background: 'linear-gradient(135deg,#FBBF24,#F59E0B)',
                      color: '#5A3800', fontWeight: 900, fontSize: '1rem',
                      boxShadow: '0 6px 0 #B45309, 0 10px 20px rgba(251,191,36,0.3)',
                    }}>
                    🔄 {t('timesTablePage.testRetry')}
                  </motion.button>
                  {/* 공부하러 */}
                  <motion.button whileTap={{ scale: 0.97, y: 3 }} onClick={() => { stopAll(); navigate(`/times-table/${dan}`) }}
                    style={{
                      width: '100%', height: 52, borderRadius: 18, cursor: 'pointer',
                      background: 'rgba(255,255,255,0.85)', color: '#7C3AED', fontWeight: 900, fontSize: '1rem',
                      border: '2px solid rgba(167,139,250,0.4)',
                      boxShadow: '0 4px 0 rgba(124,58,237,0.18)',
                    }}>
                    📖 {t('timesTablePage.testStudy')}
                  </motion.button>
                  {/* 단 선택으로 */}
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => { stopAll(); navigate('/times-table') }}
                    style={{
                      width: '100%', height: 42, borderRadius: 18, cursor: 'pointer',
                      background: 'transparent', color: '#7A7A9A', fontWeight: 800, fontSize: '0.9rem', border: 'none',
                    }}>
                    {t('timesTablePage.testGoHome')}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

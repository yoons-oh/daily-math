import React, { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import {
  getCurrentProfile, saveSession, getTodayDate,
  updateStreak, appendRateLog, getUserRewardState, saveUserRewardState,
  getTodayQuestionCount,
} from '../lib/storage'
import { ChildProfile, MathQuestion, Operation, QuestionResult } from '../lib/types'
import { generateSession } from '../features/daily-practice/problemGenerator'
import { DailyMathRewardSummary, buildDailyMathRewardSummary } from '../lib/rewards'
import MathColumnProblem from '../components/MathColumnProblem'
import VisualSolution from '../components/VisualSolution'
import MagicBackground from '../components/MagicBackground'
import HandwritingDigitInput from '../components/HandwritingDigitInput'
import UpgradeModal from '../components/UpgradeModal'
import { useSubscription } from '../lib/subscription'

import { say, stopAll, unlockTts } from '../lib/tts'
import { playSound, unlockSound } from '../lib/sound'
import { useI18n } from '../i18n'

const MAX_QUESTIONS = 20
const KEYPAD_ROWS = [['7','8','9'],['4','5','6'],['1','2','3'],['clear','0','submit']]

const CORRECT_MSGS = [
  { emoji: '🌟', title: '완벽해요!',    sub: '정말 대단한 마법사예요!',  tts: '우와! 완벽해요! 정말 대단한 마법사예요!' },
  { emoji: '✨', title: '맞았어요!',    sub: '역시 천재 마법사!',        tts: '딩동댕! 맞았어요! 역시 천재 마법사!' },
  { emoji: '🎉', title: '정답이에요!',  sub: '마법이 성공했어요!',       tts: '정답이에요! 마법이 성공했어요! 최고!' },
  { emoji: '🏆', title: '훌륭해요!',    sub: '최강 수학 마법사!',        tts: '훌륭해요! 역시 최강 수학 마법사!' },
  { emoji: '🚀', title: '굉장해요!',    sub: '계속 이렇게 해봐요!',      tts: '굉장해요! 계속 이렇게 해봐요! 파이팅!' },
]

const WRONG_MSGS = [
  { emoji: '🌈', title: '아쉬워요!',       sub: '같이 세어보면 알 수 있어요!' },
  { emoji: '💪', title: '조금 달라요!',    sub: '하나씩 세어봐요!' },
  { emoji: '🌱', title: '거의 다 왔어요!', sub: '같이 확인해봐요!' },
  { emoji: '🦋', title: '괜찮아요!',       sub: '실수는 누구나 해요!' },
  { emoji: '🌙', title: '다시 봐요!',      sub: '하나씩 세면 쉬워요!' },
]

export default function PracticePage() {
  const { op }    = useParams<{ op: string }>()
  const operation = (op === 'sub' ? 'sub' : 'add') as Operation
  const navigate  = useNavigate()
  const isAdd     = operation === 'add'
  const { t } = useI18n()
  const { subscription, loading: subLoading } = useSubscription()

  const [profile, setProfile]     = useState<ChildProfile | null>(null)
  const [questions, setQuestions] = useState<MathQuestion[]>([])
  const [current, setCurrent]     = useState(0)
  const [total, setTotal]         = useState(MAX_QUESTIONS)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)
  const [inputVal, setInputVal]   = useState('')
  const [digitInputs, setDigitInputs] = useState<string[]>([])
  const [activeDigitIndex, setActiveDigitIndex] = useState(0)
  const [answerInputMode, setAnswerInputMode] = useState<'keypad' | 'handwriting'>('keypad')
  const [showHandwritingWarning, setShowHandwritingWarning] = useState(false)
  const [results, setResults]     = useState<QuestionResult[]>([])
  const [phase, setPhase]         = useState<'input' | 'correct' | 'wrong'>('input')
  const [correctMsgIndex, setCorrectMsgIndex] = useState(0)
  const [wrongMsgIndex, setWrongMsgIndex]     = useState(0)
  const [currentResult, setCurrentResult] = useState<QuestionResult | null>(null)

  const startTimeRef  = useRef(Date.now())
  const questionStart = useRef(Date.now())
  const submitLockRef = useRef(false)

  useEffect(() => {
    if (subLoading) return
    const p = getCurrentProfile()
    if (!p) { navigate('/profiles'); return }
    setProfile(p)

    const todayCount = getTodayQuestionCount(p.id)
    const allowed = Math.max(0, subscription.dailyLimit - todayCount)

    if (allowed === 0) {
      setIsBlocked(true)
      setShowUpgradeModal(true)
      return
    }

    const sessionTotal = Math.min(allowed, MAX_QUESTIONS)
    setTotal(sessionTotal)
    setQuestions(generateSession(p.currentLevel, operation, sessionTotal))
    playSound('magic')
    startTimeRef.current = Date.now()
    questionStart.current = Date.now()
  }, [subLoading, subscription.dailyLimit])

  const q = questions[current]
  const progressPct = Math.round((current / total) * 100)
  const answerSlotCount = q
    ? Math.max(String(q.num1).length, String(q.num2).length, String(q.answer).length)
    : 1
  const useDigitSlots = Boolean(profile && profile.currentLevel !== 'L1' && answerSlotCount > 1)
  const useHandwriting = useDigitSlots && answerInputMode === 'handwriting'
  const handwritingAnswer = digitInputs.join('')
  const displayedInput = useDigitSlots ? handwritingAnswer : inputVal
  const hasCompleteDigitSlots = (inputs: string[]) => {
    const firstWrittenDigit = inputs.findIndex(Boolean)
    return (
      inputs.length === answerSlotCount &&
      firstWrittenDigit >= 0 &&
      inputs.slice(firstWrittenDigit).every(Boolean)
    )
  }
  const canSubmitDigitSlots = useDigitSlots && hasCompleteDigitSlots(digitInputs)
  const correctMessages = useMemo(() => [
    { emoji: '🌟', title: t('practice.correct1Title'), sub: t('practice.correct1Sub'), tts: t('practice.correct1Tts') },
    { emoji: '✨', title: t('practice.correct2Title'), sub: t('practice.correct2Sub'), tts: t('practice.correct2Tts') },
    { emoji: '🎉', title: t('practice.correct3Title'), sub: t('practice.correct3Sub'), tts: t('practice.correct3Tts') },
    { emoji: '🏆', title: t('practice.correct4Title'), sub: t('practice.correct4Sub'), tts: t('practice.correct4Tts') },
    { emoji: '🚀', title: t('practice.correct5Title'), sub: t('practice.correct5Sub'), tts: t('practice.correct5Tts') },
  ], [t])
  const wrongMessages = useMemo(() => [
    { emoji: '🌈', title: t('practice.wrong1Title'), sub: t('practice.wrong1Sub') },
    { emoji: '💪', title: t('practice.wrong2Title'), sub: t('practice.wrong2Sub') },
    { emoji: '🌱', title: t('practice.wrong3Title'), sub: t('practice.wrong3Sub') },
    { emoji: '💡', title: t('practice.wrong4Title'), sub: t('practice.wrong4Sub') },
    { emoji: '🌙', title: t('practice.wrong5Title'), sub: t('practice.wrong5Sub') },
  ], [t])
  const correctMsg = correctMessages[correctMsgIndex] ?? correctMessages[0]
  const wrongMsg = wrongMessages[wrongMsgIndex] ?? wrongMessages[0]

  useEffect(() => {
    if (!q) return
    const slots = Math.max(String(q.num1).length, String(q.num2).length, String(q.answer).length)
    setDigitInputs(Array(slots).fill(''))
    setActiveDigitIndex(slots - 1)
    setInputVal('')
    setAnswerInputMode('keypad')
    setShowHandwritingWarning(false)
    submitLockRef.current = false
  }, [q?.id])

  function getDigitLabel(index: number) {
    const placeFromRight = answerSlotCount - index
    if (placeFromRight === 1) return t('practice.onesPlace')
    if (placeFromRight === 2) return t('practice.tensPlace')
    if (placeFromRight === 3) return t('practice.hundredsPlace')
    return t('practice.nthPlace', { count: placeFromRight })
  }

  function handleDigitRecognized(digit: string) {
    unlockSound()
    playSound('tap')
    setDigitInputs(prev => {
      const next = [...prev]
      next[activeDigitIndex] = digit
      setInputVal(next.join(''))
      return next
    })
  }

  function handleClearActiveDigit() {
    setDigitInputs(prev => {
      const next = [...prev]
      next[activeDigitIndex] = ''
      setInputVal(next.join(''))
      return next
    })
  }

  function handleKey(k: string) {
    if (phase !== 'input') return
    unlockSound()
    playSound(k.length > 1 ? 'magic' : 'tap')
    if (useDigitSlots) {
      if (k === 'clear') {
        handleClearActiveDigit()
      } else if (k === 'submit') {
        handleSubmit()
      } else {
        setDigitInputs(prev => {
          const next = [...prev]
          next[activeDigitIndex] = k
          setInputVal(next.join(''))
          return next
        })
        if (activeDigitIndex > 0) setActiveDigitIndex(activeDigitIndex - 1)
      }
      return
    }
    if (k === 'clear') {
      setInputVal(v => v.slice(0, -1))
    } else if (k === 'submit') {
      if (inputVal) handleSubmit()
    } else {
      setInputVal(v => {
        if (v.length >= (String(q?.answer ?? 999).length + 1)) return v
        if (v === '0') return k
        return v + k
      })
    }
  }

  async function handleSubmit() {
    const answerText = useDigitSlots ? digitInputs.map(d => d || '0').join('') : inputVal
    if (!q || !answerText || phase !== 'input') return
    if (useDigitSlots && !hasCompleteDigitSlots(digitInputs)) return
    if (submitLockRef.current) return
    submitLockRef.current = true
    await unlockTts()
    const userNum = Number(answerText)
    const correct = userNum === q.answer
    const elapsed = Math.round((Date.now() - questionStart.current) / 1000)
    setCurrentResult({ question: q, userAnswer: userNum, isCorrect: correct, timeSpentSeconds: elapsed })

    if (correct) {
      playSound('correct')
      const nextIndex = Math.floor(Math.random() * correctMessages.length)
      const msg = correctMessages[nextIndex]
      setCorrectMsgIndex(nextIndex)
      setPhase('correct')
      // 칭찬 음성 재생
      say(msg.tts, false)
    } else {
      playSound('wrong')
      setWrongMsgIndex(Math.floor(Math.random() * wrongMessages.length))
      setPhase('wrong')
    }
  }

  function goNext() {
    if (!currentResult) return
    stopAll()
    const newResults = [...results, currentResult]
    setResults(newResults)
    setInputVal('')
    setDigitInputs(Array(answerSlotCount).fill(''))
    setActiveDigitIndex(answerSlotCount - 1)
    submitLockRef.current = false
    setPhase('input')
    setCurrentResult(null)
    questionStart.current = Date.now()
    if (current + 1 >= total) finishSession(newResults)
    else setCurrent(c => c + 1)
  }

  function finishSession(finalResults: QuestionResult[]) {
    if (!profile) return
    const correct = finalResults.filter(r => r.isCorrect).length
    const rate = Math.round((correct / total) * 100)
    saveSession({
      profileId: profile.id, date: getTodayDate(), operation,
      level: profile.currentLevel, questions: finalResults,
      startedAt: startTimeRef.current, completedAt: Date.now(),
    })
    const streak = updateStreak(profile.id)
    appendRateLog(profile.id, profile.currentLevel, rate)
    const rewardState = getUserRewardState(profile.id)
    const rewardSummary: DailyMathRewardSummary = buildDailyMathRewardSummary(rate, rewardState, getTodayDate())
    if (!rewardSummary.alreadyRewardedToday) {
      saveUserRewardState(profile.id, rewardSummary.nextState)
      playSound('reward')
    }
    navigate('/result', {
      state: {
        results: finalResults,
        operation,
        level: profile.currentLevel,
        rewardSummary,
        streakDays: streak.currentStreak,
      },
    })
  }

  if (!q || !profile) {
    return (
      <div className="app-container items-center justify-center">
        <MagicBackground />
        {!isBlocked && (
          <>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              style={{ fontSize: '3rem' }}>✨</motion.div>
            <p style={{ color: '#7A7A9A', marginTop: 12, fontWeight: 700 }}>{t('practice.loading')}</p>
          </>
        )}
        <UpgradeModal
          open={showUpgradeModal}
          onClose={() => { setShowUpgradeModal(false); navigate(-1) }}
          isBlocked={isBlocked}
        />
      </div>
    )
  }

  const hdrGradient = isAdd
    ? 'linear-gradient(135deg,rgba(98,214,178,0.25),rgba(168,240,220,0.15))'
    : 'linear-gradient(135deg,rgba(255,199,217,0.3),rgba(255,153,187,0.15))'

  return (
    <div className="app-container">
      <MagicBackground />
      <div className="relative z-10 flex flex-col" style={{ height: '100dvh' }}>

        {/* ── 헤더 ── */}
        <div style={{ background: hdrGradient, padding: '16px 16px 12px', backdropFilter: 'blur(8px)', flexShrink: 0 }}>
          <div className="flex items-center justify-between mb-3">
            <motion.button type="button" whileTap={{ scale: 0.88 }} onClick={() => { playSound('tap'); navigate(-1) }}
              style={{ width: 42, height: 42, borderRadius: 14, background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)', border: '1.5px solid rgba(255,255,255,0.9)', fontWeight: 900, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 3px 10px rgba(0,0,0,0.08)' }}>
              ←
            </motion.button>
            <div className="text-center">
              <p style={{ fontWeight: 900, fontSize: '1.05rem', color: '#2D2D3A' }}>
                {isAdd ? `✨ ${t('home.addMagic')}` : `🌙 ${t('home.subMagic')}`}
              </p>
              <p style={{ fontSize: '0.8rem', color: '#7A7A9A', fontWeight: 700 }}>
                {t('practice.problemCounter', { current: current + 1, total })}
              </p>
            </div>
            <div style={{
              background: isAdd ? 'linear-gradient(135deg,#62D6B2,#3EC99A)' : 'linear-gradient(135deg,#FFC7D9,#FF99BB)',
              borderRadius: 12, padding: '6px 12px',
              color: isAdd ? '#fff' : '#7A1040', fontWeight: 900, fontSize: '0.85rem',
              boxShadow: isAdd ? '0 3px 8px rgba(98,214,178,0.4)' : '0 3px 8px rgba(255,153,187,0.4)',
            }}>
              {results.filter(r => r.isCorrect).length}⭐
            </div>
          </div>
          <div className="progress-bar" style={{ height: 10 }}>
            <motion.div className="progress-fill" animate={{ width: `${progressPct}%` }} transition={{ duration: 0.4 }}
              style={{ background: isAdd ? 'linear-gradient(90deg,#62D6B2,#A8D8FF)' : 'linear-gradient(90deg,#FFC7D9,#C9B6FF)' }} />
          </div>
        </div>

        {/* ── 메인 영역 ── */}
        <div style={{ flex: 1, overflow: 'hidden', padding: '8px 14px 0', display: 'flex', flexDirection: 'column' }}>
          <AnimatePresence mode="wait">

            {/* ── 입력 화면 ── */}
            {phase === 'input' && (
              <motion.div key={`q-${current}`}
                initial={{ opacity: 0, x: 48 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -48 }}
                transition={{ duration: 0.22 }}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="glass-card" style={{ width: '100%', padding: useHandwriting ? '14px 12px' : '24px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.82)' }}>
                  <MathColumnProblem
                    question={q}
                    userAnswer={displayedInput}
                    showResult={false}
                    isCorrect={false}
                    compact={useDigitSlots}
                    handwritingDigits={useDigitSlots ? digitInputs : undefined}
                    activeDigitIndex={useDigitSlots ? activeDigitIndex : undefined}
                    onDigitCellClick={useDigitSlots ? setActiveDigitIndex : undefined}
                  />
                </div>
              </motion.div>
            )}

            {/* ── 정답 화면 ── */}
            {phase === 'correct' && (
              <motion.div key="correct"
                initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                transition={{ type: 'spring', damping: 14, stiffness: 280 }}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>

                <div className="glass-card text-center"
                  style={{ flex: 1, padding: '16px 20px', background: 'linear-gradient(135deg,rgba(98,214,178,0.2),rgba(168,240,220,0.15))', border: '2px solid rgba(98,214,178,0.4)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  {['✦','★','✦','✦','★'].map((s, i) => (
                    <motion.div key={i}
                      initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                      animate={{ opacity: [0,1,0], scale: [0,1.3,0], x: (i-2)*50, y: -50-i*8 }}
                      transition={{ delay: 0.1+i*0.08, duration: 0.9 }}
                      style={{ position: 'absolute', top: '30%', left: '50%', fontSize: '1.3rem', color: ['#FFE58F','#62D6B2','#C9B6FF','#FFC7D9','#A8D8FF'][i], fontWeight: 900, pointerEvents: 'none' }}>
                      {s}
                    </motion.div>
                  ))}
                  <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', damping: 8, stiffness: 200 }}
                    style={{ fontSize: '3.5rem', marginBottom: 6 }}>{correctMsg.emoji}</motion.div>
                  <div style={{ fontWeight: 900, fontSize: '1.3rem', color: '#2D2D3A', marginBottom: 3 }}>{correctMsg.title}</div>
                  <div style={{ color: '#7A7A9A', fontWeight: 700, fontSize: '0.85rem', marginBottom: 16 }}>{correctMsg.sub}</div>
                  <MathColumnProblem question={q} userAnswer={String(q.answer)} showResult={true} isCorrect={true} />
                </div>
              </motion.div>
            )}

            {/* ── 오답 화면 ── */}
            {phase === 'wrong' && (
              <motion.div key="wrong"
                initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ type: 'spring', damping: 18, stiffness: 260 }}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, overflow: 'hidden' }}>

                {/* 문제 표시 — 컴팩트 */}
                <div style={{
                  flexShrink: 0, borderRadius: 16,
                  background: 'linear-gradient(135deg,rgba(255,229,143,0.25),rgba(255,199,217,0.15))',
                  border: '2px solid rgba(255,229,143,0.4)',
                  padding: '8px 16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                }}>
                  <span style={{ fontSize: '1.7rem', fontWeight: 900, color: '#2D2D3A' }}>{q.num1}</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 900, color: isAdd ? '#62D6B2' : '#FF9F5B' }}>{isAdd ? '+' : '−'}</span>
                  <span style={{ fontSize: '1.7rem', fontWeight: 900, color: '#2D2D3A' }}>{q.num2}</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#7A7A9A' }}>=</span>
                  <span style={{ fontSize: '1.7rem', fontWeight: 900, color: '#3EC99A' }}>{q.answer}</span>
                </div>

                {/* 이모지 풀이 — flex로 남은 공간 채움 */}
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <VisualSolution question={q} themeIndex={current} />
                </div>

              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* ── 오답 하단 고정 버튼 ── */}
        <AnimatePresence>
          {phase === 'wrong' && (
            <motion.div
              initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 300 }}
              className="practice-feedback-actions"
              style={{ padding: '8px 16px 20px', flexShrink: 0 }}>
              <motion.button type="button" whileTap={{ scale: 0.97, y: 3 }} onClick={() => { playSound('tap'); goNext() }}
                className="jelly-btn jelly-btn-purple" style={{ width: '100%', fontSize: '1.05rem' }}>
                {current + 1 >= total ? t('practice.viewResult') : t('practice.gotIt')}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── 정답 하단 고정 버튼 ── */}
        <AnimatePresence>
          {phase === 'correct' && (
            <motion.div
              initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 300 }}
              className="practice-feedback-actions"
              style={{ padding: '8px 16px 20px', flexShrink: 0 }}>
              <motion.button type="button" whileTap={{ scale: 0.97, y: 3 }} onClick={() => { playSound('tap'); goNext() }}
                className="jelly-btn" style={{ width: '100%', fontSize: '1.05rem' }}>
                {current + 1 >= total ? t('practice.viewResult') : t('practice.nextProblem')}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── 키패드 (입력 중일 때만) ── */}
        <AnimatePresence>
          {phase === 'input' && (
            <motion.div
              initial={{ y: 200, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 200, opacity: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 300 }}
              className="practice-input-panel"
              style={{ padding: '4px 14px 12px', flexShrink: 0 }}>
              {useHandwriting ? (
                <div className="glass-card" style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.82)' }}>
                  <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:8 }}>
                    <motion.button
                      whileTap={{ scale:0.96, y:2 }}
                      type="button"
                      onClick={() => setAnswerInputMode('keypad')}
                      style={{
                        height:36, padding:'0 14px', borderRadius:12, border:'none',
                        background:'rgba(98,214,178,0.16)', color:'#238567',
                        fontWeight:900, fontSize:'0.86rem',
                      }}
                    >
                      {t('practice.keypad')}
                    </motion.button>
                  </div>
                  <HandwritingDigitInput
                    activeLabel={t('practice.placeInput', { place: getDigitLabel(activeDigitIndex) })}
                    value={digitInputs[activeDigitIndex] ?? ''}
                    onRecognized={handleDigitRecognized}
                    onClearDigit={handleClearActiveDigit}
                    canSubmit={canSubmitDigitSlots}
                    onSubmit={handleSubmit}
                  />
                </div>
              ) : (
                <div className="glass-card" style={{ padding: useDigitSlots ? 10 : 0, background: useDigitSlots ? 'rgba(255,255,255,0.82)' : 'transparent', boxShadow: useDigitSlots ? undefined : 'none', border: useDigitSlots ? undefined : 'none' }}>
                  {useDigitSlots && (
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, marginBottom:8 }}>
                      <div style={{ fontWeight:900, color:'#2D2D3A', fontSize:'0.92rem' }}>{t('practice.placeInput', { place: getDigitLabel(activeDigitIndex) })}</div>
                      <motion.button
                        whileTap={{ scale:0.96, y:2 }}
                        type="button"
                        onClick={() => setShowHandwritingWarning(true)}
                        style={{
                          height:36, padding:'0 14px', borderRadius:12, border:'none',
                          background:'linear-gradient(135deg,#FFE58F,#F6D060)', color:'#5A4200',
                          fontWeight:900, fontSize:'0.86rem',
                          boxShadow:'0 3px 0 rgba(90,66,0,0.18)',
                        }}
                      >
                        {t('practice.handwriting')}
                      </motion.button>
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                    {KEYPAD_ROWS.flat().map((k, i) => {
                      const isOk = k === 'submit', isDel = k === 'clear'
                      const label = isOk ? t('practice.submitAnswer') : isDel ? t('practice.clear') : k
                      const disabled = isOk && (useDigitSlots ? !canSubmitDigitSlots : !inputVal)
                      return (
                        <motion.button
                          key={i}
                          type="button"
                          whileTap={{ scale: 0.88, y: 3 }}
                          onClick={() => handleKey(k)}
                          aria-disabled={disabled}
                          style={{
                            height: useDigitSlots ? 48 : 56, borderRadius: useDigitSlots ? 15 : 18,
                            fontSize: isOk ? '0.86rem' : isDel ? '0.88rem' : useDigitSlots ? '1.5rem' : '1.7rem',
                            fontWeight: 900, lineHeight: 1.2,
                            border: (isOk || isDel) ? 'none' : '1.5px solid rgba(255,255,255,0.95)',
                            cursor: disabled ? 'default' : 'pointer',
                            position: 'relative', overflow: 'hidden', touchAction: 'manipulation',
                            opacity: disabled ? 0.4 : 1, transition: 'opacity 0.15s',
                            background: isOk ? 'linear-gradient(135deg,#62D6B2,#3EC99A)' : isDel ? 'linear-gradient(135deg,#FFC7D9,#FF99BB)' : 'rgba(255,255,255,0.88)',
                            color: isOk ? '#fff' : isDel ? '#7A1040' : '#2D2D3A',
                            boxShadow: isOk ? '0 4px 0 #28A87A,0 5px 12px rgba(98,214,178,0.3)' : isDel ? '0 4px 0 #CC5580,0 5px 12px rgba(255,153,187,0.3)' : '0 4px 0 #C8E8DE,0 5px 10px rgba(0,0,0,0.06)',
                            backdropFilter: 'blur(8px)',
                          } as React.CSSProperties}>
                          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '45%', background: 'linear-gradient(180deg,rgba(255,255,255,0.3),transparent)', borderRadius: '18px 18px 0 0', pointerEvents: 'none' }} />
                          {label}
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <UpgradeModal
        open={showUpgradeModal}
        onClose={() => { setShowUpgradeModal(false); navigate(-1) }}
        isBlocked={isBlocked}
      />

      <AnimatePresence>
        {showHandwritingWarning && (
          <motion.div
            initial={{ opacity:0 }}
            animate={{ opacity:1 }}
            exit={{ opacity:0 }}
            style={{
              position:'fixed', inset:0, zIndex:50, background:'rgba(45,45,58,0.28)',
              display:'flex', alignItems:'center', justifyContent:'center', padding:20,
              backdropFilter:'blur(5px)',
            }}
          >
            <motion.div
              initial={{ scale:0.9, y:16, opacity:0 }}
              animate={{ scale:1, y:0, opacity:1 }}
              exit={{ scale:0.94, y:10, opacity:0 }}
              transition={{ type:'spring', damping:20, stiffness:260 }}
              className="glass-card"
              style={{ width:'100%', maxWidth:360, padding:20, background:'rgba(255,255,255,0.94)' }}
            >
              <div style={{ fontSize:'2rem', marginBottom:8 }}>✍️</div>
              <div style={{ fontWeight:900, color:'#2D2D3A', fontSize:'1.12rem', marginBottom:8 }}>{t('practice.handwritingTitle')}</div>
              <p style={{ color:'#7A7A9A', fontWeight:800, lineHeight:1.45, fontSize:'0.94rem', marginBottom:16 }}>
                {t('practice.handwritingWarning')}
              </p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <motion.button
                  whileTap={{ scale:0.96, y:2 }}
                  type="button"
                  onClick={() => setShowHandwritingWarning(false)}
                  className="jelly-btn jelly-btn-outline"
                  style={{ fontSize:'0.94rem' }}
                >
                  {t('practice.useKeypad')}
                </motion.button>
                <motion.button
                  whileTap={{ scale:0.96, y:2 }}
                  type="button"
                  onClick={() => {
                    setShowHandwritingWarning(false)
                    setAnswerInputMode('handwriting')
                  }}
                  className="jelly-btn"
                  style={{ fontSize:'0.94rem' }}
                >
                  {t('practice.handwriting')}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}

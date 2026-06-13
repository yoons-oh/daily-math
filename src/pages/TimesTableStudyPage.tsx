import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import MagicBackground from '../components/MagicBackground'
import { say, stopAll, unlockTts } from '../lib/tts'
import { useI18n } from '../i18n'
import { SupportedLanguage } from '../lib/language'

const MASTERY_KEY = 'dm_times_table_mastery'

export function getTimesTableMastery(): Set<number> {
  try {
    const raw = localStorage.getItem(MASTERY_KEY)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw) as number[])
  } catch { return new Set() }
}

function saveMastery(dan: number) {
  try {
    const current = getTimesTableMastery()
    current.add(dan)
    localStorage.setItem(MASTERY_KEY, JSON.stringify([...current]))
  } catch {}
}

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

function getDanIntroText(dan: number, language: SupportedLanguage): string {
  switch (language) {
    case 'ko': return `${dan}단 구구단을 같이 배워봐요!`
    case 'en': return `Let's learn the ${dan} times table!`
    case 'zh-CN': return `我们一起来学${dan}的乘法口诀！`
    case 'vi': return `Hãy cùng học bảng nhân ${dan}!`
    case 'th': return `มาเรียนสูตรคูณ ${dan} กัน!`
    case 'id': return `Yuk belajar tabel perkalian ${dan}!`
    case 'es': return `¡Aprendamos la tabla del ${dan}!`
    case 'ja': return `${dan}の段の九九を一緒に覚えよう！`
    default: return `Let's learn the ${dan} times table!`
  }
}

export default function TimesTableStudyPage() {
  const navigate = useNavigate()
  const { language } = useI18n()
  const { dan: danParam } = useParams<{ dan: string }>()
  const dan = Number(danParam) || 2
  const [revealed, setRevealed] = useState<Set<number>>(new Set())
  const [speakingFactor, setSpeakingFactor] = useState<number | null>(null)
  const lastSpokenRef = useRef<number | null>(null)

  const facts = Array.from({ length: 9 }, (_, i) => ({
    factor: i + 1,
    product: dan * (i + 1),
  }))

  const allRevealed = revealed.size === 9

  // 페이지 로드 시 인트로 TTS
  useEffect(() => {
    const intro = getDanIntroText(dan, language as SupportedLanguage)
    say(intro, false, language as SupportedLanguage).catch(() => {})
    return () => stopAll()
  }, [dan, language])

  // 단 완전 학습 시 localStorage 저장
  useEffect(() => {
    if (allRevealed) saveMastery(dan)
  }, [allRevealed, dan])

  async function revealAndSpeak(factor: number, product: number) {
    await unlockTts()
    setRevealed(prev => {
      const next = new Set(prev)
      next.add(factor)
      return next
    })
    lastSpokenRef.current = factor
    setSpeakingFactor(factor)
    const text = getMulFactText(dan, factor, product, language as SupportedLanguage)
    await say(text, false, language as SupportedLanguage)
    setSpeakingFactor(null)
  }

  async function replayLast() {
    const f = lastSpokenRef.current
    if (f === null) return
    const product = dan * f
    setSpeakingFactor(f)
    const text = getMulFactText(dan, f, product, language as SupportedLanguage)
    await say(text, false, language as SupportedLanguage)
    setSpeakingFactor(null)
  }

  async function handleCardTap(factor: number, product: number) {
    if (revealed.has(factor)) {
      // 이미 공개된 카드 → 다시 읽기
      lastSpokenRef.current = factor
      setSpeakingFactor(factor)
      const text = getMulFactText(dan, factor, product, language as SupportedLanguage)
      await say(text, false, language as SupportedLanguage)
      setSpeakingFactor(null)
    } else {
      await revealAndSpeak(factor, product)
    }
  }

  return (
    <div className="app-container" style={{ background: 'linear-gradient(160deg,#F7FFF9 0%,#EEF8FF 45%,#F8F2FF 100%)' }}>
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
                ⭐ {dan}단 구구단
              </div>
            </div>
            {/* 다시 읽기 버튼 */}
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={replayLast}
              style={{
                width: 42, height: 42, borderRadius: 14,
                background: 'linear-gradient(135deg,#A78BFA,#7C3AED)',
                border: 'none', cursor: 'pointer', fontSize: '1.1rem',
                boxShadow: '0 4px 0 #5B21B6',
              }}
            >
              🔊
            </motion.button>
          </div>
          {/* 진행 바 */}
          <div style={{ marginTop: 10, height: 6, borderRadius: 999, background: 'rgba(167,139,250,0.15)' }}>
            <motion.div
              animate={{ width: `${(revealed.size / 9) * 100}%` }}
              transition={{ type: 'spring', stiffness: 200, damping: 24 }}
              style={{ height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,#A78BFA,#7C3AED)' }}
            />
          </div>
          <div style={{ textAlign: 'right', fontSize: '0.72rem', fontWeight: 800, color: '#A78BFA', marginTop: 3 }}>
            {revealed.size} / 9
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 16px 32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {facts.map(({ factor, product }, i) => {
              const isRevealed = revealed.has(factor)
              const isSpeaking = speakingFactor === factor
              return (
                <motion.button
                  key={factor}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleCardTap(factor, product)}
                  style={{
                    borderRadius: 18, cursor: 'pointer', padding: '14px 20px',
                    background: isRevealed
                      ? 'linear-gradient(135deg,rgba(167,139,250,0.18),rgba(124,58,237,0.1))'
                      : 'rgba(255,255,255,0.78)',
                    boxShadow: isSpeaking
                      ? '0 0 0 3px rgba(167,139,250,0.7), 0 6px 0 rgba(124,58,237,0.3), 0 10px 24px rgba(167,139,250,0.3)'
                      : isRevealed
                        ? '0 4px 0 rgba(124,58,237,0.25), 0 8px 20px rgba(167,139,250,0.22)'
                        : '0 4px 0 rgba(180,180,210,0.5), 0 8px 18px rgba(76,106,170,0.1)',
                    border: isRevealed ? '1.5px solid rgba(167,139,250,0.4)' : '1.5px solid rgba(255,255,255,0.9)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    transition: 'box-shadow 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {isSpeaking && (
                      <motion.span
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity }}
                        style={{ fontSize: '1rem' }}
                      >🔊</motion.span>
                    )}
                    <span style={{ fontWeight: 900, fontSize: '1.3rem', color: '#2D2D3A' }}>
                      {dan} × {factor}
                    </span>
                  </div>
                  <AnimatePresence mode="wait">
                    {isRevealed ? (
                      <motion.span
                        key="answer"
                        initial={{ opacity: 0, scale: 0.6, x: 8 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.6 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                        style={{ fontWeight: 900, fontSize: '1.5rem', color: '#7C3AED' }}
                      >
                        = {product}
                      </motion.span>
                    ) : (
                      <motion.span
                        key="hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ fontWeight: 900, fontSize: '1.1rem', color: '#B0B0C8' }}
                      >
                        눌러서 확인 →
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              )
            })}
          </div>

          {/* 완료 배너 */}
          <AnimatePresence>
            {allRevealed && (
              <motion.div
                initial={{ opacity: 0, y: 14, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                style={{
                  marginTop: 20, padding: '18px', borderRadius: 22, textAlign: 'center',
                  background: 'linear-gradient(135deg,rgba(167,139,250,0.2),rgba(124,58,237,0.12))',
                  border: '2px solid rgba(167,139,250,0.5)',
                  boxShadow: '0 8px 0 rgba(124,58,237,0.2), 0 14px 28px rgba(167,139,250,0.22)',
                }}
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.15, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{ fontSize: '2.4rem', marginBottom: 6 }}
                >🎉</motion.div>
                <div style={{ fontWeight: 900, fontSize: '1.05rem', color: '#5B21B6' }}>
                  {dan}단 완전 정복! ✨
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 문제 풀기 버튼 */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            whileTap={{ scale: 0.97, y: 3 }}
            onClick={() => { stopAll(); navigate('/practice/mul') }}
            style={{
              width: '100%', height: 54, borderRadius: 18, border: 'none', marginTop: 20,
              background: 'linear-gradient(135deg,#A78BFA,#7C3AED)',
              color: '#fff', fontWeight: 900, fontSize: '1rem', cursor: 'pointer',
              boxShadow: '0 6px 0 #5B21B6, 0 10px 24px rgba(167,139,250,0.38)',
            }}
          >
            ⭐ 곱셈 마법 문제 풀기 →
          </motion.button>
        </div>
      </div>
    </div>
  )
}

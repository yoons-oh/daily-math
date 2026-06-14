import React, { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import MagicBackground from '../components/MagicBackground'
import { say, stopAll, unlockTts } from '../lib/tts'
import { useI18n } from '../i18n'
import { SupportedLanguage } from '../lib/language'
import {
  getTimesTableStudyMastery,
  saveTimesTableStudyMastery,
} from '../lib/timesTableMastery'

// Backward-compat alias used by TimesTablePage
export { getTimesTableStudyMastery as getTimesTableMastery } from '../lib/timesTableMastery'

// 한국 구구단 암송 스타일: 이일은이, 이이는사, 이삼은육 ...
function toSinoKorean(n: number): string {
  const u = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구']
  if (n < 10) return u[n]
  const tens = Math.floor(n / 10)
  const ones = n % 10
  return (tens === 1 ? '' : u[tens]) + '십' + (ones === 0 ? '' : u[ones])
}

function getKoreanGugudanText(dan: number, factor: number, product: number): string {
  const u = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구']
  // 종성 여부: 1=일✓ 2=이✗ 3=삼✓ 4=사✗ 5=오✗ 6=육✓ 7=칠✓ 8=팔✓ 9=구✗
  const jong = [false, true, false, true, false, false, true, true, true, false]
  const danW    = u[dan]
  const factorW = u[factor]
  const prodW   = toSinoKorean(product)
  if (product < 10) {
    return `${danW} ${factorW}${jong[factor] ? '은' : '는'} ${prodW}`
  }
  return `${danW} ${factorW} ${prodW}`
}

function getMulFactText(dan: number, factor: number, product: number, language: SupportedLanguage): string {
  switch (language) {
    case 'ko': return getKoreanGugudanText(dan, factor, product)
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

const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

export default function TimesTableStudyPage() {
  const navigate = useNavigate()
  const { language, t } = useI18n()
  const { dan: danParam } = useParams<{ dan: string }>()
  const dan = Number(danParam) || 2
  const [revealed, setRevealed] = useState<Set<number>>(new Set([1,2,3,4,5,6,7,8,9]))
  const [speakingFactor, setSpeakingFactor] = useState<number | null>(null)
  const [isPlayingAll, setIsPlayingAll] = useState(false)
  const lastSpokenRef   = useRef<number | null>(null)
  const playingAllRef   = useRef(false)

  const facts = Array.from({ length: 9 }, (_, i) => ({
    factor: i + 1,
    product: dan * (i + 1),
  }))

  const allRevealed = revealed.size === 9

  useEffect(() => {
    const intro = getDanIntroText(dan, language as SupportedLanguage)
    say(intro, false, language as SupportedLanguage).catch(() => {})
    return () => { stopAll(); playingAllRef.current = false }
  }, [dan, language])

  useEffect(() => {
    if (allRevealed) saveTimesTableStudyMastery(dan)
  }, [allRevealed, dan])

  async function revealAndSpeak(factor: number, product: number) {
    await unlockTts()
    setRevealed(prev => { const next = new Set(prev); next.add(factor); return next })
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
    if (isPlayingAll) return
    if (revealed.has(factor)) {
      lastSpokenRef.current = factor
      setSpeakingFactor(factor)
      const text = getMulFactText(dan, factor, product, language as SupportedLanguage)
      await say(text, false, language as SupportedLanguage)
      setSpeakingFactor(null)
    } else {
      await revealAndSpeak(factor, product)
    }
  }

  const handlePlayAll = useCallback(async () => {
    if (isPlayingAll) {
      stopAll()
      playingAllRef.current = false
      setIsPlayingAll(false)
      setSpeakingFactor(null)
      return
    }
    await unlockTts()
    playingAllRef.current = true
    setIsPlayingAll(true)

    const lang = language as SupportedLanguage
    const intro = getDanIntroText(dan, lang)
    await say(intro, false, lang)

    for (const { factor, product } of facts) {
      if (!playingAllRef.current) break
      setRevealed(prev => { const next = new Set(prev); next.add(factor); return next })
      lastSpokenRef.current = factor
      setSpeakingFactor(factor)
      const text = getMulFactText(dan, factor, product, lang)
      await say(text, false, lang)
      if (!playingAllRef.current) break
      await delay(160)
    }

    setSpeakingFactor(null)
    playingAllRef.current = false
    setIsPlayingAll(false)
  }, [dan, language, facts, isPlayingAll])

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
                ⭐ {t('timesTablePage.danTitle', { dan })}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {/* 마지막 카드 재생 */}
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={replayLast}
                title="마지막 항목 다시 듣기"
                style={{
                  width: 42, height: 42, borderRadius: 14,
                  background: 'rgba(167,139,250,0.18)',
                  border: '1.5px solid rgba(167,139,250,0.4)',
                  cursor: 'pointer', fontSize: '1.1rem',
                }}
              >
                🔊
              </motion.button>
              {/* 전체 자동 재생 */}
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={handlePlayAll}
                title={isPlayingAll ? '정지' : '전체 듣기'}
                style={{
                  height: 42, borderRadius: 14, paddingInline: 14,
                  background: isPlayingAll
                    ? 'linear-gradient(135deg,#FB923C,#F97316)'
                    : 'linear-gradient(135deg,#A78BFA,#7C3AED)',
                  border: 'none', cursor: 'pointer',
                  fontSize: '0.82rem', fontWeight: 900, color: '#fff',
                  boxShadow: isPlayingAll ? '0 4px 0 #C2510C' : '0 4px 0 #5B21B6',
                  whiteSpace: 'nowrap',
                }}
              >
                {isPlayingAll ? '⏹ 정지' : '▶ 전체 듣기'}
              </motion.button>
            </div>
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

        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 16px 16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {facts.map(({ factor, product }, i) => {
              const isSpeaking = speakingFactor === factor
              return (
                <motion.button
                  key={factor}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleCardTap(factor, product)}
                  style={{
                    borderRadius: 16, cursor: 'pointer', padding: '10px 12px',
                    background: 'linear-gradient(135deg,rgba(167,139,250,0.18),rgba(124,58,237,0.1))',
                    boxShadow: isSpeaking
                      ? '0 0 0 3px rgba(167,139,250,0.7), 0 4px 0 rgba(124,58,237,0.3)'
                      : '0 4px 0 rgba(124,58,237,0.2), 0 6px 16px rgba(167,139,250,0.15)',
                    border: isSpeaking ? '2px solid rgba(167,139,250,0.8)' : '1.5px solid rgba(167,139,250,0.35)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    transition: 'box-shadow 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {isSpeaking && (
                      <motion.span
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity }}
                        style={{ fontSize: '0.85rem' }}
                      >🔊</motion.span>
                    )}
                    <span style={{ fontWeight: 900, fontSize: '1.05rem', color: '#2D2D3A' }}>
                      {dan} × {factor}
                    </span>
                  </div>
                  <span style={{ fontWeight: 900, fontSize: '1.15rem', color: '#7C3AED' }}>
                    = {product}
                  </span>
                </motion.button>
              )
            })}
          </div>

          {/* 완료 배너 + 시험 보기 버튼 */}
          <AnimatePresence>
            {allRevealed && (
              <motion.div
                initial={{ opacity: 0, y: 14, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                style={{ marginTop: 20 }}
              >
                <div style={{
                  padding: '18px', borderRadius: 22, textAlign: 'center',
                  background: 'linear-gradient(135deg,rgba(167,139,250,0.2),rgba(124,58,237,0.12))',
                  border: '2px solid rgba(167,139,250,0.5)',
                  boxShadow: '0 8px 0 rgba(124,58,237,0.2), 0 14px 28px rgba(167,139,250,0.22)',
                  marginBottom: 12,
                }}>
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.15, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{ fontSize: '2.4rem', marginBottom: 6 }}
                  >🎉</motion.div>
                  <div style={{ fontWeight: 900, fontSize: '1.05rem', color: '#5B21B6' }}>
                    {t('timesTablePage.mastered', { dan })}
                  </div>
                </div>

                {/* 시험 보기 버튼 */}
                <motion.button
                  whileTap={{ scale: 0.97, y: 3 }}
                  onClick={() => { stopAll(); navigate(`/times-table/${dan}/test`) }}
                  style={{
                    width: '100%', height: 54, borderRadius: 18, border: 'none', cursor: 'pointer',
                    background: 'linear-gradient(135deg,#FBBF24,#F59E0B)',
                    color: '#5A3800', fontWeight: 900, fontSize: '1rem',
                    boxShadow: '0 6px 0 #B45309, 0 10px 24px rgba(251,191,36,0.38)',
                  }}
                >
                  🌟 {t('timesTablePage.startTest', { dan })}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 곱셈 마법 문제 풀기 버튼 */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            whileTap={{ scale: 0.97, y: 3 }}
            onClick={() => { stopAll(); navigate('/practice/mul') }}
            style={{
              width: '100%', height: 54, borderRadius: 18, border: 'none', marginTop: 12,
              background: 'linear-gradient(135deg,#A78BFA,#7C3AED)',
              color: '#fff', fontWeight: 900, fontSize: '1rem', cursor: 'pointer',
              boxShadow: '0 6px 0 #5B21B6, 0 10px 24px rgba(167,139,250,0.38)',
            }}
          >
            ⭐ {t('timesTablePage.practiceMul')}
          </motion.button>
        </div>
      </div>
    </div>
  )
}

import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { MathQuestion } from '../lib/types'
import { say, sayWordsCached, preloadWords, stopAll, unlockTts } from '../lib/tts'
import { useI18n } from '../i18n'

const EMOJI_THEMES = [
  { name: '곰인형',     emoji: '🧸' },
  { name: '사탕',       emoji: '🍬' },
  { name: '초콜릿',     emoji: '🍫' },
  { name: '자동차',     emoji: '🚗' },
  { name: '도넛',       emoji: '🍩' },
  { name: '아이스크림', emoji: '🍦' },
  { name: '쿠키',       emoji: '🍪' },
  { name: '로켓',       emoji: '🚀' },
  { name: '피자',       emoji: '🍕' },
  { name: '케이크',     emoji: '🎂' },
  { name: '풍선',       emoji: '🎈' },
  { name: '별사탕',     emoji: '🌟' },
]

const KO_COUNT = ['하나','둘','셋','넷','다섯','여섯','일곱','여덟','아홉','열','열하나','열둘','열셋','열넷','열다섯','열여섯','열일곱','열여덟','열아홉','스물']
const KO_QUAN  = ['한','두','세','네','다섯','여섯','일곱','여덟','아홉','열','열한','열두','열세','열네','열다섯','열여섯','열일곱','열여덟','열아홉','스무']
const KO_READ  = ['일','이','삼','사','오','육','칠','팔','구','십','십일','십이','십삼','십사','십오','십육','십칠','십팔','십구','이십']

const koNum  = (n: number) => KO_COUNT[n-1] ?? String(n)
const koQuan = (n: number) => KO_QUAN[n-1]  ?? String(n)
const koRead = (n: number) => KO_READ[n-1]  ?? String(n)
const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

interface Props { question: MathQuestion; themeIndex: number }

export default function VisualSolution({ question, themeIndex }: Props) {
  return <KoreanVisualSolution question={question} themeIndex={themeIndex} />
}

function KoreanVisualSolution({ question, themeIndex }: Props) {
  const { language, t } = useI18n()
  const { num1, num2, operation, answer } = question
  const theme = EMOJI_THEMES[themeIndex % EMOJI_THEMES.length]
  const isAdd = operation === 'add'
  const usePlaceValueAdd = isAdd && Math.max(String(num1).length, String(num2).length, String(answer).length) >= 2
  const useSubtractionVisual = operation === 'sub'
  const cap = (n: number) => Math.min(n, 10)
  const c1 = cap(num1), c2 = cap(num2), cAns = cap(answer)

  const [hl1,      setHl1]      = useState(-1)
  const [shown2,   setShown2]   = useState<number[]>([])
  const [hl2,      setHl2]      = useState(-1)
  const [shownAll, setShownAll] = useState<number[]>([])
  const [hlAll,    setHlAll]    = useState(-1)
  const [phase,    setPhase]    = useState<'idle'|'show1'|'count1'|'show2'|'count2'|'countAll'|'result'>('idle')
  const [show2,    setShow2]    = useState(false)
  const [showAll,  setShowAll]  = useState(false)
  const [muted,    setMuted]    = useState(false)

  const runningRef = useRef(false)
  const mutedRef   = useRef(false)
  mutedRef.current = muted

  function reset() {
    runningRef.current = false
    stopAll()
    setPhase('idle')
    setHl1(-1); setHl2(-1); setHlAll(-1)
    setShown2([]); setShownAll([])
    setShow2(false); setShowAll(false)
  }

  async function run() {
    reset()
    runningRef.current = true
    const m = mutedRef.current

    const countWord = (n: number) => language === 'ko' ? koNum(n) : String(n)
    const readWord = (n: number) => language === 'ko' ? koRead(n) : String(n)
    const quantityWord = (n: number) => language === 'ko' ? koQuan(n) : String(n)
    const n1r = readWord(num1), n2r = readWord(num2)
    const n1q = quantityWord(num1), n2q = quantityWord(num2), anq = quantityWord(answer)

    const words1   = Array.from({ length: num1 },  (_, i) => countWord(i + 1))
    const words2   = Array.from({ length: num2 },  (_, i) => countWord(i + 1))
    const wordsAll = Array.from({ length: answer }, (_, i) => countWord(i + 1))

    const [urls1, urls2, urlsAll] = await Promise.all([
      preloadWords(words1, language),
      preloadWords(words2, language),
      preloadWords(wordsAll, language),
    ])

    const alive = () => runningRef.current
    if (!alive()) return

    await say(
      isAdd
        ? t('solution.addIntro', { num1: n1r, num2: n2r })
        : t('solution.subIntro', { num1: n1r, num2: n2r }),
      m,
      language,
    )
    if (!alive()) return

    // ② 그룹1 소개
    setPhase('show1')
    await say(t('solution.groupStart', { count: n1q }), m, language)
    if (!alive()) return

    // ③ 그룹1 카운팅
    setPhase('count1')
    await new Promise<void>(resolve => {
      sayWordsCached(urls1, words1, m,
        i => { if (alive()) setHl1(i) },
        () => { setHl1(-1); resolve() }
        , language
      )
    })
    if (!alive()) return
    await pause(300)

    // ④ 그룹2 소개
    setShow2(true); setPhase('show2')
    const txt2 = isAdd
      ? t('solution.groupAdd', { count: n2q })
      : t('solution.groupSub', { count: n2q })
    await say(txt2, m, language)
    if (!alive()) return

    // ⑤ 그룹2 카운팅
    setPhase('count2')
    await new Promise<void>(resolve => {
      sayWordsCached(urls2, words2, m,
        i => {
          if (!alive()) return
          setHl2(i)
          setShown2(prev => prev.includes(i) ? prev : [...prev, i])
        },
        () => { setHl2(-1); resolve() }
        , language
      )
    })
    if (!alive()) return
    await pause(300)

    // ⑥ 모두 세어봐요
    setShowAll(true); setPhase('countAll')
    const txtAll = isAdd
      ? t('solution.countAllAdd')
      : t('solution.countAllSub')
    await say(txtAll, m, language)
    if (!alive()) return

    // ⑦ 전체 카운팅
    await new Promise<void>(resolve => {
      sayWordsCached(urlsAll, wordsAll, m,
        i => {
          if (!alive()) return
          setHlAll(i)
          setShownAll(prev => prev.includes(i) ? prev : [...prev, i])
        },
        () => { setHlAll(-1); resolve() }
        , language
      )
    })
    if (!alive()) return
    await pause(300)

    // ⑧ 결과
    setPhase('result')
    const txtResult = isAdd
      ? t('solution.addResult', { count: anq, num1: n1r, num2: n2r, answer: readWord(answer) })
      : t('solution.subResult', { count: anq, num1: n1r, num2: n2r, answer: readWord(answer) })
    await say(txtResult, m, language)
  }

  function pause(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  useEffect(() => {
    if (usePlaceValueAdd || useSubtractionVisual || operation === 'mul' || operation === 'div') return
    run()
    return () => { runningRef.current = false; stopAll() }
  }, [question.id])

  if (usePlaceValueAdd) {
    return <PlaceValueAdditionSolution question={question} theme={theme} />
  }

  if (useSubtractionVisual) {
    return <SubtractionSolution question={question} theme={theme} />
  }

  if (operation === 'mul' || operation === 'div') {
    return <MulDivSolution question={question} theme={theme} />
  }

  // ─── 이모지 셀 ──────────────────────────────────────────
  function EmojiCell({ idx, hlIdx, hlColor, visible, flyIn }: {
    idx: number; hlIdx: number; hlColor: string; visible: boolean; flyIn: boolean
  }) {
    const hl = hlIdx === idx
    return (
      <motion.div
        animate={visible
          ? { y: 0, opacity: 1, scale: 1 }
          : flyIn ? { y: -50, opacity: 0, scale: 0.3 } : { y: 0, opacity: 1, scale: 1 }
        }
        initial={flyIn ? { y: -50, opacity: 0, scale: 0.3 } : false}
        transition={{ type: 'spring', damping: 13, stiffness: 260 }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}
      >
        <motion.div
          animate={{ background: hl ? hlColor : 'transparent', scale: hl ? 1.22 : 1, boxShadow: hl ? `0 0 12px ${hlColor}` : 'none' }}
          transition={{ duration: 0.13 }}
          style={{ fontSize: '1.7rem', lineHeight: 1, width: 36, textAlign: 'center', padding: '2px', borderRadius: 9 }}
        >{theme.emoji}</motion.div>
        <motion.div
          animate={{ background: hl ? hlColor : hlColor + '28', color: hl ? '#fff' : hlColor }}
          transition={{ duration: 0.13 }}
          style={{ width: 22, height: 22, borderRadius: 7, border: `1.5px solid ${hlColor}70`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 900 }}
        >{idx + 1}</motion.div>
      </motion.div>
    )
  }

  const box = (bg: string, border: string): React.CSSProperties => ({
    background: bg, border: `2px solid ${border}`,
    borderRadius: 14, padding: '8px 10px', flexShrink: 0,
  })

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>

      {/* 버튼 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => { unlockTts(); setMuted(v => !v) }}
          style={{ background: muted ? 'rgba(255,118,118,0.15)' : 'rgba(98,214,178,0.15)', border: `2px solid ${muted ? 'rgba(255,118,118,0.4)' : 'rgba(98,214,178,0.4)'}`, borderRadius: 10, padding: '5px 12px', cursor: 'pointer', fontWeight: 800, fontSize: '0.78rem', color: muted ? '#FF5555' : '#2A9A70' }}>
          {muted ? t('solution.voiceOff') : t('solution.voiceOn')}
        </motion.button>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => { unlockTts(); run() }}
          style={{ background: 'rgba(201,182,255,0.15)', border: '2px solid rgba(201,182,255,0.45)', borderRadius: 10, padding: '5px 12px', cursor: 'pointer', fontWeight: 800, fontSize: '0.78rem', color: '#7B5FCC' }}>
          {t('solution.replay')}
        </motion.button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5, overflow: 'hidden', minHeight: 0 }}>

        {/* 그룹1 */}
        {phase !== 'idle' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={box('rgba(98,214,178,0.1)', 'rgba(98,214,178,0.4)')}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2A9A70', marginBottom: 6 }}>
              {theme.emoji} {theme.name} {num1}개
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {Array.from({ length: c1 }, (_, i) => (
                <EmojiCell key={i} idx={i}
                  hlIdx={phase === 'countAll' || phase === 'result' ? hlAll : hl1}
                  hlColor="#62D6B2" visible flyIn={false} />
              ))}
            </div>
          </motion.div>
        )}

        {/* 연산자 */}
        {show2 && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
            style={{ flexShrink: 0, textAlign: 'center', fontSize: '1.3rem', fontWeight: 900, color: isAdd ? '#62D6B2' : '#FF7676' }}>
            {isAdd ? '➕' : '➖'}
          </motion.div>
        )}

        {/* 그룹2 */}
        {show2 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={box(isAdd ? 'rgba(201,182,255,0.12)' : 'rgba(255,118,118,0.08)', isAdd ? 'rgba(201,182,255,0.45)' : 'rgba(255,118,118,0.3)')}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: isAdd ? '#7B5FCC' : '#FF5555', marginBottom: 6 }}>
              {theme.emoji} {isAdd ? `더 온 ${theme.name} ${num2}개` : `사라진 ${theme.name} ${num2}개`}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, minHeight: 52 }}>
              {Array.from({ length: c2 }, (_, i) => (
                <EmojiCell key={i} idx={i} hlIdx={hl2}
                  hlColor={isAdd ? '#A891FF' : '#FF7676'}
                  visible={shown2.includes(i)} flyIn />
              ))}
            </div>
          </motion.div>
        )}

        {/* = */}
        {showAll && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
            style={{ flexShrink: 0, textAlign: 'center', fontSize: '1.4rem', fontWeight: 900, color: '#62D6B2' }}>
            =
          </motion.div>
        )}

        {/* 모두 세어봐요 */}
        {showAll && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ ...box('rgba(255,255,255,0.82)', 'rgba(98,214,178,0.35)'), flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2D2D3A', marginBottom: 6 }}>🔢 모두 세어봐요!</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
              {Array.from({ length: cAns }, (_, i) => (
                <EmojiCell key={i} idx={i} hlIdx={hlAll}
                  hlColor={isAdd && i >= num1 ? '#A891FF' : '#62D6B2'}
                  visible={shownAll.includes(i)} flyIn />
              ))}
            </div>
            {phase === 'result' && (
              <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', damping: 10 }}
                style={{ textAlign: 'center', fontWeight: 900, fontSize: '1.3rem', color: '#2A9A70', background: 'rgba(98,214,178,0.15)', borderRadius: 12, padding: '8px 0', border: '2px solid rgba(98,214,178,0.35)', marginTop: 'auto' }}>
                {isAdd ? `${num1} + ${num2} = ` : `${num1} − ${num2} = `}
                <span style={{ fontSize: '1.7rem', color: '#3EC99A' }}>{answer}</span>개! 🎉
              </motion.div>
            )}
            {phase === 'countAll' && (
              <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 6 }}>
                {[0,1,2].map(i => (
                  <motion.div key={i} animate={{ scale:[1,1.5,1], opacity:[0.4,1,0.4] }}
                    transition={{ duration: 0.7, delay: i*0.18, repeat: Infinity }}
                    style={{ width: 6, height: 6, borderRadius: '50%', background: '#62D6B2' }} />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}

function MulDivSolution({
  question,
  theme,
}: {
  question: MathQuestion
  theme: { name: string; emoji: string }
}) {
  if (question.operation === 'mul') {
    return <MultiplicationSolution question={question} theme={theme} />
  }
  return <DivisionSolution question={question} theme={theme} />
}

// ─── 폭죽 파티클 애니메이션 ────────────────────────────────
const CONFETTI_SPEC = [
  { s: '✦', x: -60, y: -38, c: '#FFE58F' },
  { s: '★', x:  62, y: -52, c: '#A78BFA' },
  { s: '✦', x: -28, y: -66, c: '#62D6B2' },
  { s: '●', x:  48, y: -22, c: '#FB923C' },
  { s: '★', x: -52, y: -14, c: '#FF7676' },
  { s: '✦', x:  26, y: -72, c: '#A8D8FF' },
  { s: '●', x: -14, y: -44, c: '#FFC7D9' },
  { s: '★', x:  56, y: -62, c: '#FFE58F' },
  { s: '✦', x:   4, y: -80, c: '#62D6B2' },
  { s: '●', x: -66, y: -34, c: '#A78BFA' },
  { s: '★', x:  36, y: -18, c: '#FB923C' },
  { s: '✦', x: -40, y: -58, c: '#FF7676' },
]

function ConfettiParticles() {
  return (
    <div style={{ position: 'absolute', top: '50%', left: '50%', pointerEvents: 'none', zIndex: 20 }}>
      {CONFETTI_SPEC.map((p, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
          animate={{ opacity: [0, 1, 1, 0], scale: [0, 1.4, 1.1, 0], x: p.x, y: p.y }}
          transition={{ duration: 1.0, delay: i * 0.045, ease: 'easeOut' }}
          style={{ position: 'absolute', fontSize: '1rem', color: p.c, fontWeight: 900, transform: 'translate(-50%,-50%)' }}
        >
          {p.s}
        </motion.div>
      ))}
    </div>
  )
}

// ─── 곱셈 시각적 해설 ──────────────────────────────────────
function MultiplicationSolution({
  question,
  theme,
}: {
  question: MathQuestion
  theme: { name: string; emoji: string }
}) {
  const { language, t } = useI18n()
  const { num1, num2, answer } = question

  const [phase, setPhase] = useState<'idle' | 'groups' | 'counting' | 'result'>('idle')
  const [confettiKey, setConfettiKey] = useState(0)
  const [muted, setMuted] = useState(false)
  const runningRef = useRef(false)
  const mutedRef = useRef(false)
  mutedRef.current = muted

  const displayPerGroup = Math.min(num1, 9)
  const displayGroups   = Math.min(num2, 9)
  const cols = displayPerGroup <= 2 ? displayPerGroup : 3

  // 언어별 TTS 문장 (이모지 없음)
  const ttsIntro = language === 'ko'
    ? `${theme.name} ${num1}개씩, 묶음이 ${num2}개 있어요!`
    : t('solution.mulGroupsIntro', { num1, num2 })
  const ttsCount = language === 'ko'
    ? `${theme.name}이 모두 ${answer}개예요!`
    : t('solution.mulCountAll', { answer })
  const ttsFinal = language === 'ko'
    ? `${num1} 곱하기 ${num2}는 ${answer}이에요!`
    : t('solution.mulFinal', { num1, num2, answer })

  function reset() {
    runningRef.current = false
    stopAll()
    setPhase('idle')
    setConfettiKey(0)
  }

  async function run() {
    reset()
    await delay(80)
    runningRef.current = true
    const m = mutedRef.current
    const alive = () => runningRef.current

    // 1. 묶음 전부 한번에 표시 + 설명
    setPhase('groups')
    await say(ttsIntro, m, language)
    if (!alive()) return
    await delay(500)

    // 2. 합계 + 폭죽
    setPhase('counting')
    setConfettiKey(k => k + 1)
    await say(ttsCount, m, language)
    if (!alive()) return
    await delay(300)

    // 3. 정답 수식
    setPhase('result')
    await say(ttsFinal, m, language)
  }

  useEffect(() => {
    run()
    return () => { runningRef.current = false; stopAll() }
  }, [question.id])

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 5, position: 'relative' }}>
      {confettiKey > 0 && <ConfettiParticles key={confettiKey} />}

      {/* 버튼 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => { unlockTts(); setMuted(v => !v) }}
          style={{ background: muted ? 'rgba(255,118,118,0.15)' : 'rgba(167,139,250,0.15)', border: `2px solid ${muted ? 'rgba(255,118,118,0.4)' : 'rgba(167,139,250,0.4)'}`, borderRadius: 10, padding: '5px 12px', cursor: 'pointer', fontWeight: 800, fontSize: '0.78rem', color: muted ? '#FF5555' : '#7B5FCC' }}>
          {muted ? t('solution.voiceOff') : t('solution.voiceOn')}
        </motion.button>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => { unlockTts(); run() }}
          style={{ background: 'rgba(201,182,255,0.15)', border: '2px solid rgba(201,182,255,0.45)', borderRadius: 10, padding: '5px 12px', cursor: 'pointer', fontWeight: 800, fontSize: '0.78rem', color: '#7B5FCC' }}>
          {t('solution.replay')}
        </motion.button>
      </div>

      {/* 수식 헤더 */}
      <div style={{ flexShrink: 0, textAlign: 'center', padding: '7px 12px', borderRadius: 13, background: 'rgba(167,139,250,0.1)', border: '2px solid rgba(167,139,250,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <span style={{ fontSize: '1.45rem', fontWeight: 900, color: '#2D2D3A' }}>{num1}</span>
        <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#A78BFA' }}>×</span>
        <span style={{ fontSize: '1.45rem', fontWeight: 900, color: '#2D2D3A' }}>{num2}</span>
        <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#7A7A9A' }}>=</span>
        {phase === 'counting' || phase === 'result' ? (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 8 }}
            style={{ fontSize: '1.65rem', fontWeight: 900, color: '#A78BFA' }}>{answer}</motion.span>
        ) : (
          <span style={{ fontSize: '1.45rem', fontWeight: 900, color: '#C8C8D8' }}>?</span>
        )}
      </div>

      {/* 묶음 그리드 — 모두 한번에 등장 */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, justifyContent: 'center', padding: '2px 2px 6px' }}>
          {Array.from({ length: displayGroups }, (_, g) => (
            <motion.div
              key={g}
              initial={{ opacity: 0, scale: 0.55, y: 20 }}
              animate={{ opacity: phase !== 'idle' ? 1 : 0, scale: phase !== 'idle' ? 1 : 0.55, y: phase !== 'idle' ? 0 : 20 }}
              transition={{ type: 'spring', damping: 14, stiffness: 240, delay: g * 0.05 }}
              style={{ background: 'rgba(167,139,250,0.13)', border: '2px solid rgba(167,139,250,0.5)', borderRadius: 13, padding: '5px 7px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, minWidth: 48 }}
            >
              <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#7B5FCC' }}>묶음 {g + 1}</div>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 1 }}>
                {Array.from({ length: displayPerGroup }, (_, i) => (
                  <span key={i} style={{ fontSize: '1.1rem', lineHeight: 1.1 }}>{theme.emoji}</span>
                ))}
              </div>
              <div style={{ fontSize: '0.68rem', fontWeight: 900, color: '#5B21B6', background: 'rgba(167,139,250,0.22)', borderRadius: 5, padding: '1px 5px' }}>{displayPerGroup}개</div>
            </motion.div>
          ))}
        </div>

        {/* 합계 배지 */}
        {(phase === 'counting' || phase === 'result') && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.88 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', damping: 12 }}
            style={{ textAlign: 'center', marginTop: 6, fontSize: '0.92rem', fontWeight: 900, color: '#7B5FCC' }}
          >
            {theme.emoji} 모두 <span style={{ fontSize: '1.35rem', color: '#A78BFA' }}>{answer}</span>개
          </motion.div>
        )}
      </div>

      {/* 정답 수식 */}
      {phase === 'result' && (
        <motion.div initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', damping: 10 }}
          style={{ flexShrink: 0, textAlign: 'center', padding: '9px', borderRadius: 13, background: 'rgba(167,139,250,0.16)', border: '2px solid rgba(167,139,250,0.42)', fontWeight: 900, fontSize: '1.15rem', color: '#5B21B6' }}>
          {num1} × {num2} = <span style={{ fontSize: '1.55rem', color: '#A78BFA' }}>{answer}</span>
        </motion.div>
      )}
    </div>
  )
}

// ─── 나눗셈 시각적 해설 ─────────────────────────────────────
function DivisionSolution({
  question,
  theme,
}: {
  question: MathQuestion
  theme: { name: string; emoji: string }
}) {
  const { language, t } = useI18n()
  const { num1, num2, answer } = question

  const [phase, setPhase] = useState<'idle' | 'showing' | 'dividing' | 'result'>('idle')
  const [shownResultGroups, setShownResultGroups] = useState(0)
  const [confettiKey, setConfettiKey] = useState(0)
  const [muted, setMuted] = useState(false)
  const runningRef = useRef(false)
  const mutedRef = useRef(false)
  mutedRef.current = muted

  const tens = Math.floor(num1 / 10)
  const ones = num1 % 10
  const displayGroups   = Math.min(num2, 9)
  const displayPerGroup = Math.min(answer, 9)
  const cols = displayPerGroup <= 2 ? displayPerGroup : 3

  // 언어별 TTS 문장 (이모지 없음)
  const ttsItemsStart = language === 'ko'
    ? `${theme.name} ${num1}개가 있어요!`
    : t('solution.divItemsStart', { num1 })
  const ttsShareStart = language === 'ko'
    ? `${num2}명이 똑같이 나눠 가져요!`
    : t('solution.divShareStart', { num2 })
  const ttsEachGroup = language === 'ko'
    ? `한 명에게 ${answer}개씩이에요!`
    : t('solution.divEachGroup', { answer })
  const ttsFinal = language === 'ko'
    ? `${num1} 나누기 ${num2}는 ${answer}이에요!`
    : t('solution.divFinal', { num1, num2, answer })

  function reset() {
    runningRef.current = false
    stopAll()
    setPhase('idle')
    setShownResultGroups(0)
    setConfettiKey(0)
  }

  async function run() {
    reset()
    await delay(80)
    runningRef.current = true
    const m = mutedRef.current
    const alive = () => runningRef.current

    setPhase('showing')
    await say(ttsItemsStart, m, language)
    if (!alive()) return
    await delay(600)

    setPhase('dividing')
    await say(ttsShareStart, m, language)
    if (!alive()) return
    await delay(300)

    for (let i = 1; i <= displayGroups; i++) {
      if (!alive()) return
      setShownResultGroups(i)
      await delay(300)
    }

    // 모든 묶음 채워졌을 때 폭죽
    setConfettiKey(k => k + 1)
    await say(ttsEachGroup, m, language)
    if (!alive()) return
    setPhase('result')
    await say(ttsFinal, m, language)
  }

  useEffect(() => {
    run()
    return () => { runningRef.current = false; stopAll() }
  }, [question.id])

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 5, position: 'relative' }}>
      {confettiKey > 0 && <ConfettiParticles key={confettiKey} />}

      {/* 버튼 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => { unlockTts(); setMuted(v => !v) }}
          style={{ background: muted ? 'rgba(255,118,118,0.15)' : 'rgba(251,146,60,0.15)', border: `2px solid ${muted ? 'rgba(255,118,118,0.4)' : 'rgba(251,146,60,0.4)'}`, borderRadius: 10, padding: '5px 12px', cursor: 'pointer', fontWeight: 800, fontSize: '0.78rem', color: muted ? '#FF5555' : '#EA580C' }}>
          {muted ? t('solution.voiceOff') : t('solution.voiceOn')}
        </motion.button>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => { unlockTts(); run() }}
          style={{ background: 'rgba(201,182,255,0.15)', border: '2px solid rgba(201,182,255,0.45)', borderRadius: 10, padding: '5px 12px', cursor: 'pointer', fontWeight: 800, fontSize: '0.78rem', color: '#7B5FCC' }}>
          {t('solution.replay')}
        </motion.button>
      </div>

      {/* 수식 헤더 */}
      <div style={{ flexShrink: 0, textAlign: 'center', padding: '7px 12px', borderRadius: 13, background: 'rgba(251,146,60,0.1)', border: '2px solid rgba(251,146,60,0.38)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <span style={{ fontSize: '1.45rem', fontWeight: 900, color: '#2D2D3A' }}>{num1}</span>
        <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FB923C' }}>÷</span>
        <span style={{ fontSize: '1.45rem', fontWeight: 900, color: '#2D2D3A' }}>{num2}</span>
        <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#7A7A9A' }}>=</span>
        {phase === 'result' ? (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 8 }}
            style={{ fontSize: '1.65rem', fontWeight: 900, color: '#FB923C' }}>{answer}</motion.span>
        ) : (
          <span style={{ fontSize: '1.45rem', fontWeight: 900, color: '#C8C8D8' }}>?</span>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5, overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}>

        {/* 1단계: 전체 아이템 (10묶음 + 낱개) */}
        {phase !== 'idle' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            style={{ flexShrink: 0, padding: '7px 10px', borderRadius: 13, background: 'rgba(98,214,178,0.1)', border: '2px solid rgba(98,214,178,0.4)' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 900, color: '#2A9A70', marginBottom: 5 }}>
              {theme.emoji} 모두 {num1}개
            </div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
              {Array.from({ length: tens }, (_, i) => <TenBundle key={i} theme={theme} />)}
              {Array.from({ length: ones }, (_, i) => <OneItem key={i} theme={theme} />)}
            </div>
          </motion.div>
        )}

        {/* 2단계: 나누기 안내 */}
        {(phase === 'dividing' || phase === 'result') && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            style={{ flexShrink: 0, textAlign: 'center', fontWeight: 900, fontSize: '0.88rem', color: '#FB923C' }}>
            ↓ ÷ {num2}명이 나눠 가져요
          </motion.div>
        )}

        {/* 3단계: 결과 묶음 박스들 */}
        {(phase === 'dividing' || phase === 'result') && (
          <div style={{ flexShrink: 0 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, justifyContent: 'center' }}>
              {Array.from({ length: displayGroups }, (_, g) => (
                <motion.div key={g}
                  animate={{ opacity: g < shownResultGroups ? 1 : 0.22, scale: g < shownResultGroups ? 1 : 0.88 }}
                  transition={{ type: 'spring', damping: 13 }}
                  style={{ background: g < shownResultGroups ? 'rgba(251,146,60,0.13)' : 'rgba(200,200,200,0.08)', border: `2px solid ${g < shownResultGroups ? 'rgba(251,146,60,0.5)' : 'rgba(200,200,200,0.28)'}`, borderRadius: 13, padding: '5px 7px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, minWidth: 48 }}>
                  <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#EA580C' }}>{g + 1}번</div>
                  {g < shownResultGroups ? (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 1 }}>
                        {Array.from({ length: displayPerGroup }, (_, i) => (
                          <span key={i} style={{ fontSize: '1.05rem', lineHeight: 1.1 }}>{theme.emoji}</span>
                        ))}
                      </div>
                      <div style={{ fontSize: '0.68rem', fontWeight: 900, color: '#C2510C', background: 'rgba(251,146,60,0.22)', borderRadius: 5, padding: '1px 5px' }}>{displayPerGroup}개</div>
                    </>
                  ) : (
                    <div style={{ fontSize: '1.2rem', color: '#D0D0D8', fontWeight: 900, lineHeight: 1.6 }}>?</div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 정답 수식 */}
      {phase === 'result' && (
        <motion.div initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', damping: 10 }}
          style={{ flexShrink: 0, textAlign: 'center', padding: '9px', borderRadius: 13, background: 'rgba(251,146,60,0.15)', border: '2px solid rgba(251,146,60,0.42)', fontWeight: 900, fontSize: '1.15rem', color: '#C2510C' }}>
          {num1} ÷ {num2} = <span style={{ fontSize: '1.55rem', color: '#FB923C' }}>{answer}</span>
        </motion.div>
      )}
    </div>
  )
}

function LocalizedVisualSolution({ question }: { question: MathQuestion }) {
  const { language, t } = useI18n()
  const [muted, setMuted] = useState(false)
  const [stage, setStage] = useState(0)
  const runningRef = useRef(false)
  const isAdd = question.operation === 'add'
  const sign = isAdd ? '+' : '-'
  const step1 = t('solution.stepFirst', { num: question.num1 })
  const step2 = isAdd
    ? t('solution.stepAdd', { num: question.num2 })
    : t('solution.stepSub', { num: question.num2 })
  const explanation = isAdd
    ? t('solution.addExplain', { num1: question.num1, num2: question.num2, answer: question.answer })
    : t('solution.subExplain', { num1: question.num1, num2: question.num2, answer: question.answer })

  async function runLocalizedSolution() {
    runningRef.current = false
    stopAll()
    await delay(80)
    runningRef.current = true
    const alive = () => runningRef.current

    await unlockTts()
    if (!alive()) return
    setStage(1)
    await say(step1, muted, language)
    if (!alive()) return
    await delay(180)

    setStage(2)
    await say(step2, muted, language)
    if (!alive()) return
    await delay(180)

    setStage(3)
    await say(explanation, muted, language)
  }

  useEffect(() => {
    runLocalizedSolution()
    return () => {
      runningRef.current = false
      stopAll()
    }
  }, [question.id, language])

  return (
    <div
      className="glass-card"
      style={{
        height: '100%',
        minHeight: 260,
        padding: 18,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 14,
        background: 'rgba(255,255,255,0.82)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <motion.button
          whileTap={{ scale: 0.95, y: 2 }}
          type="button"
          onClick={() => setMuted(value => !value)}
          style={solutionButtonStyle}
        >
          {muted ? t('solution.voiceOff') : t('solution.voiceOn')}
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95, y: 2 }}
          type="button"
          onClick={runLocalizedSolution}
          style={solutionButtonStyle}
        >
          {t('solution.replay')}
        </motion.button>
      </div>

      <div style={{ textAlign: 'center', display: 'grid', gap: 10 }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#7A7A9A', marginBottom: 10 }}>
          {t('solution.title')}
        </div>
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: stage >= 1 ? 1 : 0.25, y: stage >= 1 ? 0 : 12, scale: stage >= 1 ? 1 : 0.96 }}
          style={{
            display: 'inline-grid',
            gridTemplateColumns: '1fr auto 1fr auto 1fr',
            alignItems: 'center',
            gap: 12,
            padding: '18px 20px',
            borderRadius: 22,
            background: 'linear-gradient(135deg,rgba(98,214,178,0.16),rgba(168,216,255,0.18))',
            border: '1.5px solid rgba(255,255,255,0.9)',
            boxShadow: '0 10px 24px rgba(76,106,170,0.12)',
          }}
        >
          {[question.num1, sign, stage >= 2 ? question.num2 : '?', '=', stage >= 3 ? question.answer : '?'].map((item, index) => (
            <motion.span
              key={`${item}-${index}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              style={{
                fontSize: typeof item === 'number' ? '2rem' : '1.35rem',
                fontWeight: 900,
                color: index === 4 ? '#31A77E' : '#2D2D3A',
              }}
            >
              {item}
            </motion.span>
          ))}
        </motion.div>

        <div style={{ display: 'grid', gap: 8 }}>
          <LocalizedStepCard active={stage >= 1} done={stage > 1} label={step1} />
          <LocalizedStepCard active={stage >= 2} done={stage > 2} label={step2} />
          <LocalizedStepCard active={stage >= 3} done={stage >= 3} label={explanation} strong />
        </div>
      </div>

      {stage < 3 && (
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
          {[0, 1, 2].map(i => (
            <motion.span
              key={i}
              animate={{ scale: [1, 1.45, 1], opacity: [0.35, 1, 0.35] }}
              transition={{ duration: 0.7, delay: i * 0.16, repeat: Infinity }}
              style={{ width: 7, height: 7, borderRadius: '50%', background: '#62D6B2' }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function LocalizedStepCard({ active, done, label, strong }: { active: boolean; done: boolean; label: string; strong?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{
        opacity: active ? 1 : 0.3,
        x: active ? 0 : -12,
        scale: active ? 1 : 0.98,
      }}
      transition={{ type: 'spring', damping: 18, stiffness: 260 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        borderRadius: 16,
        background: strong ? 'rgba(98,214,178,0.18)' : 'rgba(255,255,255,0.72)',
        border: `1.5px solid ${strong ? 'rgba(98,214,178,0.42)' : 'rgba(255,255,255,0.9)'}`,
        color: strong ? '#227B5F' : '#5E6178',
        fontWeight: 900,
        lineHeight: 1.35,
        textAlign: 'left',
      }}
    >
      <motion.span
        animate={active && !done ? { scale: [1, 1.12, 1] } : {}}
        transition={{ duration: 0.8, repeat: active && !done ? Infinity : 0 }}
        style={{
          width: 28,
          height: 28,
          borderRadius: 10,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          background: done ? '#62D6B2' : 'rgba(98,214,178,0.16)',
          color: done ? '#FFFFFF' : '#31A77E',
          fontWeight: 900,
        }}
      >
        {done ? '✓' : '•'}
      </motion.span>
      <span>{label}</span>
    </motion.div>
  )
}

const solutionButtonStyle: React.CSSProperties = {
  border: 'none',
  borderRadius: 14,
  background: 'rgba(255,255,255,0.82)',
  color: '#5E6178',
  fontWeight: 900,
  fontSize: '0.8rem',
  padding: '9px 12px',
  boxShadow: '0 4px 12px rgba(76,106,170,0.12)',
}

function PlaceValueAdditionSolution({
  question,
  theme,
}: {
  question: MathQuestion
  theme: { name: string; emoji: string }
}) {
  const { language, t } = useI18n()
  const { num1, num2, answer } = question
  const [stage, setStage] = useState(0)
  const [muted, setMuted] = useState(false)
  const runningRef = useRef(false)
  const mutedRef = useRef(false)
  mutedRef.current = muted

  const n1 = splitPlace(num1)
  const n2 = splitPlace(num2)
  const ans = splitPlace(answer)
  const onesSum = n1.ones + n2.ones
  const carry = Math.floor(onesSum / 10)
  const finalOnes = onesSum % 10
  const tensTotal = n1.tens + n2.tens + carry
  const hasCarry = carry > 0

  async function runPlaceValue() {
    runningRef.current = false
    stopAll()
    await delay(80)
    runningRef.current = true
    const m = mutedRef.current
    const alive = () => runningRef.current

    setStage(1)
    await say(t('solution.placeSplit', { num: num1, tens: n1.tens, ones: n1.ones }), m, language)
    if (!alive()) return

    setStage(2)
    await say(t('solution.placeSplit', { num: num2, tens: n2.tens, ones: n2.ones }), m, language)
    if (!alive()) return

    setStage(3)
    await say(t('solution.onesAdd', { ones1: n1.ones, ones2: n2.ones, sum: onesSum }), m, language)
    if (!alive()) return

    if (hasCarry) {
      setStage(4)
      await say(t('solution.carryMakeBundle', { sum: onesSum, carry }), m, language)
      if (!alive()) return
      await say(t('solution.carryMoveBundle', { carry, ones: finalOnes }), m, language)
      if (!alive()) return
    }

    setStage(5)
    await say(t('solution.tensAdd', { tens1: n1.tens, tens2: n2.tens, carry: hasCarry ? carry : 0, total: tensTotal }), m, language)
    if (!alive()) return

    setStage(6)
    await say(t('solution.placeAddResult', { tens: ans.tens, ones: ans.ones, num1, num2, answer }), m, language)
  }

  useEffect(() => {
    runPlaceValue()
    return () => { runningRef.current = false; stopAll() }
  }, [question.id])

  const box = (bg: string, border: string): React.CSSProperties => ({
    background: bg,
    border: `2px solid ${border}`,
    borderRadius: 14,
    padding: '8px 10px',
    flexShrink: 0,
  })

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => { unlockTts(); setMuted(v => !v) }}
          style={{ background: muted ? 'rgba(255,118,118,0.15)' : 'rgba(98,214,178,0.15)', border: `2px solid ${muted ? 'rgba(255,118,118,0.4)' : 'rgba(98,214,178,0.4)'}`, borderRadius: 10, padding: '5px 12px', cursor: 'pointer', fontWeight: 800, fontSize: '0.78rem', color: muted ? '#FF5555' : '#2A9A70' }}>
          {muted ? t('solution.voiceOff') : t('solution.voiceOn')}
        </motion.button>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => { unlockTts(); runPlaceValue() }}
          style={{ background: 'rgba(201,182,255,0.15)', border: '2px solid rgba(201,182,255,0.45)', borderRadius: 10, padding: '5px 12px', cursor: 'pointer', fontWeight: 800, fontSize: '0.78rem', color: '#7B5FCC' }}>
          {t('solution.replay')}
        </motion.button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5, overflowY: 'auto', overflowX: 'hidden', minHeight: 0, paddingRight: 2, paddingBottom: 8 }}>
        <PlaceValueBox
          title={t('solution.splitTitle', { num: num1 })}
          theme={theme}
          value={n1}
          active={stage >= 1}
          style={box('rgba(98,214,178,0.1)', 'rgba(98,214,178,0.4)')}
        />

        <motion.div initial={{ scale: 0 }} animate={{ scale: stage >= 2 ? 1 : 0 }}
          style={{ flexShrink: 0, textAlign: 'center', fontSize: '1.3rem', fontWeight: 900, color: '#62D6B2' }}>
          +
        </motion.div>

        <PlaceValueBox
          title={t('solution.splitTitle', { num: num2 })}
          theme={theme}
          value={n2}
          active={stage >= 2}
          style={box('rgba(201,182,255,0.12)', 'rgba(201,182,255,0.45)')}
        />

        {stage >= 3 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            style={box('rgba(255,229,143,0.22)', 'rgba(255,207,87,0.45)')}>
            <div style={{ fontSize: '0.78rem', fontWeight: 900, color: '#8A6A00', marginBottom: 5 }}>
              {t('solution.onesCalculation')}
            </div>
            <div style={{ fontWeight: 900, color: '#2D2D3A' }}>
              {n1.ones} + {n2.ones} = {onesSum}
              {hasCarry ? t('solution.onesWithCarry', { carry, ones: finalOnes }) : t('solution.onesOnly', { ones: finalOnes })}
            </div>
          </motion.div>
        )}

        {hasCarry && stage >= 4 && (
          <CarryOnesCard
            theme={theme}
            onesSum={onesSum}
            carry={carry}
            finalOnes={finalOnes}
            style={box('rgba(255,255,255,0.88)', 'rgba(98,214,178,0.45)')}
          />
        )}

        {stage >= 5 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            style={box('rgba(168,216,255,0.18)', 'rgba(105,170,235,0.4)')}>
            <div style={{ fontSize: '0.78rem', fontWeight: 900, color: '#336AA0', marginBottom: 5 }}>
              {t('solution.tensCalculation')}
            </div>
            <div style={{ fontWeight: 900, color: '#2D2D3A' }}>
              {n1.tens} + {n2.tens}{hasCarry ? ` + ${carry}` : ''} = {t('solution.bundleCount', { count: tensTotal })}
            </div>
          </motion.div>
        )}

        {stage >= 6 && (
          <motion.div initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 10 }}
            style={{ ...box('rgba(98,214,178,0.16)', 'rgba(98,214,178,0.42)'), textAlign: 'center' }}>
            <div style={{ fontWeight: 900, color: '#2A9A70', marginBottom: 6 }}>
              {t('solution.placeValueSummary', { tens: ans.tens, ones: ans.ones })}
            </div>
            <div style={{ fontWeight: 900, fontSize: '1.3rem', color: '#2D2D3A' }}>
              {num1} + {num2} = <span style={{ fontSize: '1.7rem', color: '#3EC99A' }}>{answer}</span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

function CarryOnesCard({
  theme,
  onesSum,
  carry,
  finalOnes,
  style,
}: {
  theme: { name: string; emoji: string }
  onesSum: number
  carry: number
  finalOnes: number
  style: React.CSSProperties
}) {
  const { t } = useI18n()
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={style}>
      <div style={{ fontSize: '0.78rem', fontWeight: 900, color: '#2A9A70', marginBottom: 8 }}>
        {t('solution.carryCardTitle')}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
          {Array.from({ length: onesSum }, (_, i) => (
            <motion.span
              key={i}
              initial={{ scale: 0.88, opacity: 0.7 }}
              animate={{
                scale: i < 10 ? [1, 1.16, 1] : 1,
                opacity: i < 10 ? 1 : 0.78,
              }}
              transition={{ duration: 0.7, delay: i < 10 ? i * 0.035 : 0 }}
              style={{
                width: 22,
                height: 22,
                borderRadius: 7,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: i < 10 ? 'rgba(98,214,178,0.2)' : 'rgba(201,182,255,0.22)',
                border: i < 10 ? '1.5px solid rgba(98,214,178,0.58)' : '1.5px solid rgba(201,182,255,0.5)',
                fontSize: '0.82rem',
              }}
            >
              {theme.emoji}
            </motion.span>
          ))}
        </div>

        <motion.div
          animate={{ x: [0, 3, 0] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          style={{ color: '#2A9A70', fontWeight: 900, fontSize: '1.15rem' }}
        >
          →
        </motion.div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {Array.from({ length: carry }, (_, i) => (
            <motion.div
              key={`carry-${i}`}
              initial={{ y: 18, scale: 0.72, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 12, stiffness: 220, delay: i * 0.1 }}
            >
              <TenBundle theme={theme} />
            </motion.div>
          ))}
          {Array.from({ length: finalOnes }, (_, i) => (
            <OneItem key={`remain-${i}`} theme={theme} />
          ))}
        </div>
      </div>

      <div style={{ marginTop: 8, fontSize: '0.75rem', color: '#5F6F7A', fontWeight: 900 }}>
        {t('solution.carryCardDesc', { ones: finalOnes })}
      </div>
    </motion.div>
  )
}

function PlaceValueBox({
  title,
  theme,
  value,
  active,
  style,
}: {
  title: string
  theme: { name: string; emoji: string }
  value: { tens: number; ones: number }
  active: boolean
  style: React.CSSProperties
}) {
  const { t } = useI18n()
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: active ? 1 : 0.35, y: active ? 0 : 8 }}
      style={style}>
      <div style={{ fontSize: '0.78rem', fontWeight: 900, color: '#2D2D3A', marginBottom: 6 }}>
        {title}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {value.tens > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {Array.from({ length: value.tens }, (_, i) => (
              <TenBundle key={i} theme={theme} />
            ))}
          </div>
        )}
        {value.ones > 0 && (
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
            {Array.from({ length: value.ones }, (_, i) => (
              <OneItem key={i} theme={theme} />
            ))}
          </div>
        )}
      </div>
      <div style={{ fontSize: '0.75rem', color: '#7A7A9A', fontWeight: 800, marginTop: 5 }}>
        {t('solution.placeValueSummary', { tens: value.tens, ones: value.ones })}
      </div>
    </motion.div>
  )
}

function TenBundle({ theme }: { theme: { name: string; emoji: string } }) {
  const { t } = useI18n()
  return (
    <div style={{
      width: 66,
      height: 50,
      borderRadius: 12,
      border: '2px solid rgba(98,214,178,0.55)',
      background: 'rgba(98,214,178,0.14)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch',
      justifyContent: 'center',
      gap: 2,
      padding: '4px 5px',
      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.65)',
    }}>
      <div style={{
        background: '#3EC99A',
        color: '#fff',
        borderRadius: 999,
        fontSize: '0.54rem',
        fontWeight: 900,
        lineHeight: 1,
        padding: '2px 0',
        textAlign: 'center',
      }}>
        {t('solution.tenBundle')}
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gridTemplateRows: 'repeat(2, 1fr)',
        gap: 1,
        alignItems: 'center',
        justifyItems: 'center',
      }}>
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} style={{ fontSize: '0.5rem', lineHeight: 1 }}>{theme.emoji}</span>
        ))}
      </div>
    </div>
  )
}

function OneItem({ theme }: { theme: { emoji: string } }) {
  return (
    <span style={{
      width: 24,
      height: 24,
      borderRadius: 8,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(201,182,255,0.22)',
      border: '1.5px solid rgba(201,182,255,0.5)',
      fontSize: '0.95rem',
    }}>
      {theme.emoji}
    </span>
  )
}

function SubtractionSolution({
  question,
  theme,
}: {
  question: MathQuestion
  theme: { name: string; emoji: string }
}) {
  const { language, t } = useI18n()
  const { num1, num2, answer } = question
  const [stage, setStage] = useState(0)
  const [countIndex, setCountIndex] = useState(-1)
  const [muted, setMuted] = useState(false)
  const runningRef = useRef(false)
  const mutedRef = useRef(false)
  mutedRef.current = muted

  const maxDigits = Math.max(String(num1).length, String(num2).length, String(answer).length)
  const isSingleDigit = maxDigits <= 1
  const start = splitPlace(num1)
  const take = splitPlace(num2)
  const result = splitPlace(answer)
  const needsBorrow = !isSingleDigit && start.ones < take.ones
  const regroupedTens = needsBorrow ? start.tens - 1 : start.tens
  const regroupedOnes = needsBorrow ? start.ones + 10 : start.ones

  async function runSubtraction() {
    runningRef.current = false
    stopAll()
    await delay(80)
    runningRef.current = true
    const m = mutedRef.current
    const alive = () => runningRef.current

    setStage(1)
    setCountIndex(-1)
    await say(t('solution.subStart', { num: num1 }), m, language)
    if (!alive()) return

    if (isSingleDigit) {
      setStage(2)
      await say(t('solution.subTake', { num: num2 }), m, language)
      if (!alive()) return
      setStage(3)
      await countRemaining(answer, m, alive, setCountIndex, language, t)
      if (!alive()) return
      await say(t('solution.subSingleResult', { num1, num2, answer }), m, language)
      setCountIndex(-1)
      return
    }

    if (needsBorrow) {
      setStage(2)
      await say(t('solution.borrowNeed', { take: take.ones, have: start.ones }), m, language)
      if (!alive()) return
      setStage(3)
      await say(t('solution.borrowRegroup'), m, language)
      if (!alive()) return
    }

    setStage(needsBorrow ? 4 : 2)
    await say(t('solution.subtractPlace', { tens: take.tens, ones: take.ones }), m, language)
    if (!alive()) return

    setStage(needsBorrow ? 5 : 3)
    await say(t('solution.subPlaceResult', { tens: result.tens, ones: result.ones, num1, num2, answer }), m, language)
    setCountIndex(-1)
  }

  useEffect(() => {
    runSubtraction()
    return () => { runningRef.current = false; stopAll() }
  }, [question.id])

  const box = (bg: string, border: string): React.CSSProperties => ({
    background: bg,
    border: `2px solid ${border}`,
    borderRadius: 14,
    padding: '8px 10px',
    flexShrink: 0,
  })

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => { unlockTts(); setMuted(v => !v) }}
          style={{ background: muted ? 'rgba(255,118,118,0.15)' : 'rgba(98,214,178,0.15)', border: `2px solid ${muted ? 'rgba(255,118,118,0.4)' : 'rgba(98,214,178,0.4)'}`, borderRadius: 10, padding: '5px 12px', cursor: 'pointer', fontWeight: 800, fontSize: '0.78rem', color: muted ? '#FF5555' : '#2A9A70' }}>
          {muted ? t('solution.voiceOff') : t('solution.voiceOn')}
        </motion.button>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => { unlockTts(); runSubtraction() }}
          style={{ background: 'rgba(201,182,255,0.15)', border: '2px solid rgba(201,182,255,0.45)', borderRadius: 10, padding: '5px 12px', cursor: 'pointer', fontWeight: 800, fontSize: '0.78rem', color: '#7B5FCC' }}>
          {t('solution.replay')}
        </motion.button>
      </div>

      {isSingleDigit ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden', minHeight: 0 }}>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: stage >= 1 ? 1 : 0, y: stage >= 1 ? 0 : 8 }}
            style={box('rgba(98,214,178,0.1)', 'rgba(98,214,178,0.4)')}>
            <div style={{ fontSize: '0.78rem', fontWeight: 900, color: '#2A9A70', marginBottom: 8 }}>
              {t('solution.subStart', { num: num1 })}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {Array.from({ length: num1 }, (_, i) => (
                <SubtractionOneItem
                  key={i}
                  theme={theme}
                  removed={stage >= 2 && i >= answer}
                  highlight={stage >= 3 && i < answer && countIndex === i}
                />
              ))}
            </div>
          </motion.div>

          {stage >= 2 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              style={box('rgba(255,118,118,0.08)', 'rgba(255,118,118,0.32)')}>
              <div style={{ fontWeight: 900, color: '#FF5555' }}>
                {t('solution.subTookFaded', { num: num2 })}
              </div>
            </motion.div>
          )}

          {stage >= 3 && (
            <motion.div initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }}
              style={{ ...box('rgba(98,214,178,0.16)', 'rgba(98,214,178,0.42)'), textAlign: 'center', marginTop: 'auto' }}>
              <div style={{ fontWeight: 900, color: '#2A9A70', marginBottom: 4 }}>{t('solution.remainingCount', { count: answer })}</div>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                <RemainingPlaceValue theme={theme} value={result} />
              </div>
              <div style={{ fontWeight: 900, fontSize: '1.3rem', color: '#2D2D3A' }}>
                {num1} - {num2} = <span style={{ fontSize: '1.7rem', color: '#3EC99A' }}>{answer}</span>
              </div>
            </motion.div>
          )}
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5, overflowY: 'auto', overflowX: 'hidden', minHeight: 0, paddingRight: 2, paddingBottom: 8 }}>
          <SubtractionPlaceBox
            title={`${num1}에서 시작`}
            theme={theme}
            tens={stage >= 3 && needsBorrow ? regroupedTens : start.tens}
            ones={stage >= 3 && needsBorrow ? regroupedOnes : start.ones}
            removedTens={stage >= (needsBorrow ? 4 : 2) ? take.tens : 0}
            removedOnes={stage >= (needsBorrow ? 4 : 2) ? take.ones : 0}
            countIndex={-1}
            active={stage >= 1}
            borrowed={needsBorrow && stage >= 3}
            style={box('rgba(98,214,178,0.1)', 'rgba(98,214,178,0.4)')}
          />

          {needsBorrow && stage >= 2 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              style={box('rgba(255,229,143,0.22)', 'rgba(255,207,87,0.45)')}>
              <div style={{ fontWeight: 900, color: '#8A6A00' }}>
                {t('solution.borrowRegroup')}
              </div>
            </motion.div>
          )}

          {stage >= (needsBorrow ? 4 : 2) && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              style={box('rgba(255,118,118,0.08)', 'rgba(255,118,118,0.32)')}>
              <div style={{ fontWeight: 900, color: '#FF5555' }}>
                {t('solution.subtractPlaceFade', { tens: take.tens, ones: take.ones })}
              </div>
            </motion.div>
          )}

          {stage >= (needsBorrow ? 5 : 3) && (
            <motion.div initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }}
              style={{ ...box('rgba(98,214,178,0.16)', 'rgba(98,214,178,0.42)'), textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                <RemainingPlaceValue theme={theme} value={result} />
              </div>
              <div style={{ fontWeight: 900, color: '#2A9A70', marginBottom: 6 }}>
                {t('solution.placeValueSummary', { tens: result.tens, ones: result.ones })}
              </div>
              <div style={{ fontWeight: 900, fontSize: '1.3rem', color: '#2D2D3A' }}>
                {num1} - {num2} = <span style={{ fontSize: '1.7rem', color: '#3EC99A' }}>{answer}</span>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  )
}

function SubtractionOneItem({
  theme,
  removed,
  highlight,
}: {
  theme: { emoji: string }
  removed: boolean
  highlight: boolean
}) {
  return (
    <motion.span
      animate={{
        opacity: removed ? 0.22 : 1,
        scale: removed ? 0.82 : highlight ? 1.12 : 1,
        y: removed ? -4 : 0,
      }}
      transition={{ type: 'spring', damping: 14, stiffness: 260 }}
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: removed ? 'rgba(255,118,118,0.13)' : highlight ? 'rgba(98,214,178,0.2)' : 'rgba(201,182,255,0.22)',
        border: removed ? '2px dashed rgba(255,118,118,0.5)' : '2px solid rgba(201,182,255,0.45)',
        fontSize: '1.35rem',
        position: 'relative',
      }}
    >
      {theme.emoji}
      {removed && (
        <span style={{
          position: 'absolute',
          inset: 5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FF5555',
          fontSize: '1.2rem',
          fontWeight: 900,
        }}>
          x
        </span>
      )}
    </motion.span>
  )
}

function SubtractionPlaceBox({
  title,
  theme,
  tens,
  ones,
  removedTens,
  removedOnes,
  countIndex,
  active,
  borrowed,
  style,
}: {
  title: string
  theme: { name: string; emoji: string }
  tens: number
  ones: number
  removedTens: number
  removedOnes: number
  countIndex: number
  active: boolean
  borrowed: boolean
  style: React.CSSProperties
}) {
  const { t } = useI18n()
  const remainingTens = Math.max(0, tens - removedTens)
  const remainingOnes = Math.max(0, ones - removedOnes)

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: active ? 1 : 0.35, y: active ? 0 : 8 }}
      style={style}>
      <div style={{ fontSize: '0.78rem', fontWeight: 900, color: '#2D2D3A', marginBottom: 6 }}>
        {title}
        {borrowed ? <span style={{ color: '#FF9F5B' }}> · {t('solution.borrowBundle')}</span> : null}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {Array.from({ length: tens }, (_, i) => (
          <FadableTenBundle
            key={i}
            theme={theme}
            removed={i >= remainingTens}
            highlight={countIndex >= i * 10 && countIndex < i * 10 + 10}
          />
        ))}
        {Array.from({ length: ones }, (_, i) => (
          <SubtractionOneItem
            key={i}
            theme={theme}
            removed={i >= remainingOnes}
            highlight={countIndex === remainingTens * 10 + i}
          />
        ))}
      </div>
      <div style={{ fontSize: '0.75rem', color: '#7A7A9A', fontWeight: 800, marginTop: 5 }}>
        {t('solution.remainingPlace', { tens: remainingTens, ones: remainingOnes })}
      </div>
    </motion.div>
  )
}

function FadableTenBundle({
  theme,
  removed,
  highlight,
}: {
  theme: { name: string; emoji: string }
  removed: boolean
  highlight: boolean
}) {
  return (
    <motion.div animate={{ opacity: removed ? 0.22 : 1, scale: removed ? 0.88 : highlight ? 1.07 : 1 }}
      style={{
        position: 'relative',
        borderRadius: 14,
        boxShadow: highlight ? '0 0 0 4px rgba(98,214,178,0.22), 0 0 14px rgba(98,214,178,0.3)' : 'none',
      }}>
      <TenBundle theme={theme} />
      {removed && (
        <span style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FF5555',
          fontSize: '2rem',
          fontWeight: 900,
        }}>
          x
        </span>
      )}
    </motion.div>
  )
}

function RemainingPlaceValue({
  theme,
  value,
}: {
  theme: { name: string; emoji: string }
  value: { tens: number; ones: number }
}) {
  return (
    <div style={{
      display: 'flex',
      gap: 6,
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'center',
      maxWidth: '100%',
    }}>
      {Array.from({ length: value.tens }, (_, i) => (
        <TenBundle key={`t-${i}`} theme={theme} />
      ))}
      {Array.from({ length: value.ones }, (_, i) => (
        <OneItem key={`o-${i}`} theme={theme} />
      ))}
    </div>
  )
}

async function countRemaining(
  count: number,
  muted: boolean,
  alive: () => boolean,
  setCountIndex: React.Dispatch<React.SetStateAction<number>>,
  language: ReturnType<typeof useI18n>['language'],
  t: ReturnType<typeof useI18n>['t'],
) {
  await say(t('solution.countRemaining'), muted, language)
  if (!alive()) return

  for (let i = 0; i < count; i++) {
    if (!alive()) return
    setCountIndex(i)
    await say(language === 'ko' ? koNum(i + 1) : String(i + 1), muted, language)
    await delay(140)
  }
}

function splitPlace(n: number) {
  return {
    tens: Math.floor(n / 10),
    ones: n % 10,
  }
}

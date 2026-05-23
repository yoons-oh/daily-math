import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { MathQuestion } from '../lib/types'
import { say, sayWordsCached, preloadWords, stopAll } from '../lib/tts'

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

interface Props { question: MathQuestion; themeIndex: number }

export default function VisualSolution({ question, themeIndex }: Props) {
  const { num1, num2, operation, answer } = question
  const theme = EMOJI_THEMES[themeIndex % EMOJI_THEMES.length]
  const isAdd = operation === 'add'
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

    const n1r = koRead(num1), n2r = koRead(num2)
    const n1q = koQuan(num1), n2q = koQuan(num2), anq = koQuan(answer)
    const opW = isAdd ? '더하기' : '빼기'

    const words1   = Array.from({ length: num1 },  (_, i) => koNum(i + 1))
    const words2   = Array.from({ length: num2 },  (_, i) => koNum(i + 1))
    const wordsAll = Array.from({ length: answer }, (_, i) => koNum(i + 1))

    // 모든 오디오 미리 fetch — 캐시 없어도 처음부터 정상 동작
    const [urls1, urls2, urlsAll] = await Promise.all([
      preloadWords(words1),
      preloadWords(words2),
      preloadWords(wordsAll),
    ])

    const alive = () => runningRef.current
    if (!alive()) return

    // ① 인트로
    await say(`${n1r} ${opW} ${n2r}, 같이 알아봐요!`, m)
    if (!alive()) return

    // ② 그룹1 소개
    setPhase('show1')
    await say(`${theme.name} ${n1q}개가 여기 있어요! 같이 세어볼까요?`, m)
    if (!alive()) return

    // ③ 그룹1 카운팅
    setPhase('count1')
    await new Promise<void>(resolve => {
      sayWordsCached(urls1, words1, m,
        i => { if (alive()) setHl1(i) },
        () => { setHl1(-1); resolve() }
      )
    })
    if (!alive()) return
    await pause(300)

    // ④ 그룹2 소개
    setShow2(true); setPhase('show2')
    const txt2 = isAdd
      ? `친구가 ${theme.name} ${n2q}개를 줬어요!`
      : `앗! ${theme.name} ${n2q}개가 사라졌어요!`
    await say(txt2, m)
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
      )
    })
    if (!alive()) return
    await pause(300)

    // ⑥ 모두 세어봐요
    setShowAll(true); setPhase('countAll')
    const txtAll = isAdd
      ? `그럼 ${theme.name}이 모두 몇 개인지 같이 세어봐요!`
      : `자, 남은 ${theme.name}이 몇 개인지 같이 세어봐요!`
    await say(txtAll, m)
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
      )
    })
    if (!alive()) return
    await pause(300)

    // ⑧ 결과
    setPhase('result')
    const txtResult = isAdd
      ? `와! ${theme.name}이 모두 ${anq}개가 됐어요! ${n1r} 더하기 ${n2r}는 ${koRead(answer)}이에요! 정말 잘했어요!`
      : `${theme.name}이 ${anq}개 남았어요! ${n1r} 빼기 ${n2r}는 ${koRead(answer)}이에요! 최고예요!`
    await say(txtResult, m)
  }

  function pause(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  useEffect(() => {
    run()
    return () => { runningRef.current = false; stopAll() }
  }, [question.id])

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
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setMuted(v => !v)}
          style={{ background: muted ? 'rgba(255,118,118,0.15)' : 'rgba(98,214,178,0.15)', border: `2px solid ${muted ? 'rgba(255,118,118,0.4)' : 'rgba(98,214,178,0.4)'}`, borderRadius: 10, padding: '5px 12px', cursor: 'pointer', fontWeight: 800, fontSize: '0.78rem', color: muted ? '#FF5555' : '#2A9A70' }}>
          {muted ? '🔇 음성 꺼짐' : '🔊 음성 켜짐'}
        </motion.button>
        <motion.button whileTap={{ scale: 0.9 }} onClick={run}
          style={{ background: 'rgba(201,182,255,0.15)', border: '2px solid rgba(201,182,255,0.45)', borderRadius: 10, padding: '5px 12px', cursor: 'pointer', fontWeight: 800, fontSize: '0.78rem', color: '#7B5FCC' }}>
          🔄 다시 보기
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

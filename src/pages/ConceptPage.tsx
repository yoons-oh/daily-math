import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import MagicBackground from '../components/MagicBackground'
import { preloadWords, say, stopAll, unlockTts } from '../lib/tts'
import { useI18n } from '../i18n'
import { getConceptLessonSteps } from '../lib/conceptLessons'

const CONCEPTS = [
  { id:'add-basic',  title:'두 자리 덧셈',   image:'/concepts/study-add-basic.jpg', emoji:'✨', color:'linear-gradient(135deg,#62D6B2,#3EC99A)', shadow:'0 8px 0 #28A87A', textColor:'#fff', op:'+', opColor:'#fff', n1:[2,4], n2:[3,1], ans:[5,5],
    steps:[
      {desc:'먼저 일의 자리끼리 더해요!', calc:'4 + 1 = 5', hl:'ones', showAns:false, carry:['',''], voice:'먼저 일의 자리끼리 더해요. 4 더하기 1은 5예요.'},
      {desc:'다음 십의 자리끼리 더해요!', calc:'2 + 3 = 5', hl:'tens', showAns:false, carry:['',''], voice:'다음은 십의 자리끼리 더해요. 2 더하기 3은 5예요.'},
      {desc:'정답은 55예요! 🎉',          calc:'24 + 31 = 55', hl:'all', showAns:true,  carry:['',''], voice:'그래서 24 더하기 31의 정답은 55예요.'},
    ]},
  { id:'add-carry',  title:'받아올림 덧셈',   image:'/concepts/study-add-carry.jpg', emoji:'🔝', color:'linear-gradient(135deg,#FFE58F,#F6D060)', shadow:'0 8px 0 #C9A020', textColor:'#5A4200', op:'+', opColor:'#5A4200', n1:[4,8], n2:[3,7], ans:[8,5],
    steps:[
      {desc:'일의 자리: 8 + 7 = 15', calc:'8 + 7 = 15', hl:'ones', showAns:false, carry:['',''], voice:'먼저 일의 자리부터 더해요. 8 더하기 7은 15예요.'},
      {desc:'5는 아래에, 1은 십의 자리로 올려요!', calc:'받아올림: 1 ↑', hl:'carry', showAns:false, carry:['¹',''], voice:'15에서 일의 자리 5는 아래에 쓰고, 십의 자리 1은 위로 올려요.'},
      {desc:'십의 자리: 4 + 3 + 올림(1) = 8', calc:'4 + 3 + 1 = 8', hl:'tens', showAns:false, carry:['¹',''], voice:'이제 십의 자리를 더해요. 4 더하기 3에 올린 1까지 더하면 8이에요.'},
      {desc:'정답은 85예요! 🎉', calc:'48 + 37 = 85', hl:'all', showAns:true, carry:['¹',''], voice:'그래서 48 더하기 37의 정답은 85예요. 받아올림 덧셈 성공!'},
    ]},
  { id:'sub-basic',  title:'두 자리 뺄셈',   image:'/concepts/study-sub-basic.jpg', emoji:'🌙', color:'linear-gradient(135deg,#FFC7D9,#FF99BB)', shadow:'0 8px 0 #CC5580', textColor:'#7A1040', op:'−', opColor:'#7A1040', n1:[7,5], n2:[3,2], ans:[4,3],
    steps:[
      {desc:'먼저 일의 자리끼리 빼요!', calc:'5 - 2 = 3', hl:'ones', showAns:false, carry:['',''], voice:'먼저 일의 자리끼리 빼요. 5 빼기 2는 3이에요.'},
      {desc:'다음 십의 자리끼리 빼요!', calc:'7 - 3 = 4', hl:'tens', showAns:false, carry:['',''], voice:'다음은 십의 자리끼리 빼요. 7 빼기 3은 4예요.'},
      {desc:'정답은 43이에요! 🎉', calc:'75 - 32 = 43', hl:'all', showAns:true, carry:['',''], voice:'그래서 75 빼기 32의 정답은 43이에요.'},
    ]},
  { id:'sub-borrow', title:'받아내림 뺄셈',  image:'/concepts/study-sub-borrow.jpg', emoji:'🔽', color:'linear-gradient(135deg,#C9B6FF,#A891FF)', shadow:'0 8px 0 #7B5FCC', textColor:'#fff', op:'−', opColor:'#fff', n1:[6,2], n2:[2,4], ans:[3,8],
    steps:[
      {desc:'일의 자리: 2에서 4를 뺄 수 없어요!', calc:'2 < 4  ❌', hl:'ones', showAns:false, carry:['',''], voice:'일의 자리를 볼게요. 2에서는 4를 뺄 수 없어요.'},
      {desc:'십의 자리에서 10을 빌려요! 6 → 5', calc:'십의 자리 6 → 5', hl:'borrow', showAns:false, carry:['⁵',''], voice:'그래서 십의 자리에서 10을 빌려와요. 십의 자리 6은 5가 돼요.'},
      {desc:'일의 자리: 12 - 4 = 8', calc:'12 - 4 = 8', hl:'ones', showAns:false, carry:['⁵',''], voice:'빌려온 10과 원래 있던 2를 합쳐 일의 자리는 12가 되었어요. 12 빼기 4는 8이에요.'},
      {desc:'십의 자리: 5 - 2 = 3', calc:'5 - 2 = 3', hl:'tens', showAns:false, carry:['⁵',''], voice:'다음은 십의 자리예요. 5 빼기 2는 3이에요.'},
      {desc:'정답은 38이에요! 🎉', calc:'62 - 24 = 38', hl:'all', showAns:true, carry:['⁵',''], voice:'그래서 62 빼기 24의 정답은 38이에요.'},
    ]},
]

function getConceptTitleKey(id: string) {
  if (id === 'add-basic') return 'concept.addBasic'
  if (id === 'add-carry') return 'concept.addCarry'
  if (id === 'sub-basic') return 'concept.subBasic'
  if (id === 'sub-borrow') return 'concept.subBorrow'
  return 'concept.title'
}

function getConceptCardTextStyle(id: string, textColor: string): React.CSSProperties {
  const topByConcept: Record<string, string> = {
    'add-basic': '79%',
    'add-carry': '79%',
    'sub-basic': '76%',
    'sub-borrow': '76%',
  }

  return {
    position:'absolute',
    left:'9%',
    right:'9%',
    top: topByConcept[id] ?? '66%',
    transform:'translateY(-50%)',
    color:textColor,
    fontWeight:900,
    fontSize:'clamp(0.78rem, 2.3vw, 1.05rem)',
    lineHeight:1.15,
    textAlign:'center',
    textShadow:textColor === '#fff' ? '0 2px 8px rgba(0,0,0,0.25)' : 'none',
    pointerEvents:'none',
  }
}

export default function ConceptPage() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const [selected, setSelected] = useState<typeof CONCEPTS[0] | null>(null)
  const [step, setStep] = useState(0)

  function selectConcept(concept: typeof CONCEPTS[0]) {
    unlockTts()
    setSelected(concept)
    setStep(0)
  }

  if (selected) {
    return <ConceptDetail concept={selected} step={step} setStep={setStep} onBack={() => { setSelected(null); setStep(0) }} />
  }

  return (
    <div className="app-container">
      <MagicBackground />
      <div className="relative z-10 p-5 safe-top app-with-bottom-nav" style={{ paddingBottom: 112 }}>
        <div className="flex items-center gap-3 mb-6 mt-2">
          <motion.button whileTap={{ scale: 0.88 }} onClick={() => navigate('/home')}
            style={{ width: 42, height: 42, borderRadius: 14, background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)', border: '1.5px solid rgba(255,255,255,0.9)', fontWeight: 900, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 3px 10px rgba(0,0,0,0.08)' }}>←</motion.button>
          <h1 style={{ fontWeight: 900, fontSize: '1.2rem', color: '#2D2D3A' }}>🔮 {t('concept.title')}</h1>
        </div>
        <p style={{ color: '#7A7A9A', marginBottom: 16, fontWeight: 600, fontSize: '0.9rem' }}>{t('concept.prompt')}</p>
        <div className="grid grid-cols-2 gap-3">
          {CONCEPTS.map((c, i) => (
            <motion.button
              key={c.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileTap={{ scale: 0.94, y: 5 }}
              onClick={() => selectConcept(c)}
              style={{
                background: c.color, borderRadius: 22, padding: 0,
                border: '2px solid rgba(255,255,255,0.85)', cursor: 'pointer', textAlign: 'left',
                aspectRatio: '1 / 1',
                boxShadow: c.shadow + ', 0 12px 26px rgba(0,0,0,0.12)',
                position: 'relative', overflow: 'hidden',
              }}
            >
              <img
                src={c.image}
                alt={t(getConceptTitleKey(c.id))}
                style={{
                  width:'100%', height:'100%', display:'block', objectFit:'cover',
                  pointerEvents:'none',
                }}
              />
              <div style={{
                position:'absolute', inset:0,
                boxShadow:'inset 0 0 0 1px rgba(255,255,255,0.5), inset 0 -18px 24px rgba(255,255,255,0.08)',
                pointerEvents:'none',
              }} />
              <div
                style={getConceptCardTextStyle(c.id, c.textColor)}
              >
                {t(getConceptTitleKey(c.id))}
              </div>
            </motion.button>
          ))}
        </div>

        {/* 구구단 배우기 버튼 */}
        <motion.button
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.36 }}
          whileTap={{ scale: 0.96, y: 5 }}
          onClick={() => navigate('/times-table')}
          style={{
            marginTop: 12, width: '100%', borderRadius: 22, padding: 0,
            border: '2px solid rgba(255,255,255,0.85)', cursor: 'pointer',
            aspectRatio: '2.5 / 1',
            background: 'linear-gradient(135deg,#A78BFA 0%,#7C3AED 100%)',
            boxShadow: '0 8px 0 #5B21B6, 0 12px 26px rgba(167,139,250,0.38)',
            position: 'relative', overflow: 'hidden',
          }}
        >
          <img
            src="/concepts/study-times-table.png"
            alt={t('concept.timesTable')}
            style={{ width:'100%', height:'100%', display:'block', objectFit:'cover', objectPosition:'center', pointerEvents:'none' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          <div style={{
            position:'absolute', inset:0,
            boxShadow:'inset 0 0 0 1px rgba(255,255,255,0.5)',
            pointerEvents:'none',
          }} />
          <div style={{
            position:'absolute', right:'6%', bottom:'14%',
            color:'#fff', fontWeight:900,
            fontSize:'clamp(0.9rem, 2.8vw, 1.2rem)',
            textShadow:'0 2px 8px rgba(0,0,0,0.3)',
            textAlign:'center', pointerEvents:'none',
          }}>
            <div style={{ fontSize:'1.4rem', marginBottom:2 }}>⭐</div>
            {t('concept.timesTable')}
          </div>
        </motion.button>
      </div>
      <BottomNav />
    </div>
  )
}

function ConceptDetail({ concept, step, setStep, onBack }: { concept: typeof CONCEPTS[0]; step: number; setStep: React.Dispatch<React.SetStateAction<number>>; onBack: () => void }) {
  const { language, t } = useI18n()
  const lessonSteps = getConceptLessonSteps(concept.id, language)
  const s = lessonSteps[step] ?? concept.steps[step]
  const isLast = step === lessonSteps.length - 1
  const [narrationDone, setNarrationDone] = useState(false)
  const showCarryBadge = concept.id === 'add-carry' && Boolean(s.carry[0])
  const animateCarryUp = concept.id === 'add-carry' && s.hl === 'carry'
  const showCarriedOnesAnswer = concept.id === 'add-carry' && (s.hl === 'carry' || s.hl === 'tens')
  const showBorrowBadge = concept.id === 'sub-borrow' && Boolean(s.carry[0])
  const animateBorrowDown = concept.id === 'sub-borrow' && s.hl === 'borrow'
  const animateBorrowOnesResult = concept.id === 'sub-borrow' && s.hl === 'ones' && step > 0
  const showBorrowOnesAnswer = concept.id === 'sub-borrow' && (s.hl === 'ones' || s.hl === 'tens')
  const showBorrowTensAnswer = concept.id === 'sub-borrow' && s.hl === 'tens'
  const showBorrowCrossOut = concept.id === 'sub-borrow' && step >= 1

  useEffect(() => {
    preloadWords(lessonSteps.map(step => step.voice), language)
  }, [concept.id, language])

  useEffect(() => {
    let cancelled = false

    async function speakStep() {
      setNarrationDone(false)
      stopAll()
      await say(s.voice, false, language)
      if (!cancelled) setNarrationDone(true)
    }

    speakStep()
    return () => {
      cancelled = true
      stopAll()
    }
  }, [concept.id, language, step, s.voice])

  async function replayNarration() {
    await unlockTts()
    setNarrationDone(false)
    await say(s.voice, false, language)
    setNarrationDone(true)
  }

  const getHl = (col: 'tens'|'ones') => {
    if (s.hl==='all') return 'rgba(98,214,178,0.25)'
    if ((s.hl==='ones'||s.hl==='ones-result') && col==='ones') return 'rgba(255,229,143,0.4)'
    if (s.hl==='tens' && col==='tens') return 'rgba(168,216,255,0.4)'
    if ((s.hl==='carry'||s.hl==='borrow') && col==='tens') return 'rgba(255,199,217,0.4)'
    if (s.hl==='borrow' && col==='ones') return 'rgba(255,229,143,0.32)'
    return 'transparent'
  }

  return (
    <div className="app-container">
      <MagicBackground />
      <div className="relative z-10 flex flex-col" style={{ height:'100dvh' }}>
        <div style={{ padding:'16px', background:'rgba(255,255,255,0.3)', backdropFilter:'blur(8px)' }}>
          <div className="flex items-center justify-between">
            <motion.button whileTap={{ scale: 0.88 }} onClick={() => { stopAll(); onBack() }}
              style={{ width: 42, height: 42, borderRadius: 14, background:'rgba(255,255,255,0.8)', backdropFilter:'blur(8px)', border:'1.5px solid rgba(255,255,255,0.9)', fontWeight:900, fontSize:'1rem', cursor:'pointer', boxShadow:'0 3px 10px rgba(0,0,0,0.08)' }}>←</motion.button>
            <p style={{ fontWeight:900, color:'#2D2D3A' }}>{concept.emoji} {t(getConceptTitleKey(concept.id))}</p>
            <div style={{ fontSize:'0.82rem', color:'#7A7A9A', fontWeight:700 }}>{step+1}/{lessonSteps.length}</div>
          </div>
        </div>

        <div style={{ flex:1, display:'flex', flexDirection:'column', padding:16, overflow:'hidden' }}>
          {/* 말풍선 */}
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:12 }}
              className="glass-card p-4 mb-4" style={{ background:'linear-gradient(135deg,rgba(255,229,143,0.3),rgba(255,199,217,0.15))', textAlign:'center' }}>
              <p style={{ fontWeight:800, color:'#2D2D3A', fontSize:'1rem' }}>{s.desc}</p>
              <p style={{ fontWeight:900, color:'#62D6B2', fontSize:'1.15rem', marginTop:4 }}>{s.calc}</p>
            </motion.div>
          </AnimatePresence>

          {/* 세로셈 */}
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div className="glass-card p-8" style={{ position:'relative', overflow:'visible' }}>
              <AnimatePresence>
                {animateCarryUp && (
                  <>
                    <motion.div
                      key="carry-arc"
                      initial={{ opacity:0, pathLength:0 }}
                      animate={{ opacity:[0,0.85,0], pathLength:[0,1,1] }}
                      exit={{ opacity:0 }}
                      transition={{ duration:1.35, ease:'easeInOut' }}
                      style={{ position:'absolute', left:108, top:74, width:88, height:90, pointerEvents:'none', zIndex:5 }}
                    >
                      <svg viewBox="0 0 88 90" width="88" height="90" aria-hidden="true">
                        <motion.path
                          d="M74 76 C62 34 34 18 10 8"
                          fill="none"
                          stroke="#FF9F5B"
                          strokeWidth="5"
                          strokeLinecap="round"
                          strokeDasharray="7 9"
                        />
                      </svg>
                    </motion.div>
                    <motion.div
                      key="carry-fly"
                      initial={{ x:52, y:118, scale:0.72, opacity:0 }}
                      animate={{ x:0, y:0, scale:[0.72,1.24,1], opacity:[0,1,1] }}
                      exit={{ opacity:0, scale:0.7 }}
                      transition={{ duration:1.2, ease:[0.2,0.8,0.2,1] }}
                      style={{
                        position:'absolute', left:70, top:18, width:54, height:42, borderRadius:999,
                        background:'linear-gradient(135deg,#FFE58F,#FF9F5B)', color:'#5A4200',
                        display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900,
                        fontSize:'1.4rem', boxShadow:'0 8px 18px rgba(255,159,91,0.38), 0 0 0 5px rgba(255,229,143,0.35)',
                        border:'2px solid rgba(255,255,255,0.95)', zIndex:8,
                      }}
                    >
                      10
                    </motion.div>
                    <motion.div
                      key="ones-stay"
                      initial={{ scale:0.45, y:-22, opacity:0 }}
                      animate={{ scale:[1.2,1], y:0, opacity:1 }}
                      exit={{ opacity:0 }}
                      transition={{ delay:0.45, type:'spring', stiffness:360, damping:16 }}
                      style={{
                        position:'absolute', left:137, top:218, width:42, height:42, borderRadius:999,
                        background:'linear-gradient(135deg,#DDF8EF,#62D6B2)', color:'#176A52',
                        display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900,
                        fontSize:'1.6rem', boxShadow:'0 8px 18px rgba(98,214,178,0.3)',
                        border:'2px solid rgba(255,255,255,0.95)', zIndex:8,
                      }}
                    >
                      5
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {animateBorrowDown && (
                  <>
                    <motion.div
                      key="borrow-arc"
                      initial={{ opacity:0, pathLength:0 }}
                      animate={{ opacity:[0,0.85,0], pathLength:[0,1,1] }}
                      exit={{ opacity:0 }}
                      transition={{ duration:1.35, ease:'easeInOut' }}
                      style={{ position:'absolute', left:84, top:72, width:110, height:76, pointerEvents:'none', zIndex:5 }}
                    >
                      <svg viewBox="0 0 110 76" width="110" height="76" aria-hidden="true">
                        <motion.path
                          d="M18 10 C34 52 70 66 94 50"
                          fill="none"
                          stroke="#A891FF"
                          strokeWidth="5"
                          strokeLinecap="round"
                          strokeDasharray="7 9"
                        />
                      </svg>
                    </motion.div>
                    <motion.div
                      key="borrow-ten"
                      initial={{ x:-54, y:-8, scale:0.72, opacity:0 }}
                      animate={{ x:0, y:0, scale:[0.72,1.24,1], opacity:[0,1,1] }}
                      exit={{ opacity:0, scale:0.7 }}
                      transition={{ duration:1.2, ease:[0.2,0.8,0.2,1] }}
                      style={{
                        position:'absolute', left:132, top:72, width:54, height:42, borderRadius:999,
                        background:'linear-gradient(135deg,#C9B6FF,#A891FF)', color:'#fff',
                        display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900,
                        fontSize:'1.4rem', boxShadow:'0 8px 18px rgba(168,145,255,0.38), 0 0 0 5px rgba(201,182,255,0.28)',
                        border:'2px solid rgba(255,255,255,0.95)', zIndex:8,
                      }}
                    >
                      10
                    </motion.div>
                  </>
                )}
                {animateBorrowOnesResult && (
                  <motion.div
                    key="borrow-ones-result"
                    initial={{ y:-74, scale:0.7, opacity:0 }}
                    animate={{ y:0, scale:[0.7,1.2,1], opacity:[0,1,1] }}
                    exit={{ opacity:0 }}
                    transition={{ duration:0.82, ease:[0.2,0.8,0.2,1] }}
                    style={{
                      position:'absolute', left:137, top:218, width:42, height:42, borderRadius:999,
                      background:'linear-gradient(135deg,#DDF8EF,#62D6B2)', color:'#176A52',
                      display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900,
                      fontSize:'1.6rem', boxShadow:'0 8px 18px rgba(98,214,178,0.3)',
                      border:'2px solid rgba(255,255,255,0.95)', zIndex:8,
                    }}
                  >
                    {concept.ans[1]}
                  </motion.div>
                )}
              </AnimatePresence>

              <div style={{ display:'flex', justifyContent:'flex-end', minHeight:42, alignItems:'center' }}>
                <div style={{ width:52, textAlign:'center' }}>
                  <AnimatePresence mode="wait">
                    {showCarryBadge && !animateCarryUp && (
                      <motion.div
                        key={`${concept.id}-${step}-carry`}
                        initial={{ scale:0.45, y:10, opacity:0 }}
                        animate={{ scale:[1.18,1], y:0, opacity:1 }}
                        exit={{ scale:0.75, opacity:0 }}
                        transition={{ type:'spring', stiffness:360, damping:18 }}
                        style={{
                          width:40, height:32, margin:'0 auto', borderRadius:999,
                          background:'linear-gradient(135deg,#FFE58F,#FF9F5B)', color:'#5A4200',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontWeight:900, fontSize:'1.15rem', boxShadow:'0 5px 14px rgba(255,159,91,0.32)',
                          border:'2px solid rgba(255,255,255,0.95)',
                        }}
                      >
                        +1
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div style={{ width:52, textAlign:'center', fontWeight:900, color:'#FF9F5B', fontSize:'1rem' }}>{s.carry[1]}</div>
              </div>
              {/* num1 */}
              <div style={{ display:'flex', alignItems:'flex-end' }}>
                <div style={{ width:52 }} />
                {[concept.n1[0], concept.n1[1]].map((d, i) => (
                  <motion.div key={i} animate={{ background: getHl(i===0?'tens':'ones') }}
                    style={{ width:52, height:64, borderBottom:'4px solid #2D2D3A', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2.4rem', fontWeight:900, borderRadius:'6px 6px 0 0', transition:'background 0.4s', position:'relative' }}>
                    {d}
                    {showBorrowCrossOut && i === 0 && (
                      <>
                        <motion.span
                          initial={{ scale:0.5, y:8, opacity:0 }}
                          animate={{ scale:[1.18,1], y:0, opacity:1 }}
                          transition={{ delay: animateBorrowDown ? 0.38 : 0, type:'spring', stiffness:360, damping:18 }}
                          style={{
                            position:'absolute', top:-34, left:'50%', transform:'translateX(-50%)',
                            width:36, height:30, borderRadius:999,
                            background:'linear-gradient(135deg,#F2ECFF,#C9B6FF)', color:'#5E42B8',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            fontWeight:900, fontSize:'1.2rem', boxShadow:'0 5px 14px rgba(168,145,255,0.28)',
                            border:'2px solid rgba(255,255,255,0.95)', zIndex:9,
                          }}
                        >
                          5
                        </motion.span>
                        <motion.span
                          initial={{ scaleX:0, opacity:0 }}
                          animate={{ scaleX:1, opacity:1 }}
                          transition={{ delay: animateBorrowDown ? 0.3 : 0, duration:0.28 }}
                          style={{
                            position:'absolute', width:54, height:5, borderRadius:999,
                            background:'#FF7676', transform:'rotate(38deg)', zIndex:8,
                          }}
                        />
                        <motion.span
                          initial={{ scaleX:0, opacity:0 }}
                          animate={{ scaleX:1, opacity:1 }}
                          transition={{ delay: animateBorrowDown ? 0.42 : 0.08, duration:0.28 }}
                          style={{
                            position:'absolute', width:54, height:5, borderRadius:999,
                            background:'#FF7676', transform:'rotate(-38deg)', zIndex:8,
                          }}
                        />
                      </>
                    )}
                  </motion.div>
                ))}
              </div>
              {/* num2 */}
              <div style={{ display:'flex', alignItems:'flex-end', margin:'4px 0' }}>
                <div style={{ width:52, height:64, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2.2rem', fontWeight:900, color:concept.opColor==='#fff'?'#62D6B2':concept.opColor }}>{concept.op}</div>
                {[concept.n2[0], concept.n2[1]].map((d, i) => (
                  <motion.div key={i} animate={{ background: getHl(i===0?'tens':'ones') }}
                    style={{ width:52, height:64, borderBottom:'4px solid #2D2D3A', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2.4rem', fontWeight:900, borderRadius:'6px 6px 0 0', transition:'background 0.4s' }}>
                    {d}
                  </motion.div>
                ))}
              </div>
              {/* 구분선 */}
              <div style={{ height:4, background:'#2D2D3A', borderRadius:2, marginLeft:52, marginBottom:4 }} />
              {/* 답 */}
              <div style={{ display:'flex', alignItems:'flex-end' }}>
                <div style={{ width:52 }} />
                {concept.ans.map((d, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      opacity:
                        s.showAns ||
                        (showCarriedOnesAnswer && i === 1) ||
                        (showBorrowOnesAnswer && i === 1) ||
                        (showBorrowTensAnswer && i === 0)
                          ? 1
                          : 0.2,
                      scale:
                        s.showAns ||
                        (showCarriedOnesAnswer && i === 1) ||
                        (showBorrowOnesAnswer && i === 1) ||
                        (showBorrowTensAnswer && i === 0)
                          ? 1
                          : 0.9,
                      background:
                        (showCarriedOnesAnswer && i === 1) ||
                        (showBorrowOnesAnswer && i === 1) ||
                        (showBorrowTensAnswer && i === 0)
                          ? 'rgba(98,214,178,0.2)'
                          : 'rgba(98,214,178,0.08)',
                    }}
                    transition={{ type:'spring', stiffness:320, damping:22 }}
                    style={{ width:52, height:64, borderBottom:'4px solid #62D6B2', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2.4rem', fontWeight:900, color:'#62D6B2', borderRadius:'6px 6px 0 0' }}>
                    {d}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* 버튼 */}
          <div style={{ display:'flex', gap:10, marginTop:16 }}>
            {step > 0 && (
              <motion.button whileTap={{ scale:0.97, y:3 }} onClick={() => { unlockTts(); setStep(s => s-1) }}
                className="jelly-btn jelly-btn-outline" style={{ flex:1, fontSize:'0.95rem' }}>← {t('common.previous')}</motion.button>
            )}
            <motion.button
              whileTap={{ scale:0.97, y:3 }}
              onClick={replayNarration}
              className="jelly-btn jelly-btn-yellow"
              style={{ flex:'0 0 58px', minHeight:58, fontSize:'1.05rem', padding:0 }}
              aria-label={t('concept.replay')}
            >
              🔊
            </motion.button>
            <motion.button
              whileTap={narrationDone ? { scale:0.97, y:3 } : undefined}
              onClick={isLast ? () => { stopAll(); onBack() } : () => { unlockTts(); setStep(s => s+1) }}
              disabled={!narrationDone}
              className="jelly-btn"
              style={{
                flex:1,
                fontSize:'0.95rem',
                opacity: narrationDone ? 1 : 0.45,
                cursor: narrationDone ? 'pointer' : 'default',
              }}>
              {isLast ? t('concept.done') : `${t('common.next')} →`}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  )
}

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import MagicBackground from '../components/MagicBackground'

const CONCEPTS = [
  { id:'add-basic',  title:'두 자리 덧셈',   emoji:'✨', color:'linear-gradient(135deg,#62D6B2,#3EC99A)', shadow:'0 8px 0 #28A87A', textColor:'#fff', op:'+', opColor:'#fff', n1:[2,4], n2:[3,1], ans:[5,5],
    steps:[
      {desc:'먼저 일의 자리끼리 더해요!', calc:'4 + 1 = 5', hl:'ones', showAns:false, carry:['','']},
      {desc:'다음 십의 자리끼리 더해요!', calc:'2 + 3 = 5', hl:'tens', showAns:false, carry:['','']},
      {desc:'정답은 55예요! 🎉',          calc:'24 + 31 = 55', hl:'all', showAns:true,  carry:['','']},
    ]},
  { id:'add-carry',  title:'받아올림 덧셈',   emoji:'🔝', color:'linear-gradient(135deg,#FFE58F,#F6D060)', shadow:'0 8px 0 #C9A020', textColor:'#5A4200', op:'+', opColor:'#5A4200', n1:[4,8], n2:[3,7], ans:[8,5],
    steps:[
      {desc:'일의 자리: 8 + 7 = 15', calc:'8 + 7 = 15', hl:'ones', showAns:false, carry:['','']},
      {desc:'5는 아래에, 1은 십의 자리로 올려요!', calc:'받아올림: 1 ↑', hl:'carry', showAns:false, carry:['¹','']},
      {desc:'십의 자리: 4 + 3 + 올림(1) = 8', calc:'4 + 3 + 1 = 8', hl:'tens', showAns:false, carry:['¹','']},
      {desc:'정답은 85예요! 🎉', calc:'48 + 37 = 85', hl:'all', showAns:true, carry:['¹','']},
    ]},
  { id:'sub-basic',  title:'두 자리 뺄셈',   emoji:'🌙', color:'linear-gradient(135deg,#FFC7D9,#FF99BB)', shadow:'0 8px 0 #CC5580', textColor:'#7A1040', op:'−', opColor:'#7A1040', n1:[7,5], n2:[3,2], ans:[4,3],
    steps:[
      {desc:'먼저 일의 자리끼리 빼요!', calc:'5 - 2 = 3', hl:'ones', showAns:false, carry:['','']},
      {desc:'다음 십의 자리끼리 빼요!', calc:'7 - 3 = 4', hl:'tens', showAns:false, carry:['','']},
      {desc:'정답은 43이에요! 🎉', calc:'75 - 32 = 43', hl:'all', showAns:true, carry:['','']},
    ]},
  { id:'sub-borrow', title:'받아내림 뺄셈',  emoji:'🔽', color:'linear-gradient(135deg,#C9B6FF,#A891FF)', shadow:'0 8px 0 #7B5FCC', textColor:'#fff', op:'−', opColor:'#fff', n1:[6,0], n2:[2,4], ans:[3,6],
    steps:[
      {desc:'일의 자리: 0에서 4를 뺄 수 없어요!', calc:'0 < 4  ❌', hl:'ones', showAns:false, carry:['','']},
      {desc:'십의 자리에서 10을 빌려요! 6 → 5', calc:'십의 자리 6 → 5', hl:'borrow', showAns:false, carry:['⁵','']},
      {desc:'일의 자리: 10 - 4 = 6', calc:'10 - 4 = 6', hl:'ones', showAns:false, carry:['⁵','']},
      {desc:'십의 자리: 5 - 2 = 3', calc:'5 - 2 = 3', hl:'tens', showAns:false, carry:['⁵','']},
      {desc:'정답은 36이에요! 🎉', calc:'60 - 24 = 36', hl:'all', showAns:true, carry:['⁵','']},
    ]},
]

export default function ConceptPage() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<typeof CONCEPTS[0] | null>(null)
  const [step, setStep] = useState(0)

  if (selected) {
    return <ConceptDetail concept={selected} step={step} setStep={setStep} onBack={() => { setSelected(null); setStep(0) }} />
  }

  return (
    <div className="app-container">
      <MagicBackground />
      <div className="relative z-10 p-5 safe-top">
        <div className="flex items-center gap-3 mb-6 mt-2">
          <motion.button whileTap={{ scale: 0.88 }} onClick={() => navigate('/home')}
            style={{ width: 42, height: 42, borderRadius: 14, background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)', border: '1.5px solid rgba(255,255,255,0.9)', fontWeight: 900, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 3px 10px rgba(0,0,0,0.08)' }}>←</motion.button>
          <h1 style={{ fontWeight: 900, fontSize: '1.2rem', color: '#2D2D3A' }}>🔮 마법 배우기</h1>
        </div>
        <p style={{ color: '#7A7A9A', marginBottom: 16, fontWeight: 600, fontSize: '0.9rem' }}>어떤 마법을 배울까요?</p>
        <div className="grid grid-cols-2 gap-3">
          {CONCEPTS.map((c, i) => (
            <motion.button
              key={c.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileTap={{ scale: 0.94, y: 5 }}
              onClick={() => { setSelected(c); setStep(0) }}
              style={{
                background: c.color, borderRadius: 24, padding: '20px 16px',
                border: 'none', cursor: 'pointer', textAlign: 'left', minHeight: 120,
                boxShadow: c.shadow + ', 0 10px 24px rgba(0,0,0,0.12)',
                position: 'relative', overflow: 'hidden',
              }}
            >
              <div style={{ position:'absolute', top:0, left:0, right:0, height:'50%', background:'linear-gradient(180deg,rgba(255,255,255,0.25),transparent)', borderRadius:'24px 24px 0 0' }} />
              <motion.div animate={{ y:[0,-4,0] }} transition={{ duration: 2+i*0.3, repeat: Infinity }}>
                <div style={{ fontSize: '2.2rem', marginBottom: 8 }}>{c.emoji}</div>
              </motion.div>
              <div style={{ fontWeight: 900, color: c.textColor, fontSize: '0.95rem', textShadow: c.textColor === '#fff' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>{c.title}</div>
              <div style={{ fontSize: '0.78rem', color: c.textColor, opacity: 0.8, marginTop: 3 }}>{c.n1.join('')} {c.op} {c.n2.join('')}</div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}

function ConceptDetail({ concept, step, setStep, onBack }: { concept: typeof CONCEPTS[0]; step: number; setStep: React.Dispatch<React.SetStateAction<number>>; onBack: () => void }) {
  const s = concept.steps[step]
  const isLast = step === concept.steps.length - 1

  const getHl = (col: 'tens'|'ones') => {
    if (s.hl==='all') return 'rgba(98,214,178,0.25)'
    if ((s.hl==='ones'||s.hl==='ones-result') && col==='ones') return 'rgba(255,229,143,0.4)'
    if (s.hl==='tens' && col==='tens') return 'rgba(168,216,255,0.4)'
    if ((s.hl==='carry'||s.hl==='borrow') && col==='tens') return 'rgba(255,199,217,0.4)'
    return 'transparent'
  }

  return (
    <div className="app-container">
      <MagicBackground />
      <div className="relative z-10 flex flex-col" style={{ height:'100dvh' }}>
        <div style={{ padding:'16px', background:'rgba(255,255,255,0.3)', backdropFilter:'blur(8px)' }}>
          <div className="flex items-center justify-between">
            <motion.button whileTap={{ scale: 0.88 }} onClick={onBack}
              style={{ width: 42, height: 42, borderRadius: 14, background:'rgba(255,255,255,0.8)', backdropFilter:'blur(8px)', border:'1.5px solid rgba(255,255,255,0.9)', fontWeight:900, fontSize:'1rem', cursor:'pointer', boxShadow:'0 3px 10px rgba(0,0,0,0.08)' }}>←</motion.button>
            <p style={{ fontWeight:900, color:'#2D2D3A' }}>{concept.emoji} {concept.title}</p>
            <div style={{ fontSize:'0.82rem', color:'#7A7A9A', fontWeight:700 }}>{step+1}/{concept.steps.length}</div>
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
            <div className="glass-card p-8">
              <div style={{ display:'flex', justifyContent:'flex-end', minHeight:28 }}>
                <div style={{ width:52, textAlign:'center', fontWeight:900, color:'#FF9F5B', fontSize:'1rem' }}>{s.carry[0]}</div>
                <div style={{ width:52, textAlign:'center', fontWeight:900, color:'#FF9F5B', fontSize:'1rem' }}>{s.carry[1]}</div>
              </div>
              {/* num1 */}
              <div style={{ display:'flex', alignItems:'flex-end' }}>
                <div style={{ width:52 }} />
                {[concept.n1[0], concept.n1[1]].map((d, i) => (
                  <motion.div key={i} animate={{ background: getHl(i===0?'tens':'ones') }}
                    style={{ width:52, height:64, borderBottom:'4px solid #2D2D3A', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2.4rem', fontWeight:900, borderRadius:'6px 6px 0 0', transition:'background 0.4s' }}>
                    {d}
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
                  <motion.div key={i} animate={{ opacity: s.showAns ? 1 : 0.2, scale: s.showAns ? 1 : 0.9 }}
                    style={{ width:52, height:64, borderBottom:'4px solid #62D6B2', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2.4rem', fontWeight:900, color:'#62D6B2', background:'rgba(98,214,178,0.08)', borderRadius:'6px 6px 0 0' }}>
                    {d}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* 버튼 */}
          <div style={{ display:'flex', gap:10, marginTop:16 }}>
            {step > 0 && (
              <motion.button whileTap={{ scale:0.97, y:3 }} onClick={() => setStep(s => s-1)}
                className="jelly-btn jelly-btn-outline" style={{ flex:1, fontSize:'0.95rem' }}>← 이전</motion.button>
            )}
            <motion.button whileTap={{ scale:0.97, y:3 }} onClick={isLast ? onBack : () => setStep(s => s+1)}
              className="jelly-btn" style={{ flex:1, fontSize:'0.95rem' }}>
              {isLast ? '다 배웠어요! 🎉' : '다음 →'}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  )
}

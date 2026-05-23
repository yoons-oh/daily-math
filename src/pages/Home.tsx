import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  getCurrentProfile, getStreak, getRewards,
  isTodayCompleted, getSessionByDate, getTodayDate, setCurrentProfileId
} from '../lib/storage'
import { ChildProfile, StreakInfo, Reward, LEVEL_LABELS } from '../lib/types'
import MagicBackground from '../components/MagicBackground'

const GREETING = () => {
  const h = new Date().getHours()
  if (h < 12) return '좋은 아침이에요! ☀️'
  if (h < 17) return '안녕하세요! 😊'
  return '저녁도 파이팅! 🌙'
}

// 캐릭터 이미지 경로
const CHAR_IMG: Record<string, string> = {
  rabbit:  '/characters/rabbit.jpg',
  fox:     '/characters/fox.jpg',
  bear:    '/characters/bear.jpg',
  panda:   '/characters/panda.jpg',
  dragon:  '/characters/dragon.jpg',
  rion:    '/characters/rion.jpg',
  car:     '/characters/car.jpg',
  train:   '/characters/train.jpg',
  dragon2: '/characters/dragon2.jpg',
  unicon:  '/characters/unicon.jpg',
}

const MENU_ITEMS = [
  { emoji:'✨', title:'덧셈 마법',   sub:'오늘 20문제',    gradient:'linear-gradient(135deg,#62D6B2,#3EC99A)', shadow:'0 6px 0 #28A87A,0 8px 20px rgba(98,214,178,0.4)',   route:'/practice/add', deco:'＋' },
  { emoji:'🌙', title:'뺄셈 마법',   sub:'오늘 20문제',    gradient:'linear-gradient(135deg,#FFC7D9,#FF99BB)', shadow:'0 6px 0 #CC5580,0 8px 20px rgba(255,153,187,0.4)',  route:'/practice/sub', deco:'－' },
  { emoji:'🔮', title:'마법 배우기', sub:'개념 애니메이션', gradient:'linear-gradient(135deg,#C9B6FF,#A891FF)', shadow:'0 6px 0 #7B5FCC,0 8px 20px rgba(201,182,255,0.4)',  route:'/concept',      deco:'💡' },
  { emoji:'🏆', title:'보상 창고',   sub:'',               gradient:'linear-gradient(135deg,#FFE58F,#F6D060)', shadow:'0 6px 0 #C9A020,0 8px 20px rgba(255,229,143,0.45)', route:'/rewards',      deco:'⭐', textColor:'#5A4200' },
]

export default function Home() {
  const navigate = useNavigate()
  const [profile, setProfile]     = useState<ChildProfile | null>(null)
  const [streak, setStreak]       = useState<StreakInfo | null>(null)
  const [rewards, setRewards]     = useState<Reward[]>([])
  const [todayDone, setTodayDone] = useState(false)
  const [todayStats, setTodayStats] = useState({ correct: 0, total: 0 })

  useEffect(() => {
    const p = getCurrentProfile()
    if (!p) { navigate('/profiles'); return }
    setProfile(p)
    setStreak(getStreak(p.id))
    setRewards(getRewards(p.id))
    const done = isTodayCompleted(p.id)
    setTodayDone(done)
    if (done) {
      const sessions = getSessionByDate(p.id, getTodayDate())
      let correct = 0, total = 0
      sessions.forEach(s => s.questions.forEach(q => { total++; if (q.isCorrect) correct++ }))
      setTodayStats({ correct, total })
    }
  }, [])

  if (!profile) return null

  const starCount    = rewards.filter(r => r.type === 'star').length
  const stickerCount = rewards.filter(r => r.type === 'sticker').length
  const badgeCount   = rewards.filter(r => r.type === 'badge').length
  const charImg      = CHAR_IMG[profile.avatar] ?? null

  const menuItems = MENU_ITEMS.map(m =>
    m.route === '/rewards' ? { ...m, sub: `별 ${starCount}개` } : m
  )

  return (
    <div className="app-container" style={{ height: '100dvh', overflow: 'hidden' }}>
      <MagicBackground />

      <div className="relative z-10 flex flex-col" style={{ height: '100%', overflow: 'hidden' }}>

        {/* ── 헤더 ── */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          style={{ padding: '14px 18px 10px', flexShrink: 0 }}>
          <div className="flex items-center justify-between">
            <div style={{ flex: 1 }}>
              <p style={{ color: '#7A7A9A', fontSize: '0.78rem', fontWeight: 600 }}>{GREETING()}</p>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#2D2D3A', lineHeight: 1.2 }}>
                {profile.name}의 마법학교 ✨
              </h1>
            </div>
            {/* 캐릭터 이미지 버튼 */}
            <motion.button whileTap={{ scale: 0.9 }}
              onClick={() => { setCurrentProfileId(''); navigate('/profiles') }}
              style={{
                width: 58, height: 58, borderRadius: 20,
                background: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(12px)',
                border: '2px solid rgba(255,255,255,0.9)',
                boxShadow: '0 4px 16px rgba(98,214,178,0.25)',
                cursor: 'pointer', overflow: 'hidden',
                padding: 0, flexShrink: 0,
              }}>
              {charImg ? (
                <img src={charImg} alt={profile.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => { (e.target as HTMLImageElement).style.display='none' }}
                />
              ) : (
                <span style={{ fontSize: '1.6rem' }}>🧙</span>
              )}
            </motion.button>
          </div>

          {/* 배지 */}
          <div className="flex gap-2 mt-2 flex-wrap">
            <div className="level-badge">🎯 {LEVEL_LABELS[profile.currentLevel]}</div>
            {streak && streak.currentStreak > 0 && (
              <div className="streak-badge">🔥 {streak.currentStreak}일 연속</div>
            )}
          </div>
        </motion.div>

        {/* 스크롤 영역 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 14px 12px' }}>

          {/* ── 오늘의 퀘스트 ── */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }} style={{ marginBottom: 10 }}>
            <div className="glass-card" style={{
              padding: '12px 16px',
              background: todayDone
                ? 'linear-gradient(135deg,rgba(98,214,178,0.25),rgba(168,240,220,0.2))'
                : 'linear-gradient(135deg,rgba(255,229,143,0.3),rgba(255,199,217,0.2))',
            }}>
              <div className="flex items-center gap-3">
                <motion.div animate={{ y:[0,-5,0] }} transition={{ duration:2.5, repeat:Infinity }}
                  style={{ fontSize: '2.2rem' }}>
                  {todayDone ? '🎉' : '📜'}
                </motion.div>
                <div className="flex-1">
                  <p style={{ fontWeight: 900, fontSize: '0.95rem', color: '#2D2D3A' }}>
                    {todayDone ? '오늘의 퀘스트 완료!' : '오늘의 퀘스트'}
                  </p>
                  <p style={{ color: '#7A7A9A', fontSize: '0.78rem', marginTop: 1 }}>
                    {todayDone ? `${todayStats.correct}/${todayStats.total}문제 정복! 👏` : '마법 문제 20개를 풀어요!'}
                  </p>
                </div>
                {todayDone && (
                  <div style={{ background:'linear-gradient(135deg,#62D6B2,#3EC99A)', borderRadius:10, padding:'3px 8px', color:'#fff', fontWeight:800, fontSize:'0.75rem', boxShadow:'0 2px 6px rgba(98,214,178,0.4)' }}>완료 ✓</div>
                )}
              </div>
            </div>
          </motion.div>

          {/* ── 메뉴 그리드 ── */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
            {menuItems.map((item, i) => (
              <motion.button key={item.route}
                initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}
                transition={{ delay: 0.12 + i*0.06 }}
                whileTap={{ scale:0.94, y:5 }}
                onClick={() => navigate(item.route)}
                style={{
                  background: item.gradient, borderRadius:22,
                  padding:'14px 14px', border:'none', cursor:'pointer',
                  textAlign:'left', minHeight:96,
                  boxShadow: item.shadow,
                  position:'relative', overflow:'hidden',
                }}>
                <div style={{ position:'absolute',top:0,left:0,right:0,height:'50%',background:'linear-gradient(180deg,rgba(255,255,255,0.28),transparent)',borderRadius:'22px 22px 0 0' }} />
                <div style={{ position:'absolute',right:8,bottom:6,fontSize:'2rem',fontWeight:900,opacity:0.13,color:'#fff',lineHeight:1 }}>{item.deco}</div>
                <motion.div animate={{ y:[0,-3,0] }} transition={{ duration:2+i*0.3, repeat:Infinity }}
                  style={{ fontSize:'1.8rem', marginBottom:5, position:'relative', zIndex:1 }}>
                  {item.emoji}
                </motion.div>
                <div style={{ fontWeight:900, fontSize:'0.88rem', color:item.textColor??'#fff', textShadow:item.textColor?'none':'0 1px 3px rgba(0,0,0,0.12)', position:'relative', zIndex:1 }}>
                  {item.title}
                </div>
                <div style={{ fontSize:'0.72rem', marginTop:2, color:item.textColor?'rgba(90,66,0,0.7)':'rgba(255,255,255,0.85)', position:'relative', zIndex:1 }}>
                  {item.sub}
                </div>
              </motion.button>
            ))}
          </div>

          {/* ── 보상 현황 ── */}
          <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
            transition={{ delay:0.35 }} style={{ marginBottom:10 }}>
            <div className="glass-card" style={{ padding:'12px 16px' }}>
              <h3 style={{ fontWeight:900, color:'#2D2D3A', marginBottom:10, fontSize:'0.9rem' }}>🎁 내 보물 창고</h3>
              <div className="flex justify-around">
                {[
                  { emoji:'⭐', label:'별',    count:starCount,    color:'#FFE58F' },
                  { emoji:'🌟', label:'스티커', count:stickerCount, color:'#C9B6FF' },
                  { emoji:'🏅', label:'배지',   count:badgeCount,   color:'#A8D8FF' },
                ].map(item => (
                  <div key={item.label} className="flex flex-col items-center gap-1">
                    <div style={{ width:44,height:44,borderRadius:14,background:item.color+'55',border:`2px solid ${item.color}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.4rem',boxShadow:`0 3px 10px ${item.color}55` }}>{item.emoji}</div>
                    <span style={{ fontSize:'0.68rem',color:'#7A7A9A',fontWeight:700 }}>{item.label}</span>
                    <span style={{ fontWeight:900,fontSize:'1.1rem',color:'#2D2D3A' }}>{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* ── 연속 학습 ── */}
          {streak && (
            <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
              transition={{ delay:0.42 }}>
              <div className="glass-card" style={{ padding:'12px 16px' }}>
                <div className="flex items-center justify-between" style={{ marginBottom:10 }}>
                  <h3 style={{ fontWeight:900, color:'#2D2D3A', fontSize:'0.9rem' }}>🔥 연속 학습</h3>
                  <span style={{ fontSize:'0.75rem',color:'#7A7A9A',fontWeight:700 }}>{streak.currentStreak}일째!</span>
                </div>
                <StreakDots streak={streak.currentStreak} />
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

function StreakDots({ streak }: { streak: number }) {
  const days = ['일','월','화','수','목','금','토']
  const today = new Date().getDay()
  const filled = Math.min(streak, 7)
  return (
    <div className="flex gap-1 justify-between">
      {days.map((d, i) => {
        const daysAgo = (today - i + 7) % 7
        const isActive = daysAgo < filled
        const isToday = i === today
        return (
          <div key={d} className="flex flex-col items-center gap-1">
            <motion.div animate={isActive ? { scale:[1,1.08,1] } : {}} transition={{ duration:2, delay:i*0.1, repeat:Infinity }}
              style={{
                width:34,height:34,borderRadius:11,
                background: isActive ? 'linear-gradient(135deg,#62D6B2,#3EC99A)' : 'rgba(255,255,255,0.6)',
                display:'flex',alignItems:'center',justifyContent:'center',
                fontSize: isActive ? '0.9rem' : '0.7rem',
                fontWeight:800,
                color: isActive ? '#fff' : '#7A7A9A',
                boxShadow: isActive ? '0 3px 0 #28A87A,0 5px 10px rgba(98,214,178,0.3)' : '0 2px 0 #C8E8DE',
                outline: isToday ? '2.5px solid #62D6B2' : 'none',
                outlineOffset: 2,
              }}>
              {isActive ? '🔥' : d}
            </motion.div>
            <span style={{ fontSize:'0.65rem',color:'#7A7A9A',fontWeight:700 }}>{d}</span>
          </div>
        )
      })}
    </div>
  )
}

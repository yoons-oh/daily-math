import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChildProfile, Level, LEVEL_LABELS } from '../lib/types'
import { generateId, saveProfile } from '../lib/storage'
import MagicBackground from './MagicBackground'

// ─── 캐릭터 정의 ─────────────────────────────────────────────
const CHARACTERS = [
  { id: 'rabbit',  name: '별로이',     file: '/characters/rabbit.jpg',  bg: '#FFC7D9', shadow: 'rgba(255,199,217,0.8)' },
  { id: 'fox',     name: '마법여우',   file: '/characters/fox.jpg',     bg: '#FFE58F', shadow: 'rgba(255,229,143,0.8)' },
  { id: 'bear',    name: '탐험곰',     file: '/characters/bear.jpg',    bg: '#FFD9B4', shadow: 'rgba(255,209,180,0.8)' },
  { id: 'panda',   name: '구름팬다',   file: '/characters/panda.jpg',   bg: '#A8D8FF', shadow: 'rgba(168,216,255,0.8)' },
  { id: 'dragon',  name: '숫자드래곤', file: '/characters/dragon.jpg',  bg: '#A8F0DC', shadow: 'rgba(98,214,178,0.8)'  },
  { id: 'rion',    name: '왕관사자',   file: '/characters/rion.jpg',    bg: '#FFE58F', shadow: 'rgba(255,229,143,0.8)' },
  { id: 'car',     name: '별자동차',   file: '/characters/car.jpg',     bg: '#A8D8FF', shadow: 'rgba(168,216,255,0.8)' },
  { id: 'train',   name: '무지개기차', file: '/characters/train.jpg',   bg: '#FFC7D9', shadow: 'rgba(255,199,217,0.8)' },
  { id: 'dragon2', name: '작은드래곤', file: '/characters/dragon2.jpg', bg: '#A8F0DC', shadow: 'rgba(98,214,178,0.8)'  },
  { id: 'unicon',  name: '구름유니콘', file: '/characters/unicon.jpg',  bg: '#C9B6FF', shadow: 'rgba(201,182,255,0.8)' },
]

const LEVEL_COLORS: Record<Level, string> = {
  L1:  'linear-gradient(135deg,#A8F0DC,#62D6B2)',
  L2A: 'linear-gradient(135deg,#A8D8FF,#5AABDC)',
  L2B: 'linear-gradient(135deg,#C9B6FF,#A891FF)',
  L3A: 'linear-gradient(135deg,#FFE58F,#F6D060)',
  L3B: 'linear-gradient(135deg,#FFC7D9,#FF99BB)',
}

interface Props {
  profiles: ChildProfile[]
  onSelect: (profile: ChildProfile) => void
  onProfilesChange: () => void
}

function getChar(id: string) {
  return CHARACTERS.find(c => c.id === id) ?? CHARACTERS[0]
}

// ─── 캐릭터 이미지 표시 ──────────────────────────────────────
function CharAvatar({ charId, size = 60, selected = false }: {
  charId: string; size?: number; selected?: boolean
}) {
  const char = getChar(charId)
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.3,
      background: char.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', flexShrink: 0,
      border: selected ? '3px solid #62D6B2' : '3px solid transparent',
      boxShadow: selected
        ? `0 0 0 2px #fff, 0 0 16px ${char.shadow}`
        : `0 4px 12px ${char.shadow}55`,
      transform: selected ? 'scale(1.08)' : 'scale(1)',
      transition: 'all 0.15s ease',
    }}>
      <img src={char.file} alt={char.name}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
      />
    </div>
  )
}

export default function ProfileSelector({ profiles, onSelect, onProfilesChange }: Props) {
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName]       = useState('')
  const [age, setAge]         = useState(7)
  const [charId, setCharId]   = useState('rabbit')
  const [level, setLevel]     = useState<Level>('L1')

  function handleAdd() {
    if (!name.trim()) return
    saveProfile({
      id: generateId(),
      name: name.trim(),
      age,
      avatar: charId,   // charId를 avatar 필드에 저장
      currentLevel: level,
      createdAt: new Date().toISOString(),
    })
    onProfilesChange()
    setShowAdd(false)
    setName(''); setAge(7); setCharId('rabbit'); setLevel('L1')
  }

  const selectedChar = getChar(charId)

  return (
    <div className="app-container">
      <MagicBackground />

      <div className="relative z-10 flex-1 flex flex-col safe-top">
        {/* 타이틀 */}
        <motion.div
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center pt-12 pb-6 px-6"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            style={{ fontSize: '4rem', marginBottom: 10 }}
          >🏰</motion.div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#2D2D3A' }}>마법 수학학교</h1>
          <p style={{ color: '#7A7A9A', marginTop: 6, fontWeight: 600 }}>누가 모험을 시작할까요?</p>
        </motion.div>

        {/* 프로필 목록 */}
        <div className="px-5 flex flex-col gap-3 flex-1">
          {profiles.map((p, i) => (
            <motion.button
              key={p.id}
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onSelect(p)}
              className="glass-card text-left w-full"
              style={{ padding: '16px 20px' }}
            >
              <div className="flex items-center gap-4">
                <motion.div whileHover={{ scale: 1.08 }}>
                  <CharAvatar charId={p.avatar} size={60} />
                </motion.div>
                <div className="flex-1">
                  <div style={{ fontWeight: 900, fontSize: '1.15rem', color: '#2D2D3A' }}>{p.name}</div>
                  <div style={{ color: '#7A7A9A', fontSize: '0.8rem', marginTop: 3, fontWeight: 600 }}>
                    {p.age}세 · {LEVEL_LABELS[p.currentLevel]}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#7A7A9A', marginTop: 2 }}>
                    {getChar(p.avatar).name}
                  </div>
                </div>
                <div style={{
                  width: 44, height: 44, borderRadius: 14,
                  background: 'linear-gradient(135deg,#62D6B2,#3EC99A)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: '1.4rem', fontWeight: 900,
                  boxShadow: '0 4px 0 #28A87A',
                }}>›</div>
              </div>
            </motion.button>
          ))}

          {/* 추가 버튼 */}
          {profiles.length < 5 && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              onClick={() => setShowAdd(true)}
              style={{
                background: 'rgba(255,255,255,0.6)',
                backdropFilter: 'blur(12px)',
                border: '2.5px dashed #62D6B2',
                borderRadius: 24, padding: '18px',
                color: '#62D6B2', fontWeight: 800, fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <span style={{ fontSize: '1.4rem' }}>✨</span>
              새 캐릭터 만들기
            </motion.button>
          )}
        </div>
        <div className="pb-8" />
      </div>

      {/* 캐릭터 생성 모달 */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(45,45,58,0.55)',
              backdropFilter: 'blur(6px)',
              display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
              zIndex: 50,
            }}
            onClick={e => { if (e.target === e.currentTarget) setShowAdd(false) }}
          >
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              style={{
                background: 'linear-gradient(160deg,#F4FFF9 0%,#EBF8FF 60%,#F5F0FF 100%)',
                width: '100%', maxWidth: 448,
                borderRadius: '32px 32px 0 0',
                padding: '24px 24px 36px',
                maxHeight: '92vh', overflowY: 'auto',
              }}
            >
              <div style={{ width: 48, height: 5, background: 'rgba(0,0,0,0.12)', borderRadius: 999, margin: '0 auto 20px' }} />

              {/* 선택된 캐릭터 프리뷰 */}
              <div className="text-center mb-5">
                <motion.div
                  key={charId}
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  style={{ margin: '0 auto 10px' }}
                >
                  <CharAvatar charId={charId} size={100} selected />
                </motion.div>
                <div style={{ fontWeight: 900, fontSize: '1.1rem', color: '#2D2D3A' }}>
                  {selectedChar.name}
                </div>
                <h2 style={{ fontWeight: 700, fontSize: '0.9rem', color: '#7A7A9A', marginTop: 4 }}>
                  ✨ 캐릭터 만들기
                </h2>
              </div>

              {/* 캐릭터 선택 그리드 */}
              <div className="mb-5">
                <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#7A7A9A', marginBottom: 10, display: 'block' }}>
                  캐릭터 선택
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8 }}>
                  {CHARACTERS.map((c) => (
                    <motion.button
                      key={c.id}
                      whileTap={{ scale: 0.88 }}
                      onClick={() => setCharId(c.id)}
                      style={{
                        background: 'none', border: 'none',
                        cursor: 'pointer', padding: 0,
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', gap: 4,
                      }}
                    >
                      <CharAvatar charId={c.id} size={52} selected={charId === c.id} />
                      <span style={{
                        fontSize: '0.62rem', fontWeight: 700,
                        color: charId === c.id ? '#62D6B2' : '#7A7A9A',
                        textAlign: 'center', lineHeight: 1.2,
                      }}>{c.name}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* 이름 */}
              <div className="mb-4">
                <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#7A7A9A', marginBottom: 8, display: 'block' }}>이름</label>
                <input
                  type="text" value={name}
                  onChange={e => setName(e.target.value)}
                  maxLength={10} placeholder="마법사 이름을 입력하세요"
                  style={{
                    width: '100%', background: 'rgba(255,255,255,0.85)',
                    backdropFilter: 'blur(8px)',
                    border: '2px solid rgba(98,214,178,0.3)',
                    borderRadius: 16, padding: '14px 18px',
                    fontSize: '1rem', fontWeight: 700, color: '#2D2D3A', outline: 'none',
                    fontFamily: 'Nunito, Noto Sans KR, sans-serif',
                  }}
                  onFocus={e => e.target.style.borderColor = '#62D6B2'}
                  onBlur={e => e.target.style.borderColor = 'rgba(98,214,178,0.3)'}
                />
              </div>

              {/* 나이 */}
              <div className="mb-4">
                <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#7A7A9A', marginBottom: 8, display: 'block' }}>나이</label>
                <div className="flex gap-2">
                  {[6, 7, 8, 9].map(a => (
                    <motion.button key={a} whileTap={{ scale: 0.92, y: 3 }} onClick={() => setAge(a)}
                      style={{
                        flex: 1, height: 52, borderRadius: 16,
                        fontWeight: 900, fontSize: '1.05rem',
                        border: 'none', cursor: 'pointer',
                        background: age === a ? 'linear-gradient(135deg,#62D6B2,#3EC99A)' : 'rgba(255,255,255,0.7)',
                        color: age === a ? '#fff' : '#7A7A9A',
                        boxShadow: age === a ? '0 5px 0 #28A87A,0 6px 14px rgba(98,214,178,0.35)' : '0 3px 0 #C8E8DE',
                        transition: 'all 0.15s ease',
                      }}>{a}세</motion.button>
                  ))}
                </div>
              </div>

              {/* 시작 레벨 */}
              <div className="mb-6">
                <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#7A7A9A', marginBottom: 8, display: 'block' }}>시작 마법 등급</label>
                <div className="flex flex-col gap-2">
                  {(['L1', 'L2A', 'L2B'] as Level[]).map(l => (
                    <motion.button key={l} whileTap={{ scale: 0.97 }} onClick={() => setLevel(l)}
                      style={{
                        padding: '14px 18px', borderRadius: 16, border: 'none',
                        cursor: 'pointer', textAlign: 'left', fontWeight: 700, fontSize: '0.95rem',
                        background: level === l ? LEVEL_COLORS[l] : 'rgba(255,255,255,0.65)',
                        color: level === l ? '#fff' : '#7A7A9A',
                        boxShadow: level === l ? '0 4px 12px rgba(98,214,178,0.3)' : '0 2px 8px rgba(0,0,0,0.04)',
                        display: 'flex', alignItems: 'center', gap: 10,
                        transition: 'all 0.15s ease',
                      }}>
                      <span>{l === 'L1' ? '🌱' : l === 'L2A' ? '🌿' : '🌳'}</span>
                      {LEVEL_LABELS[l]}
                    </motion.button>
                  ))}
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.97, y: 4 }} onClick={handleAdd}
                disabled={!name.trim()}
                className="jelly-btn"
                style={{ width: '100%', opacity: name.trim() ? 1 : 0.45, fontSize: '1.05rem' }}
              >
                🏰 모험 시작하기!
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

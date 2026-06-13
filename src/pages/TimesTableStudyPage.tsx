import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import MagicBackground from '../components/MagicBackground'

export default function TimesTableStudyPage() {
  const navigate = useNavigate()
  const { dan: danParam } = useParams<{ dan: string }>()
  const dan = Number(danParam) || 2
  const [revealed, setRevealed] = useState<Set<number>>(new Set())

  const facts = Array.from({ length: 9 }, (_, i) => ({
    factor: i + 1,
    product: dan * (i + 1),
  }))

  const toggleReveal = (factor: number) => {
    setRevealed(prev => {
      const next = new Set(prev)
      if (next.has(factor)) next.delete(factor)
      else next.add(factor)
      return next
    })
  }

  const allRevealed = revealed.size === 9

  return (
    <div className="app-container" style={{ background: 'linear-gradient(160deg,#F7FFF9 0%,#EEF8FF 45%,#F8F2FF 100%)' }}>
      <MagicBackground />
      <div className="relative z-10 flex flex-col" style={{ height: '100dvh' }}>
        <div style={{ padding: '16px 16px 12px', flexShrink: 0 }}>
          <div className="flex items-center gap-3">
            <motion.button whileTap={{ scale: 0.88 }} onClick={() => navigate(-1)}
              style={{ width: 42, height: 42, borderRadius: 14, background: 'rgba(255,255,255,0.8)', border: '1.5px solid rgba(255,255,255,0.9)', fontWeight: 900, fontSize: '1rem', cursor: 'pointer', flexShrink: 0 }}>
              ←
            </motion.button>
            <div style={{ fontWeight: 900, fontSize: '1.2rem', color: '#2D2D3A' }}>⭐ {dan}단 구구단</div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 32px' }}>
          <p style={{ color: '#7A7A9A', fontWeight: 800, fontSize: '0.85rem', textAlign: 'center', marginBottom: 16 }}>
            카드를 눌러서 답을 확인하세요!
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {facts.map(({ factor, product }, i) => {
              const isRevealed = revealed.has(factor)
              return (
                <motion.button
                  key={factor}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => toggleReveal(factor)}
                  style={{
                    borderRadius: 18, cursor: 'pointer', padding: '14px 20px',
                    background: isRevealed
                      ? 'linear-gradient(135deg,rgba(167,139,250,0.18),rgba(124,58,237,0.1))'
                      : 'rgba(255,255,255,0.78)',
                    boxShadow: isRevealed
                      ? '0 4px 0 rgba(124,58,237,0.25), 0 8px 20px rgba(167,139,250,0.22)'
                      : '0 4px 0 rgba(180,180,210,0.5), 0 8px 18px rgba(76,106,170,0.1)',
                    border: isRevealed ? '1.5px solid rgba(167,139,250,0.4)' : '1.5px solid rgba(255,255,255,0.9)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontWeight: 900, fontSize: '1.3rem', color: '#2D2D3A' }}>
                    {dan} × {factor}
                  </span>
                  <AnimatePresence mode="wait">
                    {isRevealed ? (
                      <motion.span
                        key="answer"
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.7 }}
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
                        = ?
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              )
            })}
          </div>

          {allRevealed && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginTop: 20, padding: '16px', borderRadius: 20, textAlign: 'center',
                background: 'linear-gradient(135deg,rgba(167,139,250,0.15),rgba(124,58,237,0.08))',
                border: '1.5px solid rgba(167,139,250,0.4)',
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: 6 }}>🎉</div>
              <div style={{ fontWeight: 900, fontSize: '1rem', color: '#2D2D3A' }}>
                {dan}단 완전 정복!
              </div>
            </motion.div>
          )}

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            whileTap={{ scale: 0.97, y: 3 }}
            onClick={() => navigate('/practice/mul')}
            style={{
              width: '100%', height: 54, borderRadius: 18, border: 'none', marginTop: 20,
              background: 'linear-gradient(135deg,#A78BFA,#7C3AED)',
              color: '#fff', fontWeight: 900, fontSize: '1rem', cursor: 'pointer',
              boxShadow: '0 6px 0 #5B21B6, 0 10px 24px rgba(167,139,250,0.38)',
            }}
          >
            ⭐ {dan}단 문제 풀기 →
          </motion.button>
        </div>
      </div>
    </div>
  )
}

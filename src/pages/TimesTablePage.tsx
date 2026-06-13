import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import MagicBackground from '../components/MagicBackground'
import { getTimesTableStudyMastery, getTimesTableTestMastery } from '../lib/timesTableMastery'
import { useI18n } from '../i18n'

const DANS = [2, 3, 4, 5, 6, 7, 8, 9]

const DAN_COLORS = [
  { gradient: 'linear-gradient(135deg,#2FE5C1,#1EC69B)', shadow: '#15A982', glow: 'rgba(47,229,193,0.4)' },
  { gradient: 'linear-gradient(135deg,#FFC2DA,#FF8FB9)', shadow: '#D55E8D', glow: 'rgba(255,143,185,0.38)' },
  { gradient: 'linear-gradient(135deg,#A78BFA,#7C3AED)', shadow: '#5B21B6', glow: 'rgba(167,139,250,0.4)' },
  { gradient: 'linear-gradient(135deg,#FBA44B,#F97316)', shadow: '#C2510C', glow: 'rgba(251,164,75,0.4)' },
  { gradient: 'linear-gradient(135deg,#60A5FA,#3B82F6)', shadow: '#1D4ED8', glow: 'rgba(96,165,250,0.4)' },
  { gradient: 'linear-gradient(135deg,#34D399,#10B981)', shadow: '#047857', glow: 'rgba(52,211,153,0.4)' },
  { gradient: 'linear-gradient(135deg,#FBBF24,#F59E0B)', shadow: '#B45309', glow: 'rgba(251,191,36,0.4)' },
  { gradient: 'linear-gradient(135deg,#F87171,#EF4444)', shadow: '#B91C1C', glow: 'rgba(248,113,113,0.4)' },
]

export default function TimesTablePage() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const [studied, setStudied] = useState<Set<number>>(new Set())
  const [tested, setTested]   = useState<Set<number>>(new Set())

  useEffect(() => {
    setStudied(getTimesTableStudyMastery())
    setTested(getTimesTableTestMastery())
  }, [])

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
            <div style={{ fontWeight: 900, fontSize: '1.15rem', color: '#2D2D3A' }}>⭐ {t('timesTablePage.title')}</div>
          </div>
          {/* 범례 */}
          <div style={{ display: 'flex', gap: 14, marginTop: 8, justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', fontWeight: 800, color: '#7A7A9A' }}>
              <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#16A34A', fontWeight: 900 }}>✓</span>
              학습완료
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', fontWeight: 800, color: '#7A7A9A' }}>
              <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#D97706' }}>★</span>
              테스트 합격
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 16px 32px' }}>
          <p style={{ color: '#7A7A9A', fontWeight: 800, fontSize: '0.88rem', marginBottom: 16, textAlign: 'center' }}>
            {t('timesTablePage.selectDan')}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {DANS.map((dan, i) => {
              const c = DAN_COLORS[i % DAN_COLORS.length]
              const isStudied = studied.has(dan)
              const isTested  = tested.has(dan)
              return (
                <motion.button
                  key={dan}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  whileTap={{ scale: 0.95, y: 4 }}
                  onClick={() => navigate(`/times-table/${dan}`)}
                  style={{
                    height: 90, borderRadius: 22, border: 'none', cursor: 'pointer',
                    background: c.gradient,
                    boxShadow: `0 6px 0 ${c.shadow}, 0 14px 28px ${c.glow}`,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
                    position: 'relative',
                  }}
                >
                  {/* 테스트 합격 ★ 뱃지 (우선순위 높음) */}
                  {isTested && (
                    <div style={{
                      position: 'absolute', top: 7, right: 8,
                      width: 24, height: 24, borderRadius: '50%',
                      background: 'linear-gradient(135deg,#FBBF24,#F59E0B)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.75rem', fontWeight: 900, color: '#5A3800',
                      boxShadow: '0 2px 6px rgba(180,83,9,0.35)',
                    }}>★</div>
                  )}
                  {/* 학습완료 ✓ 뱃지 (테스트 없을 때만) */}
                  {isStudied && !isTested && (
                    <div style={{
                      position: 'absolute', top: 7, right: 8,
                      width: 24, height: 24, borderRadius: '50%',
                      background: 'rgba(255,255,255,0.95)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.8rem', fontWeight: 900, color: '#16A34A',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                    }}>✓</div>
                  )}
                  <span style={{ fontSize: '2rem', fontWeight: 900, color: '#fff' }}>{dan}×</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.85)' }}>
                    {dan}×1 ~ {dan}×9
                  </span>
                </motion.button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

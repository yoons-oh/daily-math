import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { getCurrentProfile, getRewards, getStreak } from '../lib/storage'
import { Reward, StreakInfo } from '../lib/types'
import BottomNav from '../components/BottomNav'
import MagicBackground from '../components/MagicBackground'
import { useI18n } from '../i18n'

export default function RewardsPage() {
  const navigate = useNavigate()
  const { language, t } = useI18n()
  const [rewards, setRewards] = useState<Reward[]>([])
  const [streak, setStreak] = useState<StreakInfo | null>(null)

  useEffect(() => {
    const p = getCurrentProfile()
    if (!p) {
      navigate('/profiles')
      return
    }
    setRewards(getRewards(p.id))
    setStreak(getStreak(p.id))
  }, [navigate])

  const stars = rewards.filter(r => r.type === 'star')
  const stickers = rewards.filter(r => r.type === 'sticker')
  const badges = rewards.filter(r => r.type === 'badge')
  const specials = rewards.filter(r => r.type === 'special')

  const sections = [
    { title: `⭐ ${t('home.stars')}`, items: stars, empty: t('rewards.starEmpty'), bg: 'rgba(255,229,143,0.2)', border: 'rgba(255,229,143,0.5)' },
    { title: `🌟 ${t('rewards.stickers')}`, items: stickers, empty: t('rewards.stickerEmpty'), bg: 'rgba(201,182,255,0.15)', border: 'rgba(201,182,255,0.4)' },
    { title: `🏅 ${t('home.badges')}`, items: badges, empty: t('rewards.badgeEmpty'), bg: 'rgba(168,216,255,0.15)', border: 'rgba(168,216,255,0.4)' },
    { title: `👑 ${t('rewards.special')}`, items: specials, empty: t('rewards.specialEmpty'), bg: 'rgba(255,199,217,0.15)', border: 'rgba(255,199,217,0.4)' },
  ]

  return (
    <div className="app-container">
      <MagicBackground />
      <div className="relative z-10 overflow-y-auto safe-top app-with-bottom-nav" style={{ paddingBottom: 104 }}>
        <div className="flex items-center gap-3 px-5 pt-6 pb-4">
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => navigate('/home')}
            style={{
              width: 42,
              height: 42,
              borderRadius: 14,
              background: 'rgba(255,255,255,0.8)',
              backdropFilter: 'blur(8px)',
              border: '1.5px solid rgba(255,255,255,0.9)',
              fontWeight: 900,
              fontSize: '1rem',
              cursor: 'pointer',
              boxShadow: '0 3px 10px rgba(0,0,0,0.08)',
            }}
          >
            ←
          </motion.button>
          <h1 style={{ fontWeight: 900, fontSize: '1.2rem', color: '#2D2D3A' }}>🏆 {t('home.treasureTitle')}</h1>
        </div>

        <div className="px-4">
          {streak && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-5 mb-4"
              style={{ background: 'linear-gradient(135deg,rgba(255,229,143,0.3),rgba(255,209,180,0.2))' }}
            >
              <div className="flex items-center gap-4">
                <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.8, repeat: Infinity }}>
                  <div style={{ fontSize: '3rem' }}>🔥</div>
                </motion.div>
                <div>
                  <div style={{ fontWeight: 900, fontSize: '1.8rem', color: '#2D2D3A' }}>
                    {t('rewards.currentStreak', { count: streak.currentStreak })}
                  </div>
                  <div style={{ color: '#7A7A9A', fontSize: '0.82rem', fontWeight: 700 }}>
                    {t('rewards.bestStreak', { count: streak.longestStreak })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {sections.map((sec, i) => (
            <motion.div
              key={sec.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + i * 0.07 }}
              className="glass-card p-4 mb-3"
              style={{ background: sec.bg, borderColor: sec.border }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 style={{ fontWeight: 900, color: '#2D2D3A', fontSize: '0.95rem' }}>{sec.title}</h3>
                <span style={{ fontSize: '0.8rem', color: '#7A7A9A', fontWeight: 700 }}>
                  {t('rewards.itemCount', { count: sec.items.length })}
                </span>
              </div>
              {sec.items.length === 0 ? (
                <p style={{ fontSize: '0.82rem', color: '#7A7A9A', fontWeight: 600 }}>{sec.empty}</p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {sec.items.slice(-20).map((r, j) => (
                    <motion.div
                      key={r.id}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: j * 0.04, type: 'spring' }}
                      title={new Date(r.earnedAt).toLocaleDateString(language === 'ko' ? 'ko-KR' : undefined)}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        background: 'rgba(255,255,255,0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.3rem',
                        boxShadow: '0 3px 8px rgba(0,0,0,0.06)',
                        border: '1.5px solid rgba(255,255,255,0.9)',
                      }}
                    >
                      {r.emoji}
                    </motion.div>
                  ))}
                  {sec.items.length > 20 && (
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        background: 'rgba(255,255,255,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        color: '#7A7A9A',
                      }}
                    >
                      +{sec.items.length - 20}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))}

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-4 mb-6">
            <h3 style={{ fontWeight: 900, color: '#2D2D3A', marginBottom: 12, fontSize: '0.95rem' }}>
              🎯 {t('rewards.nextGoal')}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { emoji: '⭐', label: t('rewards.goalToday'), done: false },
                { emoji: '🌟', label: t('rewards.goal3Days', { count: streak?.currentStreak ?? 0 }), done: (streak?.currentStreak ?? 0) >= 3 },
                { emoji: '🏅', label: t('rewards.goal7Days', { count: streak?.currentStreak ?? 0 }), done: (streak?.currentStreak ?? 0) >= 7 },
              ].map((g, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    borderRadius: 14,
                    background: g.done ? 'rgba(98,214,178,0.18)' : 'rgba(255,255,255,0.5)',
                    border: `1.5px solid ${g.done ? 'rgba(98,214,178,0.35)' : 'rgba(255,255,255,0.8)'}`,
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }}>{g.done ? '✓' : g.emoji}</span>
                  <span
                    style={{
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      color: g.done ? '#3EC99A' : '#2D2D3A',
                      textDecoration: g.done ? 'line-through' : 'none',
                    }}
                  >
                    {g.label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}

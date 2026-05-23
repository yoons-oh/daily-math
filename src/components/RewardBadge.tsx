import React from 'react'
import { motion } from 'framer-motion'
import { Reward } from '../lib/types'

interface Props {
  rewards: Reward[]
  onClose: () => void
}

export default function RewardPopup({ rewards, onClose }: Props) {
  if (!rewards.length) return null
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(45,45,58,0.55)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 99, padding: 24,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.5, opacity: 0 }}
        transition={{ type: 'spring', damping: 14, stiffness: 280 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(160deg,#F4FFF9,#EBF8FF,#F5F0FF)',
          borderRadius: 32,
          padding: '36px 28px',
          maxWidth: 320, width: '100%',
          textAlign: 'center',
          border: '2px solid rgba(255,255,255,0.9)',
          boxShadow: '0 24px 60px rgba(98,214,178,0.25)',
        }}
      >
        <motion.div
          animate={{ rotate: [0, 15, -15, 10, -10, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 1, delay: 0.2 }}
          style={{ fontSize: '4rem', marginBottom: 8 }}
        >🎊</motion.div>
        <h2 style={{ fontWeight: 900, fontSize: '1.4rem', color: '#2D2D3A', marginBottom: 20 }}>
          보상 획득!
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {rewards.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.12 }}
              className="reward-star"
              style={{
                background: 'linear-gradient(135deg,rgba(255,229,143,0.35),rgba(255,199,217,0.2))',
                border: '1.5px solid rgba(255,229,143,0.5)',
                borderRadius: 16,
                padding: '12px 18px',
                display: 'flex', alignItems: 'center', gap: 12,
              }}
            >
              <span style={{ fontSize: '2rem' }}>{r.emoji}</span>
              <span style={{ fontWeight: 800, fontSize: '1rem', color: '#2D2D3A' }}>{r.name}</span>
            </motion.div>
          ))}
        </div>
        <motion.button
          whileTap={{ scale: 0.96, y: 3 }}
          onClick={onClose}
          className="jelly-btn"
          style={{ width: '100%', fontSize: '1rem' }}
        >
          고마워요! 🙏
        </motion.button>
      </motion.div>
    </motion.div>
  )
}

export function RewardMini({ emoji, label, count }: { emoji: string; label: string; count: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{
        width: 52, height: 52, borderRadius: 16,
        background: 'linear-gradient(135deg,rgba(255,229,143,0.4),rgba(255,199,217,0.3))',
        border: '1.5px solid rgba(255,229,143,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.5rem',
        boxShadow: '0 4px 12px rgba(255,229,143,0.3)',
      }}>{emoji}</div>
      <span style={{ fontSize: '0.7rem', color: '#7A7A9A', fontWeight: 700 }}>{label}</span>
      <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#2D2D3A' }}>×{count}</span>
    </div>
  )
}

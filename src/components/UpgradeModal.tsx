import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n'
import { FREE_PLAN } from '../lib/subscription'

interface UpgradeModalProps {
  open: boolean
  onClose: () => void
  /** true면 오늘 한도 초과, false면 세션 중 한도 도달 */
  isBlocked?: boolean
}

export default function UpgradeModal({ open, onClose, isBlocked = false }: UpgradeModalProps) {
  const navigate = useNavigate()
  const { t } = useI18n()

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(45,45,58,0.38)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20, backdropFilter: 'blur(6px)',
          }}
          onClick={e => { if (e.target === e.currentTarget) onClose() }}
        >
          <motion.div
            initial={{ scale: 0.88, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: 10, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 260 }}
            style={{
              width: '100%', maxWidth: 360,
              background: 'rgba(255,255,255,0.96)',
              borderRadius: 28, padding: '28px 24px 24px',
              boxShadow: '0 20px 60px rgba(76,106,170,0.22), inset 0 1px 0 rgba(255,255,255,0.9)',
              border: '1.5px solid rgba(255,255,255,0.9)',
              textAlign: 'center',
            }}
          >
            <motion.div
              animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.08, 1] }}
              transition={{ duration: 2.4, repeat: Infinity }}
              style={{ fontSize: '3.4rem', marginBottom: 12 }}
            >
              ⭐
            </motion.div>

            <div style={{ fontWeight: 900, fontSize: '1.25rem', color: '#2D2D3A', marginBottom: 8 }}>
              {isBlocked
                ? t('upgrade.blockedTitle')
                : t('upgrade.limitTitle', { count: FREE_PLAN.dailyLimit })}
            </div>

            <div style={{
              background: 'linear-gradient(135deg, rgba(98,214,178,0.12), rgba(168,216,255,0.12))',
              border: '1.5px solid rgba(98,214,178,0.3)',
              borderRadius: 18, padding: '14px 16px', marginBottom: 20,
            }}>
              <p style={{ color: '#4A4A6A', fontWeight: 800, fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                {t('upgrade.descFree', { free: FREE_PLAN.dailyLimit })}{' '}
                {t('upgrade.descPro', { pro: 20 })}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              <div style={{
                borderRadius: 16, padding: '12px 10px',
                background: 'rgba(240,240,250,0.7)',
                border: '1.5px solid rgba(180,180,210,0.3)',
              }}>
                <div style={{ fontWeight: 900, color: '#8B8DA4', fontSize: '0.78rem', marginBottom: 4 }}>FREE</div>
                <div style={{ fontWeight: 900, color: '#2D2D3A', fontSize: '1.3rem' }}>{FREE_PLAN.dailyLimit}</div>
                <div style={{ color: '#8B8DA4', fontSize: '0.72rem', fontWeight: 800 }}>{t('upgrade.perDay')}</div>
              </div>
              <div style={{
                borderRadius: 16, padding: '12px 10px',
                background: 'linear-gradient(135deg, rgba(98,214,178,0.18), rgba(62,201,154,0.12))',
                border: '2px solid rgba(98,214,178,0.5)',
              }}>
                <div style={{ fontWeight: 900, color: '#3EC99A', fontSize: '0.78rem', marginBottom: 4 }}>PRO ✨</div>
                <div style={{ fontWeight: 900, color: '#2D2D3A', fontSize: '1.3rem' }}>20</div>
                <div style={{ color: '#3EC99A', fontSize: '0.72rem', fontWeight: 800 }}>{t('upgrade.proPrice')}</div>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.97, y: 3 }}
              onClick={() => navigate('/subscribe')}
              style={{
                width: '100%', height: 54, borderRadius: 18, border: 'none',
                background: 'linear-gradient(135deg, #62D6B2, #3EC99A)',
                color: '#fff', fontWeight: 900, fontSize: '1rem', cursor: 'pointer',
                boxShadow: '0 6px 0 #28A87A, 0 10px 24px rgba(98,214,178,0.38)',
                marginBottom: 10,
              }}
            >
              {t('upgrade.cta')}
            </motion.button>

            <button
              onClick={onClose}
              style={{
                width: '100%', height: 44, borderRadius: 14, border: 'none',
                background: 'transparent', color: '#8B8DA4',
                fontWeight: 900, fontSize: '0.9rem', cursor: 'pointer',
              }}
            >
              {t('upgrade.dismiss')}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

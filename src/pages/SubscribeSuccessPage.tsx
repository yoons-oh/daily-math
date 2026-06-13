import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import MagicBackground from '../components/MagicBackground'
import { clearSubscriptionCache } from '../lib/subscription'
import { playSound } from '../lib/sound'
import { useI18n } from '../i18n'

export default function SubscribeSuccessPage() {
  const navigate = useNavigate()
  const { t } = useI18n()

  useEffect(() => {
    clearSubscriptionCache()
    playSound('reward')
  }, [])

  return (
    <div className="app-container items-center justify-center">
      <MagicBackground />
      <div className="relative z-10 flex flex-col items-center" style={{ padding: '0 24px', maxWidth: 360, width: '100%', textAlign: 'center' }}>
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 8, stiffness: 200 }}
          style={{ fontSize: '5rem', marginBottom: 16 }}
        >
          🎉
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div style={{ fontWeight: 900, fontSize: '1.6rem', color: '#2D2D3A', marginBottom: 8 }}>{t('upgrade.successTitle')}</div>
          <div style={{ color: '#7A7A9A', fontWeight: 800, fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 28 }}>
            {t('upgrade.successDesc')}
          </div>
        </motion.div>

        <div style={{ width: '100%', borderRadius: 22, background: 'linear-gradient(135deg,rgba(98,214,178,0.18),rgba(62,201,154,0.12))', border: '2px solid rgba(98,214,178,0.4)', padding: '16px 20px', marginBottom: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 900, fontSize: '2rem', color: '#2D2D3A' }}>20</div>
              <div style={{ fontWeight: 800, fontSize: '0.78rem', color: '#7A7A9A' }}>{t('upgrade.successProblems')}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 900, fontSize: '1.3rem', color: '#3EC99A' }}>₩2,000</div>
              <div style={{ fontWeight: 800, fontSize: '0.78rem', color: '#7A7A9A' }}>{t('upgrade.successRenew')}</div>
            </div>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.97, y: 3 }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          onClick={() => navigate('/home')}
          style={{
            width: '100%', height: 58, borderRadius: 20, border: 'none',
            background: 'linear-gradient(135deg,#62D6B2,#3EC99A)',
            color: '#fff', fontWeight: 900, fontSize: '1.05rem', cursor: 'pointer',
            boxShadow: '0 6px 0 #28A87A, 0 10px 24px rgba(98,214,178,0.38)',
          }}
        >
          {t('upgrade.successCta')}
        </motion.button>
      </div>
    </div>
  )
}

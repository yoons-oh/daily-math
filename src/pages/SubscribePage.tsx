import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import MagicBackground from '../components/MagicBackground'
import { useSubscription, clearSubscriptionCache } from '../lib/subscription'
import { supabase } from '../lib/supabase'
import { useI18n } from '../i18n'

const PRO_PRICE = '₩2,000'
const PRO_SKU = 'pro_monthly'

function isTwa(): boolean {
  return (
    document.referrer.startsWith('android-app://') ||
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

export default function SubscribePage() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const { subscription, refresh } = useSubscription()
  const [purchasing, setPurchasing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [twaEnv, setTwaEnv] = useState(false)

  useEffect(() => {
    setTwaEnv(isTwa())
  }, [])

  async function handleSubscribe() {
    setPurchasing(true)
    setError(null)
    try {
      const service = await (window as Window & {
        getDigitalGoodsService?: (url: string) => Promise<{
          getDetails: (skus: string[]) => Promise<{ itemId: string; price: { value: string; currency: string } }[]>
        }>
      }).getDigitalGoodsService?.('https://play.google.com/billing')

      if (!service) {
        setError(t('upgrade.errNotAvailable') || 'Google Play billing is not available.')
        setPurchasing(false)
        return
      }

      const details = await service.getDetails([PRO_SKU])
      if (!details.length) {
        setError(t('upgrade.errNotFound') || 'Subscription product not found.')
        setPurchasing(false)
        return
      }

      const request = new PaymentRequest(
        [{ supportedMethods: 'https://play.google.com/billing', data: { sku: PRO_SKU } }],
        { total: { label: `Daily Math Pro ${PRO_PRICE}/mo`, amount: { currency: 'KRW', value: '2000' } } },
      )

      const paymentResponse = await request.show()
      const token = (paymentResponse.details as { token: string }).token

      if (supabase) {
        const { error: fnError } = await supabase.functions.invoke('verify-play-purchase', {
          body: { token, sku: PRO_SKU },
        })
        if (fnError) throw new Error(t('upgrade.errVerify') || 'Purchase verification failed.')
      }

      await paymentResponse.complete('success')
      clearSubscriptionCache()
      refresh()
      navigate('/subscribe/success')
    } catch (e) {
      const msg = e instanceof Error ? e.message : (t('upgrade.errUnknown') || 'An unknown error occurred.')
      setError(msg)
      setPurchasing(false)
    }
  }

  if (subscription.isPro) {
    return (
      <div className="app-container items-center justify-center">
        <MagicBackground />
        <div className="relative z-10 flex flex-col items-center" style={{ padding: '0 24px', maxWidth: 400, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: 16 }}>✨</div>
          <div style={{ fontWeight: 900, fontSize: '1.4rem', color: '#2D2D3A', marginBottom: 8 }}>{t('upgrade.alreadyPro')}</div>
          <div style={{ color: '#7A7A9A', fontWeight: 800, fontSize: '0.9rem', marginBottom: 24 }}>
            {t('upgrade.alreadyProDesc')}
            {subscription.periodEnd && (
              <div style={{ marginTop: 4 }}>
                {subscription.periodEnd.toLocaleDateString()}
              </div>
            )}
          </div>
          <motion.button whileTap={{ scale: 0.97, y: 3 }} onClick={() => navigate('/home')} className="jelly-btn" style={{ width: '100%' }}>
            {t('upgrade.backHome')}
          </motion.button>
        </div>
      </div>
    )
  }

  const benefits = [
    { icon: '📚', text: t('upgrade.benefit1') },
    { icon: '🏆', text: t('upgrade.benefit2') },
    { icon: '📊', text: t('upgrade.benefit3') },
    { icon: '❌', text: t('upgrade.benefit4') },
  ]

  return (
    <div className="app-container">
      <MagicBackground />
      <div className="relative z-10 flex flex-col" style={{ height: '100dvh' }}>

        {/* 헤더 */}
        <div style={{ padding: '16px 16px 12px', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', flexShrink: 0 }}>
          <div className="flex items-center gap-3">
            <motion.button whileTap={{ scale: 0.88 }} onClick={() => navigate(-1)}
              style={{ width: 42, height: 42, borderRadius: 14, background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)', border: '1.5px solid rgba(255,255,255,0.9)', fontWeight: 900, fontSize: '1rem', cursor: 'pointer', flexShrink: 0 }}>
              ←
            </motion.button>
            <div style={{ fontWeight: 900, fontSize: '1.1rem', color: '#2D2D3A' }}>✨ {t('upgrade.pageTitle')}</div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px 32px' }}>

          <motion.div animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }} transition={{ duration: 3, repeat: Infinity }}
            style={{ textAlign: 'center', fontSize: '4rem', marginBottom: 8 }}>
            🌟
          </motion.div>

          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontWeight: 900, fontSize: '1.5rem', color: '#2D2D3A', marginBottom: 6 }}>{t('upgrade.headline')}</div>
            <div style={{ color: '#7A7A9A', fontWeight: 800, fontSize: '0.9rem' }}>{t('upgrade.subheadline')}</div>
          </div>

          {/* 플랜 비교 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
            <div style={{ borderRadius: 22, padding: '20px 16px', background: 'rgba(240,240,250,0.7)', border: '1.5px solid rgba(180,180,210,0.3)', textAlign: 'center' }}>
              <div style={{ fontWeight: 900, color: '#8B8DA4', fontSize: '0.8rem', marginBottom: 8 }}>FREE</div>
              <div style={{ fontWeight: 900, fontSize: '2.2rem', color: '#2D2D3A', lineHeight: 1 }}>2</div>
              <div style={{ fontWeight: 900, color: '#8B8DA4', fontSize: '0.78rem', marginTop: 2 }}>{t('upgrade.problemsPerDay')}</div>
              <div style={{ marginTop: 12, fontWeight: 900, fontSize: '1rem', color: '#8B8DA4' }}>{t('upgrade.freePlan')}</div>
            </div>
            <motion.div
              animate={{ boxShadow: ['0 0 0 0 rgba(98,214,178,0)', '0 0 0 6px rgba(98,214,178,0.18)', '0 0 0 0 rgba(98,214,178,0)'] }}
              transition={{ duration: 2.4, repeat: Infinity }}
              style={{ borderRadius: 22, padding: '20px 16px', background: 'linear-gradient(135deg,rgba(98,214,178,0.18),rgba(62,201,154,0.12))', border: '2px solid rgba(98,214,178,0.55)', textAlign: 'center', position: 'relative' }}>
              <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,#62D6B2,#3EC99A)', borderRadius: 999, padding: '3px 12px', fontSize: '0.72rem', fontWeight: 900, color: '#fff', whiteSpace: 'nowrap' }}>{t('upgrade.recommended')}</div>
              <div style={{ fontWeight: 900, color: '#3EC99A', fontSize: '0.8rem', marginBottom: 8 }}>PRO</div>
              <div style={{ fontWeight: 900, fontSize: '2.2rem', color: '#2D2D3A', lineHeight: 1 }}>20</div>
              <div style={{ fontWeight: 900, color: '#3EC99A', fontSize: '0.78rem', marginTop: 2 }}>{t('upgrade.problemsPerDay')}</div>
              <div style={{ marginTop: 12, fontWeight: 900, fontSize: '1rem', color: '#2D2D3A' }}>{PRO_PRICE}<span style={{ fontSize: '0.72rem', color: '#7A7A9A', fontWeight: 800 }}>/월</span></div>
            </motion.div>
          </div>

          {/* 혜택 목록 */}
          <div className="glass-card" style={{ padding: '16px 18px', marginBottom: 24 }}>
            <div style={{ fontWeight: 900, color: '#2D2D3A', fontSize: '0.9rem', marginBottom: 12 }}>{t('upgrade.benefits')}</div>
            {benefits.map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: i < benefits.length - 1 ? 8 : 0 }}>
                <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{b.icon}</span>
                <span style={{ fontWeight: 800, color: '#4A4A6A', fontSize: '0.88rem' }}>{b.text}</span>
              </div>
            ))}
          </div>

          {error && (
            <div style={{ borderRadius: 14, background: 'rgba(255,118,118,0.12)', border: '1.5px solid rgba(255,118,118,0.3)', padding: '12px 16px', marginBottom: 16, color: '#C00', fontWeight: 800, fontSize: '0.86rem' }}>
              {error}
            </div>
          )}

          {twaEnv ? (
            <motion.button
              whileTap={{ scale: 0.97, y: 3 }}
              onClick={handleSubscribe}
              disabled={purchasing}
              style={{
                width: '100%', height: 58, borderRadius: 20, border: 'none',
                background: purchasing ? 'rgba(98,214,178,0.4)' : 'linear-gradient(135deg,#62D6B2,#3EC99A)',
                color: '#fff', fontWeight: 900, fontSize: '1.05rem', cursor: purchasing ? 'default' : 'pointer',
                boxShadow: purchasing ? 'none' : '0 6px 0 #28A87A, 0 10px 24px rgba(98,214,178,0.38)',
                marginBottom: 10,
              }}
            >
              {purchasing ? t('upgrade.processing') : t('upgrade.subscribeCta', { price: PRO_PRICE })}
            </motion.button>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div className="glass-card" style={{ padding: '20px 18px', marginBottom: 16 }}>
                <div style={{ fontSize: '2.4rem', marginBottom: 8 }}>📱</div>
                <div style={{ fontWeight: 900, color: '#2D2D3A', fontSize: '1rem', marginBottom: 6 }}>{t('upgrade.webTitle')}</div>
                <div style={{ color: '#7A7A9A', fontWeight: 800, fontSize: '0.84rem', lineHeight: 1.55 }}>
                  {t('upgrade.webDesc')}
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.97, y: 3 }}
                onClick={() => window.open('https://play.google.com/store', '_blank')}
                style={{
                  width: '100%', height: 54, borderRadius: 18, border: 'none',
                  background: 'linear-gradient(135deg,#4285F4,#2B6BE6)',
                  color: '#fff', fontWeight: 900, fontSize: '0.95rem', cursor: 'pointer',
                  boxShadow: '0 6px 0 #1A4BBF, 0 10px 24px rgba(66,133,244,0.35)',
                  marginBottom: 10,
                }}
              >
                📲 {t('upgrade.playStoreCta')}
              </motion.button>
            </div>
          )}

          <button
            onClick={() => navigate(-1)}
            style={{ width: '100%', height: 44, borderRadius: 14, border: 'none', background: 'transparent', color: '#8B8DA4', fontWeight: 900, fontSize: '0.9rem', cursor: 'pointer' }}
          >
            {t('upgrade.later')}
          </button>

        </div>
      </div>
    </div>
  )
}

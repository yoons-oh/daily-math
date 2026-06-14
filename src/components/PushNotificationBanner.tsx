import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { isPushSupported, subscribePush, unsubscribePush, isSubscribed, getPushPermission } from '../lib/pushNotification'
import { useI18n } from '../i18n'

interface Props {
  userId: string
}

export default function PushNotificationBanner({ userId }: Props) {
  const { t } = useI18n()
  const [visible, setVisible] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isPushSupported()) return
    ;(async () => {
      const perm = await getPushPermission()
      const sub  = await isSubscribed()
      setSubscribed(sub)
      // 권한 요청 전 상태이고, 구독 안 된 경우에만 배너 표시
      if (perm === 'default' && !sub) setVisible(true)
    })()
  }, [])

  async function handleAllow() {
    setLoading(true)
    const perm = await Notification.requestPermission()
    if (perm === 'granted') {
      const ok = await subscribePush(userId)
      setSubscribed(ok)
    }
    setLoading(false)
    setVisible(false)
  }

  async function handleToggle() {
    setLoading(true)
    if (subscribed) {
      await unsubscribePush()
      setSubscribed(false)
    } else {
      const perm = await Notification.requestPermission()
      if (perm === 'granted') {
        const ok = await subscribePush(userId)
        setSubscribed(ok)
      }
    }
    setLoading(false)
  }

  // 이미 권한 허용/거부된 경우 배너 없이 토글 버튼만 반환
  if (!isPushSupported()) return null

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key="banner"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          style={{
            margin: '0 0 12px',
            padding: '13px 16px',
            borderRadius: 16,
            background: 'linear-gradient(135deg,rgba(167,139,250,0.15),rgba(98,214,178,0.15))',
            border: '1.5px solid rgba(167,139,250,0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span style={{ fontSize: '1.4rem' }}>🔔</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 900, fontSize: '0.85rem', color: '#2D2D3A' }}>
              {t('push.bannerTitle')}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#666', marginTop: 2 }}>
              {t('push.bannerDesc')}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setVisible(false)}
              style={{ padding: '6px 10px', borderRadius: 9, border: '1.5px solid #ccc', background: 'transparent', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', color: '#888' }}>
              {t('push.bannerLater')}
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={handleAllow} disabled={loading}
              style={{ padding: '6px 12px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg,#A78BFA,#7C3AED)', fontSize: '0.78rem', fontWeight: 900, cursor: 'pointer', color: '#fff' }}>
              {loading ? '...' : t('push.bannerAllow')}
            </motion.button>
          </div>
        </motion.div>
      ) : null}

      {/* 설정 내 토글용 — 배너 닫힌 후에도 사용 가능 */}
      {!visible && (
        <PushToggleRow subscribed={subscribed} loading={loading} onToggle={handleToggle} />
      )}
    </AnimatePresence>
  )
}

export function PushToggleRow({ subscribed, loading, onToggle }: { subscribed: boolean; loading: boolean; onToggle: () => void }) {
  const { t } = useI18n()
  if (!isPushSupported()) return null
  return (
    <motion.button whileTap={{ scale: 0.97 }} onClick={onToggle} disabled={loading}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderRadius: 14,
        background: subscribed ? 'rgba(167,139,250,0.12)' : 'rgba(0,0,0,0.04)',
        border: `1.5px solid ${subscribed ? 'rgba(167,139,250,0.5)' : 'rgba(0,0,0,0.08)'}`,
        cursor: 'pointer',
      }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: '1.2rem' }}>{subscribed ? '🔔' : '🔕'}</span>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontWeight: 900, fontSize: '0.85rem', color: '#2D2D3A' }}>{t('push.settingTitle')}</div>
          <div style={{ fontSize: '0.72rem', color: '#888' }}>{subscribed ? t('push.settingOn') : t('push.settingOff')}</div>
        </div>
      </div>
      <div style={{
        width: 42, height: 24, borderRadius: 12,
        background: subscribed ? '#7C3AED' : '#ccc',
        position: 'relative', transition: 'background 0.2s',
      }}>
        <div style={{
          position: 'absolute', top: 3, left: subscribed ? 21 : 3,
          width: 18, height: 18, borderRadius: '50%', background: '#fff',
          transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        }} />
      </div>
    </motion.button>
  )
}

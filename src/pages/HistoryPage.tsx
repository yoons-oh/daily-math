import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import MagicBackground from '../components/MagicBackground'
import { getCurrentProfile, getSessions } from '../lib/storage'
import { PracticeSession } from '../lib/types'
import { useI18n } from '../i18n'
import { useSubscription } from '../lib/subscription'

function getRate(session: PracticeSession) {
  if (!session.questions.length) return 0
  const correct = session.questions.filter(q => q.isCorrect).length
  return Math.round((correct / session.questions.length) * 100)
}

function getOperationLabel(session: PracticeSession, t: (key: string) => string) {
  return session.operation === 'add' ? t('home.addMagic') : t('home.subMagic')
}

export default function HistoryPage() {
  const navigate = useNavigate()
  const { language, t } = useI18n()
  const { subscription } = useSubscription()
  const [sessions, setSessions] = useState<PracticeSession[]>([])

  useEffect(() => {
    const profile = getCurrentProfile()
    if (!profile) {
      navigate('/profiles')
      return
    }

    setSessions(
      getSessions()
        .filter(session => session.profileId === profile.id && session.completedAt)
        .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0)),
    )
  }, [navigate])

  const totalProblems = sessions.reduce((sum, session) => sum + session.questions.length, 0)
  const totalCorrect = sessions.reduce(
    (sum, session) => sum + session.questions.filter(q => q.isCorrect).length,
    0,
  )
  const avgRate = totalProblems ? Math.round((totalCorrect / totalProblems) * 100) : 0

  return (
    <div className="app-container">
      <MagicBackground />
      <div className="relative z-10 flex flex-col app-with-bottom-nav" style={{ minHeight: '100dvh' }}>
        <header className="safe-top" style={{ padding: '20px 18px 12px' }}>
          <div className="flex items-center justify-between">
            <div>
              <p style={{ color: '#7A7A9A', fontSize: '0.8rem', fontWeight: 900 }}>{t('history.eyebrow')}</p>
              <h1 style={{ fontWeight: 900, fontSize: '1.35rem', color: '#2D2D3A', marginTop: 2 }}>
                📊 {t('history.title')}
              </h1>
            </div>
            <div style={{
              borderRadius: 18,
              padding: '9px 13px',
              background: 'rgba(255,255,255,0.78)',
              border: '1.5px solid rgba(255,255,255,0.9)',
              color: '#3EC99A',
              fontWeight: 900,
              boxShadow: '0 8px 20px rgba(98,214,178,0.14)',
            }}>
              {t('history.sessionsCount', { count: sessions.length })}
            </div>
          </div>
        </header>

        <main className="history-main" style={{ flex: 1, overflowY: 'auto', padding: '0 16px 104px' }}>
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 10, marginBottom: 14 }}>
            {[
              { label: t('history.completed'), value: t('history.sessionsCount', { count: sessions.length }), emoji: '🏁' },
              { label: t('history.solved'), value: t('history.problemCount', { count: totalProblems }), emoji: '🧮' },
              { label: t('history.average'), value: `${avgRate}%`, emoji: '⭐' },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="glass-card"
                style={{ padding: '12px 8px', textAlign: 'center' }}
              >
                <div style={{ fontSize: '1.45rem' }}>{item.emoji}</div>
                <div style={{ fontWeight: 900, color: '#2D2D3A', fontSize: '1.05rem', marginTop: 2 }}>{item.value}</div>
                <div style={{ color: '#7A7A9A', fontWeight: 800, fontSize: '0.7rem' }}>{item.label}</div>
              </motion.div>
            ))}
          </section>

          {sessions.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: 24, textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: 8 }}>🌱</div>
              <div style={{ fontWeight: 900, color: '#2D2D3A', fontSize: '1.1rem' }}>{t('history.emptyTitle')}</div>
              <p style={{ color: '#7A7A9A', fontWeight: 800, fontSize: '0.86rem', marginTop: 6 }}>
                {t('history.emptyDesc', { count: subscription.dailyLimit })}
              </p>
            </motion.div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sessions.map((session, i) => {
                const rate = getRate(session)
                const correct = session.questions.filter(q => q.isCorrect).length
                const completedAt = session.completedAt ? new Date(session.completedAt) : null
                return (
                  <motion.article
                    key={`${session.date}-${session.operation}-${i}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.04, 0.28) }}
                    className="glass-card"
                    style={{
                      padding: 14,
                      background: rate >= 80
                        ? 'linear-gradient(135deg,rgba(98,214,178,0.22),rgba(255,255,255,0.68))'
                        : 'linear-gradient(135deg,rgba(255,229,143,0.26),rgba(255,255,255,0.68))',
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div style={{ fontWeight: 900, color: '#2D2D3A' }}>{getOperationLabel(session, t)}</div>
                        <div style={{ color: '#7A7A9A', fontWeight: 800, fontSize: '0.78rem', marginTop: 3 }}>
                          {session.date}{completedAt ? ` · ${completedAt.toLocaleTimeString(language === 'ko' ? 'ko-KR' : undefined, { hour: '2-digit', minute: '2-digit' })}` : ''}
                        </div>
                      </div>
                      <div style={{
                        minWidth: 62,
                        borderRadius: 16,
                        padding: '8px 10px',
                        background: 'rgba(255,255,255,0.76)',
                        textAlign: 'center',
                        fontWeight: 900,
                        color: rate >= 80 ? '#249B76' : '#9A7400',
                      }}>
                        {rate}%
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, color: '#7A7A9A', fontWeight: 800, fontSize: '0.82rem' }}>
                      <span>{t('history.correctCount', { correct, total: session.questions.length })}</span>
                      <span>{session.level}</span>
                    </div>
                  </motion.article>
                )
              })}
            </div>
          )}
        </main>
      </div>
      <BottomNav />
    </div>
  )
}

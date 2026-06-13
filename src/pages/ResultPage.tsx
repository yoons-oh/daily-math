import React from 'react'
import { motion } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import { QuestionResult, Operation, Level } from '../lib/types'
import { getStreak, getCurrentProfile, getUserRewardState } from '../lib/storage'
import { DailyMathRewardSummary, getRewardGrade, RewardGrade } from '../lib/rewards'
import MagicBackground from '../components/MagicBackground'
import { useI18n } from '../i18n'
import { useSubscription } from '../lib/subscription'

interface ResultState {
  results: QuestionResult[]
  operation: Operation
  level: Level
  rewardSummary?: DailyMathRewardSummary
}

export default function ResultPage() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const { subscription } = useSubscription()
  const { state } = useLocation() as { state: ResultState }
  const profile = getCurrentProfile()

  if (!state) {
    navigate('/home')
    return null
  }

  const { results, operation, level } = state
  const correct = results.filter(r => r.isCorrect).length
  const wrong = results.length - correct
  const rate = Math.round((correct / results.length) * 100)
  const avgTime = Math.round(results.reduce((s, r) => s + r.timeSpentSeconds, 0) / results.length)
  const streak = profile ? getStreak(profile.id) : null
  const wrongItems = results.filter(r => !r.isCorrect)
  const currentRewardState = profile ? getUserRewardState(profile.id) : null
  const gradeInfo = getRewardGrade(rate)
  const rewardSummary = state.rewardSummary ?? {
    rate,
    grade: gradeInfo.grade,
    gradeMessage: gradeInfo.message,
    coinsEarned: 0,
    starsEarned: 0,
    baseCoins: 0,
    rateStars: 0,
    streakBonusCoins: 0,
    streakBonusStars: 0,
    streakDays: currentRewardState?.streakDays ?? streak?.currentStreak ?? 0,
    badgeMessage: null,
    alreadyRewardedToday: true,
    totalCoins: currentRewardState?.coins ?? 0,
    totalStars: currentRewardState?.stars ?? 0,
    nextState: currentRewardState ?? { coins: 0, stars: 0, streakDays: 0, lastCompletedDate: null },
  }
  const isPerfect = rewardSummary.grade === 'PERFECT'
  const isCelebration = rate >= 90
  const emoji = rate >= 90 ? '🏆' : rate >= 70 ? '✨' : rate >= 50 ? '💪' : '🌱'
  const scoreGradient = rate >= 80
    ? 'linear-gradient(135deg,rgba(98,214,178,0.2),rgba(168,240,220,0.15))'
    : 'linear-gradient(135deg,rgba(255,229,143,0.25),rgba(255,199,217,0.15))'
  const gradeMessage = getGradeMessage(rewardSummary.grade, t)
  const badgeMessage = rewardSummary.streakDays === 14 ? t('result.badge14') : rewardSummary.badgeMessage

  return (
    <div className="app-container">
      <MagicBackground />
      {isCelebration && (
        <div className={`result-celebration ${isPerfect ? 'perfect' : ''}`} aria-hidden="true">
          {Array.from({ length: isPerfect ? 18 : 8 }).map((_, i) => (
            <span
              key={i}
              className={isPerfect ? 'falling-star' : 'sparkle-burst'}
              style={{
                left: `${6 + ((i * 17) % 88)}%`,
                animationDelay: `${i * 0.12}s`,
                animationDuration: `${isPerfect ? 1.9 + (i % 4) * 0.22 : 1.1 + (i % 3) * 0.12}s`,
              }}
            >
              {isPerfect ? '⭐' : ['✨', '🎉', '⭐'][i % 3]}
            </span>
          ))}
        </div>
      )}

      <div className="relative z-10 flex-1 overflow-y-auto px-4 pt-8 pb-6">
        <div className="text-center mb-5">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 10, stiffness: 200, delay: 0.15 }}
            style={{ fontSize: '5.5rem', marginBottom: 8 }}
          >
            {emoji}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={isPerfect ? 'perfect-title' : ''}
            style={{ fontWeight: 900, fontSize: isPerfect ? '1.9rem' : '1.5rem', color: '#2D2D3A' }}
          >
            {gradeMessage}
          </motion.h1>
          <p style={{ color: '#7A7A9A', fontSize: '0.85rem', marginTop: 4, fontWeight: 600 }}>
            {operation === 'add' ? `✨ ${t('home.addMagic')}` : `🌙 ${t('home.subMagic')}`} · {t(`profile.levels.${level}`)}
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25 }}
          className="glass-card p-5 mb-4"
          style={{ background: scoreGradient }}
        >
          <div style={{ fontWeight: 900, color: '#2D2D3A', marginBottom: 12 }}>{t('result.todayResult')}</div>
          <div className="flex items-center justify-between">
            <Metric value={`${rate}%`} label={t('result.correctRate')} color="#2D2D3A" size="3.2rem" />
            <Divider />
            <div className="text-center flex-1">
              <div
                style={{
                  display: 'inline-flex',
                  minWidth: 70,
                  height: 54,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isPerfect ? 'linear-gradient(135deg,#FFE58F,#FFB44E)' : 'rgba(255,255,255,0.72)',
                  color: isPerfect ? '#5A4200' : '#3EC99A',
                  fontSize: rewardSummary.grade === 'PERFECT' ? '1.05rem' : '2rem',
                  fontWeight: 900,
                  boxShadow: isPerfect ? '0 6px 18px rgba(255,180,78,0.35)' : 'none',
                }}
              >
                {rewardSummary.grade}
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#7A7A9A', marginTop: 2 }}>{t('result.grade')}</div>
            </div>
            <Divider />
            <Metric value={String(correct)} label={t('result.correct')} color="#3EC99A" size="2.2rem" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32 }}
          className="glass-card p-4 mb-4"
          style={{ background: 'linear-gradient(135deg,rgba(255,229,143,0.34),rgba(255,248,215,0.22))' }}
        >
          <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 900, color: '#4E3900', margin: 0 }}>🎁 {t('result.rewards')}</h2>
            <span style={{ fontSize: '0.74rem', color: '#A47800', fontWeight: 900 }}>
              {t('result.owned', { coins: rewardSummary.totalCoins, stars: rewardSummary.totalStars })}
            </span>
          </div>
          {rewardSummary.alreadyRewardedToday ? (
            <div style={{ fontWeight: 900, color: '#7A7A9A', fontSize: '0.92rem' }}>{t('result.alreadyRewarded')}</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10 }}>
              <RewardLine emoji="🪙" label={t('result.coin')} value={`+${rewardSummary.coinsEarned}`} />
              <RewardLine emoji="⭐" label={t('result.star')} value={`+${rewardSummary.starsEarned}`} />
            </div>
          )}
          {!rewardSummary.alreadyRewardedToday && (rewardSummary.streakBonusCoins > 0 || rewardSummary.streakBonusStars > 0) && (
            <div style={{ marginTop: 10, fontWeight: 900, color: '#5A4200', fontSize: '0.88rem' }}>
              {t('result.streakBonus', {
                coins: rewardSummary.streakBonusCoins > 0 ? t('result.coinBonus', { count: rewardSummary.streakBonusCoins }) : '',
                stars: rewardSummary.streakBonusStars > 0 ? t('result.starBonus', { count: rewardSummary.streakBonusStars }) : '',
              })}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38 }}
          className="glass-card p-4 mb-4"
          style={{ background: 'linear-gradient(135deg,rgba(255,229,143,0.3),rgba(255,209,180,0.2))' }}
        >
          <div style={{ fontWeight: 900, color: '#2D2D3A', fontSize: '1.05rem' }}>🔥 {t('result.streak', { count: rewardSummary.streakDays })}</div>
          <div style={{ color: '#7A7A9A', fontWeight: 800, fontSize: '0.84rem', marginTop: 5 }}>{t('result.tomorrow')}</div>
          {badgeMessage && (
            <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 14, background: 'rgba(255,255,255,0.68)', color: '#5A4200', fontWeight: 900, fontSize: '0.86rem' }}>
              {badgeMessage}
            </div>
          )}
        </motion.div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { emoji: '⏱️', label: t('result.avgTime'), value: `${avgTime}s`, gradient: 'linear-gradient(135deg,rgba(168,216,255,0.25),rgba(201,182,255,0.15))' },
            { emoji: '💡', label: t('result.wrongCount'), value: `${wrong}`, gradient: 'linear-gradient(135deg,rgba(255,199,217,0.24),rgba(255,255,255,0.2))' },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.08 }}
              className="glass-card p-4"
              style={{ background: s.gradient }}
            >
              <div style={{ fontSize: '1.8rem', marginBottom: 4 }}>{s.emoji}</div>
              <div style={{ fontWeight: 900, fontSize: '1.4rem', color: '#2D2D3A' }}>{s.value}</div>
              <div style={{ fontSize: '0.72rem', color: '#7A7A9A', fontWeight: 700, marginTop: 2 }}>{s.label}</div>
            </motion.div>
          ))}
        </div>

        {wrongItems.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }} className="glass-card p-4 mb-4">
            <h3 style={{ fontWeight: 900, color: '#2D2D3A', marginBottom: 10, fontSize: '0.95rem' }}>💡 {t('result.wrongProblems')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {wrongItems.map((r, i) => (
                <div key={i} className="result-wrong" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 800 }}>{r.question.num1} {r.question.operation === 'add' ? '+' : '-'} {r.question.num2}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: '#FF7676', textDecoration: 'line-through', fontSize: '0.9rem' }}>{r.userAnswer ?? '?'}</span>
                    <span style={{ color: '#3EC99A', fontWeight: 900, fontSize: '1.05rem' }}>→ {r.question.answer}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.48 }} className="glass-card p-4 mb-5">
          <h3 style={{ fontWeight: 900, color: '#2D2D3A', marginBottom: 10, fontSize: '0.95rem' }}>📋 {t('result.allResults')}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
            {results.map((r, i) => (
              <div
                key={i}
                style={{
                  borderRadius: 12,
                  padding: '8px 4px',
                  textAlign: 'center',
                  background: r.isCorrect ? 'rgba(98,214,178,0.18)' : 'rgba(255,118,118,0.12)',
                  border: `1.5px solid ${r.isCorrect ? 'rgba(98,214,178,0.4)' : 'rgba(255,118,118,0.3)'}`,
                }}
              >
                <div style={{ fontSize: '0.7rem', color: '#7A7A9A', fontWeight: 700 }}>{t('result.problemNo', { count: i + 1 })}</div>
                <div style={{ fontSize: '1rem' }}>{r.isCorrect ? '⭐' : '💡'}</div>
                <div style={{ fontSize: '0.68rem', color: '#7A7A9A' }}>{r.timeSpentSeconds}s</div>
              </div>
            ))}
          </div>
        </motion.div>

        {!subscription.isPro && (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            style={{
              borderRadius: 22, marginBottom: 16,
              background: 'linear-gradient(135deg,rgba(98,214,178,0.15),rgba(168,216,255,0.12))',
              border: '1.5px solid rgba(98,214,178,0.35)',
              padding: '16px 18px',
              display: 'flex', alignItems: 'center', gap: 14,
            }}
          >
            <span style={{ fontSize: '2.2rem', flexShrink: 0 }}>⭐</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 900, color: '#2D2D3A', fontSize: '0.95rem', marginBottom: 3 }}>
                하루 20문제로 업그레이드!
              </div>
              <div style={{ color: '#7A7A9A', fontWeight: 800, fontSize: '0.78rem' }}>
                지금은 하루 {subscription.dailyLimit}문제 · Pro는 20문제 ₩2,000/월
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/subscribe')}
              style={{
                height: 40, padding: '0 16px', borderRadius: 14, border: 'none',
                background: 'linear-gradient(135deg,#62D6B2,#3EC99A)',
                color: '#fff', fontWeight: 900, fontSize: '0.82rem', cursor: 'pointer',
                boxShadow: '0 4px 0 #28A87A',
                flexShrink: 0,
              }}
            >
              업그레이드 →
            </motion.button>
          </motion.div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {wrongItems.length > 0 && (
            <motion.button
              whileTap={{ scale: 0.97, y: 3 }}
              onClick={() => navigate('/review', { state: { wrongItems, operation, level } })}
              className="jelly-btn jelly-btn-purple"
              style={{ width: '100%', fontSize: '1rem' }}
            >
              {t('result.review')} 💪
            </motion.button>
          )}
          <motion.button whileTap={{ scale: 0.97, y: 3 }} onClick={() => navigate('/home')} className="jelly-btn" style={{ width: '100%', fontSize: '1rem' }}>
            {t('result.home')} 🏰
          </motion.button>
        </div>
      </div>
    </div>
  )
}

function getGradeMessage(grade: RewardGrade, t: (key: string) => string) {
  if (grade === 'PERFECT') return t('result.gradePerfect')
  if (grade === 'S') return t('result.gradeS')
  if (grade === 'A') return t('result.gradeA')
  if (grade === 'B') return t('result.gradeB')
  return t('result.gradeC')
}

function Divider() {
  return <div style={{ width: 1, height: 56, background: 'rgba(0,0,0,0.08)' }} />
}

function Metric({ value, label, color, size }: { value: string; label: string; color: string; size: string }) {
  return (
    <div className="text-center flex-1">
      <div style={{ fontSize: size, fontWeight: 900, color }}>{value}</div>
      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#7A7A9A' }}>{label}</div>
    </div>
  )
}

function RewardLine({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <div
      style={{
        borderRadius: 18,
        background: 'rgba(255,255,255,0.72)',
        border: '1.5px solid rgba(255,229,143,0.5)',
        padding: '12px 10px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        boxShadow: '0 6px 16px rgba(255,196,62,0.12)',
      }}
    >
      <span className="reward-star" style={{ fontSize: '2rem', lineHeight: 1 }}>{emoji}</span>
      <div>
        <div style={{ fontSize: '0.74rem', color: '#A47800', fontWeight: 900 }}>{label}</div>
        <div style={{ fontSize: '1.15rem', color: '#2D2D3A', fontWeight: 900 }}>{value}</div>
      </div>
    </div>
  )
}

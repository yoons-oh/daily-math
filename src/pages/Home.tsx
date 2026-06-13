import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  getCurrentProfile,
  getRewards,
  getSessionByDate,
  getStreak,
  getTodayDate,
  getUserRewardState,
  isTodayCompleted,
  saveProfile,
  setCurrentProfileId,
} from '../lib/storage'
import { ChildProfile, Level, Reward, StreakInfo, UserRewardState } from '../lib/types'
import MagicBackground from '../components/MagicBackground'
import BottomNav from '../components/BottomNav'
import { playSound, unlockSound } from '../lib/sound'
import { useI18n, LANGUAGE_LABELS, SUPPORTED_LANGUAGES } from '../i18n'
import { consumeAuthSelectedLanguage, SupportedLanguage } from '../lib/language'
import { updateChildProfileLanguage, updateChildProfileLevel } from '../lib/childProfiles'
import { useSubscription } from '../lib/subscription'

const CHAR_IMG: Record<string, string> = {
  rabbit: '/characters/rabbit.jpg',
  fox: '/characters/fox.jpg',
  bear: '/characters/bear.jpg',
  panda: '/characters/panda.jpg',
  dragon: '/characters/dragon.jpg',
  rion: '/characters/rion.jpg',
  car: '/characters/car.jpg',
  train: '/characters/train.jpg',
  dragon2: '/characters/dragon2.jpg',
  unicon: '/characters/unicon.jpg',
}

const LEVEL_NAMES: Record<Level, string> = {
  L1: '1단계',
  L2A: '2단계 A',
  L2B: '2단계 B',
  L3A: '3단계 A',
  L3B: '3단계 B',
}

const SELECTABLE_LEVELS: Level[] = ['L1', 'L2A', 'L2B', 'L3A', 'L3B']

const MENU_ITEMS = [
  {
    icon: '🧙‍♂️',
    title: '덧셈 마법',
    sub: '오늘 20문제',
    route: '/practice/add',
    image: '/home/menu-add.jpg',
    gradient: 'linear-gradient(135deg, #2FE5C1 0%, #1EC69B 100%)',
    shadow: '#15A982',
    glow: 'rgba(47, 229, 193, 0.45)',
    mark: '+',
  },
  {
    icon: '🌙',
    title: '뺄셈 마법',
    sub: '오늘 20문제',
    route: '/practice/sub',
    image: '/home/menu-sub.jpg',
    gradient: 'linear-gradient(135deg, #FFC2DA 0%, #FF8FB9 100%)',
    shadow: '#D55E8D',
    glow: 'rgba(255, 143, 185, 0.4)',
    mark: '-',
  },
  {
    icon: '🧪',
    title: '마법 배우기',
    sub: '개념 애니메이션',
    route: '/concept',
    image: '/home/menu-concept.jpg',
    gradient: 'linear-gradient(135deg, #C6A8FF 0%, #9F88FF 100%)',
    shadow: '#7B61D8',
    glow: 'rgba(159, 136, 255, 0.42)',
    mark: '✦',
  },
  {
    icon: '💰',
    title: '보상 창고',
    sub: '',
    route: '/rewards',
    image: '/home/menu-rewards.jpg',
    gradient: 'linear-gradient(135deg, #FFE66D 0%, #FFC845 100%)',
    shadow: '#D6A41E',
    glow: 'rgba(255, 200, 69, 0.46)',
    mark: '★',
    textColor: '#5B3B00',
  },
]

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return '좋은 아침이에요'
  if (h < 17) return '오늘도 반짝여요'
  return '마법 연습 시간이에요'
}

export default function Home() {
  const navigate = useNavigate()
  const { language, setLanguage, t } = useI18n()
  const [profile, setProfile] = useState<ChildProfile | null>(null)
  const [streak, setStreak] = useState<StreakInfo | null>(null)
  const [rewards, setRewards] = useState<Reward[]>([])
  const [rewardState, setRewardState] = useState<UserRewardState | null>(null)
  const [todayDone, setTodayDone] = useState(false)
  const [todayStats, setTodayStats] = useState({ correct: 0, total: 0 })
  const { subscription } = useSubscription()

  useEffect(() => {
    const p = getCurrentProfile()
    if (!p) {
      navigate('/profiles')
      return
    }

    const authLanguage = consumeAuthSelectedLanguage()
    const nextLanguage = authLanguage ?? p.language ?? language

    if (nextLanguage !== language) {
      setLanguage(nextLanguage)
    }
    if (p.language !== nextLanguage) {
      const updatedProfile = { ...p, language: nextLanguage }
      saveProfile(updatedProfile)
      updateChildProfileLanguage(p.id, nextLanguage).catch(error => {
        console.warn('Could not sync profile language:', error)
      })
      setProfile(updatedProfile)
    } else {
      setProfile(p)
    }

    setStreak(getStreak(p.id))
    setRewards(getRewards(p.id))
    setRewardState(getUserRewardState(p.id))

    const done = isTodayCompleted(p.id)
    setTodayDone(done)
    if (done) {
      const sessions = getSessionByDate(p.id, getTodayDate())
      let correct = 0
      let total = 0
      sessions.forEach(s =>
        s.questions.forEach(q => {
          total += 1
          if (q.isCorrect) correct += 1
        }),
      )
      setTodayStats({ correct, total })
    }
  }, [language, navigate, setLanguage])

  if (!profile) return null

  const coinCount = rewardState?.coins ?? 0
  const starCount = rewardState?.stars ?? rewards.filter(r => r.type === 'star').length
  const badgeCount = rewards.filter(r => r.type === 'badge').length
  const charImg = CHAR_IMG[profile.avatar] ?? null
  const menuItems = MENU_ITEMS.map(item =>
    item.route === '/rewards' ? { ...item, sub: `별 ${starCount}개` } : item,
  )
  const getMenuCopy = (route: string) => {
    const dailySub = t('home.todayN', { count: subscription.dailyLimit })
    if (route === '/practice/add') return { title: t('home.addMagic'), sub: dailySub }
    if (route === '/practice/sub') return { title: t('home.subMagic'), sub: dailySub }
    if (route === '/concept') return { title: t('home.learnMagic'), sub: t('home.conceptAnimation') }
    if (route === '/rewards') return { title: t('home.rewards'), sub: t('home.starsCount', { count: starCount }) }
    return { title: '', sub: '' }
  }
  const getMenuTextStyle = (route: string, textColor?: string): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'absolute',
      color: textColor ?? '#FFFFFF',
      textShadow: textColor ? 'none' : '0 2px 8px rgba(0,0,0,0.24)',
      pointerEvents: 'none',
      zIndex: 2,
    }

    if (route === '/practice/add' || route === '/practice/sub') {
      return {
        ...base,
        left: '17%',
        right: '17%',
        bottom: '10%',
        textAlign: 'center',
      }
    }

    if (route === '/concept') {
      return {
        ...base,
        left: '50%',
        right: '4%',
        top: '50%',
        transform: 'translateY(-50%)',
        textAlign: 'center',
      }
    }

    if (route === '/rewards') {
      return {
        ...base,
        left: '54%',
        right: '8%',
        top: '55%',
        transform: 'translateY(-50%)',
        textAlign: 'center',
        color: '#5B3B00',
        textShadow: 'none',
      }
    }

    return {
      ...base,
      left: '7%',
      right: '14%',
      bottom: '10%',
      textAlign: 'left',
    }
  }
  const changeLanguage = (nextLanguage: SupportedLanguage) => {
    setLanguage(nextLanguage)
    const updatedProfile = { ...profile, language: nextLanguage }
    saveProfile(updatedProfile)
    setProfile(updatedProfile)
    updateChildProfileLanguage(profile.id, nextLanguage).catch(error => {
      console.warn('Could not sync profile language:', error)
    })
  }
  const changeLevel = (nextLevel: Level) => {
    const updatedProfile = { ...profile, currentLevel: nextLevel }
    saveProfile(updatedProfile)
    setProfile(updatedProfile)
    updateChildProfileLevel(profile.id, nextLevel).catch(error => {
      console.warn('Could not sync profile level:', error)
    })
  }

  return (
    <div
      className="app-container"
      style={{
        height: '100dvh',
        overflow: 'hidden',
        background:
          'radial-gradient(circle at 12% 10%, rgba(255, 232, 130, 0.52), transparent 28%), radial-gradient(circle at 88% 8%, rgba(130, 171, 255, 0.4), transparent 30%), linear-gradient(160deg, #F7FFF9 0%, #EEF8FF 45%, #F8F2FF 100%)',
      }}
    >
      <MagicBackground />

      <div className="relative z-10 flex flex-col app-with-bottom-nav" style={{ height: '100%', overflow: 'hidden' }}>
        <motion.header
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ padding: '18px 18px 10px', flexShrink: 0 }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3" style={{ minWidth: 0 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 18,
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                  fontSize: '2rem',
                  background: 'linear-gradient(135deg, #FFE7A8, #FFB56B)',
                  boxShadow: '0 8px 24px rgba(255, 181, 107, 0.38), inset 0 1px 0 rgba(255,255,255,0.75)',
                }}
              >
                📜
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ color: '#5E6178', fontSize: '0.78rem', fontWeight: 800 }}>
                  {new Date().getHours() < 12 ? t('home.morning') : new Date().getHours() < 17 ? t('home.afternoon') : t('home.evening')}
                </p>
                <h1
                  style={{
                    fontSize: '1.45rem',
                    fontWeight: 900,
                    color: '#242433',
                    lineHeight: 1.12,
                    letterSpacing: 0,
                  }}
                >
                  {t('home.title')}
                </h1>
                <p style={{ color: '#8B8DA4', fontSize: '0.78rem', fontWeight: 800, marginTop: 4 }}>
                  {t('home.subtitle', { count: subscription.dailyLimit })}
                </p>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => {
                unlockSound()
                playSound('tap')
                setCurrentProfileId('')
                navigate('/profiles')
              }}
              aria-label="프로필 바꾸기"
              style={{
                width: 58,
                height: 58,
                borderRadius: 20,
                border: '2px solid rgba(255,255,255,0.9)',
                background: 'rgba(255,255,255,0.78)',
                boxShadow: '0 8px 22px rgba(76, 106, 170, 0.18)',
                cursor: 'pointer',
                overflow: 'hidden',
                padding: 0,
                flexShrink: 0,
              }}
            >
              {charImg ? (
                <img
                  src={charImg}
                  alt={profile.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => {
                    ;(e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              ) : (
                <span style={{ fontSize: '1.8rem' }}>✨</span>
              )}
            </motion.button>
          </div>

          <div className="flex gap-2 mt-3 items-center" style={{ flexWrap: 'nowrap', overflow: 'hidden' }}>
            <select
              value={profile.currentLevel}
              onChange={event => changeLevel(event.target.value as Level)}
              aria-label={t('profile.startLevel')}
              className="level-badge"
              style={{
                height: 32,
                border: 'none',
                flex: 1,
                minWidth: 0,
                maxWidth: 240,
                fontSize: '0.78rem',
                fontWeight: 900,
                padding: '0 10px',
                outline: 'none',
                cursor: 'pointer',
                overflow: 'hidden',
              }}
            >
              {SELECTABLE_LEVELS.map(level => (
                <option key={level} value={level}>{t(`profile.levels.${level}`)}</option>
              ))}
            </select>
            {streak && streak.currentStreak > 0 && (
              <div className="streak-badge" style={{ flexShrink: 0 }}>🔥 {t('home.streakShort', { count: streak.currentStreak })}</div>
            )}
            {subscription.isPro && (
              <div style={{
                height: 32, borderRadius: 999, padding: '0 12px',
                background: 'linear-gradient(135deg,#62D6B2,#3EC99A)',
                color: '#fff', fontWeight: 900, fontSize: '0.78rem',
                display: 'flex', alignItems: 'center', gap: 4,
                flexShrink: 0,
                boxShadow: '0 3px 8px rgba(98,214,178,0.4)',
              }}>✨ PRO</div>
            )}
            <select
              value={language}
              onChange={event => changeLanguage(event.target.value as SupportedLanguage)}
              aria-label={t('common.selectLanguage')}
              style={{
                height: 32,
                borderRadius: 999,
                border: '1.5px solid rgba(255,255,255,0.9)',
                background: 'rgba(255,255,255,0.74)',
                color: '#5E6178',
                fontSize: '0.72rem',
                fontWeight: 900,
                padding: '0 6px',
                outline: 'none',
                flexShrink: 0,
                width: 82,
                boxShadow: '0 4px 12px rgba(76, 106, 170, 0.12)',
              }}
            >
              {SUPPORTED_LANGUAGES.map(lang => (
                <option key={lang} value={lang}>{LANGUAGE_LABELS[lang]}</option>
              ))}
            </select>
          </div>
        </motion.header>

        <main className="home-main" style={{ flex: 1, overflowY: 'auto', padding: '0 8px 110px' }}>
          {todayDone && (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginBottom: 12,
                padding: '10px 14px',
                borderRadius: 20,
                background: 'rgba(255,255,255,0.72)',
                border: '1.5px solid rgba(255,255,255,0.9)',
                boxShadow: '0 10px 28px rgba(82, 120, 180, 0.12)',
              }}
            >
              <div className="flex items-center gap-3">
                <span style={{ fontSize: '1.8rem' }}>🏆</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 900, color: '#242433' }}>{t('home.todayDone')}</div>
                  <div style={{ color: '#7A7D96', fontSize: '0.78rem', fontWeight: 800 }}>
                    {t('home.successCount', { correct: todayStats.correct, total: todayStats.total })}
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          <section
            className="home-menu-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 10,
              marginTop: todayDone ? 0 : 4,
            }}
          >
            {menuItems.map((item, i) => {
              const copy = getMenuCopy(item.route)
              return (
              <motion.button
                className="home-menu-card"
                key={item.route}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 + i * 0.05 }}
                whileTap={{ scale: 0.95, y: 5 }}
                onClick={() => {
                  unlockSound()
                  playSound(item.route.includes('practice') ? 'magic' : 'tap')
                  navigate(item.route)
                }}
                style={{
                  minHeight: 0,
                  aspectRatio: '1.78 / 1',
                  border: 'none',
                  borderRadius: 20,
                  padding: 0,
                  textAlign: 'left',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  background: item.gradient,
                  color: item.textColor ?? '#FFFFFF',
                  boxShadow: `0 8px 0 ${item.shadow}, 0 18px 34px ${item.glow}`,
                }}
              >
                <img
                  src={item.image}
                  alt={copy.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'block',
                    objectFit: 'cover',
                    objectPosition: 'center top',
                    pointerEvents: 'none',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.34), inset 0 -16px 22px rgba(0,0,0,0.04)',
                    pointerEvents: 'none',
                  }}
                />
                <div
                  className="home-card-text"
                  style={getMenuTextStyle(item.route, item.textColor)}
                >
                  <div className="home-card-title">{copy.title}</div>
                  <div className="home-card-sub">{copy.sub}</div>
                </div>
              </motion.button>
              )
            })}
          </section>

          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
            style={{
              marginTop: 24,
              padding: '16px 14px 18px',
              borderRadius: 28,
              background:
                'linear-gradient(135deg, rgba(255, 247, 205, 0.82), rgba(255, 238, 154, 0.38))',
              border: '1.5px solid rgba(255, 229, 116, 0.72)',
              boxShadow:
                '0 12px 28px rgba(255, 196, 62, 0.16), inset 0 1px 0 rgba(255,255,255,0.88)',
            }}
          >
            <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 900, color: '#4E3900', margin: 0 }}>
                🎁 {t('home.treasureTitle')}
              </h2>
              <span style={{ color: '#A47800', fontSize: '0.72rem', fontWeight: 900 }}>
                {t('home.collectRewards')}
              </span>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: 12,
              }}
            >
              {[
                { icon: '🪙', label: t('home.coins'), count: coinCount, color: '#FFE36E', glow: 'rgba(255, 211, 72, 0.55)' },
                { icon: '⭐', label: t('home.stars'), count: starCount, color: '#C7ADFF', glow: 'rgba(163, 130, 255, 0.42)' },
                { icon: '🏅', label: t('home.badges'), count: badgeCount, color: '#8FDBFF', glow: 'rgba(100, 190, 255, 0.42)' },
              ].map(item => (
                <div key={item.label} style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 24,
                      margin: '0 auto 8px',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: '2.1rem',
                      background: `linear-gradient(135deg, rgba(255,255,255,0.85), ${item.color})`,
                      boxShadow: `0 10px 26px ${item.glow}, inset 0 1px 0 rgba(255,255,255,0.85)`,
                      border: '1.5px solid rgba(255,255,255,0.82)',
                    }}
                  >
                    {item.icon}
                  </div>
                  <div style={{ color: '#666A84', fontSize: '0.74rem', fontWeight: 900 }}>
                    {item.label}
                  </div>
                  <div style={{ color: '#242433', fontSize: '1.25rem', fontWeight: 900 }}>
                    {item.count}
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

          {streak && (
            <motion.section
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.36 }}
              style={{
                marginTop: 18,
                padding: '16px 14px 18px',
                borderRadius: 28,
                background:
                  'linear-gradient(135deg, rgba(255,255,255,0.82), rgba(232, 244, 255, 0.78))',
                border: '1.5px solid rgba(157, 211, 255, 0.68)',
                boxShadow:
                  '0 12px 28px rgba(100, 170, 235, 0.14), inset 0 1px 0 rgba(255,255,255,0.9)',
              }}
            >
              <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 900, color: '#23486B', margin: 0 }}>
                  🔥 {t('home.streak')}
                </h2>
                <span style={{ fontSize: '0.78rem', fontWeight: 900, color: '#5B86A8' }}>
                  {t('home.streakDays', { count: streak.currentStreak })}
                </span>
              </div>
              <StreakDots streak={streak.currentStreak} />
            </motion.section>
          )}
        </main>
      </div>
      <BottomNav />
    </div>
  )
}

function StreakDots({ streak }: { streak: number }) {
  const { t } = useI18n()
  const days = [
    t('home.weekSun'),
    t('home.weekMon'),
    t('home.weekTue'),
    t('home.weekWed'),
    t('home.weekThu'),
    t('home.weekFri'),
    t('home.weekSat'),
  ]
  const today = new Date().getDay()
  const filled = Math.min(streak, 7)

  return (
    <div className="flex gap-2 justify-between">
      {days.map((day, i) => {
        const daysAgo = (today - i + 7) % 7
        const isActive = daysAgo < filled
        const isToday = i === today

        return (
          <div key={day} className="flex flex-col items-center gap-1" style={{ minWidth: 34 }}>
            <motion.div
              animate={isActive ? { scale: [1, 1.08, 1] } : {}}
              transition={{ duration: 2, delay: i * 0.08, repeat: Infinity }}
              style={{
                width: 34,
                height: 34,
                borderRadius: 12,
                display: 'grid',
                placeItems: 'center',
                fontSize: isActive ? '0.95rem' : '0.72rem',
                fontWeight: 900,
                color: isActive ? '#FFFFFF' : '#8589A1',
                background: isActive
                  ? 'linear-gradient(135deg, #FFB44E, #FF7D69)'
                  : 'rgba(255,255,255,0.62)',
                boxShadow: isActive
                  ? '0 5px 0 #D95E47, 0 8px 18px rgba(255,125,105,0.28)'
                  : '0 3px 0 rgba(185, 205, 218, 0.8)',
                outline: isToday ? '2.5px solid rgba(255,180,78,0.8)' : 'none',
                outlineOffset: 2,
              }}
            >
              {isActive ? '🔥' : day}
            </motion.div>
            <span style={{ fontSize: '0.65rem', color: '#8589A1', fontWeight: 900 }}>{day}</span>
          </div>
        )
      })}
    </div>
  )
}

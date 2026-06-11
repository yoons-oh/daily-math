import React from 'react'
import { motion } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import { playSound, unlockSound } from '../lib/sound'
import { useI18n } from '../i18n'

const ITEMS = [
  { labelKey: 'bottomNav.home', route: '/home', icon: '/nav/home.jpg' },
  { labelKey: 'bottomNav.learn', route: '/concept', icon: '/nav/concept.jpg' },
  { labelKey: 'bottomNav.rewards', route: '/rewards', icon: '/nav/rewards.jpg' },
  { labelKey: 'bottomNav.history', route: '/history', icon: '/nav/history.jpg' },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { t } = useI18n()

  return (
    <nav className="bottom-nav safe-bottom" aria-label={t('bottomNav.aria')}>
      <div className="bottom-nav-inner">
        {ITEMS.map(item => {
          const active = pathname === item.route
          return (
            <motion.button
              key={item.route}
              whileTap={{ scale: 0.92, y: 2 }}
              type="button"
              onClick={() => {
                if (active) return
                unlockSound()
                playSound('tap')
                navigate(item.route)
              }}
              className={`bottom-nav-btn ${active ? 'active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <span className="bottom-nav-icon">
                <img src={item.icon} alt="" />
              </span>
              <span className="bottom-nav-label">{t(item.labelKey)}</span>
            </motion.button>
          )
        })}
      </div>
    </nav>
  )
}

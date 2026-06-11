import React, { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChildProfile, Level } from '../lib/types'
import MagicBackground from './MagicBackground'
import { playSound, unlockSound } from '../lib/sound'
import { LANGUAGE_LABELS, SUPPORTED_LANGUAGES, useI18n } from '../i18n'
import { SupportedLanguage } from '../lib/language'

const CHARACTERS = [
  { id: 'rabbit', file: '/characters/rabbit.jpg', bg: '#FFC7D9', shadow: 'rgba(255,199,217,0.8)' },
  { id: 'fox', file: '/characters/fox.jpg', bg: '#FFE58F', shadow: 'rgba(255,229,143,0.8)' },
  { id: 'bear', file: '/characters/bear.jpg', bg: '#FFD9B4', shadow: 'rgba(255,209,180,0.8)' },
  { id: 'panda', file: '/characters/panda.jpg', bg: '#A8D8FF', shadow: 'rgba(168,216,255,0.8)' },
  { id: 'dragon', file: '/characters/dragon.jpg', bg: '#A8F0DC', shadow: 'rgba(98,214,178,0.8)' },
  { id: 'rion', file: '/characters/rion.jpg', bg: '#FFE58F', shadow: 'rgba(255,229,143,0.8)' },
  { id: 'car', file: '/characters/car.jpg', bg: '#A8D8FF', shadow: 'rgba(168,216,255,0.8)' },
  { id: 'train', file: '/characters/train.jpg', bg: '#FFC7D9', shadow: 'rgba(255,199,217,0.8)' },
  { id: 'dragon2', file: '/characters/dragon2.jpg', bg: '#A8F0DC', shadow: 'rgba(98,214,178,0.8)' },
  { id: 'unicon', file: '/characters/unicon.jpg', bg: '#C9B6FF', shadow: 'rgba(201,182,255,0.8)' },
]

const LEVEL_COLORS: Record<Level, string> = {
  L1: 'linear-gradient(135deg,#A8F0DC,#62D6B2)',
  L2A: 'linear-gradient(135deg,#A8D8FF,#5AABDC)',
  L2B: 'linear-gradient(135deg,#C9B6FF,#A891FF)',
  L3A: 'linear-gradient(135deg,#FFE58F,#F6D060)',
  L3B: 'linear-gradient(135deg,#FFC7D9,#FF99BB)',
}

const AGE_OPTIONS = Array.from({ length: 10 }, (_, index) => index + 4)
const START_LEVELS: Level[] = ['L1', 'L2A', 'L2B', 'L3A', 'L3B']
const LEVEL_ICONS: Record<Level, string> = {
  L1: '🌱',
  L2A: '🌿',
  L2B: '✨',
  L3A: '🌳',
  L3B: '🏆',
}

interface Props {
  profiles: ChildProfile[]
  onSelect: (profile: ChildProfile) => void
  onCreate: (profile: { name: string; age: number; avatar: string; currentLevel: Level; language?: SupportedLanguage }) => Promise<void>
  onProfilesChange: () => void
}

function getChar(id: string) {
  return CHARACTERS.find(c => c.id === id) ?? CHARACTERS[0]
}

function CharAvatar({
  charId,
  label,
  size = 60,
  selected = false,
}: {
  charId: string
  label: string
  size?: number
  selected?: boolean
}) {
  const char = getChar(charId)
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        background: char.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        flexShrink: 0,
        border: selected ? '3px solid #62D6B2' : '3px solid transparent',
        boxShadow: selected
          ? `0 0 0 2px #fff, 0 0 16px ${char.shadow}`
          : `0 4px 12px ${char.shadow}55`,
        transform: selected ? 'scale(1.08)' : 'scale(1)',
        transition: 'all 0.15s ease',
      }}
    >
      <img
        src={char.file}
        alt={label}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        onError={e => {
          ;(e.target as HTMLImageElement).style.display = 'none'
        }}
      />
    </div>
  )
}

export default function ProfileSelector({ profiles, onSelect, onCreate, onProfilesChange }: Props) {
  const { language, setLanguage, t } = useI18n()
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [age, setAge] = useState(7)
  const [charId, setCharId] = useState('rabbit')
  const [level, setLevel] = useState<Level>('L1')
  const [profileLanguage, setProfileLanguage] = useState<SupportedLanguage>(language)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const characterName = (id: string) => t(`profile.characters.${id}`)
  const levelName = (value: Level) => t(`profile.levels.${value}`)

  async function handleAdd() {
    if (!name.trim() || saving) return
    setSaving(true)
    setError('')

    try {
      await onCreate({
        name: name.trim(),
        age,
        avatar: charId,
        currentLevel: level,
        language: profileLanguage,
      })
      await onProfilesChange()
      setLanguage(profileLanguage)
      setShowAdd(false)
      setName('')
      setAge(7)
      setCharId('rabbit')
      setLevel('L1')
      setProfileLanguage(profileLanguage)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('profile.saveError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="app-container">
      <MagicBackground />

      <div className="relative z-10 flex flex-1 flex-col safe-top">
        <motion.div
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-6 pb-6 pt-12 text-center"
        >
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              width: 150,
              height: 112,
              margin: '0 auto 12px',
              borderRadius: 28,
              overflow: 'hidden',
              background: 'rgba(255,255,255,0.78)',
              border: '3px solid rgba(255,255,255,0.95)',
              boxShadow: '0 8px 0 #C8E8DE, 0 14px 28px rgba(98,214,178,0.22)',
            }}
          >
            <img src="/Castle-icon.jpg" alt={t('profile.title')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </motion.div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#2D2D3A' }}>{t('profile.title')}</h1>
          <p style={{ color: '#7A7A9A', marginTop: 6, fontWeight: 600 }}>{t('profile.subtitle')}</p>
        </motion.div>

        <div className="flex flex-1 flex-col gap-3 px-5">
          {profiles.map((profile, i) => (
            <motion.button
              key={profile.id}
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                unlockSound()
                playSound('magic')
                onSelect(profile)
              }}
              className="glass-card w-full text-left"
              style={{ padding: '16px 20px' }}
            >
              <div className="flex items-center gap-4">
                <CharAvatar charId={profile.avatar} label={characterName(profile.avatar)} size={60} />
                <div className="flex-1">
                  <div style={{ fontWeight: 900, fontSize: '1.15rem', color: '#2D2D3A' }}>{profile.name}</div>
                  <div style={{ color: '#7A7A9A', fontSize: '0.8rem', marginTop: 3, fontWeight: 600 }}>
                    {t('profile.ageValue', { age: profile.age })} · {levelName(profile.currentLevel)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#7A7A9A', marginTop: 2 }}>
                    {characterName(profile.avatar)}
                  </div>
                </div>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    background: 'linear-gradient(135deg,#62D6B2,#3EC99A)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '1.4rem',
                    fontWeight: 900,
                    boxShadow: '0 4px 0 #28A87A',
                  }}
                >
                  →
                </div>
              </div>
            </motion.button>
          ))}

          {profiles.length < 5 && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              onClick={() => {
                unlockSound()
                playSound('tap')
                setProfileLanguage(language)
                setShowAdd(true)
              }}
              style={{
                background: 'rgba(255,255,255,0.6)',
                backdropFilter: 'blur(12px)',
                border: '2.5px dashed #62D6B2',
                borderRadius: 24,
                padding: '18px',
                color: '#62D6B2',
                fontWeight: 800,
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <span style={{ fontSize: '1.4rem' }}>✨</span>
              {t('profile.addProfile')}
            </motion.button>
          )}
        </div>
        <div className="pb-8" />
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(45,45,58,0.55)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              zIndex: 50,
            }}
            onClick={e => {
              if (e.target === e.currentTarget) setShowAdd(false)
            }}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              style={{
                background: 'linear-gradient(160deg,#F4FFF9 0%,#EBF8FF 60%,#F5F0FF 100%)',
                width: '100%',
                maxWidth: 448,
                borderRadius: '32px 32px 0 0',
                padding: '24px 24px 36px',
                maxHeight: '92vh',
                overflowY: 'auto',
              }}
            >
              <div style={{ width: 48, height: 5, background: 'rgba(0,0,0,0.12)', borderRadius: 999, margin: '0 auto 20px' }} />

              <div className="mb-5 text-center">
                <motion.div key={charId} initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ margin: '0 auto 10px' }}>
                  <CharAvatar charId={charId} label={characterName(charId)} size={100} selected />
                </motion.div>
                <div style={{ fontWeight: 900, fontSize: '1.1rem', color: '#2D2D3A' }}>{characterName(charId)}</div>
                <h2 style={{ fontWeight: 700, fontSize: '0.9rem', color: '#7A7A9A', marginTop: 4 }}>{t('profile.createTitle')}</h2>
              </div>

              <div className="mb-5">
                <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#7A7A9A', marginBottom: 10, display: 'block' }}>
                  {t('profile.character')}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8 }}>
                  {CHARACTERS.map(character => (
                    <motion.button
                      key={character.id}
                      whileTap={{ scale: 0.88 }}
                      onClick={() => {
                        playSound('tap')
                        setCharId(character.id)
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <CharAvatar charId={character.id} label={characterName(character.id)} size={52} selected={charId === character.id} />
                      <span
                        style={{
                          fontSize: '0.62rem',
                          fontWeight: 700,
                          color: charId === character.id ? '#62D6B2' : '#7A7A9A',
                          textAlign: 'center',
                          lineHeight: 1.2,
                        }}
                      >
                        {characterName(character.id)}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>

              <FieldLabel>{t('common.selectLanguage')}</FieldLabel>
              <select
                value={profileLanguage}
                onChange={e => setProfileLanguage(e.target.value as SupportedLanguage)}
                className="mb-4"
                style={fieldStyle}
              >
                {SUPPORTED_LANGUAGES.map(lang => (
                  <option key={lang} value={lang}>{LANGUAGE_LABELS[lang]}</option>
                ))}
              </select>

              <FieldLabel>{t('profile.name')}</FieldLabel>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={10}
                placeholder={t('profile.namePlaceholder')}
                className="mb-4"
                style={fieldStyle}
              />

              <FieldLabel>{t('profile.age')}</FieldLabel>
              <select
                value={age}
                onChange={e => {
                  playSound('tap')
                  setAge(Number(e.target.value))
                }}
                className="mb-4"
                style={fieldStyle}
              >
                {AGE_OPTIONS.map(value => (
                  <option key={value} value={value}>{t('profile.ageValue', { age: value })}</option>
                ))}
              </select>

              <FieldLabel>{t('profile.startLevel')}</FieldLabel>
              <div className="mb-6 flex flex-col gap-2">
                {START_LEVELS.map(value => (
                  <motion.button
                    key={value}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      playSound('tap')
                      setLevel(value)
                    }}
                    style={{
                      padding: '14px 18px',
                      borderRadius: 16,
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      background: level === value ? LEVEL_COLORS[value] : 'rgba(255,255,255,0.65)',
                      color: level === value ? '#fff' : '#7A7A9A',
                      boxShadow: level === value ? '0 4px 12px rgba(98,214,178,0.3)' : '0 2px 8px rgba(0,0,0,0.04)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{LEVEL_ICONS[value]}</span>
                    {levelName(value)}
                  </motion.button>
                ))}
              </div>

              {error && (
                <div
                  style={{
                    marginBottom: 14,
                    borderRadius: 16,
                    border: '2px solid #fecaca',
                    background: '#fef2f2',
                    color: '#dc2626',
                    padding: '12px 14px',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                  }}
                >
                  {error}
                </div>
              )}

              <motion.button
                whileTap={{ scale: 0.97, y: 4 }}
                onClick={() => {
                  playSound('magic')
                  handleAdd()
                }}
                disabled={!name.trim() || saving}
                className="jelly-btn"
                style={{ width: '100%', opacity: name.trim() && !saving ? 1 : 0.45, fontSize: '1.05rem' }}
              >
                🏰 {saving ? t('common.processing') : t('profile.start')}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#7A7A9A', marginBottom: 8, display: 'block' }}>
      {children}
    </label>
  )
}

const fieldStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.85)',
  backdropFilter: 'blur(8px)',
  border: '2px solid rgba(98,214,178,0.3)',
  borderRadius: 16,
  padding: '14px 18px',
  fontSize: '1rem',
  fontWeight: 700,
  color: '#2D2D3A',
  outline: 'none',
  fontFamily: 'Nunito, Noto Sans KR, sans-serif',
}

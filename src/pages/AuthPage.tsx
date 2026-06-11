import React, { FormEvent, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useI18n, LANGUAGE_LABELS, SUPPORTED_LANGUAGES } from '../i18n'
import { signInWithEmail, signUpWithEmail, resetPassword } from '../lib/auth'
import { saveAuthSelectedLanguage, SupportedLanguage } from '../lib/language'

type AuthMode = 'login' | 'signup' | 'reset'

interface AuthPageProps {
  isAuthed: boolean
}

function getErrorKey(error: unknown) {
  const message = error instanceof Error ? error.message : ''

  if (message.includes('Invalid login credentials')) return 'auth.invalidLogin'
  if (message.includes('User already registered')) return 'auth.alreadyRegistered'
  if (message.includes('Password should be')) return 'auth.weakPassword'
  if (message.includes('Unable to validate email address')) return 'auth.invalidEmail'
  if (message.includes('Email not confirmed')) return 'auth.emailNotConfirmed'

  return message || 'auth.unknownError'
}

export default function AuthPage({ isAuthed }: AuthPageProps) {
  const navigate = useNavigate()
  const { language, setLanguage, t } = useI18n()
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAuthed) return <Navigate to="/" replace />

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode)
    setError('')
    setNotice('')
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setNotice('')
    setLoading(true)
    saveAuthSelectedLanguage(language)

    try {
      if (mode === 'login') {
        await signInWithEmail(email, password)
        navigate('/', { replace: true })
      }

      if (mode === 'signup') {
        const result = await signUpWithEmail(email, password)
        if (result.session) {
          navigate('/', { replace: true })
        } else {
          setNotice(t('auth.signupNotice'))
          setMode('login')
        }
      }

      if (mode === 'reset') {
        await resetPassword(email)
        setNotice(t('auth.resetNotice'))
      }
    } catch (e) {
      const errorKey = getErrorKey(e)
      setError(errorKey.startsWith('auth.') ? t(errorKey) : errorKey)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="app-container justify-center px-5 py-8">
      <section className="relative z-10">
        <div className="text-center mb-7">
          <div
            className="mx-auto mb-4 h-24 w-24 overflow-hidden rounded-[28px]"
            style={{
              background: 'rgba(255,255,255,0.86)',
              border: '3px solid rgba(255,255,255,0.95)',
              boxShadow: '0 8px 0 #28A87A, 0 12px 28px rgba(98,214,178,0.35)',
            }}
          >
            <img src="/main-icon.jpg" alt={t('common.appName')} className="h-full w-full object-cover" />
          </div>
          <h1 className="text-3xl font-black text-[#2D2D3A]">{t('common.appName')}</h1>
          <p className="mt-2 text-sm font-bold text-[#7A7A9A]">{t('auth.tagline')}</p>
        </div>

        <label className="mb-4 block rounded-[22px] bg-white/70 p-3 shadow-sm">
          <span className="mb-2 block text-xs font-black text-[#7A7A9A]">{t('common.selectLanguage')}</span>
          <select
            value={language}
            onChange={event => {
              const nextLanguage = event.target.value as SupportedLanguage
              setLanguage(nextLanguage)
              saveAuthSelectedLanguage(nextLanguage)
            }}
            className="w-full rounded-[16px] border-2 border-white bg-white/90 px-4 py-3 font-black text-[#2D2D3A] outline-none focus:border-[#62D6B2]"
          >
            {SUPPORTED_LANGUAGES.map(lang => (
              <option key={lang} value={lang}>{LANGUAGE_LABELS[lang]}</option>
            ))}
          </select>
        </label>

        {mode !== 'reset' ? (
          <div className="mb-5 grid grid-cols-2 gap-2 rounded-[22px] bg-white/70 p-1.5 shadow-sm">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`rounded-[18px] py-3 font-black transition ${
                mode === 'login' ? 'bg-[#62D6B2] text-white shadow-md' : 'text-[#7A7A9A]'
              }`}
            >
              {t('auth.login')}
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={`rounded-[18px] py-3 font-black transition ${
                mode === 'signup' ? 'bg-[#62D6B2] text-white shadow-md' : 'text-[#7A7A9A]'
              }`}
            >
              {t('auth.signup')}
            </button>
          </div>
        ) : (
          <div className="mb-5 text-center">
            <h2 className="text-xl font-black text-[#2D2D3A]">{t('auth.resetTitle')}</h2>
            <p className="mt-1 text-sm font-bold text-[#7A7A9A]">{t('auth.resetDesc')}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="glass-card space-y-4 p-5">
          <label className="block">
            <span className="mb-1 block text-sm font-black text-[#2D2D3A]">{t('common.email')}</span>
            <input
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              placeholder="email@example.com"
              required
              className="w-full rounded-[18px] border-2 border-white bg-white/90 px-4 py-3 font-bold outline-none focus:border-[#62D6B2]"
            />
          </label>

          {mode !== 'reset' && (
            <label className="block">
              <span className="mb-1 block text-sm font-black text-[#2D2D3A]">{t('common.password')}</span>
              <input
                type="password"
                value={password}
                onChange={event => setPassword(event.target.value)}
                placeholder={t('auth.passwordPlaceholder')}
                required
                minLength={6}
                className="w-full rounded-[18px] border-2 border-white bg-white/90 px-4 py-3 font-bold outline-none focus:border-[#62D6B2]"
              />
            </label>
          )}

          {mode === 'login' && (
            <button
              type="button"
              onClick={() => switchMode('reset')}
              className="ml-auto block text-sm font-black text-[#3EC99A]"
            >
              {t('auth.forgotPassword')}
            </button>
          )}

          {error && (
            <div className="rounded-[18px] border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
              {error}
            </div>
          )}

          {notice && (
            <div className="rounded-[18px] border-2 border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
              {notice}
            </div>
          )}

          <button type="submit" disabled={loading} className="jelly-btn w-full disabled:cursor-not-allowed disabled:opacity-60">
            {loading
              ? t('common.processing')
              : mode === 'login'
                ? t('auth.login')
                : mode === 'signup'
                  ? t('auth.signup')
                  : t('auth.resetSend')}
          </button>

          {mode === 'reset' && (
            <button type="button" onClick={() => switchMode('login')} className="w-full py-2 text-sm font-black text-[#7A7A9A]">
              {t('auth.backToLogin')}
            </button>
          )}
        </form>
      </section>
    </main>
  )
}

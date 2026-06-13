import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { User } from '@supabase/supabase-js'
import ProfilePage    from './pages/ProfilePage'
import AuthPage       from './pages/AuthPage'
import Home           from './pages/Home'
import PracticePage   from './pages/PracticePage'
import ResultPage     from './pages/ResultPage'
import ReviewPage     from './pages/ReviewPage'
import ConceptPage    from './pages/ConceptPage'
import RewardsPage    from './pages/RewardsPage'
import HistoryPage    from './pages/HistoryPage'
import SubscribePage  from './pages/SubscribePage'
import SubscribeSuccessPage from './pages/SubscribeSuccessPage'
import TimesTablePage from './pages/TimesTablePage'
import TimesTableStudyPage from './pages/TimesTableStudyPage'
import TimesTableTestPage from './pages/TimesTableTestPage'
import { getCurrentProfileId, replaceProfiles, saveProfile } from './lib/storage'
import { onAuthStateChange } from './lib/auth'
import { fetchChildProfiles, updateChildProfileLanguage } from './lib/childProfiles'
import { I18nProvider, useI18n } from './i18n'
import { consumeAuthSelectedLanguage, getAuthSelectedLanguage } from './lib/language'

function AuthRedirect() {
  const navigate = useNavigate()
  const { language, setLanguage } = useI18n()

  useEffect(() => {
    const redirect = async () => {
      try {
        const authLanguage = getAuthSelectedLanguage()
        const profiles = await fetchChildProfiles()
        replaceProfiles(profiles)
        const id = getCurrentProfileId()
        const currentProfile = id ? profiles.find(profile => profile.id === id) : null

        if (currentProfile) {
          const nextLanguage = authLanguage ?? currentProfile.language ?? language
          if (nextLanguage !== language) setLanguage(nextLanguage)
          if (currentProfile.language !== nextLanguage) {
            const updatedProfile = { ...currentProfile, language: nextLanguage }
            saveProfile(updatedProfile)
            updateChildProfileLanguage(currentProfile.id, nextLanguage).catch(error => {
              console.warn('Could not sync profile language:', error)
            })
          }
          if (authLanguage) consumeAuthSelectedLanguage()
          navigate('/home', { replace: true })
        } else {
          if (authLanguage && authLanguage !== language) setLanguage(authLanguage)
          navigate('/profiles', { replace: true })
        }
      } catch {
        navigate('/profiles', { replace: true })
      }
    }

    redirect()
  }, [language, navigate, setLanguage])
  return null
}

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChange(nextUser => {
      setUser(nextUser)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  return (
    <I18nProvider>
      {loading ? (
        <LoadingScreen />
      ) : (
      <BrowserRouter>
        <Routes>
        <Route path="/auth"        element={<AuthPage isAuthed={Boolean(user)} />} />
        <Route path="/"            element={user ? <AuthRedirect /> : <Navigate to="/auth" replace />} />
        <Route path="/profiles"    element={user ? <ProfilePage /> : <Navigate to="/auth" replace />} />
        <Route path="/home"        element={user ? <Home /> : <Navigate to="/auth" replace />} />
        <Route path="/practice/:op" element={user ? <PracticePage /> : <Navigate to="/auth" replace />} />
        <Route path="/result"      element={user ? <ResultPage /> : <Navigate to="/auth" replace />} />
        <Route path="/review"      element={user ? <ReviewPage /> : <Navigate to="/auth" replace />} />
        <Route path="/concept"     element={user ? <ConceptPage /> : <Navigate to="/auth" replace />} />
        <Route path="/rewards"     element={user ? <RewardsPage /> : <Navigate to="/auth" replace />} />
        <Route path="/history"     element={user ? <HistoryPage /> : <Navigate to="/auth" replace />} />
        <Route path="/subscribe"         element={user ? <SubscribePage /> : <Navigate to="/auth" replace />} />
        <Route path="/subscribe/success" element={user ? <SubscribeSuccessPage /> : <Navigate to="/auth" replace />} />
        <Route path="/times-table"           element={user ? <TimesTablePage /> : <Navigate to="/auth" replace />} />
        <Route path="/times-table/:dan/test" element={user ? <TimesTableTestPage /> : <Navigate to="/auth" replace />} />
        <Route path="/times-table/:dan"      element={user ? <TimesTableStudyPage /> : <Navigate to="/auth" replace />} />
        <Route path="*"            element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      )}
    </I18nProvider>
  )
}

function LoadingScreen() {
  const { t } = useI18n()

  return (
    <div className="app-container items-center justify-center">
      <div className="glass-card px-6 py-5 text-center font-black text-[#2D2D3A]">
        {t('common.loading')}
      </div>
    </div>
  )
}

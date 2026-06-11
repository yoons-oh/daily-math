import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ProfileSelector from '../components/ProfileSelector'
import { ChildProfile } from '../lib/types'
import {
  getProfiles, replaceProfiles, saveProfile, setCurrentProfileId
} from '../lib/storage'
import { signOut } from '../lib/auth'
import { createChildProfile, fetchChildProfiles, NewChildProfile, updateChildProfileLanguage } from '../lib/childProfiles'
import { useI18n } from '../i18n'
import { consumeAuthSelectedLanguage, getAuthSelectedLanguage } from '../lib/language'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { language, setLanguage, t } = useI18n()
  const [profiles, setProfiles] = useState<ChildProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const authLanguage = getAuthSelectedLanguage()
    if (authLanguage && authLanguage !== language) setLanguage(authLanguage)
    loadProfiles()
  }, [])

  async function loadProfiles() {
    setLoading(true)
    setError('')

    try {
      const remoteProfiles = await fetchChildProfiles()
      replaceProfiles(remoteProfiles)
      setProfiles(getProfiles())
    } catch (e) {
      setProfiles(getProfiles())
      setError(e instanceof Error ? e.message : t('profile.loadError'))
    } finally {
      setLoading(false)
    }
  }

  function handleSelect(profile: ChildProfile) {
    const authLanguage = consumeAuthSelectedLanguage()
    const nextLanguage = authLanguage ?? profile.language ?? language
    const selectedProfile = profile.language === nextLanguage ? profile : { ...profile, language: nextLanguage }

    setCurrentProfileId(profile.id)
    saveProfile(selectedProfile)
    setLanguage(nextLanguage)
    if (profile.language !== nextLanguage) {
      updateChildProfileLanguage(profile.id, nextLanguage).catch(error => {
        console.warn('Could not sync profile language:', error)
      })
    }
    navigate('/home')
  }

  async function handleCreate(profile: NewChildProfile) {
    const created = await createChildProfile({ ...profile, language: profile.language ?? language })
    saveProfile(created)
    setProfiles(getProfiles())
  }

  async function handleLogout() {
    setCurrentProfileId('')
    await signOut()
    navigate('/auth', { replace: true })
  }

  return (
    <>
      <div className="fixed left-1/2 top-4 z-30 flex w-full max-w-md -translate-x-1/2 justify-end px-4">
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-full bg-white/80 px-4 py-2 text-sm font-black text-[#7A7A9A] shadow-sm"
        >
          {t('profile.logout')}
        </button>
      </div>
      <ProfileSelector
        profiles={profiles}
        onSelect={handleSelect}
        onCreate={handleCreate}
        onProfilesChange={loadProfiles}
      />
      {loading && (
        <div className="fixed left-1/2 top-16 z-30 -translate-x-1/2 rounded-full bg-white/90 px-4 py-2 text-sm font-black text-[#7A7A9A] shadow-sm">
          {t('profile.loading')}
        </div>
      )}
      {error && (
        <div className="fixed bottom-4 left-1/2 z-30 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-[18px] border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-600 shadow-sm">
          {error}
        </div>
      )}
    </>
  )
}

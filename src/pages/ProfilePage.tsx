import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ProfileSelector from '../components/ProfileSelector'
import { ChildProfile } from '../lib/types'
import {
  getProfiles, setCurrentProfileId
} from '../lib/storage'

export default function ProfilePage() {
  const navigate = useNavigate()
  const [profiles, setProfiles] = useState<ChildProfile[]>([])

  useEffect(() => {
    setProfiles(getProfiles())
  }, [])

  function handleSelect(profile: ChildProfile) {
    setCurrentProfileId(profile.id)
    navigate('/home')
  }

  return (
    <ProfileSelector
      profiles={profiles}
      onSelect={handleSelect}
      onProfilesChange={() => setProfiles(getProfiles())}
    />
  )
}

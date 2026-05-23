import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import ProfilePage    from './pages/ProfilePage'
import Home           from './pages/Home'
import PracticePage   from './pages/PracticePage'
import ResultPage     from './pages/ResultPage'
import ReviewPage     from './pages/ReviewPage'
import ConceptPage    from './pages/ConceptPage'
import RewardsPage    from './pages/RewardsPage'
import { getCurrentProfileId } from './lib/storage'

function AuthRedirect() {
  const navigate = useNavigate()
  useEffect(() => {
    const id = getCurrentProfileId()
    if (id) navigate('/home', { replace: true })
    else navigate('/profiles', { replace: true })
  }, [])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"            element={<AuthRedirect />} />
        <Route path="/profiles"    element={<ProfilePage />} />
        <Route path="/home"        element={<Home />} />
        <Route path="/practice/:op" element={<PracticePage />} />
        <Route path="/result"      element={<ResultPage />} />
        <Route path="/review"      element={<ReviewPage />} />
        <Route path="/concept"     element={<ConceptPage />} />
        <Route path="/rewards"     element={<RewardsPage />} />
        <Route path="*"            element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

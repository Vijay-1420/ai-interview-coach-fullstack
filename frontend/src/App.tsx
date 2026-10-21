import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { LoadingSpinner } from './components/ui'

const Analytics = lazy(() => import('./pages/Analytics'))
const ActiveInterview = lazy(() => import('./pages/ActiveInterview'))
const ChatHistory = lazy(() => import('./pages/ChatHistory'))
const ChatInterview = lazy(() => import('./pages/ChatInterview'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const History = lazy(() => import('./pages/History'))
const InterviewSetup = lazy(() => import('./pages/InterviewSetup'))
const LandingPage = lazy(() => import('./pages/LandingPage'))
const Results = lazy(() => import('./pages/Results'))

function App() {
  const location = useLocation()

  return (
    <>
      <div key={location.pathname} className="page-enter">
        <Suspense fallback={<main className="min-h-screen bg-[#FAF8F3] px-6 pt-24"><LoadingSpinner message="Getting your workspace ready..." /></main>}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/interview/setup" element={<InterviewSetup />} />
            <Route path="/chat-interview/:sessionId" element={<ChatInterview />} />
            <Route path="/chat-interviews" element={<ChatHistory />} />
            <Route path="/interview/:sessionId" element={<ActiveInterview />} />
            <Route path="/results/:sessionId" element={<Results />} />
            <Route path="/history" element={<History />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            border: '1px solid #dbe7df',
            borderRadius: '14px',
            background: '#fff',
            color: '#183b2c',
            fontSize: '14px',
          },
        }}
      />
    </>
  )
}

export default App

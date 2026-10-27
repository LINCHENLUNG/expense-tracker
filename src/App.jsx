import { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { TransactionsProvider } from './context/TransactionsContext'
import { BudgetsProvider } from './context/BudgetsContext'
import { CardsProvider } from './context/CardsContext'
import { FinancialHealthProvider } from './context/FinancialHealthContext'
import Header from './components/Header'
import BottomTabBar from './components/BottomTabBar'
import TrackingScreen from './screens/TrackingScreen'
import CashbackScreen from './screens/CashbackScreen'
import WelcomeScreen from './screens/WelcomeScreen'
import AuthScreen from './screens/AuthScreen'

function AppShell() {
  const [activeTab, setActiveTab] = useState('tracking')
  const [showAuth, setShowAuth] = useState(false)
  const { user, loading } = useAuth()

  // Whenever there's no signed-in user (initial load, or after sign-out),
  // land back on the welcome screen rather than staying on sign-in. Reset
  // during render (not an effect) — see "adjusting state on prop change"
  // in the React docs.
  const [prevUser, setPrevUser] = useState(user)
  if (user !== prevUser) {
    setPrevUser(user)
    if (!user) setShowAuth(false)
  }

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#F5F6F4]">
        <p className="text-sm text-gray-400">載入中…</p>
      </div>
    )
  }

  if (!user) {
    return showAuth ? <AuthScreen /> : <WelcomeScreen onGetStarted={() => setShowAuth(true)} />
  }

  return (
    <TransactionsProvider>
      <BudgetsProvider>
        <CardsProvider>
          <FinancialHealthProvider>
            <div className="min-h-svh bg-[#F5F6F4] sm:py-6">
              <div className="relative mx-auto min-h-svh max-w-md overflow-hidden bg-[#F5F6F4] sm:min-h-[720px] sm:rounded-3xl sm:shadow-xl">
                <Header />
                <main className="pb-24">
                  {activeTab === 'tracking' ? <TrackingScreen /> : <CashbackScreen />}
                </main>
                <BottomTabBar activeTab={activeTab} onChange={setActiveTab} />
              </div>
            </div>
          </FinancialHealthProvider>
        </CardsProvider>
      </BudgetsProvider>
    </TransactionsProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  )
}

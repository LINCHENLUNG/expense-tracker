import { createContext, useContext, useEffect, useState } from 'react'
import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from './AuthContext'

const FinancialHealthContext = createContext(null)

export function FinancialHealthProvider({ children }) {
  const { user } = useAuth()
  // yearMonth ("2026-08") -> {balanceRatio, adviceText}
  const [snapshots, setSnapshots] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const unsubscribe = onSnapshot(collection(db, 'users', user.uid, 'financialHealthSnapshots'), (snapshot) => {
      const next = {}
      snapshot.docs.forEach((docSnap) => {
        next[docSnap.id] = docSnap.data()
      })
      setSnapshots(next)
      setLoading(false)
    })
    return unsubscribe
  }, [user])

  // Upserts the given month's summary — used to auto-save the current
  // month's live-computed ratio/advice as it changes (see FinancialHealthSection).
  async function saveSnapshot(yearMonth, data) {
    await setDoc(
      doc(db, 'users', user.uid, 'financialHealthSnapshots', yearMonth),
      { ...data, createdAt: new Date() },
      { merge: true },
    )
  }

  return (
    <FinancialHealthContext.Provider value={{ snapshots, loading, saveSnapshot }}>
      {children}
    </FinancialHealthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFinancialHealthHistory() {
  const ctx = useContext(FinancialHealthContext)
  if (!ctx) throw new Error('useFinancialHealthHistory must be used within a FinancialHealthProvider')
  return ctx
}

import { createContext, useContext, useEffect, useState } from 'react'
import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { DEFAULT_BUDGET_LIMITS } from '../lib/budgets'
import { useAuth } from './AuthContext'

const BudgetsContext = createContext(null)

// Doc id previously reserved for a manually-set overall monthly budget.
// The overall budget is now always derived as the sum of category limits
// (see overallLimit below), but this id is still excluded from `budgets`
// in case an old `_overall` doc lingers in Firestore.
const OVERALL_DOC_ID = '_overall'

export function BudgetsProvider({ children }) {
  const { user } = useAuth()
  const [overrides, setOverrides] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const unsubscribe = onSnapshot(collection(db, 'users', user.uid, 'budgets'), (snapshot) => {
      const next = {}
      snapshot.docs.forEach((docSnap) => {
        if (docSnap.id !== OVERALL_DOC_ID) {
          next[docSnap.id] = docSnap.data().limit
        }
      })
      setOverrides(next)
      setLoading(false)
    })
    return unsubscribe
  }, [user])

  const budgets = { ...DEFAULT_BUDGET_LIMITS, ...overrides }

  // The overall budget is always the sum of all category limits — there is
  // no separate manual entry for it.
  const overallLimit = Object.values(budgets).reduce((sum, limit) => sum + limit, 0)

  // Persists one limit per category (Firestore doc id = category name), so
  // categories the user hasn't customized keep DEFAULT_BUDGET_LIMITS.
  async function setBudgetLimits(limitsByCategory) {
    await Promise.all(
      Object.entries(limitsByCategory).map(([category, limit]) =>
        setDoc(doc(db, 'users', user.uid, 'budgets', category), { limit }, { merge: true }),
      ),
    )
  }

  return (
    <BudgetsContext.Provider value={{ budgets, overallLimit, loading, setBudgetLimits }}>
      {children}
    </BudgetsContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useBudgets() {
  const ctx = useContext(BudgetsContext)
  if (!ctx) throw new Error('useBudgets must be used within a BudgetsProvider')
  return ctx
}

import { createContext, useContext, useEffect, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from './AuthContext'

const TransactionsContext = createContext(null)

export function TransactionsProvider({ children }) {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'users', user.uid, 'transactions'), orderBy('date', 'desc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTransactions(
        snapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data,
            date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
          }
        }),
      )
      setLoading(false)
    })
    return unsubscribe
  }, [user])

  // `transaction` is {amount, category, date, type: 'expense'|'income', note?, source, cardId}.
  // Must already be user-reviewed in AddTransactionForm's editable fields —
  // never call this directly from an unreviewed AI response.
  async function addTransaction(transaction) {
    await addDoc(collection(db, 'users', user.uid, 'transactions'), {
      ...transaction,
      date: new Date(transaction.date),
      createdAt: serverTimestamp(),
    })
  }

  // Same shape as `addTransaction`'s argument. Must already be
  // user-reviewed in AddTransactionForm's editable fields, same as add.
  async function updateTransaction(id, transaction) {
    await updateDoc(doc(db, 'users', user.uid, 'transactions', id), {
      ...transaction,
      date: new Date(transaction.date),
    })
  }

  async function deleteTransaction(id) {
    await deleteDoc(doc(db, 'users', user.uid, 'transactions', id))
  }

  return (
    <TransactionsContext.Provider
      value={{ transactions, loading, addTransaction, updateTransaction, deleteTransaction }}
    >
      {children}
    </TransactionsContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTransactions() {
  const ctx = useContext(TransactionsContext)
  if (!ctx) throw new Error('useTransactions must be used within a TransactionsProvider')
  return ctx
}

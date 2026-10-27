import { createContext, useContext, useEffect, useState } from 'react'
import { addDoc, collection, deleteDoc, doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from './AuthContext'
import { CATEGORIES, OTHER_CATEGORY } from '../lib/categories'

// Every card's rate table covers all expense categories (income never earns
// cashback — see cashback.js), each starting at 0% until the user sets it.
function zeroRates() {
  return Object.fromEntries(
    [...CATEGORIES.filter((c) => c.type === 'expense'), OTHER_CATEGORY].map((c) => [c.key, 0]),
  )
}

const CardsContext = createContext(null)

export function CardsProvider({ children }) {
  const { user } = useAuth()
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const unsubscribe = onSnapshot(collection(db, 'users', user.uid, 'cards'), (snapshot) => {
      setCards(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })))
      setLoading(false)
    })
    return unsubscribe
  }, [user])

  // `card` is {name, lastFour}. Rates start at 0% and are set afterward via
  // updateCardRates.
  async function addCard(card) {
    await addDoc(collection(db, 'users', user.uid, 'cards'), {
      ...card,
      rates: zeroRates(),
    })
  }

  async function updateCardRates(cardId, rates) {
    await updateDoc(doc(db, 'users', user.uid, 'cards', cardId), { rates })
  }

  async function deleteCard(cardId) {
    await deleteDoc(doc(db, 'users', user.uid, 'cards', cardId))
  }

  return (
    <CardsContext.Provider value={{ cards, loading, addCard, updateCardRates, deleteCard }}>
      {children}
    </CardsContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCards() {
  const ctx = useContext(CardsContext)
  if (!ctx) throw new Error('useCards must be used within a CardsProvider')
  return ctx
}

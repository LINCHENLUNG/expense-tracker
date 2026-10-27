import { useState } from 'react'
import { useTransactions } from '../context/TransactionsContext'
import { useCards } from '../context/CardsContext'
import { calculateCashback } from '../lib/cashback'
import { CATEGORIES, OTHER_CATEGORY } from '../lib/categories'
import { formatCurrency } from '../lib/currency'

const RATE_CATEGORIES = [...CATEGORIES.filter((c) => c.type === 'expense'), OTHER_CATEGORY]

function CardRatesEditor({ card }) {
  const { updateCardRates } = useCards()
  const [draft, setDraft] = useState(
    Object.fromEntries(RATE_CATEGORIES.map((c) => [c.key, String((card.rates[c.key] ?? 0) * 100)])),
  )

  function handleBlur() {
    const rates = Object.fromEntries(Object.entries(draft).map(([key, value]) => [key, (Number(value) || 0) / 100]))
    updateCardRates(card.id, rates)
  }

  return (
    <div className="rounded-2xl card p-4">
      <p className="mb-3 text-sm font-semibold">
        {card.name} · 回饋設定
        {card.lastFour && <span className="text-gray-400"> ····{card.lastFour}</span>}
      </p>
      <div className="space-y-3">
        {RATE_CATEGORIES.map((c) => (
          <div key={c.key} className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{c.label}</span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="0"
                step="0.1"
                className="w-16 rounded-lg border border-gray-200 px-2 py-1.5 text-right"
                value={draft[c.key]}
                onChange={(e) => setDraft({ ...draft, [c.key]: e.target.value })}
                onBlur={handleBlur}
              />
              <span className="text-gray-400">%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AddCardForm({ onClose }) {
  const { addCard } = useCards()
  const [name, setName] = useState('')
  const [lastFour, setLastFour] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await addCard({ name, lastFour: lastFour.trim() || null })
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
      <div className="w-full max-w-md space-y-4 rounded-t-2xl bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">新增信用卡</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-500"
          >
            ×
          </button>
        </div>
        <form className="space-y-3" onSubmit={handleSubmit}>
          <input
            type="text"
            required
            placeholder="卡片名稱，例如：VIBE 卡"
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            placeholder="卡號末四碼（選填）"
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
            value={lastFour}
            onChange={(e) => setLastFour(e.target.value)}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-emerald-500 py-3 font-medium text-white disabled:opacity-50"
          >
            {busy ? '儲存中…' : '新增'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function CashbackScreen() {
  const { transactions } = useTransactions()
  const { cards, loading } = useCards()
  const [showAddCard, setShowAddCard] = useState(false)
  const cashback = calculateCashback(transactions, cards)

  return (
    <div className="space-y-4 px-4 pb-4 pt-2">
      {!loading && cards.length === 0 && (
        <div className="rounded-2xl card p-4 text-center text-sm text-gray-400">
          還沒有信用卡，新增一張開始追蹤回饋
        </div>
      )}

      {cards.map((card) => (
        <CardRatesEditor key={card.id} card={card} />
      ))}

      <button
        type="button"
        onClick={() => setShowAddCard(true)}
        className="w-full rounded-xl bg-emerald-500 py-3 font-medium text-white"
      >
        + 新增另一張卡
      </button>

      <div className="rounded-2xl card p-4">
        <p className="text-sm text-gray-500">本月累積回饋</p>
        <p className="mt-1 text-2xl font-bold text-emerald-600">{formatCurrency(cashback)}</p>
        <p className="mt-2 text-xs text-gray-400">
          依本月支出 × 消費卡片的分類回饋率即時計算，每記一筆帳都會自動累積。
        </p>
      </div>

      {showAddCard && <AddCardForm onClose={() => setShowAddCard(false)} />}
    </div>
  )
}

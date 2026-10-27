import { useState } from 'react'
import { useTransactions } from '../context/TransactionsContext'
import { useCards } from '../context/CardsContext'
import { parseTransactionWithGemini } from '../lib/gemini'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../lib/categories'

function pad(n) {
  return String(n).padStart(2, '0')
}
const today = (date = new Date()) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
const nowTime = (date = new Date()) => `${pad(date.getHours())}:${pad(date.getMinutes())}`

// `transaction` (optional): an existing transaction to edit, pre-filling every
// field below. Omit to add a new one. Either way, saving goes through
// TransactionsContext (addTransaction/updateTransaction) — the single write
// path — never a separate ad hoc Firestore call.
export default function AddTransactionForm({ transaction = null, onClose }) {
  const { addTransaction, updateTransaction, deleteTransaction } = useTransactions()
  const { cards } = useCards()
  const isEditing = Boolean(transaction)
  const [mode, setMode] = useState('manual') // 'manual' | 'ai' — edit mode never offers 'ai'
  const [type, setType] = useState(transaction?.type ?? 'expense') // 'expense' | 'income'
  const [source, setSource] = useState(transaction?.source ?? 'manual')
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : '')
  const [category, setCategory] = useState(transaction?.category ?? EXPENSE_CATEGORIES[0].key)
  const [note, setNote] = useState(transaction?.note ?? '')
  const [date, setDate] = useState(today(transaction?.date))
  const [time, setTime] = useState(nowTime(transaction?.date))
  const [cardId, setCardId] = useState(transaction?.cardId ?? null)
  const [aiText, setAiText] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const categoryOptions = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES

  function handleTypeChange(nextType) {
    setType(nextType)
    const options = nextType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES
    setCategory(options[0].key)
  }

  async function handleAiParse(e) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const parsed = await parseTransactionWithGemini(aiText)
      setAmount(String(parsed.amount))
      setCategory(parsed.category)
      setDate(parsed.date ?? today())
      setTime(nowTime())
      setSource('ai')
      setMode('manual')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleSave(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      // The fields below are always user-editable up to this point — this
      // Save action is the confirmation, whether the draft came from typing
      // or from an AI parse.
      const payload = {
        amount: Number(amount),
        category,
        date: new Date(`${date}T${time}`),
        type,
        note: note.trim() || null,
        source,
        cardId,
      }
      if (isEditing) {
        await updateTransaction(transaction.id, payload)
      } else {
        await addTransaction(payload)
      }
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    setBusy(true)
    setError(null)
    try {
      await deleteTransaction(transaction.id)
      onClose()
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
      <div className="w-full max-w-md max-h-[90%] space-y-4 overflow-y-auto rounded-t-2xl bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">{isEditing ? '編輯交易' : '新增交易'}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-500"
          >
            ×
          </button>
        </div>

        <div className="flex gap-2">
          {[
            { key: 'expense', label: '支出' },
            { key: 'income', label: '收入' },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => handleTypeChange(t.key)}
              className={`flex-1 rounded-xl py-2.5 text-sm font-semibold border ${
                type === t.key
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : 'bg-white border-gray-200 text-gray-500'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {mode === 'ai' ? (
          <form className="space-y-3" onSubmit={handleAiParse}>
            <textarea
              required
              rows={3}
              placeholder="例如：早餐咖啡 120 元"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              value={aiText}
              onChange={(e) => setAiText(e.target.value)}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-emerald-500 py-3 font-medium text-white disabled:opacity-50"
            >
              {busy ? '解析中…' : '✨ AI 解析'}
            </button>
            <button type="button" className="w-full py-1 text-sm text-gray-400" onClick={() => setMode('manual')}>
              改用手動輸入
            </button>
          </form>
        ) : (
          <form className="space-y-3" onSubmit={handleSave}>
            <input
              type="number"
              step="0.01"
              required
              placeholder="金額"
              className="w-full rounded-xl border border-gray-200 px-3 py-3 text-lg"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />

            <div className="flex gap-2">
              <input
                type="date"
                required
                className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              <input
                type="time"
                required
                className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {categoryOptions.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCategory(c.key)}
                  className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-medium ${
                    category === c.key
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'bg-white border-gray-200 text-gray-600'
                  }`}
                >
                  <span>{c.icon}</span>
                  {c.label}
                </button>
              ))}
            </div>

            {type === 'expense' && (
              <label className="block text-sm">
                <span className="text-gray-500">使用信用卡</span>
                <select
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
                  value={cardId ?? ''}
                  onChange={(e) => setCardId(e.target.value || null)}
                >
                  <option value="">現金 / 不指定</option>
                  {cards.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.lastFour ? ` ····${c.lastFour}` : ''}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <input
              type="text"
              placeholder="備註（選填）"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-emerald-500 py-3 font-medium text-white disabled:opacity-50"
            >
              {busy ? '儲存中…' : isEditing ? '儲存變更' : '儲存'}
            </button>

            {isEditing ? (
              confirmingDelete ? (
                <div className="space-y-2 rounded-xl bg-red-50 p-3">
                  <p className="text-center text-sm text-[#E24B4A]">確定要刪除這筆交易嗎？此動作無法復原。</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setConfirmingDelete(false)}
                      className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-600 disabled:opacity-50"
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={handleDelete}
                      className="flex-1 rounded-xl bg-[#E24B4A] py-2.5 text-sm font-medium text-white disabled:opacity-50"
                    >
                      {busy ? '刪除中…' : '確定刪除'}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="w-full py-1 text-sm font-medium text-[#E24B4A]"
                  onClick={() => setConfirmingDelete(true)}
                >
                  刪除這筆交易
                </button>
              )
            ) : (
              <button type="button" className="w-full py-1 text-sm text-gray-400" onClick={() => setMode('ai')}>
                ✨ 改用 AI 快速輸入
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  )
}

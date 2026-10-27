import { useState } from 'react'
import { useBudgets } from '../context/BudgetsContext'
import { getCategoryMeta } from '../lib/categories'
import { formatCurrency } from '../lib/currency'

export default function EditBudgetsForm({ onClose }) {
  const { budgets, setBudgetLimits } = useBudgets()
  const [draft, setDraft] = useState(
    Object.fromEntries(Object.entries(budgets).map(([category, limit]) => [category, String(limit)])),
  )
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const draftTotal = Object.values(draft).reduce((sum, value) => sum + (Number(value) || 0), 0)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const limits = Object.fromEntries(
        Object.entries(draft).map(([category, value]) => [category, Number(value)]),
      )
      await setBudgetLimits(limits)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
      <div className="w-full max-w-md max-h-[85%] space-y-4 overflow-y-auto rounded-t-2xl bg-white p-6">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <h2 className="text-lg font-bold">設定預算</h2>

          <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 text-sm">
            <span className="text-gray-500">整體預算（依分類加總自動計算）</span>
            <span className="font-medium text-gray-700">{formatCurrency(draftTotal)}</span>
          </div>

          {Object.keys(draft).map((category) => {
            const meta = getCategoryMeta(category)
            return (
              <label key={category} className="block text-sm">
                <span className="flex items-center gap-1.5">
                  <span>{meta.icon}</span>
                  {meta.label}
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
                  value={draft[category]}
                  onChange={(e) => setDraft({ ...draft, [category]: e.target.value })}
                />
              </label>
            )
          })}

          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-emerald-500 py-3 font-medium text-white disabled:opacity-50"
          >
            {busy ? '儲存中…' : '儲存'}
          </button>
          <button type="button" className="w-full py-1 text-sm text-gray-400" onClick={onClose}>
            取消
          </button>
        </form>
      </div>
    </div>
  )
}

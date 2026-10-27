import { useState } from 'react'
import { currentMonthLabel, getMonthlyExpenseTotal, isOverBudget } from '../lib/budgets'
import { formatCurrency } from '../lib/currency'
import EditBudgetsForm from './EditBudgetsForm'

export default function OverallBudget({ transactions, overallLimit }) {
  const [showEdit, setShowEdit] = useState(false)
  const spent = getMonthlyExpenseTotal(transactions)

  const over = isOverBudget(spent, overallLimit)
  const pct = Math.min((spent / overallLimit) * 100, 100)

  return (
    <div className="mx-4 rounded-2xl card p-4">
      <button type="button" onClick={() => setShowEdit(true)} className="flex w-full items-center justify-between text-sm">
        <span className="text-gray-500">{currentMonthLabel()}預算</span>
        <span className={over ? 'font-medium text-[#E24B4A]' : 'text-gray-700'}>
          {formatCurrency(spent)} / {formatCurrency(overallLimit)}
        </span>
      </button>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#F1EFE8]">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: over ? '#E24B4A' : '#639922' }} />
      </div>
      {showEdit && <EditBudgetsForm onClose={() => setShowEdit(false)} />}
    </div>
  )
}

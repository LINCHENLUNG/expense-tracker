import { useState } from 'react'
import { useBudgets } from '../context/BudgetsContext'
import { currentMonthLabel, getMonthlySpendByCategory, isOverBudget } from '../lib/budgets'
import { getCategoryMeta } from '../lib/categories'
import { formatCurrency } from '../lib/currency'
import EditBudgetsForm from './EditBudgetsForm'

export default function BudgetLimits({ transactions }) {
  const { budgets } = useBudgets()
  const [showEdit, setShowEdit] = useState(false)
  const spendByCategory = getMonthlySpendByCategory(transactions)

  return (
    <div className="mx-4 rounded-2xl card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-500">{currentMonthLabel()}分類預算上限</h2>
        <button type="button" className="text-sm font-medium text-emerald-600" onClick={() => setShowEdit(true)}>
          編輯
        </button>
      </div>
      <ul className="space-y-4">
        {Object.entries(budgets).map(([category, limit]) => {
          const meta = getCategoryMeta(category)
          const spent = spendByCategory[category] ?? 0
          const over = isOverBudget(spent, limit)
          const pct = Math.min((spent / limit) * 100, 100)

          return (
            <li key={category} className="flex items-start gap-3">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm"
                style={{ background: meta.iconBg, color: meta.iconColor }}
              >
                {meta.icon}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{meta.label}</span>
                  <span className={over ? 'text-[#E24B4A]' : 'text-gray-600'}>
                    {formatCurrency(spent)} / {formatCurrency(limit)}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#F1EFE8]">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: over ? '#E24B4A' : '#639922' }}
                  />
                </div>
                {over && (
                  <p className="mt-1 text-xs font-medium text-[#E24B4A]">
                    ⚠ 超出上限 {formatCurrency(spent - limit)}
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      {showEdit && <EditBudgetsForm onClose={() => setShowEdit(false)} />}
    </div>
  )
}

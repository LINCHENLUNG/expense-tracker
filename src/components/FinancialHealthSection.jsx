import { useEffect, useMemo, useState } from 'react'
import { useFinancialHealthHistory } from '../context/FinancialHealthContext'
import { computeFinancialHealth, tierForRatio, yearMonthKey, yearMonthLabel } from '../lib/financialHealth'
import { getMonthlyExpenses } from '../lib/budgets'
import MonthlySnapshot from './MonthlySnapshot'
import OverallBudget from './OverallBudget'
import BudgetLimits from './BudgetLimits'
import CategoryPieChart from './CategoryPieChart'

export default function FinancialHealthSection({ transactions, overallLimit }) {
  const { snapshots, saveSnapshot } = useFinancialHealthHistory()
  const [expanded, setExpanded] = useState(false)
  const currentMonth = yearMonthKey()
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)

  const live = useMemo(() => computeFinancialHealth(transactions), [transactions])

  // Auto-saves the current month's live summary as it changes — no manual
  // "save snapshot" step. Past months are never recomputed, just read back.
  useEffect(() => {
    if (!live) return
    saveSnapshot(currentMonth, { balanceRatio: live.ratio, adviceText: live.adviceText })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live?.ratio, live?.adviceText])

  const monthOptions = useMemo(() => {
    const months = new Set([currentMonth, ...Object.keys(snapshots)])
    return [...months].sort().reverse()
  }, [snapshots, currentMonth])

  const viewingCurrent = selectedMonth === currentMonth
  const snapshot = snapshots[selectedMonth]
  const view = viewingCurrent
    ? live
    : snapshot
      ? { ratio: snapshot.balanceRatio, pct: Math.round(snapshot.balanceRatio * 100), tier: tierForRatio(snapshot.balanceRatio), adviceText: snapshot.adviceText }
      : null

  return (
    <div className="space-y-4">
      <div className="mx-4 rounded-2xl card p-4">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="flex w-full items-center justify-between text-sm font-semibold"
        >
          <span className="flex items-center gap-1.5">♡ 理財健康</span>
          <span className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}>⌄</span>
        </button>

        {expanded && (
          <div className="mt-3">
            <label className="flex items-center justify-between text-sm text-gray-500">
              查看月份
              <select
                className="ml-2 rounded-lg border border-gray-200 px-2 py-1 text-sm text-gray-700"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                {monthOptions.map((m) => (
                  <option key={m} value={m}>
                    {yearMonthLabel(m)}
                  </option>
                ))}
              </select>
            </label>

            {view ? (
              <>
                <p className="mt-3 flex items-center gap-1.5 text-sm">
                  {view.tier.heart} {view.adviceText}
                </p>
                <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                  <span>結餘率</span>
                  <span className={`font-semibold ${view.tier.text}`}>{view.pct}%</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
                  <div className={`h-full rounded-full ${view.tier.bar}`} style={{ width: `${view.pct}%` }} />
                </div>
              </>
            ) : (
              <p className="mt-3 text-sm text-gray-400">這個月還沒有收入紀錄。</p>
            )}
          </div>
        )}
      </div>

      {expanded && (
        <>
          <MonthlySnapshot transactions={transactions} />
          <OverallBudget transactions={transactions} overallLimit={overallLimit} />
          <BudgetLimits transactions={transactions} />

          <div className="mx-4 rounded-2xl card p-4">
            <h2 className="mb-3 text-sm font-semibold text-gray-500">分類支出</h2>
            <CategoryPieChart transactions={getMonthlyExpenses(transactions)} />
          </div>
        </>
      )}
    </div>
  )
}

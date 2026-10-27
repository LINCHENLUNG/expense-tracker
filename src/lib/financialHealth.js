import { getMonthlyExpenseTotal, getMonthlyIncomeTotal } from './budgets'

export const TIERS = [
  { min: 0.5, heart: '💚', message: (pct) => `很健康！這個月存下了收入的 ${pct}%。`, bar: 'bg-emerald-500', text: 'text-emerald-600' },
  { min: 0.2, heart: '💛', message: () => '還不錯，可以再留意一點花費。', bar: 'bg-amber-500', text: 'text-amber-600' },
  { min: -Infinity, heart: '❤️', message: () => '要注意了，這個月存不太下錢。', bar: 'bg-red-500', text: 'text-red-600' },
]

// Computes the current month's balance ratio + advice from live transactions.
// Returns null if there's no income yet this month (matches the existing
// FinancialHealthSection empty state).
export function computeFinancialHealth(transactions) {
  const income = getMonthlyIncomeTotal(transactions)
  const expense = getMonthlyExpenseTotal(transactions)
  if (income <= 0) return null

  const ratio = (income - expense) / income
  const pct = Math.max(0, Math.min(100, Math.round(ratio * 100)))
  const tier = TIERS.find((t) => ratio >= t.min)
  return { ratio, pct, tier, adviceText: tier.message(pct) }
}

export function yearMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function yearMonthLabel(key) {
  const [y, m] = key.split('-')
  return `${y} 年 ${Number(m)} 月`
}

// A saved snapshot's ratio doesn't carry its tier — re-derive it so past
// months render with the same heart/bar/text styling as the live view.
export function tierForRatio(ratio) {
  return TIERS.find((t) => ratio >= t.min)
}

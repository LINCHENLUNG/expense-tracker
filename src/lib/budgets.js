import { isThisMonth } from './cashback'

// Used until the user sets their own limits (see BudgetsContext), and as the
// fallback for any category they haven't customized yet.
export const DEFAULT_BUDGET_LIMITS = {
  Food: 5000,
  Transport: 2000,
  Entertainment: 3000,
  Learning: 1000,
  Travel: 2000,
  Other: 1000,
}

export function getMonthlyExpenses(transactions) {
  return transactions.filter((tx) => isThisMonth(tx.date) && tx.type !== 'income')
}

export function getMonthlySpendByCategory(transactions) {
  return getMonthlyExpenses(transactions).reduce((acc, tx) => {
    acc[tx.category] = (acc[tx.category] ?? 0) + tx.amount
    return acc
  }, {})
}

export function isOverBudget(spent, limit) {
  return limit > 0 && spent > limit
}

export function getMonthlyExpenseTotal(transactions) {
  return getMonthlyExpenses(transactions).reduce((sum, tx) => sum + tx.amount, 0)
}

export function getMonthlyIncomeTotal(transactions) {
  return transactions
    .filter((tx) => isThisMonth(tx.date) && tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0)
}

export function currentMonthLabel() {
  const now = new Date()
  return `${now.getFullYear()} 年 ${now.getMonth() + 1} 月`
}

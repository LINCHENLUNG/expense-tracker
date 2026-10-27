import { getMonthlyExpenses, getMonthlySpendByCategory } from '../lib/budgets'
import { getCategoryMeta } from '../lib/categories'
import { formatCurrency } from '../lib/currency'

function topCategory(spendByCategory) {
  const entries = Object.entries(spendByCategory)
  if (entries.length === 0) return null
  const [category] = entries.reduce((max, entry) => (entry[1] > max[1] ? entry : max))
  return category
}

export default function MonthlySnapshot({ transactions }) {
  const expenses = getMonthlyExpenses(transactions)
  const spendByCategory = getMonthlySpendByCategory(transactions)
  const total = expenses.reduce((sum, tx) => sum + tx.amount, 0)
  const dayOfMonth = new Date().getDate()
  const dailyAvg = total / dayOfMonth
  const top = topCategory(spendByCategory)
  const topMeta = top ? getCategoryMeta(top) : null

  const tiles = [
    { label: '支出筆數', value: String(expenses.length) },
    { label: '日均支出', value: formatCurrency(dailyAvg) },
    { label: '最花錢', value: topMeta ? `${topMeta.icon} ${topMeta.label}` : '—' },
  ]

  return (
    <div className="mx-4 rounded-2xl card p-4">
      <h2 className="mb-3 text-sm font-semibold text-gray-500">本月速覽</h2>
      <div className="grid grid-cols-3 gap-2">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-xl bg-gray-50 p-3 text-center">
            <p className="text-sm font-semibold">{tile.value}</p>
            <p className="mt-0.5 text-xs text-gray-400">{tile.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { getCategoryMeta } from '../lib/categories'

export default function CategoryPieChart({ transactions }) {
  const byCategory = transactions.reduce((acc, tx) => {
    acc[tx.category] = (acc[tx.category] ?? 0) + tx.amount
    return acc
  }, {})
  const total = Object.values(byCategory).reduce((sum, v) => sum + v, 0)
  const data = Object.entries(byCategory).map(([category, value]) => ({
    category,
    value,
    meta: getCategoryMeta(category),
    pct: total > 0 ? Math.round((value / total) * 100) : 0,
  }))

  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-gray-400">這個月還沒有支出紀錄</p>
  }

  return (
    <div className="flex items-center gap-4">
      <div className="h-40 w-40 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="category" innerRadius={35} outerRadius={70}>
              {data.map((entry) => (
                <Cell key={entry.category} fill={entry.meta.accent} />
              ))}
            </Pie>
            <Tooltip formatter={(value, _name, item) => [value, item.payload.meta.label]} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="space-y-1.5 text-sm">
        {data.map((entry) => (
          <li key={entry.category} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: entry.meta.accent }} />
            {entry.meta.label} {entry.pct}%
          </li>
        ))}
      </ul>
    </div>
  )
}

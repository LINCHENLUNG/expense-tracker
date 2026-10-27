import { isThisMonth } from '../lib/cashback'
import { formatCurrency } from '../lib/currency'

export default function BalanceCard({ transactions }) {
  const monthly = transactions.filter((tx) => isThisMonth(tx.date))
  const income = monthly.filter((tx) => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0)
  const expense = monthly.filter((tx) => tx.type !== 'income').reduce((sum, tx) => sum + tx.amount, 0)
  const balance = income - expense

  return (
    <div className="mx-4 rounded-2xl bg-[#173404] p-5 shadow-sm">
      <p className="text-xs text-[#C0DD97]">本月結餘</p>
      <p className="mt-1 text-3xl font-bold text-white">{formatCurrency(balance)}</p>
      <div className="mt-3 flex items-center gap-4 text-sm">
        <span className="text-[#C0DD97]">
          收入 <span className="font-medium">{formatCurrency(income)}</span>
        </span>
        <span className="text-[#F0997B]">
          支出 <span className="font-medium">{formatCurrency(expense)}</span>
        </span>
      </div>
    </div>
  )
}

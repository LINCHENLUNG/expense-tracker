import { getCategoryMeta } from '../lib/categories'
import { getTransactionCashback } from '../lib/cashback'
import { formatAmount } from '../lib/currency'
import { useCards } from '../context/CardsContext'

function formatDateTime(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${y}/${m}/${d} ${hh}:${mm}`
}

export default function TransactionList({ transactions, onSelect }) {
  const { cards } = useCards()

  if (transactions.length === 0) {
    return <p className="text-center text-gray-400 py-8 text-sm">還沒有交易紀錄</p>
  }

  return (
    <ul className="divide-y divide-gray-100">
      {transactions.map((tx) => {
        const meta = getCategoryMeta(tx.category)
        const cashback = getTransactionCashback(tx, cards)
        const isIncome = tx.type === 'income'
        const card = tx.cardId ? cards.find((c) => c.id === tx.cardId) : null

        return (
          <li key={tx.id}>
            <button
              type="button"
              onClick={() => onSelect?.(tx)}
              className="flex w-full items-center gap-3 py-3 text-left"
            >
              <span
                className="flex items-center justify-center w-9 h-9 shrink-0 rounded-full text-base"
                style={{ background: meta.iconBg, color: meta.iconColor }}
              >
                {meta.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">
                  {meta.label}
                  {tx.note ? ` · ${tx.note}` : ''}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {formatDateTime(tx.date)}
                  {card ? ` · ${card.name}` : ''}
                </p>
              </div>
              {cashback > 0 && (
                <span className="shrink-0 rounded-full bg-[#E1F5EE] px-2 py-0.5 text-[11px] font-medium text-[#085041]">
                  回饋 {formatAmount(cashback)}
                </span>
              )}
              <p className={`shrink-0 text-sm font-semibold ${isIncome ? 'text-[#3B6D11]' : 'text-[#E24B4A]'}`}>
                {isIncome ? '+' : '-'}
                {formatAmount(tx.amount)}
              </p>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

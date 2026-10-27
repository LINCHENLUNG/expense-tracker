import { useState } from 'react'
import { useTransactions } from '../context/TransactionsContext'
import { useBudgets } from '../context/BudgetsContext'
import BalanceCard from '../components/BalanceCard'
import FinancialHealthSection from '../components/FinancialHealthSection'
import CategoryFilterPills from '../components/CategoryFilterPills'
import TransactionList from '../components/TransactionList'
import AddTransactionForm from '../components/AddTransactionForm'

export default function TrackingScreen() {
  const { transactions, loading } = useTransactions()
  const { overallLimit } = useBudgets()
  // null = closed, 'new' = add form, a transaction object = editing that transaction
  const [formTarget, setFormTarget] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('All')

  const visibleTransactions =
    selectedCategory === 'All' ? transactions : transactions.filter((tx) => tx.category === selectedCategory)

  return (
    <div className="relative space-y-4 pb-4">
      <BalanceCard transactions={transactions} />

      {loading ? (
        <p className="py-8 text-center text-sm text-gray-400">載入中…</p>
      ) : (
        <>
          <FinancialHealthSection transactions={transactions} overallLimit={overallLimit} />

          <CategoryFilterPills selected={selectedCategory} onSelect={setSelectedCategory} />

          <div className="mx-4 rounded-2xl card p-4">
            <h2 className="mb-1 text-sm font-semibold text-gray-500">交易紀錄</h2>
            <TransactionList transactions={visibleTransactions} onSelect={setFormTarget} />
          </div>
        </>
      )}

      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-40 mx-auto max-w-md px-4">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setFormTarget('new')}
            aria-label="新增交易"
            className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-2xl leading-none text-white shadow-lg"
          >
            +
          </button>
        </div>
      </div>

      {formTarget && (
        <AddTransactionForm
          transaction={formTarget === 'new' ? null : formTarget}
          onClose={() => setFormTarget(null)}
        />
      )}
    </div>
  )
}

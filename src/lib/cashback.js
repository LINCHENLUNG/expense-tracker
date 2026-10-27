export function isThisMonth(date) {
  const now = new Date()
  const d = date instanceof Date ? date : new Date(date)
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
}

// Cashback is strictly a per-card benefit now — a transaction with no card
// (cardId null/'cash') or a card that no longer exists earns 0.
// Income transactions (type: 'income', e.g. Salary) never earn cashback.
export function getTransactionCashback(tx, cards) {
  if (tx.type === 'income' || !tx.cardId) return 0
  const card = cards.find((c) => c.id === tx.cardId)
  return card ? tx.amount * (card.rates[tx.category] ?? 0) : 0
}

export function calculateCashback(transactions, cards) {
  return transactions
    .filter((tx) => isThisMonth(tx.date))
    .reduce((sum, tx) => sum + getTransactionCashback(tx, cards), 0)
}

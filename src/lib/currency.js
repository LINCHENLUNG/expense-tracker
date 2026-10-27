// 'en-US' (not 'zh-TW') is deliberate: Intl simplifies TWD to a bare "$" when
// the locale's home currency IS TWD, but keeps "NT$" for a non-local locale.
export function formatCurrency(amount) {
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'TWD',
    maximumFractionDigits: 0,
  })
}

// For transaction-list rows, which show a signed number with no currency
// prefix (the sign + red/green color already convey income vs. expense).
export function formatAmount(amount) {
  return Math.abs(amount).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

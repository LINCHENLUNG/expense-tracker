// One color set per category, reused everywhere a category renders: the pie
// chart, category pills, icon circle backgrounds, budget progress bars, and
// the cashback rate grid. `iconBg`/`iconColor` style the icon circle;
// `accent` is the single chart/highlight color for that category elsewhere.
// `type` distinguishes expense vs income categories, used to filter the
// category picker in AddTransactionForm by the 支出/收入 toggle.
export const CATEGORIES = [
  { key: 'Food', label: '飲食', icon: '🍵', iconBg: '#F5C4B3', iconColor: '#712B13', accent: '#E24B4A', type: 'expense' },
  { key: 'Transport', label: '交通', icon: '🚌', iconBg: '#B5D4F4', iconColor: '#042C53', accent: '#378ADD', type: 'expense' },
  { key: 'Entertainment', label: '娛樂', icon: '🎮', iconBg: '#FAC775', iconColor: '#633806', accent: '#EF9F27', type: 'expense' },
  { key: 'Learning', label: '學習', icon: '📚', iconBg: '#DCD3F5', iconColor: '#3B2470', accent: '#8B5CF6', type: 'expense' },
  { key: 'Travel', label: '旅遊', icon: '✈️', iconBg: '#C6EEE8', iconColor: '#04473D', accent: '#14B8A6', type: 'expense' },
  // Same category slot as the original "薪水"/Salary — key kept as `Salary`
  // so existing transactions/budgets data isn't orphaned, only the label
  // broadened to cover any incoming money.
  { key: 'Salary', label: '收入', icon: '💰', iconBg: '#D3F0C4', iconColor: '#1B4620', accent: '#2F9E44', type: 'income' },
]

// Kept separate from CATEGORIES (rather than folded in) because it's always
// appended last wherever categories render — the pills, the picker, the
// cashback rate grid — matching the mockup's "everything else" catch-all
// position at the end of the list.
export const OTHER_CATEGORY = { key: 'Other', label: '其他', icon: '📌', iconBg: '#E2E8F0', iconColor: '#334155', accent: '#94A3B8', type: 'expense' }

export const ALL_CATEGORIES = [...CATEGORIES, OTHER_CATEGORY]

// Used by AddTransactionForm to pick the category-pill row for the selected
// 支出/收入 toggle.
export const EXPENSE_CATEGORIES = [...CATEGORIES.filter((c) => c.type === 'expense'), OTHER_CATEGORY]
export const INCOME_CATEGORIES = CATEGORIES.filter((c) => c.type === 'income')

export function getCategoryMeta(key) {
  return ALL_CATEGORIES.find((c) => c.key === key) ?? OTHER_CATEGORY
}

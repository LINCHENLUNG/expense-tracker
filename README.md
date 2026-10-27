# Expense Tracker App

An AI-assisted expense tracker web app. The frontend has two screens (tracking and cashback), data is stored in Firebase, and quick expense entry is powered by Gemini AI.

## Feature Architecture

```
Expense Tracker App (Frontend)
├── Welcome screen (signed-out, shown before sign-in — see Phase 3 §1)
├── Auth screen (sign in / sign up)
├── Tracking tab
│   ├── Monthly balance card
│   ├── Transaction list (each row tappable → edit/delete — see Phase 3 §3)
│   └── Add button (bottom-right, opens a form; same form is reused for editing)
└── Cashback tab
    ├── Cashback earned this month
    └── Per-card, per-category cashback rates (each saved card has its own full rate table — see Phase 2 §7)

External services
├── Firebase → transaction storage (create/read/update/delete, persists on refresh)
└── Gemini AI → quick entry, must return structured JSON only
```

A bottom tab bar switches between the "Tracking" and "Cashback" screens.

## Page Flow: Adding a Transaction

1. **Tracking screen** — user taps the "Add" button (bottom-right)
2. **Add transaction form** — choose manual entry or AI quick entry
3. **AI structured parsing** (if using AI path) — call Gemini API, constrained to return structured JSON only (amount, category, date), no free-form text allowed
4. **User confirms data** — the AI or manual result is shown to the user first, editable, and only submitted after confirmation
5. **Write to Firebase** — transaction is saved to the database, synced in real time
6. **Update screen** — monthly balance and cashback are recalculated and displayed automatically

## Page Flow: Editing or Deleting a Transaction

1. **Tracking screen** — user taps any row in the transaction list
2. **Same form, edit mode** — `AddTransactionForm` opens pre-filled with that transaction's amount, category, date, time, note, and card
3. **User edits fields and taps 儲存變更** — writes to the *same* Firestore document via `updateTransaction(id, ...)`, not a new one
4. **Update screen** — balance, budget usage, cashback, and the pie chart all recompute automatically, same as any other data change
5. **Delete instead (optional)** — tapping "刪除這筆交易" swaps in a confirm panel; only a second, explicit "確定刪除" tap calls `deleteTransaction(id)` — there is no single-tap delete

## Core Logic

### Cashback calculation
Cashback is strictly per-card: each transaction's `cardId` is looked up in the user's saved cards, and that card's own rate for the transaction's category is applied. A transaction with no card (or a card that's since been deleted) earns 0.
```js
const cashback = transactions
  .filter(tx => isThisMonth(tx.date))
  .reduce((sum, tx) => sum + getTransactionCashback(tx, cards), 0);
```
Cashback accumulates automatically with every new transaction — no page refresh needed. (See `src/lib/cashback.js`.)

### Financial health analysis
- Compare monthly income vs. expenses
- Per-category budget limits, with tiered advice based on how much the limit is exceeded (e.g. healthy / caution / warning)
- Balance ratio progress bar (balance ÷ income)
- "This month at a glance" card: transaction count, average daily spend, top spending category
- Pie chart of spending by category

## Data Structure (Firebase suggestion)

This was the original pre-Phase-2 sketch (flat top-level collections, a single global cashback-rate table). It's superseded by the Phase 2 changes below — Auth scoped everything under `users/{uid}/...`, and cashback moved to per-card rate tables (Phase 2 §7). **The authoritative, current schema is documented in `CLAUDE.md` under "Firestore data model"** — refer to that instead of this section.

## Gemini API Constraints

The prompt sent to Gemini must explicitly require "return structured JSON only, no extra text or explanation," e.g. specifying the return format:

```json
{ "amount": 120, "category": "Food", "date": "2026-08-22" }
```

The result must always be user-editable and confirmed before writing to Firebase — as implemented, there's deliberately no separate confirmation screen: the AI's parsed draft pre-fills the same editable form fields used for manual entry, and a required tap on 儲存 **is** the confirmation step. Never skip this and write unreviewed AI output directly to the database.

## Suggested Tech Stack

- Frontend framework: React (or Vue) + Tailwind
- Charts: pie chart (financial analysis) — Recharts or Chart.js
- Database: Firebase Firestore
- AI: Gemini API (structured output mode)
- State management: React Context is enough for a small project; consider Redux/Zustand only if it scales up

## Phase 2 Requirements (User Accounts, Cards, Extended Transactions)

These extend the original spec above. Confirmed decisions are noted inline so implementation doesn't have to guess.

### 1. User authentication
Add sign in / sign up screens (username, email, password). Firebase Authentication (email/password) is the natural fit given the app already uses Firebase.

### 2. Personalized header
"我的記帳本" becomes "**{username} 的記帳本**" (or the English equivalent, "**{username}'s Ledger**"), using the signed-in user's display name. Slightly larger font than before.

**Color note (confirmed — do not change):** The header accent bar and title text use the **same dark green as BalanceCard**, `#173404` (with `#C0DD97` as a lighter accent where needed). This is a **separate color** from CashbackScreen's VIBE card gradient (`from-emerald-400` `#34d399` → `to-teal-700` `#0f766e`). The two cards are intentionally different color families — do not unify them, and do not change BalanceCard's existing `#173404`/`#C0DD97` palette when implementing this.

### 3. Collapsible financial health section + monthly history
The "理財健康" (Financial Health) block is collapsible, and its scope was later widened (see `src/components/FinancialHealthSection.jsx`) to group five pieces together under one toggle:
- Collapsed by default — only a header/toggle button is visible.
- Expanded on click — reveals, as one block: the balance-ratio bar + advice text, 本月速覽 (monthly at-a-glance), the monthly total budget bar, the per-category budget limits list, and the 分類支出 category pie chart.
- The transaction list and the floating add-transaction button are **not** part of this section — they stay visible at all times, regardless of the toggle state.

**Monthly history (confirmed scope):** Save a **summary only** — balance ratio (%) and the advice text — per month, so the user can pick a past month from a dropdown and see that month's saved summary. This does **not** require snapshotting the full budget/pie-chart data, just the ratio and message.

Suggested Firestore addition:
```
financialHealthSnapshots/
  {yearMonth}/          e.g. "2026-08"
    balanceRatio: number
    adviceText: string
    createdAt: timestamp
```

### 4. New spending categories
Add **Learning (學習)** and **Travel (旅遊)** as categories, alongside the existing Food/Transport/Entertainment/Other.

**Cashback rate (confirmed):** Both new categories use the same rate as "Other" — 1%. (Note: with the Phase 2 card-based cashback system below, this 1% becomes the *default* rate a card uses for these categories unless the user sets a different per-card rate.)

### 5. Rename "薪水" (Salary) to "收入" (Income)
Same category slot, broader label — covers salary, bonus, or any incoming money, not just salary specifically.

### 6. Extended transaction fields
- **Date AND time input for both manual and AI entry.** Currently only the AI path lets the user set a date — manual entries silently default to "today." Add a date + time picker to the manual entry form so manual entries aren't locked to the entry date.
- **Show the note/memo in the transaction list.** Currently notes are captured but not displayed. Show a short summary/snippet of the note next to the category in each transaction row (e.g. "Food · Lunch box") so the user can see at a glance what the money was spent on.
- **Add a "which credit card was used" field** to the transaction form (dropdown of the user's saved cards, or "cash / unspecified"). This field is what links a transaction to a specific card's cashback rate (see below).

### 7. Per-card cashback settings (confirmed structure)
Replace the single global cashback-rate table with **user-managed credit cards**, each carrying **its own full set of per-category rates** — not a single flat rate per card. For example:
- Card A ("VIBE 卡"): Food 3%, Transport 2%, Entertainment 2%, Learning 1%, Travel 2%, Other 1%
- Card B: Food 1%, Transport 0%, Travel 2%, Learning 0%, etc. — entirely independent numbers per card

**Cashback total calculation:** for each transaction, look up which card was used (from the new transaction field in #6), then apply *that card's* rate for the transaction's category — not a global rate. The existing `reduce`-based monthly total logic still applies, but the per-transaction rate lookup now depends on both `category` AND `cardId`.

Suggested Firestore addition:
```
cards/
  {cardId}/
    name: string              e.g. "VIBE 卡"
    lastFour: string          e.g. "8250"
    rates:
      Food: number
      Transport: number
      Entertainment: number
      Learning: number
      Travel: number
      Other: number
```

And the `transactions/` model gains a field:
```
transactions/
  {transactionId}/
    ...(existing fields)
    cardId: string | null     // null/"cash" if no card was used
    note: string              // now also displayed in the transaction list, not just stored
```

## Phase 3 Requirements (Welcome Screen, Category Fix, Transaction Editing)

These extend Phase 2 above.

### 1. Welcome/landing screen (before login)
A signed-out user no longer sees the sign-in form first. `WelcomeScreen` (`src/screens/WelcomeScreen.jsx`) renders before `AuthScreen`: an app icon (dark-green `#173404` rounded square with a `#C0DD97` line-art wallet icon), "我的記帳本", the tagline "記帳、預算、信用卡回饋，一次掌握", and one button "登入 / 開始使用". Tapping it reveals `AuthScreen`; `AppShell` (`src/App.jsx`) tracks this as local `showAuth` state, not a route. Flow: **Welcome screen → (tap button) → Sign in/Sign up screen → (success) → Tracking screen.** Signing out returns to the welcome screen, not straight to sign-in.

### 2. "Other (其他)" category restored
`CategoryFilterPills` was reading from `CATEGORIES` (which excludes `Other`) instead of `ALL_CATEGORIES`, so the filter pills silently dropped 其他 when Learning/Travel were added. Fixed, along with two related gaps found while checking every place categories are listed:
- `CategoryFilterPills` now uses `ALL_CATEGORIES` — pills are 全部/飲食/交通/娛樂/學習/旅遊/收入/其他.
- `DEFAULT_BUDGET_LIMITS` (`src/lib/budgets.js`) didn't have an `Other` entry, so it could never get a per-category budget row like the other expense categories — added (`Other: 1000`).
- `gemini.js`'s Gemini response schema enum was built from `CATEGORIES` (excludes `Other`), so the AI could never categorize a purchase as 其他 — now built from `ALL_CATEGORIES`.

`AddTransactionForm`'s category picker and the cashback rate grid (`CardRatesEditor`) already included `Other` correctly (via `EXPENSE_CATEGORIES` / a `[...CATEGORIES, OTHER_CATEGORY]` list respectively) and needed no change. Final category list: Food, Transport, Entertainment, Learning, Travel, Income (收入/`Salary`), Other.

Also checked: no code anywhere stores or compares the Food category as the string `"budget"` — that was a typo in this README's old Data Structure sketch, which has since been replaced with a pointer to CLAUDE.md's authoritative schema (see "Data Structure" above).

### 3. Editable and deletable transactions
Every row in `TransactionList` is now a tappable button. Tapping it opens `AddTransactionForm` in edit mode (pre-filled from that transaction), reusing the exact same form layout as adding one. Saving calls `TransactionsContext.updateTransaction(id, ...)`, which writes to the *existing* Firestore document (`users/{uid}/transactions/{id}`) — never a new one — so balance, budget usage, cashback, and the pie chart all recalculate automatically like any other data change.

The edit view also has a delete option, for removing duplicates or wrong-category entries, gated behind a confirmation panel (取消/確定刪除) so a stray tap can't destroy data. Both the update and delete paths go through `TransactionsContext` (`updateTransaction`/`deleteTransaction`) — the same single-write-path principle as `addTransaction`; no component calls Firestore directly.

## PWA Deployment (Add to Home Screen)

Goal: install the app as a home-screen icon on a phone, no app store submission needed.

1. **Create `manifest.json`** — app name, icons, theme color, and `"display": "standalone"` so it opens without a browser address bar.
2. **Prepare app icons** — at least 192x192 and 512x512 PNGs, referenced from `manifest.json`. These are the icons shown on the home screen.
3. **Register a service worker** — caches static assets so the app can open to a basic screen even offline. Register it in `index.html`.
4. **Add meta tags in HTML `<head>`** — `<link rel="manifest" href="/manifest.json">`, plus iOS-specific `apple-touch-icon` and `apple-mobile-web-app-capable` tags so Safari recognizes it correctly.
5. **Deploy to Firebase Hosting** — `firebase deploy --only hosting` gives an https URL. PWAs require https to work (Firebase Hosting is https by default, no extra setup needed). **Done** — live at https://expense-tracker-80bc3.web.app.
6. **Open the URL on a phone browser, add to home screen** — on iPhone, open in Safari and tap Share → "Add to Home Screen"; on Android, Chrome usually prompts "Install app" automatically. Afterward, the icon appears on the home screen and opens full-screen like a native app.

**Platform notes:**
- Android Chrome has fuller PWA support and usually prompts the install automatically.
- iOS Safari has no auto-prompt — the user must manually tap "Add to Home Screen." Design any install-guidance UI with this in mind.
- For local testing on a phone before deployment, run the dev server (`npm run dev`) and connect from the phone via the same Wi-Fi using the machine's local IP (e.g. `http://192.168.x.x:5173`).

## To-Do (suggested build order)

- [x] Tracking screen UI (balance card + transaction list + add button)
- [x] Firebase integration, transaction CRUD
- [x] Manual add-transaction form
- [x] Bottom tab bar (Tracking / Cashback)
- [x] Cashback tab: rate settings + reduce-based calculation logic
- [x] Gemini AI quick entry + confirmation screen
- [x] Budget limits per category
- [x] Financial health analysis (balance ratio bar, monthly snapshot, tiered advice)
- [x] Category spending pie chart
- [x] PWA setup (manifest.json, icons, service worker, meta tags)
- [x] Deploy to Firebase Hosting (https://expense-tracker-80bc3.web.app) and deploy Firestore security rules
- [ ] Test "Add to Home Screen" on a real iOS/Android device

### Phase 2 To-Do
- [x] Firebase Authentication (sign in / sign up, username, email, password)
- [x] Personalized header ("{username} 的記帳本"), using the confirmed #173404/#C0DD97 color — do not touch CashbackScreen's separate emerald/teal gradient
- [x] Collapsible Financial Health section (collapsed by default) + month-picker for saved summaries (`financialHealthSnapshots/{yearMonth}`)
- [x] Add "Learning" and "Travel" categories (cashback default 1%, same as Other)
- [x] Rename "薪水" category to "收入"
- [x] Add date + time picker to manual transaction entry (currently AI-only)
- [x] Show note/memo summary in the transaction list
- [x] Add credit card selection field to the transaction form
- [x] Build card management UI: add/edit cards, each with its own full per-category rate table (`cards/{cardId}`)
- [x] Update cashback total calculation to look up rate by (cardId, category) pair instead of a single global rate table

### Phase 3 To-Do
- [x] Welcome/landing screen shown before sign-in, using the confirmed #173404/#C0DD97 palette
- [x] Restore "Other (其他)" category to the filter pills, default budget limits, and the Gemini category enum
- [x] Make transaction list rows tappable; edit an existing transaction via the same form as add
- [x] Delete a transaction, with a confirmation step, through the same `TransactionsContext` write path

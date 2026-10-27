# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm install` — install dependencies
- `npm run dev` — start the Vite dev server
- `npm run build` — production build (outputs to `dist/`)
- `npm run preview` — serve the production build locally
- `npm run lint` — ESLint over the whole project (no test runner is configured yet)

Environment variables (Firebase config + Gemini API key) are read via `import.meta.env.VITE_*`. Copy `.env.example` to `.env` and fill in real values — the app builds and lints without it, but Firestore reads/writes, Firebase Auth, and AI quick entry will fail at runtime without it.

**Firebase Auth must be enabled in the Firebase console** (Build → Authentication → Get started → enable the "Email/Password" provider) before sign-up/sign-in will work — this is separate from having Firestore set up, and there's no code-level way to do it. Without it, sign-up fails with `auth/configuration-not-found`.

## UI language and design reference

**All user-facing UI copy is Traditional Chinese** (labels, buttons, category names) — this isn't incidental, it's the target design. The original mockup screenshots are embedded in `用AI打造記帳 app.docx` (`word/media/image8.png` through `image13.png` inside the unzipped docx). The Phase 2 additions (accounts, cards, extended transactions) and the `WelcomeScreen` were each designed against mockup screenshots supplied directly in conversation, not checked into the repo. When making UI changes, match that look: a centered mobile-width card (see App shell below), white rounded cards with soft shadows, an emerald/green accent (not the purple from earlier iterations of this app), category icon emojis, and pill-shaped filter/toggle controls.

### Color system

- Page background is `#F5F6F4` (`App.jsx`); regular cards are white with a shared `.card` class (`src/index.css`: `background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.05)`) — use `card` alongside Tailwind spacing/radius classes (`rounded-2xl card p-4`) rather than `bg-white shadow-sm`, so the shadow stays one value everywhere.
- `BalanceCard` and `Header` both use the app's dark-green anchor color: `#173404` (bg on `BalanceCard`, accent bar + title text on `Header`) with `#C0DD97` as the lighter accent (label/income text on `BalanceCard`). This is a separate color family from `CashbackScreen`'s emerald/teal gradient — don't unify them.
- Category colors are centralized in `src/lib/categories.js` (see below) and reused for icon circles, the pie chart, category-pill active state, and each card's cashback rate grid — never hardcode a category's hex value in a component.
- Budget progress bars (`BudgetLimits`, `OverallBudget`) use `#639922` (within budget) / `#E24B4A` (over budget) on a `#F1EFE8` track — this red is reserved for actual over-budget state, not a general "warning" color.
- The per-transaction cashback badge (`TransactionList`) is `#E1F5EE` background / `#085041` text, fixed regardless of category.

## Architecture

React 19 + Vite, styled with Tailwind v4 (via `@tailwindcss/vite`, imported in `src/index.css` — no `tailwind.config.js`, v4 is CSS-first). Firestore + Firebase Auth are the only backend; there is no server component in this repo.

### App shell & auth gate

`src/App.jsx`'s `AppShell` reads `useAuth()`: while loading it shows a spinner; if there's no signed-in user it renders `WelcomeScreen` first (app icon/name/tagline + one "登入 / 開始使用" button — see `src/screens/WelcomeScreen.jsx` below) and only shows `AuthScreen` (full-screen login/signup card, not part of the tab shell) once that button is tapped. This is local `showAuth` state in `AppShell`, not routing. Signing out (user goes from truthy to `null`) resets `showAuth` back to `false`, so a signed-out user always lands on the welcome screen again, never straight on the sign-in form — done by comparing `user` against a `prevUser` ref-like state during render (not a `useEffect`, to avoid the "setState synchronously in an effect" lint rule). Only once a user exists does the shell mount `TransactionsProvider`/`BudgetsProvider`/`CardsProvider`/`FinancialHealthProvider` and render the normal app — a page background (`bg-gray-100`) containing a single centered card: `mx-auto max-w-md ... rounded-3xl shadow-xl` on desktop, full-bleed on an actual mobile viewport. `Header`, the active screen, and `BottomTabBar` all live inside that card. Two things depend on this and must stay consistent with it:
- **Modals** (`AddTransactionForm`, `EditBudgetsForm`, the add-card form in `CashbackScreen`) use `fixed inset-0` (viewport-relative) with an inner `max-w-md` wrapper to match the card's width — NOT `absolute inset-0`, which would stretch to the full scrollable page height (TrackingScreen is long) and make the bottom sheet appear at the bottom of all content instead of the visible screen.
- **`BottomTabBar`** and the floating add-transaction button use `fixed inset-x-0 ... mx-auto max-w-md` so they stay pinned to the viewport but visually align with the card's edges rather than the full browser width.

### Data & state

All per-user Firestore data lives under `users/{uid}/...` subcollections (see "Firestore data model" below) — every context that touches Firestore reads `user` from `useAuth()` and only subscribes once a user exists.

- `src/context/AuthContext.jsx` — wraps Firebase Auth's `onAuthStateChanged`. Exposes `user`, `loading`, `signUp(username, email, password)` (creates the account, then `updateProfile` to set `displayName` — there's no separate Firestore `users` doc for the username), `signIn(email, password)`, `signOut()`.
- `src/context/TransactionsContext.jsx` — the single source of truth for transaction data. Subscribes to `users/{uid}/transactions` in real time via `onSnapshot`; screens read from `useTransactions()` rather than querying Firestore directly. Exposes `addTransaction`, `updateTransaction(id, transaction)`, and `deleteTransaction(id)` — the **only** write paths into Firestore for transactions; no component calls Firestore directly for transaction writes.
- `src/context/BudgetsContext.jsx` — same pattern for budgets, subscribing to `users/{uid}/budgets` (one doc per category). Exposes `budgets` (category → limit, merged over `DEFAULT_BUDGET_LIMITS`), `overallLimit` (**derived**, not stored — the sum of all values in `budgets`, always defined), `loading`, and `setBudgetLimits(limitsByCategory)`.
- `src/context/CardsContext.jsx` — subscribes to `users/{uid}/cards`. Exposes `cards` (array of `{id, name, lastFour, rates}`, `rates` covering every expense category), `addCard({name, lastFour})` (rates start at 0%, edited afterward), `updateCardRates(cardId, rates)`, `deleteCard(cardId)`.
- `src/context/FinancialHealthContext.jsx` — subscribes to `users/{uid}/financialHealthSnapshots`. Exposes `snapshots` (yearMonth string → `{balanceRatio, adviceText}`) and `saveSnapshot(yearMonth, data)`, used to auto-persist the current month's live-computed summary (see `FinancialHealth` below) — there's no manual "save" action.
- `src/lib/categories.js` — the category registry (`CATEGORIES`: Food/Transport/Entertainment/Learning/Travel/Salary, plus `OTHER_CATEGORY` kept as a separate export so it can be appended last), each with a Chinese `label`, emoji `icon`, a `type` (`'expense'` or `'income'`, used to filter the category picker by the 支出/收入 toggle), and the one color set for that category: `iconBg`/`iconColor` (icon circle, applied via inline `style`, not Tailwind classes) and `accent` (pie chart slice, active category-pill background, dot indicators). `getCategoryMeta(key)` is the lookup used everywhere a category needs to render — this is the single source of truth for category color; don't hardcode a category's hex value anywhere else. `ALL_CATEGORIES` (`[...CATEGORIES, OTHER_CATEGORY]`) is the full 7-category list — Food/Transport/Entertainment/Learning/Travel/Salary(收入)/Other — used by `CategoryFilterPills` and `gemini.js`'s enum; `EXPENSE_CATEGORIES`/`INCOME_CATEGORIES` are the type-filtered derived exports used by `AddTransactionForm`'s category picker (`EXPENSE_CATEGORIES` also ends with `OTHER_CATEGORY`, since Other is an expense-side category). **Always use `ALL_CATEGORIES`/`EXPENSE_CATEGORIES`, never the bare `CATEGORIES` array, when rendering a category list meant to include every category** — `CATEGORIES` alone omits Other, which is how it previously went missing from the filter pills. Category *keys* stay in English internally (Firestore field values, card `rates`/`DEFAULT_BUDGET_LIMITS` keys) — only the display layer localizes via this module. Note: the "收入" category kept its internal key `Salary` (only the label changed from "薪水") to avoid orphaning existing data.

### Screens & components

- `src/screens/WelcomeScreen.jsx` — the very first thing a signed-out user sees, before `AuthScreen`: a centered app icon (dark-green `#173404` rounded square with a `#C0DD97` line-art wallet icon, inline SVG — not an emoji, since the color needs to be styleable), "我的記帳本", a one-line tagline ("記帳、預算、信用卡回饋，一次掌握"), and a single `#173404`-background/`#C0DD97`-text button ("登入 / 開始使用") whose `onGetStarted` prop is called by `AppShell` to flip local `showAuth` state to `true`. Purely presentational — no auth calls of its own.
- `src/screens/AuthScreen.jsx` — 登入/註冊 toggle card (matches the Phase 2 mockup), reached only after `WelcomeScreen`'s button. 註冊 mode adds a 使用者名稱 field on top of 電子郵件/密碼.
- `src/screens/TrackingScreen.jsx` — the "記帳" tab. Section order matters (mirrors the mockup): `BalanceCard` → `FinancialHealthSection` (collapsed group: balance ratio/advice, `MonthlySnapshot`, `OverallBudget`, `BudgetLimits`, category pie chart) → `CategoryFilterPills` → `TransactionList`. Owns `selectedCategory` state and filters the transaction list by it. `TransactionList` and the floating add-transaction button are outside the collapsible group and always visible regardless of its toggle state.
- `src/screens/CashbackScreen.jsx` — the "回饋" tab: lists the signed-in user's real cards (empty state if none), each with an inline editable per-category rate grid (`CardRatesEditor`, saved via `updateCardRates` on blur), a "+ 新增另一張卡" button opening `AddCardForm`, and the cumulative monthly cashback total. New users start with zero cards — nothing is seeded.
- `src/components/Header.jsx` — `{user.displayName} 的記帳本`, using `#173404`; also holds the 登出 button.
- `src/components/AddTransactionForm.jsx` — one modal that handles both **add** and **edit**, chosen by an optional `transaction` prop: omitted/`null` = add a new transaction, an existing transaction object = edit it in place, pre-filling every field (`amount`, `category`, `date`+`time` split from the transaction's `Date`, `note`, `cardId`; `type`/`source` also seeded from the transaction). `TrackingScreen` owns which mode is showing via one `formTarget` state (`null` closed / `'new'` add / a transaction object edit) and renders this same component either way. State: `type` (`expense`/`income`, via a 支出/收入 toggle — the category-pill row switches between `EXPENSE_CATEGORIES`/`INCOME_CATEGORIES` and resets the selected category when `type` changes) and `mode` (`manual`/`ai` — edit mode never shows the AI option; the "✨ 改用 AI 快速輸入" toggle is replaced by the delete flow described below). Manual entry has both a date and a time input (combined into one `Date` on save); expense entries also get a 使用信用卡 `<select>` sourced from `useCards()` (`cardId: null` = 現金/不指定). In `ai` mode (add only), a free-text field is parsed by Gemini and the result pre-fills the *same* editable fields used in `manual` mode (time defaults to "now", Gemini isn't asked for it) — there is deliberately no separate "confirm screen"; the editable form fields plus a required tap on 儲存/儲存變更 **are** the confirmation step. Saving calls `addTransaction` when adding, `updateTransaction(transaction.id, ...)` when editing — never a separate ad hoc Firestore call, and never with unreviewed AI output. When editing, a "刪除這筆交易" text button swaps in a red confirm panel ("確定要刪除這筆交易嗎？此動作無法復原。" + 取消/確定刪除) before `deleteTransaction(transaction.id)` actually runs — deleting is never a single tap.
- `src/components/TransactionList.jsx` — each row is a full-width tappable `<button>` (not static); tapping calls the `onSelect(tx)` prop, which `TrackingScreen` wires to open `AddTransactionForm` in edit mode for that transaction. First line is `{category label} · {note}`, second line is `{date} {time} · {card name}` (card omitted if `cardId` is null). Pulls `cards` from `useCards()` to resolve both the card name and the per-transaction cashback badge.
- `src/components/EditBudgetsForm.jsx` — edits all category limits; the overall budget has no input of its own here, just a read-only "整體預算（依分類加總自動計算）" line reflecting the live draft total (see "Overall budget is derived" below).
- `src/components/BudgetLimits.jsx` / `OverallBudget.jsx` — both show a plain green bar under the limit and switch to a red bar + "⚠ 超出上限 {amount}" warning line once `isOverBudget` is true. No intermediate "caution" tier — matches the mockup's binary styling.
- `src/components/FinancialHealthSection.jsx` — one collapsible group (collapsed by default, header row is a toggle button with a chevron) wrapping five pieces that expand/collapse together: the balance ratio bar + advice text, `MonthlySnapshot`, `OverallBudget`, `BudgetLimits`, and the category pie chart. Collapsed, only the "♡ 理財健康" toggle header renders. When expanded, a 查看月份 `<select>` (scoped to the balance-ratio piece only) lists the current month plus every month with a saved snapshot; picking the current month shows the live computation (`computeFinancialHealth` in `src/lib/financialHealth.js`), picking a past month reads straight from `FinancialHealthContext`'s `snapshots`. A `useEffect` upserts the live current-month result into Firestore whenever it changes — that's the entire "auto-save" mechanism, there's no explicit save action. `MonthlySnapshot`/`OverallBudget`/`BudgetLimits`/the pie chart always reflect the live current month (they have no month picker of their own) regardless of which month the ratio piece is showing.
- `src/lib/gemini.js` — calls the Gemini API directly from the client with a JSON response schema (`responseMimeType: application/json`), constrained to `ALL_CATEGORIES` from `src/lib/categories.js` (every category — expense, income, and `Other` — e.g. "薪水入帳" can parse to `Salary`, an uncategorizable purchase can parse to `Other`). Returns a parsed `{ amount, category, date }` draft; never writes to Firestore itself, and never returns `type` or a time (income/expense defaults to `expense` after an AI parse, time defaults to "now" in the form — both user-editable before save).
- `src/lib/cashback.js` — cashback is strictly per-card now: `getTransactionCashback(tx, cards)` looks up the transaction's `cardId` in `cards` and reads that card's `rates[tx.category]`; a transaction with no card, or a card that's since been deleted, earns 0. `calculateCashback(transactions, cards)` is the same lookup summed over the current month. There's no more flat/global rate table.
- `src/lib/budgets.js` — `DEFAULT_BUDGET_LIMITS` (Food/Transport/Entertainment/Learning/Travel/Other — every expense category; `Salary`/income has no budget, by design), `getMonthlyExpenses`/`getMonthlySpendByCategory`/`getMonthlyExpenseTotal`/`getMonthlyIncomeTotal`, `isOverBudget`, `currentMonthLabel()`.
- `src/lib/financialHealth.js` — `computeFinancialHealth(transactions)` (the tier/ratio/advice logic, live-only — operates on the current month), `yearMonthKey()`/`yearMonthLabel()`/`tierForRatio()` used to render saved snapshots with the same styling as the live view.
- `src/lib/currency.js` — `formatCurrency` (e.g. `NT$5,000`, used for totals/limits) and `formatAmount` (bare signed number, used in `TransactionList` rows). `formatCurrency` deliberately uses locale `'en-US'` with `currency: 'TWD'`, **not** `'zh-TW'` — Intl simplifies TWD to a bare `$` when the locale's home currency *is* TWD, so `'zh-TW'` silently drops the `NT` prefix.
- `src/lib/firebase.js` — Firebase app/Firestore/Auth init from `VITE_FIREBASE_*` env vars; exports `db` and `auth`.

### Confirmation rule (do not bypass)

Whether a transaction draft comes from manual entry, from Gemini parsing, or is an edit of an existing transaction, its fields must be user-editable and require an explicit Save tap before `TransactionsContext.addTransaction`/`updateTransaction` is called. Never call either directly with unconfirmed AI output, and never add a code path that writes to Firestore outside of the contexts in `src/context/`. Deleting is held to the same "no accidental write" bar: `AddTransactionForm`'s delete flow requires a second explicit tap on a confirm panel before `deleteTransaction` runs — there is no single-tap delete anywhere in the UI.

### Overall budget is derived, not stored

The **overall** monthly budget is not its own setting — `BudgetsContext` computes `overallLimit` as the sum of all category limits in `budgets`, so it's always defined and updates automatically whenever a category limit changes. `OverallBudget` always renders the progress-bar view (no "尚未設定" empty state). `EditBudgetsForm` only collects per-category limits; don't reintroduce a separate manual overall-budget input or a Firestore write path for it.

## Firestore data model

All app data is scoped under a `users/{uid}` subcollection tree — nothing is stored in flat top-level collections. `firestore.rules` (checked in and deployed — see below) enforces this with a single rule: `match /users/{uid}/{document=**} { allow read, write: if request.auth.uid == uid }`.

```
users/
  {uid}/
    transactions/
      {transactionId}/
        amount: number
        category: "Food" | "Transport" | "Entertainment" | "Learning" | "Travel" | "Salary" | "Other"
        date: timestamp
        type: "expense" | "income"
        note: string | null
        source: "manual" | "ai"
        cardId: string | null      // null = cash/unspecified
        createdAt: timestamp (serverTimestamp)

    budgets/
      {category}/
        limit: number

    cards/
      {cardId}/
        name: string                e.g. "VIBE 卡"
        lastFour: string | null
        rates: { Food, Transport, Entertainment, Learning, Travel, Other: number }  // decimal, e.g. 0.03 = 3%

    financialHealthSnapshots/
      {yearMonth}/                  e.g. "2026-08"
        balanceRatio: number
        adviceText: string
        createdAt: timestamp
```

There is no `_overall` doc anymore — the overall budget is derived client-side as the sum of category limits (see "Overall budget is derived" above). `BudgetsContext` still ignores a doc id of `_overall` defensively, in case one lingers from before that change.

**Firestore security rules exist in the repo (`firestore.rules` + `firebase.json`) and were deployed to the live project (`expense-tracker-80bc3`) via `firebase deploy --only firestore:rules`.** Applying them is still a manual step, not something that happens automatically on file change — redeploy after editing `firestore.rules`, and don't assume a newer edit is live without confirming.

Earlier flat `transactions`/`budgets` collections (pre-dating per-user scoping) are not migrated into the new `users/{uid}/...` layout — any data in them is orphaned.

## Not yet implemented

Transaction CRUD is now complete (create/read/update/delete all go through `TransactionsContext`). What's left is the last leg of PWA packaging: testing "Add to Home Screen" on a real iOS/Android device (the manifest/icons/service worker via `vite-plugin-pwa` are in place and verified with `npm run build && npm run preview`; the app is deployed to Firebase Hosting at https://expense-tracker-80bc3.web.app, so this is just the on-device install check).

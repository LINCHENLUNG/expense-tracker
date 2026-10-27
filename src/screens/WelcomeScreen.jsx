// Shown before AuthScreen for a signed-out user. Same dark-green/light-green
// palette as BalanceCard (#173404 / #C0DD97) — see App shell flow in CLAUDE.md.
export default function WelcomeScreen({ onGetStarted }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-[#F5F6F4] px-8 text-center">
      <div
        className="flex h-20 w-20 items-center justify-center rounded-2xl"
        style={{ background: '#173404' }}
      >
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M3 7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v1h1a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"
            stroke="#C0DD97"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <circle cx="16.5" cy="13" r="1.4" fill="#C0DD97" />
        </svg>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">我的記帳本</h1>
        <p className="text-sm text-gray-500">記帳、預算、信用卡回饋，一次掌握</p>
      </div>

      <button
        type="button"
        onClick={onGetStarted}
        className="w-full max-w-xs rounded-2xl py-3.5 text-base font-semibold"
        style={{ background: '#173404', color: '#C0DD97' }}
      >
        登入 / 開始使用
      </button>
    </div>
  )
}

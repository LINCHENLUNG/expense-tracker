import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function AuthScreen() {
  const { signIn, signUp, signInWithGoogle } = useAuth()
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (mode === 'signup') {
        await signUp(username, email, password)
      } else {
        await signIn(email, password)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleGoogleSignIn() {
    setError(null)
    setBusy(true)
    try {
      await signInWithGoogle()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-[#F5F6F4] px-4">
      <div className="w-full max-w-md space-y-4 rounded-2xl card p-6">
        <div className="flex gap-2 rounded-xl bg-gray-100 p-1">
          {[
            { key: 'signin', label: '登入' },
            { key: 'signup', label: '註冊' },
          ].map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => {
                setMode(m.key)
                setError(null)
              }}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
                mode === m.key ? 'bg-emerald-500 text-white' : 'text-gray-500'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <form className="space-y-3" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <label className="block text-sm">
              <span className="text-gray-500">使用者名稱</span>
              <input
                type="text"
                required
                placeholder="例如：小明"
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </label>
          )}

          <label className="block text-sm">
            <span className="text-gray-500">電子郵件</span>
            <input
              type="email"
              required
              placeholder="name@example.com"
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label className="block text-sm">
            <span className="text-gray-500">密碼</span>
            <input
              type="password"
              required
              minLength={8}
              placeholder="至少 8 個字元"
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-emerald-500 py-3 font-medium text-white disabled:opacity-50"
          >
            {busy ? '處理中…' : mode === 'signup' ? '建立帳號' : '登入'}
          </button>
        </form>

        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="h-px flex-1 bg-gray-200" />
          或
          <span className="h-px flex-1 bg-gray-200" />
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={busy}
          className="w-full rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 disabled:opacity-50"
        >
          使用 Google 帳號登入
        </button>
      </div>
    </div>
  )
}

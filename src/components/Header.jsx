import { useAuth } from '../context/AuthContext'

export default function Header() {
  const { user, signOut } = useAuth()

  return (
    <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-2">
      <div className="flex items-center gap-2">
        <span className="w-1 h-5 rounded-full" style={{ background: '#173404' }} />
        <h1 className="text-xl font-bold" style={{ color: '#173404' }}>
          {user?.displayName ?? '我'} 的記帳本
        </h1>
      </div>
      <button type="button" onClick={signOut} className="text-xs font-medium text-gray-400">
        登出
      </button>
    </div>
  )
}

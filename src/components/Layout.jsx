import { useAuth } from '../context/AuthContext'
import { useReminders } from '../lib/useReminders'

const NAV = [
  { key: 'calendar', label: 'Lịch', icon: '🗓️' },
  { key: 'renters', label: 'Người thuê', icon: '👥' },
  { key: 'revenue', label: 'Doanh thu', icon: '💰' },
  { key: 'settings', label: 'Cài đặt', icon: '⚙️' },
]

export default function Layout({ view, setView, children }) {
  const { user, signOut } = useAuth()
  useReminders()

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="topbar-brand">
            <span className="brand-mark">🗓️</span>
            <span className="brand-name">Lịch thuê lớp</span>
          </div>
          <nav className="topnav">
            {NAV.map((n) => (
              <button
                key={n.key}
                className={'topnav-item' + (view === n.key ? ' active' : '')}
                onClick={() => setView(n.key)}
              >
                <span className="ni-icon">{n.icon}</span>
                <span>{n.label}</span>
              </button>
            ))}
          </nav>
          <div className="topbar-user">
            <span className="user-email" title={user?.email}>{user?.email}</span>
            <button className="btn btn-ghost btn-sm" onClick={signOut}>Đăng xuất</button>
          </div>
        </div>
      </header>

      <main className="content">{children}</main>

      <nav className="bottomnav">
        {NAV.map((n) => (
          <button
            key={n.key}
            className={'bn-item' + (view === n.key ? ' active' : '')}
            onClick={() => setView(n.key)}
          >
            <span className="bn-icon">{n.icon}</span>
            <span className="bn-label">{n.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

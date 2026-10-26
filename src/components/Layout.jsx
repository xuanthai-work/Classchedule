import { useAuth } from '../context/AuthContext'
import { useReminders } from '../lib/useReminders'
import { useTheme, toggleTheme } from '../lib/theme'

const NAV = [
  { key: 'calendar', label: 'Lịch', icon: '🗓️' },
  { key: 'renters', label: 'Người thuê', icon: '👥' },
  { key: 'revenue', label: 'Doanh thu', icon: '💰' },
  { key: 'settings', label: 'Cài đặt', icon: '⚙️' },
]

export default function Layout({ view, setView, children }) {
  const { user, signOut } = useAuth()
  useReminders()
  const [theme, effective] = useTheme()
  const dark = effective === 'dark'

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="topbar-brand" onClick={() => setView('calendar')} role="button" tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setView('calendar') } }}>
            <span className="brand-mark">
              <img src="/favicon.svg" alt="Classchedule Logo" width="28" height="28" />
            </span>
            <span className="brand-name">Classchedule</span>
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
            <button
              className="icon-btn theme-toggle"
              onClick={toggleTheme}
              aria-label={dark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
              title={dark ? 'Giao diện sáng' : 'Giao diện tối'}
            >
              {dark ? '☀️' : '🌙'}
            </button>
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

import { configured } from './supabase'
import { useSession } from './hooks/useSession'
import { SetupNotice } from './components/SetupNotice'
import { Login } from './components/Login'
import { Dashboard } from './components/Dashboard'

export default function App() {
  const { session, ready } = useSession()

  if (!configured) return <SetupNotice />

  return (
    <main>
      <header className="brand">
        <b>MPL</b>
        <span>Moolaikadu Premium League</span>
      </header>

      {!ready
        ? <div className="glass">Loading…</div>
        : session ? <Dashboard user={session.user} /> : <Login />}
    </main>
  )
}

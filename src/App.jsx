import { configured } from './supabase'
import { useSession } from './hooks/useSession'
import { useRoute } from './hooks/useRoute'
import { useAuctioneer } from './hooks/useAuctioneer'
import { SetupNotice } from './components/SetupNotice'
import { Login } from './components/Login'
import { Dashboard } from './components/Dashboard'
import { Board } from './components/Board'
import { AdminOverview } from './components/AdminOverview'

export default function App() {
  const { session, ready } = useSession()
  const route = useRoute()
  const { isAuctioneer } = useAuctioneer(session?.user?.id)

  if (!configured) return <SetupNotice />
  if (!ready) return <main><div className="glass">Loading…</div></main>
  if (!session) return <main><Login /></main>

  // The board is projected: it gets the whole screen, no app header.
  if (route === 'board') return <Board />

  return (
    <main>
      <header className="brand">
        <b>MPL</b>
        <span>Moolaikadu Premium League</span>
      </header>

      {route === 'admin' && isAuctioneer
        ? <AdminOverview />
        : <Dashboard user={session.user} />}

      {isAuctioneer && (
        <nav className="tabs">
          <a href="#/" className={route !== 'admin' ? 'on' : ''}>My team</a>
          <a href="#/admin" className={route === 'admin' ? 'on' : ''}>All teams</a>
          <a href="#/board" target="_blank" rel="noreferrer">Projector ↗</a>
        </nav>
      )}
    </main>
  )
}

import { configured } from './supabase'
import { useSession } from './hooks/useSession'
import { useRoute } from './hooks/useRoute'
import { useAuctioneer } from './hooks/useAuctioneer'
import { useUmpire } from './hooks/useUmpire'
import { SetupNotice } from './components/SetupNotice'
import { Login } from './components/Login'
import { Dashboard } from './components/Dashboard'
import { Board } from './components/Board'
import { AdminOverview } from './components/AdminOverview'
import { UmpireConsole } from './components/UmpireConsole'

export default function App() {
  const { session, ready } = useSession()
  const route = useRoute()
  const { isAuctioneer } = useAuctioneer(session?.user?.id)
  const isUmpire = useUmpire(session?.user?.id)

  if (!configured) return <SetupNotice />
  if (!ready) return <main><div className="glass">Loading…</div></main>
  if (!session) return <main><Login /></main>

  // Projected: the whole screen, no app chrome.
  if (route === 'board') return <Board />

  // An umpire scores matches and does nothing else: no auction, no squads, no
  // tabs to wander into. They land on the console whatever the hash says.
  if (isUmpire && !isAuctioneer) {
    return (
      <main>
        <header className="brand">
          <b>MPL</b>
          <span>Moolaikadu Premium League</span>
        </header>
        <UmpireConsole />
      </main>
    )
  }

  // Scoring lives on its own route. The auction screen never shows it.
  const canScore = isAuctioneer || isUmpire
  const screen =
    route === 'umpire' && canScore ? <UmpireConsole />
    : route === 'admin' && isAuctioneer ? <AdminOverview />
    : <Dashboard user={session.user} />

  return (
    <main>
      <header className="brand">
        <b>MPL</b>
        <span>Moolaikadu Premium League</span>
      </header>

      {screen}

      {(isAuctioneer || isUmpire) && (
        <nav className="tabs">
          {!isUmpire || isAuctioneer ? (
            <a href="#/" className={!['admin', 'umpire'].includes(route) ? 'on' : ''}>Auction</a>
          ) : null}
          {isAuctioneer && (
            <a href="#/admin" className={route === 'admin' ? 'on' : ''}>All teams</a>
          )}
          {canScore && (
            <a href="#/umpire" className={route === 'umpire' ? 'on' : ''}>Umpire</a>
          )}
          {isAuctioneer && <a href="#/board" target="_blank" rel="noreferrer">Projector ↗</a>}
        </nav>
      )}
    </main>
  )
}

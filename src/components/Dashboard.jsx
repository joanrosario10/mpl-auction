import { supabase } from '../supabase'
import { useTeam } from '../hooks/useTeam'
import { useTeams } from '../hooks/useTeams'
import { usePool } from '../hooks/usePool'
import { useBlock } from '../hooks/useBlock'
import { useAuctioneer } from '../hooks/useAuctioneer'
import { CreateTeam } from './CreateTeam'
import { TeamStats } from './TeamStats'
import { Block } from './Block'
import { SquadGallery } from './SquadGallery'

export function Dashboard({ user }) {
  const { team, players, error, setError, loading, reload } = useTeam(user.id)
  const isAuctioneer = useAuctioneer(user.id)
  const teams = useTeams(isAuctioneer)
  const pool = usePool()
  const block = useBlock()

  if (loading) return <div className="glass">Loading…</div>
  if (!team) return <CreateTeam user={user} onDone={reload} />

  return (
    <>
      <div className="glass">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h1 style={{ margin: 0 }}>{team.name}</h1>
          <button onClick={() => supabase.auth.signOut()}>Sign out</button>
        </div>
      </div>

      <TeamStats team={team} />

      <Block block={block} team={team} pool={pool} teams={teams}
             isAuctioneer={isAuctioneer} onSold={reload} />

      {error && <p className="err">{error}</p>}

      <SquadGallery players={players} onChange={reload} onError={setError}
                    canUndo={isAuctioneer} />
    </>
  )
}

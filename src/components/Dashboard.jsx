import { supabase } from '../supabase'
import { useTeam } from '../hooks/useTeam'
import { usePool } from '../hooks/usePool'
import { useBlock } from '../hooks/useBlock'
import { useAuctioneer } from '../hooks/useAuctioneer'
import { CreateTeam } from './CreateTeam'
import { TeamStats } from './TeamStats'
import { Block } from './Block'
import { BuyPlayer } from './BuyPlayer'
import { SquadGallery } from './SquadGallery'

export function Dashboard({ user }) {
  const { team, players, error, setError, loading, reload } = useTeam(user.id)
  const pool = usePool()
  const block = useBlock()
  const isAuctioneer = useAuctioneer(user.id)

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

      <Block block={block} team={team} pool={pool} isAuctioneer={isAuctioneer} />

      {/* keyed on pool_id, not name: two registrants can share a name */}
      <BuyPlayer key={block?.pool_id ?? block?.player_name ?? ''}
                 initialName={block?.player_name ?? ''}
                 poolId={block?.pool_id ?? null}
                 team={team} onDone={reload} onError={setError} />

      {error && <p className="err">{error}</p>}

      <SquadGallery players={players} onChange={reload} onError={setError} />
    </>
  )
}

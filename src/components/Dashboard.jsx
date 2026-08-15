import { supabase } from '../supabase'
import { useTeam } from '../hooks/useTeam'
import { usePool } from '../hooks/usePool'
import { useBlock } from '../hooks/useBlock'
import { useSales } from '../hooks/useSales'
import { useAuctioneer } from '../hooks/useAuctioneer'
import { TeamStats } from './TeamStats'
import { Block } from './Block'
import { SquadGallery } from './SquadGallery'
import { PlayerMarket } from './PlayerMarket'

export function Dashboard({ user }) {
  const { team, players, error, setError, loading, reload } = useTeam(user.id)
  const { isAuctioneer, error: authErr } = useAuctioneer(user.id)
  const { pool, error: poolErr } = usePool()
  const { block, error: blockErr } = useBlock()
  const { sales, error: salesErr } = useSales()

  // Every load failure surfaces; an empty screen must never pass for "no data".
  const loadError = [authErr, poolErr, blockErr, salesErr].find(Boolean)

  if (loading) return <div className="glass">Loading…</div>
  if (!team) {
    return (
      <div className="glass">
        <h1>No team yet</h1>
        <p className="muted">
          The auction organiser assigns teams. Yours will appear here as soon as they do.
        </p>
        <p><button className="link" onClick={() => supabase.auth.signOut()}>Sign out</button></p>
      </div>
    )
  }

  return (
    <>
      <div className="glass">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h1 style={{ margin: 0 }}>{team.name}</h1>
          <button onClick={() => supabase.auth.signOut()}>Sign out</button>
        </div>
      </div>

      <TeamStats team={team} />

      <Block block={block} team={team} pool={pool}
             sale={block ? sales[block.pool_id] : null}
             isAuctioneer={isAuctioneer} onSold={reload} />

      {(error || loadError) && <p className="err">{error || loadError}</p>}

      {/* Owners confirm their own buys, so they undo their own mistakes too. */}
      <SquadGallery players={players} onChange={reload} onError={setError} canUndo />

      <PlayerMarket pool={pool} sales={sales} block={block} isAuctioneer={isAuctioneer}
                    loadError={poolErr} onError={setError} />
    </>
  )
}

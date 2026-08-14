import { supabase } from '../supabase'
import { useTeam } from '../hooks/useTeam'
import { useTeams } from '../hooks/useTeams'
import { usePool } from '../hooks/usePool'
import { useBlock } from '../hooks/useBlock'
import { useSales } from '../hooks/useSales'
import { useAuctioneer } from '../hooks/useAuctioneer'
import { CreateTeam } from './CreateTeam'
import { TeamStats } from './TeamStats'
import { Block } from './Block'
import { SquadGallery } from './SquadGallery'
import { PlayerMarket } from './PlayerMarket'

export function Dashboard({ user }) {
  const { team, players, error, setError, loading, reload } = useTeam(user.id)
  const { isAuctioneer, error: authErr } = useAuctioneer(user.id)
  const { teams, error: teamsErr } = useTeams(isAuctioneer)
  const { pool, error: poolErr } = usePool()
  const { block, error: blockErr } = useBlock()
  const { sales, error: salesErr } = useSales()

  // Every load failure surfaces; an empty screen must never pass for "no data".
  const loadError = [authErr, teamsErr, poolErr, blockErr, salesErr].find(Boolean)

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

      {(error || loadError) && <p className="err">{error || loadError}</p>}

      <SquadGallery players={players} onChange={reload} onError={setError}
                    canUndo={isAuctioneer} />

      <PlayerMarket pool={pool} sales={sales} block={block} isAuctioneer={isAuctioneer}
                    loadError={poolErr} onError={setError} />
    </>
  )
}

import { usePool } from '../hooks/usePool'
import { useBlock } from '../hooks/useBlock'
import { initials, photoUrl, playerChips } from '../lib/format'

/**
 * The projector view. No controls, no chrome, no standings: only the player
 * the auctioneer has put up, filling the wall.
 */
export function Board() {
  const { pool } = usePool()
  const { block } = useBlock()

  const up = pool.find(p => p.id === block?.pool_id)

  return (
    <div className="board">
      <header className="board-brand">
        <b>MPL</b>
        <span>Moolaikadu Premium League</span>
      </header>

      {block ? (
        <section className="board-lot">
          {photoUrl(up?.photo_id)
            ? <img src={photoUrl(up.photo_id)} alt={block.player_name} />
            : <div className="board-blank">{initials(block.player_name)}</div>}

          <div className="board-lot-info">
            <span className="board-label">now on the block</span>
            <h1>{block.player_name}</h1>
            {up && (
              <div className="chips">
                {playerChips(up).map(c => <span key={c} className="chip">{c}</span>)}
              </div>
            )}
          </div>
        </section>
      ) : (
        <section className="board-idle">
          <span className="board-label">waiting for the next player</span>
        </section>
      )}

    </div>
  )
}

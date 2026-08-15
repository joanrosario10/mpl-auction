import { usePool } from '../hooks/usePool'
import { useBlock } from '../hooks/useBlock'
import { useAllSquads } from '../hooks/useAllSquads'
import { initials, money, photoUrl, playerChips } from '../lib/format'

/**
 * The projector view. No controls, no chrome: whatever the auctioneer puts up
 * appears here for the whole room, and every team's spend sits underneath.
 */
export function Board() {
  const { pool } = usePool()
  const { block } = useBlock()
  const { teams } = useAllSquads()

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

      <section className="board-teams">
        {teams.map(t => (
          <article key={t.id} className="board-team">
            <b>{t.name}</b>
            <span className="board-team-spend">{t.bought}/{t.squad_size} bought · {money(t.spent)} spent</span>
            <ul>
              {t.players.slice(0, 6).map(p => (
                <li key={p.id}><span>{p.name}</span><em>{money(p.price)}</em></li>
              ))}
              {t.players.length > 6 && <li className="more">+{t.players.length - 6} more</li>}
              {t.players.length === 0 && <li className="more">no players yet</li>}
            </ul>
          </article>
        ))}
      </section>
    </div>
  )
}

import { supabase } from '../supabase'
import { initials, money, photoUrl } from '../lib/format'

/**
 * Every registered player, with what they actually play. Sold lots carry the
 * team that bought them and the price. The auctioneer taps an unsold card to
 * put that player up.
 */
export function PlayerMarket({ pool, sales, block, isAuctioneer, onError, loadError = '' }) {
  const putUp = async (player) => {
    const { error } = await supabase.from('block').upsert({
      id: true,
      pool_id: player.id,
      player_name: player.name,
      put_up_at: new Date().toISOString(),
    })
    if (error) onError(error.message)
  }

  const canPutUp = isAuctioneer
  const sold = pool.filter(p => sales[p.id]).length

  return (
    <div className="glass">
      <h1>Players</h1>
      <p className="muted"><small>{sold} sold · {pool.length - sold} still available</small></p>

      {loadError && <p className="err">Could not load the player list: {loadError}</p>}

      {!loadError && pool.length === 0 && (
        <p className="muted">
          No registrations in the database yet. Players appear here as the form is filled,
          once <code>player_pool</code> exists and the sync is running.
        </p>
      )}

      <div className="market">
        {pool.map(p => {
          const sale = sales[p.id]
          const onBlock = block?.pool_id === p.id
          return (
            <article key={p.id}
                     className={`mcard${sale ? ' is-sold' : ''}${onBlock ? ' is-up' : ''}`
                                + (canPutUp && !sale && !onBlock ? ' is-pickable' : '')}
                     onClick={canPutUp && !sale && !onBlock ? () => putUp(p) : undefined}
                     title={canPutUp && !sale && !onBlock ? `Put ${p.name} on the projector` : undefined}>
              <div className="mcard-photo">
                {photoUrl(p.photo_id)
                  ? <img src={photoUrl(p.photo_id)} alt={p.name} loading="lazy" />
                  : <div className="pcard-blank">{initials(p.name)}</div>}
                {sale && <div className="sold-stamp">sold</div>}
                {!sale && onBlock && <div className="up-stamp">on the block</div>}
              </div>

              <div className="mcard-body">
                <b>{p.name}</b>
                {p.all_rounder && <span className="badge">all rounder</span>}

                <dl className="traits">
                  {p.age && <><dt>age</dt><dd>{p.age}</dd></>}
                  {p.batting && <><dt>batting</dt><dd>{p.batting}</dd></>}
                  {p.bowling && <><dt>bowling</dt><dd>{p.bowling}</dd></>}
                </dl>

                {sale && <p className="sold-line">{sale.team?.name} · {money(sale.price)}</p>}
                {!sale && onBlock && <p className="up-line">up for bidding now</p>}
                {!sale && !onBlock && isAuctioneer && (
                  <button type="button">Put up for bidding</button>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}

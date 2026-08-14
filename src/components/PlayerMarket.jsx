import { supabase } from '../supabase'
import { initials, money, photoUrl, playerTraits } from '../lib/format'

/**
 * Every registered player. Sold ones carry the team that bought them and the
 * price they went for. The auctioneer taps an unsold card to put them up.
 */
export function PlayerMarket({ pool, sales, isAuctioneer, onError, loadError = '' }) {
  const putUp = async (player) => {
    const { error } = await supabase.from('block').upsert({
      id: true,
      pool_id: player.id,
      player_name: player.name,
      put_up_at: new Date().toISOString(),
    })
    if (error) onError(error.message)
  }

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

      <div className="gallery">
        {pool.map(p => {
          const sale = sales[p.id]
          const Tag = isAuctioneer && !sale ? 'button' : 'figure'
          return (
            <Tag key={p.id} className={`pcard${sale ? ' is-sold' : ''}`}
                 {...(Tag === 'button'
                   ? { type: 'button', onClick: () => putUp(p), title: `Put ${p.name} up` }
                   : {})}>
              {photoUrl(p.photo_id)
                ? <img src={photoUrl(p.photo_id)} alt={p.name} loading="lazy" />
                : <div className="pcard-blank">{initials(p.name)}</div>}

              {sale && <div className="sold-stamp">sold</div>}

              <figcaption>
                <b>{p.name}</b>
                {sale
                  ? <span className="sold-line">{sale.team?.name} · {money(sale.price)}</span>
                  : <span>{playerTraits(p)}</span>}
              </figcaption>
            </Tag>
          )
        })}
      </div>
    </div>
  )
}

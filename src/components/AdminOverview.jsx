import { useAllSquads } from '../hooks/useAllSquads'
import { initials, money, photoUrl } from '../lib/format'
import { AssignTeam } from './AssignTeam'

/** Auctioneer's full picture: every team, every player, every price. */
export function AdminOverview() {
  const { teams, error, reload } = useAllSquads()

  const totalSpent = teams.reduce((sum, t) => sum + Number(t.spent ?? 0), 0)
  const totalBought = teams.reduce((sum, t) => sum + Number(t.bought ?? 0), 0)

  return (
    <>
      <div className="glass">
        <h1>All teams</h1>
        {error && <p className="err">{error}</p>}
        <p className="muted">
          <small>{teams.length} teams · {totalBought} players sold · {money(totalSpent)} spent in total</small>
        </p>
      </div>

      <AssignTeam onDone={reload} />

      {teams.map(t => (
        <div className="glass" key={t.id}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <h1 style={{ margin: 0 }}>{t.name}</h1>
            <span className="muted">{t.bought}/{t.squad_size}</span>
          </div>

          <div className="stats" style={{ marginTop: 12 }}>
            <div className="stat"><b>{money(t.balance)}</b><span>balance</span></div>
            <div className="stat"><b>{money(t.spent)}</b><span>spent</span></div>
            <div className="stat"><b>{money(t.max_bid)}</b><span>max bid</span></div>
            <div className="stat"><b>{t.slots_left}</b><span>slots left</span></div>
          </div>

          {t.players.length === 0
            ? <p className="muted">No players yet.</p>
            : (
              <div className="gallery">
                {t.players.map(p => (
                  <figure className="pcard" key={p.id}>
                    {photoUrl(p.pool?.photo_id)
                      ? <img src={photoUrl(p.pool.photo_id)} alt={p.name} loading="lazy" />
                      : <div className="pcard-blank">{initials(p.name)}</div>}
                    <figcaption>
                      <b>{p.name}</b>
                      <span>{money(p.price)}</span>
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}
        </div>
      ))}
    </>
  )
}

import { money } from '../lib/format'

export function TeamStats({ team }) {
  return (
    <>
      <div className="stats">
        <div className="stat"><b>{money(team.balance)}</b><span>balance in hand</span></div>
        <div className="stat"><b>{money(team.max_bid)}</b><span>max bid now</span></div>
        <div className="stat"><b>{money(team.spent)}</b><span>spent of {money(team.purse)}</span></div>
        <div className="stat">
          <b>{team.bought}/{team.squad_size}</b>
          <span>{team.slots_left} slots left</span>
        </div>
      </div>

      {team.slots_left > 1 && (
        <p className="muted"><small>
          {money((team.slots_left - 1) * team.base_price)} is reserved to fill your
          remaining {team.slots_left - 1} slot(s) at base price {money(team.base_price)}.
        </small></p>
      )}
    </>
  )
}

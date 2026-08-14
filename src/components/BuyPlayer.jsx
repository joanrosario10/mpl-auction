import { useState } from 'react'
import { supabase } from '../supabase'
import { money } from '../lib/format'

export function BuyPlayer({ team, onDone, onError, initialName = '', poolId = null }) {
  const [name, setName] = useState(initialName)
  const [price, setPrice] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    const amount = Number(price)
    if (!name.trim()) return onError('Player name is required.')
    if (!Number.isFinite(amount) || amount <= 0) return onError('Price must be a positive number.')
    // The trigger enforces this too; checking here just saves a round trip.
    if (amount > Number(team.max_bid)) {
      return onError(`Over your limit. Max bid is ${money(team.max_bid)}.`)
    }

    setBusy(true)
    onError('')
    const { error } = await supabase.from('players')
      .insert({ team_id: team.id, name: name.trim(), price: amount, pool_id: poolId })
    setBusy(false)

    if (error) {
      // 23505 = the unique index on pool_id: somebody already recorded this player.
      return onError(error.code === '23505'
        ? 'That player has already been bought by a team.'
        : error.message)
    }
    setName('')
    setPrice('')
    onDone()
  }

  if (team.slots_left <= 0) return <div className="glass"><strong>Squad full.</strong></div>

  return (
    <form className="glass" onSubmit={submit}>
      <input placeholder="player name" value={name} onChange={e => setName(e.target.value)} />
      <input type="number" step="0.01" min="0" max={team.max_bid}
             placeholder={`price (max ${team.max_bid})`}
             value={price} onChange={e => setPrice(e.target.value)} />
      <button disabled={busy}>{initialName ? 'I won this player' : 'Buy player'}</button>
    </form>
  )
}

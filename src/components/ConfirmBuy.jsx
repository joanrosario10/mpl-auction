import { useState } from 'react'
import { supabase } from '../supabase'
import { money } from '../lib/format'

/**
 * The owner's own buy: a price and a confirm, nothing else. No team picker —
 * it is their team — and no budget shown to anyone else.
 */
export function ConfirmBuy({ block, team, onDone }) {
  const [price, setPrice] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    const amount = Number(price)
    if (!Number.isFinite(amount) || amount <= 0) return setErr('Enter the price you won at.')
    // The trigger enforces this too; checking here gives a faster, clearer answer.
    if (amount > Number(team.max_bid)) {
      return setErr(`Over your limit. You can bid up to ${money(team.max_bid)}.`)
    }

    setBusy(true)
    setErr('')
    const { error } = await supabase.from('players').insert({
      team_id: team.id,
      pool_id: block.pool_id,
      name: block.player_name,
      price: amount,
    })
    setBusy(false)

    if (error) {
      // 23505 = the unique index on pool_id: another team confirmed first.
      return setErr(error.code === '23505'
        ? 'Another team has already bought this player.'
        : error.message)
    }
    setPrice('')
    onDone()
  }

  if (team.slots_left <= 0) return <p className="muted">Your squad is full.</p>

  return (
    <form onSubmit={submit}>
      <input type="number" step="0.01" min="0" placeholder="price"
             value={price} onChange={e => setPrice(e.target.value)} />
      <button disabled={busy}>Confirm</button>
      {err && <p className="err">{err}</p>}
    </form>
  )
}

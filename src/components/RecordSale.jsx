import { useState } from 'react'
import { supabase } from '../supabase'
import { money } from '../lib/format'

/** Auctioneer-only: hammer falls, record who won and for how much. */
export function RecordSale({ block, teams, onDone }) {
  const [teamId, setTeamId] = useState('')
  const [price, setPrice] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const winner = teams.find(t => t.id === teamId)

  const submit = async (e) => {
    e.preventDefault()
    const amount = Number(price)
    if (!winner) return setErr('Choose the winning team.')
    if (!Number.isFinite(amount) || amount <= 0) return setErr('Price must be a positive number.')
    // The trigger rejects this too; checking here gives a clearer message faster.
    if (amount > Number(winner.max_bid)) {
      return setErr(`${winner.name} can only bid up to ${money(winner.max_bid)}.`)
    }

    setBusy(true)
    setErr('')
    const { error } = await supabase.from('players').insert({
      team_id: winner.id,
      pool_id: block.pool_id,
      name: block.player_name,
      price: amount,
    })

    if (error) {
      setBusy(false)
      return setErr(error.code === '23505'
        ? 'That player has already been sold.'
        : error.message)
    }

    // Sold — clear the block so the room moves on to the next player.
    await supabase.from('block').delete().eq('id', true)
    setBusy(false)
    setPrice('')
    setTeamId('')
    onDone()
  }

  return (
    <form onSubmit={submit}>
      <select value={teamId} onChange={e => setTeamId(e.target.value)}>
        <option value="">sold to…</option>
        {teams.map(t => (
          <option key={t.id} value={t.id} disabled={t.slots_left <= 0}>
            {t.name} — up to {money(t.max_bid)}{t.slots_left <= 0 ? ' (full)' : ''}
          </option>
        ))}
      </select>
      <input type="number" step="0.01" min="0"
             max={winner ? winner.max_bid : undefined}
             placeholder={winner ? `price (max ${winner.max_bid})` : 'price'}
             value={price} onChange={e => setPrice(e.target.value)} />
      <button disabled={busy || !teamId}>Confirm sale</button>
      {err && <p className="err">{err}</p>}
    </form>
  )
}

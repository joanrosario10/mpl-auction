import { useState } from 'react'
import { supabase } from '../supabase'
import { money, photoUrl, playerTraits } from '../lib/format'
import { RecordSale } from './RecordSale'

export function Block({ block, team, pool, teams, isAuctioneer, onSold }) {
  const [pick, setPick] = useState('')
  const [err, setErr] = useState('')
  const up = pool.find(p => p.id === block?.pool_id)

  const putUp = async (e) => {
    e.preventDefault()
    const chosen = pool.find(p => p.id === pick)
    if (!chosen) return // the button is disabled until one is picked
    setErr('')
    const { error } = await supabase.from('block').upsert({
      id: true,
      pool_id: chosen.id,
      player_name: chosen.name,
      put_up_at: new Date().toISOString(),
    })
    if (error) setErr(error.message)
    else setPick('')
  }

  const clear = async () => {
    const { error } = await supabase.from('block').delete().eq('id', true)
    if (error) setErr(error.message)
  }

  // Nothing up and nothing to do here — don't render an empty card.
  if (!block && !isAuctioneer) return null

  return (
    <div className="glass block">
      {block && (
        <>
          <span>now on the block</span>
          {photoUrl(up?.photo_id) && (
            <img className="hero" src={photoUrl(up.photo_id)} alt={block.player_name} />
          )}
          <b>{block.player_name}</b>
          {up && <p className="muted">{playerTraits(up)}</p>}
          {team && <span>your max bid is {money(team.max_bid)}</span>}
          {isAuctioneer && <RecordSale block={block} teams={teams} onDone={onSold} />}
        </>
      )}

      {isAuctioneer && (
        <form className="row" onSubmit={putUp}>
          <select value={pick} onChange={e => setPick(e.target.value)}>
            <option value="">choose a player…</option>
            {pool.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button disabled={!pick}>Put up</button>
          {block && <button type="button" onClick={clear}>Clear</button>}
        </form>
      )}

      {err && <p className="err">{err}</p>}
    </div>
  )
}

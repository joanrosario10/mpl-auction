import { useState } from 'react'
import { supabase } from '../supabase'
import { money, photoUrl, playerTraits } from '../lib/format'
import { RecordSale } from './RecordSale'

export function Block({ block, team, pool, teams, isAuctioneer, onSold }) {
  const [err, setErr] = useState('')
  const up = pool.find(p => p.id === block?.pool_id)

  const clear = async () => {
    const { error } = await supabase.from('block').delete().eq('id', true)
    if (error) setErr(error.message)
  }

  if (!block) return null

  return (
    <div className="glass block">
      <span>now on the block</span>
      {photoUrl(up?.photo_id) && (
        <img className="hero" src={photoUrl(up.photo_id)} alt={block.player_name} />
      )}
      <b>{block.player_name}</b>
      {up && <p className="muted">{playerTraits(up)}</p>}
      {team && <span>your max bid is {money(team.max_bid)}</span>}

      {isAuctioneer && (
        <>
          <RecordSale block={block} teams={teams} onDone={onSold} />
          <p><button type="button" className="link" onClick={clear}>clear the block</button></p>
        </>
      )}

      {err && <p className="err">{err}</p>}
    </div>
  )
}

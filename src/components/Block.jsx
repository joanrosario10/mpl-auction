import { useState } from 'react'
import { supabase } from '../supabase'
import { money, photoUrl, playerChips } from '../lib/format'
import { ConfirmBuy } from './ConfirmBuy'

export function Block({ block, team, pool, sale, isAuctioneer, onSold }) {
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
      {up && (
        <div className="chips">
          {playerChips(up).map(c => <span key={c} className="chip">{c}</span>)}
        </div>
      )}
      {team && <span>your max bid is {money(team.max_bid)}</span>}

      {sale
        ? <p className="sold-line">sold to {sale.team?.name} for {money(sale.price)}</p>
        : team && <ConfirmBuy block={block} team={team} onDone={onSold} />}

      {isAuctioneer && (
        <p><button type="button" className="link" onClick={clear}>clear the block</button></p>
      )}

      {err && <p className="err">{err}</p>}
    </div>
  )
}

import { supabase } from '../supabase'
import { initials, money, photoUrl } from '../lib/format'

export function SquadGallery({ players, onChange, onError, canUndo = false }) {
  const undo = async (player) => {
    if (!window.confirm(`Remove ${player.name} from your squad? The money goes back to your purse.`)) return
    const { error } = await supabase.from('players').delete().eq('id', player.id)
    if (error) onError(error.message)
    else onChange()
  }

  return (
    <div className="glass">
      <h1>Squad</h1>
      {players.length === 0 && <p className="muted">No players bought yet.</p>}

      <div className="gallery">
        {players.map(p => (
          <figure className="pcard" key={p.id}>
            {photoUrl(p.pool?.photo_id)
              ? <img src={photoUrl(p.pool.photo_id)} alt={p.name} loading="lazy" />
              : <div className="pcard-blank">{initials(p.name)}</div>}
            <figcaption>
              <b>{p.name}</b>
              <span>{money(p.price)}</span>
            </figcaption>
            {canUndo && <button onClick={() => undo(p)}>undo</button>}
          </figure>
        ))}
      </div>
    </div>
  )
}

import { supabase } from '../supabase'
import { initials, money, photoUrl } from '../lib/format'

export function SquadGallery({ players, onChange, onError }) {
  const undo = async (id) => {
    const { error } = await supabase.from('players').delete().eq('id', id)
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
            <button onClick={() => undo(p.id)}>undo</button>
          </figure>
        ))}
      </div>
    </div>
  )
}

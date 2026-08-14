import { useState } from 'react'
import { supabase } from '../supabase'
import { money } from '../lib/format'

const DEFAULTS = { purse: '5000', squad: '15', base: '100' } // 11 playing + 4 subs

export function CreateTeam({ user, onDone }) {
  const [name, setName] = useState('')
  const [purse, setPurse] = useState(DEFAULTS.purse)
  const [squad, setSquad] = useState(DEFAULTS.squad)
  const [base, setBase] = useState(DEFAULTS.base)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    const p = Number(purse)
    const s = Number(squad)
    const b = Number(base)

    if (!name.trim()) return setErr('Team name is required.')
    if (!(p > 0) || !(s > 0) || !(b > 0)) {
      return setErr('Purse, squad size and base price must all be positive.')
    }
    if (s * b > p) {
      return setErr(`Purse must cover ${s} players at base price ${money(b)} = ${money(s * b)}.`)
    }

    setBusy(true)
    setErr('')
    const { error } = await supabase.from('teams')
      .insert({ owner_id: user.id, name: name.trim(), purse: p, squad_size: s, base_price: b })
    setBusy(false)
    if (error) setErr(error.message)
    else onDone()
  }

  return (
    <div className="glass">
      <h1>Set up your team</h1>
      <form onSubmit={submit}>
        <input placeholder="team name" value={name} onChange={e => setName(e.target.value)} />
        <input type="number" placeholder="purse" value={purse} onChange={e => setPurse(e.target.value)} />
        <input type="number" placeholder="squad size (11 + 4 subs)" value={squad} onChange={e => setSquad(e.target.value)} />
        <input type="number" placeholder="base price" value={base} onChange={e => setBase(e.target.value)} />
        <button disabled={busy}>Create</button>
      </form>
      {err && <p className="err">{err}</p>}
      <p><button className="link" onClick={() => supabase.auth.signOut()}>Sign out</button></p>
    </div>
  )
}

import { useState } from 'react'
import { supabase } from '../supabase'

const DEFAULTS = { purse: '5000', squad: '15', base: '100' } // 11 playing + 4 subs

/** Auctioneer-only: hand a team to an owner who already has a login. */
export function AssignTeam({ onDone }) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [purse, setPurse] = useState(DEFAULTS.purse)
  const [squad, setSquad] = useState(DEFAULTS.squad)
  const [base, setBase] = useState(DEFAULTS.base)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    const p = Number(purse)
    const s = Number(squad)
    const b = Number(base)

    if (!email.trim()) return setErr("Owner's login email is required.")
    if (!name.trim()) return setErr('Team name is required.')
    if (!(p > 0) || !(s > 0) || !(b > 0)) {
      return setErr('Purse, squad size and base price must all be positive.')
    }
    if (s * b > p) return setErr(`Purse must cover ${s} players at base price ${b}.`)

    setBusy(true)
    setErr('')
    setMsg('')
    const { error } = await supabase.rpc('assign_team', {
      p_email: email.trim(), p_name: name.trim(), p_purse: p, p_squad: s, p_base: b,
    })
    setBusy(false)

    if (error) return setErr(error.message)
    setMsg(`${name.trim()} assigned to ${email.trim()}.`)
    setEmail('')
    setName('')
    onDone()
  }

  return (
    <form className="glass" onSubmit={submit}>
      <h1>Assign a team</h1>
      <input type="email" placeholder="owner's login email" autoComplete="off"
             value={email} onChange={e => setEmail(e.target.value)} />
      <input placeholder="team name" value={name} onChange={e => setName(e.target.value)} />
      <input type="number" placeholder="purse" value={purse} onChange={e => setPurse(e.target.value)} />
      <input type="number" placeholder="squad size" value={squad} onChange={e => setSquad(e.target.value)} />
      <input type="number" placeholder="base price" value={base} onChange={e => setBase(e.target.value)} />
      <button disabled={busy}>Assign team</button>
      {err && <p className="err">{err}</p>}
      {msg && <p className="muted">{msg}</p>}
    </form>
  )
}

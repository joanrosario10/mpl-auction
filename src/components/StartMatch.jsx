import { useState } from 'react'
import { supabase } from '../supabase'

/** Admin-only: open a match so the umpire has something to score. */
export function StartMatch({ teams, onDone }) {
  const [name, setName] = useState('')
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const [overs, setOvers] = useState('10')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return setErr('Give the match a name.')
    if (!a || !b) return setErr('Choose both teams.')
    if (a === b) return setErr('A team cannot play itself.')
    if (!(Number(overs) > 0)) return setErr('Overs must be positive.')

    setBusy(true)
    setErr('')
    const { error } = await supabase.from('matches').insert({
      name: name.trim(), team_a: a, team_b: b,
      overs: Number(overs), batting_team: a, innings: 1,
    })
    setBusy(false)
    if (error) setErr(error.message)
    else onDone()
  }

  return (
    <form className="glass" onSubmit={submit}>
      <h1>Start a match</h1>
      <input placeholder="match name, e.g. Semi-final 1"
             value={name} onChange={e => setName(e.target.value)} />
      <select value={a} onChange={e => setA(e.target.value)}>
        <option value="">batting first…</option>
        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>
      <select value={b} onChange={e => setB(e.target.value)}>
        <option value="">bowling first…</option>
        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>
      <input type="number" placeholder="overs" value={overs} onChange={e => setOvers(e.target.value)} />
      <button disabled={busy}>Start match</button>
      {err && <p className="err">{err}</p>}
    </form>
  )
}

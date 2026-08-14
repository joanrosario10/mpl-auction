import { useState } from 'react'
import { supabase } from '../supabase'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  // No sign-up here on purpose: owner accounts are created by hand in Supabase.
  // Turn off "Allow new users to sign up" there too — this form is not the boundary.
  const submit = async (e) => {
    e.preventDefault()
    if (!email.trim()) return setErr('Email is required.')
    if (!password) return setErr('Password is required.')

    setBusy(true)
    setErr('')
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    setBusy(false)
    if (error) setErr(error.message)
  }

  return (
    <div className="glass">
      <h1>Team owner login</h1>
      <form onSubmit={submit}>
        <input type="email" placeholder="email" autoComplete="email"
               value={email} onChange={e => setEmail(e.target.value)} />
        <input type="password" placeholder="password" autoComplete="current-password"
               value={password} onChange={e => setPassword(e.target.value)} />
        <button disabled={busy}>Sign in</button>
      </form>
      {err && <p className="err">{err}</p>}
      <p className="muted"><small>Accounts are issued by the auction organiser.</small></p>
    </div>
  )
}

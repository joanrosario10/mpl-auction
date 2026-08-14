import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabase'

/** The owner's team plus their squad. `reload` is called after every purchase. */
export function useTeam(userId) {
  const [team, setTeam] = useState(null)
  const [players, setPlayers] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    setError('')
    const { data: t, error: te } = await supabase
      .from('team_status').select('*').eq('owner_id', userId).maybeSingle()
    if (te) {
      setError(te.message)
      setLoading(false)
      return
    }
    setTeam(t)

    if (!t) {
      setPlayers([])
      setLoading(false)
      return
    }

    const { data: p, error: pe } = await supabase
      .from('players').select('*, pool:player_pool(photo_id, age, batting, bowling)')
      .eq('team_id', t.id).order('bought_at', { ascending: false })
    if (pe) setError(pe.message)
    else setPlayers(p ?? [])
    setLoading(false)
  }, [userId])

  useEffect(() => { reload() }, [reload])

  return { team, players, error, setError, loading, reload }
}

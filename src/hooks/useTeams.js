import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

/** Every team, for the auctioneer's "sold to" dropdown. */
export function useTeams(enabled) {
  const [teams, setTeams] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!enabled) return
    supabase.from('team_status').select('id, name, max_bid, slots_left').order('name')
      .then(({ data, error: e }) => {
        if (e) setError(e.message)
        else { setError(''); setTeams(data ?? []) }
      })
  }, [enabled])

  return { teams, error }
}

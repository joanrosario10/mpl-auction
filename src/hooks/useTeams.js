import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

/**
 * Every team, for the auctioneer's "sold to" dropdown.
 * RLS returns only the caller's own team to a non-auctioneer, so this is
 * empty for owners rather than a leak.
 */
export function useTeams(enabled) {
  const [teams, setTeams] = useState([])

  useEffect(() => {
    if (!enabled) return
    supabase.from('team_status').select('id, name, max_bid, slots_left').order('name')
      .then(({ data }) => setTeams(data ?? []))
  }, [enabled])

  return teams
}

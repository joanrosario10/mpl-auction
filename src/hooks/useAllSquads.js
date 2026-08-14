import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabase'

/**
 * Every team with the players it owns — the admin and board view of the whole
 * auction. Live, so the projector never shows a stale table.
 */
export function useAllSquads() {
  const [teams, setTeams] = useState([])
  const [error, setError] = useState('')

  const fetchAll = useCallback(async () => {
      const [{ data: t, error: te }, { data: p, error: pe }] = await Promise.all([
        supabase.from('team_status').select('*').order('name'),
        supabase.from('players')
          .select('id, name, price, team_id, bought_at, pool:player_pool(photo_id)')
          .order('bought_at', { ascending: false }),
      ])
      if (te || pe) return setError((te || pe).message)
      setError('')
    setTeams((t ?? []).map(team => ({
      ...team,
      players: (p ?? []).filter(pl => pl.team_id === team.id),
    })))
  }, [])

  useEffect(() => {
    fetchAll()

    const channel = supabase.channel('all-squads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, fetchAll)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchAll])

  return { teams, error, reload: fetchAll }
}

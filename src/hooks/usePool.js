import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

/**
 * Registered players from the Google Form.
 * Subscribed, not just fetched: a form submission mid-auction must reach every
 * open screen without a refresh.
 */
export function usePool() {
  const [pool, setPool] = useState([])

  useEffect(() => {
    const fetchAll = () =>
      supabase.from('player_pool').select('*').order('name')
        .then(({ data }) => setPool(data ?? []))

    fetchAll()

    const channel = supabase.channel('pool-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'player_pool' }, fetchAll)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return pool
}

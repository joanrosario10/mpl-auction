import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

/**
 * Registered players from the Google Form.
 * Subscribed, not just fetched: a form submission mid-auction must reach every
 * open screen without a refresh.
 */
export function usePool() {
  const [pool, setPool] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchAll = async () => {
      const { data, error: e } = await supabase.from('player_pool').select('*').order('name')
      if (e) setError(e.message)
      else { setError(''); setPool(data ?? []) }
    }

    fetchAll()

    const channel = supabase.channel('pool-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'player_pool' }, fetchAll)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return { pool, error }
}

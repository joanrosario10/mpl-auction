import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabase'

/** The live match and every delivery bowled in it, kept in sync for the room. */
export function useMatch() {
  const [match, setMatch] = useState(null)
  const [deliveries, setDeliveries] = useState([])
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    const { data: m, error: me } = await supabase
      .from('matches').select('*').eq('status', 'live')
      .order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (me) return setError(me.message)
    setMatch(m)

    if (!m) return setDeliveries([])

    const { data: d, error: de } = await supabase
      .from('deliveries').select('*').eq('match_id', m.id).order('seq')
    if (de) return setError(de.message)
    setError('')
    setDeliveries(d ?? [])
  }, [])

  useEffect(() => {
    reload()
    const channel = supabase.channel('match-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deliveries' }, reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, reload)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [reload])

  return { match, deliveries, error, reload }
}

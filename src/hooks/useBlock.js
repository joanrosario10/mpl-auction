import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

/** The single player currently up for auction, kept live for every owner. */
export function useBlock() {
  const [block, setBlock] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.from('block').select('*').maybeSingle()
      .then(({ data, error: e }) => (e ? setError(e.message) : setBlock(data)))

    const channel = supabase.channel('block-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'block' },
          e => setBlock(e.eventType === 'DELETE' ? null : e.new))
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return { block, error }
}

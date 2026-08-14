import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

/** The single player currently up for auction, kept live for every owner. */
export function useBlock() {
  const [block, setBlock] = useState(null)

  useEffect(() => {
    supabase.from('block').select('*').maybeSingle().then(({ data }) => setBlock(data))

    const channel = supabase.channel('block-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'block' },
          e => setBlock(e.eventType === 'DELETE' ? null : e.new))
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return block
}

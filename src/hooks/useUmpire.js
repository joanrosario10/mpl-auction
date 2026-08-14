import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

/** Whether this user may score matches. RLS enforces it; this shapes the UI. */
export function useUmpire(userId) {
  const [isUmpire, setIsUmpire] = useState(false)

  useEffect(() => {
    if (!userId) return
    supabase.from('umpires').select('user_id').eq('user_id', userId).maybeSingle()
      .then(({ data }) => setIsUmpire(Boolean(data)))
  }, [userId])

  return isUmpire
}

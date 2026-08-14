import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

/** Whether this user may put players up. RLS enforces it; this only shapes the UI. */
export function useAuctioneer(userId) {
  const [isAuctioneer, setIsAuctioneer] = useState(false)

  useEffect(() => {
    supabase.from('auctioneers').select('user_id').eq('user_id', userId).maybeSingle()
      .then(({ data }) => setIsAuctioneer(Boolean(data)))
  }, [userId])

  return isAuctioneer
}

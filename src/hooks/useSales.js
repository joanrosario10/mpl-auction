import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

/**
 * Every sale in the auction, keyed by pool player: who bought them and for how
 * much. Live, because a sale is recorded on the auctioneer's screen and has to
 * land on everyone else's.
 */
export function useSales() {
  const [sales, setSales] = useState({})

  useEffect(() => {
    const fetchAll = async () => {
      const { data } = await supabase
        .from('players').select('pool_id, price, team:teams(name)')
        .not('pool_id', 'is', null)
      setSales(Object.fromEntries((data ?? []).map(s => [s.pool_id, s])))
    }

    fetchAll()

    const channel = supabase.channel('sales-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, fetchAll)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return sales
}

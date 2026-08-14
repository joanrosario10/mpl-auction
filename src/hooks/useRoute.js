import { useEffect, useState } from 'react'

/**
 * Hash routing, so the board survives a hard refresh on the projector and
 * needs no server rewrite rules when this is deployed as static files.
 * ponytail: three routes do not justify a router dependency.
 */
export function useRoute() {
  const [route, setRoute] = useState(() => window.location.hash.replace(/^#\/?/, '') || 'home')

  useEffect(() => {
    const onChange = () => setRoute(window.location.hash.replace(/^#\/?/, '') || 'home')
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  return route
}

import { useEffect, useState } from 'react'

export function useMediaQuery(query) {
  const get = () => (typeof window !== 'undefined' ? window.matchMedia(query).matches : false)
  const [matches, setMatches] = useState(get)

  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return matches
}

// Ngưỡng desktop = 820px. PHẢI khớp với các @media trong styles.css
// (desktop: min-width:820px, mobile: max-width:819.98px) để JS và CSS đổi bố cục cùng lúc.
export const useIsDesktop = () => useMediaQuery('(min-width: 820px)')

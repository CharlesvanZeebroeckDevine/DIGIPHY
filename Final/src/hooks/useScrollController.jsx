import { useEffect, useState } from 'react'

export const useScrollController = () => {
  const [scrollY, setScrollY] = useState(0)
  const [isScrollLocked, setIsScrollLocked] = useState(false)
  const [viewportHeight, setViewportHeight] = useState(() => window.innerHeight)

  useEffect(() => {
    const handleScroll = () => {
      if (!isScrollLocked) {
        setScrollY(window.scrollY)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isScrollLocked])

  useEffect(() => {
    const onResize = () => setViewportHeight(window.innerHeight)
    window.addEventListener('resize', onResize, { passive: true })
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const activeSection = scrollY < viewportHeight * 0.5 ? 0 : 1

  return {
    scrollY,
    activeSection,
    isScrollLocked,
    setIsScrollLocked
  }
}

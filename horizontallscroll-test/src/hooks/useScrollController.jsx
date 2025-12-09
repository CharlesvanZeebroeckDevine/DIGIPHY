import { useState, useEffect, useCallback } from 'react'

export const useScrollController = () => {
  const [scrollY, setScrollY] = useState(0)
  const [activeSection, setActiveSection] = useState(0)
  const [isScrollLocked, setIsScrollLocked] = useState(false)

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
    const viewportHeight = window.innerHeight
    if (scrollY < viewportHeight * 0.5) {
      setActiveSection(0)
    } else {
      setActiveSection(1)
    }
  }, [scrollY])

  return {
    scrollY,
    activeSection,
    isScrollLocked,
    setIsScrollLocked
  }
}

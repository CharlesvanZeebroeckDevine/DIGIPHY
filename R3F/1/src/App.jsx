import { useEffect, useRef, useState } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './App.css'
import CarScene from './scenes/CarScene'
import HorizontalScrollScene from './scenes/HorizontalScrollScene'
import TechFeatures from './scenes/TechFeatures'

gsap.registerPlugin(ScrollTrigger)

function App() {
  const lenisRef = useRef(null)
  const animationFrameRef = useRef(null)
  const [activeModelIndex, setActiveModelIndex] = useState(0)
  const [transitionOpacity, setTransitionOpacity] = useState(1.0)

  const handleModelSwitch = (newIndex) => {
    if (newIndex === activeModelIndex) return

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    const fadeOutDuration = 300
    const waitDuration = 3000
    const fadeInDuration = 300
    const totalDuration = fadeOutDuration + waitDuration + fadeInDuration

    const startTime = performance.now()
    const startOpacity = transitionOpacity
    let modelSwitched = false

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime

      if (elapsed < fadeOutDuration) {
        const progress = elapsed / fadeOutDuration
        const eased = 1 - Math.pow(1 - progress, 3)
        setTransitionOpacity(startOpacity * (1 - eased))
        animationFrameRef.current = requestAnimationFrame(animate)
      } else if (elapsed < fadeOutDuration + waitDuration) {
        setTransitionOpacity(0)

        if (!modelSwitched) {
          setActiveModelIndex(newIndex)
          modelSwitched = true
        }

        animationFrameRef.current = requestAnimationFrame(animate)
      } else if (elapsed < totalDuration) {
        const fadeInElapsed = elapsed - (fadeOutDuration + waitDuration)
        const progress = fadeInElapsed / fadeInDuration
        const eased = progress * progress * progress
        setTransitionOpacity(eased)
        animationFrameRef.current = requestAnimationFrame(animate)
      } else {
        setTransitionOpacity(1.0)
        animationFrameRef.current = null
      }
    }

    animationFrameRef.current = requestAnimationFrame(animate)
  }

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smooth: true,
      smoothTouch: false,
    })

    lenisRef.current = lenis

    lenis.on('scroll', ScrollTrigger.update)

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000)
    })

    gsap.ticker.lagSmoothing(0)

    return () => {
      lenis.destroy()
      gsap.ticker.remove(() => {})
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return (
    <>
      {/* Fixed CarScene - always in background */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1 }}>
        <CarScene 
          activeModelIndex={activeModelIndex}
          transitionOpacity={transitionOpacity}
          onModelSwitch={handleModelSwitch}
        />
      </div>

      {/* Scrollable content that overlays the CarScene */}
      <div data-scroll-container style={{ position: 'relative' }}>
        {/* Section 1: Initial car selection view - transparent to see CarScene */}
        <section id="car-selection" data-scroll-section style={{ height: '100vh', position: 'relative' }}>
          {/* This section is transparent so CarScene shows through and can be interacted with */}
        </section>
        
        {/* Section 2: Horizontal scroll storytelling - covers CarScene */}
        <section id="horizontal-scroll" data-scroll-section style={{ position: 'relative', zIndex: 2, background: 'transparent' }}>
          <HorizontalScrollScene />
        </section>

        {/* Section 3: Back to CarScene - transparent to reveal it again */}
        <section id="car-usecases" data-scroll-section style={{ height: '100vh', position: 'relative' }}>
          {/* Transparent section - CarScene visible, camera will animate to wall */}
        </section>

        {/* Section 4: Tech features */}
        <section id="tech-features" data-scroll-section style={{ height: '100vh', background: '#111', position: 'relative', zIndex: 2 }}>
          <TechFeatures />
        </section>
      </div>
    </>
  )
}

export default App

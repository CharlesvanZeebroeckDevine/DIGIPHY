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
      <div className="car_scene--container">
        <CarScene 
          activeModelIndex={activeModelIndex}
          transitionOpacity={transitionOpacity}
          onModelSwitch={handleModelSwitch}
        />
      </div>
      <div data-scroll-container className="scroll_container">
        <section id="car-selection" data-scroll-section className="section_car--selection">
          {/* This section is transparent so CarScene shows through and can be interacted with */}
        </section>
        <section data-scroll-section className="section_horizontal--scroll">
          <HorizontalScrollScene />
        </section>
        <section id="car-usecases" data-scroll-section className="section_car--usecases">
          {/* Transparent section - CarScene visible, camera will animate to wall */}
        </section>
        <section id="tech-features" data-scroll-section className="section_tech--features">
          <TechFeatures />
        </section>
      </div>
    </>
  )
}

export default App

import { useEffect, useRef } from 'react'
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
    }
  }, [])

  return (
    <>
      <div data-scroll-container>
        <section id="car-scene" data-scroll-section style={{ height: '100vh', position: 'relative' }}>
          <CarScene />
        </section>
        
        <section id="horizontal-scroll" data-scroll-section style={{ position: 'relative' }}>
          <HorizontalScrollScene />
        </section>

        <section id="next-scene" data-scroll-section style={{ height: '100vh', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', position: 'relative' }}>
          <TechFeatures />
        </section>
      </div>
    </>
  )
}

export default App

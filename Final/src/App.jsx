import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './App.css'
import CarScene from './scenes/CarScene'
import HorizontalScrollScene from './scenes/HorizontalScrollScene'
import TechFeatures from './scenes/TechFeatures'
import Contact from './scenes/Contact'
import Footer from './scenes/Footer'
import LoadingScreen from './Components/LoadingScreen'
import Nav from './Components/Nav'
import { TRANSITION_CONFIG } from './scenes/CarScene/config'

gsap.registerPlugin(ScrollTrigger)

function App() {
  const lenisRef = useRef(null)
  const animationFrameRef = useRef(null)
  const horizontalSectionRef = useRef(null)
  const gsapTickerRef = useRef(null)
  const refreshRafRef = useRef(0)
  const [activeModelIndex, setActiveModelIndex] = useState(0)
  const [transitionOpacity, setTransitionOpacity] = useState(1.0)
  const [uiVisible, setUiVisible] = useState(true)
  const [cameraProgress, setCameraProgress] = useState(0)
  const [carSceneEnabled, setCarSceneEnabled] = useState(true) // Performance optimization
  const [zoomLevel, setZoomLevel] = useState(0) // Camera interpolation level (0-1)
  const [interactionStrength, setInteractionStrength] = useState(1) // Mouse parallax strength (1-0)

  const handleModelSwitch = (newIndex) => {
    if (newIndex === activeModelIndex) return

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    const fadeOutDuration = TRANSITION_CONFIG.fadeOutDuration
    const waitDuration = TRANSITION_CONFIG.waitDuration
    const fadeInDuration = TRANSITION_CONFIG.fadeInDuration
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

  useLayoutEffect(() => {
    // Reset scroll to top on reload
    window.history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)

    const scheduleScrollTriggerRefresh = () => {
      if (refreshRafRef.current) return
      refreshRafRef.current = requestAnimationFrame(() => {
        refreshRafRef.current = 0
        ScrollTrigger.refresh()
      })
    }

    const ctx = gsap.context(() => {

      const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smooth: true,
        smoothTouch: false,
      })

      lenisRef.current = lenis

      lenis.on('scroll', ScrollTrigger.update)

      // Add ticker and store reference for cleanup
      const tickerFunc = (time) => {
        lenis.raf(time * 1000)
      }
      gsap.ticker.add(tickerFunc)
      gsapTickerRef.current = tickerFunc

      // Store ticker in ref for cleanup outside context if needed (though context handles most)
      // Actually gsap.context doesn't remove ticker listeners automatically usually, so we do it in cleanup

      // UI Visibility Trigger
      ScrollTrigger.create({
        trigger: horizontalSectionRef.current,
        start: 'top top',
        end: 'bottom top',
        onEnter: () => setUiVisible(false),
        onLeaveBack: () => setUiVisible(true)
      })

      // Camera Interpolation: Zoom OUT (0 -> 1) when entering HorizontalScrollScene
      ScrollTrigger.create({
        trigger: horizontalSectionRef.current,
        start: 'top 90%',
        end: 'top 20%',
        scrub: true,
        onUpdate: (self) => {
          setZoomLevel(self.progress)
          setInteractionStrength(1 - self.progress)
        }
      })

      // Camera Sequence Trigger (Pin & Drive)
      ScrollTrigger.create({
        trigger: '#car-usecases',
        start: () => 'top top',
        end: () => '+=3000',
        pin: true,
        scrub: true,
        refreshPriority: 0,
        onUpdate: (self) => setCameraProgress(self.progress)
      })

      // Initial Refresh
      scheduleScrollTriggerRefresh()

    })

    // === LAYOUT & RESIZE HANDLING ===
    // 1. Monitor Body Resize: Ensures scroll triggers update on any layout shift/font load
    const resizeObserver = new ResizeObserver(scheduleScrollTriggerRefresh)
    resizeObserver.observe(document.body)

    // 2. Asset Load Safety
    const handleLoad = () => scheduleScrollTriggerRefresh()
    window.addEventListener('load', handleLoad)

    gsap.ticker.lagSmoothing(0)

    return () => {
      ctx.revert()
      if (gsapTickerRef.current) {
        gsap.ticker.remove(gsapTickerRef.current)
        gsapTickerRef.current = null
      }
      if (lenisRef.current) {
        lenisRef.current.destroy()
        lenisRef.current = null
      }
      if (refreshRafRef.current) {
        cancelAnimationFrame(refreshRafRef.current)
        refreshRafRef.current = 0
      }
      resizeObserver.disconnect()
      window.removeEventListener('load', handleLoad)
    }
  }, [])

  const handleScrollToSection = (id, offset = 0) => {
    if (lenisRef.current) {
      let calculatedOffset = offset
      if (typeof offset === 'string' && offset.includes('vh')) {
        const vh = parseFloat(offset)
        calculatedOffset = (vh * window.innerHeight) / 100
      }

      lenisRef.current.scrollTo(`#${id}`, {
        duration: 2.0,
        offset: calculatedOffset
      })
    }
  }

  return (
    <>
      <LoadingScreen />
      <div className="nav_container">
        <Nav scrollToSection={handleScrollToSection} />
      </div>
      <div className="car_scene--container">
        <CarScene
          activeModelIndex={activeModelIndex}
          transitionOpacity={transitionOpacity}
          onModelSwitch={handleModelSwitch}
          uiVisible={uiVisible}
          cameraProgress={cameraProgress}
          isEnabled={carSceneEnabled}
          zoomLevel={zoomLevel}
          interactionStrength={interactionStrength}
        />
      </div>
      <div data-scroll-container className="scroll_container">
        <section id="car-selection" data-scroll-section className="section_car--selection">
          {/* This section is transparent so CarScene shows through and can be interacted with */}
        </section>
        <section ref={horizontalSectionRef} data-scroll-section className="section_horizontal--scroll">
          <HorizontalScrollScene />
        </section>
        <section id="car-usecases" data-scroll-section className="section_car--usecases">
          {/* Transparent section - CarScene visible, camera will animate to wall */}
        </section>
        <section id="tech-features" data-scroll-section className="section_tech--features">
          <TechFeatures />
        </section>
        <section id="contact" data-scroll-section className="section_contact">
          <Contact />
        </section>
        <section id="footer" data-scroll-section className="section_footer">
          <Footer scrollToSection={handleScrollToSection} />
        </section>
      </div>
    </>
  )
}

export default App

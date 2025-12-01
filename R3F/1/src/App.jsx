import { Canvas } from '@react-three/fiber'
import { useGLTF, Stats, AdaptiveDpr, AdaptiveEvents } from '@react-three/drei'
import * as THREE from 'three'
import { useState, useEffect, useRef } from 'react'
import Experience from './Experience'
import './App.css'
import SideScrollSection from './sideScrollSection'

// Preload car models for smooth transitions
function PreloadModels() {
  useGLTF.preload('/BmwSUV.glb')
  useGLTF.preload('/CAR2.glb')
  useGLTF.preload('/FordTransit.glb')
  return null
}

function NavigationDots({ activeIndex, onDotClick }) {
  return (
    <div className="navigation-dots">
      <div
        className={`nav-dot ${activeIndex === 0 ? 'active' : ''}`}
        onClick={() => onDotClick(0)}
      ></div>
      <div
        className={`nav-dot ${activeIndex === 1 ? 'active' : ''}`}
        onClick={() => onDotClick(1)}
      ></div>
      <div
        className={`nav-dot ${activeIndex === 2 ? 'active' : ''}`}
        onClick={() => onDotClick(2)}
      ></div>
    </div>
  )
}

function App() {
  const [activeModelIndex, setActiveModelIndex] = useState(0)
  const [transitionOpacity, setTransitionOpacity] = useState(1.0)
  const animationFrameRef = useRef(null)

  const carModels = [
    '/BmwSUV.glb',
    '/CAR2.glb',
    '/FordTransit.glb'
  ]

  const activeModelPath = carModels[activeModelIndex]

  // Handle model switching with smooth opacity transition
  const handleModelSwitch = (newIndex) => {
    if (newIndex === activeModelIndex) return

    // Cancel any ongoing animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    const fadeOutDuration = 300 // 0.3s
    const waitDuration = 3000 // 3.0s
    const fadeInDuration = 300 // 0.3s
    const totalDuration = fadeOutDuration + waitDuration + fadeInDuration

    const startTime = performance.now()
    const startOpacity = transitionOpacity
    let modelSwitched = false

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime

      if (elapsed < fadeOutDuration) {
        // Phase 1: Fade Out
        const progress = elapsed / fadeOutDuration
        // Ease-out
        const eased = 1 - Math.pow(1 - progress, 3)
        setTransitionOpacity(startOpacity * (1 - eased))
        animationFrameRef.current = requestAnimationFrame(animate)
      } else if (elapsed < fadeOutDuration + waitDuration) {
        // Phase 2: Wait (Blank)
        setTransitionOpacity(0)

        // Switch model at the start of the wait phase
        if (!modelSwitched) {
          setActiveModelIndex(newIndex)
          modelSwitched = true
        }

        animationFrameRef.current = requestAnimationFrame(animate)
      } else if (elapsed < totalDuration) {
        // Phase 3: Fade In
        const fadeInElapsed = elapsed - (fadeOutDuration + waitDuration)
        const progress = fadeInElapsed / fadeInDuration
        // Ease-in
        const eased = progress * progress * progress
        setTransitionOpacity(eased)
        animationFrameRef.current = requestAnimationFrame(animate)
      } else {
        // Animation Complete
        setTransitionOpacity(1.0)
        animationFrameRef.current = null
      }
    }

    animationFrameRef.current = requestAnimationFrame(animate)
  }

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return (
    <>
      <PreloadModels />
      <Canvas
        shadows
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1,
          outputColorSpace: THREE.SRGBColorSpace
        }}
      >
        <Stats />
        <AdaptiveDpr pixelated />
        <AdaptiveEvents />
        <Experience
          activeModelPath={activeModelPath}
          transitionOpacity={transitionOpacity}
        />
      </Canvas>
      <NavigationDots
        activeIndex={activeModelIndex}
        onDotClick={handleModelSwitch}
      />
    <SideScrollSection />
    </>
  )
}

export default App

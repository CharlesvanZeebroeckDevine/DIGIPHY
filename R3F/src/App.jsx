import { Canvas } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useState, useEffect, useRef } from 'react'
import Experience from './Experience'
import './App.css'

// Preload car models for smooth transitions
function PreloadModels() {
  useGLTF.preload('/BMWGWagon.glb')
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
    '/BMWGWagon.glb',
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

    const transitionDuration = 400 // ms
    const startTime = performance.now()
    const startOpacity = transitionOpacity
    let modelSwitched = false

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / transitionDuration, 1)

      if (progress < 0.5) {
        // Fade out phase
        const fadeOutProgress = progress * 2 // 0 to 1
        // Ease-out for fade out
        const eased = 1 - Math.pow(1 - fadeOutProgress, 3)
        setTransitionOpacity(startOpacity * (1 - eased))
        animationFrameRef.current = requestAnimationFrame(animate)
      } else {
        // Switch model at midpoint
        if (!modelSwitched) {
          setActiveModelIndex(newIndex)
          modelSwitched = true
        }

        // Fade in phase
        const fadeInProgress = (progress - 0.5) * 2 // 0 to 1
        // Ease-in for fade in
        const eased = fadeInProgress * fadeInProgress * fadeInProgress
        setTransitionOpacity(eased)

        if (progress < 1.0) {
          animationFrameRef.current = requestAnimationFrame(animate)
        } else {
          // Transition complete
          setTransitionOpacity(1.0)
          animationFrameRef.current = null
        }
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
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1,
          outputColorSpace: THREE.SRGBColorSpace
        }}
      >
        <Experience
          activeModelPath={activeModelPath}
          transitionOpacity={transitionOpacity}
        />
      </Canvas>
      <NavigationDots
        activeIndex={activeModelIndex}
        onDotClick={handleModelSwitch}
      />
    </>
  )
}

export default App

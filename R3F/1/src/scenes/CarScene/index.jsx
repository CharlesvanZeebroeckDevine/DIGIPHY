import { Canvas } from '@react-three/fiber'
import { useGLTF, Stats, AdaptiveDpr, AdaptiveEvents } from '@react-three/drei'
import * as THREE from 'three'
import { useState, useEffect, useRef } from 'react'
import Experience from './Experience'
import NavigationDots from './NavigationDots'

function PreloadModels() {
  useGLTF.preload('/BmwSUV.glb')
  useGLTF.preload('/CAR2.glb')
  useGLTF.preload('/FordTransit.glb')
  return null
}

function CarScene() {
  const [activeModelIndex, setActiveModelIndex] = useState(0)
  const [transitionOpacity, setTransitionOpacity] = useState(1.0)
  const animationFrameRef = useRef(null)

  const carModels = [
    '/BmwSUV.glb',
    '/CAR2.glb',
    '/FordTransit.glb'
  ]

  const activeModelPath = carModels[activeModelIndex]

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
    </>
  )
}

export default CarScene

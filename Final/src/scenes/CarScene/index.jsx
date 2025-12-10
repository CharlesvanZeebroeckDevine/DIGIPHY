import { Canvas } from '@react-three/fiber'
import { useGLTF, Stats, AdaptiveDpr, AdaptiveEvents } from '@react-three/drei'
import * as THREE from 'three'
import { useEffect, useRef } from 'react'
import Experience from './Experience'
import CarSceneOverlay from './CarSceneOverlay'

function PreloadModels() {
  useGLTF.preload('car-models/BmwSUV.glb')
  useGLTF.preload('car-models/AudiSport.glb')
  useGLTF.preload('car-models/FordTransit.glb')
  return null
}

const carModels = [
  'car-models/BmwSUV.glb',
  'car-models/AudiSport.glb',
  'car-models/FordTransit.glb'
]

function CarScene({ activeModelIndex, transitionOpacity, onModelSwitch, uiVisible = true, cameraProgress = 0 }) {
  const animationFrameRef = useRef(null)

  const activeModelPath = carModels[activeModelIndex]

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        pointerEvents: 'auto'
      }}
    >
      <PreloadModels />
      <Canvas
        shadows
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          toneMapping: THREE.NoToneMapping,
          toneMappingExposure: 2,
          outputColorSpace: THREE.SRGBColorSpace
        }}
      >
        <Stats />
        <AdaptiveDpr pixelated />
        <AdaptiveEvents />
        <Experience
          activeModelPath={activeModelPath}
          transitionOpacity={transitionOpacity}
          cameraProgress={cameraProgress}
        />
      </Canvas>

      <CarSceneOverlay
        activeModelIndex={activeModelIndex}
        onModelSwitch={onModelSwitch}
        visible={uiVisible}
      />
    </div>
  )
}

export default CarScene

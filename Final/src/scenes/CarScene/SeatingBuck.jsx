
import React, { useEffect, useRef } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'
import { LED_CONFIG, FLIP_MODELS_X } from './config'

export default function SeatingBuck({ activeModelIndex }) {
    const { scene, animations } = useGLTF('/SB.glb')
    const { actions, mixer } = useAnimations(animations, scene)
    const prevIndex = useRef(activeModelIndex)
    const ledMaterialsRef = useRef([])

    // Apply LED configuration and cache materials
    useEffect(() => {
        ledMaterialsRef.current = [] // Reset cache
        if (scene) {
            scene.traverse((child) => {
                if (child.isMesh) {
                    if (child.material.name === 'Led') {
                        console.log('[SeatingBuck] Found LED Material:', child.material.name)
                        child.material.emissive = new THREE.Color(LED_CONFIG.color)
                        child.material.emissiveIntensity = LED_CONFIG.intensity
                        child.material.toneMapped = false
                        ledMaterialsRef.current.push(child.material)
                    }
                }
            })
            console.log('[SeatingBuck] Total LED materials cached:', ledMaterialsRef.current.length)
        }
    }, [scene])

    // Handle Transition Animations
    useEffect(() => {
        if (prevIndex.current === activeModelIndex) return

        // Convert 0-based index to 1-based index (0->1, 1->2, 2->3)
        const from = prevIndex.current + 1
        const to = activeModelIndex + 1

        const clipName = `CAR_${from}_${to}`
        const action = actions[clipName]

        if (action) {
            console.log(`[SeatingBuck] Playing animation: ${clipName}`)

            // Set LEDs to Active Color ("Working" state)
            console.log(`[SeatingBuck] Setting LEDs to ACTIVE: ${LED_CONFIG.activeColor}`)
            ledMaterialsRef.current.forEach(mat => {
                mat.emissive.set(LED_CONFIG.activeColor)
            })

            // Stop other animations to avoid conflicts
            Object.values(actions).forEach(act => {
                if (act !== action) act.stop()
            })

            // Play new animation
            action.reset()
            action.setLoop(THREE.LoopOnce)
            action.clampWhenFinished = true
            action.play()

            // Reset LEDs to default ("Idle" state) when finished
            const onFinished = (e) => {
                if (e.action === action) {
                    ledMaterialsRef.current.forEach(mat => {
                        mat.emissive.set(LED_CONFIG.color)
                    })
                    mixer.removeEventListener('finished', onFinished)
                }
            }
            mixer.addEventListener('finished', onFinished)

        } else {
            console.warn(`[SeatingBuck] Animation not found: ${clipName}`)
        }

        prevIndex.current = activeModelIndex
    }, [activeModelIndex, actions, mixer])

    const modelScale = FLIP_MODELS_X ? [-1, 1, 1] : [1, 1, 1]

    return <primitive object={scene} scale={modelScale} />
}

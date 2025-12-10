
import React, { useEffect, useRef } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'
import { LED_CONFIG, FLIP_MODELS_X, TRANSITION_CONFIG } from './config'

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

            // Start Blink Sequence: OFF -> IDLE -> OFF -> IDLE -> ACTIVE
            // Total blink time: ~400ms (fast)
            const blinkDuration = 100

            const blinkSequence = async () => {
                const setLeds = (colorHex) => {
                    ledMaterialsRef.current.forEach(mat => mat.emissive.set(colorHex))
                }

                // Blink 1 (Purple)
                setLeds('#000000') // OFF
                await new Promise(r => setTimeout(r, blinkDuration))
                setLeds(LED_CONFIG.color) // ON (Purple)
                await new Promise(r => setTimeout(r, blinkDuration))

                // Blink 2 (Purple)
                setLeds('#000000') // OFF
                await new Promise(r => setTimeout(r, blinkDuration))
                setLeds(LED_CONFIG.color) // ON (Purple)
                await new Promise(r => setTimeout(r, blinkDuration))

                // Switch to Active (Green)
                setLeds(LED_CONFIG.activeColor)
            }

            console.log(`[SeatingBuck] Starting LED Blink Sequence (Purple -> Green)`)
            blinkSequence()

            // Stop other animations to avoid conflicts
            Object.values(actions).forEach(act => {
                if (act !== action) act.stop()
            })

            // Calculate timeScale so animation fits exactly in waitDuration
            // buffer: Wait 90% of the duration to be safe, or 100% if precise
            const targetDurationSeconds = TRANSITION_CONFIG.waitDuration / 1000
            const clipDuration = action.getClip().duration
            const timeScale = clipDuration / targetDurationSeconds

            console.log(`[SeatingBuck] Syncing speed: Clip=${clipDuration}s Target=${targetDurationSeconds}s Scale=${timeScale}`)

            // Play new animation
            action.reset()
            action.setEffectiveTimeScale(timeScale)
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

import './HorizontalScrollScene.css'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stats } from '@react-three/drei'
import { Sphere } from './Sphere'
import { Suspense, useRef, useLayoutEffect } from 'react'
import VariableText from '../../Components/VariableText'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(ScrollTrigger, SplitText)

const SPEED_SENSITIVITY = 10
const BASE_FREQUENCY = 1

function SceneContent({ containerRef }) {
    const sphereRef = useRef(null)
    // Ref to track animation state without re-renders
    const animState = useRef({ intensity: 1 })

    useLayoutEffect(() => {
        // Now this only runs after Suspense resolves, so sphereRef.current SHOULD be populated
        if (!sphereRef.current || !containerRef.current) return

        const ctx = gsap.context(() => {
            const leftPivot = sphereRef.current.leftPivot
            const rightPivot = sphereRef.current.rightPivot
            const leftSphere = sphereRef.current.leftSphere
            const rightSphere = sphereRef.current.rightSphere

            if (!leftPivot || !rightPivot || !leftSphere || !rightSphere) return

            // Initial Setup
            const START_RADIUS = -12
            const OFF_SCREEN_RADIUS = -25

            // 1. Initial State: OFF SCREEN
            gsap.set([leftSphere.position, rightSphere.position], { x: OFF_SCREEN_RADIUS })

            // Ensure Pivots are aligned (One at 0 deg, one at 180 deg)
            gsap.set(leftPivot.rotation, { y: 0 })
            gsap.set(rightPivot.rotation, { y: Math.PI }) // Starts opposite

            // === ENTRY ANIMATION ===
            // Move from off-screen to start position as container enters viewport
            const entryTl = gsap.timeline({
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: 'top bottom', // Top of container hits bottom of viewport
                    end: 'top top',      // Top of container hits top of viewport
                    scrub: true,
                    markers: false
                }
            })

            entryTl.to([leftSphere.position, rightSphere.position], {
                x: START_RADIUS,
                ease: 'power1.out'
            })

            // === OVERLAY TEXT SETUP ===
            const overlayText = containerRef.current.querySelector('.horizontal_scroll--overlay-text')
            let splitChars = []
            if (overlayText) {
                const split = new SplitText(overlayText, { type: 'chars' })
                splitChars = split.chars

                // Initial Reveal (triggered by scroll position)
                gsap.from(splitChars, {
                    scrollTrigger: {
                        trigger: containerRef.current,
                        start: 'bottom 100%',
                        toggleActions: 'play none play none'
                    },
                    opacity: 1,
                    y: 50,
                    stagger: 0.05,
                    duration: 1,
                    ease: 'power3.out'
                })
            }

            // === MAIN ANIMATION ===
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: 'top top',
                    end: '+=400%',
                    pin: true,
                    scrub: true,
                    markers: false,
                    refreshPriority: 1 // CRITICAL: Calculate this pin BEFORE the next section
                }
            })
            // Ensure Pivots are aligned (One at 0 deg, one at 180 deg)
            gsap.set(leftPivot.rotation, { y: 0 })
            gsap.set(rightPivot.rotation, { y: Math.PI }) // Starts opposite

            // Initial Scale
            gsap.set([leftSphere.scale, rightSphere.scale], { x: 5, y: 5, z: 5 })

            // Reset intensity
            animState.current.intensity = 1

            // === PHASE 1: The Spiral In ===
            // They orbit 1 full turn (360) + merge to center
            tl.to([leftPivot.rotation, rightPivot.rotation], {
                y: "+=" + Math.PI * 2.5, // Rotate 270 degrees (spiral effect)
                ease: "power1.inOut",
                duration: 3
            }, "phase1")

                .to([leftSphere.position, rightSphere.position], {
                    x: 0, // Radius shrinks to 0 (They meet at the center)
                    ease: "power2.in", // Accelerate into the collision
                    duration: 3
                }, "phase1")

                // Add some individual rotation to the spheres so they tumble while orbiting
                .to([leftSphere.rotation, rightSphere.rotation], {
                    z: Math.PI / 2, // Tilt them slightly as they fly in
                    y: Math.PI,     // Spin on own axis
                    duration: 3
                }, "phase1")

                .to(animState.current, {
                    intensity: 0,
                    duration: 3
                }, "phase1")

                // HIDE TEXT HALFWAY THROUGH PHASE 1
                .to(splitChars, {
                    y: 50,
                    opacity: 1,
                    stagger: 0.05,
                    duration: 0.5,
                    ease: 'power2.in'
                }, "phase1+=1")


                // === PHASE 2: The Merge & Pop ===
                // Now they are both at [0,0,0] inside the pivots.
                .to([leftSphere.scale, rightSphere.scale], {
                    x: 0.1, y: 0.1, z: 0.1, // Become the dot
                    duration: 0.5,
                    ease: "back.in(2)" // Slight anticipation pop before shrinking
                })

            // === CENTER DOT ANIMATION ===
            const centerDot = containerRef.current.querySelector('.horizontal_scroll--center-dot')
            if (centerDot) {
                gsap.set(centerDot, { scale: 0, opacity: 0 })

                // Appear at the end of Phase 2 (when spheres pop)
                tl.to(centerDot, {
                    scale: 1,
                    opacity: 1,
                    duration: 0.3,
                    ease: "back.out(2)"
                }, ">") // Start AFTER the spheres have fully shrunk

                // Final Text Reveal
                const finalText = containerRef.current.querySelector('.horizontal_scroll--final-text')
                if (finalText) {
                    const splitFinal = new SplitText(finalText, { type: 'chars, words' })
                    gsap.set(splitFinal.chars, { opacity: 0, x: -10 })

                    tl.to(splitFinal.chars, {
                        opacity: 1,
                        x: 0,
                        stagger: 0.02,
                        duration: 0.5,
                        ease: "power2.out"
                    }, ">") // Play sequentially after dot appears
                }
            }

            // CRITICAL: Refresh triggers after setting up this pin to ensure downstream triggers (like UseCases) 
            // know where they should actually start.
            ScrollTrigger.refresh()

        }, containerRef) // Scope to container

        return () => ctx.revert()
    }, [containerRef])

    // Track phase for continuous wave even with changing frequency
    const phase = useRef(0)
    // Track previous mouse position to calculate speed
    const prevMouse = useRef({ x: 0, y: 0 })

    useFrame((state, delta) => {
        if (!sphereRef.current) return

        const { leftRings, rightRings } = sphereRef.current
        const intensity = animState.current.intensity

        // Optimization: skip if intensity is negligible
        if (intensity <= 0.001) return

        // Calculate Mouse Speed
        const mouseX = state.mouse.x
        const mouseY = state.mouse.y

        // Distance roughly equals speed per frame (normalized coordinates)
        const dx = mouseX - prevMouse.current.x
        const dy = mouseY - prevMouse.current.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        // Update prev mouse
        prevMouse.current.x = mouseX
        prevMouse.current.y = mouseY

        // Base speed + Speed influence
        // dist is usually small (e.g. 0.01 per frame), so multiply up
        const currentFreq = BASE_FREQUENCY + (dist * SPEED_SENSITIVITY)

        // Accumulate phase: phase += freq * delta
        phase.current += currentFreq * delta

        // Enforce lookAt(0,0,0)
        state.camera.lookAt(0, 0, 0)

        const currentPhase = phase.current

        // Apply staggered scale to left rings
        if (leftRings) {
            leftRings.forEach((ring, i) => {
                if (ring) {
                    const stagger = i * 0.2
                    const wave = Math.sin(currentPhase + stagger)

                    // Fixed amplitude now, or maybe slightly responsive?
                    // "Set a base pulsating speed" -> Implies base pulsing is always happening.
                    // Let's keep amplitude constant so the SPEED is the hero.
                    // Scale oscillates between 2 (base) +/- amplitude
                    // Current scale prop was: scale = 2 + (wave * mouseFactor * intensity * 0.5)
                    // New scale: Base 2, Amplitude 0.5 (scaled by intensity decay)
                    const amplitude = 0.5 * intensity
                    const scale = 1 + (wave * amplitude)

                    ring.scale.set(scale, 1, scale)
                    ring.rotation.set(0, 0, 0)
                }
            })
        }

        // Apply staggered scale to right rings
        if (rightRings) {
            rightRings.forEach((ring, i) => {
                if (ring) {
                    const stagger = i * 0.2
                    const wave = Math.sin(currentPhase + stagger)
                    const amplitude = 0.5 * intensity
                    const scale = 1 + (wave * amplitude)

                    ring.scale.set(scale, 1, scale)
                    ring.rotation.set(0, 0, 0)
                }
            })
        }
    })

    return (
        <>
            <ambientLight intensity={1} />
            <Sphere ref={sphereRef} />
            {/* <OrbitControls /> */}
        </>
    )
}

// === MAIN COMPONENT: Horizontal scroll scene container ===
export default function HorizontalScrollScene() {
    const containerRef = useRef(null)

    return (
        <>
            <div className="horizontal_scroll--title">
                <VariableText
                    className="title-text"
                    baseSettings={{ wght: 100, slnt: 0, CNTR: 100, letterSpacing: -5 }}
                    hoverSettings={{ wght: 900, slnt: 100, CNTR: 0, letterSpacing: 5 }}
                    radius={700}
                    fullEffectRadius={200}
                >
                    Inside DIGIPHY 2.0
                </VariableText>
            </div>

            <Stats />


            {/* Container provides scroll distance (defined in CSS) */}
            <div ref={containerRef} className="horizontal_scroll--container">
                {/* Sticky wrapper is handled by ScrollTrigger check, but we keep the structure */}
                <div className="horizontal_scroll--sticky">
                    <Canvas
                        camera={{ position: [0, -10, 0], fov: 55 }}
                        style={{ width: '100%', height: '100%' }}
                    >
                        <Suspense fallback={null}>
                            <color attach="background" args={['#000000']} />
                            <SceneContent containerRef={containerRef} />
                        </Suspense>
                    </Canvas>
                    <div className="horizontal_scroll--overlay-text">
                        1. Auto Alignment
                    </div>
                    {/* Centered White Dot SVG */}
                    <div className="horizontal_scroll--center-dot">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="5" cy="5" r="2.5" fill="white" />
                        </svg>
                    </div>
                    {/* Final Reveal Text */}
                    <div className="horizontal_scroll--final-text">
                        using algorithms to combine the physical and virtual worlds instantly.
                    </div>
                </div>
            </div>
        </>
    )
};
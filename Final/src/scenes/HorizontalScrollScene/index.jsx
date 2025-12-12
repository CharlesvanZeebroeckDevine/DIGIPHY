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

                // Initial state
                gsap.set(splitChars, { opacity: 0, y: 50 })
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
                    refreshPriority: 1
                }
            })
            // Ensure Pivots are aligned (One at 0 deg, one at 180 deg)
            gsap.set(leftPivot.rotation, { y: 0 })
            gsap.set(rightPivot.rotation, { y: Math.PI }) // Starts opposite

            // Initial Scale
            gsap.set([leftSphere.scale, rightSphere.scale], { x: 5, y: 5, z: 5 })

            // Reset intensity
            animState.current.intensity = 1

            // === REVEAL TEXT (Phase 0) ===
            // Fade in as the pin starts
            if (splitChars.length) {
                tl.to(splitChars, {
                    opacity: 1,
                    y: 0,
                    stagger: 0.05,
                    duration: 0.5, // Faster duration relative to scrub
                    ease: 'power2.out'
                }, 0)
            }

            // === PHASE 1: The Spiral In ===
            // Explicitly set phase1 start to 0 to overlap with text reveal
            tl.addLabel("phase1", 0)

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
                    y: -50, // Move UP to exit (follows flow)
                    opacity: 0,
                    stagger: 0.02, // Exit faster
                    duration: 0.5,
                    ease: 'power2.in'
                }, "phase1+=1.5") // Slightly later in phase 1 to keep it visible during the start of spiral


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
                }, "-=0.2") // Start AFTER the spheres have fully shrunk

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
                    }, "-=0.3") // Play sequentially after dot appears
                }
            }

            // === PHASE 3: Content Scroll & Line Reveal ===
            // This happens after the final text has revealed.
            // We want to simulate continuing to scroll right, so the content moves left.
            const track = containerRef.current.querySelector('.horizontal_track')
            const bezierPath = containerRef.current.querySelector('.horizontal_scroll--bezier-line path')

            if (track && bezierPath) {
                // Get path length for drawing animation
                const length = bezierPath.getTotalLength()
                gsap.set(bezierPath, { strokeDasharray: length, strokeDashoffset: length })

                tl.addLabel("phase3")

                // Move Track Left
                // The track is 200vw wide. We want to move it 100vw to the left to show the second panel.
                // xPercent: -50 of 200vw = -100vw.
                tl.to(track, {
                    xPercent: -50,
                    duration: 3,
                    ease: "none" // Linear movement for scroll feel
                }, "phase3+=0.5")

                // Reveal Line (Draw it)
                // It should look like it's trailing out of the dot as the dot moves left.
                // So we animate strokeDashoffset from length -> 0
                tl.to(bezierPath, {
                    strokeDashoffset: 0,
                    duration: 2.5, // slightly faster than the move so it catches up? Or synced?
                    ease: "power1.inOut"
                }, "phase3+=0.5")
            }

            // Refresh triggers to update downstream pins
            ScrollTrigger.refresh()

        }, containerRef)

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
                    {/* Phase 3 Content: Horizontal Track (200vw) */}
                    <div className="horizontal_track">
                        {/* Panel 1: Contains Dot and Text */}
                        <div className="track_panel">
                            <div className="horizontal_scroll--center-dot">
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="5" cy="5" r="2.5" fill="white" />
                                </svg>
                            </div>

                            <div className="horizontal_scroll--final-text">
                                using algorithms to combine the physical and virtual worlds instantly
                            </div>
                        </div>

                        {/* SVG Line: Positioned absolute relative to Track, starting at center of Panel 1 */}
                        <svg className="horizontal_scroll--bezier-line" width="100%" height="200" viewBox="0 0 1000 200" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                            <path
                                d="M 0,100 C 300,100 400,180 700,100 S 1000,100 1000,100"
                                stroke="white"
                                strokeWidth="2"
                                fill="none"
                            />
                        </svg>
                    </div>
                </div>
            </div>
        </>
    )
}
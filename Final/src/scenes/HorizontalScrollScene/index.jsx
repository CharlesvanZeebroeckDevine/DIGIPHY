import './HorizontalScrollScene.css'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stats, Environment } from '@react-three/drei'
import { Sphere } from './Sphere'
import { SteeringWheel } from './SteeringWheel'
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
                .set([leftSphere, rightSphere], { visible: false })

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

                // === PARALLAX ITEMS ===
                const trackItems = containerRef.current.querySelectorAll('.track_item')
                trackItems.forEach((item, i) => {
                    const mask = item.querySelector('.track_item--reveal-mask')
                    const img = item.querySelector('.track_item--img')

                    if (mask && img) {
                        // 1. REVEAL (Clip Path)
                        // Animate from inset(0 0 0 100%) -> inset(0 0 0 0%)
                        // Start slightly after the line starts passing this area.
                        // Since it's at 110vw, and we move 100vw over 3s, it enters around 33-50% mark?
                        // Let's offset it based on index or position.
                        tl.to(mask, {
                            clipPath: 'inset(0% 0% 0% 0%)',
                            duration: 1.5,
                            ease: 'power2.out'
                        }, "phase3+=0.5") // Earlier entry

                        // 2. PARALLAX (Inner Image Movement)
                        // As the container moves LEFT, move the image slightly RIGHT (or slower left)
                        // creating depth.
                        // We run this concurrent with the track movement.
                        // Since track moves for 3s, let's span that.
                        tl.to(img, {
                            xPercent: 15, // Move image 15% to the right inside its container
                            ease: "none",
                            duration: 3
                        }, "phase3+=0.5")

                        // 3. TEXT REVEAL
                        const text = item.querySelector('.track_item--text')
                        if (text) {
                            const split = new SplitText(text, { type: 'chars, words' })
                            gsap.set(split.chars, { opacity: 0, x: -10 })

                            tl.to(split.chars, {
                                opacity: 1,
                                x: 0,
                                stagger: 0.01, // Faster stagger for smaller text
                                duration: 0.5,
                                ease: "power2.out"
                            }, "phase3+=1") // Sync with mask reveal start
                        }
                    }
                })

                // === CMF TEXT REVEAL ===
                const cmfText = containerRef.current.querySelector('.cmf-text-pos')
                if (cmfText) {
                    const splitCmf = new SplitText(cmfText, { type: 'chars' })
                    gsap.set(splitCmf.chars, { opacity: 0, y: 50 }) // Same initial state as Auto Alignment

                    tl.to(splitCmf.chars, {
                        opacity: 1,
                        y: 0,
                        stagger: 0.05,
                        duration: 0.5,
                        ease: "power2.out"
                    }, "phase3+=2") // Triggers later in the scroll (adjust based on position)
                }
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
                    <h1>Inside DIGIPHY 2.0</h1>
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
                            <color attach="background" args={['#191411']} />
                            <SceneContent containerRef={containerRef} />
                        </Suspense>
                    </Canvas>
                    <div className="horizontal_section_category horizontal_scroll--overlay-text">
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
                        <svg className="horizontal_scroll--bezier-line" width="100%" height="200" viewBox="0 0 1500 200" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                            <path
                                d="M 0,100 C 300,100 400,180 700,100 S 1200,100 1500,100"
                                stroke="var(--doctor)"
                                strokeWidth="2"
                                fill="none"
                            />
                        </svg>

                        {/* TRACK ITEM 1: Parallax Image */}
                        {/* Positioned in Panel 2 range but closer to start (75vw) */}
                        <div className="track_item" style={{ left: '75vw', top: '25vh' }}>
                            <div className="track_item--reveal-mask">
                                <img
                                    className="track_item--img"
                                    src="/pictures/1.webp"
                                    alt="Process"
                                />
                            </div>
                            <div className="track_item--text">
                                for seamless integration of physical properties.
                            </div>
                        </div>

                        {/* CMF Testing Text */}
                        <div className="horizontal_section_category cmf-text-pos">
                            2. CMF Testing
                        </div>

                        {/* SEPARATE STEERING WHEEL SCENE */}
                        <div className="steering-wheel-container">
                            <Canvas camera={{ position: [0, 0, 2], fov: 45 }} style={{ width: '100%', height: '100%' }}>
                                <Suspense fallback={null}>
                                    <Environment files="/studio_small_09_1k.hdr" />
                                    <SteeringWheel />
                                    <OrbitControls enableZoom={false} />
                                </Suspense>
                            </Canvas>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
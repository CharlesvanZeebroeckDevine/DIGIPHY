import { useRef, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import WireframeSphere from './ScrollItem'
import DotWithTrail from './DotWithTrail'
import './HorizontalScrollScene.css'

gsap.registerPlugin(ScrollTrigger)

function ScrollContent() {
    // === REFS: Store references to 3D objects for GSAP animations ===
    const leftSphereRef = useRef(null) // Left wireframe sphere (starts at x: -12)
    const rightSphereRef = useRef(null) // Right wireframe sphere (starts at x: 12)
    const dotRef = useRef(null) // Center dot with trail effect
    const autoTextRef = useRef(null) // "Auto" text element (upper)
    const alignmentTextRef = useRef(null) // "Alignment" text element (lower)
    const autoGroupRef = useRef(null) // Group wrapper for Auto text (for 3D positioning)
    const alignmentGroupRef = useRef(null) // Group wrapper for Alignment text (for 3D positioning)
    const [refsReady, setRefsReady] = useState(false) // True when all refs exist

    // === REF VALIDATION: Ensure all objects exist before animation setup ===
    // React Three Fiber objects take time to mount - this prevents animation errors
    useEffect(() => {
        const checkRefs = () => {
            if (leftSphereRef.current && rightSphereRef.current &&
                dotRef.current && autoTextRef.current && alignmentTextRef.current &&
                autoGroupRef.current && alignmentGroupRef.current) {
                console.log('All refs ready!')
                setRefsReady(true) // Triggers animation timeline creation
            } else {
                console.log('Refs status:', { // Debug: shows which refs are missing
                    left: !!leftSphereRef.current,
                    right: !!rightSphereRef.current,
                    dot: !!dotRef.current,
                    auto: !!autoTextRef.current,
                    alignment: !!alignmentTextRef.current,
                    autoGroup: !!autoGroupRef.current,
                    alignmentGroup: !!alignmentGroupRef.current
                })
            }
        }

        checkRefs() // Immediate check
        const timeout = setTimeout(checkRefs, 100) // Delayed check (100ms)

        return () => clearTimeout(timeout)
    }, [])

    // === ANIMATION TIMELINE: Main scroll-linked animation setup ===
    useEffect(() => {
        if (!refsReady) return // Wait for refs to be ready

        console.log('Setting up animation', leftSphereRef.current.position)

        // Create GSAP timeline that responds to scroll position
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: '.horizontal_scroll--container', // 500vh tall scroll container
                start: 'top top', // Start when container enters viewport
                end: 'bottom bottom', // End when container exits viewport
                scrub: 1, // 1 second smooth lag on scroll
                markers: { // Visual debug markers
                    startColor: 'green',
                    endColor: 'red',
                    fontSize: '8px',
                    fontWeight: 'bold',
                    indent: 20
                },
                id: 'horizontal_scroll--animation',
                invalidateOnRefresh: true // Recalc on window resize
            }
        })

        // ========== PHASE 1: CONVERGENCE (0% - 25% scroll) ==========
        // Timeline position 0 to 0.25 - all animations run simultaneously
        
        // Left sphere moves from x:-12 to center (x:0)
        tl.to(leftSphereRef.current.position, {
            x: 0, // From x:-12 to x:0
            ease: 'power2.inOut',
            duration: 0.25 // 25% of total timeline
        }, 0) // Start at timeline position 0

        // Right sphere moves from x:12 to center (x:0)
        tl.to(rightSphereRef.current.position, {
            x: 0, // From x:12 to x:0
            ease: 'power2.inOut',
            duration: 0.25
        }, 0) // Runs parallel with left sphere

        // "Auto" text fades in and moves up to center
        tl.fromTo(autoTextRef.current,
            {
                opacity: 0.3,
                y: 50 // Starts below center
            },
            {
                opacity: 1,
                y: 0, // Ends at center position
                ease: 'power2.inOut',
                duration: 0.25
            }, 0) // Runs parallel with spheres

        // "Alignment" text fades in and moves down to center
        tl.fromTo(alignmentTextRef.current,
            {
                opacity: 0.3,
                y: -50 // Starts above center
            },
            {
                opacity: 1,
                y: 0, // Ends at center position
                ease: 'power2.inOut',
                duration: 0.25
            }, 0) // All Phase 1 animations together

        // ========== PHASE 2: TRANSFORMATION (25% - 50% scroll) ==========
        // Timeline position 0.25 to 0.5 - spheres shrink, dot appears, text splits
        
        // Left sphere shrinks to nearly invisible (scale from 1 to 0.01)
        tl.to(leftSphereRef.current.scale, {
            x: 0.01,
            y: 0.01,
            z: 0.01,
            ease: 'power2.inOut',
            duration: 0.25
        }, 0.25) // Starts at 25% of timeline

        // Right sphere shrinks to nearly invisible
        tl.to(rightSphereRef.current.scale, {
            x: 0.01,
            y: 0.01,
            z: 0.01,
            ease: 'power2.inOut',
            duration: 0.25
        }, 0.25) // Runs parallel with left sphere

        // Dot appears in center (scales from 0 to 1)
        tl.fromTo(dotRef.current.scale,
            { x: 0, y: 0, z: 0 }, // Starts invisible
            {
                x: 1,
                y: 1,
                z: 1, // Scales up to full size
                ease: 'power2.out',
                duration: 0.15
            }, 0.35) // Starts at 35% (delayed for visual effect)

        // "Auto" text moves up out of center (y:0 to y:-80)
        tl.to(autoTextRef.current, {
            y: -80,
            ease: 'power2.inOut',
            duration: 0.25
        }, 0.25) // Starts with sphere scaling

        // "Alignment" text moves down out of center (y:0 to y:80)
        tl.to(alignmentTextRef.current, {
            y: 80, // Texts split apart vertically
            ease: 'power2.inOut',
            duration: 0.25
        }, 0.25) // Runs parallel with "Auto" text

        // ========== PHASE 3: MOVE TO LEFT (50% - 100% scroll) ==========
        // Timeline position 0.5 to 1.0 - everything moves left, clearing space for new content
        // This is MUCH simpler than camera panning and makes adding new elements easy
        
        // Dot moves left off-center (from x:0 to x:-8)
        tl.to(dotRef.current.position, {
            x: -8, // Moves left, leaving center/right area clear
            ease: 'power1.inOut',
            duration: 0.5 // Last 50% of timeline
        }, 0.5) // Starts at 50% of timeline

        // "Auto" text moves further left off-screen
        tl.to(autoGroupRef.current.position, {
            x: -20, // Moves far off left edge (outside viewport)
            ease: 'power1.inOut',
            duration: 0.5
        }, 0.5)

        // "Alignment" text moves further left off-screen
        tl.to(alignmentGroupRef.current.position, {
            x: -20, // Moves far off left edge (outside viewport)
            ease: 'power1.inOut',
            duration: 0.5
        }, 0.5)

        // Spheres also move left (they're already tiny from Phase 2)
        tl.to(leftSphereRef.current.position, {
            x: -12,
            ease: 'power1.inOut',
            duration: 0.5
        }, 0.5)

        tl.to(rightSphereRef.current.position, {
            x: -12,
            ease: 'power1.inOut',
            duration: 0.5
        }, 0.5)

        // === CLEANUP: Remove timeline and ScrollTrigger on unmount ===
        return () => {
            tl.scrollTrigger?.kill() // Remove scroll listener
            tl.kill() // Kill timeline
        }
    }, [refsReady]) // Re-run only when refsReady changes

    return (
        <>
            // === LIGHTING SETUP ===
            <ambientLight intensity={0.5} /> // Soft ambient light
            <directionalLight position={[10, 10, 5]} intensity={1} /> // Key light (top-right)
            <directionalLight position={[-10, -10, -5]} intensity={0.5} /> // Fill light (bottom-left)

            // === 3D OBJECTS ===
            <WireframeSphere ref={leftSphereRef} position={[-12, 0, 0]} /> // Left sphere
            <WireframeSphere ref={rightSphereRef} position={[12, 0, 0]} /> // Right sphere

            // Dot with trail - stays at origin, trail created by DotWithTrail component
            <DotWithTrail ref={dotRef} position={[0, 0, 0]} color="#00ff88" scale={0} />

            // === HTML TEXT OVERLAYS (wrapped in groups for 3D positioning) ===
            // "Auto" text - positioned 1 unit above origin
            <group ref={autoGroupRef} position={[0, 1, 0]}>
                <Html ref={autoTextRef} center>
                    <h2 className="auto_alignment--title">Auto</h2>
                </Html>
            </group>

            // "Alignment" text - positioned 1 unit below origin
            <group ref={alignmentGroupRef} position={[0, -1, 0]}>
                <Html ref={alignmentTextRef} center>
                    <h2 className="auto_alignment--title">Alignment</h2>
                </Html>
            </group>
        </>
    )
}

// === MAIN COMPONENT: Horizontal scroll scene container ===
function HorizontalScrollScene() {
    return (
        // 400vh container provides scroll distance (defined in CSS)
        <div className="horizontal_scroll--container">
            <div className="horizontal_scroll--sticky">
                <Canvas
                    gl={{ antialias: true }} // Enable antialiasing
                    dpr={[1, 2]} // Pixel ratio for retina displays
                    camera={{ position: [0, 0, 12], fov: 50 }} // Camera at z:12, 50° FOV
                >
                    <ScrollContent /> {/* 3D scene content */}
                </Canvas>
            </div>
        </div>
    )
}

export default HorizontalScrollScene

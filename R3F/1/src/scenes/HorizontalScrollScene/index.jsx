import { useRef, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import WireframeSphere from './ScrollItem'
import DotWithTrail from './DotWithTrail'
import * as THREE from 'three'
import './HorizontalScrollScene.css'

gsap.registerPlugin(ScrollTrigger)

function ScrollContent() {
    const leftSphereRef = useRef(null)
    const rightSphereRef = useRef(null)
    const dotRef = useRef(null)
    const autoTextRef = useRef(null)
    const alignmentTextRef = useRef(null)
    const [refsReady, setRefsReady] = useState(false)

    // Check when refs are ready
    useEffect(() => {
        const checkRefs = () => {
            if (leftSphereRef.current && rightSphereRef.current && 
                dotRef.current &&
                autoTextRef.current && alignmentTextRef.current) {
                console.log('All refs ready!')
                setRefsReady(true)
            } else {
                console.log('Refs status:', {
                    left: !!leftSphereRef.current,
                    right: !!rightSphereRef.current,
                    dot: !!dotRef.current,
                    auto: !!autoTextRef.current,
                    alignment: !!alignmentTextRef.current
                })
            }
        }

        // Check immediately and after a delay
        checkRefs()
        const timeout = setTimeout(checkRefs, 100)
        
        return () => clearTimeout(timeout)
    }, [])

    useEffect(() => {
        if (!refsReady) return

        console.log('Setting up animation', leftSphereRef.current.position)

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: '.horizontal-scroll-container',
                start: 'top top',
                end: 'bottom bottom',
                scrub: 1,
                markers: {
                    startColor: 'green',
                    endColor: 'red',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    indent: 20
                },
                id: 'horizontal-scroll-animation',
                invalidateOnRefresh: true
            }
        })

        // Phase 1: Move spheres to center (0% - 50%)
        tl.to(leftSphereRef.current.position, {
            x: 0,
            ease: 'power2.inOut',
            duration: 0.5
        }, 0)

        tl.to(rightSphereRef.current.position, {
            x: 0,
            ease: 'power2.inOut',
            duration: 0.5
        }, 0)

        // Move text up during Phase 1
        tl.fromTo(autoTextRef.current,
            {
                opacity: 0.3,
                y: 50
            },
            {
                opacity: 1,
                y: 0,
                ease: 'power2.inOut',
                duration: 0.5
            }, 0)

        tl.fromTo(alignmentTextRef.current,
            {
                opacity: 0.3,
                y: -50
            },
            {
                opacity: 1,
                y: 0,
                ease: 'power2.inOut',
                duration: 0.5
            }, 0)

        // Phase 2: Scale down spheres and show dot (50% - 100%)
        // Scale down spheres to very small
        tl.to(leftSphereRef.current.scale, {
            x: 0.01,
            y: 0.01,
            z: 0.01,
            ease: 'power2.inOut',
            duration: 0.5
        }, 0.5)

        tl.to(rightSphereRef.current.scale, {
            x: 0.01,
            y: 0.01,
            z: 0.01,
            ease: 'power2.inOut',
            duration: 0.5
        }, 0.5)

        // Fade in the dot (after spheres are small)
        tl.fromTo(dotRef.current.scale, 
            { x: 0, y: 0, z: 0 },
            {
                x: 1,
                y: 1,
                z: 1,
                ease: 'power2.out',
                duration: 0.3
            }, 0.7)

        // Move "AUTO" up
        tl.to(autoTextRef.current, {
            y: -80,
            ease: 'power2.inOut',
            duration: 0.5
        }, 0.5)

        // Move "ALIGNMENT" down
        tl.to(alignmentTextRef.current, {
            y: 80,
            ease: 'power2.inOut',
            duration: 0.5
        }, 0.5)

        return () => {
            tl.scrollTrigger?.kill()
            tl.kill()
        }
    }, [refsReady])

    return (
        <>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <directionalLight position={[-10, -10, -5]} intensity={0.5} />
            
            <WireframeSphere ref={leftSphereRef} position={[-12, 0, 0]} />
            <WireframeSphere ref={rightSphereRef} position={[12, 0, 0]} />
            
            {/* Single dot in center - initially hidden */}
            <DotWithTrail ref={dotRef} position={[0, 0, 0]} color="#00ff88" scale={0} />
            
            <Html
                ref={autoTextRef}
                center
                position={[0, 1, 0]}
            >
                <h2 className="auto-alignment-title">Auto</h2>
            </Html>

            <Html
                ref={alignmentTextRef}
                center
                position={[0, -1, 0]}
            >
                <h2 className="auto-alignment-title">Alignment</h2>
            </Html>
        </>
    )
}

function HorizontalScrollScene() {
    return (
        <div className="horizontal-scroll-container">
            <div className="horizontal-scroll-sticky">
                <Canvas 
                    gl={{ antialias: true }} 
                    dpr={[1, 2]}
                    camera={{ position: [0, 0, 12], fov: 50 }}
                >
                    <ScrollContent />
                </Canvas>
            </div>
        </div>
    )
}

export default HorizontalScrollScene

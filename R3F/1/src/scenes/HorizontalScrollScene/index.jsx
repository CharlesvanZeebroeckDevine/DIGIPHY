import { useRef, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import WireframeSphere from './ScrollItem'
import './HorizontalScrollScene.css'

gsap.registerPlugin(ScrollTrigger)

function ScrollContent() {
    const leftSphereRef = useRef(null)
    const rightSphereRef = useRef(null)
    const textRef = useRef(null)
    const [refsReady, setRefsReady] = useState(false)

    // Check when refs are ready
    useEffect(() => {
        const checkRefs = () => {
            if (leftSphereRef.current && rightSphereRef.current && textRef.current) {
                console.log('All refs ready!', {
                    left: leftSphereRef.current,
                    right: rightSphereRef.current
                })
                setRefsReady(true)
            } else {
                console.log('Refs status:', {
                    left: !!leftSphereRef.current,
                    right: !!rightSphereRef.current,
                    text: !!textRef.current
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
        tl.fromTo(textRef.current,
            {
                opacity: 0.3,
                y: 0
            },
            {
                opacity: 1,
                y: 100,
                ease: 'power2.inOut',
                duration: 0.5
            }, 0)

        // Phase 2: Scale down spheres to dots (50% - 100%)
        tl.to(leftSphereRef.current.scale, {
            x: 0.05,
            y: 0.05,
            z: 0.05,
            ease: 'power2.inOut',
            duration: 0.5
        }, 0.5)

        tl.to(rightSphereRef.current.scale, {
            x: 0.05,
            y: 0.05,
            z: 0.05,
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
            
            <Html
                ref={textRef}
                center
                position={[0, 0, 0]}
            >
                <div className="auto-alignment-title">
                    Auto<br/>Alignment
                </div>
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

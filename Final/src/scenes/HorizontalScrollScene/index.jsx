import { Canvas } from '@react-three/fiber'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import WireframeSphere from './ScrollItem'
import * as THREE from 'three'
import './HorizontalScrollScene.css'

gsap.registerPlugin(ScrollTrigger)

// === SCROLL CONTENT: Container for all 3D scenes ===
// Each scene is a separate component with its own ScrollTrigger
// This makes it easy to add, remove, or reorder scenes
function ScrollContent() {
    const leftSphereRef = useRef(null)
    const rightSphereRef = useRef(null)
    const autoTextRef = useRef(null)
    const alignmentTextRef = useRef(null)
    const cameraRef = useRef(null)
    const [refsReady, setRefsReady] = useState(false)

    // Store camera ref
    useFrame(({ camera }) => {
        if (!cameraRef.current) {
            cameraRef.current = camera
        }
    })

    useEffect(() => {
        const checkRefs = () => {
            if (leftSphereRef.current && rightSphereRef.current &&
                cameraRef.current &&
                autoTextRef.current && alignmentTextRef.current) {
                console.log('All refs ready!')
                setRefsReady(true)
            } else {
                console.log('Refs status:', {
                    left: !!leftSphereRef.current,
                    right: !!rightSphereRef.current,
                    camera: !!cameraRef.current,
                    auto: !!autoTextRef.current,
                    alignment: !!alignmentTextRef.current
                })
            }
        }

        checkRefs()
        const timeout = setTimeout(checkRefs, 100)

        return () => clearTimeout(timeout)
    }, [])

    useEffect(() => {
        if (!refsReady) return

        console.log('Setting up animation', leftSphereRef.current.position)

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: '.horizontal_scroll--container',
                start: 'top top',
                end: 'bottom bottom',
                scrub: 1,
                markers: {
                    startColor: 'green',
                    endColor: 'red',
                    fontSize: '8px',
                    fontWeight: 'bold',
                    indent: 20
                },
                id: 'horizontal_scroll--animation',
                invalidateOnRefresh: true
            }
        })

        // Phase 1: Spheres move to center (0% - 25%)
        tl.to(leftSphereRef.current.position, {
            x: 0,
            ease: 'power2.inOut',
            duration: 0.25
        }, 0)

        tl.to(rightSphereRef.current.position, {
            x: 0,
            ease: 'power2.inOut',
            duration: 0.25
        }, 0)

        tl.fromTo(autoTextRef.current,
            {
                opacity: 0.3,
                y: 50
            },
            {
                opacity: 1,
                y: 0,
                ease: 'power2.inOut',
                duration: 0.25
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
                duration: 0.25
            }, 0)

        // Phase 2: Spheres scale down, dot appears, text splits (25% - 50%)
        tl.to(leftSphereRef.current.scale, {
            x: 0.01,
            y: 0.01,
            z: 0.01,
            ease: 'power2.inOut',
            duration: 0.25
        }, 0.25)

        tl.to(rightSphereRef.current.scale, {
            x: 0.01,
            y: 0.01,
            z: 0.01,
            ease: 'power2.inOut',
            duration: 0.25
        }, 0.25)



        tl.to(autoTextRef.current, {
            y: -80,
            ease: 'power2.inOut',
            duration: 0.25
        }, 0.25)

        tl.to(alignmentTextRef.current, {
            y: 80,
            ease: 'power2.inOut',
            duration: 0.25
        }, 0.25)

        // Phase 3: Camera pans to the right (50% - 100%)
        // Dot stays at center, camera moves right to reveal more scene
        tl.to(cameraRef.current.position, {
            x: 10,
            ease: 'power1.inOut',
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
                ref={autoTextRef}
                center
                position={[0, 1, 0]}
            >
                <h2 className="auto_alignment--title">Auto</h2>
            </Html>

            <Html
                ref={alignmentTextRef}
                center
                position={[0, -1, 0]}
            >
                <h2 className="auto_alignment--title">Alignment</h2>
            </Html>
        </>
    )
}


// === MAIN COMPONENT: Horizontal scroll scene container ===
function HorizontalScrollScene() {
    return (
        // 400vh container provides scroll distance (defined in CSS)
        <div className="horizontal_scroll--container">
            {/* Sticky wrapper keeps Canvas fixed while scrolling */}
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

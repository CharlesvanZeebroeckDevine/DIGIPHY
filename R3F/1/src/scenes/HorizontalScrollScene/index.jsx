import { useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import ScrollItem from './ScrollItem'

gsap.registerPlugin(ScrollTrigger)

const IMAGES = [
    'https://images.unsplash.com/photo-1764416756521-f039ff3263f1?q=80&w=1335&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1764416756521-f039ff3263f1?q=80&w=1335&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1764416756521-f039ff3263f1?q=80&w=1335&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1764416756521-f039ff3263f1?q=80&w=1335&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1764416756521-f039ff3263f1?q=80&w=1335&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1764416756521-f039ff3263f1?q=80&w=1335&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
]

const ITEM_WIDTH = 4
const GAP = 0.5

function ScrollContent() {
    const groupRef = useRef(null)

    useEffect(() => {
        if (!groupRef.current) return

        const totalItems = IMAGES.length
        const totalWidth = (ITEM_WIDTH + GAP) * totalItems

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: '#horizontal-scroll',
                start: 'top top',
                end: '+=300%',
                scrub: 1,
                markers: {
                    startColor: 'green',
                    endColor: 'red',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    indent: 20
                },
                id: 'horizontal-scroll',
                invalidateOnRefresh: true
            }
        })

        tl.to(groupRef.current.position, {
            x: -totalWidth + ITEM_WIDTH + GAP,
            ease: 'none'
        })

        return () => {
            tl.scrollTrigger?.kill()
            tl.kill()
        }
    }, [])

    return (
        <group ref={groupRef}>
            {IMAGES.map((url, i) => (
                <ScrollItem
                    key={i}
                    url={url}
                    position={[i * (ITEM_WIDTH + GAP), 0, 0]}
                />
            ))}
        </group>
    )
}

function HorizontalScrollScene() {
    const sectionRef = useRef(null)

    useEffect(() => {
        console.log('Horizontal scroll section mounted:', sectionRef.current)
    }, [])

    return (
        <>
            <div ref={sectionRef} style={{ width: '100%', height: '300vh', background: 'linear-gradient(180deg, #000 0%, #1a1a2e 100%)' }}>
                <div style={{ 
                    position: 'sticky', 
                    top: 0, 
                    width: '100%', 
                    height: '100vh',
                    overflow: 'hidden'
                }}>
                    <Canvas 
                        gl={{ antialias: false }} 
                        dpr={[1, 1.5]}
                        camera={{ position: [0, 0, 10], fov: 50 }}
                    >
                        <ScrollContent />
                    </Canvas>
                </div>
            </div>
            <section style={{ height: '100vh', width: '100vw', padding: '5rem' }}>
                <h1 style={{ color: 'white'}}>Design at the speed of thought</h1>
                <p style={{ color: 'white'}}>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc quis nisi ut sem dignissim pretium. Ut non auctor risus. Nam porta commodo lorem sed tristique. Suspendisse potenti. Sed in dignissim arcu, id vehicula purus. Donec vestibulum mi a iaculis efficitur. Vivamus tempus iaculis ligula nec maximus. Pellentesque sodales neque sed suscipit consectetur. Aliquam at mi mauris. Integer dignissim tempus porta. Morbi pharetra interdum vehicula. Donec ultrices feugiat dictum.</p>
                <a style={{ color: 'white'}} href="#">Button</a>
            </section>
        </>
    )
}

export default HorizontalScrollScene

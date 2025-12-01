import { useRef, useEffect, useState } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { ScrollControls, Scroll, useScroll } from '@react-three/drei'
import ScrollItem from './ScrollItem'

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

const ScrollIndicator = ({ onScrollProgressChange }) => {
    const scroll = useScroll()
    
    useFrame(() => {
        if (onScrollProgressChange) {
            onScrollProgressChange(scroll.offset)
        }
    })
    
    return null
}

const ScrollContent = ({ onScrollProgressChange }) => {
    const { width: viewportWidth } = useThree((state) => state.viewport)
    const totalItemWidth = ITEM_WIDTH + GAP
    const totalScrollWidth = IMAGES.length * totalItemWidth
    const pages = Math.max(1, totalScrollWidth / viewportWidth)

    return (
        <ScrollControls horizontal pages={pages} damping={0.1} infinite={false}>
            <ScrollIndicator onScrollProgressChange={onScrollProgressChange} />
            <Scroll>
                {IMAGES.map((url, i) => (
                    <ScrollItem
                        key={i}
                        index={i}
                        url={url}
                        position={[i * (ITEM_WIDTH + GAP), 0, 0]}
                    />
                ))}
            </Scroll>
        </ScrollControls>
    )
}

function HorizontalScrollScene() {
    const containerRef = useRef(null)
    const [scrollProgress, setScrollProgress] = useState(0)

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const handleWheel = (e) => {
            const atStart = scrollProgress <= 0
            const atEnd = scrollProgress >= 1
            const scrollingDown = e.deltaY > 0
            const scrollingUp = e.deltaY < 0

            if ((atStart && scrollingUp) || (atEnd && scrollingDown)) {
                return
            }

            e.preventDefault()
            e.stopPropagation()
        }

        container.addEventListener('wheel', handleWheel, { passive: false })

        return () => {
            container.removeEventListener('wheel', handleWheel)
        }
    }, [scrollProgress])

    const handleScrollProgressChange = (progress) => {
        setScrollProgress(progress)
    }

    return (
        <div 
            ref={containerRef}
            style={{ 
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw', 
                height: '100vh',
                pointerEvents: 'auto',
                zIndex: 10
            }}
        >
            <Canvas gl={{ antialias: false }} dpr={[1, 1.5]}>
                <ScrollContent onScrollProgressChange={handleScrollProgressChange} />
            </Canvas>
        </div>
    )
}

export default HorizontalScrollScene

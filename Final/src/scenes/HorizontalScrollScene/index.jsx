import { Canvas } from '@react-three/fiber'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import AutoAlignmentScene from './AutoAlignmentScene'
import './HorizontalScrollScene.css'

gsap.registerPlugin(ScrollTrigger)

// === SCROLL CONTENT: Container for all 3D scenes ===
// Each scene is a separate component with its own ScrollTrigger
// This makes it easy to add, remove, or reorder scenes
function ScrollContent() {
    return (
        <>
            {/* === LIGHTING SETUP === */}
            <ambientLight intensity={0.5} /> {/* Soft ambient light */}
            <directionalLight position={[10, 10, 5]} intensity={1} /> {/* Key light (top-right) */}
            <directionalLight position={[-10, -10, -5]} intensity={0.5} /> {/* Fill light (bottom-left) */}

            {/* === SCENE COMPONENTS === */}
            {/* AutoAlignment Scene - spheres converge, transform to dot, slide left */}
            <AutoAlignmentScene />
            
            {/* Add more scenes here as separate components */}
            {/* <NextScene /> */}
            {/* <AnotherScene /> */}
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

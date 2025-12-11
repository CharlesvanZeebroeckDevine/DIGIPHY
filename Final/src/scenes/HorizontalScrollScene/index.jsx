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
export default function HorizontalScrollScene() {
    return (
        // 400vh container provides scroll distance (defined in CSS)
        <div className="horizontal_scroll--container">
            {/* Sticky wrapper keeps Canvas fixed while scrolling */}
            <div className="horizontal_scroll--sticky">
                <Canvas
                    gl={{ antialias: true }} // Enable antialiasing
                >
                    <ScrollContent />
                </Canvas>
            </div>
        </div>
    )
};
import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import AutoAlignmentScene2 from './AutoAlignmentScene2'
import TangibleTruth from './TangibleTruth'
import WhyDigiphy from './WhyDigiphy'
import PlugAndPlay from './PlugAndPlay'
import EndSection from './EndSection'

import '../../DefaultStyles.css'
import './HorizontalScrollScene.css'

gsap.registerPlugin(ScrollTrigger)


const HorizontalScrollScene = () => {
    const containerRef = useRef(null)
    const sectionsRef = useRef(null)
    const sphereRefs = useRef({ left: null, right: null })
    const [areSpheresReady, setAreSpheresReady] = useState(false)

    useEffect(() => {
        // Wait for spheres to be ready before creating the timeline
        if (!areSpheresReady) return

        const sections = sectionsRef.current

        // Use gsap.context for easy cleanup
        let ctx = gsap.context(() => {
            // Explicit width calculation (Robust against loading timing)
            // AutoAlignment (1.5) + Tangible (1) + Why (1) + Plug (1) + End (1) = 5.5 total width
            const totalWidth = window.innerWidth * 5.5
            const scrollDistance = totalWidth - window.innerWidth

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: containerRef.current,
                    pin: true,
                    scrub: 1,
                    // Add extra scroll distance for the initial animation
                    end: () => `+=${scrollDistance + 2000}`, // Increased buffer
                    markers: true,
                    invalidateOnRefresh: true
                }
            })

            // 1. Animate Spheres (Scroll logic waits here)
            // Spheres move from outer sides to the center
            if (sphereRefs.current.left && sphereRefs.current.right) {
                tl.to(sphereRefs.current.left.position, {
                    x: () => sphereRefs.current.data ? sphereRefs.current.data.targetX : 0,
                    ease: 'power1.inOut',
                    duration: 1
                })
                    .to(sphereRefs.current.right.position, {
                        x: () => sphereRefs.current.data ? sphereRefs.current.data.targetX : 0,
                        ease: 'power1.inOut',
                        duration: 1
                    }, "<")
            }

            // 2. Horizontal Scroll
            tl.to(sections, {
                x: () => -scrollDistance,
                ease: 'none',
                duration: 5 // Adjust relative duration to control timing
            })
        }, containerRef)

        return () => ctx.revert()
    }, [areSpheresReady])

    return (
        <div ref={containerRef} className="horizontal_scroll--container">
            <div ref={sectionsRef} className="horizontal_scroll--sections">
                <AutoAlignmentScene2 sphereRefs={sphereRefs} onReady={() => setAreSpheresReady(true)} />
                <TangibleTruth />
                <WhyDigiphy />
                <PlugAndPlay />
                <EndSection />
            </div>
        </div>
    )
}

export default HorizontalScrollScene

import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import Intro from './Intro'

import AutoAlignmentScene from './AutoAlignmentScene'
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
        if (!areSpheresReady) return

        const sections = sectionsRef.current

        let ctx = gsap.context(() => {
            const totalWidth = window.innerWidth * 5.5
            const scrollDistance = totalWidth - window.innerWidth

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: containerRef.current,
                    pin: true,
                    scrub: 1,
                    end: () => `+=${scrollDistance + 2000}`,
                    markers: true,
                    invalidateOnRefresh: true
                }
            })

            ScrollTrigger.refresh()
            window.dispatchEvent(new Event('resize'))
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

            tl.to(sections, {
                x: () => -scrollDistance,
                ease: 'none',
                duration: 5
            })
        }, containerRef)

        return () => ctx.revert()
    }, [areSpheresReady])

    return (
        <div>    
        <Intro />
        <div ref={containerRef} className="horizontal_scroll--container">
            <div ref={sectionsRef} className="horizontal_scroll--sections">
                <AutoAlignmentScene sphereRefs={sphereRefs} onReady={() => setAreSpheresReady(true)} />
                <TangibleTruth />
                <WhyDigiphy />
                <PlugAndPlay />
                <EndSection />
            </div>
        </div>
        </div>
    )
}

export default HorizontalScrollScene

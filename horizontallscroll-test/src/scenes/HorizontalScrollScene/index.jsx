import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import AutoAlignmentScene2 from './autoAlignmentScene2'
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

    useEffect(() => {
        const sections = sectionsRef.current
        
        gsap.to(sections, {
            x: () => -(sections.scrollWidth - window.innerWidth),
            ease: 'none',
            scrollTrigger: {
                trigger: containerRef.current,
                pin: true,
                scrub: 1,
                end: () => `+=${sections.scrollWidth - window.innerWidth}`
            }
        })

        return () => {
            ScrollTrigger.getAll().forEach(st => st.kill())
        }
    }, [])

    return (
        <div ref={containerRef} className="horizontal_scroll--container">
            <div ref={sectionsRef} className="horizontal_scroll--sections">
                <AutoAlignmentScene2 />
                <TangibleTruth />
                <WhyDigiphy />
                <PlugAndPlay />
                <EndSection />
            </div>
        </div>
    )
}

export default HorizontalScrollScene

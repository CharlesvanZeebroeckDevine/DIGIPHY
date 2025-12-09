import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import AutoAlignmentScene2 from './autoAlignmentScene2'
import TangibleTruth from './TangibleTruth'
import WhyDigiphy from './WhyDigiphy'
import PlugAndPlay from './PlugAndPlay'

import './HorizontalScrollScene.css'

gsap.registerPlugin(ScrollTrigger)


const HorizontalScrollScene = () => {
    const containerRef = useRef(null)
    const sectionsRef = useRef(null)

    useEffect(() => {
        const sections = gsap.utils.toArray('.horiz_scroll--scene')
        
        gsap.to(sections, {
            xPercent: -100 * (sections.length - 1),
            ease: 'none',
            scrollTrigger: {
                trigger: containerRef.current,
                pin: true,
                scrub: 1,
                snap: 1 / (sections.length - 1),
                end: () => `+=${sectionsRef.current.offsetWidth - window.innerWidth}`
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
            </div>
        </div>
    )
}

export default HorizontalScrollScene

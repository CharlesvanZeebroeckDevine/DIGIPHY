import { useEffect, useRef, useState, useMemo } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Canvas, useThree } from '@react-three/fiber'
import { useGLTF, Environment } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'
import { ChromaticAberration } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'

import Intro from './Intro'

import '../../DefaultStyles.css'
import './HorizontalScrollScene.css'

gsap.registerPlugin(ScrollTrigger)

// --- Internal Components ---

const SphereModel = ({ sphereRefs, position, isLeft }) => {
    const { scene } = useGLTF('/side-scroll/sphere-2.glb')
    const clone = useMemo(() => SkeletonUtils.clone(scene), [scene])

    return (
        <primitive
            object={clone}
            position={position}
            ref={(el) => {
                if (sphereRefs && sphereRefs.current) {
                    if (isLeft) sphereRefs.current.left = el
                    else sphereRefs.current.right = el
                }
            }}
            scale={2.2}
        />
    )
}

const SceneContent = ({ sphereRefs, onReady }) => {
    const { viewport } = useThree()
    const targetX = -viewport.width / 6

    const screenLeftEdge = -viewport.width / 2
    const screenRightEdge = -viewport.width / 2 + viewport.width * (2 / 3)

    const startLeftX = screenLeftEdge - 10
    const startRightX = screenRightEdge + 10

    useEffect(() => {
        if (sphereRefs.current) {
            sphereRefs.current.data = {
                targetX,
                startLeftX,
                startRightX
            }
        }
        if (onReady) {
            onReady()
        }
    }, [onReady, targetX, startLeftX, startRightX, sphereRefs])

    return (
        <>
            <ambientLight intensity={2} />
            <Environment preset="warehouse" />

            <SphereModel
                sphereRefs={sphereRefs}
                position={[startLeftX, 0, 0]}
                isLeft={true}
            />

            <SphereModel
                sphereRefs={sphereRefs}
                position={[startRightX, 0, 0]}
                isLeft={false}
            />
        </>
    )
}

const AutoAlignmentScene = ({ sphereRefs, onReady }) => {
    return (
        <div className="horiz_scroll--scene auto_alignment--container">
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none' }}>
                <Canvas events={null} camera={{ position: [0, 0, 10], fov: 35 }}>
                    <ChromaticAberration
                        blendFunction={BlendFunction.NORMAL}
                        offset={[0.5, 0.5]}
                    />
                    <SceneContent sphereRefs={sphereRefs} onReady={onReady} />
                </Canvas>
            </div>

            <div
                className="auto_alignment--title"
                style={{ zIndex: 2 }}
                ref={(el) => { if (sphereRefs.current) sphereRefs.current.title = el }}
            >
                <h1>Auto</h1>
                <h1>Alignment</h1>
            </div>
            <div className="auto_alignment--text" style={{ zIndex: 2 }}>
                <p>Accuracy is a metric measured in millimeters. DigiPHY uses 10 precision tracking cameras and proprietary algorithms to fuse the physical and virtual worlds instantly, keeping models perfectly aligned no matter how you move.</p>
            </div>
            <div className="auto_alignment--text--2" style={{ zIndex: 2 }}>
                <p>Instant physical feedback makes ideas easier to evaluate, mistakes easier to catch, and decisions easier to make.</p>
            </div>
        </div>
    )
}

const TangibleTruth = () => {
    return (
        <>
            <div className="horiz_scroll--scene tangible_truth--container">
                <img className="tangible_truth--image" src="/assets/tangible-truth-placeholder.png" alt="Tangible Truth" />
                <div className="tangible_truth--text">
                    <h2>The Tangible Truth</h2>
                    <p>Digital tools rarely give you the confidence of touching the real thing. DigiPHY changes that. Because every movement of the physical proxy is tracked and translated instantly, designers get immediate, tactile validation at every step. Turn it, test it, interact with it, your hands become part of the design process again</p>
                </div>
            </div>
        </>
    )
}

const WhyDigiphy = () => {
    return (
        <div className="horiz_scroll--scene why_digiphy--container">
            <div className="scroll_scene--section why_digiphy--1">
                <h2>Why DigiPHY?</h2>
                <p>DigiPHY is a physical seating buck enhanced with a real-time XR layer, a tangible model you can sit in, touch, adjust, and iterate while all parts responds instantly. Combining the certainty of the real, touchable form with the flexibility of immersive visualization.</p>
            </div>
            <div className="scroll_scene--section why_digiphy--2">
                <h2>Digiphy has:</h2>
                <ul>
                    <li>Instant Alignment</li>
                    <li>True Physical Interaction</li>
                    <li>High-Fidelity XR Visualization</li>
                    <li>Shared Understanding Across Teams</li>
                    <li>Rapid Iteration & Validation</li>
                </ul>
            </div>
        </div>
    )
}

const PlugAndPlay = () => {
    return (
        <div className="horiz_scroll--scene plug_and_play--container">
            <div className="plug_and_play--text">
                <h2>Plug and Play</h2>
                <p>DigiPHY is a plug-and-play solution that connects directly into existing design pipelines. Just place the model, start your session, and immediately explore variants, test ideas, or share decisions with your team. It’s hands-on XR that fits effortlessly into your daily workflow.</p>
            </div>
        </div>
    )
}

const EndSection = () => {
    return (
        <div className="horiz_scroll--scene end_section--container">
            <h2>Now that you’ve seen what makes DigiPHY powerful, let’s look at how easily it integrates into the way you already work.</h2>
        </div>
    )
}

// --- Main Container Component ---

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

                // Fade out title after spheres align
                if (sphereRefs.current.title) {
                    tl.to(sphereRefs.current.title, {
                        opacity: 0,
                        duration: 0.5,
                        ease: 'power1.inOut'
                    })
                }
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

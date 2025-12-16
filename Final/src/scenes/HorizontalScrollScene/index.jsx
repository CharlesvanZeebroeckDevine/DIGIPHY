import './HorizontalScrollScene.css'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stats } from '@react-three/drei'
import { Sphere } from './Sphere'
import { InteractiveCubeGrid } from './InteractiveCubeGrid'

import { Suspense, useRef, useLayoutEffect } from 'react'
import VariableText from '../../Components/VariableText'
import PrimaryButton from '../../Components/UI/PrimaryButton'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(ScrollTrigger, SplitText)

const SPEED_SENSITIVITY = 10
const BASE_FREQUENCY = 1

const DURATIONS = {
    overlayReveal: 0.5,
    spiral: 3,
    hideOverlay: 0.5,
    shrinkToDot: 0.5,
    dotPop: 0.3,
    finalTextReveal: 0.5,
    trackMoveToGrid: 2.6,
    trackMoveToPost: 2.6,
    lineDraw: 1.8,
    line2Draw: 1.6,
    trackItemReveal: 1.5,
    trackItemParallax: 3,
    trackItemText: 0.5,
    cmfTextReveal: 0.5,
}

function getViewBoxWidth(svgEl, fallback = 1500) {
    const vb = svgEl?.viewBox?.baseVal
    return vb?.width || fallback
}

function SceneContent({
    containerRef,
    ui,
}) {
    const sphereRef = useRef(null)
    // Ref to track animation state without re-renders
    const animState = useRef({ intensity: 1 })
    const scrollDirRef = useRef(1)

    useLayoutEffect(() => {
        // Now this only runs after Suspense resolves, so sphereRef.current SHOULD be populated
        if (!sphereRef.current || !containerRef.current) return

        const ctx = gsap.context(() => {
            const splits = []
            const createSplit = (el, options) => {
                const split = new SplitText(el, options)
                splits.push(split)
                return split
            }

            const leftPivot = sphereRef.current.leftPivot
            const rightPivot = sphereRef.current.rightPivot
            const leftSphere = sphereRef.current.leftSphere
            const rightSphere = sphereRef.current.rightSphere

            if (!leftPivot || !rightPivot || !leftSphere || !rightSphere) return

            // Initial Setup
            const START_RADIUS = -12
            const OFF_SCREEN_RADIUS = -25

            // 1. Initial State: OFF SCREEN
            gsap.set([leftSphere.position, rightSphere.position], { x: OFF_SCREEN_RADIUS })

            // Ensure Pivots are aligned (One at 0 deg, one at 180 deg)
            gsap.set(leftPivot.rotation, { y: 0 })
            gsap.set(rightPivot.rotation, { y: Math.PI }) // Starts opposite

            const buildEntryTimeline = () => {
                const entryTl = gsap.timeline({
                    scrollTrigger: {
                        trigger: containerRef.current,
                        start: 'top bottom', // container top hits bottom of viewport
                        end: 'top top',      // container top hits top of viewport
                        scrub: true,
                        markers: false
                    }
                })

                entryTl.to([leftSphere.position, rightSphere.position], {
                    x: START_RADIUS,
                    ease: 'power1.out'
                })

                return entryTl
            }

            const buildMainTimeline = () => {
                const tl = gsap.timeline({
                    scrollTrigger: {
                        trigger: containerRef.current,
                        start: 'top top',
                        end: '+=500%',
                        pin: true,
                        scrub: true,
                        markers: false,
                        refreshPriority: 1,
                        invalidateOnRefresh: true,
                        onUpdate: (self) => {
                            scrollDirRef.current = self.direction
                        }
                    }
                })

                return tl
            }

            const addOverlayReveal = (tl, splitChars) => {
                if (!splitChars?.length) return
                tl.to(splitChars, {
                    opacity: 1,
                    y: 0,
                    stagger: 0.05,
                    duration: DURATIONS.overlayReveal,
                    ease: 'power2.out'
                }, 0)
            }

            const addPhase1SpiralIn = (tl, { leftPivot, rightPivot, leftSphere, rightSphere, splitChars }) => {
                tl.addLabel("phase1", 0)

                tl.to([leftPivot.rotation, rightPivot.rotation], {
                    y: "+=" + Math.PI * 2.5,
                    ease: "power1.inOut",
                    duration: DURATIONS.spiral
                }, "phase1")

                    .to([leftSphere.position, rightSphere.position], {
                        x: 0,
                        ease: "power2.in",
                        duration: DURATIONS.spiral
                    }, "phase1")

                    .to([leftSphere.rotation, rightSphere.rotation], {
                        z: Math.PI / 2,
                        y: Math.PI,
                        duration: DURATIONS.spiral
                    }, "phase1")

                    .to(animState.current, {
                        intensity: 0,
                        duration: DURATIONS.spiral
                    }, "phase1")

                    .to(splitChars, {
                        y: -50,
                        opacity: 0,
                        stagger: 0.02,
                        duration: DURATIONS.hideOverlay,
                        ease: 'power2.in'
                    }, "phase1+=1.5")
            }

            const addPhase2MergeAndDot = (tl, { leftSphere, rightSphere, centerDotEl, finalTextEl }) => {
                tl.to([leftSphere.scale, rightSphere.scale], {
                    x: 0.1, y: 0.1, z: 0.1,
                    duration: DURATIONS.shrinkToDot,
                    ease: "back.in(2)"
                })
                    .set([leftSphere, rightSphere], { visible: false })

                if (centerDotEl) {
                    gsap.set(centerDotEl, { scale: 0, opacity: 0 })
                    tl.to(centerDotEl, {
                        scale: 1,
                        opacity: 1,
                        duration: DURATIONS.dotPop,
                        ease: "back.out(2)"
                    }, "-=0.2")
                }

                if (finalTextEl) {
                    const splitFinal = createSplit(finalTextEl, { type: 'chars, words' })
                    gsap.set(splitFinal.chars, { opacity: 0, x: -10 })
                    tl.to(splitFinal.chars, {
                        opacity: 1,
                        x: 0,
                        stagger: 0.02,
                        duration: DURATIONS.finalTextReveal,
                        ease: "power2.out"
                    }, "-=0.3")
                }
            }

            const addPhase3TrackAndLine = (tl, { trackEl, steeringWheelEl, bezierPathEl, bezierSvgEl, trackItem, cmfTextEl }) => {
                if (!trackEl || !bezierPathEl) return

                const length = bezierPathEl.getTotalLength()
                gsap.set(bezierPathEl, { strokeDasharray: length, strokeDashoffset: length })

                const computeStopDashoffsetAtCubeLeftEdge = () => {
                    if (!bezierSvgEl || !steeringWheelEl) return 0

                    const svgRect = bezierSvgEl.getBoundingClientRect()
                    if (!svgRect.width) return 0

                    const vbWidth = getViewBoxWidth(bezierSvgEl, 1500)

                    const cubeEdgeClientX = ui.getCubeLeftEdgeClientX?.()
                    const fallbackRect = steeringWheelEl.getBoundingClientRect()
                    const targetClientX = (typeof cubeEdgeClientX === 'number' ? cubeEdgeClientX : fallbackRect.left)

                    const t = (targetClientX - svgRect.left) / svgRect.width
                    const xTarget = Math.max(0, Math.min(vbWidth, t * vbWidth))

                    let lo = 0
                    let hi = length
                    for (let i = 0; i < 24; i++) {
                        const mid = (lo + hi) / 2
                        const p = bezierPathEl.getPointAtLength(mid)
                        if (p.x < xTarget) lo = mid
                        else hi = mid
                    }
                    const stopLen = hi
                    return length - stopLen
                }

                const gridRevealTriggered = { current: false }

                tl.addLabel("phase3")

                // Start phase3 immediately (removes the “dead scroll” feeling)
                const phase3Start = "phase3"

                // Track panel math for 3 panels (300vw total):
                // - To reveal panel 2, move left by 100vw => xPercent: -33.333...
                // - To reveal panel 3, move left by 200vw => xPercent: -66.666...
                const TRACK_X_PANEL2 = -33.3333333333
                const TRACK_X_PANEL3 = -66.6666666667

                // Slide track + grid AND draw the line together (so it feels like it trails from the dot)
                tl.to(trackEl, {
                    xPercent: TRACK_X_PANEL2,
                    duration: DURATIONS.trackMoveToGrid,
                    ease: "none"
                }, phase3Start)

                if (steeringWheelEl) {
                    tl.to(steeringWheelEl, {
                        // Keep base alignment at -100. With CSS `left: 120vw` this yields a +20vw visual offset.
                        xPercent: -100,
                        duration: DURATIONS.trackMoveToGrid,
                        ease: "none"
                    }, phase3Start)
                }

                tl.to(bezierPathEl, {
                    // Compute dynamically so the target stays correct while the scene slides
                    strokeDashoffset: () => computeStopDashoffsetAtCubeLeftEdge(),
                    duration: DURATIONS.lineDraw,
                    ease: "power1.inOut",
                    onUpdate: () => {
                        if (!bezierSvgEl || !steeringWheelEl) return

                        const svgRect = bezierSvgEl.getBoundingClientRect()
                        const cubeEdgeClientX = ui.getCubeLeftEdgeClientX?.()
                        const fallbackRect = steeringWheelEl.getBoundingClientRect()
                        const targetClientX = (typeof cubeEdgeClientX === 'number' ? cubeEdgeClientX : fallbackRect.left)

                        const dash = Number(gsap.getProperty(bezierPathEl, 'strokeDashoffset')) || 0
                        const drawnLen = Math.max(0, Math.min(length, length - dash))
                        const p = bezierPathEl.getPointAtLength(drawnLen)

                        const vbWidth = getViewBoxWidth(bezierSvgEl, 1500)
                        const headX = svgRect.left + (p.x / vbWidth) * svgRect.width

                        const arrived = headX >= (targetClientX - 2)
                        if (arrived && !gridRevealTriggered.current) {
                            gridRevealTriggered.current = true
                            containerRef.current.dispatchEvent(new CustomEvent('cubegrid:reveal', { detail: { state: 'play' } }))
                        } else if (!arrived && gridRevealTriggered.current) {
                            gridRevealTriggered.current = false
                            containerRef.current.dispatchEvent(new CustomEvent('cubegrid:reveal', { detail: { state: 'reverse' } }))
                        }
                    }
                }, phase3Start)

                // Hold on panel2 a bit longer + reveal a secondary text under the CMF title
                const panel2HoldStart = `${phase3Start}+=${DURATIONS.trackMoveToGrid}`
                const cmfSubtextEl = ui.cmfSubtextRef?.current
                if (cmfSubtextEl) {
                    gsap.set(cmfSubtextEl, { opacity: 0, y: 16 })
                    tl.to(cmfSubtextEl, {
                        opacity: 1,
                        y: 0,
                        duration: 0.5,
                        ease: 'power2.out',
                    }, panel2HoldStart)
                }

                // === PHASE 4: leave grid and continue the SAME line behind the grid (simpler + stable) ===
                // Phase4 starts after slide-to-grid + panel2 hold
                const phase4Start = `${phase3Start}+=${DURATIONS.trackMoveToGrid}`
                tl.addLabel('phase4', phase4Start)

                // Slide onward to panel3
                tl.to(trackEl, {
                    xPercent: TRACK_X_PANEL3,
                    duration: DURATIONS.trackMoveToPost,
                    ease: 'none'
                }, 'phase4')
                if (steeringWheelEl) {
                    tl.to(steeringWheelEl, {
                        // Keep base alignment at -200. With CSS `left: 120vw` this yields a +20vw visual offset.
                        xPercent: -200,
                        duration: DURATIONS.trackMoveToPost,
                        ease: 'none'
                    }, 'phase4')
                }

                // Fade out CMF title + subtext before the line continues
                if (cmfTextEl) {
                    const splitCmfOut = createSplit(cmfTextEl, { type: 'chars' })
                    tl.to(splitCmfOut.chars, {
                        opacity: 0,
                        y: -50,
                        stagger: 0.03,
                        duration: 0.5,
                        ease: 'power2.in'
                    }, 'phase4+=0.5')
                }

                if (cmfSubtextEl) {
                    tl.to(cmfSubtextEl, {
                        opacity: 0,
                        y: -16,
                        duration: 0.35,
                        ease: 'power2.in'
                    }, 'phase4+=1')
                }

                // Continue drawing the same line towards the post target
                const postTargetEl = ui.postLineTargetRef?.current
                const computeStopDashoffsetAtPostTarget = () => {
                    if (!bezierSvgEl) return 0
                    const svgRect = bezierSvgEl.getBoundingClientRect()
                    if (!svgRect.width) return 0

                    const targetRect = postTargetEl?.getBoundingClientRect?.()
                    const fallbackTarget = window.innerWidth * 0.8
                    const targetClientX = targetRect ? targetRect.left : fallbackTarget

                    const vbWidth = getViewBoxWidth(bezierSvgEl, 1500)
                    const t = (targetClientX - svgRect.left) / svgRect.width
                    const xTarget = Math.max(0, Math.min(vbWidth, t * vbWidth))

                    let lo = 0
                    let hi = length
                    for (let i = 0; i < 24; i++) {
                        const mid = (lo + hi) / 2
                        const p = bezierPathEl.getPointAtLength(mid)
                        if (p.x < xTarget) lo = mid
                        else hi = mid
                    }
                    const stopLen = hi
                    return length - stopLen
                }

                // Ordering: texts fade out -> line continues -> cubes hide
                const lineContinueStart = 'phase4+=1.5'
                const cubesHideStart = 'phase4+=1'

                tl.to(bezierPathEl, {
                    strokeDashoffset: () => computeStopDashoffsetAtPostTarget(),
                    duration: DURATIONS.line2Draw,
                    ease: 'power1.inOut',
                }, lineContinueStart)

                // Direction-aware cube hide/show so scrubbing back restores panel2
                tl.call(() => {
                    const dir = scrollDirRef.current ?? 1
                    if (dir === 1) ui.hideGrid?.()
                    else ui.showGrid?.()
                }, null, cubesHideStart)

                // Panel 3 image: behave exactly like panel 1 track item (mask reveal + parallax + text reveal)
                const postMaskEl = ui.postItemMaskRef?.current
                const postImgEl = ui.postItemImgRef?.current
                const postTextEl = ui.postItemTextRef?.current
                const postCtaEl = ui.postCtaRef?.current
                const postRevealStart = 'phase4+=0.2'

                if (postMaskEl && postImgEl) {
                    tl.to(postMaskEl, {
                        clipPath: 'inset(0% 0% 0% 0%)',
                        duration: DURATIONS.trackItemReveal,
                        ease: 'power2.out'
                    }, postRevealStart)

                    tl.to(postImgEl, {
                        xPercent: 15,
                        ease: 'none',
                        duration: DURATIONS.trackItemParallax
                    }, postRevealStart)
                }

                if (postTextEl) {
                    const split = createSplit(postTextEl, { type: 'chars, words' })
                    gsap.set(split.chars, { opacity: 0, x: -10 })

                    tl.to(split.chars, {
                        opacity: 1,
                        x: 0,
                        stagger: 0.01,
                        duration: DURATIONS.trackItemText,
                        ease: 'power2.out'
                    }, 'phase4+=1.6')
                }

                // CTA: reveal after the quote/text is revealed
                if (postCtaEl) {
                    gsap.set(postCtaEl, { opacity: 0, y: 20, pointerEvents: 'none' })
                    tl.to(postCtaEl, {
                        opacity: 1,
                        y: 0,
                        duration: 0.6,
                        ease: 'power2.out',
                        onStart: () => { postCtaEl.style.pointerEvents = 'auto' },
                        onReverseComplete: () => { postCtaEl.style.pointerEvents = 'none' },
                    }, 'phase4+=3.3')
                }

                if (trackItem) {
                    const { maskEl, imgEl, textEl } = trackItem

                    if (maskEl && imgEl) {
                        tl.to(maskEl, {
                            clipPath: 'inset(0% 0% 0% 0%)',
                            duration: DURATIONS.trackItemReveal,
                            ease: 'power2.out'
                        }, `${phase3Start}+=0.2`)

                        tl.to(imgEl, {
                            xPercent: 15,
                            ease: "none",
                            duration: DURATIONS.trackItemParallax
                        }, `${phase3Start}+=0.2`)
                    }

                    if (textEl) {
                        const split = createSplit(textEl, { type: 'chars, words' })
                        gsap.set(split.chars, { opacity: 0, x: -10 })

                        tl.to(split.chars, {
                            opacity: 1,
                            x: 0,
                            stagger: 0.01,
                            duration: DURATIONS.trackItemText,
                            ease: "power2.out"
                        }, `${phase3Start}+=0.7`)
                    }
                }

                if (cmfTextEl) {
                    const splitCmf = createSplit(cmfTextEl, { type: 'chars' })
                    gsap.set(splitCmf.chars, { opacity: 0, y: 50 })

                    tl.to(splitCmf.chars, {
                        opacity: 1,
                        y: 0,
                        stagger: 0.05,
                        duration: DURATIONS.cmfTextReveal,
                        ease: "power2.out"
                    }, "phase3+=1.5")
                }
            }

            // Build timelines
            buildEntryTimeline()

            // === OVERLAY TEXT SETUP ===
            const overlayText = ui.overlayTextRef.current
            let splitChars = []
            if (overlayText) {
                const split = createSplit(overlayText, { type: 'chars' })
                splitChars = split.chars

                // Initial state
                gsap.set(splitChars, { opacity: 0, y: 50 })
            }

            // === MAIN ANIMATION ===
            const tl = buildMainTimeline()
            // Ensure Pivots are aligned (One at 0 deg, one at 180 deg)
            gsap.set(leftPivot.rotation, { y: 0 })
            gsap.set(rightPivot.rotation, { y: Math.PI }) // Starts opposite

            // Initial Scale
            gsap.set([leftSphere.scale, rightSphere.scale], { x: 5, y: 5, z: 5 })

            // Reset intensity
            animState.current.intensity = 1

            // Phase 0: overlay reveal
            addOverlayReveal(tl, splitChars)

            // Phase 1: spiral-in
            addPhase1SpiralIn(tl, { leftPivot, rightPivot, leftSphere, rightSphere, splitChars })

            // Phase 2: shrink + center dot + final text
            addPhase2MergeAndDot(tl, {
                leftSphere,
                rightSphere,
                centerDotEl: ui.centerDotRef.current,
                finalTextEl: ui.finalTextRef.current,
            })

            // Phase 3: track slide + line draw + cube reveal trigger + track item + cmf text
            addPhase3TrackAndLine(tl, {
                trackEl: ui.trackRef.current,
                steeringWheelEl: ui.steeringWheelRef.current,
                bezierPathEl: ui.bezierPathRef.current,
                bezierSvgEl: ui.bezierSvgRef.current,
                trackItem: ui.trackItemRef.current ? {
                    maskEl: ui.trackItemMaskRef.current,
                    imgEl: ui.trackItemImgRef.current,
                    textEl: ui.trackItemTextRef.current,
                } : null,
                cmfTextEl: ui.cmfTextRef.current,
            })

            // Refresh triggers to update downstream pins
            ScrollTrigger.refresh()

            return () => {
                splits.forEach((s) => s?.revert?.())
            }
        }, containerRef)

        return () => ctx.revert()
    }, [containerRef])

    // Track phase for continuous wave even with changing frequency
    const phase = useRef(0)
    // Track previous mouse position to calculate speed
    const prevMouse = useRef({ x: 0, y: 0 })

    useFrame((state, delta) => {
        if (!sphereRef.current) return

        const { leftRings, rightRings } = sphereRef.current
        const intensity = animState.current.intensity

        // Optimization: skip if intensity is negligible
        if (intensity <= 0.001) return

        // Calculate Mouse Speed
        const mouseX = state.mouse.x
        const mouseY = state.mouse.y

        // Distance roughly equals speed per frame (normalized coordinates)
        const dx = mouseX - prevMouse.current.x
        const dy = mouseY - prevMouse.current.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        // Update prev mouse
        prevMouse.current.x = mouseX
        prevMouse.current.y = mouseY

        // Base speed + Speed influence
        // dist is usually small (e.g. 0.01 per frame), so multiply up
        const currentFreq = BASE_FREQUENCY + (dist * SPEED_SENSITIVITY)

        // Accumulate phase: phase += freq * delta
        phase.current += currentFreq * delta

        // Enforce lookAt(0,0,0)
        state.camera.lookAt(0, 0, 0)

        const currentPhase = phase.current

        // Apply staggered scale to left rings
        if (leftRings) {
            leftRings.forEach((ring, i) => {
                if (ring) {
                    const stagger = i * 0.2
                    const wave = Math.sin(currentPhase + stagger)
                    const amplitude = 0.5 * intensity
                    const scale = 1 + (wave * amplitude)

                    ring.scale.set(scale, 1, scale)
                    ring.rotation.set(0, 0, 0)
                }
            })
        }

        // Apply staggered scale to right rings
        if (rightRings) {
            rightRings.forEach((ring, i) => {
                if (ring) {
                    const stagger = i * 0.2
                    const wave = Math.sin(currentPhase + stagger)
                    const amplitude = 0.5 * intensity
                    const scale = 1 + (wave * amplitude)

                    ring.scale.set(scale, 1, scale)
                    ring.rotation.set(0, 0, 0)
                }
            })
        }
    })

    return (
        <>
            <ambientLight intensity={1} />
            <Sphere ref={sphereRef} />
            {/* <OrbitControls /> */}
        </>
    )
}

// === MAIN COMPONENT: Horizontal scroll scene container ===
export default function HorizontalScrollScene() {
    const containerRef = useRef(null)
    const gridRef = useRef(null)
    const overlayTextRef = useRef(null)
    const centerDotRef = useRef(null)
    const finalTextRef = useRef(null)
    const trackRef = useRef(null)
    const bezierSvgRef = useRef(null)
    const bezierPathRef = useRef(null)
    const steeringWheelRef = useRef(null)
    const trackItemRef = useRef(null)
    const trackItemMaskRef = useRef(null)
    const trackItemImgRef = useRef(null)
    const trackItemTextRef = useRef(null)
    const cmfTextRef = useRef(null)
    const cmfSubtextRef = useRef(null)
    const postLineTargetRef = useRef(null)
    const postItemMaskRef = useRef(null)
    const postItemImgRef = useRef(null)
    const postItemTextRef = useRef(null)
    const postCtaRef = useRef(null)

    const handleScrollToUseCases = () => {
        // Scroll to the END of the pinned UseCases sequence (when its text reveal is complete)
        const st = ScrollTrigger.getById?.('usecases-pin')
        if (st?.end != null) {
            window.scrollTo({ top: st.end - 2, behavior: 'smooth' })
            return
        }
        // Fallback: just go to the section start
        document.getElementById('car-usecases')?.scrollIntoView({ behavior: 'smooth' })
    }

    useLayoutEffect(() => {
        const el = containerRef.current
        if (!el) return

        const onReveal = (e) => {
            if (!gridRef.current) return
            if (e.detail?.state === 'play') gridRef.current.playReveal?.()
            if (e.detail?.state === 'reverse') gridRef.current.reverseReveal?.()
        }

        el.addEventListener('cubegrid:reveal', onReveal)
        return () => el.removeEventListener('cubegrid:reveal', onReveal)
    }, [])

    return (
        <>
            <div className="horizontal_scroll--title">
                <VariableText
                    className="title-text"
                    baseSettings={{ wght: 100, slnt: 0, CNTR: 100, letterSpacing: -5 }}
                    hoverSettings={{ wght: 900, slnt: 100, CNTR: 0, letterSpacing: 5 }}
                    radius={700}
                    fullEffectRadius={200}
                >
                    <h1>Inside DIGIPHY 2.0</h1>
                </VariableText>
            </div>

            {/* Container provides scroll distance (defined in CSS) */}
            <div ref={containerRef} className="horizontal_scroll--container">
                {/* Sticky wrapper is handled by ScrollTrigger check, but we keep the structure */}
                <div className="horizontal_scroll--sticky">
                    <Canvas
                        camera={{ position: [0, -10, 0], fov: 55 }}
                        style={{ width: '100%', height: '100%' }}
                    >
                        <Suspense fallback={null}>
                            <color attach="background" args={['#191411']} />
                            <Stats />
                            <SceneContent
                                containerRef={containerRef}
                                ui={{
                                    overlayTextRef,
                                    centerDotRef,
                                    finalTextRef,
                                    trackRef,
                                    bezierSvgRef,
                                    bezierPathRef,
                                    steeringWheelRef,
                                    trackItemRef,
                                    trackItemMaskRef,
                                    trackItemImgRef,
                                    trackItemTextRef,
                                    cmfTextRef,
                                    cmfSubtextRef,
                                    getCubeLeftEdgeClientX: () => gridRef.current?.getLeftEdgeClientX?.(),
                                    getCubeRightEdgeClientX: () => gridRef.current?.getRightEdgeClientX?.(),
                                    hideGrid: () => gridRef.current?.reverseReveal?.(),
                                    showGrid: () => gridRef.current?.playReveal?.(),
                                    postLineTargetRef,
                                    postItemMaskRef,
                                    postItemImgRef,
                                    postItemTextRef,
                                    postCtaRef,
                                }}
                            />
                        </Suspense>
                    </Canvas>
                    <div ref={overlayTextRef} className="horizontal_section_category horizontal_scroll--overlay-text">
                        1. Auto Alignment
                    </div>
                    {/* Phase 3 Content: Horizontal Track (200vw) */}
                    <div ref={trackRef} className="horizontal_track">
                        {/* Panel 1: Contains Dot and Text */}
                        <div className="track_panel">
                            <div ref={centerDotRef} className="horizontal_scroll--center-dot">
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="5" cy="5" r="2.5" fill="white" />
                                </svg>
                            </div>

                            <div ref={finalTextRef} className="horizontal_scroll--final-text">
                                using algorithms to combine the physical and virtual worlds instantly
                            </div>
                        </div>

                        {/* Panel 2: intentionally empty (interactive grid is an overlay, so it can receive pointer events) */}
                        <div className="track_panel" />

                        {/* Panel 3: Post-grid content */}
                        <div className="track_panel post_grid_panel">
                            <div ref={postItemMaskRef} className="track_item--reveal-mask post_grid_mask">
                                <img
                                    ref={postItemImgRef}
                                    className="track_item--img post_grid_img"
                                    src="/pictures/2.webp"
                                    alt="Tangible"
                                />
                            </div>
                            {/* Text is outside the image container (same pattern as Track Item 1) */}
                            <div ref={postItemTextRef} className="track_item--text post_grid_text" >
                                <div className="post_grid_quote">
                                    "On my way to Turin, I was concerned about the precision of the
                                    VR. The first thing I did was touch the roof. I could see and feel exactly where my hands were, that gave me the trust I needed to make confident design decisions."
                                </div>
                                <div className="post_grid_author">
                                    <span className="post_grid_author_name">Jean-Michel Gallay</span><span className="post_grid_author_company">Architecture and Engineering team at Renault</span>
                                </div>
                            </div>
                            {/* Line2 target marker for alignment */}
                            <div ref={postLineTargetRef} className="post_grid_line_target" />
                        </div>

                        {/* SVG Line: Positioned absolute relative to Track, starting at center of Panel 1 */}
                        <svg ref={bezierSvgRef} className="horizontal_scroll--bezier-line" width="100%" height="200" viewBox="0 0 1500 200" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                            <path
                                ref={bezierPathRef}
                                d="M 0,100 C 300,100 400,180 700,100 S 1200,100 1500,100"
                                stroke="var(--doctor)"
                                strokeWidth="2"
                                fill="none"
                            />
                        </svg>

                        {/* Line continues in Phase 4 using the SAME SVG line above (no separate line2) */}

                        {/* TRACK ITEM 1: Parallax Image */}
                        {/* Positioned in Panel 2 range but closer to start (75vw) */}
                        <div ref={trackItemRef} className="track_item" style={{ left: '75vw', top: '25vh' }}>
                            <div ref={trackItemMaskRef} className="track_item--reveal-mask">
                                <img
                                    ref={trackItemImgRef}
                                    className="track_item--img"
                                    src="/pictures/1.webp"
                                    alt="Process"
                                />
                            </div>
                            <div ref={trackItemTextRef} className="track_item--text">
                                for seamless integration of physical properties.
                            </div>
                        </div>
                    </div>

                    {/* Post-grid CTA overlay (kept outside .horizontal_track because it has pointer-events: none) */}
                    <div ref={postCtaRef} className="post_grid_cta_overlay">
                        <PrimaryButton
                            text="Explore use cases"
                            onClick={handleScrollToUseCases}
                        />
                    </div>

                    {/* SEPARATE STEERING WHEEL SCENE (Now Interactive Grid) */}
                    {/* NOTE: This must NOT live under `.horizontal_track` because that layer is `pointer-events: none`. */}
                    <div ref={steeringWheelRef} className="steering-wheel-container">
                        {/* Text centered in the grid gap */}
                        <div ref={cmfTextRef} className="horizontal_section_category cmf-text-pos">
                            2. The tangible truth
                        </div>
                        <div ref={cmfSubtextRef} className="cmf-subtext">
                            allowing designers to design through experiencing
                        </div>

                        <Canvas camera={{ position: [0, 25, 0], fov: 45 }} style={{ width: '100%', height: '100%' }}>
                            <Suspense fallback={null}>
                                <InteractiveCubeGrid ref={gridRef} />
                                <OrbitControls enableZoom={false} enablePan={false} />
                            </Suspense>
                        </Canvas>
                    </div>
                </div>
            </div>
        </>
    )
}
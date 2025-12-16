import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import VariableText from '../../Components/VariableText'
import './useCase.css'

gsap.registerPlugin(ScrollTrigger)

export default function UseCases({ setCameraProgress }) {
    const overlayRef = useRef(null)
    const titleWrapRef = useRef(null)
    const subtitleRef = useRef(null)

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            const overlayEl = overlayRef.current
            const titleEl = titleWrapRef.current
            const subtitleEl = subtitleRef.current
            if (!overlayEl || !titleEl || !subtitleEl) return

            const CAMERA_PIN_PX = 3000
            const USECASES_PRE_ROLL_MAX = 0.15

            const computeUseCasesPhasesPx = () => {
                const vh = window.innerHeight || 0
                const titleRevealPx = vh * 0.50 // 50vh
                const subtitleRevealPx = vh * 0.25 // 25vh
                const bufferPx = vh * 0.10 // 10vh
                return {
                    titleRevealPx,
                    subtitleRevealPx,
                    bufferPx,
                    totalPinnedPx: CAMERA_PIN_PX + titleRevealPx + subtitleRevealPx + bufferPx,
                }
            }

            // Reveal timeline (title then subtitle) — progress is driven by scroll.
            gsap.set(overlayEl, { opacity: 0 })
            gsap.set(titleEl, { opacity: 0, y: 160 })
            gsap.set(subtitleEl, { opacity: 0, y: 120 })

            let baseRevealP = 0
            let fadeOutP = 0

            const applyOverlay = () => {
                // Drive reveal directly from scroll progress (prevents opacity being overwritten).
                // revealP: 0..1 over the reveal phase
                const revealP = Math.max(0, Math.min(1, baseRevealP))

                // Faster fade curve for subtitle, slightly slower for title.
                const overlayFade = Math.pow(1 - fadeOutP, 1.6)
                const titleFade = Math.pow(1 - fadeOutP, 2.0)
                const subtitleFade = Math.pow(1 - fadeOutP, 4.0)

                // Two-stage reveal: title first half, subtitle second half
                const titleIn = Math.max(0, Math.min(1, revealP * 2))
                const subtitleIn = Math.max(0, Math.min(1, (revealP - 0.5) * 2))

                const visible = titleIn > 0.001 && overlayFade > 0.001
                gsap.set(overlayEl, { opacity: visible ? 1 : 0 })

                // Fade in + slide up, then apply fadeOut multipliers
                gsap.set(titleEl, {
                    opacity: titleIn * titleFade,
                    y: (1 - titleIn) * 160,
                })
                gsap.set(subtitleEl, {
                    opacity: subtitleIn * subtitleFade,
                    y: (1 - subtitleIn) * 120,
                })
            }

            // Pre-roll: start camera motion immediately when UseCases starts entering the viewport.
            const preRollTrigger = ScrollTrigger.create({
                trigger: '#car-usecases',
                start: 'top bottom',
                end: 'top top',
                scrub: true,
                onUpdate: (self) => {
                    if (typeof setCameraProgress === 'function') {
                        setCameraProgress(self.progress * USECASES_PRE_ROLL_MAX)
                    }
                },
            })

            const pinTrigger = ScrollTrigger.create({
                trigger: '#car-usecases',
                start: () => 'top top',
                end: () => {
                    const { totalPinnedPx } = computeUseCasesPhasesPx()
                    return `+=${totalPinnedPx}`
                },
                id: 'usecases-pin',
                pin: true,
                pinSpacing: true,
                scrub: true,
                refreshPriority: 0,
                anticipatePin: 1,
                invalidateOnRefresh: true,
                onRefresh: () => applyOverlay(),
                onUpdate: (self) => {
                    const { titleRevealPx, subtitleRevealPx, totalPinnedPx } = computeUseCasesPhasesPx()
                    const scrollPx = self.progress * totalPinnedPx

                    // Phase A: camera 0->1 (continues from pre-roll)
                    const cameraTravelP = Math.max(0, Math.min(1, scrollPx / CAMERA_PIN_PX))
                    const cam = USECASES_PRE_ROLL_MAX + (1 - USECASES_PRE_ROLL_MAX) * cameraTravelP
                    if (typeof setCameraProgress === 'function') setCameraProgress(cam)

                    // Phase B+C: reveal after the camera finishes
                    const revealStart = CAMERA_PIN_PX
                    const revealTotal = Math.max(0, titleRevealPx + subtitleRevealPx)
                    const revealPx = Math.max(0, Math.min(revealTotal, scrollPx - revealStart))
                    baseRevealP = revealTotal > 0 ? (revealPx / revealTotal) : 0
                    applyOverlay()
                },
            })

            // Fade OUT the UseCases overlay the same way it appeared when TechFeatures enters.
            const fadeTrigger = ScrollTrigger.create({
                trigger: '#tech-features',
                start: 'top bottom',
                end: 'top top',
                scrub: true,
                onUpdate: (self) => {
                    fadeOutP = self.progress
                    applyOverlay()
                },
            })

            return () => {
                preRollTrigger?.kill?.()
                pinTrigger?.kill?.()
                fadeTrigger?.kill?.()
            }
        })

        return () => ctx.revert()
    }, [setCameraProgress])

    return (
        <div ref={overlayRef} className="usecases_overlay" aria-hidden="true">
            <div ref={titleWrapRef} className="usecases_overlay_titleWrap">
                <VariableText
                    className="usecases_overlay_title"
                    baseSettings={{ wght: 300, slnt: 100, CNTR: 100, letterSpacing: -5 }}
                    hoverSettings={{ wght: 700, slnt: 0, CNTR: 0, letterSpacing: 5 }}
                    radius={400}
                >
                    <h2>Use Cases</h2>
                </VariableText>
            </div>
            <div ref={subtitleRef} className="usecases_overlay_subtitle">
                Click on a poster to read more
            </div>
        </div>
    )
}



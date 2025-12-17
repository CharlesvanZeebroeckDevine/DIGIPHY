import './CarSceneUI.css'
import SecondaryButton from '../../Components/UI/SecondaryButton'
import VariableText from '../../Components/VariableText'
import Nav from '../../Components/Nav'
import { useRef, useLayoutEffect, useEffect } from 'react'
import gsap from 'gsap'

export default function CarSceneOverlay({ activeModelIndex, onModelSwitch, visible = true }) {
    const titleRef = useRef(null)
    const titleTlRef = useRef(null)
    const scrollRafRef = useRef(0)

    useLayoutEffect(() => {
        if (!titleRef.current) return

        const el = titleRef.current

        const ctx = gsap.context(() => {
            // Start visible
            gsap.set(el, { y: 0, opacity: 1 })

            // Fake the "scroll/zoom" transition: simple pan-up + fade-out
            titleTlRef.current = gsap.timeline({ paused: true })
                .to(el, {
                    y: -200,
                    opacity: 0,
                    duration: 0.8,
                    ease: 'power2.out',
                    overwrite: true,
                })
        }, el)

        return () => {
            if (scrollRafRef.current) {
                cancelAnimationFrame(scrollRafRef.current)
                scrollRafRef.current = 0
            }
            titleTlRef.current?.kill?.()
            titleTlRef.current = null
            ctx.revert()
        }
    }, [])

    useEffect(() => {
        const onScroll = () => {
            if (scrollRafRef.current) return
            scrollRafRef.current = requestAnimationFrame(() => {
                scrollRafRef.current = 0

                const tl = titleTlRef.current
                if (!tl) return

                // Small threshold so a tiny scroll nudge still triggers the transition
                const hasStartedScrolling = window.scrollY > 5
                if (hasStartedScrolling) tl.play()
                else tl.reverse()
            })
        }

        window.addEventListener('scroll', onScroll, { passive: true })
        onScroll()

        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    return (

        <div
            className={`car_scene_overlay ${visible ? 'is-visible' : 'is-hidden'}`}
            aria-hidden={!visible}
            style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.5s ease' }}
        >
            <div
                ref={titleRef}
                className="overlay_title_container"
                style={{
                    pointerEvents: 'none',
                    textAlign: 'center',
                    marginTop: '40px'
                }}
            >
                <VariableText
                    className="overlay_title_text"
                    baseSettings={{ wght: 300, slnt: 100, CNTR: 100, letterSpacing: -5 }}
                    hoverSettings={{ wght: 700, slnt: 0, CNTR: 0, letterSpacing: 5 }}
                    radius={700}
                >
                    <h1>The ULTIMATE <span className="purple">XR</span> <br /> SEATING BUCK</h1>
                </VariableText>
            </div>
            <div className="overlay_controls" style={{ pointerEvents: visible ? 'auto' : 'none' }}>
                <div className="controls">
                    <SecondaryButton
                        text="SUV"
                        active={activeModelIndex === 0}
                        onClick={() => onModelSwitch(0)}
                    />
                    <SecondaryButton
                        text="SPORT"
                        active={activeModelIndex === 1}
                        onClick={() => onModelSwitch(1)}
                    />
                    <SecondaryButton
                        text="VAN"
                        active={activeModelIndex === 2}
                        onClick={() => onModelSwitch(2)}
                    />
                </div>
                <div className="scroll-cta">
                    <div className="scroll-indicator">
                        <div className="scroll-arrow"></div>
                    </div>
                </div>
            </div>
        </div>
    )
}

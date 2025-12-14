import './CarSceneUI.css'
import SecondaryButton from '../../Components/UI/SecondaryButton'
import VariableText from '../../Components/VariableText'
import Nav from '../../Components/Nav'
import { useRef, useLayoutEffect } from 'react'
import gsap from 'gsap'

export default function CarSceneOverlay({ activeModelIndex, onModelSwitch, visible = true, zoomLevel = 0 }) {
    const titleRef = useRef(null)

    useLayoutEffect(() => {
        if (titleRef.current) {
            gsap.set(titleRef.current, {
                y: -zoomLevel * 200,
                opacity: Math.max(0, 1 - zoomLevel * 2)
            })
        }
    }, [zoomLevel])

    return (
        <div className="car_scene_overlay" style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.5s ease' }}>
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
                    The ULTIMATE <span className="purple">XR</span> <br /> SEATING BUCK
                </VariableText>
            </div>

            <div className="overlay_controls">
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
        </div>
    )
}

import './CarSceneUI.css'
import StaggerButton from '../../Components/UI/StaggerButton'
import VariableText from '../../Components/VariableText'
import { useRef, useLayoutEffect } from 'react'
import gsap from 'gsap'

export default function CarSceneOverlay({ activeModelIndex, onModelSwitch, visible = true, zoomLevel = 0 }) {
    const titleRef = useRef(null)

    useLayoutEffect(() => {
        if (titleRef.current) {
            // Simple, smooth exit through the top
            // opacity: fades out by the time zoomLevel hits 0.5
            // y: moves up 200px
            gsap.set(titleRef.current, {
                y: -zoomLevel * 200,
                opacity: Math.max(0, 1 - zoomLevel * 2)
            })
        }
    }, [zoomLevel])

    return (
        <div className="car_scene_overlay" style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.5s ease' }}>
            <div className="overlay_logo">DIGIPHY 2.0</div>

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
                <StaggerButton
                    text="SUV"
                    active={activeModelIndex === 0}
                    onClick={() => onModelSwitch(0)}
                />
                <StaggerButton
                    text="SPORT"
                    active={activeModelIndex === 1}
                    onClick={() => onModelSwitch(1)}
                />
                <StaggerButton
                    text="VAN"
                    active={activeModelIndex === 2}
                    onClick={() => onModelSwitch(2)}
                />
            </div>
        </div >
    )
}

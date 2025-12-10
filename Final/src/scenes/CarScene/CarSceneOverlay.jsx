import './CarSceneUI.css'
import StaggerButton from '../../Components/UI/StaggerButton'
import VariableText from '../../Components/VariableText'

export default function CarSceneOverlay({ activeModelIndex, onModelSwitch, visible = true }) {
    return (
        <div className="car_scene_overlay" style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.5s ease' }}>
            <div className="overlay_logo">DIGIPHY 2.0</div>
            <VariableText
                className="overlay_title"
                baseSettings={{ wght: 300, slnt: 100, CNTR: 100, letterSpacing: -5 }}
                hoverSettings={{ wght: 700, slnt: 0, CNTR: 0, letterSpacing: 5 }}
                radius={700}
            >
                The ULTIMATE <span className="purple">XR</span> <br /> SEATING BUCK
            </VariableText>

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

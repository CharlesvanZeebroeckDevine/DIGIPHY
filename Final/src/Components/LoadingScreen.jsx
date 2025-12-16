import './LoadingScreen.css'
import VariableTextAnimation from '../Components/VariableTextAnimation'
import { useProgress } from '@react-three/drei'
import { useState } from 'react'
import PrimaryButton from './UI/PrimaryButton'

export default function LoadingScreen({ onEnter }) {
    const { progress, active } = useProgress()
    const [finished, setFinished] = useState(false)
    const canEnter = progress === 100

    const handleEnter = () => {
        window.scrollTo(0, 0)
        setFinished(true)
        if (onEnter) onEnter()
    }

    return (
        <div className={`loading_screen ${finished ? 'loading_screen--hidden' : ''}`}>
            <div className="loading_screen--bg">
                <div className="loading_screen--bg-column"></div>
                <div className="loading_screen--bg-column"></div>
                <div className="loading_screen--bg-column"></div>
                <div className="loading_screen--bg-column"></div>
                <div className="loading_screen--bg-column"></div>
                <div className="loading_screen--bg-column"></div>
                <div className="loading_screen--bg-column"></div>
                <div className="loading_screen--bg-column"></div>
                <div className="loading_screen--bg-column"></div>
                <div className="loading_screen--bg-column"></div>
            </div>
            <div className="loading_screen--content">
                <div className="loading_screen--title--container">
                    <VariableTextAnimation><h1>DIGIPHY 2.0</h1></VariableTextAnimation>
                </div>
                <div className="loading_screen--container">
                    <div className="loading_screen--text_container">
                        <div className="loading_screen--percentage">{Math.round(progress)}%</div>
                    </div>
                </div>
                <div className={`loading_screen--button ${canEnter ? 'visible' : ''}`}>
                    <PrimaryButton
                        text="Enter"
                        onClick={handleEnter}
                    />
                </div>
            </div>
        </div>
    )
}


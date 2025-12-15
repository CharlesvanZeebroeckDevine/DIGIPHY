import './loadingScreen.css'
import VariableTextAnimation from '../Components/VariableTextAnimation'
import { useProgress } from '@react-three/drei'
import { useEffect, useState } from 'react'

export default function LoadingScreen() {
    const { progress, active } = useProgress()
    const [finished, setFinished] = useState(false)
    
    useEffect(() => {
        if (progress === 100) {
            const timer = setTimeout(() => {
                setFinished(true)
            }, 500)
            return () => clearTimeout(timer)
        } else {
            setFinished(false)
        }
    }, [progress])

    return (
        <div className={`loading_screen ${finished ? 'loading_screen--hidden' : ''}`}>
            <div className="loading_screen--title--container">
                <VariableTextAnimation><h1>Digiphy 2.0</h1></VariableTextAnimation>
            </div>
            <div className="loading_screen--container">
                <div className="loading_screen--ring loading_screen--ring_1"></div>
                <div className="loading_screen--ring loading_screen--ring_2"></div>
                <div className="loading_screen--ring loading_screen--ring_3"></div>

                <div className="loading_screen--text_container">
                    <div className="loading_screen--percentage">{Math.round(progress)}%</div>
                </div>
            </div>
        </div>
    )
}


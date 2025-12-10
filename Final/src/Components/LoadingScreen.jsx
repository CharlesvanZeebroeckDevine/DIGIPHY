import { useProgress } from '@react-three/drei'
import { useEffect, useState } from 'react'

export default function LoadingScreen() {
    const { progress, active } = useProgress()
    const [finished, setFinished] = useState(false)

    // Delay fading out to ensure everything is settled or to show 100% for a moment
    useEffect(() => {
        if (progress === 100) {
            // Small delay to prevent flickering if it loads instantly or to smooth the exit
            const timer = setTimeout(() => {
                setFinished(true)
            }, 500)
            return () => clearTimeout(timer)
        } else {
            setFinished(false)
        }
    }, [progress])

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                backgroundColor: '#000000',
                color: '#ffffff',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 9999,
                transition: 'opacity 1s ease-in-out',
                opacity: finished ? 0 : 1,
                pointerEvents: finished ? 'none' : 'auto',
            }}
        >
            <div
                style={{
                    textAlign: 'center',
                    fontFamily: 'monospace',
                    textTransform: 'uppercase',
                    letterSpacing: '2px'
                }}
            >
                <div style={{ fontSize: '24px', marginBottom: '10px' }}>Loading</div>
                <div style={{ fontSize: '14px', opacity: 0.5 }}>{Math.round(progress)}%</div>
            </div>
        </div>
    )
}

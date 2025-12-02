import { useRef, forwardRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useState, useEffect } from 'react'
import { Line } from '@react-three/drei'

const DotWithTrail = forwardRef((props, ref) => {
    const { position = [0, 0, 0], color = '#00ff88', scale = 1 } = props
    const dotMaterialRef = useRef(null)
    const lastPositionRef = useRef(new THREE.Vector3(...position))
    const [trailPoints, setTrailPoints] = useState([new THREE.Vector3(...position)])
    const maxPoints = 50

    useFrame(() => {
        if (ref?.current) {
            const currentPos = ref.current.position.clone()
            
            // Only update trail if position has changed significantly
            const distance = currentPos.distanceTo(lastPositionRef.current)
            if (distance > 0.05) {
                setTrailPoints(prevPoints => {
                    const newPoints = [currentPos.clone(), ...prevPoints]
                    // Keep only the last maxPoints
                    if (newPoints.length > maxPoints) {
                        newPoints.pop()
                    }
                    return newPoints
                })
                lastPositionRef.current.copy(currentPos)
            }
        }
    })

    return (
        <group ref={ref} position={position} scale={scale}>
            {/* 2D Dot - Circle geometry that always faces camera */}
            <mesh position={[0, 0, 0.1]}>
                <circleGeometry args={[0.3, 32]} />
                <meshBasicMaterial 
                    ref={dotMaterialRef}
                    color={color} 
                    side={THREE.DoubleSide}
                    transparent
                    opacity={1}
                    depthTest={false}
                />
            </mesh>
            
            {/* Trail line using drei's Line component */}
            {trailPoints.length > 1 && (
                <Line
                    points={trailPoints}
                    color={color}
                    lineWidth={3}
                    opacity={0.8}
                    transparent
                />
            )}
        </group>
    )
})

DotWithTrail.displayName = 'DotWithTrail'

export default DotWithTrail

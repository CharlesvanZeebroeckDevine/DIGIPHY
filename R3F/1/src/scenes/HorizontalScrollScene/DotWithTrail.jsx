import { useRef, forwardRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useState, useEffect } from 'react'

const DotWithTrail = forwardRef((props, ref) => {
    const { position = [0, 0, 0], color = '#ffffff', scale = 1 } = props
    const trailRef = useRef(null)
    const dotMaterialRef = useRef(null)
    const lastPositionRef = useRef(new THREE.Vector3(...position))
    const [trailPoints] = useState(() => {
        const points = []
        const maxPoints = 30
        for (let i = 0; i < maxPoints; i++) {
            points.push(new THREE.Vector3(...position))
        }
        return points
    })

    useFrame(() => {
        if (ref?.current) {
            const currentPos = ref.current.position.clone()
            
            // Only update trail if position has changed
            if (!currentPos.equals(lastPositionRef.current)) {
                // Shift all points back
                for (let i = trailPoints.length - 1; i > 0; i--) {
                    trailPoints[i].copy(trailPoints[i - 1])
                }
                
                // Add new point at current position
                trailPoints[0].copy(currentPos)
                lastPositionRef.current.copy(currentPos)
                
                // Update the line geometry
                if (trailRef.current) {
                    const positions = new Float32Array(trailPoints.length * 3)
                    trailPoints.forEach((point, i) => {
                        positions[i * 3] = point.x
                        positions[i * 3 + 1] = point.y
                        positions[i * 3 + 2] = point.z
                    })
                    trailRef.current.setAttribute('position', new THREE.BufferAttribute(positions, 3))
                    trailRef.current.attributes.position.needsUpdate = true
                }
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
            
            {/* Trail line */}
            <line>
                <bufferGeometry ref={trailRef} />
                <lineBasicMaterial 
                    color={color} 
                    opacity={0.6}
                    transparent
                    linewidth={2}
                />
            </line>
        </group>
    )
})

DotWithTrail.displayName = 'DotWithTrail'

export default DotWithTrail

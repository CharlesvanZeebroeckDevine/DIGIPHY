import { useTexture, shaderMaterial } from '@react-three/drei'
import { extend, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useState, useRef } from 'react'

const PosterGlowMaterial = shaderMaterial(
    {
        color: new THREE.Color(1.1, 1, 1.1),
        uOpacity: 0.0
    },
    // vertex shader
    /*glsl*/`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
    // fragment shader
    /*glsl*/`
    uniform vec3 color;
    uniform float uOpacity;
    varying vec2 vUv;
    void main() {
      // Calculate distance to edges
      float edgeX = min(vUv.x, 1.0 - vUv.x);
      float edgeY = min(vUv.y, 1.0 - vUv.y);
      
      // Smooth fade out at edges
      // 0.0 to 0.1 defines the fade distance
      float fade = smoothstep(0.0, 0.15, edgeX) * smoothstep(0.0, 0.15, edgeY);
      
      gl_FragColor = vec4(color, fade * uOpacity);
    }
  `
)

extend({ PosterGlowMaterial })

export default function Poster({ url, position, rotation = [0, Math.PI, 0], scale = 2, name, isInteractable = false }) {
    const texture = useTexture(url)
    texture.colorSpace = THREE.SRGBColorSpace
    const [hovered, setHovered] = useState(false)
    const glowMaterialRef = useRef()

    useFrame((state, delta) => {
        if (glowMaterialRef.current) {
            const targetOpacity = (hovered && isInteractable) ? 1 : 0
            // Lerp opacity for smooth transition
            glowMaterialRef.current.uOpacity = THREE.MathUtils.lerp(
                glowMaterialRef.current.uOpacity,
                targetOpacity,
                delta * 10
            )
        }
    })

    return (
        <group position={position} rotation={rotation} scale={scale}>
            {/* Main Poster Mesh */}
            <mesh
                onClick={(e) => {
                    e.stopPropagation() // Prevent event bubbling to background
                    if (isInteractable) {
                        console.log(`${name} clicked`)
                    }
                }}
                onPointerOver={() => {
                    if (isInteractable) {
                        document.body.style.cursor = 'pointer'
                        setHovered(true)
                    }
                }}
                onPointerOut={() => {
                    document.body.style.cursor = 'auto'
                    setHovered(false)
                }}
            >
                <planeGeometry args={[1.44, 1.92]} />
                <meshStandardMaterial
                    map={texture}
                    transparent
                    roughness={0.1}
                    side={THREE.DoubleSide}
                    toneMapped={false}
                />
            </mesh>

            {/* Glow Border (Backing Mesh) */}
            <mesh position={[0.03, 0.03, -0.01]} scale={[1.2, 1.2, 1]}>
                <planeGeometry args={[1.44, 1.92]} />
                {/* @ts-ignore */}
                <posterGlowMaterial
                    ref={glowMaterialRef}
                    color={[1.1, 1, 1.2]}
                    transparent
                    toneMapped={false}
                />
            </mesh>
        </group>
    )
}

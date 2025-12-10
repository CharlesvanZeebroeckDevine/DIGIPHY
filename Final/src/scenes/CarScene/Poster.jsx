import { useTexture } from '@react-three/drei'
import * as THREE from 'three'

export default function Poster({ url, position, rotation = [0, Math.PI, 0], scale = 2 }) {
    const texture = useTexture(url)
    texture.colorSpace = THREE.SRGBColorSpace

    return (
        <mesh position={position} rotation={rotation} scale={scale}>
            <planeGeometry args={[1.44, 1.92]} />
            <meshStandardMaterial
                map={texture}
                transparent
                roughness={0.1}
                side={THREE.DoubleSide}
                toneMapped={false}
            />
        </mesh>
    )
}

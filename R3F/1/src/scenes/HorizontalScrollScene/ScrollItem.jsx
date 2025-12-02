import { forwardRef } from 'react'
import { useGLTF } from '@react-three/drei'

const WireframeSphere = forwardRef(({ position, opacity = 1 }, ref) => {
    const { scene } = useGLTF('/side-scroll/sphere-2.glb')

    return (
        <group ref={ref} position={position}>
            <primitive 
                object={scene.clone()} 
                scale={8}
            />
        </group>
    )
})

WireframeSphere.displayName = 'WireframeSphere'

useGLTF.preload('/side-scroll/sphere-2.glb')

export default WireframeSphere

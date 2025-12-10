import { forwardRef, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'

const WireframeSphere = forwardRef(({ position, opacity = 1 }, ref) => {
    const { scene } = useGLTF('/side-scroll/sphere-2.glb')

    const clone = useMemo(() => scene.clone(), [scene])

    return (
        <group ref={ref} position={position}>
            <primitive
                object={clone}
                scale={8}
            />
        </group>
    )
})

WireframeSphere.displayName = 'WireframeSphere'

useGLTF.preload('/side-scroll/sphere-2.glb')

export default WireframeSphere
